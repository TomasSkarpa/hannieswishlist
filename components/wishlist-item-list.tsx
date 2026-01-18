"use client"

import { EditableCategoryHeader } from "@/components/editable-category-header"
import { EditableWishlistItem } from "@/components/editable-wishlist-item"
import type { WishlistItem } from "./wishlist-item-card"

interface WishlistItemListProps {
  items: WishlistItem[]
  categories: string[]
  categoryIcons?: Record<string, string>
  onToggleReceived: (id: string) => void
  onDelete: (id: string) => void
  onChangeCategory: (id: string, category: string) => void
  onCreateCategory: (category: string) => void
  onRenameCategory: (oldName: string, newName: string) => void
  onCategoryIconChange?: (categoryName: string, icon: string) => void
  onDeleteCategory?: (categoryName: string) => void
  onUpdateItem: (id: string, updates: Partial<WishlistItem>) => void
  hideCategoryHeaders?: boolean
}

export function WishlistItemList({
  items,
  categories,
  categoryIcons = {},
  onToggleReceived,
  onDelete,
  onChangeCategory,
  onCreateCategory,
  onRenameCategory,
  onCategoryIconChange,
  onDeleteCategory,
  onUpdateItem,
  hideCategoryHeaders = false,
}: WishlistItemListProps) {
  // Group items by category
  const groupedItems = items.reduce((acc, item) => {
    const category = item.category || "Uncategorized"
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(item)
    return acc
  }, {} as Record<string, WishlistItem[]>)

  // Sort categories: Uncategorized last, others alphabetically
  const sortedCategories = Object.keys(groupedItems).sort((a, b) => {
    if (a === "Uncategorized") return 1
    if (b === "Uncategorized") return -1
    return a.localeCompare(b)
  })

  if (items.length === 0) {
    return null
  }

  return (
    <div className="flex w-full flex-col gap-8">
      {sortedCategories.map((category) => {
        const categoryItems = groupedItems[category]
        const receivedCount = categoryItems.filter((item) => item.received).length
        const totalCount = categoryItems.length

        return (
          <div key={category} className="group flex flex-col gap-4">
            {!hideCategoryHeaders && (
              <EditableCategoryHeader
                category={category}
                categoryIcon={categoryIcons[category] || "Tag"}
                count={{ received: receivedCount, total: totalCount }}
                onRename={onRenameCategory}
                onIconChange={onCategoryIconChange}
                onDelete={onDeleteCategory}
              />
            )}

            <div className="flex flex-col gap-2">
              {categoryItems.map((item) => (
                <EditableWishlistItem
                  key={item.id}
                  item={item}
                  categories={categories}
                  categoryIcons={categoryIcons}
                  onToggleReceived={onToggleReceived}
                  onDelete={onDelete}
                  onChangeCategory={onChangeCategory}
                  onCreateCategory={onCreateCategory}
                  onUpdate={onUpdateItem}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
