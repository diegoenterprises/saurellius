/**
 * SOCIAL AUTHENTICATION SERVICE
 * OAuth integration for Google, Apple, Microsoft, and Facebook
 * 
 * SETUP REQUIRED:
 * 1. Install: npx expo install expo-auth-session expo-crypto expo-web-browser expo-apple-authentication
 * 2. Configure app.json with OAuth client IDs
 * 3. Set up redirect URIs in respective developer consoles
 */

import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AppleAuthentication from 'expo-apple-authentication';
import { makeRedirectUri, useAuthRequest, ResponseType } from 'expo-auth-session';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Complete auth session for web browser
WebBrowser.maybeCompleteAuthSession();

// ============================================================
// CONFIGURATION - Add your API keys here
// ============================================================

export const OAUTH_CONFIG = {
  google: {
    // Get these from Google Cloud Console -> APIs & Services -> Credentials
    expoClientId: process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID || 'YOUR_EXPO_CLIENT_ID.apps.googleusercontent.com',
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
  },
  microsoft: {
    // Get these from Azure Portal -> App Registrations
    clientId: process.env.EXPO_PUBLIC_AZURE_CLIENT_ID || 'YOUR_AZURE_CLIENT_ID',
    tenantId: process.env.EXPO_PUBLIC_AZURE_TENANT_ID || 'common', // 'common' for multi-tenant
  },
  facebook: {
    // Get these from Meta for Developers
    appId: process.env.EXPO_PUBLIC_FACEBOOK_APP_ID || 'YOUR_FACEBOOK_APP_ID',
    clientToken: process.env.EXPO_PUBLIC_FACEBOOK_CLIENT_TOKEN || 'YOUR_FACEBOOK_CLIENT_TOKEN',
  },
};

// ============================================================
// TYPES
// ============================================================

export interface SocialAuthResult {
  success: boolean;
  provider: 'google' | 'apple' | 'microsoft' | 'facebook';
  user?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    avatar?: string;
    accessToken?: string;
    idToken?: string;
  };
  error?: string;
}

// ============================================================
// GOOGLE SIGN-IN
// ============================================================

export const useGoogleAuth = () => {
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: OAUTH_CONFIG.google.expoClientId,
    iosClientId: OAUTH_CONFIG.google.iosClientId,
    androidClientId: OAUTH_CONFIG.google.androidClientId,
    webClientId: OAUTH_CONFIG.google.webClientId,
    scopes: ['profile', 'email'],
  });

  const signInWithGoogle = async (): Promise<SocialAuthResult> => {
    try {
      const result = await promptAsync();
      
      if (result?.type === 'success') {
        const { authentication } = result;
        
        // Fetch user info from Google
        const userInfoResponse = await fetch(
          'https://www.googleapis.com/userinfo/v2/me',
          {
            headers: { Authorization: `Bearer ${authentication?.accessToken}` },
          }
        );
        const userInfo = await userInfoResponse.json();

        return {
          success: true,
          provider: 'google',
          user: {
            id: userInfo.id,
            email: userInfo.email,
            firstName: userInfo.given_name,
            lastName: userInfo.family_name,
            fullName: userInfo.name,
            avatar: userInfo.picture,
            accessToken: authentication?.accessToken,
            idToken: authentication?.idToken,
          },
        };
      }

      return {
        success: false,
        provider: 'google',
        error: result?.type === 'cancel' ? 'User cancelled' : 'Authentication failed',
      };
    } catch (error: any) {
      return {
        success: false,
        provider: 'google',
        error: error.message || 'Google sign-in failed',
      };
    }
  };

  return { request, signInWithGoogle };
};

// ============================================================
// APPLE SIGN-IN
// ============================================================

