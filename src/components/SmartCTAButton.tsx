'use client';

import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";

interface SmartCTAButtonProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary';
}

export default function SmartCTAButton({
  children,
  className = "",
  variant = 'primary'
}: SmartCTAButtonProps) {
  const { isAuthenticated, isLoading } = useAuth();

  // Determine destination based on auth status
  // Default to signup if still loading to avoid greyed out buttons
  const href = isAuthenticated ? '/dashboard' : '/signup';

  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
    >
      <Link href={href} className={className}>
        {children}
      </Link>
    </motion.div>
  );
}
