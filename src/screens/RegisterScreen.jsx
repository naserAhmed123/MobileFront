import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const RegisterScreen = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [formData, setFormData] = useState({
    fname: "",
    lname: "",
    email: "",
    password: "",
    carteIdentite: "",
    numTelephone: "",
    adress: "",
    references: [""],
  });

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleReferenceChange = (index, value) => {
    const newReferences = [...formData.references];
    newReferences[index] = value;
    setFormData(prev => ({ ...prev, references: newReferences }));
  };

  const addReference = () => {
    setFormData(prev => ({
      ...prev,
      references: [...prev.references, ""]
    }));
  };

  const removeReference = (index) => {
    if (formData.references.length > 1) {
      const newReferences = formData.references.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, references: newReferences }));
    }
  };

  const validateForm = () => {
    console.log("Données du formulaire à valider:", formData);
    console.log("Conditions acceptées:", isChecked);

    if (!formData.fname.trim()) {
      console.log("Erreur: nom manquant");
      Alert.alert("Erreur", "Le nom est requis");
      return false;
    }

    if (!formData.lname.trim()) {
      console.log("Erreur: prénom manquant");
      Alert.alert("Erreur", "Le prénom est requis");
      return false;
    }

    if (!formData.email.trim()) {
      console.log("Erreur: email manquant");
      Alert.alert("Erreur", "L'email est requis");
      return false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      console.log("Erreur: email invalide");
      Alert.alert("Erreur", "Email invalide");
      return false;
    }

    if (!formData.password) {
      console.log("Erreur: mot de passe manquant");
      Alert.alert("Erreur", "Le mot de passe est requis");
      return false;
    } else if (formData.password.length < 8) {
      console.log("Erreur: mot de passe trop court");
      Alert.alert("Erreur", "Le mot de passe doit contenir au moins 8 caractères");
      return false;
    }

    if (!formData.carteIdentite || isNaN(parseInt(formData.carteIdentite))) {
      console.log("Erreur: carte d'identité invalide");
      Alert.alert("Erreur", "Carte d'identité invalide");
      return false;
    } else if (formData.carteIdentite.length !== 8) {
      console.log("Erreur: longueur carte d'identité incorrecte");
      Alert.alert("Erreur", "La carte d'identité doit être composée de 8 chiffres");
      return false;
    } else {
      const firstChar = formData.carteIdentite.charAt(0);
      if (firstChar !== "1" && firstChar !== "0") {
        console.log("Erreur: carte d'identité non tunisienne");
        Alert.alert("Erreur", "La carte d'identité doit être tunisienne");
        return false;
      }
    }

    if (!formData.numTelephone || isNaN(parseInt(formData.numTelephone))) {
      console.log("Erreur: numéro de téléphone invalide");
      Alert.alert("Erreur", "Numéro de téléphone invalide");
      return false;
    } else {
      const firstDigit = formData.numTelephone.charAt(0);
      const validPrefixes = ["2", "5", "9", "7", "3"];
      if (!validPrefixes.includes(firstDigit)) {
        console.log("Erreur: numéro non tunisien");
        Alert.alert("Erreur", "Le numéro doit être tunisien");
        return false;
      }
    }

    if (!formData.adress.trim()) {
      console.log("Erreur: adresse manquante");
      Alert.alert("Erreur", "L'adresse est requise");
      return false;
    }

    if (!formData.references || !formData.references.some(ref => parseInt(ref) > 0)) {
      console.log("Erreur: références invalides", formData.references);
      Alert.alert("Erreur", "Au moins une référence valide est requise");
      return false;
    }

    if (!isChecked) {
      console.log("Erreur: conditions non acceptées");
      Alert.alert("Erreur", "Vous devez accepter les conditions pour vous inscrire");
      return false;
    }

    console.log("Validation réussie");
    return true;
  };

  const handleSubmit = async () => {
    console.log("Début de la soumission du formulaire");
    
    if (!validateForm()) {
      console.log("Validation du formulaire échouée");
      return;
    }

    console.log("Validation réussie, préparation des données");
    const citoyenData = {
      nom: `${formData.fname} ${formData.lname}`.trim(),
      email: formData.email,
      motDePasse: formData.password,
      carteIdentite: parseInt(formData.carteIdentite, 10),
      numTelephone: parseInt(formData.numTelephone, 10),
      adress: formData.adress,
      con: "ACTIF",
      etatSauvgarder: "NON_ARCHIVER",
      references: formData.references.filter(ref => parseInt(ref) > 0).map(ref => parseInt(ref)),
      etatCompte: "NON_BLOQUER",
    };

    console.log("Données à envoyer:", citoyenData);

    try {
      console.log("Tentative d'envoi à l'API...");
      const response = await fetch("http://localhost:8080/api/citoyens", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(citoyenData),
      });

      console.log("Réponse reçue, status:", response.status);
      
      if (response.ok) {
        console.log("Inscription réussie");
        Alert.alert(
          "Succès",
          "Inscription réussie !",
          [{ text: "OK", onPress: () => router.push("/login") }]
        );
        
        // Réinitialiser le formulaire
        setFormData({
          fname: "",
          lname: "",
          email: "",
          password: "",
          carteIdentite: "",
          numTelephone: "",
          adress: "",
          references: [""],
        });
        setIsChecked(false);
      } else {
        const errorText = await response.text();
        console.log("Erreur de l'API:", errorText);
        Alert.alert(
          "Erreur",
          errorText || "Erreur lors de l'inscription. Veuillez vérifier vos informations."
        );
      }
    } catch (error) {
      console.error("Erreur lors de la requête:", error);
      Alert.alert(
        "Erreur",
        "Erreur de connexion au serveur. Veuillez réessayer plus tard."
      );
    }
  };

  const showTerms = () => {
    Alert.alert(
      "Conditions générales d'utilisation",
      "Bienvenue sur la plateforme STEG. En utilisant nos services, vous acceptez les présentes Conditions générales d'utilisation...",
      [{ text: "OK" }]
    );
  };

  const showPrivacy = () => {
    Alert.alert(
      "Politique de confidentialité",
      "Chez STEG, nous prenons votre vie privée au sérieux. Cette Politique de confidentialité explique comment nous collectons...",
      [{ text: "OK" }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.scrollView}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <MaterialIcons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Inscription</Text>
            <View style={styles.placeholder} />
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nom*</Text>
          <TextInput
            style={styles.input}
                placeholder="Ex: Ali"
            value={formData.fname}
                onChangeText={(text) => handleChange("fname", text)}
          />
        </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Prénom*</Text>
          <TextInput
            style={styles.input}
                placeholder="Ex: Ben Salah"
            value={formData.lname}
                onChangeText={(text) => handleChange("lname", text)}
          />
        </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email*</Text>
          <TextInput
            style={styles.input}
                placeholder="Ex: ali@gmail.com"
            value={formData.email}
                onChangeText={(text) => handleChange("email", text)}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mot de passe*</Text>
              <View style={styles.passwordContainer}>
          <TextInput
                  style={styles.passwordInput}
                  placeholder="Entrez votre mot de passe"
            value={formData.password}
                  onChangeText={(text) => handleChange("password", text)}
            secureTextEntry={!showPassword}
          />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <MaterialIcons
                    name={showPassword ? "visibility" : "visibility-off"}
              size={24}
                    color="#666"
            />
          </TouchableOpacity>
              </View>
        </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Carte d'identité*</Text>
          <TextInput
            style={styles.input}
                placeholder="Ex: 11119999"
            value={formData.carteIdentite}
                onChangeText={(text) => handleChange("carteIdentite", text)}
            keyboardType="numeric"
                maxLength={8}
          />
        </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Numéro de téléphone*</Text>
          <TextInput
            style={styles.input}
                placeholder="Ex: 27777777"
            value={formData.numTelephone}
                onChangeText={(text) => handleChange("numTelephone", text)}
                keyboardType="numeric"
                maxLength={8}
          />
        </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Adresse*</Text>
          <TextInput
            style={styles.input}
                placeholder="Ex: Hay Ennour"
            value={formData.adress}
                onChangeText={(text) => handleChange("adress", text)}
          />
        </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Références*</Text>
        {formData.references.map((reference, index) => (
          <View key={index} style={styles.referenceContainer}>
              <TextInput
                    style={styles.referenceInput}
                placeholder={`Référence ${index + 1}`}
                    value={reference}
                onChangeText={(text) => handleReferenceChange(index, text)}
                keyboardType="numeric"
              />
            {formData.references.length > 1 && (
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeReference(index)}
              >
                      <MaterialIcons name="remove-circle" size={24} color="#FF4444" />
              </TouchableOpacity>
            )}
          </View>
        ))}
              <TouchableOpacity style={styles.addButton} onPress={addReference}>
                <MaterialIcons name="add" size={24} color="#FFF" />
                <Text style={styles.addButtonText}>Ajouter une référence</Text>
        </TouchableOpacity>
        </View>

            <View style={styles.termsContainer}>
        <TouchableOpacity
                style={styles.checkbox}
                onPress={() => setIsChecked(!isChecked)}
        >
                <MaterialIcons
                  name={isChecked ? "check-box" : "check-box-outline-blank"}
                  size={24}
                  color="#0047AB"
                />
        </TouchableOpacity>
              <View style={styles.termsText}>
                <Text style={styles.termsDescription}>
                  En créant un compte, vous acceptez les{" "}
                  <Text style={styles.link} onPress={showTerms}>
                    Conditions générales d'utilisation
                  </Text>{" "}
                  et notre{" "}
                  <Text style={styles.link} onPress={showPrivacy}>
                    Politique de confidentialité
                  </Text>
                  .
                </Text>
        </View>
      </View>

            <TouchableOpacity 
              style={styles.submitButton} 
              onPress={handleSubmit}
              activeOpacity={0.7}
            >
              <Text style={styles.submitButtonText}>S'inscrire</Text>
            </TouchableOpacity>
          </View>
    </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 24,
  },
  form: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingRight: 12,
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  referenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  referenceInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  removeButton: {
    marginLeft: 8,
    padding: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
    marginTop: 8,
  },
  addButtonText: {
    color: '#FFF',
    marginLeft: 8,
    fontSize: 16,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  checkbox: {
    marginRight: 8,
  },
  termsText: {
    flex: 1,
  },
  termsDescription: {
    color: '#666',
    fontSize: 14,
    lineHeight: 20,
  },
  link: {
    color: '#0047AB',
    textDecorationLine: 'underline',
  },
  submitButton: {
    backgroundColor: '#0047AB',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default RegisterScreen;