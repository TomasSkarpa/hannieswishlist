"use client"

import { useState, useRef, useEffect } from "react"
import * as LucideIcons from "lucide-react"
import { PlusCircle, X, Check, Tag } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface CategorySelectorProps {
  categories: string[]
  selectedCategory: string
  onSelect: (category: string) => void
  onCreateCategory: (category: string) => void
  categoryIcons?: Record<string, string>
  className?: string
}

export function CategorySelector({
  categories,
  selectedCategory,
  onSelect,
  onCreateCategory,
  categoryIcons = {},
  className,
}: CategorySelectorProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [newCategory, setNewCategory] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isCreating && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isCreating])

  const handleCreate = () => {
    const trimmed = newCategory.trim()
    if (trimmed && !categories.includes(trimmed)) {
      onCreateCategory(trimmed)
      onSelect(trimmed)
      setNewCategory("")
      setIsCreating(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleCreate()
    } else if (e.key === "Escape") {
      setIsCreating(false)
      setNewCategory("")
    }
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {categories.map((category) => {
        const isSelected = selectedCategory === category
        const iconName = categoryIcons[category] || "Tag"
        const Icon = (LucideIcons[iconName as keyof typeof LucideIcons] || Tag) as React.ComponentType<{ className?: string }>
        return (
          <Button
            key={category}
            type="button"
            variant={isSelected ? "default" : "outline"}
            size="sm"
            onClick={() => {
              onSelect(category)
            }}
            className={cn(
              "h-8 cursor-pointer transition-all gap-1.5",
              isSelected 
                ? "bg-primary text-primary-foreground shadow-sm" 
                : "hover:bg-accent hover:border-primary/50"
            )}
            aria-pressed={isSelected}
          >
            <Icon className="h-3 w-3" />
            {isSelected && <Check className="h-3 w-3" />}
            {category}
          </Button>
        )
      })}
      
      {selectedCategory && selectedCategory !== "" && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onSelect("")}
          className="h-8 border-dashed"
        >
          Show All
        </Button>
      )}
      
      {isCreating ? (
        <div className="flex items-center gap-1">
          <Input
            ref={inputRef}
            type="text"
            placeholder="Category name..."
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-8 w-32"
            autoFocus
          />
          <Button
            type="button"
            size="icon-sm"
            onClick={handleCreate}
            disabled={!newCategory.trim()}
          >
            <PlusCircle className="h-3 w-3" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              setIsCreating(false)
              setNewCategory("")
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsCreating(true)}
          className="h-8 border-dashed"
        >
          <PlusCircle className="mr-1 h-3 w-3" />
          New Category
        </Button>
      )}
    </div>
  )
}
