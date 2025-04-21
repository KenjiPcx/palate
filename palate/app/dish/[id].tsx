// import React, { useState } from 'react';
// import { 
//   View, 
//   Text, 
//   StyleSheet, 
//   ScrollView, 
//   Image, 
//   TouchableOpacity,
//   TextInput,
//   Animated,
//   Platform,
// } from 'react-native';
// import { useLocalSearchParams, useRouter } from 'expo-router';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { 
//   Star, 
//   Heart, 
//   Share2, 
//   Minus, 
//   Plus, 
//   MessageSquare,
//   Edit2,
//   Users,
//   ArrowLeft,
// } from 'lucide-react-native';
// import colors from '@/constants/colors';
// import { useRestaurantStore } from '@/store/restaurantStore';
// import { useUserStore } from '@/store/userStore';
// import { TasteProfileRadar } from '@/components/TasteProfileRadar';
// import { Button } from '@/components/Button';
// import { calculateTasteSimilarity } from '@/utils/helpers';

// // Mock similar users who liked this dish
// const similarUsersWhoLiked = [
//   {
//     id: 'user2',
//     name: 'Jane Smith',
//     avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
//     similarity: 0.85,
//   },
//   {
//     id: 'user3',
//     name: 'Mike Johnson',
//     avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
//     similarity: 0.72,
//   },
//   {
//     id: 'user4',
//     name: 'Sarah Lee',
//     avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
//     similarity: 0.68,
//   },
// ];

// export default function DishScreen() {
//   const { id } = useLocalSearchParams<{ id: string }>();
//   const router = useRouter();
//   const { getDishById, getRestaurantById } = useRestaurantStore();
//   const { user, addToFavoriteDishes, removeFromFavoriteDishes, addToCart, isBusinessMode } = useUserStore();
  
//   const dish = getDishById(id);
//   const restaurant = dish ? getRestaurantById(dish.restaurantId) : null;
  
//   const [quantity, setQuantity] = useState(1);
//   const [specialInstructions, setSpecialInstructions] = useState('');
//   const [scrollY] = useState(new Animated.Value(0));
  
//   const isFavorite = user?.favoriteDishes.includes(id);
//   const isOwner = isBusinessMode && restaurant?.ownerId === user?.id;
  
//   // Calculate taste match percentage
//   const tasteMatchPercentage = user?.tasteProfile ? 
//     Math.round(calculateTasteSimilarity(user.tasteProfile, dish?.tasteProfile) * 100) : 0;
  
//   if (!dish || !restaurant) {
//     return (
//       <View style={styles.notFoundContainer}>
//         <Text style={styles.notFoundText}>Dish not found</Text>
//       </View>
//     );
//   }
  
//   const handleIncrement = () => {
//     setQuantity(quantity + 1);
//   };
  
//   const handleDecrement = () => {
//     if (quantity > 1) {
//       setQuantity(quantity - 1);
//     }
//   };
  
//   const handleToggleFavorite = () => {
//     if (isFavorite) {
//       removeFromFavoriteDishes(id);
//     } else {
//       addToFavoriteDishes(id);
//     }
//   };
  
//   const handleShare = () => {
//     // Implement share functionality
//   };
  
//   const handleAddToCart = () => {
//     addToCart({
//       dish,
//       quantity,
//       specialInstructions: specialInstructions.trim() || undefined,
//     });
    
//     router.back();
//   };

//   const handleEditDish = () => {
//     router.push(`/business/edit-dish/${id}`);
//   };
  
//   const headerOpacity = scrollY.interpolate({
//     inputRange: [0, 150],
//     outputRange: [0, 1],
//     extrapolate: 'clamp',
//   });
  
//   const imageOpacity = scrollY.interpolate({
//     inputRange: [0, 150],
//     outputRange: [1, 0.3],
//     extrapolate: 'clamp',
//   });
  
