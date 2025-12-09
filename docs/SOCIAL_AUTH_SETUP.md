# Social Authentication Setup Guide

## Saurellius Cloud Payroll & HR Management

This guide explains how to set up OAuth social login providers (Google, Apple, Microsoft, Facebook) for the Saurellius platform.

---

## Prerequisites

First, install the required packages:

```bash
cd frontend
npx expo install expo-auth-session expo-crypto expo-web-browser expo-apple-authentication
```

---

## 1. Google Sign-In

### Cost: FREE

### Setup Steps:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Create credentials for each platform:

#### For Web (Expo Go / Development):
- Application type: **Web application**
- Authorized redirect URIs: 
  - `https://auth.expo.io/@YOUR_EXPO_USERNAME/saurellius`
  
#### For iOS:
- Application type: **iOS**
- Bundle ID: `com.diegoenterprises.saurellius`

#### For Android:
- Application type: **Android**
- Package name: `com.diegoenterprises.saurellius`
- SHA-1 certificate fingerprint: (get from `keytool` or Expo)

### Environment Variables:

Add to `.env`:

```env
EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID=xxxx.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=xxxx.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=xxxx.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=xxxx.apps.googleusercontent.com
```

---

## 2. Apple Sign-In

### Cost: $99/year (Apple Developer Program)

### Requirements:
- Apple Developer Program membership
- iOS 13+ device (or macOS 10.15+)
- Xcode for iOS builds

### Setup Steps:

1. Go to [Apple Developer Portal](https://developer.apple.com)
2. Navigate to **Certificates, IDs & Profiles** → **Identifiers**
3. Edit your App ID or create new one
4. Enable **Sign In with Apple** capability
5. Configure the App ID with your return URLs

#### For Web (optional):
1. Create a **Services ID** under Identifiers
2. Configure domains and return URLs
3. Create a **Key** for Sign In with Apple
4. Download the `.p8` key file

### In Xcode:
1. Open your iOS project
2. Go to **Signing & Capabilities**
3. Click **+ Capability**
4. Add **Sign In with Apple**

### Environment Variables:

```env
# Apple Sign-In is handled natively - no client ID needed for iOS
# For web implementation, add:
EXPO_PUBLIC_APPLE_SERVICE_ID=com.diegoenterprises.saurellius.web
EXPO_PUBLIC_APPLE_TEAM_ID=YOUR_TEAM_ID
```

---

## 3. Microsoft Sign-In (Azure AD)

### Cost: FREE

### Setup Steps:

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** → **App registrations**
3. Click **New registration**
4. Configure:
   - Name: `Saurellius Payroll`
   - Supported account types: **Accounts in any organizational directory and personal Microsoft accounts**
   - Redirect URI: `saurellius://auth` (Mobile) and your web URL

### Configure API Permissions:
1. Go to **API permissions**
2. Add permissions:
   - `User.Read` (delegated)
   - `email` (delegated)
   - `openid` (delegated)
   - `profile` (delegated)

### Configure Authentication:
1. Go to **Authentication**
2. Under **Mobile and desktop applications**, add:
   - `saurellius://auth`
   - `https://auth.expo.io/@YOUR_EXPO_USERNAME/saurellius`

### Environment Variables:

```env
EXPO_PUBLIC_AZURE_CLIENT_ID=your-azure-client-id-here
EXPO_PUBLIC_AZURE_TENANT_ID=common  # or your specific tenant ID
```

---

## 4. Facebook Login

### Cost: FREE

### Setup Steps:

1. Go to [Meta for Developers](https://developers.facebook.com)
2. Create a new app or select existing
3. Select app type: **Consumer** or **Business**
4. Add **Facebook Login** product to your app

### Configure Facebook Login:
1. Go to **Facebook Login** → **Settings**
2. Add OAuth Redirect URIs:
   - `https://auth.expo.io/@YOUR_EXPO_USERNAME/saurellius`
   - `saurellius://auth`

### Get Credentials:
1. Go to **Settings** → **Basic**
2. Copy **App ID** and **App Secret**
3. Under **Settings** → **Advanced**, get **Client Token**

### Environment Variables:

```env
EXPO_PUBLIC_FACEBOOK_APP_ID=your-facebook-app-id
EXPO_PUBLIC_FACEBOOK_CLIENT_TOKEN=your-facebook-client-token
```

---

## app.json Configuration

Update your `app.json` or `app.config.js`:

```json
{
  "expo": {
    "scheme": "saurellius",
    "ios": {
      "bundleIdentifier": "com.diegoenterprises.saurellius",
      "usesAppleSignIn": true,
      "infoPlist": {
        "CFBundleURLTypes": [
          {
            "CFBundleURLSchemes": ["saurellius"]
          }
        ]
      }
    },
    "android": {
      "package": "com.diegoenterprises.saurellius",
      "intentFilters": [
        {
          "action": "VIEW",
          "data": [
            {
              "scheme": "saurellius"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    },
    "plugins": [
      "expo-apple-authentication"
    ]
  }
}
```

---

## Environment File Template

Create a `.env` file in your frontend directory:

```env
# ============================================
# SOCIAL AUTHENTICATION CONFIGURATION
# ============================================

# Google OAuth (Google Cloud Console)
EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=

# Microsoft Azure AD (Azure Portal)
EXPO_PUBLIC_AZURE_CLIENT_ID=
EXPO_PUBLIC_AZURE_TENANT_ID=common

# Facebook (Meta for Developers)
EXPO_PUBLIC_FACEBOOK_APP_ID=
EXPO_PUBLIC_FACEBOOK_CLIENT_TOKEN=

# Apple (handled natively, only needed for web)
EXPO_PUBLIC_APPLE_SERVICE_ID=
EXPO_PUBLIC_APPLE_TEAM_ID=
```

---

## Testing Social Login

### Development (Expo Go):
1. Use the **Expo Client ID** for Google
2. Apple Sign-In won't work in Expo Go (requires native build)
3. Microsoft and Facebook should work with proper redirect URIs

### Production (Standalone Build):
1. Use platform-specific client IDs
2. Build with `eas build` for full native support
3. Test Apple Sign-In on real iOS device

---

## Troubleshooting

### "redirect_uri_mismatch" Error
- Ensure your redirect URI exactly matches what's configured in the provider console
- For Expo, use: `https://auth.expo.io/@{username}/{slug}`

### Apple Sign-In Not Available
- Only works on iOS 13+ devices
- Must be a native build (not Expo Go)
- Apple Developer membership required

### Facebook Login Fails
- Ensure app is in "Live" mode (not "Development")
- Check that your app is properly configured in Meta for Developers

### Microsoft Login Shows Consent Error
- Ensure API permissions are granted
- Admin consent may be required for organizational accounts

---

## Support

For issues with social authentication setup, contact:
- Email: support@saurellius.com
- Documentation: https://docs.saurellius.com/auth

---

© 2025 Diego Enterprises, Inc. All rights reserved.
