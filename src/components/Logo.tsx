'use client';

import React from 'react';
import Image from 'next/image';
import { useTheme } from '../contexts/ThemeContext';

interface LogoProps {
  width?: number;
  height?: number;
  className?: string;
  alt?: string;
}

export default function Logo({ 
  width = 48, 
  height = 48, 
  className = '', 
  alt = 'SwiftLog Logo' 
}: LogoProps) {
  const { resolvedTheme } = useTheme();

  return (
    <Image
      src={resolvedTheme === 'dark' ? '/LOGOS/SwiftLog_Dark.svg' : '/LOGOS/SwiftLog.svg'}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority
    />
  );
}
