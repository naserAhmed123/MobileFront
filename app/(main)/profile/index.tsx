import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  ImageBackground,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

// Type pour les informations du technicien
interface TechnicienDetails {
  id: number;
  nom: string;  // Renommé de name à nom
  email: string;
  equipe: number;
  equipeNom?: string;
  travail: string;
  numTel?: number;  // Changé en number car c'est un numéro de téléphone
  adresse?: string;
  carteIdentite?: string;
  con?: string;     // État du compte
  etatSauvgarder?: string;
  motDePasse?: string;
  photo?: string;
  dateEmbauche?: string;
  specialite?: string;
}

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [technicienDetails, setTechnicienDetails] = useState<TechnicienDetails | null>(null);
  const [statsData, setStatsData] = useState({
    interventions: 0,
    rapports: 0,
    materiels: 0
  });

  console.log("User data:", user);

  // Récupérer les détails du technicien
  useEffect(() => {
    const fetchTechnicienDetails = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        console.log("Fetching details for user ID:", user.id);
        
        // Récupérer les statistiques
        await fetchStats();
      } catch (error) {
        console.error("Erreur lors de la récupération des données:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTechnicienDetails();
  }, [user]);
  
  // Fonction pour récupérer les statistiques
  const fetchStats = async () => {
    if (!user) return;
    
    try {
      // Récupérer le nombre d'interventions (réclamations) pour l'équipe
      let interventionsCount = 0;
      if (user.equipe) {
        const interventionsResponse = await fetch(`http://localhost:8080/reclamations/${user.equipe}/equipe`);
        if (interventionsResponse.ok) {
          const interventionsData = await interventionsResponse.json();
          interventionsCount = interventionsData.length;
        }
      }
      
      // Récupérer le nombre de rapports du technicien
      let rapportsCount = 0;
      if (user.id) {
        const rapportsResponse = await fetch(`http://localhost:8080/api/rapports/technicien/${user.id}`);
        if (rapportsResponse.ok) {
          const rapportsData = await rapportsResponse.json();
          rapportsCount = rapportsData.length;
        }
      }
      
      setStatsData({
        interventions: interventionsCount,
        rapports: rapportsCount,
        materiels: 0
      });
    } catch (error) {
      console.error("Erreur lors du chargement des statistiques:", error);
    }
  };

  // Formater la date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Non spécifié";
    
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };
  
  // Fonction de navigation en arrière
  const handleGoBack = () => {
    router.replace('/(main)/homeTechnicien');
  };

  // Récupérer les initiales du nom
  const getInitials = (name?: string) => {
    if (!name) return "T";
    
    const parts = name.split(' ');
    if (parts.length > 1) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    
    return name.substring(0, 2).toUpperCase();
  };
  
  // Obtenir le statut de travail
  const getWorkStatus = (status?: string) => {
    if (!status) return { text: "Inconnu", color: "#9ca3af" };
    
    switch (status) {
      case "ENCOURS":
        return { text: "En service", color: "#10b981" }; // vert
      case "QUITTER":
        return { text: "Hors service", color: "#ef4444" }; // rouge
      default:
        return { text: status, color: "#9ca3af" }; // gris
    }
  };
  
  const workStatus = getWorkStatus(user?.travail || technicienDetails?.travail);

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
      {/* Header */}
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80' }}
        style={styles.headerBackground}
        imageStyle={styles.headerBackgroundImage}
      >
        <LinearGradient
          colors={['rgba(30, 64, 175, 0.8)', 'rgba(30, 64, 175, 0.9)']}
          style={styles.headerGradient}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleGoBack}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {getInitials(user?.name)}
                </Text>
              </View>
              
              <View style={[
                styles.statusIndicator,
                { backgroundColor: workStatus.color }
              ]} />
            </View>
            
            <Text style={styles.name}>{user?.name || "Technicien"}</Text>
            <Text style={styles.role}>Technicien • STEG</Text>
            
            <View style={styles.statusBadge}>
              <View style={[styles.statusDot, { backgroundColor: workStatus.color }]} />
              <Text style={styles.statusText}>{workStatus.text}</Text>
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <TouchableOpacity 
            style={styles.statCard} 
            onPress={() => router.push('/(main)/interventions')}
          >
            <Text style={styles.statNumber}>{statsData.interventions}</Text>
            <Text style={styles.statLabel}>Interventions</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.statCard}
            onPress={() => router.push('/(main)/rapports')}
          >
            <Text style={styles.statNumber}>{statsData.rapports}</Text>
            <Text style={styles.statLabel}>Rapports</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.statCard}
            onPress={() => router.push('/(main)/materielTechnicien')}
          >
            <Text style={styles.statNumber}>{user?.con === "ACTIF" ? "Actif" : "Inactif"}</Text>
            <Text style={styles.statLabel}>État</Text>
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
                <Text style={styles.infoValue}>{user?.email || "Non spécifié"}</Text>
              </View>
            </View>
            
            <View style={styles.separator} />
            
            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <MaterialIcons name="phone" size={20} color="#3b82f6" />
              </View>
              <View>
                <Text style={styles.infoLabel}>Téléphone</Text>
                <Text style={styles.infoValue}>{user?.numTel || "Non spécifié"}</Text>
              </View>
            </View>
            
            <View style={styles.separator} />
            
            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <MaterialIcons name="location-on" size={20} color="#3b82f6" />
              </View>
              <View>
                <Text style={styles.infoLabel}>Adresse</Text>
                <Text style={styles.infoValue}>{technicienDetails?.adresse || "Non spécifié"}</Text>
              </View>
            </View>

            <View style={styles.separator} />
            
            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <MaterialIcons name="credit-card" size={20} color="#3b82f6" />
              </View>
              <View>
                <Text style={styles.infoLabel}>Carte d'identité</Text>
                <Text style={styles.infoValue}>{user?.carteIdentite || "Non spécifié"}</Text>
              </View>
            </View>
          </View>
        </View>
        
        {/* Professional Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Informations professionnelles</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <MaterialIcons name="people" size={20} color="#3b82f6" />
              </View>
              <View>
                <Text style={styles.infoLabel}>Équipe</Text>
                <Text style={styles.infoValue}>
                  {`Équipe ${user?.equipe || "Non assignée"}`}
                </Text>
              </View>
            </View>
            
            <View style={styles.separator} />
            
            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <MaterialIcons name="engineering" size={20} color="#3b82f6" />
              </View>
              <View>
                <Text style={styles.infoLabel}>Spécialité</Text>
                <Text style={styles.infoValue}>{user?.role === "technicien" ? "Technicien" : user?.role || "Non spécifié"}</Text>
              </View>
            </View>
            
            <View style={styles.separator} />
            
            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <MaterialIcons name="date-range" size={20} color="#3b82f6" />
              </View>
              <View>
                <Text style={styles.infoLabel}>Date d'embauche</Text>
                <Text style={styles.infoValue}>{formatDate(technicienDetails?.dateEmbauche)}</Text>
              </View>
            </View>

            <View style={styles.separator} />
            
            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <MaterialIcons name="work" size={20} color="#3b82f6" />
              </View>
              <View>
                <Text style={styles.infoLabel}>État du travail</Text>
                <Text style={styles.infoValue}>{user?.travail === "ENCOURS" ? "En cours" : user?.travail || "Non spécifié"}</Text>
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
    marginTop: 10,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: '#fff',
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
  statusIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 3,
    borderColor: '#fff',
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
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 10,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    marginTop: -30,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    width: width / 3.5,
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
    marginTop: 10,
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
});