"use client"

import { useState } from "react"
import * as LucideIcons from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Popular tag/category icons
const CATEGORY_ICONS = [
  "Tag",
  "Heart",
  "Star",
  "Gift",
  "ShoppingBag",
  "Shirt",
  "Music",
  "Film",
  "Book",
  "Gamepad2",
  "Coffee",
  "Utensils",
  "Home",
  "Car",
  "Plane",
  "Camera",
  "Palette",
  "Dumbbell",
  "Laptop",
  "Smartphone",
  "Watch",
  "Headphones",
  "Flower",
  "Sparkles",
  "Gem",
  "Crown",
  "Zap",
  "Sun",
  "Moon",
  "Cloud",
  // Food & Drink
  "Wine",
  "Beer",
  "Cookie",
  "Cake",
  "IceCream",
  "Pizza",
  "Apple",
  "Cherry",
  "Fish",
  "ChefHat",
  // Fashion & Beauty
  "Diamond",
  "Scissors",
  "Lipstick",
  "Shoe",
  "Glasses",
  "Handbag",
  "Wand2",
  // Tech & Electronics
  "Tablet",
  "Monitor",
  "Keyboard",
  "Mouse",
  "Printer",
  "Router",
  "HardDrive",
  "Usb",
  "Battery",
  "Server",
  "Database",
  "Wifi",
  "Bluetooth",
  // Hobbies & Activities
  "Paintbrush",
  "Brush",
  "Rocket",
  "Puzzle",
  "Dice6",
  "Cards",
  "Trophy",
  "Award",
  "Medal",
  "Piano",
  "Guitar",
  // Sports & Fitness
  "Bike",
  "Skiing",
  "Swimming",
  "Tennis",
  "Football",
  "Basketball",
  "Volleyball",
  "Running",
  "Yoga",
  "Sailboat",
  // Nature & Outdoors
  "Tree",
  "Mountain",
  "Waves",
  "Bird",
  "Dog",
  "Cat",
  "Rabbit",
  "Leaf",
  "Bug",
  "Tent",
  // Travel & Transportation
  "Train",
  "Ship",
  "Map",
  "MapPin",
  "Compass",
  "Suitcase",
  "Ticket",
  "Hotel",
  "Navigation2",
  // Entertainment
  "Tv",
  "Mic",
  "Video",
  "Disc",
  "Clapperboard",
  // Home & Living
  "Bed",
  "Sofa",
  "Lamp",
  "Armchair",
  "Couch",
  "Door",
  "Window",
  "Plant",
  "Cactus",
  "Candle",
  "Bath",
  // Health & Wellness
  "HeartPulse",
  "Stethoscope",
  "Pill",
  "Cross",
  "Activity",
  "Brain",
  "Smile",
  "HeartHandshake",
  // Education & Work
  "GraduationCap",
  "Briefcase",
  "FileText",
  "Folder",
  "Pen",
  "Pencil",
  "Calculator",
  "Microscope",
  "Beaker",
  "BookOpen",
  // General & Misc
  "Bell",
  "Mail",
  "Phone",
  "MessageCircle",
  "Users",
  "User",
  "Settings",
  "Lock",
  "Key",
  "Shield",
  "Flag",
  "Globe",
  "Target",
  "Lightbulb",
  "Fire",
  "Droplet",
  "Snowflake",
  "Rainbow",
  "ThumbsUp",
] as const

interface IconPickerProps {
  selectedIcon: string
  onSelect: (icon: string) => void
  className?: string
}

export function IconPicker({ selectedIcon, onSelect, className }: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false)

  const SelectedIcon = (LucideIcons[selectedIcon as keyof typeof LucideIcons] || LucideIcons.Tag) as React.ComponentType<{ className?: string }>

  return (
    <div className={cn("relative", className)}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 gap-2"
      >
        <SelectedIcon className="h-4 w-4" />
        <span className="text-xs">Change Icon</span>
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 top-full z-50 mt-2 w-80 rounded-md border bg-popover shadow-lg p-2">
            <div className="grid grid-cols-6 gap-2 max-h-96 overflow-y-auto">
              {CATEGORY_ICONS.map((iconName) => {
                const Icon = LucideIcons[iconName as keyof typeof LucideIcons] as React.ComponentType<{ className?: string }> | undefined
                const isSelected = selectedIcon === iconName
                
                // Skip icons that don't exist in lucide-react
                if (!Icon) {
                  return null
                }
                
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => {
                      onSelect(iconName)
                      setIsOpen(false)
                    }}
                    className={cn(
                      "flex items-center justify-center h-10 w-10 rounded-md border transition-colors",
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "hover:bg-accent border-border"
                    )}
                    title={iconName}
                  >
                    <Icon className="h-5 w-5" />
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
