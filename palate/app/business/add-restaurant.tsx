import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import colors from '@/constants/colors';
import { Button } from '@/components/Button';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';

export default function AddRestaurantScreen() {
    const router = useRouter();
    const createRestaurantMutation = useMutation(api.restaurants.createRestaurant);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [address, setAddress] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Please enter a restaurant name.');
            return;
        }

        setIsLoading(true);

        try {
            console.log("Creating restaurant...");
            const newRestaurantId = await createRestaurantMutation({
                name: name.trim(),
                description: description.trim() || undefined,
                address: address.trim() || undefined,
            });
            console.log("Restaurant created with ID:", newRestaurantId);

            Alert.alert(
                'Success',
                'Restaurant created successfully! You can now add images and more details.',
                [
                    {
                        text: 'OK',
                        onPress: () => router.replace(`/business/edit-restaurant/${newRestaurantId}`),
                    },
                ]
            );

        } catch (error) {
            console.error("Failed to create restaurant:", error);
            Alert.alert('Error', `Failed to create restaurant: ${error instanceof Error ? error.message : String(error)}`);
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <ScrollView>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Add New Restaurant</Text>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Name *</Text>
                        <TextInput
                            style={styles.input}
                            value={name}
                            onChangeText={setName}
                            placeholder="Restaurant name"
                            editable={!isLoading}
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Description</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={description}
                            onChangeText={setDescription}
                            placeholder="Describe your restaurant (optional)"
                            multiline
                            numberOfLines={4}
                            editable={!isLoading}
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Address</Text>
                        <TextInput
                            style={styles.input}
                            value={address}
                            onChangeText={setAddress}
                            placeholder="Full address (optional)"
                            editable={!isLoading}
                        />
                    </View>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <Button
                    title="Create Restaurant"
                    onPress={handleSubmit}
                    loading={isLoading}
                    disabled={isLoading}
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
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        backgroundColor: colors.card,
    },
});