# Project Context

## Purpose
SwiftLog is an AI-powered SIWES (Student Industrial Work Experience Scheme) log generation platform designed for IT students in Nigeria. The application transforms weekly summaries into detailed, professional daily logbook entries that meet academic requirements. It aims to simplify the documentation process for students undergoing industrial training by leveraging artificial intelligence to generate contextually relevant technical content.

## Tech Stack
- **Frontend Framework**: Next.js 15.4.5 with App Router
- **Language**: TypeScript 5.0 with strict mode enabled
- **Styling**: Tailwind CSS 4.0 with custom design system
- **UI Components**: Custom components using shadcn/ui patterns (New York style)
- **Authentication**: Supabase Auth with Google OAuth PKCE flow
- **Database**: PostgreSQL via Supabase with Row Level Security (RLS)
- **AI Integration**: Groq API (Llama 3.1 70B model) for log generation
- **Additional AI**: Google Generative AI for enhanced capabilities
- **Animations**: Framer Motion 12.23 + GSAP 3.13 for smooth interactions
- **Icons**: Lucide React icon library
- **Email**: Resend for transactional emails
- **Error Monitoring**: Sentry for production error tracking
- **PWA**: Progressive Web App capabilities with service worker
- **Deployment**: Vercel with Edge Functions

## Project Conventions

### Code Style
- **TypeScript**: Strict mode enabled, prefer explicit types, use interfaces for object shapes
- **Component Naming**: PascalCase for components (e.g., `SmartCTAButton.tsx`)
- **File Structure**: Organized by feature/domain, not file type
- **Imports**: Use absolute imports with `@/` prefix for internal modules
- **CSS**: Tailwind utility classes with custom CSS variables for theming
- **Font**: Geist Sans and Geist Mono font family throughout
- **Code Formatting**: ESLint with Next.js configuration, consistent spacing
- **Error Handling**: Comprehensive error boundaries and try-catch blocks
- **Responsive Design**: Mobile-first approach with responsive breakpoints

### Architecture Patterns
- **App Router**: Next.js 15 App Router with server and client components
- **Context API**: React Context for global state (AuthContext, ThemeContext)
- **API Routes**: Next.js API routes for backend logic and AI integration
- **Database**: Supabase as BaaS (Backend as a Service) with PostgreSQL
- **Authentication**: OAuth 2.0 with PKCE flow, session management with localStorage
- **Component Architecture**: Reusable UI components with composition patterns
- **State Management**: Local state with useState/useReducer, global state with Context
- **Service Layer**: Separate utility files for external API integrations
- **Error Boundaries**: Global error handling with Sentry integration

### Testing Strategy
- **Current Status**: No automated testing framework currently implemented
- **Manual Testing**: Manual testing across multiple devices and browsers
- **Error Monitoring**: Sentry integration for production error tracking
- **Code Quality**: ESLint for static analysis, TypeScript for type safety
- **Performance**: Vercel Analytics and monitoring tools

### Git Workflow
- **Branching**: Feature branches from main (e.g., `feature/amazing-feature`)
- **Commits**: Conventional commit format with descriptive messages
- **Deployment**: Automatic deployment to Vercel on push to main branch
- **Version Control**: Semantic versioning (currently v2.2.0)
- **Commit Patterns**: Recent commits follow `feat:`, `fix:`, `chore:` prefixes
- **Integration**: GitHub integration with Vercel for CI/CD

## Domain Context
SwiftLog serves SIWES (Student Industrial Work Experience Scheme) students in Nigeria's higher education system. This is a mandatory industrial training program where IT students work in companies to gain practical experience. Students must maintain detailed logbooks documenting their daily activities, which are submitted to their academic institutions for evaluation.

**Key User Needs:**
- Transform brief weekly summaries into detailed daily logs
- Maintain professional documentation standards
- Save time while ensuring academic compliance
- Accessible on mobile devices for on-the-go documentation
- Secure storage of personal and academic information

**Academic Requirements:**
- Daily activity descriptions with technical details
- Proper formatting and structure
- Weekly summaries with specific date ranges
- Company and supervisor information
- Student academic details and institution information

## Important Constraints
- **Authentication**: Must use Google OAuth for user authentication
- **Data Privacy**: Student personal and academic data must be protected
- **Mobile Performance**: Application must work well on mobile devices
- **AI Limits**: Groq API rate limits and token constraints
- **Database RLS**: All database access must follow Row Level Security rules
- **PWA Requirements**: Service worker and offline capabilities
- **Cross-Browser**: Must work across modern browsers
- **Academic Compliance**: Generated content must meet SIWES standards

## External Dependencies
- **Supabase**: Database, authentication, and storage platform
  - `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Anonymous access key
- **Groq AI**: Primary AI provider for log generation
  - `GROQ_API_KEY`: API key for Llama model access
- **Google OAuth**: Authentication provider
- **Resend**: Email service for notifications
- **Sentry**: Error monitoring and performance tracking
- **Vercel**: Hosting and deployment platform
- **Google Fonts**: Geist font family hosting
