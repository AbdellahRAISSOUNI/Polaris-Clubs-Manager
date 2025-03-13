"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Home, Calendar, Users, MapPin, PieChart, Settings, LogOut, Bell, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MessagingProvider } from "@/lib/messaging-context"
import { MessageIndicator } from "@/components/messaging/MessageIndicator"
import { useEffect, useState } from "react"

interface AdminSidebarProps {
  onLogout?: () => void;
  isLoggingOut?: boolean;
}

export function AdminSidebar({ onLogout, isLoggingOut = false }: AdminSidebarProps) {
  const pathname = usePathname()
  const [adminId, setAdminId] = useState<string | null>(null)

  useEffect(() => {
    // Get admin ID from local storage
    const storedAdminId = localStorage.getItem('adminId')
    if (storedAdminId) {
      setAdminId(storedAdminId)
    }
  }, [])

  return (
    <>
      <div className="flex-1 space-y-0.5 sm:space-y-1">
        <Link
          href="/admin/dashboard"
          className={`flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-md text-xs sm:text-sm hover:bg-gray-100 dark:hover:bg-gray-800 ${
            pathname === "/admin/dashboard" ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" : ""
          }`}
        >
          <Home className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          Dashboard
        </Link>
        <Link
          href="/admin/notifications"
          className={`flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-md text-xs sm:text-sm hover:bg-gray-100 dark:hover:bg-gray-800 ${
            pathname === "/admin/notifications" ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" : ""
          }`}
        >
          <Bell className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          Notifications
        </Link>
        <Link
          href="/admin/messages"
          className={`flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-md text-xs sm:text-sm hover:bg-gray-100 dark:hover:bg-gray-800 ${
            pathname === "/admin/messages" ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" : ""
          }`}
        >
          <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          Messages
          {adminId && (
            <MessagingProvider userId={adminId} userType="admin">
              <MessageIndicator userId={adminId} userType="admin" />
            </MessagingProvider>
          )}
        </Link>
        <Link
          href="/admin/all-reservations"
          className={`flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-md text-xs sm:text-sm hover:bg-gray-100 dark:hover:bg-gray-800 ${
            pathname === "/admin/all-reservations" ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" : ""
          }`}
        >
          <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          All Reservations
        </Link>
        <Link
          href="/admin/clubs"
          className={`flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-md text-xs sm:text-sm hover:bg-gray-100 dark:hover:bg-gray-800 ${
            pathname === "/admin/clubs" ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" : ""
          }`}
        >
          <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          Manage Clubs
        </Link>
        <Link
          href="/admin/spaces"
          className={`flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-md text-xs sm:text-sm hover:bg-gray-100 dark:hover:bg-gray-800 ${
            pathname === "/admin/spaces" ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" : ""
          }`}
        >
          <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          Manage Spaces
        </Link>
        <Link
          href="/admin/analytics"
          className={`flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-md text-xs sm:text-sm hover:bg-gray-100 dark:hover:bg-gray-800 ${
            pathname === "/admin/analytics" ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" : ""
          }`}
        >
          <PieChart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          Analytics
        </Link>
        <Link
          href="/admin/settings"
          className={`flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-md text-xs sm:text-sm hover:bg-gray-100 dark:hover:bg-gray-800 ${
            pathname === "/admin/settings" ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" : ""
          }`}
        >
          <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          Settings
        </Link>
      </div>
      {onLogout && (
        <div className="pt-3 sm:pt-4 border-t">
          <Button
            variant="destructive"
            className="w-full justify-start text-xs sm:text-sm font-medium shadow-sm hover:bg-red-600 dark:hover:bg-red-600"
            onClick={onLogout}
            disabled={isLoggingOut}
          >
            <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
            {isLoggingOut ? "Signing out..." : "Sign out"}
          </Button>
        </div>
      )}
    </>
  )
} 