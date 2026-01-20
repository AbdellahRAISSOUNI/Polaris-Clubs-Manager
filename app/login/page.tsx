"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { storeClubId, storeIsAdmin, storeAdminId } from "@/lib/storage"
import { toast } from "@/components/ui/use-toast"
import { AlertCircle, CheckCircle, Loader2, LogIn, Mail, Lock, Building2, Shield, Linkedin } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

export default function LoginPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("club")
  const [clubEmail, setClubEmail] = useState("")
  const [clubPassword, setClubPassword] = useState("")
  const [adminEmail, setAdminEmail] = useState("")
  const [adminPassword, setAdminPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  // Create a mock admin user if one doesn't exist
  useEffect(() => {
    async function createMockAdminIfNeeded() {
      try {
        // Check if any admin exists
        const response = await fetch('/api/users?role=admin');
        
        if (!response.ok) {
          console.error("Error checking for admin:", response.statusText);
          return;
        }
        
        const data = await response.json();
        
        // If no admin exists, demo admin is available via login API fallback
        if (!data || data.length === 0) {
          console.log("No admin found in database. Demo admin available: admin@example.com / admin123");
        } else {
          console.log("Admin(s) found in database:", data.length);
        }
      } catch (err) {
        console.error("Error in createMockAdminIfNeeded:", err);
      }
    }
    
    createMockAdminIfNeeded();
  }, []);

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
      
      // Use the login API endpoint for club authentication
      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: clubEmail,
          password: clubPassword,
          userType: 'club',
        }),
      })

      if (!loginResponse.ok) {
        const error = await loginResponse.json()
        throw new Error(error.error || 'Failed to authenticate club')
      }

      const clubs = await loginResponse.json()
      
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
      
      // Use the login API endpoint for admin authentication
      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: adminEmail,
          password: adminPassword,
          userType: 'admin',
        }),
      })

      if (!loginResponse.ok) {
        const error = await loginResponse.json()
        throw new Error(error.error || 'Failed to authenticate admin')
      }

      const admin = await loginResponse.json()
      
      // Log the full admin object to see its structure
      console.log("Admin object:", admin)
      
      // Store admin ID and admin status
      console.log("Storing admin ID:", admin.id)
      storeAdminId(admin.id)
      storeIsAdmin(true)
      
      // Verify storage
      console.log("Stored admin ID:", localStorage.getItem('adminId'))
      console.log("Is admin:", localStorage.getItem('isAdmin'))
      
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
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white dark:from-indigo-950 dark:via-blue-900 dark:to-indigo-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full">
          <div 
            className="absolute -top-20 -left-20 w-96 h-96 bg-blue-200/40 dark:bg-blue-500/20 rounded-full blur-3xl"
            style={{
              animation: 'slowPulse 12s ease-in-out infinite'
            }}
          ></div>
          <div 
            className="absolute top-1/3 right-20 w-[30rem] h-[30rem] bg-indigo-200/40 dark:bg-indigo-500/20 rounded-full blur-3xl"
            style={{
              animation: 'slowPulse 12s ease-in-out infinite',
              animationDelay: '3s'
            }}
          ></div>
          <div 
            className="absolute bottom-20 left-1/3 w-[25rem] h-[25rem] bg-purple-200/40 dark:bg-purple-500/20 rounded-full blur-3xl"
            style={{
              animation: 'slowPulse 12s ease-in-out infinite',
              animationDelay: '6s'
            }}
          ></div>
        </div>
      </div>

      <div className={`w-full max-w-md px-4 relative z-10 transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
        <div className="mb-8 text-center space-y-4">
          <Link href="/" className="inline-block transition-transform duration-300 hover:scale-105">
            <div className="flex flex-col items-center gap-4">
              <div className="relative h-24 w-auto">
                <img src="/images/polaris-logo.png" alt="ADE ENSA Tetouan" className="h-full w-auto" style={{ minWidth: '120px' }} />
              </div>
              <h1 className="text-3xl font-extrabold text-[#1B1464]">
                ADE <span className="text-[#FF6B00]">ENSA Tetouan</span>
              </h1>
            </div>
          </Link>
          <p className="text-gray-600 dark:text-gray-400 animate-in fade-in slide-in-from-bottom-5 duration-700 delay-200">
            Sign in to manage your club spaces
          </p>
        </div>

        {success && (
          <Alert className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/50 dark:to-emerald-900/50 text-green-800 dark:text-green-200 border-green-200/50 dark:border-green-800/50 shadow-lg shadow-green-900/5 animate-in fade-in-0 slide-in-from-top-5 duration-500">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-800/50 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <AlertTitle className="text-lg font-semibold mb-1">Welcome Back! 🎉</AlertTitle>
                <AlertDescription className="text-green-700 dark:text-green-300">{success}</AlertDescription>
              </div>
            </div>
          </Alert>
        )}

        <Card className="border-[#1B1464]/20 dark:border-[#FF6B00]/20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-xl">
          <Tabs defaultValue="club" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 bg-gray-100/50 dark:bg-gray-800/50 rounded-lg border border-[#1B1464]/20 dark:border-[#FF6B00]/20">
              <TabsTrigger 
                value="club"
                className="data-[state=active]:bg-[#1B1464] data-[state=active]:text-white dark:data-[state=active]:bg-[#FF6B00] dark:data-[state=active]:text-white transition-all duration-300"
              >
                <Building2 className="w-4 h-4 mr-2" />
                Club Login
              </TabsTrigger>
              <TabsTrigger 
                value="admin"
                className="data-[state=active]:bg-[#1B1464] data-[state=active]:text-white dark:data-[state=active]:bg-[#FF6B00] dark:data-[state=active]:text-white transition-all duration-300"
              >
                <Shield className="w-4 h-4 mr-2" />
                Admin Login
              </TabsTrigger>
            </TabsList>

            <TabsContent value="club">
              <form onSubmit={handleClubLogin}>
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-[#1B1464] dark:text-white">Club Login</CardTitle>
                  <CardDescription>Enter your club credentials to access your dashboard</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="club-email">Club Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 w-4 h-4" />
                      <Input
                        id="club-email"
                        type="email"
                        placeholder="your.club@ensatetouan.com"
                        value={clubEmail}
                        onChange={(e) => setClubEmail(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="club-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 w-4 h-4" />
                      <Input
                        id="club-password"
                        type="password"
                        value={clubPassword}
                        onChange={(e) => setClubPassword(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    type="submit" 
                    className="w-full bg-[#1B1464] hover:bg-[#1B1464]/90 dark:bg-[#FF6B00] dark:hover:bg-[#FF6B00]/90 text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        <LogIn className="mr-2 h-4 w-4" />
                        Sign In
                      </>
                    )}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>

            <TabsContent value="admin">
              <form onSubmit={handleAdminLogin}>
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-[#1B1464] dark:text-white">Admin Login</CardTitle>
                  <CardDescription>Enter your admin credentials to access the control panel</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin-email">Admin Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 w-4 h-4" />
                      <Input
                        id="admin-email"
                        type="email"
                        placeholder="admin@ensatetouan.com"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 w-4 h-4" />
                      <Input
                        id="admin-password"
                        type="password"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    type="submit" 
                    className="w-full bg-[#1B1464] hover:bg-[#1B1464]/90 dark:bg-[#FF6B00] dark:hover:bg-[#FF6B00]/90 text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        <LogIn className="mr-2 h-4 w-4" />
                        Sign In
                      </>
                    )}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>
          </Tabs>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </Card>

        <div className="mt-8 pb-12 text-center">
          <Link 
            href="https://ma.linkedin.com/in/abdellah-raissouni-1419432a8" 
            target="_blank" 
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 text-sm text-[#1B1464] hover:text-[#FF6B00] dark:text-gray-400 dark:hover:text-[#FF6B00] transition-colors"
          >
            <Badge variant="outline" className="border-[#FF6B00] text-[#FF6B00] px-4 py-1 text-sm group-hover:bg-[#FF6B00]/10 transition-all duration-300">
              Made by Abdelah Raissouni
              <Linkedin className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
            </Badge>
          </Link>
        </div>
      </div>

      <style jsx global>{`
        @keyframes slowPulse {
          0% { opacity: 0.2; }
          50% { opacity: 0.4; }
          100% { opacity: 0.2; }
        }
      `}</style>
    </div>
  )
}

