#!/usr/bin/env tsx
/**
 * API Endpoints Test Script
 * 
 * Tests all critical API endpoints to ensure they're working correctly
 * 
 * Usage:
 *   npm run test:api
 * 
 * Prerequisites:
 *   - Dev server running on http://localhost:3000
 *   - MongoDB connection configured
 */

import { config } from 'dotenv'
import * as path from 'path'

// Load environment variables
const envLocalPath = path.resolve(process.cwd(), '.env.local')
const envPath = path.resolve(process.cwd(), '.env')
config({ path: envLocalPath })
if (!process.env.MONGODB_URI) {
  config({ path: envPath })
}

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000'

interface TestResult {
  name: string
  status: 'pass' | 'fail' | 'skip'
  message?: string
  duration?: number
}

const results: TestResult[] = []

async function testEndpoint(
  name: string,
  url: string,
  options?: RequestInit
): Promise<TestResult> {
  const startTime = Date.now()
  try {
    const response = await fetch(url, options)
    const duration = Date.now() - startTime
    
    if (response.ok || response.status < 500) {
      return {
        name,
        status: 'pass',
        message: `Status: ${response.status}`,
        duration,
      }
    } else {
      return {
        name,
        status: 'fail',
        message: `Status: ${response.status}`,
        duration,
      }
    }
  } catch (error: any) {
    const duration = Date.now() - startTime
    return {
      name,
      status: 'fail',
      message: error.message || 'Request failed',
      duration,
    }
  }
}

async function runTests() {
  console.log('\n🧪 Testing API Endpoints...\n')
  console.log(`Base URL: ${BASE_URL}\n`)

  // Health Check
  console.log('📊 Health Checks')
  results.push(await testEndpoint('MongoDB Health', `${BASE_URL}/api/health/mongo`))
  
  // Authentication
  console.log('\n🔐 Authentication')
  results.push(await testEndpoint('Login Endpoint (POST)', `${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test@example.com', password: 'test', userType: 'admin' }),
  }))
  
  // Core Data APIs (GET requests)
  console.log('\n📦 Core Data APIs')
  results.push(await testEndpoint('Get Users', `${BASE_URL}/api/users`))
  results.push(await testEndpoint('Get Clubs', `${BASE_URL}/api/clubs`))
  results.push(await testEndpoint('Get Spaces', `${BASE_URL}/api/spaces`))
  results.push(await testEndpoint('Get Reservations', `${BASE_URL}/api/reservations`))
  results.push(await testEndpoint('Get Analytics', `${BASE_URL}/api/analytics`))
  
  // Notifications & Messages
  console.log('\n💬 Notifications & Messages')
  results.push(await testEndpoint('Get Notifications', `${BASE_URL}/api/notifications`))
  results.push(await testEndpoint('Get Messages', `${BASE_URL}/api/messages`))
  results.push(await testEndpoint('Get Online Status', `${BASE_URL}/api/messages/online-status`))
  
  // Print Results
  console.log('\n' + '='.repeat(60))
  console.log('📋 Test Results Summary')
  console.log('='.repeat(60) + '\n')
  
  const passed = results.filter(r => r.status === 'pass').length
  const failed = results.filter(r => r.status === 'fail').length
  const skipped = results.filter(r => r.status === 'skip').length
  
  results.forEach(result => {
    const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⏭️'
    const duration = result.duration ? ` (${result.duration}ms)` : ''
    console.log(`${icon} ${result.name}${duration}`)
    if (result.message && result.status === 'fail') {
      console.log(`   └─ ${result.message}`)
    }
  })
  
  console.log('\n' + '='.repeat(60))
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed} | Skipped: ${skipped}`)
  console.log('='.repeat(60) + '\n')
  
  if (failed > 0) {
    process.exit(1)
  }
}

// Run tests
runTests().catch(error => {
  console.error('Test runner error:', error)
  process.exit(1)
})
