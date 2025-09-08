"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Mic, MicOff, Square } from 'lucide-react'
import { Button } from './button'
import { PromptInputAction } from './prompt-input'
import { cn } from '../../lib/utils'

interface VoiceInputActionProps {
  onTextChange: (text: string) => void
  currentText: string
  disabled?: boolean
  className?: string
}

export function VoiceInputAction({ 
  onTextChange, 
  currentText, 
  disabled = false,
  className 
}: VoiceInputActionProps) {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  // Check for Web Speech API support
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRecognition) {
        setIsSupported(true)
        recognitionRef.current = new SpeechRecognition()
        
        // Configure speech recognition
        if (recognitionRef.current) {
          recognitionRef.current.continuous = true
          recognitionRef.current.interimResults = true
          recognitionRef.current.lang = 'en-US'
          
          // Handle speech recognition results
          recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
            let finalTranscript = ''
            
            for (let i = event.resultIndex; i < event.results.length; i++) {
              const transcript = event.results[i][0].transcript
              if (event.results[i].isFinal) {
                finalTranscript += transcript
              }
            }
            
            if (finalTranscript) {
              // Append to existing text with proper spacing
              const newText = currentText 
                ? `${currentText} ${finalTranscript}`.trim()
                : finalTranscript.trim()
              onTextChange(newText)
            }
          }
          
          // Handle speech recognition errors
          recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
            console.error('Speech recognition error:', event.error)
            setError(`Voice recognition error: ${event.error}`)
            setIsListening(false)
          }
          
          // Handle speech recognition end
          recognitionRef.current.onend = () => {
            setIsListening(false)
          }
        }
      } else {
        setIsSupported(false)
        setError('Voice recognition is not supported in this browser')
      }
    }
    
    // Cleanup
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [currentText, onTextChange])

  const startListening = async () => {
    if (!recognitionRef.current || !isSupported || disabled) return
    
    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true })
      
      setError(null)
      setIsListening(true)
      recognitionRef.current.start()
    } catch (err) {
      console.error('Microphone access denied:', err)
      setError('Microphone access is required for voice input')
    }
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setIsListening(false)
  }

  const handleClick = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  if (!isSupported) {
    return (
      <PromptInputAction tooltip="Voice input not supported in this browser">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-full opacity-50 cursor-not-allowed"
          disabled
        >
          <MicOff className="size-4" />
        </Button>
      </PromptInputAction>
    )
  }

  return (
    <PromptInputAction 
      tooltip={
        error 
          ? error
          : isListening 
            ? "Stop voice recording" 
            : "Start voice recording"
      }
    >
      <Button
        variant="outline"
        size="icon"
        className={cn(
          "h-8 w-8 rounded-full transition-colors",
          isListening && "bg-red-50 border-red-200 text-red-600 hover:bg-red-100",
          error && "opacity-50 cursor-not-allowed",
          className
        )}
        onClick={handleClick}
        disabled={disabled || !!error}
      >
        {isListening ? (
          <Square className="size-4 fill-current animate-pulse" />
        ) : (
          <Mic className="size-4" />
        )}
      </Button>
    </PromptInputAction>
  )
}

// Extend the Window interface for TypeScript
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
  }
}
