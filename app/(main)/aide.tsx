import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Animated,
    Dimensions,
    Image,
    Linking,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { ROUTES } from '../constants/routes';

const { width, height } = Dimensions.get('window');

// Données pour les sections d'aide
const helpSections = [
  {
    id: 'guide',
    title: 'Guide d\'utilisation',
    icon: 'book-open',
    color: '#3b82f6', // blue-500
    description: 'Conseils pour utiliser l\'application efficacement'
  },
  {
    id: 'faq',
    title: 'Questions fréquentes',
    icon: 'question-circle',
    color: '#3b82f6', // blue-500
    description: 'Réponses aux questions courantes'
  },
  {
    id: 'contact',
    title: 'Nous contacter',
    icon: 'headset',
    color: '#ef4444', // red-400
    description: 'Service client et support technique'
  },
  {
    id: 'legal',
    title: 'Informations légales',
    icon: 'gavel',
    color: '#ef4444', // red-400
    description: 'Mentions légales et conditions d\'utilisation'
  }
];

// Données pour les conseils d'utilisation
const usageTips = [
  {
    id: 1,
    title: 'Consultez vos interventions',
    icon: 'engineering',
    description: 'Accédez à la liste de vos interventions en cours et à venir depuis le menu principal.'
  },
  {
    id: 2,
    title: 'Rédigez vos rapports',
    icon: 'description',
    description: 'Créez et soumettez vos rapports d\'intervention directement depuis l\'application.'
  },
  {
    id: 3,
    title: 'Gérez les matériels',
    icon: 'inventory',
    description: 'Consultez l\'inventaire des matériels et signalez les ruptures de stock.'
  },
  {
    id: 4,
    title: 'Notifications importantes',
    icon: 'notifications',
    description: 'Restez informé des nouvelles réclamations assignées à votre équipe.'
  }
];

// Questions fréquentes
const faqs = [
  {
    id: 1,
    question: 'Comment signaler un problème technique ?',
    answer: 'En cas de problème technique avec l\'application, contactez le support technique au 71 123 456 ou par email à support@steg.com.tn.'
  },
  {
    id: 2,
    question: 'Comment modifier mon profil ?',
    answer: 'Accédez à votre profil depuis le menu principal et utilisez les options disponibles pour mettre à jour vos informations personnelles.'
  },
  {
    id: 3,
    question: 'Comment rédiger un rapport efficace ?',
    answer: 'Un bon rapport doit contenir une description précise de l\'intervention, les actions réalisées, les matériels utilisés et les problèmes rencontrés.'
  },
  {
    id: 4,
    question: 'Comment indiquer une rupture de stock ?',
    answer: 'Dans la section Matériels, sélectionnez l\'élément concerné et utilisez l\'option "Signaler une rupture".'
  }
];

// Contacts
const contacts = [
  {
    id: 'support',
    title: 'Support technique',
    icon: 'headset',
    value: '71 123 456',
    action: () => Linking.openURL('tel:71123456')
  },
  {
    id: 'emergency',
    title: 'Urgences',
    icon: 'warning',
    value: '71 789 012',
    action: () => Linking.openURL('tel:71789012')
  },
  {
    id: 'email',
    title: 'Email',
    icon: 'email',
    value: 'contact@steg.com.tn',
    action: () => Linking.openURL('mailto:contact@steg.com.tn')
  },
  {
    id: 'website',
    title: 'Site web',
    icon: 'language',
    value: 'www.steg.com.tn',
    action: () => Linking.openURL('https://www.steg.com.tn')
  }
];

