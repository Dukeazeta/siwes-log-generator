# Changelog

All notable changes to SwiftLog will be documented in this file.

## [3.0.1] - 2024-12-19

### 🎉 New Features

- **Intelligent OCR Error Correction**: AI now preserves student's original text
  - **Multi-Field Support**: Works with ALL academic disciplines (Engineering, Medicine, Pharmacy, Agriculture, Business, Sciences, Architecture, etc.)
  - Context-aware correction that recognizes field-specific terminology
  - Only fixes OCR scanning errors (misspellings, missing letters)
  - Fills in missing words based on context without rewriting
  - Maintains student's writing style and word choices
  - Uses lower temperature (0.1) for conservative, accurate corrections
  - NOT limited to IT/Computer Science terminology

- **Dual AI Provider Support**: Added flexibility with multiple AI providers
  - Primary: Gemini API with configurable model selection
  - Fallback: Groq API for redundancy
  - Automatic fallback when primary provider fails
  - Configurable via environment variables (GEMINI_API_KEY, GROQ_API_KEY)

### 🐛 Bug Fixes

- **OCR AI Processing**: Fixed Gemini API model compatibility issue
  - Updated from deprecated `gemini-pro` to `gemini-2.0-flash-exp`
  - Resolved 404 errors when processing OCR text with AI
  - Ensures OCR text cleaning and day extraction works correctly

### 🔧 Technical Improvements

- Updated Gemini model references across all API routes
- Added field-agnostic post-processing to fix common OCR errors across all disciplines
- Enhanced prompts to preserve original text while correcting errors
- Context-aware terminology detection for any academic field
- Added configurable AI parameters (temperature, max tokens)
- Improved context-aware word prediction for gaps in OCR text
- Universal OCR error patterns (not field-specific)

## [3.0.0] - 2024-10-23

### 🎉 New Features

- **Manual Entry Mode**: Create logs manually with a streamlined form interface
  - Direct input for each day's activities
  - Quick and efficient for users who prefer writing their own entries
  - Accessible from the Add Week modal with a new "Manual Entry" option

### 🚀 Performance Improvements

- **Complete AuthContext Rewrite**: Eliminated authentication performance issues
  - Fixed circular dependencies causing infinite re-renders
  - Reduced code complexity by 50% (from ~720 to ~360 lines)
  - Stable function references preventing unnecessary re-renders
  - Simplified state management without complex reducers
  - Single auth listener initialization

### 🐛 Bug Fixes

- Fixed authentication loops during login/signup
- Resolved profile loading race conditions
- Fixed session persistence issues
- Eliminated excessive API calls during auth state changes

### 🔧 Technical Improvements

- Migrated from complex reducer pattern to simple state management
- Implemented ref-based state access for stable callbacks
- Decoupled profile loading from authentication flow
- Improved TypeScript type definitions

## [2.2.0] - 2024-10-22

### Features

- Enhanced dashboard navigation
- Improved mobile responsiveness
- Added loading states for better UX

## [2.1.0] - 2024-10-21

### Features

- Google OAuth integration
- Comprehensive onboarding flow
- Weekly log management system

## [2.0.0] - 2024-10-20

### Features

- Complete UI/UX redesign
- Glassmorphism design system
- Dark mode support
- PWA capabilities

## [1.0.0] - 2024-10-15

### Features

- Initial release
- AI-powered log generation
- Basic authentication
- Dashboard interface
