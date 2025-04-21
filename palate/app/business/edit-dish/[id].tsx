import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image as ImageIcon, X, Trash2, PlusCircle } from 'lucide-react-native';
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
  url: string | null;
  storageId?: Id<"_storage">;
  uri?: string;
}

export default function EditDishScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const dishId = id as Id<"dishes">;

  const dishData = useQuery(api.dishes.getDishById, dishId ? { dishId } : 'skip');
  const updateDishAction = useAction(api.dishes.updateDishAction);
  const linkAndUpdateMutation = useMutation(api.dishes.linkDishImagesAndUpdate);
  const deleteDishMutation = useMutation(api.dishes.deleteDish);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [dietaryFlags, setDietaryFlags] = useState<string[]>([]);

  const [images, setImages] = useState<ImageState[]>([]);

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [tasteProfile, setTasteProfile] = useState<TasteProfile>({
    sweet: 0.5,
    salty: 0.5,
    sour: 0.5,
    bitter: 0.5,
    umami: 0.5,
    spicy: 0.5,
  });

  useEffect(() => {
    if (dishData) {
      setName(dishData.name ?? '');
      setDescription(dishData.description ?? '');
      setPrice(dishData.price?.toString() ?? '');
      setCategory(dishData.category ?? '');
      setIsAvailable(dishData.isAvailable ?? true);
      setDietaryFlags(dishData.dietaryFlags ?? []);
      setTasteProfile(dishData.tasteProfile ?? { sweet: 0.5, salty: 0.5, sour: 0.5, bitter: 0.5, umami: 0.5, spicy: 0.5 });

      const initialImages: ImageState[] = (dishData.imageIds ?? []).map((id, index) => ({
        storageId: id,
        url: dishData.imageUrls?.[index] ?? null,
      }));
      setImages(initialImages);
    }
  }, [dishData]);

  if (dishData === undefined) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text>Loading dish...</Text>
      </View>
    );
  }

  if (dishData === null) {
    return (
      <View style={styles.notFoundContainer}>
        <Text style={styles.notFoundText}>Dish not found or access denied.</Text>
        <Button title="Go Back" onPress={() => router.back()} />
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
    setTasteProfile(prev => ({
      ...prev,
      [taste]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!name || !description || !price || !category) {
      Alert.alert('Error', 'Please fill in Name, Description, Price, and Category.');
      return;
    }

    const priceValue = Number.parseFloat(price);
    if (Number.isNaN(priceValue) || priceValue <= 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }

    if (images.length === 0) {
      Alert.alert('Error', 'Please add at least one image for the dish.');
      return;
    }

    setIsSaving(true);

    try {
      const imagesToUpload = images.filter(img => img.uri && !img.storageId);
      const existingImageIds = images.filter(img => img.storageId).map(img => img.storageId as Id<"_storage">);
      let uploadedImageIds: Id<"_storage">[] = [];

      if (imagesToUpload.length > 0) {
        console.log(`Requesting ${imagesToUpload.length} upload URLs...`);
        const { uploadUrls } = await updateDishAction({
          dishId,
          newImageCount: imagesToUpload.length,
        });
        console.log("Received URLs:", uploadUrls);

        if (uploadUrls.length !== imagesToUpload.length) {
          throw new Error("Mismatch between requested and received upload URLs.");
        }

        const uploadPromises = imagesToUpload.map((imageState, index) => {
          console.log(`Uploading new image ${index + 1}...`);
          if (!imageState.uri) {
            console.error(`Image ${index + 1} is missing URI for upload.`);
            throw new Error(`Image ${index + 1} is missing URI.`);
          }
          return uploadFile(uploadUrls[index], imageState.uri)
            .then(storageId => {
              console.log(`Image ${index + 1} upload successful, storageId:`, storageId);
              return storageId;
            })
            .catch(err => {
              console.error(`Image ${index + 1} upload failed:`, err);
              throw new Error(`Failed to upload image ${index + 1}.`);
            });
        });

        uploadedImageIds = await Promise.all(uploadPromises);
        console.log("Uploads complete. New Storage IDs:", uploadedImageIds);
      }

      const finalImageIds = [...existingImageIds, ...uploadedImageIds];
      console.log("Final image IDs to save:", finalImageIds);

      console.log("Calling linkDishImagesAndUpdate mutation...");
      await linkAndUpdateMutation({
        dishId,
        name: name !== dishData.name ? name : undefined,
        description: description !== dishData.description ? description : undefined,
        price: priceValue !== dishData.price ? priceValue : undefined,
        category: category !== dishData.category ? category : undefined,
        tasteProfile: JSON.stringify(tasteProfile) !== JSON.stringify(dishData.tasteProfile) ? tasteProfile : undefined,
        dietaryFlags: JSON.stringify(dietaryFlags) !== JSON.stringify(dishData.dietaryFlags) ? dietaryFlags : undefined,
        isAvailable: isAvailable !== dishData.isAvailable ? isAvailable : undefined,
        imageIds: finalImageIds,
      });
      console.log("linkDishImagesAndUpdate successful.");

      Alert.alert(
        'Success',
        'Dish updated successfully',
        [{ text: 'OK', onPress: () => router.back() }]
      );

    } catch (error) {
      console.error('Failed to update dish:', error);
      Alert.alert('Error', `Failed to update dish: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Dish',
      'Are you sure you want to delete this dish? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await deleteDishMutation({ dishId });
              Alert.alert('Deleted', 'Dish successfully deleted.');
              router.back();
            } catch (error) {
              console.error('Failed to delete dish:', error);
              Alert.alert('Error', `Failed to delete dish: ${error instanceof Error ? error.message : String(error)}`);
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const renderImageItem = ({ item, index }: { item: ImageState; index: number }) => (
    <View style={styles.imageListItem}>
      <Image source={{ uri: item.url ?? undefined }} style={styles.imagePreview} />
      <TouchableOpacity
        style={styles.removeImageButton}
        onPress={() => handleRemoveImage(index)}
        disabled={isSaving || isDeleting}
      >
        <X size={16} color={colors.white} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dish Information</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Dish name"
              editable={!isSaving && !isDeleting}
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
              editable={!isSaving && !isDeleting}
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
              editable={!isSaving && !isDeleting}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Category</Text>
            <TextInput
              style={styles.input}
              value={category}
              onChangeText={setCategory}
              placeholder="e.g. Appetizer, Main Course, Dessert"
              editable={!isSaving && !isDeleting}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dish Images</Text>

          <FlatList
            data={images}
            renderItem={renderImageItem}
            keyExtractor={(item, index) => item.storageId ?? `new-${index}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.imageList}
            ListFooterComponent={() => (
              <TouchableOpacity
                style={styles.addImageButton}
                onPress={handleAddImage}
                disabled={isSaving || isDeleting}
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
            Adjust the sliders to set the taste profile of your dish
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
                  editable={!isSaving && !isDeleting}
                />
              </View>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.deleteButton, (isDeleting || isSaving) && styles.disabledButton]}
          onPress={handleDelete}
          disabled={isDeleting || isSaving}
        >
          {isDeleting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Trash2 size={20} color={colors.white} />
              <Text style={styles.deleteButtonText}>Delete Dish</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Save Changes"
          onPress={handleSubmit}
          loading={isSaving}
          disabled={isSaving || isDeleting || dishData === undefined}
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
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.background,
  },
  notFoundText: {
    fontSize: 18,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 20,
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
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error,
    paddingVertical: 15,
    borderRadius: 8,
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
  },
  deleteButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  disabledButton: {
    opacity: 0.7,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
});