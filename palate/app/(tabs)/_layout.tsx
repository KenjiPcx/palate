import React from "react";
import { Tabs } from "expo-router";
import { Home, Search, ShoppingBag, User, Inbox } from "lucide-react-native";
import colors from "@/constants/colors";
// import { useUserStore } from "@/store/userStore"; // Removed Zustand dependency

export default function TabLayout() {
  // TODO: Implement fetching pending ratings/notifications via Convex query
  // const pendingRatings = useUserStore(state => state.user?.pendingRatings || []);
  // const hasPendingRatings = pendingRatings.length > 0;
  const hasPendingRatings = false; // Placeholder
  const pendingRatingsCount = 0; // Placeholder

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 0,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: colors.white,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 18,
        },
        headerTintColor: colors.text,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          tabBarIcon: ({ color }) => <Search size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",
          tabBarIcon: ({ color }) => <ShoppingBag size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: "Inbox",
          tabBarIcon: ({ color }) => <Inbox size={24} color={color} />,
          tabBarBadge: hasPendingRatings ? pendingRatingsCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: colors.primary,
          },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <User size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}