//   return (
//     <View style={styles.container}>
//       <Animated.View style={[
//         styles.header,
//         { opacity: headerOpacity }
//       ]}>
//         <View style={styles.headerContent}>
//           <TouchableOpacity 
//             style={styles.backButton}
//             onPress={() => router.back()}
//           >
//             <ArrowLeft size={24} color={colors.text} />
//           </TouchableOpacity>
//           <Text style={styles.headerTitle} numberOfLines={1}>
//             {dish.name}
//           </Text>
//           <View style={styles.headerRight} />
//         </View>
//       </Animated.View>
      
//       <SafeAreaView style={styles.safeBackButton} edges={['top']}>
//         <TouchableOpacity 
//           style={styles.backButtonAbsolute}
//           onPress={() => router.back()}
//         >
//           <ArrowLeft size={24} color={colors.white} />
//         </TouchableOpacity>
//       </SafeAreaView>
      
//       <Animated.ScrollView
//         showsVerticalScrollIndicator={false}
//         onScroll={Animated.event(
//           [{ nativeEvent: { contentOffset: { y: scrollY } } }],
//           { useNativeDriver: true }
//         )}
//         scrollEventThrottle={16}
//       >
//         <View style={styles.imageContainer}>
//           <Animated.Image 
//             source={{ uri: dish.image }} 
//             style={[
//               styles.dishImage,
//               { opacity: imageOpacity }
//             ]} 
//             resizeMode="cover"
//           />
//           <SafeAreaView style={styles.imageOverlay} edges={['top']}>
//             <View style={styles.imageActions}>
//               {!isBusinessMode && (
//                 <TouchableOpacity 
//                   style={styles.actionButton}
//                   onPress={handleToggleFavorite}
//                 >
//                   <Heart 
//                     size={20} 
//                     color={colors.white} 
//                     fill={isFavorite ? colors.white : 'none'} 
//                   />
//                 </TouchableOpacity>
//               )}
//               <TouchableOpacity 
//                 style={styles.actionButton}
//                 onPress={handleShare}
//               >
//                 <Share2 size={20} color={colors.white} />
//               </TouchableOpacity>
//               {isOwner && (
//                 <TouchableOpacity 
//                   style={styles.actionButton}
//                   onPress={handleEditDish}
//                 >
//                   <Edit2 size={20} color={colors.white} />
//                 </TouchableOpacity>
//               )}
//             </View>
//           </SafeAreaView>
//         </View>
        
//         <View style={styles.content}>
//           <TouchableOpacity 
//             style={styles.restaurantLink}
//             onPress={() => router.push(`/restaurant/${restaurant.id}`)}
//           >
//             <Image 
//               source={{ uri: restaurant.image }} 
//               style={styles.restaurantImage} 
//             />
//             <Text style={styles.restaurantName}>{restaurant.name}</Text>
//           </TouchableOpacity>
          
//           <Text style={styles.dishName}>{dish.name}</Text>
          
//           <View style={styles.priceRatingContainer}>
//             <Text style={styles.price}>${dish.price.toFixed(2)}</Text>
//             {dish.averageRating > 0 && (
//               <View style={styles.ratingContainer}>
//                 <Star size={16} color={colors.rating} fill={colors.rating} />
//                 <Text style={styles.rating}>{dish.averageRating.toFixed(1)}</Text>
//                 <Text style={styles.reviewCount}>
//                   ({dish.reviews.length} {dish.reviews.length === 1 ? 'review' : 'reviews'})
//                 </Text>
//               </View>
//             )}
//           </View>
          
//           <Text style={styles.description}>{dish.description}</Text>
          
//           <View style={styles.section}>
//             <Text style={styles.sectionTitle}>Taste Profile</Text>
//             <View style={styles.tasteProfileContainer}>
//               <TasteProfileRadar 
//                 tasteProfile={dish.tasteProfile} 
//                 showValues
//               />
//             </View>
            
