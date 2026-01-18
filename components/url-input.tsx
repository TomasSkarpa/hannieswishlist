"use client"

import { useState } from "react"
import { PlusCircle, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { InlineCategorySelector } from "@/components/inline-category-selector"
import { cn } from "@/lib/utils"

interface UrlInputProps {
  onAdd: (url: string, category: string) => Promise<void>
  isLoading?: boolean
  categories: string[]
  onCreateCategory: (category: string) => void
  categoryIcons?: Record<string, string>
}

export function UrlInput({ onAdd, isLoading, categories, onCreateCategory, categoryIcons = {} }: UrlInputProps) {
  const [url, setUrl] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("Uncategorized")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim() || isLoading) return

    const urlToAdd = url.trim()
    setUrl("")
    await onAdd(urlToAdd, selectedCategory)
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-3">
      <div className="flex gap-2 items-center">
        <Input
          type="url"
          placeholder="Paste a URL to add to your wishlist..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={isLoading}
          className="flex-1"
        />
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Category:</span>
          <InlineCategorySelector
            categories={categories}
            selectedCategory={selectedCategory}
            categoryIcons={categoryIcons}
            onSelect={setSelectedCategory}
            onCreateCategory={(category) => {
              onCreateCategory(category)
              setSelectedCategory(category)
            }}
          />
        </div>
        <Button
          type="submit"
          disabled={!url.trim() || isLoading}
          size="default"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <PlusCircle className="h-4 w-4" />
          )}
        </Button>
      </div>
    </form>
  )
}
