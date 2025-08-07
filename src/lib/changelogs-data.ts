export interface ChangelogEntry {
  version: string;
  date: string;
  type: 'major' | 'minor' | 'patch' | 'hotfix';
  title: string;
  description: string;
  changes: {
    category: 'added' | 'improved' | 'fixed' | 'removed' | 'security';
    items: string[];
  }[];
}

export const changelogs: ChangelogEntry[] = [
  {
    version: "2.1.1",
    date: "2025-08-06",
    type: "major",
    title: "Dark Mode & Theme System",
    description: "Introduced a comprehensive dark mode system with semantic color tokens and improved user experience across all components.",
    changes: [
      {
        category: "added",
        items: [
          "Complete dark mode support with automatic system preference detection",
          "Theme toggle button with smooth animations",
          "Automatic theme persistence across browser sessions",
        ]
      },
      {
        category: "improved",
        items: [
          "Enhanced color contrast and readability in both light and dark modes",
          "Smooth transitions between theme changes across all components",
        ]
      }
    ]
  },
  {
    version: "1.5.5",
    date: "2025-08-06",
    type: "minor",
    title: "Changelogs & Documentation System",
    description: "Introduced a comprehensive changelog system to track product updates and improvements with a clean, minimal design.",
    changes: [
      {
        category: "added",
        items: [
          "New changelogs page to monitor product update",
          "Navigation integration for easy access to updates",
        ]
      },
      {
        category: "improved",
        items: [
          "Enhanced navigation with changelogs link",
        ]
      }
    ]
  }
];

export const categoryColors = {
  added: "bg-success-muted text-success-muted-foreground border-success-muted",
  improved: "bg-info-muted text-info-muted-foreground border-info-muted",
  fixed: "bg-warning-muted text-warning-muted-foreground border-warning-muted",
  removed: "bg-error-muted text-error-muted-foreground border-error-muted",
  security: "bg-accent text-accent-foreground border-accent"
};

export const categoryIcons = {
  added: "✨",
  improved: "🚀",
  fixed: "🐛",
  removed: "🗑️",
  security: "🔒"
};

export const typeColors = {
  major: "bg-error",
  minor: "bg-info",
  patch: "bg-success",
  hotfix: "bg-warning"
};
