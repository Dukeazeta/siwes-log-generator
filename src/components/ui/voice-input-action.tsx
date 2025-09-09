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
    <PromptInputAction tooltip="Voice input feature coming soon">
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8 rounded-full opacity-50 cursor-not-allowed"
        disabled
      >
        <Mic className="size-4" />
      </Button>
    </PromptInputAction>
  )
}

// Extend the Window interface for TypeScript
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition
    webkitSpeechRecognition: new () => SpeechRecognition
  }
  
  interface SpeechRecognition extends EventTarget {
    continuous: boolean
    interimResults: boolean
    lang: string
    onresult: (event: SpeechRecognitionEvent) => void
    onerror: (event: SpeechRecognitionErrorEvent) => void
    onend: () => void
    start(): void
    stop(): void
  }
  
  interface SpeechRecognitionEvent {
    resultIndex: number
    results: SpeechRecognitionResultList
  }
  
  interface SpeechRecognitionResultList {
    readonly length: number
    [index: number]: SpeechRecognitionResult
  }
  
  interface SpeechRecognitionResult {
    readonly isFinal: boolean
    [index: number]: SpeechRecognitionAlternative
  }
  
  interface SpeechRecognitionAlternative {
    readonly transcript: string
    readonly confidence: number
  }
  
  interface SpeechRecognitionErrorEvent {
    error: string
  }
}
