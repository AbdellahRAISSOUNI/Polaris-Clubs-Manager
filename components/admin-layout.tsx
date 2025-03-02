"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Filter, ShieldCheck, LogOut } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { AdminSidebar } from "@/components/admin-sidebar"
import { ThemeToggle } from "@/components/ui/theme-toggle"

interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()

  // Check if mobile on mount
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkIfMobile()
    window.addEventListener("resize", checkIfMobile)

    return () => {
      window.removeEventListener("resize", checkIfMobile)
    }
  }, [])

  // Force re-render on client side
  useEffect(() => {
    // This empty effect ensures the component re-renders on the client side
    // which will make sure all navigation links are properly displayed
  }, [])

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account."
      })
      
      router.push("/")
    } catch (err: any) {
      toast({
        title: "Error logging out",
        description: err.message,
        variant: "destructive"
      })
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-950 border-b sticky top-0 z-30">
        <div className="container flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            {isMobile && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Filter className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left">
                  <div className="py-4 space-y-4">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <h2 className="text-lg font-semibold">Admin Portal</h2>
                    </div>
                    <AdminSidebar onLogout={handleLogout} isLoggingOut={isLoggingOut} />
                  </div>
                </SheetContent>
              </Sheet>
            )}
            <Link href="/admin/dashboard" className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h1 className="text-lg font-semibold hidden sm:inline-block">Admin Portal</h1>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder.svg?height=32&width=32" alt="Admin" />
                    <AvatarFallback>AD</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/admin/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-red-600 dark:text-red-500 font-medium"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {isLoggingOut ? "Signing out..." : "Sign out"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar - hidden on mobile */}
        <aside className="w-64 border-r bg-white dark:bg-gray-950 hidden md:block p-4 flex flex-col">
          <div className="flex-1">
            <AdminSidebar onLogout={handleLogout} isLoggingOut={isLoggingOut} />
          </div>
        </aside>

        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}

