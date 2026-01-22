"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, MoreHorizontal, Mail, Key, UserPlus, Edit, Trash2, CheckCircle, XCircle, Plus, X, Users, CalendarPlus, Clock, ChevronDown } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { AdminLayout } from "@/components/admin-layout"
import { toast } from "@/components/ui/use-toast"
import { successNotification, errorNotification, warningNotification } from "@/lib/notifications"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { motion, AnimatePresence } from "framer-motion"

interface Club {
  id: string;
  name: string;
  description: string;
  email: string;
  logo: string | null;
  status: 'active' | 'inactive';
  last_login: string | null;
  members: number;
  created_at: string;
  password: string;
}

export default function ClubsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [showAddClub, setShowAddClub] = useState(false)
  const [showResetPassword, setShowResetPassword] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [selectedClub, setSelectedClub] = useState<Club | null>(null)
  const [clubs, setClubs] = useState<Club[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [clubLogo, setClubLogo] = useState<File | null>(null)
  const [clubPassword, setClubPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [selectedClubs, setSelectedClubs] = useState<Set<string>>(new Set())
  const [isBulkActionLoading, setIsBulkActionLoading] = useState(false)
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false)

  // Fetch clubs from MongoDB
  useEffect(() => {
    const fetchClubs = async () => {
      setIsLoading(true)
      try {
        const response = await fetch('/api/clubs')
        if (!response.ok) throw new Error('Failed to fetch clubs')
        
        const data = await response.json()
        setClubs(data || [])
      } catch (error: any) {
        console.error('Error fetching clubs:', error.message)
        errorNotification({
          title: "Error Loading Clubs",
          description: "Failed to load clubs. Please try again."
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchClubs()
  }, [])

  // Filter clubs based on search
  const filteredClubs = clubs.filter(
    (club) =>
      club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      club.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Bulk action handlers
  const handleBulkClubAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedClubs.size === 0) return

    setIsBulkActionLoading(true)
    try {
      if (action === 'delete') {
        const response = await fetch('/api/clubs/bulk', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clubIds: Array.from(selectedClubs) }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to delete clubs')
        }

        const result = await response.json()
        successNotification({
          title: "Bulk Delete Successful",
          description: result.message || `Successfully deleted ${selectedClubs.size} club(s)`
        })
      } else {
        const response = await fetch('/api/clubs/bulk', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clubIds: Array.from(selectedClubs),
            action,
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to perform bulk action')
        }

        const result = await response.json()
        successNotification({
          title: "Bulk Action Successful",
          description: result.message || `Successfully ${action === 'activate' ? 'activated' : 'deactivated'} ${selectedClubs.size} club(s)`
        })
      }

      // Clear selection and refresh
      setSelectedClubs(new Set())
      setShowBulkDeleteConfirm(false)
      // Refresh clubs
      const response = await fetch('/api/clubs')
      if (response.ok) {
        const data = await response.json()
        setClubs(data || [])
      }
    } catch (error: any) {
      console.error('Error performing bulk action:', error)
      errorNotification({
        title: "Bulk Action Failed",
        description: error.message || 'Failed to perform bulk action'
      })
    } finally {
      setIsBulkActionLoading(false)
    }
  }

  const toggleClubSelection = (clubId: string) => {
    setSelectedClubs(prev => {
      const newSet = new Set(prev)
      if (newSet.has(clubId)) {
        newSet.delete(clubId)
      } else {
        newSet.add(clubId)
      }
      return newSet
    })
  }

  const toggleSelectAllClubs = () => {
    if (selectedClubs.size === filteredClubs.length) {
      setSelectedClubs(new Set())
    } else {
      setSelectedClubs(new Set(filteredClubs.map(c => c.id)))
    }
  }

  // Reset form state when opening/closing dialogs
  useEffect(() => {
    if (!showAddClub) {
      setSelectedClub(null)
      setClubLogo(null)
      setClubPassword("")
      setConfirmPassword("")
    }
  }, [showAddClub])

  // Handle file upload to Cloudinary
  const uploadLogo = async (file: File, clubId: string) => {
    try {
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

      const response = await fetch(`/api/clubs/${clubId}/image`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to upload logo')
      }

      const data = await response.json()
      return data.url // Return the Cloudinary URL
    } catch (error: any) {
      console.error('Error in uploadLogo:', error.message)
      throw error
    }
  }

  // Add or edit club
  const handleAddClub = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const form = e.target as HTMLFormElement
    const formData = new FormData(form)
    
    const clubData = {
      name: formData.get('club-name') as string,
      description: formData.get('club-description') as string,
      email: formData.get('club-email') as string,
      status: formData.get('club-status') as 'active' | 'inactive' || 'active',
      members: parseInt(formData.get('club-members') as string) || 0,
    }
    
    try {
      if (selectedClub) {
        // Update existing club
        let logoUrl = selectedClub.logo
        
        // Upload new logo if provided
        if (clubLogo) {
          try {
            const newLogoUrl = await uploadLogo(clubLogo, selectedClub.id)
            if (newLogoUrl) {
              logoUrl = newLogoUrl
            }
          } catch (logoError: any) {
            console.error('Logo upload error during update:', logoError)
            errorNotification({
              title: "Logo Upload Failed",
              description: logoError.message || "Failed to upload logo. Club updated without logo."
            })
            // Continue with club update even if logo upload fails
          }
        }
        
        const response = await fetch(`/api/clubs?id=${selectedClub.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...clubData,
            logo: logoUrl,
          }),
        })
        
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to update club')
        }
        
        successNotification({
          title: "Club Updated",
          description: `${clubData.name} has been updated successfully.`
        })
        
        // Refresh clubs list
        const refreshResponse = await fetch('/api/clubs')
        const refreshedData = await refreshResponse.json()
        setClubs(refreshedData || [])
        
        // Reset form and close dialog
        setSelectedClub(null)
        setShowAddClub(false)
      } else {
        // Create new club
        if (!clubPassword) {
          errorNotification({
            title: "Password Required",
            description: "Password is required for new clubs"
          })
          return
        }
        
        if (clubPassword !== confirmPassword) {
          errorNotification({
            title: "Password Mismatch",
            description: "Passwords do not match"
          })
          return
        }
        
        // Check if email already exists
        const checkResponse = await fetch('/api/clubs')
        const allClubs = await checkResponse.json()
        const existingClub = allClubs.find((c: any) => c.email === clubData.email)
        
        if (existingClub) {
          errorNotification({
            title: "Email Already Exists",
            description: "A club with this email already exists"
          })
          return
        }
        
        // Create new club
        const response = await fetch('/api/clubs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...clubData,
            password: clubPassword, // In a real app, you'd hash this password
          }),
        })
        
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to create club')
        }
        
        const data = await response.json()
        
        successNotification({
          title: "Club Created",
          description: `${clubData.name} has been created successfully.`
        })
        
        // Upload logo if provided
        if (clubLogo && data && data.id) {
          try {
            const logoUrl = await uploadLogo(clubLogo, data.id)
            
            if (logoUrl) {
              // Update club with logo URL
              await fetch(`/api/clubs?id=${data.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ logo: logoUrl }),
              })
            }
          } catch (logoError: any) {
            console.error('Logo upload/update error:', logoError)
            errorNotification({
              title: "Logo Upload Failed",
              description: logoError.message || "Failed to upload logo. Club created without logo."
            })
            // Continue anyway, the club is created
          }
        }
        
        // Refresh clubs list
        const refreshResponse = await fetch('/api/clubs')
        const refreshedData = await refreshResponse.json()
        setClubs(refreshedData || [])
        
        // Reset form and close dialog
        setSelectedClub(null)
        setShowAddClub(false)
        setClubPassword("")
        setConfirmPassword("")
        setClubLogo(null)
      }
    } catch (error: any) {
      console.error('Error saving club:', error.message)
      errorNotification({
        title: "Error Saving Club",
        description: error.message || "Failed to save club"
      })
    }
  }

  // Reset club password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedClub) return
    
    if (clubPassword !== confirmPassword) {
      errorNotification({
        title: "Password Mismatch",
        description: "Passwords do not match"
      })
      return
    }
    
    try {
      const response = await fetch(`/api/clubs?id=${selectedClub.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: clubPassword, // In a real app, you'd hash this password
        }),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to reset password')
      }
      
      successNotification({
        title: "Password Reset",
        description: "Password reset successfully"
      })
      
      setShowResetPassword(false)
      setSelectedClub(null)
      setClubPassword("")
      setConfirmPassword("")
    } catch (error: any) {
      console.error('Error resetting password:', error.message)
      errorNotification({
        title: "Error Resetting Password",
        description: error.message || "Failed to reset password"
      })
    }
  }

  // Delete club
  const handleDeleteClub = async () => {
    if (!selectedClub) return
    
    try {
      const response = await fetch(`/api/clubs/${selectedClub.id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete club')
      }
      
      // Remove from local state
      setClubs(clubs.filter(club => club.id !== selectedClub.id))
      
      successNotification({
        title: "Club Deleted",
        description: `"${selectedClub.name}" has been deleted successfully.`
      })
      
      setShowDeleteConfirm(false)
      setSelectedClub(null)
    } catch (error: any) {
      console.error('Error deleting club:', error.message)
      errorNotification({
        title: "Error Deleting Club",
        description: error.message || "Failed to delete club"
      })
    }
  }

  // Handle logo file selection
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setClubLogo(e.target.files[0])
    }
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 pb-8 sm:pb-12 overflow-x-hidden">
        <div className="flex flex-col gap-4 sm:gap-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6"
          >
            <div>
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
                Club Management
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
                Manage club accounts and access
              </p>
            </div>
            <motion.div 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
              className="w-full sm:w-auto"
            >
              <Button 
                onClick={() => setShowAddClub(true)} 
                className="w-full sm:w-auto gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-apple hover:shadow-apple-lg border-0 transition-apple text-sm sm:text-base font-semibold h-11 sm:h-10 px-6 sm:px-4"
              >
                <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Add New Club</span>
              </Button>
            </motion.div>
          </motion.div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card className="liquid-glass shadow-apple border-0 rounded-3xl hover-lift overflow-hidden">
                <CardContent className="p-5 sm:p-6">
                  <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <h3 className="text-sm font-medium">Total Clubs</h3>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <div className="text-2xl font-bold">{clubs.length}</div>
                    <p className="text-xs text-muted-foreground">registered clubs</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Card className="liquid-glass shadow-apple border-0 rounded-3xl hover-lift overflow-hidden">
                <CardContent className="p-5 sm:p-6">
                  <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <h3 className="text-sm font-medium">Active Clubs</h3>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <div className="text-2xl font-bold">{clubs.filter(club => club.status === 'active').length}</div>
                    <p className="text-xs text-muted-foreground">currently active</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <Card className="liquid-glass shadow-apple border-0 rounded-3xl hover-lift overflow-hidden">
                <CardContent className="p-5 sm:p-6">
                  <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <h3 className="text-sm font-medium">Total Members</h3>
                    <UserPlus className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <div className="text-2xl font-bold">{clubs.reduce((acc, club) => acc + (club.members || 0), 0)}</div>
                    <p className="text-xs text-muted-foreground">across all clubs</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              <Card className="liquid-glass shadow-apple border-0 rounded-3xl hover-lift overflow-hidden">
                <CardContent className="p-5 sm:p-6">
                  <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <h3 className="text-sm font-medium">New This Month</h3>
                    <CalendarPlus className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <div className="text-2xl font-bold">
                      {clubs.filter(club => {
                        const createdDate = new Date(club.created_at);
                        const now = new Date();
                        return createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear();
                      }).length}
                    </div>
                    <p className="text-xs text-muted-foreground">clubs added</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Bulk Actions Toolbar */}
          <AnimatePresence>
            {selectedClubs.size > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="mb-4 sm:mb-6"
              >
                <Card className="glass shadow-apple-lg border-0 rounded-3xl">
                  <CardContent className="p-3 sm:p-4 flex flex-wrap items-center gap-2 sm:gap-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Badge variant="secondary" className="text-xs sm:text-sm glass border-0 shadow-apple">
                        {selectedClubs.size} selected
                      </Badge>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedClubs(new Set())}
                          className="h-7 sm:h-8 text-xs rounded-2xl"
                        >
                          Clear
                        </Button>
                      </motion.div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleBulkClubAction('activate')}
                          disabled={isBulkActionLoading}
                          className="h-8 sm:h-9 text-xs sm:text-sm rounded-2xl glass border-0 shadow-apple hover:shadow-apple-lg transition-apple"
                        >
                          {isBulkActionLoading ? (
                            <div className="h-3 w-3 sm:h-4 sm:w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-1 sm:mr-2" />
                          ) : (
                            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-green-600" />
                          )}
                          Activate
                        </Button>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleBulkClubAction('deactivate')}
                          disabled={isBulkActionLoading}
                          className="h-8 sm:h-9 text-xs sm:text-sm rounded-2xl glass border-0 shadow-apple hover:shadow-apple-lg transition-apple"
                        >
                          {isBulkActionLoading ? (
                            <div className="h-3 w-3 sm:h-4 sm:w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-1 sm:mr-2" />
                          ) : (
                            <XCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-red-600" />
                          )}
                          Deactivate
                        </Button>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setShowBulkDeleteConfirm(true)}
                          disabled={isBulkActionLoading}
                          className="h-8 sm:h-9 text-xs sm:text-sm rounded-2xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-apple hover:shadow-apple-lg border-0 transition-apple"
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          Delete
                        </Button>
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          <Card id="clubs-section" className="glass shadow-apple-lg border-0 rounded-3xl overflow-hidden">
            <CardHeader className="border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-br from-gray-50/50 to-white/50 dark:from-gray-900/50 dark:to-gray-800/50 backdrop-blur-xl p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <div>
                  <CardTitle className="text-xl sm:text-2xl font-semibold tracking-tight">Registered Clubs</CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-1">View and manage club accounts</CardDescription>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:flex-none sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                    <Input
                      placeholder="Search clubs..."
                      className="pl-10 h-10 sm:h-11 rounded-2xl border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-apple transition-apple focus:bg-white dark:focus:bg-gray-900/90"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex justify-center items-center py-12 sm:py-16">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 dark:border-gray-600 border-t-gray-900 dark:border-t-gray-100"></div>
                </div>
              ) : (
                <div className="relative">
                  {/* Desktop Table Header */}
                  <div className="hidden md:block sticky top-0 border-b border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-10">
                    <div className="grid grid-cols-7 gap-4 p-4 text-xs sm:text-sm font-medium text-muted-foreground">
                      <div className="w-10">
                        <Checkbox
                          checked={selectedClubs.size > 0 && selectedClubs.size === filteredClubs.length}
                          onCheckedChange={toggleSelectAllClubs}
                        />
                      </div>
                      <div className="col-span-2">Club</div>
                      <div>Status</div>
                      <div>Last Login</div>
                      <div>Description</div>
                      <div className="text-right">Actions</div>
                    </div>
                  </div>
                  
                  {/* Mobile/Desktop List */}
                  <div className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
                    <AnimatePresence mode="popLayout">
                      {filteredClubs.map((club, index) => {
                        const isSelected = selectedClubs.has(club.id)
                        return (
                          <motion.div
                            key={club.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            className={`md:grid md:grid-cols-7 gap-3 sm:gap-4 p-3 sm:p-4 transition-apple rounded-2xl mx-2 sm:mx-0 mb-2 sm:mb-0 ${
                              isSelected ? 'bg-blue-50/50 dark:bg-blue-950/20 ring-2 ring-blue-500/30 dark:ring-blue-400/30' : 'bg-white/50 dark:bg-gray-900/30 hover:bg-gray-50/50 dark:hover:bg-gray-900/40'
                            }`}
                          >
                            {/* Desktop: Checkbox in first column */}
                            <div className="hidden md:flex w-10 items-center">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleClubSelection(club.id)}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                            
                            {/* Mobile: Top row with checkbox and avatar */}
                            <div className="md:hidden flex items-center gap-3 mb-3">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleClubSelection(club.id)}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <Avatar className="h-12 w-12 ring-2 ring-white/50 dark:ring-gray-800/50 flex-shrink-0">
                                <AvatarImage src={`/api/clubs/${club.id}/image`} alt={club.name} />
                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                                  {club.name.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-base text-foreground truncate">{club.name}</p>
                                <p className="text-xs text-muted-foreground flex items-center gap-1 truncate mt-0.5">
                                  <Mail className="h-3 w-3 flex-shrink-0" />
                                  <span className="truncate">{club.email}</span>
                                </p>
                              </div>
                            </div>
                            
                            {/* Desktop: Club info in columns 2-3 */}
                            <div className="hidden md:flex col-span-2 items-center gap-3">
                              <Avatar className="h-10 w-10 sm:h-12 sm:w-12 ring-2 ring-white/50 dark:ring-gray-800/50">
                                <AvatarImage src={`/api/clubs/${club.id}/image`} alt={club.name} />
                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                                  {club.name.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-sm sm:text-base text-foreground truncate">{club.name}</p>
                                <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1 truncate">
                                  <Mail className="h-3 w-3 flex-shrink-0" />
                                  <span className="truncate">{club.email}</span>
                                </p>
                              </div>
                            </div>
                            
                            {/* Mobile: Status and Last Login row */}
                            <div className="md:hidden flex items-center justify-between mb-2">
                              <div>
                                {club.status === "active" ? (
                                  <Badge variant="default" className="glass border-0 shadow-apple flex w-fit items-center gap-1 bg-green-500/15 text-green-600 dark:text-green-400">
                                    <CheckCircle className="h-3 w-3" />
                                    Active
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="glass border-0 shadow-apple flex w-fit items-center gap-1 bg-gray-500/15 text-gray-600 dark:text-gray-400">
                                    <XCircle className="h-3 w-3" />
                                    Inactive
                                  </Badge>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3 flex-shrink-0" />
                                <span>{club.last_login ? new Date(club.last_login).toLocaleDateString() : "Never"}</span>
                              </div>
                            </div>
                            
                            {/* Mobile: Description */}
                            <div className="md:hidden text-xs text-muted-foreground line-clamp-2 mb-3">
                              {club.description || "No description provided"}
                            </div>
                            
                            {/* Mobile: Actions row */}
                            <div className="md:hidden flex items-center justify-end">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                    <Button variant="ghost" size="icon" className="rounded-2xl glass border-0 shadow-apple hover:shadow-apple-lg transition-apple h-9 w-9">
                                      <MoreHorizontal className="h-4 w-4" />
                                      <span className="sr-only">Open menu</span>
                                    </Button>
                                  </motion.div>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 glass-strong border-0 shadow-apple-lg rounded-2xl">
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedClub(club)
                                      setShowAddClub(true)
                                    }}
                                    className="gap-2 rounded-xl"
                                  >
                                    <Edit className="h-4 w-4" />
                                    Edit Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedClub(club)
                                      setClubPassword("")
                                      setConfirmPassword("")
                                      setShowResetPassword(true)
                                    }}
                                    className="gap-2 rounded-xl"
                                  >
                                    <Key className="h-4 w-4" />
                                    Reset Password
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="text-red-600 dark:text-red-400 gap-2 rounded-xl"
                                    onClick={() => {
                                      setSelectedClub(club)
                                      setShowDeleteConfirm(true)
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    Delete Club
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            
                            {/* Desktop: Status column */}
                            <div className="hidden md:block">
                              {club.status === "active" ? (
                                <Badge variant="default" className="glass border-0 shadow-apple flex w-fit items-center gap-1 bg-green-500/15 text-green-600 dark:text-green-400">
                                  <CheckCircle className="h-3 w-3" />
                                  Active
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="glass border-0 shadow-apple flex w-fit items-center gap-1 bg-gray-500/15 text-gray-600 dark:text-gray-400">
                                  <XCircle className="h-3 w-3" />
                                  Inactive
                                </Badge>
                              )}
                            </div>
                            
                            {/* Desktop: Last Login column */}
                            <div className="hidden md:block text-xs sm:text-sm text-muted-foreground">
                              {club.last_login ? (
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3 flex-shrink-0" />
                                  <span className="truncate">{new Date(club.last_login).toLocaleDateString()}</span>
                                </div>
                              ) : (
                                "Never"
                              )}
                            </div>
                            
                            {/* Desktop: Description column */}
                            <div className="hidden md:block text-xs sm:text-sm text-muted-foreground line-clamp-2">
                              {club.description || "No description provided"}
                            </div>
                            
                            {/* Desktop: Actions column */}
                            <div className="hidden md:block text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                    <Button variant="ghost" size="icon" className="rounded-2xl glass border-0 shadow-apple hover:shadow-apple-lg transition-apple">
                                      <MoreHorizontal className="h-4 w-4" />
                                      <span className="sr-only">Open menu</span>
                                    </Button>
                                  </motion.div>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 glass-strong border-0 shadow-apple-lg rounded-2xl">
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedClub(club)
                                      setShowAddClub(true)
                                    }}
                                    className="gap-2 rounded-xl"
                                  >
                                    <Edit className="h-4 w-4" />
                                    Edit Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedClub(club)
                                      setClubPassword("")
                                      setConfirmPassword("")
                                      setShowResetPassword(true)
                                    }}
                                    className="gap-2 rounded-xl"
                                  >
                                    <Key className="h-4 w-4" />
                                    Reset Password
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="text-red-600 dark:text-red-400 gap-2 rounded-xl"
                                    onClick={() => {
                                      setSelectedClub(club)
                                      setShowDeleteConfirm(true)
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    Delete Club
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </motion.div>
                        )
                      })}
                    </AnimatePresence>

                    {filteredClubs.length === 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="p-8 sm:p-12 text-center"
                      >
                        <div className="mx-auto w-fit rounded-full bg-muted p-3 sm:p-4 mb-3 sm:mb-4">
                          <Search className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground font-medium mb-1 text-sm sm:text-base">No clubs found</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">Try adjusting your search query</p>
                      </motion.div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add/Edit Club Dialog */}
          <Dialog open={showAddClub} onOpenChange={(open) => {
            setShowAddClub(open)
            if (!open) {
              setSelectedClub(null)
            }
          }}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto p-0 glass-strong border-0 rounded-3xl shadow-apple-lg">
              <form onSubmit={handleAddClub}>
                <DialogHeader className="relative bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 backdrop-blur-xl p-5 sm:p-6 border-b border-gray-200/50 dark:border-gray-700/50">
                  <DialogTitle className="bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent text-xl sm:text-2xl">
                    {selectedClub ? "Edit Club" : "Add New Club"}
                  </DialogTitle>
                  <DialogDescription className="text-xs sm:text-sm mt-2">
                    {selectedClub
                      ? "Edit the club details below."
                      : "Create a new club account. The club will be able to login with these credentials."}
                  </DialogDescription>
                </DialogHeader>

                <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent p-5 sm:p-6" style={{ WebkitOverflowScrolling: 'touch' }}>
                  <div className="grid gap-4 sm:gap-5">
                    <div className="grid gap-2">
                      <Label htmlFor="club-name" className="text-xs sm:text-sm">Club Name</Label>
                      <Input 
                        id="club-name" 
                        name="club-name"
                        defaultValue={selectedClub?.name} 
                        placeholder="Enter club name"
                        className="rounded-2xl glass border-0 shadow-apple h-10 sm:h-11"
                        required 
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="club-description" className="text-xs sm:text-sm">Description</Label>
                      <Textarea
                        id="club-description"
                        name="club-description"
                        defaultValue={selectedClub?.description}
                        placeholder="Brief description of the club"
                        rows={3}
                        className="rounded-2xl glass border-0 shadow-apple resize-none"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="club-email" className="text-xs sm:text-sm">Primary Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                        <Input
                          id="club-email"
                          name="club-email"
                          type="email"
                          defaultValue={selectedClub?.email}
                          className="pl-10 rounded-2xl glass border-0 shadow-apple h-10 sm:h-11"
                          placeholder="club@example.com"
                          required
                        />
                      </div>
                    </div>

                    {!selectedClub && (
                      <div className="grid gap-2">
                        <Label htmlFor="club-password" className="text-xs sm:text-sm">Password</Label>
                        <div className="relative">
                          <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                          <Input
                            id="club-password"
                            type="password"
                            className="pl-10 rounded-2xl glass border-0 shadow-apple h-10 sm:h-11"
                            placeholder="Set password"
                            value={clubPassword}
                            onChange={(e) => setClubPassword(e.target.value)}
                            required={!selectedClub}
                          />
                        </div>
                      </div>
                    )}

                    {!selectedClub && (
                      <div className="grid gap-2">
                        <Label htmlFor="confirm-password" className="text-xs sm:text-sm">Confirm Password</Label>
                        <div className="relative">
                          <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                          <Input
                            id="confirm-password"
                            type="password"
                            className="pl-10 rounded-2xl glass border-0 shadow-apple h-10 sm:h-11"
                            placeholder="Confirm password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required={!selectedClub}
                          />
                        </div>
                      </div>
                    )}

                    <div className="grid gap-2">
                      <Label htmlFor="club-logo" className="text-xs sm:text-sm">Club Logo</Label>
                      <Input 
                        id="club-logo" 
                        type="file" 
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="rounded-2xl glass border-0 shadow-apple"
                      />
                      {selectedClub?.logo && !clubLogo && (
                        <div className="mt-2 flex items-center gap-2">
                          <img 
                            src={selectedClub.logo} 
                            alt="Current logo" 
                            className="h-8 w-8 sm:h-10 sm:w-10 rounded-full object-cover ring-2 ring-white/50 dark:ring-gray-800/50"
                          />
                          <span className="text-xs text-muted-foreground">Current logo</span>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">Optional. Maximum file size: 10MB</p>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="club-status" className="text-xs sm:text-sm">Status</Label>
                      <select 
                        id="club-status" 
                        name="club-status"
                        className="flex h-10 sm:h-11 w-full rounded-2xl glass border-0 shadow-apple px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl"
                        defaultValue={selectedClub?.status || "active"}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="club-members" className="text-xs sm:text-sm">Number of Members</Label>
                      <Input 
                        id="club-members" 
                        name="club-members"
                        type="number"
                        min="0"
                        defaultValue={selectedClub?.members || 0} 
                        placeholder="Enter number of members"
                        className="rounded-2xl glass border-0 shadow-apple h-10 sm:h-11"
                      />
                      <p className="text-xs text-muted-foreground">Specify the total number of members in this club</p>
                    </div>
                  </div>
                </div>

                <DialogFooter className="p-5 sm:p-6 border-t border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-br from-gray-50/50 to-white/50 dark:from-gray-900/50 dark:to-gray-800/50 backdrop-blur-xl">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setSelectedClub(null)
                        setShowAddClub(false)
                      }}
                      className="rounded-2xl glass border-0 shadow-apple hover:shadow-apple-lg transition-apple"
                    >
                      Cancel
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button 
                      type="submit"
                      className="rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-apple hover:shadow-apple-lg border-0 transition-apple"
                    >
                      {selectedClub ? "Save Changes" : "Create Club"}
                    </Button>
                  </motion.div>
                </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

          {/* Reset Password Dialog */}
          <Dialog open={showResetPassword} onOpenChange={setShowResetPassword}>
            <DialogContent className="p-0 glass-strong border-0 rounded-3xl shadow-apple-lg max-w-md">
              <form onSubmit={handleResetPassword}>
                <DialogHeader className="relative bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 backdrop-blur-xl p-5 sm:p-6 border-b border-gray-200/50 dark:border-gray-700/50">
                  <DialogTitle className="bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent text-xl sm:text-2xl">
                    Reset Club Password
                  </DialogTitle>
                  <DialogDescription className="text-xs sm:text-sm mt-2">
                    Set a new password for {selectedClub?.name}.
                  </DialogDescription>
                </DialogHeader>

                <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent p-5 sm:p-6" style={{ WebkitOverflowScrolling: 'touch' }}>
                  <div className="grid gap-4 sm:gap-5">
                    <div className="grid gap-2">
                      <Label htmlFor="current-password" className="text-xs sm:text-sm">Current Password</Label>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                        <Input 
                          id="current-password" 
                          type="text" 
                          className="pl-10 font-mono text-xs sm:text-sm rounded-2xl glass border-0 shadow-apple h-10 sm:h-11"
                          value={selectedClub?.password || ""}
                          readOnly
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">This is the current stored password</p>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="new-password" className="text-xs sm:text-sm">New Password</Label>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                        <Input 
                          id="new-password" 
                          type="password" 
                          className="pl-10 rounded-2xl glass border-0 shadow-apple h-10 sm:h-11"
                          placeholder="Enter new password" 
                          value={clubPassword}
                          onChange={(e) => setClubPassword(e.target.value)}
                          required 
                        />
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="confirm-password-reset" className="text-xs sm:text-sm">Confirm New Password</Label>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                        <Input
                          id="confirm-password-reset"
                          type="password"
                          className="pl-10 rounded-2xl glass border-0 shadow-apple h-10 sm:h-11"
                          placeholder="Confirm new password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <DialogFooter className="p-5 sm:p-6 border-t border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-br from-gray-50/50 to-white/50 dark:from-gray-900/50 dark:to-gray-800/50 backdrop-blur-xl">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setSelectedClub(null)
                        setShowResetPassword(false)
                      }}
                      className="rounded-2xl glass border-0 shadow-apple hover:shadow-apple-lg transition-apple"
                    >
                      Cancel
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button 
                      type="submit"
                      className="rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-apple hover:shadow-apple-lg border-0 transition-apple"
                    >
                      Reset Password
                    </Button>
                  </motion.div>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
            <AlertDialogContent className="glass-strong border-0 rounded-3xl shadow-apple-lg">
              <AlertDialogHeader>
                <AlertDialogTitle className="bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent text-base sm:text-lg">
                  Are you sure?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-sm">
                  This will permanently delete the club "{selectedClub?.name}" and all associated data.
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                <AlertDialogCancel 
                  onClick={() => setSelectedClub(null)}
                  className="rounded-2xl glass border-0 shadow-apple mt-0"
                >
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDeleteClub} 
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-2xl shadow-apple hover:shadow-apple-lg border-0 transition-apple"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Bulk Delete Confirmation Dialog */}
          <AlertDialog open={showBulkDeleteConfirm} onOpenChange={setShowBulkDeleteConfirm}>
            <AlertDialogContent className="glass-strong border-0 rounded-3xl shadow-apple-lg">
              <AlertDialogHeader>
                <AlertDialogTitle className="bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent text-base sm:text-lg">
                  Delete {selectedClubs.size} Club(s)?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-sm">
                  Are you sure you want to delete {selectedClubs.size} club(s)? This action cannot be undone.
                  Clubs with active reservations cannot be deleted. All associated data will be permanently removed.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                <AlertDialogCancel 
                  disabled={isBulkActionLoading}
                  className="rounded-2xl glass border-0 shadow-apple mt-0"
                >
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleBulkClubAction('delete')}
                  disabled={isBulkActionLoading}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-2xl shadow-apple hover:shadow-apple-lg border-0 transition-apple"
                >
                  {isBulkActionLoading ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Deleting...
                    </>
                  ) : (
                    'Delete All'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          {/* Mobile Scroll to Clubs Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
            className="fixed bottom-6 right-4 sm:hidden z-50"
          >
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Button
                onClick={() => {
                  const clubsSection = document.getElementById('clubs-section')
                  if (clubsSection) {
                    clubsSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }
                }}
                className="h-14 w-14 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-apple-lg hover:shadow-apple-lg border-0 transition-apple flex items-center justify-center"
                size="icon"
              >
                <ChevronDown className="h-6 w-6" />
                <span className="sr-only">Scroll to clubs</span>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </AdminLayout>
  )
}

