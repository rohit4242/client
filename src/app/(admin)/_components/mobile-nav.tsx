"use client"

import { useState } from "react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { NavMain } from "./nav-main"
import { NavUser } from "./nav-user"
import { TeamSwitcher } from "./team-switcher"
import { data } from "./app-sidebar"

export function MobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          className="mr-2 px-0 text-base hover:bg-teal-50 hover:text-teal-700 focus-visible:bg-teal-50 focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden rounded-lg transition-colors"
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="pl-1 pr-0 border-slate-200">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200">
            <TeamSwitcher activeTeam={data.teams} />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
              className="h-8 w-8 p-0 hover:bg-teal-50 hover:text-teal-700 rounded-lg transition-colors"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto py-4">
            <NavMain />
          </div>
          <div className="border-t border-slate-200 p-4">
            <NavUser />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
