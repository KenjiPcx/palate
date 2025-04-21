// import React, { useState } from 'react';
// import { 
//   View, 
//   Text, 
//   StyleSheet, 
//   ScrollView, 
//   TouchableOpacity,
//   TextInput,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { useRouter } from 'expo-router';
// import { 
//   MapPin, 
//   CreditCard, 
//   Clock, 
//   ChevronRight, 
//   Plus,
//   Check,
// } from 'lucide-react-native';
// import colors from '@/constants/colors';
// import { useUserStore } from '@/store/userStore';
// import { Button } from '@/components/Button';

// const paymentMethods = [
//   {
//     id: 'card1',
//     type: 'Visa',
//     last4: '4242',
//     expiry: '04/25',
//   },
//   {
//     id: 'card2',
//     type: 'Mastercard',
//     last4: '5555',
//     expiry: '08/24',
//   },
// ];

// const deliveryTimes = [
//   'As soon as possible',
//   'In 30 minutes',
//   'In 1 hour',
//   'In 2 hours',
// ];

// export default function CheckoutScreen() {
//   const router = useRouter();
//   const { cart, clearCart, addOrder } = useUserStore();
  
//   const [selectedAddress, setSelectedAddress] = useState('home');
//   const [selectedPayment, setSelectedPayment] = useState(paymentMethods[0].id);
//   const [selectedTime, setSelectedTime] = useState(deliveryTimes[0]);
//   const [promoCode, setPromoCode] = useState('');
//   const [isLoading, setIsLoading] = useState(false);
  
//   const subtotal = cart.reduce((sum, item) => sum + (item.dish.price * item.quantity), 0);
//   const deliveryFee = 2.99;
//   const serviceFee = subtotal * 0.05;
//   const tax = subtotal * 0.08;
//   const discount = promoCode === 'TASTE20' ? subtotal * 0.2 : 0;
//   const total = subtotal + deliveryFee + serviceFee + tax - discount;
  
//   const handlePlaceOrder = () => {
//     setIsLoading(true);
    
//     // Simulate API call
//     setTimeout(() => {
//       // Create a new order
//       const restaurantId = cart[0].dish.restaurantId;
//       const restaurant = {
//         id: restaurantId,
//         name: 'Restaurant Name', // In a real app, get this from the restaurant store
//         image: cart[0].dish.image, // Just using the first dish image as a placeholder
//       };
      
//       const newOrder = {
//         id: `order-${Date.now()}`,
//         restaurantId: restaurant.id,
//         restaurantName: restaurant.name,
//         restaurantImage: restaurant.image,
//         items: [...cart],
//         status: 'pending' as const,
//         total,
//         date: new Date().toISOString().split('T')[0],
//         deliveryAddress: '123 Main St, New York, NY',
//         deliveryFee,
//         estimatedDeliveryTime: '30-45 min',
//       };
      
//       addOrder(newOrder);
//       clearCart();
//       setIsLoading(false);
      
//       router.push('/order-confirmation');
//     }, 2000);
//   };
  
//   return (
//     <SafeAreaView style={styles.container} edges={['bottom']}>
//       <ScrollView>
//         <View style={styles.section}>
//           <Text style={styles.sectionTitle}>Delivery Address</Text>
          
//           <TouchableOpacity 
//             style={[
//               styles.addressItem,
//               selectedAddress === 'home' && styles.selectedItem,
//             ]}
//             onPress={() => setSelectedAddress('home')}
//           >
//             <View style={styles.addressContent}>
//               <Text style={styles.addressTitle}>Home</Text>
//               <Text style={styles.addressText}>123 Main St, Apt 4B, New York, NY 10001</Text>
//             </View>
//             {selectedAddress === 'home' && (
//               <Check size={20} color={colors.primary} />
//             )}
//           </TouchableOpacity>
          
//           <TouchableOpacity 
//             style={[
//               styles.addressItem,
//               selectedAddress === 'work' && styles.selectedItem,
//             ]}
//             onPress={() => setSelectedAddress('work')}
//           >
//             <View style={styles.addressContent}>
//               <Text style={styles.addressTitle}>Work</Text>
//               <Text style={styles.addressText}>456 Park Ave, Floor 8, New York, NY 10022</Text>
//             </View>
//             {selectedAddress === 'work' && (
//               <Check size={20} color={colors.primary} />
//             )}
//           </TouchableOpacity>
          
//           <TouchableOpacity style={styles.addButton}>
//             <Plus size={16} color={colors.primary} />
//             <Text style={styles.addButtonText}>Add New Address</Text>
//           </TouchableOpacity>
//         </View>
        
//         <View style={styles.section}>
//           <Text style={styles.sectionTitle}>Payment Method</Text>
          
//           {paymentMethods.map((method) => (
//             <TouchableOpacity 
//               key={method.id}
//               style={[
//                 styles.paymentItem,
//                 selectedPayment === method.id && styles.selectedItem,
//               ]}
//               onPress={() => setSelectedPayment(method.id)}
//             >
//               <View style={styles.paymentContent}>
//                 <Text style={styles.paymentTitle}>{method.type} •••• {method.last4}</Text>
//                 <Text style={styles.paymentText}>Expires {method.expiry}</Text>
//               </View>
//               {selectedPayment === method.id && (
//                 <Check size={20} color={colors.primary} />
//               )}
//             </TouchableOpacity>
//           ))}
          
//           <TouchableOpacity style={styles.addButton}>
//             <Plus size={16} color={colors.primary} />
//             <Text style={styles.addButtonText}>Add Payment Method</Text>
//           </TouchableOpacity>
//         </View>
        
