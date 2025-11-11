import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';

const HomeScreen: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      {user && (
        <View style={styles.card}>
          <Text style={styles.name}>{user.name}</Text>
          {user.email ? <Text style={styles.detail}>{user.email}</Text> : null}
          {user.phone ? <Text style={styles.detail}>{user.phone}</Text> : null}
          <Text style={styles.detail}>Signed in via {user.provider}</Text>
        </View>
      )}
      <TouchableOpacity
        onPress={logout}
        style={styles.button}
        accessibilityRole="button"
        accessibilityLabel="Logout"
      >
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#ffffff' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fafafa',
    marginBottom: 20,
  },
  name: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  detail: { color: '#6b7280', marginTop: 2 },
  button: {
    marginTop: 'auto',
    backgroundColor: '#ef4444',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '700' },
});

export default HomeScreen;