export const signInWithApple = async (): Promise<SocialAuthResult> => {
  try {
    // Check if Apple auth is available (iOS 13+ only)
    const isAvailable = await AppleAuthentication.isAvailableAsync();
    
    if (!isAvailable) {
      return {
        success: false,
        provider: 'apple',
        error: 'Apple Sign-In is not available on this device',
      };
    }

    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    // Note: Apple only provides name/email on first sign-in
    // Store them locally for future use
    if (credential.fullName?.givenName) {
      await AsyncStorage.setItem(
        `apple_user_${credential.user}`,
        JSON.stringify({
          firstName: credential.fullName.givenName,
          lastName: credential.fullName.familyName,
          email: credential.email,
        })
      );
    }

    // Try to retrieve cached name if not provided
    let firstName = credential.fullName?.givenName;
    let lastName = credential.fullName?.familyName;
    let email = credential.email;

    if (!firstName) {
      try {
        const cached = await AsyncStorage.getItem(`apple_user_${credential.user}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          firstName = parsed.firstName;
          lastName = parsed.lastName;
          email = email || parsed.email;
        }
      } catch {}
    }

    return {
      success: true,
      provider: 'apple',
      user: {
        id: credential.user,
        email: email || '',
        firstName,
        lastName,
        fullName: firstName && lastName ? `${firstName} ${lastName}` : undefined,
        idToken: credential.identityToken || undefined,
      },
    };
  } catch (error: any) {
    if (error.code === 'ERR_CANCELED') {
      return {
        success: false,
        provider: 'apple',
        error: 'User cancelled',
      };
    }
    return {
      success: false,
      provider: 'apple',
      error: error.message || 'Apple sign-in failed',
    };
  }
};

// ============================================================
// MICROSOFT SIGN-IN
// ============================================================

export const useMicrosoftAuth = () => {
  const discovery = {
    authorizationEndpoint: `https://login.microsoftonline.com/${OAUTH_CONFIG.microsoft.tenantId}/oauth2/v2.0/authorize`,
    tokenEndpoint: `https://login.microsoftonline.com/${OAUTH_CONFIG.microsoft.tenantId}/oauth2/v2.0/token`,
  };

  const redirectUri = makeRedirectUri({
    scheme: 'saurellius',
    path: 'auth',
  });

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: OAUTH_CONFIG.microsoft.clientId,
      scopes: ['openid', 'profile', 'email', 'User.Read'],
      redirectUri,
      responseType: ResponseType.Code,
    },
    discovery
  );

  const signInWithMicrosoft = async (): Promise<SocialAuthResult> => {
    try {
      const result = await promptAsync();

      if (result?.type === 'success' && result.params?.code) {
        // Exchange code for token
        const tokenResponse = await fetch(discovery.tokenEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: OAUTH_CONFIG.microsoft.clientId,
            code: result.params.code,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code',
          }).toString(),
        });

        const tokens = await tokenResponse.json();

        // Fetch user info from Microsoft Graph
        const userResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
        });
        const userInfo = await userResponse.json();

        return {
          success: true,
          provider: 'microsoft',
          user: {
            id: userInfo.id,
            email: userInfo.mail || userInfo.userPrincipalName,
            firstName: userInfo.givenName,
            lastName: userInfo.surname,
            fullName: userInfo.displayName,
            accessToken: tokens.access_token,
            idToken: tokens.id_token,
          },
        };
      }

      return {
        success: false,
        provider: 'microsoft',
        error: result?.type === 'cancel' ? 'User cancelled' : 'Authentication failed',
      };
    } catch (error: any) {
      return {
        success: false,
        provider: 'microsoft',
        error: error.message || 'Microsoft sign-in failed',
      };
    }
  };

  return { request, signInWithMicrosoft };
};

// ============================================================
// FACEBOOK SIGN-IN
// ============================================================

export const useFacebookAuth = () => {
  const discovery = {
    authorizationEndpoint: 'https://www.facebook.com/v18.0/dialog/oauth',
    tokenEndpoint: 'https://graph.facebook.com/v18.0/oauth/access_token',
  };

  const redirectUri = makeRedirectUri({
    scheme: 'saurellius',
    path: 'auth',
  });

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: OAUTH_CONFIG.facebook.appId,
      scopes: ['public_profile', 'email'],
      redirectUri,
      responseType: ResponseType.Token,
    },
    discovery
  );

  const signInWithFacebook = async (): Promise<SocialAuthResult> => {
    try {
      const result = await promptAsync();

      if (result?.type === 'success' && result.params?.access_token) {
        // Fetch user info from Facebook
        const userResponse = await fetch(
          `https://graph.facebook.com/me?fields=id,name,email,first_name,last_name,picture&access_token=${result.params.access_token}`
        );
        const userInfo = await userResponse.json();

        return {
          success: true,
          provider: 'facebook',
          user: {
            id: userInfo.id,
            email: userInfo.email,
            firstName: userInfo.first_name,
            lastName: userInfo.last_name,
            fullName: userInfo.name,
            avatar: userInfo.picture?.data?.url,
            accessToken: result.params.access_token,
          },
        };
      }

      return {
        success: false,
        provider: 'facebook',
        error: result?.type === 'cancel' ? 'User cancelled' : 'Authentication failed',
      };
    } catch (error: any) {
      return {
        success: false,
        provider: 'facebook',
        error: error.message || 'Facebook sign-in failed',
      };
    }
  };

  return { request, signInWithFacebook };
};

// ============================================================
// HELPER: Check Platform Support
// ============================================================

export const getSupportedProviders = async () => {
  const providers = {
    google: true, // Works on all platforms
    apple: Platform.OS === 'ios' && (await AppleAuthentication.isAvailableAsync()),
    microsoft: true, // Works on all platforms
    facebook: true, // Works on all platforms
  };
  return providers;
};
