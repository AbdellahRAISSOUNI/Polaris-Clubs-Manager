"use client"

import React, { useState, useEffect } from 'react'
import { useMessaging } from '@/lib/messaging-context'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ArrowLeft } from 'lucide-react'

interface NewConversationProps {
  userId: string
  userType: 'admin' | 'club'
  onConversationCreated?: () => void
  onClose?: () => void
}

export function NewConversation({ userId, userType, onConversationCreated, onClose }: NewConversationProps) {
  const { sendMessage } = useMessaging()
  const [recipients, setRecipients] = useState<{ id: string, name: string, avatar?: string, type: 'admin' | 'club' }[]>([])
  const [selectedRecipient, setSelectedRecipient] = useState<string>('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)

  // Fetch potential recipients when component mounts
  useEffect(() => {
    fetchRecipients()
  }, [userType])

  const fetchRecipients = async () => {
    setLoading(true)
    try {
      if (userType === 'admin') {
        // Admin can message clubs
        const response = await fetch('/api/clubs')
        if (response.ok) {
          const clubs = await response.json()
          setRecipients(
            clubs.map((club: any) => ({
              id: club.id,
              name: club.name,
              avatar: club.logo,
              type: 'club' as const
            }))
          )
        }
      } else if (userType === 'club') {
        // Clubs can message admins
        const response = await fetch('/api/users?role=admin')
        if (response.ok) {
          const admins = await response.json()
          setRecipients(
            admins.map((admin: any) => ({
              id: admin.id,
              name: admin.name || 'Admin',
              avatar: admin.avatar_url,
              type: 'admin' as const
            }))
          )
        }
      }
    } catch (error) {
      console.error('Error fetching recipients:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!selectedRecipient || !message.trim()) return

    setSending(true)
    try {
      const recipient = recipients.find(r => r.id === selectedRecipient)
      if (!recipient) return

      await sendMessage(recipient.id, recipient.type, message)
      
      // Reset form and close
      setSelectedRecipient('')
      setMessage('')
      if (onClose) {
        onClose()
      }
      
      // Notify parent component
      if (onConversationCreated) {
        onConversationCreated()
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onClose}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold">New Conversation</h2>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Select Recipient</label>
          <Select value={selectedRecipient} onValueChange={setSelectedRecipient}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={loading ? "Loading..." : "Choose a recipient"} />
            </SelectTrigger>
            <SelectContent>
              {loading ? (
                <SelectItem value="loading" disabled>
                  Loading...
                </SelectItem>
              ) : recipients.length === 0 ? (
                <SelectItem value="none" disabled>
                  No recipients available
                </SelectItem>
              ) : (
                recipients.map((recipient) => (
                  <SelectItem key={recipient.id} value={recipient.id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={recipient.avatar} />
                        <AvatarFallback>{recipient.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span>{recipient.name}</span>
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Message</label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="min-h-[100px] resize-none"
          />
        </div>

        <Button 
          onClick={handleSendMessage} 
          disabled={!selectedRecipient || !message.trim() || sending}
          className="w-full"
        >
          {sending ? 'Sending...' : 'Start Conversation'}
        </Button>
      </div>
    </div>
  )
} 