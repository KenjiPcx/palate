import React, { useState, useEffect } from 'react';
import { api } from "@/convex/_generated/api";
import { useQuery, useMutation, useAction, Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { Text, View, ActivityIndicator, StyleSheet, Button, Image, Alert, FlatList, TouchableOpacity, TextInput, ScrollView } from "react-native";
import * as ImagePicker from 'expo-image-picker';
import SignIn from '../archive/SignIn';
import OnboardingScreen from '../archive/OnboardingScreen';
import type { Id, Doc } from "@/convex/_generated/dataModel";
import { useRouter } from "expo-router";

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

// Dish item component for the consumer view
function ConsumerDishItem({ item }: { item: Doc<"dishes"> }) {
  const router = useRouter();
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
    <TouchableOpacity onPress={() => router.push(`/dish/${item._id}`)} style={styles.dishItemTouchable}>
      <View style={styles.dishItemContainer}>
        <View style={styles.dishInfoContainer}>
          <Text style={styles.dishName}>{item.name}</Text>
          {item.description && <Text style={styles.dishDescription}>{item.description}</Text>}
          {item.price !== undefined && <Text style={styles.dishPrice}>${item.price.toFixed(2)}</Text>}
        </View>
        <View style={styles.dishActionsContainer}>
          <Button title="👍 Like" onPress={() => handleLog(true)} color="#FF8C42" disabled={isLogging} />
          <View style={{width: 5}} /> 
          <Button title="👎 Dislike" onPress={() => handleLog(false)} color="#FF6B6B" disabled={isLogging} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

// Dish item component for the business view
function BusinessDishItem({ item }: { item: Doc<"dishes"> }) {
  const router = useRouter();
  const generateUploadUrl = useAction(api.dishes.generateDishImageUploadUrl);
  const linkImage = useMutation(api.dishes.linkDishImage);

  const [isUploading, setIsUploading] = useState(false);

  const pickAndUploadImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to upload images.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const selectedImage = result.assets[0];
      setIsUploading(true);
      try {
        const postUrl = await generateUploadUrl({ dishId: item._id });
        const response = await fetch(selectedImage.uri);
        const blob = await response.blob();
        const uploadResponse = await fetch(postUrl, {
          method: "POST",
          headers: { "Content-Type": blob.type ?? 'image/jpeg' },
          body: blob,
        });

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          throw new Error(`Image upload failed: ${uploadResponse.status} ${errorText}`);
        }

        const { storageId } = await uploadResponse.json();
        await linkImage({ dishId: item._id, storageId: storageId });

        Alert.alert("Success", "Dish image updated!");

      } catch (error) {
        console.error("Dish image upload failed:", error);
        Alert.alert("Upload Error", error instanceof Error ? error.message : "Could not upload the image.");
      } finally {
        setIsUploading(false);
      }
    }
  };

  return (
    <TouchableOpacity onPress={() => router.push(`/dish/${item._id}`)} style={styles.dishItemTouchable}>
        <View style={styles.dishItemContainer}>
          {item.imageUrl && <Image source={{ uri: item.imageUrl }} style={styles.dishThumbnail} />}
          <View style={styles.dishInfoContainer}>
              <Text style={styles.dishName}>{item.name}</Text>
              {item.description && <Text style={styles.dishDescription}>{item.description}</Text>}
              {item.price !== undefined && <Text style={styles.dishPrice}>${item.price.toFixed(2)}</Text>}
          </View>
          <View style={styles.dishUploadButtonContainer}>
              <Button
                title={isUploading ? "Uploading..." : "Upload Img"}
                onPress={pickAndUploadImage}
                color={isUploading ? "#aaa" : "#FF8C42"}
                disabled={isUploading}
              />
          </View>
        </View>
    </TouchableOpacity>
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
        <View style={styles.backButtonContainer}>
            <Button title="< Back to Restaurants" onPress={() => setSelectedRestaurant(null)} color="#FF8C42" />
        </View>
        <RestaurantDishesScreen restaurant={selectedRestaurant} />
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
function BusinessHome({ restaurantId, restaurantName, onSwitchView }: { 
    restaurantId: Id<"restaurants">, 
    restaurantName: string, 
    onSwitchView: () => void 
}) {
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
      <View style={styles.businessHeader}>
        <Text style={styles.title}>Restaurant: {restaurantName}</Text>
        <Button title="Switch to Consumer View" onPress={onSwitchView} color="#FF8C42" />
      </View>

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
            renderItem={({ item }) => <BusinessDishItem item={item} />}
            keyExtractor={(item) => item._id}
            style={styles.dishList}
          />
        )}
      </View>

    </View>
  );
}

