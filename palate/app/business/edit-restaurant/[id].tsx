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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Camera, Image as ImageIcon, X, Trash2 } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import colors from '@/constants/colors';
import { Button } from '@/components/Button';
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

export default function EditRestaurantScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const restaurantId = id as Id<"restaurants">;

  const restaurantData = useQuery(api.restaurants.getRestaurantById, restaurantId ? { restaurantId } : 'skip');
  const updateRestaurantAction = useAction(api.restaurants.updateRestaurant);
  const linkAndUpdateMutation = useMutation(api.restaurants.linkRestaurantImagesAndUpdate);
  const deleteRestaurantMutation = useMutation(api.restaurants.deleteRestaurant);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [newImageUri, setNewImageUri] = useState<string | null>(null);
  const [newCoverImageUri, setNewCoverImageUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (restaurantData) {
      setName(restaurantData.name);
      setDescription(restaurantData.description);
      setAddress(restaurantData.address);
      setImageUrl(restaurantData.imageUrls?.[0] ?? null);
      setCoverImageUrl(restaurantData.imageUrls?.[1] ?? null);
      setNewImageUri(null);
      setNewCoverImageUri(null);
    }
  }, [restaurantData]);

  if (restaurantData === undefined) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text>Loading restaurant...</Text>
      </View>
    );
  }

  if (restaurantData === null) {
    return (
      <View style={styles.notFoundContainer}>
        <Text style={styles.notFoundText}>Restaurant not found or access denied.</Text>
        <Button title="Go Back" onPress={() => router.back()} />
      </View>
    );
  }

  const handlePickImage = async (isCover: boolean) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: isCover ? [16, 9] : [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      if (isCover) {
        setNewCoverImageUri(result.assets[0].uri);
      } else {
        setNewImageUri(result.assets[0].uri);
      }
    }
  };

  const handleSubmit = async () => {
    if (!name || !description || !address) {
      Alert.alert('Error', 'Please fill in Name, Description, and Address.');
      return;
    }

    if (!imageUrl && !newImageUri) {
      Alert.alert('Error', 'Please upload a logo image.');
      return;
    }
    if (!coverImageUrl && !newCoverImageUri) {
      Alert.alert('Error', 'Please upload a cover image.');
      return;
    }

    setIsSaving(true);

    try {
      let finalImageId: Id<"_storage"> | undefined = restaurantData.imageId;
      let finalCoverImageId: Id<"_storage"> | undefined = restaurantData.coverImageId;

      const needsLogoUpload = !!newImageUri;
      const needsCoverUpload = !!newCoverImageUri;

      if (needsLogoUpload || needsCoverUpload) {
        console.log("Requesting upload URLs...");
        const { logoUploadUrl, coverUploadUrl } = await updateRestaurantAction({
          restaurantId,
          newImageFile: needsLogoUpload ? "new" : undefined,
          newCoverImageFile: needsCoverUpload ? "new" : undefined,
        });
        console.log("Received URLs:", { logoUploadUrl, coverUploadUrl });

        const uploadPromises: Promise<void>[] = [];
        if (needsLogoUpload && logoUploadUrl && newImageUri) {
          console.log("Uploading new logo...");
          uploadPromises.push(
            uploadFile(logoUploadUrl, newImageUri).then(storageId => {
              finalImageId = storageId;
              console.log("Logo upload successful, storageId:", storageId);
            }).catch(err => {
              console.error("Logo upload failed:", err);
              throw new Error("Failed to upload logo image.");
            })
          );
        }
        if (needsCoverUpload && coverUploadUrl && newCoverImageUri) {
          console.log("Uploading new cover...");
          uploadPromises.push(
            uploadFile(coverUploadUrl, newCoverImageUri).then(storageId => {
              finalCoverImageId = storageId;
              console.log("Cover upload successful, storageId:", storageId);
            }).catch(err => {
              console.error("Cover upload failed:", err);
              throw new Error("Failed to upload cover image.");
            })
          );
        }

        await Promise.all(uploadPromises);
        console.log("Uploads complete (if any). Final IDs:", { finalImageId, finalCoverImageId });
      }

      console.log("Calling linkAndUpdateMutation...");
      await linkAndUpdateMutation({
        restaurantId,
        name: name !== restaurantData.name ? name : undefined,
        description: description !== restaurantData.description ? description : undefined,
        address: address !== restaurantData.address ? address : undefined,
        imageId: finalImageId !== restaurantData.imageId ? finalImageId : undefined,
        coverImageId: finalCoverImageId !== restaurantData.coverImageId ? finalCoverImageId : undefined,
      });
      console.log("linkAndUpdateMutation successful.");

      Alert.alert(
        'Success',
        'Restaurant updated successfully',
        [{ text: 'OK', onPress: () => router.back() }]
      );

    } catch (error) {
      console.error('Failed to update restaurant:', error);
      Alert.alert('Error', `Failed to update restaurant: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Restaurant',
      'Are you sure you want to delete this restaurant? This action cannot be undone and will delete all associated dishes.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await deleteRestaurantMutation({ restaurantId });
              Alert.alert('Deleted', 'Restaurant successfully deleted.');
              router.replace('/(tabs)/profile');
            } catch (error) {
              console.error('Failed to delete restaurant:', error);
              Alert.alert('Error', `Failed to delete restaurant: ${error instanceof Error ? error.message : String(error)}`);
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const displayImageUri = newImageUri ?? imageUrl;
  const displayCoverImageUri = newCoverImageUri ?? coverImageUrl;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Restaurant Information</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Restaurant name"
              editable={!isSaving && !isDeleting}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe your restaurant"
              multiline
              numberOfLines={4}
              editable={!isSaving && !isDeleting}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Address</Text>
            <TextInput
              style={styles.input}
              value={address}
              onChangeText={setAddress}
              placeholder="Full address"
              editable={!isSaving && !isDeleting}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Restaurant Images</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Logo Image (1:1)</Text>
            {displayImageUri ? (
              <View style={styles.imagePreviewContainer}>
                <Image
                  source={{ uri: displayImageUri }}
                  style={styles.imagePreview}
                />
                <TouchableOpacity
                  style={styles.changeImageButton}
                  onPress={() => handlePickImage(false)}
                  disabled={isSaving || isDeleting}
                >
                  <ImageIcon size={16} color={colors.white} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.imagePicker}
                onPress={() => handlePickImage(false)}
                disabled={isSaving || isDeleting}
              >
                <ImageIcon size={24} color={colors.textLight} />
                <Text style={styles.imagePickerText}>Upload Logo</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Cover Image (16:9)</Text>
            {displayCoverImageUri ? (
              <View style={styles.imagePreviewContainer}>
                <Image
                  source={{ uri: displayCoverImageUri }}
                  style={styles.coverImagePreview}
                />
                <TouchableOpacity
                  style={styles.changeImageButton}
                  onPress={() => handlePickImage(true)}
                  disabled={isSaving || isDeleting}
                >
                  <ImageIcon size={16} color={colors.white} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.imagePicker}
                onPress={() => handlePickImage(true)}
                disabled={isSaving || isDeleting}
              >
                <ImageIcon size={24} color={colors.textLight} />
                <Text style={styles.imagePickerText}>Upload Cover Image</Text>
              </TouchableOpacity>
            )}
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
              <Text style={styles.deleteButtonText}>Delete Restaurant</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Save Changes"
          onPress={handleSubmit}
          loading={isSaving}
          disabled={isSaving || isDeleting || restaurantData === undefined}
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
  imagePicker: {
    height: 120,
    borderRadius: 8,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  imagePickerText: {
    marginTop: 8,
    color: colors.textLight,
  },
  imagePreviewContainer: {
    position: 'relative',
    alignSelf: 'flex-start',
  },
  imagePreview: {
    width: 120,
    height: 120,
    borderRadius: 8,
    backgroundColor: colors.white,
  },
  coverImagePreview: {
    width: 240,
    height: 135,
    borderRadius: 8,
    backgroundColor: colors.white,
  },
  changeImageButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 5,
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
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