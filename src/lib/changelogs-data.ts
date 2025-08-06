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
  added: "bg-green-100 text-green-800 border-green-200",
  improved: "bg-blue-100 text-blue-800 border-blue-200",
  fixed: "bg-orange-100 text-orange-800 border-orange-200",
  removed: "bg-red-100 text-red-800 border-red-200",
  security: "bg-purple-100 text-purple-800 border-purple-200"
};

export const categoryIcons = {
  added: "✨",
  improved: "🚀",
  fixed: "🐛",
  removed: "🗑️",
  security: "🔒"
};

export const typeColors = {
  major: "bg-red-500",
  minor: "bg-blue-500",
  patch: "bg-green-500",
  hotfix: "bg-orange-500"
};