// Screen to Register a NEW Restaurant
function RegisterRestaurantScreen({ onCancel, onRegistered }: { onCancel: () => void, onRegistered: (newId: Id<"restaurants">) => void }) {
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
      const newId = await createRestaurant({ name, address: address || undefined });
      onRegistered(newId); // Callback on success
    } catch (error) {
      console.error("Failed to create restaurant:", error);
      const message = error instanceof Error ? error.message : "Could not register your restaurant.";
      Alert.alert("Error", message);
      setIsLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.formContainer}> 
      <Text style={styles.title}>Register New Restaurant</Text>
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
      <View style={styles.formButtons}>
        {isLoading ? (
          <ActivityIndicator size="large" color="#FF6B6B" />
        ) : (
          <Button title="Register" onPress={handleSubmit} color="#FF6B6B" disabled={isLoading} />
        )}
        <Button title="Cancel" onPress={onCancel} color="#aaa" disabled={isLoading} />
      </View>
    </ScrollView>
  );
}

// Screen to Manage a SINGLE Restaurant (Upload Menu, View Dishes)
function BusinessRestaurantManager({ restaurant, onBack }: { restaurant: Doc<"restaurants">, onBack: () => void }) {
  const generateUploadUrl = useAction(api.menus.generateMenuUploadUrl);
  const processMenu = useAction(api.menus.processUploadedMenu);
  const dishes = useQuery(api.dishes.getForRestaurant, { restaurantId: restaurant._id });
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
      // Pass correct restaurant ID
      await processMenu({ storageId, restaurantId: restaurant._id }); 
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
       <View style={styles.businessHeader}>
         <Button title="< Back to Dashboard" onPress={onBack} color="#FF8C42" />
         {/* Center title by adding spacer or adjusting flex */}
         <Text style={[styles.title, { flex: 1, textAlign: 'center' }]}>{restaurant.name}</Text> 
         <View style={{width: 50}} />{/* Spacer */}
       </View>
       
       {/* Upload Section */}
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
            renderItem={({ item }) => <BusinessDishItem item={item} />} // Use BusinessDishItem
            keyExtractor={(item) => item._id}
            style={styles.dishList}
          />
        )}
      </View>
    </View>
  );
}

