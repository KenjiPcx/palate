import React, { useState, useEffect } from 'react';
import { api } from "@/convex/_generated/api";
import { useQuery, useMutation, useAction, Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { Text, View, ActivityIndicator, StyleSheet, Button, Image, Alert, FlatList, TouchableOpacity } from "react-native";
import * as ImagePicker from 'expo-image-picker';
import SignIn from './SignIn';
import OnboardingScreen from './OnboardingScreen';
import RegisterRestaurantScreen from './RegisterRestaurantScreen';
import type { Id, Doc } from "@/convex/_generated/dataModel";

// Simple placeholder for viewing dishes of a selected restaurant
function RestaurantDishesScreen({ restaurant }: { restaurant: Doc<"restaurants"> }) {
  const dishes = useQuery(api.dishes.getForRestaurant, { restaurantId: restaurant._id });

  return (
    <View style={styles.modalContainer}> {/* Use a modal-like style */}
      <Text style={styles.modalTitle}>{restaurant.name} - Menu</Text>
      {dishes === undefined && <ActivityIndicator color="#FF6B6B" />}
      {dishes && dishes.length === 0 && <Text style={styles.noDishesText}>No dishes found for this restaurant.</Text>}
      {dishes && dishes.length > 0 && (
        <FlatList
          data={dishes}
          renderItem={({ item }) => <ConsumerDishItem item={item} />} // Use ConsumerDishItem
          keyExtractor={(item) => item._id}
          style={styles.dishList}
        />
      )}
    </View>
  );
}

// Dish item component for the consumer view (includes Log button)
function ConsumerDishItem({ item }: { item: Doc<"dishes"> }) {
  // Add logAndRateDish mutation hook
  const logDish = useMutation(api.history.logAndRateDish); 
  const [isLogging, setIsLogging] = useState(false);
  
  const handleLog = async (liked: boolean) => {
    setIsLogging(true);
    try {
      await logDish({ dishId: item._id, liked });
      Alert.alert("Logged!", `Your rating for ${item.name} has been saved.`);
    } catch (error) {
        console.error("Failed to log dish rating:", error);
        Alert.alert("Error", error instanceof Error ? error.message : "Could not save your rating.");
    } finally {
        setIsLogging(false);
    }
  }

  return (
    <View style={styles.dishItemContainer}>
      <View style={styles.dishInfoContainer}>
        <Text style={styles.dishName}>{item.name}</Text>
        {item.description && <Text style={styles.dishDescription}>{item.description}</Text>}
        {item.price !== undefined && <Text style={styles.dishPrice}>${item.price.toFixed(2)}</Text>}
      </View>
      <View style={styles.dishActionsContainer}>
        <Button 
          title="👍 Like" 
          onPress={() => handleLog(true)} 
          color="#FF8C42" 
          disabled={isLogging} 
        />
        {/* Add a small gap */}
        <View style={{width: 5}} /> 
        <Button 
          title="👎 Dislike" 
          onPress={() => handleLog(false)} 
          color="#FF6B6B" 
          disabled={isLogging} 
        />
      </View>
    </View>
  );
}

// --- ConsumerHome Implementation ---
function ConsumerHome() {
  const restaurants = useQuery(api.restaurants.getAll);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Doc<"restaurants"> | null>(null);

  // Use useAction for recommendations
  const getRecommendationsAction = useAction(api.recommendations.getRecommendations);
  const [recommendationsData, setRecommendationsData] = useState<Doc<"dishes">[] | null>(null);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(true);
  const [recommendationsError, setRecommendationsError] = useState<string | null>(null);

  // Effect to fetch recommendations
  useEffect(() => {
    const fetchRecs = async () => {
      setIsLoadingRecommendations(true);
      setRecommendationsError(null);
      try {
        const recs = await getRecommendationsAction({ limit: 5 });
        setRecommendationsData(recs);
      } catch (error) {
        console.error("Failed to fetch recommendations:", error);
        setRecommendationsError(error instanceof Error ? error.message : "Unknown error");
      } finally {
        setIsLoadingRecommendations(false);
      }
    };
    void fetchRecs(); // Call async function
    // Re-fetch if the action reference changes (unlikely but good practice)
  }, [getRecommendationsAction]);

  if (restaurants === undefined) {
    return <ActivityIndicator style={styles.container} color="#FF6B6B" />;
  }

  // Simple modal-like display for selected restaurant dishes
  if (selectedRestaurant) {
    return (
      <View style={styles.container}> 
          <RestaurantDishesScreen restaurant={selectedRestaurant} />
          <Button title="Back to Restaurants" onPress={() => setSelectedRestaurant(null)} color="#ccc" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Recommendations Section */}
      <View style={styles.recommendationsSection}>
        <Text style={styles.sectionTitle}>Dishes You Might Like</Text>
        {isLoadingRecommendations && <ActivityIndicator color="#FF8C42" />}
        {recommendationsError && <Text style={styles.errorText}>Error: {recommendationsError}</Text>}
        {!isLoadingRecommendations && !recommendationsError && recommendationsData && recommendationsData.length > 0 && (
          <FlatList
            data={recommendationsData} // Use state variable
            renderItem={({ item }) => <ConsumerDishItem item={item} />}
            keyExtractor={(item) => `rec-${item._id}`}
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            style={styles.recommendationsList}
          />
        )}
        {!isLoadingRecommendations && !recommendationsError && (!recommendationsData || recommendationsData.length === 0) && (
           <Text style={styles.noDishesText}>Rate some dishes to get recommendations!</Text>
        )}
      </View>

      {/* Explore Restaurants Section */} 
      <View style={styles.exploreSection}>
        <Text style={styles.sectionTitle}>Explore Restaurants</Text>
        {restaurants === undefined && <ActivityIndicator color="#FF6B6B" />}
        <FlatList
          data={restaurants}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => setSelectedRestaurant(item)} style={styles.restaurantItemContainer}>
              <Text style={styles.restaurantName}>{item.name}</Text>
              {item.address && <Text style={styles.restaurantAddress}>{item.address}</Text>}
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item._id}
          style={styles.restaurantList}
          ListEmptyComponent={<Text style={styles.noDishesText}>No restaurants found yet.</Text>}
        />
      </View>
    </View>
  );
}

