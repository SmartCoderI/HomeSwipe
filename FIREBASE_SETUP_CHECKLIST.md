# Firebase Setup Checklist

## ✅ Verification Steps

### 1. Check Environment Variables
Run this in your terminal from the `frontend` directory:
```bash
cat .env.local
```

You should see all Firebase variables starting with `VITE_FIREBASE_`:
- ✅ VITE_FIREBASE_API_KEY
- ✅ VITE_FIREBASE_AUTH_DOMAIN
- ✅ VITE_FIREBASE_PROJECT_ID
- ✅ VITE_FIREBASE_STORAGE_BUCKET
- ✅ VITE_FIREBASE_MESSAGING_SENDER_ID
- ✅ VITE_FIREBASE_APP_ID
- ✅ VITE_FIREBASE_MEASUREMENT_ID

### 2. Restart Vite Dev Server
**IMPORTANT**: Vite only loads `.env.local` on startup!

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

### 3. Check Browser Console
Open browser DevTools (F12) and look for:
```
✅ Firebase initialized successfully
🔥 Project ID: homeswipe-50d93
```

If you see errors like "Missing Firebase config", the env vars aren't loaded.

### 4. Enable Firestore Database
**CRITICAL**: Without this, registration and saved homes won't work!

1. Go to: https://console.firebase.google.com/project/homeswipe-50d93/firestore
2. Click "Create Database"
3. Select **Production mode**
4. Choose region: `us-central1` (or your preferred region)
5. Click "Enable"

### 5. Set Firestore Security Rules
After enabling Firestore:

1. Click "Rules" tab in Firestore console
2. Replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Username uniqueness - anyone can read during registration
    match /usernames/{username} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

3. Click "Publish"

### 6. Test Registration
1. Open app in browser
2. Click "Login" button
3. Click "Register"
4. Fill in:
   - Username: testuser123
   - Email: test@example.com
   - Password: password123
   - Confirm: password123
5. Click "Register"

**Expected Result:**
- Console shows: `✅ Registration successful: testuser123`
- User is logged in (shows username in header)
- No errors in console

### 7. Test Saved Homes
1. Search for homes (e.g., "3 bed home in San Francisco")
2. Click heart/like button on a home
3. Check console: `💾 Saved home to Firestore: [home title]`
4. Click "Saved Homes" button
5. Your liked home should appear

**Expected Result:**
- Liked homes persist after page refresh
- No Firestore permission errors

## 🐛 Common Issues

### Issue: "Firebase configuration is missing"
**Solution**: Restart Vite dev server after adding `.env.local`

### Issue: "Missing or insufficient permissions"
**Solution**: Set Firestore security rules (step 5 above)

### Issue: "Collection 'users' doesn't exist"
**Solution**: Firestore creates collections automatically on first write. Just register a user.

### Issue: Registration says "Username already taken"
**Solution**: Either:
1. Use a different username
2. Delete the username from Firestore console: `usernames` collection

## 📊 Verify Firestore Data Structure

After registering and liking a home, check Firebase Console:

### Collection: `users`
```
users/
  {userId}/
    - username: "testuser123"
    - email: "test@example.com"
    - createdAt: "2026-02-03T..."
    - savedHomes: [
        {
          id: "...",
          title: "123 Main St",
          price: "$500,000",
          ...
        }
      ]
```

### Collection: `usernames`
```
usernames/
  testuser123/
    - uid: "{userId}"
    - username: "testuser123"
    - createdAt: "2026-02-03T..."
```

## ✅ Success Indicators

When everything is working:
1. ✅ No red errors in browser console
2. ✅ Can register new users
3. ✅ Can login with email/password
4. ✅ Liked homes save to Firestore
5. ✅ Liked homes persist after page refresh
6. ✅ Removing saved home updates Firestore
7. ✅ Logout clears local state but keeps data in Firestore
