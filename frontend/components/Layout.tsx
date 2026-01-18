
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-cream selection:bg-peri selection:text-white overflow-hidden flex flex-col">
      <main className="flex-1 relative max-w-md mx-auto w-full px-6 py-8">
        {children}
      </main>
    </div>
  );
};
