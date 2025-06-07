import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
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
import { useAuth } from '../context/AuthContext';

// URL de base de l'API - à modifier selon l'environnement
// Pour le développement sur émulateur Android, utilisez 10.0.2.2 au lieu de localhost
// Pour le développement sur appareil physique, utilisez l'adresse IP de votre ordinateur
// Pour le développement web, utilisez localhost
const API_BASE_URL = 'http://localhost:8080';

// Types pour les matériels
interface Materiel {
  id: string;
  name: string;
  reference: string;
  status: 'EN_STOCK' | 'EN_COMMANDE' | 'RUPTURE';
  lastUpdated: string;
}

export default function MaterielTechnicien() {
  const { user } = useAuth();
  const [materiels, setMateriels] = useState<Materiel[]>([]);
  const [filteredMateriels, setFilteredMateriels] = useState<Materiel[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('tous');
  const [selectedMateriel, setSelectedMateriel] = useState<Materiel | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [alert, setAlert] = useState({
    visible: false,
    message: '',
    type: 'success'
  });

  // Gestionnaire d'erreurs global
  useEffect(() => {
    const errorHandler = (error: ErrorEvent) => {
      console.error('Global error caught:', error.error);
      showAlert(`Erreur globale: ${error.error.message}`, 'error');
    };

    window.addEventListener('error', errorHandler);
    
    return () => {
      window.removeEventListener('error', errorHandler);
    };
  }, []);

  // Fonction de navigation en arrière
  const handleGoBack = () => {
    router.replace('/(main)/homeTechnicien');
  };

  // Charger les matériels depuis l'API
  const fetchMateriels = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/materiels`);
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      const data = await response.json();
      const formattedData = data.map((item: any) => ({
        id: item.id,
        name: item.name,
        reference: item.reference,
        status: item.status,
        lastUpdated: item.lastUpdated
      }));
      setMateriels(formattedData);
      setFilteredMateriels(formattedData);
    } catch (error) {
      console.error("Erreur lors du chargement des matériels:", error);
      showAlert("Erreur lors du chargement des données", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Charger les matériels au démarrage
  useEffect(() => {
    fetchMateriels();
  }, []);

  // Filtrer et trier les matériels
  const filterAndSortMateriels = useCallback(() => {
    let result = [...materiels];
    
    // Filtre par statut
    if (statusFilter !== 'tous') {
      result = result.filter(item => item.status === statusFilter);
    }
    
    // Filtre par recherche
    if (searchQuery) {
      result = result.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.reference.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredMateriels(result);
  }, [materiels, searchQuery, statusFilter]);

  // Mettre à jour les filtres quand les données changent
  useEffect(() => {
    filterAndSortMateriels();
  }, [filterAndSortMateriels]);

  // Afficher une alerte
  const showAlert = (message: string, type: 'success' | 'error' = 'success') => {
    setAlert({
      visible: true,
      message,
      type
    });

    setTimeout(() => {
      setAlert(prev => ({ ...prev, visible: false }));
    }, 3000);
  };

  // Changer le statut d'un matériel vers "Rupture"
  async function changeStatusToRupture(id: string) {
    console.log('==== DÉBUT changeStatusToRupture ====');
    console.log('ID reçu:', id);
    
    try {
      console.log(`Attempting to update material ID: ${id}`);
      
      // S'assurer que l'ID est un nombre si nécessaire
      const materialId = id.toString().trim();
      console.log('Formatted ID:', materialId);
      
      const apiUrl = `${API_BASE_URL}/api/materiels/${materialId}/status?status=RUPTURE`;
      console.log('API URL:', apiUrl);
      
      console.log('Envoi de la requête PATCH...');
      
      // Utilisation de XMLHttpRequest pour tester
      const xhr = new XMLHttpRequest();
      xhr.open('PATCH', apiUrl, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('Accept', 'application/json');
      
      xhr.onload = function() {
        console.log('XHR status:', xhr.status);
        console.log('XHR response:', xhr.responseText);
        
        if (xhr.status >= 200 && xhr.status < 300) {
          console.log('Requête réussie!');
          
          let updatedMateriel;
          try {
            updatedMateriel = JSON.parse(xhr.responseText);
          } catch (e) {
            console.error('Erreur de parsing JSON:', e);
            updatedMateriel = { lastUpdated: new Date().toISOString() };
          }
          
          // Mettre à jour l'état local
          setMateriels(prevMateriels =>
            prevMateriels.map(item =>
              item.id === id ? { ...item, status: 'RUPTURE', lastUpdated: updatedMateriel.lastUpdated || new Date().toISOString() } : item
            )
          );
          
          if (selectedMateriel && selectedMateriel.id === id) {
            setSelectedMateriel({ ...selectedMateriel, status: 'RUPTURE', lastUpdated: updatedMateriel.lastUpdated || new Date().toISOString() });
          }
          
          fetchMateriels();
          showAlert("Statut modifié avec succès");
        } else {
          console.error('Erreur HTTP:', xhr.status, xhr.statusText);
          showAlert(`Erreur: ${xhr.status} ${xhr.statusText}`, "error");
        }
      };
      
      xhr.onerror = function() {
        console.error('Erreur réseau lors de la requête');
        showAlert('Erreur réseau lors de la connexion au serveur', 'error');
      };
      
      xhr.send();
      console.log('Requête envoyée');
      
    } catch (error) {
      console.error("Error updating status:", error);
      showAlert(`Erreur: ${error instanceof Error ? error.message : 'Problème de connexion au serveur'}`, "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
      console.log('==== FIN changeStatusToRupture ====');
    }
  }

  // Confirmer le changement de statut vers "Rupture"
  const confirmStatusChange = (id: string) => {
    console.log('confirmStatusChange appelé avec ID:', id);
    
    // Version simplifiée pour tester
    console.log('Appel direct de changeStatusToRupture avec ID:', id);
    // Essayer avec PUT au lieu de PATCH
    changeStatusToRuptureWithPut(id);
    
    /* Version avec Alert - à réactiver après les tests
    Alert.alert(
      "Confirmer le changement",
      "Voulez-vous vraiment signaler ce matériel en rupture de stock ?",
      [
        { text: "Annuler", style: "cancel", onPress: () => console.log('Action annulée') },
        { 
          text: "Confirmer", 
          onPress: () => {
            console.log('Action confirmée, appel de changeStatusToRupture avec ID:', id);
            changeStatusToRupture(id);
          } 
        }
      ]
    );
    */
  };
  
  // Version alternative avec PUT au lieu de PATCH
  async function changeStatusToRuptureWithPut(id: string) {
    console.log('==== DÉBUT changeStatusToRuptureWithPut ====');
    console.log('ID reçu:', id);
    
    try {
      // Récupérer d'abord le matériel
      console.log(`Récupération du matériel ID: ${id}`);
      const getUrl = `${API_BASE_URL}/api/materiels/${id}`;
      console.log('GET URL:', getUrl);
      
      const getResponse = await fetch(getUrl);
      console.log('GET Response Status:', getResponse.status);
      
      if (!getResponse.ok) {
        throw new Error(`Erreur lors de la récupération du matériel: ${getResponse.status}`);
      }
      
      const materiel = await getResponse.json();
      console.log('Matériel récupéré:', materiel);
      
      // Modifier le statut et mettre à jour
      materiel.status = 'RUPTURE';
      materiel.lastUpdated = new Date().toISOString();
      
      // Envoyer la mise à jour avec PUT
      const putUrl = `${API_BASE_URL}/api/materiels/${id}`;
      console.log('PUT URL:', putUrl);
      console.log('PUT Body:', JSON.stringify(materiel));
      
      const putResponse = await fetch(putUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(materiel),
      });
      
      console.log('PUT Response Status:', putResponse.status);
      
      if (!putResponse.ok) {
        const errorText = await putResponse.text();
        throw new Error(`Erreur lors de la mise à jour: ${putResponse.status} - ${errorText}`);
      }
      
      const updatedMateriel = await putResponse.json();
      console.log('Matériel mis à jour:', updatedMateriel);
      
      // Mettre à jour l'état local
      setMateriels(prevMateriels =>
        prevMateriels.map(item =>
          item.id === id ? { ...item, status: 'RUPTURE', lastUpdated: updatedMateriel.lastUpdated } : item
        )
      );
      
      if (selectedMateriel && selectedMateriel.id === id) {
        setSelectedMateriel({ ...selectedMateriel, status: 'RUPTURE', lastUpdated: updatedMateriel.lastUpdated });
      }
      
      fetchMateriels();
      showAlert("Statut modifié avec succès (méthode PUT)");
      
    } catch (error) {
      console.error("Erreur lors de la mise à jour avec PUT:", error);
      showAlert(`Erreur PUT: ${error instanceof Error ? error.message : 'Problème de connexion au serveur'}`, "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
      console.log('==== FIN changeStatusToRuptureWithPut ====');
    }
  }

  // Formatter le statut pour l'affichage
  const formatStatus = (status: string) => {
    switch (status) {
      case 'EN_STOCK':
        return { label: 'En stock', color: '#22c55e' };
      case 'EN_COMMANDE':
        return { label: 'En commande', color: '#3b82f6' };
      case 'RUPTURE':
        return { label: 'Rupture', color: '#f87171' };
      default:
        return { label: status, color: '#94a3b8' };
    }
  };

  // Formater la date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Ouvrir le modal de détails
  const openDetailModal = (materiel: Materiel) => {
    setSelectedMateriel(materiel);
    setDetailModalVisible(true);
  };

  // Rafraîchir la liste
  const onRefresh = () => {
    setRefreshing(true);
    fetchMateriels();
  };

  // Rendu d'un élément de la liste
  const renderItem = ({ item }: { item: Materiel }) => {
    const statusInfo = formatStatus(item.status);
    
    return (
      <TouchableOpacity
        style={styles.itemContainer}
        onPress={() => openDetailModal(item)}
      >
        <View style={styles.itemContent}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemReference}>{item.reference}</Text>
          
          <View style={styles.itemFooter}>
            <View style={[styles.statusBadge, { backgroundColor: `${statusInfo.color}20` }]}>
              <View style={[styles.statusDot, { backgroundColor: statusInfo.color }]} />
              <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
            </View>
            
            <Text style={styles.dateText}>
              Mis à jour: {formatDate(item.lastUpdated)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Composant d'alerte
  const AlertComponent = () => {
    if (!alert.visible) return null;
    
    return (
      <View style={[
        styles.alert,
        alert.type === 'success' ? styles.alertSuccess : styles.alertError
      ]}>
        <Text style={styles.alertText}>{alert.message}</Text>
      </View>
    );
  };

  // Composant pour le modal de détails
  const DetailModal = () => {
    if (!selectedMateriel) return null;
    
    const statusInfo = formatStatus(selectedMateriel.status);
    
    return (
      <Modal
        visible={detailModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Détails du matériel</Text>
              <TouchableOpacity
                onPress={() => setDetailModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Nom</Text>
                <Text style={styles.detailValue}>{selectedMateriel.name}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Référence</Text>
                <Text style={styles.detailValueMono}>{selectedMateriel.reference}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Statut</Text>
                <View style={[styles.statusBadge, { backgroundColor: `${statusInfo.color}20` }]}>
                  <View style={[styles.statusDot, { backgroundColor: statusInfo.color }]} />
                  <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
                </View>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Dernière mise à jour</Text>
                <Text style={styles.detailValue}>
                  {formatDate(selectedMateriel.lastUpdated)}
                </Text>
              </View>
            </View>
            
            <View style={styles.modalFooter}>
              {selectedMateriel.status !== 'RUPTURE' && (
                <TouchableOpacity
                  style={styles.signalButton}
                  onPress={() => {
                    console.log('Button pressed - Signaler en rupture');
                    setDetailModalVisible(false);
                    confirmStatusChange(selectedMateriel.id);
                  }}
                >
                  <MaterialIcons name="report-problem" size={20} color="#fff" />
                  <Text style={styles.signalButtonText}>Signaler en rupture</Text>
                </TouchableOpacity>
              )}
              
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
            <Text style={styles.headerTitle}>Matériels</Text>
            <Text style={styles.headerSubtitle}>
              Consultation et gestion des stocks
            </Text>
          </View>
        </View>
      </View>
      
      {/* Search and Filter */}
      <View style={styles.filterContainer}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#64748b" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un matériel..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
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
              statusFilter === 'EN_STOCK' && styles.filterButtonActive
            ]}
            onPress={() => setStatusFilter('EN_STOCK')}
          >
            <View style={[styles.statusDot, { backgroundColor: '#22c55e' }]} />
            <Text style={[
              styles.filterButtonText,
              statusFilter === 'EN_STOCK' && styles.filterButtonTextActive
            ]}>
              En stock
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterButton,
              statusFilter === 'EN_COMMANDE' && styles.filterButtonActive
            ]}
            onPress={() => setStatusFilter('EN_COMMANDE')}
          >
            <View style={[styles.statusDot, { backgroundColor: '#3b82f6' }]} />
            <Text style={[
              styles.filterButtonText,
              statusFilter === 'EN_COMMANDE' && styles.filterButtonTextActive
            ]}>
              En commande
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterButton,
              statusFilter === 'RUPTURE' && styles.filterButtonActive
            ]}
            onPress={() => setStatusFilter('RUPTURE')}
          >
            <View style={[styles.statusDot, { backgroundColor: '#f87171' }]} />
            <Text style={[
              styles.filterButtonText,
              statusFilter === 'RUPTURE' && styles.filterButtonTextActive
            ]}>
              Rupture
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
      
      {/* Liste des matériels */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1e40af" />
          <Text style={styles.loadingText}>Chargement des matériels...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredMateriels}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#1e40af']}
              tintColor="#1e40af"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="inventory" size={60} color="#cbd5e1" />
              <Text style={styles.emptyText}>
                Aucun matériel trouvé
              </Text>
              <Text style={styles.emptySubText}>
                Essayez de modifier vos filtres de recherche
              </Text>
            </View>
          }
        />
      )}
      
      {/* Modal de détails */}
      <DetailModal />
      
      {/* Alerte */}
      <AlertComponent />
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
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  itemContent: {
    padding: 15,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 5,
  },
  itemReference: {
    fontSize: 14,
    color: '#64748b',
    fontFamily: 'monospace',
    marginBottom: 10,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  dateText: {
    fontSize: 12,
    color: '#94a3b8',
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
  detailValueMono: {
    fontSize: 16,
    color: '#334155',
    fontWeight: '500',
    fontFamily: 'monospace',
    backgroundColor: '#f1f5f9',
    padding: 5,
    borderRadius: 5,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  signalButton: {
    backgroundColor: '#f87171',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  signalButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 5,
  },
  closeModalButton: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
  },
  closeModalButtonText: {
    color: '#475569',
    fontWeight: '600',
  },
  alert: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    zIndex: 1000,
  },
  alertSuccess: {
    backgroundColor: '#dcfce7',
    borderLeftWidth: 4,
    borderLeftColor: '#22c55e',
  },
  alertError: {
    backgroundColor: '#fee2e2',
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  alertText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#334155',
  },
}); 