"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ThemeToggle } from "@/components/ui/theme-toggle"
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
  Linkedin,
  Menu,
  X,
  ArrowUp,
  Star
} from "lucide-react"
import { useEffect, useState, useRef } from "react"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"

export default function LandingPage() {
  const [isVisible, setIsVisible] = useState(false)
  const [activeFeature, setActiveFeature] = useState(0)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 })
  const [cursorVariant, setCursorVariant] = useState('default')
  const [activeSection, setActiveSection] = useState('')
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  const heroRef = useRef<HTMLDivElement>(null)
  const featuresRef = useRef<HTMLElement>(null)
  const testimonialsRef = useRef<HTMLElement>(null)
  const ctaRef = useRef<HTMLElement>(null)
  const footerRef = useRef<HTMLElement>(null)

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

    // Handle scroll events to detect when page is scrolled
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
      
      // Calculate scroll progress
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight
      const scrollTop = window.scrollY
      const scrollPercentage = (scrollTop / (documentHeight - windowHeight)) * 100
      setScrollProgress(scrollPercentage)
    }

    // Intersection Observer to detect active section
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.5,
    }

    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id)
        }
      })
    }, observerOptions)

    // Observe all sections
    const sections = document.querySelectorAll('section[id]')
    sections.forEach(section => {
      sectionObserver.observe(section)
    })

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('scroll', handleScroll)
    return () => {
      clearInterval(interval)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('scroll', handleScroll)
      sectionObserver.disconnect()
    }
  }, [])

  const handleButtonHover = () => setCursorVariant('button')
  const handleButtonLeave = () => setCursorVariant('default')

  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId)
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' })
      setMobileMenuOpen(false) // Close mobile menu after clicking
    }
  }

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

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
      {/* Scroll to Top Button */}
      <button 
        onClick={scrollToTop}
        className={`fixed bottom-8 right-8 z-40 p-3 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-all duration-300 ${isScrolled ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}
        onMouseEnter={handleButtonHover}
        onMouseLeave={handleButtonLeave}
      >
        <ArrowUp className="h-5 w-5" />
        <span className="sr-only">Scroll to top</span>
      </button>

      {/* Floating Theme Toggle Button - Only visible when scrolled */}
      <div 
        className={`fixed bottom-8 left-8 z-40 transition-all duration-300 ${isScrolled ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}
      >
        <div className="bg-white dark:bg-gray-800 p-2 rounded-full shadow-lg border border-gray-200 dark:border-gray-700">
          <ThemeToggle />
        </div>
      </div>

      {/* Sticky Navigation */}
      <div className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full'}`}>
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-800/50 py-4">
          {/* Scroll Progress Indicator */}
          <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" style={{ width: `${scrollProgress}%` }}></div>
          
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="relative h-8 w-8">
                  <img src="/images/polaris-logo.png" alt="Polaris Logo" className="h-8 w-8" />
                </div>
                <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                  Polaris Clubs Manager
                </div>
              </div>
              <div className="hidden md:flex items-center space-x-6">
                <button 
                  onClick={() => scrollToSection('features')} 
                  className={`text-sm text-gray-700 dark:text-blue-100 hover:text-blue-700 dark:hover:text-white transition-colors relative group ${activeSection === 'features' ? 'text-blue-700 dark:text-white font-medium' : ''}`}
                >
                  Features
                  <div className={`absolute -bottom-1 left-0 w-full h-0.5 bg-blue-500 transform origin-left transition-transform duration-300 ${activeSection === 'features' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}></div>
                </button>
                <button 
                  onClick={() => scrollToSection('testimonials')} 
                  className={`text-sm text-gray-700 dark:text-blue-100 hover:text-blue-700 dark:hover:text-white transition-colors relative group ${activeSection === 'testimonials' ? 'text-blue-700 dark:text-white font-medium' : ''}`}
                >
                  Testimonials
                  <div className={`absolute -bottom-1 left-0 w-full h-0.5 bg-blue-500 transform origin-left transition-transform duration-300 ${activeSection === 'testimonials' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}></div>
                </button>
                <button 
                  onClick={() => scrollToSection('contact')} 
                  className={`text-sm text-gray-700 dark:text-blue-100 hover:text-blue-700 dark:hover:text-white transition-colors relative group ${activeSection === 'contact' ? 'text-blue-700 dark:text-white font-medium' : ''}`}
                >
                  Contact
                  <div className={`absolute -bottom-1 left-0 w-full h-0.5 bg-blue-500 transform origin-left transition-transform duration-300 ${activeSection === 'contact' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}></div>
                </button>
              </div>
              <div className="flex items-center space-x-3">
                <ThemeToggle />
                <Button 
                  asChild 
                  variant="outline" 
                  size="sm"
                  className="border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400 hover:text-white hover:border-transparent hover:bg-gradient-to-r hover:from-blue-500 hover:to-indigo-600 transition-all duration-300 hidden md:inline-flex relative group overflow-hidden"
                >
                  <Link href="/login" className="relative z-10">
                    <span className="relative z-10">Login</span>
                    <span className="absolute bottom-0 left-0 w-full h-[1px] bg-blue-500 dark:bg-blue-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
                  </Link>
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="md:hidden text-gray-800 dark:text-white"
                  onClick={() => setMobileMenuOpen(true)}
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`fixed inset-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg z-50 transition-all duration-300 ${mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="container mx-auto px-4 py-6 h-full flex flex-col">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="relative h-8 w-8">
                <img src="/images/polaris-logo.svg" alt="Polaris Logo" className="h-8 w-8" />
              </div>
              <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                Polaris Clubs Manager
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <ThemeToggle />
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-gray-800 dark:text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center space-y-8 flex-grow">
            <button 
              onClick={() => scrollToSection('features')} 
              className={`text-2xl font-medium text-gray-800 dark:text-blue-100 hover:text-blue-700 dark:hover:text-white transition-colors relative group ${activeSection === 'features' ? 'text-blue-700 dark:text-white' : ''}`}
            >
              Features
              <div className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-2 h-2 rounded-full bg-blue-500 transition-all duration-300 ${activeSection === 'features' ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}></div>
            </button>
            <button 
              onClick={() => scrollToSection('testimonials')} 
              className={`text-2xl font-medium text-gray-800 dark:text-blue-100 hover:text-blue-700 dark:hover:text-white transition-colors relative group ${activeSection === 'testimonials' ? 'text-blue-700 dark:text-white' : ''}`}
            >
              Testimonials
              <div className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-2 h-2 rounded-full bg-blue-500 transition-all duration-300 ${activeSection === 'testimonials' ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}></div>
            </button>
            <button 
              onClick={() => scrollToSection('contact')} 
              className={`text-2xl font-medium text-gray-800 dark:text-blue-100 hover:text-blue-700 dark:hover:text-white transition-colors relative group ${activeSection === 'contact' ? 'text-blue-700 dark:text-white' : ''}`}
            >
              Contact
              <div className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-2 h-2 rounded-full bg-blue-500 transition-all duration-300 ${activeSection === 'contact' ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}></div>
            </button>
            <div className="flex flex-col space-y-4 mt-8 w-full max-w-xs">
              <Button 
                asChild 
                variant="outline" 
                className="w-full border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-400/10 transition-all duration-300"
              >
                <Link href="/login">Login</Link>
              </Button>
              <Button 
                asChild 
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white transition-all duration-300"
              >
                <Link href="/login">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <header ref={heroRef} className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white dark:from-indigo-950 dark:via-blue-900 dark:to-indigo-900 text-gray-900 dark:text-white relative overflow-hidden">
        {/* Custom cursor */}
        <div 
          className="fixed w-8 h-8 pointer-events-none z-50 mix-blend-difference"
          style={{
            left: cursorPosition.x - 16,
            top: cursorPosition.y - 16,
            transform: cursorVariant === 'button' ? 'scale(2.5)' : 'scale(1)',
            transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          <div className="w-full h-full rounded-full bg-white opacity-50 animate-ping"></div>
          <div className="w-2 h-2 rounded-full bg-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
        </div>

        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full">
            <div 
              className="absolute -top-20 -left-20 w-96 h-96 bg-blue-200/40 dark:bg-blue-500/20 rounded-full blur-3xl animate-pulse"
              style={{
                transform: `translate(${mousePosition.x * 20}px, ${mousePosition.y * 20}px) rotate(${mousePosition.x * 360}deg)`,
                transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
              }}
            ></div>
            <div 
              className="absolute top-1/3 right-20 w-[30rem] h-[30rem] bg-indigo-200/40 dark:bg-indigo-500/20 rounded-full blur-3xl animate-pulse"
              style={{
                transform: `translate(${-mousePosition.x * 30}px, ${-mousePosition.y * 30}px) rotate(${-mousePosition.y * 360}deg)`,
                transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                animationDelay: '1s'
              }}
            ></div>
            <div 
              className="absolute bottom-20 left-1/3 w-[25rem] h-[25rem] bg-purple-200/40 dark:bg-purple-500/20 rounded-full blur-3xl animate-pulse"
              style={{
                transform: `translate(${mousePosition.x * 25}px, ${-mousePosition.y * 25}px) scale(${1 + mousePosition.x * 0.2})`,
                transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                animationDelay: '2s'
              }}
            ></div>
            <div 
              className="absolute top-1/2 left-1/2 w-[20rem] h-[20rem] bg-cyan-200/30 dark:bg-cyan-500/10 rounded-full blur-3xl animate-pulse"
              style={{
                transform: `translate(-50%, -50%) scale(${1 + (Math.sin(Date.now() / 2000) + 1) / 4})`,
                transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                animationDelay: '3s'
              }}
            ></div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-white/40 to-transparent dark:from-black/40 dark:to-transparent"></div>
          
          {/* Animated grid pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{ 
              backgroundImage: 'linear-gradient(to right, rgba(59,130,246,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(59,130,246,0.1) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
              transform: `translate(${mousePosition.x * 5}px, ${mousePosition.y * 5}px) rotate(${mousePosition.x * 2}deg)`,
              transition: 'transform 0.5s ease-out',
              animation: 'pulse 8s ease-in-out infinite'
            }}></div>
          </div>
        </div>

        <div className="container mx-auto px-4 h-full relative z-10">
          <nav className="flex justify-between items-center py-8 sticky top-0">
            <div className="flex items-center space-x-2 group cursor-pointer">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full opacity-0 group-hover:opacity-70 blur-md transition-all duration-500 group-hover:duration-200"></div>
                <div className="relative h-8 w-8 flex items-center justify-center">
                  <Star className="h-8 w-8 text-blue-500 dark:text-blue-400 absolute transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 group-hover:text-blue-400 dark:group-hover:text-blue-300 animate-[glow_3s_ease-in-out_infinite]" />
                  <Sparkles className="h-4 w-4 text-indigo-400 dark:text-indigo-300 absolute transition-all duration-300 group-hover:scale-110 group-hover:text-indigo-300 dark:group-hover:text-indigo-200" />
                </div>
              </div>
              <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent group-hover:from-blue-500 group-hover:to-indigo-500 dark:group-hover:from-blue-300 dark:group-hover:to-indigo-300 transition-all">
                Polaris Clubs Manager
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <button 
                onClick={() => scrollToSection('features')} 
                className={`text-gray-700 dark:text-blue-100 hover:text-blue-700 dark:hover:text-white transition-colors relative group ${activeSection === 'features' ? 'text-blue-700 dark:text-white font-medium' : ''}`}
              >
                Features
                <div className={`absolute -bottom-1 left-0 w-full h-0.5 bg-blue-500 transform origin-left transition-transform duration-300 ${activeSection === 'features' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}></div>
              </button>
              <button 
                onClick={() => scrollToSection('testimonials')} 
                className={`text-gray-700 dark:text-blue-100 hover:text-blue-700 dark:hover:text-white transition-colors relative group ${activeSection === 'testimonials' ? 'text-blue-700 dark:text-white font-medium' : ''}`}
              >
                Testimonials
                <div className={`absolute -bottom-1 left-0 w-full h-0.5 bg-blue-500 transform origin-left transition-transform duration-300 ${activeSection === 'testimonials' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}></div>
              </button>
              <button 
                onClick={() => scrollToSection('contact')} 
                className={`text-gray-700 dark:text-blue-100 hover:text-blue-700 dark:hover:text-white transition-colors relative group ${activeSection === 'contact' ? 'text-blue-700 dark:text-white font-medium' : ''}`}
              >
                Contact
                <div className={`absolute -bottom-1 left-0 w-full h-0.5 bg-blue-500 transform origin-left transition-transform duration-300 ${activeSection === 'contact' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}></div>
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Button 
                asChild 
                variant="outline" 
                className="border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-400/10 transition-all duration-300 hover:scale-105 hidden md:inline-flex relative group overflow-hidden"
                onMouseEnter={handleButtonHover}
                onMouseLeave={handleButtonLeave}
              >
                <Link href="/login" className="relative z-10">
                  <span className="relative z-10">Login</span>
                  <span className="absolute bottom-0 left-0 w-full h-[1px] bg-blue-500 dark:bg-blue-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
                </Link>
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="md:hidden text-gray-800 dark:text-white"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu className="h-6 w-6" />
              </Button>
            </div>
          </nav>

          <div className="grid lg:grid-cols-2 gap-12 items-center py-20">
            <div className={`space-y-8 transition-all duration-1000 transform ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'}`}>
              <div className="flex flex-col sm:flex-row gap-4">
                <Badge variant="outline" className="border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400 px-4 py-1 text-sm hover:bg-blue-50 dark:hover:bg-blue-400/10 transition-colors cursor-default w-fit">
                  Revolutionizing Club Management
                </Badge>
                <Link 
                  href="https://ma.linkedin.com/in/abdellah-raissouni-1419432a8" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group inline-flex items-center w-fit"
                >
                  <Badge variant="outline" className="border-purple-500 dark:border-purple-400 text-purple-600 dark:text-purple-400 px-4 py-1 text-sm group-hover:bg-purple-50 dark:group-hover:bg-purple-400/10 transition-all duration-300">
                    Made by Abdelah Raissouni
                    <Linkedin className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                  </Badge>
                </Link>
              </div>
              <h1 className="text-5xl lg:text-7xl font-bold leading-tight text-gray-900 dark:text-white">
                <div className="relative inline-block">
                  <span className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">Polaris</span>
                  <div className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transform scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-500"></div>
                </div>
                <br />Clubs Manager for
                <br />
                <span className="relative text-gray-900 dark:text-white">
                  Modern Universities
                  <svg className="absolute -bottom-2 left-0 w-full" height="6" viewBox="0 0 200 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0 3C50 3 50 0 100 0C150 0 150 3 200 3C250 3 250 0 300 0" stroke="url(#paint0_linear)" strokeWidth="5" strokeLinecap="round"/>
                    <defs>
                      <linearGradient id="paint0_linear" x1="0" y1="0" x2="300" y2="0" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#3B82F6"/>
                        <stop offset="1" stopColor="#818CF8"/>
                      </linearGradient>
                    </defs>
                  </svg>
                </span>
                <div className="text-sm font-normal text-blue-600 dark:text-blue-300 mt-2">made by Abdellah Raissouni</div>
              </h1>
              <p className="text-xl text-gray-700 dark:text-blue-100 max-w-lg">
                Experience the future of club space management with AI-powered scheduling, real-time analytics, and seamless collaboration tools.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <Button 
                  asChild 
                  className="w-full sm:w-auto relative overflow-hidden bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white transition-all duration-300 group shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30"
                  onMouseEnter={handleButtonHover}
                  onMouseLeave={handleButtonLeave}
                >
                  <Link href="/login" className="relative z-10 flex items-center gap-2 px-6 py-6 sm:py-2">
                    Join Polaris
                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent animate-pulse"></div>
                    </div>
                  </Link>
                </Button>
                <Button 
                  asChild 
                  variant="outline" 
                  className="w-full sm:w-auto relative overflow-hidden border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400 hover:text-white hover:border-transparent transition-all duration-300 group"
                  onMouseEnter={handleButtonHover}
                  onMouseLeave={handleButtonLeave}
                >
                  <button 
                    onClick={() => scrollToSection('features')} 
                    className="relative z-10 flex items-center gap-2"
                  >
                    Watch Demo
                    <div className="w-6 h-6 rounded-full bg-blue-500 dark:bg-blue-400 flex items-center justify-center">
                      <div className="w-0 h-0 border-t-4 border-t-transparent border-l-6 border-l-white border-b-4 border-b-transparent ml-0.5"></div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
                  </button>
                </Button>
              </div>
              <div className="flex items-center space-x-4 pt-8">
                <div className="flex -space-x-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-white dark:border-blue-900 bg-gradient-to-br from-blue-400 to-indigo-400 flex items-center justify-center overflow-hidden">
                      <div className="w-full h-full bg-cover bg-center" style={{backgroundImage: `url(/placeholder-user.jpg)`}}></div>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="font-semibold">Trusted by 1000+ clubs</div>
                  <div className="text-blue-600 dark:text-blue-300 text-sm">across 50+ universities</div>
                </div>
              </div>
            </div>

            <div className={`relative transition-all duration-1000 delay-500 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <div className="relative animate-[float_6s_ease-in-out_infinite]">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
                <Card className="relative bg-gray-900/50 backdrop-blur-xl border-blue-900/50 p-6 rounded-lg overflow-hidden">
                  <Tabs defaultValue="features" className="w-full">
                    <TabsList className="w-full bg-gray-900/50 border border-blue-900/50">
                      <TabsTrigger value="features" className="flex-1 data-[state=active]:bg-blue-500/20">Features</TabsTrigger>
                      <TabsTrigger value="analytics" className="flex-1 data-[state=active]:bg-purple-500/20">Analytics</TabsTrigger>
                      <TabsTrigger value="calendar" className="flex-1 data-[state=active]:bg-green-500/20">Calendar</TabsTrigger>
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
                      <div className="space-y-4 p-2">
                        <div className="h-[60px] bg-gray-800/70 rounded-lg flex items-center justify-between px-4">
                          <div className="flex flex-col">
                            <span className="text-xs text-gray-400">Total Bookings</span>
                            <span className="font-bold text-lg">1,248</span>
                          </div>
                          <div className="h-12 w-24 flex items-end">
                            <div className="h-4 w-2 bg-purple-500 rounded-t mx-0.5"></div>
                            <div className="h-6 w-2 bg-purple-500 rounded-t mx-0.5"></div>
                            <div className="h-8 w-2 bg-purple-500 rounded-t mx-0.5"></div>
                            <div className="h-5 w-2 bg-purple-500 rounded-t mx-0.5"></div>
                            <div className="h-10 w-2 bg-purple-500 rounded-t mx-0.5"></div>
                            <div className="h-7 w-2 bg-purple-500 rounded-t mx-0.5"></div>
                            <div className="h-12 w-2 bg-purple-500 rounded-t mx-0.5"></div>
                          </div>
                        </div>
                        <div className="h-[60px] bg-gray-800/70 rounded-lg flex items-center justify-between px-4">
                          <div className="flex flex-col">
                            <span className="text-xs text-gray-400">Active Members</span>
                            <span className="font-bold text-lg">342</span>
                          </div>
                          <div className="h-12 w-24 flex items-center">
                            <div className="h-12 w-12 rounded-full border-4 border-purple-500 flex items-center justify-center">
                              <span className="text-xs font-bold">+24%</span>
                            </div>
                          </div>
                        </div>
                        <div className="h-[60px] bg-gray-800/70 rounded-lg flex items-center justify-between px-4">
                          <div className="flex flex-col">
                            <span className="text-xs text-gray-400">Space Utilization</span>
                            <span className="font-bold text-lg">87%</span>
                          </div>
                          <div className="h-2 w-24 bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full w-[87%] bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                          </div>
                        </div>
                        <div className="flex justify-center mt-4">
                          <Button variant="outline" size="sm" className="text-xs border-purple-500 text-purple-400">
                            View Full Report
                          </Button>
                        </div>
                      </div>
                    </TabsContent>
                    <TabsContent value="calendar" className="mt-4">
                      <div className="space-y-4">
                        <div className="grid grid-cols-7 gap-1 text-center text-xs">
                          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                            <div key={i} className="py-1 text-gray-400">{day}</div>
                          ))}
                          {[...Array(31)].map((_, i) => {
                            const isToday = i === 14;
                            const hasEvent = [3, 7, 14, 21, 28].includes(i);
                            return (
                              <div 
                                key={i} 
                                className={`py-2 rounded-md ${
                                  isToday 
                                    ? 'bg-green-500 text-white font-bold' 
                                    : hasEvent 
                                      ? 'bg-gray-800 text-white' 
                                      : 'text-gray-500'
                                }`}
                              >
                                {i + 1}
                                {hasEvent && <div className="w-1 h-1 bg-green-400 rounded-full mx-auto mt-1"></div>}
                              </div>
                            );
                          })}
                        </div>
                        <div className="space-y-2 mt-4">
                          <div className="bg-gray-800/70 p-2 rounded-md flex items-center space-x-2">
                            <div className="w-2 h-full bg-green-500 rounded-full"></div>
                            <div>
                              <div className="text-xs font-medium">Tech Club Meeting</div>
                              <div className="text-xs text-gray-400">Room A101 • 2:00 PM</div>
                            </div>
                          </div>
                          <div className="bg-gray-800/70 p-2 rounded-md flex items-center space-x-2">
                            <div className="w-2 h-full bg-blue-500 rounded-full"></div>
                            <div>
                              <div className="text-xs font-medium">Debate Tournament</div>
                              <div className="text-xs text-gray-400">Auditorium • 4:30 PM</div>
                            </div>
                          </div>
                        </div>
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
      <section id="features" ref={featuresRef} className="py-24 bg-gradient-to-b from-gray-100 to-white dark:from-gray-900 dark:to-black text-gray-900 dark:text-white relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#3b82f61a_1px,transparent_1px),linear-gradient(to_bottom,#3b82f61a_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px]"></div>
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="outline" className="mb-4 border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400">Polaris Features</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white">Everything you need to manage your club</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Powerful tools designed to streamline your club's operations and enhance member engagement
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 p-6 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-blue-500/10">
              <Calendar className="h-12 w-12 text-blue-500 dark:text-blue-400 mb-6" />
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Smart Scheduling</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                AI-powered scheduling system that learns from your club's patterns and preferences
              </p>
              <ul className="space-y-2">
                {['Conflict detection', 'Room recommendations', 'Recurring bookings'].map((feature, i) => (
                  <li key={i} className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                    <CheckCircle2 className="h-4 w-4 text-blue-500 dark:text-blue-400 mr-2" />
                    {feature}
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 p-6 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-purple-500/10">
              <Shield className="h-12 w-12 text-purple-500 dark:text-purple-400 mb-6" />
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Access Control</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Granular permissions and role management for your club members
              </p>
              <ul className="space-y-2">
                {['Custom roles', 'Approval workflows', 'Activity logs'].map((feature, i) => (
                  <li key={i} className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                    <CheckCircle2 className="h-4 w-4 text-purple-500 dark:text-purple-400 mr-2" />
                    {feature}
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 p-6 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-green-500/10">
              <Settings className="h-12 w-12 text-green-500 dark:text-green-400 mb-6" />
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Customization</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Tailor the platform to match your club's unique requirements
              </p>
              <ul className="space-y-2">
                {['Custom fields', 'Branded interface', 'Workflow automation'].map((feature, i) => (
                  <li key={i} className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                    <CheckCircle2 className="h-4 w-4 text-green-500 dark:text-green-400 mr-2" />
                    {feature}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" ref={testimonialsRef} className="py-24 bg-gray-50 dark:bg-black text-gray-900 dark:text-white relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="outline" className="mb-4 border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400">Polaris Testimonials</Badge>
            <h2 className="text-4xl font-bold mb-6 text-gray-900 dark:text-white">Loved by club leaders</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              See what other club leaders are saying about Polaris Clubs Manager
            </p>
          </div>

          <Carousel className="w-full max-w-5xl mx-auto">
            <CarouselContent>
              {[...Array(3)].map((_, i) => (
                <CarouselItem key={i}>
                  <Card className="bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 p-8">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-400"></div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">Sarah Johnson</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">President, Tech Club</div>
                        <p className="mt-4 text-lg text-gray-700 dark:text-gray-200">
                          "Polaris Clubs Manager has completely transformed how we manage our club activities. 
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
      <section id="pricing" ref={ctaRef} className="py-24 bg-gradient-to-br from-blue-50 via-indigo-50 to-white dark:from-blue-900 dark:via-indigo-900 dark:to-purple-900 text-gray-900 dark:text-white relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          {/* Animated stars background - only visible in dark mode */}
          <div className="absolute inset-0 opacity-0 dark:opacity-100">
            {[...Array(50)].map((_, i) => (
              <div 
                key={i}
                className="absolute rounded-full bg-white"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  width: `${Math.random() * 3 + 1}px`,
                  height: `${Math.random() * 3 + 1}px`,
                  opacity: Math.random() * 0.5 + 0.2,
                  animation: `twinkle ${Math.random() * 5 + 3}s ease-in-out infinite alternate`,
                  animationDelay: `${Math.random() * 5}s`
                }}
              ></div>
            ))}
          </div>
          
          {/* Light mode background elements */}
          <div className="absolute inset-0 dark:opacity-0">
            <div 
              className="absolute top-20 left-20 w-[30rem] h-[30rem] bg-blue-200/30 rounded-full blur-3xl"
              style={{
                transform: `translate(${mousePosition.x * 10}px, ${mousePosition.y * 10}px)`,
                transition: 'transform 1s ease-out',
              }}
            ></div>
            <div 
              className="absolute bottom-20 right-20 w-[25rem] h-[25rem] bg-indigo-200/30 rounded-full blur-3xl"
              style={{
                transform: `translate(${-mousePosition.x * 15}px, ${-mousePosition.y * 15}px)`,
                transition: 'transform 1.2s ease-out',
              }}
            ></div>
          </div>
          
          {/* Dark mode northern lights effect - only visible in dark mode */}
          <div className="opacity-0 dark:opacity-100">
            <div 
              className="absolute bottom-0 left-0 right-0 h-[60%] bg-gradient-to-t from-blue-500/10 to-transparent"
              style={{
                transform: `translateY(${mousePosition.y * 10}px) scale(${1 + mousePosition.x * 0.1})`,
                transition: 'transform 1s ease-out',
              }}
            ></div>
            <div 
              className="absolute bottom-0 left-0 right-0 h-[40%] bg-gradient-to-t from-indigo-500/10 to-transparent"
              style={{
                transform: `translateY(${mousePosition.y * 15}px) scale(${1 + mousePosition.x * 0.15})`,
                transition: 'transform 1.2s ease-out',
              }}
            ></div>
            <div 
              className="absolute bottom-0 left-0 right-0 h-[20%] bg-gradient-to-t from-purple-500/10 to-transparent"
              style={{
                transform: `translateY(${mousePosition.y * 20}px) scale(${1 + mousePosition.x * 0.2})`,
                transition: 'transform 1.4s ease-out',
              }}
            ></div>
          </div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/80 dark:bg-white/5 backdrop-blur-md border border-gray-200/50 dark:border-white/10 rounded-2xl p-8 md:p-12 shadow-xl">
              <div className="flex flex-col md:flex-row items-center">
                <div 
                  className="w-full md:w-1/2 mb-8 md:mb-0 md:pr-8"
                  style={{
                    transform: `translateY(${mousePosition.y * -5}px)`,
                    transition: 'transform 0.4s ease-out',
                  }}
                >
                  <Badge 
                    variant="outline" 
                    className="mb-4 border-blue-500 dark:border-blue-400/50 text-blue-600 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all duration-300"
                  >
                    Your Journey Begins Here
                  </Badge>
                  
                  <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
                    Navigate Your Club's Future with Polaris
                  </h2>
                  
                  <p className="text-gray-700 dark:text-blue-200 mb-6">
                    Like the North Star guides travelers, let Polaris guide your club to new heights of organization and success.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button 
                      asChild 
                      className="relative overflow-hidden group bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white transform hover:translate-y-[-2px] transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30"
                      onMouseEnter={handleButtonHover}
                      onMouseLeave={handleButtonLeave}
                    >
                      <Link href="/login" className="relative flex items-center justify-center py-2 px-6">
                        <span className="relative z-10 flex items-center gap-2">
                          Begin Your Journey
                          <ArrowRight className="ml-1 h-5 w-5 transform group-hover:translate-x-1 transition-transform duration-300" />
                        </span>
                        <span className="absolute inset-0 overflow-hidden">
                          <span 
                            className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-blue-400/0 via-blue-400/30 to-blue-400/0" 
                            style={{
                              transform: 'translateX(-100%)',
                              animation: 'shimmer 2.5s infinite',
                            }}
                          ></span>
                        </span>
                      </Link>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="border-blue-500 dark:border-blue-400/50 text-blue-600 dark:text-blue-300 hover:text-blue-700 dark:hover:text-white hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all duration-300"
                      onClick={() => scrollToSection('features')}
                      onMouseEnter={handleButtonHover}
                      onMouseLeave={handleButtonLeave}
                    >
                      <span className="flex items-center gap-2">
                        Explore the Stars
                        <Sparkles className="h-4 w-4" />
                      </span>
                    </Button>
                  </div>
                </div>
                
                <div 
                  className="w-full md:w-1/2 relative"
                  style={{
                    transform: `translateY(${mousePosition.y * -2}px) rotate(${mousePosition.x * 2}deg)`,
                    transition: 'transform 0.6s ease-out',
                  }}
                >
                  <div className="relative w-full aspect-square max-w-[300px] mx-auto">
                    {/* Animated compass/star */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative w-full h-full">
                        {/* Outer ring */}
                        <div 
                          className="absolute inset-0 border-2 border-blue-500/30 dark:border-blue-400/30 rounded-full"
                          style={{
                            animation: 'spin 20s linear infinite',
                          }}
                        ></div>
                        
                        {/* Middle ring */}
                        <div 
                          className="absolute inset-[15%] border border-indigo-500/40 dark:border-indigo-400/40 rounded-full"
                          style={{
                            animation: 'spin 15s linear infinite reverse',
                          }}
                        ></div>
                        
                        {/* Inner ring */}
                        <div 
                          className="absolute inset-[30%] border border-purple-500/50 dark:border-purple-400/50 rounded-full"
                          style={{
                            animation: 'spin 10s linear infinite',
                          }}
                        ></div>
                        
                        {/* Center star */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Star 
                            className="h-16 w-16 text-blue-500 dark:text-blue-300"
                            style={{
                              filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.5))',
                              animation: 'pulse 3s ease-in-out infinite',
                            }}
                          />
                        </div>
                        
                        {/* Cardinal points */}
                        {['N', 'E', 'S', 'W'].map((direction, i) => (
                          <div 
                            key={direction}
                            className="absolute flex items-center justify-center text-sm font-bold text-blue-600 dark:text-blue-200"
                            style={{
                              top: direction === 'N' ? '0' : direction === 'S' ? '100%' : '50%',
                              left: direction === 'W' ? '0' : direction === 'E' ? '100%' : '50%',
                              transform: 'translate(-50%, -50%)',
                            }}
                          >
                            {direction}
                          </div>
                        ))}
                        
                        {/* Animated particles */}
                        {[...Array(8)].map((_, i) => (
                          <div 
                            key={i}
                            className="absolute w-1 h-1 bg-blue-500 dark:bg-white rounded-full"
                            style={{
                              top: '50%',
                              left: '50%',
                              transform: `rotate(${i * 45}deg) translateX(120px)`,
                              animation: `orbit ${5 + i}s linear infinite`,
                            }}
                          ></div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Testimonial quote */}
              <div className="mt-10 pt-8 border-t border-gray-200/50 dark:border-white/10 text-center">
                <p className="italic text-gray-700 dark:text-blue-200 text-lg">
                  "Polaris guided our club through the chaos of scheduling and space management, just like the North Star has guided sailors for centuries."
                </p>
                <div className="mt-4 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-400 mr-3"></div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Abdellah ElBerkaoui</div>
                    <div className="text-sm text-blue-600 dark:text-blue-300">Polaris clubs coordinator</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Add animations */}
        <style jsx global>{`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.1); opacity: 0.8; }
          }
          
          @keyframes orbit {
            from { transform: rotate(0deg) translateX(120px) rotate(0deg); }
            to { transform: rotate(360deg) translateX(120px) rotate(-360deg); }
          }
          
          @keyframes twinkle {
            0%, 100% { opacity: 0.2; }
            50% { opacity: 0.8; }
          }
        `}</style>
      </section>

      {/* Footer */}
      <footer id="contact" ref={footerRef} className="py-12 bg-gray-100 dark:bg-black text-gray-600 dark:text-gray-400">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="relative h-8 w-8">
                  <img src="/images/polaris-logo.svg" alt="Polaris Logo" className="h-8 w-8" />
                </div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">Polaris Clubs Manager</div>
              </div>
              <p className="text-sm">
                Polaris Clubs Manager - The smart way to manage your club's spaces and activities
              </p>
            </div>
            {['Product', 'Company', 'Resources'].map((section, i) => (
              <div key={i}>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4">{section}</h4>
                <ul className="space-y-2">
                  {['Features', 'About', 'Contact'].map((item, j) => (
                    <li key={j}>
                      <Link href="#" className="text-sm hover:text-gray-900 dark:hover:text-white transition-colors">
                        {item}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-200 dark:border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="flex flex-col md:flex-row items-center gap-2">
              <p className="text-sm">© {new Date().getFullYear()} Polaris Clubs Manager. All rights reserved.</p>
              <span className="hidden md:inline">•</span>
              <Link 
                href="https://ma.linkedin.com/in/abdellah-raissouni-1419432a8" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-purple-600 dark:text-purple-400 font-medium hover:text-purple-500 dark:hover:text-purple-300 transition-colors flex items-center gap-1 group"
              >
                Made by Abdelah Raissouni
                <Linkedin className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
              </Link>
            </div>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="#" className="text-sm hover:text-gray-900 dark:hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="#" className="text-sm hover:text-gray-900 dark:hover:text-white transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

