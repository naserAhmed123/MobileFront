import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { router } from 'expo-router';
import React, { createContext, useContext, useEffect, useState } from 'react';
import BlockedAccountModal from '../components/BlockedAccountModal';
import { ROUTES } from '../constants/routes';

export type Role = 'citoyen' | 'technicien';

// Définition stricte des enums
export enum Travail {
  ENCOURS = 'ENCOURS',
  QUITTER = 'QUITTER'
}

export enum Congier {
  ACTIF = 'ACTIF',
  INACTIF = 'INACTIF'
}

export enum EtatSauvgarder {
  ARCHIVER = 'ARCHIVER',
  NON_ARCHIVER = 'NON_ARCHIVER'
}

export enum EtatCompte {
  BLOQUER = 'BLOQUER',
  NON_BLOQUER = 'NON_BLOQUER'
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  travail?: Travail;
  etatCompte?: EtatCompte; // Pour citoyen
  etatSauvgarder?: EtatSauvgarder;
  con?: Congier;
  carteIdentite?: number;
  numTel?: number;
  equipe?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
  authState: {
    userToken: string | null;
  };
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => {},
  logout: () => {},
  isLoading: false,
  error: null,
  authState: {
    userToken: null
  }
});

const mapRoleToFrontend = (backendRole: string | undefined): Role => {
  if (!backendRole) {
    console.warn('Role missing in token, defaulting to citoyen');
    return 'citoyen';
  }
  switch (backendRole.toUpperCase()) {
    case 'TECHNICIEN':
      return 'technicien';
    case 'CITOYEN':
      return 'citoyen';
    default:
      console.warn(`Unknown role: ${backendRole}, defaulting to citoyen`);
      return 'citoyen';
  }
};

const parseJwt = (token: string) => {
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
    throw new Error('Invalid token');
  }
};

const sanitizeJson = (str: string): string => {
  try {
    // Convertir les caractères Unicode en leurs équivalents
    str = str.replace(/\\u[\dA-F]{4}/gi, match => 
      String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16))
    );

    // Nettoyer les caractères non-imprimables
    str = str.replace(/[\x00-\x1F\x7F-\x9F]/g, '');

    // Nettoyer les structures JSON malformées courantes
    str = str
      // Supprimer les objets vides malformés
      .replace(/\{\s*\}/g, '{}')
      // Supprimer les tableaux vides malformés
      .replace(/\[\s*\]/g, '[]')
      // Nettoyer les virgules multiples
      .replace(/,\s*,/g, ',')
      // Nettoyer les virgules avant fermeture
      .replace(/,\s*([}\]])/g, '$1')
      // Nettoyer les ouvertures/fermetures multiples
      .replace(/}{/g, '},{')
      .replace(/\]\[/g, '],[')
      // Nettoyer les espaces autour des deux points
      .replace(/"\s*:\s*/g, '":')
      // Supprimer les guillemets autour des nombres
      .replace(/"(\d+)"/g, '$1')
      // Nettoyer les structures imbriquées malformées
      .replace(/\}\]\}\]\}\]\}/g, '}}}}')
      .replace(/\{\[\{\[\{\[/g, '{{{{');

    // Si la chaîne commence par un guillemet et se termine par un guillemet, on les enlève
    if (str.startsWith('"') && str.endsWith('"')) {
      str = str.slice(1, -1);
    }

    console.log('Sanitized JSON string:', str);
    return str;
  } catch (e) {
    console.error('Error in sanitizeJson:', e);
    return str;
  }
};

const parseUserData = (data: any): any => {
  try {
    // Si c'est déjà un objet, retourner directement
    if (typeof data === 'object' && data !== null) {
      console.log('Data is already an object:', data);
      return data;
    }
    
    if (typeof data === 'string') {
      // Essayer d'extraire les données importantes avec regex
      const extractBasicInfo = (str: string) => {
        const matches = {
          id: str.match(/"id"\s*:\s*(\d+)/)?.[1],
          nom: str.match(/"nom"\s*:\s*"([^"]+)"/)?.[1],
          email: str.match(/"email"\s*:\s*"([^"]+)"/)?.[1],
          travail: str.match(/"travail"\s*:\s*"([^"]+)"/)?.[1],
          con: str.match(/"con"\s*:\s*"([^"]+)"/)?.[1],
          carteIdentite: str.match(/"carteIdentite"\s*:\s*(\d+)/)?.[1],
          numTel: str.match(/"numTel"\s*:\s*(\d+)/)?.[1],
          equipe: str.match(/"equipe"\s*:\s*(\d+)/)?.[1]
        };

        console.log('Extracted matches:', matches);
        return {
          id: matches.id ? parseInt(matches.id) : null,
          nom: matches.nom || null,
          email: matches.email || null,
          travail: matches.travail || null,
          con: matches.con || null,
          carteIdentite: matches.carteIdentite ? parseInt(matches.carteIdentite) : null,
          numTel: matches.numTel ? parseInt(matches.numTel) : null,
          equipe: matches.equipe ? parseInt(matches.equipe) : null
        };
      };

      // Essayer d'abord le parsing JSON normal
      try {
        return JSON.parse(data);
      } catch (e) {
        console.log('JSON parse failed, trying regex extraction');
        return extractBasicInfo(data);
      }
    }
    
    return data;
  } catch (e) {
    console.error('Final error in parseUserData:', e);
    return data;
  }
};

