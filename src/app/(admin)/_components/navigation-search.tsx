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
        className="relative h-10 w-10 p-0 xl:h-10 xl:w-80 xl:justify-start xl:px-4 xl:py-2 border-slate-200 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300 transition-all duration-200 rounded-xl"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4 xl:mr-2 text-slate-500" />
        <span className="hidden xl:inline-flex text-slate-600 font-medium">Search navigation...</span>
        <span className="sr-only">Search navigation</span>
        <kbd className="pointer-events-none absolute right-2 top-2 hidden h-6 select-none items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 font-mono text-[10px] font-semibold text-slate-600 opacity-100 xl:flex shadow-sm">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search navigation..." className="border-slate-200" />
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
                      className="cursor-pointer hover:bg-teal-50 aria-selected:bg-teal-50 aria-selected:text-teal-900"
                    >
                      {Icon && <Icon className="mr-2 h-4 w-4 text-teal-600" />}
                      <span className="font-medium">{item.title}</span>
                      {item.badge && (
                        <span className="ml-auto text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-medium">
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
