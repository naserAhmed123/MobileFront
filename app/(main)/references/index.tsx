import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useAuth } from '../../context/AuthContext';

// Fonction utilitaire pour afficher des notifications sur toutes les plateformes
const showToast = (message: string, duration: 'SHORT' | 'LONG' = 'SHORT') => {
  if (Platform.OS === 'android') {
    // Utiliser ToastAndroid uniquement sur Android
    const { ToastAndroid } = require('react-native');
    ToastAndroid.show(
      message,
      duration === 'SHORT' ? ToastAndroid.SHORT : ToastAndroid.LONG
    );
  } else if (Platform.OS === 'ios') {
    // Sur iOS, on pourrait utiliser une autre solution
    Alert.alert('Information', message);
  } else {
    // Sur le web ou autres plateformes
    console.log(message);
    // Optionnel: afficher une alerte pour le web
    if (typeof window !== 'undefined') {
      alert(message);
    }
  }
};

function parseJwt(token: string | null) {
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    
    // Adaptation pour React Native qui n'a pas atob nativement
    let jsonPayload;
    if (typeof window !== 'undefined' && window.atob) {
      // Web
      jsonPayload = decodeURIComponent(
        window.atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
    } else {
      // React Native - utiliser une méthode alternative pour le décodage base64
      const base64js = require('base64-js');
      const utf8Decoder = new TextDecoder('utf-8');
      
      // Convertir la chaîne base64 en tableau d'octets
      const binaryString = base64.replace(/[-_]/g, (m) => m === '-' ? '+' : '/');
      const paddedString = binaryString + '==='.slice(0, (4 - binaryString.length % 4) % 4);
      const byteArray = base64js.toByteArray(paddedString);
      
      // Décoder le tableau d'octets en chaîne UTF-8
      jsonPayload = utf8Decoder.decode(byteArray);
    }
    
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Erreur lors du décodage du token:', e);
    showToast('Problème avec votre session. Veuillez vous reconnecter.', 'LONG');
    return null;
  }
}

