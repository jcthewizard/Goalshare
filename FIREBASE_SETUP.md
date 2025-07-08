# 🔥 Firebase Setup Guide for Goalshare

## Step 1: Create Firebase Project

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Click "Create a project"**
3. **Project name**: `goalshare-app` (or your preferred name)
4. **Analytics**: Enable or disable as preferred
5. **Click "Create project"**

## Step 2: Enable Authentication

1. **In Firebase Console**, go to **"Authentication"** → **"Sign-in method"**
2. **Enable "Email/Password"** provider
3. **Click "Save"**

## Step 3: Create Firestore Database

1. **Go to "Firestore Database"** in the sidebar
2. **Click "Create database"**
3. **Choose "Start in test mode"** (for development)
4. **Select a location** (closest to your users)
5. **Click "Done"**

## Step 4: Enable Storage

1. **Go to "Storage"** in the sidebar
2. **Click "Get started"**
3. **Choose "Start in test mode"** (for development)
4. **Select same location** as Firestore
5. **Click "Done"**

## Step 5: Get Firebase Configuration

1. **Go to "Project Settings"** (gear icon)
2. **Scroll down to "Your apps"**
3. **Click the web icon** `</>`
4. **App nickname**: `goalshare-mobile`
5. **Check "Also set up Firebase Hosting"** (optional)
6. **Click "Register app"**
7. **Copy the config object** that looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyBNlYH01_GL2fPLZCaDhUJrkmETnKM0S-I",
  authDomain: "goalshare-app.firebaseapp.com",
  projectId: "goalshare-app",
  storageBucket: "goalshare-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

## Step 6: Update Firebase Configuration

1. **Open** `src/config/firebase.ts`
2. **Replace the placeholder config** with your actual config:

```typescript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-actual-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-actual-sender-id",
  appId: "your-actual-app-id"
};
```

## Step 7: Update App.tsx to Use Firebase

Replace the import in your `App.tsx`:

```typescript
// Replace this:
import { AuthProvider } from './src/contexts/AuthContext';
import { GoalProvider } from './src/contexts/GoalContext';

// With this:
import { AuthProvider } from './src/contexts/FirebaseAuthContext';
import { GoalProvider } from './src/contexts/FirebaseGoalContext';
```

## Step 8: Firestore Security Rules (Production)

When ready for production, update Firestore rules:

```javascript
// Go to Firestore → Rules tab
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Goals collection - users can only access their own goals
    match /goals/{goalId} {
      allow read, write: if request.auth != null &&
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null &&
        request.auth.uid == request.resource.data.userId;
    }
  }
}
```

## Step 9: Storage Security Rules (Production)

Update Storage rules for user-specific access:

```javascript
// Go to Storage → Rules tab
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Users can only upload to their own folder
    match /images/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null &&
        request.auth.uid == userId;
    }
  }
}
```

## Step 10: Test Your Setup

1. **Start your app**: `npx expo start`
2. **Register a new user** through the app
3. **Check Firebase Console**:
   - **Authentication** → Should see your user
   - **Firestore** → Should see goals collection when you create goals
   - **Storage** → Should see uploaded images

## 🎉 Benefits of Firebase Migration

✅ **No backend server needed** - Eliminates port conflicts
✅ **Real-time updates** - Goals sync instantly
✅ **Automatic scaling** - Handles any number of users
✅ **Built-in security** - User authentication & data isolation
✅ **Image storage** - Automatic image optimization
✅ **Ready for App Store** - Production-ready infrastructure
✅ **Free tier** - Generous limits for development

## 🚀 App Store Ready

After Firebase setup, your app will be ready for:
- **TestFlight** (iOS beta testing)
- **App Store submission**
- **Google Play Store** (with EAS Build)
- **Web deployment** (with Expo for Web)

## Need Help?

- **Firebase Docs**: https://firebase.google.com/docs
- **Expo + Firebase**: https://docs.expo.dev/guides/using-firebase/
- **React Native Firebase**: https://rnfirebase.io/ (alternative SDK)

Your app will be much more robust and ready for production! 🎯