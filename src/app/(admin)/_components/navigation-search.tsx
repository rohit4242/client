"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { useNavigationContext } from "@/contexts/navigation-context"
import { useRouter } from "next/navigation"
import { NavigationGroup, NavigationItem } from "@/lib/navigation"

export function NavigationSearch() {
  const [open, setOpen] = useState(false)
  const { navigationConfig } = useNavigationContext()
  const router = useRouter()

 
  const handleSelect = (url: string) => {
    setOpen(false)
    router.push(url)
  }

  return (
    <>
      <Button
        variant="outline"
        className="relative h-9 w-9 p-0 xl:h-10 xl:w-60 xl:justify-start xl:px-3 xl:py-2"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4 xl:mr-2" />
        <span className="hidden xl:inline-flex">Search navigation...</span>
        <span className="sr-only">Search navigation</span>
        <kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 xl:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search navigation..." />
        <CommandList>
          <CommandEmpty>No navigation item found.</CommandEmpty>
          {navigationConfig.map((group: NavigationGroup) => (
            <CommandGroup key={group.id} heading={group.title}>
              {group.items
                .filter(item => item.isActive)
                .map((item: NavigationItem) => {
                  const Icon = item.icon;
                  return (
                    <CommandItem
                      key={item.id}
                      value={item.title}
                      onSelect={() => handleSelect(item.url)}
                    >
                      {Icon && <Icon className="mr-2 h-4 w-4" />}
                      <span>{item.title}</span>
                      {item.badge && (
                        <span className="ml-auto text-xs text-muted-foreground">
                          {item.badge}
                        </span>
                      )}
                    </CommandItem>
                  );
                })}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  )
} 