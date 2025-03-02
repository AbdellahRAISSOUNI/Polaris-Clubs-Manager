"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { storeClubId, storeIsAdmin } from "@/lib/storage"
import { supabase } from "@/lib/supabase"
import { toast } from "@/components/ui/use-toast"
import { AlertCircle, CheckCircle, Loader2, LogIn } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Link from "next/link"

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [clubEmail, setClubEmail] = useState("")
  const [clubPassword, setClubPassword] = useState("")
  const [adminEmail, setAdminEmail] = useState("")
  const [adminPassword, setAdminPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const handleClubLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)
    
    try {
      if (!clubEmail.trim()) {
        throw new Error('Please enter your club email')
      }
      
      if (!clubPassword.trim()) {
        throw new Error('Please enter your password')
      }
      
      // Find club by primary email only
      const { data: clubs, error: clubError } = await supabase
        .from('clubs')
        .select('*')
        .eq('email', clubEmail)
        .eq('status', 'active')
        .single()
      
      if (clubError) {
        if (clubError.code === 'PGRST116') {
          throw new Error('Club not found. Please check your email and try again.')
        } else {
          throw new Error(`Database error: ${clubError.message}`)
        }
      }
      
      if (!clubs) {
        throw new Error('Club not found or inactive. Please contact an administrator.')
      }
      
      // Verify password (in a real app, you'd use proper password hashing)
      if (clubs.password !== clubPassword) {
        throw new Error('Invalid password. Please try again.')
      }
      
      // Update last login time
      await supabase
        .from('clubs')
        .update({ last_login: new Date().toISOString() })
        .eq('id', clubs.id)
      
      // Store club info and redirect
      storeClubId(clubs.id)
      storeIsAdmin(false)
      
      setSuccess(`Welcome back, ${clubs.name}!`)
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${clubs.name}!`,
        variant: "default",
      })
      
      // Short delay to show success message before redirecting
      setTimeout(() => {
        router.push("/club/dashboard")
      }, 1000)
    } catch (error: any) {
      console.error('Login error:', error.message)
      setError(error.message || "Invalid email or password")
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)
    
    try {
      if (!adminEmail.trim()) {
        throw new Error('Please enter your admin email')
      }
      
      if (!adminPassword.trim()) {
        throw new Error('Please enter your password')
      }
      
      // In a real app, you'd implement proper admin authentication
      // For now, we'll just check if the user exists in the users table with role 'admin'
      const { data: admin, error: adminError } = await supabase
        .from('users')
        .select('*')
        .eq('email', adminEmail)
        .eq('role', 'admin')
        .single()
      
      if (adminError) {
        if (adminError.code === 'PGRST116') {
          throw new Error('Admin account not found. Please check your email and try again.')
        } else {
          throw new Error(`Database error: ${adminError.message}`)
        }
      }
      
      if (!admin) {
        throw new Error('Admin not found. Please check your credentials.')
      }
      
      // In a real app, you'd verify the password properly
      // For demo purposes, we'll just check if it matches the stored password
      if (admin.password !== adminPassword) {
        throw new Error('Invalid password. Please try again.')
      }
      
      storeIsAdmin(true)
      
      setSuccess(`Welcome back, ${admin.name || 'Admin'}!`)
      
      toast({
        title: "Admin login successful",
        description: `Welcome back, ${admin.name || 'Admin'}!`,
        variant: "default",
      })
      
      // Short delay to show success message before redirecting
      setTimeout(() => {
        router.push("/admin/dashboard")
      }, 1000)
    } catch (error: any) {
      console.error('Admin login error:', error.message)
      setError(error.message || "Invalid email or password")
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-950 opacity-70"></div>
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-blue-200/30 dark:bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-80 h-80 bg-indigo-200/30 dark:bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-purple-200/30 dark:bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className={`w-full max-w-md px-4 relative z-10 transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block transition-transform duration-300 hover:scale-105">
            <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400">ReserveSpace</h1>
          </Link>
          <p className="mt-2 text-gray-600 dark:text-gray-400 animate-in fade-in slide-in-from-bottom-5 duration-700 delay-200">Sign in to your account</p>
        </div>
        
        {error && (
          <Alert variant="destructive" className="mb-4 animate-in fade-in zoom-in-95 duration-300">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="mb-4 bg-green-50 text-green-800 dark:bg-green-900 dark:text-green-100 border-green-200 dark:border-green-800 animate-in fade-in zoom-in-95 duration-300">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}
        
        <Card className="w-full animate-in fade-in slide-in-from-bottom-5 duration-700 delay-300 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Login</CardTitle>
            <CardDescription className="text-center">
              Log in to manage your club reservations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="club" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="club" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all duration-300">Club Login</TabsTrigger>
                <TabsTrigger value="admin" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all duration-300">Admin Login</TabsTrigger>
              </TabsList>
              <TabsContent value="club" className="animate-in fade-in-50 duration-300">
                <form onSubmit={handleClubLogin} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="club-email">Email</Label>
                    <Input
                      id="club-email"
                      type="email"
                      placeholder="Enter your club email"
                      value={clubEmail}
                      onChange={(e) => setClubEmail(e.target.value)}
                      disabled={isLoading}
                      required
                      className="bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="club-password">Password</Label>
                    <Input
                      id="club-password"
                      type="password"
                      placeholder="Enter your password"
                      value={clubPassword}
                      onChange={(e) => setClubPassword(e.target.value)}
                      disabled={isLoading}
                      required
                      className="bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                    />
                  </div>
                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 transition-all duration-300 hover:shadow-md group" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Logging in...
                      </>
                    ) : (
                      <>
                        <LogIn className="mr-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                        Login as Club
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="admin" className="animate-in fade-in-50 duration-300">
                <form onSubmit={handleAdminLogin} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin-email">Email</Label>
                    <Input
                      id="admin-email"
                      type="email"
                      placeholder="Enter admin email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      disabled={isLoading}
                      required
                      className="bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-password">Password</Label>
                    <Input
                      id="admin-password"
                      type="password"
                      placeholder="Enter password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      disabled={isLoading}
                      required
                      className="bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                    />
                  </div>
                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 transition-all duration-300 hover:shadow-md group" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Logging in...
                      </>
                    ) : (
                      <>
                        <LogIn className="mr-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                        Login as Admin
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground">
              <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-300">
                Return to home page
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

