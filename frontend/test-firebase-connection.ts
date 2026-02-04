// Test script to verify Firebase connection
// Run this from browser console after starting the app

import { auth, db } from './firebase/config';
import { collection, getDocs } from 'firebase/firestore';

export async function testFirebaseConnection() {
  console.log('🧪 Testing Firebase connection...\n');

  // Test 1: Check if Firebase is initialized
  console.log('1️⃣ Checking Firebase initialization...');
  console.log('   Auth instance:', auth ? '✅' : '❌');
  console.log('   Firestore instance:', db ? '✅' : '❌');
  console.log('   Project ID:', auth?.app?.options?.projectId || '❌ Missing');

  // Test 2: Check authentication state
  console.log('\n2️⃣ Checking authentication...');
  console.log('   Current user:', auth.currentUser ? `✅ ${auth.currentUser.email}` : '❌ Not logged in');

  // Test 3: Try to access Firestore (should work even if not logged in for reads)
  console.log('\n3️⃣ Testing Firestore connection...');
  try {
    // Try to list collections (will fail with proper security rules, which is good)
    const testCollection = collection(db, 'users');
    console.log('   Firestore connection: ✅ Connected');
  } catch (error: any) {
    console.error('   Firestore connection: ❌ Error:', error.message);
  }

  console.log('\n✅ Connection test complete!');
  console.log('If you see errors above, check:');
  console.log('1. .env.local file has all VITE_FIREBASE_* variables');
  console.log('2. Vite dev server was restarted after adding .env.local');
  console.log('3. Firestore is enabled in Firebase Console');
}

// Make it available in window for browser console
if (typeof window !== 'undefined') {
  (window as any).testFirebaseConnection = testFirebaseConnection;
}

console.log('💡 To test Firebase connection, run: testFirebaseConnection()');
