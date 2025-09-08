interface WeeklyLogContent {
  weekSummary: string;
  dailyActivities: Array<{
    day: string;
    date: string;
    activities: string;
  }>;
  skillsDeveloped: string[];
  learningOutcomes: string;
  challengesFaced?: string;
}

type DailyActivity = {
  day: string;
  date: string;
  activities: string;
};

interface WeeklyLogData {
  id: string;
  week_number: number;
  start_date: string;
  end_date: string;
  content: string | WeeklyLogContent;
  created_at: string;
}

interface UserProfile {
  full_name: string;
  course: string;
  institution: string;
  company_name: string;
  department: string;
}

export function generateWeeklySummaryEmail(
  userProfile: UserProfile,
  weeklyLog: WeeklyLogData,
  _weekEndDate: Date
): { html: string; text: string; subject: string } {
  const logContent = typeof weeklyLog.content === 'string' 
    ? JSON.parse(weeklyLog.content) 
    : weeklyLog.content;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const subject = `SIWES Week ${weeklyLog.week_number} Summary - ${userProfile.full_name}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #3b82f6;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #3b82f6;
            margin-bottom: 10px;
        }
        .week-title {
            font-size: 20px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 5px;
        }
        .date-range {
            color: #6b7280;
            font-size: 14px;
        }
        .section {
            margin-bottom: 25px;
        }
        .section-title {
            font-size: 16px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 10px;
            padding-bottom: 5px;
            border-bottom: 2px solid #e5e7eb;
        }
        .daily-activity {
            background: #f9fafb;
            border-left: 4px solid #3b82f6;
            padding: 15px;
            margin-bottom: 10px;
            border-radius: 6px;
        }
        .day-header {
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 5px;
        }
        .day-date {
            color: #6b7280;
            font-size: 12px;
            margin-bottom: 8px;
        }
        .activity-text {
            color: #374151;
            font-size: 14px;
        }
        .skills-list {
            list-style: none;
            padding: 0;
        }
        .skills-list li {
            background: #dbeafe;
            color: #1e40af;
            padding: 8px 12px;
            margin: 5px 0;
            border-radius: 6px;
            font-size: 14px;
        }
        .skills-list li::before {
            content: "✓ ";
            font-weight: bold;
            margin-right: 8px;
        }
        .learning-outcomes {
            background: #f0f9ff;
            border: 1px solid #bae6fd;
            padding: 15px;
            border-radius: 8px;
            color: #0c4a6e;
        }
        .challenges {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            padding: 15px;
            border-radius: 8px;
            color: #92400e;
        }
        .student-info {
            background: #f3f4f6;
            padding: 15px;
            border-radius: 8px;
            font-size: 13px;
            color: #4b5563;
            margin-top: 20px;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 12px;
        }
        .btn {
            display: inline-block;
            background: #3b82f6;
            color: white !important;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            margin: 10px 0;
        }
        @media (max-width: 600px) {
            body {
                padding: 10px;
            }
            .container {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">📋 SwiftLog</div>
            <div class="week-title">Week ${weeklyLog.week_number} Training Summary</div>
            <div class="date-range">${formatDate(weeklyLog.start_date)} - ${formatDate(weeklyLog.end_date)}</div>
        </div>

        <div class="section">
            <div class="section-title">📝 Week Summary</div>
            <p>${logContent.weekSummary}</p>
        </div>

        <div class="section">
            <div class="section-title">📅 Daily Activities</div>
            ${logContent.dailyActivities?.map((activity: DailyActivity) => `
                <div class="daily-activity">
                    <div class="day-header">${activity.day}</div>
                    <div class="day-date">${activity.date}</div>
                    <div class="activity-text">${activity.activities}</div>
                </div>
            `).join('') || '<p>No daily activities recorded.</p>'}
        </div>

        ${logContent.skillsDeveloped && logContent.skillsDeveloped.length > 0 ? `
        <div class="section">
            <div class="section-title">🎯 Skills Developed</div>
            <ul class="skills-list">
                ${logContent.skillsDeveloped.map((skill: string) => `<li>${skill}</li>`).join('')}
            </ul>
        </div>
        ` : ''}

        ${logContent.learningOutcomes ? `
        <div class="section">
            <div class="section-title">💡 Learning Outcomes</div>
            <div class="learning-outcomes">
                ${logContent.learningOutcomes}
            </div>
        </div>
        ` : ''}

        ${logContent.challengesFaced ? `
        <div class="section">
            <div class="section-title">⚠️ Challenges Faced</div>
            <div class="challenges">
                ${logContent.challengesFaced}
            </div>
        </div>
        ` : ''}

        <div class="student-info">
            <strong>Student:</strong> ${userProfile.full_name}<br>
            <strong>Course:</strong> ${userProfile.course}<br>
            <strong>Institution:</strong> ${userProfile.institution}<br>
            <strong>Company:</strong> ${userProfile.company_name} - ${userProfile.department}
        </div>

        <div style="text-align: center; margin: 30px 0;">
            <a href="https://swiftlog-beta.vercel.app/dashboard" class="btn">View Full Dashboard</a>
        </div>

        <div class="footer">
            <p>This email was automatically generated by SwiftLog - AI-Powered SIWES Log Generation</p>
            <p>Generated on ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
    </div>
</body>
</html>
  `;

  const text = `
SIWES WEEK ${weeklyLog.week_number} SUMMARY
${userProfile.full_name}
${formatDate(weeklyLog.start_date)} - ${formatDate(weeklyLog.end_date)}

WEEK SUMMARY:
${logContent.weekSummary}

DAILY ACTIVITIES:
${logContent.dailyActivities?.map((activity: DailyActivity) => 
  `${activity.day} (${activity.date}): ${activity.activities}`
).join('\n\n') || 'No daily activities recorded.'}

${logContent.skillsDeveloped && logContent.skillsDeveloped.length > 0 ? `
SKILLS DEVELOPED:
${logContent.skillsDeveloped.map((skill: string) => `• ${skill}`).join('\n')}
` : ''}

${logContent.learningOutcomes ? `
LEARNING OUTCOMES:
${logContent.learningOutcomes}
` : ''}

${logContent.challengesFaced ? `
CHALLENGES FACED:
${logContent.challengesFaced}
` : ''}

STUDENT INFORMATION:
Name: ${userProfile.full_name}
Course: ${userProfile.course}
Institution: ${userProfile.institution}
Company: ${userProfile.company_name} - ${userProfile.department}

---
This email was automatically generated by SwiftLog
View your dashboard: https://swiftlog-beta.vercel.app/dashboard
Generated on ${new Date().toLocaleDateString()}
  `;

  return { html, text, subject };
}

