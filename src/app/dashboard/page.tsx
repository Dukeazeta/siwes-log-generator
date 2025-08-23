'use client';

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase";
import PageTransition from "../../components/PageTransition";
import Logo from "../../components/Logo";

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
  const { user, logout, isAuthenticated, isLoading, refreshUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [weeklyLogs, setWeeklyLogs] = useState<WeeklyLog[]>([]);
  const [profileLoading, setProfileLoading] = useState(true);
  const [activeWeek, setActiveWeek] = useState(1);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hasLoadedData, setHasLoadedData] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [logToDelete, setLogToDelete] = useState<WeeklyLog | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [redirectAttempts, setRedirectAttempts] = useState(0);
  const [trainingInfoExpanded, setTrainingInfoExpanded] = useState(false);
  const [editingDay, setEditingDay] = useState<{logId: string, dayIndex: number} | null>(null);
  const [editingText, setEditingText] = useState('');
  const [isSavingDay, setIsSavingDay] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Auto-refresh function for weekly logs
  const refreshWeeklyLogs = useCallback(async () => {
    if (!user?.id) return;
    
    console.log('Refreshing weekly logs data...');
    try {
      const { data: logsData, error: logsError } = await supabase
        .from('weekly_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('week_number', { ascending: true });

      if (logsError && logsError.code !== 'PGRST116') {
        console.error('Weekly logs refresh error:', logsError);
        return;
      }

      console.log('Weekly logs refreshed:', logsData?.length || 0, 'logs found');
      setWeeklyLogs(logsData || []);

      // Set active week to the first available week if none selected
      if (logsData && logsData.length > 0 && !logsData.find(log => log.week_number === activeWeek)) {
        setActiveWeek(logsData[0].week_number);
      }
    } catch (error) {
      console.error('Error refreshing weekly logs:', error);
    }
  }, [user?.id, activeWeek]);

  // Check for success notifications from URL params and refresh data
  useEffect(() => {
    const created = searchParams.get('created');
    const updated = searchParams.get('updated');
    
    if (created === 'true') {
      setNotification({
        type: 'success',
        message: 'Weekly log created successfully!'
      });
      setTimeout(() => setNotification(null), 4000);
      // Refresh weekly logs data to show new content
      refreshWeeklyLogs();
      // Remove the parameter from URL
      router.replace('/dashboard', { scroll: false });
    } else if (updated === 'true') {
      setNotification({
        type: 'success',
        message: 'Weekly log updated successfully!'
      });
      setTimeout(() => setNotification(null), 4000);
      // Refresh weekly logs data to show updated content
      refreshWeeklyLogs();
      // Remove the parameter from URL
      router.replace('/dashboard', { scroll: false });
    }
  }, [searchParams, router, refreshWeeklyLogs]);

  const loadUserData = useCallback(async () => {
    if (hasLoadedData || profileLoading || !user?.id) return; // Prevent multiple loads

    console.log('Starting loadUserData for user:', user.email, 'hasCompletedOnboarding:', user.hasCompletedOnboarding);
    setProfileLoading(true);
    setHasLoadedData(true);

    try {
      // Load profile
      console.log('Querying user_profiles for user_id:', user.id);
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      console.log('Profile query result:', { profileData, profileError });

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          // No profile found - this is a data inconsistency since user should have completed onboarding
          console.warn('Profile not found for user who completed onboarding. User:', user.email);
          
          // Check if the user actually has completed onboarding in the database
          const { data: authUser, error: authError } = await supabase.auth.getUser();
          console.log('Auth user check:', { authUser: authUser?.user?.email, authError });
          
          // Prevent infinite redirects
          if (redirectAttempts >= 2) {
            console.error('Too many redirect attempts, showing error state');
            setNotification({
              type: 'error',
              message: 'Profile setup incomplete. Please contact support or try re-setting up your profile.'
            });
            return;
          }
          
          setRedirectAttempts(prev => prev + 1);
          
          // Force refresh user to get the latest onboarding status
          if (refreshUser) {
            console.log('Refreshing user context...');
            await refreshUser();
            return; // Let the refreshed user data trigger this function again
          }
          
          // Fallback: redirect to onboarding if refresh fails
          console.log('Redirecting to onboarding as fallback');
          router.push('/onboarding');
          return;
        }
        console.error('Profile query error:', profileError);
        throw profileError;
      }

      console.log('Profile loaded successfully:', profileData.full_name);
      setProfile(profileData);

      // Sync the profile's completed_onboarding status with user context if needed
      if (profileData.completed_onboarding !== user.hasCompletedOnboarding && refreshUser) {
        console.log('Profile onboarding status mismatch, refreshing user context');
        refreshUser(); // Don't await to avoid blocking UI
      }

      // Load weekly logs
      console.log('Loading weekly logs...');
      const { data: logsData, error: logsError } = await supabase
        .from('weekly_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('week_number', { ascending: true });

      if (logsError && logsError.code !== 'PGRST116') {
        console.error('Weekly logs query error:', logsError);
        throw logsError;
      }

      console.log('Weekly logs loaded:', logsData?.length || 0, 'logs found');
      setWeeklyLogs(logsData || []);

      // Set active week to the first available week
      if (logsData && logsData.length > 0) {
        setActiveWeek(logsData[0].week_number);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      
      // Show error notification instead of showing error state immediately
      setNotification({
        type: 'error',
        message: 'Failed to load profile data. Click "Retry Loading" to try again.'
      });
      setTimeout(() => setNotification(null), 8000);
      
      // Don't set profile to null immediately - give user a chance to retry
      // setProfile(null); // Removed this line
    } finally {
      setProfileLoading(false);
    }
  }, [user?.id, user?.email, user?.hasCompletedOnboarding, router, hasLoadedData, profileLoading, refreshUser, redirectAttempts]);

  useEffect(() => {
    console.log('Dashboard useEffect triggered:', {
      isLoading,
      isAuthenticated,
      userId: user?.id,
      userEmail: user?.email,
      hasCompletedOnboarding: user?.hasCompletedOnboarding,
      hasLoadedData,
      profileLoading,
      profileExists: !!profile
    });
    
    // Don't do anything while auth is loading
    if (isLoading) {
      console.log('Auth is loading, waiting...');
      return;
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      console.log('User not authenticated, redirecting to login');
      router.push('/login');
      return;
    }

    // Only proceed if we have a valid user
    if (!user?.id) {
      console.log('No user ID found, waiting for user data...');
      return;
    }

    // Check onboarding status and redirect if needed
    if (!user.hasCompletedOnboarding) {
      console.log('User has not completed onboarding, redirecting:', {
        userId: user.id,
        email: user.email,
        hasCompletedOnboarding: user.hasCompletedOnboarding
      });
      router.push('/onboarding');
      return;
    }

    // Load user data if we haven't loaded it yet and not currently loading
    if (!hasLoadedData && !profileLoading) {
      console.log('Conditions met for loading user data - starting loadUserData()');
      loadUserData();
    } else {
      console.log('Skipping loadUserData:', {
        hasLoadedData,
        profileLoading,
        reason: hasLoadedData ? 'already loaded' : 'currently loading'
      });
    }
  }, [isAuthenticated, isLoading, user?.id, user?.hasCompletedOnboarding, hasLoadedData, profileLoading, loadUserData, router]);

  // Reset loading state when user changes (but not on every render)
  useEffect(() => {
    if (user?.id && hasLoadedData) {
      // Only reset if this is actually a different user
      const currentUserId = user.id;
      const lastLoadedUserId = localStorage.getItem('lastLoadedUserId');
      
      if (currentUserId !== lastLoadedUserId) {
        console.log('User changed, resetting dashboard state');
        setHasLoadedData(false);
        setProfile(null);
        setWeeklyLogs([]);
        setActiveWeek(1);
        localStorage.setItem('lastLoadedUserId', currentUserId);
      }
    }
  }, [user?.id, hasLoadedData]);

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

  // Page visibility listener for auto-refresh
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user?.id) {
        console.log('Page became visible, refreshing weekly logs...');
        refreshWeeklyLogs();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshWeeklyLogs, user?.id]);

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

  const handleDeleteLog = (log: WeeklyLog) => {
    setLogToDelete(log);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteLog = async () => {
    if (!logToDelete) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('weekly_logs')
        .delete()
        .eq('id', logToDelete.id)
        .eq('user_id', user?.id);

      if (error) throw error;

      // Remove the log from local state
      setWeeklyLogs(prev => prev.filter(log => log.id !== logToDelete.id));
      
      // If we deleted the active week, switch to the first available week
      if (logToDelete.week_number === activeWeek) {
        const remainingLogs = weeklyLogs.filter(log => log.id !== logToDelete.id);
        if (remainingLogs.length > 0) {
          setActiveWeek(remainingLogs[0].week_number);
        }
      }

      setShowDeleteConfirm(false);
      setLogToDelete(null);
      
      // Show success notification
      setNotification({
        type: 'success',
        message: `Week ${logToDelete.week_number} deleted successfully`
      });
      
      // Auto-hide notification after 3 seconds
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('Error deleting log:', error);
      setNotification({
        type: 'error',
        message: 'Failed to delete log. Please try again.'
      });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDeleteLog = () => {
    setShowDeleteConfirm(false);
    setLogToDelete(null);
  };

  const handleEditDay = (logId: string, dayIndex: number, currentText: string) => {
    setEditingDay({ logId, dayIndex });
    setEditingText(currentText);
  };

  const handleSaveDay = async () => {
    if (!editingDay || !user?.id) return;

    setIsSavingDay(true);
    try {
      // Find the current log
      const currentLog = weeklyLogs.find(log => log.id === editingDay.logId);
      if (!currentLog) throw new Error('Log not found');

      // Parse the current content
      const logContent = typeof currentLog.content === 'string'
        ? JSON.parse(currentLog.content)
        : currentLog.content;

      // Update the specific day's activities
      if (logContent.dailyActivities && logContent.dailyActivities[editingDay.dayIndex]) {
        logContent.dailyActivities[editingDay.dayIndex].activities = editingText;
      }

      // Save to database
      const { error } = await supabase
        .from('weekly_logs')
        .update({
          content: JSON.stringify(logContent),
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingDay.logId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setWeeklyLogs(prev => prev.map(log => {
        if (log.id === editingDay.logId) {
          return {
            ...log,
            content: JSON.stringify(logContent),
            updated_at: new Date().toISOString()
          };
        }
        return log;
      }));

      // Clear editing state
      setEditingDay(null);
      setEditingText('');

      // Show success notification
      setNotification({
        type: 'success',
        message: 'Day activity updated successfully'
      });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('Error saving day activity:', error);
      setNotification({
        type: 'error',
        message: 'Failed to save changes. Please try again.'
      });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setIsSavingDay(false);
    }
  };

  const handleCancelEditDay = () => {
    setEditingDay(null);
    setEditingText('');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Logo
            width={64}
            height={64}
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
          <Logo
            width={64}
            height={64}
            className="w-16 h-16 mx-auto mb-4 animate-pulse"
          />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }



  // Show error state only if we've definitively failed to load profile after attempts
  if (!profile && !profileLoading && hasLoadedData && redirectAttempts > 0) {
    console.log('Showing profile error state:', {
      profile: !!profile,
      profileLoading,
      hasLoadedData,
      redirectAttempts,
      userEmail: user?.email,
      userHasCompletedOnboarding: user?.hasCompletedOnboarding
    });
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <Logo
            width={64}
            height={64}
            className="w-16 h-16 mx-auto mb-4"
          />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Profile Error</h3>
          <p className="text-gray-600 mb-6">
            There was an issue loading your profile. This might be a temporary problem.
            {user?.email && (
              <><br /><span className="text-sm text-gray-500">User: {user.email}</span></>
            )}
          </p>
          <div className="space-y-3">
            <button
              onClick={() => {
                console.log('Retry button clicked - resetting state');
                setHasLoadedData(false);
                setProfileLoading(false);
                setRedirectAttempts(0);
                setProfile(null);
                // Clear localStorage to force fresh load
                localStorage.removeItem('lastLoadedUserId');
                loadUserData();
              }}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Retry Loading
            </button>
            <button
              onClick={async () => {
                console.log('Refresh user button clicked');
                if (refreshUser) {
                  await refreshUser();
                }
                setHasLoadedData(false);
                setRedirectAttempts(0);
              }}
              className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Refresh Session
            </button>
            <Link
              href="/onboarding"
              className="block w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-center font-medium"
            >
              Re-setup Profile
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-secondary/30 dark:bg-background transition-colors duration-300" style={{ opacity: 1, visibility: 'visible' }}>
        {/* Floating Glassmorphism Navbar */}
        <motion.header
          ref={mobileMenuRef}
          initial={{ y: -20, opacity: 0.8 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="dashboard-header fixed top-4 md:top-6 left-1/2 transform -translate-x-1/2 z-50 w-[95%] md:w-[90%] max-w-4xl"
        >
          <nav className="backdrop-blur-md bg-background/70 dark:bg-background/80 border border-border/50 rounded-full px-4 md:px-8 py-3 md:py-4 transition-colors duration-300">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <Link href="/" className="flex items-center justify-center">
                <Logo
                  width={48}
                  height={48}
                  className="w-10 h-10 md:w-12 md:h-12"
                />
              </Link>

              {/* Navigation Links */}
              <div className="hidden md:flex items-center space-x-8">
                {['Features', 'Process'].map((item) => (
                  <a
                    key={item}
                    href={`/#${item.toLowerCase()}`}
                    className="text-muted-foreground hover:text-foreground font-medium transition-colors relative"
                  >
                    {item}
                  </a>
                ))}
                <Link
                  href="/changelogs"
                  className="text-muted-foreground hover:text-foreground font-medium transition-colors relative"
                >
                  Changelogs
                </Link>
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
              className="md:hidden absolute top-full left-0 right-0 mt-2 mx-4 bg-card/90 backdrop-blur-md border border-border/50 rounded-2xl shadow-lg overflow-hidden"
            >
              <div className="p-4">
                {/* Navigation Links */}
                <div className="space-y-3 mb-4">
                  {['Features', 'Process'].map((item) => (
                    <a
                      key={item}
                      href={`/#${item.toLowerCase()}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block text-muted-foreground hover:text-foreground font-medium transition-colors py-2"
                    >
                      {item}
                    </a>
                  ))}
                  <Link
                    href="/changelogs"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-muted-foreground hover:text-foreground font-medium transition-colors py-2"
                  >
                    Changelogs
                  </Link>
                </div>

                {/* Divider */}
                <div className="border-t border-border/50 my-4"></div>

                {/* Profile Actions */}
                <div className="space-y-3">
                  <button
                    onClick={handleEditProfile}
                    className="flex items-center space-x-3 w-full text-left text-muted-foreground hover:text-foreground font-medium transition-colors py-2"
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
        <main className="dashboard-content pt-24 md:pt-32 px-4 sm:px-6 py-6 pb-12 max-w-4xl mx-auto">
          {profile && (
            <>
              {/* Profile Header */}
              <div className="mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground">SIWES Logbook</h1>
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-slate-800 dark:bg-gradient-to-r dark:from-indigo-600 dark:via-purple-600 dark:to-pink-600 text-white dark:text-white text-xs font-extrabold w-fit">
                    <span className="w-2 h-2 bg-blue-400 dark:bg-white rounded-full mr-2 animate-pulse"></span>
                    Beta v2.1.1
                  </div>
                </div>
                <p className="text-base text-muted-foreground">{profile.full_name} • {profile.course}</p>
                
                {/* Quick Info Summary */}
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-muted/30 rounded-lg p-3">
                    <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Company</div>
                    <div className="text-sm font-semibold text-foreground truncate">{profile.company_name}</div>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3">
                    <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Department</div>
                    <div className="text-sm font-semibold text-foreground truncate">{profile.department}</div>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3">
                    <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Duration</div>
                    <div className="text-sm font-semibold text-foreground">
                      {profile.start_date && profile.end_date ? (
                        Math.ceil(
                          (new Date(profile.end_date).getTime() - new Date(profile.start_date).getTime()) / 
                          (1000 * 3600 * 24 * 7)
                        ) + ' weeks'
                      ) : 'N/A'}
                    </div>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3">
                    <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Logs Created</div>
                    <div className="text-sm font-semibold text-primary">{weeklyLogs.length} weeks</div>
                  </div>
                </div>
              </div>

              {/* Training Information Dropdown */}
              <div className="bg-card border border-border rounded-2xl transition-colors duration-300 mb-6">
                <button
                  onClick={() => setTrainingInfoExpanded(!trainingInfoExpanded)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/50 transition-colors rounded-2xl"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-card-foreground">Training Information</h2>
                      <p className="text-sm text-muted-foreground">
                        {profile.start_date && profile.end_date &&
                          `${formatDate(profile.start_date)} — ${formatDate(profile.end_date)}`
                        }
                      </p>
                    </div>
                  </div>
                  <motion.div
                    animate={{ rotate: trainingInfoExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </motion.div>
                </button>

                <motion.div
                  initial={false}
                  animate={{
                    height: trainingInfoExpanded ? "auto" : 0,
                    opacity: trainingInfoExpanded ? 1 : 0
                  }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5">
                    <div className="grid gap-4 md:grid-cols-2">
                      {/* Student Details */}
                      <div>
                        <h3 className="text-base font-semibold text-card-foreground mb-3">Student Details</h3>
                        <div className="space-y-2">
                          <div>
                            <div className="text-xs text-muted-foreground mb-0.5 font-medium uppercase tracking-wide">Name</div>
                            <div className="text-sm font-medium text-card-foreground">{profile.full_name}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-0.5 font-medium uppercase tracking-wide">Course</div>
                            <div className="text-sm text-card-foreground">{profile.course}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-0.5 font-medium uppercase tracking-wide">Institution</div>
                            <div className="text-sm text-card-foreground">{profile.institution}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-0.5 font-medium uppercase tracking-wide">Level</div>
                            <div className="text-sm text-card-foreground">{profile.level}</div>
                          </div>
                        </div>
                      </div>

                      {/* Company Details */}
                      <div>
                        <h3 className="text-base font-semibold text-card-foreground mb-3">Company Details</h3>
                        <div className="space-y-2">
                          <div>
                            <div className="text-xs text-muted-foreground mb-0.5 font-medium uppercase tracking-wide">Company</div>
                            <div className="text-sm font-medium text-card-foreground">{profile.company_name}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-0.5 font-medium uppercase tracking-wide">Department</div>
                            <div className="text-sm text-card-foreground">{profile.department}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-0.5 font-medium uppercase tracking-wide">Industry</div>
                            <div className="text-sm text-card-foreground">{profile.industry_type}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-0.5 font-medium uppercase tracking-wide">Address</div>
                            <div className="text-sm text-card-foreground">{profile.company_address}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Supervisor & Job Description */}
                    <div className="grid gap-4 md:grid-cols-2 mt-4 pt-4 border-t border-border">
                      <div>
                        <h4 className="text-base font-semibold text-card-foreground mb-3">Supervisor</h4>
                        <div className="space-y-2">
                          <div>
                            <div className="text-xs text-muted-foreground mb-0.5 font-medium uppercase tracking-wide">Name</div>
                            <div className="text-sm font-medium text-card-foreground">{profile.supervisor_name}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-0.5 font-medium uppercase tracking-wide">Title</div>
                            <div className="text-sm text-card-foreground">{profile.supervisor_title}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-base font-semibold text-card-foreground mb-3">Job Description</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {profile.company_description}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </>
          )}

          {/* Weekly Logs */}
          <div className="weekly-logs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h2 className="text-lg font-semibold text-card-foreground">Weekly Logs</h2>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button className="flex items-center justify-center space-x-2 px-4 py-2 text-sm text-orange-600 bg-orange-50 rounded-full border border-orange-200 hover:bg-orange-100 transition-colors font-medium">
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
                  className="flex items-center justify-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors text-sm font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Add Week</span>
                </motion.button>
              </div>
            </div>

            {/* Week Tabs */}
            <div className="mb-5">
              <div className="flex space-x-2 overflow-x-auto pb-2">
                {weeklyLogs.length > 0 ? (
                  weeklyLogs.map((log) => (
                    <button
                      key={log.week_number}
                      onClick={() => setActiveWeek(log.week_number)}
                      className={`px-5 py-2.5 text-sm font-semibold rounded-full whitespace-nowrap transition-colors min-w-fit ${
                        activeWeek === log.week_number
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                    >
                      Week {log.week_number}
                    </button>
                  ))
                ) : (
                  <div className="text-muted-foreground text-base py-2 px-2">
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
                        <p className="text-muted-foreground mb-6 text-lg">No log found for Week {activeWeek}</p>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleAddWeek}
                          className="inline-flex items-center space-x-2 px-6 py-3 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors text-sm font-semibold"
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
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-foreground">
                          Week {activeWeek}: {formatDate(currentLog.start_date)} — {formatDate(currentLog.end_date)}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleDeleteLog(currentLog)}
                            className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Delete this week"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </motion.button>
                        </div>
                      </div>

                      {/* Week Summary */}
                      <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                        {logContent.weekSummary}
                      </p>

                      {/* Daily Activities */}
                      <div className="mb-5">
                        <h4 className="text-base font-semibold text-foreground mb-3">Daily Activities</h4>

                        {/* Mobile-friendly cards for small screens */}
                        <div className="block sm:hidden space-y-3">
                          {logContent.dailyActivities?.map((activity: { day: string; date: string; activities: string }, index: number) => {
                            const isEditing = editingDay?.logId === currentLog.id && editingDay?.dayIndex === index;
                            
                            return (
                              <div key={index} className="border-l-4 border-primary pl-4">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="text-foreground font-semibold text-sm">{activity.day}</div>
                                  <div className="flex items-center space-x-2">
                                    <div className="text-muted-foreground text-xs font-medium">{activity.date}</div>
                                    {!isEditing && (
                                      <button
                                        onClick={() => handleEditDay(currentLog.id, index, activity.activities)}
                                        className="p-1 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors"
                                        title="Edit this day"
                                      >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                      </button>
                                    )}
                                  </div>
                                </div>
                                {isEditing ? (
                                  <div className="space-y-2">
                                    <textarea
                                      value={editingText}
                                      onChange={(e) => setEditingText(e.target.value)}
                                      className="w-full p-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground resize-none"
                                      rows={3}
                                      placeholder="Enter activities for this day..."
                                    />
                                    <div className="flex items-center space-x-2">
                                      <button
                                        onClick={handleSaveDay}
                                        disabled={isSavingDay}
                                        className="px-3 py-1 bg-primary text-primary-foreground rounded text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center space-x-1"
                                      >
                                        {isSavingDay ? (
                                          <>
                                            <div className="w-3 h-3 border border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                                            <span>Saving...</span>
                                          </>
                                        ) : (
                                          <span>Save</span>
                                        )}
                                      </button>
                                      <button
                                        onClick={handleCancelEditDay}
                                        disabled={isSavingDay}
                                        className="px-3 py-1 bg-muted text-muted-foreground rounded text-xs font-medium hover:bg-muted/80 transition-colors disabled:opacity-50"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-card-foreground text-sm leading-relaxed">
                                    {activity.activities}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Table for larger screens */}
                        <div className="hidden sm:block">
                          <div className="space-y-3">
                            {logContent.dailyActivities?.map((activity: { day: string; date: string; activities: string }, index: number) => {
                              const isEditing = editingDay?.logId === currentLog.id && editingDay?.dayIndex === index;
                              
                              return (
                                <div key={index} className="border-l-4 border-primary pl-5 py-1">
                                  <div className="flex items-center justify-between mb-1.5">
                                    <div className="text-foreground font-semibold text-sm">{activity.day}</div>
                                    <div className="flex items-center space-x-3">
                                      <div className="text-muted-foreground text-xs font-medium">{activity.date}</div>
                                      {!isEditing && (
                                        <button
                                          onClick={() => handleEditDay(currentLog.id, index, activity.activities)}
                                          className="p-1 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors"
                                          title="Edit this day"
                                        >
                                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                          </svg>
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                  {isEditing ? (
                                    <div className="space-y-2">
                                      <textarea
                                        value={editingText}
                                        onChange={(e) => setEditingText(e.target.value)}
                                        className="w-full p-3 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground resize-none"
                                        rows={4}
                                        placeholder="Enter activities for this day..."
                                      />
                                      <div className="flex items-center space-x-2">
                                        <button
                                          onClick={handleSaveDay}
                                          disabled={isSavingDay}
                                          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center space-x-2"
                                        >
                                          {isSavingDay ? (
                                            <>
                                              <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                                              <span>Saving...</span>
                                            </>
                                          ) : (
                                            <span>Save Changes</span>
                                          )}
                                        </button>
                                        <button
                                          onClick={handleCancelEditDay}
                                          disabled={isSavingDay}
                                          className="px-4 py-2 bg-muted text-muted-foreground rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors disabled:opacity-50"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-card-foreground text-sm leading-relaxed">
                                      {activity.activities}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Skills and Learning Outcomes */}
                      <div className="grid gap-4 md:grid-cols-2 mb-4">
                        <div>
                          <h4 className="text-base font-semibold text-foreground mb-2">Skills Developed</h4>
                          <ul className="text-card-foreground text-sm space-y-1.5">
                            {logContent.skillsDeveloped?.map((skill: string, index: number) => (
                              <li key={index} className="flex items-start">
                                <span className="text-primary mr-2 mt-0.5 font-bold">•</span>
                                <span className="leading-relaxed">{skill}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h4 className="text-base font-semibold text-foreground mb-2">Learning Outcomes</h4>
                          <p className="text-card-foreground text-sm leading-relaxed">
                            {logContent.learningOutcomes}
                          </p>
                        </div>
                      </div>

                      {/* Challenges Faced */}
                      {logContent.challengesFaced && (
                        <div className="pt-3 border-t border-border">
                          <h4 className="text-base font-semibold text-foreground mb-3">Challenges Faced</h4>
                          <p className="text-card-foreground text-sm leading-relaxed">
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

        {/* Notification Toast */}
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 px-6 py-4 rounded-full shadow-lg border max-w-md mx-4 ${
              notification.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200'
                : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200'
            }`}
          >
            <div className="flex items-center space-x-3">
              {notification.type === 'success' ? (
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              <span className="text-sm font-medium">{notification.message}</span>
            </div>
          </motion.div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-card-foreground">Delete Week {logToDelete?.week_number}</h3>
                  <p className="text-sm text-muted-foreground">This action cannot be undone</p>
                </div>
              </div>
              
              <p className="text-card-foreground mb-6">
                Are you sure you want to delete Week {logToDelete?.week_number}? All your logged activities and data for this week will be permanently removed.
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={cancelDeleteLog}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 border border-border rounded-lg text-card-foreground hover:bg-muted transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteLog}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <span>Delete Week</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