const processUserData = (rawData: any, email: string, role: Role): User => {
  try {
    const userData = parseUserData(rawData);
    
    console.log('Processing user data:', {
      raw: rawData,
      parsed: userData
    });

    // Strict normalization for enum values
    let travailStatus: Travail | undefined = undefined;
    if (userData?.travail) {
      const normalizedTravail = String(userData.travail).toUpperCase().trim();
      if (normalizedTravail === Travail.ENCOURS || normalizedTravail === Travail.QUITTER) {
        travailStatus = normalizedTravail;
        console.log('Normalized travail value:', travailStatus);
      } else {
        console.warn('Invalid travail value:', userData.travail);
      }
    }

    let conStatus: Congier | undefined = undefined;
    if (userData?.con) {
      const normalizedCon = String(userData.con).toUpperCase().trim();
      if (normalizedCon === Congier.ACTIF || normalizedCon === Congier.INACTIF) {
        conStatus = normalizedCon;
        console.log('Normalized con value:', conStatus);
      } else {
        console.warn('Invalid con value:', userData.con);
      }
    }
    
    let etatCompteStatus: EtatCompte | undefined = undefined;
    if (userData?.etatCompte) {
      const normalizedEtatCompte = String(userData.etatCompte).toUpperCase().trim();
      if (normalizedEtatCompte === EtatCompte.BLOQUER || normalizedEtatCompte === EtatCompte.NON_BLOQUER) {
        etatCompteStatus = normalizedEtatCompte;
        console.log('Normalized etatCompte value:', etatCompteStatus);
      } else {
        console.warn('Invalid etatCompte value:', userData.etatCompte);
      }
    } else if (role === 'citoyen') {
      // Par défaut, si non spécifié pour un citoyen
      etatCompteStatus = EtatCompte.NON_BLOQUER;
      console.log('Default etatCompte for citoyen:', etatCompteStatus);
    }

    const processedData: User = {
      id: String(userData?.id || ''),
      email: userData?.email || email,
      name: userData?.nom || 'User',
      role: role,
      travail: travailStatus,
      con: conStatus,
      etatCompte: etatCompteStatus,
      etatSauvgarder: userData?.etatSauvgarder as EtatSauvgarder,
      carteIdentite: typeof userData?.carteIdentite === 'number' ? userData.carteIdentite : undefined,
      numTel: typeof userData?.numTel === 'number' ? userData.numTel : undefined,
      equipe: userData?.equipe?.toString()
    };

    console.log('Final processed user data:', processedData);
    return processedData;
  } catch (e) {
    console.error('Error in processUserData:', e);
    return {
      id: '',
      email: email,
      name: 'User',
      role: role
    };
  }
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userToken, setUserToken] = useState<string | null>(null);
  
  // État pour le modal
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [onModalClose, setOnModalClose] = useState<() => void>(() => {});
  const [modalType, setModalType] = useState<'success' | 'error'>('error');

  // Fonction pour afficher le modal
  const showBlockedModal = (title: string, message: string, onClose: () => void, type: 'success' | 'error' = 'error') => {
    console.log('Showing blocked modal:', { title, message, type });
    setModalTitle(title);
    setModalMessage(message);
    setOnModalClose(() => onClose);
    setModalVisible(true);
    setModalType(type);
  };

  const logout = async () => {
    setUser(null);
    setUserToken(null);
    await AsyncStorage.removeItem('token');
    router.replace(ROUTES.LOGIN);
  };

  // Fonction pour vérifier périodiquement l'état de l'utilisateur
  const checkUserStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token || !user) {
        return;
      }

      console.log('Checking user status for:', user.email);
      
      // Vérifier l'état selon le rôle
      if (user.role === 'technicien') {
        try {
          const encodedEmail = encodeURIComponent(user.email);
          const techResponse = await axios.get(`http://localhost:8080/api/technicien/${encodedEmail}/email`, {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          });
          
          const techData = techResponse.data;
          console.log('Periodic check - Technician data:', techData);
          
          // Vérifier si l'état a changé
          const rawTravail = String(techData.travail || '').toUpperCase().trim();
          const rawCon = String(techData.con || '').toUpperCase().trim();
          
          if (rawTravail === Travail.QUITTER || rawCon !== Congier.ACTIF) {
            console.log('Technician status changed to blocked:', {
              travail: rawTravail,
              con: rawCon
            });
            
            // D'abord déconnecter l'utilisateur
            await AsyncStorage.removeItem('token');
            setUser(null);
            
            // Puis afficher le modal
            showBlockedModal(
              "Compte Bloqué",
              "Votre compte a été bloqué par l'administrateur. Veuillez contacter la direction des ressources humaines.",
              () => {
                console.log('Redirecting to blocked page after modal close');
                // Forcer la navigation après un court délai
                setTimeout(() => {
                  router.replace(ROUTES.BLOCKED);
                }, 100);
              },
              'error'
            );
            return;
          }
        } catch (error) {
          console.error('Error checking technician status:', error);
        }
      } else if (user.role === 'citoyen') {
        try {
          const userResponse = await axios.get(`http://localhost:8080/api/utilisateur/${user.email}`, {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          });
          
          const userData = userResponse.data;
          console.log('Periodic check - Citizen data:', userData);
          
          // Vérifier si le compte est bloqué
          const rawEtatCompte = String(userData.etatCompte || '').toUpperCase().trim();
          console.log('Periodic check - Citoyen etatCompte:', rawEtatCompte);
          
          if (rawEtatCompte === EtatCompte.BLOQUER) {
            console.log('Citizen account is now blocked');
            
            // D'abord déconnecter l'utilisateur
            await AsyncStorage.removeItem('token');
            setUser(null);
            
            // Puis afficher le modal
            showBlockedModal(
              "Compte Bloqué",
              "Votre compte a été bloqué par l'administrateur. Veuillez contacter le service client.",
              () => {
                console.log('Redirecting to blocked_cit page after modal close');
                // Forcer la navigation après un court délai
                setTimeout(() => {
                  router.replace(ROUTES.BLOCKED_CIT);
                }, 100);
              },
              'error'
            );
            return;
          }
        } catch (error) {
          console.error('Error checking citizen status:', error);
        }
      }
    } catch (error) {
      console.error('Error in periodic status check:', error);
    }
  };

  // Vérifier l'état de l'utilisateur plus fréquemment (toutes les 30 secondes)
  useEffect(() => {
    if (!user) return;
    
    // Vérification initiale après connexion
    checkUserStatus();
    
    // Vérification périodique
    const interval = setInterval(() => {
      checkUserStatus();
    }, 30 * 1000); // 30 secondes pour tester plus rapidement
    
    return () => clearInterval(interval);
  }, [user]);

  const checkAuthorization = (userData: any, role: Role, userInfo: User) => {
    console.log('Authorization check - Full user data:', {
      userData,
      role,
      userInfo
    });

    if (role === 'technicien') {
      // Ensure we have the required fields
      if (!userData.travail || !userData.con) {
        console.error('Missing required fields for technician:', {
          travail: userData.travail,
          con: userData.con
        });
        
        console.log('Showing modal for missing fields');
        showBlockedModal(
          "Compte Bloqué",
          "Une erreur s'est produite lors de la vérification de votre compte. Veuillez contacter l'administration.",
          () => {
            console.log('Modal closed - missing fields');
            logout();
            router.replace(ROUTES.BLOCKED);
          }
        );
        return false;
      }

      // Strict type checking for enum values
      const rawTravail = String(userData.travail).toUpperCase().trim();
      const rawCon = String(userData.con).toUpperCase().trim();
      
      console.log('Authorization check - Normalized values:', {
        rawTravail,
        rawCon,
        isQuitter: rawTravail === Travail.QUITTER,
        isInactif: rawCon !== Congier.ACTIF,
        validTravail: [Travail.ENCOURS, Travail.QUITTER].includes(rawTravail as Travail),
        validCon: [Congier.ACTIF, Congier.INACTIF].includes(rawCon as Congier)
      });

      // Block if inactive or has quit
      if (rawCon !== Congier.ACTIF || rawTravail === Travail.QUITTER) {
        console.log('Technician blocked:', {
          reason: rawCon !== Congier.ACTIF ? 'compte inactif' : 'a quitté le travail',
          travailStatus: rawTravail,
          conStatus: rawCon
        });

        if (rawTravail === Travail.QUITTER) {
          console.log('Showing QUITTER modal');
          showBlockedModal(
            "Compte Bloqué",
            "Votre compte a été bloqué car, selon la direction de la STEG, vous n'êtes plus officiellement employé au sein de la Société.\n\nVeuillez contacter la direction des ressources humaines pour résoudre ce problème.",
            () => {
              console.log('Modal closed - QUITTER');
              logout();
              router.replace(ROUTES.BLOCKED);
            }
          );
        } else {
          console.log('Showing INACTIF modal');
          showBlockedModal(
            "Compte Inactif",
            "Votre compte est actuellement inactif. Veuillez contacter l'administration de la STEG.",
            () => {
              console.log('Modal closed - INACTIF');
              logout();
              router.replace(ROUTES.BLOCKED);
            }
          );
        }
        return false;
      }
    }
    
    if (role === 'citoyen') {
      // Normaliser la valeur de etatCompte
      const rawEtatCompte = String(userData.etatCompte || '').toUpperCase().trim();
      console.log('Citoyen etatCompte:', rawEtatCompte);
      
      if (rawEtatCompte === EtatCompte.BLOQUER) {
        console.log('Citoyen blocked: account is blocked');
        showBlockedModal(
          "Compte Bloqué",
          "Votre compte a été bloqué. Veuillez contacter l'administration de la STEG.",
          () => {
            console.log('Modal closed - CITOYEN');
            logout();
            router.replace(ROUTES.BLOCKED_CIT);
          }
        );
        return false;
      }
    }
    
    console.log('Authorization check passed');
    return true;
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const token = await AsyncStorage.getItem('token');
        setUserToken(token);
        if (!token) {
          setIsLoading(false);
          return;
        }

        const decoded = parseJwt(token);
        const userRole = mapRoleToFrontend(decoded.role);

        let userData;
        if (userRole === 'technicien') {
          const email = decoded.email || decoded.sub;
          console.log('Fetching technician data with email:', email);
          try {
            const encodedEmail = encodeURIComponent(email);
            const techResponse = await axios.get(`http://localhost:8080/api/technicien/${encodedEmail}/email`, {
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
            });
            userData = techResponse.data;
            console.log('Technician API response:', userData);
          } catch (error: any) {
            console.error('Error fetching technician data:', error);
            if (error.response?.status === 400) {
              throw new Error('Invalid technician email');
            } else if (error.code === 'ERR_NETWORK') {
              throw new Error('Network error - Please check if the server is running and CORS is configured');
            }
            throw error;
          }
        } else {
          const userResponse = await axios.get(`http://localhost:8080/api/utilisateur/${decoded.email || decoded.sub}`, {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          });
          userData = userResponse.data;
          console.log('User API response:', userData);
        }

        const email = decoded.email || decoded.sub;
        const userInfo = processUserData(userData, email, userRole);

        console.log('User info prepared:', userInfo);
        const isAuthorized = checkAuthorization(userInfo, userRole, userInfo);
        if (!isAuthorized) {
          return;
        }

        setUser(userInfo);
        await AsyncStorage.setItem('lastRole', userRole);
        await AsyncStorage.setItem('userInfo', JSON.stringify(userInfo));
      } catch (err: any) {
        console.error('Error fetching user:', err);
        setError(err.message || 'Failed to fetch user data');
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await axios.post(
        'http://localhost:8080/api/auth/login',
        { email, password },
        { headers: { 'Content-Type': 'application/json' } }
      );

      const { token } = response.data;
      if (!token) {
        throw new Error('No token received from server');
      }

      await AsyncStorage.setItem('token', token);
      setUserToken(token);
      const decoded = parseJwt(token);
      const userRole = mapRoleToFrontend(decoded.role);

      // Récupération des données utilisateur selon le rôle
      let userData;
      if (userRole === 'technicien') {
        const email = decoded.email || decoded.sub;
        console.log('Fetching technician data with email:', email);
        try {
          const encodedEmail = encodeURIComponent(email);
          const techResponse = await axios.get(`http://localhost:8080/api/technicien/${encodedEmail}/email`, {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          });
          userData = techResponse.data;
          console.log('Technician API response:', userData);
        } catch (error: any) {
          console.error('Error fetching technician data:', error);
          if (error.response?.status === 400) {
            throw new Error('Invalid technician email');
          } else if (error.code === 'ERR_NETWORK') {
            throw new Error('Network error - Please check if the server is running and CORS is configured');
          }
          throw error;
        }
      } else {
        const userResponse = await axios.get(`http://localhost:8080/api/utilisateur/${decoded.email || decoded.sub}`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        userData = userResponse.data;
        console.log('User API response:', userData);
      }

      const userInfo = processUserData(userData, email, userRole);
      console.log('Processed user info:', userInfo);

      const isAuthorized = checkAuthorization(userInfo, userRole, userInfo);
      if (!isAuthorized) {
        return;
      }

      setUser(userInfo);
      await AsyncStorage.setItem('userInfo', JSON.stringify(userInfo));
      await AsyncStorage.setItem('lastRole', userRole);

      // Afficher un message de bienvenue
      const welcomeMessage = userRole === 'technicien'
        ? `Bienvenue ${userInfo.name}\nVous êtes connecté en tant que technicien.`
        : `Bienvenue ${userInfo.name}\nVous êtes connecté en tant que citoyen.`;
      
      const navigationPath = userRole === 'citoyen' ? ROUTES.HOME_CITOYEN : ROUTES.HOME_TECHNICIEN;
      console.log('Will navigate to:', navigationPath);
      
      // Utiliser le modal personnalisé pour le message de bienvenue
      showBlockedModal(
        "Connexion Réussie",
        welcomeMessage,
        () => {
          console.log('Success modal closed, navigating to:', navigationPath);
          router.replace(navigationPath);
        },
        'success'
      );

    } catch (err: any) {
      console.error('Login error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Login failed';
      setError(errorMessage);
      
      // Utiliser le modal personnalisé pour l'erreur
      showBlockedModal(
        "Erreur de Connexion",
        "Identifiant ou mot de passe incorrect. Veuillez réessayer.",
        () => {
          console.log('Error modal closed');
        },
        'error'
      );
      
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, error, authState: { userToken } }}>
      <BlockedAccountModal
        visible={modalVisible}
        title={modalTitle}
        message={modalMessage}
        onClose={() => {
          setModalVisible(false);
          onModalClose();
        }}
        type={modalType}
      />
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext); 