"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AdminLayout } from "@/components/admin-layout"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, Download, Filter, BarChart3, PieChart, TrendingUp, Users, RefreshCw, LineChart, Activity, Building2, CalendarRange, CheckCircle2, XCircle, Clock3, ArrowUpRight, ArrowDownRight, CalendarDays, Users2 } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { supabase } from "@/lib/supabase"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar, PieChart as RechartsePieChart, Pie, Cell, Legend, LineChart as RechartsLineChart, Line } from 'recharts'

interface AnalyticsData {
  overview: {
    totalReservations: number
    activeClubs: number
    totalSpaces: number
    utilizationRate: number
    approvalRate: number
    mostActiveClub: {
      name: string
      reservations: number
    }
    mostUsedSpace: {
      name: string
      reservations: number
    }
  }
  reservations: {
    pending: number
    approved: number
    rejected: number
    total: number
  }
  spaceUtilization: Array<{
    name: string
    total: number
    approved: number
    utilization: number
  }>
  clubActivity: Array<{
    name: string
    reservations: number
    approved: number
    rejected: number
  }>
  timeAnalysis: {
    peakHours: Array<{
      hour: string
      count: number
    }>
    peakDays: Array<{
      day: string
      count: number
    }>
  }
  charts: {
    monthly: Array<{
      name: string
      total: number
      approved: number
      rejected: number
    }>
    daily: Array<{
      name: string
      value: number
    }>
    status: Array<{
      name: string
      value: number
    }>
  }
}

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("last30days")
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Function to get month name
  const getMonthName = (date: Date) => {
    return date.toLocaleString('default', { month: 'short' });
  }

  // Function to get day name
  const getDayName = (date: Date) => {
    return date.toLocaleString('default', { weekday: 'short' });
  }

  const fetchAnalytics = useCallback(async () => {
    try {
      // Fetch total reservations
      const { data: reservations, error: reservationsError } = await supabase
        .from('reservations')
        .select('*')
      
      if (reservationsError) throw reservationsError

      // Fetch active clubs
      const { data: clubs, error: clubsError } = await supabase
        .from('clubs')
        .select('*')
        .eq('status', 'active')
      
      if (clubsError) throw clubsError

      // Fetch spaces
      const { data: spaces, error: spacesError } = await supabase
        .from('spaces')
        .select('*')
      
      if (spacesError) throw spacesError

      // Calculate analytics
      const totalReservations = reservations?.length || 0
      const approvedReservations = reservations?.filter(r => r.status === 'approved').length || 0
      const rejectedReservations = reservations?.filter(r => r.status === 'rejected').length || 0
      const pendingReservations = reservations?.filter(r => r.status === 'pending').length || 0

      // Calculate club activity
      const clubActivity = clubs?.map(club => {
        const clubReservations = reservations?.filter(r => r.club_id === club.id) || []
        return {
          name: club.name,
          reservations: clubReservations.length,
          approved: clubReservations.filter(r => r.status === 'approved').length,
          rejected: clubReservations.filter(r => r.status === 'rejected').length
        }
      }).sort((a, b) => b.reservations - a.reservations) || []

      // Calculate space utilization
      const spaceUtilization = spaces?.map(space => {
        const spaceReservations = reservations?.filter(r => r.space_id === space.id) || []
        return {
          name: space.name,
          total: spaceReservations.length,
          approved: spaceReservations.filter(r => r.status === 'approved').length,
          utilization: Math.round((spaceReservations.filter(r => r.status === 'approved').length / totalReservations) * 100) || 0
        }
      }).sort((a, b) => b.total - a.total) || []

      // Calculate time analysis
      const timeAnalysis = {
        peakHours: Array.from({ length: 24 }, (_, i) => ({
          hour: `${i.toString().padStart(2, '0')}:00`,
          count: reservations?.filter(r => new Date(r.start_time).getHours() === i).length || 0
        })).sort((a, b) => b.count - a.count),
        peakDays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => ({
          day,
          count: reservations?.filter(r => new Date(r.start_time).toLocaleDateString('en-US', { weekday: 'long' }) === day).length || 0
        })).sort((a, b) => b.count - a.count)
      }

      // Additional analytics calculations
      const now = new Date()
      const monthlyData = Array.from({ length: 6 }, (_, i) => {
        const month = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthReservations = reservations?.filter(r => {
          const reservationDate = new Date(r.created_at)
          return reservationDate.getMonth() === month.getMonth() &&
                 reservationDate.getFullYear() === month.getFullYear()
        }) || []
        
        return {
          name: getMonthName(month),
          total: monthReservations.length,
          approved: monthReservations.filter(r => r.status === 'approved').length,
          rejected: monthReservations.filter(r => r.status === 'rejected').length,
        }
      }).reverse()

      const dailyData = Array.from({ length: 7 }, (_, i) => {
        const day = new Date(now)
        day.setDate(now.getDate() - i)
        const dayReservations = reservations?.filter(r => {
          const reservationDate = new Date(r.created_at)
          return reservationDate.toDateString() === day.toDateString()
        }) || []
        
        return {
          name: getDayName(day),
          value: dayReservations.length
        }
      }).reverse()

      const statusData = [
        { name: 'Approved', value: approvedReservations },
        { name: 'Pending', value: pendingReservations },
        { name: 'Rejected', value: rejectedReservations }
      ]

      setAnalyticsData({
        overview: {
          totalReservations,
          activeClubs: clubs?.length || 0,
          totalSpaces: spaces?.length || 0,
          utilizationRate: Math.round((approvedReservations / totalReservations) * 100) || 0,
          approvalRate: Math.round((approvedReservations / (approvedReservations + rejectedReservations)) * 100) || 0,
          mostActiveClub: clubActivity[0] || { name: 'N/A', reservations: 0 },
          mostUsedSpace: spaceUtilization[0] || { name: 'N/A', reservations: 0 }
        },
        reservations: {
          pending: pendingReservations,
          approved: approvedReservations,
          rejected: rejectedReservations,
          total: totalReservations
        },
        spaceUtilization,
        clubActivity,
        timeAnalysis,
        charts: {
          monthly: monthlyData,
          daily: dailyData,
          status: statusData
        }
      })

      setError(null)
      } catch (err) {
      console.error('Error fetching analytics:', err)
      setError('Failed to load analytics data. Please try again.')
    }
  }, [])

  useEffect(() => {
    setIsLoading(true)
    fetchAnalytics().finally(() => setIsLoading(false))
  }, [fetchAnalytics])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchAnalytics()
    setIsRefreshing(false)
  }

  const handleExport = () => {
    if (!analyticsData) return

    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    // Create HTML content with styling
    const htmlContent = `
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; }
            table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
            th, td { padding: 8px; text-align: left; border: 1px solid #ddd; }
            th { background-color: #1B1464; color: white; }
            .header { background-color: #FF6B00; color: white; font-size: 18px; padding: 12px; }
            .subheader { background-color: #f8f9fa; color: #1B1464; font-weight: bold; }
            .positive { color: #22c55e; }
            .negative { color: #ef4444; }
            .warning { color: #eab308; }
            .highlight { background-color: #f0f9ff; }
            .section-title { background-color: #1B1464; color: white; font-size: 16px; padding: 10px; margin-top: 20px; }
            .note { font-style: italic; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            ADE ENSA Tetouan Clubs Reservations Statistics<br>
            <span style="font-size: 14px;">Generated on ${currentDate}</span>
          </div>

          <div class="section-title">Overview Statistics</div>
          <table>
            <tr class="subheader">
              <th>Metric</th>
              <th>Value</th>
              <th>Additional Info</th>
            </tr>
            <tr>
              <td>Total Reservations</td>
              <td>${analyticsData.overview.totalReservations}</td>
              <td>As of ${currentDate}</td>
            </tr>
            <tr class="highlight">
              <td>Active Clubs</td>
              <td>${analyticsData.overview.activeClubs}</td>
              <td>Currently registered</td>
            </tr>
            <tr>
              <td>Total Spaces</td>
              <td>${analyticsData.overview.totalSpaces}</td>
              <td>Available for reservations</td>
            </tr>
            <tr class="highlight">
              <td>Utilization Rate</td>
              <td>${analyticsData.overview.utilizationRate}%</td>
              <td>Spaces usage percentage</td>
            </tr>
            <tr>
              <td>Approval Rate</td>
              <td>${analyticsData.overview.approvalRate}%</td>
              <td>Reservation approval rate</td>
            </tr>
          </table>

          <div class="section-title">Reservation Status Distribution</div>
          <table>
            <tr class="subheader">
              <th>Status</th>
              <th>Count</th>
              <th>Percentage</th>
            </tr>
            <tr>
              <td class="warning">Pending</td>
              <td>${analyticsData.reservations.pending}</td>
              <td>${Math.round((analyticsData.reservations.pending / analyticsData.reservations.total) * 100)}%</td>
            </tr>
            <tr>
              <td class="positive">Approved</td>
              <td>${analyticsData.reservations.approved}</td>
              <td>${Math.round((analyticsData.reservations.approved / analyticsData.reservations.total) * 100)}%</td>
            </tr>
            <tr>
              <td class="negative">Rejected</td>
              <td>${analyticsData.reservations.rejected}</td>
              <td>${Math.round((analyticsData.reservations.rejected / analyticsData.reservations.total) * 100)}%</td>
            </tr>
          </table>

          <div class="section-title">Club Activity Statistics</div>
          <table>
            <tr class="subheader">
              <th>Club Name</th>
              <th>Total Reservations</th>
              <th>Approved</th>
              <th>Rejected</th>
              <th>Approval Rate</th>
            </tr>
            ${analyticsData.clubActivity.map(club => `
              <tr>
                <td>${club.name}</td>
                <td>${club.reservations}</td>
                <td class="positive">${club.approved}</td>
                <td class="negative">${club.rejected}</td>
                <td>${Math.round((club.approved / club.reservations) * 100)}%</td>
              </tr>
            `).join('')}
          </table>

          <div class="section-title">Space Utilization Statistics</div>
          <table>
            <tr class="subheader">
              <th>Space Name</th>
              <th>Total Reservations</th>
              <th>Approved Reservations</th>
              <th>Utilization Rate</th>
              <th>Status</th>
            </tr>
            ${analyticsData.spaceUtilization.map(space => `
              <tr class="${space.utilization > 75 ? 'highlight' : ''}">
                <td>${space.name}</td>
                <td>${space.total}</td>
                <td>${space.approved}</td>
                <td>${space.utilization}%</td>
                <td>${space.utilization > 75 ? 'High Usage' : space.utilization > 50 ? 'Medium Usage' : 'Low Usage'}</td>
              </tr>
            `).join('')}
          </table>

          <div class="section-title">Time Analysis</div>
          <table>
            <tr class="subheader">
              <th>Peak Hours (Top 5)</th>
              <th>Reservations</th>
              <th>% of Total</th>
            </tr>
            ${analyticsData.timeAnalysis.peakHours.slice(0, 5).map(hour => `
              <tr>
                <td>${hour.hour}</td>
                <td>${hour.count}</td>
                <td>${Math.round((hour.count / analyticsData.overview.totalReservations) * 100)}%</td>
              </tr>
            `).join('')}
          </table>

          <table>
            <tr class="subheader">
              <th>Day of Week</th>
              <th>Reservations</th>
              <th>% of Total</th>
            </tr>
            ${analyticsData.timeAnalysis.peakDays.map(day => `
              <tr>
                <td>${day.day}</td>
                <td>${day.count}</td>
                <td>${Math.round((day.count / analyticsData.overview.totalReservations) * 100)}%</td>
              </tr>
            `).join('')}
          </table>

          <div class="section-title">Monthly Trends</div>
          <table>
            <tr class="subheader">
              <th>Month</th>
              <th>Total</th>
              <th>Approved</th>
              <th>Rejected</th>
              <th>Approval Rate</th>
            </tr>
            ${analyticsData.charts.monthly.map(month => `
              <tr>
                <td>${month.name}</td>
                <td>${month.total}</td>
                <td class="positive">${month.approved}</td>
                <td class="negative">${month.rejected}</td>
                <td>${Math.round((month.approved / month.total) * 100)}%</td>
              </tr>
            `).join('')}
          </table>

          <div class="note">
            * This report was automatically generated by the ADE ENSA Tetouan Clubs Management System<br>
            * All statistics are based on the data available at the time of generation
          </div>
        </body>
      </html>
    `

    // Create a Blob with HTML content
    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel;charset=utf-8' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ADE clubs reservations stats - ${new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).replace(/,/g, '')}.xls`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1B1464] dark:text-white">Analytics Dashboard</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Monitor club activities, space utilization, and reservation patterns
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last7days">Last 7 days</SelectItem>
                <SelectItem value="last30days">Last 30 days</SelectItem>
                <SelectItem value="last90days">Last 90 days</SelectItem>
                <SelectItem value="lastYear">Last year</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="icon"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="w-full sm:w-10 h-10"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
              <Button 
                variant="outline" 
                size="icon"
                onClick={handleExport}
                disabled={!analyticsData}
                className="w-full sm:w-10 h-10"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white dark:bg-gray-950">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Reservations</CardTitle>
              <Activity className="h-4 w-4 text-[#FF6B00]" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="animate-pulse h-7 w-16 bg-gray-200 dark:bg-gray-800 rounded" />
              ) : (
                <div className="text-2xl font-bold">{analyticsData?.overview.totalReservations || 0}</div>
              )}
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {timeRange === 'last7days' ? 'Past 7 days' : 
                 timeRange === 'last30days' ? 'Past 30 days' : 
                 timeRange === 'last90days' ? 'Past 90 days' : 'Past year'}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-950">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Clubs</CardTitle>
              <Users className="h-4 w-4 text-[#FF6B00]" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="animate-pulse h-7 w-16 bg-gray-200 dark:bg-gray-800 rounded" />
              ) : (
                <div className="text-2xl font-bold">{analyticsData?.overview.activeClubs || 0}</div>
              )}
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Currently active
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-950">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Utilization Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-[#FF6B00]" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="animate-pulse h-7 w-16 bg-gray-200 dark:bg-gray-800 rounded" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{analyticsData?.overview.utilizationRate || 0}%</div>
                  <Progress 
                    value={analyticsData?.overview.utilizationRate || 0} 
                    className="h-1 mt-2"
                  />
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-950">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-[#FF6B00]" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="animate-pulse h-7 w-16 bg-gray-200 dark:bg-gray-800 rounded" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{analyticsData?.overview.approvalRate || 0}%</div>
                  <Progress 
                    value={analyticsData?.overview.approvalRate || 0} 
                    className="h-1 mt-2"
                  />
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Monthly Trend */}
          <Card className="bg-white dark:bg-gray-950">
            <CardHeader>
              <CardTitle className="text-lg">Monthly Reservation Trends</CardTitle>
              <CardDescription>Reservation patterns over the last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[300px] animate-pulse bg-gray-200 dark:bg-gray-800 rounded" />
              ) : (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analyticsData?.charts.monthly}>
                      <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1B1464" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#1B1464" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorApproved" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#FF6B00" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#FF6B00" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                      <XAxis dataKey="name" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Area
                        type="monotone"
                        dataKey="total"
                        stroke="#1B1464"
                        fillOpacity={1}
                        fill="url(#colorTotal)"
                        name="Total"
                      />
                      <Area
                        type="monotone"
                        dataKey="approved"
                        stroke="#FF6B00"
                        fillOpacity={1}
                        fill="url(#colorApproved)"
                        name="Approved"
                      />
                      <Legend />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Daily Activity */}
          <Card className="bg-white dark:bg-gray-950">
            <CardHeader>
              <CardTitle className="text-lg">Daily Activity</CardTitle>
              <CardDescription>Reservation count for the past 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[300px] animate-pulse bg-gray-200 dark:bg-gray-800 rounded" />
              ) : (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsData?.charts.daily}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                      <XAxis dataKey="name" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Bar dataKey="value" fill="#1B1464" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status Distribution */}
          <Card className="bg-white dark:bg-gray-950">
            <CardHeader>
              <CardTitle className="text-lg">Status Distribution</CardTitle>
              <CardDescription>Overall reservation status breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[300px] animate-pulse bg-gray-200 dark:bg-gray-800 rounded" />
              ) : (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsePieChart>
                      <Pie
                        data={analyticsData?.charts.status}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                      >
                        <Cell fill="#22c55e" /> {/* Approved - Green */}
                        <Cell fill="#eab308" /> {/* Pending - Yellow */}
                        <Cell fill="#ef4444" /> {/* Rejected - Red */}
                      </Pie>
                      <Legend />
                    </RechartsePieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Stats */}
          <Card className="bg-white dark:bg-gray-950">
            <CardHeader>
              <CardTitle className="text-lg">Quick Stats</CardTitle>
              <CardDescription>Key performance indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <ArrowUpRight className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Most Active Day</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {analyticsData?.timeAnalysis.peakDays[0]?.day || 'N/A'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {analyticsData?.timeAnalysis.peakDays[0]?.count || 0} reservations
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock3 className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Peak Hour</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {analyticsData?.timeAnalysis.peakHours[0]?.hour || 'N/A'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {analyticsData?.timeAnalysis.peakHours[0]?.count || 0} reservations
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Users2 className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium">Most Active Club</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {analyticsData?.overview.mostActiveClub.name || 'N/A'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {analyticsData?.overview.mostActiveClub.reservations || 0} reservations
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-medium">Most Used Space</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {analyticsData?.overview.mostUsedSpace.name || 'N/A'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {analyticsData?.overview.mostUsedSpace.reservations || 0} reservations
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Reservation Status */}
          <Card className="bg-white dark:bg-gray-950">
            <CardHeader>
              <CardTitle className="text-lg">Reservation Status</CardTitle>
              <CardDescription>Current reservation distribution</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse h-8 bg-gray-200 dark:bg-gray-800 rounded" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-yellow-500" />
                      <span>Pending</span>
                    </div>
                    <span className="font-semibold">{analyticsData?.reservations.pending || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-green-500" />
                      <span>Approved</span>
                    </div>
                    <span className="font-semibold">{analyticsData?.reservations.approved || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-red-500" />
                      <span>Rejected</span>
                    </div>
                    <span className="font-semibold">{analyticsData?.reservations.rejected || 0}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Most Active Clubs */}
          <Card className="bg-white dark:bg-gray-950">
            <CardHeader>
              <CardTitle className="text-lg">Most Active Clubs</CardTitle>
              <CardDescription>Top clubs by reservation count</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse h-8 bg-gray-200 dark:bg-gray-800 rounded" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {analyticsData?.clubActivity.slice(0, 3).map((club, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="w-6 h-6 flex items-center justify-center p-0">
                          {index + 1}
                        </Badge>
                        <span>{club.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          {club.approved}
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          <XCircle className="h-4 w-4 text-red-500" />
                          {club.rejected}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Space Utilization */}
          <Card className="bg-white dark:bg-gray-950">
            <CardHeader>
              <CardTitle className="text-lg">Space Utilization</CardTitle>
              <CardDescription>Usage statistics for each space</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse h-8 bg-gray-200 dark:bg-gray-800 rounded" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {analyticsData?.spaceUtilization.map((space, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>{space.name}</span>
                        <span className="font-medium">{space.utilization}%</span>
                      </div>
                      <Progress value={space.utilization} className="h-2" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Peak Hours */}
          <Card className="bg-white dark:bg-gray-950">
            <CardHeader>
              <CardTitle className="text-lg">Peak Hours</CardTitle>
              <CardDescription>Most popular reservation times</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse h-8 bg-gray-200 dark:bg-gray-800 rounded" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {analyticsData?.timeAnalysis.peakHours.slice(0, 5).map((hour, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock3 className="h-4 w-4 text-[#FF6B00]" />
                        <span>{hour.hour}</span>
                      </div>
                      <Badge variant="secondary">{hour.count} reservations</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
} 