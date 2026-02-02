import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Home } from '../types';
import { SavedHomesButton } from '../components/SavedHomesButton';

interface SavedHomesViewProps {
  onBack: () => void;
  onViewHome?: (home: Home) => void;
}

export const SavedHomesView: React.FC<SavedHomesViewProps> = ({ onBack, onViewHome }) => {
  const { user, isAuthenticated } = useAuth();
  const [savedHomes, setSavedHomes] = useState<Home[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSavedHomes = async () => {
      if (!user || !isAuthenticated) {
        setSavedHomes([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const savedHomesRef = collection(db, 'users', user.uid, 'savedHomes');
        const q = query(savedHomesRef, orderBy('savedAt', 'desc'));
        const querySnapshot = await getDocs(q);

        const homes: Home[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.homeData) {
            homes.push(data.homeData);
          }
        });

        setSavedHomes(homes);
        console.log(`✅ Loaded ${homes.length} saved homes`);
      } catch (error) {
        console.error('❌ Error loading saved homes:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSavedHomes();
  }, [user, isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] text-center px-8">
        <div className="text-6xl mb-4">🔐</div>
        <h2 className="text-2xl font-bold text-charcoal mb-2">Login Required</h2>
        <p className="text-gray-600 mb-6">Please login to view your saved homes</p>
        <button
          onClick={onBack}
          className="px-6 py-3 bg-peri text-white rounded-full font-bold hover:bg-peri-dark transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px]">
        <div className="text-4xl mb-4">⏳</div>
        <p className="text-gray-600">Loading saved homes...</p>
      </div>
    );
  }

  if (savedHomes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] text-center px-8">
        <div className="text-6xl mb-4">🏠</div>
        <h2 className="text-2xl font-bold text-charcoal mb-2">No Saved Homes</h2>
        <p className="text-gray-600 mb-6">Start browsing homes and save your favorites!</p>
        <button
          onClick={onBack}
          className="px-6 py-3 bg-peri text-white rounded-full font-bold hover:bg-peri-dark transition-colors"
        >
          Browse Homes
        </button>
      </div>
    );
  }

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-peri hover:text-peri-dark font-bold transition-colors"
        >
          <span>←</span> Back
        </button>
        <h2 className="text-2xl font-bold text-charcoal">
          ❤️ Saved Homes ({savedHomes.length})
        </h2>
        <div className="w-16" /> {/* Spacer for centering */}
      </div>

      {/* Grid of Saved Homes */}
      <div className="grid grid-cols-1 gap-6">
        {savedHomes.map((home) => (
          <div
            key={home.id}
            className="relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
            onClick={() => onViewHome && onViewHome(home)}
          >
            {/* Image */}
            <div className="relative h-48">
              <img
                src={home.imageUrl}
                alt={home.address}
                className="w-full h-full object-cover"
              />
              {/* Save Button Overlay */}
              <div className="absolute top-3 right-3 z-10" onClick={(e) => e.stopPropagation()}>
                <SavedHomesButton home={home} size="small" />
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-bold text-charcoal flex-1 pr-2">{home.address}</h3>
                <div className="text-xl font-bold text-peri whitespace-nowrap">{home.price}</div>
              </div>

              <div className="flex gap-4 text-sm text-gray-600">
                <span>{home.specs.beds} beds</span>
                <span>•</span>
                <span>{home.specs.baths} baths</span>
                <span>•</span>
                <span>{home.specs.sqft.toLocaleString()} sqft</span>
              </div>

              {home.listingUrl && (
                <a
                  href={home.listingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-block mt-3 text-sm text-peri hover:text-peri-dark font-medium"
                >
                  View Listing →
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