// Dish item component for the list
function DishItem({ item }: { item: Doc<"dishes"> }) {
  return (
    <View style={styles.dishItemContainer}>
      <Text style={styles.dishName}>{item.name}</Text>
      {item.description && <Text style={styles.dishDescription}>{item.description}</Text>}
      {item.price !== undefined && <Text style={styles.dishPrice}>${item.price.toFixed(2)}</Text>}
      {/* Add buttons for edit/delete/profile later */}
    </View>
  );
}

// Updated Business Home component
function BusinessHome({ restaurantId, restaurantName }: { restaurantId: Id<"restaurants">, restaurantName: string }) {
  const generateUploadUrl = useAction(api.menus.generateMenuUploadUrl);
  const processMenu = useAction(api.menus.processUploadedMenu);
  // Query for dishes
  const dishes = useQuery(api.dishes.getForRestaurant, { restaurantId });

  const [selectedImage, setSelectedImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to upload menus.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0]);
    } else {
      setSelectedImage(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedImage) {
      Alert.alert("No Image", "Please select a menu image first.");
      return;
    }
    setUploading(true);
    setProcessing(false);

    try {
      const postUrl = await generateUploadUrl({});
      const response = await fetch(selectedImage.uri);
      const blob = await response.blob();
      const uploadResponse = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": blob.type },
        body: blob,
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${await uploadResponse.text()}`);
      }
      const { storageId } = await uploadResponse.json();
      setUploading(false);
      Alert.alert("Upload Successful", "Menu image uploaded!");
      setSelectedImage(null);

      setProcessing(true);
      await processMenu({ storageId, restaurantId }); 
      setProcessing(false);
      Alert.alert("Processing Started", "Your menu is being processed.");

    } catch (error) {
      console.error("Upload failed:", error);
      Alert.alert("Upload Error", error instanceof Error ? error.message : "Could not upload the menu image.");
      setUploading(false);
      setProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Restaurant: {restaurantName}</Text>

      <View style={styles.uploadSection}>
        <Button title="Select Menu Image" onPress={pickImage} color="#FF8C42" />
        {selectedImage && (
          <View style={styles.previewContainer}>
            <Image source={{ uri: selectedImage.uri }} style={styles.previewImage} />
            <Button title="Upload Selected Menu" onPress={handleUpload} color="#FF6B6B" disabled={uploading || processing} />
          </View>
        )}
        {uploading && <ActivityIndicator size="large" color="#FF6B6B" style={{ marginTop: 10 }} />} 
        {processing && <Text style={{ marginTop: 10, color: '#FF8C42' }}>Processing menu...</Text>}
      </View>

      {/* Display Dishes Section */}
      <View style={styles.dishesSection}>
        <Text style={styles.sectionTitle}>Menu Items</Text>
        {dishes === undefined && <ActivityIndicator color="#FF6B6B" />}
        {dishes && dishes.length === 0 && (
          <Text style={styles.noDishesText}>No menu items found yet. Upload a menu to get started.</Text>
        )}
        {dishes && dishes.length > 0 && (
          <FlatList
            data={dishes}
            renderItem={({ item }) => <DishItem item={item} />}
            keyExtractor={(item) => item._id}
            style={styles.dishList}
          />
        )}
      </View>

    </View>
  );
}

// This component renders content based on the authenticated user's role
function AuthenticatedContent() {
  const user = useQuery(api.users.getCurrentUser);
  const myRestaurant = useQuery(
    api.restaurants.getMyRestaurant,
    user?.role === "business" ? {} : "skip"
  );

  if (user === undefined) {
    // Still loading user data
    return <ActivityIndicator style={styles.container} />;
  }

  if (user === null) {
    console.error("Authenticated user data is null, this shouldn't happen.");
    return <SignIn />;
  }

  // User data loaded, check role for onboarding
  if (!user.role) {
    return <OnboardingScreen />;
  }

  // Role-specific content
  if (user.role === "consumer") {
    return <ConsumerHome />;
  }

  if (user.role === "business") {
    // Check if restaurant data is still loading for the business user
    if (myRestaurant === undefined) {
        return <ActivityIndicator style={styles.container} />;
    }
    // If no restaurant exists, show registration screen
    if (myRestaurant === null) {
        return <RegisterRestaurantScreen />;
    }
    // If restaurant exists, show business home
    return <BusinessHome restaurantId={myRestaurant._id} restaurantName={myRestaurant.name} />;
  }

  // Fallback
  return <View style={styles.container}><Text>Unknown user role.</Text></View>;
}

export default function Index() {
  return (
    <>
      <AuthLoading>
        <ActivityIndicator style={styles.container} />
      </AuthLoading>
      <Unauthenticated>
        <SignIn />
      </Unauthenticated>
      <Authenticated>
        <AuthenticatedContent />
      </Authenticated>
    </>
  );
}

// Updated Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
    paddingHorizontal: 10,
    backgroundColor: '#FFF8F0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#FF6B6B',
    textAlign: 'center',
  },
  uploadSection: {
    alignItems: 'center',
    marginBottom: 20,
    width: '95%',
    padding: 15,
    borderWidth: 1,
    borderColor: '#FFD1B3',
    borderRadius: 10,
    backgroundColor: '#FFF8F0'
  },
  previewContainer: {
    marginTop: 15,
    alignItems: 'center',
  },
  previewImage: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#FF8C42'
  },
  dishesSection: {
    width: '95%',
    flex: 1,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#FFD1B3',
    paddingTop: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#FF6B6B',
  },
  dishList: {
    width: '100%',
  },
  dishItemContainer: {
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF8C42',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dishInfoContainer: {
    flex: 1,
    marginRight: 10, 
  },
  dishActionsContainer: {
    flexDirection: 'row',
  },
  dishName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  dishDescription: {
    fontSize: 13,
    color: '#555',
    marginTop: 3,
  },
  dishPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginTop: 4,
  },
  noDishesText: {
    textAlign: 'center',
    color: '#888',
    marginTop: 20,
    fontSize: 16,
  },
  restaurantList: {
    width: '100%',
  },
  restaurantItemContainer: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFD1B3',
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF8C42',
  },
  restaurantAddress: {
    fontSize: 14,
    color: '#777',
    marginTop: 5,
  },
  modalContainer: {
    flex: 1,
    width: '100%',
    padding: 15,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#FF6B6B',
    textAlign: 'center',
  },
  recommendationsSection: {
    marginBottom: 20,
    paddingVertical: 10,
  },
  recommendationsList: {
  },
  exploreSection: {
    flex: 1,
    width: '100%',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginVertical: 10,
  },
});