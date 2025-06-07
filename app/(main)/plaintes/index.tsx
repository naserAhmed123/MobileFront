import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';

interface User {
  id: string;
  nom: string;
  carteIdentite: string;
  role: string;
  con: string;
}

interface Reclamation {
  id: number;
  reference: string;
  etat: string;
  numClient: string;
  typePanne: string;
}

interface FormData {
  referenceRec: string;
  etatRef: string;
  numClient: string;
  nomClient: string;
  reclamationId: string;
  datePlainte: string;
  description: string;
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

const verifierConnexionReseau = () => {
  return true; 
};

export default function PlaintesPage() {
  const { authState, user: authUser } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    referenceRec: '',
    etatRef: '',
    numClient: '',
    nomClient: '',
    reclamationId: '',
    datePlainte: new Date().toISOString(),
    description: '',
  });
  const [reclamations, setReclamations] = useState<Reclamation[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      if (!verifierConnexionReseau()) {
        setError('Aucune connexion réseau détectée');
        showToast('Veuillez vérifier votre connexion Internet', 'LONG');
        return;
      }

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

        const response = await fetch(`http://localhost:8080/api/utilisateur/${email}`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Échec de la récupération de l'utilisateur: ${response.status} ${response.statusText}`);
        }

        const fetchedUser: User = await response.json();
        setUser(fetchedUser);
        setFormData(prev => ({
          ...prev,
          nomClient: fetchedUser.nom || '',
        }));
      } catch (err: any) {
        console.error("Erreur lors de la récupération de l'utilisateur:", err);
        setError(err.message);
        showToast(`Erreur: ${err.message}`, 'LONG');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [authState.userToken]);

  useEffect(() => {
    if (!user?.id) return;

    const fetchReclamations = async () => {
      if (!verifierConnexionReseau()) {
        showToast('Veuillez vérifier votre connexion Internet', 'LONG');
        return;
      }

      try {
        setLoading(true);
        const token = authState.userToken;
        const response = await fetch(
          `http://localhost:8080/reclamations/reclamations/citoyen/${user.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const data: Reclamation[] = await response.json();

        const filteredReclamations = data.filter(
          (rec) => rec.etat !== 'CLOTURE' && rec.etat !== 'RESOLUE'
        );

        setReclamations(filteredReclamations);
      } catch (error: any) {
        showToast('Erreur lors du chargement des réclamations', 'LONG');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchReclamations();
  }, [user?.id, authState.userToken]);

  const handleReclamationChange = (itemValue: string) => {
    setFormData(prev => ({ ...prev, reclamationId: itemValue }));

    if (itemValue) {
      const selectedReclamation = reclamations.find((rec) => rec.id.toString() === itemValue);
      if (selectedReclamation) {
        setFormData(prev => ({
          ...prev,
          referenceRec: selectedReclamation.reference?.toString() || '',
          etatRef: selectedReclamation.etat || '',
          numClient: selectedReclamation.numClient || '',
        }));
      }
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData(prev => ({ ...prev, datePlainte: selectedDate.toISOString() }));
    }
  };

  const handleSubmit = () => {
    if (!formData.reclamationId || !formData.description) {
      showToast('Veuillez remplir tous les champs obligatoires', 'LONG');
      return;
    }
    setIsModalOpen(true);
  };

  const confirmSubmit = async () => {
    try {
      setLoading(true);
      const token = authState.userToken;

      const plainteData = {
        referenceRec: formData.referenceRec,
        etatRef: formData.etatRef,
        datePlainte: new Date().toISOString(),
        numClient: parseInt(formData.numClient),
        nomClient: formData.nomClient,
        Descrip: formData.description,
        citoyenId: user?.id,
        reclamationId: parseInt(formData.reclamationId),
        verif: "NON"
      };

      const response = await fetch('http://localhost:8080/api/plaintes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(plainteData),
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      showToast('Plainte soumise avec succès !', 'LONG');
      setFormData({
        referenceRec: '',
        etatRef: '',
        numClient: '',
        nomClient: user?.nom || '',
        reclamationId: '',
        datePlainte: new Date().toISOString(),
        description: '',
      });
    } catch (error: any) {
      showToast(`Erreur lors de la soumission: ${error.message}`, 'LONG');
      console.error('Erreur de soumission:', error);
    } finally {
      setLoading(false);
      setIsModalOpen(false);
    }
  };

  const navigateToHomeCitoyen = () => {
    router.push('/homeCitoyen');
  };

  if (loading && !user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (error && !user) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Erreur: {error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={navigateToHomeCitoyen}
          >
            <Ionicons name="arrow-back" size={24} color="#3b82f6" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>Formulaire de Plainte</Text>
            <Text style={styles.subtitle}>Déposez votre plainte concernant une réclamation</Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Sélectionner une Réclamation</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.reclamationId}
              onValueChange={handleReclamationChange}
              style={styles.picker}
              mode="dropdown"
            >
              <Picker.Item label="Choisir une réclamation" value="" />
              {reclamations.map((rec) => (
                <Picker.Item 
                  key={rec.id.toString()} 
                  label={`Réf: ${rec.reference || 'N/A'} - Type: ${rec.typePanne || 'N/A'}`} 
                  value={rec.id.toString()} 
                />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Référence Réclamation</Text>
          <TextInput
            style={styles.input}
            value={formData.referenceRec}
            editable={false}
            placeholder="Référence de la réclamation"
            placeholderTextColor="#9ca3af"
          />
          <Text style={styles.helperText}>
            Référence automatiquement chargée depuis la réclamation sélectionnée
          </Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>État Actuel</Text>
          <TextInput
            style={styles.input}
            value={formData.etatRef}
            editable={false}
            placeholder="État de la réclamation"
            placeholderTextColor="#9ca3af"
          />
          <Text style={styles.helperText}>État actuel de la réclamation</Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Numéro Client</Text>
          <TextInput
            style={styles.input}
            value={formData.numClient}
            onChangeText={(text) => setFormData(prev => ({ ...prev, numClient: text }))}
            placeholder="Votre numéro client"
            placeholderTextColor="#9ca3af"
            keyboardType="numeric"
          />
          <Text style={styles.helperText}>Tu peux le changer si nécessaire</Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Nom Client</Text>
          <TextInput
            style={styles.input}
            value={formData.nomClient}
            onChangeText={(text) => setFormData(prev => ({ ...prev, nomClient: text }))}
            placeholder="Votre nom"
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Description de la Plainte</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.description}
            onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
            placeholder="Veuillez décrire votre plainte en détail..."
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          <Text style={styles.helperText}>
            Fournissez tous les détails pertinents concernant votre plainte
          </Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Date de la Plainte</Text>
          <TouchableOpacity 
            style={styles.datePickerButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.datePickerButtonText}>
              {new Date(formData.datePlainte).toLocaleString()}
            </Text>
            <Ionicons name="calendar-outline" size={20} color="#3b82f6" />
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={new Date(formData.datePlainte)}
              mode="datetime"
              display="default"
              onChange={handleDateChange}
            />
          )}
        </View>

        <TouchableOpacity 
          style={styles.submitButton} 
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.submitButtonText}>Soumettre la Plainte</Text>
          )}
        </TouchableOpacity>
      </View>

      <Modal
        visible={isModalOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirmer la soumission</Text>
            <Text style={styles.modalText}>
              Êtes-vous sûr de vouloir soumettre cette plainte ?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => setIsModalOpen(false)}
              >
                <Text style={styles.modalCancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalConfirmButton}
                onPress={confirmSubmit}
              >
                <Text style={styles.modalConfirmButtonText}>Confirmer</Text>
              </TouchableOpacity>
            </View>
          </View>
    </View>
      </Modal>
    </ScrollView>
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
  },
  header: {
    padding: 20,
    paddingTop: 40,
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
    color: '#3b82f6', // blue-500
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    margin: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  textArea: {
    minHeight: 100,
  },
  helperText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  pickerContainer: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  datePickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
  },
  datePickerButtonText: {
    fontSize: 16,
    color: '#1f2937',
  },
  submitButton: {
    backgroundColor: '#3b82f6', // blue-500
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  modalText: {
    fontSize: 16,
    color: '#4b5563',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalCancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#e5e7eb',
    marginRight: 12,
  },
  modalCancelButtonText: {
    color: '#4b5563',
    fontWeight: '500',
  },
  modalConfirmButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#3b82f6', // blue-500
  },
  modalConfirmButtonText: {
    color: '#ffffff',
    fontWeight: '500',
  },
}); 