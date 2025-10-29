'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { apiClient } from '../../lib/api-client';
import PageTransition from '../../components/PageTransition';
import Logo from '../../components/Logo';
import DateRangeSelector from '../../components/DateRangeSelector';
import { LumaSpin } from '../../components/ui/luma-spin';
import { logAuthDebugInfo } from '../../lib/debug-auth';
import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from '../../components/ui/prompt-input';
import { Button } from '../../components/ui/button';
import { ArrowUp, Square } from 'lucide-react';
import { VoiceInputAction } from '../../components/ui/voice-input-action';

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
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [weekNumber, setWeekNumber] = useState(1);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [activities, setActivities] = useState('');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [editLogId, setEditLogId] = useState<string | null>(null);
  const [existingWeeks, setExistingWeeks] = useState<number[]>([]);

  const loadExistingLog = useCallback(async (logId: string) => {
    try {
      const { data, error } = await supabase
        .from('weekly_logs')
        .select('*')
        .eq('id', logId)
        .single();

      if (error) throw error;

      // Pre-fill the form with existing data
      setStartDate(new Date(data.start_date));
      setEndDate(new Date(data.end_date));
      setActivities(data.raw_activities || '');
    } catch (error) {
      console.error('Error loading existing log:', error);
      setError('Failed to load log for editing');
    }
  }, []);

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
  }, [user, searchParams, loadExistingLog]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError('');

    // Debug authentication state before making API calls
    logAuthDebugInfo('Before Log Generation');

    try {
      // Check for existing week number if not in edit mode
      if (!isEditMode && user?.id) {
        console.log('Checking for existing week:', weekNumber);
        try {
          const { data: existingLog, error: checkError } = await supabase
            .from('weekly_logs')
            .select('id, week_number')
            .eq('user_id', user.id)
            .eq('week_number', weekNumber)
            .maybeSingle(); // Use maybeSingle instead of single to avoid 406

          if (checkError) {
            console.error('Error checking existing log:', checkError);
            throw checkError;
          }

          if (existingLog) {
            throw new Error(`Week ${weekNumber} already exists. Please choose a different week number or edit the existing log.`);
          }
        } catch (queryError: any) {
          // Handle specific Supabase errors
          if (queryError.code === '406' || queryError.message?.includes('406')) {
            console.error('Supabase 406 error, trying alternative approach:', queryError);
            // Fallback: Use array query instead of single
            const { data: logs, error: arrayError } = await supabase
              .from('weekly_logs')
              .select('id, week_number')
              .eq('user_id', user.id)
              .eq('week_number', weekNumber);

            if (arrayError) {
              console.error('Array query also failed:', arrayError);
              throw arrayError;
            }

            if (logs && logs.length > 0) {
              throw new Error(`Week ${weekNumber} already exists. Please choose a different week number or edit the existing log.`);
            }
          } else {
            throw queryError;
          }
        }
      }

      console.log('Generating log with AI...');

      const result = await apiClient.postJson('/generate-log-unified', {
        weekNumber,
        startDate: startDate?.toISOString().split('T')[0],
        endDate: endDate?.toISOString().split('T')[0],
        activities,
        userProfile,
        provider: 'auto',
      });

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

      let errorMessage = 'Failed to generate log';

      if (error instanceof Error) {
        if (error.message.includes('Rate limit')) {
          errorMessage = 'Too many requests. Please wait a moment and try again.';
        } else if (error.message.includes('Authentication')) {
          errorMessage = 'Authentication required. Please log in again.';
        } else if (error.message.includes('Server error')) {
          errorMessage = 'Server is busy. Please try again in a moment.';
        } else if (error.message.includes('Request too large')) {
          errorMessage = 'Activities text too long. Please reduce the amount of text and try again.';
        } else if (error.message.includes('AI service configuration')) {
          errorMessage = 'AI service is temporarily unavailable. Please try again later.';
        } else {
          errorMessage = error.message;
        }
      }

      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDateRangeChange = (selectedStartDate: Date | null, selectedEndDate: Date | null) => {
    setStartDate(selectedStartDate);
    setEndDate(selectedEndDate);
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
        <main className="pt-20 md:pt-24 px-4 py-8 max-w-2xl mx-auto">
          <div className="space-y-8">
            {/* Header */}
            <div className="text-center mb-10">
            </div>

            {/* Week Selection */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-foreground mb-4">
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
                  className="w-full px-4 py-4 !bg-transparent border border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-ring text-foreground appearance-none cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: 'transparent !important' }}
                >
                  {[...Array(24)].map((_, i) => {
                    const week = i + 1;
                    const isExisting = existingWeeks.includes(week);
                    return (
                      <option 
                        key={week} 
                        value={week} 
                        className="text-foreground bg-background"
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
                <p className="text-xs text-orange-600 mt-3">
                  ⚠️ Week {weekNumber} already exists. Please choose a different week or edit the existing one.
                </p>
              )}
            </div>

            {/* Date Range Selector */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-foreground mb-4">
                Training Week Dates
              </label>
              <DateRangeSelector
                onDateRangeChange={handleDateRangeChange}
                initialStartDate={startDate || undefined}
                initialEndDate={endDate || undefined}
              />
            </div>

            {/* Activities */}
            <div className="mb-8">
              <PromptInput
                value={activities}
                onValueChange={setActivities}
                isLoading={isGenerating}
                onSubmit={handleGenerate}
                className="w-full"
                maxHeight={200}
              >
                <PromptInputTextarea 
                  placeholder="What did you do this week?"
                  disabled={isGenerating}
                />
                <PromptInputActions className="justify-end pt-2">
                  <VoiceInputAction
                    currentText={activities}
                    onTextChange={setActivities}
                    disabled={isGenerating}
                  />
                  <PromptInputAction
                    tooltip={isGenerating ? "Generating..." : "Generate with AI"}
                  >
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={handleGenerate}
                      disabled={isGenerating || !startDate || !endDate}
                    >
                      {isGenerating ? (
                        <Square className="size-4 fill-current" />
                      ) : (
                        <ArrowUp className="size-4" />
                      )}
                    </Button>
                  </PromptInputAction>
                </PromptInputActions>
              </PromptInput>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* Tips */}
            <div className="bg-muted border border-border rounded-xl p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">💡 Tips for better logs</h3>
              <ul className="text-sm text-muted-foreground space-y-3">
                <li>• Include specific technical skills and tools used</li>
                <li>• Mention learning outcomes and challenges faced</li>
                <li>• Describe your contributions to team projects</li>
                <li>• Note any feedback received from supervisors</li>
              </ul>
            </div>
          </div>
        </main>

        {/* Full-screen LumaSpin loader */}
        {isGenerating && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="flex flex-col items-center">
              <LumaSpin />
              <p className="mt-4 text-lg font-medium text-foreground">Generating Log</p>
              <p className="mt-2 text-sm text-muted-foreground">Please wait while we create your professional logbook entry</p>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
