"use client"

import { motion } from "framer-motion"
import { Mail, Phone, Linkedin, Github } from "lucide-react"
import { useState } from "react"
import { useTheme } from "next-themes"

interface ContactPerson {
  name: string
  role: string
  email: string
  phone?: string
  linkedin?: string
  github?: string
  image: string
  color: string
}

const contacts: ContactPerson[] = [
  {
    name: "Abdellah Elberkaoui",
    role: "Clubs Coordinator",
    email: "abdellah.elberkaoui@aui.ma",
    phone: "0691837954",
    linkedin: "https://www.linkedin.com/in/abdellah-elberkaoui-1a3493195",
    image: "/admin.jpeg",
    color: "hsl(var(--primary))"
  },
  {
    name: "Abdellah Raissouni",
    role: "Developer & Creator of this platform.",
    email: "a.raissouni@aui.ma",
    github: "https://github.com/AbdellahRAISSOUNI",
    linkedin: "https://ma.linkedin.com/in/abdellah-raissouni-1419432a8",
    image: "/creator.jpeg",
    color: "hsl(var(--primary))"
  }
]

// Icon animation variants
const iconVariants = {
  hover: {
    rotate: [0, -10, 10, -10, 0],
    scale: 1.2,
    transition: {
      duration: 0.5
    }
  }
}

export default function ContactPage() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [hoveredIcon, setHoveredIcon] = useState<string | null>(null)
  const { theme } = useTheme()
  
  return (
    <div className="p-6 pt-2">
      <div className="w-full max-w-5xl mx-auto">
        {/* Page Title and Subtitle */}
        <motion.div 
          className="text-center mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            <span className="border-b-2 border-primary pb-1">Contact Us</span>
          </h1>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">
            Reach out to the team behind Ade Clubs Manager
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {contacts.map((contact, index) => (
            <motion.div
              key={contact.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.2 }}
              className="relative"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <motion.div 
                className="overflow-hidden rounded-xl border border-border shadow-sm transition-all duration-300"
                animate={{
                  borderColor: hoveredIndex === index ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                  boxShadow: hoveredIndex === index ? `0 10px 25px -5px rgba(var(--primary-rgb), 0.15)` : '0 1px 3px rgba(0,0,0,0.05)'
                }}
              >
                <div className="relative h-[280px] overflow-hidden">
                  <motion.div 
                    className="absolute inset-0 z-10"
                    animate={{
                      opacity: hoveredIndex === index ? 0.2 : 0.1
                    }}
                    style={{
                      background: `linear-gradient(45deg, hsl(var(--primary))40, transparent)`
                    }}
                  />
                  <motion.img
                    src={contact.image}
                    alt={contact.name}
                    className="w-full h-full object-cover object-center"
                    initial={{ scale: 1 }}
                    animate={{ 
                      scale: hoveredIndex === index ? 1.05 : 1
                    }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
                
                <div className="p-6">
                  <h2 className="text-2xl font-semibold mb-1">
                    {contact.name}
                  </h2>
                  <p 
                    className="mb-5 text-sm text-primary"
                  >
                    {contact.role}
                  </p>
                  
                  <div className="flex flex-wrap gap-4">
                    <motion.a
                      href={`mailto:${contact.email}`}
                      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      whileHover={{ y: -2 }}
                      onMouseEnter={() => setHoveredIcon(`${index}-email`)}
                      onMouseLeave={() => setHoveredIcon(null)}
                    >
                      <motion.div
                        variants={iconVariants}
                        animate={hoveredIcon === `${index}-email` ? 'hover' : undefined}
                      >
                        <Mail className="h-4 w-4 text-primary" />
                      </motion.div>
                      <span>Email</span>
                    </motion.a>
                    {contact.phone && (
                      <motion.a
                        href={`tel:${contact.phone}`}
                        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        whileHover={{ y: -2 }}
                        onMouseEnter={() => setHoveredIcon(`${index}-phone`)}
                        onMouseLeave={() => setHoveredIcon(null)}
                      >
                        <motion.div
                          variants={iconVariants}
                          animate={hoveredIcon === `${index}-phone` ? 'hover' : undefined}
                        >
                          <Phone className="h-4 w-4 text-primary" />
                        </motion.div>
                        <span>Call</span>
                      </motion.a>
                    )}
                    {contact.linkedin && (
                      <motion.a
                        href={contact.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        whileHover={{ y: -2 }}
                        onMouseEnter={() => setHoveredIcon(`${index}-linkedin`)}
                        onMouseLeave={() => setHoveredIcon(null)}
                      >
                        <motion.div
                          variants={iconVariants}
                          animate={hoveredIcon === `${index}-linkedin` ? 'hover' : undefined}
                        >
                          <Linkedin className="h-4 w-4 text-primary" />
                        </motion.div>
                        <span>LinkedIn</span>
                      </motion.a>
                    )}
                    {contact.github && (
                      <motion.a
                        href={contact.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        whileHover={{ y: -2 }}
                        onMouseEnter={() => setHoveredIcon(`${index}-github`)}
                        onMouseLeave={() => setHoveredIcon(null)}
                      >
                        <motion.div
                          variants={iconVariants}
                          animate={hoveredIcon === `${index}-github` ? 'hover' : undefined}
                        >
                          <Github className="h-4 w-4 text-primary" />
                        </motion.div>
                        <span>GitHub</span>
                      </motion.a>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
} 