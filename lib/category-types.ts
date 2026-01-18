export interface Category {
  name: string
  icon: string
}

// Helper functions to migrate from old string format
export function normalizeCategory(category: string | Category): Category {
  if (typeof category === "string") {
    return { name: category, icon: "Tag" }
  }
  return category
}

export function normalizeCategories(categories: (string | Category)[]): Category[] {
  return categories.map(normalizeCategory)
}

// Get category name (for backward compatibility)
export function getCategoryName(category: string | Category): string {
  return typeof category === "string" ? category : category.name
}

// Check if category is Uncategorized
export function isUncategorized(category: string | Category): boolean {
  return getCategoryName(category) === "Uncategorized"
}
