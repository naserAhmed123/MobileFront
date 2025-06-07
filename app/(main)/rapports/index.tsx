import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
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

// Types pour les rapports
enum TypeRapport {
  JOURNALIER = "JOURNALIER",
  HEBDOMADAIRE = "HEBDOMADAIRE",
  MENSUEL = "MENSUEL"
}

interface Rapport {
  id?: number;
  referenceRapport: string;
  titreRapport: string;
  Cont: string;
  typeRapport: TypeRapport;
  technicienId: number;
  serviceInterventionId?: number | null;
  dateRapport: string;
}

export default function RapportsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [rapports, setRapports] = useState<Rapport[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedType, setSelectedType] = useState<TypeRapport>(TypeRapport.JOURNALIER);
  const [typeDropdownVisible, setTypeDropdownVisible] = useState(false);
  const [selectedRapport, setSelectedRapport] = useState<any>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  // État du formulaire
  const [formData, setFormData] = useState({
    titreRapport: '',
    Cont: '',
    typeRapport: TypeRapport.JOURNALIER
  });

  // Validation du formulaire
  const [errors, setErrors] = useState({
    titreRapport: '',
    Cont: ''
  });

  // Charger les rapports
  useEffect(() => {
    fetchRapports();
  }, []);

  // Récupérer les rapports du technicien
  const fetchRapports = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    setRefreshing(true);
    
    try {
      // Utiliser l'endpoint pour récupérer les rapports par service d'intervention
      const response = await fetch(`http://localhost:8080/api/rapports/technicien/${user.id}`);
      
      if (!response.ok) {
        throw new Error(`Erreur: ${response.status}`);
      }
      
      const data = await response.json();
      setRapports(data);
      console.log(`${data.length} rapports récupérés pour le technicien ${user.id}`);
    } catch (error) {
      console.error("Erreur lors de la récupération des rapports:", error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de charger les rapports',
        position: 'bottom'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Validation du formulaire
  const validateForm = () => {
    let isValid = true;
    const newErrors = { titreRapport: '', Cont: '' };
    
    if (!formData.titreRapport.trim()) {
      newErrors.titreRapport = 'Le titre est requis';
      isValid = false;
    }
    
    if (!formData.Cont.trim()) {
      newErrors.Cont = 'Le contenu est requis';
      isValid = false;
    } else if (formData.Cont.length < 10) {
      newErrors.Cont = 'Le contenu doit contenir au moins 10 caractères';
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };

  // Générer une référence unique
  const generateReference = () => {
    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `RAP-${dateStr}-${random}-${user?.id || '0'}`;
  };

  // Soumettre le rapport
  const submitRapport = async () => {
    if (!validateForm() || !user?.id) return;
    
    setConfirmModalVisible(false);
    setLoading(true);
    
    try {
      // Créer l'objet rapport selon le format attendu par le backend
      const rapportData = {
        referenceRapport: generateReference(),
        titreRapport: formData.titreRapport,
        cont: formData.Cont,
        typeRapport: formData.typeRapport,
        technicienId: Number(user.id),
        serviceInterventionId: null,
        dateRapport: new Date().toISOString().replace('Z', '')
      };
      
      console.log("Données envoyées:", rapportData);
      
      const response = await fetch('http://localhost:8080/api/rapports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(rapportData),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Erreur: ${response.status}`, errorText);
        throw new Error(`Erreur: ${response.status} - ${errorText}`);
      }
      
      // Réinitialiser le formulaire
      setFormData({
        titreRapport: '',
        Cont: '',
        typeRapport: TypeRapport.JOURNALIER
      });
      
      // Fermer le modal
      setModalVisible(false);
      
      // Rafraîchir la liste des rapports
      fetchRapports();
      
      // Afficher un toast de succès
      Toast.show({
        type: 'success',
        text1: 'Rapport envoyé',
        text2: 'Votre rapport a été enregistré avec succès',
        position: 'bottom'
      });
    } catch (error: any) {
      console.error("Erreur lors de l'envoi du rapport:", error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: "Impossible d'envoyer le rapport: " + (error.message || 'Erreur inconnue'),
        position: 'bottom'
      });
    } finally {
      setLoading(false);
    }
  };

  // Fonction de navigation en arrière
  const handleGoBack = () => {
    router.replace('/(main)/homeTechnicien');
  };

  // Formater la date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} à ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  // Obtenir la couleur pour le type de rapport
  const getTypeColor = (type: string) => {
    switch (type) {
      case TypeRapport.JOURNALIER:
        return '#3b82f6'; // blue-500
      case TypeRapport.HEBDOMADAIRE:
        return '#8b5cf6'; // violet-500
      case TypeRapport.MENSUEL:
        return '#10b981'; // emerald-500
      default:
        return '#6b7280'; // gray-500
    }
  };

  // Obtenir l'icône pour le type de rapport
  const getTypeIcon = (type: string) => {
    switch (type) {
      case TypeRapport.JOURNALIER:
        return <MaterialIcons name="today" size={18} color="#fff" />;
      case TypeRapport.HEBDOMADAIRE:
        return <MaterialIcons name="view-week" size={18} color="#fff" />;
      case TypeRapport.MENSUEL:
        return <MaterialIcons name="calendar-today" size={18} color="#fff" />;
      default:
        return <MaterialIcons name="description" size={18} color="#fff" />;
    }
  };

  // Rendu d'un élément de la liste
  const renderItem = ({ item }: { item: any }) => {
    return (
      <TouchableOpacity 
        style={styles.rapportItem}
        onPress={() => showRapportDetails(item)}
      >
        <View style={styles.rapportHeader}>
          <View style={[styles.typeTag, { backgroundColor: getTypeColor(item.typeRapport) }]}>
            {getTypeIcon(item.typeRapport)}
            <Text style={styles.typeText}>{item.typeRapport}</Text>
          </View>
          <Text style={styles.rapportDate}>{formatDate(item.dateRapport)}</Text>
        </View>
        
        <Text style={styles.rapportTitle}>{item.titreRapport}</Text>
        <Text style={styles.rapportReference}>{item.referenceRapport}</Text>
        
        <Text numberOfLines={2} style={styles.rapportContent}>
          {item.cont || item.Cont}
        </Text>
      </TouchableOpacity>
    );
  };

  // Afficher les détails d'un rapport
  const showRapportDetails = (rapport: any) => {
    setSelectedRapport(rapport);
    setDetailModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3b82f6" />
      
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
            <Text style={styles.headerTitle}>Mes Rapports</Text>
            <Text style={styles.headerSubtitle}>
              Gérez vos rapports d'intervention
            </Text>
          </View>
        </View>
      </View>
      
      {/* Liste des rapports */}
      {loading && rapports.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Chargement des rapports...</Text>
        </View>
      ) : (
        <FlatList
          data={rapports}
          keyExtractor={(item) => item.id?.toString() || item.referenceRapport}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={fetchRapports}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="description" size={60} color="#cbd5e1" />
              <Text style={styles.emptyText}>
                Aucun rapport
              </Text>
              <Text style={styles.emptySubText}>
                Vous n'avez pas encore créé de rapports
              </Text>
            </View>
          }
        />
      )}
      
      {/* Bouton d'ajout */}
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
      
      {/* Modal d'ajout de rapport */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nouveau Rapport</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.formContainer}>
              {/* Titre */}
              <Text style={styles.inputLabel}>Titre du rapport *</Text>
              <TextInput
                style={[styles.input, errors.titreRapport ? styles.inputError : null]}
                placeholder="Entrez le titre du rapport"
                value={formData.titreRapport}
                onChangeText={(text) => setFormData({...formData, titreRapport: text})}
              />
              {errors.titreRapport ? (
                <Text style={styles.errorText}>{errors.titreRapport}</Text>
              ) : null}
              
              {/* Type de rapport */}
              <Text style={styles.inputLabel}>Type de rapport *</Text>
              <TouchableOpacity 
                style={styles.dropdown}
                onPress={() => setTypeDropdownVisible(!typeDropdownVisible)}
              >
                <Text style={styles.dropdownText}>{formData.typeRapport}</Text>
                <Ionicons name={typeDropdownVisible ? "chevron-up" : "chevron-down"} size={20} color="#64748b" />
              </TouchableOpacity>
              
              {typeDropdownVisible && (
                <View style={styles.dropdownOptions}>
                  {Object.values(TypeRapport).map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.dropdownOption,
                        formData.typeRapport === type && styles.dropdownOptionSelected
                      ]}
                      onPress={() => {
                        setFormData({...formData, typeRapport: type});
                        setTypeDropdownVisible(false);
                      }}
                    >
                      <Text 
                        style={[
                          styles.dropdownOptionText,
                          formData.typeRapport === type && styles.dropdownOptionTextSelected
                        ]}
                      >
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              
              {/* Contenu */}
              <Text style={styles.inputLabel}>Contenu du rapport *</Text>
              <TextInput
                style={[styles.textArea, errors.Cont ? styles.inputError : null]}
                placeholder="Entrez le contenu détaillé du rapport"
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                value={formData.Cont}
                onChangeText={(text) => setFormData({...formData, Cont: text})}
              />
              {errors.Cont ? (
                <Text style={styles.errorText}>{errors.Cont}</Text>
              ) : null}
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.submitButton}
                onPress={() => {
                  if (validateForm()) {
                    setConfirmModalVisible(true);
                  }
                }}
              >
                <Text style={styles.submitButtonText}>Soumettre</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      
      {/* Modal de confirmation */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={confirmModalVisible}
        onRequestClose={() => setConfirmModalVisible(false)}
      >
        <View style={styles.confirmModalContainer}>
          <View style={styles.confirmModalContent}>
            <View style={styles.confirmIconContainer}>
              <Ionicons name="help-circle" size={50} color="#3b82f6" />
            </View>
            
            <Text style={styles.confirmTitle}>Confirmer l'envoi</Text>
            <Text style={styles.confirmText}>
              Êtes-vous sûr de vouloir soumettre ce rapport ? Cette action ne peut pas être annulée.
            </Text>
            
            <View style={styles.confirmButtons}>
              <TouchableOpacity 
                style={styles.cancelConfirmButton}
                onPress={() => setConfirmModalVisible(false)}
              >
                <Text style={styles.cancelConfirmText}>Annuler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.submitConfirmButton}
                onPress={submitRapport}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitConfirmText}>Confirmer</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Toast pour les messages de succès/erreur */}
      <Toast />
      
      {/* Modal de détails du rapport */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={detailModalVisible}
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.detailModalContainer}>
          <View style={styles.detailModalContent}>
            {selectedRapport && (
              <>
                <View style={styles.detailHeader}>
                  <Text style={styles.detailTitle}>{selectedRapport.titreRapport}</Text>
                  <TouchableOpacity 
                    style={styles.closeButton}
                    onPress={() => setDetailModalVisible(false)}
                  >
                    <Ionicons name="close" size={24} color="#64748b" />
                  </TouchableOpacity>
                </View>
                
                <ScrollView style={styles.detailBody}>
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Référence</Text>
                    <Text style={styles.detailValue}>{selectedRapport.referenceRapport}</Text>
                  </View>
                  
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Date</Text>
                    <Text style={styles.detailValue}>{formatDate(selectedRapport.dateRapport)}</Text>
                  </View>
                  
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Type</Text>
                    <View style={[styles.typeTag, { backgroundColor: getTypeColor(selectedRapport.typeRapport) }]}>
                      {getTypeIcon(selectedRapport.typeRapport)}
                      <Text style={styles.typeText}>{selectedRapport.typeRapport}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Contenu</Text>
                    <View style={styles.contentBox}>
                      <Text style={styles.contentText}>{selectedRapport.cont || selectedRapport.Cont}</Text>
                    </View>
                  </View>
                </ScrollView>
                
                <View style={styles.detailFooter}>
                  <TouchableOpacity 
                    style={styles.closeDetailButton}
                    onPress={() => setDetailModalVisible(false)}
                  >
                    <Text style={styles.closeDetailText}>Fermer</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#3b82f6', // blue-500
    paddingTop: 60,
    paddingBottom: 15,
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
  listContent: {
    padding: 15,
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
  rapportItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  rapportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  typeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  typeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 5,
  },
  rapportDate: {
    fontSize: 12,
    color: '#94a3b8',
  },
  rapportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 5,
  },
  rapportReference: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 10,
  },
  rapportContent: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#3b82f6', // blue-500
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#334155',
  },
  formContainer: {
    paddingVertical: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#334155',
    marginBottom: 15,
  },
  inputError: {
    borderWidth: 1,
    borderColor: '#f87171', // red-400
  },
  errorText: {
    color: '#f87171', // red-400
    fontSize: 12,
    marginBottom: 10,
    marginTop: -10,
  },
  textArea: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#334155',
    marginBottom: 15,
    height: 120,
  },
  dropdown: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  dropdownText: {
    fontSize: 16,
    color: '#334155',
  },
  dropdownOptions: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginTop: -10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  dropdownOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  dropdownOptionSelected: {
    backgroundColor: '#eff6ff', // blue-50
  },
  dropdownOptionText: {
    fontSize: 16,
    color: '#334155',
  },
  dropdownOptionTextSelected: {
    color: '#3b82f6', // blue-500
    fontWeight: '500',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '500',
  },
  submitButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#3b82f6', // blue-500
    flex: 1,
    marginLeft: 10,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  confirmModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmModalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  confirmIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#eff6ff', // blue-50
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 10,
  },
  confirmText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20,
  },
  confirmButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  cancelConfirmButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  cancelConfirmText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '500',
  },
  submitConfirmButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#3b82f6', // blue-500
    flex: 1,
    marginLeft: 10,
    alignItems: 'center',
  },
  submitConfirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  detailModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  detailModalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    width: '100%',
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#334155',
  },
  closeButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailBody: {
    paddingVertical: 20,
    width: '100%',
  },
  detailSection: {
    marginBottom: 15,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  detailValue: {
    fontSize: 16,
    color: '#334155',
  },
  detailFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    width: '100%',
  },
  closeDetailButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#3b82f6', // blue-500
    alignItems: 'center',
  },
  closeDetailText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  contentBox: {
    padding: 10,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
  },
  contentText: {
    fontSize: 16,
    color: '#334155',
  },
}); 