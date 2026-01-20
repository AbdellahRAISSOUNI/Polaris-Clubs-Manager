#!/usr/bin/env tsx
/**
 * Migration Script: Supabase → MongoDB
 * 
 * This script migrates data from Supabase (Postgres) to MongoDB.
 * 
 * Usage:
 *   npm run migrate          # Run migration
 *   npm run migrate --dry-run # Preview without writing
 * 
 * Prerequisites:
 *   - MONGODB_URI and MONGODB_DB set in .env.local
 *   - NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY set (optional - for direct Supabase access)
 */

// IMPORTANT: Load environment variables FIRST, before any other imports
// This ensures env vars are available when modules are imported
import { config } from 'dotenv'
import * as path from 'path'

// Try to load .env.local first, then fallback to .env
const envLocalPath = path.resolve(process.cwd(), '.env.local')
const envPath = path.resolve(process.cwd(), '.env')

const result = config({ path: envLocalPath })
if (!result.parsed || !result.parsed.MONGODB_URI) {
  config({ path: envPath })
}

// Verify MONGODB_URI is loaded
if (!process.env.MONGODB_URI) {
  console.error(`\n❌ MONGODB_URI not found in environment variables!`)
  console.error(`   Checked: ${envLocalPath}`)
  console.error(`   Checked: ${envPath}`)
  console.error(`   Please ensure MONGODB_URI is set in .env.local\n`)
  process.exit(1)
}

// Now import modules that depend on environment variables
import { createClient } from '@supabase/supabase-js'
import { connectMongo } from '../lib/mongodb'
import { User } from '../models/User'
import { Club } from '../models/Club'
import { Space } from '../models/Space'
import { Reservation } from '../models/Reservation'
import { Notification } from '../models/Notification'
import { Message } from '../models/Message'
import { OnlineStatus } from '../models/OnlineStatus'

const DRY_RUN = process.argv.includes('--dry-run') || process.argv.includes('-d')

// Color output helpers
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logSection(title: string) {
  console.log('\n' + '='.repeat(60))
  log(title, 'cyan')
  console.log('='.repeat(60))
}

interface MigrationStats {
  users: number
  clubs: number
  spaces: number
  reservations: number
  notifications: number
  messages: number
  onlineStatus: number
  errors: string[]
}

const stats: MigrationStats = {
  users: 0,
  clubs: 0,
  spaces: 0,
  reservations: 0,
  notifications: 0,
  messages: 0,
  onlineStatus: 0,
  errors: [],
}

/**
 * Convert Supabase UUID to string (keep as-is if already string)
 */
function uuidToString(id: any): string {
  if (!id) return ''
  if (typeof id === 'string') return id
  return String(id)
}

/**
 * Convert Supabase timestamp to Date
 */
function toDate(value: any): Date {
  if (!value) return new Date()
  if (value instanceof Date) return value
  return new Date(value)
}

/**
 * Migrate Users
 */
async function migrateUsers(supabase: any) {
  logSection('Migrating Users')
  
  try {
    const { data, error } = await supabase.from('users').select('*')
    
    if (error) {
      log(`⚠️  Supabase error: ${error.message}`, 'yellow')
      log('   Skipping users migration (may not have Supabase access)', 'yellow')
      return
    }
    
    if (!data || data.length === 0) {
      log('   No users found in Supabase', 'yellow')
      return
    }
    
    log(`   Found ${data.length} users`, 'blue')
    
    for (const user of data) {
      try {
        const userDoc = {
          id: uuidToString(user.id),
          email: user.email || '',
          name: user.name || '',
          password: user.password || '',
          role: user.role || 'club',
          avatar_url: user.avatar_url || '',
          created_at: toDate(user.created_at),
        }
        
        if (DRY_RUN) {
          log(`   [DRY RUN] Would migrate user: ${userDoc.email}`, 'yellow')
        } else {
          await User.findOneAndUpdate(
            { id: userDoc.id },
            userDoc,
            { upsert: true, new: true }
          )
          log(`   ✓ Migrated user: ${userDoc.email}`, 'green')
        }
        stats.users++
      } catch (err: any) {
        const errorMsg = `Failed to migrate user ${user.email}: ${err.message}`
        log(`   ✗ ${errorMsg}`, 'red')
        stats.errors.push(errorMsg)
      }
    }
  } catch (err: any) {
    log(`   ✗ Error migrating users: ${err.message}`, 'red')
    stats.errors.push(`Users migration error: ${err.message}`)
  }
}

/**
 * Migrate Clubs
 */
