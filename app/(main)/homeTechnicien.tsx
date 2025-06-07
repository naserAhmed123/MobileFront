import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Dimensions, Image, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ROUTES } from '../constants/routes';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

// Définir les types pour les éléments de menu
interface MenuItem {
  title: string;
  icon: React.ReactNode;
  route: string;
  color: string;
}

// Type pour les notifications
interface Notification {
  id: number;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  type: 'RECLAMATION' | 'INFORMATION' | 'ALERTE';
  reclamationId?: number;
  reference?: string;
}

// Type pour les réclamations
interface Reclamation {
  id: number;
  reference: string;
  dateCreation: string;
  status: string;
  description: string;
  // autres propriétés selon votre API
}

// Clés pour AsyncStorage
const NOTIFICATIONS_KEY = 'notifications_data';
const UNREAD_COUNT_KEY = 'unread_notifications_count';

export default function HomeTechnicien() {
  const { user, logout } = useAuth();
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

  // Charger les notifications et le compteur
  useEffect(() => {
    const loadData = async () => {
      try {
        // Charger les notifications
        const storedNotifications = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
        if (storedNotifications) {
          const parsedNotifications = JSON.parse(storedNotifications);
          setNotifications(parsedNotifications);
        }
        
        // Charger le compteur de notifications non lues
        const storedCount = await AsyncStorage.getItem(UNREAD_COUNT_KEY);
        if (storedCount) {
          setUnreadNotifications(parseInt(storedCount, 10));
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      }
    };
    
    loadData();
    
    // Configurer un intervalle pour vérifier régulièrement le compteur
    const countCheckInterval = setInterval(async () => {
      try {
        const storedCount = await AsyncStorage.getItem(UNREAD_COUNT_KEY);
        if (storedCount) {
          const count = parseInt(storedCount, 10);
          setUnreadNotifications(count);
        }
      } catch (error) {
        console.error('Erreur lors de la vérification du compteur:', error);
      }
    }, 5000); // Vérifier toutes les 5 secondes
    
    return () => {
      clearInterval(countCheckInterval);
    };
  }, []);

  // Vérifier les notifications au démarrage
  useEffect(() => {
    checkForNotifications();
    
    // Configurer une vérification périodique des notifications
    const intervalId = setInterval(() => {
      checkForNotifications();
    }, 30000); // Vérifier toutes les 30 secondes
    
    // Nettoyage
    return () => {
      clearInterval(intervalId);
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  // Jouer le son de notification
  const playNotificationSound = async () => {
    try {
      console.log("Lecture du son de notification dans homeTechnicien");
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: 'https://assets.mixkit.co/sfx/preview/mixkit-software-interface-start-2574.mp3' },
        { shouldPlay: true }
      );
      setSound(newSound);
    } catch (error) {
      console.error('Erreur lors de la lecture du son de notification:', error);
    }
  };

  // Vérifier s'il y a de nouvelles notifications
  const checkForNotifications = async () => {
    try {
      if (!user?.equipe) {
        console.log("ID d'équipe non disponible");
        return;
      }

      const currentTime = Date.now();
      
      // Appel API pour récupérer les réclamations de l'équipe
      const apiUrl = `http://localhost:8080/reclamations/${user.equipe}/equipe`;
      console.log(`Vérification des nouvelles réclamations: ${apiUrl}`);
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`);
      }
      
      const reclamations: Reclamation[] = await response.json();
      console.log(`${reclamations.length} réclamations récupérées dans homeTechnicien`);
      
      // Récupérer les notifications actuelles
      let currentNotifications = [...notifications];
      
      // Obtenir les IDs des réclamations déjà notifiées
      const existingReclamationIds = currentNotifications
        .filter(n => n.reclamationId !== undefined)
        .map(n => n.reclamationId);
      
      // Filtrer pour ne garder que les nouvelles réclamations
      const newReclamations = reclamations.filter(
        recl => !existingReclamationIds.includes(recl.id)
      );
      
      // Si nous avons de nouvelles réclamations
      if (newReclamations.length > 0) {
        console.log(`${newReclamations.length} nouvelles réclamations détectées dans homeTechnicien`);
        
        // Créer des notifications pour les nouvelles réclamations
        const newNotifications = newReclamations.map((recl, index) => ({
          id: Date.now() + index, // Utiliser timestamp + index comme ID temporaire
          title: 'Nouvelle réclamation',
          message: `Une nouvelle réclamation a été assignée à votre équipe (Ref: ${recl.reference})`,
          timestamp: new Date().toISOString(),
          isRead: false,
          type: 'RECLAMATION' as const,
          reclamationId: recl.id,
          reference: recl.reference
        }));
        
        // Mettre à jour les notifications locales
        const updatedNotifications = [...newNotifications, ...currentNotifications];
        setNotifications(updatedNotifications);
        
        // Sauvegarder dans AsyncStorage
        await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updatedNotifications));
        
        // Mettre à jour le compteur de notifications non lues
        const unreadCount = updatedNotifications.filter(n => !n.isRead).length;
        setUnreadNotifications(unreadCount);
        await AsyncStorage.setItem(UNREAD_COUNT_KEY, unreadCount.toString());
        
        // Jouer un son pour les nouvelles notifications
        // Ne jouer le son que si ce n'est pas le premier chargement ET s'il y a de nouvelles réclamations
        if (lastFetchTime > 0 && newReclamations.length > 0) {
          playNotificationSound();
        }
      } else {
        console.log('Aucune nouvelle réclamation détectée dans homeTechnicien');
      }
      
      // Mettre à jour le temps du dernier fetch
      setLastFetchTime(currentTime);
      
    } catch (error) {
      console.error('Erreur lors de la vérification des notifications:', error);
    }
  };

  const menuItems: MenuItem[] = [
    {
      title: 'Mes Interventions',
      icon: <MaterialIcons name="engineering" size={28} color="#fff" />,
      route: ROUTES.INTERVENTIONS,
      color: '#1e40af', // blue-600
    },
    {
      title: 'Mes Rapports',
      icon: <MaterialIcons name="description" size={28} color="#fff" />,
      route: ROUTES.RAPPORTS,
      color: '#3b82f6', // blue-500
    },
    {
      title: 'Matériels',
      icon: <MaterialIcons name="inventory" size={28} color="#fff" />,
      route: ROUTES.MATERIELS,
      color: '#1e40af', // blue-600
    },
    {
      title: 'Mon Profil',
      icon: <FontAwesome5 name="user-cog" size={24} color="#fff" />,
      route: ROUTES.PROFILE,
      color: '#1e40af', // blue-600
    },
  ];

  const handleNavigation = (route: string) => {
    router.push(route as any);
  };

  // Naviguer vers les notifications et réinitialiser le compteur
  const navigateToNotifications = async () => {
    // Naviguer vers la page de notifications
    router.push('/(main)/notifications');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e40af" />
      
      {/* Header avec couleur pleine */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.welcomeText}>
              Bienvenue, {user?.name || 'Technicien'}
            </Text>
            <Text style={styles.roleText}>
              Compte Technicien • STEG
            </Text>
          </View>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.name?.[0] || 'T'}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Dashboard Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>12</Text>
          <Text style={styles.statLabel}>Interventions</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>8</Text>
          <Text style={styles.statLabel}>Rapports</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>3</Text>
          <Text style={styles.statLabel}>Messages</Text>
        </View>
      </View>

      {/* Menu Grid */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Services</Text>
        <View style={styles.menuGrid}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => handleNavigation(item.route)}
            >
              <View
                style={[styles.menuItemContent, { backgroundColor: item.color }]}
              >
                {item.icon}
                <Text style={styles.menuItemText}>{item.title}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Actions rapides</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => router.push(ROUTES.PLANNING)}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#3b82f6' }]}>
              <Ionicons name="calendar" size={20} color="#fff" />
            </View>
            <Text style={styles.quickActionText}>Planning</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={navigateToNotifications}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#3b82f6' }]}>
              <MaterialIcons name="engineering" size={20} color="#fff" />
              {unreadNotifications > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {unreadNotifications}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.quickActionText}>Réclamations</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => router.push(ROUTES.AIDE)}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#3b82f6' }]}>
              <MaterialIcons name="help" size={20} color="#fff" />
            </View>
            <Text style={styles.quickActionText}>Aide</Text>
          </TouchableOpacity>
        </View>
        {/* Carte d'aide */}
        <TouchableOpacity 
          style={styles.helpCard}
          onPress={() => router.push(ROUTES.AIDE)}
        >
          <LinearGradient
            colors={['rgba(59, 130, 246, 0.05)', 'rgba(59, 130, 246, 0.1)']}
            style={styles.helpCardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.helpCardContent}>
              <View style={styles.helpCardImageContainer}>
                <Image 
                  source={require('../../assets/images/technicians.jpg')} 
                  style={styles.helpCardImage}
                  resizeMode="cover"
                />
                <LinearGradient
                  colors={['rgba(30, 64, 175, 0.7)', 'rgba(30, 64, 175, 0.4)']}
                  style={styles.helpCardImageOverlay}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
              </View>
              <View style={styles.helpCardTextContainer}>
                <Text style={styles.helpCardTitle}>Besoin d'aide ?</Text>
                <Text style={styles.helpCardDescription}>
                  Pour une question ou information, accédez à la page d'aide
                </Text>
                <View style={styles.helpCardButton}>
                  <Text style={styles.helpCardButtonText}>Accéder</Text>
                  <Ionicons name="arrow-forward" size={16} color="#fff" style={styles.helpCardButtonIcon} />
                </View>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* Footer with logout button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={logout}
        >
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc', // light blue-gray background
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    backgroundColor: '#1e40af', // blue-600
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  roleText: {
    fontSize: 14,
    color: '#e0f2fe', // blue-100
    marginTop: 5,
  },
  avatarContainer: {
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: -20,
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
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e40af', // blue-600
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b', // slate-500
    marginTop: 5,
  },
  scrollView: {
    flex: 1,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#334155', // slate-700
    marginHorizontal: 20,
    marginBottom: 15,
    marginTop: 10,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  menuItem: {
    width: width / 2.4,
    marginBottom: 15,
  },
  menuItemContent: {
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginTop: 10,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  quickActionButton: {
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  quickActionText: {
    fontSize: 12,
    color: '#64748b', // slate-500
  },
  footer: {
    padding: 20,
  },
  logoutButton: {
    backgroundColor: '#ef4444', // red-500
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
  },
  logoutText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 10,
  },
  notificationBadge: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#ef4444', // red-500
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: '#fff',
  },
  notificationBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  helpCard: {
    marginHorizontal: 20,
    marginBottom: 30,
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  helpCardGradient: {
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  helpCardContent: {
    flexDirection: 'row',
    height: 140,
  },
  helpCardImageContainer: {
    width: '40%',
    position: 'relative',
  },
  helpCardImage: {
    width: '100%',
    height: '100%',
  },
  helpCardImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpCardTextContainer: {
    width: '60%',
    padding: 15,
    justifyContent: 'center',
  },
  helpCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 5,
  },
  helpCardDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
  },
  helpCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  helpCardButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    marginRight: 5,
  },
  helpCardButtonIcon: {
    marginTop: 1,
  },
}); 