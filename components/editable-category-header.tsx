"use client"

import { useState, useRef, useEffect } from "react"
import * as LucideIcons from "lucide-react"
import { Tag, Pencil, Check, X, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { IconPicker } from "@/components/icon-picker"
import { cn } from "@/lib/utils"

interface EditableCategoryHeaderProps {
  category: string
  categoryIcon?: string
  count: { received: number; total: number }
  onRename: (oldName: string, newName: string) => void
  onIconChange?: (categoryName: string, icon: string) => void
  onDelete?: (categoryName: string) => void
  canRename?: boolean
}

export function EditableCategoryHeader({
  category,
  categoryIcon = "Tag",
  count,
  onRename,
  onIconChange,
  onDelete,
  canRename = true,
}: EditableCategoryHeaderProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState(category)
  const [isEditingIcon, setIsEditingIcon] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  
  const IconComponent = (LucideIcons[categoryIcon as keyof typeof LucideIcons] || LucideIcons.Tag) as React.ComponentType<{ className?: string }>

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleSave = () => {
    const trimmed = editedName.trim()
    if (trimmed && trimmed !== category && trimmed.length > 0) {
      onRename(category, trimmed)
      setIsEditing(false)
    } else {
      setEditedName(category)
      setIsEditing(false)
    }
  }

  const handleCancel = () => {
    setEditedName(category)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleSave()
    } else if (e.key === "Escape") {
      handleCancel()
    }
  }

  // Don't allow renaming "Uncategorized"
  const isUncategorized = category === "Uncategorized"

  return (
    <div className="group flex items-center justify-between pb-2">
      <div className="flex items-center gap-2">
        {isEditingIcon && !isUncategorized && onIconChange ? (
          <div className="flex items-center gap-2">
            <IconPicker
              selectedIcon={categoryIcon}
              onSelect={(icon) => {
                onIconChange(category, icon)
                setIsEditingIcon(false)
              }}
            />
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              onClick={() => setIsEditingIcon(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        ) : (
          <div className="relative group/icon">
            <IconComponent className="h-5 w-5 text-primary" />
            {canRename && !isUncategorized && onIconChange && (
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                onClick={() => setIsEditingIcon(true)}
                className="absolute -top-1 -right-1 h-4 w-4 opacity-0 transition-opacity group-hover/icon:opacity-100 bg-background border border-border rounded-full p-0"
                aria-label="Change icon"
              >
                <Pencil className="h-2 w-2" />
              </Button>
            )}
          </div>
        )}
        {isEditing && canRename && !isUncategorized ? (
          <div className="flex items-center gap-2">
            <Input
              ref={inputRef}
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-8 w-48 text-xl font-semibold"
            />
            <Button
              type="button"
              size="icon-sm"
              onClick={handleSave}
              variant="ghost"
              className="h-8 w-8"
            >
              <Check className="h-4 w-4 text-green-600" />
            </Button>
            <Button
              type="button"
              size="icon-sm"
              onClick={handleCancel}
              variant="ghost"
              className="h-8 w-8"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-semibold">{category}</h2>
            {canRename && !isUncategorized && (
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                onClick={() => setIsEditing(true)}
                className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                aria-label="Rename category"
              >
                <Pencil className="h-3 w-3 text-muted-foreground" />
              </Button>
            )}
          </>
        )}
        <span className="text-sm text-muted-foreground">
          ({count.received}/{count.total})
        </span>
      </div>
      {canRename && !isUncategorized && onDelete && (
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          onClick={() => onDelete(category)}
          className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100 text-destructive hover:text-destructive"
          aria-label="Delete category"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      )}
    </div>
  )
}
