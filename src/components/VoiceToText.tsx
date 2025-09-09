'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Square } from 'lucide-react';

interface VoiceToTextProps {
  onTextChange: (text: string) => void;
  currentText: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export default function VoiceToText({ 
  onTextChange, 
  currentText, 
  disabled = false, 
  placeholder = "Click the mic to start recording or type here...",
  className = ""
}: VoiceToTextProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [interimText, setInterimText] = useState('');
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // Check for Web Speech API support
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        setIsSupported(true);
        recognitionRef.current = new SpeechRecognition();
        
        // Configure speech recognition
        if (recognitionRef.current) {
          recognitionRef.current.continuous = true;
          recognitionRef.current.interimResults = true;
          recognitionRef.current.lang = 'en-US';
          
          // Handle speech recognition results
          recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
            let finalTranscript = '';
            let interimTranscript = '';
            
            for (let i = event.resultIndex; i < event.results.length; i++) {
              const transcript = event.results[i][0].transcript;
              if (event.results[i].isFinal) {
                finalTranscript += transcript;
              } else {
                interimTranscript += transcript;
              }
            }
            
            if (finalTranscript) {
              // Append to existing text with proper spacing
              const newText = currentText 
                ? `${currentText} ${finalTranscript}`.trim()
                : finalTranscript.trim();
              onTextChange(newText);
              setInterimText('');
            } else {
              setInterimText(interimTranscript);
            }
          };
          
          // Handle speech recognition errors
          recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
            console.error('Speech recognition error:', event.error);
            setError(`Voice recognition error: ${event.error}`);
            setIsListening(false);
            setInterimText('');
          };
          
          // Handle speech recognition end
          recognitionRef.current.onend = () => {
            setIsListening(false);
            setInterimText('');
          };
        }
      } else {
        setIsSupported(false);
        setError('Voice recognition is not supported in this browser');
      }
    }
    
    // Cleanup
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startListening = async () => {
    if (!recognitionRef.current || !isSupported || disabled) return;
    
    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      setError(null);
      setIsListening(true);
      recognitionRef.current.start();
    } catch (err) {
      console.error('Microphone access denied:', err);
      setError('Microphone access is required for voice input');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    setInterimText('');
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onTextChange(e.target.value);
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = 'auto';
      textAreaRef.current.style.height = textAreaRef.current.scrollHeight + 'px';
    }
  }, [currentText, interimText]);

  return (
    <div className={`relative ${className}`}>
      {/* Text Area */}
      <div className="relative">
        <textarea
          ref={textAreaRef}
          value={currentText}
          onChange={handleTextChange}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full min-h-[120px] px-4 py-4 pr-16 bg-background border border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-ring text-foreground placeholder:text-muted-foreground resize-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ maxHeight: '300px' }}
        />
        
        {/* Interim text overlay */}
        {interimText && (
          <div className="absolute inset-0 px-4 py-4 pr-16 pointer-events-none">
            <div className="text-muted-foreground italic opacity-60">
              {currentText}
              <span className="bg-primary/20 px-1 rounded">
                {interimText}
              </span>
            </div>
          </div>
        )}
        
        {/* Voice Controls */}
        <div className="absolute top-4 right-4 flex items-center space-x-2">
          {isSupported ? (
            <>
              {!isListening ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={startListening}
                  disabled={disabled}
                  className="p-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Start voice recording"
                >
                  <Mic className="w-4 h-4" />
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={stopListening}
                  className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors animate-pulse"
                  title="Stop voice recording"
                >
                  <Square className="w-4 h-4 fill-current" />
                </motion.button>
              )}
            </>
          ) : (
            <div className="p-2 bg-muted text-muted-foreground rounded-lg" title="Voice recognition not supported">
              <MicOff className="w-4 h-4" />
            </div>
          )}
        </div>
      </div>
      
      {/* Status indicators */}
      <div className="mt-2 min-h-[20px]">
        {isListening && (
          <div className="flex items-center space-x-2 text-xs text-primary">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span>Listening... (Click stop when finished)</span>
          </div>
        )}
        
        {error && (
          <div className="flex items-center space-x-2 text-xs text-red-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}
        
        {!isSupported && !error && (
          <div className="text-xs text-muted-foreground">
            Voice input not supported in this browser. Try Chrome, Edge, or Safari.
          </div>
        )}
      </div>
    </div>
  );
}

// Extend the Window interface for TypeScript
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}
