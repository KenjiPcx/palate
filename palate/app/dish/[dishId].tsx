import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, SafeAreaView } from 'react-native';
import {RadarChart} from '@salmonco/react-native-radar-chart';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';


// Basic styles (theme later)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#FFF8F0',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#FF6B6B',
  },
  description: {
    fontSize: 16,
    marginBottom: 15,
    color: '#555',
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF8C42',
    marginBottom: 20,
  },
  tasteTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
    color: '#FF6B6B',
  },
  tasteItem: {
    fontSize: 16,
    marginLeft: 10,
    marginBottom: 3,
  },
  notFoundText: {
      fontSize: 18,
      color: '#888',
      textAlign: 'center',
      marginTop: 50,
  },
});

export default function DishDetailScreen() {
  const { dishId } = useLocalSearchParams<{ dishId: Id<"dishes"> }>();

  // Fetch dish data - skip query if dishId is somehow missing
  const dish = useQuery(api.dishes.getDishById, dishId ? { dishId } : "skip");

  if (dish === undefined) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  if (dish === null) {
    return (
      <View style={styles.container}>
         {/* Use Stack Screen to customize header title */}
        <Stack.Screen options={{ title: "Dish Not Found" }} /> 
        <Text style={styles.notFoundText}>Sorry, this dish could not be found.</Text>
      </View>
    );
  }

  const data = Object.entries(dish.tasteProfile?.scores ?? {}).map(([key, value]) => ({
    label: key.charAt(0).toUpperCase() + key.slice(1),
    value: value,
  }));

  return (
    <ScrollView style={styles.container}>
      {/* Set header title to dish name */}
      <Stack.Screen options={{ title: dish.name }} /> 
      
      <Text style={styles.title}>{dish.name}</Text>
      {dish.description && <Text style={styles.description}>{dish.description}</Text>}
      {dish.price !== undefined && <Text style={styles.price}>${dish.price.toFixed(2)}</Text>}

      {/* Restore text list display */}
      {dish.tasteProfile?.scores ? (
        <View> 
            <Text style={styles.tasteTitle}>Taste Profile:</Text>
            <SafeAreaView style={styles.container}>
            <RadarChart
                data={data}
                maxValue={100}
                gradientColor={{
                startColor: '#FF9432',
                endColor: '#FFF8F1',
                count: 5,
                }}
                stroke={['#FFE8D3', '#FFE8D3', '#FFE8D3', '#FFE8D3', '#ff9532']}
                strokeWidth={[0.5, 0.5, 0.5, 0.5, 1]}
                strokeOpacity={[1, 1, 1, 1, 0.13]}
                labelColor="#433D3A"
                dataFillColor="#FF9432"
                dataFillOpacity={0.8}
                dataStroke="salmon"
                dataStrokeWidth={2}
                isCircle
            />
            </SafeAreaView>
        </View>
      ) : (
          <Text style={styles.tasteTitle}>Taste Profile: Not available</Text>
      )}
      
      {/* TODO: Add Taste Profile Tags if implemented */}
      {/* TODO: Add editing capabilities for business users */} 
    </ScrollView>
  );
} 