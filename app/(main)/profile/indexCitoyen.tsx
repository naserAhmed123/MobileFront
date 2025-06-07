import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ImageBackground,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

// Type pour les informations du citoyen
interface CitoyenDetails {
  id: string;
  nom: string;
  email: string;
  numTelephone: number;
  carteIdentite: number;
  etatCompte: string;
  etatSauvgarder: string;
  role: string;
}

export default function CitizenProfilePage() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [citoyenDetails, setCitoyenDetails] = useState<CitoyenDetails | null>(null);
  const [statsData, setStatsData] = useState({
    reclamations: 0
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [editForm, setEditForm] = useState({
    nom: '',
    email: '',
    password: ''
  });

  console.log("User data:", user);

  // Récupérer les détails du citoyen
  useEffect(() => {
    const fetchCitoyenDetails = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        console.log("Fetching details for user ID:", user.id);
        
        const citoyenData: CitoyenDetails = {
          id: user.id,
          nom: user.name || "Citoyen",
          email: user.email || "Non spécifié",
          numTelephone: user.numTel || 0,
          carteIdentite: user.carteIdentite || 0,
          etatCompte: user.etatCompte || "NON_BLOQUER",
          etatSauvgarder: user.etatSauvgarder || "NON_ARCHIVER",
          role: user.role || "CITOYEN",
        };
        setCitoyenDetails(citoyenData);
        setEditForm({
          nom: citoyenData.nom,
          email: citoyenData.email,
          password: ''
        });

        await fetchStats();
      } catch (error) {
        console.error("Erreur lors de la récupération des données:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCitoyenDetails();
  }, [user]);
  
  // Fonction pour récupérer les statistiques
  const fetchStats = async () => {
    if (!user) return;
    
    try {
      let reclamationsCount = 0;
      if (user.id) {
        const reclamationsResponse = await fetch(`http://localhost:8080/reclamations/reclamations/citoyen/${user.id}`);
        if (reclamationsResponse.ok) {
          const reclamationsData = await reclamationsResponse.json();
          reclamationsCount = reclamationsData.length;
        }
      }
      
      setStatsData({
        reclamations: reclamationsCount
      });
    } catch (error) {
      console.error("Erreur lors du chargement des statistiques:", error);
    }
  };

  // Fonction pour gérer la mise à jour des informations
  const handleUpdateProfile = async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(`http://localhost:8080/api/citoyens/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nom: editForm.nom,
          email: editForm.email,
          password: editForm.password || undefined 
        }),
      });

      if (response.ok) {
        const updatedCitoyen = await response.json();
        setCitoyenDetails(prev => ({
          ...prev!,
          nom: updatedCitoyen.name || prev!.nom,
          email: updatedCitoyen.email || prev!.email
        }));
        setModalVisible(false);
        Alert.alert('Succès', 'Vos informations ont été mises à jour.');
      } else if (response.status === 404) {
        Alert.alert('Erreur', 'Utilisateur non trouvé.');
      } else {
        const errorData = await response.json();
        Alert.alert('Erreur', errorData.message || 'Une erreur s\'est produite lors de la mise à jour.');
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      Alert.alert('Erreur', 'Impossible de se connecter au serveur.');
    }
  };

  // Récupérer les initiales du nom
  const getInitials = (name?: string) => {
    if (!name) return "C";
    
    const parts = name.split(' ');
    if (parts.length > 1) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    
    return name.substring(0, 2).toUpperCase();
  };

  // Fonction de navigation en arrière
  const handleGoBack = () => {
    router.replace('/(main)/homeCitoyen');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1e40af" />
        <Text style={styles.loadingText}>Chargement du profil...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Modal for editing profile */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Modifier le profil</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Nom</Text>
              <TextInput
                style={styles.input}
                value={editForm.nom}
                onChangeText={(text) => setEditForm({ ...editForm, nom: text })}
                placeholder="Entrez votre nom"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                value={editForm.email}
                onChangeText={(text) => setEditForm({ ...editForm, email: text })}
                placeholder="Entrez votre email"
                keyboardType="email-address"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Mot de passe</Text>
              <TextInput
                style={styles.input}
                value={editForm.password}
                onChangeText={(text) => setEditForm({ ...editForm, password: text })}
                placeholder="Entrez un nouveau mot de passe"
                secureTextEntry
              />
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleUpdateProfile}
              >
                <Text style={styles.modalButtonText}>Enregistrer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Header */}
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80' }}
        style={styles.headerBackground}
        imageStyle={styles.headerBackgroundImage}
      >
        <LinearGradient
          colors={['rgba(30, 64, 175, 0.8)', 'rgba(30, 64, 175, 0.9)']}
          style={styles.headerGradient}
        >
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleGoBack}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setModalVisible(true)}
            >
              <MaterialIcons name="edit" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.headerContent}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {getInitials(citoyenDetails?.nom)}
                </Text>
              </View>
            </View>
            
            <Text style={styles.name}>{citoyenDetails?.nom || "Citoyen"}</Text>
            <Text style={styles.role}>Citoyen • STEG</Text>
          </View>
        </LinearGradient>
      </ImageBackground>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <TouchableOpacity 
            style={styles.statCard}
            onPress={() => router.push('/(main)/reclamations')}
          >
            <Text style={styles.statNumber}>{statsData.reclamations}</Text>
            <Text style={styles.statLabel}>Réclamations</Text>
          </TouchableOpacity>
        </View>
        
        {/* Information Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Informations personnelles</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <MaterialIcons name="email" size={20} color="#3b82f6" />
              </View>
              <View>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{citoyenDetails?.email || "Non spécifié"}</Text>
              </View>
            </View>
            
            <View style={styles.separator} />
            
            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <MaterialIcons name="phone" size={20} color="#3b82f6" />
              </View>
              <View>
                <Text style={styles.infoLabel}>Identificateur de citoyen</Text>
                <Text style={styles.infoValue}>{citoyenDetails?.id || "Non spécifié"}</Text>
              </View>
            </View>
            
            <View style={styles.separator} />
            
            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <MaterialIcons name="credit-card" size={20} color="#3b82f6" />
              </View>
              <View>
                <Text style={styles.infoLabel}>Carte d'identité</Text>
                <Text style={styles.infoValue}>{citoyenDetails?.carteIdentite || "Non spécifié"}</Text>
              </View>
            </View>
          </View>
        </View>
        
        {/* Citizen Specific Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Informations du compte</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <MaterialIcons name="verified-user" size={20} color="#3b82f6" />
              </View>
              <View>
                <Text style={styles.infoLabel}>État du compte</Text>
                <Text style={styles.infoValue}>{citoyenDetails?.etatCompte || "Non spécifié"}</Text>
              </View>
            </View>
            
            <View style={styles.separator} />
            
            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <MaterialIcons name="archive" size={20} color="#3b82f6" />
              </View>
              <View>
                <Text style={styles.infoLabel}>État d'archivage</Text>
                <Text style={styles.infoValue}>{citoyenDetails?.etatSauvgarder || "Non spécifié"}</Text>
              </View>
            </View>
          </View>
        </View>
        
        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={logout}
        >
          <MaterialIcons name="logout" size={20} color="#fff" />
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>© {new Date().getFullYear()} STEG Mobile App</Text>
          <Text style={styles.footerVersion}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#1e40af',
  },
  headerBackground: {
    height: 240,
  },
  headerBackgroundImage: {
    opacity: 0.7,
  },
  headerGradient: {
    height: '100%',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 10,
  },
  role: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    marginTop: -30,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    width: width / 2,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 5,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  infoValue: {
    fontSize: 16,
    color: '#334155',
    fontWeight: '500',
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 2,
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    marginTop: 20,
    marginBottom: 20,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  footerText: {
    fontSize: 14,
    color: '#94a3b8',
  },
  footerVersion: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    width: width * 0.9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    color: '#334155',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#94a3b8',
  },
  saveButton: {
    backgroundColor: '#3b82f6',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});