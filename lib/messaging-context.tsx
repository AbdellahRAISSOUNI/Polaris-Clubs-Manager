"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { getPusherClient } from '@/lib/pusher-client'

export interface Message {
  id: string
  sender_id: string
  sender_type: 'admin' | 'club'
  recipient_id: string
  recipient_type: 'admin' | 'club'
  content: string
  is_read: boolean
  created_at: string
  updated_at: string
  last_read_update?: string
  reply_to_id?: string
  reactions?: Record<string, string>
  is_deleted?: boolean
}

export interface OnlineStatus {
  user_id: string
  user_type: 'admin' | 'club'
  is_online: boolean
  last_active: string
}

interface MessagingContextType {
  messages: Message[]
  loading: boolean
  sendMessage: (recipientId: string, recipientType: 'admin' | 'club', content: string, replyToId?: string) => Promise<void>
  markAsRead: (messageId: string) => Promise<void>
  markAllAsRead: (conversationPartnerId: string, conversationPartnerType: 'admin' | 'club') => Promise<void>
  getConversations: () => Promise<{ id: string, type: 'admin' | 'club', lastMessage: Message | null }[]>
  getConversationMessages: (partnerId: string, partnerType: 'admin' | 'club') => Promise<Message[]>
  onlineStatuses: Record<string, OnlineStatus>
  updateOnlineStatus: (isOnline: boolean) => Promise<void>
  deleteMessage: (messageId: string) => Promise<void>
  reactToMessage: (messageId: string, emoji: string) => Promise<void>
}

const MessagingContext = createContext<MessagingContextType | undefined>(undefined)

