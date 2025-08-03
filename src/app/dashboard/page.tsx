'use client';

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useEffect, useState, useRef } from "react";
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
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    // Redirect to onboarding if not completed
    if (!isLoading && isAuthenticated && user && !user.hasCompletedOnboarding) {
      router.push('/onboarding');
      return;
    }

    // Load user data
    if (isAuthenticated && user) {
      loadUserData();
    }
  }, [isAuthenticated, isLoading, user, router]);

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

  const loadUserData = async () => {
    try {
      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Load weekly logs
      const { data: logsData, error: logsError } = await supabase
        .from('weekly_logs')
        .select('*')
        .eq('user_id', user?.id)
        .order('week_number', { ascending: true });

      if (logsError) throw logsError;
      setWeeklyLogs(logsData || []);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setProfileLoading(false);
    }
  };

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

  const calculateDuration = () => {
    if (profile?.start_date && profile?.end_date) {
      const start = new Date(profile.start_date);
      const end = new Date(profile.end_date);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
      return `${diffWeeks} weeks`;
    }
    return '';
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
    console.log('Navigate to edit profile');
  };

  if (isLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Image
            src="/LOGOS/SwiftLog.svg"
            alt="SwiftLog Logo"
            width={64}
            height={64}
            className="w-16 h-16 mx-auto mb-4 animate-pulse"
          />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user || !profile) {
    return null;
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
                  {user?.user_metadata?.avatar_url ? (
                    <Image
                      src={user.user_metadata.avatar_url}
                      alt="Profile"
                      width={32}
                      height={32}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                      {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                    </div>
                  )}
                </button>

                {/* Mobile: Menu toggle */}
                <button
                  onClick={toggleMobileMenu}
                  className="md:hidden w-8 h-8 rounded-full overflow-hidden hover:scale-105 transition-transform border-2 border-white/50"
                  title="Menu"
                >
                  {user?.user_metadata?.avatar_url ? (
                    <Image
                      src={user.user_metadata.avatar_url}
                      alt="Profile"
                      width={32}
                      height={32}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
                      {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
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
        <main className="pt-24 md:pt-32 px-4 py-6 max-w-4xl mx-auto">
          {/* Profile Header */}
          <div className="mb-6">
            <div className="mb-4">
              <h1 className="text-2xl font-bold text-gray-900">SIWES Logbook</h1>
              <p className="text-gray-600">{profile.full_name} • {profile.course}</p>
            </div>
          </div>

          {/* Training Information */}
          <div className="bg-white rounded-lg border border-gray-200 mb-6">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Training Information</h2>
                <span className="text-sm text-gray-500">
                  {profile.start_date && profile.end_date &&
                    `${formatDate(profile.start_date)} — ${formatDate(profile.end_date)}`
                  }
                </span>
              </div>
            </div>

            <div className="p-6">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Student Details */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-gray-900">Student Details</h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Name</div>
                      <div className="font-medium text-gray-900">{profile.full_name}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Course</div>
                      <div className="text-gray-900">{profile.course}</div>
                    </div>
                  </div>
                </div>

                {/* Company Details */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-gray-900">Company Details</h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Company</div>
                      <div className="font-medium text-gray-900">{profile.company_name}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Department</div>
                      <div className="text-gray-900">{profile.department}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Company Description */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3">Company Description</h4>
                <p className="text-gray-600 leading-relaxed">
                  {profile.company_description}
                </p>
              </div>
            </div>
          </div>

          {/* Weekly Logs */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Weekly Logs</h2>
                <div className="flex items-center space-x-3">
                  <button className="flex items-center space-x-2 px-3 py-1.5 text-sm text-orange-600 bg-orange-50 rounded-lg border border-orange-200 hover:bg-orange-100 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Download PDF</span>
                    <span className="bg-orange-200 text-orange-800 text-xs px-1.5 py-0.5 rounded">NEW</span>
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAddWeek}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>Add Week</span>
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Week Tabs */}
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex space-x-1 overflow-x-auto">
                {[1, 2, 3].map((week) => (
                  <button
                    key={week}
                    onClick={() => setActiveWeek(week)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                      activeWeek === week
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    Week {week}
                  </button>
                ))}
              </div>
            </div>

            {/* Week Content */}
            <div className="p-4">
              {weeklyLogs.length > 0 ? (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Week {activeWeek}: {formatDate('2025-06-30')} — {formatDate('2025-07-04')}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">
                    Continued building and implementing the student portal, this time I focused on the course registration module, using mock data to test the retrieval of courses from the database, allowing students to register and then display a summary of the registered courses. I also implemented a feature that allows the ICT admin reset and generate passwords for the Faculty admins. I aided in the building and deployment of the admissions portal to allow candidates apply easily into the school I assisted a few students prepare for an online external exams by setting up their browsers and ensuring network was setup properly, set up their cameras for zoom and also supervised them incase of any assistance I went on an external supervision to observe and aid in the presentation of some nursing students sent on clinical postings
                  </p>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 text-gray-600 font-medium">Day & Date</th>
                          <th className="text-left py-2 text-gray-600 font-medium">Description of Work Done</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        <tr>
                          <td className="py-3 text-blue-600 font-medium">
                            Monday<br />
                            <span className="text-gray-500 text-xs">30/06/2025</span>
                          </td>
                          <td className="py-3 text-gray-700">
                            I continued building the course registration module for the student portal, focusing on retrieving course data from the database using mock data.
                          </td>
                        </tr>
                        <tr>
                          <td className="py-3 text-blue-600 font-medium">
                            Tuesday<br />
                            <span className="text-gray-500 text-xs">01/07/2025</span>
                          </td>
                          <td className="py-3 text-gray-700">
                            I worked on enabling student course registration within the portal and implemented a summary display of registered courses.
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No logs yet</h3>
                  <p className="text-gray-600 mb-4">Start by creating your first weekly log entry.</p>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAddWeek}
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
