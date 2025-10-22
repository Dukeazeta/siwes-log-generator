'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import PageTransition from '../../components/PageTransition';
import Logo from '../../components/Logo';
import DateRangeSelector from '../../components/DateRangeSelector';
import { Button } from '../../components/ui/button';
import { ArrowLeft, Save, X } from 'lucide-react';

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

interface DayInput {
  day: string;
  date: string;
  activities: string;
}

const DAYS_OF_WEEK = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

export default function ManualLog() {
  const router = useRouter();
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [weekNumber, setWeekNumber] = useState(1);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState('');
  const [existingWeeks, setExistingWeeks] = useState<number[]>([]);
  const [dailyInputs, setDailyInputs] = useState<DayInput[]>([]);
  const [characterCounts, setCharacterCounts] = useState<{ [key: number]: number }>({});

  // Initialize daily inputs
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const inputs: DayInput[] = [];

      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(start);
        currentDate.setDate(start.getDate() + i);
        const dayName = DAYS_OF_WEEK[currentDate.getDay() === 0 ? 6 : currentDate.getDay() - 1];

        inputs.push({
          day: dayName,
          date: currentDate.toISOString().split('T')[0],
          activities: ''
        });
      }

      setDailyInputs(inputs);
    }
  }, [startDate, endDate]);

  // Load existing weeks to suggest next available week
  useEffect(() => {
    const loadExistingWeeks = async () => {
      if (user?.id) {
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
  }, [user?.id]);

  // Load user profile
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

  const handleDateRangeChange = (selectedStartDate: Date | null, selectedEndDate: Date | null) => {
    setStartDate(selectedStartDate);
    setEndDate(selectedEndDate);
  };

  const handleDayInputChange = (index: number, value: string) => {
    const newInputs = [...dailyInputs];
    newInputs[index].activities = value;
    setDailyInputs(newInputs);

    // Update character count
    setCharacterCounts(prev => ({
      ...prev,
      [index]: value.length
    }));
  };

  const validateForm = () => {
    if (!startDate || !endDate) {
      setError('Please select a date range for this week');
      return false;
    }

    if (existingWeeks.includes(weekNumber)) {
      setError(`Week ${weekNumber} already exists. Please choose a different week number.`);
      return false;
    }

    // Check if at least 3 days have content
    const daysWithContent = dailyInputs.filter(input => input.activities.trim().length > 0);
    if (daysWithContent.length < 3) {
      setError('Please provide activities for at least 3 days of the week');
      return false;
    }

    // Check character limits
    const maxChars = 2000;
    for (let i = 0; i < dailyInputs.length; i++) {
      if (dailyInputs[i].activities.length > maxChars) {
        setError(`${dailyInputs[i].day} exceeds maximum character limit (${maxChars} characters)`);
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    setError('');

    try {
      // Create the log structure matching AI-generated format
      const logContent = {
        weekSummary: `Week ${weekNumber} activities from ${dailyInputs[0].date} to ${dailyInputs[6].date}`,
        dailyActivities: dailyInputs.map(input => ({
          day: input.day,
          date: input.date,
          activities: input.activities
        })),
        skillsDeveloped: [], // Empty for manual logs - can be enhanced later
        learningOutcomes: '', // Empty for manual logs - can be enhanced later
        challengesFaced: '', // Empty for manual logs - can be enhanced later
      };

      console.log('Saving manual log for user:', user?.id, 'week:', weekNumber);
      const { data: insertData, error: saveError } = await supabase
        .from('weekly_logs')
        .insert({
          user_id: user?.id,
          week_number: weekNumber,
          start_date: startDate,
          end_date: endDate,
          content: JSON.stringify(logContent),
          raw_activities: dailyInputs.map(input => `${input.day}: ${input.activities}`).join('\n\n'),
        })
        .select();

      if (saveError) {
        console.error('Error saving manual log:', saveError);
        throw saveError;
      }

      console.log('Manual log saved successfully:', insertData);
      router.push('/dashboard?created=true');
    } catch (error) {
      console.error('Error saving manual log:', error);
      setError(error instanceof Error ? error.message : 'Failed to save manual log');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.push('/dashboard');
  };

  const clearAllInputs = () => {
    const clearedInputs = dailyInputs.map(input => ({
      ...input,
      activities: ''
    }));
    setDailyInputs(clearedInputs);
    setCharacterCounts({});
  };

  if (!user) {
    return null;
  }

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
                <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                <div>
                  <span className="text-sm font-medium text-foreground">Manual Input</span>
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
        <main className="pt-20 md:pt-24 px-4 py-8 max-w-4xl mx-auto">
          <div className="space-y-8">
            {/* Header */}
            <div className="text-center mb-10">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                Manual Log Entry
              </h1>
              <p className="text-muted-foreground">
                Create your weekly log entry with complete control over the content
              </p>
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
                  className="w-full px-4 py-4 !bg-transparent border border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-ring text-foreground appearance-none cursor-pointer transition-colors"
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
                        disabled={isExisting}
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
              {existingWeeks.includes(weekNumber) && (
                <p className="text-xs text-orange-600 mt-3">
                  ⚠️ Week {weekNumber} already exists. Please choose a different week.
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

            {/* Daily Activities Input */}
            {dailyInputs.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <label className="text-sm font-semibold text-foreground">
                    Daily Activities
                  </label>
                  <button
                    onClick={clearAllInputs}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Clear All
                  </button>
                </div>

                <div className="space-y-4">
                  {dailyInputs.map((dayInput, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="bg-card border border-border rounded-xl p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-foreground">{dayInput.day}</h3>
                          <p className="text-sm text-muted-foreground">{dayInput.date}</p>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {characterCounts[index] || 0} / 2000 chars
                        </div>
                      </div>

                      <textarea
                        value={dayInput.activities}
                        onChange={(e) => handleDayInputChange(index, e.target.value)}
                        placeholder={`Describe your activities for ${dayInput.day}...`}
                        className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground resize-none transition-colors"
                        rows={4}
                        maxLength={2000}
                        disabled={isSaving}
                      />

                      {/* Progress indicator */}
                      <div className="mt-2">
                        <div className="w-full bg-muted rounded-full h-1.5">
                          <div
                            className="bg-primary h-1.5 rounded-full transition-all duration-200"
                            style={{
                              width: `${Math.min(((characterCounts[index] || 0) / 2000) * 100, 100)}%`
                            }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

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

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 border border-border rounded-xl hover:bg-muted transition-colors disabled:opacity-50 font-medium"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>

              <button
                onClick={handleSave}
                disabled={isSaving || !startDate || !endDate}
                className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 font-medium"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Log</span>
                  </>
                )}
              </button>
            </div>

            {/* Tips */}
            <div className="bg-muted border border-border rounded-xl p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">💡 Manual Input Tips</h3>
              <ul className="text-sm text-muted-foreground space-y-3">
                <li>• Be specific about tasks, projects, and accomplishments</li>
                <li>• Include technical skills, tools, and technologies used</li>
                <li>• Document learning experiences and challenges faced</li>
                <li>• Mention collaborations and team interactions</li>
                <li>• Minimum 3 days of activities required to save</li>
              </ul>
            </div>
          </div>
        </main>

        {/* Save loading overlay */}
        {isSaving && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-lg font-medium text-foreground">Saving Manual Log</p>
              <p className="mt-2 text-sm text-muted-foreground">Please wait while we save your log entry</p>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}