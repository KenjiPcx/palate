import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Edit, PlusSquare, Trash2 } from 'lucide-react-native'; // Icons for actions
import colors from '@/constants/colors';
import { Button } from '@/components/Button'; // For Add Restaurant button

// --- Convex Imports ---
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Doc, Id } from '@/convex/_generated/dataModel';
// ---------------------

// Define Restaurant type based on getMyRestaurants query (adjust if needed)
type MyRestaurant = Doc<"restaurants">;

export default function ManageScreen() {
    const router = useRouter();

    // --- Fetch user's restaurants ---
    const myRestaurants = useQuery(api.restaurants.getMyRestaurants);
    // TODO: Add delete mutation if needed directly here, or handle in edit screen
    // const deleteRestaurantMutation = useMutation(api.restaurants.deleteRestaurant);
    // ------------------------------

    const navigateToEditRestaurant = (restaurantId: Id<"restaurants">) => {
        router.push(`/business/edit-restaurant/${restaurantId}`);
    };

    const navigateToAddDish = (restaurantId: Id<"restaurants">) => {
        router.push(`/business/add-dish?restaurantId=${restaurantId}`);
    };

    const navigateToAddRestaurant = () => {
        // TODO: Implement Add Restaurant Screen/Flow
        // Option 1: Create a new screen `app/business/add-restaurant.tsx`
        // Option 2: Reuse `edit-restaurant` with a creation mode?
        // For now, just log or show an alert
        // alert("Navigate to Add Restaurant screen (not implemented)");
        router.push('/business/add-restaurant');
    };

    // --- Render Logic ---
    const renderRestaurantItem = ({ item }: { item: MyRestaurant }) => (
        <View style={styles.restaurantCard}>
            <View style={styles.restaurantInfo}>
                {/* TODO: Fetch and display image? getMyRestaurants doesn't return URLs yet */}
                {/* <Image source={{ uri: '...' }} style={styles.restaurantImage} /> */}
                <View style={styles.restaurantTextContainer}>
                    <Text style={styles.restaurantName}>{item.name}</Text>
                    <Text style={styles.restaurantAddress}>{item.address}</Text>
                    {/* Add other info like description, status (Open/Closed) if available */}
                </View>
            </View>
            <View style={styles.restaurantActions}>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => navigateToAddDish(item._id)}
                >
                    <PlusSquare size={20} color={colors.primary} />
                    <Text style={styles.actionText}>Add Dish</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => navigateToEditRestaurant(item._id)}
                >
                    <Edit size={20} color={colors.primary} />
                    <Text style={styles.actionText}>Edit</Text>
                </TouchableOpacity>
                {/* Optional: Delete button (consider confirmation) */}
                {/* <TouchableOpacity style={styles.actionButton}> 
            <Trash2 size={20} color={colors.error} /> 
            <Text style={[styles.actionText, { color: colors.error }]}>Delete</Text>
        </TouchableOpacity> */}
            </View>
        </View>
    );

    // --- Loading State ---
    if (myRestaurants === undefined) {
        return (
            <SafeAreaView style={styles.loadingContainer} edges={['top']}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text>Loading your restaurants...</Text>
            </SafeAreaView>
        );
    }

    // --- Empty State ---
    if (myRestaurants.length === 0) {
        return (
            <SafeAreaView style={styles.emptyContainer} edges={['top']}>
                <Text style={styles.emptyTitle}>No Restaurants Yet</Text>
                <Text style={styles.emptySubtitle}>Add your first restaurant to get started.</Text>
                <Button
                    title="Add Restaurant"
                    onPress={navigateToAddRestaurant}
                    style={styles.addButtonLarge}
                />
            </SafeAreaView>
        );
    }

    // --- Main Render ---
    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Manage Restaurants</Text>
                {/* Add Filter/Search later if needed */}
            </View>

            <FlatList
                data={myRestaurants}
                renderItem={renderRestaurantItem}
                keyExtractor={(item) => item._id.toString()}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={() => (
                    <Button
                        title="Add New Restaurant"
                        onPress={navigateToAddRestaurant}
                        style={styles.addButtonHeader}
                    />
                )}
            />
        </SafeAreaView>
    );
}

// --- Styles --- (Adapt from explore/other screens)
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
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: colors.background,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 8,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 16,
        color: colors.textLight,
        marginBottom: 24,
        textAlign: 'center',
    },
    addButtonLarge: {
        width: '80%',
    },
    addButtonHeader: {
        marginHorizontal: 16,
        marginBottom: 10,
        marginTop: 5, // Add some top margin
    },
    header: {
        padding: 16,
        backgroundColor: colors.white,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text,
    },
    listContent: {
        paddingVertical: 10, // Reduced padding
    },
    restaurantCard: {
        backgroundColor: colors.white,
        borderRadius: 12,
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 16,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
    },
    restaurantInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    restaurantImage: {
        width: 60,
        height: 60,
        borderRadius: 8,
        marginRight: 12,
        backgroundColor: colors.border, // Placeholder bg
    },
    restaurantTextContainer: {
        flex: 1,
    },
    restaurantName: {
        fontSize: 17,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 4,
    },
    restaurantAddress: {
        fontSize: 13,
        color: colors.textLight,
    },
    restaurantActions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 6,
        // backgroundColor: `${colors.primary}15`, // Optional background
    },
    actionText: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.primary,
        marginLeft: 6,
    },
}); 