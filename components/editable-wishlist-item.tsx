"use client"

import { useState, useRef, useEffect } from "react"
import { Heart, CircleCheckBig, Trash2, ExternalLink, Pencil, Check, X, AlertCircle } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { InlineCategorySelector } from "@/components/inline-category-selector"
import { cn } from "@/lib/utils"
import type { WishlistItem } from "./wishlist-item-card"

interface EditableWishlistItemProps {
  item: WishlistItem
  categories: string[]
  onToggleReceived: (id: string) => void
  onDelete: (id: string) => void
  onChangeCategory: (id: string, category: string) => void
  onCreateCategory: (category: string) => void
  onUpdate: (id: string, updates: Partial<WishlistItem>) => void
}

// List of unhelpful titles that indicate preview failed
const UNHELPFUL_TITLES = [
  "just a moment",
  "checking security",
  "please wait",
  "loading",
  "untitled",
  "access denied",
  "forbidden",
]

function isUnhelpfulContent(title?: string, description?: string): boolean {
  if (!title) return true
  const lowerTitle = title.toLowerCase().trim()
  return UNHELPFUL_TITLES.some((bad) => lowerTitle.includes(bad)) || lowerTitle.length < 3
}

export function EditableWishlistItem({
  item,
  categories,
  onToggleReceived,
  onDelete,
  onChangeCategory,
  onCreateCategory,
  onUpdate,
}: EditableWishlistItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState(item.title)
  const [editedDescription, setEditedDescription] = useState(item.description || "")
  const [editedImage, setEditedImage] = useState(item.image || "")
  const [imageError, setImageError] = useState(false)
  const titleInputRef = useRef<HTMLInputElement>(null)

  const needsManualEdit = isUnhelpfulContent(item.title, item.description)

  useEffect(() => {
    if (isEditing && titleInputRef.current) {
      titleInputRef.current.focus()
    }
  }, [isEditing])

  const handleSave = () => {
    onUpdate(item.id, {
      title: editedTitle.trim() || item.url,
      description: editedDescription.trim() || undefined,
      image: editedImage.trim() && !imageError ? editedImage.trim() : undefined,
    })
    setIsEditing(false)
    setImageError(false)
  }

  const handleCancel = () => {
    setEditedTitle(item.title)
    setEditedDescription(item.description || "")
    setEditedImage(item.image || "")
    setImageError(false)
    setIsEditing(false)
  }

  const handleImageChange = (url: string) => {
    setEditedImage(url)
    setImageError(false)
  }

  const handleImageError = () => {
    setImageError(true)
  }

  return (
    <div
      className={cn(
        "group flex items-center gap-4 rounded-lg border bg-card p-4 transition-all hover:shadow-md",
        item.received && "opacity-60",
        needsManualEdit && !isEditing && "border-orange-200 dark:border-orange-800"
      )}
    >
      {/* Image */}
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
        {isEditing ? (
          <div className="flex h-full w-full flex-col gap-1.5 p-1.5">
            <Input
              type="url"
              placeholder="Image URL..."
              value={editedImage}
              onChange={(e) => handleImageChange(e.target.value)}
              className={cn(
                "h-7 text-xs",
                imageError && "border-destructive"
              )}
            />
            {editedImage && !imageError ? (
              <div className="relative h-full w-full min-h-[40px]">
                <Image
                  src={editedImage}
                  alt="Preview"
                  fill
                  className="object-cover rounded"
                  sizes="80px"
                  onError={handleImageError}
                  unoptimized
                />
              </div>
            ) : imageError ? (
              <div className="flex h-full min-h-[40px] items-center justify-center rounded bg-destructive/10 text-xs text-destructive">
                Invalid URL
              </div>
            ) : null}
            {editedImage && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditedImage("")
                  setImageError(false)
                }}
                className="h-6 text-xs"
              >
                Clear image
              </Button>
            )}
          </div>
        ) : item.image ? (
          <Image
            src={item.image}
            alt={item.title}
            fill
            className="object-cover"
            sizes="80px"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
            <Heart className="h-8 w-8 text-primary/40" />
          </div>
        )}
        {item.received && !isEditing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <CircleCheckBig className="h-6 w-6 text-white" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-1 min-w-0">
        {isEditing ? (
          <>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0 space-y-2">
                <Input
                  ref={titleInputRef}
                  type="text"
                  placeholder="Item title..."
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="font-semibold"
                />
                <Input
                  type="text"
                  placeholder="Description (optional)..."
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  className="text-sm"
                />
              </div>
              <div className="flex gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleSave}
                  className="h-8 w-8"
                >
                  <Check className="h-4 w-4 text-green-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleCancel}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold line-clamp-1">{item.title}</h3>
                  {needsManualEdit && (
                    <AlertCircle className="h-4 w-4 shrink-0 text-orange-500" title="Preview may be incomplete - click edit to fix" />
                  )}
                </div>
                {item.siteName && (
                  <p className="text-xs text-muted-foreground">{item.siteName}</p>
                )}
              </div>
              <div className="flex gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setIsEditing(true)}
                  className="opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label="Edit item"
                >
                  <Pencil className="h-4 w-4 text-muted-foreground" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onToggleReceived(item.id)}
                  aria-label={item.received ? "Mark as not received" : "Mark as received"}
                >
                  {item.received ? (
                    <CircleCheckBig className="h-4 w-4 text-green-600" />
                  ) : (
                    <Heart className="h-4 w-4 fill-pink-400 text-pink-400" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onDelete(item.id)}
                  aria-label="Delete item"
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            </div>

            {item.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {item.description}
              </p>
            )}

            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs cursor-pointer"
                onClick={() => window.open(item.url, '_blank', 'noopener,noreferrer')}
              >
                Visit site <ExternalLink className="ml-1 h-3 w-3" />
              </Button>
              <span className="text-muted-foreground">•</span>
              <InlineCategorySelector
                categories={categories}
                selectedCategory={item.category || "Uncategorized"}
                onSelect={(category) => onChangeCategory(item.id, category)}
                onCreateCategory={onCreateCategory}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