export default function ReferencesPage() {
  const { authState, user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState({
    id: '',
    nom: '',
    numTelephone: '',
    carteIdentite: '',
    role: '',
  });
  const [references, setReferences] = useState<number[]>([]);
  const [reclamations, setReclamations] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    newReference: '',
  });
  const [editReference, setEditReference] = useState<number | null>(null);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmMessage, setConfirmMessage] = useState('');

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

        const response = await fetch(`http://localhost:8080/api/utilisateur/${email}`, {
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
          numTelephone: userData.numTelephone || '',
          carteIdentite: userData.carteIdentite || '',
          role: userData.role || '',
        });
        showToast('Données utilisateur chargées avec succès', 'SHORT');
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
    const fetchReferences = async () => {
      if (!userData.id) return;
      try {
        const token = authState.userToken;
        const response = await fetch(`http://localhost:8080/api/citoyens/${userData.id}/references`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (!response.ok) {
          throw new Error(`Échec de la récupération des références: ${response.status}`);
        }
        
        const data = await response.json();
        setReferences(data);
        
        if (data.length === 0) {
          showToast('Aucune référence trouvée pour ce citoyen.', 'LONG');
        }
      } catch (err: any) {
        console.error('Erreur lors de la récupération des références:', err);
        showToast(`Erreur: ${err.message}`, 'LONG');
      }
    };

    const fetchReclamations = async () => {
      if (!userData.id) return;
      try {
        const token = authState.userToken;
        const response = await fetch(`http://localhost:8080/reclamations/reclamations/citoyen/${userData.id}`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (!response.ok) {
          throw new Error(`Échec de la récupération des réclamations: ${response.status}`);
        }
        
        const data = await response.json();
        setReclamations(data);
      } catch (err: any) {
        console.error('Erreur lors de la récupération des réclamations:', err);
        showToast(`Erreur: ${err.message}`, 'LONG');
      }
    };

    fetchReferences();
    fetchReclamations();
  }, [userData.id, authState.userToken]);

  const handleInputChange = (value: string) => {
    setFormData({
      ...formData,
      newReference: value,
    });
  };

  const validateReference = (ref: string, oldRef?: number) => {
    const refStr = ref.toString();
    if (refStr.length !== 8) return 'La référence doit contenir exactement 8 chiffres';
    if (!/^\d+$/.test(refStr)) return 'La référence doit être un nombre';
    
    const refNumber = parseInt(refStr, 10);
    if (references.includes(refNumber) && refNumber !== oldRef) {
      return 'Cette référence existe déjà';
    }
    
    if (oldRef && reclamations.some((rec) => rec.reference === oldRef)) {
      return 'Cette référence est utilisée dans une réclamation et ne peut pas être modifiée';
    }
    
    return null;
  };

  const AffecterRue = (ref: string) => {
    const refStr = ref.toString();
    if (refStr.length !== 8) {
      return 'cas1';
    }

    const les5 = parseInt(refStr.substring(0, 5), 10);

    if (les5 > 72806 && les5 < 73392) {
      return 'GREMDA';
    } else if (les5 > 73432 && les5 < 73588) {
      return 'LAFRANE';
    } else if (les5 > 73590 && les5 < 73922) {
      return 'ELAIN';
    } else if (les5 > 73924 && les5 < 74208) {
      return 'MANZEL_CHAKER';
    } else if (les5 > 74252 && les5 < 74348) {
      return 'MATAR';
    } else if (les5 > 74386 && les5 < 74405) {
      return 'SOKRA_MHARZA';
    } else if (les5 > 74405 && les5 < 74700) {
      return 'GABES';
    }
    return null;
  };

  const handleAddSubmit = async () => {
    const newReference = formData.newReference.trim();
    
    if (AffecterRue(newReference) === null) {
      showToast("La référence n'est pas enregistrée ou disponible dans Sfax Sud", 'LONG');
      return;
    }
    
    const validationError = validateReference(newReference);
    if (validationError) {
      showToast(validationError, 'LONG');
      return;
    }

    try {
      setLoading(true);
      const token = authState.userToken;
      const response = await fetch(`http://localhost:8080/api/citoyens/${userData.id}/references`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(parseInt(newReference, 10)),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `HTTP error! status: ${response.status}`);
      }

      const updatedCitoyen = await response.json();
      setReferences(updatedCitoyen.references || [...references, parseInt(newReference, 10)]);
      setFormData({ newReference: '' });
      setShowModal(false);
      showToast('Référence ajoutée avec succès !', 'SHORT');
    } catch (err: any) {
      console.error("Erreur lors de l'ajout de la référence:", err);
      showToast(`Erreur: ${err.message}`, 'LONG');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (reference: number) => {
    setEditReference(reference);
    setFormData({ newReference: reference.toString() });
    setShowEditModal(true);
  };

  const handleEditSubmit = async () => {
    if (!editReference) return;
    
    const newReference = formData.newReference.trim();
    const validationError = validateReference(newReference, editReference);
    if (validationError) {
      showToast(validationError, 'LONG');
      return;
    }

    const updatedReferences = references.map((ref) =>
      ref === editReference ? parseInt(newReference, 10) : ref
    );

    const confirmEdit = async () => {
      try {
        setLoading(true);
        const token = authState.userToken;
        const response = await fetch(`http://localhost:8080/api/citoyens/${userData.id}/references`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updatedReferences),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || `HTTP error! status: ${response.status}`);
        }

        const updatedCitoyen = await response.json();
        setReferences(updatedCitoyen.references || updatedReferences);
        setShowEditModal(false);
        setEditReference(null);
        setFormData({ newReference: '' });
        showToast('Référence modifiée avec succès !', 'SHORT');
      } catch (err: any) {
        console.error("Erreur lors de la modification de la référence:", err);
        showToast(`Erreur: ${err.message}`, 'LONG');
      } finally {
        setLoading(false);
        setShowConfirmModal(false);
      }
    };

    setConfirmAction(() => confirmEdit);
    setConfirmMessage(`Voulez-vous vraiment modifier la référence ${editReference} en ${newReference} ?`);
    setShowConfirmModal(true);
  };

  const renderItem = ({ item }: { item: number }) => (
    <View style={styles.referenceCard}>
      <Text style={styles.referenceNumber}>{item}</Text>
      <TouchableOpacity 
        style={styles.editButton}
        onPress={() => handleEdit(item)}
      >
        <MaterialIcons name="edit" size={20} color="#3b82f6" />
      </TouchableOpacity>
    </View>
  );

  if (loading && !references.length) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Chargement des données...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      
      <View style={styles.container}>
        <Animated.View 
          entering={FadeIn.duration(300)}
          style={styles.header}
        >
          <TouchableOpacity onPress={() => router.push('/(main)/homeCitoyen')} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#3b82f6" />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Mes Références</Text>
            <Text style={styles.subtitle}>Gérez vos références STEG</Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowModal(true)}
              disabled={loading}
            >
              <MaterialIcons name="add" size={24} color="#fff" />
            </TouchableOpacity>
     
          </View>
        </Animated.View>

        <View style={styles.infoCard}>
          <MaterialIcons name="info-outline" size={20} color="#3b82f6" />
          <Text style={styles.infoText}>
            Chaque référence doit être un numéro unique de 8 chiffres. Les références utilisées dans des réclamations ne peuvent pas être modifiées.
          </Text>
        </View>

        {references.length > 0 ? (
          <FlatList
            data={references}
            renderItem={renderItem}
            keyExtractor={(item) => item.toString()}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="search-off" size={60} color="#cbd5e1" />
            <Text style={styles.emptyText}>Aucune référence trouvée</Text>
            <Text style={styles.emptySubtext}>
              Ajoutez une nouvelle référence en appuyant sur le bouton +
            </Text>
          </View>
        )}
      </View>

      {/* Modal d'ajout de référence */}
      <Modal
        visible={showModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ajouter une Référence</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <MaterialIcons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Nouvelle Référence</Text>
              <TextInput
                style={styles.input}
                placeholder="Entrez une référence (8 chiffres)"
                keyboardType="numeric"
                value={formData.newReference}
                onChangeText={handleInputChange}
                maxLength={8}
              />
              
              <View style={styles.modalFooter}>
                <TouchableOpacity 
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => {
                    setShowModal(false);
                    setFormData({ newReference: '' });
                  }}
                >
                  <Text style={styles.cancelButtonText}>Annuler</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.button, styles.submitButton, loading && styles.disabledButton]}
                  onPress={handleAddSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.submitButtonText}>Ajouter</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de modification de référence */}
      <Modal
        visible={showEditModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Modifier la Référence</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <MaterialIcons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Nouvelle Référence</Text>
              <TextInput
                style={styles.input}
                placeholder="Entrez une référence (8 chiffres)"
                keyboardType="numeric"
                value={formData.newReference}
                onChangeText={handleInputChange}
                maxLength={8}
              />
              
              <View style={styles.modalFooter}>
                <TouchableOpacity 
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => {
                    setShowEditModal(false);
                    setEditReference(null);
                    setFormData({ newReference: '' });
                  }}
                >
                  <Text style={styles.cancelButtonText}>Annuler</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.button, styles.submitButton, loading && styles.disabledButton]}
                  onPress={handleEditSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.submitButtonText}>Modifier</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de confirmation */}
      <Modal
        visible={showConfirmModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Confirmation</Text>
              <TouchableOpacity onPress={() => setShowConfirmModal(false)}>
                <MaterialIcons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.confirmText}>{confirmMessage}</Text>
              
              <View style={styles.modalFooter}>
                <TouchableOpacity 
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => {
                    setShowConfirmModal(false);
                    setConfirmAction(null);
                    setConfirmMessage('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Annuler</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.button, styles.submitButton]}
                  onPress={() => {
                    if (confirmAction) confirmAction();
                  }}
                >
                  <Text style={styles.submitButtonText}>Confirmer</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    padding: 16,
  },
  titleContainer: {
    flex: 1,
    marginLeft: 8, // Espacement entre le bouton back et le texte
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  headerButtons: {
    flexDirection: 'row', // Aligner les boutons horizontalement
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginLeft: 8, // Espacement entre les boutons
  },
  aloButton: {
    backgroundColor: '#10b981', // Couleur différente pour le bouton Alo (vert émeraude)
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#e0f2fe',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: '#1e40af',
    lineHeight: 18,
  },
  listContainer: {
    paddingBottom: 20,
  },
  referenceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  referenceNumber: {
    fontSize: 16,
    fontWeight: '500',
    color: '#334155',
  },
  editButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#64748b',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
  },
  modalBody: {
    padding: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#334155',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#334155',
    backgroundColor: '#f8fafc',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 24,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f1f5f9',
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#3b82f6',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  disabledButton: {
    opacity: 0.7,
  },
  confirmText: {
    fontSize: 14,
    color: '#334155',
    marginBottom: 16,
  },
});