# Manual Input Interface Specification

## ADDED Requirements

### Requirement: Modal Choice System
The system SHALL present a choice modal when clicking "Add Week" button, offering two distinct creation methods.
**ID**: REQ-MANUAL-001

#### Scenario: Modal Selection Workflow
- **WHEN** User is on the dashboard and clicks the "Add Week" button
- **THEN** A modal appears with two options: "AI Generation" and "Manual Input"
- **AND** User can select either option to proceed with respective workflow
- **AND** Modal can be dismissed by clicking outside or cancel button

### Requirement: Manual Log Creation Page
The system SHALL provide a dedicated page for manual log entry with day-by-day input interface.
**ID**: REQ-MANUAL-002

#### Scenario: Manual Log Creation Workflow
- **WHEN** User selects "Manual Input" from the choice modal and navigates to the manual input page
- **THEN** Page displays week number selection, date range picker, and 7-day input interface
- **AND** User can input activities for each day of the selected week
- **AND** System validates inputs before saving to database

### Requirement: Week Selection Integration
The manual input page SHALL include week number selection and date range functionality identical to AI generation.
**ID**: REQ-MANUAL-003

#### Scenario: Week Selection in Manual Mode
- **WHEN** User is on the manual input page and interacts with week number selector
- **THEN** System shows available week numbers (1-24)
- **AND** Existing weeks are marked as "Created" and disabled
- **AND** User cannot select a week that already exists
- **AND** Date range selector functions identically to AI generation mode

### Requirement: Day-by-Day Input Interface
The system SHALL provide structured input fields for each day of the selected week with clear labeling and validation.
**ID**: REQ-MANUAL-004

#### Scenario: Daily Activity Input
- **WHEN** User has selected a week and date range on manual input page and page loads the daily input interface
- **THEN** System displays 7 input areas labeled Monday through Sunday
- **AND** Each input shows the corresponding date from the selected range
- **AND** Each input has appropriate character limits and validation
- **AND** User can input free-form text for each day's activities

### Requirement: Manual Log Data Structure
The system SHALL save manual logs with the same data structure as AI-generated logs for consistent display and management.
**ID**: REQ-MANUAL-005

#### Scenario: Manual Log Saving
- **WHEN** User has completed daily activity inputs for a week and clicks the save button
- **THEN** System saves data using the same JSON structure as AI-generated logs
- **AND** Manual logs are indistinguishable from AI logs on the dashboard
- **AND** All existing log viewing, editing, and deletion functions work with manual logs

### Requirement: Form Validation and Error Handling
The manual input form SHALL validate inputs and provide clear error messages for common issues.
**ID**: REQ-MANUAL-006

#### Scenario: Input Validation
- **WHEN** User attempts to save a manual log with incomplete or invalid data and system validates the form input
- **THEN** System displays specific error messages for validation failures
- **AND** User cannot save until all validation requirements are met
- **AND** System highlights specific fields that need correction

#### Scenario: Week Conflict Prevention
- **WHEN** User selects a week number that already exists and system checks for existing logs during validation
- **THEN** System displays error message indicating week already exists
- **AND** User must select a different week number or edit existing log

### Requirement: Navigation and User Flow Integration
The manual input workflow SHALL integrate seamlessly with existing navigation patterns and user flows.
**ID**: REQ-MANUAL-007

#### Scenario: Navigation Integration
- **WHEN** User completes manual log creation successfully and system saves the manual log to database
- **THEN** User is redirected to dashboard with success notification
- **AND** New manual log appears immediately in the dashboard view
- **AND** All existing dashboard functionality works with the new manual log

#### Scenario: Dashboard Integration
- **WHEN** User has created both AI and manual logs and views the dashboard
- **THEN** All logs are displayed uniformly regardless of creation method
- **AND** User can edit, view, and delete both AI and manual logs using the same interface
- **AND** No visual distinction is made between AI and manual log types

## MODIFIED Requirements

### Requirement: Add Week Button Behavior
The dashboard "Add Week" button SHALL open choice modal instead of direct navigation to create-log page.
**ID**: REQ-DASH-001 (Modified)

#### Scenario: Updated Add Week Behavior
- **WHEN** User is on the dashboard and clicks "Add Week" button and system processes the button click
- **THEN** Choice modal appears instead of direct navigation
- **AND** User can select between AI Generation and Manual Input options
- **AND** Selecting AI Generation navigates to existing /create-log page
- **AND** Selecting Manual Input navigates to new /manual-log page

## REMOVED Requirements

### None
No existing requirements are removed by this change. All current functionality is preserved.