import { useAuthActions } from "@convex-dev/auth/react";
import { makeRedirectUri } from "expo-auth-session";
import { openAuthSessionAsync } from "expo-web-browser";
import { Button, Platform, Alert } from "react-native";
 
const redirectTo = makeRedirectUri();
 
export default function SignIn() {
  const { signIn } = useAuthActions();
  const handleSignIn = async () => {
    try {
      const { redirect } = await signIn("github", { redirectTo });

      if (!redirect) {
        Alert.alert("Sign In Error", "Failed to get redirect URL from Convex.");
        return;
      }

      if (Platform.OS === "web") {
        return;
      }

      const result = await openAuthSessionAsync(redirect.toString(), redirectTo);

      if (result.type === "success") {
        const { url } = result;
        const code = new URL(url).searchParams.get("code");

        if (!code) {
          Alert.alert("Sign In Error", "Failed to extract authorization code from redirect URL.");
          return;
        }

        await signIn("github", { code });

      } else if (result.type === "cancel" || result.type === "dismiss") {
        console.log("Sign in cancelled by user.");
      } else {
        console.warn(`Auth session ended with unexpected type: ${result.type}`);
        Alert.alert("Sign In Info", "Authentication session ended without completing.");
      }
    } catch (error) {
      console.error("Sign in failed:", error);
      Alert.alert("Sign In Error", error instanceof Error ? error.message : "An unexpected error occurred during sign in.");
    }
  };
  return <Button onPress={handleSignIn} title="Sign in with GitHub" />;
}