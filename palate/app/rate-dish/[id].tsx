import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TextInput, 
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import colors from '@/constants/colors';
import { useUserStore } from '@/store/userStore';
import { useRestaurantStore } from '@/store/restaurantStore';
import { StarRating } from '@/components/StarRating';
import { TasteProfileRadar } from '@/components/TasteProfileRadar';
import { Button } from '@/components/Button';
import { generateId } from '@/utils/helpers';

export default function RateDishScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  
  const { user, removePendingRating } = useUserStore();
  const { getDishById, getRestaurantById, addReview } = useRestaurantStore();
  
  const pendingRating = user?.pendingRatings.find(rating => rating.dishId === id);
  const dish = getDishById(id);
  const restaurant = dish ? getRestaurantById(dish.restaurantId) : null;
  
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  if (!pendingRating || !dish || !restaurant || !user) {
    return (
      <View style={styles.notFoundContainer}>
        <Text style={styles.notFoundText}>Dish not found</Text>
      </View>
    );
  }
  
  const handleSubmit = () => {
    if (rating === 0) {
      Alert.alert('Error', 'Please select a rating');
      return;
    }
    
    setIsSubmitting(true);
    
    // Create a new review
    const newReview = {
      id: generateId(),
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      rating,
      comment,
      date: new Date().toISOString().split('T')[0],
    };
    
    // Add the review to the dish
    addReview(restaurant.id, dish.id, newReview);
    
    // Remove the pending rating
    removePendingRating(pendingRating.id);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert(
        'Thank You!',
        'Your rating has been submitted successfully.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    }, 1000);
  };
  
  const handleSkip = () => {
    Alert.alert(
      'Skip Rating',
      'Are you sure you want to skip rating this dish?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Skip',
          onPress: () => {
            removePendingRating(pendingRating.id);
            router.back();
          },
        },
      ]
    );
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView>
        <View style={styles.header}>
          <Image 
            source={{ uri: dish.image }} 
            style={styles.dishImage} 
          />
          <View style={styles.overlay} />
          <View style={styles.dishInfo}>
            <Text style={styles.dishName}>{dish.name}</Text>
            <Text style={styles.restaurantName}>{restaurant.name}</Text>
          </View>
        </View>
        
        <View style={styles.content}>
          <View style={styles.ratingSection}>
            <Text style={styles.sectionTitle}>How would you rate this dish?</Text>
            <View style={styles.starContainer}>
              <StarRating 
                rating={rating} 
                editable={true} 
                onRatingChange={setRating}
                size={36}
              />
            </View>
          </View>
          
          <View style={styles.commentSection}>
            <Text style={styles.sectionTitle}>Share your experience</Text>
            <TextInput
              style={styles.commentInput}
              placeholder="What did you like or dislike about this dish?"
              placeholderTextColor={colors.textLight}
              multiline
              numberOfLines={4}
              value={comment}
              onChangeText={setComment}
            />
          </View>
          
          <View style={styles.tasteSection}>
            <Text style={styles.sectionTitle}>Taste Profile</Text>
            <Text style={styles.sectionSubtitle}>
              This is how this dish tastes according to our analysis
            </Text>
            <View style={styles.tasteProfileContainer}>
              <TasteProfileRadar 
                tasteProfile={dish.tasteProfile} 
                showValues
              />
            </View>
          </View>
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.skipButton}
          onPress={handleSkip}
          disabled={isSubmitting}
        >
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
        <Button
          title="Submit Rating"
          onPress={handleSubmit}
          loading={isSubmitting}
          style={styles.submitButton}
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
  header: {
    height: 200,
    position: 'relative',
  },
  dishImage: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  dishInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  dishName: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.white,
    marginBottom: 4,
  },
  restaurantName: {
    fontSize: 16,
    color: colors.white,
  },
  content: {
    padding: 16,
  },
  ratingSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 12,
  },
  starContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  commentSection: {
    marginBottom: 24,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  tasteSection: {
    marginBottom: 24,
  },
  tasteProfileContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  skipButtonText: {
    fontSize: 16,
    color: colors.textLight,
  },
  submitButton: {
    flex: 1,
    marginLeft: 8,
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