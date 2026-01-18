"use client"

import { useState, useRef, useEffect } from "react"
import { Tag, Pencil, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface EditableCategoryHeaderProps {
  category: string
  count: { received: number; total: number }
  onRename: (oldName: string, newName: string) => void
  canRename?: boolean
}

export function EditableCategoryHeader({
  category,
  count,
  onRename,
  canRename = true,
}: EditableCategoryHeaderProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState(category)
  const inputRef = useRef<HTMLInputElement>(null)

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
        <Tag className="h-5 w-5 text-primary" />
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
    </div>
  )
}
