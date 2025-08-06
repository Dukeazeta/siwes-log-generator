# SwiftLog Changelog Management Guide

This guide explains how to manage and update the changelogs for SwiftLog.

## File Structure

- **`src/lib/changelogs-data.ts`** - Contains all changelog data and configuration
- **`src/app/changelogs/page.tsx`** - The changelogs page component
- **`CHANGELOG_GUIDE.md`** - This guide (you're reading it now)

## Adding New Changelog Entries

To add a new changelog entry, edit `src/lib/changelogs-data.ts`:

### 1. Add New Entry to the Array

Add your new entry at the **beginning** of the `changelogs` array (newest first):

```typescript
export const changelogs: ChangelogEntry[] = [
  {
    version: "1.6.0",  // New version
    date: "2025-01-15", // Release date (YYYY-MM-DD)
    type: "minor",      // major | minor | patch | hotfix
    title: "Your Feature Title",
    description: "Brief description of what this release includes.",
    changes: [
      {
        category: "added",  // added | improved | fixed | removed | security
        items: [
          "New feature description",
          "Another new feature"
        ]
      },
      {
        category: "improved",
        items: [
          "Enhancement description",
          "Performance improvement"
        ]
      },
      {
        category: "fixed",
        items: [
          "Bug fix description"
        ]
      }
    ]
  },
  // ... existing entries
];
```

### 2. Version Types

- **`major`** - Breaking changes, major new features (1.0.0 → 2.0.0)
- **`minor`** - New features, non-breaking changes (1.0.0 → 1.1.0)
- **`patch`** - Bug fixes, small improvements (1.0.0 → 1.0.1)
- **`hotfix`** - Critical bug fixes requiring immediate deployment

### 3. Change Categories

- **`added`** ✨ - New features, components, or functionality
- **`improved`** 🚀 - Enhancements to existing features
- **`fixed`** 🐛 - Bug fixes and issue resolutions
- **`removed`** 🗑️ - Deprecated or removed features
- **`security`** 🔒 - Security-related changes and fixes

## Best Practices

### Writing Good Changelog Entries

1. **Be Specific**: Instead of "Fixed bugs", write "Fixed authentication redirect loop on mobile devices"

2. **User-Focused**: Write from the user's perspective, not the developer's
   - ✅ "Improved log generation speed by 50%"
   - ❌ "Optimized database queries in LogService.generateLog()"

3. **Action-Oriented**: Start with action verbs
   - ✅ "Added dark mode toggle in settings"
   - ❌ "Dark mode toggle in settings"

4. **Consistent Format**: Follow the established pattern for similar changes

### Version Numbering

Follow [Semantic Versioning](https://semver.org/):
- **MAJOR.MINOR.PATCH** (e.g., 1.5.2)
- Increment MAJOR for breaking changes
- Increment MINOR for new features
- Increment PATCH for bug fixes

### Dating

Use ISO date format: `YYYY-MM-DD` (e.g., "2025-01-15")

## Example Entry

```typescript
{
  version: "1.6.0",
  date: "2025-01-15",
  type: "minor",
  title: "Enhanced Dashboard & Mobile Improvements",
  description: "Improved dashboard experience with new analytics and better mobile responsiveness across all pages.",
  changes: [
    {
      category: "added",
      items: [
        "Weekly progress analytics in dashboard",
        "Export logs to PDF functionality",
        "Dark mode support throughout the application"
      ]
    },
    {
      category: "improved",
      items: [
        "Mobile navigation experience on all pages",
        "Log generation speed increased by 40%",
        "Better error messages for failed operations"
      ]
    },
    {
      category: "fixed",
      items: [
        "Dashboard loading issues on slow connections",
        "Text overflow in log entries on mobile devices",
        "Authentication state persistence across browser sessions"
      ]
    }
  ]
}
```

## Deployment

After updating the changelog:

1. **Test Locally**: Run `npm run dev` and visit `/changelogs` to verify the changes
2. **Commit Changes**: Commit your changes with a descriptive message
3. **Deploy**: The changes will be automatically deployed via Vercel

## Styling Customization

The changelog page styling can be customized by modifying:

- **Colors**: Update `categoryColors` and `typeColors` in `changelogs-data.ts`
- **Icons**: Update `categoryIcons` in `changelogs-data.ts`
- **Layout**: Modify the JSX in `src/app/changelogs/page.tsx`

## Tips

- Keep entries concise but informative
- Group related changes together
- Use consistent terminology throughout
- Consider your audience (IT students using SIWES logs)
- Review previous entries for tone and style consistency

---

**Need Help?** Check existing entries in `changelogs-data.ts` for reference or reach out to the development team.
