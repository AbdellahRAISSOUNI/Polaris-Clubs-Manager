"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { testNotificationsPermissions } from '@/lib/test-supabase-permissions'

export default function TestPermissionsPage() {
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const runTest = async () => {
    setLoading(true)
    try {
      const testResult = await testNotificationsPermissions()
      setResult(testResult)
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-4">Supabase Permissions Test</h1>
      <p className="mb-4">This page tests Supabase permissions for the notifications table.</p>
      
      <Button 
        onClick={runTest} 
        disabled={loading}
        className="mb-4"
      >
        {loading ? 'Running Test...' : 'Run Permissions Test'}
      </Button>
      
      {result && (
        <div className="mt-4 p-4 border rounded-md">
          <h2 className="text-lg font-semibold mb-2">Test Result:</h2>
          <p>{result}</p>
          <p className="mt-2 text-sm text-gray-500">Check the browser console for detailed results.</p>
        </div>
      )}
    </div>
  )
} 