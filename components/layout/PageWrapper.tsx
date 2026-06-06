import React from 'react';

interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export function PageWrapper({ children, className = '' }: PageWrapperProps) {
  return (
    <main className={`max-w-6xl mx-auto px-4 md:px-8 py-6 ${className}`}>
      {children}
    </main>
  );
}
