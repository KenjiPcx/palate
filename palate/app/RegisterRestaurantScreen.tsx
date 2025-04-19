import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

// Styles (can be themed later)
const styles = StyleSheet.create({
  container: {
    flexGrow: 1, // Use flexGrow for ScrollView content
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
  input: {
    width: '90%',
    height: 40,
    borderColor: '#FF8C42', // Orange
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  buttonContainer: {
    width: '80%',
    marginTop: 10,
  },
});

export default function RegisterRestaurantScreen() {
  const createRestaurant = useMutation(api.restaurants.createRestaurant);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert("Missing Information", "Please enter a restaurant name.");
      return;
    }
    setIsLoading(true);
    try {
      await createRestaurant({ name, address: address || undefined });
      // On success, the parent component (AuthenticatedContent) will re-render
      // and show the BusinessHome instead of this screen.
    } catch (error) {
      console.error("Failed to create restaurant:", error);
      const message = error instanceof Error ? error.message : "Could not register your restaurant.";
      Alert.alert("Error", message);
      setIsLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Register Your Restaurant</Text>
      <TextInput
        style={styles.input}
        placeholder="Restaurant Name"
        value={name}
        onChangeText={setName}
        placeholderTextColor="#aaa"
      />
      <TextInput
        style={styles.input}
        placeholder="Address (Optional)"
        value={address}
        onChangeText={setAddress}
        placeholderTextColor="#aaa"
      />
      <View style={styles.buttonContainer}>
        {isLoading ? (
          <ActivityIndicator size="large" color="#FF6B6B" /> // Pink
        ) : (
          <Button
            title="Register Restaurant"
            onPress={handleSubmit}
            color="#FF6B6B" // Pink
            disabled={isLoading}
          />
        )}
      </View>
    </ScrollView>
  );
} 