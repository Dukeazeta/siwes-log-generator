'use client';

import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";

interface SmartCTAButtonProps {
  children: React.ReactNode;
  className?: string;
  authenticatedText?: string;
  unauthenticatedText?: string;
}

export default function SmartCTAButton({
  children,
  className = "",
  authenticatedText,
  unauthenticatedText
}: SmartCTAButtonProps) {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Determine destination based on auth status
  const getDestination = () => {
    if (isLoading) return '/signup'; // Default while loading
    if (isAuthenticated && user) {
      // If user hasn't completed onboarding, go to onboarding
      if (!user.hasCompletedOnboarding) {
        return '/onboarding';
      }
      // Otherwise go to dashboard
      return '/dashboard';
    }
    return '/signup';
  };

  // Determine button text based on auth status
  const getButtonText = () => {
    if (isLoading) return children; // Show original text while loading
    if (isAuthenticated && user) {
      if (!user.hasCompletedOnboarding) {
        return authenticatedText || children;
      }
      return authenticatedText || children;
    }
    return unauthenticatedText || children;
  };

  const href = getDestination();
  const buttonText = getButtonText();

  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
    >
      <Link href={href} className={className}>
        {buttonText}
      </Link>
    </motion.div>
  );
}
