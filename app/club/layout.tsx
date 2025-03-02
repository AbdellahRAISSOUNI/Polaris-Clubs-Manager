"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Calendar, Home, Settings, Menu, X, LogOut } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { toast } from "sonner"
import { clearStorage, getClubId } from "@/lib/storage"
import { supabase } from "@/lib/supabase"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Club {
  id: string
  name: string
  logo: string | null
}

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  {
    href: "/club/dashboard",
    label: "Dashboard",
    icon: <Home className="h-4 w-4" />
  },
  {
    href: "/club/reservations",
    label: "My Reservations",
    icon: <Calendar className="h-4 w-4" />
  },
  {
    href: "/club/all-reservations",
    label: "All Clubs Calendar",
    icon: <Calendar className="h-4 w-4" />
  },
  {
    href: "/club/settings",
    label: "Settings",
    icon: <Settings className="h-4 w-4" />
  }
]

export default function ClubLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [club, setClub] = useState<Club | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchClubData = async () => {
      const clubId = getClubId()
      if (!clubId) {
        router.push("/")
        return
      }

      try {
        const { data, error } = await supabase
          .from("clubs")
          .select("id, name, logo")
          .eq("id", clubId)
          .single()

        if (error) throw error
        setClub(data)
      } catch (error) {
        console.error("Error fetching club data:", error)
        toast.error("Failed to load club data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchClubData()
  }, [router])

  const handleLogout = () => {
    clearStorage()
    toast.success("Logged out successfully")
    router.push("/")
  }

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 ${
                isActive ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" : ""
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          )
        })}
      </div>
      <div className="mt-auto pt-4">
        <Button
          variant="ghost"
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
      {/* Mobile Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-white dark:bg-gray-950 lg:hidden">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link href="/club/dashboard" className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage 
                src={club?.logo ? `/api/clubs/${club.id}/image` : undefined}
                alt={club?.name || "Club logo"}
              />
              <AvatarFallback>
                {club?.name?.charAt(0) || "C"}
              </AvatarFallback>
            </Avatar>
            <span className="font-semibold">{club?.name || "Loading..."}</span>
          </Link>
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-4">
              <div className="flex items-center gap-2 mb-6">
                <Avatar className="h-8 w-8">
                  <AvatarImage 
                    src={club?.logo ? `/api/clubs/${club.id}/image` : undefined}
                    alt={club?.name || "Club logo"}
                  />
                  <AvatarFallback>
                    {club?.name?.charAt(0) || "C"}
                  </AvatarFallback>
                </Avatar>
                <span className="font-semibold">{club?.name || "Loading..."}</span>
              </div>
              <div className="h-[calc(100vh-5rem)]">
                <NavContent />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <aside className="w-64 border-r bg-white dark:bg-gray-950 hidden lg:block p-4 fixed h-screen">
          <div className="flex items-center gap-2 mb-6">
            <Avatar className="h-8 w-8">
              <AvatarImage 
                src={club?.logo ? `/api/clubs/${club.id}/image` : undefined}
                alt={club?.name || "Club logo"}
              />
              <AvatarFallback>
                {club?.name?.charAt(0) || "C"}
              </AvatarFallback>
            </Avatar>
            <span className="font-semibold">{club?.name || "Loading..."}</span>
          </div>
          <div className="h-[calc(100vh-5rem)]">
            <NavContent />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:pl-64">
          {children}
        </main>
      </div>
    </div>
  )
} 