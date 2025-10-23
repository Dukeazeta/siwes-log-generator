"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import InstitutionAutocomplete from "../../components/InstitutionAutocomplete";
import Logo from "../../components/Logo";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";

interface OnboardingData {
  // Student Details
  fullName: string;
  course: string;
  institution: string;
  level: string;

  // Company Details
  companyName: string;
  department: string;
  companyAddress: string;
  industryType: string;
  jobDescription: string;

  // Training Period
  startDate: string;
  endDate: string;
  supervisorName: string;
  supervisorTitle: string;
}

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { user, isAuthenticated, refreshProfile } = useAuth();
  const router = useRouter();
  const hasRedirectedRef = useRef(false);

  const [formData, setFormData] = useState<OnboardingData>({
    fullName: user?.fullName || `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "",
    course: "",
    institution: "",
    level: "",
    companyName: "",
    department: "",
    companyAddress: "",
    industryType: "",
    jobDescription: "",
    startDate: "",
    endDate: "",
    supervisorName: "",
    supervisorTitle: "",
  });

  useEffect(() => {
    if (!isAuthenticated && !hasRedirectedRef.current) {
      hasRedirectedRef.current = true;
      router.push("/login");
    } else if (user?.hasCompletedOnboarding && !hasRedirectedRef.current) {
      // If user has already completed onboarding, redirect to dashboard
      hasRedirectedRef.current = true;
      router.push("/dashboard");
    }
  }, [isAuthenticated, user?.hasCompletedOnboarding, router]);

  const handleInputChange = (field: keyof OnboardingData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError("");

    try {
      // Map camelCase form data to snake_case database columns
      const profileData = {
        user_id: user?.id,
        full_name: formData.fullName,
        course: formData.course,
        institution: formData.institution,
        level: formData.level,
        company_name: formData.companyName,
        department: formData.department,
        company_address: formData.companyAddress,
        industry_type: formData.industryType,
        company_description: formData.jobDescription,
        start_date: formData.startDate,
        end_date: formData.endDate,
        supervisor_name: formData.supervisorName,
        supervisor_title: formData.supervisorTitle,
        completed_onboarding: true,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("user_profiles").upsert(profileData);

      if (error) throw error;

      // Refresh user data to update onboarding status
      await refreshProfile();

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (error) {
      console.error("Profile save error:", error);
      setError(error instanceof Error ? error.message : "Failed to save profile");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateDuration = () => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
      return `${diffWeeks} weeks`;
    }
    return "";
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      {/* Header */}
      <header className="border-b border-border bg-background transition-colors duration-300">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link href="/" className="flex items-center justify-center">
            <Logo width={40} height={40} className="w-10 h-10" />
          </Link>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-foreground">Complete Your Profile</h1>
            <span className="text-sm text-muted-foreground">Step {currentStep} of 3</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 3) * 100}%` }}
            ></div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-error-muted border border-error-muted rounded-lg">
            <p className="text-error-muted-foreground text-sm">{error}</p>
          </div>
        )}

        {/* Step 1: Student Details */}
        {currentStep === 1 && (
          <div className="bg-card border border-border rounded-xl p-8 transition-colors duration-300">
            <h2 className="text-xl font-semibold text-card-foreground mb-6">Student Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange("fullName", e.target.value)}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-card-foreground placeholder-muted-foreground bg-card transition-colors"
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-2">
                  Course/Program
                </label>
                <input
                  type="text"
                  value={formData.course}
                  onChange={(e) => handleInputChange("course", e.target.value)}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-card-foreground placeholder-muted-foreground bg-card transition-colors"
                  placeholder="e.g., Computer Science, Accounting, Engineering, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Institution</label>
                <InstitutionAutocomplete
                  value={formData.institution}
                  onChange={(value) => handleInputChange("institution", value)}
                  placeholder="Search for your university/polytechnic..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-2">
                  Level/Year
                </label>
                <select
                  value={formData.level}
                  onChange={(e) => handleInputChange("level", e.target.value)}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-card-foreground bg-card transition-colors"
                >
                  <option value="">Select your level</option>
                  <option value="ND1">ND1</option>
                  <option value="ND2">ND2</option>
                  <option value="HND1">HND1</option>
                  <option value="HND2">HND2</option>
                  <option value="100L">100 Level</option>
                  <option value="200L">200 Level</option>
                  <option value="300L">300 Level</option>
                  <option value="400L">400 Level</option>
                  <option value="500L">500 Level</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Company Details */}
        {currentStep === 2 && (
          <div className="bg-card border border-border rounded-xl p-8 transition-colors duration-300">
            <h2 className="text-xl font-semibold text-card-foreground mb-6">Company Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange("companyName", e.target.value)}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-card-foreground placeholder-muted-foreground bg-card transition-colors"
                  placeholder="Name of your IT placement company"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-2">
                  Department/Unit
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => handleInputChange("department", e.target.value)}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-card-foreground bg-card transition-colors"
                >
                  <option value="">Select department</option>
                  {/* Technology & IT Departments */}
                  <option value="Software Engineering">Software Engineering</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Network Administration">Network Administration</option>
                  <option value="Cybersecurity">Cybersecurity</option>
                  <option value="Data Science">Data Science</option>
                  <option value="Web Development">Web Development</option>
                  <option value="Mobile Development">Mobile Development</option>
                  <option value="DevOps">DevOps</option>
                  <option value="Quality Assurance">Quality Assurance</option>
                  <option value="Database Administration">Database Administration</option>
                  <option value="System Administration">System Administration</option>
                  <option value="Technical Support">Technical Support</option>
                  <option value="UI/UX Design">UI/UX Design</option>
                  {/* Business & Finance Departments */}
                  <option value="Accounting">Accounting</option>
                  <option value="Finance">Finance</option>
                  <option value="Auditing">Auditing</option>
                  <option value="Tax & Revenue">Tax & Revenue</option>
                  <option value="Budget & Planning">Budget & Planning</option>
                  <option value="Investment Banking">Investment Banking</option>
                  <option value="Risk Management">Risk Management</option>
                  <option value="Credit Analysis">Credit Analysis</option>
                  {/* Engineering Departments */}
                  <option value="Civil Engineering">Civil Engineering</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Electrical Engineering">Electrical Engineering</option>
                  <option value="Chemical Engineering">Chemical Engineering</option>
                  <option value="Petroleum Engineering">Petroleum Engineering</option>
                  <option value="Environmental Engineering">Environmental Engineering</option>
                  <option value="Structural Engineering">Structural Engineering</option>
                  <option value="Project Engineering">Project Engineering</option>
                  {/* Management & Administration */}
                  <option value="Human Resources">Human Resources</option>
                  <option value="Project Management">Project Management</option>
                  <option value="Product Management">Product Management</option>
                  <option value="Business Analysis">Business Analysis</option>
                  <option value="Operations">Operations</option>
                  <option value="Administration">Administration</option>
                  <option value="Executive Office">Executive Office</option>
                  <option value="Strategy & Planning">Strategy & Planning</option>
                  {/* Sales & Marketing */}
                  <option value="Marketing">Marketing</option>
                  <option value="Digital Marketing">Digital Marketing</option>
                  <option value="Sales">Sales</option>
                  <option value="Business Development">Business Development</option>
                  <option value="Customer Service">Customer Service</option>
                  <option value="Public Relations">Public Relations</option>
                  {/* Healthcare & Science */}
                  <option value="Medical Services">Medical Services</option>
                  <option value="Laboratory Services">Laboratory Services</option>
                  <option value="Pharmacy">Pharmacy</option>
                  <option value="Health Information Management">
                    Health Information Management
                  </option>
                  <option value="Research & Development">Research & Development</option>
                  <option value="Quality Control">Quality Control</option>
                  {/* Legal & Compliance */}
                  <option value="Legal Services">Legal Services</option>
                  <option value="Compliance">Compliance</option>
                  <option value="Regulatory Affairs">Regulatory Affairs</option>
                  {/* Education & Training */}
                  <option value="Academic Affairs">Academic Affairs</option>
                  <option value="Student Affairs">Student Affairs</option>
                  <option value="Training & Development">Training & Development</option>
                  <option value="Curriculum Development">Curriculum Development</option>
                  {/* Media & Communications */}
                  <option value="Media & Communications">Media & Communications</option>
                  <option value="Broadcasting">Broadcasting</option>
                  <option value="Journalism">Journalism</option>
                  <option value="Content Creation">Content Creation</option>
                  {/* Agriculture & Environment */}
                  <option value="Agricultural Services">Agricultural Services</option>
                  <option value="Environmental Services">Environmental Services</option>
                  <option value="Forestry">Forestry</option>
                  <option value="Animal Husbandry">Animal Husbandry</option>
                  {/* Architecture & Planning */}
                  <option value="Architecture">Architecture</option>
                  <option value="Urban Planning">Urban Planning</option>
                  <option value="Interior Design">Interior Design</option>
                  <option value="Construction Management">Construction Management</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-card-foreground mb-2">
                  Company Address
                </label>
                <textarea
                  value={formData.companyAddress}
                  onChange={(e) => handleInputChange("companyAddress", e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-card-foreground placeholder-muted-foreground bg-card transition-colors"
                  placeholder="Full address of the company"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-2">
                  Industry Type
                </label>
                <select
                  value={formData.industryType}
                  onChange={(e) => handleInputChange("industryType", e.target.value)}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-card-foreground bg-card transition-colors"
                >
                  <option value="">Select industry type</option>
                  <option value="Technology">Technology</option>
                  <option value="Banking/Finance">Banking/Finance</option>
                  <option value="Telecommunications">Telecommunications</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Education">Education</option>
                  <option value="Government">Government</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Consulting">Consulting</option>
                  <option value="Oil & Gas">Oil & Gas</option>
                  <option value="Engineering & Construction">Engineering & Construction</option>
                  <option value="Agriculture">Agriculture</option>
                  <option value="Real Estate">Real Estate</option>
                  <option value="Media & Entertainment">Media & Entertainment</option>
                  <option value="Transportation & Logistics">Transportation & Logistics</option>
                  <option value="Hospitality & Tourism">Hospitality & Tourism</option>
                  <option value="Retail & Consumer Goods">Retail & Consumer Goods</option>
                  <option value="Legal Services">Legal Services</option>
                  <option value="Non-Profit Organization">Non-Profit Organization</option>
                  <option value="Insurance">Insurance</option>
                  <option value="Pharmaceutical">Pharmaceutical</option>
                  <option value="Aviation">Aviation</option>
                  <option value="Maritime">Maritime</option>
                  <option value="Mining">Mining</option>
                  <option value="Food & Beverage">Food & Beverage</option>
                  <option value="Textile & Fashion">Textile & Fashion</option>
                  <option value="Architecture & Design">Architecture & Design</option>
                  <option value="Environmental Services">Environmental Services</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-card-foreground mb-2">
                  Job Description
                </label>
                <textarea
                  value={formData.jobDescription}
                  onChange={(e) => handleInputChange("jobDescription", e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-card-foreground placeholder-muted-foreground bg-card transition-colors"
                  placeholder="Describe your role, responsibilities, and what you'll be doing during your IT training"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Training Period */}
        {currentStep === 3 && (
          <div className="bg-card border border-border rounded-xl p-8 transition-colors duration-300">
            <h2 className="text-xl font-semibold text-card-foreground mb-6">
              Training Period & Supervision
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange("startDate", e.target.value)}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-card-foreground bg-card transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange("endDate", e.target.value)}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-card-foreground bg-card transition-colors"
                />
              </div>
              {calculateDuration() && (
                <div className="md:col-span-2">
                  <div className="bg-muted border border-border rounded-lg p-4 transition-colors">
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Training Duration:</span> {calculateDuration()}
                    </p>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-2">
                  Supervisor Name
                </label>
                <input
                  type="text"
                  value={formData.supervisorName}
                  onChange={(e) => handleInputChange("supervisorName", e.target.value)}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-card-foreground placeholder-muted-foreground bg-card transition-colors"
                  placeholder="Name of your IT supervisor"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-card-foreground mb-2">
                  Supervisor Title
                </label>
                <input
                  type="text"
                  value={formData.supervisorTitle}
                  onChange={(e) => handleInputChange("supervisorTitle", e.target.value)}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-card-foreground placeholder-muted-foreground bg-card transition-colors"
                  placeholder="e.g., IT Manager, Senior Developer"
                />
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className="px-6 py-3 border border-border text-muted-foreground rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>

          {currentStep < 3 ? (
            <button
              onClick={nextStep}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {isLoading ? "Saving..." : "Complete Setup"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
