"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, ExternalLink } from "lucide-react"
import { getClubId } from "@/lib/storage"
import { supabase } from "@/lib/supabase"

export default function SettingsPage() {
  const [clubInfo, setClubInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    async function fetchClubInfo() {
      try {
        setLoading(true)
        const clubId = getClubId()
        
        if (!clubId) {
          console.error("No club ID found")
          return
        }
        
        const { data, error } = await supabase
          .from('clubs')
          .select('*')
          .eq('id', clubId)
          .single()
          
        if (error) {
          console.error("Error fetching club info:", error)
          return
        }
        
        setClubInfo(data)
      } catch (error) {
        console.error("Error in fetchClubInfo:", error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchClubInfo()
  }, [])

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Account Settings</h1>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>View your account details</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-4">
                <div className="animate-pulse h-32 w-full bg-gray-200 dark:bg-gray-800 rounded-md"></div>
              </div>
            ) : clubInfo ? (
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="club-name">Club Name</Label>
                  <Input 
                    id="club-name" 
                    value={clubInfo.name || "N/A"} 
                    readOnly 
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    value={clubInfo.email || "N/A"} 
                    readOnly 
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input 
                      id="password" 
                      type={showPassword ? "text" : "password"} 
                      value={clubInfo.password || "••••••••"} 
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
                Unable to load club information
              </p>
            )}
          </CardContent>
        </Card>
        
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle>Development Notice</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg text-muted-foreground mb-4">
              This page is currently under development. More settings options will be available soon.
            </p>
            <p className="text-muted-foreground mb-4">
              Abdellah Raissouni is working on making it awesome! 🚀
            </p>
            <a 
              href="https://www.linkedin.com/in/abdellah-raissouni/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline"
            >
              Connect on LinkedIn <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 