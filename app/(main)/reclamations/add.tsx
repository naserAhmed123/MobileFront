import { MaterialIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/auth';

export default function AddReclamationPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [references, setReferences] = useState<string[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  const [formData, setFormData] = useState({
    reference: '',
    numClient: '',
    typePanne: '',
    genrePanne: '',
    importance: '',
    etat: 'PAS_ENCOURS',
    serviceInterventionId: 0,
    citoyen: '',
  });

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

    setFormData(prev => ({
      ...prev,
      numClient: user.numTel?.toString() || '',
      citoyen: user.id
    }));
    
    fetchReferences();
  }, [user, isMounted]);

  const fetchReferences = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
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
      if (data.length === 0) {
        Alert.alert('Attention', 'Aucune référence trouvée pour ce citoyen.');
      }
    } catch (error: any) {
      Alert.alert('Erreur', `${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const AffecterRue = (ref: string) => {
    const refStr = ref.toString();
    if (refStr.length !== 8) return 'cas1';
    const les5 = parseInt(refStr.substring(0, 5), 10);
    if (les5 > 72806 && les5 < 73392) return 'GREMDA';
    if (les5 > 73432 && les5 < 73588) return 'LAFRANE';
    if (les5 > 73590 && les5 < 73922) return 'ELAIN';
    if (les5 > 73924 && les5 < 74208) return 'MANZEL_CHAKER';
    if (les5 > 74252 && les5 < 74348) return 'MATAR';
    if (les5 > 74386 && les5 < 74405) return 'SOKRA_MHARZA';
    if (les5 > 74406 && les5 < 74700) return 'GABES';
    return null;
  };

  const AffecterPosition = (ref: string) => {
    const refStr = ref.toString();
    const les5 = parseInt(refStr.substring(0, 5), 10);
    if (les5 > 72806 && les5 < 72923) return '34.809452, 10.697908';
    if (les5 > 72923 && les5 < 73040) return '34.820176, 10.683399';
    if (les5 > 73040 && les5 < 73157) return '34.831885, 10.664742';
    if (les5 > 73157 && les5 < 73204) return '34.848438, 10.654134';
    if (les5 > 73204 && les5 < 73251) return '34.877576, 10.647410';
    if (les5 > 73251 && les5 < 73298) return '34.917272, 10.628854';
    if (les5 > 73298 && les5 < 73345) return '34.949842, 10.604524';
    if (les5 > 73345 && les5 < 73392) return '34.977689, 10.580294';
    if (les5 > 74386 && les5 < 74395) return '34.726994, 10.735081';
    if (les5 > 74395 && les5 < 74405) return '34.718671, 10.716934';
    if (les5 > 74406 && les5 < 74443) return '34.725186, 10.740050';
    if (les5 > 74443 && les5 < 74480) return '34.713981, 10.726896';
    if (les5 > 74480 && les5 < 74517) return '34.692107, 10.712458';
    if (les5 > 74517 && les5 < 74554) return '34.681489, 10.699727';
    if (les5 > 74554 && les5 < 74584) return '34.649277, 10.661651';
    if (les5 > 74584 && les5 < 74614) return '34.634163, 10.646154';
    if (les5 > 74614 && les5 < 74643) return '34.624239, 10.634514';
    if (les5 > 74643 && les5 < 74672) return '34.605497, 10.608144';
    if (les5 > 74672 && les5 < 74700) return '34.591644, 10.595522';
    if (les5 > 73432 && les5 < 73541) return '34.803097, 10.688320';
    if (les5 > 73541 && les5 < 73588) return '34.818443, 10.679888';
    if (les5 > 74252 && les5 < 74265) return '34.803097, 10.688320';
    if (les5 > 74265 && les5 < 74278) return '34.818443, 10.679888';
    if (les5 > 74278 && les5 < 74291) return '34.818443, 10.679888';
    if (les5 > 74291 && les5 < 74299) return '34.818443, 10.679888';
    if (les5 > 74299 && les5 < 74307) return '34.818443, 10.679888';
    if (les5 > 74307 && les5 < 74328) return '34.818443, 10.679888';
    if (les5 > 74328 && les5 < 74349) return '34.818443, 10.679888';
    if (les5 > 73590 && les5 < 73673) return '34.796403, 10.680231';
    if (les5 > 73673 && les5 < 73756) return '34.808556, 10.665329';
    if (les5 > 73756 && les5 < 73789) return '34.820707, 10.649712';
    if (les5 > 73789 && les5 < 74822) return '34.833610, 10.632666';
    if (les5 > 74822 && les5 < 74855) return '34.845087, 10.617968';
    if (les5 > 74855 && les5 < 74888) return '34.858657, 10.602249';
    if (les5 > 74888 && les5 < 74922) return '34.872475, 10.588776';
    if (les5 > 73924 && les5 < 73990) return '34.758306, 10.698916';
    if (les5 > 73990 && les5 < 74056) return '34.769614, 10.683164';
    if (les5 > 74056 && les5 < 74122) return '34.781924, 10.661600';
    if (les5 > 74122 && les5 < 74152) return '34.789963, 10.647072';
    if (les5 > 74152 && les5 < 74182) return '34.801642, 10.63132';
    if (les5 > 74182 && les5 < 74888) return '34.813320, 10.615415';
    if (les5 > 74195 && les5 < 74208) return '34.827382, 10.601192';
    return null;
  };

  const ValiderNum = (num: string) => {
    const numStr = num.toString();
    if (numStr.length !== 8) return 'cas1';
    const lePremiere = numStr.charAt(0);
    if (!['2', '4', '5', '9'].includes(lePremiere)) return 'cas2';
    return 'Valide';
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const handleSubmit = async () => {
    if (!formData.numClient) {
      Alert.alert('Erreur', 'Le numéro client est obligatoire !');
      return;
    }

    if (!formData.reference) {
      Alert.alert('Erreur', 'Veuillez sélectionner une référence !');
      return;
    }

    if (!formData.typePanne || !formData.genrePanne || !formData.importance) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires !');
      return;
    }

    if (AffecterRue(formData.reference) === null) {
      Alert.alert('Erreur', "La référence n'est pas enregistrée ou disponible dans Sfax Sud");
      return;
    }
    if (AffecterRue(formData.reference) === 'cas1') {
      Alert.alert('Erreur', 'La référence doit contenir 8 chiffres');
      return;
    }
    if (ValiderNum(formData.numClient) === 'cas1') {
      Alert.alert('Erreur', 'Le numéro de client doit contenir 8 chiffres');
      return;
    }
    if (ValiderNum(formData.numClient) === 'cas2') {
      Alert.alert('Erreur', "Le numéro de client n'est pas un numéro tunisien valide");
      return;
    }

    const now = new Date();
    const formattedDateTime = now.toISOString();

    const payload = {
      reference: formData.reference,
      typePanne: formData.typePanne,
      numClient: parseInt(formData.numClient, 10),
      genrePanne: formData.genrePanne,
      heureReclamation: formattedDateTime,
      etat: formData.etat,
      importance: formData.importance,
      equipeId: null,
      serviceInterventionId: 0,
      rue: AffecterRue(formData.reference),
      etatSauvgarder: 'NON_ARCHIVER',
      Position2Km: AffecterPosition(formData.reference),
      citoyen: formData.citoyen,
    };

    try {
      setLoading(true);
      const response = await fetch('http://localhost:8080/reclamations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `HTTP error! status: ${response.status}`);
      }

      Alert.alert('Succès', 'Réclamation ajoutée avec succès !', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (e: any) {
      console.error("Erreur lors de l'ajout de la réclamation:", e);
      Alert.alert('Erreur', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/reclamations')} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ajouter une Réclamation</Text>
        <View style={styles.placeholderButton}></View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Informations de la Réclamation</Text>
          
          {/* Reference Picker */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Référence</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.reference}
                onValueChange={(value) => handleInputChange('reference', value)}
                style={styles.picker}
              >
                <Picker.Item label="Sélectionner une référence" value="" />
                {references.map((ref) => (
                  <Picker.Item key={ref} label={ref} value={ref} />
                ))}
              </Picker>
            </View>
          </View>

          {/* Client Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Numéro Client</Text>
            <TextInput
              style={styles.input}
              value={formData.numClient}
              onChangeText={(value) => handleInputChange('numClient', value)}
              keyboardType="numeric"
              placeholder="Entrez le numéro client"
              placeholderTextColor="#9ca3af"
            />
          </View>

          {/* Type de Panne */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Type de Panne</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.typePanne}
                onValueChange={(value) => handleInputChange('typePanne', value)}
                style={styles.picker}
              >
                <Picker.Item label="Sélectionner" value="" />
                <Picker.Item label="TYPE1" value="TYPE1" />
                <Picker.Item label="TYPE2" value="TYPE2" />
                <Picker.Item label="TYPE3" value="TYPE3" />
                <Picker.Item label="TYPE4" value="TYPE4" />
                <Picker.Item label="TYPE5" value="TYPE5" />
              </Picker>
            </View>
          </View>

          {/* Genre de Panne */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Genre de Panne</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.genrePanne}
                onValueChange={(value) => handleInputChange('genrePanne', value)}
                style={styles.picker}
              >
                <Picker.Item label="Sélectionner" value="" />
                <Picker.Item label="Électricité" value="ELECTRICITE" />
                <Picker.Item label="Gaz" value="GAZ" />
              </Picker>
            </View>
          </View>

          {/* Importance */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Importance</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.importance}
                onValueChange={(value) => handleInputChange('importance', value)}
                style={styles.picker}
              >
                <Picker.Item label="Sélectionner" value="" />
                <Picker.Item label="Critique" value="CRITIQUE" />
                <Picker.Item label="Importante" value="IMPORTANTE" />
                <Picker.Item label="Moyenne" value="MOYENNE" />
                <Picker.Item label="Faible" value="FAIBLE" />
              </Picker>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>Ajouter la Réclamation</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
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
  placeholderButton: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4b5563',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  pickerContainer: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 6,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 