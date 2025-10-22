# Manual Input Interface Specification

## ADDED Requirements

### Requirement: Modal Choice System
**ID**: REQ-MANUAL-001
**Description**: User SHALL be presented with a choice modal when clicking "Add Week" button, offering two distinct creation methods.

#### Scenario: Modal Selection Workflow
- **WHEN** User is on the dashboard and clicks the "Add Week" button
- **THEN** A modal appears with two options: "AI Generation" and "Manual Input"
- **AND** User can select either option to proceed with respective workflow
- **AND** Modal can be dismissed by clicking outside or cancel button

### Requirement: Manual Log Creation Page
**ID**: REQ-MANUAL-002
**Description**: System SHALL provide a dedicated page for manual log entry with day-by-day input interface.

#### Scenario: Manual Log Creation Workflow
- **WHEN** User selects "Manual Input" from the choice modal and navigates to the manual input page
- **THEN** Page displays week number selection, date range picker, and 7-day input interface
- **AND** User can input activities for each day of the selected week
- **AND** System validates inputs before saving to database

### Requirement: Week Selection Integration
**ID**: REQ-MANUAL-003
**Description**: Manual input page MUST include week number selection and date range functionality identical to AI generation.

#### Scenario: Week Selection in Manual Mode
- **WHEN** User is on the manual input page and interacts with week number selector
- **THEN** System shows available week numbers (1-24)
- **AND** Existing weeks are marked as "Created" and disabled
- **AND** User cannot select a week that already exists
- **AND** Date range selector functions identically to AI generation mode

### Requirement: Day-by-Day Input Interface
**ID**: REQ-MANUAL-004
**Description**: System SHALL provide structured input fields for each day of the selected week with clear labeling and validation.

#### Scenario: Daily Activity Input
**Given** User has selected a week and date range on manual input page
**When** Page loads the daily input interface
**Then** System displays 7 input areas labeled Monday through Sunday
**And** Each input shows the corresponding date from the selected range
**And** Each input has appropriate character limits and validation
**And** User can input free-form text for each day's activities

### Requirement: Manual Log Data Structure
**ID**: REQ-MANUAL-005
**Description**: Manual logs MUST save with the same data structure as AI-generated logs for consistent display and management.

#### Scenario: Manual Log Saving
**Given** User has completed daily activity inputs for a week
**When** User clicks the save button
**Then** System saves data using the same JSON structure as AI-generated logs
**And** Manual logs are indistinguishable from AI logs on the dashboard
**And** All existing log viewing, editing, and deletion functions work with manual logs

### Requirement: Form Validation and Error Handling
**ID**: REQ-MANUAL-006
**Description**: Manual input form MUST validate inputs and provide clear error messages for common issues.

#### Scenario: Input Validation
**Given** User attempts to save a manual log with incomplete or invalid data
**When** System validates the form input
**Then** System displays specific error messages for validation failures
**And** User cannot save until all validation requirements are met
**And** System highlights specific fields that need correction

#### Scenario: Week Conflict Prevention
**Given** User selects a week number that already exists
**When** System checks for existing logs during validation
**Then** System displays error message indicating week already exists
**And** User must select a different week number or edit existing log

### Requirement: Navigation and User Flow Integration
**ID**: REQ-MANUAL-007
**Description**: Manual input workflow MUST integrate seamlessly with existing navigation patterns and user flows.

#### Scenario: Navigation Integration
**Given** User completes manual log creation successfully
**When** System saves the manual log to database
**Then** User is redirected to dashboard with success notification
**And** New manual log appears immediately in the dashboard view
**And** All existing dashboard functionality works with the new manual log

#### Scenario: Dashboard Integration
**Given** User has created both AI and manual logs
**When** User views the dashboard
**Then** All logs are displayed uniformly regardless of creation method
**And** User can edit, view, and delete both AI and manual logs using the same interface
**And** No visual distinction is made between AI and manual log types

## MODIFIED Requirements

### Requirement: Add Week Button Behavior
**ID**: REQ-DASH-001 (Modified)
**Description**: Dashboard "Add Week" button SHALL open choice modal instead of direct navigation to create-log page.

#### Scenario: Updated Add Week Behavior
**Given** User is on the dashboard and clicks "Add Week" button
**When** System processes the button click
**Then** Choice modal appears instead of direct navigation
**And** User can select between AI Generation and Manual Input options
**And** Selecting AI Generation navigates to existing /create-log page
**And** Selecting Manual Input navigates to new /manual-log page

## REMOVED Requirements

### None
No existing requirements are removed by this change. All current functionality is preserved.