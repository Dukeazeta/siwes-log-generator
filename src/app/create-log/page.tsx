'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import PageTransition from '../../components/PageTransition';
import Logo from '../../components/Logo';

interface UserProfile {
  full_name: string;
  course: string;
  institution: string;
  level: string;
  company_name: string;
  department: string;
  company_address: string;
  industry_type: string;
  company_description: string;
  start_date: string;
  end_date: string;
  supervisor_name: string;
  supervisor_title: string;
}

export default function CreateLog() {
  const router = useRouter();
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [weekNumber, setWeekNumber] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activities, setActivities] = useState('');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState('');

  // Load user profile on component mount
  useEffect(() => {
    const loadUserProfile = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (error) throw error;
          setUserProfile(data);
        } catch (error) {
          console.error('Error loading profile:', error);
        }
      }
    };

    loadUserProfile();
  }, [user]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError('');

    try {
      const response = await fetch('/api/generate-log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          weekNumber,
          startDate,
          endDate,
          activities,
          userProfile,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('API Error Response:', result);
        throw new Error(result.details || result.error || 'Failed to generate log');
      }

      // Save the generated log to database
      const { error: saveError } = await supabase
        .from('weekly_logs')
        .insert({
          user_id: user?.id,
          week_number: weekNumber,
          start_date: startDate,
          end_date: endDate,
          content: JSON.stringify(result.data),
          raw_activities: activities,
        });

      if (saveError) throw saveError;

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Error generating log:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate log');
    } finally {
      setIsGenerating(false);
    }
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
              <Link
                href="/dashboard"
                className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <div>
                  <span className="text-sm font-medium text-gray-900">Create New Log</span>
                  <p className="text-xs text-gray-500">Week {weekNumber}</p>
                </div>
              </Link>

              {/* Logo */}
              <Logo
                width={40}
                height={40}
                className="w-8 h-8 md:w-10 md:h-10"
              />
            </div>
          </nav>
        </motion.header>

        {/* Main Content */}
        <main className="pt-24 md:pt-32 px-4 py-6 max-w-2xl mx-auto">
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Create Weekly Log</h1>
              <p className="text-gray-600">Transform your activities into a professional logbook entry</p>
            </div>

            {/* Week Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Week Number
              </label>
              <div className="relative">
                <select
                  value={weekNumber}
                  onChange={(e) => setWeekNumber(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 text-gray-900 appearance-none cursor-pointer transition-colors"
                >
                  {[...Array(24)].map((_, i) => (
                    <option key={i + 1} value={i + 1} className="text-gray-900">
                      Week {i + 1}
                    </option>
                  ))}
                </select>
                {/* Custom dropdown arrow */}
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 text-gray-900 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 text-gray-900 transition-colors"
                />
              </div>
            </div>

            {/* Activities */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Activities & Tasks
              </label>
              <textarea
                value={activities}
                onChange={(e) => setActivities(e.target.value)}
                placeholder="Describe the activities, tasks, and projects you worked on this week..."
                rows={6}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 text-gray-900 placeholder-gray-500 resize-none transition-colors"
              />
              <p className="text-xs text-gray-500 mt-2">
                Be specific about your daily activities, learning outcomes, and contributions.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* Generate Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGenerate}
              disabled={isGenerating || !startDate || !endDate || !activities.trim()}
              className="w-full bg-gray-900 text-white py-4 rounded-full font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2 text-base"
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

            {/* Tips */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">💡 Tips for better logs</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Include specific technical skills and tools used</li>
                <li>• Mention learning outcomes and challenges faced</li>
                <li>• Describe your contributions to team projects</li>
                <li>• Note any feedback received from supervisors</li>
              </ul>
            </div>
          </div>
        </main>
      </div>
    </PageTransition>
  );
}
