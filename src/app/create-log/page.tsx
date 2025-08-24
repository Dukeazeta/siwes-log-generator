'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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

interface WeeklyLogData {
  id: string;
  week_number: number;
  start_date: string;
  end_date: string;
  content: string;
  raw_activities: string;
  created_at: string;
  updated_at?: string;
}

export default function CreateLog() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [weekNumber, setWeekNumber] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activities, setActivities] = useState('');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [editLogId, setEditLogId] = useState<string | null>(null);
  const [originalLogData, setOriginalLogData] = useState<WeeklyLogData | null>(null);
  const [existingWeeks, setExistingWeeks] = useState<number[]>([]);

  // Load existing weeks to suggest next available week
  useEffect(() => {
    const loadExistingWeeks = async () => {
      if (user?.id && !isEditMode) {
        try {
          const { data, error } = await supabase
            .from('weekly_logs')
            .select('week_number')
            .eq('user_id', user.id)
            .order('week_number', { ascending: true });

          if (error && error.code !== 'PGRST116') {
            console.error('Error loading existing weeks:', error);
            return;
          }

          const weeks = data?.map(log => log.week_number) || [];
          setExistingWeeks(weeks);
          
          // Auto-set to next available week
          if (weeks.length > 0) {
            const nextWeek = Math.max(...weeks) + 1;
            if (nextWeek <= 24) {
              setWeekNumber(nextWeek);
            }
          }
        } catch (error) {
          console.error('Error loading existing weeks:', error);
        }
      }
    };

    loadExistingWeeks();
  }, [user?.id, isEditMode]);

  // Load user profile and check for edit mode on component mount
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

    // Check if we're in edit mode
    const editId = searchParams.get('edit');
    const week = searchParams.get('week');
    
    if (editId && week) {
      setIsEditMode(true);
      setEditLogId(editId);
      setWeekNumber(parseInt(week));
      loadExistingLog(editId);
    }

    loadUserProfile();
  }, [user, searchParams]);

  const loadExistingLog = async (logId: string) => {
    try {
      const { data, error } = await supabase
        .from('weekly_logs')
        .select('*')
        .eq('id', logId)
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      
      // Pre-fill the form with existing data
      setStartDate(data.start_date);
      setEndDate(data.end_date);
      setActivities(data.raw_activities || '');
      setOriginalLogData(data);
    } catch (error) {
      console.error('Error loading existing log:', error);
      setError('Failed to load log for editing');
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError('');

    try {
      // Check for existing week number if not in edit mode
      if (!isEditMode && user?.id) {
        console.log('Checking for existing week:', weekNumber);
        const { data: existingLog, error: checkError } = await supabase
          .from('weekly_logs')
          .select('id, week_number')
          .eq('user_id', user.id)
          .eq('week_number', weekNumber)
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          console.error('Error checking existing log:', checkError);
          throw checkError;
        }

        if (existingLog) {
          throw new Error(`Week ${weekNumber} already exists. Please choose a different week number or edit the existing log.`);
        }
      }

      console.log('Generating log with AI...');
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

      console.log('AI generation successful, saving to database...');

      if (isEditMode && editLogId) {
        // Update existing log
        console.log('Updating existing log:', editLogId);
        const { error: updateError } = await supabase
          .from('weekly_logs')
          .update({
            start_date: startDate,
            end_date: endDate,
            content: JSON.stringify(result.data),
            raw_activities: activities,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editLogId)
          .eq('user_id', user?.id);

        if (updateError) {
          console.error('Error updating log:', updateError);
          throw updateError;
        }
        console.log('Log updated successfully');
      } else {
        // Save new log to database
        console.log('Saving new log for user:', user?.id, 'week:', weekNumber);
        const { data: insertData, error: saveError } = await supabase
          .from('weekly_logs')
          .insert({
            user_id: user?.id,
            week_number: weekNumber,
            start_date: startDate,
            end_date: endDate,
            content: JSON.stringify(result.data),
            raw_activities: activities,
          })
          .select(); // Add select to get the inserted data

        if (saveError) {
          console.error('Error saving log:', saveError);
          throw saveError;
        }
        console.log('Log saved successfully:', insertData);
      }

      console.log('Redirecting to dashboard...');
      // Redirect to dashboard with success message
      if (isEditMode) {
        router.push('/dashboard?updated=true');
      } else {
        router.push('/dashboard?created=true');
      }
    } catch (error) {
      console.error('Error generating log:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate log');
    } finally {
      setIsGenerating(false);
    }
  };



  return (
    <PageTransition>
      <div className="min-h-screen bg-secondary/30 transition-colors duration-300">
        {/* Floating Glassmorphism Navbar */}
        <motion.header
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="fixed top-4 md:top-6 left-1/2 transform -translate-x-1/2 z-50 w-[95%] md:w-[90%] max-w-4xl"
        >
          <nav className="backdrop-blur-md bg-background/70 border border-border/50 rounded-full px-4 md:px-8 py-3 md:py-4 transition-colors duration-300">
            <div className="flex items-center justify-between">
              {/* Back Button and Title */}
              <Link
                href="/dashboard"
                className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
              >
                <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <div>
                  <span className="text-sm font-medium text-foreground">{isEditMode ? 'Edit Log' : 'Create New Log'}</span>
                  <p className="text-xs text-muted-foreground">Week {weekNumber}</p>
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
              <h1 className="text-2xl font-bold text-foreground mb-2">
                {isEditMode ? 'Edit Weekly Log' : 'Create Weekly Log'}
              </h1>
              <p className="text-muted-foreground">
                {isEditMode 
                  ? 'Update your activities and regenerate your logbook entry' 
                  : 'Transform your activities into a professional logbook entry'
                }
              </p>
            </div>

            {/* Week Selection */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-3">
                Week Number
                {existingWeeks.length > 0 && (
                  <span className="text-xs text-muted-foreground ml-2">
                    ({existingWeeks.length} weeks created)
                  </span>
                )}
              </label>
              <div className="relative">
                <select
                  value={weekNumber}
                  onChange={(e) => setWeekNumber(Number(e.target.value))}
                  disabled={isEditMode}
                  className="w-full px-4 py-3 bg-card border border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-ring text-card-foreground appearance-none cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {[...Array(24)].map((_, i) => {
                    const week = i + 1;
                    const isExisting = existingWeeks.includes(week);
                    return (
                      <option 
                        key={week} 
                        value={week} 
                        className="text-card-foreground"
                        disabled={isExisting && !isEditMode}
                      >
                        Week {week} {isExisting ? '(Created)' : ''}
                      </option>
                    );
                  })}
                </select>
                {/* Custom dropdown arrow */}
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                  <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              {existingWeeks.includes(weekNumber) && !isEditMode && (
                <p className="text-xs text-orange-600 mt-2">
                  ⚠️ Week {weekNumber} already exists. Please choose a different week or edit the existing one.
                </p>
              )}
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-3">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-3 bg-card border border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-ring text-card-foreground transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-3">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-3 bg-card border border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-ring text-card-foreground transition-colors"
                />
              </div>
            </div>

            {/* Activities */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-3">
                Activities & Tasks
              </label>
              <textarea
                value={activities}
                onChange={(e) => setActivities(e.target.value)}
                placeholder="Describe the activities, tasks, and projects you worked on this week..."
                rows={6}
                className="w-full px-4 py-3 bg-card border border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-ring text-card-foreground placeholder-muted-foreground resize-none transition-colors"
              />
              <p className="text-xs text-muted-foreground mt-2">
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
              className="w-full bg-primary text-primary-foreground py-4 rounded-full font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2 text-base"
            >
              {isGenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                  <span>{isEditMode ? 'Updating Log...' : 'Generating Log...'}</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>{isEditMode ? 'Update with AI' : 'Generate with AI'}</span>
                </>
              )}
            </motion.button>

            {/* Tips */}
            <div className="bg-muted border border-border rounded-xl p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">💡 Tips for better logs</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
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
