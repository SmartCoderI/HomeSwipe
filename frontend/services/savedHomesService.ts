// Service for managing saved homes in Firestore
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Home } from '../types';

/**
 * Get saved homes for a user
 */
export const getSavedHomes = async (userId: string): Promise<Home[]> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));

    if (!userDoc.exists()) {
      console.log('📭 No saved homes found for user');
      return [];
    }

    const savedHomes = userDoc.data()?.savedHomes || [];
    console.log(`✅ Loaded ${savedHomes.length} saved homes`);
    return savedHomes;
  } catch (error) {
    console.error('❌ Error loading saved homes:', error);
    return [];
  }
};

/**
 * Add a home to saved homes
 */
export const addSavedHome = async (userId: string, home: Home): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);

    // Remove images array to reduce storage (can be fetched again later)
    const homeToSave = {
      ...home,
      images: [], // Don't store all images, just the main one
      imageUrl: home.imageUrl // Keep the main image URL
    };

    await updateDoc(userRef, {
      savedHomes: arrayUnion(homeToSave)
    });

    console.log(`✅ Added home to saved: ${home.title}`);
  } catch (error) {
    console.error('❌ Error adding saved home:', error);
    throw error;
  }
};

/**
 * Remove a home from saved homes
 */
export const removeSavedHome = async (userId: string, homeId: string): Promise<void> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));

    if (!userDoc.exists()) {
      return;
    }

    const savedHomes: Home[] = userDoc.data()?.savedHomes || [];
    const homeToRemove = savedHomes.find(h => h.id === homeId);

    if (homeToRemove) {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        savedHomes: arrayRemove(homeToRemove)
      });
      console.log(`✅ Removed home from saved: ${homeToRemove.title}`);
    }
  } catch (error) {
    console.error('❌ Error removing saved home:', error);
    throw error;
  }
};

/**
 * Check if a home is already saved
 */
export const isHomeSaved = async (userId: string, homeId: string): Promise<boolean> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));

    if (!userDoc.exists()) {
      return false;
    }

    const savedHomes: Home[] = userDoc.data()?.savedHomes || [];
    return savedHomes.some(h => h.id === homeId);
  } catch (error) {
    console.error('❌ Error checking if home is saved:', error);
    return false;
  }
};
