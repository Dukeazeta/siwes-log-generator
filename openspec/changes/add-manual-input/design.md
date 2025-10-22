# Design Considerations

## User Experience Flow

### Current Workflow (AI Only)
```
Dashboard → Click "Add Week" → Navigate to /create-log → AI Generation → Dashboard
```

### Proposed Workflow (Dual Mode)
```
Dashboard → Click "Add Week" → Choice Modal (AI/Manual) →
  ├─ AI Path: /create-log (existing)
  └─ Manual Path: /manual-log (new) → Manual Input → Dashboard
```

## Component Architecture

### New Components
1. **LogCreationChoiceModal**
   - Two option buttons: "AI Generation" and "Manual Input"
   - Backdrop with blur effect
   - Cancel option (click outside or X button)
   - Smooth enter/exit animations

2. **ManualLogPage** (`/manual-log`)
   - Week selection (reusing existing logic)
   - Date range selector (existing component)
   - 7-day input grid
   - Save/cancel actions

### Modified Components
1. **Dashboard Page**
   - Update `handleAddWeek` function
   - Add modal state management
   - Maintain existing styling and layout

## Data Structure Consistency

### AI-Generated Log Structure (Existing)
```json
{
  "weekSummary": "AI-generated summary",
  "dailyActivities": [
    {
      "day": "Monday",
      "date": "2024-01-01",
      "activities": "AI-generated daily text"
    }
    // ... all 7 days
  ],
  "skillsDeveloped": ["skill1", "skill2"],
  "learningOutcomes": "AI-generated text",
  "challengesFaced": "AI-generated text"
}
```

### Manual Log Structure (To Match)
```json
{
  "weekSummary": "User-provided or auto-generated from daily entries",
  "dailyActivities": [
    {
      "day": "Monday",
      "date": "2024-01-01",
      "activities": "User-input text for Monday"
    }
    // ... all 7 days from user input
  ],
  "skillsDeveloped": [], // Optional: user can add later
  "learningOutcomes": "", // Optional: auto-generated from daily entries
  "challengesFaced": "" // Optional: user can add later
}
```

## Technical Implementation Details

### Modal Integration
- Trigger modal from dashboard's `handleAddWeek` function
- Use Framer Motion for animations (consistent with existing patterns)
- Implement proper z-index layering above dashboard content
- Handle escape key and click-outside to close

### Navigation Logic
```typescript
// Dashboard navigation updates
const handleAddWeek = () => {
  setShowChoiceModal(true); // Instead of direct navigation
};

// Modal option handlers
const handleAIChoice = () => {
  router.push('/create-log');
};

const handleManualChoice = () => {
  router.push('/manual-log');
};
```

### Form Validation Rules
- Week number must be unique (existing validation)
- Date range must be exactly 7 days
- At least 3 days must have content to save
- Daily character limits (reasonable maximum)
- All required fields must be completed

### State Management
- Form state for 7 daily text areas
- Loading states for save operations
- Error state handling
- Success notification integration

## Responsive Design Strategy

### Mobile Layout
- Single column layout for day inputs
- Stacked form elements
- Touch-friendly input areas
- Bottom action buttons (save/cancel)

### Desktop Layout
- Two-column layout for day inputs (optional enhancement)
- Side-by-side form elements
- Larger text areas with better visibility
- Floating or fixed action buttons

## Accessibility Considerations
- Screen reader support for modal
- Keyboard navigation through day inputs
- Focus management when modal opens/closes
- ARIA labels for form elements
- High contrast compliance

## Error Handling Strategy
- Network error recovery
- Validation error messaging
- Week conflict handling (existing)
- Auto-save draft functionality (future enhancement)
- Graceful degradation if JavaScript fails

## Performance Considerations
- Lazy load modal component
- Optimize form state updates
- Efficient date calculations
- Minimal additional bundle size impact