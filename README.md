# SwiftLog - AI-Powered SIWES Log Generation

[![Beta Version](https://img.shields.io/badge/version-Beta%20v2.1.1-blue.svg)](https://swiftlog-beta.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-15.4.5-black.svg)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-green.svg)](https://supabase.com)

**The smartest way for IT students to create professional SIWES logbook entries.** Transform your weekly summaries into detailed daily logs with AI-powered generation.

🌐 **Live Demo**: [https://swiftlog-beta.vercel.app](https://swiftlog-beta.vercel.app)

## ✨ Features

### 🤖 AI-Powered Log Generation
- **Smart Weekly Summaries**: Input a brief weekly summary and let AI generate detailed daily activities
- **Professional Formatting**: Automatically formatted logs that meet SIWES requirements
- **Contextual Content**: AI understands your role and generates relevant technical activities

### 🔐 Secure Authentication
- **Google OAuth Integration**: Quick sign-in with your Google account
- **Session Management**: Secure session handling with automatic token refresh
- **Mobile-Optimized**: Seamless authentication flow on all devices

### 📋 Comprehensive Onboarding
- **Student Information**: Course, institution, and academic level
- **Company Details**: Organization info with expanded department options
- **Job Description**: Detailed role and responsibility documentation
- **Training Period**: Start/end dates with supervisor information

### 📊 Interactive Dashboard
- **Training Overview**: Complete profile and company information display
- **Weekly Navigation**: Easy switching between different weeks
- **Progress Tracking**: Visual indicators for completed weeks
- **Responsive Design**: Optimized for desktop, tablet, and mobile

### 🎨 Modern UI/UX
- **Glassmorphism Design**: Beautiful frosted glass navigation bars
- **Smooth Animations**: GSAP and Framer Motion powered interactions
- **Clean Typography**: Professional Geist font family
- **Minimal Aesthetic**: Focus on content with clean, modern design

## 🚀 Getting Started

### Prerequisites
- Node.js 18.18.0 or higher
- npm, yarn, pnpm, or bun package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Dukeazeta/siwes-log-generator.git
   cd siwes-log-generator
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   GROQ_API_KEY=your_groq_api_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Tech Stack

### Frontend
- **Framework**: Next.js 15.4.5 with App Router
- **Language**: TypeScript 5.0
- **Styling**: Tailwind CSS 4.0
- **Animations**: Framer Motion 12.23 + GSAP 3.13
- **UI Components**: Custom components with Tailwind

### Backend & Database
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **Authentication**: Supabase Auth with Google OAuth
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Storage**: Supabase Storage for file uploads

### AI & APIs
- **AI Provider**: Groq (Fast LLM inference)
- **Model**: Llama 3.1 70B for log generation
- **API Routes**: Next.js API routes for AI integration

### Deployment & DevOps
- **Hosting**: Vercel with Edge Functions
- **Domain**: Custom domain with SSL
- **CI/CD**: Automatic deployments from GitHub
- **Monitoring**: Vercel Analytics and Supabase Monitoring

## 📁 Project Structure

```
siwes-log-generator/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/               # API routes
│   │   ├── auth/              # Authentication pages
│   │   ├── dashboard/         # Dashboard page
│   │   ├── login/             # Login page
│   │   ├── onboarding/        # Onboarding flow
│   │   └── signup/            # Registration page
│   ├── components/            # Reusable UI components
│   ├── contexts/              # React Context providers
│   ├── lib/                   # Utility libraries
│   └── styles/                # Global styles
├── public/                    # Static assets
│   └── LOGOS/                 # Brand assets
├── .env.local                 # Environment variables
├── next.config.ts             # Next.js configuration
├── tailwind.config.ts         # Tailwind CSS configuration
└── package.json               # Dependencies and scripts
```

## 🔧 Configuration

### Environment Variables
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# AI Configuration
GROQ_API_KEY=your_groq_api_key

# Optional: Analytics
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your_analytics_id
```

### Database Schema
The application uses the following main tables:
- `user_profiles`: Student and company information
- `weekly_logs`: Generated log entries
- `auth.users`: Supabase authentication (managed)

## 🚀 Deployment

### Vercel (Recommended)
1. **Connect your GitHub repository** to Vercel
2. **Configure environment variables** in Vercel dashboard
3. **Deploy automatically** on every push to main branch

### Manual Deployment
```bash
# Build the application
npm run build

# Start production server
npm start
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines
- Follow TypeScript best practices
- Use Tailwind CSS for styling
- Maintain responsive design principles
- Write meaningful commit messages
- Test on multiple devices and browsers

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Next.js Team** for the amazing React framework
- **Supabase** for the backend infrastructure
- **Groq** for fast AI inference
- **Vercel** for seamless deployment
- **Tailwind CSS** for the utility-first CSS framework

## 📞 Support

- **Website**: [https://swiftlog-beta.vercel.app](https://swiftlog-beta.vercel.app)
- **Issues**: [GitHub Issues](https://github.com/Dukeazeta/siwes-log-generator/issues)
- **Email**: azetaduke@gmail.com

---

**Built with ❤️ by [DUKEDEV](https://github.com/Dukeazeta)**

*Making SIWES documentation effortless for IT students across Nigeria.*
