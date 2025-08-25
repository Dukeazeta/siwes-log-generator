'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TextShimmer } from './text-shimmer';
import Logo from '../Logo';

interface FullScreenLoaderProps {
  isVisible: boolean;
  title?: string;
  subtitle?: string;
  shimmerText?: string;
  showLogo?: boolean;
}

export function FullScreenLoader({
  isVisible,
  title = "Generating Log",
  subtitle = "Please wait while we create your professional logbook entry",
  showLogo = true
}: FullScreenLoaderProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="fixed inset-0 bg-background/80 backdrop-blur-md z-[100] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
            className="text-center max-w-md w-full"
          >
            {/* Logo */}
            {showLogo && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex justify-center mb-8"
              >
                <div className="p-4 rounded-full bg-card/50 border border-border/30 backdrop-blur-sm">
                  <Logo
                    width={60}
                    height={60}
                    className="w-12 h-12 md:w-15 md:h-15"
                  />
                </div>
              </motion.div>
            )}

            {/* Loading Animation and Shimmer Text */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-col items-center justify-center mb-8"
            >
              <div className="relative mb-6">
                {/* Outer spinning ring */}
                <div className="w-16 h-16 border-2 border-border/20 rounded-full"></div>
                <div className="absolute inset-0 w-16 h-16 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                
                {/* Inner pulsing dot */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                </div>
              </div>
              
              <TextShimmer 
                duration={2}
                className="text-xl md:text-2xl font-bold text-foreground"
              >
                Generating logs
              </TextShimmer>
            </motion.div>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="text-sm md:text-base text-muted-foreground mb-8 leading-relaxed"
            >
              {subtitle}
            </motion.p>

            {/* Progress Indicators */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground">
                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></div>
                <span>Analyzing your activities</span>
              </div>
              <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground">
                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                <span>Generating professional content</span>
              </div>
              <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground">
                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
                <span>Formatting logbook entry</span>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}