export default function AidePage() {
  const [activeSection, setActiveSection] = useState('guide');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const scrollY = new Animated.Value(0);

  // Animation pour le header
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [200, 120],
    extrapolate: 'clamp'
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 60, 90],
    outputRange: [1, 0.3, 0],
    extrapolate: 'clamp'
  });

  const headerTextSize = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [32, 24],
    extrapolate: 'clamp'
  });

  // Fonction de navigation en arrière
  const handleGoBack = () => {
    router.replace(ROUTES.HOME_TECHNICIEN);
  };

  // Sélectionner une section
  const selectSection = (sectionId: string) => {
    setActiveSection(sectionId);
  };

  // Basculer l'état d'une FAQ
  const toggleFaq = (id: number) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  // Rendu conditionnel du contenu selon la section active
  const renderContent = () => {
    switch (activeSection) {
      case 'guide':
        return (
          <View style={styles.contentContainer}>
            <Text style={styles.contentTitle}>Guide d'utilisation</Text>
            <Text style={styles.contentDescription}>
              Bienvenue dans l'application STEG Mobile ! Voici quelques conseils pour vous aider à utiliser efficacement notre application.
            </Text>
            
            {usageTips.map(tip => (
              <View key={tip.id} style={styles.tipCard}>
                <View style={[styles.tipIconContainer, { backgroundColor: '#3b82f6' }]}>
                  <MaterialIcons name={tip.icon as any} size={24} color="#fff" />
                </View>
                <View style={styles.tipContent}>
                  <Text style={styles.tipTitle}>{tip.title}</Text>
                  <Text style={styles.tipDescription}>{tip.description}</Text>
                </View>
              </View>
            ))}
            
            <View style={styles.infoCard}>
              <MaterialIcons name="tips-and-updates" size={24} color="#3b82f6" style={styles.infoIcon} />
              <Text style={styles.infoText}>
                Pour une expérience optimale, nous vous recommandons de maintenir l'application à jour et de vous assurer que votre appareil dispose d'une connexion internet stable.
              </Text>
            </View>
          </View>
        );
        
      case 'faq':
        return (
          <View style={styles.contentContainer}>
            <Text style={styles.contentTitle}>Questions fréquentes</Text>
            <Text style={styles.contentDescription}>
              Retrouvez les réponses aux questions les plus courantes sur l'utilisation de l'application.
            </Text>
            
            {faqs.map(faq => (
              <TouchableOpacity 
                key={faq.id} 
                style={styles.faqCard}
                onPress={() => toggleFaq(faq.id)}
                activeOpacity={0.8}
              >
                <View style={styles.faqHeader}>
                  <Text style={styles.faqQuestion}>{faq.question}</Text>
                  <MaterialIcons 
                    name={expandedFaq === faq.id ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} 
                    size={24} 
                    color="#3b82f6" 
                  />
                </View>
                
                {expandedFaq === faq.id && (
                  <View style={styles.faqAnswerContainer}>
                    <Text style={styles.faqAnswer}>{faq.answer}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
            
            <View style={styles.moreHelpCard}>
              <Text style={styles.moreHelpTitle}>Besoin de plus d'aide ?</Text>
              <Text style={styles.moreHelpText}>
                Si vous ne trouvez pas la réponse à votre question, contactez notre service client.
              </Text>
              <TouchableOpacity 
                style={styles.moreHelpButton}
                onPress={() => setActiveSection('contact')}
              >
                <Text style={styles.moreHelpButtonText}>Contacter le support</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
        
      case 'contact':
        return (
          <View style={styles.contentContainer}>
            <Text style={styles.contentTitle}>Nous contacter</Text>
            <Text style={styles.contentDescription}>
              Besoin d'aide ou d'information ? Contactez notre équipe de support technique.
            </Text>
            
            {contacts.map(contact => (
              <TouchableOpacity 
                key={contact.id} 
                style={styles.contactCard}
                onPress={contact.action}
              >
                <View style={[styles.contactIconContainer, { backgroundColor: '#ef4444' }]}>
                  <MaterialIcons name={contact.icon as any} size={24} color="#fff" />
                </View>
                <View style={styles.contactContent}>
                  <Text style={styles.contactTitle}>{contact.title}</Text>
                  <Text style={styles.contactValue}>{contact.value}</Text>
                </View>
                <MaterialIcons name="arrow-forward-ios" size={16} color="#94a3b8" />
              </TouchableOpacity>
            ))}
            
            <View style={styles.officeHoursCard}>
              <Text style={styles.officeHoursTitle}>Horaires d'ouverture</Text>
              <View style={styles.officeHoursRow}>
                <Text style={styles.officeHoursDay}>Lundi - Vendredi</Text>
                <Text style={styles.officeHoursTime}>8h00 - 17h00</Text>
              </View>
              <View style={styles.officeHoursRow}>
                <Text style={styles.officeHoursDay}>Samedi</Text>
                <Text style={styles.officeHoursTime}>8h00 - 12h00</Text>
              </View>
              <View style={styles.officeHoursRow}>
                <Text style={styles.officeHoursDay}>Dimanche</Text>
                <Text style={styles.officeHoursTime}>Fermé</Text>
              </View>
            </View>
          </View>
        );
        
      case 'legal':
        return (
          <View style={styles.contentContainer}>
            <Text style={styles.contentTitle}>Informations légales</Text>
            <Text style={styles.contentDescription}>
              Consultez les mentions légales et les conditions d'utilisation de l'application.
            </Text>
            
            <View style={styles.legalCard}>
              <Text style={styles.legalTitle}>Version de l'application</Text>
              <Text style={styles.legalText}>STEG Mobile v1.0.0</Text>
            </View>
            
            <View style={styles.legalCard}>
              <Text style={styles.legalTitle}>Confidentialité et données personnelles</Text>
              <Text style={styles.legalText}>
                La STEG s'engage à protéger vos données personnelles conformément à la législation en vigueur. Toutes les informations collectées sont utilisées uniquement dans le cadre de nos services.
              </Text>
              <TouchableOpacity style={styles.legalLink}>
                <Text style={styles.legalLinkText}>Politique de confidentialité</Text>
                <MaterialIcons name="arrow-forward-ios" size={14} color="#3b82f6" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.legalCard}>
              <Text style={styles.legalTitle}>Conditions d'utilisation</Text>
              <Text style={styles.legalText}>
                En utilisant cette application, vous acceptez les conditions générales d'utilisation. Nous vous recommandons de les consulter régulièrement.
              </Text>
              <TouchableOpacity style={styles.legalLink}>
                <Text style={styles.legalLinkText}>Conditions générales</Text>
                <MaterialIcons name="arrow-forward-ios" size={14} color="#3b82f6" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.legalCard}>
              <Text style={styles.legalTitle}>Droits d'auteur</Text>
              <Text style={styles.legalText}>
                © 2023-{new Date().getFullYear()} STEG - Société Tunisienne de l'Électricité et du Gaz. Tous droits réservés.
              </Text>
            </View>
          </View>
        );
        
      default:
        return (
          <View style={styles.contentContainer}>
            <Text style={styles.contentTitle}>Guide d'utilisation</Text>
            <Text style={styles.contentDescription}>
              Bienvenue dans l'application STEG Mobile ! Voici quelques conseils pour vous aider à utiliser efficacement notre application.
            </Text>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header animé */}
      <Animated.View style={[styles.header, { height: headerHeight }]}>
        <LinearGradient
          colors={['#3b82f6', '#1e40af']}
          style={styles.headerGradient}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleGoBack}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          
          <Animated.View 
            style={[
              styles.headerTextContainer,
              { opacity: headerOpacity }
            ]}
          >
            <Image 
              source={{ uri: 'https://upload.wikimedia.org/wikipedia/fr/6/64/STEG.png' }}
              style={styles.logo}
              resizeMode="contain"
            />
            <Animated.Text style={[styles.headerTitle, { fontSize: headerTextSize }]}>
              Centre d'aide
            </Animated.Text>
            <Text style={styles.headerSubtitle}>Comment pouvons-nous vous aider ?</Text>
          </Animated.View>
        </LinearGradient>
      </Animated.View>
      
      {/* Tabs de navigation */}
      <View style={styles.tabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScrollContent}
        >
          {helpSections.map(section => (
            <TouchableOpacity
              key={section.id}
              style={[
                styles.tabButton,
                activeSection === section.id && styles.tabButtonActive,
                { borderBottomColor: section.color }
              ]}
              onPress={() => selectSection(section.id)}
            >
              <FontAwesome5 
                name={section.icon} 
                size={16} 
                color={activeSection === section.id ? section.color : '#64748b'} 
                style={styles.tabIcon}
              />
              <Text 
                style={[
                  styles.tabText,
                  activeSection === section.id && { color: section.color }
                ]}
              >
                {section.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      {/* Contenu principal avec animation */}
      <Animated.ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {renderContent()}
      </Animated.ScrollView>
      
      {/* Bouton d'assistance flottant */}
      <TouchableOpacity 
        style={styles.floatingButton}
        onPress={() => Linking.openURL('tel:71123456')}
      >
        <LinearGradient
          colors={['#ef4444', '#b91c1c']}
          style={styles.floatingButtonGradient}
        >
          <MaterialIcons name="support-agent" size={24} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    width: '100%',
    overflow: 'hidden',
  },
  headerGradient: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 20 : 40,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerTextContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  logo: {
    width: 60,
    height: 60,
    marginBottom: 10,
  },
  headerTitle: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 5,
  },
  tabsContainer: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
    zIndex: 10,
  },
  tabsScrollContent: {
    paddingHorizontal: 10,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomWidth: 3,
  },
  tabIcon: {
    marginRight: 8,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  contentContainer: {
    padding: 20,
  },
  contentTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 10,
  },
  contentDescription: {
    fontSize: 15,
    color: '#64748b',
    marginBottom: 24,
    lineHeight: 22,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  tipIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  tipDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    alignItems: 'center',
  },
  infoIcon: {
    marginRight: 15,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },
  faqCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
    flex: 1,
    paddingRight: 10,
  },
  faqAnswerContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  faqAnswer: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  moreHelpCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginTop: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  moreHelpTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 10,
  },
  moreHelpText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  moreHelpButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  moreHelpButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  contactIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  contactContent: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 3,
  },
  contactValue: {
    fontSize: 14,
    color: '#64748b',
  },
  officeHoursCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  officeHoursTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 15,
  },
  officeHoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  officeHoursDay: {
    fontSize: 14,
    color: '#334155',
  },
  officeHoursTime: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  legalCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  legalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 10,
  },
  legalText: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 15,
  },
  legalLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legalLinkText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
    marginRight: 5,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 6,
  },
  floatingButtonGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 