"use client"

import { useState, useRef, useEffect } from "react"
import * as LucideIcons from "lucide-react"
import { Tag, ChevronDown, PlusCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface InlineCategorySelectorProps {
  categories: string[]
  selectedCategory: string
  onSelect: (category: string) => void
  onCreateCategory: (category: string) => void
  categoryIcons?: Record<string, string>
  className?: string
}

export function InlineCategorySelector({
  categories,
  selectedCategory,
  onSelect,
  onCreateCategory,
  categoryIcons = {},
  className,
}: InlineCategorySelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newCategory, setNewCategory] = useState("")
  const [openAbove, setOpenAbove] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setIsCreating(false)
        setNewCategory("")
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  const handleToggle = () => {
    if (!isOpen && buttonRef.current) {
      // Check available space before opening
      const rect = buttonRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const spaceAbove = rect.top
      const estimatedDropdownHeight = 240 // Approximate max height
      
      // Open above if not enough space below, but enough space above
      setOpenAbove(spaceBelow < estimatedDropdownHeight && spaceAbove > spaceBelow)
    }
    setIsOpen(!isOpen)
  }

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
      setIsOpen(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleCreate()
    } else if (e.key === "Escape") {
      setIsCreating(false)
      setNewCategory("")
      setIsOpen(false)
    }
  }

  return (
    <div ref={dropdownRef} className={cn("relative", className)}>
      <Button
        ref={buttonRef}
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleToggle}
        className="h-6 gap-1 px-2 text-xs"
      >
        {(() => {
          const iconName = categoryIcons[selectedCategory] || "Tag"
          const Icon = (LucideIcons[iconName as keyof typeof LucideIcons] || Tag) as React.ComponentType<{ className?: string }>
          return <Icon className="h-3 w-3" />
        })()}
        <span className="max-w-[100px] truncate">{selectedCategory}</span>
        <ChevronDown className={cn("h-3 w-3 transition-transform", isOpen && "rotate-180")} />
      </Button>

      {isOpen && (
        <div
          className={cn(
            "absolute left-0 z-50 w-48 rounded-md border bg-popover shadow-md",
            openAbove ? "bottom-full mb-1" : "top-full mt-1"
          )}
        >
          <div className="max-h-60 overflow-y-auto p-1">
            {categories.map((category) => {
              const iconName = categoryIcons[category] || "Tag"
              const Icon = (LucideIcons[iconName as keyof typeof LucideIcons] || Tag) as React.ComponentType<{ className?: string }>
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => {
                    onSelect(category)
                    setIsOpen(false)
                  }}
                  className={cn(
                    "w-full rounded-sm px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent flex items-center gap-2",
                    selectedCategory === category && "bg-accent"
                  )}
                >
                  <Icon className="h-3 w-3" />
                  {category}
                </button>
              )
            })}
            
            {isCreating ? (
              <div className="p-1">
                <div className="flex items-center rounded-md border border-input bg-background shadow-xs focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]">
                  <Input
                    ref={inputRef}
                    type="text"
                    placeholder="Category name..."
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="h-8 border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    autoFocus
                  />
                  <div className="flex items-center gap-0.5 pr-1">
                    <Button
                      type="button"
                      size="icon-sm"
                      onClick={handleCreate}
                      disabled={!newCategory.trim()}
                      className="h-7 w-7 rounded-md"
                      variant="ghost"
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
                      className="h-7 w-7 rounded-md"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsCreating(true)}
                className="w-full rounded-sm px-2 py-1.5 text-left text-sm text-muted-foreground transition-colors hover:bg-accent flex items-center gap-1"
              >
                <PlusCircle className="h-3 w-3" />
                New Category
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
