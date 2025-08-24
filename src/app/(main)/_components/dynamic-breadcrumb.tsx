"use client"

import { usePathname } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

// Route mappings for better display names
const routeMap: Record<string, string> = {
  dashboard: "Dashboard",
  "ai-agents": "AI Agents",
  chat: "Chat Assistant",
  "study-buddy": "Study Buddy",
  "code-review": "Code Reviewer",
  quiz: "Quiz Generator",
  settings: "Settings",
  profile: "Profile",
  preferences: "Preferences",
  notifications: "Notifications",
  account: "Account",
}

function formatSegment(segment: string): string {
  return routeMap[segment] || segment.split("-").map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(" ")
}

export function DynamicBreadcrumb() {
  const pathname = usePathname()
  
  // Split the pathname into segments and filter out empty strings
  const segments = pathname.split("/").filter(Boolean)
  
  // Build breadcrumb items from path segments
  const breadcrumbItems = []
  
  // Always start with Bytik home (but only if we're not on dashboard root)
  if (segments.length > 1 || segments[0] !== "dashboard") {
    breadcrumbItems.push({
      title: "Bytik",
      href: "/dashboard",
      isLast: false,
    })
  }
  
  // Build breadcrumb items from path segments
  let currentPath = ""
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`
    const isLast = index === segments.length - 1
    
    breadcrumbItems.push({
      title: formatSegment(segment),
      href: currentPath,
      isLast,
    })
  })

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbItems.map((item, index) => (
          <div key={`breadcrumb-${index}`} className="flex items-center">
            {index > 0 && <BreadcrumbSeparator className="hidden md:block" />}
            <BreadcrumbItem className={index === 0 && breadcrumbItems.length > 1 ? "hidden md:block" : ""}>
              {item.isLast ? (
                <BreadcrumbPage>{item.title}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={item.href}>
                  {item.title}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </div>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
} 