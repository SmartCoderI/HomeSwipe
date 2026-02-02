import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Home } from '../types';
import { SavedHomesButton } from '../components/SavedHomesButton';

interface SavedHomesViewProps {
  onBack: () => void;
  onViewHome?: (home: Home) => void;
  onCompare?: (homes: Home[]) => void;
}

export const SavedHomesView: React.FC<SavedHomesViewProps> = ({ onBack, onViewHome, onCompare }) => {
  const { user, isAuthenticated } = useAuth();
  const [savedHomes, setSavedHomes] = useState<Home[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHomes, setSelectedHomes] = useState<Set<string>>(new Set());

  const toggleSelection = (homeId: string) => {
    setSelectedHomes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(homeId)) {
        newSet.delete(homeId);
      } else {
        if (newSet.size >= 2) {
          // Only allow selecting 2 homes
          return prev;
        }
        newSet.add(homeId);
      }
      return newSet;
    });
  };

  const handleCompare = () => {
    if (selectedHomes.size === 2 && onCompare) {
      const homesToCompare = savedHomes.filter(home => selectedHomes.has(home.id));
      onCompare(homesToCompare);
    }
  };

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
        <button
          onClick={handleCompare}
          disabled={selectedHomes.size !== 2}
          className={`px-4 py-2 rounded-full font-bold text-sm transition-all ${
            selectedHomes.size === 2
              ? 'bg-peri text-white hover:bg-peri-dark'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          Compare ({selectedHomes.size}/2)
        </button>
      </div>

      {/* Grid of Saved Homes */}
      <div className="grid grid-cols-1 gap-6">
        {savedHomes.map((home) => {
          const isSelected = selectedHomes.has(home.id);
          return (
            <div
              key={home.id}
              className={`relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all ${
                isSelected ? 'ring-4 ring-peri' : ''
              }`}
            >
              {/* Image */}
              <div className="relative h-48">
                <img
                  src={home.imageUrl}
                  alt={home.address}
                  className="w-full h-full object-cover"
                />
                {/* Selection Checkbox */}
                <div
                  className="absolute top-3 left-3 z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSelection(home.id);
                  }}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all ${
                    isSelected ? 'bg-peri' : 'bg-white/80 backdrop-blur-sm'
                  }`}>
                    {isSelected ? (
                      <span className="text-white font-bold text-lg">✓</span>
                    ) : (
                      <span className="text-gray-400 text-lg">○</span>
                    )}
                  </div>
                </div>
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
          );
        })}
      </div>
    </div>
  );
};
