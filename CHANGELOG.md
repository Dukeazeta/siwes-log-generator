# Changelog

All notable changes to SwiftLog will be documented in this file.

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
