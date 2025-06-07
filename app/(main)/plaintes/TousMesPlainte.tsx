import { FontAwesome, Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';

const API_URL = 'http://localhost:8080';

interface User {
  id: string;
  nom: string;
  carteIdentite: string;
  role: string;
  con: string;
  motDePasse?: string;
  confirmMotDePasse?: string;
}

interface Plainte {
  id: number;
  referenceRec: string;
  etatRef: string;
  datePlainte: string;
  numClient: string;
  nomClient: string;
  Descrip?: string;
  descrip?: string;
  citoyenId: string;
  reclamationId: number;
  verif?: string;
}

interface SearchCriteria {
  referenceRec: string;
  etatRef: string;
  nomClient: string;
  dateDebut: string;
  verif: string;
}

const showToast = (message: string, duration: 'SHORT' | 'LONG' = 'SHORT') => {
  if (Platform.OS === 'android') {
    const { ToastAndroid } = require('react-native');
    ToastAndroid.show(
      message,
      duration === 'SHORT' ? ToastAndroid.SHORT : ToastAndroid.LONG
    );
  } else if (Platform.OS === 'ios') {
    Alert.alert('Information', message);
  } else {
    console.log(message);
    if (typeof window !== 'undefined') {
      alert(message);
    }
  }
};

const parseJwt = (token: string | null) => {
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Erreur lors du décodage du token:', e);
    showToast('Problème avec votre session. Veuillez vous reconnecter.', 'LONG');
    return null;
  }
};

