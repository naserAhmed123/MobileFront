import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useAuth } from '../context/AuthContext';

// Types pour les notifications
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

export default function NotificationsTechnicien() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const lastFetchTimeRef = useRef<number>(0);
  const notificationIdCounter = useRef<number>(1);

  // Charger les notifications stockées
  const loadStoredNotifications = async () => {
    try {
      const storedNotifications = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
      if (storedNotifications) {
        const parsedNotifications = JSON.parse(storedNotifications);
        setNotifications(parsedNotifications);
        
        // Initialiser le compteur d'ID à une valeur supérieure au dernier ID
        const maxId = parsedNotifications.reduce(
          (max: number, notification: Notification) => 
            Math.max(max, notification.id), 0
        );
        notificationIdCounter.current = maxId + 1;
        
        console.log(`${parsedNotifications.length} notifications chargées depuis le stockage`);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error);
    }
  };

  // Sauvegarder les notifications
  const saveNotifications = async (notificationsToSave: Notification[]) => {
    try {
      await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notificationsToSave));
      
      // Mettre à jour également le compteur de notifications non lues
      const unreadCount = notificationsToSave.filter(n => !n.isRead).length;
      await AsyncStorage.setItem(UNREAD_COUNT_KEY, unreadCount.toString());
      
      console.log(`${notificationsToSave.length} notifications sauvegardées, ${unreadCount} non lues`);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des notifications:', error);
    }
  };

  // Récupérer les réclamations et créer des notifications pour les nouvelles
  const fetchReclamations = async (showLoadingIndicator = true) => {
    if (showLoadingIndicator) {
      setLoading(true);
    }
    
    try {
      if (!user?.equipe) {
        console.log("ID d'équipe non disponible");
        return;
      }

      const currentTime = Date.now();
      const apiUrl = `http://localhost:8080/reclamations/${user.equipe}/equipe`;
      console.log(`Récupération des réclamations: ${apiUrl}`);
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`);
      }
      
      const reclamations: Reclamation[] = await response.json();
      console.log(`${reclamations.length} réclamations récupérées`);
      
      // Chargement des notifications existantes
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
        console.log(`${newReclamations.length} nouvelles réclamations détectées`);
        
        // Créer des notifications pour les nouvelles réclamations
        const newNotifications = newReclamations.map(recl => ({
          id: notificationIdCounter.current++,
          title: 'Nouvelle réclamation',
          message: `Une nouvelle réclamation a été assignée à votre équipe (Ref: ${recl.reference})`,
          timestamp: new Date().toISOString(),
          isRead: false,
          type: 'RECLAMATION' as const,
          reclamationId: recl.id,
          reference: recl.reference
        }));
        
        // Ajouter les nouvelles notifications à la liste existante
        const updatedNotifications = [...newNotifications, ...currentNotifications];
        setNotifications(updatedNotifications);
        
        // Sauvegarder les notifications mises à jour
        saveNotifications(updatedNotifications);
        
        // Jouer un son pour les nouvelles notifications
        // Ne jouer le son que si ce n'est pas le premier chargement ET s'il y a de nouvelles réclamations
        if (lastFetchTimeRef.current > 0 && newReclamations.length > 0) {
          playNotificationSound();
        }
      } else {
        console.log('Aucune nouvelle réclamation détectée');
      }
      
      // Mettre à jour le temps du dernier fetch
      lastFetchTimeRef.current = currentTime;
      
    } catch (error) {
      console.error('Erreur lors de la récupération des réclamations:', error);
      if (showLoadingIndicator) {
        Alert.alert(
          "Erreur de connexion", 
          "Impossible de récupérer les réclamations. Veuillez vérifier votre connexion internet."
        );
      }
    } finally {
      if (showLoadingIndicator) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  // Initialiser les données au démarrage
  useEffect(() => {
    const initialize = async () => {
      await loadStoredNotifications();
      await fetchReclamations(true);
    };
    
    initialize();
    
    // Configurer une vérification périodique des réclamations
    const intervalId = setInterval(() => {
      fetchReclamations(false); // false = ne pas afficher l'indicateur de chargement
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
      console.log("Lecture du son de notification");
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: 'https://assets.mixkit.co/sfx/preview/mixkit-software-interface-start-2574.mp3' },
        { shouldPlay: true }
      );
      setSound(newSound);
    } catch (error) {
      console.error('Erreur lors de la lecture du son de notification:', error);
    }
  };

  // Marquer une notification comme lue
  const markAsRead = async (notificationId: number) => {
    try {
      console.log(`Marquage de la notification ${notificationId} comme lue`);
      
      // Mise à jour locale
      const updatedNotifications = notifications.map(notification => 
        notification.id === notificationId 
          ? { ...notification, isRead: true } 
          : notification
      );
      
      setNotifications(updatedNotifications);
      
      // Sauvegarder les notifications mises à jour
      saveNotifications(updatedNotifications);
      
    } catch (error) {
      console.error('Erreur lors du marquage de la notification:', error);
    }
  };

  // Naviguer vers la réclamation associée
  const navigateToReclamation = (reclamationId: number, notificationId: number) => {
    // Marquer comme lue
    markAsRead(notificationId);
    
    // Naviguer vers la page de détails de la réclamation
    router.push({
      pathname: '/(main)/interventions',
      params: { reclamationId: reclamationId.toString() }
    });
  };

  // Fonction de navigation en arrière
  const handleGoBack = () => {
    router.replace('/(main)/homeTechnicien');
  };

  // Formater la date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);
    
    if (diffMins < 60) {
      return `Il y a ${diffMins} minute${diffMins > 1 ? 's' : ''}`;
    } else if (diffHours < 24) {
      return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
    } else {
      return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    }
  };

  // Obtenir la couleur pour le type de notification
  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'RECLAMATION':
        return '#3b82f6'; // bleu
      case 'INFORMATION':
        return '#22c55e'; // vert
      case 'ALERTE':
        return '#ef4444'; // rouge
      default:
        return '#94a3b8'; // gris
    }
  };

  // Obtenir l'icône pour le type de notification
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'RECLAMATION':
        return <MaterialIcons name="engineering" size={24} color="#3b82f6" />;
      case 'INFORMATION':
        return <Ionicons name="information-circle" size={24} color="#22c55e" />;
      case 'ALERTE':
        return <MaterialIcons name="warning" size={24} color="#ef4444" />;
      default:
        return <Ionicons name="notifications" size={24} color="#94a3b8" />;
    }
  };

  // Rendu d'un élément de la liste
  const renderItem = ({ item }: { item: Notification }) => {
    return (
      <TouchableOpacity
        style={[
          styles.notificationItem,
          !item.isRead && styles.unreadNotification
        ]}
        onPress={() => {
          if (item.reclamationId) {
            navigateToReclamation(item.reclamationId, item.id);
          } else {
            markAsRead(item.id);
          }
        }}
      >
        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <View style={styles.notificationTypeContainer}>
              {getNotificationIcon(item.type)}
              <Text style={[
                styles.notificationType,
                { color: getNotificationColor(item.type) }
              ]}>
                {item.type}
              </Text>
            </View>
            
            <Text style={styles.notificationTime}>
              {formatDate(item.timestamp)}
            </Text>
          </View>
          
          <Text style={[
            styles.notificationTitle,
            !item.isRead && styles.unreadText
          ]}>
            {item.title} {item.reference ? `(${item.reference})` : ''}
          </Text>
          
          <Text style={styles.notificationMessage}>
            {item.message}
          </Text>
          
          {!item.isRead && (
            <View style={styles.unreadIndicator} />
          )}
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
            <Text style={styles.headerTitle}>Réclamations</Text>
            <Text style={styles.headerSubtitle}>
              Nouvelles réclamations assignées à votre équipe
            </Text>
          </View>
        </View>
      </View>
      
      {/* Liste des notifications */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Chargement des notifications...</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={fetchReclamations}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="engineering" size={60} color="#cbd5e1" />
              <Text style={styles.emptyText}>
                Aucune réclamation
              </Text>
              <Text style={styles.emptySubText}>
                Aucune nouvelle réclamation n'a été assignée à votre équipe
              </Text>
            </View>
          }
        />
      )}
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
  notificationItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    position: 'relative',
  },
  unreadNotification: {
    backgroundColor: '#f0f9ff', // légère teinte bleue pour les non lues
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  notificationTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationType: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 5,
  },
  notificationTime: {
    fontSize: 12,
    color: '#94a3b8',
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#334155',
    marginBottom: 5,
  },
  unreadText: {
    fontWeight: '700',
    color: '#0f172a',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  unreadIndicator: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3b82f6',
  }
}); 