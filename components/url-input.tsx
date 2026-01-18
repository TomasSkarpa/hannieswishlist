"use client"

import { useState } from "react"
import { PlusCircle, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { CategorySelector } from "@/components/category-selector"
import { cn } from "@/lib/utils"

interface UrlInputProps {
  onAdd: (url: string, category: string) => Promise<void>
  isLoading?: boolean
  categories: string[]
  onCreateCategory: (category: string) => void
}

export function UrlInput({ onAdd, isLoading, categories, onCreateCategory }: UrlInputProps) {
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
    <form onSubmit={handleSubmit} className="w-full space-y-4">
      <div className="flex gap-2">
        <Input
          type="url"
          placeholder="Paste a URL to add to your wishlist..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={isLoading}
          className="flex-1"
        />
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
      <div>
        <p className="mb-2 text-sm text-muted-foreground">Category:</p>
        <CategorySelector
          categories={categories}
          selectedCategory={selectedCategory}
          onSelect={setSelectedCategory}
          onCreateCategory={(category) => {
            onCreateCategory(category)
            setSelectedCategory(category)
          }}
        />
      </div>
    </form>
  )
}
