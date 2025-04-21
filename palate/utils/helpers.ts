import type { TasteProfile } from "@/types";

/**
 * Generates a random ID
 * @returns A random string ID
 */
export const generateId = (): string => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

/**
 * Calculates the similarity between two taste profiles
 * @param profile1 First taste profile
 * @param profile2 Second taste profile
 * @returns A number between 0 and 1 representing similarity (1 = identical)
 */
export const calculateTasteSimilarity = (profile1: TasteProfile, profile2: TasteProfile): number => {
    const keys = Object.keys(profile1);
    let sum = 0;

    for (const key of keys) {
        const diff = Math.abs(profile1[key as keyof TasteProfile] - profile2[key as keyof TasteProfile]);
        sum += diff;
    }

    // Average difference, normalized to 0-1 range (0 = max difference, 1 = identical)
    return 1 - (sum / keys.length);
};

/**
 * Formats a date string to a more readable format
 * @param dateString Date string in ISO format
 * @returns Formatted date string
 */
export const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

/**
 * Truncates text to a specified length
 * @param text Text to truncate
 * @param maxLength Maximum length
 * @returns Truncated text
 */
export const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
};