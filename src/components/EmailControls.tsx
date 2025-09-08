'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Send, Clock, CheckCircle, XCircle } from 'lucide-react';

interface EmailControlsProps {
  userId: string;
  userEmail: string;
  weekNumber: number;
}

export default function EmailControls({ userId, userEmail, weekNumber }: EmailControlsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const sendEmail = async (type: 'summary' | 'reminder') => {
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/send-weekly-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          weekNumber: type === 'summary' ? weekNumber : weekNumber + 1,
          type,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          type: 'success',
          message: data.message || `${type === 'summary' ? 'Summary' : 'Reminder'} sent successfully!`
        });
      } else {
        setResult({
          type: 'error',
          message: data.error || `Failed to send ${type}`
        });
      }
    } catch (error) {
      setResult({
        type: 'error',
        message: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6 transition-colors duration-300">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
          <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-card-foreground">Email Controls</h3>
          <p className="text-sm text-muted-foreground">Send weekly summaries and reminders</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Email address display */}
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">
            Email Address
          </div>
          <div className="text-sm font-medium text-card-foreground">{userEmail}</div>
        </div>

        {/* Email action buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => sendEmail('summary')}
            disabled={isLoading}
            className="flex items-center justify-center space-x-2 p-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-medium">Sending...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span className="text-sm font-medium">Send Week {weekNumber} Summary</span>
              </>
            )}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => sendEmail('reminder')}
            disabled={isLoading}
            className="flex items-center justify-center space-x-2 p-3 bg-secondary text-secondary-foreground rounded-xl hover:bg-secondary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-border"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-secondary-foreground border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-medium">Sending...</span>
              </>
            ) : (
              <>
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">Send Week {weekNumber + 1} Reminder</span>
              </>
            )}
          </motion.button>
        </div>

        {/* Result display */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-start space-x-2 p-3 rounded-lg ${
              result.type === 'success' 
                ? 'bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800'
                : 'bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800'
            }`}
          >
            {result.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className={`text-sm font-medium ${
                result.type === 'success' 
                  ? 'text-green-800 dark:text-green-200'
                  : 'text-red-800 dark:text-red-200'
              }`}>
                {result.type === 'success' ? 'Success!' : 'Error'}
              </p>
              <p className={`text-xs ${
                result.type === 'success' 
                  ? 'text-green-700 dark:text-green-300'
                  : 'text-red-700 dark:text-red-300'
              }`}>
                {result.message}
              </p>
            </div>
          </motion.div>
        )}

        {/* Help text */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• <strong>Summary emails</strong> contain the complete weekly log details</p>
          <p>• <strong>Reminder emails</strong> prompt users to create their next week&apos;s log</p>
          <p>• Emails are automatically scheduled but can be sent manually here</p>
        </div>
      </div>
    </div>
  );
}
