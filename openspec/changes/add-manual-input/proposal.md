# Manual Input Feature Proposal

## Why
Users need the flexibility to create weekly logs through manual input for several key reasons:
1. **AI Limitations**: Some users prefer not to use AI or the AI generation may not capture specific details accurately
2. **Complete Control**: Manual input allows users to have full control over the content and wording of their logs
3. **Privacy Concerns**: Some users may be uncomfortable sharing their activities with AI systems
4. **Offline Capability**: Manual input doesn't depend on AI API availability or internet connectivity
5. **Learning Experience**: Manual input helps users develop better documentation and writing skills
6. **Regulatory Requirements**: Some institutions may require manually authored logs for authenticity

## Overview
Add a manual input mode for creating weekly logs alongside the existing AI generation functionality, providing users with two distinct workflow options when creating new log entries.

## What Changes
1. **New Choice Modal**: Add a modal that appears when clicking "Add Week" button, offering AI Generation and Manual Input options
2. **Manual Input Page**: Create new `/manual-log` page with day-by-day input interface
3. **Updated Dashboard**: Modify "Add Week" button behavior to show choice modal instead of direct navigation
4. **Data Integration**: Ensure manual logs save with same structure as AI logs for seamless dashboard integration
5. **Form Validation**: Add comprehensive validation for manual input forms

## Current State Analysis
- **Add Week Button**: Currently redirects directly to `/create-log` (AI generation only)
- **Date Range Selector**: Reusable component exists for week date selection
- **Data Structure**: Weekly logs stored uniformly regardless of creation method
- **Dashboard**: Displays all logs consistently, no distinction between AI/manual creation

## Proposed Workflow
1. User clicks "Add Week" button on dashboard
2. Modal appears with two options: "AI Generation" and "Manual Input"
3. Manual mode navigates to new manual input page
4. User can:
   - Select week number and date range (reusing DateRangeSelector)
   - Input activities day-by-day using structured text inputs
   - Save completed log to dashboard
5. Manual logs appear alongside AI logs on dashboard

## Key Components to Create/Modify
1. **Choice Modal**: New modal component for AI vs Manual selection
2. **Manual Input Page**: New page at `/manual-log` with day-by-day input
3. **Dashboard Integration**: Update "Add Week" button to show modal
4. **Shared Components**: Reuse DateRangeSelector, week selection logic
5. **Database Integration**: Save manual logs using existing schema

## Implementation Considerations
- Maintain existing AI workflow unchanged
- Ensure manual logs have same data structure as AI logs
- Provide intuitive day-by-day input interface
- Include validation and save functionality
- Maintain responsive design patterns established in existing code

## Success Criteria
- Users can choose between AI and manual creation methods
- Manual input provides clear day-by-day interface
- Manual logs integrate seamlessly with existing dashboard
- No impact on existing AI functionality