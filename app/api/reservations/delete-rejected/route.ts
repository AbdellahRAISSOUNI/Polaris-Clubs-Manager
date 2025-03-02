import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function DELETE() {
  try {
    const { error } = await supabase
      .from('reservations')
      .delete()
      .eq('status', 'rejected')

    if (error) throw error

    return NextResponse.json({ message: 'Rejected reservations deleted successfully' })
  } catch (error) {
    console.error('Error deleting rejected reservations:', error)
    return NextResponse.json(
      { error: 'Failed to delete rejected reservations' },
      { status: 500 }
    )
  }
} 