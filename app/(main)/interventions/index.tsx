import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../context/AuthContext';

// Types pour les réclamations
enum Etat {
  PAS_ENCOURS = 'PAS_ENCOURS',
  ENCOURS = 'ENCOURS',
  PROBLEM = 'PROBLEM',
  TERMINER = 'TERMINER'
}

enum Importance {
  FAIBLE = 'FAIBLE',
  MOYENNE = 'MOYENNE',
  IMPORTANTE = 'IMPORTANTE',
  CRITIQUE = 'CRITIQUE'
}

enum TypePanne {
  TYPE1 = 'TYPE1',
  TYPE2 = 'TYPE2',
  TYPE3 = 'TYPE3',
  TYPE4 = 'TYPE4',
  TYPE5 = 'TYPE5'
}

enum GenrePanne {
  ELECTRICITE = 'ELECTRICITE',
  GAZ = 'GAZ'
}

enum Rue {
  GREMDA = 'GREMDA',
  LAFRANE = 'LAFRANE',
  ELAIN = 'ELAIN',
  MANZEL_CHAKER = 'MANZEL_CHAKER',
  MATAR = 'MATAR',
  SOKRA_MHARZA = 'SOKRA_MHARZA',
  GABES = 'GABES'
}

interface Reclamation {
  id: number;
  reference: number;
  typePanne: TypePanne;
  numClient: number;
  genrePanne: GenrePanne;
  heureReclamation: string;
  etat: Etat;
  importance: Importance;
  rue: Rue;
}

// Filtre par date
type DateFilter = 'today' | 'yesterday' | 'before_yesterday';

