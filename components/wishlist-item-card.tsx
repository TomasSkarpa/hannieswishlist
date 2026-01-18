"use client"

import { Heart, CircleCheckBig, Trash2, ExternalLink } from "lucide-react"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface WishlistItem {
  id: string
  url: string
  title: string
  description?: string
  image?: string
  siteName?: string
  category?: string
  received: boolean
  createdAt: number
}

interface WishlistItemCardProps {
  item: WishlistItem
  onToggleReceived: (id: string) => void
  onDelete: (id: string) => void
}

export function WishlistItemCard({
  item,
  onToggleReceived,
  onDelete,
}: WishlistItemCardProps) {
  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all hover:shadow-lg",
        item.received && "opacity-60"
      )}
    >
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
            <Heart className="h-12 w-12 text-primary/40" />
          </div>
        )}
        {item.received && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <CircleCheckBig className="h-16 w-16 text-white" />
          </div>
        )}
      </div>
      
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="line-clamp-2 text-lg">{item.title}</CardTitle>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onToggleReceived(item.id)}
              className="shrink-0"
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
              className="shrink-0"
              aria-label="Delete item"
            >
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        </div>
        {item.siteName && (
          <p className="text-xs text-muted-foreground">{item.siteName}</p>
        )}
      </CardHeader>

      {item.description && (
        <CardContent>
          <CardDescription className="line-clamp-3">
            {item.description}
          </CardDescription>
          <Button
            variant="link"
            size="sm"
            className="mt-2 h-auto p-0 cursor-pointer"
            onClick={() => window.open(item.url, '_blank', 'noopener,noreferrer')}
          >
            Visit site <ExternalLink className="ml-1 h-3 w-3" />
          </Button>
        </CardContent>
      )}
    </Card>
  )
}
