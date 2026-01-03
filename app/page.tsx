"use client"

import Link from "next/link"
import { Linkedin } from "lucide-react"
import { useEffect, useState } from "react"

export default function LandingPage() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <>
      <style jsx global>{`
        @keyframes liquid {
          0%, 100% {
            transform: translate(0, 0) scale(1) rotate(0deg);
            border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
          }
          25% {
            transform: translate(5%, -5%) scale(1.1) rotate(90deg);
            border-radius: 70% 30% 30% 70% / 70% 70% 30% 30%;
          }
          50% {
            transform: translate(-5%, 5%) scale(0.9) rotate(180deg);
            border-radius: 30% 70% 70% 30% / 70% 30% 30% 70%;
          }
          75% {
            transform: translate(5%, 5%) scale(1.05) rotate(270deg);
            border-radius: 70% 30% 30% 70% / 30% 70% 70% 30%;
          }
        }

        .grain-glass {
          background: rgba(255, 255, 255, 0.4);
          backdrop-filter: blur(40px) saturate(180%);
          -webkit-backdrop-filter: blur(40px) saturate(180%);
          position: relative;
        }

        .grain-glass::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='4' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.4'/%3E%3C/svg%3E");
          opacity: 0.15;
          pointer-events: none;
          border-radius: inherit;
        }

        .dark .grain-glass {
          background: rgba(255, 255, 255, 0.03);
        }

        .dark .grain-glass::before {
          opacity: 0.3;
        }
      `}</style>
      
      <div className="flex items-center justify-center min-h-screen py-12 px-4 bg-gradient-to-b from-white to-gray-50 dark:from-black dark:to-gray-950 relative overflow-hidden">
        {/* Liquid glass background animations */}
        <div className="absolute inset-0 overflow-hidden">
          <div 
            className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-blue-500/15 via-purple-500/15 to-pink-500/15 dark:from-blue-500/8 dark:via-purple-500/8 dark:to-pink-500/8 rounded-full blur-3xl"
            style={{ animation: 'liquid 20s ease-in-out infinite' }}
          ></div>
          <div 
            className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-indigo-500/15 via-cyan-500/15 to-blue-500/15 dark:from-indigo-500/8 dark:via-cyan-500/8 dark:to-blue-500/8 rounded-full blur-3xl"
            style={{ animation: 'liquid 25s ease-in-out infinite reverse' }}
          ></div>
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/2 h-1/2 bg-gradient-to-r from-violet-500/10 to-blue-500/10 dark:from-violet-500/5 dark:to-blue-500/5 rounded-full blur-3xl"
            style={{ animation: 'liquid 30s ease-in-out infinite' }}
          ></div>
        </div>

        <div className={`relative z-10 w-full max-w-2xl mx-auto transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {/* Glass morphism card with grain */}
          <div className="grain-glass rounded-2xl border border-white/30 dark:border-white/10 shadow-2xl shadow-black/5 dark:shadow-black/50 p-8 md:p-12">
            <div className="relative z-10 text-center space-y-10">
              {/* Main heading */}
              <div className="space-y-6">
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-light tracking-tight text-gray-900 dark:text-white">
                  Coming Soon
                </h1>
                <div className="w-12 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent dark:via-gray-700 mx-auto"></div>
              </div>

              {/* Subtitle with logo */}
              <div className="flex flex-col items-center justify-center gap-4">
                <p className="text-xl md:text-2xl font-extralight text-gray-500 dark:text-gray-400 tracking-wide">
                  I am working on something special for the next
                </p>
                <div className="relative h-12 md:h-16 w-auto">
                  <img 
                    src="/images/polaris-logo.png" 
                    alt="ADE ENSA Tetouan" 
                    className="h-full w-auto object-contain"
                  />
                </div>
              </div>

              {/* Creator section */}
              <div className="pt-8 border-t border-gray-200/30 dark:border-gray-800/30">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-400 dark:text-gray-600 mb-6 font-light">
                  Crafted by
                </p>
                <Link 
                  href="https://ma.linkedin.com/in/abdellah-raissouni-1419432a8" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 px-8 py-3 rounded-xl backdrop-blur-xl bg-white/60 dark:bg-white/8 border border-white/40 dark:border-white/12 text-gray-900 dark:text-white hover:bg-white/80 dark:hover:bg-white/12 hover:shadow-xl hover:scale-[1.02] transition-all duration-500 group"
                >
                  <span className="text-lg font-light tracking-tight">Abdellah Raissouni</span>
                  <Linkedin className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-all duration-500 -translate-x-3 group-hover:translate-x-0 text-blue-600 dark:text-blue-400" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