export default function TousMesPlaintes() {
  const { authState } = useAuth();
  const [plaintes, setPlaintes] = useState<Plainte[]>([]);
  const [filteredPlaintes, setFilteredPlaintes] = useState<Plainte[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>({
    referenceRec: '',
    etatRef: '',
    nomClient: '',
    dateDebut: '',
    verif: '',
  });
  const [selectedPlainte, setSelectedPlainte] = useState<Plainte | null>(null);
  const [userData, setUserData] = useState<User>({
    id: '',
    nom: '',
    carteIdentite: '',
    role: '',
    con: '',
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = authState.userToken;
        if (!token) {
          throw new Error('Aucun token trouvé');
        }

        const decoded = parseJwt(token);
        if (!decoded) {
          throw new Error('Token JWT invalide ou mal formé');
        }

        const email = decoded.email || decoded.sub;
        if (!email) {
          throw new Error('Aucun email ou sujet trouvé dans le JWT');
        }

        const response = await fetch(`${API_URL}/api/utilisateur/${email}`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Échec de la récupération de l'utilisateur: ${response.status} ${response.statusText}`);
        }

        const userData = await response.json();
        setUserData({
          id: userData.id || '',
          nom: userData.nom || '',
          carteIdentite: userData.carteIdentite || '',
          role: userData.role || '',
          con: userData.con || '',
        });
        
      } catch (err: any) {
        console.error('Erreur lors de la récupération de l\'utilisateur:', err);
        setError(err.message);
        showToast(`Erreur: ${err.message}`, 'LONG');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [authState.userToken]);

  useEffect(() => {
    const fetchPlaintes = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = authState.userToken;
        if (!token) {
          throw new Error('Aucun token trouvé');
        }

        if (!userData.id) {
          return;
        }

        const response = await fetch(`${API_URL}/api/plaintes/citoyen/${userData.id}`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Échec de la récupération des plaintes: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        setPlaintes(data);
        setFilteredPlaintes(data);
      } catch (err: any) {
        console.error('Erreur lors de la récupération des plaintes:', err);
        setError(err.message);
        showToast(`Erreur: ${err.message}`, 'LONG');
      } finally {
        setLoading(false);
      }
    };

    if (userData.id) {
      fetchPlaintes();
    }
  }, [userData.id, authState.userToken]);

  const handleSearch = useCallback(() => {
    const filtered = plaintes.filter((plainte) => {
      const matchesReference = plainte.referenceRec
        .toLowerCase()
        .includes(searchCriteria.referenceRec.toLowerCase());
      const matchesEtat = plainte.etatRef
        .toLowerCase()
        .includes(searchCriteria.etatRef.toLowerCase());
      const matchesNom = plainte.nomClient
        .toLowerCase()
        .includes(searchCriteria.nomClient.toLowerCase());
      const matchesDate = searchCriteria.dateDebut
        ? new Date(plainte.datePlainte).toISOString().split('T')[0] === searchCriteria.dateDebut
        : true;
      const matchesVerif = searchCriteria.verif
        ? (plainte.verif || '').toLowerCase() === searchCriteria.verif.toLowerCase()
        : true;
      return matchesReference && matchesEtat && matchesNom && matchesDate && matchesVerif;
    });
    setFilteredPlaintes(filtered);
  }, [plaintes, searchCriteria]);

  const resetSearchCriteria = () => {
    setSearchCriteria({
      referenceRec: '',
      etatRef: '',
      nomClient: '',
      dateDebut: '',
      verif: '',
    });
    setFilteredPlaintes(plaintes);
  };

  const handleInputChange = (name: string, value: string) => {
    setSearchCriteria(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setSearchCriteria(prev => ({ 
        ...prev, 
        dateDebut: selectedDate.toISOString().split('T')[0]
      }));
    }
  };

  const openPopup = (plainte: Plainte) => {
    setSelectedPlainte(plainte);
  };

  const closePopup = () => {
    setSelectedPlainte(null);
  };

  const navigateToAddPlainte = () => {
    router.push('/(main)/plaintes');
  };

  const navigateBack = () => {
    router.push('/homeCitoyen');
  };

  if (loading && plaintes.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Chargement des plaintes...</Text>
      </View>
    );
  }

  if (error && plaintes.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Erreur: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.replace('/(main)/plaintes/TousMesPlainte')}>
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderPlainteItem = ({ item }: { item: Plainte }) => (
    <TouchableOpacity 
      style={styles.plainteItem}
      onPress={() => openPopup(item)}
    >
      <View style={styles.plainteHeader}>
        <View style={styles.plainteReference}>
          <FontAwesome name="file-text-o" size={16} color="#3b82f6" style={styles.plainteIcon} />
          <Text style={styles.plainteReferenceText}>{item.referenceRec}</Text>
        </View>
        <View style={[
          styles.statusBadge, 
          { 
            backgroundColor: 
              item.etatRef === 'Traitée' ? '#dcfce7' : 
              item.etatRef === 'En attente' ? '#fef9c3' : '#dbeafe'
          }
        ]}>
          <View style={[
            styles.statusDot, 
            { 
              backgroundColor: 
                item.etatRef === 'Traitée' ? '#22c55e' : 
                item.etatRef === 'En attente' ? '#eab308' : '#3b82f6'
            }
          ]} />
          <Text style={[
            styles.statusText, 
            { 
              color: 
                item.etatRef === 'Traitée' ? '#166534' : 
                item.etatRef === 'En attente' ? '#854d0e' : '#1e40af'
            }
          ]}>
            {item.etatRef}
          </Text>
        </View>
      </View>
      
      <View style={styles.plainteDetails}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <FontAwesome name="calendar" size={14} color="#8b5cf6" style={styles.detailIcon} />
            <Text style={styles.detailText}>
              {item.datePlainte ? new Date(item.datePlainte).toLocaleDateString() : 'N/A'}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <FontAwesome name="user" size={14} color="#f59e0b" style={styles.detailIcon} />
            <Text style={styles.detailText}>{item.nomClient}</Text>
          </View>
        </View>
        
        <View style={styles.verificationRow}>
          <View style={[
            styles.verificationBadge, 
            { 
              backgroundColor: item.verif === 'OUI' ? '#dcfce7' : '#fee2e2'
            }
          ]}>
            <View style={[
              styles.verificationDot, 
              { 
                backgroundColor: item.verif === 'OUI' ? '#22c55e' : '#ef4444'
              }
            ]} />
            <Text style={[
              styles.verificationText, 
              { 
                color: item.verif === 'OUI' ? '#166534' : '#b91c1c'
              }
            ]}>
              {item.verif || 'NON'}
            </Text>
          </View>
          <TouchableOpacity style={styles.detailsButton} onPress={() => openPopup(item)}>
            <FontAwesome name="eye" size={16} color="#fff" />
            <Text style={styles.detailsButtonText}>Détails</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={navigateBack}
          >
            <Ionicons name="arrow-back" size={24} color="#3b82f6" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>Mes Plaintes</Text>
            <Text style={styles.subtitle}>Consultez et gérez toutes vos plaintes</Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={navigateToAddPlainte}
          >
            <FontAwesome name="plus" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchCard}>
        <View style={styles.searchHeader}>
          <FontAwesome name="search" size={16} color="#3b82f6" />
          <Text style={styles.searchHeaderText}>Recherche avancée</Text>
        </View>
        
        <ScrollView style={styles.searchForm}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Référence</Text>
            <View style={styles.inputContainer}>
              <FontAwesome name="file-text-o" size={16} color="#9ca3af" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Rechercher par référence"
                placeholderTextColor="#9ca3af"
                value={searchCriteria.referenceRec}
                onChangeText={(text) => handleInputChange('referenceRec', text)}
              />
            </View>
          </View>
          
          
          
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Vérification</Text>
            <View style={styles.pickerContainer}>
              <FontAwesome name="check-circle" size={16} color="#9ca3af" style={styles.inputIcon} />
              <Picker
                selectedValue={searchCriteria.verif}
                onValueChange={(value) => handleInputChange('verif', value)}
                style={styles.picker}
                mode="dropdown"
              >
                <Picker.Item label="Tous" value="" />
                <Picker.Item label="OUI" value="OUI" />
                <Picker.Item label="NON" value="NON" />
              </Picker>
            </View>
          </View>
          
          {/* Date Picker */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Date de plainte</Text>
            <TouchableOpacity 
              style={styles.datePickerButton}
              onPress={() => setShowDatePicker(true)}
            >
              <FontAwesome name="calendar" size={16} color="#9ca3af" style={styles.inputIcon} />
              <Text style={styles.datePickerText}>
                {searchCriteria.dateDebut || 'Sélectionner une date'}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={searchCriteria.dateDebut ? new Date(searchCriteria.dateDebut) : new Date()}
                mode="date"
                display="default"
                onChange={handleDateChange}
              />
            )}
          </View>
          
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={styles.resetButton} 
              onPress={resetSearchCriteria}
            >
              <FontAwesome name="refresh" size={16} color="#6b7280" />
              <Text style={styles.resetButtonText}>Réinitialiser</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.searchButton} 
              onPress={handleSearch}
            >
              <FontAwesome name="search" size={16} color="#fff" />
              <Text style={styles.searchButtonText}>Rechercher</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      <View style={styles.plaintesContainer}>
        <FlatList
          data={filteredPlaintes}
          renderItem={renderPlainteItem}
          keyExtractor={(item) => item.id.toString()}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <FontAwesome name="exclamation-circle" size={40} color="#9ca3af" />
              <Text style={styles.emptyTitle}>Aucune plainte trouvée</Text>
              <Text style={styles.emptySubtitle}>
                Aucun résultat ne correspond à vos critères de recherche.
              </Text>
            </View>
          }
          contentContainerStyle={filteredPlaintes.length === 0 ? { flex: 1 } : {}}
        />
      </View>

      <Modal
        visible={selectedPlainte !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={closePopup}
      >
        {selectedPlainte && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Détails de la Plainte</Text>
                  <View style={styles.modalIdBadge}>
                    <FontAwesome name="hashtag" size={14} color="#fff" style={{ marginRight: 5 }} />
                    <Text style={styles.modalIdText}>ID: {selectedPlainte.id}</Text>
                  </View>
                </View>
                <TouchableOpacity 
                  style={styles.modalCloseButton}
                  onPress={closePopup}
                >
                  <FontAwesome name="times" size={20} color="#fff" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                <View style={styles.modalGrid}>
                  <View style={styles.modalCard}>
                    <View style={styles.modalCardHeader}>
                      <FontAwesome name="file-text-o" size={16} color="#3b82f6" />
                      <Text style={styles.modalCardTitle}>Référence</Text>
                    </View>
                    <Text style={styles.modalCardContent}>{selectedPlainte.referenceRec}</Text>
                  </View>
                  
                  <View style={styles.modalCard}>
                    <View style={styles.modalCardHeader}>
                      <FontAwesome name="check-circle" size={16} color="#22c55e" />
                      <Text style={styles.modalCardTitle}>État</Text>
                    </View>
                    <View style={[
                      styles.statusBadge, 
                      { 
                        backgroundColor: 
                          selectedPlainte.etatRef === 'Traitée' ? '#dcfce7' : 
                          selectedPlainte.etatRef === 'En attente' ? '#fef9c3' : '#dbeafe'
                      }
                    ]}>
                      <View style={[
                        styles.statusDot, 
                        { 
                          backgroundColor: 
                            selectedPlainte.etatRef === 'Traitée' ? '#22c55e' : 
                            selectedPlainte.etatRef === 'En attente' ? '#eab308' : '#3b82f6'
                        }
                      ]} />
                      <Text style={[
                        styles.statusText, 
                        { 
                          color: 
                            selectedPlainte.etatRef === 'Traitée' ? '#166534' : 
                            selectedPlainte.etatRef === 'En attente' ? '#854d0e' : '#1e40af'
                        }
                      ]}>
                        {selectedPlainte.etatRef}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.modalCard}>
                    <View style={styles.modalCardHeader}>
                      <FontAwesome name="calendar" size={16} color="#8b5cf6" />
                      <Text style={styles.modalCardTitle}>Date de soumission</Text>
                    </View>
                    <Text style={styles.modalCardContent}>
                      {selectedPlainte.datePlainte
                        ? `${new Date(selectedPlainte.datePlainte).toLocaleDateString()} à ${new Date(
                            selectedPlainte.datePlainte
                          ).toLocaleTimeString()}`
                        : 'N/A'}
                    </Text>
                  </View>
                  
                  <View style={styles.modalCard}>
                    <View style={styles.modalCardHeader}>
                      <FontAwesome name="user" size={16} color="#f59e0b" />
                      <Text style={styles.modalCardTitle}>Client</Text>
                    </View>
                    <Text style={styles.modalCardContent}>
                      <Text style={styles.boldText}>Nom:</Text> {selectedPlainte.nomClient}{'\n'}
                      <Text style={styles.boldText}>N°:</Text> {selectedPlainte.numClient || 'N/A'}
                    </Text>
                  </View>
                  
                  <View style={styles.modalCard}>
                    <View style={styles.modalCardHeader}>
                      <FontAwesome name="check-circle" size={16} color="#14b8a6" />
                      <Text style={styles.modalCardTitle}>Vérification</Text>
                    </View>
                    <View style={[
                      styles.verificationBadge, 
                      { 
                        backgroundColor: selectedPlainte.verif === 'OUI' ? '#dcfce7' : '#fee2e2'
                      }
                    ]}>
                      <View style={[
                        styles.verificationDot, 
                        { 
                          backgroundColor: selectedPlainte.verif === 'OUI' ? '#22c55e' : '#ef4444'
                        }
                      ]} />
                      <Text style={[
                        styles.verificationText, 
                        { 
                          color: selectedPlainte.verif === 'OUI' ? '#166534' : '#b91c1c'
                        }
                      ]}>
                        {selectedPlainte.verif || 'NON'}
                      </Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.modalFullCard}>
                  <View style={styles.modalCardHeader}>
                    <FontAwesome name="id-card" size={16} color="#6366f1" />
                    <Text style={styles.modalCardTitle}>Identifiants associés</Text>
                  </View>
                  <View style={styles.idGrid}>
                    <View style={styles.idRow}>
                      <Text style={styles.idLabel}>Citoyen ID:</Text>
                      <Text style={styles.idValue}>{selectedPlainte.citoyenId || 'N/A'}</Text>
                    </View>
                    <View style={styles.idRow}>
                      <Text style={styles.idLabel}>Réclamation:</Text>
                      <Text style={styles.idValue}>{selectedPlainte.reclamationId || 'N/A'}</Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.modalFullCard}>
                  <View style={styles.modalCardHeader}>
                    <FontAwesome name="align-left" size={16} color="#6366f1" />
                    <Text style={styles.modalCardTitle}>Description</Text>
                  </View>
                  <Text style={styles.descriptionText}>
                    {selectedPlainte.descrip || selectedPlainte.Descrip || 'Aucune description fournie'}
                  </Text>
                </View>
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity 
                  style={styles.modalCloseBtn}
                  onPress={closePopup}
                >
                  <FontAwesome name="times" size={16} color="#4b5563" style={{ marginRight: 5 }} />
                  <Text style={styles.modalCloseBtnText}>Fermer</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#3b82f6',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  addButton: {
    backgroundColor: '#3b82f6',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  searchCard: {
    margin: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    paddingBottom: 12,
  },
  searchHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3b82f6',
    marginLeft: 8,
  },
  searchForm: {
    maxHeight: 320,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    overflow: 'hidden',
  },
  picker: {
    flex: 1,
    height: 40,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'space-between',
  },
  datePickerText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    marginLeft: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    marginRight: 12,
  },
  resetButtonText: {
    marginLeft: 8,
    color: '#4b5563',
    fontWeight: '500',
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
  },
  searchButtonText: {
    marginLeft: 8,
    color: '#ffffff',
    fontWeight: '500',
  },
  plaintesContainer: {
    flex: 1,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  plainteItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  plainteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  plainteReference: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  plainteIcon: {
    marginRight: 8,
  },
  plainteReferenceText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  plainteDetails: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    marginRight: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#4b5563',
  },
  verificationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verificationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  verificationText: {
    fontSize: 12,
    fontWeight: '500',
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  detailsButtonText: {
    color: '#ffffff',
    fontWeight: '500',
    marginLeft: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4b5563',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    width: '100%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: '#3b82f6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  modalIdBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  modalIdText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '500',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalBody: {
    padding: 16,
    maxHeight: 400,
  },
  modalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginBottom: 16,
  },
  modalCard: {
    width: '50%',
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  modalCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  modalCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 6,
  },
  modalCardContent: {
    fontSize: 14,
    color: '#4b5563',
    backgroundColor: '#f9fafb',
    padding: 8,
    borderRadius: 6,
  },
  modalFullCard: {
    marginBottom: 16,
  },
  idGrid: {
    backgroundColor: '#f9fafb',
    borderRadius: 6,
    padding: 8,
  },
  idRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  idLabel: {
    width: 100,
    fontSize: 14,
    color: '#6b7280',
  },
  idValue: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  boldText: {
    fontWeight: 'bold',
  },
  descriptionText: {
    fontSize: 14,
    color: '#4b5563',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#d1d5db',
  },
  modalFooter: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalCloseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  modalCloseBtnText: {
    color: '#4b5563',
    fontWeight: '500',
  },
});