async function migrateClubs(supabase: any) {
  logSection('Migrating Clubs')
  
  try {
    const { data, error } = await supabase.from('clubs').select('*')
    
    if (error) {
      log(`⚠️  Supabase error: ${error.message}`, 'yellow')
      log('   Skipping clubs migration', 'yellow')
      return
    }
    
    if (!data || data.length === 0) {
      log('   No clubs found in Supabase', 'yellow')
      return
    }
    
    log(`   Found ${data.length} clubs`, 'blue')
    
    for (const club of data) {
      try {
        const clubDoc = {
          id: uuidToString(club.id),
          name: club.name || '',
          description: club.description || '',
          email: club.email || '',
          password: club.password || '',
          logo: club.logo || '',
          members: club.members || 0,
          status: club.status || 'active',
          last_login: club.last_login ? toDate(club.last_login) : undefined,
          created_at: toDate(club.created_at),
        }
        
        if (DRY_RUN) {
          log(`   [DRY RUN] Would migrate club: ${clubDoc.name}`, 'yellow')
        } else {
          await Club.findOneAndUpdate(
            { id: clubDoc.id },
            clubDoc,
            { upsert: true, new: true }
          )
          log(`   ✓ Migrated club: ${clubDoc.name}`, 'green')
        }
        stats.clubs++
      } catch (err: any) {
        const errorMsg = `Failed to migrate club ${club.name}: ${err.message}`
        log(`   ✗ ${errorMsg}`, 'red')
        stats.errors.push(errorMsg)
      }
    }
  } catch (err: any) {
    log(`   ✗ Error migrating clubs: ${err.message}`, 'red')
    stats.errors.push(`Clubs migration error: ${err.message}`)
  }
}

/**
 * Migrate Spaces
 */
async function migrateSpaces(supabase: any) {
  logSection('Migrating Spaces')
  
  try {
    const { data, error } = await supabase.from('spaces').select('*')
    
    if (error) {
      log(`⚠️  Supabase error: ${error.message}`, 'yellow')
      log('   Skipping spaces migration', 'yellow')
      return
    }
    
    if (!data || data.length === 0) {
      log('   No spaces found in Supabase', 'yellow')
      return
    }
    
    log(`   Found ${data.length} spaces`, 'blue')
    
    for (const space of data) {
      try {
        // Handle features - could be JSONB array or string array
        let features: string[] = []
        if (space.features) {
          if (Array.isArray(space.features)) {
            features = space.features
          } else if (typeof space.features === 'string') {
            try {
              features = JSON.parse(space.features)
            } catch {
              features = []
            }
          }
        }
        
        const spaceDoc = {
          id: uuidToString(space.id),
          name: space.name || '',
          capacity: space.capacity || 0,
          features: features,
          image: space.image || '',
          created_at: toDate(space.created_at),
        }
        
        if (DRY_RUN) {
          log(`   [DRY RUN] Would migrate space: ${spaceDoc.name}`, 'yellow')
        } else {
          await Space.findOneAndUpdate(
            { id: spaceDoc.id },
            spaceDoc,
            { upsert: true, new: true }
          )
          log(`   ✓ Migrated space: ${spaceDoc.name}`, 'green')
        }
        stats.spaces++
      } catch (err: any) {
        const errorMsg = `Failed to migrate space ${space.name}: ${err.message}`
        log(`   ✗ ${errorMsg}`, 'red')
        stats.errors.push(errorMsg)
      }
    }
  } catch (err: any) {
    log(`   ✗ Error migrating spaces: ${err.message}`, 'red')
    stats.errors.push(`Spaces migration error: ${err.message}`)
  }
}

/**
 * Migrate Reservations
 */
async function migrateReservations(supabase: any) {
  logSection('Migrating Reservations')
  
  try {
    const { data, error } = await supabase.from('reservations').select('*')
    
    if (error) {
      log(`⚠️  Supabase error: ${error.message}`, 'yellow')
      log('   Skipping reservations migration', 'yellow')
      return
    }
    
    if (!data || data.length === 0) {
      log('   No reservations found in Supabase', 'yellow')
      return
    }
    
    log(`   Found ${data.length} reservations`, 'blue')
    
    for (const reservation of data) {
      try {
        const reservationDoc = {
          id: uuidToString(reservation.id),
          space_id: uuidToString(reservation.space_id),
          club_id: uuidToString(reservation.club_id),
          title: reservation.title || '',
          description: reservation.description || '',
          start_time: toDate(reservation.start_time),
          end_time: toDate(reservation.end_time),
          status: reservation.status || 'pending',
          is_full_day: reservation.is_full_day || false,
          admin_message: reservation.admin_message || '',
          created_at: toDate(reservation.created_at),
          updated_at: toDate(reservation.updated_at || reservation.created_at),
        }
        
        if (DRY_RUN) {
          log(`   [DRY RUN] Would migrate reservation: ${reservationDoc.title}`, 'yellow')
        } else {
          await Reservation.findOneAndUpdate(
            { id: reservationDoc.id },
            reservationDoc,
            { upsert: true, new: true }
          )
          log(`   ✓ Migrated reservation: ${reservationDoc.title}`, 'green')
        }
        stats.reservations++
      } catch (err: any) {
        const errorMsg = `Failed to migrate reservation ${reservation.title}: ${err.message}`
        log(`   ✗ ${errorMsg}`, 'red')
        stats.errors.push(errorMsg)
      }
    }
  } catch (err: any) {
    log(`   ✗ Error migrating reservations: ${err.message}`, 'red')
    stats.errors.push(`Reservations migration error: ${err.message}`)
  }
}

