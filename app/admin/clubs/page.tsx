"use client"

import type React from "react"

import { useState, useEffect } from "react"
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
import { Search, MoreHorizontal, Mail, Key, UserPlus, Edit, Trash2, CheckCircle, XCircle, Plus, X, Users, CalendarPlus, Clock } from "lucide-react"
import { AdminLayout } from "@/components/admin-layout"
import { supabase } from "@/lib/supabase"
import { toast } from "@/components/ui/use-toast"
import { successNotification, errorNotification, warningNotification } from "@/lib/notifications"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

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

  // Fetch clubs from Supabase
  useEffect(() => {
    const fetchClubs = async () => {
      setIsLoading(true)
      try {
        const { data, error } = await supabase
          .from('clubs')
          .select('*')
          .order('name')
        
        if (error) throw error
        
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

  // Reset form state when opening/closing dialogs
  useEffect(() => {
    if (!showAddClub) {
      setSelectedClub(null)
      setClubLogo(null)
      setClubPassword("")
      setConfirmPassword("")
    }
  }, [showAddClub])

  // Handle file upload
  const uploadLogo = async (file: File, clubId: string) => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${clubId}.${fileExt}`
      const filePath = `club-logos/${fileName}`
      
      // Create a public URL even if upload fails
      const { data: urlData } = supabase.storage.from('clubs').getPublicUrl(filePath)
      
      try {
        const { error: uploadError } = await supabase.storage
          .from('clubs')
          .upload(filePath, file, { upsert: true })
        
        if (uploadError) {
          console.error('Logo upload error:', uploadError)
          // Return the URL anyway - we'll update the database but the image might not be available
          warningNotification({
            title: "Logo Upload Failed",
            description: "Club created but logo upload failed. You can try again later."
          })
        }
      } catch (uploadErr) {
        console.error('Logo upload exception:', uploadErr)
        // Continue with club creation even if logo upload fails
      }
      
      return urlData.publicUrl
    } catch (error: any) {
      console.error('Error in uploadLogo:', error.message)
      // Return null instead of throwing, so club creation can continue
      return null
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
          } catch (logoError) {
            console.error('Logo upload error during update:', logoError)
            // Continue with club update even if logo upload fails
          }
        }
        
        const { error } = await supabase
          .from('clubs')
          .update({
            ...clubData,
            logo: logoUrl,
          })
          .eq('id', selectedClub.id)
        
        if (error) {
          if (error.code === '23505') {
            throw new Error('A club with this email already exists')
          }
          throw error
        }
        
        successNotification({
          title: "Club Updated",
          description: `${clubData.name} has been updated successfully.`
        })
        
        // Refresh clubs list
        const { data } = await supabase.from('clubs').select('*').order('name')
        setClubs(data || [])
        
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
        const { data: existingClub, error: checkError } = await supabase
          .from('clubs')
          .select('id')
          .eq('email', clubData.email)
          .single()
        
        if (existingClub) {
          errorNotification({
            title: "Email Already Exists",
            description: "A club with this email already exists"
          })
          return
        }
        
        // Insert new club
        const { data, error } = await supabase
          .from('clubs')
          .insert({
            ...clubData,
            password: clubPassword, // In a real app, you'd hash this password
          })
          .select()
        
        if (error) {
          if (error.code === '23505') {
            throw new Error('A club with this email already exists')
          }
          throw error
        }
        
        successNotification({
          title: "Club Created",
          description: `${clubData.name} has been created successfully.`
        })
        
        // Upload logo if provided
        if (clubLogo && data && data[0]) {
          try {
            const logoUrl = await uploadLogo(clubLogo, data[0].id)
            
            if (logoUrl) {
              // Update club with logo URL
              const { error: updateError } = await supabase
                .from('clubs')
                .update({ logo: logoUrl })
                .eq('id', data[0].id)
              
              if (updateError) {
                console.error('Error updating club with logo URL:', updateError)
                // Continue anyway, the club is created
              }
            }
          } catch (logoError) {
            console.error('Logo upload/update error:', logoError)
            // Continue anyway, the club is created
          }
        }
        
        // Refresh clubs list
        const { data: refreshedData } = await supabase.from('clubs').select('*').order('name')
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
      const { error } = await supabase
        .from('clubs')
        .update({
          password: clubPassword, // In a real app, you'd hash this password
        })
        .eq('id', selectedClub.id)
      
      if (error) throw error
      
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
      const { error } = await supabase
        .from('clubs')
        .delete()
        .eq('id', selectedClub.id)
      
      if (error) throw error
      
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Club Management</h1>
          <p className="text-muted-foreground">Manage club accounts and access</p>
        </div>
        <Button onClick={() => setShowAddClub(true)} className="w-full sm:w-auto gap-2">
          <Plus className="h-4 w-4" />
          Add New Club
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
              <h3 className="text-xs sm:text-sm font-medium">Total Clubs</h3>
              <Users className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-muted-foreground" />
            </div>
            <div className="flex items-baseline gap-1 sm:gap-2">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold">{clubs.length}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">registered clubs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
              <h3 className="text-xs sm:text-sm font-medium">Active Clubs</h3>
              <CheckCircle className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-muted-foreground" />
            </div>
            <div className="flex items-baseline gap-1 sm:gap-2">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold">{clubs.filter(club => club.status === 'active').length}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">currently active</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
              <h3 className="text-xs sm:text-sm font-medium">Total Members</h3>
              <UserPlus className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-muted-foreground" />
            </div>
            <div className="flex items-baseline gap-1 sm:gap-2">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold">{clubs.reduce((acc, club) => acc + (club.members || 0), 0)}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">across all clubs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
              <h3 className="text-xs sm:text-sm font-medium">New This Month</h3>
              <CalendarPlus className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-muted-foreground" />
            </div>
            <div className="flex items-baseline gap-1 sm:gap-2">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold">
                {clubs.filter(club => {
                  const createdDate = new Date(club.created_at);
                  const now = new Date();
                  return createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear();
                }).length}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">clubs added</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="border-b bg-muted/40 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Registered Clubs</CardTitle>
              <CardDescription>View and manage club accounts</CardDescription>
            </div>
            <div className="w-full sm:w-64">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search clubs..."
                  className="pl-8 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
            </div>
          ) : (
            <div className="relative">
              <div className="hidden sm:block sticky top-0 border-b bg-muted/50 backdrop-blur-sm">
                <div className="grid grid-cols-6 gap-4 p-4 text-sm font-medium text-muted-foreground">
                  <div className="col-span-2">Club</div>
                  <div>Status</div>
                  <div>Last Login</div>
                  <div>Description</div>
                  <div className="text-right">Actions</div>
                </div>
              </div>
              <div className="divide-y">
                {filteredClubs.map((club) => (
                  <div key={club.id} className="grid grid-cols-1 sm:grid-cols-6 gap-2 sm:gap-4 p-4 items-start sm:items-center hover:bg-muted/50 transition-colors">
                    <div className="col-span-1 sm:col-span-2 flex items-center gap-3">
                      <Avatar className="h-10 w-10 border">
                        <AvatarImage src={club.logo || ""} alt={club.name} />
                        <AvatarFallback className="bg-primary/10">{club.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground">{club.name}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {club.email}
                        </p>
                      </div>
                      <div className="sm:hidden">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="hover:bg-muted">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedClub(club)
                                setShowAddClub(true)
                              }}
                              className="gap-2"
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
                              className="gap-2"
                            >
                              <Key className="h-4 w-4" />
                              Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600 dark:text-red-400 gap-2"
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
                    </div>
                    
                    <div className="sm:hidden space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          {club.status === "active" ? (
                            <Badge variant="default" className="flex w-fit items-center gap-1 bg-green-500/15 text-green-600 hover:bg-green-500/25 hover:text-green-600">
                              <CheckCircle className="h-3 w-3" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="flex w-fit items-center gap-1 bg-gray-500/15 text-gray-600 hover:bg-gray-500/25 hover:text-gray-600">
                              <XCircle className="h-3 w-3" />
                              Inactive
                            </Badge>
                          )}
                        </div>
                        <div className="text-muted-foreground">
                          {club.last_login ? (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(club.last_login).toLocaleDateString()}
                            </div>
                          ) : (
                            "Never logged in"
                          )}
                        </div>
                      </div>
                      <div className="text-muted-foreground">
                        {club.description || "No description provided"}
                      </div>
                    </div>

                    <div className="hidden sm:block">
                      {club.status === "active" ? (
                        <Badge variant="default" className="flex w-fit items-center gap-1 bg-green-500/15 text-green-600 hover:bg-green-500/25 hover:text-green-600">
                          <CheckCircle className="h-3 w-3" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="flex w-fit items-center gap-1 bg-gray-500/15 text-gray-600 hover:bg-gray-500/25 hover:text-gray-600">
                          <XCircle className="h-3 w-3" />
                          Inactive
                        </Badge>
                      )}
                    </div>
                    <div className="hidden sm:block text-sm text-muted-foreground">
                      {club.last_login ? (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(club.last_login).toLocaleDateString()}
                        </div>
                      ) : (
                        "Never"
                      )}
                    </div>
                    <div className="hidden sm:block text-sm text-muted-foreground line-clamp-2">
                      {club.description || "No description provided"}
                    </div>
                    <div className="hidden sm:block text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="hover:bg-muted">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedClub(club)
                              setShowAddClub(true)
                            }}
                            className="gap-2"
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
                            className="gap-2"
                          >
                            <Key className="h-4 w-4" />
                            Reset Password
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600 dark:text-red-400 gap-2"
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
                  </div>
                ))}

                {filteredClubs.length === 0 && (
                  <div className="p-8 text-center">
                    <div className="mx-auto w-fit rounded-full bg-muted p-3 mb-3">
                      <Search className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground font-medium mb-1">No clubs found</p>
                    <p className="text-sm text-muted-foreground">Try adjusting your search query</p>
                  </div>
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
        <DialogContent className="max-w-md w-[95%] sm:w-full max-h-[85vh] sm:max-h-[90vh] overflow-y-auto p-3 sm:p-6">
          <form onSubmit={handleAddClub} className="space-y-4 sm:space-y-6">
            <DialogHeader className="space-y-2">
              <DialogTitle className="text-lg sm:text-xl">{selectedClub ? "Edit Club" : "Add New Club"}</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                {selectedClub
                  ? "Edit the club details below."
                  : "Create a new club account. The club will be able to login with these credentials."}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 sm:gap-4">
              <div className="grid gap-1.5 sm:gap-2">
                <Label htmlFor="club-name" className="text-xs sm:text-sm font-medium">Club Name</Label>
                <Input 
                  id="club-name" 
                  name="club-name"
                  defaultValue={selectedClub?.name} 
                  placeholder="Enter club name" 
                  required 
                  className="h-8 sm:h-10 text-sm"
                />
              </div>

              <div className="grid gap-1.5 sm:gap-2">
                <Label htmlFor="club-description" className="text-xs sm:text-sm font-medium">Description</Label>
                <Textarea
                  id="club-description"
                  name="club-description"
                  defaultValue={selectedClub?.description}
                  placeholder="Brief description of the club"
                  rows={2}
                  className="min-h-[50px] sm:min-h-[80px] text-sm"
                />
              </div>

              <div className="grid gap-1.5 sm:gap-2">
                <Label htmlFor="club-email" className="text-xs sm:text-sm font-medium">Primary Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-2 top-1.5 sm:top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="club-email"
                    name="club-email"
                    type="email"
                    defaultValue={selectedClub?.email}
                    className="pl-8 h-8 sm:h-10 text-sm"
                    placeholder="club@example.com"
                    required
                  />
                </div>
              </div>

              {!selectedClub && (
                <>
                  <div className="grid gap-1.5 sm:gap-2">
                    <Label htmlFor="club-password" className="text-xs sm:text-sm font-medium">Password</Label>
                    <div className="relative">
                      <Key className="absolute left-2 top-1.5 sm:top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="club-password"
                        type="password"
                        className="pl-8 h-8 sm:h-10 text-sm"
                        placeholder="Set password"
                        value={clubPassword}
                        onChange={(e) => setClubPassword(e.target.value)}
                        required={!selectedClub}
                      />
                    </div>
                  </div>

                  <div className="grid gap-1.5 sm:gap-2">
                    <Label htmlFor="confirm-password" className="text-xs sm:text-sm font-medium">Confirm Password</Label>
                    <div className="relative">
                      <Key className="absolute left-2 top-1.5 sm:top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirm-password"
                        type="password"
                        className="pl-8 h-8 sm:h-10 text-sm"
                        placeholder="Confirm password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required={!selectedClub}
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="grid gap-1.5 sm:gap-2">
                <Label htmlFor="club-logo" className="text-xs sm:text-sm font-medium">Club Logo</Label>
                <Input 
                  id="club-logo" 
                  type="file" 
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="h-8 sm:h-10 text-xs sm:text-sm"
                />
                {selectedClub?.logo && !clubLogo && (
                  <div className="mt-1 flex items-center gap-2">
                    <img 
                      src={selectedClub.logo} 
                      alt="Current logo" 
                      className="h-6 w-6 sm:h-8 sm:w-8 rounded-full object-cover"
                    />
                    <span className="text-[10px] sm:text-xs text-muted-foreground">Current logo</span>
                  </div>
                )}
                <p className="text-[10px] sm:text-xs text-muted-foreground">Optional. Maximum file size: 2MB</p>
              </div>

              <div className="grid gap-1.5 sm:gap-2">
                <Label htmlFor="club-status" className="text-xs sm:text-sm font-medium">Status</Label>
                <select 
                  id="club-status" 
                  name="club-status"
                  className="h-8 sm:h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  defaultValue={selectedClub?.status || "active"}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="grid gap-1.5 sm:gap-2">
                <Label htmlFor="club-members" className="text-xs sm:text-sm font-medium">Number of Members</Label>
                <Input 
                  id="club-members" 
                  name="club-members"
                  type="number"
                  min="0"
                  defaultValue={selectedClub?.members || 0} 
                  placeholder="Enter number of members"
                  className="h-8 sm:h-10 text-sm" 
                />
                <p className="text-[10px] sm:text-xs text-muted-foreground">Specify the total number of members in this club</p>
              </div>
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0 pt-2 sm:pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSelectedClub(null)
                  setShowAddClub(false)
                }}
                className="w-full sm:w-auto order-1 sm:order-none h-8 sm:h-10 text-xs sm:text-sm"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="w-full sm:w-auto h-8 sm:h-10 text-xs sm:text-sm"
              >
                {selectedClub ? "Save Changes" : "Create Club"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={showResetPassword} onOpenChange={setShowResetPassword}>
        <DialogContent className="max-w-md w-[95%] sm:w-full p-3 sm:p-6">
          <form onSubmit={handleResetPassword} className="space-y-4 sm:space-y-6">
            <DialogHeader className="space-y-2">
              <DialogTitle className="text-lg sm:text-xl">Reset Club Password</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Set a new password for {selectedClub?.name}.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 sm:gap-4">
              <div className="grid gap-1.5 sm:gap-2">
                <Label htmlFor="current-password" className="text-xs sm:text-sm font-medium">Current Password</Label>
                <div className="relative">
                  <Key className="absolute left-2 top-1.5 sm:top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="current-password" 
                    type="text" 
                    className="pl-8 font-mono text-xs sm:text-sm h-8 sm:h-10"
                    value={selectedClub?.password || ""}
                    readOnly
                  />
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground">This is the current stored password</p>
              </div>

              <div className="grid gap-1.5 sm:gap-2">
                <Label htmlFor="new-password" className="text-xs sm:text-sm font-medium">New Password</Label>
                <div className="relative">
                  <Key className="absolute left-2 top-1.5 sm:top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="new-password" 
                    type="password" 
                    className="pl-8 h-8 sm:h-10 text-sm" 
                    placeholder="Enter new password" 
                    value={clubPassword}
                    onChange={(e) => setClubPassword(e.target.value)}
                    required 
                  />
                </div>
              </div>

              <div className="grid gap-1.5 sm:gap-2">
                <Label htmlFor="confirm-password" className="text-xs sm:text-sm font-medium">Confirm New Password</Label>
                <div className="relative">
                  <Key className="absolute left-2 top-1.5 sm:top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirm-password"
                    type="password"
                    className="pl-8 h-8 sm:h-10 text-sm"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0 pt-2 sm:pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSelectedClub(null)
                  setShowResetPassword(false)
                }}
                className="w-full sm:w-auto order-1 sm:order-none h-8 sm:h-10 text-xs sm:text-sm"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="w-full sm:w-auto h-8 sm:h-10 text-xs sm:text-sm"
              >
                Reset Password
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="w-[95%] sm:w-full p-3 sm:p-6">
          <AlertDialogHeader className="space-y-2">
            <AlertDialogTitle className="text-lg sm:text-xl">Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm">
              This will permanently delete the club "{selectedClub?.name}" and all associated data.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
            <AlertDialogCancel 
              onClick={() => setSelectedClub(null)}
              className="w-full sm:w-auto order-1 sm:order-none h-8 sm:h-10 text-xs sm:text-sm"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteClub} 
              className="w-full sm:w-auto h-8 sm:h-10 text-xs sm:text-sm bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  )
}

