// Service for managing user feedback in Firestore
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

export interface Feedback {
  userId: string;
  username: string;
  email: string;
  rating: number; // 1-5 stars
  comment: string;
  createdAt: any;
}

/**
 * Submit user feedback to Firestore
 */
export const submitFeedback = async (
  userId: string,
  username: string,
  email: string,
  rating: number,
  comment: string
): Promise<void> => {
  try {
    await addDoc(collection(db, 'feedback'), {
      userId,
      username,
      email,
      rating,
      comment,
      createdAt: serverTimestamp(),
    });

    console.log('✅ Feedback submitted successfully');
  } catch (error) {
    console.error('❌ Error submitting feedback:', error);
    throw error;
  }
};
