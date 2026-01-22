"use client"

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useMessaging, Message } from '@/lib/messaging-context'
import { format } from 'date-fns'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Search, 
  Send, 
  MessageSquare, 
  Clock, 
  Plus, 
  UserPlus, 
  X, 
  MoreVertical, 
  Trash, 
  Reply, 
  Smile,
  Menu,
  ArrowLeft,
  MailOpen
} from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { NewConversation } from '@/components/messaging/NewConversation'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { toast } from 'sonner'
import { Checkbox } from '@/components/ui/checkbox'

// Common emoji reactions
const commonEmojis = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '👏']

interface MessagingUIProps {
  userId: string
  userType: 'admin' | 'club'
}

function BroadcastMessage({ onClose, userId, sendMessage }: { 
  onClose: () => void;
  userId: string;
  sendMessage: (recipientId: string, recipientType: 'admin' | 'club', content: string, replyToId?: string) => Promise<void>;
}) {
  const [message, setMessage] = useState('')
  const [clubs, setClubs] = useState<{ id: string; name: string; selected: boolean }[]>([])
  const [selectAll, setSelectAll] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingClubs, setLoadingClubs] = useState(true)
  
  // Fetch clubs on mount
  useEffect(() => {
    const fetchClubs = async () => {
      const response = await fetch('/api/clubs')
      
      if (!response.ok) {
        console.error('Error fetching clubs:', response.statusText)
        toast.error('Failed to load clubs')
        return
      }
      
      const data = await response.json()
      setClubs(data.map((club: any) => ({ ...club, selected: false })))
      setLoadingClubs(false)
    }
    
    fetchClubs()
  }, [])
  
  // Handle select all toggle
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked)
    setClubs(clubs.map(club => ({ ...club, selected: checked })))
  }
  
  // Handle individual club selection
  const handleClubSelect = (clubId: string, checked: boolean) => {
    setClubs(clubs.map(club => 
      club.id === clubId ? { ...club, selected: checked } : club
    ))
    setSelectAll(clubs.every(club => 
      club.id === clubId ? checked : club.selected
    ))
  }
  
  // Handle sending broadcast message
  const handleSendBroadcast = async () => {
    const selectedClubs = clubs.filter(club => club.selected)
    if (selectedClubs.length === 0) {
      toast.error('Please select at least one club')
      return
    }
    
    if (!message.trim()) {
      toast.error('Please enter a message')
      return
    }
    
    setLoading(true)
    try {
      // Send message to each selected club using sendMessage
      await Promise.all(
        selectedClubs.map(club => 
          sendMessage(club.id, 'club', message)
        )
      )
      
      toast.success(`Message sent to ${selectedClubs.length} club${selectedClubs.length > 1 ? 's' : ''}`)
      onClose()
    } catch (error) {
      console.error('Error sending broadcast:', error)
      toast.error('Failed to send broadcast message')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Send Broadcast Message</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="select-all" 
              checked={selectAll}
              onCheckedChange={handleSelectAll}
            />
            <label htmlFor="select-all">Select All Clubs</label>
          </div>
          <ScrollArea className="h-[200px] border rounded-md p-2">
            {loadingClubs ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {clubs.map(club => (
                  <div key={club.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={club.id}
                      checked={club.selected}
                      onCheckedChange={(checked) => handleClubSelect(club.id, checked as boolean)}
                    />
                    <label htmlFor={club.id}>{club.name}</label>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          <Textarea
            placeholder="Type your broadcast message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-[100px]"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button 
              onClick={handleSendBroadcast} 
              disabled={loading || !message.trim() || clubs.every(club => !club.selected)}
            >
              {loading ? 'Sending...' : 'Send Broadcast'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function MessagingUI({ userId, userType }: MessagingUIProps) {
  const { 
    messages, 
    loading, 
    sendMessage, 
    markAsRead, 
    markAllAsRead, 
    getConversations, 
    getConversationMessages,
    onlineStatuses,
    deleteMessage,
    reactToMessage
  } = useMessaging()
  
  const [conversations, setConversations] = useState<{ id: string, type: 'admin' | 'club', lastMessage: Message | null, name: string, avatar?: string }[]>([])
  const [activeConversation, setActiveConversation] = useState<string | null>(null)
  const [activeConversationType, setActiveConversationType] = useState<'admin' | 'club' | null>(null)
  const [conversationMessages, setConversationMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loadingConversation, setLoadingConversation] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [showNewConversation, setShowNewConversation] = useState<false | true | 'broadcast'>(false)
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [isUserScrolling, setIsUserScrolling] = useState(false)
  const scrollTimeout = useRef<NodeJS.Timeout>()
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const lastScrollPosition = useRef<number>(0)
  const [isNearBottom, setIsNearBottom] = useState(true)
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [selectedConversations, setSelectedConversations] = useState<Set<string>>(new Set())
  const [isBulkActionLoading, setIsBulkActionLoading] = useState(false)

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false)
      } else {
        setIsSidebarOpen(true)
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Add effect to handle body scroll lock
  useEffect(() => {
    if (isMobile && isSidebarOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'auto'
    }
    
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [isMobile, isSidebarOpen])

  // Fetch conversations when messages change
  useEffect(() => {
    const fetchConversations = async () => {
      const convos = await getConversations()
      
      // Fetch names for each conversation partner
      const conversationsWithNames = await Promise.all(
        convos.map(async (convo) => {
          let name = 'Unknown'
          let avatar = undefined
          
          if (convo.type === 'admin') {
            const response = await fetch(`/api/users?id=${convo.id}`)
            if (response.ok) {
              const data = await response.json()
              name = data.name || 'Admin'
              avatar = data.avatar_url
            } else {
              name = 'Admin'
            }
          } else if (convo.type === 'club') {
            const response = await fetch(`/api/clubs?id=${convo.id}`)
            if (response.ok) {
              const data = await response.json()
              name = data.name
              avatar = data.logo
            }
          }
          
          return {
            ...convo,
            name,
            avatar
          }
        })
      )
      
      setConversations(conversationsWithNames)
      
      // Only set active conversation if there isn't one already
      if (!activeConversation && conversationsWithNames.length > 0) {
        const firstConvo = conversationsWithNames[0];
        setActiveConversation(firstConvo.id)
        setActiveConversationType(firstConvo.type)
        
        // Preload messages for the first conversation
        preloadConversationMessages(firstConvo.id, firstConvo.type);
      }
    }
    
    fetchConversations()
  }, [getConversations, activeConversation])

  // Preload messages for faster display
  const preloadConversationMessages = useCallback(async (partnerId: string, partnerType: 'admin' | 'club') => {
    // First try to get messages from the global messages state
    const relevantMessages = messages.filter(msg => 
      (msg.sender_id === partnerId && msg.sender_type === partnerType && 
       msg.recipient_id === userId && msg.recipient_type === userType) || 
      (msg.sender_id === userId && msg.sender_type === userType && 
       msg.recipient_id === partnerId && msg.recipient_type === partnerType)
    );
    
    if (relevantMessages.length > 0) {
      // If we have messages in the state, use them immediately
      const sortedMessages = [...relevantMessages].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      
      setConversationMessages(sortedMessages);
      
      // Then fetch from API in the background to ensure we have the latest
      getConversationMessages(partnerId, partnerType)
        .then(freshMsgs => {
          // Only update if we have new messages
          if (freshMsgs.length > relevantMessages.length) {
            const sortedFreshMsgs = freshMsgs.sort((a, b) => 
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
            setConversationMessages(sortedFreshMsgs);
          }
          
          // Mark unread messages as read
          const unreadMessages = freshMsgs.filter(msg => 
            !msg.is_read && 
            msg.recipient_id === userId && 
            msg.recipient_type === userType
          );
          
          if (unreadMessages.length > 0) {
            markAllAsRead(partnerId, partnerType);
          }
        })
        .catch(err => {
          console.error('Error loading conversation messages in background:', err);
        });
    } else {
      // If no messages in state, load from API
      getConversationMessages(partnerId, partnerType)
        .then(msgs => {
          const sortedMsgs = msgs.sort((a, b) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
          setConversationMessages(sortedMsgs);
          
          // Mark unread messages as read
          const unreadMessages = msgs.filter(msg => 
            !msg.is_read && 
            msg.recipient_id === userId && 
            msg.recipient_type === userType
          );
          
          if (unreadMessages.length > 0) {
            markAllAsRead(partnerId, partnerType);
          }
        })
        .catch(err => {
          console.error('Error loading conversation messages:', err);
          setLoadingConversation(false);
        });
    }
  }, [messages, userId, userType, getConversationMessages, markAllAsRead]);

  // Update conversation messages when global messages change
  useEffect(() => {
    if (activeConversation && activeConversationType) {
      // Filter messages for the current conversation
      const relevantMessages = messages.filter(msg => 
        (msg.sender_id === activeConversation && msg.sender_type === activeConversationType && 
         msg.recipient_id === userId && msg.recipient_type === userType) || 
        (msg.sender_id === userId && msg.sender_type === userType && 
         msg.recipient_id === activeConversation && msg.recipient_type === activeConversationType)
      );
      
      if (relevantMessages.length > 0) {
        // Get current scroll position before updating
        const scrollArea = scrollAreaRef.current;
        let previousScrollTop = 0;
        let previousScrollHeight = 0;
        
        if (scrollArea) {
          previousScrollTop = scrollArea.scrollTop;
          previousScrollHeight = scrollArea.scrollHeight;
        }
        
        // Sort messages by date
        const sortedMessages = [...relevantMessages].sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        
        // Update conversation messages
        setConversationMessages(sortedMessages);
        
        // Maintain scroll position after update
        setTimeout(() => {
          if (scrollArea) {
            const newScrollHeight = scrollArea.scrollHeight;
            const heightDifference = newScrollHeight - previousScrollHeight;
            scrollArea.scrollTop = previousScrollTop + heightDifference;
          }
        });
        
        // Mark any unread messages as read if user is at bottom of chat
        if (!isUserScrolling && isNearBottom) {
          const unreadMessages = sortedMessages.filter(msg => 
            !msg.is_read && 
            msg.recipient_id === userId && 
            msg.recipient_type === userType
          );
          
          if (unreadMessages.length > 0) {
            console.log('Marking messages as read on message update:', unreadMessages.length);
            unreadMessages.forEach(msg => {
              markAsRead(msg.id);
            });
          }
        }
      }
    }
  }, [messages, activeConversation, activeConversationType, userId, userType, markAsRead, isUserScrolling, isNearBottom]);

  // Handle scroll events
  const handleScroll = useCallback(() => {
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }
    
    const scrollArea = scrollAreaRef.current;
    if (scrollArea) {
      const { scrollTop, scrollHeight, clientHeight } = scrollArea;
      const scrolledToBottom = scrollHeight - scrollTop - clientHeight < 100;
      setIsNearBottom(scrolledToBottom);
    }
    
    setIsUserScrolling(true);
    
    // Reset the scrolling state after 150ms of no scrolling
    scrollTimeout.current = setTimeout(() => {
      setIsUserScrolling(false);
    }, 150);
  }, []);

  // Add scroll event listener
  useEffect(() => {
    const scrollArea = scrollAreaRef.current;
    if (scrollArea) {
      scrollArea.addEventListener('scroll', handleScroll);
      return () => {
        scrollArea.removeEventListener('scroll', handleScroll);
      };
    }
  }, [handleScroll]);

  // Scroll to bottom when messages change
  useEffect(() => {
    // Only scroll to bottom if:
    // 1. The last message is from the current user (they just sent it)
    // 2. The last message is new (within the last second)
    if (conversationMessages.length > 0) {
      const lastMessage = conversationMessages[conversationMessages.length - 1]
      const isNewMessage = new Date().getTime() - new Date(lastMessage.created_at).getTime() < 1000
      const isUserMessage = lastMessage.sender_id === userId && lastMessage.sender_type === userType
      
      if (isNewMessage || isUserMessage) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }, [conversationMessages, userId, userType])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [newMessage]);

  // Listen for new messages but with a debounce to prevent flickering
  useEffect(() => {
    if (!activeConversation || !activeConversationType) return;
    
    // Create a stable reference to the current messages
    const currentMessagesRef = conversationMessages.map(m => m.id);
    
    // Filter messages for the active conversation
    const relevantMessages = messages.filter(msg => 
      (msg.sender_id === activeConversation && msg.sender_type === activeConversationType && 
       msg.recipient_id === userId && msg.recipient_type === userType) || 
      (msg.sender_id === userId && msg.sender_type === userType && 
       msg.recipient_id === activeConversation && msg.recipient_type === activeConversationType)
    );
    
    if (relevantMessages.length === 0) return;
    
    // Create a reference to the new messages
    const newMessagesRef = relevantMessages.map(m => m.id);
    
    // Check if we have any new messages that aren't in our current list
    const hasNewMessages = newMessagesRef.some(id => !currentMessagesRef.includes(id));
    
    // Only update if we have new messages and:
    // 1. User is not scrolling, or
    // 2. User is near bottom
    if (hasNewMessages && (!isUserScrolling || isNearBottom)) {
      // Store current scroll position
      const scrollArea = scrollAreaRef.current;
      const previousScrollTop = scrollArea?.scrollTop || 0;
      const previousScrollHeight = scrollArea?.scrollHeight || 0;
      
      // Use a debounce to prevent rapid updates
      const timer = setTimeout(() => {
        const sortedMessages = [...relevantMessages].sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        
        setConversationMessages(sortedMessages);
        
        // If user was near bottom, scroll to bottom
        if (isNearBottom) {
          setShouldScrollToBottom(true);
        } else {
          // Otherwise preserve scroll position
          requestAnimationFrame(() => {
            if (scrollArea) {
              const newScrollHeight = scrollArea.scrollHeight;
              const heightDifference = newScrollHeight - previousScrollHeight;
              scrollArea.scrollTop = previousScrollTop + heightDifference;
            }
          });
        }
        
        // Mark any unread messages as read
        const unreadMessages = sortedMessages.filter(msg => 
          !msg.is_read && 
          msg.recipient_id === userId && 
          msg.recipient_type === userType
        );
        
        if (unreadMessages.length > 0) {
          unreadMessages.forEach(msg => {
            markAsRead(msg.id);
          });
        }
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [messages, activeConversation, activeConversationType, userId, userType, markAsRead, isUserScrolling, isNearBottom]);

  // Scroll to bottom when needed
  useEffect(() => {
    if (shouldScrollToBottom && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      setShouldScrollToBottom(false);
    }
  }, [shouldScrollToBottom]);

  // Handle sending a new message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeConversation || !activeConversationType) return
    
    try {
      await sendMessage(
        activeConversation, 
        activeConversationType, 
        newMessage,
        replyingTo?.id
      )
      setNewMessage('')
      setReplyingTo(null)
      setShouldScrollToBottom(true)
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
    }
  }

  // Handle deleting a message
  const handleDeleteMessage = async (messageId: string) => {
    try {
      await deleteMessage(messageId)
      toast.success('Message deleted')
    } catch (error: any) {
      console.error('Error deleting message:', error)
      toast.error(error.message || 'Failed to delete message')
    }
  }

  // Handle reacting to a message
  const handleReactToMessage = async (messageId: string, emoji: string) => {
    try {
      await reactToMessage(messageId, emoji)
    } catch (error) {
      console.error('Error reacting to message:', error)
      toast.error('Failed to add reaction')
    }
  }

  // Check if a message can be deleted (less than 15 minutes old)
  const canDeleteMessage = (message: Message) => {
    if (message.sender_id !== userId || message.sender_type !== userType) {
      return false
    }
    
    const messageTime = new Date(message.created_at).getTime()
    const currentTime = new Date().getTime()
    const fifteenMinutesInMs = 15 * 60 * 1000
    
    return currentTime - messageTime <= fifteenMinutesInMs
  }

  // Format reactions for display
  const formatReactions = (reactions?: Record<string, string>) => {
    if (!reactions) return []
    
    // Group reactions by emoji
    const emojiCounts: Record<string, number> = {}
    Object.values(reactions).forEach(emoji => {
      emojiCounts[emoji] = (emojiCounts[emoji] || 0) + 1
    })
    
    // Convert to array of {emoji, count}
    return Object.entries(emojiCounts).map(([emoji, count]) => ({
      emoji,
      count,
      // Check if current user reacted with this emoji
      userReacted: Object.entries(reactions).some(
        ([key, value]) => key === `${userType}-${userId}` && value === emoji
      )
    }))
  }

  // Handle selecting a conversation
  const handleSelectConversation = async (partnerId: string, partnerType: 'admin' | 'club') => {
    if (isMobile) {
      setIsSidebarOpen(false)
    }
    handleOpenConversation(partnerId, partnerType)
  }

  // Format timestamp for display
  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    
    // If message is from today, just show time
    if (date.toDateString() === now.toDateString()) {
      return format(date, 'h:mm a')
    }
    // If message is from yesterday, show "Yesterday" and time
    else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${format(date, 'h:mm a')}`
    }
    // Otherwise show date and time
    else {
      return format(date, 'MMM d, h:mm a')
    }
  }

  // Check if user is online
  const isUserOnline = (userId: string, userType: 'admin' | 'club') => {
    const status = onlineStatuses[`${userType}-${userId}`]
    if (!status) return false
    
    // Consider user online if they were active in the last 5 minutes
    const lastActive = new Date(status.last_active)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    
    return status.is_online || lastActive > fiveMinutesAgo
  }

  // Get last active time
  const getLastActiveTime = (userId: string, userType: 'admin' | 'club') => {
    const status = onlineStatuses[`${userType}-${userId}`]
    if (!status) return null
    
    return new Date(status.last_active)
  }

  // Format last active time
  const formatLastActive = (lastActive: Date | null) => {
    if (!lastActive) return 'Unknown'
    
    const now = new Date()
    const diffMinutes = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60))
    
    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes} min ago`
    
    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours < 24) return `${diffHours} hr ago`
    
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    
    return format(lastActive, 'MMM d, yyyy')
  }

  // Filter conversations by search query and calculate unread counts
  const filteredConversations = conversations.map(convo => {
    // Only count messages as unread if they're not from the active conversation
    const unreadCount = messages.filter(
      msg =>
        !msg.is_read &&
        msg.recipient_id === userId &&
        msg.recipient_type === userType &&
        msg.sender_id === convo.id &&
        msg.sender_type === convo.type &&
        // Don't show unread count for active conversation
        !(activeConversation === convo.id && activeConversationType === convo.type)
    ).length;
    
    return {
      ...convo,
      unreadCount
    };
  }).filter(convo =>
    convo.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Add handler for reply
  const handleReply = (message: Message) => {
    setReplyingTo(message)
    textareaRef.current?.focus()
  }

  // Bulk action handlers
  const handleBulkMessageAction = async (action: 'markRead' | 'delete') => {
    if (selectedConversations.size === 0) return

    setIsBulkActionLoading(true)
    try {
      // Get all message IDs from selected conversations
      const messageIds: string[] = []
      for (const convoId of selectedConversations) {
        const convo = conversations.find(c => c.id === convoId)
        if (convo) {
          const convoMessages = messages.filter(msg =>
            (msg.sender_id === convo.id && msg.sender_type === convo.type && msg.recipient_id === userId && msg.recipient_type === userType) ||
            (msg.sender_id === userId && msg.sender_type === userType && msg.recipient_id === convo.id && msg.recipient_type === convo.type)
          )
          messageIds.push(...convoMessages.map(m => m.id))
        }
      }

      if (messageIds.length === 0) {
        setSelectedConversations(new Set())
        setIsBulkActionLoading(false)
        return
      }

      const response = await fetch('/api/messages/bulk', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
          'x-user-type': userType,
        },
        body: JSON.stringify({
          messageIds,
          action,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to perform bulk action')
      }

      const result = await response.json()
      
      toast.success(result.message || `Successfully processed ${selectedConversations.size} conversation(s)`)
      
      // Clear selection and refresh
      setSelectedConversations(new Set())
      // Refresh conversations
      const freshConversations = await getConversations()
      setConversations(freshConversations)
    } catch (error: any) {
      console.error('Error performing bulk action:', error)
      toast.error(error.message || 'Failed to perform bulk action')
    } finally {
      setIsBulkActionLoading(false)
    }
  }

  const toggleConversationSelection = (conversationId: string) => {
    setSelectedConversations(prev => {
      const newSet = new Set(prev)
      if (newSet.has(conversationId)) {
        newSet.delete(conversationId)
      } else {
        newSet.add(conversationId)
      }
      return newSet
    })
  }

  const toggleSelectAllConversations = () => {
    if (selectedConversations.size === filteredConversations.length) {
      setSelectedConversations(new Set())
    } else {
      setSelectedConversations(new Set(filteredConversations.map(c => c.id)))
    }
  }

  // Handle opening a conversation
  const handleOpenConversation = async (partnerId: string, partnerType: 'admin' | 'club') => {
    setLoadingConversation(true);
    setActiveConversation(partnerId);
    setActiveConversationType(partnerType);
    setReplyingTo(null);
    
    // Check if we have messages for this conversation in state
    const cachedMessages = messages.filter(msg => 
      (msg.sender_id === partnerId && msg.sender_type === partnerType && 
       msg.recipient_id === userId && msg.recipient_type === userType) || 
      (msg.sender_id === userId && msg.sender_type === userType && 
       msg.recipient_id === partnerId && msg.recipient_type === partnerType)
    );
    
    if (cachedMessages.length > 0) {
      // Use cached messages first for immediate display
      const sortedCachedMsgs = cachedMessages.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      setConversationMessages(sortedCachedMsgs);
      setLoadingConversation(false);
      setShouldScrollToBottom(true);
      
      // Mark unread messages as read
      const unreadMessages = cachedMessages.filter(msg => 
        !msg.is_read && 
        msg.recipient_id === userId && 
        msg.recipient_type === userType
      );
      
      if (unreadMessages.length > 0) {
        console.log('Marking messages as read on conversation open:', unreadMessages.length);
        await markAllAsRead(partnerId, partnerType);
      }
      
      // In the background, fetch fresh messages to ensure we have the latest
      getConversationMessages(partnerId, partnerType)
        .then(freshMsgs => {
          if (freshMsgs.length > 0) {
            const sortedFreshMsgs = freshMsgs.sort((a, b) => 
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
            setConversationMessages(sortedFreshMsgs);
          }
          
          // Mark any new unread messages as read
          const unreadMessages = freshMsgs.filter(msg => 
            !msg.is_read && 
            msg.recipient_id === userId && 
            msg.recipient_type === userType
          );
          
          if (unreadMessages.length > 0) {
            console.log('Marking new messages as read after refresh:', unreadMessages.length);
            markAllAsRead(partnerId, partnerType);
          }
        })
        .catch(err => {
          console.error('Error loading conversation messages in background:', err);
        });
    } else {
      // If no messages in state, load from API
      getConversationMessages(partnerId, partnerType)
        .then(msgs => {
          const sortedMsgs = msgs.sort((a, b) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
          setConversationMessages(sortedMsgs);
          setLoadingConversation(false);
          setShouldScrollToBottom(true);
          
          // Mark unread messages as read
          const unreadMessages = msgs.filter(msg => 
            !msg.is_read && 
            msg.recipient_id === userId && 
            msg.recipient_type === userType
          );
          
          if (unreadMessages.length > 0) {
            console.log('Marking messages as read on initial load:', unreadMessages.length);
            markAllAsRead(partnerId, partnerType);
          }
        })
        .catch(err => {
          console.error('Error loading conversation messages:', err);
          setLoadingConversation(false);
        });
    }
  };

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <aside className={cn(
        "w-80 lg:w-96 border-r bg-background flex flex-col h-full",
        isMobile ? (
          isSidebarOpen 
            ? "fixed inset-y-0 left-0 z-50" 
            : "hidden"
        ) : "relative"
      )}>
        {/* Mobile close button */}
        {isMobile && isSidebarOpen && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 h-8 w-8 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        )}

        {/* Search and new conversation section */}
        <div className="flex-shrink-0 p-4 border-b">
          {/* Bulk Actions Toolbar */}
          {selectedConversations.size > 0 && (
            <div className="rounded-lg border bg-blue-50 dark:bg-blue-950/20 p-3 mb-4 flex flex-wrap items-center gap-2 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Badge variant="secondary" className="text-xs sm:text-sm">
                  {selectedConversations.size} selected
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedConversations(new Set())}
                  className="h-7 text-xs"
                >
                  Clear
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkMessageAction('markRead')}
                  disabled={isBulkActionLoading}
                  className="h-8 text-xs sm:text-sm"
                >
                  {isBulkActionLoading ? (
                    <div className="h-3 w-3 sm:h-4 sm:w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-1 sm:mr-2" />
                  ) : (
                    <MailOpen className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  )}
                  Mark as read
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to delete ${selectedConversations.size} conversation(s)? This action cannot be undone.`)) {
                      handleBulkMessageAction('delete')
                    }
                  }}
                  disabled={isBulkActionLoading}
                  className="h-8 text-xs sm:text-sm"
                >
                  {isBulkActionLoading ? (
                    <div className="h-3 w-3 sm:h-4 sm:w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-1 sm:mr-2" />
                  ) : (
                    <Trash className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  )}
                  Delete
                </Button>
              </div>
            </div>
          )}
          
          <div className="relative mb-4">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {userType === 'admin' ? (
            <Tabs defaultValue="new" className="w-full">
              <TabsList className="w-full h-12">
                <TabsTrigger value="new" className="flex-1 text-base md:text-sm">New Chat</TabsTrigger>
                <TabsTrigger value="broadcast" className="flex-1 text-base md:text-sm">Broadcast</TabsTrigger>
              </TabsList>
              <TabsContent value="new">
                <Button
                  variant="outline"
                  className="w-full flex items-center gap-2 h-12 text-base md:text-sm"
                  onClick={() => setShowNewConversation(true)}
                >
                  <UserPlus className="h-5 w-5" />
                  New Conversation
                </Button>
              </TabsContent>
              <TabsContent value="broadcast">
                <Button
                  variant="outline"
                  className="w-full flex items-center gap-2 h-12 text-base md:text-sm"
                  onClick={() => setShowNewConversation('broadcast')}
                >
                  <MessageSquare className="h-5 w-5" />
                  Send Broadcast
                </Button>
              </TabsContent>
            </Tabs>
          ) : (
            <Button
              variant="outline"
              className="w-full flex items-center gap-2 h-12 text-base md:text-sm"
              onClick={() => setShowNewConversation(true)}
            >
              <UserPlus className="h-5 w-5" />
              New Conversation
            </Button>
          )}
        </div>

        {/* Conversations list */}
        <div className="flex-1 overflow-y-auto">
          {showNewConversation ? (
            <div className="p-4">
              {showNewConversation === 'broadcast' ? (
                <BroadcastMessage onClose={() => setShowNewConversation(false)} userId={userId} sendMessage={sendMessage} />
              ) : (
                <NewConversation
                  userId={userId}
                  userType={userType}
                  onConversationCreated={() => {
                    setShowNewConversation(false)
                  }}
                  onClose={() => setShowNewConversation(false)}
                />
              )}
            </div>
          ) : (
            <div className="space-y-1 p-2 pb-safe">
              {filteredConversations.length > 0 && (
                <div className="px-2 pb-2 flex items-center justify-between">
                  <Checkbox
                    checked={selectedConversations.size > 0 && selectedConversations.size === filteredConversations.length}
                    onCheckedChange={toggleSelectAllConversations}
                  />
                  <span className="text-xs text-muted-foreground">
                    Select all ({filteredConversations.length})
                  </span>
                </div>
              )}
              {filteredConversations.map((convo) => {
                const isActive = activeConversation === convo.id
                const isOnline = isUserOnline(convo.id, convo.type)
                const isSelected = selectedConversations.has(convo.id)

                return (
                  <div
                    key={`${convo.type}-${convo.id}`}
                    className={cn(
                      "w-full p-4 flex items-start gap-3 rounded-lg transition-colors min-h-[4.5rem]",
                      isActive
                        ? "bg-secondary"
                        : isSelected
                          ? "bg-blue-50 dark:bg-blue-950/20"
                          : "hover:bg-secondary/50"
                    )}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleConversationSelection(convo.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-2"
                    />
                    <button
                      onClick={() => handleSelectConversation(convo.id, convo.type)}
                      className="flex-1 flex items-start gap-3 text-left"
                    >
                      <div className="relative">
                        <Avatar className="h-12 w-12 md:h-10 md:w-10">
                          <AvatarImage src={convo.avatar} />
                          <AvatarFallback>{convo.name[0]}</AvatarFallback>
                        </Avatar>
                        {isOnline && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-background" />
                        )}
                      </div>
                      <div className="flex-1 text-left space-y-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium truncate text-base">{convo.name}</p>
                          {convo.unreadCount > 0 && (
                            <Badge variant="default" className="h-6 min-w-[24px] text-xs flex items-center justify-center rounded-full">
                              {convo.unreadCount}
                            </Badge>
                          )}
                        </div>
                        {convo.lastMessage && (
                          <p className="text-sm text-muted-foreground truncate">
                            {convo.lastMessage.content}
                          </p>
                        )}
                      </div>
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </aside>

      {/* Main chat area */}
      <main className={cn(
        "flex-1 flex flex-col min-w-0 bg-background h-full",
        isMobile && isSidebarOpen && "hidden"
      )}>
        {activeConversation && activeConversationType ? (
          <>
            {/* Chat header */}
            <div className="p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="flex items-center gap-3">
                {isMobile && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden h-10 w-10"
                    onClick={() => setIsSidebarOpen(true)}
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                )}
                {(() => {
                  const convo = conversations.find(c => c.id === activeConversation)
                  if (!convo) return null
                  
                  return (
                    <>
                      <Avatar className="h-12 w-12 md:h-10 md:w-10">
                        <AvatarImage src={convo.avatar} />
                        <AvatarFallback>{convo.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h2 className="font-semibold text-base">{convo.name}</h2>
                        <p className="text-sm text-muted-foreground">
                          {isUserOnline(convo.id, convo.type) ? 'Online' : 'Offline'}
                        </p>
                      </div>
                    </>
                  )
                })()}
              </div>
            </div>

            {/* Messages area */}
            <div 
              ref={scrollAreaRef}
              className="flex-1 overflow-y-auto p-4 space-y-4"
              onScroll={handleScroll}
            >
              <div className="space-y-4 min-h-full pb-4">
                {loadingConversation ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex gap-2">
                        <Skeleton className="h-4 w-[200px]" />
                      </div>
                    ))}
                  </div>
                ) : (
                  conversationMessages.map((msg, index) => {
                    const isUserMessage = msg.sender_id === userId && msg.sender_type === userType
                    const showTimestamp = index === 0 || 
                      new Date(msg.created_at).getTime() - new Date(conversationMessages[index - 1].created_at).getTime() > 5 * 60 * 1000
                    const formattedReactions = formatReactions(msg.reactions)
                    
                    return (
                      <div key={msg.id} className="space-y-3">
                        {showTimestamp && (
                          <div className="flex justify-center">
                            <span className="text-xs text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-full">
                              {formatMessageTime(msg.created_at)}
                            </span>
                          </div>
                        )}
                        <div
                          className={cn(
                            "flex gap-2",
                            isUserMessage ? "justify-end" : "justify-start"
                          )}
                        >
                          <div
                            className={cn(
                              "rounded-2xl px-4 py-2.5 max-w-[85%] md:max-w-[70%] group relative",
                              msg.is_deleted 
                                ? "bg-muted text-muted-foreground italic"
                                : isUserMessage
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-secondary"
                            )}
                          >
                            {msg.reply_to_id && (
                              <div className={cn(
                                "text-sm mb-2 px-3 py-1.5 rounded-xl border-l-2",
                                isUserMessage 
                                  ? "bg-primary-foreground/10 border-primary-foreground/20" 
                                  : "bg-background border-muted-foreground/20"
                              )}>
                                {conversationMessages.find(m => m.id === msg.reply_to_id)?.content || 'Original message not found'}
                              </div>
                            )}
                            <div className="break-words text-base">{msg.content}</div>
                            <div className={cn(
                              "flex items-center gap-1 text-xs mt-1",
                              isUserMessage
                                ? "text-primary-foreground/70"
                                : "text-muted-foreground"
                            )}>
                              {format(new Date(msg.created_at), 'h:mm a')}
                              {isUserMessage && (
                                <div className="flex items-center">
                                  <span className="mx-1">·</span>
                                  {msg.is_read ? (
                                    <span>Read</span>
                                  ) : (
                                    <span>Sent</span>
                                  )}
                                </div>
                              )}
                            </div>
                            
                            {/* Message actions */}
                            <div className={cn(
                              "absolute flex gap-2 top-2",
                              isUserMessage 
                                ? "-left-20 md:-left-28" 
                                : "-right-20 md:-right-28"
                            )}>
                              {/* Reply button */}
                              <Button
                                variant="secondary"
                                size="icon"
                                className="h-8 w-8 rounded-full shadow-sm"
                                onClick={() => handleReply(msg)}
                              >
                                <Reply className="h-4 w-4" />
                              </Button>
                              
                              {/* Reaction button */}
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="secondary"
                                    size="icon"
                                    className="h-8 w-8 rounded-full shadow-sm"
                                  >
                                    <Smile className="h-4 w-4" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-2" align="center">
                                  <div className="flex gap-1.5">
                                    {commonEmojis.map(emoji => (
                                      <button
                                        key={emoji}
                                        className="text-xl hover:bg-muted p-2 rounded-lg"
                                        onClick={() => handleReactToMessage(msg.id, emoji)}
                                      >
                                        {emoji}
                                      </button>
                                    ))}
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </div>
                            
                            {/* Reactions display */}
                            {formattedReactions.length > 0 && (
                              <div className={cn(
                                "absolute -bottom-3 flex gap-1",
                                isUserMessage ? "right-2" : "left-2"
                              )}>
                                {formattedReactions.map(({ emoji, count, userReacted }) => (
                                  <button
                                    key={emoji}
                                    className={cn(
                                      "text-base rounded-full px-2 py-1 flex items-center",
                                      userReacted 
                                        ? "bg-primary text-primary-foreground" 
                                        : "bg-background border shadow-sm"
                                    )}
                                    onClick={() => handleReactToMessage(msg.id, emoji)}
                                  >
                                    <span>{emoji}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
            
            {/* Message input */}
            <div className="p-4 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              {replyingTo && (
                <div className="mb-3 flex items-center justify-between p-3 rounded-lg bg-muted">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Replying to: {replyingTo.content.substring(0, 50)}
                      {replyingTo.content.length > 50 ? '...' : ''}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setReplyingTo(null)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              )}
              <div className="flex gap-3">
                <Textarea
                  ref={textareaRef}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && !isMobile) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  placeholder="Type a message..."
                  className="min-h-[3rem] max-h-[150px] resize-none text-base rounded-full px-4 py-2"
                  rows={1}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  size="icon"
                  className="shrink-0 h-12 w-12 rounded-full"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8 text-center">
            <div className="max-w-sm space-y-2">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="text-lg font-semibold">No conversation selected</h3>
              <p className="text-sm text-muted-foreground">
                Choose a conversation from the sidebar or start a new one.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Mobile overlay */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  )
} 