import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

// Basic styles (customize with pink/orange theme later)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#FFF0E5', // Light orange background
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#FF6B6B', // Lush pink
  },
  buttonContainer: {
    width: '80%',
    marginBottom: 15,
  },
});

export default function OnboardingScreen() {
  const updateRole = useMutation(api.users.updateRole);
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectRole = async (role: 'consumer' | 'business') => {
    setIsLoading(true);
    try {
      await updateRole({ role });
      // No need to navigate, the parent component (AuthenticatedContent) will re-render
    } catch (error) {
      console.error("Failed to update role:", error);
      Alert.alert("Error", "Could not save your role selection.");
      setIsLoading(false);
    }
    // Don't set isLoading to false here, as the component will unmount on success
  };

  return (
    <View style={styles.container}>
      {isLoading ? (
        <ActivityIndicator size="large" color="#FF8C42" /> // Orange
      ) : (
        <>
          <Text style={styles.title}>Welcome to Palate! Tell us who you are:</Text>
          <View style={styles.buttonContainer}>
            <Button
              title="I'm Looking for Food (Consumer)"
              onPress={() => handleSelectRole('consumer')}
              color="#FF8C42" // Orange
            />
          </View>
          <View style={styles.buttonContainer}>
            <Button
              title="I'm a Restaurant Owner (Business)"
              onPress={() => handleSelectRole('business')}
              color="#FF6B6B" // Lush pink
            />
          </View>
        </>
      )}
    </View>
  );
} 