export function generateWeeklyReminderEmail(userProfile: UserProfile, weekNumber: number): { html: string; text: string; subject: string } {
  const subject = `📝 SIWES Week ${weekNumber} - Time to Log Your Activities`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            text-align: center;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #3b82f6;
            margin-bottom: 20px;
        }
        .title {
            font-size: 20px;
            color: #1f2937;
            margin-bottom: 20px;
        }
        .message {
            font-size: 16px;
            color: #4b5563;
            margin-bottom: 30px;
        }
        .btn {
            display: inline-block;
            background: #3b82f6;
            color: white !important;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            font-size: 16px;
            margin: 10px 0;
        }
        .tips {
            background: #f0f9ff;
            border: 1px solid #bae6fd;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: left;
        }
        .tips h3 {
            color: #0c4a6e;
            margin-top: 0;
        }
        .tips ul {
            color: #0c4a6e;
        }
        .footer {
            color: #6b7280;
            font-size: 12px;
            margin-top: 30px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">📋 SwiftLog</div>
        <div class="title">Hi ${userProfile.full_name}!</div>
        <div class="message">
            It's time to log your activities for <strong>Week ${weekNumber}</strong> of your SIWES training.
            Don't let valuable learning experiences slip away - document them now!
        </div>
        
        <a href="https://swiftlog-beta.vercel.app/create-log" class="btn">Create Week ${weekNumber} Log</a>
        
        <div class="tips">
            <h3>💡 Quick Logging Tips:</h3>
            <ul>
                <li>Use voice input to quickly describe your week</li>
                <li>Include specific technical skills and tools used</li>
                <li>Mention any challenges and how you solved them</li>
                <li>Note feedback from supervisors or colleagues</li>
                <li>Don't forget to highlight your contributions!</li>
            </ul>
        </div>
        
        <div class="footer">
            <p>This is an automated reminder from SwiftLog</p>
            <p>If you've already created this week's log, you can ignore this email.</p>
        </div>
    </div>
</body>
</html>
  `;

  const text = `
Hi ${userProfile.full_name}!

It's time to log your activities for Week ${weekNumber} of your SIWES training.
Don't let valuable learning experiences slip away - document them now!

Create your log: https://swiftlog-beta.vercel.app/create-log

QUICK LOGGING TIPS:
• Use voice input to quickly describe your week
• Include specific technical skills and tools used
• Mention any challenges and how you solved them
• Note feedback from supervisors or colleagues
• Don't forget to highlight your contributions!

---
This is an automated reminder from SwiftLog
If you've already created this week's log, you can ignore this email.
  `;

  return { html, text, subject };
}
