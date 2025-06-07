import { ROUTES } from '@/app/constants/routes';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/auth';

interface Reclamation {
  id: string;
  reference: string;
  numClient: string;
  typePanne: string;
  genrePanne: string;
  importance: string;
  etat: string;
  dateCreation: string;
  rue: string;
  heureReclamation: string;
  [key: string]: any; // Add index signature for dynamic key access
}

export default function ReclamationsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reclamations, setReclamations] = useState<Reclamation[]>([]);
  const [references, setReferences] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<{key: string, direction: string}>({ key: 'reference', direction: 'asc' });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const handleGoBack = () => {
    router.replace(ROUTES.HOME_CITOYEN);
  };
  // Set mounted flag after initial render
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  useEffect(() => {
    // Don't navigate until component is mounted
    if (!isMounted) return;
    
    if (!user) {
      // Use setTimeout to delay navigation until after mounting
      const timer = setTimeout(() => {
        router.replace('/(auth)/login');
      }, 0);
      return () => clearTimeout(timer);
    }

    fetchReferences();
    fetchReclamations();
  }, [user, isMounted]);

  function parseJwt(token: string) {
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
      alert('Problème avec votre session. Veuillez vous reconnecter.');
      return null;
    }
  }

  const fetchReferences = async () => {
    if (!user?.id) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/citoyens/${user.id}/references`, {
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
    } catch (error: any) {
      alert(`Erreur: ${error.message}`);
    }
  };

  const fetchReclamations = async () => {
    if (!user?.id) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/reclamations/reclamations/citoyen/${user.id}`, {
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
    } catch (error: any) {
      alert(`Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, etat: string) => {
    if (etat === 'ENCOURS' || etat === 'PROBLEM') {
      alert('Impossible de supprimer une réclamation en cours ou avec problème');
      return;
    }

    showConfirmPopup(
      () => confirmDelete(id),
      'Voulez-vous vraiment supprimer cette réclamation ?'
    );
  };

  const confirmDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/reclamations/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setReclamations(reclamations.filter((rec) => rec.id !== id));
      alert('Réclamation supprimée avec succès !');
    } catch (error: any) {
      alert(`Erreur: ${error.message}`);
    }
  };

  const showConfirmPopup = (action: () => void, message: string) => {
    setConfirmAction(() => action);
    setConfirmMessage(message);
    setShowConfirmModal(true);
  };

  const handleConfirm = () => {
    if (confirmAction) {
      confirmAction();
    }
    setShowConfirmModal(false);
    setConfirmAction(null);
    setConfirmMessage('');
  };

  const handleCancelConfirm = () => {
    setShowConfirmModal(false);
    setConfirmAction(null);
    setConfirmMessage('');
  };

  const handleSort = (key: string) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });

    setReclamations([...reclamations].sort((a, b) => {
      if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
      if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
      return 0;
    }));
  };

  const getEtatColor = (etat: string) => {
    switch (etat) {
      case 'ENCOURS':
        return '#3b82f6'; // bg-blue-500
      case 'PROBLEM':
        return '#f87171'; // bg-red-400
      case 'PAS_ENCOURS':
        return '#9ca3af'; // bg-gray-400
      default:
        return '#9ca3af'; // bg-gray-400
    }
  };

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'CRITIQUE':
        return '#ef4444'; // bg-red-500
      case 'IMPORTANTE':
        return '#f97316'; // bg-orange-500
      case 'MOYENNE':
        return '#eab308'; // bg-yellow-500
      case 'FAIBLE':
        return '#22c55e'; // bg-green-500
      default:
        return '#9ca3af'; // bg-gray-400
    }
  };

  // Sort reclamations by heureReclamation (descending) and take the top 3
  const recentReclamations = [...reclamations]
    .sort((a, b) => new Date(b.heureReclamation).getTime() - new Date(a.heureReclamation).getTime())
    .slice(0, 3);

  const ConfirmModal = () => {
    if (!showConfirmModal) return null;

    return (
      <Modal
        transparent={true}
        visible={showConfirmModal}
        animationType="fade"
        onRequestClose={handleCancelConfirm}
      >
        <BlurView intensity={30} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirmation</Text>
            <Text style={styles.modalMessage}>{confirmMessage}</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={handleCancelConfirm} style={[styles.modalButton, styles.cancelButton]}>
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleConfirm} style={[styles.modalButton, styles.confirmButton]}>
                <Text style={styles.confirmButtonText}>Confirmer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </Modal>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ConfirmModal />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/homeCitoyen')} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes Réclamations</Text>
        <TouchableOpacity onPress={() => router.push('/(main)/reclamations/add')} style={styles.addButton}>
          <MaterialIcons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {reclamations.map((reclamation) => (
          <View key={reclamation.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.referenceContainer}>
                <Text style={styles.referenceLabel}>Référence:</Text>
                <Text style={styles.referenceValue}>{reclamation.reference}</Text>
              </View>
              <View style={[styles.etatBadge, { backgroundColor: getEtatColor(reclamation.etat) }]}>
                <Text style={styles.etatText}>{reclamation.etat}</Text>
              </View>
            </View>

            <View style={styles.cardContent}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Client:</Text>
                <Text style={styles.infoValue}>{reclamation.numClient}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Type:</Text>
                <Text style={styles.infoValue}>{reclamation.typePanne}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Genre:</Text>
                <Text style={styles.infoValue}>{reclamation.genrePanne}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Rue:</Text>
                <Text style={styles.infoValue}>{reclamation.rue}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Importance:</Text>
                <View style={[styles.importanceBadge, { backgroundColor: getImportanceColor(reclamation.importance) }]}>
                  <Text style={styles.importanceText}>{reclamation.importance}</Text>
                </View>
              </View>
            </View>

            <View style={styles.cardActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.editButton]}
                onPress={() => router.push('/(main)/reclamations/add')}
              >
                <MaterialIcons name="edit" size={20} color="white" />
                <Text style={styles.actionButtonText}>Modifier</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleDelete(reclamation.id, reclamation.etat)}
              >
                <MaterialIcons name="delete" size={20} color="white" />
                <Text style={styles.actionButtonText}>Supprimer</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#3b82f6',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  addButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  referenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  referenceLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginRight: 4,
  },
  referenceValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  etatBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  etatText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardContent: {
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
    width: 80,
  },
  infoValue: {
    fontSize: 14,
    color: '#1f2937',
    flex: 1,
  },
  importanceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  importanceText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardActions: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 6,
    marginRight: 8,
    flex: 1,
  },
  editButton: {
    backgroundColor: '#3b82f6',
  },
  deleteButton: {
    backgroundColor: '#f87171',
  },
  actionButtonText: {
    color: 'white',
    marginLeft: 4,
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: '#e5e7eb',
  },
  cancelButtonText: {
    color: '#4b5563',
    fontWeight: '500',
  },
  confirmButton: {
    backgroundColor: '#3b82f6',
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: '500',
  },
}); 