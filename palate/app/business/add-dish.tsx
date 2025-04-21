import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image as ImageIcon, X, PlusCircle } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import colors from '@/constants/colors';
import { Button } from '@/components/Button';
import { TasteProfileRadar } from '@/components/TasteProfileRadar';
import type { TasteProfile } from '@/types';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';

async function uploadFile(uploadUrl: string, fileUri: string): Promise<Id<"_storage">> {
  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'image/jpeg' },
    body: await fetch(fileUri).then(res => res.blob()),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Upload failed: ${response.status} ${response.statusText} - ${errorBody}`);
  }

  const { storageId } = await response.json();
  if (!storageId) {
    throw new Error("Upload succeeded but storageId not found in response.");
  }
  return storageId as Id<"_storage">;
}

interface ImageState {
  url: string;
  uri: string;
}

export default function AddDishScreen() {
  const { restaurantId: restaurantIdString } = useLocalSearchParams<{ restaurantId: string }>();
  const router = useRouter();
  const restaurantId = restaurantIdString as Id<"restaurants">;
  const createDishMutation = useMutation(api.dishes.createDish);
  const updateDishAction = useAction(api.dishes.updateDishAction);
  const linkImagesMutation = useMutation(api.dishes.linkDishImagesAndUpdate);

  const restaurantData = useQuery(api.restaurants.getRestaurantForUser, restaurantId ? { restaurantId } : 'skip');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [dietaryFlags, setDietaryFlags] = useState<string[]>([]);
  const [images, setImages] = useState<ImageState[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [tasteProfile, setTasteProfile] = useState<TasteProfile>({
    sweet: 0.5,
    salty: 0.5,
    sour: 0.5,
    bitter: 0.5,
    umami: 0.5,
    spicy: 0.5,
  });

  useEffect(() => {
    if (restaurantData === null) {
      Alert.alert("Error", "Restaurant not found or you don't have permission to add dishes to it.", [
        { text: "OK", onPress: () => router.back() }
      ]);
    }
  }, [restaurantData, router]);

  if (restaurantData === undefined && restaurantId) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text>Loading restaurant data...</Text>
      </View>
    );
  }

  const handleAddImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const newUri = result.assets[0].uri;
      setImages(prev => [...prev, { url: newUri, uri: newUri }]);
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImages(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleTasteProfileChange = (taste: keyof TasteProfile, value: number) => {
    setTasteProfile(prev => ({ ...prev, [taste]: value }));
  };

  const handleSubmit = async () => {
    if (!restaurantId) {
      Alert.alert('Error', 'Restaurant ID is missing.');
      return;
    }
    if (!name || !description || !price || !category) {
      Alert.alert('Error', 'Please fill in Name, Description, Price, and Category.');
      return;
    }
    if (images.length === 0) {
      Alert.alert('Error', 'Please add at least one image for the dish.');
      return;
    }

    const priceValue = Number.parseFloat(price);
    if (Number.isNaN(priceValue) || priceValue <= 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }

    setIsLoading(true);

    try {
      console.log("Creating dish...");
      const newDishId = await createDishMutation({
        restaurantId,
        name,
        description,
        price: priceValue,
        category,
        tasteProfile,
        dietaryFlags,
        isAvailable,
      });
      console.log("Dish created with ID:", newDishId);

      if (images.length > 0) {
        console.log(`Requesting ${images.length} upload URLs for new dish ${newDishId}...`);
        const { uploadUrls } = await updateDishAction({
          dishId: newDishId,
          newImageCount: images.length
        });
        console.log("Received URLs:", uploadUrls);

        if (uploadUrls.length !== images.length) {
          throw new Error("Mismatch between requested and received upload URLs.");
        }

        console.log("Uploading images...");
        const uploadPromises = images.map((imageState, index) =>
          uploadFile(uploadUrls[index], imageState.uri)
            .then(storageId => {
              console.log(`Image ${index + 1} upload successful, storageId:`, storageId);
              return storageId;
            })
            .catch(err => {
              console.error(`Image ${index + 1} upload failed:`, err);
              throw new Error(`Failed to upload image ${index + 1}.`);
            })
        );

        const uploadedImageIds = await Promise.all(uploadPromises);
        console.log("Uploads complete. New Storage IDs:", uploadedImageIds);

        console.log("Linking images to dish...");
        await linkImagesMutation({
          dishId: newDishId,
          imageIds: uploadedImageIds,
        });
        console.log("Images linked successfully.");
      }

      Alert.alert(
        'Success',
        'Dish added successfully',
        [{ text: 'OK', onPress: () => router.back() }]
      );

    } catch (error) {
      console.error('Failed to add dish:', error);
      Alert.alert('Error', `Failed to add dish: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const renderImageItem = ({ item, index }: { item: ImageState; index: number }) => (
    <View style={styles.imageListItem}>
      <Image source={{ uri: item.url }} style={styles.imagePreview} />
      <TouchableOpacity
        style={styles.removeImageButton}
        onPress={() => handleRemoveImage(index)}
        disabled={isLoading}
      >
        <X size={16} color={colors.white} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add New Dish</Text>
          <Text style={styles.restaurantName}>To: {restaurantData?.name ?? '...'}</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Dish name"
              editable={!isLoading}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe your dish"
              multiline
              numberOfLines={4}
              editable={!isLoading}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Price ($)</Text>
            <TextInput
              style={styles.input}
              value={price}
              onChangeText={setPrice}
              placeholder="0.00"
              keyboardType="decimal-pad"
              editable={!isLoading}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Category</Text>
            <TextInput
              style={styles.input}
              value={category}
              onChangeText={setCategory}
              placeholder="e.g. Appetizer, Main Course, Dessert"
              editable={!isLoading}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dish Images</Text>

          <FlatList
            data={images}
            renderItem={renderImageItem}
            keyExtractor={(item, index) => `new-image-${index}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.imageList}
            ListFooterComponent={() => (
              <TouchableOpacity
                style={styles.addImageButton}
                onPress={handleAddImage}
                disabled={isLoading}
              >
                <PlusCircle size={30} color={colors.primary} />
                <Text style={styles.addImageText}>Add</Text>
              </TouchableOpacity>
            )}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Taste Profile</Text>
          <Text style={styles.sectionDescription}>
            Adjust the sliders to set the initial taste profile
          </Text>

          <View style={styles.tasteProfileContainer}>
            <TasteProfileRadar
              tasteProfile={tasteProfile}
              showValues
              size={250}
            />
          </View>

          <View style={styles.slidersContainer}>
            {Object.keys(tasteProfile).map((key) => (
              <View key={key} style={styles.sliderItem}>
                <Text style={styles.sliderLabel}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
                <TextInput
                  style={styles.sliderValueInput}
                  value={tasteProfile[key as keyof TasteProfile].toFixed(2)}
                  onChangeText={(text) => {
                    const numValue = Number.parseFloat(text);
                    if (!Number.isNaN(numValue) && numValue >= 0 && numValue <= 1) {
                      handleTasteProfileChange(key as keyof TasteProfile, numValue);
                    }
                  }}
                  keyboardType="numeric"
                  editable={!isLoading}
                />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Add Dish"
          onPress={handleSubmit}
          loading={isLoading}
          disabled={isLoading || restaurantData === undefined || restaurantData === null}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  section: {
    marginHorizontal: 20,
    marginVertical: 15,
    padding: 20,
    backgroundColor: colors.card,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 5,
  },
  restaurantName: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 15,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 15,
  },
  formGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 5,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  imageList: {
    marginBottom: 15,
  },
  imageListItem: {
    marginRight: 10,
    position: 'relative',
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: colors.white,
  },
  removeImageButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: colors.error,
    borderRadius: 15,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  addImageText: {
    marginTop: 5,
    color: colors.primary,
    fontSize: 14,
  },
  tasteProfileContainer: {
    alignItems: 'center',
    marginBottom: 20,
    minHeight: 260,
  },
  slidersContainer: {
    marginTop: 10,
  },
  sliderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sliderLabel: {
    width: 60,
    fontSize: 14,
    color: colors.text,
    marginRight: 10,
  },
  sliderValueInput: {
    flex: 1,
    height: 40,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    fontSize: 14,
    marginLeft: 10,
    textAlign: 'center',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
  notFoundContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: colors.background,
  },
  notFoundText: {
    fontSize: 18,
    color: colors.text,
    textAlign: 'center',
  },
});