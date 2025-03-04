"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AdminLayout } from "@/components/admin-layout"
import { AlertCircle, Linkedin, Eye, EyeOff, Upload } from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import { getAdminId, storeAdminId, storeIsAdmin } from "@/lib/storage"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "@/components/ui/use-toast"

export default function SettingsPage() {
  const [adminInfo, setAdminInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [currentAdminId, setCurrentAdminId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

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
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', adminId)
          .eq('role', 'admin')
          .single()
          
        if (error) {
          console.error("Error fetching admin info:", error)
          return
        }
        
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

      // Upload file to Supabase storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${adminId}.${fileExt}`
      const filePath = `admin-profiles/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('admin-profiles')
        .upload(filePath, file, { upsert: true })

      if (uploadError) {
        throw uploadError
      }

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('admin-profiles')
        .getPublicUrl(filePath)

      // Update the user record with the new avatar URL
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: urlData.publicUrl })
        .eq('id', adminId)

      if (updateError) {
        throw updateError
      }

      // Update local state
      setAdminInfo(prev => ({
        ...prev,
        avatar_url: urlData.publicUrl
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
                      const { data, error } = await supabase
                        .from('users')
                        .select('*')
                        .eq('role', 'admin')
                        .limit(1);
                        
                      if (error) {
                        console.error("Error fetching admin:", error);
                        return;
                      }
                      
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
      </div>
    </AdminLayout>
  )
}

