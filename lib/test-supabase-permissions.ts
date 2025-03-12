import { supabase } from '@/lib/supabase'

/**
 * Utility function to test Supabase permissions for the notifications table
 */
export async function testNotificationsPermissions() {
  console.log('Testing Supabase notifications table permissions...')
  
  try {
    // Test read permissions
    console.log('Testing READ permissions...')
    const { data: readData, error: readError } = await supabase
      .from('notifications')
      .select('*')
      .limit(1)
    
    if (readError) {
      console.error('READ permission error:', readError.message)
    } else {
      console.log('READ permission test successful:', readData)
    }
    
    // Test insert permissions
    console.log('Testing INSERT permissions...')
    const testNotification = {
      recipient_id: 'test-id',
      recipient_type: 'admin',
      title: 'Test Notification',
      message: 'This is a test notification to check permissions',
      type: 'info'
    }
    
    const { data: insertData, error: insertError } = await supabase
      .from('notifications')
      .insert(testNotification)
      .select()
    
    if (insertError) {
      console.error('INSERT permission error:', insertError.message)
    } else {
      console.log('INSERT permission test successful:', insertData)
      
      // If insert was successful, test delete permissions
      if (insertData && insertData.length > 0) {
        const testId = insertData[0].id
        
        console.log('Testing DELETE permissions...')
        const { data: deleteData, error: deleteError } = await supabase
          .from('notifications')
          .delete()
          .eq('id', testId)
          .select()
        
        if (deleteError) {
          console.error('DELETE permission error:', deleteError.message)
        } else {
          console.log('DELETE permission test successful:', deleteData)
        }
      }
    }
    
    // Test update permissions (on an existing notification if available)
    console.log('Testing UPDATE permissions...')
    const { data: existingNotifications, error: fetchError } = await supabase
      .from('notifications')
      .select('id')
      .limit(1)
    
    if (fetchError) {
      console.error('Error fetching notification for UPDATE test:', fetchError.message)
    } else if (existingNotifications && existingNotifications.length > 0) {
      const testId = existingNotifications[0].id
      
      const { data: updateData, error: updateError } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', testId)
        .select()
      
      if (updateError) {
        console.error('UPDATE permission error:', updateError.message)
      } else {
        console.log('UPDATE permission test successful:', updateData)
      }
    } else {
      console.log('No existing notifications found to test UPDATE permissions')
    }
    
    return 'Permissions test completed. Check console for results.'
  } catch (e) {
    console.error('Exception during permissions test:', e)
    return 'Error testing permissions. Check console for details.'
  }
}

/**
 * Test deleting a specific notification
 * @param notificationId The ID of the notification to delete
 */
export async function testDeleteNotification(notificationId: string) {
  console.log('Testing deletion of notification with ID:', notificationId)
  
  try {
    // First, try to fetch the notification to confirm it exists
    console.log('Fetching notification details...')
    const { data: notification, error: fetchError } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', notificationId)
      .single()
    
    if (fetchError) {
      console.error('Error fetching notification:', fetchError.message)
      return `Error fetching notification: ${fetchError.message}`
    }
    
    if (!notification) {
      console.error('Notification not found')
      return 'Notification not found'
    }
    
    console.log('Found notification:', notification)
    
    // Try different delete approaches
    
    // Approach 1: Simple delete by ID
    console.log('Approach 1: Simple delete by ID')
    const { data: deleteData1, error: deleteError1 } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .select()
    
    if (deleteError1) {
      console.error('Approach 1 failed:', deleteError1.message)
    } else {
      console.log('Approach 1 succeeded:', deleteData1)
      return 'Successfully deleted notification using Approach 1'
    }
    
    // Approach 2: Delete with recipient filters
    console.log('Approach 2: Delete with recipient filters')
    const { data: deleteData2, error: deleteError2 } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('recipient_id', notification.recipient_id)
      .eq('recipient_type', notification.recipient_type)
      .select()
    
    if (deleteError2) {
      console.error('Approach 2 failed:', deleteError2.message)
    } else {
      console.log('Approach 2 succeeded:', deleteData2)
      return 'Successfully deleted notification using Approach 2'
    }
    
    // Approach 3: RPC call (if you have a delete_notification function in Supabase)
    console.log('Approach 3: Attempting RPC call')
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('delete_notification', {
        notification_id: notificationId
      })
      
      if (rpcError) {
        console.error('Approach 3 failed:', rpcError.message)
      } else {
        console.log('Approach 3 succeeded:', rpcData)
        return 'Successfully deleted notification using Approach 3 (RPC)'
      }
    } catch (rpcException) {
      console.error('RPC exception:', rpcException)
    }
    
    return 'All delete approaches failed. Check console for details.'
  } catch (e) {
    console.error('Exception during delete test:', e)
    return `Error testing delete: ${e instanceof Error ? e.message : String(e)}`
  }
} 