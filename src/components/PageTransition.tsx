'use client';

import { ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
  return (
    <div
      className="min-h-screen bg-white"
      style={{ backgroundColor: 'white', minHeight: '100vh' }}
    >
      {children}
    </div>
  );
}
