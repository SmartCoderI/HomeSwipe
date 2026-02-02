import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Home } from '../types';

interface SavedHomesButtonProps {
  home: Home;
  size?: 'small' | 'large';
}

export const SavedHomesButton: React.FC<SavedHomesButtonProps> = ({ home, size = 'large' }) => {
  const { user, isAuthenticated } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check if home is already saved
  useEffect(() => {
    const checkIfSaved = async () => {
      if (!user || !isAuthenticated) {
        setIsSaved(false);
        return;
      }

      try {
        const docRef = doc(db, 'users', user.uid, 'savedHomes', home.id);
        const docSnap = await getDoc(docRef);
        setIsSaved(docSnap.exists());
      } catch (error) {
        console.error('Error checking saved status:', error);
      }
    };

    checkIfSaved();
  }, [user, isAuthenticated, home.id]);

  const toggleSave = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click event

    if (!user || !isAuthenticated) {
      alert('Please login to save homes');
      return;
    }

    setLoading(true);

    try {
      const docRef = doc(db, 'users', user.uid, 'savedHomes', home.id);

      if (isSaved) {
        // Unsave
        await deleteDoc(docRef);
        setIsSaved(false);
        console.log('✅ Home unsaved:', home.id);
      } else {
        // Save
        await setDoc(docRef, {
          homeData: home,
          savedAt: new Date().toISOString(),
        });
        setIsSaved(true);
        console.log('✅ Home saved:', home.id);
      }
    } catch (error: any) {
      console.error('❌ Error toggling save:', error);
      alert('Failed to save home. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const iconSize = size === 'large' ? '32px' : '24px';
  const buttonSize = size === 'large' ? '48px' : '36px';

  return (
    <button
      onClick={toggleSave}
      disabled={loading}
      style={{
        ...styles.button,
        width: buttonSize,
        height: buttonSize,
        opacity: loading ? 0.5 : 1,
      }}
      title={isSaved ? 'Unsave home' : 'Save home'}
    >
      <span style={{ fontSize: iconSize }}>
        {isSaved ? '❤️' : '🤍'}
      </span>
    </button>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  button: {
    background: 'rgba(255, 255, 255, 0.9)',
    border: '2px solid rgba(0, 0, 0, 0.1)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
    backdropFilter: 'blur(4px)',
  },
};
