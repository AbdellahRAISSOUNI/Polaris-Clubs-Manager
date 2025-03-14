"use client"

import { motion } from "framer-motion"
import { Mail, Phone, Linkedin, Github } from "lucide-react"
import { Card } from "@/components/ui/card"

interface ContactPerson {
  name: string
  role: string
  email: string
  phone?: string
  linkedin?: string
  github?: string
  image: string
  description: string
}

const contacts: ContactPerson[] = [
  {
    name: "Abdellah ElBerkaoui",
    role: "Clubs Coordinator at ADE",
    email: "abdellah.elberkaoui@aui.ma",
    phone: "+212 XXX-XXXXXX", // Replace with actual phone
    linkedin: "https://www.linkedin.com/in/abdellah-elberkaoui/", // Replace with actual LinkedIn
    image: "/abdellah.jpg", // Will be replaced with actual image
    description: "As the Clubs Coordinator at Al Akhawayn Development & Engineering (ADE), Abdellah plays a vital role in fostering student engagement and leadership through club activities. With extensive experience in student affairs and club management, he ensures that AUI's diverse club ecosystem thrives and contributes to students' personal and professional growth."
  },
  {
    name: "Yassine Ait Mensour", // Replace with your name
    role: "Full Stack Developer",
    email: "y.aitmensour@aui.ma", // Replace with your email
    github: "https://github.com/yourusername", // Replace with your GitHub
    linkedin: "https://www.linkedin.com/in/yourusername/", // Replace with your LinkedIn
    image: "/yassine.jpg", // Will be replaced with actual image
    description: "A passionate full-stack developer with expertise in modern web technologies. Creator of the Polaris Clubs Manager platform, dedicated to streamlining club management and enhancing the student experience at AUI. Committed to building efficient, user-friendly solutions that make a real difference in university operations."
  }
]

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-background -rotate-12 transform origin-top-left" />
      
      {/* Content */}
      <div className="relative container mx-auto py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Meet the Team</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Get to know the people behind Polaris Clubs Manager, working to enhance the club experience at Al Akhawayn University.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {contacts.map((contact, index) => (
            <motion.div
              key={contact.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 }}
            >
              <Card className="group relative overflow-hidden">
                <div className="aspect-[4/3] relative overflow-hidden">
                  {/* Placeholder gradient while image loads */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/30" />
                  
                  {/* Image */}
                  <img
                    src={contact.image}
                    alt={contact.name}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                  />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-background/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                {/* Content */}
                <div className="absolute inset-0 flex flex-col justify-end p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <h2 className="text-2xl font-bold mb-2">{contact.name}</h2>
                  <p className="text-primary font-medium mb-4">{contact.role}</p>
                  <p className="text-sm text-muted-foreground mb-6 line-clamp-3">
                    {contact.description}
                  </p>
                  
                  {/* Contact links */}
                  <div className="flex gap-4">
                    <a
                      href={`mailto:${contact.email}`}
                      className="p-2 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
                      title="Email"
                    >
                      <Mail className="h-5 w-5" />
                    </a>
                    {contact.phone && (
                      <a
                        href={`tel:${contact.phone}`}
                        className="p-2 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
                        title="Phone"
                      >
                        <Phone className="h-5 w-5" />
                      </a>
                    )}
                    {contact.linkedin && (
                      <a
                        href={contact.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
                        title="LinkedIn"
                      >
                        <Linkedin className="h-5 w-5" />
                      </a>
                    )}
                    {contact.github && (
                      <a
                        href={contact.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
                        title="GitHub"
                      >
                        <Github className="h-5 w-5" />
                      </a>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Additional Information */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold mb-4">About Polaris Clubs Manager</h2>
          <p className="text-muted-foreground max-w-3xl mx-auto">
            Polaris Clubs Manager is a comprehensive platform designed to streamline club management at Al Akhawayn University.
            Our mission is to enhance the club experience for both administrators and students, making it easier to organize,
            participate in, and manage club activities.
          </p>
        </div>
      </div>
    </div>
  )
} 