//             {user?.tasteProfile && (
//               <View style={styles.tasteMatchContainer}>
//                 <View style={styles.tasteMatchHeader}>
//                   <Text style={styles.tasteMatchTitle}>Your Taste Match</Text>
//                   <View style={styles.tasteMatchPercentage}>
//                     <Text style={[
//                       styles.tasteMatchValue,
//                       tasteMatchPercentage >= 80 ? styles.highMatch :
//                       tasteMatchPercentage >= 60 ? styles.mediumMatch :
//                       styles.lowMatch
//                     ]}>
//                       {tasteMatchPercentage}%
//                     </Text>
//                   </View>
//                 </View>
//                 <Text style={styles.tasteMatchDescription}>
//                   {tasteMatchPercentage >= 80 ? 
//                     "This dish perfectly matches your taste preferences!" :
//                     tasteMatchPercentage >= 60 ?
//                     "This dish aligns well with your taste preferences." :
//                     "This dish might not match your usual preferences."}
//                 </Text>
//               </View>
//             )}
//           </View>
          
//           {similarUsersWhoLiked.length > 0 && (
//             <View style={styles.section}>
//               <Text style={styles.sectionTitle}>People with Similar Taste Also Like This</Text>
//               <ScrollView 
//                 horizontal 
//                 showsHorizontalScrollIndicator={false}
//                 contentContainerStyle={styles.similarUsersContainer}
//               >
//                 {similarUsersWhoLiked.map(similarUser => (
//                   <View key={similarUser.id} style={styles.similarUserItem}>
//                     <Image 
//                       source={{ uri: similarUser.avatar }} 
//                       style={styles.similarUserAvatar} 
//                     />
//                     <View style={styles.similarUserInfo}>
//                       <Text style={styles.similarUserName}>{similarUser.name}</Text>
//                       <View style={styles.similarityContainer}>
//                         <Users size={12} color={colors.primary} />
//                         <Text style={styles.similarityText}>
//                           {Math.round(similarUser.similarity * 100)}% taste match
//                         </Text>
//                       </View>
//                     </View>
//                   </View>
//                 ))}
//               </ScrollView>
//             </View>
//           )}
          
//           {!isBusinessMode && (
//             <View style={styles.section}>
//               <Text style={styles.sectionTitle}>Special Instructions</Text>
//               <TextInput
//                 style={styles.instructionsInput}
//                 placeholder="Add notes (allergies, dietary restrictions, etc.)"
//                 placeholderTextColor={colors.textLight}
//                 value={specialInstructions}
//                 onChangeText={setSpecialInstructions}
//                 multiline
//                 maxLength={200}
//               />
//             </View>
//           )}
          
//           {dish.reviews.length > 0 && (
//             <View style={styles.section}>
//               <View style={styles.reviewsHeader}>
//                 <Text style={styles.sectionTitle}>Reviews</Text>
//                 <TouchableOpacity style={styles.seeAllButton}>
//                   <Text style={styles.seeAllText}>See All</Text>
//                 </TouchableOpacity>
//               </View>
              
//               {dish.reviews.slice(0, 2).map((review) => (
//                 <View key={review.id} style={styles.reviewItem}>
//                   <View style={styles.reviewHeader}>
//                     <Image 
//                       source={{ uri: review.userAvatar }} 
//                       style={styles.reviewerImage} 
//                     />
//                     <View style={styles.reviewerInfo}>
//                       <Text style={styles.reviewerName}>{review.userName}</Text>
//                       <Text style={styles.reviewDate}>{review.date}</Text>
//                     </View>
//                     <View style={styles.reviewRating}>
//                       <Star size={14} color={colors.rating} fill={colors.rating} />
//                       <Text style={styles.reviewRatingText}>{review.rating}</Text>
//                     </View>
//                   </View>
//                   <Text style={styles.reviewComment}>{review.comment}</Text>
//                 </View>
//               ))}
              
//               <TouchableOpacity style={styles.writeReviewButton}>
//                 <MessageSquare size={16} color={colors.primary} />
//                 <Text style={styles.writeReviewText}>Write a Review</Text>
//               </TouchableOpacity>
//             </View>
//           )}
          