export function MessagingProvider({ 
  children, 
  userId, 
  userType 
}: { 
  children: React.ReactNode, 
  userId: string, 
  userType: 'admin' | 'club' 
}) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [onlineStatuses, setOnlineStatuses] = useState<Record<string, OnlineStatus>>({})

  // Function to fetch all messages for the current user
  const fetchMessages = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/messages', {
        headers: {
          'x-user-id': userId,
          'x-user-type': userType,
        },
      })
      if (!response.ok) {
        throw new Error('Failed to fetch messages')
      }
      const data = await response.json()
      setMessages(data || [])
    } catch (error) {
      console.error('Error in fetchMessages:', error)
    } finally {
      setLoading(false)
    }
  }

  // Function to fetch online statuses
  const fetchOnlineStatuses = async () => {
    try {
      const response = await fetch('/api/messages/online-status')
      if (!response.ok) {
        throw new Error('Failed to fetch online statuses')
      }
      const data = await response.json()
      setOnlineStatuses(data || {})
    } catch (error) {
      console.error('Error in fetchOnlineStatuses:', error)
    }
  }

  // Set up Pusher subscriptions for realtime messages and online statuses
  useEffect(() => {
    if (!userId) return

    fetchMessages()
    fetchOnlineStatuses()

    // Update user's online status when they load the page
    updateOnlineStatus(true)

    // Set up Pusher subscriptions
    const pusher = getPusherClient()
    
    // Subscribe to user-specific messages channel
    const messagesChannel = pusher.subscribe(`messages-${userType}-${userId}`)
    
    messagesChannel.bind('new-message', (data: Message) => {
      setMessages(prev => {
        // Check if message already exists to avoid duplicates
        if (prev.some(msg => msg.id === data.id)) {
          return prev
        }
        return [data, ...prev]
      })
    })

    messagesChannel.bind('message-updated', (data: Message) => {
      setMessages(prev => {
        const existingMsgIndex = prev.findIndex(msg => msg.id === data.id)
        if (existingMsgIndex === -1) {
          return [...prev, data]
        }
        const newMessages = [...prev]
        newMessages[existingMsgIndex] = data
        return newMessages
      })
    })

    messagesChannel.bind('messages-read-all', () => {
      // Refresh messages to get updated read statuses
      fetchMessages()
    })

    // Subscribe to general messages channel for all messages
    const generalMessagesChannel = pusher.subscribe('messages')
    generalMessagesChannel.bind('new-message', (data: Message) => {
      // Only add if it's relevant to this user
      if (data.sender_id === userId && data.sender_type === userType ||
          data.recipient_id === userId && data.recipient_type === userType) {
        setMessages(prev => {
          if (prev.some(msg => msg.id === data.id)) {
            return prev
          }
          return [data, ...prev]
        })
      }
    })

    // Subscribe to online status channel
    const onlineStatusChannel = pusher.subscribe('online-status')
    onlineStatusChannel.bind('status-updated', (data: any) => {
      setOnlineStatuses(prev => ({
        ...prev,
        [`${data.user_type}-${data.user_id}`]: data
      }))
    })

    // Set up interval to update online status every minute
    const statusUpdateInterval = setInterval(() => {
      updateOnlineStatus(true)
    }, 60000)

    // Set up event listener for when user leaves/closes the page
    const handleBeforeUnload = () => {
      updateOnlineStatus(false)
    }
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      messagesChannel.unbind_all()
      messagesChannel.unsubscribe()
      generalMessagesChannel.unbind_all()
      generalMessagesChannel.unsubscribe()
      onlineStatusChannel.unbind_all()
      onlineStatusChannel.unsubscribe()
      clearInterval(statusUpdateInterval)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      updateOnlineStatus(false)
    }
  }, [userId, userType])

  // Function to send a message
  const sendMessage = async (recipientId: string, recipientType: 'admin' | 'club', content: string, replyToId?: string) => {
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
          'x-user-type': userType,
        },
        body: JSON.stringify({
          recipient_id: recipientId,
          recipient_type: recipientType,
          content,
          reply_to_id: replyToId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to send message')
      }

      const data = await response.json()
      // Optimistically update the messages state
      setMessages(prev => [data, ...prev])
      return data
    } catch (error) {
      console.error('Error in sendMessage:', error)
      throw error
    }
  }

  // Function to mark a message as read
  const markAsRead = async (messageId: string) => {
    try {
      // Only mark messages as read if they are sent to the current user
      const message = messages.find(m => m.id === messageId);
      if (!message || message.recipient_id !== userId || message.recipient_type !== userType) {
        console.log('Cannot mark message as read: not recipient or already read', messageId);
        return;
      }

      const response = await fetch(`/api/messages/${messageId}?action=read`, {
        method: 'PATCH',
        headers: {
          'x-user-id': userId,
          'x-user-type': userType,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to mark message as read');
      }

      // Update the messages state
      const updatedMessage = await response.json();
      setMessages(prev => 
        prev.map(msg => msg.id === messageId ? updatedMessage : msg)
      );
    } catch (error) {
      console.error('Error in markAsRead:', error);
      throw error;
    }
  }

  // Function to mark all messages in a conversation as read
  const markAllAsRead = async (conversationPartnerId: string, conversationPartnerType: 'admin' | 'club') => {
    try {
      const response = await fetch('/api/messages?action=readAll', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
          'x-user-type': userType,
        },
        body: JSON.stringify({
          partnerId: conversationPartnerId,
          partnerType: conversationPartnerType,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark all messages as read');
      }

      // Update the messages state
      setMessages(prev => 
        prev.map(msg => 
          msg.sender_id === conversationPartnerId && 
          msg.sender_type === conversationPartnerType && 
          msg.recipient_id === userId && 
          msg.recipient_type === userType && 
          !msg.is_read
            ? { ...msg, is_read: true } 
            : msg
        )
      );
    } catch (error) {
      console.error('Error in markAllAsRead:', error);
      throw error;
    }
  }

  // Function to get all conversations for the current user
  const getConversations = async () => {
    try {
      // Get all unique conversation partners
      const uniquePartners = new Map<string, { id: string, type: 'admin' | 'club', lastMessage: Message | null }>()
      
      messages.forEach(msg => {
        const partnerId = msg.sender_id === userId && msg.sender_type === userType 
          ? msg.recipient_id 
          : msg.sender_id
        
        const partnerType = msg.sender_id === userId && msg.sender_type === userType 
          ? msg.recipient_type 
          : msg.sender_type
        
        const key = `${partnerType}-${partnerId}`
        
        if (!uniquePartners.has(key) || new Date(msg.created_at) > new Date((uniquePartners.get(key)?.lastMessage?.created_at || ''))) {
          uniquePartners.set(key, {
            id: partnerId,
            type: partnerType,
            lastMessage: msg
          })
        }
      })
      
      return Array.from(uniquePartners.values())
    } catch (error) {
      console.error('Error in getConversations:', error)
      return []
    }
  }

  // Function to get all messages for a specific conversation
  const getConversationMessages = async (partnerId: string, partnerType: 'admin' | 'club') => {
    try {
      // Create a cache key for this conversation
      const cacheKey = `${partnerId}-${partnerType}`;
      
      // First, check if we already have messages for this conversation in the messages state
      const cachedMessages = messages.filter(msg => 
        (msg.sender_id === partnerId && msg.sender_type === partnerType && 
         msg.recipient_id === userId && msg.recipient_type === userType) || 
        (msg.sender_id === userId && msg.sender_type === userType && 
         msg.recipient_id === partnerId && msg.recipient_type === partnerType)
      );
      
      // If we have cached messages, return them immediately
      if (cachedMessages.length > 0) {
        console.log('Using cached messages for conversation:', partnerId, partnerType);
        
        // In the background, fetch fresh messages to ensure we have the latest
        setTimeout(() => {
          fetchFreshMessages(partnerId, partnerType)
            .catch(err => console.error('Background refresh error:', err));
        }, 100);
        
        return cachedMessages;
      }
      
      // If no cached messages, fetch from the database
      return fetchFreshMessages(partnerId, partnerType);
    } catch (error) {
      console.error('Error in getConversationMessages:', error);
      return [];
    }
  };
  
  // Helper function to fetch fresh messages from the database
  const fetchFreshMessages = async (partnerId: string, partnerType: 'admin' | 'club') => {
    try {
      const response = await fetch(`/api/messages?partnerId=${partnerId}&partnerType=${partnerType}`, {
        headers: {
          'x-user-id': userId,
          'x-user-type': userType,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch conversation messages');
      }
      const allMessages = await response.json();
      
      // Update the global messages state with these messages
      if (allMessages.length > 0) {
        setMessages(prev => {
          // Create a map of existing messages by ID
          const existingMsgs = new Map(prev.map(msg => [msg.id, msg]));
          
          // Add new messages to the map
          allMessages.forEach((msg: Message) => {
            existingMsgs.set(msg.id, msg);
          });
          
          // Convert map back to array
          return Array.from(existingMsgs.values());
        });
      }
      
      return allMessages;
    } catch (error) {
      console.error('Error fetching fresh messages:', error);
      return [];
    }
  };

  // Function to update user's online status
  const updateOnlineStatus = async (isOnline: boolean) => {
    try {
      const response = await fetch('/api/messages/online-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
          'x-user-type': userType,
        },
        body: JSON.stringify({ is_online: isOnline }),
      });

      if (!response.ok) {
        throw new Error('Failed to update online status');
      }

      const data = await response.json();
      setOnlineStatuses(prev => ({
        ...prev,
        [`${userType}-${userId}`]: data
      }))
    } catch (error) {
      console.error('Error in updateOnlineStatus:', error)
    }
  }

  // Function to delete a message
  const deleteMessage = async (messageId: string) => {
    try {
      // Check if message exists and belongs to the current user
      const message = messages.find(m => m.id === messageId)
      if (!message) {
        throw new Error('Message not found')
      }
      
      if (message.sender_id !== userId || message.sender_type !== userType) {
        throw new Error('Cannot delete messages sent by others')
      }
      
      // Check if message is less than 15 minutes old
      const messageTime = new Date(message.created_at).getTime()
      const currentTime = new Date().getTime()
      const fifteenMinutesInMs = 15 * 60 * 1000
      
      if (currentTime - messageTime > fifteenMinutesInMs) {
        throw new Error('Cannot delete messages older than 15 minutes')
      }
      
      const response = await fetch(`/api/messages/${messageId}?action=delete`, {
        method: 'PATCH',
        headers: {
          'x-user-id': userId,
          'x-user-type': userType,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete message');
      }
      
      const updatedMessage = await response.json();
      
      // Update the messages state
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? updatedMessage : msg
      ))
    } catch (error) {
      console.error('Error in deleteMessage:', error)
      throw error
    }
  }
  
  // Function to react to a message
  const reactToMessage = async (messageId: string, emoji: string): Promise<void> => {
    try {
      // Get the current message
      const message = messages.find(m => m.id === messageId)
      if (!message) {
        throw new Error('Message not found')
      }
      
      const response = await fetch(`/api/messages/${messageId}?action=react`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
          'x-user-type': userType,
        },
        body: JSON.stringify({ emoji }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to react to message');
      }

      const updatedMessage = await response.json();

      // Update local state
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? updatedMessage : msg
      ))
    } catch (error) {
      console.error('Error in reactToMessage:', error)
      throw error
    }
  }

  return (
    <MessagingContext.Provider value={{
      messages,
      loading,
      sendMessage,
      markAsRead,
      markAllAsRead,
      getConversations,
      getConversationMessages,
      onlineStatuses,
      updateOnlineStatus,
      deleteMessage,
      reactToMessage
    }}>
      {children}
    </MessagingContext.Provider>
  )
}

export function useMessaging() {
  const context = useContext(MessagingContext)
  if (context === undefined) {
    throw new Error('useMessaging must be used within a MessagingProvider')
  }
  return context
} 