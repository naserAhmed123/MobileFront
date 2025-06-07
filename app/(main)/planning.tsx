import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Platform,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { ROUTES } from '../constants/routes';
import { useAuth } from '../context/AuthContext';

// Types pour les réclamations
enum TypePanne {
  TYPE1 = 'TYPE1',
  TYPE2 = 'TYPE2',
  TYPE3 = 'TYPE3',
  TYPE4 = 'TYPE4',
  TYPE5 = 'TYPE5'
}

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

interface Reclamation {
  id: number;
  reference: number;
  typePanne: TypePanne;
  numClient: number;
  genrePanne: string;
  heureReclamation: string;
  etat: Etat;
  importance: Importance;
  rue: string;
}

export default function PlanningPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reclamations, setReclamations] = useState<Reclamation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Fonction de navigation en arrière
  const handleGoBack = () => {
    router.replace(ROUTES.HOME_TECHNICIEN);
  };

  // Récupérer les réclamations de l'équipe
  const fetchReclamations = async () => {
    if (!user?.equipe) {
      setError("Vous n'êtes pas assigné à une équipe");
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      setError(null);
      setLoading(true);
      console.log(`Récupération des réclamations pour l'équipe: ${user.equipe}`);
      
             // Appeler l'API pour récupérer les réclamations - utiliser l'IP du serveur
       const response = await fetch(`http://localhost:8080/reclamations/${user.equipe}/equipe`);
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Données récupérées:", data.length, "réclamations");
      setReclamations(data);
    } catch (error) {
      console.error("Erreur lors du chargement des réclamations:", error);
      setError("Impossible de récupérer les réclamations. Veuillez réessayer plus tard.");
      
      // En cas d'échec, utiliser des données fictives pour le développement
      const mockData: Reclamation[] = [
        {
          id: 1,
          reference: 10025,
          typePanne: TypePanne.TYPE1,
          numClient: 5002341,
          genrePanne: "Problème de tension",
          heureReclamation: new Date().toISOString(),
          etat: Etat.ENCOURS,
          importance: Importance.IMPORTANTE,
          rue: "GREMDA"
        },
        {
          id: 2,
          reference: 10026,
          typePanne: TypePanne.TYPE2,
          numClient: 5002342,
          genrePanne: "Fuite de gaz",
          heureReclamation: new Date().toISOString(),
          etat: Etat.PAS_ENCOURS,
          importance: Importance.CRITIQUE,
          rue: "LAFRANE"
        },
        {
          id: 3,
          reference: 10027,
          typePanne: TypePanne.TYPE3,
          numClient: 5002343,
          genrePanne: "Panne électrique",
          heureReclamation: new Date(Date.now() - 86400000).toISOString(), // hier
          etat: Etat.TERMINER,
          importance: Importance.MOYENNE,
          rue: "ELAIN"
        }
      ];
      
      console.log("Utilisation de données fictives");
      setReclamations(mockData);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Charger les réclamations au démarrage
  useEffect(() => {
    fetchReclamations();
  }, [user?.equipe]);

  // Rafraîchir les données
  const onRefresh = () => {
    setRefreshing(true);
    fetchReclamations();
  };

  // Filtrer les réclamations par date
  const getReclamationsByDate = (date: string) => {
    return reclamations.filter(rec => 
      rec.heureReclamation.split('T')[0] === date
    );
  };

  // Obtenir les réclamations pour la date sélectionnée
  const reclamationsDuJour = getReclamationsByDate(selectedDate);

  // Obtenir la couleur pour l'importance
  const getImportanceColor = (importance: Importance): string => {
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
  const getEtatColor = (etat: Etat): string => {
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
  const getEtatLabel = (etat: Etat): string => {
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

  // Données pour le calendrier
  const aujourdhui = new Date();
  const joursSemaine = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const mois = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  
  // Générer les dates du mois pour le calendrier
  const getDatesForCalendar = () => {
    const year = aujourdhui.getFullYear();
    const month = aujourdhui.getMonth();
    
    // Premier jour du mois
    const firstDay = new Date(year, month, 1);
    // Dernier jour du mois
    const lastDay = new Date(year, month + 1, 0);
    
    // Jour de la semaine du premier jour (0 = dimanche, 1 = lundi, etc.)
    let dayOfWeek = firstDay.getDay();
    // Ajuster pour commencer par lundi (0 = lundi, 6 = dimanche)
    dayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    // Nombre total de jours à afficher
    const totalDays = dayOfWeek + lastDay.getDate();
    // Nombre de semaines nécessaires
    const weeks = Math.ceil(totalDays / 7);
    
    // Dates à afficher
    const dates = [];
    
    // Jours du mois précédent
    const prevMonth = new Date(year, month, 0);
    const prevMonthDays = prevMonth.getDate();
    
    for (let i = 0; i < dayOfWeek; i++) {
      dates.push({
        day: prevMonthDays - dayOfWeek + i + 1,
        month: month - 1,
        year,
        isCurrentMonth: false
      });
    }
    
    // Jours du mois actuel
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const hasEvents = getReclamationsByDate(dateStr).length > 0;
      const isToday = i === aujourdhui.getDate() && month === aujourdhui.getMonth() && year === aujourdhui.getFullYear();
      const isSelected = dateStr === selectedDate;
      
      dates.push({
        day: i,
        month,
        year,
        isCurrentMonth: true,
        hasEvents,
        isToday,
        isSelected,
        dateStr
      });
    }
    
    // Jours du mois suivant
    const remainingDays = weeks * 7 - dates.length;
    for (let i = 1; i <= remainingDays; i++) {
      dates.push({
        day: i,
        month: month + 1,
        year,
        isCurrentMonth: false
      });
    }
    
    return dates;
  };

  const calendarDates = getDatesForCalendar();

  // Sélectionner une date dans le calendrier
  const selectDate = (dateStr: string) => {
    setSelectedDate(dateStr);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header avec couleur de fond simple */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleGoBack}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          
          <View>
            <Text style={styles.headerTitle}>Planning</Text>
            <Text style={styles.headerSubtitle}>
              Gestion des interventions
            </Text>
          </View>
          
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={fetchReclamations}
          >
            <Ionicons name="refresh" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Chargement du planning...</Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.scrollView}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#3b82f6']}
            />
          }
        >
          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={48} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={fetchReclamations}
              >
                <Text style={styles.retryButtonText}>Réessayer</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Calendrier simplifié */}
              <View style={styles.calendarContainer}>
                <Text style={styles.calendarMonth}>
                  {mois[aujourdhui.getMonth()]} {aujourdhui.getFullYear()}
                </Text>
                
                <View style={styles.daysRow}>
                  {joursSemaine.map((jour, index) => (
                    <View key={index} style={styles.dayColumn}>
                      <Text style={styles.dayName}>{jour}</Text>
                    </View>
                  ))}
                </View>
                
                <View style={styles.datesGrid}>
                  {calendarDates.map((date, index) => (
                    <TouchableOpacity 
                      key={index}
                      style={[
                        styles.dateCell,
                        !date.isCurrentMonth && styles.notCurrentMonth,
                        date.isToday && styles.todayCell,
                        date.isSelected && styles.selectedCell
                      ]}
                      onPress={() => date.isCurrentMonth && date.dateStr && selectDate(date.dateStr)}
                      disabled={!date.isCurrentMonth}
                    >
                      <Text style={[
                        styles.dateText,
                        !date.isCurrentMonth && styles.notCurrentMonthText,
                        date.isToday && styles.todayText,
                        date.isSelected && styles.selectedText
                      ]}>
                        {date.day}
                      </Text>
                      {date.hasEvents && (
                        <View style={styles.eventDot} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              {/* Titre de la section */}
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleContainer}>
                  <Text style={styles.sectionTitle}>
                    Réclamations du {new Date(selectedDate).toLocaleDateString('fr-FR', { 
                      day: '2-digit', 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </Text>
                  <Text style={styles.reclamationCount}>
                    {reclamationsDuJour.length} {reclamationsDuJour.length > 1 ? 'réclamations' : 'réclamation'}
                  </Text>
                </View>
              </View>
              
              {/* Liste des réclamations */}
              <View style={styles.reclamationsContainer}>
                {reclamationsDuJour.length > 0 ? (
                  reclamationsDuJour.map((item) => (
                    <TouchableOpacity 
                      key={item.id}
                      style={styles.itemContainer}
                      onPress={() => router.push({
                        pathname: ROUTES.INTERVENTIONS,
                        params: { reclamationId: item.id }
                      })}
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
                        
                        <Text style={styles.dateText2}>
                          {formatDate(item.heureReclamation)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="calendar-outline" size={64} color="#cbd5e1" />
                    <Text style={styles.emptyText}>
                      Aucune réclamation pour cette date
                    </Text>
                  </View>
                )}
              </View>
            </>
          )}
        </ScrollView>
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
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#3b82f6',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 40,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  calendarContainer: {
    backgroundColor: '#fff',
    margin: 15,
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  calendarMonth: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#334155',
    textAlign: 'center',
    marginBottom: 15,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  dayColumn: {
    flex: 1,
    alignItems: 'center',
  },
  dayName: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  datesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  dateCell: {
    width: '14.28%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  notCurrentMonth: {
    opacity: 0.3,
  },
  todayCell: {
    backgroundColor: '#3b82f6',
    borderRadius: 20,
  },
  selectedCell: {
    backgroundColor: '#93c5fd',
    borderRadius: 20,
  },
  dateText: {
    fontSize: 14,
    color: '#334155',
  },
  notCurrentMonthText: {
    color: '#94a3b8',
  },
  todayText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  selectedText: {
    fontWeight: 'bold',
  },
  dateText2: {
    fontSize: 12,
    color: '#64748b',
  },
  eventDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3b82f6',
    position: 'absolute',
    bottom: 3,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#334155',
  },
  reclamationCount: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  reclamationsContainer: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#94a3b8',
    marginTop: 10,
    textAlign: 'center',
  },
  itemContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  referenceContainer: {
    flexDirection: 'column',
  },
  referenceLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  referenceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
  },
  importanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  importanceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 5,
  },
  importanceText: {
    fontSize: 12,
    fontWeight: '600',
  },
  itemContent: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  infoLabel: {
    width: 80,
    fontSize: 14,
    color: '#64748b',
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    color: '#334155',
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  etatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  etatDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 5,
  },
  etatText: {
    fontSize: 12,
    fontWeight: '600',
  },
}); 