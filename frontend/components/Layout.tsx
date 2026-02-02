
import React from 'react';
import { LoginButton } from './LoginButton';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
  onNavigateToSavedHomes?: () => void;
  showSavedHomesLink?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, onNavigateToSavedHomes, showSavedHomesLink = false }) => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-cream selection:bg-peri selection:text-white overflow-hidden flex flex-col">
      {/* Compact Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50">
        <div className="max-w-md mx-auto px-6 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-gray-800">HomeSwipe</h1>
            {isAuthenticated && showSavedHomesLink && onNavigateToSavedHomes && (
              <button
                onClick={onNavigateToSavedHomes}
                className="text-xs text-gray-500 hover:text-peri font-medium transition-colors"
              >
                ❤️ Saved
              </button>
            )}
          </div>
          <LoginButton />
        </div>
      </header>

      <main className="flex-1 relative max-w-md mx-auto w-full px-6 py-8">
        {children}
      </main>
    </div>
  );
};
