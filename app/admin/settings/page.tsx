"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AdminLayout } from "@/components/admin-layout"
import { AlertCircle, Linkedin, Eye, EyeOff, Upload, Calendar as CalendarIcon, Pencil, Trash2 } from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getAdminId, storeAdminId, storeIsAdmin } from "@/lib/storage"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import type { TimePeriod, TimePeriodType } from "@/lib/time-periods-client"

export default function SettingsPage() {
  const [adminInfo, setAdminInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [currentAdminId, setCurrentAdminId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const [periodsLoading, setPeriodsLoading] = useState(false)
  const [mandates, setMandates] = useState<TimePeriod[]>([])
  const [academicYears, setAcademicYears] = useState<TimePeriod[]>([])
  const [periodsTab, setPeriodsTab] = useState<TimePeriodType>("mandate")

  const [periodDialogOpen, setPeriodDialogOpen] = useState(false)
  const [editingPeriod, setEditingPeriod] = useState<TimePeriod | null>(null)
  const [periodName, setPeriodName] = useState("")
  const [periodStartDate, setPeriodStartDate] = useState<Date | undefined>(undefined)
  const [periodEndDate, setPeriodEndDate] = useState<Date | undefined>(undefined)
  const [periodSaving, setPeriodSaving] = useState(false)
  const [periodSaveError, setPeriodSaveError] = useState<string | null>(null)

  // Use useEffect to safely access localStorage on the client side only
  useEffect(() => {
    setCurrentAdminId(getAdminId())
  }, [])

  useEffect(() => {
    async function fetchAdminInfo() {
      try {
        setLoading(true)
        const adminId = getAdminId()
        console.log("Retrieved adminId:", adminId)
        
        if (!adminId) {
          console.error("No admin ID found")
          return
        }
        
        console.log("Fetching admin data with ID:", adminId)
        const response = await fetch(`/api/users?id=${adminId}`)
        
        if (!response.ok) {
          console.error("Error fetching admin info:", response.statusText)
          return
        }
        
        const data = await response.json()
        console.log("Admin data retrieved:", data)
        setAdminInfo(data)
      } catch (error) {
        console.error("Error in fetchAdminInfo:", error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchAdminInfo()
  }, [])

  const adminHeaders = (adminId: string | null) => ({
    "Content-Type": "application/json",
    "x-user-type": "admin",
    ...(adminId ? { "x-user-id": adminId } : {}),
  })

  const fetchTimePeriods = async (adminId: string | null) => {
    setPeriodsLoading(true)
    try {
      const [mandatesRes, yearsRes] = await Promise.all([
        fetch("/api/time-periods?type=mandate"),
        fetch("/api/time-periods?type=academicYear"),
      ])
      const mandatesData = mandatesRes.ok ? await mandatesRes.json() : []
      const yearsData = yearsRes.ok ? await yearsRes.json() : []
      setMandates(mandatesData || [])
      setAcademicYears(yearsData || [])
    } catch (e: any) {
      console.error("Error fetching time periods:", e)
      toast({
        title: "Error",
        description: e?.message || "Failed to load time periods",
        variant: "destructive",
      })
    } finally {
      setPeriodsLoading(false)
    }
  }

  useEffect(() => {
    // Load periods after we know admin ID (for future-proofing admin-only behavior)
    fetchTimePeriods(currentAdminId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAdminId])

  const openCreatePeriod = (type: TimePeriodType) => {
    setPeriodsTab(type)
    setEditingPeriod(null)
    setPeriodName("")
    setPeriodStartDate(undefined)
    setPeriodEndDate(undefined)
    setPeriodSaveError(null)
    setPeriodDialogOpen(true)
  }

  const openEditPeriod = (type: TimePeriodType, period: TimePeriod) => {
    setPeriodsTab(type)
    setEditingPeriod(period)
    setPeriodName(period.name)
    setPeriodStartDate(period.start_date ? new Date(period.start_date) : undefined)
    setPeriodEndDate(period.end_date ? new Date(period.end_date) : undefined)
    setPeriodSaveError(null)
    setPeriodDialogOpen(true)
  }

  const savePeriod = async () => {
    setPeriodSaving(true)
    setPeriodSaveError(null)
    try {
      if (!periodName.trim()) throw new Error("Name is required")
      if (!periodStartDate || !periodEndDate) throw new Error("Start and end dates are required")
      if (periodEndDate <= periodStartDate) throw new Error("End date must be after start date")

      const payload = {
        type: periodsTab,
        name: periodName.trim(),
        start_date: periodStartDate.toISOString(),
        end_date: periodEndDate.toISOString(),
      }

      if (editingPeriod) {
        const res = await fetch(`/api/time-periods/${editingPeriod.id}`, {
          method: "PUT",
          headers: adminHeaders(currentAdminId),
          body: JSON.stringify({
            name: payload.name,
            start_date: payload.start_date,
            end_date: payload.end_date,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || "Failed to update period")
        toast({ title: "Saved", description: "Time period updated successfully" })
      } else {
        const res = await fetch("/api/time-periods", {
          method: "POST",
          headers: adminHeaders(currentAdminId),
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || "Failed to create period")
        toast({ title: "Created", description: "Time period created successfully" })
      }

      setPeriodDialogOpen(false)
      await fetchTimePeriods(currentAdminId)
    } catch (e: any) {
      const rawMessage = e?.message || "Failed to save time period"
      const overlapHint = rawMessage.startsWith("Overlaps with existing period")
        ? `${rawMessage}\nTip: academic years cannot overlap. Mandates are allowed to overlap.`
        : rawMessage
      setPeriodSaveError(overlapHint)
      toast({
        title: "Error",
        description: rawMessage,
        variant: "destructive",
      })
    } finally {
      setPeriodSaving(false)
    }
  }

  const deletePeriod = async (period: TimePeriod) => {
    try {
      if (!window.confirm(`Delete "${period.name}"? This cannot be undone.`)) return
      const res = await fetch(`/api/time-periods/${period.id}`, {
        method: "DELETE",
        headers: adminHeaders(currentAdminId),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to delete period")
      toast({ title: "Deleted", description: "Time period deleted successfully" })
      await fetchTimePeriods(currentAdminId)
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.message || "Failed to delete time period",
        variant: "destructive",
      })
    }
  }

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)
      const file = e.target.files?.[0]
      if (!file) return

      const adminId = getAdminId()
      if (!adminId) {
        toast({
          title: "Error",
          description: "Admin ID not found. Please try logging in again.",
          variant: "destructive",
        })
        return
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Only images (JPEG, PNG, GIF, WebP) are allowed.')
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024 // 10MB
      if (file.size > maxSize) {
        throw new Error('File size too large. Maximum size is 10MB.')
      }

      // Upload to Cloudinary via API
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`/api/users/${adminId}/avatar`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to upload avatar')
      }

      const data = await response.json()

      // Update local state
      setAdminInfo(prev => ({
        ...prev,
        avatar_url: data.url
      }))

      toast({
        title: "Success",
        description: "Profile picture updated successfully",
      })
    } catch (error: any) {
      console.error('Error uploading profile picture:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to upload profile picture",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6 p-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Account Settings</h1>
          <p className="text-muted-foreground">Manage your account credentials</p>
        </div>

        {/* Debug button - only visible in development */}
        {process.env.NODE_ENV === 'development' && (
          <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 mb-4">
            <CardHeader>
              <CardTitle className="text-sm">Debug Tools</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                <p className="text-xs text-muted-foreground">Current Admin ID: {currentAdminId || 'None'}</p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/users?role=admin');
                      
                      if (!response.ok) {
                        console.error("Error fetching admin:", response.statusText);
                        return;
                      }
                      
                      const data = await response.json();
                      if (data && data.length > 0) {
                        console.log("Setting admin ID to:", data[0].id);
                        storeAdminId(data[0].id);
                        storeIsAdmin(true);
                        window.location.reload();
                      }
                    } catch (err) {
                      console.error("Error setting admin ID:", err);
                    }
                  }}
                >
                  Set Admin ID from Database
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
            <CardDescription>Upload or change your profile picture</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={adminInfo?.avatar_url || "/placeholder.svg"} alt="Profile" />
                <AvatarFallback>AD</AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-4">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureUpload}
                  disabled={uploading}
                  className="w-full max-w-xs"
                />
                <p className="text-sm text-muted-foreground">
                  Recommended: Square image, at least 128x128px
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>View your admin account details</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-4">
                <div className="animate-pulse h-32 w-full bg-gray-200 dark:bg-gray-800 rounded-md"></div>
              </div>
            ) : adminInfo ? (
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="admin-name">Admin Name</Label>
                  <Input 
                    id="admin-name" 
                    value={adminInfo.name || "N/A"} 
                    readOnly 
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    value={adminInfo.email || "N/A"} 
                    readOnly 
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input 
                      id="password" 
                      type={showPassword ? "text" : "password"} 
                      value={adminInfo.password || "••••••••"} 
                      readOnly 
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                      <span className="sr-only">
                        {showPassword ? "Hide password" : "Show password"}
                      </span>
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground">
                Unable to load admin information
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Time Periods</CardTitle>
            <CardDescription>Create and manage ADE mandates and academic years</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={periodsTab} onValueChange={(v) => setPeriodsTab(v as TimePeriodType)}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <TabsList className="w-full sm:w-auto">
                  <TabsTrigger value="mandate">Mandats ADE</TabsTrigger>
                  <TabsTrigger value="academicYear">Années scolaires</TabsTrigger>
                </TabsList>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchTimePeriods(currentAdminId)}
                    disabled={periodsLoading}
                  >
                    Refresh
                  </Button>
                  <Button size="sm" onClick={() => openCreatePeriod(periodsTab)}>
                    Create
                  </Button>
                </div>
              </div>

              <TabsContent value="mandate" className="mt-4">
                <div className="space-y-2">
                  {mandates.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No mandates yet.</p>
                  ) : (
                    mandates.map((p) => (
                      <div key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border rounded-md p-3">
                        <div className="min-w-0">
                          <div className="font-medium truncate">{p.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(p.start_date).toLocaleDateString()} → {new Date(p.end_date).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex gap-2 self-end sm:self-auto">
                          <Button variant="outline" size="sm" onClick={() => openEditPeriod("mandate", p)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => deletePeriod(p)}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="academicYear" className="mt-4">
                <div className="space-y-2">
                  {academicYears.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No academic years yet.</p>
                  ) : (
                    academicYears.map((p) => (
                      <div key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border rounded-md p-3">
                        <div className="min-w-0">
                          <div className="font-medium truncate">{p.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(p.start_date).toLocaleDateString()} → {new Date(p.end_date).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex gap-2 self-end sm:self-auto">
                          <Button variant="outline" size="sm" onClick={() => openEditPeriod("academicYear", p)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => deletePeriod(p)}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Work in Progress
            </CardTitle>
            <CardDescription>
              This feature is currently under development
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              The settings page is still in progress. More settings options will be available soon.
            </p>
            
            <div className="rounded-lg bg-muted p-4">
              <h3 className="text-sm font-medium mb-2">Contact Information</h3>
              <p className="text-sm text-muted-foreground mb-3">
                For account changes, please contact Abdellah Raissouni
              </p>
              <Button asChild variant="outline" size="sm" className="gap-2">
                <Link href="https://www.linkedin.com/in/abdellah-raissouni/" target="_blank" rel="noopener noreferrer">
                  <Linkedin className="h-4 w-4" />
                  LinkedIn Profile
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Dialog open={periodDialogOpen} onOpenChange={setPeriodDialogOpen}>
          <DialogContent className="sm:max-w-[520px]">
            <DialogHeader>
              <DialogTitle>{editingPeriod ? "Edit time period" : "Create time period"}</DialogTitle>
              <DialogDescription>
                {periodsTab === "mandate" ? "Define an ADE mandate date range." : "Define an academic year date range."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {periodSaveError && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300 whitespace-pre-line">
                  {periodSaveError}
                </div>
              )}
              <div className="grid gap-2">
                <Label>Name</Label>
                <Input value={periodName} onChange={(e) => setPeriodName(e.target.value)} placeholder="e.g. Mandate 2025, 2025/2026" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Start date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn("justify-start text-left font-normal", !periodStartDate && "text-muted-foreground")}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {periodStartDate ? format(periodStartDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent mode="single" selected={periodStartDate} onSelect={setPeriodStartDate} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="grid gap-2">
                  <Label>End date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn("justify-start text-left font-normal", !periodEndDate && "text-muted-foreground")}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {periodEndDate ? format(periodEndDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent mode="single" selected={periodEndDate} onSelect={setPeriodEndDate} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setPeriodDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={savePeriod} disabled={periodSaving}>
                {periodSaving ? "Saving..." : editingPeriod ? "Save" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}