/**
 * Migrate Notifications
 */
async function migrateNotifications(supabase: any) {
  logSection('Migrating Notifications')
  
  try {
    const { data, error } = await supabase.from('notifications').select('*')
    
    if (error) {
      log(`⚠️  Supabase error: ${error.message}`, 'yellow')
      log('   Skipping notifications migration', 'yellow')
      return
    }
    
    if (!data || data.length === 0) {
      log('   No notifications found in Supabase', 'yellow')
      return
    }
    
    log(`   Found ${data.length} notifications`, 'blue')
    
    for (const notification of data) {
      try {
        const notificationDoc = {
          id: uuidToString(notification.id),
          recipient_id: uuidToString(notification.recipient_id),
          recipient_type: notification.recipient_type || 'club',
          sender_id: notification.sender_id ? uuidToString(notification.sender_id) : '',
          title: notification.title || '',
          message: notification.message || '',
          type: notification.type || 'info',
          is_read: notification.is_read || false,
          link: notification.link || '',
          created_at: toDate(notification.created_at),
          updated_at: toDate(notification.updated_at || notification.created_at),
        }
        
        if (DRY_RUN) {
          log(`   [DRY RUN] Would migrate notification: ${notificationDoc.title}`, 'yellow')
        } else {
          await Notification.findOneAndUpdate(
            { id: notificationDoc.id },
            notificationDoc,
            { upsert: true, new: true }
          )
          log(`   ✓ Migrated notification: ${notificationDoc.title}`, 'green')
        }
        stats.notifications++
      } catch (err: any) {
        const errorMsg = `Failed to migrate notification ${notification.id}: ${err.message}`
        log(`   ✗ ${errorMsg}`, 'red')
        stats.errors.push(errorMsg)
      }
    }
  } catch (err: any) {
    log(`   ✗ Error migrating notifications: ${err.message}`, 'red')
    stats.errors.push(`Notifications migration error: ${err.message}`)
  }
}

/**
 * Migrate Messages
 */
async function migrateMessages(supabase: any) {
  logSection('Migrating Messages')
  
  try {
    const { data, error } = await supabase.from('messages').select('*')
    
    if (error) {
      log(`⚠️  Supabase error: ${error.message}`, 'yellow')
      log('   Skipping messages migration', 'yellow')
      return
    }
    
    if (!data || data.length === 0) {
      log('   No messages found in Supabase', 'yellow')
      return
    }
    
    log(`   Found ${data.length} messages`, 'blue')
    
    for (const message of data) {
      try {
        const messageDoc = {
          id: uuidToString(message.id),
          sender_id: uuidToString(message.sender_id),
          sender_type: message.sender_type || 'club',
          recipient_id: uuidToString(message.recipient_id),
          recipient_type: message.recipient_type || 'club',
          content: message.content || '',
          is_read: message.is_read || false,
          created_at: toDate(message.created_at),
          updated_at: toDate(message.updated_at || message.created_at),
        }
        
        if (DRY_RUN) {
          log(`   [DRY RUN] Would migrate message from ${messageDoc.sender_id}`, 'yellow')
        } else {
          await Message.findOneAndUpdate(
            { id: messageDoc.id },
            messageDoc,
            { upsert: true, new: true }
          )
          log(`   ✓ Migrated message: ${messageDoc.id}`, 'green')
        }
        stats.messages++
      } catch (err: any) {
        const errorMsg = `Failed to migrate message ${message.id}: ${err.message}`
        log(`   ✗ ${errorMsg}`, 'red')
        stats.errors.push(errorMsg)
      }
    }
  } catch (err: any) {
    log(`   ✗ Error migrating messages: ${err.message}`, 'red')
    stats.errors.push(`Messages migration error: ${err.message}`)
  }
}