// Screen to list owned restaurants and add new ones
function BusinessDashboard({ restaurants, onSelectRestaurant, onAddRestaurant, onSwitchView }: { // Added onSwitchView
  restaurants: Doc<"restaurants">[],
  onSelectRestaurant: (restaurant: Doc<"restaurants">) => void,
  onAddRestaurant: () => void,
  onSwitchView: () => void, // Added prop
}) {
   return (
     <View style={styles.container}>
       <View style={styles.dashboardHeader}> 
         <Text style={styles.title}>Your Restaurants</Text>
         <Button title="Switch to Consumer" onPress={onSwitchView} color="#FF8C42" />
       </View>
       <View style={styles.dashboardActions}>
         <Button title="Add New Restaurant" onPress={onAddRestaurant} color="#FF6B6B" />
       </View>
       <FlatList
         data={restaurants}
         renderItem={({ item }) => (
           <TouchableOpacity onPress={() => onSelectRestaurant(item)} style={styles.restaurantItemContainer}>
             <Text style={styles.restaurantName}>{item.name}</Text>
           </TouchableOpacity>
         )}
         keyExtractor={(item) => item._id}
         style={styles.restaurantList}
         ListEmptyComponent={<Text style={styles.noDishesText}>You haven't added any restaurants yet.</Text>}
       />
     </View>
   );
}

// This component renders content based on the authenticated user's role
function AuthenticatedContent() {
  const user = useQuery(api.users.getCurrentUser);
  const myRestaurants = useQuery(
    api.restaurants.getMyRestaurants, // Use plural query
    user?.role === "business" ? {} : "skip"
  );

  // State for business view navigation
  type BusinessView = { screen: 'dashboard' } | { screen: 'register' } | { screen: 'manage', restaurant: Doc<"restaurants"> };
  const [businessView, setBusinessView] = useState<BusinessView>({ screen: 'dashboard' });

  // State for overall view mode (consumer vs business)
  const [viewMode, setViewMode] = useState<'consumer' | 'business' | 'loading'>('loading');

  // Effect to set initial view mode and reset business view on role change
  useEffect(() => {
    if (user?.role) {
      setViewMode(user.role);
      // If role changes, reset business view to dashboard
      if (user.role === 'business') {
          setBusinessView({ screen: 'dashboard' });
      }
    }
  }, [user?.role]);

  // Loading States
  if (viewMode === 'loading' || user === undefined) {
    return <ActivityIndicator style={styles.container} />;
  }
  if (user === null) return <SignIn />;
  if (!user.role) return <OnboardingScreen />;

  // Consumer Role View (or Business user toggled to Consumer)
  if (viewMode === "consumer") {
    return (
        <View style={styles.container}>
            {/* Show switch button only if user *is* a business owner */} 
            {user.role === 'business' && (
                <View style={styles.switchButtonContainer}> 
                    <Button title="Switch to Business Mgmt" onPress={() => setViewMode('business')} color="#FF6B6B" />
                </View>
            )}
            <ConsumerHome />
        </View>
    );
  }

  // Business Role Views
  if (viewMode === "business") {
     // Need to wait for restaurant list query for business users
    if (myRestaurants === undefined) {
       return <ActivityIndicator style={styles.container} />;
    }
    
    // Force registration if no restaurants and not already registering
    if (myRestaurants.length === 0 && businessView.screen !== 'register') {
      return <RegisterRestaurantScreen
                // Provide a way back if possible, maybe force dashboard view on cancel?
                onCancel={() => { Alert.alert("Required", "Please add your first restaurant."); /* Or setBusinessView({ screen: 'dashboard' }) ? */ }}
                onRegistered={() => setBusinessView({ screen: 'dashboard' })} 
             />;
    }

    // Render specific business screen based on state
    switch (businessView.screen) {
      case 'register':
        return <RegisterRestaurantScreen
                  onCancel={() => setBusinessView({ screen: 'dashboard' })}
                  onRegistered={() => setBusinessView({ screen: 'dashboard' })}
               />;
      case 'manage':
        return <BusinessRestaurantManager
                  restaurant={businessView.restaurant}
                  onBack={() => setBusinessView({ screen: 'dashboard' })}
               />;
      case 'dashboard':
        return <BusinessDashboard
                  restaurants={myRestaurants} // Pass the list
                  onSelectRestaurant={(restaurant) => setBusinessView({ screen: 'manage', restaurant })}
                  onAddRestaurant={() => setBusinessView({ screen: 'register' })}
                  onSwitchView={() => setViewMode('consumer')} // Add switch handler
               />;
    }
  }

  return <View style={styles.container}><Text>Loading...</Text></View>;
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
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF8C42',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
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
  businessHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 5, // Add some padding
  },
  backButtonContainer: {
    width: '100%', 
    alignItems: 'flex-start', // Align button to the left
    marginBottom: 10, 
  },
   switchButtonContainer: {
    width: '100%',
    alignItems: 'flex-end',
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  formContainer: { // Style for registration form
    flexGrow: 1, 
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    width: '100%',
  },
  input: {
    width: '90%',
    height: 40,
    borderColor: '#FF8C42', 
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  formButtons: {
    width: '80%',
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  dashboardHeader: {
     width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 5, 
  },
  dashboardActions: {
     width: '90%',
     marginBottom: 20,
     alignItems: 'center',
  },
  dishItemTouchable: {
    marginBottom: 10,
  },
  dishThumbnail: {
    width: 50,
    height: 50,
    borderRadius: 5,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#FFD1B3',
  },
  dishUploadButtonContainer: {
    marginLeft: 10,
  },
});