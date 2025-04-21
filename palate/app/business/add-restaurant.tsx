import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  Slider,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image as ImageIcon, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import colors from '@/constants/colors';
import { useRestaurantStore } from '@/store/restaurantStore';
import { Button } from '@/components/Button';
import { TasteProfileRadar } from '@/components/TasteProfileRadar';
import { TasteProfile } from '@/types';
import { generateId } from '@/utils/helpers';

export default function AddDishScreen() {
  const { restaurantId } = useLocalSearchParams<{ restaurantId: string }>();
  const router = useRouter();
  const { getRestaurantById, addDish } = useRestaurantStore();
  
  const restaurant = getRestaurantById(restaurantId);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [tasteProfile, setTasteProfile] = useState<TasteProfile>({
    sweet: 0.5,
    salty: 0.5,
    sour: 0.5,
    bitter: 0.5,
    umami: 0.5,
    spicy: 0.5,
  });
  
  if (!restaurant) {
    return (
      <View style={styles.notFoundContainer}>
        <Text style={styles.notFoundText}>Restaurant not found</Text>
      </View>
    );
  }
  
  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };
  
  const handleTasteProfileChange = (taste: keyof TasteProfile, value: number) => {
    setTasteProfile(prev => ({
      ...prev,
      [taste]: value,
    }));
  };
  
  const handleSubmit = () => {
    if (!name || !description || !price || !category || !image) {
      Alert.alert('Error', 'Please fill in all fields and add an image');
      return;
    }
    
    const priceValue = parseFloat(price);
    if (isNaN(priceValue) || priceValue <= 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }
    
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const newDish = {
        id: `dish-${generateId()}`,
        name,
        description,
        price: priceValue,
        image,
        tasteProfile,
        category,
        reviews: [],
        averageRating: 0,
        restaurantId,
      };
      
      addDish(restaurantId, newDish);
      setIsLoading(false);
      
      Alert.alert(
        'Success',
        'Dish added successfully',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    }, 1500);
  };
  
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
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Category</Text>
            <TextInput
              style={styles.input}
              value={category}
              onChangeText={setCategory}
              placeholder="e.g. Appetizer, Main Course, Dessert"
            />
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dish Image</Text>
          
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
              onPress={handlePickImage}
            >
              <ImageIcon size={24} color={colors.textLight} />
              <Text style={styles.imagePickerText}>Upload Dish Image</Text>
            </TouchableOpacity>
          )}
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
            />
          </View>
          
          <View style={styles.slidersContainer}>
            <View style={styles.sliderItem}>
              <Text style={styles.sliderLabel}>Sweet</Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={1}
                step={0.1}
                value={tasteProfile.sweet}
                onValueChange={(value) => handleTasteProfileChange('sweet', value)}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.border}
                thumbTintColor={colors.primary}
              />
              <Text style={styles.sliderValue}>{Math.round(tasteProfile.sweet * 10)}</Text>
            </View>
            
            <View style={styles.sliderItem}>
              <Text style={styles.sliderLabel}>Salty</Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={1}
                step={0.1}
                value={tasteProfile.salty}
                onValueChange={(value) => handleTasteProfileChange('salty', value)}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.border}
                thumbTintColor={colors.primary}
              />
              <Text style={styles.sliderValue}>{Math.round(tasteProfile.salty * 10)}</Text>
            </View>
            
            <View style={styles.sliderItem}>
              <Text style={styles.sliderLabel}>Sour</Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={1}
                step={0.1}
                value={tasteProfile.sour}
                onValueChange={(value) => handleTasteProfileChange('sour', value)}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.border}
                thumbTintColor={colors.primary}
              />
              <Text style={styles.sliderValue}>{Math.round(tasteProfile.sour * 10)}</Text>
            </View>
            
            <View style={styles.sliderItem}>
              <Text style={styles.sliderLabel}>Bitter</Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={1}
                step={0.1}
                value={tasteProfile.bitter}
                onValueChange={(value) => handleTasteProfileChange('bitter', value)}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.border}
                thumbTintColor={colors.primary}
              />
              <Text style={styles.sliderValue}>{Math.round(tasteProfile.bitter * 10)}</Text>
            </View>
            
            <View style={styles.sliderItem}>
              <Text style={styles.sliderLabel}>Umami</Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={1}
                step={0.1}
                value={tasteProfile.umami}
                onValueChange={(value) => handleTasteProfileChange('umami', value)}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.border}
                thumbTintColor={colors.primary}
              />
              <Text style={styles.sliderValue}>{Math.round(tasteProfile.umami * 10)}</Text>
            </View>
            
            <View style={styles.sliderItem}>
              <Text style={styles.sliderLabel}>Spicy</Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={1}
                step={0.1}
                value={tasteProfile.spicy}
                onValueChange={(value) => handleTasteProfileChange('spicy', value)}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.border}
                thumbTintColor={colors.primary}
              />
              <Text style={styles.sliderValue}>{Math.round(tasteProfile.spicy * 10)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        <Button
          title="Add Dish"
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
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.textLight,
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
  tasteProfileContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  slidersContainer: {
    marginTop: 16,
  },
  sliderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sliderLabel: {
    width: 50,
    fontSize: 14,
    color: colors.text,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  sliderValue: {
    width: 30,
    textAlign: 'right',
    fontSize: 14,
    color: colors.text,
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