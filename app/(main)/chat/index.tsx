import { StyleSheet, Text, View } from 'react-native';

export default function ChatPage() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Messagerie</Text>
      <Text style={styles.subtitle}>Vos conversations avec le bureau d'intervention</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 40,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
}); 