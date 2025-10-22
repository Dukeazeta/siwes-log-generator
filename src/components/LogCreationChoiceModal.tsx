"use client";

import { AnimatePresence, motion } from "framer-motion";
import { PenTool, Sparkles, X } from "lucide-react";
import React from "react";

interface LogCreationChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAIChoice: () => void;
  onManualChoice: () => void;
}

export default function LogCreationChoiceModal({
  isOpen,
  onClose,
  onAIChoice,
  onManualChoice,
}: LogCreationChoiceModalProps) {
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = React.useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose],
  );

  React.useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    } else {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, handleKeyDown]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          onClick={handleBackdropClick}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{
              duration: 0.3,
              ease: "easeOut",
            }}
            className="relative w-full sm:max-w-lg mx-auto bg-background border border-border sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden max-h-[90vh] sm:max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border">
              <div className="flex-1 pr-4">
                <h2 className="text-lg sm:text-xl font-semibold text-foreground">Create New Log</h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Choose how you want to create your log entry
                </p>
              </div>

              {/* Close button */}
              <button
                onClick={onClose}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors flex-shrink-0"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Choices */}
            <div className="flex-1 overflow-y-auto">
              {/* AI Generation Option */}
              <button
                onClick={onAIChoice}
                className="w-full p-6 sm:p-8 text-left hover:bg-muted/50 transition-colors group border-b border-border"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-muted rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-muted/80 transition-colors">
                    <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1.5 sm:mb-2">
                      AI Generation
                    </h3>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      Let AI transform your weekly activities into professional log entries. Quick
                      and efficient.
                    </p>
                  </div>
                </div>
              </button>

              {/* Divider with OR text */}
              <div className="relative py-3 sm:py-4">
                <div className="absolute inset-0 flex items-center px-6 sm:px-8">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-background px-3 sm:px-4 text-xs sm:text-sm font-medium text-muted-foreground">
                    OR
                  </span>
                </div>
              </div>

              {/* Manual Input Option */}
              <button
                onClick={onManualChoice}
                className="w-full p-6 sm:p-8 text-left hover:bg-muted/50 transition-colors group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-muted rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-muted/80 transition-colors">
                    <PenTool className="w-6 h-6 sm:w-7 sm:h-7 text-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1.5 sm:mb-2">
                      Manual Input
                    </h3>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      Write your log entries manually with complete control over content and
                      formatting.
                    </p>
                  </div>
                </div>
              </button>
            </div>

            {/* Footer hint */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-border bg-muted/30">
              <p className="text-xs text-muted-foreground text-center">
                Press{" "}
                <kbd className="px-1.5 py-0.5 bg-background border border-border rounded text-xs font-mono">
                  ESC
                </kbd>{" "}
                to close
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
