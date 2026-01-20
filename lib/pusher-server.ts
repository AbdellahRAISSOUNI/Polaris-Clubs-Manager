import Pusher from 'pusher'

// Initialize Pusher server instance
// This is used in API routes to broadcast events
let pusherInstance: Pusher | null = null

export function getPusherServer(): Pusher {
  if (pusherInstance) {
    return pusherInstance
  }

  const appId = process.env.PUSHER_APP_ID
  const key = process.env.PUSHER_KEY
  const secret = process.env.PUSHER_SECRET
  const cluster = process.env.PUSHER_CLUSTER || 'eu'
  const useTLS = process.env.PUSHER_USE_TLS === 'true'

  if (!appId || !key || !secret) {
    console.warn('Pusher credentials not found. Realtime features will be disabled.')
    // Return a dummy instance that won't crash but won't send events
    pusherInstance = new Pusher({
      appId: 'dummy',
      key: 'dummy',
      secret: 'dummy',
      cluster: 'eu',
      useTLS: true,
    })
    return pusherInstance
  }

  pusherInstance = new Pusher({
    appId,
    key,
    secret,
    cluster,
    useTLS,
  })

  return pusherInstance
}

// Helper function to trigger Pusher events
export async function triggerPusherEvent(
  channel: string,
  event: string,
  data: any
): Promise<void> {
  try {
    const pusher = getPusherServer()
    await pusher.trigger(channel, event, data)
  } catch (error) {
    console.error('Error triggering Pusher event:', error)
    // Don't throw - allow the API route to continue even if Pusher fails
  }
}
