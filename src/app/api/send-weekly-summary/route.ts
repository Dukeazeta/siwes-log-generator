import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { supabase } from '../../../lib/supabase';
import { generateWeeklySummaryEmail, generateWeeklyReminderEmail } from '../../../lib/emailTemplates';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { userId, weekNumber, type = 'summary' } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Get user email from auth
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
    
    if (userError || !userData.user?.email) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 404 }
      );
    }

    if (type === 'reminder') {
      // Send weekly reminder email
      const emailContent = generateWeeklyReminderEmail(userProfile, weekNumber || 1);
      
      const { data, error } = await resend.emails.send({
        from: 'SwiftLog <noreply@swiftlog.app>', // Replace with your verified domain
        to: [userData.user.email],
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      });

      if (error) {
        console.error('Error sending reminder email:', error);
        return NextResponse.json(
          { error: 'Failed to send reminder email' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Weekly reminder sent to ${userData.user.email}`,
        emailId: data?.id
      });
    } else {
      // Send weekly summary email
      if (!weekNumber) {
        return NextResponse.json(
          { error: 'Week number is required for summary emails' },
          { status: 400 }
        );
      }

      // Get the weekly log
      const { data: weeklyLog, error: logError } = await supabase
        .from('weekly_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('week_number', weekNumber)
        .single();

      if (logError || !weeklyLog) {
        return NextResponse.json(
          { error: `Weekly log for week ${weekNumber} not found` },
          { status: 404 }
        );
      }

      const emailContent = generateWeeklySummaryEmail(
        userProfile,
        weeklyLog,
        new Date(weeklyLog.end_date)
      );

      const { data, error } = await resend.emails.send({
        from: 'SwiftLog <noreply@swiftlog.app>', // Replace with your verified domain
        to: [userData.user.email],
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      });

      if (error) {
        console.error('Error sending summary email:', error);
        return NextResponse.json(
          { error: 'Failed to send summary email' },
          { status: 500 }
        );
      }

      // Log the email sent in database (optional)
      try {
        await supabase
          .from('email_logs')
          .insert({
            user_id: userId,
            week_number: weekNumber,
            email_type: 'summary',
            recipient: userData.user.email,
            subject: emailContent.subject,
            sent_at: new Date().toISOString(),
            resend_id: data?.id
          });
      } catch (logError) {
        // Don't fail the request if logging fails
        console.warn('Failed to log email send:', logError);
      }

      return NextResponse.json({
        success: true,
        message: `Weekly summary for week ${weekNumber} sent to ${userData.user.email}`,
        emailId: data?.id
      });
    }
  } catch (error) {
    console.error('Error in send-weekly-summary API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to send summaries for all users (for scheduled tasks)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const authKey = searchParams.get('auth');
  const type = searchParams.get('type') || 'summary';
  const weekNumber = parseInt(searchParams.get('week') || '1');

  // Simple auth check - in production, use proper authentication
  if (authKey !== process.env.CRON_AUTH_KEY) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    if (type === 'reminder') {
      // Send reminders to all active users who haven't logged this week
      const { data: users, error: usersError } = await supabase
        .from('user_profiles')
        .select('user_id, full_name, course, institution, company_name, department');

      if (usersError) {
        throw usersError;
      }

      for (const userProfile of users) {
        try {
          // Check if user has already logged this week
          const { data: existingLog } = await supabase
            .from('weekly_logs')
            .select('id')
            .eq('user_id', userProfile.user_id)
            .eq('week_number', weekNumber)
            .single();

          // Only send reminder if no log exists for this week
          if (!existingLog) {
            // Get user email
            const { data: userData } = await supabase.auth.admin.getUserById(userProfile.user_id);
            
            if (userData.user?.email) {
              const emailContent = generateWeeklyReminderEmail(userProfile, weekNumber);
              
              await resend.emails.send({
                from: 'SwiftLog <noreply@swiftlog.app>',
                to: [userData.user.email],
                subject: emailContent.subject,
                html: emailContent.html,
                text: emailContent.text,
              });

              successCount++;
            }
          }
        } catch (error) {
          errorCount++;
          errors.push(`Failed to send reminder to user ${userProfile.user_id}: ${error}`);
        }
      }
    } else {
      // Send summaries for all completed logs from the previous week
      const lastWeek = weekNumber - 1;
      
      if (lastWeek < 1) {
        return NextResponse.json({
          success: true,
          message: 'No summaries to send (week 0 or negative)',
          successCount: 0,
          errorCount: 0
        });
      }

      const { data: logs, error: logsError } = await supabase
        .from('weekly_logs')
        .select(`
          *,
          user_profiles!inner(*)
        `)
        .eq('week_number', lastWeek);

      if (logsError) {
        throw logsError;
      }

      for (const log of logs) {
        try {
          // Get user email
          const { data: userData } = await supabase.auth.admin.getUserById(log.user_id);
          
          if (userData.user?.email) {
            const emailContent = generateWeeklySummaryEmail(
              log.user_profiles,
              log,
              new Date(log.end_date)
            );
            
            await resend.emails.send({
              from: 'SwiftLog <noreply@swiftlog.app>',
              to: [userData.user.email],
              subject: emailContent.subject,
              html: emailContent.html,
              text: emailContent.text,
            });

            successCount++;
          }
        } catch (error) {
          errorCount++;
          errors.push(`Failed to send summary for log ${log.id}: ${error}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Batch email sending completed`,
      successCount,
      errorCount,
      errors: errors.slice(0, 10) // Limit error details
    });

  } catch (error) {
    console.error('Error in batch email sending:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
