'use client';

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import PageTransition from "../../components/PageTransition";

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

interface WeeklyLog {
  id: string;
  week_number: number;
  start_date: string;
  end_date: string;
  content: string;
  created_at: string;
}

export default function Dashboard() {
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [weeklyLogs, setWeeklyLogs] = useState<WeeklyLog[]>([]);
  const [profileLoading, setProfileLoading] = useState(true);
  const [activeWeek, setActiveWeek] = useState(1);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hasLoadedData, setHasLoadedData] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);







  const loadUserData = useCallback(async () => {
    if (hasLoadedData || profileLoading) return; // Prevent multiple loads

    setProfileLoading(true);
    setHasLoadedData(true);

    try {
      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          // No profile found - redirect to onboarding
          router.push('/onboarding');
          return;
        }
        throw profileError;
      }

      setProfile(profileData);

      // Load weekly logs
      const { data: logsData, error: logsError } = await supabase
        .from('weekly_logs')
        .select('*')
        .eq('user_id', user?.id)
        .order('week_number', { ascending: true });

      if (logsError && logsError.code !== 'PGRST116') {
        throw logsError;
      }

      setWeeklyLogs(logsData || []);

      // Set active week to the first available week
      if (logsData && logsData.length > 0) {
        setActiveWeek(logsData[0].week_number);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      // Don't block the UI for data loading errors
      setProfile({} as UserProfile); // Set empty object instead of null to prevent re-triggering
      setWeeklyLogs([]);
    } finally {
      setProfileLoading(false);
    }
  }, [user?.id, router, hasLoadedData, profileLoading]);

  useEffect(() => {
    // Don't do anything while auth is loading
    if (isLoading) return;

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Redirect to onboarding if not completed
    if (user && !user.hasCompletedOnboarding) {
      console.log('Dashboard: Redirecting to onboarding', {
        userId: user.id,
        hasCompletedOnboarding: user.hasCompletedOnboarding
      });
      router.push('/onboarding');
      return;
    }

    // Load user data if authenticated and no profile loaded yet
    if (user?.id && !hasLoadedData && !profile) {
      loadUserData();
    }
  }, [isAuthenticated, isLoading, user?.id, user?.hasCompletedOnboarding, hasLoadedData, profile, loadUserData, router, user]);

  // Reset loading state when user changes
  useEffect(() => {
    if (user?.id) {
      setHasLoadedData(false);
      setProfile(null);
      setProfileLoading(true);
    }
  }, [user?.id]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    };

    if (mobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mobileMenuOpen]);

  // Reset loading state if stuck
  useEffect(() => {
    if (profileLoading) {
      const timeout = setTimeout(() => {
        setProfileLoading(false);
      }, 5000);

      return () => {
        clearTimeout(timeout);
      };
    }
  }, [profileLoading]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };



  const handleAddWeek = () => {
    router.push('/create-log');
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleEditProfile = () => {
    // TODO: Navigate to edit profile page
    setMobileMenuOpen(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Image
            src="/LOGOS/SwiftLog.svg"
            alt="SwiftLog Logo"
            width={64}
            height={64}
            priority
            className="w-16 h-16 mx-auto mb-4 animate-pulse"
          />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Image
            src="/LOGOS/SwiftLog.svg"
            alt="SwiftLog Logo"
            width={64}
            height={64}
            priority
            className="w-16 h-16 mx-auto mb-4 animate-pulse"
          />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }



  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Image
            src="/LOGOS/SwiftLog.svg"
            alt="SwiftLog Logo"
            width={64}
            height={64}
            priority
            className="w-16 h-16 mx-auto mb-4"
          />
          <p className="text-gray-600 mb-4">Profile not found</p>
          <Link
            href="/onboarding"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Complete Profile Setup
          </Link>
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50">
        {/* Floating Glassmorphism Navbar */}
        <motion.header
          ref={mobileMenuRef}
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="fixed top-4 md:top-6 left-1/2 transform -translate-x-1/2 z-50 w-[95%] md:w-[90%] max-w-4xl"
        >
          <nav className="backdrop-blur-md bg-white/70 border border-gray-200/50 rounded-full px-4 md:px-8 py-3 md:py-4">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <Link href="/" className="flex items-center justify-center">
                <Image
                  src="/LOGOS/SwiftLog.svg"
                  alt="SwiftLog Logo"
                  width={48}
                  height={48}
                  className="w-10 h-10 md:w-12 md:h-12"
                />
              </Link>

              {/* Navigation Links */}
              <div className="hidden md:flex items-center space-x-8">
                {['Features', 'Process', 'About'].map((item) => (
                  <a
                    key={item}
                    href={`/#${item.toLowerCase()}`}
                    className="text-gray-600 hover:text-gray-900 font-medium transition-colors relative"
                  >
                    {item}
                  </a>
                ))}
              </div>

              {/* User Menu */}
              <div className="flex items-center space-x-3">
                {/* Desktop: Logout button */}
                <button
                  onClick={handleLogout}
                  className="hidden md:block w-8 h-8 rounded-full overflow-hidden hover:scale-105 transition-transform border-2 border-white/50"
                  title="Logout"
                >
                  {user?.avatarUrl ? (
                    <Image
                      src={user.avatarUrl}
                      alt="Profile"
                      width={32}
                      height={32}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                      {user?.fullName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                    </div>
                  )}
                </button>

                {/* Mobile: Menu toggle */}
                <button
                  onClick={toggleMobileMenu}
                  className="md:hidden w-8 h-8 rounded-full overflow-hidden hover:scale-105 transition-transform border-2 border-white/50"
                  title="Menu"
                >
                  {user?.avatarUrl ? (
                    <Image
                      src={user.avatarUrl}
                      alt="Profile"
                      width={32}
                      height={32}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                      {user?.fullName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                    </div>
                  )}
                </button>
              </div>
            </div>
          </nav>

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="md:hidden absolute top-full left-0 right-0 mt-2 mx-4 bg-white/90 backdrop-blur-md border border-gray-200/50 rounded-2xl shadow-lg overflow-hidden"
            >
              <div className="p-4">
                {/* Navigation Links */}
                <div className="space-y-3 mb-4">
                  {['Features', 'Process', 'About'].map((item) => (
                    <a
                      key={item}
                      href={`/#${item.toLowerCase()}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block text-gray-600 hover:text-gray-900 font-medium transition-colors py-2"
                    >
                      {item}
                    </a>
                  ))}
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200/50 my-4"></div>

                {/* Profile Actions */}
                <div className="space-y-3">
                  <button
                    onClick={handleEditProfile}
                    className="flex items-center space-x-3 w-full text-left text-gray-600 hover:text-gray-900 font-medium transition-colors py-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Edit Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="flex items-center space-x-3 w-full text-left text-red-600 hover:text-red-700 font-medium transition-colors py-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </motion.header>

        {/* Main Content */}
        <main className="pt-24 md:pt-32 px-4 sm:px-6 py-6 pb-12 max-w-4xl mx-auto">
          {/* Profile Header */}
          <div className="mb-12">
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                <h1 className="text-4xl sm:text-5xl font-bold text-gray-900">SIWES Logbook</h1>
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-medium w-fit">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
                  Beta V1.1
                </div>
              </div>
              <p className="text-lg sm:text-xl text-gray-600 leading-relaxed">{profile.full_name} • {profile.course}</p>
            </div>
          </div>

          {/* Training Information */}
          <div className="mb-16">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Training Information</h2>
              <span className="text-base text-gray-600 font-medium">
                {profile.start_date && profile.end_date &&
                  `${formatDate(profile.start_date)} — ${formatDate(profile.end_date)}`
                }
              </span>
            </div>

            <div className="grid gap-12 md:grid-cols-2">
              {/* Student Details */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-6">Student Details</h3>
                <div className="space-y-6">
                  <div>
                    <div className="text-sm text-gray-500 mb-2 font-medium uppercase tracking-wide">Name</div>
                    <div className="text-lg font-semibold text-gray-900">{profile.full_name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-2 font-medium uppercase tracking-wide">Course</div>
                    <div className="text-lg text-gray-900">{profile.course}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-2 font-medium uppercase tracking-wide">Institution</div>
                    <div className="text-lg text-gray-900">{profile.institution}</div>
                  </div>
                </div>
              </div>

              {/* Company Details */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-6">Company Details</h3>
                <div className="space-y-6">
                  <div>
                    <div className="text-sm text-gray-500 mb-2 font-medium uppercase tracking-wide">Company</div>
                    <div className="text-lg font-semibold text-gray-900">{profile.company_name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-2 font-medium uppercase tracking-wide">Department</div>
                    <div className="text-lg text-gray-900">{profile.department}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Company Description */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <h4 className="text-xl font-bold text-gray-900 mb-4">Company Description</h4>
              <p className="text-lg text-gray-600 leading-relaxed max-w-4xl">
                {profile.company_description}
              </p>
            </div>
          </div>

          {/* Weekly Logs */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Weekly Logs</h2>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <button className="flex items-center justify-center space-x-2 px-6 py-3 text-sm text-orange-600 bg-orange-50 rounded-full border border-orange-200 hover:bg-orange-100 transition-colors font-semibold">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Download PDF</span>
                  <span className="bg-orange-200 text-orange-800 text-xs px-2 py-0.5 rounded-full font-medium">NEW</span>
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddWeek}
                  className="flex items-center justify-center space-x-2 px-6 py-3 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-colors text-sm font-semibold"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Add Week</span>
                </motion.button>
              </div>
            </div>

            {/* Week Tabs */}
            <div className="mb-8">
              <div className="flex space-x-2 overflow-x-auto pb-2">
                {weeklyLogs.length > 0 ? (
                  weeklyLogs.map((log) => (
                    <button
                      key={log.week_number}
                      onClick={() => setActiveWeek(log.week_number)}
                      className={`px-6 py-3 text-sm font-semibold rounded-full whitespace-nowrap transition-colors min-w-fit ${
                        activeWeek === log.week_number
                          ? 'bg-gray-900 text-white'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      Week {log.week_number}
                    </button>
                  ))
                ) : (
                  <div className="text-gray-500 text-base py-3 px-2">
                    No weeks created yet
                  </div>
                )}
              </div>
            </div>

            {/* Week Content */}
            <div>
              {weeklyLogs.length > 0 ? (
                (() => {
                  const currentLog = weeklyLogs.find(log => log.week_number === activeWeek);
                  if (!currentLog) {
                    return (
                      <div className="text-center py-16">
                        <p className="text-gray-500 mb-6 text-lg">No log found for Week {activeWeek}</p>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleAddWeek}
                          className="inline-flex items-center space-x-2 px-6 py-3 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-colors text-sm font-semibold"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          <span>Create Week {activeWeek}</span>
                        </motion.button>
                      </div>
                    );
                  }

                  const logContent = typeof currentLog.content === 'string'
                    ? JSON.parse(currentLog.content)
                    : currentLog.content;

                  return (
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">
                        Week {activeWeek}: {formatDate(currentLog.start_date)} — {formatDate(currentLog.end_date)}
                      </h3>

                      {/* Week Summary */}
                      <p className="text-lg text-gray-600 leading-relaxed mb-12 max-w-4xl">
                        {logContent.weekSummary}
                      </p>

                      {/* Daily Activities */}
                      <div className="mb-16">
                        <h4 className="text-xl font-bold text-gray-900 mb-8">Daily Activities</h4>

                        {/* Mobile-friendly cards for small screens */}
                        <div className="block sm:hidden space-y-6">
                          {logContent.dailyActivities?.map((activity: { day: string; date: string; activities: string }, index: number) => (
                            <div key={index} className="border-l-4 border-gray-900 pl-6">
                              <div className="flex items-center justify-between mb-3">
                                <div className="text-gray-900 font-bold text-lg">{activity.day}</div>
                                <div className="text-gray-500 text-sm font-medium">{activity.date}</div>
                              </div>
                              <div className="text-gray-700 text-base leading-relaxed">
                                {activity.activities}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Table for larger screens */}
                        <div className="hidden sm:block">
                          <div className="space-y-6">
                            {logContent.dailyActivities?.map((activity: { day: string; date: string; activities: string }, index: number) => (
                              <div key={index} className="border-l-4 border-gray-900 pl-8 py-2">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="text-gray-900 font-bold text-lg">{activity.day}</div>
                                  <div className="text-gray-500 text-sm font-medium">{activity.date}</div>
                                </div>
                                <div className="text-gray-700 text-base leading-relaxed">
                                  {activity.activities}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Skills and Learning Outcomes */}
                      <div className="grid gap-12 md:grid-cols-2 mb-12">
                        <div>
                          <h4 className="text-xl font-bold text-gray-900 mb-6">Skills Developed</h4>
                          <ul className="text-gray-700 text-base space-y-3">
                            {logContent.skillsDeveloped?.map((skill: string, index: number) => (
                              <li key={index} className="flex items-start">
                                <span className="text-gray-900 mr-3 mt-1 font-bold">•</span>
                                <span className="leading-relaxed">{skill}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h4 className="text-xl font-bold text-gray-900 mb-6">Learning Outcomes</h4>
                          <p className="text-gray-700 text-base leading-relaxed">
                            {logContent.learningOutcomes}
                          </p>
                        </div>
                      </div>

                      {/* Challenges Faced */}
                      {logContent.challengesFaced && (
                        <div className="pt-8 border-t border-gray-200">
                          <h4 className="text-xl font-bold text-gray-900 mb-6">Challenges Faced</h4>
                          <p className="text-gray-700 text-base leading-relaxed max-w-4xl">
                            {logContent.challengesFaced}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })()
              ) : (
                <div className="text-center py-20">
                  <h3 className="text-3xl font-bold text-gray-900 mb-4">No logs yet</h3>
                  <p className="text-gray-600 mb-8 text-lg leading-relaxed max-w-2xl mx-auto">Start by creating your first weekly log entry. Transform your weekly activities into professional logbook entries.</p>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAddWeek}
                    className="inline-flex items-center space-x-2 px-8 py-4 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-colors text-lg font-semibold"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>Create First Log</span>
                  </motion.button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </PageTransition>
  );
}
