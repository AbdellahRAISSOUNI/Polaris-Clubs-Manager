"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

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
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching messages:', error)
        return
      }

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
      const { data, error } = await supabase
        .from('online_status')
        .select('*')

      if (error) {
        console.error('Error fetching online statuses:', error)
        return
      }

      const statusMap: Record<string, OnlineStatus> = {}
      data.forEach(status => {
        statusMap[`${status.user_type}-${status.user_id}`] = status
      })

      setOnlineStatuses(statusMap)
    } catch (error) {
      console.error('Error in fetchOnlineStatuses:', error)
    }
  }

  // Set up real-time subscription for messages
  useEffect(() => {
    if (!userId) return

    fetchMessages()
    fetchOnlineStatuses()

    // Create a single channel for all message-related events
    const messagesChannel = supabase.channel('messages-channel', {
      config: {
        broadcast: { self: true },
        presence: { key: `${userType}-${userId}` }
      }
    })
    
    // Subscribe to messages sent by this user
    messagesChannel.on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `sender_id=eq.${userId}`
    }, (payload) => {
      setMessages(prev => {
        // Check if message already exists to avoid duplicates
        if (prev.some(msg => msg.id === payload.new.id)) {
          return prev;
        }
        return [payload.new as Message, ...prev];
      });
    });
    
    // Subscribe to messages received by this user
    messagesChannel.on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `recipient_id=eq.${userId}`
    }, (payload) => {
      setMessages(prev => {
        // Check if message already exists to avoid duplicates
        if (prev.some(msg => msg.id === payload.new.id)) {
          return prev;
        }
        return [payload.new as Message, ...prev];
      });
    });
    
    // Subscribe to message updates (read status changes)
    messagesChannel.on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'messages',
      filter: `or(sender_id.eq.${userId},recipient_id.eq.${userId})`
    }, (payload) => {
      console.log('Message update detected:', payload.new);
      setMessages(prev => {
        // Check if the message already exists and if it's actually different
        const existingMsgIndex = prev.findIndex(msg => msg.id === payload.new.id);
        if (existingMsgIndex === -1) {
          return [...prev, payload.new as Message];
        }
        
        const existingMsg = prev[existingMsgIndex];
        const newMsg = payload.new as Message;
        
        // Only update if something actually changed
        if (
          existingMsg.content !== newMsg.content ||
          existingMsg.is_read !== newMsg.is_read ||
          existingMsg.is_deleted !== newMsg.is_deleted ||
          JSON.stringify(existingMsg.reactions) !== JSON.stringify(newMsg.reactions) ||
          existingMsg.updated_at !== newMsg.updated_at
        ) {
          console.log('Updating message in state:', newMsg);
          const newMessages = [...prev];
          newMessages[existingMsgIndex] = newMsg;
          return newMessages;
        }
        
        return prev;
      });
    });
    
    // Subscribe to the channel
    messagesChannel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        console.log('Successfully subscribed to messages channel')
      } else if (status === 'CLOSED') {
        console.log('Messages channel closed, attempting to reconnect...')
        await messagesChannel.subscribe()
      } else if (status === 'CHANNEL_ERROR') {
        console.error('Messages channel error, will retry...')
        setTimeout(() => messagesChannel.subscribe(), 1000)
      }
    })

    // Create online status channel
    const onlineStatusChannel = supabase.channel('online-status-channel', {
      config: {
        broadcast: { self: true },
        presence: { key: `${userType}-${userId}` }
      }
    })
    
    onlineStatusChannel.on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'online_status'
    }, (payload) => {
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        const status = payload.new as OnlineStatus
        setOnlineStatuses(prev => ({
          ...prev,
          [`${status.user_type}-${status.user_id}`]: status
        }))
      }
    })
    
    // Subscribe to the channel
    onlineStatusChannel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        console.log('Successfully subscribed to online status channel')
      } else if (status === 'CLOSED') {
        console.log('Online status channel closed, attempting to reconnect...')
        await onlineStatusChannel.subscribe()
      } else if (status === 'CHANNEL_ERROR') {
        console.error('Online status channel error, will retry...')
        setTimeout(() => onlineStatusChannel.subscribe(), 1000)
      }
    })

    // Update user's online status when they load the page
    updateOnlineStatus(true)

    // Set up interval to update online status every minute
    const intervalId = setInterval(() => {
      updateOnlineStatus(true)
    }, 60000)

    // Set up event listener for when user leaves/closes the page
    const handleBeforeUnload = () => {
      updateOnlineStatus(false)
    }
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      // Clean up subscriptions
      messagesChannel.unsubscribe()
      onlineStatusChannel.unsubscribe()
      clearInterval(intervalId)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      updateOnlineStatus(false)
    }
  }, [userId, userType])

  // Function to send a message
  const sendMessage = async (recipientId: string, recipientType: 'admin' | 'club', content: string, replyToId?: string) => {
    try {
      console.log('Sending message to:', recipientId, recipientType, content, replyToId ? `replying to: ${replyToId}` : '')
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: userId,
          sender_type: userType,
          recipient_id: recipientId,
          recipient_type: recipientType,
          content,
          reply_to_id: replyToId
        })
        .select()
        .single()

      if (error) {
        console.error('Error sending message:', error)
        throw error
      }

      console.log('Message sent successfully:', data)
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
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId)

      if (error) {
        console.error('Error marking message as read:', error)
        throw error
      }

      // Update the messages state
      setMessages(prev => 
        prev.map(msg => msg.id === messageId ? { ...msg, is_read: true } : msg)
      )
    } catch (error) {
      console.error('Error in markAsRead:', error)
      throw error
    }
  }

  // Function to mark all messages in a conversation as read
  const markAllAsRead = async (conversationPartnerId: string, conversationPartnerType: 'admin' | 'club') => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('sender_id', conversationPartnerId)
        .eq('sender_type', conversationPartnerType)
        .eq('recipient_id', userId)
        .eq('recipient_type', userType)
        .eq('is_read', false)

      if (error) {
        console.error('Error marking all messages as read:', error)
        throw error
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
      )
    } catch (error) {
      console.error('Error in markAllAsRead:', error)
      throw error
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
      // Try the most direct approach with explicit string values
      const sentMessages = await supabase
        .from('messages')
        .select('*')
        .eq('sender_id', userId)
        .eq('sender_type', userType)
        .eq('recipient_id', partnerId)
        .eq('recipient_type', partnerType)
        .order('created_at', { ascending: true });
      
      const receivedMessages = await supabase
        .from('messages')
        .select('*')
        .eq('sender_id', partnerId)
        .eq('sender_type', partnerType)
        .eq('recipient_id', userId)
        .eq('recipient_type', userType)
        .order('created_at', { ascending: true });
      
      // Combine and sort all messages
      const allMessages = [...(sentMessages.data || []), ...(receivedMessages.data || [])]
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      
      // Update the global messages state with these messages
      if (allMessages.length > 0) {
        setMessages(prev => {
          // Create a map of existing messages by ID
          const existingMsgs = new Map(prev.map(msg => [msg.id, msg]));
          
          // Add new messages to the map
          allMessages.forEach(msg => {
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
      const { data, error } = await supabase
        .from('online_status')
        .upsert({
          user_id: userId,
          user_type: userType,
          is_online: isOnline,
          last_active: new Date().toISOString()
        }, {
          onConflict: 'user_id, user_type'
        })
        .select()
        .single()

      if (error) {
        console.error('Error updating online status:', error)
        return
      }

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
      
      const { error } = await supabase
        .from('messages')
        .update({ 
          is_deleted: true,
          content: "This message was deleted",
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId)

      if (error) {
        console.error('Error deleting message:', error)
        throw error
      }
      
      // Optimistically update the messages state
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { 
              ...msg, 
              is_deleted: true, 
              content: "This message was deleted", 
              updated_at: new Date().toISOString() 
            } 
          : msg
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
      
      // Create a unique key for the user's reaction
      const reactionKey = `${userType}-${userId}`
      
      // Get current reactions or initialize empty object
      const currentReactions = message.reactions || {}
      
      // If user already reacted with this emoji, remove it (toggle)
      const newReactions = { ...currentReactions }
      if (newReactions[reactionKey] === emoji) {
        delete newReactions[reactionKey]
      } else {
        // Otherwise add/update the reaction
        newReactions[reactionKey] = emoji
      }

      console.log('Updating reactions in database:', {
        messageId,
        newReactions,
        currentReactions
      })
      
      // Update in the database using raw SQL to ensure proper JSONB handling
      const { data, error } = await supabase.rpc('update_message_reactions', {
        p_message_id: messageId,
        p_reactions: newReactions,
        p_updated_at: new Date().toISOString()
      })

      if (error) {
        console.error('Error reacting to message:', error)
        throw error
      }

      console.log('Database update successful:', data)

      // Update local state
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, reactions: newReactions, updated_at: new Date().toISOString() } 
          : msg
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