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
import { syncItemsToKV, syncCategoriesToKV } from "@/lib/sync"
import confetti from "canvas-confetti"
import { cn } from "@/lib/utils"

export default function Home() {
  const { isAuthenticated, logout } = useAuth()
  const [items, setItems] = useState<WishlistItem[]>([])
  const [categories, setCategories] = useState<string[]>(["Uncategorized"])
  const [isLoading, setIsLoading] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const itemsSyncTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const categoriesSyncTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  if (!isAuthenticated) {
    return <LoginForm />
  }

  // Load items and categories from localStorage and sync with Redis on mount
  useEffect(() => {
    const loadData = async () => {
      // Load from localStorage first (fast)
      const savedItems = localStorage.getItem("wishlist-items")
      const savedCategories = localStorage.getItem("wishlist-categories")
      
      let localItems: WishlistItem[] = []
      let localCategories: string[] = ["Uncategorized"]
      
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

      // Set local data immediately
      setItems(localItems)
      setCategories(localCategories)

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

        // Merge: prefer local if exists, otherwise use Redis
        const mergedItems = localItems.length > 0 ? localItems : kvItems
        const mergedCategories = localCategories.length > 1 ? localCategories : kvCategories

        // Update state with merged data
        setItems(mergedItems)
        setCategories(mergedCategories)

        // Save merged data back to localStorage
        localStorage.setItem("wishlist-items", JSON.stringify(mergedItems))
        localStorage.setItem("wishlist-categories", JSON.stringify(mergedCategories))

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
  }, [])

  // Debounced sync to Redis whenever items change
  useEffect(() => {
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
    // Save to localStorage immediately
    localStorage.setItem("wishlist-categories", JSON.stringify(categories))

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
  }, [categories])

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

    // Update all items with the old category name to use the new name
    setItems((prev) =>
      prev.map((item) =>
        item.category === oldName ? { ...item, category: newName } : item
      )
    )
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

  const receivedCount = items.filter((item) => item.received).length
  const totalCount = items.length

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
          {totalCount > 0 && (
            <p className="text-muted-foreground">
              {receivedCount} of {totalCount} items received
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
          />
        </div>

        {/* Wishlist Items */}
        {items.length === 0 ? (
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
            items={items}
            categories={categories}
            onToggleReceived={handleToggleReceived}
            onDelete={handleDelete}
            onChangeCategory={handleChangeCategory}
            onCreateCategory={handleCreateCategory}
            onRenameCategory={handleRenameCategory}
            onUpdateItem={handleUpdateItem}
          />
        )}
      </main>
    </div>
  )
}
