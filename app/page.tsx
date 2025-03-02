"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  ArrowRight, 
  Calendar, 
  Clock, 
  Users, 
  ChevronRight, 
  Building2, 
  Shield, 
  Settings, 
  BarChart3, 
  MessageSquare,
  CheckCircle2,
  Sparkles,
  Linkedin
} from "lucide-react"
import { useEffect, useState, useRef } from "react"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"

export default function LandingPage() {
  const [isVisible, setIsVisible] = useState(false)
  const [activeFeature, setActiveFeature] = useState(0)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 })
  const [cursorVariant, setCursorVariant] = useState('default')
  const heroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsVisible(true)
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 3)
    }, 5000)

    const handleMouseMove = (e: MouseEvent) => {
      setCursorPosition({ x: e.clientX, y: e.clientY })
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect()
        const x = (e.clientX - rect.left) / rect.width
        const y = (e.clientY - rect.top) / rect.height
        setMousePosition({ x, y })
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => {
      clearInterval(interval)
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  const handleButtonHover = () => setCursorVariant('button')
  const handleButtonLeave = () => setCursorVariant('default')

  const features = [
    {
      title: "Smart Space Management",
      description: "AI-powered room recommendations based on your club's size and activities",
      icon: Building2,
      color: "from-purple-500 to-pink-500"
    },
    {
      title: "Advanced Analytics",
      description: "Track attendance, space utilization, and engagement metrics",
      icon: BarChart3,
      color: "from-blue-500 to-cyan-500"
    },
    {
      title: "Real-time Collaboration",
      description: "Chat, share resources, and coordinate with team members",
      icon: MessageSquare,
      color: "from-green-500 to-emerald-500"
    }
  ]

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <header ref={heroRef} className="min-h-screen bg-gradient-to-br from-indigo-900 via-blue-900 to-blue-950 text-white relative overflow-hidden">
        {/* Custom cursor */}
        <div 
          className="fixed w-8 h-8 pointer-events-none z-50 mix-blend-difference"
          style={{
            left: cursorPosition.x - 16,
            top: cursorPosition.y - 16,
            transform: cursorVariant === 'button' ? 'scale(2)' : 'scale(1)',
            transition: 'transform 0.3s ease-out',
          }}
        >
          <div className="w-full h-full rounded-full bg-white opacity-50 animate-ping"></div>
          <div className="w-2 h-2 rounded-full bg-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
        </div>

        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full">
            <div 
              className="absolute -top-20 -left-20 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse"
              style={{
                transform: `translate(${mousePosition.x * 20}px, ${mousePosition.y * 20}px) rotate(${mousePosition.x * 360}deg)`,
                transition: 'transform 0.3s ease-out'
              }}
            ></div>
            <div 
              className="absolute top-1/3 right-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse"
              style={{
                transform: `translate(${-mousePosition.x * 30}px, ${-mousePosition.y * 30}px) rotate(${-mousePosition.y * 360}deg)`,
                transition: 'transform 0.3s ease-out',
                animationDelay: '1s'
              }}
            ></div>
            <div 
              className="absolute bottom-20 left-1/3 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse"
              style={{
                transform: `translate(${mousePosition.x * 25}px, ${-mousePosition.y * 25}px) scale(${1 + mousePosition.x * 0.2})`,
                transition: 'transform 0.3s ease-out',
                animationDelay: '2s'
              }}
            ></div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
        </div>

        <div className="container mx-auto px-4 h-full relative z-10">
          <nav className="flex justify-between items-center py-8">
            <div className="flex items-center space-x-2 group cursor-pointer">
              <Sparkles className="h-8 w-8 text-blue-400 transition-transform group-hover:scale-110 group-hover:rotate-12" />
              <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent group-hover:from-blue-300 group-hover:to-indigo-300 transition-all">
                ReserveSpace
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                asChild 
                variant="outline" 
                className="border-blue-400 text-blue-400 hover:bg-blue-400/10 transition-all duration-300 hover:scale-105"
              >
                <Link href="/login">Login</Link>
              </Button>
            </div>
          </nav>

          <div className="grid lg:grid-cols-2 gap-12 items-center py-20">
            <div className={`space-y-8 transition-all duration-1000 transform ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'}`}>
              <Badge variant="outline" className="border-blue-400 text-blue-400 px-4 py-1 text-sm hover:bg-blue-400/10 transition-colors cursor-default">
                Revolutionizing Club Management
              </Badge>
              <div className="inline-block">
                <Link 
                  href="https://ma.linkedin.com/in/abdellah-raissouni-1419432a8" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group inline-flex items-center"
                >
                  <Badge variant="outline" className="border-purple-400 text-purple-400 px-4 py-1 text-sm group-hover:bg-purple-400/10 transition-all duration-300">
                    Made by Abdelah Raissouni
                    <Linkedin className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                  </Badge>
                </Link>
              </div>
              <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Smart Space</span>
                <br />Management for
                <br />Modern Clubs
              </h1>
              <p className="text-xl text-blue-100 max-w-lg">
                Experience the future of club space management with AI-powered scheduling, real-time analytics, and seamless collaboration tools.
              </p>
              <div className="flex items-center space-x-4">
                <Button 
                  asChild 
                  variant="outline" 
                  className="relative overflow-hidden border-blue-400 text-blue-400 hover:text-white hover:border-transparent transition-all duration-300 group"
                  onMouseEnter={handleButtonHover}
                  onMouseLeave={handleButtonLeave}
                >
                  <Link href="/login" className="relative z-10 flex items-center gap-2">
                    Login
                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent animate-pulse"></div>
                    </div>
                    <div className="absolute -inset-1 bg-blue-500/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  </Link>
                </Button>
              </div>
              <div className="flex items-center space-x-4 pt-8">
                <div className="flex -space-x-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-blue-900 bg-gradient-to-br from-blue-400 to-indigo-400"></div>
                  ))}
                </div>
                <div>
                  <div className="font-semibold">Trusted by 1000+ clubs</div>
                  <div className="text-blue-300 text-sm">across 50+ universities</div>
                </div>
              </div>
            </div>

            <div className={`relative transition-all duration-1000 delay-500 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <div className="relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
                <Card className="relative bg-gray-900/50 backdrop-blur-xl border-blue-900/50 p-6 rounded-lg overflow-hidden">
                  <Tabs defaultValue="features" className="w-full">
                    <TabsList className="w-full bg-gray-900/50 border border-blue-900/50">
                      <TabsTrigger value="features" className="flex-1">Features</TabsTrigger>
                      <TabsTrigger value="analytics" className="flex-1">Analytics</TabsTrigger>
                      <TabsTrigger value="calendar" className="flex-1">Calendar</TabsTrigger>
                    </TabsList>
                    <TabsContent value="features" className="mt-4">
                      <div className="space-y-4">
                        {features.map((feature, index) => (
                          <div
                            key={index}
                            className={`p-4 rounded-lg transition-all duration-500 transform ${
                              activeFeature === index
                                ? 'bg-gradient-to-r ' + feature.color + ' scale-105'
                                : 'bg-gray-800/50 hover:bg-gray-800/80'
                            }`}
                          >
                            <div className="flex items-start space-x-4">
                              <div className="p-2 rounded-lg bg-white/10">
                                <feature.icon className="h-6 w-6" />
                              </div>
                              <div>
                                <h3 className="font-semibold">{feature.title}</h3>
                                <p className="text-sm text-gray-300">{feature.description}</p>
                              </div>
                              <CheckCircle2 className={`h-5 w-5 ml-auto ${
                                activeFeature === index ? 'opacity-100' : 'opacity-0'
                              } transition-opacity duration-300`} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                    <TabsContent value="analytics" className="mt-4">
                      <div className="h-[300px] flex items-center justify-center">
                        <BarChart3 className="h-32 w-32 text-blue-400 animate-pulse" />
                      </div>
                    </TabsContent>
                    <TabsContent value="calendar" className="mt-4">
                      <div className="h-[300px] flex items-center justify-center">
                        <Calendar className="h-32 w-32 text-blue-400 animate-pulse" />
                      </div>
                    </TabsContent>
                  </Tabs>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-24 bg-gradient-to-b from-gray-900 to-black text-white relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px]"></div>
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="outline" className="mb-4">Features</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Everything you need to manage your club</h2>
            <p className="text-xl text-gray-400">
              Powerful tools designed to streamline your club's operations and enhance member engagement
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-gray-800/50 border-gray-700 p-6 hover:bg-gray-800/80 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-blue-500/10">
              <Calendar className="h-12 w-12 text-blue-400 mb-6" />
              <h3 className="text-xl font-bold mb-3">Smart Scheduling</h3>
              <p className="text-gray-400 mb-4">
                AI-powered scheduling system that learns from your club's patterns and preferences
              </p>
              <ul className="space-y-2">
                {['Conflict detection', 'Room recommendations', 'Recurring bookings'].map((feature, i) => (
                  <li key={i} className="flex items-center text-sm">
                    <CheckCircle2 className="h-4 w-4 text-blue-400 mr-2" />
                    {feature}
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700 p-6 hover:bg-gray-800/80 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-purple-500/10">
              <Shield className="h-12 w-12 text-purple-400 mb-6" />
              <h3 className="text-xl font-bold mb-3">Access Control</h3>
              <p className="text-gray-400 mb-4">
                Granular permissions and role management for your club members
              </p>
              <ul className="space-y-2">
                {['Custom roles', 'Approval workflows', 'Activity logs'].map((feature, i) => (
                  <li key={i} className="flex items-center text-sm">
                    <CheckCircle2 className="h-4 w-4 text-purple-400 mr-2" />
                    {feature}
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700 p-6 hover:bg-gray-800/80 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-green-500/10">
              <Settings className="h-12 w-12 text-green-400 mb-6" />
              <h3 className="text-xl font-bold mb-3">Customization</h3>
              <p className="text-gray-400 mb-4">
                Tailor the platform to match your club's unique requirements
              </p>
              <ul className="space-y-2">
                {['Custom fields', 'Branded interface', 'Workflow automation'].map((feature, i) => (
                  <li key={i} className="flex items-center text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-400 mr-2" />
                    {feature}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-black text-white relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="outline" className="mb-4">Testimonials</Badge>
            <h2 className="text-4xl font-bold mb-6">Loved by club leaders</h2>
            <p className="text-xl text-gray-400">
              See what other club leaders are saying about ReserveSpace
            </p>
          </div>

          <Carousel className="w-full max-w-5xl mx-auto">
            <CarouselContent>
              {[...Array(3)].map((_, i) => (
                <CarouselItem key={i}>
                  <Card className="bg-gray-800/50 border-gray-700 p-8">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-400"></div>
                      <div>
                        <div className="font-semibold">Sarah Johnson</div>
                        <div className="text-sm text-gray-400">President, Tech Club</div>
                        <p className="mt-4 text-lg">
                          "ReserveSpace has completely transformed how we manage our club activities. 
                          The smart scheduling and analytics features have saved us countless hours."
                        </p>
                      </div>
                    </div>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex" />
            <CarouselNext className="hidden md:flex" />
          </Carousel>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px]"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/30 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-3xl mx-auto">
            <Badge variant="outline" className="mb-4">Get Started</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to transform your club management?
            </h2>
            <p className="text-xl mb-8 text-blue-200">
              Join hundreds of clubs already using ReserveSpace to streamline their operations
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Button 
                asChild 
                size="lg" 
                className="w-full sm:w-auto relative overflow-hidden group bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500 hover:from-blue-600 hover:via-indigo-600 hover:to-blue-600 text-lg px-8 py-6 transform hover:scale-105 transition-all duration-500"
                onMouseEnter={handleButtonHover}
                onMouseLeave={handleButtonLeave}
              >
                <Link href="/login" className="relative flex items-center justify-center">
                  <span className="relative z-10 flex items-center gap-2">
                    Login Now
                    <ArrowRight className="ml-2 h-5 w-5 transform group-hover:translate-x-2 transition-transform duration-500" />
                  </span>
                  <span className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></span>
                  <span className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/30 via-white/10 to-transparent opacity-0 group-hover:opacity-100 transform scale-150 group-hover:scale-100 transition-all duration-700"></span>
                  <span className="absolute inset-0 overflow-hidden">
                    <span className="absolute top-1/2 left-0 w-[200%] h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent transform -translate-x-full group-hover:translate-x-0 transition-transform duration-1000"></span>
                  </span>
                  <div className="absolute -inset-2 bg-blue-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full"></div>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-black text-gray-400">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Sparkles className="h-6 w-6 text-blue-400" />
                <div className="text-xl font-bold text-white">ReserveSpace</div>
              </div>
              <p className="text-sm">
                Abdellah Raissouni's smart way to manage your club's spaces and activities
              </p>
            </div>
            {['Product', 'Company', 'Resources'].map((section, i) => (
              <div key={i}>
                <h4 className="font-semibold text-white mb-4">{section}</h4>
                <ul className="space-y-2">
                  {['Features', 'About', 'Contact'].map((item, j) => (
                    <li key={j}>
                      <Link href="#" className="text-sm hover:text-white transition-colors">
                        {item}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="flex flex-col md:flex-row items-center gap-2">
              <p className="text-sm">© {new Date().getFullYear()} ReserveSpace. All rights reserved.</p>
              <span className="hidden md:inline">•</span>
              <Link 
                href="https://ma.linkedin.com/in/abdellah-raissouni-1419432a8" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-purple-400 font-medium hover:text-purple-300 transition-colors flex items-center gap-1 group"
              >
                Made by Abdelah Raissouni
                <Linkedin className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
              </Link>
            </div>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="#" className="text-sm hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="#" className="text-sm hover:text-white transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

