'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import PageTransition from '../../components/PageTransition';

export default function CreateLog() {
  const router = useRouter();
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [weekNumber, setWeekNumber] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activities, setActivities] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    // TODO: Implement AI generation logic
    setTimeout(() => {
      setIsGenerating(false);
      router.push('/dashboard');
    }, 2000);
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50">
        {/* Floating Glassmorphism Navbar */}
        <motion.header
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="fixed top-4 md:top-6 left-1/2 transform -translate-x-1/2 z-50 w-[95%] md:w-[90%] max-w-4xl"
        >
          <nav className="backdrop-blur-md bg-white/70 border border-gray-200/50 rounded-full px-4 md:px-8 py-3 md:py-4">
            <div className="flex items-center justify-between">
              {/* Back Button and Title */}
              <Link href="/dashboard" className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <div>
                  <span className="text-sm font-medium text-gray-900">Create New Log</span>
                  <p className="text-xs text-gray-500">Week {weekNumber}</p>
                </div>
              </Link>

              {/* Logo */}
              <Image
                src="/LOGOS/SwiftLog.svg"
                alt="SwiftLog Logo"
                width={40}
                height={40}
                className="w-8 h-8 md:w-10 md:h-10"
              />
            </div>
          </nav>
        </motion.header>

        {/* Main Content */}
        <main className="pt-24 md:pt-32 px-4 py-6 max-w-2xl mx-auto">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="space-y-6">
              {/* Week Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Week Number
                </label>
                <select
                  value={weekNumber}
                  onChange={(e) => setWeekNumber(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {[...Array(24)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      Week {i + 1}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Activities */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Activities & Tasks
                </label>
                <textarea
                  value={activities}
                  onChange={(e) => setActivities(e.target.value)}
                  placeholder="Describe the activities, tasks, and projects you worked on this week..."
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Be specific about your daily activities, learning outcomes, and contributions.
                </p>
              </div>

              {/* Generate Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGenerate}
                disabled={isGenerating || !startDate || !endDate || !activities.trim()}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                {isGenerating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Generating Log...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>Generate with AI</span>
                  </>
                )}
              </motion.button>
            </div>
          </div>

          {/* Tips */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">💡 Tips for better logs</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Include specific technical skills and tools used</li>
              <li>• Mention learning outcomes and challenges faced</li>
              <li>• Describe your contributions to team projects</li>
              <li>• Note any feedback received from supervisors</li>
            </ul>
          </div>
        </main>
      </div>
    </PageTransition>
  );
}
