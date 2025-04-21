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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Camera, Image as ImageIcon, X, Trash2 } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import colors from '@/constants/colors';
import { useRestaurantStore } from '@/store/restaurantStore';
import { Button } from '@/components/Button';

export default function EditRestaurantScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getRestaurantById, updateRestaurant, deleteRestaurant } = useRestaurantStore();
  
  const restaurant = getRestaurantById(id);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [categories, setCategories] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  useEffect(() => {
    if (restaurant) {
      setName(restaurant.name);
      setDescription(restaurant.description);
      setAddress(restaurant.address);
      setCategories(restaurant.categories.join(', '));
      setImage(restaurant.image);
      setCoverImage(restaurant.coverImage);
    }
  }, [restaurant]);
  
  if (!restaurant) {
    return (
      <View style={styles.notFoundContainer}>
        <Text style={styles.notFoundText}>Restaurant not found</Text>
      </View>
    );
  }
  
  const handlePickImage = async (setImageFunc: (uri: string) => void) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    
    if (!result.canceled) {
      setImageFunc(result.assets[0].uri);
    }
  };
  
  const handleSubmit = () => {
    if (!name || !description || !address || !categories || !image || !coverImage) {
      Alert.alert('Error', 'Please fill in all fields and add images');
      return;
    }
    
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const updatedRestaurant = {
        name,
        description,
        image,
        coverImage,
        address,
        categories: categories.split(',').map(cat => cat.trim()),
      };
      
      updateRestaurant(id, updatedRestaurant);
      setIsLoading(false);
      
      Alert.alert(
        'Success',
        'Restaurant updated successfully',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    }, 1500);
  };
  
  const handleDelete = () => {
    Alert.alert(
      'Delete Restaurant',
      'Are you sure you want to delete this restaurant? This action cannot be undone and will delete all dishes associated with this restaurant.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setIsDeleting(true);
            
            // Simulate API call
            setTimeout(() => {
              deleteRestaurant(id);
              setIsDeleting(false);
              router.replace('/profile');
            }, 1000);
          },
        },
      ]
    );
  };
  
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
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Address</Text>
            <TextInput
              style={styles.input}
              value={address}
              onChangeText={setAddress}
              placeholder="Full address"
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Categories</Text>
            <TextInput
              style={styles.input}
              value={categories}
              onChangeText={setCategories}
              placeholder="Italian, Pizza, Pasta (comma separated)"
            />
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Restaurant Images</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Logo Image</Text>
            {image ? (
              <View style={styles.imagePreviewContainer}>
                <Image 
                  source={{ uri: image }} 
                  style={styles.imagePreview} 
                />
                <TouchableOpacity 
                  style={styles.removeImageButton}
                  onPress={() => setImage(null)}
                >
                  <X size={16} color={colors.white} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.imagePicker}
                onPress={() => handlePickImage(setImage)}
              >
                <ImageIcon size={24} color={colors.textLight} />
                <Text style={styles.imagePickerText}>Upload Logo</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Cover Image</Text>
            {coverImage ? (
              <View style={styles.imagePreviewContainer}>
                <Image 
                  source={{ uri: coverImage }} 
                  style={styles.coverImagePreview} 
                />
                <TouchableOpacity 
                  style={styles.removeImageButton}
                  onPress={() => setCoverImage(null)}
                >
                  <X size={16} color={colors.white} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.imagePicker}
                onPress={() => handlePickImage(setCoverImage)}
              >
                <ImageIcon size={24} color={colors.textLight} />
                <Text style={styles.imagePickerText}>Upload Cover Image</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={handleDelete}
          disabled={isDeleting}
        >
          <Trash2 size={20} color={colors.white} />
          <Text style={styles.deleteButtonText}>Delete Restaurant</Text>
        </TouchableOpacity>
      </ScrollView>
      
      <View style={styles.footer}>
        <Button
          title="Save Changes"
          onPress={handleSubmit}
          loading={isLoading}
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
  section: {
    backgroundColor: colors.white,
    marginBottom: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  imagePicker: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    borderStyle: 'dashed',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePickerText: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 8,
  },
  imagePreviewContainer: {
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  coverImagePreview: {
    width: '100%',
    height: 150,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.white,
    marginLeft: 8,
  },
  footer: {
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  notFoundContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  notFoundText: {
    fontSize: 18,
    fontWeight: '500',
    color: colors.text,
  },
});