//           <View style={styles.spacer} />
//         </View>
//       </Animated.ScrollView>
      
//       {!isBusinessMode && (
//         <View style={styles.footer}>
//           <View style={styles.quantityContainer}>
//             <TouchableOpacity 
//               style={styles.quantityButton}
//               onPress={handleDecrement}
//               disabled={quantity <= 1}
//             >
//               <Minus size={20} color={quantity <= 1 ? colors.textLight : colors.text} />
//             </TouchableOpacity>
//             <Text style={styles.quantity}>{quantity}</Text>
//             <TouchableOpacity 
//               style={styles.quantityButton}
//               onPress={handleIncrement}
//             >
//               <Plus size={20} color={colors.text} />
//             </TouchableOpacity>
//           </View>
          
//           <Button
//             title={`Add to Cart - $${(dish.price * quantity).toFixed(2)}`}
//             onPress={handleAddToCart}
//             style={styles.addButton}
//           />
//         </View>
//       )}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: colors.background,
//   },
//   header: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     height: Platform.OS === 'ios' ? 90 : 60,
//     backgroundColor: colors.white,
//     zIndex: 10,
//     borderBottomWidth: 1,
//     borderBottomColor: colors.border,
//   },
//   headerContent: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: 16,
//     height: '100%',
//     paddingTop: Platform.OS === 'ios' ? 40 : 0,
//   },
//   backButton: {
//     width: 40,
//     height: 40,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   headerTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: colors.text,
//     flex: 1,
//     textAlign: 'center',
//   },
//   headerRight: {
//     width: 40,
//   },
//   safeBackButton: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     zIndex: 5,
//   },
//   backButtonAbsolute: {
//     width: 40,
//     height: 40,
//     alignItems: 'center',
//     justifyContent: 'center',
//     margin: 8,
//     backgroundColor: 'rgba(0, 0, 0, 0.3)',
//     borderRadius: 20,
//   },
//   imageContainer: {
//     height: 250,
//     position: 'relative',
//   },
//   dishImage: {
//     width: '100%',
//     height: '100%',
//   },
//   imageOverlay: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     zIndex: 1,
//   },
//   imageActions: {
//     flexDirection: 'row',
//     justifyContent: 'flex-end',
//     padding: 16,
//   },
//   actionButton: {
//     width: 36,
//     height: 36,
//     borderRadius: 18,
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginLeft: 8,
//   },
//   content: {
//     backgroundColor: colors.white,
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     marginTop: -20,
//     paddingHorizontal: 16,
//     paddingTop: 20,
//   },
//   restaurantLink: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 16,
//   },
//   restaurantImage: {
//     width: 24,
//     height: 24,
//     borderRadius: 12,
//     marginRight: 8,
//   },
//   restaurantName: {
//     fontSize: 14,
//     color: colors.primary,
//   },
//   dishName: {
//     fontSize: 24,
//     fontWeight: '600',
//     color: colors.text,
//     marginBottom: 8,
//   },
//   priceRatingContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     marginBottom: 16,
//   },
//   price: {
//     fontSize: 20,
//     fontWeight: '600',
//     color: colors.text,
//   },
//   ratingContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   rating: {
//     fontSize: 14,
//     fontWeight: '500',
//     color: colors.text,
//     marginLeft: 4,
//   },
//   reviewCount: {
//     fontSize: 12,
//     color: colors.textLight,
//     marginLeft: 4,
//   },
//   description: {
//     fontSize: 16,
//     color: colors.text,
//     lineHeight: 24,
//     marginBottom: 24,
//   },
//   section: {
//     marginBottom: 24,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: colors.text,
//     marginBottom: 12,
//   },
//   tasteProfileContainer: {
//     alignItems: 'center',
//     marginBottom: 16,
//   },
//   tasteMatchContainer: {
//     backgroundColor: colors.card,
//     borderRadius: 12,
//     padding: 16,
//   },
//   tasteMatchHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 8,
//   },
//   tasteMatchTitle: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: colors.text,
//   },
//   tasteMatchPercentage: {
//     backgroundColor: colors.white,
//     paddingHorizontal: 10,
//     paddingVertical: 4,
//     borderRadius: 16,
//   },
//   tasteMatchValue: {
//     fontSize: 14,
//     fontWeight: '700',
//   },
//   highMatch: {
//     color: colors.success,
//   },
//   mediumMatch: {
//     color: colors.warning,
//   },
//   lowMatch: {
//     color: colors.error,
//   },
//   tasteMatchDescription: {
//     fontSize: 14,
//     color: colors.text,
//     lineHeight: 20,
//   },
//   similarUsersContainer: {
//     paddingVertical: 8,
//   },
//   similarUserItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: colors.card,
//     padding: 12,
//     borderRadius: 12,
//     marginRight: 12,
//     width: 220,
//   },
//   similarUserAvatar: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//   },
//   similarUserInfo: {
//     marginLeft: 12,
//     flex: 1,
//   },
//   similarUserName: {
//     fontSize: 14,
//     fontWeight: '500',
//     color: colors.text,
//     marginBottom: 2,
//   },
//   similarityContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   similarityText: {
//     fontSize: 12,
//     color: colors.primary,
//     marginLeft: 4,
//   },
//   instructionsInput: {
//     borderWidth: 1,
//     borderColor: colors.border,
//     borderRadius: 8,
//     padding: 12,
//     fontSize: 14,
//     color: colors.text,
//     minHeight: 80,
//     textAlignVertical: 'top',
//   },
//   reviewsHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 12,
//   },
//   seeAllButton: {
//     padding: 4,
//   },
//   seeAllText: {
//     fontSize: 14,
//     color: colors.primary,
//   },
//   reviewItem: {
//     marginBottom: 16,
//     padding: 12,
//     backgroundColor: colors.card,
//     borderRadius: 8,
//   },
//   reviewHeader: {
//     flexDirection: 'row',
//     marginBottom: 8,
//   },
//   reviewerImage: {
//     width: 36,
//     height: 36,
//     borderRadius: 18,
//   },
//   reviewerInfo: {
//     flex: 1,
//     marginLeft: 8,
//     justifyContent: 'center',
//   },
//   reviewerName: {
//     fontSize: 14,
//     fontWeight: '500',
//     color: colors.text,
//   },
//   reviewDate: {
//     fontSize: 12,
//     color: colors.textLight,
//   },
//   reviewRating: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   reviewRatingText: {
//     fontSize: 14,
//     fontWeight: '500',
//     color: colors.text,
//     marginLeft: 4,
//   },
//   reviewComment: {
//     fontSize: 14,
//     color: colors.text,
//     lineHeight: 20,
//   },
//   writeReviewButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 12,
//     borderWidth: 1,
//     borderColor: colors.primary,
//     borderRadius: 8,
//     marginTop: 8,
//   },
//   writeReviewText: {
//     fontSize: 14,
//     fontWeight: '500',
//     color: colors.primary,
//     marginLeft: 8,
//   },
//   spacer: {
//     height: 100,
//   },
//   footer: {
//     position: 'absolute',
//     bottom: 0,
//     left: 0,
//     right: 0,
//     backgroundColor: colors.white,
//     borderTopWidth: 1,
//     borderTopColor: colors.border,
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   quantityContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginRight: 16,
//   },
//   quantityButton: {
//     width: 36,
//     height: 36,
//     borderRadius: 18,
//     backgroundColor: colors.card,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   quantity: {
//     fontSize: 16,
//     fontWeight: '500',
//     color: colors.text,
//     marginHorizontal: 12,
//     minWidth: 20,
//     textAlign: 'center',
//   },
//   addButton: {
//     flex: 1,
//   },
//   notFoundContainer: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//     padding: 20,
//   },
//   notFoundText: {
//     fontSize: 18,
//     fontWeight: '500',
//     color: colors.text,
//   },
// });