/**
 * Migrate Online Status
 */
async function migrateOnlineStatus(supabase: any) {
  logSection('Migrating Online Status')
  
  try {
    const { data, error } = await supabase.from('online_status').select('*')
    
    if (error) {
      log(`⚠️  Supabase error: ${error.message}`, 'yellow')
      log('   Skipping online_status migration', 'yellow')
      return
    }
    
    if (!data || data.length === 0) {
      log('   No online_status records found in Supabase', 'yellow')
      return
    }
    
    log(`   Found ${data.length} online_status records`, 'blue')
    
    for (const status of data) {
      try {
        const statusDoc = {
          id: uuidToString(status.id),
          user_id: uuidToString(status.user_id),
          user_type: status.user_type || 'club',
          is_online: status.is_online || false,
          last_active: toDate(status.last_active),
        }
        
        if (DRY_RUN) {
          log(`   [DRY RUN] Would migrate online_status for ${statusDoc.user_id}`, 'yellow')
        } else {
          await OnlineStatus.findOneAndUpdate(
            { id: statusDoc.id },
            statusDoc,
            { upsert: true, new: true }
          )
          log(`   ✓ Migrated online_status: ${statusDoc.user_id}`, 'green')
        }
        stats.onlineStatus++
      } catch (err: any) {
        const errorMsg = `Failed to migrate online_status ${status.id}: ${err.message}`
        log(`   ✗ ${errorMsg}`, 'red')
        stats.errors.push(errorMsg)
      }
    }
  } catch (err: any) {
    log(`   ✗ Error migrating online_status: ${err.message}`, 'red')
    stats.errors.push(`OnlineStatus migration error: ${err.message}`)
  }
}

/**
 * Main migration function
 */
async function main() {
  log('\n🚀 Starting Supabase → MongoDB Migration', 'cyan')
  
  if (DRY_RUN) {
    log('\n⚠️  DRY RUN MODE - No data will be written', 'yellow')
  }
  
  // Connect to MongoDB
  logSection('Connecting to MongoDB')
  try {
    await connectMongo()
    log('   ✓ Connected to MongoDB', 'green')
  } catch (err: any) {
    log(`   ✗ Failed to connect to MongoDB: ${err.message}`, 'red')
    process.exit(1)
  }
  
  // Connect to Supabase (optional)
  logSection('Connecting to Supabase')
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    log('   ⚠️  Supabase credentials not found', 'yellow')
    log('   Migration will skip Supabase data import', 'yellow')
    log('   You can manually import data later or set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY', 'yellow')
  } else {
    const supabase = createClient(supabaseUrl, supabaseKey)
    log('   ✓ Connected to Supabase', 'green')
    
    // Run migrations in order (respecting foreign key dependencies)
    await migrateUsers(supabase)
    await migrateClubs(supabase)
    await migrateSpaces(supabase)
    await migrateReservations(supabase)
    await migrateNotifications(supabase)
    await migrateMessages(supabase)
    await migrateOnlineStatus(supabase)
  }
  
  // Print summary
  logSection('Migration Summary')
  log(`   Users:        ${stats.users}`, stats.users > 0 ? 'green' : 'yellow')
  log(`   Clubs:       ${stats.clubs}`, stats.clubs > 0 ? 'green' : 'yellow')
  log(`   Spaces:      ${stats.spaces}`, stats.spaces > 0 ? 'green' : 'yellow')
  log(`   Reservations: ${stats.reservations}`, stats.reservations > 0 ? 'green' : 'yellow')
  log(`   Notifications: ${stats.notifications}`, stats.notifications > 0 ? 'green' : 'yellow')
  log(`   Messages:    ${stats.messages}`, stats.messages > 0 ? 'green' : 'yellow')
  log(`   OnlineStatus: ${stats.onlineStatus}`, stats.onlineStatus > 0 ? 'green' : 'yellow')
  
  if (stats.errors.length > 0) {
    log(`\n   ⚠️  ${stats.errors.length} errors occurred:`, 'red')
    stats.errors.forEach((err, i) => {
      log(`   ${i + 1}. ${err}`, 'red')
    })
  }
  
  if (DRY_RUN) {
    log('\n   This was a DRY RUN - no data was written', 'yellow')
  } else {
    log('\n   ✅ Migration completed!', 'green')
  }
  
  process.exit(stats.errors.length > 0 ? 1 : 0)
}

// Run migration
main().catch((err) => {
  log(`\n✗ Fatal error: ${err.message}`, 'red')
  console.error(err)
  process.exit(1)
})
