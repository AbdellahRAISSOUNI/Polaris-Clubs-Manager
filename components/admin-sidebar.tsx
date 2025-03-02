"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Home, Calendar, Users, MapPin, PieChart, Settings, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AdminSidebarProps {
  onLogout?: () => void;
  isLoggingOut?: boolean;
}

export function AdminSidebar({ onLogout, isLoggingOut = false }: AdminSidebarProps) {
  const pathname = usePathname()

  return (
    <>
      <div className="flex-1 space-y-1">
        <Link
          href="/admin/dashboard"
          className={`flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 ${
            pathname === "/admin/dashboard" ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" : ""
          }`}
        >
          <Home className="h-4 w-4" />
          Dashboard
        </Link>
        <Link
          href="/admin/all-reservations"
          className={`flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 ${
            pathname === "/admin/all-reservations" ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" : ""
          }`}
        >
          <Calendar className="h-4 w-4" />
          All Reservations
        </Link>
        <Link
          href="/admin/clubs"
          className={`flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 ${
            pathname === "/admin/clubs" ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" : ""
          }`}
        >
          <Users className="h-4 w-4" />
          Manage Clubs
        </Link>
        <Link
          href="/admin/spaces"
          className={`flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 ${
            pathname === "/admin/spaces" ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" : ""
          }`}
        >
          <MapPin className="h-4 w-4" />
          Manage Spaces
        </Link>
        <Link
          href="/admin/analytics"
          className={`flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 ${
            pathname === "/admin/analytics" ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" : ""
          }`}
        >
          <PieChart className="h-4 w-4" />
          Analytics
        </Link>
        <Link
          href="/admin/settings"
          className={`flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 ${
            pathname === "/admin/settings" ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" : ""
          }`}
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
      </div>
      {onLogout && (
        <div className="pt-4 border-t">
          <Button
            variant="destructive"
            className="w-full justify-start font-medium shadow-sm hover:bg-red-600 dark:hover:bg-red-600"
            onClick={onLogout}
            disabled={isLoggingOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            {isLoggingOut ? "Signing out..." : "Sign out"}
          </Button>
        </div>
      )}
    </>
  )
} 