//         <View style={styles.section}>
//           <Text style={styles.sectionTitle}>Delivery Time</Text>
          
//           {deliveryTimes.map((time, index) => (
//             <TouchableOpacity 
//               key={index}
//               style={[
//                 styles.timeItem,
//                 selectedTime === time && styles.selectedItem,
//               ]}
//               onPress={() => setSelectedTime(time)}
//             >
//               <Text style={styles.timeText}>{time}</Text>
//               {selectedTime === time && (
//                 <Check size={20} color={colors.primary} />
//               )}
//             </TouchableOpacity>
//           ))}
//         </View>
        
//         <View style={styles.section}>
//           <Text style={styles.sectionTitle}>Promo Code</Text>
          
//           <View style={styles.promoContainer}>
//             <TextInput
//               style={styles.promoInput}
//               placeholder="Enter promo code"
//               value={promoCode}
//               onChangeText={setPromoCode}
//               autoCapitalize="characters"
//             />
//             <Button
//               title="Apply"
//               onPress={() => {}}
//               variant="outline"
//               size="small"
//               style={styles.promoButton}
//             />
//           </View>
          
//           {promoCode === 'TASTE20' && (
//             <Text style={styles.promoSuccess}>20% discount applied!</Text>
//           )}
//         </View>
        
//         <View style={styles.section}>
//           <Text style={styles.sectionTitle}>Order Summary</Text>
          
//           <View style={styles.summaryRow}>
//             <Text style={styles.summaryLabel}>Subtotal</Text>
//             <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
//           </View>
//           <View style={styles.summaryRow}>
//             <Text style={styles.summaryLabel}>Delivery Fee</Text>
//             <Text style={styles.summaryValue}>${deliveryFee.toFixed(2)}</Text>
//           </View>
//           <View style={styles.summaryRow}>
//             <Text style={styles.summaryLabel}>Service Fee</Text>
//             <Text style={styles.summaryValue}>${serviceFee.toFixed(2)}</Text>
//           </View>
//           <View style={styles.summaryRow}>
//             <Text style={styles.summaryLabel}>Tax</Text>
//             <Text style={styles.summaryValue}>${tax.toFixed(2)}</Text>
//           </View>
          
//           {discount > 0 && (
//             <View style={styles.summaryRow}>
//               <Text style={styles.discountLabel}>Discount</Text>
//               <Text style={styles.discountValue}>-${discount.toFixed(2)}</Text>
//             </View>
//           )}
          
//           <View style={[styles.summaryRow, styles.totalRow]}>
//             <Text style={styles.totalLabel}>Total</Text>
//             <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
//           </View>
//         </View>
//       </ScrollView>
      
//       <View style={styles.footer}>
//         <Button
//           title={`Place Order - $${total.toFixed(2)}`}
//           onPress={handlePlaceOrder}
//           loading={isLoading}
//         />
//       </View>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: colors.background,
//   },
//   section: {
//     backgroundColor: colors.white,
//     marginBottom: 16,
//     padding: 16,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: colors.text,
//     marginBottom: 16,
//   },
//   addressItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingVertical: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: colors.border,
//   },
//   selectedItem: {
//     backgroundColor: `${colors.primary}10`,
//   },
//   addressContent: {
//     flex: 1,
//     marginRight: 8,
//   },
//   addressTitle: {
//     fontSize: 16,
//     fontWeight: '500',
//     color: colors.text,
//     marginBottom: 4,
//   },
//   addressText: {
//     fontSize: 14,
//     color: colors.textLight,
//   },
//   addButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 12,
//     marginTop: 8,
//   },
//   addButtonText: {
//     fontSize: 14,
//     color: colors.primary,
//     marginLeft: 8,
//   },
//   paymentItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingVertical: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: colors.border,
//   },
//   paymentContent: {
//     flex: 1,
//   },
//   paymentTitle: {
//     fontSize: 16,
//     fontWeight: '500',
//     color: colors.text,
//     marginBottom: 4,
//   },
//   paymentText: {
//     fontSize: 14,
//     color: colors.textLight,
//   },
//   timeItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingVertical: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: colors.border,
//   },
//   timeText: {
//     fontSize: 16,
//     color: colors.text,
//   },
//   promoContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   promoInput: {
//     flex: 1,
//     borderWidth: 1,
//     borderColor: colors.border,
//     borderRadius: 8,
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//     fontSize: 14,
//     marginRight: 8,
//   },
//   promoButton: {
//     minWidth: 80,
//   },
//   promoSuccess: {
//     fontSize: 14,
//     color: colors.success,
//     marginTop: 8,
//   },
//   summaryRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: 8,
//   },
//   summaryLabel: {
//     fontSize: 14,
//     color: colors.textLight,
//   },
//   summaryValue: {
//     fontSize: 14,
//     color: colors.text,
//   },
//   discountLabel: {
//     fontSize: 14,
//     color: colors.success,
//   },
//   discountValue: {
//     fontSize: 14,
//     color: colors.success,
//   },
//   totalRow: {
//     marginTop: 8,
//     paddingTop: 8,
//     borderTopWidth: 1,
//     borderTopColor: colors.border,
//   },
//   totalLabel: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: colors.text,
//   },
//   totalValue: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: colors.text,
//   },
//   footer: {
//     backgroundColor: colors.white,
//     paddingHorizontal: 16,
//     paddingVertical: 16,
//     borderTopWidth: 1,
//     borderTopColor: colors.border,
//   },
// });