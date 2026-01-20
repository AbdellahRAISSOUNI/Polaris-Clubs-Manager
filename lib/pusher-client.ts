'use client'

import Pusher from 'pusher-js'

// Initialize Pusher client instance
// This is used in React components/contexts to subscribe to events
let pusherClient: Pusher | null = null

export function getPusherClient(): Pusher {
  if (typeof window === 'undefined') {
    // Server-side rendering - return a dummy instance
    return {} as Pusher
  }

  if (pusherClient) {
    return pusherClient
  }

  const key = process.env.NEXT_PUBLIC_PUSHER_KEY
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'eu'

  if (!key) {
    console.warn('Pusher key not found. Realtime features will be disabled.')
    // Return a dummy instance
    pusherClient = new Pusher('dummy-key', {
      cluster: 'eu',
      enabledTransports: ['ws', 'wss'],
    })
    return pusherClient
  }

  pusherClient = new Pusher(key, {
    cluster,
    enabledTransports: ['ws', 'wss'],
  })

  return pusherClient
}

// Cleanup function to disconnect Pusher when needed
export function disconnectPusher(): void {
  if (pusherClient) {
    pusherClient.disconnect()
    pusherClient = null
  }
}
