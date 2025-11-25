"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:bg-white group-[.toaster]:text-gray-950 group-[.toaster]:border-gray-200 group-[.toaster]:shadow-lg dark:group-[.toaster]:bg-gray-950 dark:group-[.toaster]:text-gray-50 dark:group-[.toaster]:border-gray-800",
          description: "group-[.toast]:text-gray-600 dark:group-[.toast]:text-gray-400",
          actionButton: "group-[.toast]:bg-teal-600 group-[.toast]:text-white dark:group-[.toast]:bg-teal-500",
          cancelButton: "group-[.toast]:bg-gray-100 group-[.toast]:text-gray-600 dark:group-[.toast]:bg-gray-800 dark:group-[.toast]:text-gray-400",
          error: "group-[.toast]:bg-red-50 group-[.toast]:text-red-900 group-[.toast]:border-red-200 dark:group-[.toast]:bg-red-950 dark:group-[.toast]:text-red-50 dark:group-[.toast]:border-red-900",
          success: "group-[.toast]:bg-green-50 group-[.toast]:text-green-900 group-[.toast]:border-green-200 dark:group-[.toast]:bg-green-950 dark:group-[.toast]:text-green-50 dark:group-[.toast]:border-green-900",
          warning: "group-[.toast]:bg-yellow-50 group-[.toast]:text-yellow-900 group-[.toast]:border-yellow-200 dark:group-[.toast]:bg-yellow-950 dark:group-[.toast]:text-yellow-50 dark:group-[.toast]:border-yellow-900",
          info: "group-[.toast]:bg-blue-50 group-[.toast]:text-blue-900 group-[.toast]:border-blue-200 dark:group-[.toast]:bg-blue-950 dark:group-[.toast]:text-blue-50 dark:group-[.toast]:border-blue-900",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
