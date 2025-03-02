"use client"

import { useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, AlertCircle, Clock } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface NotificationPanelProps {
  onClose: () => void
}

// Mock notifications - replace with actual data from your backend
const mockNotifications = [
  {
    id: 1,
    title: "Reservation Approved",
    message: "Your reservation for Basketball Practice on March 15 has been approved.",
    type: "success",
    date: "2 hours ago",
  },
  {
    id: 2,
    title: "Reservation Rejected",
    message: "Your reservation for Debate Club Meeting on April 5 has been rejected. Reason: Venue unavailable.",
    type: "error",
    date: "1 day ago",
  },
  {
    id: 3,
    title: "Reservation Modified",
    message: "Your reservation for Chess Tournament has been modified. New time: 11:00-14:00.",
    type: "warning",
    date: "3 days ago",
  },
]

export function NotificationPanel({ onClose }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState(mockNotifications)

  const clearAllNotifications = () => {
    setNotifications([])
  }

  const getIconForType = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      default:
        return <AlertCircle className="h-5 w-5" />
    }
  }

  return (
    <Sheet open={true} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader className="flex flex-row items-center justify-between">
          <SheetTitle>Notifications</SheetTitle>
          {notifications.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAllNotifications}>
              Clear all
            </Button>
          )}
        </SheetHeader>
        <Tabs defaultValue="all" className="mt-6">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="thisWeek">This Week</TabsTrigger>
          </TabsList>
          <TabsContent value="all">
            <div className="space-y-4">
              {notifications.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No notifications</p>
              ) : (
                notifications.map((notification) => (
                  <div key={notification.id} className="flex gap-3 border-b pb-3">
                    <div className="mt-0.5">{getIconForType(notification.type)}</div>
                    <div className="flex-1">
                      <h4 className="font-medium">{notification.title}</h4>
                      <p className="text-sm text-muted-foreground">{notification.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        <span>
                          <Clock className="h-4 w-4 inline mr-1" />
                          {notification.date}
                        </span>
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
          <TabsContent value="today">
            <p>Today's notifications will be displayed here.</p>
          </TabsContent>
          <TabsContent value="thisWeek">
            <p>This week's notifications will be displayed here.</p>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}