export default function InterventionsPage() {
  const { user } = useAuth();
  const [reclamations, setReclamations] = useState<Reclamation[]>([]);
  const [filteredReclamations, setFilteredReclamations] = useState<Reclamation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('today');
  const [selectedReclamation, setSelectedReclamation] = useState<Reclamation | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState<boolean>(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState<boolean>(false);
  const [newEtat, setNewEtat] = useState<Etat | null>(null);
  const [statusFilter, setStatusFilter] = useState<Etat | 'tous'>('tous');
  const [importanceFilter, setImportanceFilter] = useState<Importance | 'tous'>('tous');
  
  // Récupérer l'ID de l'équipe du technicien connecté
  const equipeId = useMemo(() => {
    return user?.equipe || '';
  }, [user]);

  // Récupérer les réclamations de l'équipe
  const fetchReclamations = useCallback(async () => {
    if (!equipeId) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      setLoading(true);
      console.log(`Récupération des réclamations pour l'équipe: ${equipeId}`);
      
      const response = await fetch(`http://localhost:8080/reclamations/${equipeId}/equipe`);
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Réclamations récupérées:', data);
      
      setReclamations(data);
      applyFilters(data);
    } catch (error) {
      console.error("Erreur lors du chargement des réclamations:", error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de charger les réclamations',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [equipeId]);

  // Charger les réclamations au démarrage
  useEffect(() => {
    fetchReclamations();
  }, [fetchReclamations]);

  // Filtrer les réclamations selon les critères
  const applyFilters = useCallback((data: Reclamation[] = reclamations) => {
    let filtered = [...data];
    
    // Filtre par date
    filtered = filtered.filter(item => {
      const reclamationDate = new Date(item.heureReclamation);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const beforeYesterday = new Date(today);
      beforeYesterday.setDate(beforeYesterday.getDate() - 2);
      
      switch (dateFilter) {
        case 'today':
          return reclamationDate >= today;
        case 'yesterday':
          return reclamationDate >= yesterday && reclamationDate < today;
        case 'before_yesterday':
          return reclamationDate >= beforeYesterday && reclamationDate < yesterday;
        default:
          return true;
      }
    });
    
    // Filtre par statut
    if (statusFilter !== 'tous') {
      filtered = filtered.filter(item => item.etat === statusFilter);
    }
    
    // Filtre par importance
    if (importanceFilter !== 'tous') {
      filtered = filtered.filter(item => item.importance === importanceFilter);
    }
    
    // Filtre par recherche
    if (searchQuery) {
      filtered = filtered.filter(item => 
        item.reference.toString().includes(searchQuery) ||
        item.numClient.toString().includes(searchQuery) ||
        item.rue.toString().toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredReclamations(filtered);
  }, [reclamations, dateFilter, statusFilter, importanceFilter, searchQuery]);

  // Appliquer les filtres quand ils changent
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // Rafraîchir la liste
  const onRefresh = () => {
    setRefreshing(true);
    fetchReclamations();
  };

  // Ouvrir le modal de détails
  const openDetailModal = (reclamation: Reclamation) => {
    setSelectedReclamation(reclamation);
    setDetailModalVisible(true);
  };

  // Changer l'état d'une réclamation
  const changeEtat = async (reclamationId: number, nouveauEtat: Etat) => {
    try {
      console.log(`Changement d'état pour la réclamation ${reclamationId} vers ${nouveauEtat}`);
      
      const response = await fetch(`http://localhost:8080/reclamations/${reclamationId}/${nouveauEtat}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      // Mettre à jour l'état local
      setReclamations(prevReclamations => 
        prevReclamations.map(item => 
          item.id === reclamationId ? { ...item, etat: nouveauEtat } : item
        )
      );
      
      if (selectedReclamation && selectedReclamation.id === reclamationId) {
        setSelectedReclamation({ ...selectedReclamation, etat: nouveauEtat });
      }
      
      Toast.show({
        type: 'success',
        text1: 'Succès',
        text2: 'État de la réclamation modifié avec succès',
      });
      
      // Rafraîchir la liste
      fetchReclamations();
    } catch (error) {
      console.error("Erreur lors du changement d'état:", error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: "Impossible de modifier l'état de la réclamation",
      });
    }
  };

  // Confirmer le changement d'état
  const confirmChangeEtat = (reclamationId: number, etat: Etat) => {
    // Vérifier si le changement est autorisé
    if (selectedReclamation) {
      const currentEtat = selectedReclamation.etat;
      
      if ((etat === Etat.PROBLEM || etat === Etat.TERMINER) && currentEtat !== Etat.ENCOURS) {
        Toast.show({
          type: 'error',
          text1: 'Action non autorisée',
          text2: "La réclamation doit d'abord être en cours de traitement",
        });
        return;
      }
      
      setNewEtat(etat);
      setConfirmModalVisible(true);
    }
  };

  // Fonction de navigation en arrière
  const handleGoBack = () => {
    router.replace('/(main)/homeTechnicien');
  };

  // Formater la date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Obtenir la couleur pour l'importance
  const getImportanceColor = (importance: Importance) => {
    switch (importance) {
      case Importance.FAIBLE:
        return '#22c55e'; // vert
      case Importance.MOYENNE:
        return '#f59e0b'; // orange
      case Importance.IMPORTANTE:
        return '#f97316'; // orange foncé
      case Importance.CRITIQUE:
        return '#ef4444'; // rouge
      default:
        return '#94a3b8'; // gris
    }
  };

  // Obtenir la couleur pour l'état
  const getEtatColor = (etat: Etat) => {
    switch (etat) {
      case Etat.PAS_ENCOURS:
        return '#94a3b8'; // gris
      case Etat.ENCOURS:
        return '#3b82f6'; // bleu
      case Etat.PROBLEM:
        return '#f97316'; // orange
      case Etat.TERMINER:
        return '#22c55e'; // vert
      default:
        return '#94a3b8'; // gris
    }
  };

  // Obtenir le libellé pour l'état
  const getEtatLabel = (etat: Etat) => {
    switch (etat) {
      case Etat.PAS_ENCOURS:
        return 'Pas en cours';
      case Etat.ENCOURS:
        return 'En cours';
      case Etat.PROBLEM:
        return 'Problème';
      case Etat.TERMINER:
        return 'Terminé';
      default:
        return etat;
    }
  };

  // Rendu d'un élément de la liste
  const renderItem = ({ item }: { item: Reclamation }) => {
    return (
      <TouchableOpacity
        style={styles.itemContainer}
        onPress={() => openDetailModal(item)}
      >
        <View style={styles.itemHeader}>
          <View style={styles.referenceContainer}>
            <Text style={styles.referenceLabel}>Référence</Text>
            <Text style={styles.referenceValue}>{item.reference}</Text>
          </View>
          
          <View style={[
            styles.importanceBadge,
            { backgroundColor: `${getImportanceColor(item.importance)}20` }
          ]}>
            <View style={[
              styles.importanceDot,
              { backgroundColor: getImportanceColor(item.importance) }
            ]} />
            <Text style={[
              styles.importanceText,
              { color: getImportanceColor(item.importance) }
            ]}>
              {item.importance}
            </Text>
          </View>
        </View>
        
        <View style={styles.itemContent}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Type:</Text>
            <Text style={styles.infoValue}>{item.typePanne}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Client:</Text>
            <Text style={styles.infoValue}>{item.numClient}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Genre:</Text>
            <Text style={styles.infoValue}>{item.genrePanne}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Rue:</Text>
            <Text style={styles.infoValue}>{item.rue.replace('_', ' ')}</Text>
          </View>
        </View>
        
        <View style={styles.itemFooter}>
          <View style={[
            styles.etatBadge,
            { backgroundColor: `${getEtatColor(item.etat)}20` }
          ]}>
            <View style={[
              styles.etatDot,
              { backgroundColor: getEtatColor(item.etat) }
            ]} />
            <Text style={[
              styles.etatText,
              { color: getEtatColor(item.etat) }
            ]}>
              {getEtatLabel(item.etat)}
            </Text>
          </View>
          
          <Text style={styles.dateText}>
            {formatDate(item.heureReclamation)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e40af" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleGoBack}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Mes Interventions</Text>
            <Text style={styles.headerSubtitle}>
              Gestion des réclamations
            </Text>
          </View>
        </View>
        
        {/* Filtres de date */}
        <View style={styles.dateFilters}>
          <TouchableOpacity
            style={[
              styles.dateFilterButton,
              dateFilter === 'today' && styles.dateFilterButtonActive
            ]}
            onPress={() => setDateFilter('today')}
          >
            <Text style={[
              styles.dateFilterText,
              dateFilter === 'today' && styles.dateFilterTextActive
            ]}>
              Aujourd'hui
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.dateFilterButton,
              dateFilter === 'yesterday' && styles.dateFilterButtonActive
            ]}
            onPress={() => setDateFilter('yesterday')}
          >
            <Text style={[
              styles.dateFilterText,
              dateFilter === 'yesterday' && styles.dateFilterTextActive
            ]}>
              Hier
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.dateFilterButton,
              dateFilter === 'before_yesterday' && styles.dateFilterButtonActive
            ]}
            onPress={() => setDateFilter('before_yesterday')}
          >
            <Text style={[
              styles.dateFilterText,
              dateFilter === 'before_yesterday' && styles.dateFilterTextActive
            ]}>
              Avant-hier
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Recherche et filtres */}
      <View style={styles.filterContainer}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#64748b" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher une réclamation..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        {/* Filtres d'état */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScrollView}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              statusFilter === 'tous' && styles.filterButtonActive
            ]}
            onPress={() => setStatusFilter('tous')}
          >
            <Text style={[
              styles.filterButtonText,
              statusFilter === 'tous' && styles.filterButtonTextActive
            ]}>
              Tous
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterButton,
              statusFilter === Etat.PAS_ENCOURS && styles.filterButtonActive
            ]}
            onPress={() => setStatusFilter(Etat.PAS_ENCOURS)}
          >
            <View style={[styles.statusDot, { backgroundColor: getEtatColor(Etat.PAS_ENCOURS) }]} />
            <Text style={[
              styles.filterButtonText,
              statusFilter === Etat.PAS_ENCOURS && styles.filterButtonTextActive
            ]}>
              Pas en cours
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterButton,
              statusFilter === Etat.ENCOURS && styles.filterButtonActive
            ]}
            onPress={() => setStatusFilter(Etat.ENCOURS)}
          >
            <View style={[styles.statusDot, { backgroundColor: getEtatColor(Etat.ENCOURS) }]} />
            <Text style={[
              styles.filterButtonText,
              statusFilter === Etat.ENCOURS && styles.filterButtonTextActive
            ]}>
              En cours
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterButton,
              statusFilter === Etat.PROBLEM && styles.filterButtonActive
            ]}
            onPress={() => setStatusFilter(Etat.PROBLEM)}
          >
            <View style={[styles.statusDot, { backgroundColor: getEtatColor(Etat.PROBLEM) }]} />
            <Text style={[
              styles.filterButtonText,
              statusFilter === Etat.PROBLEM && styles.filterButtonTextActive
            ]}>
              Problème
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterButton,
              statusFilter === Etat.TERMINER && styles.filterButtonActive
            ]}
            onPress={() => setStatusFilter(Etat.TERMINER)}
          >
            <View style={[styles.statusDot, { backgroundColor: getEtatColor(Etat.TERMINER) }]} />
            <Text style={[
              styles.filterButtonText,
              statusFilter === Etat.TERMINER && styles.filterButtonTextActive
            ]}>
              Terminé
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
      
      {/* Liste des réclamations */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Chargement des réclamations...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredReclamations}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#3b82f6']}
              tintColor="#3b82f6"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="error-outline" size={60} color="#cbd5e1" />
              <Text style={styles.emptyText}>
                Aucune réclamation trouvée
              </Text>
              <Text style={styles.emptySubText}>
                Essayez de modifier vos filtres de recherche
              </Text>
            </View>
          }
        />
      )}
      
      {/* Modal de détails */}
      {selectedReclamation && (
        <Modal
          visible={detailModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setDetailModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Détails de la réclamation</Text>
                <TouchableOpacity
                  onPress={() => setDetailModalVisible(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color="#64748b" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.modalBody}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Référence</Text>
                  <Text style={styles.detailValue}>{selectedReclamation.reference}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Type de panne</Text>
                  <Text style={styles.detailValue}>{selectedReclamation.typePanne}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Numéro de client</Text>
                  <Text style={styles.detailValue}>{selectedReclamation.numClient}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Genre de panne</Text>
                  <Text style={styles.detailValue}>{selectedReclamation.genrePanne}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Rue</Text>
                  <Text style={styles.detailValue}>{selectedReclamation.rue.replace('_', ' ')}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Importance</Text>
                  <View style={[
                    styles.importanceBadge,
                    { backgroundColor: `${getImportanceColor(selectedReclamation.importance)}20` }
                  ]}>
                    <View style={[
                      styles.importanceDot,
                      { backgroundColor: getImportanceColor(selectedReclamation.importance) }
                    ]} />
                    <Text style={[
                      styles.importanceText,
                      { color: getImportanceColor(selectedReclamation.importance) }
                    ]}>
                      {selectedReclamation.importance}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>État actuel</Text>
                  <View style={[
                    styles.etatBadge,
                    { backgroundColor: `${getEtatColor(selectedReclamation.etat)}20` }
                  ]}>
                    <View style={[
                      styles.etatDot,
                      { backgroundColor: getEtatColor(selectedReclamation.etat) }
                    ]} />
                    <Text style={[
                      styles.etatText,
                      { color: getEtatColor(selectedReclamation.etat) }
                    ]}>
                      {getEtatLabel(selectedReclamation.etat)}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date de réclamation</Text>
                  <Text style={styles.detailValue}>
                    {formatDate(selectedReclamation.heureReclamation)}
                  </Text>
                </View>
              </View>
              
              <View style={styles.modalFooter}>
                <Text style={styles.changeEtatLabel}>Changer l'état:</Text>
                <View style={styles.etatButtonsContainer}>
                  {selectedReclamation.etat !== Etat.ENCOURS && (
                    <TouchableOpacity
                      style={[styles.etatButton, { backgroundColor: getEtatColor(Etat.ENCOURS) }]}
                      onPress={() => confirmChangeEtat(selectedReclamation.id, Etat.ENCOURS)}
                    >
                      <Text style={styles.etatButtonText}>En cours</Text>
                    </TouchableOpacity>
                  )}
                  
                  {selectedReclamation.etat === Etat.ENCOURS && (
                    <TouchableOpacity
                      style={[styles.etatButton, { backgroundColor: getEtatColor(Etat.PROBLEM) }]}
                      onPress={() => confirmChangeEtat(selectedReclamation.id, Etat.PROBLEM)}
                    >
                      <Text style={styles.etatButtonText}>Problème</Text>
                    </TouchableOpacity>
                  )}
                  
                  {selectedReclamation.etat === Etat.ENCOURS && (
                    <TouchableOpacity
                      style={[styles.etatButton, { backgroundColor: getEtatColor(Etat.TERMINER) }]}
                      onPress={() => confirmChangeEtat(selectedReclamation.id, Etat.TERMINER)}
                    >
                      <Text style={styles.etatButtonText}>Terminé</Text>
                    </TouchableOpacity>
                  )}
                </View>
                
                <TouchableOpacity
                  style={styles.closeModalButton}
                  onPress={() => setDetailModalVisible(false)}
                >
                  <Text style={styles.closeModalButtonText}>Fermer</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
      
      {/* Modal de confirmation */}
      <Modal
        visible={confirmModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setConfirmModalVisible(false)}
      >
        <View style={styles.confirmModalOverlay}>
          <View style={styles.confirmModalContent}>
            <View style={styles.confirmModalHeader}>
              <MaterialIcons name="warning" size={28} color="#f59e0b" />
              <Text style={styles.confirmModalTitle}>Confirmer le changement</Text>
            </View>
            
            <Text style={styles.confirmModalText}>
              Êtes-vous sûr de vouloir changer l'état de cette réclamation vers "{newEtat && getEtatLabel(newEtat)}" ?
            </Text>
            
            <View style={styles.confirmModalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setConfirmModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={() => {
                  if (selectedReclamation && newEtat) {
                    setConfirmModalVisible(false);
                    changeEtat(selectedReclamation.id, newEtat);
                  }
                }}
              >
                <Text style={styles.confirmButtonText}>Confirmer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Toast pour les notifications */}
      <Toast />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#1e40af',
    paddingTop: 60,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  backButton: {
    marginRight: 15,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#e0f2fe',
    marginTop: 5,
  },
  dateFilters: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateFilterButton: {
    flex: 1,
    paddingVertical: 8,
    marginHorizontal: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
  },
  dateFilterButtonActive: {
    backgroundColor: '#fff',
  },
  dateFilterText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 12,
  },
  dateFilterTextActive: {
    color: '#1e40af',
  },
  filterContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#334155',
  },
  filterScrollView: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  filterButtonActive: {
    backgroundColor: '#1e40af',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#64748b',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#64748b',
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 15,
  },
  emptySubText: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 5,
  },
  itemContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    overflow: 'hidden',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  referenceContainer: {
    alignItems: 'flex-start',
  },
  referenceLabel: {
    fontSize: 12,
    color: '#94a3b8',
  },
  referenceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
  },
  importanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  importanceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  importanceText: {
    fontSize: 12,
    fontWeight: '500',
  },
  itemContent: {
    padding: 15,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    width: 60,
    fontSize: 14,
    color: '#64748b',
  },
  infoValue: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '500',
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#f8fafc',
  },
  etatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  etatDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  etatText: {
    fontSize: 12,
    fontWeight: '500',
  },
  dateText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 500,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#334155',
  },
  closeButton: {
    padding: 5,
  },
  modalBody: {
    padding: 20,
  },
  detailRow: {
    marginBottom: 15,
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 5,
  },
  detailValue: {
    fontSize: 16,
    color: '#334155',
    fontWeight: '500',
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  changeEtatLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 10,
  },
  etatButtonsContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  etatButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 10,
  },
  etatButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  closeModalButton: {
    backgroundColor: '#e2e8f0',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeModalButtonText: {
    color: '#475569',
    fontWeight: '600',
  },
  confirmModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmModalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  confirmModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  confirmModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#334155',
    marginLeft: 10,
  },
  confirmModalText: {
    fontSize: 16,
    color: '#475569',
    marginBottom: 20,
  },
  confirmModalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: '#e2e8f0',
  },
  cancelButtonText: {
    color: '#475569',
    fontWeight: '600',
  },
  confirmButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
}); 