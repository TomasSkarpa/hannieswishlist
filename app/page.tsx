"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { Gift, Sparkles, LogOut } from "lucide-react"
import Image from "next/image"
import { UrlInput } from "@/components/url-input"
import { WishlistItemList } from "@/components/wishlist-item-list"
import { type WishlistItem } from "@/components/wishlist-item-card"
import { LoginForm } from "@/components/login-form"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { CategorySelector } from "@/components/category-selector"
import { syncItemsToKV, syncCategoriesToKV, mergeItems, mergeCategories } from "@/lib/sync"
import confetti from "canvas-confetti"
import { cn } from "@/lib/utils"

export default function Home() {
  const { isAuthenticated, logout } = useAuth()
  const [items, setItems] = useState<WishlistItem[]>([])
  const [categories, setCategories] = useState<string[]>(["Uncategorized"])
  const [categoryIcons, setCategoryIcons] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [filterCategory, setFilterCategory] = useState<string | null>(null)
  const itemsSyncTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const categoriesSyncTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Load items and categories from localStorage and sync with Redis on mount
  useEffect(() => {
    if (!isAuthenticated) return
    
    const loadData = async () => {
      // Load from localStorage first (fast)
      const savedItems = localStorage.getItem("wishlist-items")
      const savedCategories = localStorage.getItem("wishlist-categories")
      const savedCategoryIcons = localStorage.getItem("wishlist-category-icons")
      
      let localItems: WishlistItem[] = []
      let localCategories: string[] = ["Uncategorized"]
      let localCategoryIcons: Record<string, string> = {}
      
      if (savedItems) {
        try {
          localItems = JSON.parse(savedItems)
        } catch (error) {
          console.error("Error loading wishlist items from localStorage:", error)
        }
      }
      
      if (savedCategories) {
        try {
          localCategories = JSON.parse(savedCategories)
        } catch (error) {
          console.error("Error loading categories from localStorage:", error)
        }
      }

      if (savedCategoryIcons) {
        try {
          localCategoryIcons = JSON.parse(savedCategoryIcons)
        } catch (error) {
          console.error("Error loading category icons from localStorage:", error)
        }
      }

      // Set local data immediately
      setItems(localItems)
      setCategories(localCategories)
      setCategoryIcons(localCategoryIcons)

      // Sync with Redis in the background
      setIsSyncing(true)
      try {
        // Load from Redis
        const [kvItemsResponse, kvCategoriesResponse] = await Promise.all([
          fetch('/api/wishlist/items').catch(() => null),
          fetch('/api/wishlist/categories').catch(() => null),
        ])

        const kvItems = kvItemsResponse?.ok 
          ? (await kvItemsResponse.json()).items || []
          : []
        const kvCategories = kvCategoriesResponse?.ok
          ? (await kvCategoriesResponse.json()).categories || ["Uncategorized"]
          : ["Uncategorized"]

        // Merge: combine local and Redis items (local takes precedence for conflicts)
        const mergedItems = mergeItems(localItems, kvItems)
        const mergedCategories = mergeCategories(localCategories, kvCategories)

        // Update state with merged data
        setItems(mergedItems)
        setCategories(mergedCategories)

        // Save merged data back to localStorage
        localStorage.setItem("wishlist-items", JSON.stringify(mergedItems))
        localStorage.setItem("wishlist-categories", JSON.stringify(mergedCategories))
        localStorage.setItem("wishlist-category-icons", JSON.stringify(localCategoryIcons))

        // Sync merged data to Redis
        if (mergedItems.length > 0) {
          await syncItemsToKV(mergedItems)
        }
        if (mergedCategories.length > 0) {
          await syncCategoriesToKV(mergedCategories)
        }
      } catch (error) {
        console.error("Error syncing with Redis:", error)
      } finally {
        setIsSyncing(false)
      }
    }

    loadData()
  }, [isAuthenticated])

  // Debounced sync to Redis whenever items change
  useEffect(() => {
    if (!isAuthenticated) return
    
    // Save to localStorage immediately
    localStorage.setItem("wishlist-items", JSON.stringify(items))

    // Clear existing timeout
    if (itemsSyncTimeoutRef.current) {
      clearTimeout(itemsSyncTimeoutRef.current)
    }

    // Debounce Redis sync (wait 1 second after last change)
    itemsSyncTimeoutRef.current = setTimeout(() => {
      syncItemsToKV(items).catch(console.error)
    }, 1000)

    return () => {
      if (itemsSyncTimeoutRef.current) {
        clearTimeout(itemsSyncTimeoutRef.current)
      }
    }
  }, [items])

  // Debounced sync to Redis whenever categories change
  useEffect(() => {
    if (!isAuthenticated) return
    
    // Save to localStorage immediately
    localStorage.setItem("wishlist-categories", JSON.stringify(categories))
    localStorage.setItem("wishlist-category-icons", JSON.stringify(categoryIcons))

    // Clear existing timeout
    if (categoriesSyncTimeoutRef.current) {
      clearTimeout(categoriesSyncTimeoutRef.current)
    }

    // Debounce Redis sync (wait 1 second after last change)
    categoriesSyncTimeoutRef.current = setTimeout(() => {
      syncCategoriesToKV(categories).catch(console.error)
    }, 1000)

    return () => {
      if (categoriesSyncTimeoutRef.current) {
        clearTimeout(categoriesSyncTimeoutRef.current)
      }
    }
  }, [categories, categoryIcons, isAuthenticated])

  if (!isAuthenticated) {
    return <LoginForm />
  }

  const handleAddItem = async (url: string, category: string) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      })

      if (!response.ok) {
        throw new Error("Failed to fetch preview")
      }

      const preview = await response.json()

      const newItem: WishlistItem = {
        id: Date.now().toString(),
        url,
        title: preview.title || "Untitled",
        description: preview.description,
        image: preview.images?.[0] || preview.image,
        siteName: preview.siteName,
        category: category === "Uncategorized" ? undefined : category,
        received: false,
        createdAt: Date.now(),
      }

      setItems((prev) => [newItem, ...prev])
      
      // Fire confetti celebration!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ffb6c1', '#f3e8ff', '#ffb6c1'],
      })
    } catch (error) {
      console.error("Error adding item:", error)
      alert("Failed to add item. Please check the URL and try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateCategory = (category: string) => {
    if (!categories.includes(category)) {
      setCategories((prev) => [...prev, category].sort())
    }
  }

  const handleRenameCategory = (oldName: string, newName: string) => {
    // Don't allow renaming "Uncategorized"
    if (oldName === "Uncategorized" || newName === "Uncategorized") {
      return
    }

    // Update category name in categories list
    setCategories((prev) => {
      const updated = prev.map((cat) => (cat === oldName ? newName : cat))
      return updated.sort()
    })

    // Update icon mapping if category was renamed
    setCategoryIcons((prev) => {
      const newIcons = { ...prev }
      if (prev[oldName]) {
        newIcons[newName] = prev[oldName]
        delete newIcons[oldName]
      }
      return newIcons
    })

    // Update all items with the old category name to use the new name
    setItems((prev) =>
      prev.map((item) =>
        item.category === oldName ? { ...item, category: newName } : item
      )
    )
  }

  const handleCategoryIconChange = (categoryName: string, icon: string) => {
    setCategoryIcons((prev) => ({
      ...prev,
      [categoryName]: icon,
    }))
  }

  const handleDeleteCategory = (categoryName: string) => {
    // Don't allow deleting "Uncategorized"
    if (categoryName === "Uncategorized") {
      return
    }

    // Count items in this category
    const itemsInCategory = items.filter(
      (item) => (item.category || "Uncategorized") === categoryName
    )

    // Confirm deletion
    const message = itemsInCategory.length > 0
      ? `Delete category "${categoryName}"? This will move ${itemsInCategory.length} item(s) to "Uncategorized".`
      : `Delete category "${categoryName}"?`

    if (!confirm(message)) {
      return
    }

    // Move all items with this category to "Uncategorized" (set category to undefined)
    setItems((prev) =>
      prev.map((item) =>
        item.category === categoryName ? { ...item, category: undefined } : item
      )
    )

    // Remove category from categories list
    setCategories((prev) => prev.filter((cat) => cat !== categoryName))

    // Remove category icon
    setCategoryIcons((prev) => {
      const newIcons = { ...prev }
      delete newIcons[categoryName]
      return newIcons
    })

    // Clear filter if the deleted category was being filtered
    if (filterCategory === categoryName) {
      setFilterCategory(null)
    }
  }

  const handleChangeCategory = (id: string, category: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, category: category === "Uncategorized" ? undefined : category }
          : item
      )
    )
  }

  const handleToggleReceived = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, received: !item.received } : item
      )
    )
  }

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to remove this item?")) {
      setItems((prev) => prev.filter((item) => item.id !== id))
    }
  }

  const handleUpdateItem = (id: string, updates: Partial<WishlistItem>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    )
  }

  // Filter items based on selected category
  const filteredItems = filterCategory
    ? items.filter((item) => {
        const itemCategory = item.category || "Uncategorized"
        return itemCategory === filterCategory
      })
    : items

  const receivedCount = filteredItems.filter((item) => item.received).length
  const totalCount = filteredItems.length

  return (
    <div className="relative flex min-h-screen flex-col items-center overflow-hidden bg-background">
      {/* Main Content */}
      <main className="relative z-10 flex w-full max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
        {/* Logout Button */}
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>

        {/* Header */}
        <div className="flex flex-col items-center gap-4 text-center">

          {/* Cute Kitty Mascot */}
          <div className="relative h-20 w-20 shrink-0 animate-bounce-subtle">
            <Image
              src="/assets/images/kitty.png"
              alt="Cute kitty"
              fill
              sizes="80px"
              className="object-contain drop-shadow-lg"
              priority
            />
          </div>
          <div className="flex items-center gap-3">
            <Gift className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold tracking-tight">Hannie&apos;s Wishlist</h1>
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          {items.length > 0 && (
            <p className="text-muted-foreground">
              {filterCategory 
                ? `${receivedCount} of ${totalCount} items in "${filterCategory}"`
                : `${receivedCount} of ${items.length} items received`}
            </p>
          )}
        </div>

        {/* URL Input */}
        <div className="w-full">
          <UrlInput
            onAdd={handleAddItem}
            isLoading={isLoading}
            categories={categories}
            onCreateCategory={handleCreateCategory}
            categoryIcons={categoryIcons}
          />
        </div>

        {/* Category Filter */}
        {items.length > 0 && (
          <div className="w-full">
            <p className="mb-2 text-sm text-muted-foreground">
              {filterCategory ? `Filtering by: ${filterCategory}` : "Filter by category:"}
            </p>
            <CategorySelector
              categories={categories}
              selectedCategory={filterCategory || ""}
              categoryIcons={categoryIcons}
              onSelect={(category) => {
                // If clicking "Show All" (empty string) or the same category, clear filter
                if (category === "" || filterCategory === category) {
                  setFilterCategory(null)
                } else {
                  setFilterCategory(category)
                }
              }}
              onCreateCategory={handleCreateCategory}
            />
          </div>
        )}

        {/* Wishlist Items */}
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-muted p-12 text-center">
            <div className="relative h-24 w-24">
              <Image
                src="/assets/images/kitty.png"
                alt="Cute kitty"
                fill
                sizes="96px"
                className="object-contain opacity-50"
              />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Your wishlist is empty</h2>
              <p className="mt-2 text-muted-foreground">
                Paste a URL above to start adding items to your wishlist!
              </p>
            </div>
          </div>
        ) : (
          <WishlistItemList
            items={filteredItems}
            categories={categories}
            categoryIcons={categoryIcons}
            onToggleReceived={handleToggleReceived}
            onDelete={handleDelete}
            onChangeCategory={handleChangeCategory}
            onCreateCategory={handleCreateCategory}
            onRenameCategory={handleRenameCategory}
            onCategoryIconChange={handleCategoryIconChange}
            onDeleteCategory={handleDeleteCategory}
            onUpdateItem={handleUpdateItem}
            hideCategoryHeaders={filterCategory !== null}
          />
        )}
      </main>
    </div>
  )
}
