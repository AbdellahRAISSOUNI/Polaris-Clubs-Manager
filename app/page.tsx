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
                <div className="relative h-12 w-auto">
                  <img src="/images/polaris-logo.png" alt="ADE ENSA Tetouan" className="h-full w-auto" style={{ minWidth: '120px' }} />
                </div>
                <div className="text-xl font-extrabold text-[#1B1464] dark:text-white">ADE <span className="text-[#FF6B00]">ENSA Tetouan</span></div>
              </div>
              <div className="hidden md:flex items-center space-x-6">
                <button 
                  onClick={() => scrollToSection('features')} 
                  className={`text-sm text-[#1B1464] dark:text-[#1B1464] hover:text-[#FF6B00] dark:hover:text-[#FF6B00] transition-colors relative group ${activeSection === 'features' ? 'text-[#FF6B00] dark:text-[#FF6B00] font-medium' : ''}`}
                >
                  Features
                  <div className={`absolute -bottom-1 left-0 w-full h-0.5 bg-[#FF6B00] transform origin-left transition-transform duration-300 ${activeSection === 'features' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}></div>
                </button>
                <button 
                  onClick={() => scrollToSection('testimonials')} 
                  className={`text-sm text-[#1B1464] dark:text-[#1B1464] hover:text-[#FF6B00] dark:hover:text-[#FF6B00] transition-colors relative group ${activeSection === 'testimonials' ? 'text-[#FF6B00] dark:text-[#FF6B00] font-medium' : ''}`}
                >
                  Testimonials
                  <div className={`absolute -bottom-1 left-0 w-full h-0.5 bg-[#FF6B00] transform origin-left transition-transform duration-300 ${activeSection === 'testimonials' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}></div>
                </button>
                <button 
                  onClick={() => scrollToSection('contact')} 
                  className={`text-sm text-[#1B1464] dark:text-[#1B1464] hover:text-[#FF6B00] dark:hover:text-[#FF6B00] transition-colors relative group ${activeSection === 'contact' ? 'text-[#FF6B00] dark:text-[#FF6B00] font-medium' : ''}`}
                >
                  Contact
                  <div className={`absolute -bottom-1 left-0 w-full h-0.5 bg-[#FF6B00] transform origin-left transition-transform duration-300 ${activeSection === 'contact' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}></div>
                </button>
              </div>
              <div className="flex items-center space-x-3">
                <ThemeToggle />
                <Button 
                  asChild 
                  variant="outline" 
                  size="sm"
                  className="border-[#1B1464] text-[#1B1464] hover:bg-[#1B1464] hover:text-white transition-all duration-300 hidden md:inline-flex"
                >
                  <Link href="/login">Login</Link>
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
              <div className="relative h-12 w-auto">
                <img src="/images/polaris-logo.png" alt="ADE ENSA Tetouan" className="h-full w-auto" style={{ minWidth: '120px' }} />
              </div>
              <div className="text-xl font-extrabold text-[#1B1464] dark:text-white">
                ADE <span className="text-[#FF6B00]">ENSA Tetouan</span>
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
              className="absolute -top-20 -left-20 w-96 h-96 bg-blue-200/40 dark:bg-blue-500/20 rounded-full blur-3xl"
              style={{
                transform: `translate(${mousePosition.x * 20}px, ${mousePosition.y * 20}px) rotate(${mousePosition.x * 360}deg)`,
                transition: 'transform 1s cubic-bezier(0.34, 1.56, 0.64, 1)',
                animation: 'slowPulse 12s ease-in-out infinite'
              }}
            ></div>
            <div 
              className="absolute top-1/3 right-20 w-[30rem] h-[30rem] bg-indigo-200/40 dark:bg-indigo-500/20 rounded-full blur-3xl"
              style={{
                transform: `translate(${-mousePosition.x * 30}px, ${-mousePosition.y * 30}px) rotate(${-mousePosition.y * 360}deg)`,
                transition: 'transform 1s cubic-bezier(0.34, 1.56, 0.64, 1)',
                animation: 'slowPulse 12s ease-in-out infinite',
                animationDelay: '3s'
              }}
            ></div>
            <div 
              className="absolute bottom-20 left-1/3 w-[25rem] h-[25rem] bg-purple-200/40 dark:bg-purple-500/20 rounded-full blur-3xl"
              style={{
                transform: `translate(${mousePosition.x * 25}px, ${-mousePosition.y * 25}px) scale(${1 + mousePosition.x * 0.2})`,
                transition: 'transform 1s cubic-bezier(0.34, 1.56, 0.64, 1)',
                animation: 'slowPulse 12s ease-in-out infinite',
                animationDelay: '6s'
              }}
            ></div>
            <div 
              className="absolute top-1/2 left-1/2 w-[20rem] h-[20rem] bg-cyan-200/30 dark:bg-cyan-500/10 rounded-full blur-3xl"
              style={{
                transform: `translate(-50%, -50%) scale(${1 + (Math.sin(Date.now() / 4000) + 1) / 8})`,
                transition: 'transform 1s cubic-bezier(0.34, 1.56, 0.64, 1)',
                animation: 'slowPulse 12s ease-in-out infinite',
                animationDelay: '9s'
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
                <div className="absolute -inset-1 bg-gradient-to-r from-[#1B1464] to-[#FF6B00] rounded-full opacity-0 group-hover:opacity-70 blur-md transition-all duration-500 group-hover:duration-200"></div>
                <div className="relative h-12 w-auto">
                  <img src="/images/polaris-logo.png" alt="ADE ENSA Tetouan" className="h-full w-auto" style={{ minWidth: '120px' }} />
                </div>
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
                <Badge variant="outline" className="border-[#1B1464] text-[#1B1464] px-4 py-1 text-sm hover:bg-[#1B1464]/10 transition-colors cursor-default w-fit">
                  Revolutionizing Club Management
                </Badge>
                <Link 
                  href="https://ma.linkedin.com/in/abdellah-raissouni-1419432a8" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group inline-flex items-center w-fit"
                >
                  <Badge variant="outline" className="border-[#FF6B00] text-[#FF6B00] px-4 py-1 text-sm group-hover:bg-[#FF6B00]/10 transition-all duration-300">
                    Made by Abdelah Raissouni
                    <Linkedin className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                  </Badge>
                </Link>
              </div>
              <div className="flex justify-center mb-8">
                <img src="/images/polaris-logo.png" alt="ADE ENSA Tetouan" className="h-24 w-auto" />
                </div>
              <h1 className="text-4xl lg:text-6xl font-extrabold leading-tight text-[#1B1464] text-center">
                Clubs Manager
                <br />
                <span className="text-[#FF6B00]">ENSA Tetouan</span>
              </h1>
              <p className="text-xl font-semibold text-gray-700 dark:text-gray-300 max-w-lg text-center mx-auto">
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
                    Join ADE ENSA Tetouan
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
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#1B1464] to-[#FF6B00] rounded-lg blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
                <Card className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-[#1B1464]/20 dark:border-[#FF6B00]/20 p-6 rounded-lg overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300">
                  <Tabs defaultValue="features" className="w-full">
                    <TabsList className="w-full bg-gray-100/50 dark:bg-gray-800/50 border border-[#1B1464]/20 dark:border-[#FF6B00]/20 rounded-lg mb-4">
                      <TabsTrigger 
                        value="features" 
                        className="flex-1 data-[state=active]:bg-[#1B1464] data-[state=active]:text-white dark:data-[state=active]:bg-[#FF6B00] dark:data-[state=active]:text-white transition-all duration-300"
                      >
                        Features
                      </TabsTrigger>
                      <TabsTrigger 
                        value="analytics" 
                        className="flex-1 data-[state=active]:bg-[#1B1464] data-[state=active]:text-white dark:data-[state=active]:bg-[#FF6B00] dark:data-[state=active]:text-white transition-all duration-300"
                      >
                        Analytics
                      </TabsTrigger>
                      <TabsTrigger 
                        value="calendar" 
                        className="flex-1 data-[state=active]:bg-[#1B1464] data-[state=active]:text-white dark:data-[state=active]:bg-[#FF6B00] dark:data-[state=active]:text-white transition-all duration-300"
                      >
                        Calendar
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="features" className="mt-4 space-y-4">
                        {features.map((feature, index) => (
                          <div
                            key={index}
                          className={`group p-4 rounded-lg transition-all duration-500 transform hover:scale-105 cursor-pointer ${
                              activeFeature === index
                              ? 'bg-gradient-to-r from-[#1B1464] to-[#FF6B00] text-white'
                              : 'bg-gray-50 dark:bg-gray-800/50 hover:bg-[#1B1464]/10 dark:hover:bg-[#FF6B00]/10'
                            }`}
                          onClick={() => setActiveFeature(index)}
                          >
                            <div className="flex items-start space-x-4">
                            <div className={`p-2 rounded-lg ${
                              activeFeature === index 
                                ? 'bg-white/20' 
                                : 'bg-[#1B1464]/10 dark:bg-[#FF6B00]/10'
                            }`}>
                              <feature.icon className={`h-6 w-6 ${
                                activeFeature === index 
                                  ? 'text-white' 
                                  : 'text-[#1B1464] dark:text-[#FF6B00]'
                              }`} />
                              </div>
                              <div>
                              <h3 className={`font-semibold ${
                                activeFeature === index 
                                  ? 'text-white' 
                                  : 'text-[#1B1464] dark:text-white'
                              }`}>{feature.title}</h3>
                              <p className={`text-sm ${
                                activeFeature === index 
                                  ? 'text-white/90' 
                                  : 'text-gray-600 dark:text-gray-300'
                              }`}>{feature.description}</p>
                              </div>
                              <CheckCircle2 className={`h-5 w-5 ml-auto ${
                              activeFeature === index 
                                ? 'opacity-100 text-white' 
                                : 'opacity-0 group-hover:opacity-50 text-[#1B1464] dark:text-[#FF6B00]'
                            } transition-all duration-300`} />
                            </div>
                          </div>
                        ))}
                    </TabsContent>

                    <TabsContent value="analytics" className="mt-4 space-y-4">
                      <div className="space-y-4">
                        <div className="h-[60px] bg-gray-50 dark:bg-gray-800/50 rounded-lg flex items-center justify-between px-4 hover:bg-[#1B1464]/10 dark:hover:bg-[#FF6B00]/10 transition-all duration-300 group cursor-pointer">
                          <div className="flex flex-col">
                            <span className="text-xs text-gray-500 dark:text-gray-400">Total Bookings</span>
                            <span className="font-bold text-lg text-[#1B1464] dark:text-[#FF6B00] group-hover:scale-110 transition-transform duration-300">1,248</span>
                          </div>
                          <div className="h-12 w-24 flex items-end space-x-1">
                            {[4, 6, 8, 5, 10, 7, 12].map((height, i) => (
                              <div 
                                key={i}
                                className="w-2 bg-gradient-to-t from-[#1B1464] to-[#FF6B00] dark:from-[#FF6B00] dark:to-[#1B1464] rounded-t group-hover:animate-bounce"
                                style={{ 
                                  height: `${height / 12 * 100}%`,
                                  animationDelay: `${i * 0.1}s`
                                }}
                              ></div>
                            ))}
                          </div>
                        </div>

                        <div className="h-[60px] bg-gray-50 dark:bg-gray-800/50 rounded-lg flex items-center justify-between px-4 hover:bg-[#1B1464]/10 dark:hover:bg-[#FF6B00]/10 transition-all duration-300 group cursor-pointer">
                          <div className="flex flex-col">
                            <span className="text-xs text-gray-500 dark:text-gray-400">Active Members</span>
                            <span className="font-bold text-lg text-[#1B1464] dark:text-[#FF6B00] group-hover:scale-110 transition-transform duration-300">342</span>
                          </div>
                          <div className="relative h-12 w-12">
                            <svg className="transform -rotate-90 w-12 h-12">
                              <circle
                                className="text-gray-200 dark:text-gray-700"
                                strokeWidth="2"
                                stroke="currentColor"
                                fill="transparent"
                                r="20"
                                cx="24"
                                cy="24"
                              />
                              <circle
                                className="text-[#1B1464] dark:text-[#FF6B00] transition-all duration-300"
                                strokeWidth="2"
                                strokeDasharray={125.6}
                                strokeDashoffset={125.6 * (1 - 0.75)}
                                strokeLinecap="round"
                                stroke="currentColor"
                                fill="transparent"
                                r="20"
                                cx="24"
                                cy="24"
                              />
                            </svg>
                            <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xs font-bold text-[#1B1464] dark:text-[#FF6B00]">
                              +24%
                            </span>
                            </div>
                          </div>

                        <div className="h-[60px] bg-gray-50 dark:bg-gray-800/50 rounded-lg flex items-center justify-between px-4 hover:bg-[#1B1464]/10 dark:hover:bg-[#FF6B00]/10 transition-all duration-300 group cursor-pointer">
                          <div className="flex flex-col">
                            <span className="text-xs text-gray-500 dark:text-gray-400">Space Utilization</span>
                            <span className="font-bold text-lg text-[#1B1464] dark:text-[#FF6B00] group-hover:scale-110 transition-transform duration-300">87%</span>
                          </div>
                          <div className="h-2 w-24 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-[#1B1464] to-[#FF6B00] rounded-full group-hover:animate-pulse"
                              style={{ width: '87%' }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="calendar" className="mt-4">
                      <div className="space-y-4">
                        <div className="grid grid-cols-7 gap-1 text-center text-xs">
                          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                            <div key={i} className="py-1 text-gray-500 dark:text-gray-400 font-medium">{day}</div>
                          ))}
                          {[...Array(31)].map((_, i) => {
                            const isToday = i === 14;
                            const hasEvent = [3, 7, 14, 21, 28].includes(i);
                            return (
                              <div 
                                key={i} 
                                className={`py-2 rounded-md cursor-pointer transition-all duration-300 hover:scale-110 ${
                                  isToday 
                                    ? 'bg-[#1B1464] dark:bg-[#FF6B00] text-white font-bold' 
                                    : hasEvent 
                                      ? 'bg-[#1B1464]/10 dark:bg-[#FF6B00]/10 text-[#1B1464] dark:text-[#FF6B00]' 
                                      : 'text-gray-600 dark:text-gray-400 hover:bg-[#1B1464]/5 dark:hover:bg-[#FF6B00]/5'
                                }`}
                              >
                                {i + 1}
                                {hasEvent && (
                                  <div className={`w-1 h-1 mx-auto mt-1 rounded-full ${
                                    isToday 
                                      ? 'bg-white' 
                                      : 'bg-[#1B1464] dark:bg-[#FF6B00]'
                                  }`}></div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        <div className="space-y-2 mt-4">
                          <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-md flex items-center space-x-3 hover:bg-[#1B1464]/10 dark:hover:bg-[#FF6B00]/10 transition-all duration-300 cursor-pointer group">
                            <div className="w-1 h-full self-stretch bg-[#1B1464] dark:bg-[#FF6B00] rounded-full group-hover:scale-y-110 transition-transform duration-300"></div>
                            <div>
                              <div className="text-sm font-medium text-[#1B1464] dark:text-[#FF6B00]">Tech Club Meeting</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center space-x-2">
                                <span>Room A101</span>
                                <span>•</span>
                                <span>2:00 PM</span>
                            </div>
                          </div>
                            <ChevronRight className="h-4 w-4 ml-auto text-gray-400 group-hover:text-[#1B1464] dark:group-hover:text-[#FF6B00] transform group-hover:translate-x-1 transition-all duration-300" />
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-md flex items-center space-x-3 hover:bg-[#1B1464]/10 dark:hover:bg-[#FF6B00]/10 transition-all duration-300 cursor-pointer group">
                            <div className="w-1 h-full self-stretch bg-[#1B1464] dark:bg-[#FF6B00] rounded-full group-hover:scale-y-110 transition-transform duration-300"></div>
                            <div>
                              <div className="text-sm font-medium text-[#1B1464] dark:text-[#FF6B00]">Debate Tournament</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center space-x-2">
                                <span>Auditorium</span>
                                <span>•</span>
                                <span>4:30 PM</span>
                            </div>
                            </div>
                            <ChevronRight className="h-4 w-4 ml-auto text-gray-400 group-hover:text-[#1B1464] dark:group-hover:text-[#FF6B00] transform group-hover:translate-x-1 transition-all duration-300" />
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
            <h2 className="text-4xl md:text-5xl font-extrabold mb-6 text-gray-900 dark:text-white">Everything you need to manage your club</h2>
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
            <h2 className="text-4xl font-extrabold mb-6 text-gray-900 dark:text-white">Loved by club leaders</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              See what other club leaders are saying about ADE ENSA Tetouan
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
                          "ADE ENSA Tetouan has completely transformed how we manage our club activities. 
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
                  
                  <h2 className="text-3xl md:text-4xl font-extrabold mb-4 text-gray-900 dark:text-white">
                    Navigate Your Club's Future with <span className="text-[#FF6B00]">ENSA Tetouan</span>
                  </h2>
                  
                  <p className="text-gray-700 dark:text-blue-200 mb-6">
                    Like the North Star guides travelers, let ADE ENSA Tetouan guide your club to new heights of organization and success.
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
                      className="border-blue-500 dark:border-blue-400/50 text-blue-600 dark:text-blue-300 hover:text-white hover:border-transparent transition-all duration-300 group"
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
                  "ADE ENSA Tetouan guided our club through the chaos of scheduling and space management, just like the North Star has guided sailors for centuries."
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
          @keyframes slowPulse {
            0% { opacity: 0.2; }
            50% { opacity: 0.4; }
            100% { opacity: 0.2; }
          }
          
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.05); opacity: 0.8; }
          }
          
          @keyframes orbit {
            from { transform: rotate(0deg) translateX(120px) rotate(0deg); }
            to { transform: rotate(360deg) translateX(120px) rotate(-360deg); }
          }
          
          @keyframes twinkle {
            0%, 100% { opacity: 0.2; }
            50% { opacity: 0.4; }
          }
        `}</style>
      </section>

      {/* Footer */}
      <footer id="contact" ref={footerRef} className="py-12 bg-gradient-to-b from-gray-100 to-white dark:from-black dark:to-gray-900 text-gray-600 dark:text-gray-400">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="relative h-12 w-auto">
                  <img src="/images/polaris-logo.png" alt="ADE ENSA Tetouan" className="h-full w-auto" style={{ minWidth: '120px' }} />
                </div>
              </div>
              <p className="text-sm font-semibold text-[#1B1464] dark:text-gray-300">
                Empowering student clubs and activities at <span className="text-[#FF6B00]">ENSA Tetouan</span> through innovative space management and collaboration tools.
              </p>
              <div className="flex space-x-4">
                <Link 
                  href="https://www.facebook.com/ENSATETOUAN" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[#1B1464] hover:text-[#FF6B00] dark:text-gray-400 dark:hover:text-[#FF6B00] transition-colors"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/>
                  </svg>
                </Link>
                <Link 
                  href="https://www.linkedin.com/company/ensa-tetouan" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[#1B1464] hover:text-[#FF6B00] dark:text-gray-400 dark:hover:text-[#FF6B00] transition-colors"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </Link>
                <Link 
                  href="https://twitter.com/ENSA_Tetouan" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[#1B1464] hover:text-[#FF6B00] dark:text-gray-400 dark:hover:text-[#FF6B00] transition-colors"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </Link>
            </div>
            </div>

            <div>
              <h4 className="font-semibold text-[#1B1464] dark:text-white mb-4">Quick Links</h4>
                <ul className="space-y-2">
                <li>
                  <Link href="#features" className="text-sm hover:text-[#FF6B00] dark:hover:text-[#FF6B00] transition-colors">
                    Features
                      </Link>
                    </li>
                <li>
                  <Link href="#testimonials" className="text-sm hover:text-[#FF6B00] dark:hover:text-[#FF6B00] transition-colors">
                    Testimonials
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="text-sm hover:text-[#FF6B00] dark:hover:text-[#FF6B00] transition-colors">
                    Login
                  </Link>
                </li>
                </ul>
              </div>

            <div>
              <h4 className="font-semibold text-[#1B1464] dark:text-white mb-4">Resources</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="https://www.ensatetouan.com" target="_blank" rel="noopener noreferrer" className="text-sm hover:text-[#FF6B00] dark:hover:text-[#FF6B00] transition-colors">
                    ENSA Tetouan
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm hover:text-[#FF6B00] dark:hover:text-[#FF6B00] transition-colors">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm hover:text-[#FF6B00] dark:hover:text-[#FF6B00] transition-colors">
                    Support
                  </Link>
                </li>
              </ul>
          </div>

            <div>
              <h4 className="font-semibold text-[#1B1464] dark:text-white mb-4">Contact</h4>
              <ul className="space-y-2">
                <li className="flex items-center space-x-2 text-sm">
                  <svg className="h-4 w-4 text-[#1B1464] dark:text-[#FF6B00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  <span>ENSA Tetouan, Morocco</span>
                </li>
                <li className="flex items-center space-x-2 text-sm">
                  <svg className="h-4 w-4 text-[#1B1464] dark:text-[#FF6B00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                  </svg>
                  <span>contact@ensatetouan.com</span>
                </li>
                <li className="flex items-center space-x-2 text-sm">
                  <svg className="h-4 w-4 text-[#1B1464] dark:text-[#FF6B00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                  </svg>
                  <span>+212 539 68 80 27</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-800 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="flex flex-col md:flex-row items-center gap-2 text-sm text-[#1B1464] dark:text-gray-400">
                <span>© {new Date().getFullYear()} ADE ENSA Tetouan.</span>
                <span className="hidden md:inline">|</span>
                <span>All rights reserved.</span>
                <span className="hidden md:inline">|</span>
              <Link 
                href="https://ma.linkedin.com/in/abdellah-raissouni-1419432a8" 
                target="_blank" 
                rel="noopener noreferrer"
                  className="text-[#FF6B00] hover:text-[#1B1464] dark:hover:text-white transition-colors flex items-center gap-1 group"
              >
                  Developed by Abdelah Raissouni
                  <Linkedin className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-2 group-hover:translate-x-0" />
              </Link>
            </div>
              <div className="flex space-x-6">
                <Link href="#" className="text-sm hover:text-[#FF6B00] dark:hover:text-[#FF6B00] transition-colors">Privacy Policy</Link>
                <Link href="#" className="text-sm hover:text-[#FF6B00] dark:hover:text-[#FF6B00] transition-colors">Terms of Service</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

