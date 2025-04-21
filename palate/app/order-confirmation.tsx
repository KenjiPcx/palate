// import React, { useEffect } from 'react';
// import { 
//   View, 
//   Text, 
//   StyleSheet, 
//   Image,
//   Animated,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { useRouter } from 'expo-router';
// import { Check } from 'lucide-react-native';
// import colors from '@/constants/colors';
// import { useUserStore } from '@/store/userStore';
// import { Button } from '@/components/Button';

// export default function OrderConfirmationScreen() {
//   const router = useRouter();
//   const { user } = useUserStore();
  
//   const scaleAnim = new Animated.Value(0);
//   const opacityAnim = new Animated.Value(0);
  
//   useEffect(() => {
//     Animated.sequence([
//       Animated.timing(scaleAnim, {
//         toValue: 1,
//         duration: 400,
//         useNativeDriver: true,
//       }),
//       Animated.timing(opacityAnim, {
//         toValue: 1,
//         duration: 400,
//         useNativeDriver: true,
//       }),
//     ]).start();
//   }, []);
  
//   const handleTrackOrder = () => {
//     router.push('/orders');
//   };
  
//   const handleRateItems = () => {
//     router.push('/inbox');
//   };
  
//   const handleContinueShopping = () => {
//     router.push('/');
//   };
  
//   const latestOrder = user?.orders[0];
//   const hasPendingRatings = (user?.pendingRatings.length || 0) > 0;
  
//   return (
//     <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
//       <View style={styles.content}>
//         <Animated.View 
//           style={[
//             styles.checkContainer,
//             {
//               transform: [{ scale: scaleAnim }],
//             }
//           ]}
//         >
//           <Check size={60} color={colors.white} />
//         </Animated.View>
        
//         <Animated.View style={{ opacity: opacityAnim }}>
//           <Text style={styles.title}>Order Confirmed!</Text>
//           <Text style={styles.subtitle}>
//             Your order has been placed successfully
//           </Text>
          
//           {latestOrder && (
//             <View style={styles.orderInfo}>
//               <Image 
//                 source={{ uri: latestOrder.restaurantImage }} 
//                 style={styles.restaurantImage} 
//               />
//               <View style={styles.orderDetails}>
//                 <Text style={styles.restaurantName}>
//                   {latestOrder.restaurantName}
//                 </Text>
//                 <Text style={styles.orderItems}>
//                   {latestOrder.items.length} {latestOrder.items.length === 1 ? 'item' : 'items'}
//                 </Text>
//                 <Text style={styles.orderTotal}>
//                   Total: ${latestOrder.total.toFixed(2)}
//                 </Text>
//               </View>
//             </View>
//           )}
          
//           <View style={styles.deliveryInfo}>
//             <Text style={styles.deliveryTitle}>Estimated Delivery Time</Text>
//             <Text style={styles.deliveryTime}>
//               {latestOrder?.estimatedDeliveryTime || '30-45 minutes'}
//             </Text>
//             <Text style={styles.deliveryAddress}>
//               {latestOrder?.deliveryAddress || '123 Main St, New York, NY'}
//             </Text>
//           </View>
          
//           <Text style={styles.thankYou}>
//             Thank you for your order!
//           </Text>
          
//           {hasPendingRatings && (
//             <Text style={styles.ratingPrompt}>
//               Don't forget to rate your dishes after delivery!
//             </Text>
//           )}
//         </Animated.View>
//       </View>
      
//       <View style={styles.footer}>
//         <Button
//           title="Track Order"
//           onPress={handleTrackOrder}
//           style={styles.trackButton}
//         />
        
//         {hasPendingRatings && (
//           <Button
//             title="Rate Items"
//             onPress={handleRateItems}
//             variant="secondary"
//             style={styles.rateButton}
//           />
//         )}
        
//         <Button
//           title="Continue Shopping"
//           onPress={handleContinueShopping}
//           variant="outline"
//           style={styles.continueButton}
//         />
//       </View>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: colors.white,
//   },
//   content: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//     padding: 20,
//   },
//   checkContainer: {
//     width: 100,
//     height: 100,
//     borderRadius: 50,
//     backgroundColor: colors.success,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginBottom: 24,
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: '600',
//     color: colors.text,
//     textAlign: 'center',
//     marginBottom: 8,
//   },
//   subtitle: {
//     fontSize: 16,
//     color: colors.textLight,
//     textAlign: 'center',
//     marginBottom: 32,
//   },
//   orderInfo: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: colors.card,
//     borderRadius: 12,
//     padding: 16,
//     marginBottom: 24,
//     width: '100%',
//   },
//   restaurantImage: {
//     width: 60,
//     height: 60,
//     borderRadius: 30,
//     marginRight: 16,
//   },
//   orderDetails: {
//     flex: 1,
//   },
//   restaurantName: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: colors.text,
//     marginBottom: 4,
//   },
//   orderItems: {
//     fontSize: 14,
//     color: colors.textLight,
//     marginBottom: 4,
//   },
//   orderTotal: {
//     fontSize: 14,
//     fontWeight: '500',
//     color: colors.text,
//   },
//   deliveryInfo: {
//     backgroundColor: colors.card,
//     borderRadius: 12,
//     padding: 16,
//     marginBottom: 24,
//     width: '100%',
//     alignItems: 'center',
//   },
//   deliveryTitle: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: colors.text,
//     marginBottom: 8,
//   },
//   deliveryTime: {
//     fontSize: 24,
//     fontWeight: '700',
//     color: colors.primary,
//     marginBottom: 8,
//   },
//   deliveryAddress: {
//     fontSize: 14,
//     color: colors.textLight,
//     textAlign: 'center',
//   },
//   thankYou: {
//     fontSize: 16,
//     fontWeight: '500',
//     color: colors.text,
//     textAlign: 'center',
//     marginBottom: 8,
//   },
//   ratingPrompt: {
//     fontSize: 14,
//     color: colors.primary,
//     textAlign: 'center',
//   },
//   footer: {
//     padding: 16,
//   },
//   trackButton: {
//     marginBottom: 12,
//   },
//   rateButton: {
//     marginBottom: 12,
//   },
//   continueButton: {
//     backgroundColor: 'transparent',
//   },
// });