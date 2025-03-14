import {
  Home,
  Calendar,
  Users,
  Settings,
  Bell,
  MessageSquare,
  Contact,
} from "lucide-react"

export const adminNavItems = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: Home,
  },
  {
    title: "Reservations",
    href: "/admin/all-reservations",
    icon: Calendar,
  },
  {
    title: "Clubs",
    href: "/admin/clubs",
    icon: Users,
  },
  {
    title: "Messages",
    href: "/admin/messages",
    icon: MessageSquare,
  },
  {
    title: "Notifications",
    href: "/admin/notifications",
    icon: Bell,
  },
  {
    title: "Contact",
    href: "/admin/contact",
    icon: Contact,
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
]

export const clubNavItems = [
  {
    title: "Dashboard",
    href: "/club",
    icon: Home,
  },
  {
    title: "Reservations",
    href: "/club/reservations",
    icon: Calendar,
  },
  {
    title: "Messages",
    href: "/club/messages",
    icon: MessageSquare,
  },
  {
    title: "Notifications",
    href: "/club/notifications",
    icon: Bell,
  },
  {
    title: "Contact",
    href: "/club/contact",
    icon: Contact,
  },
  {
    title: "Settings",
    href: "/club/settings",
    icon: Settings,
  },
] 