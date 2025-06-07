import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Dimensions, Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

// Type pour les éléments d'aide
interface HelpItem {
  title: string;
  description: string;
  icon: 'help' | 'search' | 'phone';
  color: string;
}

export default function HomeCitoyen() {
  const { user, logout } = useAuth();

  const menuItems: MenuItem[] = [
    {
      title: 'Mes Réclamations',
      icon: <MaterialIcons name="report-problem" size={28} color="#fff" />,
      route: ROUTES.RECLAMATIONS,
      color: '#1e40af', // blue-600
    },
    {
      title: 'Mes Références',
      icon: <MaterialIcons name="description" size={28} color="#fff" />,
      route: ROUTES.REFERENCES,
      color: '#3b82f6', // blue-500
    },
    {
      title: 'Mes Plaintes',
      icon: <MaterialIcons name="gavel" size={28} color="#fff" />,
      route: ROUTES.MES_PLAINTES,
      color: '#1e40af', // blue-600
    },
    {
      title: 'Mon Profil',
      icon: <FontAwesome5 name="user-cog" size={24} color="#fff" />,
      route: ROUTES.PROFILE_CITOYEN,
      color: '#1e40af', // blue-600
    },
  ];

  const helpItems: HelpItem[] = [
    {
      title: 'Comment déposer une réclamation',
      description: 'Guide étape par étape pour déposer une réclamation',
      icon: 'help',
      color: '#3b82f6',
    },
    {
      title: 'Suivre ma réclamation',
      description: 'Comment suivre l\'état de votre réclamation',
      icon: 'search',
      color: '#1e40af',
    },
    {
      title: 'Contacter le support',
      description: 'Besoin d\'aide ? Contactez notre équipe',
      icon: 'phone',
      color: '#3b82f6',
    },
  ];

  const handleNavigation = (route: string) => {
    router.push(route as any);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e40af" />
      
      {/* Header avec couleur pleine */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.userInfo}>
            <View style={styles.avatarContainer}>
              <MaterialIcons name="person" size={30} color="#1e40af" />
            </View>
            <View style={styles.userTextContainer}>
              <Text style={styles.welcomeText}>
                Bienvenue, {user?.name || 'Citoyen'}
              </Text>
              <Text style={styles.roleText}>Compte Citoyen</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Carte professionnelle */}
        <View style={styles.professionalCard}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="verified-user" size={24} color="#1e40af" />
            <Text style={styles.cardTitle}>Carte Professionnelle</Text>
          </View>
          <View style={styles.cardContent}>
            <View style={styles.cardInfo}>
              <Text style={styles.cardLabel}>Numéro Carte Identité</Text>
              <Text style={styles.cardValue}>{user?.carteIdentite || 'N/A'}</Text>
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardLabel}>Statut</Text>
              <View style={styles.statusContainer}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Actif</Text>
              </View>
            </View>
          </View>
        </View>

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
            onPress={() => router.push(ROUTES.ADD)}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#3b82f6' }]}>
              <MaterialIcons name="report-problem" size={20} color="#fff" />
            </View>
            <Text style={styles.quickActionText}>Nouvelle Réclamation</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => router.push(ROUTES.PLAINTES)}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#3b82f6' }]}>
              <MaterialIcons name="gavel" size={20} color="#fff" />
            </View>
            <Text style={styles.quickActionText}>Déposer une Plainte</Text>
          </TouchableOpacity>
        </View>

        {/* Section Aide */}
        <Text style={styles.sectionTitle}>Centre d'aide</Text>
        <View style={styles.helpContainer}>
          {helpItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.helpItem}
              onPress={() => router.push(ROUTES.AIDE_CITOYEN)}
            >
              <View style={[styles.helpIconContainer, { backgroundColor: `${item.color}20` }]}>
                <MaterialIcons name={item.icon} size={24} color={item.color} />
              </View>
              <View style={styles.helpContent}>
                <Text style={styles.helpTitle}>{item.title}</Text>
                <Text style={styles.helpDescription}>{item.description}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#94a3b8" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Déconnexion */}
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={logout}
        >
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#1e40af',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userTextContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  roleText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 15,
    marginTop: 20,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 15,
  },
  menuItem: {
    width: (width - 55) / 2,
    marginBottom: 15,
  },
  menuItemContent: {
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  menuItemText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 10,
    textAlign: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  professionalCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginLeft: 10,
  },
  cardContent: {
    gap: 15,
  },
  cardInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  cardValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#22c55e',
  },
  helpContainer: {
    gap: 15,
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  helpIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  helpContent: {
    flex: 1,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  helpDescription: {
    fontSize: 14,
    color: '#64748b',
  },
}); 