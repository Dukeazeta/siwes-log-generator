"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Camera, Copy, Save, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DateRangeSelector from "../../components/DateRangeSelector";
import Logo from "../../components/Logo";
import CameraCapture from "../../components/ocr/CameraCapture";
import PageTransition from "../../components/PageTransition";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";

// UserProfile interface defined but not currently used in this component
// interface UserProfile {
//   full_name: string;
//   course: string;
//   institution: string;
//   level: string;
//   company_name: string;
//   department: string;
//   company_address: string;
//   industry_type: string;
//   company_description: string;
//   start_date: string;
//   end_date: string;
//   supervisor_name: string;
//   supervisor_title: string;
// }

interface DayInput {
  day: string;
  date: string;
  activities: string;
}

interface OCRActivities {
  monday?: string;
  tuesday?: string;
  wednesday?: string;
  thursday?: string;
  friday?: string;
  saturday?: string;
  sunday?: string;
}

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function ManualLog() {
  const router = useRouter();
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [weekNumber, setWeekNumber] = useState(1);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [error, setError] = useState("");
  const [existingWeeks, setExistingWeeks] = useState<number[]>([]);
  const [showCamera, setShowCamera] = useState(false);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [ocrWarnings, setOCRWarnings] = useState<string[]>([]);
  const [ocrPreview, setOCRPreview] = useState<{
    activities: OCRActivities;
    fullText?: string;
  } | null>(null);
  const [showOCRPreview, setShowOCRPreview] = useState(false);
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
          date: currentDate.toISOString().split("T")[0],
          activities: "",
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
            .from("weekly_logs")
            .select("week_number")
            .eq("user_id", user.id)
            .order("week_number", { ascending: true });

          if (error && error.code !== "PGRST116") {
            console.error("Error loading existing weeks:", error);
            return;
          }

          const weeks = data?.map((log) => log.week_number) || [];
          setExistingWeeks(weeks);

          // Auto-set to next available week
          if (weeks.length > 0) {
            const nextWeek = Math.max(...weeks) + 1;
            if (nextWeek <= 24) {
              setWeekNumber(nextWeek);
            }
          }
        } catch (error) {
          console.error("Error loading existing weeks:", error);
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
          const { error } = await supabase
            .from("user_profiles")
            .select("*")
            .eq("user_id", user.id)
            .single();

          if (error) throw error;
        } catch (error) {
          console.error("Error loading profile:", error);
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
    setCharacterCounts((prev) => ({
      ...prev,
      [index]: value.length,
    }));
  };

  const validateForm = () => {
    if (!startDate || !endDate) {
      setError("Please select a date range for this week");
      return false;
    }

    if (existingWeeks.includes(weekNumber)) {
      setError(`Week ${weekNumber} already exists. Please choose a different week number.`);
      return false;
    }

    // Check if at least 3 days have content
    const daysWithContent = dailyInputs.filter((input) => input.activities.trim().length > 0);
    if (daysWithContent.length < 3) {
      setError("Please provide activities for at least 3 days of the week");
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
    setError("");

    try {
      // Create the log structure matching AI-generated format
      const logContent = {
        weekSummary: `Week ${weekNumber} activities from ${dailyInputs[0].date} to ${dailyInputs[6].date}`,
        dailyActivities: dailyInputs.map((input) => ({
          day: input.day,
          date: input.date,
          activities: input.activities,
        })),
        skillsDeveloped: [], // Empty for manual logs - can be enhanced later
        learningOutcomes: "", // Empty for manual logs - can be enhanced later
        challengesFaced: "", // Empty for manual logs - can be enhanced later
      };

      console.log("Saving manual log for user:", user?.id, "week:", weekNumber);
      const { data: insertData, error: saveError } = await supabase
        .from("weekly_logs")
        .insert({
          user_id: user?.id,
          week_number: weekNumber,
          start_date: startDate,
          end_date: endDate,
          content: JSON.stringify(logContent),
          raw_activities: dailyInputs
            .map((input) => `${input.day}: ${input.activities}`)
            .join("\n\n"),
        })
        .select();

      if (saveError) {
        console.error("Error saving manual log:", saveError);
        throw saveError;
      }

      console.log("Manual log saved successfully:", insertData);
      router.push("/dashboard?created=true");
    } catch (error) {
      console.error("Error saving manual log:", error);
      setError(error instanceof Error ? error.message : "Failed to save manual log");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.push("/dashboard");
  };

  const clearAllInputs = () => {
    const clearedInputs = dailyInputs.map((input) => ({
      ...input,
      activities: "",
    }));
    setDailyInputs(clearedInputs);
    setCharacterCounts({});
  };

  const handleOCRCapture = async (imageFile: File) => {
    setIsProcessingOCR(true);
    setError("");
    setOCRWarnings([]);

    try {
      // Prepare form data for API
      const formData = new FormData();
      formData.append("image", imageFile);
      formData.append("weekNumber", weekNumber.toString());
      formData.append("useAI", "true"); // Enable AI processing

      // Call AI-enhanced OCR API
      const response = await fetch("/api/ocr/process-with-ai", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "OCR processing failed");
      }

      if (!result.success) {
        throw new Error(result.error || "Failed to extract text from image");
      }

      // Process the extracted activities
      const { activities, warnings, fullText } = result;

      if (warnings && warnings.length > 0) {
        setOCRWarnings(warnings);
      }

      // Store OCR results for preview
      setOCRPreview({ activities, fullText });

      // Close the camera modal
      setShowCamera(false);

      // Show preview modal
      setShowOCRPreview(true);

      // Log success
      if (Object.keys(activities).length > 0) {
        const daysFound = Object.keys(activities).length;
        console.log(`OCR successful: Found activities for ${daysFound} days`);
      }
    } catch (error) {
      console.error("OCR processing error:", error);
      setError(error instanceof Error ? error.message : "Failed to process image");
      setShowCamera(false);
    } finally {
      setIsProcessingOCR(false);
    }
  };

  // Apply OCR results after preview confirmation
  const applyOCRResults = () => {
    if (!ocrPreview) return;

    const { activities } = ocrPreview;

    // Update daily inputs with extracted activities
    const updatedInputs = dailyInputs.map((input) => {
      const dayKey = input.day.toLowerCase() as keyof typeof activities;
      if (activities[dayKey]) {
        return {
          ...input,
          activities: activities[dayKey],
        };
      }
      return input;
    });

    setDailyInputs(updatedInputs);

    // Update character counts
    const newCounts: { [key: number]: number } = {};
    updatedInputs.forEach((input, index) => {
      newCounts[index] = input.activities.length;
    });
    setCharacterCounts(newCounts);

    // Close preview and clear data
    setShowOCRPreview(false);
    setOCRPreview(null);
  };

  const discardOCRResults = () => {
    setShowOCRPreview(false);
    setOCRPreview(null);
    setOCRWarnings([]);
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
              <Logo width={40} height={40} className="w-8 h-8 md:w-10 md:h-10" />
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
                  style={{ backgroundColor: "transparent !important" }}
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
                        Week {week} {isExisting ? "(Created)" : ""}
                      </option>
                    );
                  })}
                </select>
                {/* Custom dropdown arrow */}
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                  <svg
                    className="w-5 h-5 text-muted-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
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
                  <label className="text-sm font-semibold text-foreground">Daily Activities</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowCamera(true)}
                      disabled={!startDate || !endDate || isProcessingOCR}
                      className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title={
                        !startDate || !endDate
                          ? "Please select dates first"
                          : "Capture logbook page"
                      }
                    >
                      <Camera className="w-4 h-4" />
                      <span className="text-sm font-medium">Scan Page</span>
                    </button>
                    <button
                      onClick={clearAllInputs}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                {/* OCR Warnings */}
                {ocrWarnings.length > 0 && (
                  <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <svg
                        className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                      <div className="text-sm text-yellow-800 dark:text-yellow-200">
                        <p className="font-medium mb-1">OCR Processing Notes:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {ocrWarnings.map((warning, index) => (
                            <li key={index}>{warning}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

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
                              width: `${Math.min(((characterCounts[index] || 0) / 2000) * 100, 100)}%`,
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
                  <svg
                    className="w-5 h-5 text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
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
              <p className="mt-2 text-sm text-muted-foreground">
                Please wait while we save your log entry
              </p>
            </div>
          </div>
        )}

        {/* OCR Camera Modal */}
        {showCamera && (
          <CameraCapture
            onCapture={handleOCRCapture}
            onClose={() => setShowCamera(false)}
            isProcessing={isProcessingOCR}
          />
        )}

        {/* OCR Preview Modal */}
        {showOCRPreview && ocrPreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-background rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden my-8"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border">
                <h2 className="text-xl font-semibold text-foreground">Review Extracted Content</h2>
                <button
                  onClick={discardOCRResults}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 max-h-[60vh] overflow-y-auto">
                <div className="space-y-6">
                  {/* Extraction Summary */}
                  <div className="bg-muted/50 rounded-lg p-4">
                    <h3 className="font-medium text-sm text-foreground mb-2">
                      AI-Enhanced Extraction Summary
                    </h3>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>✓ Days found: {Object.keys(ocrPreview.activities).length} out of 5</p>
                      <p>✓ Total text extracted: {ocrPreview.fullText?.length || 0} characters</p>
                      <p>✓ AI processed: Text cleaned and organized by Gemini AI</p>
                    </div>
                  </div>

                  {/* Warnings if any */}
                  {ocrWarnings.length > 0 && (
                    <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                      <h3 className="font-medium text-sm text-yellow-800 dark:text-yellow-200 mb-2">
                        Notes:
                      </h3>
                      <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                        {ocrWarnings.map((warning, index) => (
                          <li key={index}>• {warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Extracted Activities Preview */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-foreground">Extracted Activities:</h3>

                    {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day) => {
                      const dayKey = day.toLowerCase() as keyof OCRActivities;
                      const content = ocrPreview.activities[dayKey];

                      return (
                        <div key={day} className="border border-border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-foreground">{day}</h4>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                {content ? `${content.length} chars` : "No content"}
                              </span>
                              {content && (
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(content);
                                    const button = event?.currentTarget as HTMLButtonElement;
                                    if (button) {
                                      const originalText = button.innerText;
                                      button.innerText = "Copied!";
                                      setTimeout(() => {
                                        button.innerText = originalText;
                                      }, 2000);
                                    }
                                  }}
                                  className="flex items-center gap-1 px-2 py-1 text-xs bg-muted hover:bg-muted/80 rounded transition-colors"
                                >
                                  <Copy className="w-3 h-3" />
                                  Copy
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="bg-background p-3 rounded border border-border">
                            {content ? (
                              <p className="text-sm text-foreground whitespace-pre-wrap">
                                {content}
                              </p>
                            ) : (
                              <p className="text-sm text-muted-foreground italic">
                                No activities detected for this day
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Debug Info - Collapsible */}
                  <details className="bg-muted/30 rounded-lg p-4">
                    <summary className="cursor-pointer font-medium text-sm text-muted-foreground hover:text-foreground">
                      Show Raw Extracted Text (Debug)
                    </summary>
                    <div className="mt-4 bg-background p-4 rounded border border-border">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          Raw OCR Output:
                        </span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(
                              ocrPreview.fullText || "No raw text available",
                            );
                            // Optional: Show a toast or temporary feedback
                            const button = event?.currentTarget as HTMLButtonElement;
                            if (button) {
                              const originalText = button.innerText;
                              button.innerText = "Copied!";
                              setTimeout(() => {
                                button.innerText = originalText;
                              }, 2000);
                            }
                          }}
                          className="flex items-center gap-1 px-2 py-1 text-xs bg-muted hover:bg-muted/80 rounded transition-colors"
                        >
                          <Copy className="w-3 h-3" />
                          Copy
                        </button>
                      </div>
                      <pre className="text-xs text-muted-foreground whitespace-pre-wrap overflow-x-auto">
                        {ocrPreview.fullText || "No raw text available"}
                      </pre>
                    </div>
                  </details>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-4 p-6 border-t border-border">
                <button
                  onClick={discardOCRResults}
                  className="px-6 py-3 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
                >
                  Discard
                </button>
                <button
                  onClick={applyOCRResults}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Apply to Form
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
