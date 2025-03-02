"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AdminLayout } from "@/components/admin-layout"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, Download, Filter, BarChart3, PieChart, TrendingUp, Users, RefreshCw, LineChart } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Define types for our analytics data
interface AnalyticsSummary {
  totalReservations: number;
  activeClubsCount: number;
  spaceUtilization: number;
  peakHours: {
    time: string;
    percentage: number;
  };
}

interface AnalyticsDetails {
  reservationsByStatus: {
    approved: number;
    pending: number;
    rejected: number;
  };
  spaceUtilization: Array<{
    name: string;
    utilization: number;
    reservations: number;
  }>;
  clubActivity: Array<{
    name: string;
    reservations: number;
    members: number;
    color: string;
  }>;
  monthlyStats: Array<{
    month: string;
    reservations: number;
    approved: number;
    rejected: number;
  }>;
  timeSlotPopularity: Array<{
    time: string;
    count: number;
    percentage: number;
  }>;
  dayOfWeekAnalysis: Array<{
    day: string;
    count: number;
    height: number;
  }>;
}

interface AnalyticsData {
  summary: AnalyticsSummary;
  details: AnalyticsDetails;
}

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("last30days")
  const [isLoading, setIsLoading] = useState(true)
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [chartType, setChartType] = useState<"bar" | "line">("bar")
  const [chartHeight, setChartHeight] = useState<number>(300)
  const [maxBarHeight, setMaxBarHeight] = useState<number>(200)
  
  // Fetch analytics data from the API
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        const response = await fetch(`/api/analytics?timeRange=${timeRange}`)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch analytics data: ${response.status}`)
        }
        
        const data = await response.json()
        setAnalyticsData(data)
      } catch (err) {
        console.error("Error fetching analytics data:", err)
        setError("Failed to load analytics data. Please try again later.")
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchAnalyticsData()
  }, [timeRange])

  // Function to get utilization color based on percentage
  const getUtilizationColor = (percentage: number) => {
    if (percentage < 50) return "bg-yellow-500"
    if (percentage < 75) return "bg-blue-500"
    return "bg-green-500"
  }

  // Function to refresh data
  const refreshData = () => {
    setIsLoading(true)
    fetch(`/api/analytics?timeRange=${timeRange}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to fetch analytics data: ${response.status}`)
        }
        return response.json()
      })
      .then(data => {
        setAnalyticsData(data)
        setError(null)
      })
      .catch(err => {
        console.error("Error refreshing analytics data:", err)
        setError("Failed to refresh analytics data. Please try again later.")
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  return (
    <AdminLayout>
      <div className="flex flex-col gap-4 sm:gap-6 p-4 sm:p-6">
        {/* Header Section */}
        <div className="flex flex-col gap-3">
          <div>
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight">Analytics Dashboard</h1>
            <p className="text-xs sm:text-base text-muted-foreground mt-1">
              Track and analyze club activities, space utilization, and reservation patterns.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-full h-9 text-xs sm:text-sm">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last7days">Last 7 days</SelectItem>
                <SelectItem value="last30days">Last 30 days</SelectItem>
                <SelectItem value="last90days">Last 90 days</SelectItem>
                <SelectItem value="lastYear">Last year</SelectItem>
                <SelectItem value="allTime">All time</SelectItem>
              </SelectContent>
            </Select>
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refreshData} 
                className="h-9 text-xs sm:text-sm w-full flex items-center justify-center"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-9 text-xs sm:text-sm w-full flex items-center justify-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 p-3 rounded-md text-xs sm:text-sm">
            {error}
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-3">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0">
              <CardTitle className="text-xs font-medium">Total Reservations</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-0 pt-2">
              {isLoading ? (
                <div className="animate-pulse h-6 w-14 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ) : (
                <div className="text-lg font-bold">{analyticsData?.summary.totalReservations || 0}</div>
              )}
            </CardContent>
          </Card>
          <Card className="p-3">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0">
              <CardTitle className="text-xs font-medium">Active Clubs</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-0 pt-2">
              {isLoading ? (
                <div className="animate-pulse h-6 w-14 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ) : (
                <div className="text-lg font-bold">{analyticsData?.summary.activeClubsCount || 0}</div>
              )}
            </CardContent>
          </Card>
          <Card className="p-3">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0">
              <CardTitle className="text-xs font-medium">Space Utilization</CardTitle>
              <PieChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-0 pt-2">
              {isLoading ? (
                <div className="animate-pulse h-6 w-14 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ) : (
                <div className="text-lg font-bold">{analyticsData?.summary.spaceUtilization || 0}%</div>
              )}
            </CardContent>
          </Card>
          <Card className="p-3">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0">
              <CardTitle className="text-xs font-medium">Peak Hours</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-0 pt-2">
              {isLoading ? (
                <div className="animate-pulse h-6 w-14 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ) : (
                <>
                  <div className="text-lg font-bold">{analyticsData?.summary.peakHours.time || "N/A"}</div>
                  <p className="text-[10px] text-muted-foreground">
                    {analyticsData?.summary.peakHours.percentage || 0}% of reservations
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different analytics views */}
        <Tabs defaultValue="overview" className="space-y-4">
          <div className="overflow-x-auto -mx-4 px-4">
            <TabsList className="w-[400px] sm:w-auto h-9">
              <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
              <TabsTrigger value="spaces" className="text-xs">Spaces</TabsTrigger>
              <TabsTrigger value="clubs" className="text-xs">Clubs</TabsTrigger>
              <TabsTrigger value="time" className="text-xs">Time Analysis</TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <Card className="p-3">
              <CardHeader className="flex flex-col gap-3 p-0 mb-3">
                <div>
                  <CardTitle className="text-sm">Monthly Reservation Trends</CardTitle>
                  <CardDescription className="text-xs mt-1">
                    Number of reservations processed each month
                  </CardDescription>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant={chartType === "bar" ? "default" : "outline"} 
                    size="sm"
                    className="h-8 text-xs w-full flex items-center justify-center"
                    onClick={() => setChartType("bar")}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Bar
                  </Button>
                  <Button 
                    variant={chartType === "line" ? "default" : "outline"} 
                    size="sm"
                    className="h-8 text-xs w-full flex items-center justify-center"
                    onClick={() => setChartType("line")}
                  >
                    <LineChart className="h-4 w-4 mr-2" />
                    Line
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="relative h-[200px]">
                  {isLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-2 text-xs text-muted-foreground">Loading chart data...</p>
                      </div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto -mx-3 px-3">
                      <div className="h-full min-w-[600px] flex items-end gap-1">
                        {analyticsData?.details.monthlyStats.map((month, index) => (
                          <div key={index} className="relative flex-1 flex flex-col items-center">
                            <div className="w-full flex flex-col items-center gap-0.5">
                              <div 
                                className="w-full bg-green-500 rounded-t" 
                                style={{ height: `${month.approved * 2}px` }}
                                title={`${month.approved} approved`}
                              ></div>
                              <div 
                                className="w-full bg-red-500 rounded-t" 
                                style={{ height: `${month.rejected * 2}px` }}
                                title={`${month.rejected} rejected`}
                              ></div>
                            </div>
                            <div className="mt-1 text-[10px] whitespace-nowrap">{month.month}</div>
                            <div className="text-[10px] text-muted-foreground">{month.reservations}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-3 flex items-center justify-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                    <span className="text-[10px]">Approved</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                    <span className="text-[10px]">Rejected</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4">
              <Card className="p-3 sm:p-6">
                <CardHeader className="p-0 mb-4">
                  <CardTitle className="text-sm sm:text-lg">Top Spaces by Utilization</CardTitle>
                  <CardDescription className="text-[10px] sm:text-sm">
                    Most frequently reserved spaces
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {isLoading ? (
                    <div className="h-[120px] sm:h-[200px] flex items-center justify-center">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-2 text-[10px] sm:text-sm text-muted-foreground">Loading data...</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 sm:space-y-4">
                      {analyticsData?.details.spaceUtilization.slice(0, 3).map((space, index) => (
                        <div key={index} className="space-y-1.5 sm:space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="text-xs sm:text-base font-medium">{space.name}</div>
                            <div className="text-[10px] sm:text-sm text-muted-foreground">{space.utilization}%</div>
                          </div>
                          <Progress value={space.utilization} className={getUtilizationColor(space.utilization)} />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="p-3 sm:p-6">
                <CardHeader className="p-0 mb-4">
                  <CardTitle className="text-sm sm:text-lg">Top Clubs by Activity</CardTitle>
                  <CardDescription className="text-[10px] sm:text-sm">
                    Clubs with the most reservations
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {isLoading ? (
                    <div className="h-[120px] sm:h-[200px] flex items-center justify-center">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-2 text-[10px] sm:text-sm text-muted-foreground">Loading data...</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 sm:space-y-4">
                      {analyticsData?.details.clubActivity.slice(0, 3).map((club, index) => (
                        <div key={index} className="flex items-center gap-2 sm:gap-4">
                          <div className={`w-7 h-7 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white text-xs sm:text-base ${club.color}`}>
                            {club.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <div className="text-xs sm:text-base font-medium truncate">{club.name}</div>
                              <Badge variant="outline" className="text-[9px] sm:text-xs whitespace-nowrap">{club.members} members</Badge>
                            </div>
                            <div className="mt-1 sm:mt-2 space-y-1">
                              <div className="text-[10px] sm:text-sm text-muted-foreground">{club.reservations} reservations</div>
                              <Progress 
                                value={(club.reservations / (analyticsData?.summary.totalReservations || 1)) * 100} 
                                className={club.color} 
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Spaces Tab */}
          <TabsContent value="spaces" className="space-y-4">
            <Card className="p-3 sm:p-6">
              <CardHeader className="flex flex-col gap-2 p-0 mb-4">
                <div>
                  <CardTitle className="text-sm sm:text-lg">Space Utilization Analysis</CardTitle>
                  <CardDescription className="text-[10px] sm:text-sm">
                    Detailed breakdown of space usage across all facilities
                  </CardDescription>
                </div>
                <Select 
                  value={chartHeight.toString()} 
                  onValueChange={(value) => setChartHeight(parseInt(value))}
                >
                  <SelectTrigger className="w-full sm:w-[120px] text-xs sm:text-sm">
                    <SelectValue placeholder="Chart height" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="200">Small</SelectItem>
                    <SelectItem value="300">Medium</SelectItem>
                    <SelectItem value="400">Large</SelectItem>
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="h-[180px] sm:h-[300px] flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-2 text-[10px] sm:text-sm text-muted-foreground">Loading data...</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4" style={{ height: `${chartHeight}px`, overflowY: 'auto' }}>
                    {analyticsData?.details.spaceUtilization.map((space, index) => (
                      <div key={index} className="space-y-1.5 sm:space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="text-xs sm:text-base font-medium">{space.name}</div>
                          <div className="text-[10px] sm:text-sm">
                            <span className="font-medium">{space.utilization}%</span>
                            <span className="text-muted-foreground ml-1 sm:ml-2">({space.reservations} reservations)</span>
                          </div>
                        </div>
                        <Progress value={space.utilization} className={getUtilizationColor(space.utilization)} />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Clubs Tab */}
          <TabsContent value="clubs" className="space-y-4">
            <Card className="p-3 sm:p-6">
              <CardHeader className="flex flex-col gap-2 p-0 mb-4">
                <div>
                  <CardTitle className="text-sm sm:text-lg">Club Activity Analysis</CardTitle>
                  <CardDescription className="text-[10px] sm:text-sm">
                    Detailed breakdown of club reservation patterns
                  </CardDescription>
                </div>
                <Select 
                  value={chartHeight.toString()} 
                  onValueChange={(value) => setChartHeight(parseInt(value))}
                >
                  <SelectTrigger className="w-full sm:w-[120px] text-xs sm:text-sm">
                    <SelectValue placeholder="Chart height" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="200">Small</SelectItem>
                    <SelectItem value="300">Medium</SelectItem>
                    <SelectItem value="400">Large</SelectItem>
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="h-[180px] sm:h-[300px] flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-2 text-[10px] sm:text-sm text-muted-foreground">Loading data...</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4" style={{ height: `${chartHeight}px`, overflowY: 'auto' }}>
                    {analyticsData?.details.clubActivity.map((club, index) => (
                      <div key={index} className="flex items-center gap-2 sm:gap-4">
                        <div className={`w-7 h-7 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white text-xs sm:text-base ${club.color}`}>
                          {club.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-xs sm:text-base font-medium truncate">{club.name}</div>
                            <Badge variant="outline" className="text-[9px] sm:text-xs whitespace-nowrap">{club.members} members</Badge>
                          </div>
                          <div className="mt-1 sm:mt-2 space-y-1">
                            <div className="text-[10px] sm:text-sm text-muted-foreground">Reservations: {club.reservations}</div>
                            <Progress 
                              value={(club.reservations / (analyticsData?.summary.totalReservations || 1)) * 100} 
                              className={club.color} 
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Time Analysis Tab */}
          <TabsContent value="time" className="space-y-4">
            <Card className="p-3 sm:p-6">
              <CardHeader className="flex flex-col gap-2 p-0 mb-4">
                <div>
                  <CardTitle className="text-sm sm:text-lg">Time Slot Popularity</CardTitle>
                  <CardDescription className="text-[10px] sm:text-sm">
                    Analysis of the most popular reservation time slots
                  </CardDescription>
                </div>
                <Select 
                  value={maxBarHeight.toString()} 
                  onValueChange={(value) => setMaxBarHeight(parseInt(value))}
                >
                  <SelectTrigger className="w-full sm:w-[120px] text-xs sm:text-sm">
                    <SelectValue placeholder="Bar height" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="100">Low</SelectItem>
                    <SelectItem value="200">Medium</SelectItem>
                    <SelectItem value="300">High</SelectItem>
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="h-[180px] sm:h-[300px] flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-2 text-[10px] sm:text-sm text-muted-foreground">Loading data...</p>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto -mx-3 px-3">
                    <div className="h-[180px] sm:h-[300px] min-w-[500px] sm:min-w-[600px] flex items-end gap-1 sm:gap-4">
                      {analyticsData?.details.timeSlotPopularity.map((slot, index) => {
                        const maxPercentage = Math.max(...analyticsData.details.timeSlotPopularity.map(s => s.percentage));
                        const heightFactor = maxPercentage > 0 ? maxBarHeight / maxPercentage : 0;
                        const barHeight = Math.min(slot.percentage * heightFactor, maxBarHeight);
                        
                        return (
                          <div key={index} className="flex-1 flex flex-col items-center">
                            <div 
                              className="w-full bg-blue-500 rounded-t" 
                              style={{ height: `${barHeight}px` }}
                            ></div>
                            <div className="mt-1 sm:mt-2 text-[9px] sm:text-xs whitespace-nowrap">{slot.time}</div>
                            <div className="text-[9px] sm:text-xs text-muted-foreground">{slot.count} reservations</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="p-3 sm:p-6">
              <CardHeader className="flex flex-col gap-2 p-0 mb-4">
                <div>
                  <CardTitle className="text-sm sm:text-lg">Day of Week Analysis</CardTitle>
                  <CardDescription className="text-[10px] sm:text-sm">
                    Reservation patterns by day of the week
                  </CardDescription>
                </div>
                <Select 
                  value={maxBarHeight.toString()} 
                  onValueChange={(value) => setMaxBarHeight(parseInt(value))}
                >
                  <SelectTrigger className="w-full sm:w-[120px] text-xs sm:text-sm">
                    <SelectValue placeholder="Bar height" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="100">Low</SelectItem>
                    <SelectItem value="200">Medium</SelectItem>
                    <SelectItem value="300">High</SelectItem>
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="h-[120px] sm:h-[200px] flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-2 text-[10px] sm:text-sm text-muted-foreground">Loading data...</p>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto -mx-3 px-3">
                    <div className="h-[120px] sm:h-[200px] min-w-[400px] flex items-end gap-1 sm:gap-4">
                      {analyticsData?.details.dayOfWeekAnalysis.map((day, index) => {
                        const maxHeight = Math.max(...analyticsData.details.dayOfWeekAnalysis.map(d => d.height));
                        const heightFactor = maxHeight > 0 ? maxBarHeight / maxHeight : 0;
                        const barHeight = Math.min(day.height * heightFactor, maxBarHeight);
                        
                        return (
                          <div key={index} className="flex-1 flex flex-col items-center">
                            <div 
                              className="w-full bg-purple-500 rounded-t" 
                              style={{ height: `${barHeight}px` }}
                            ></div>
                            <div className="mt-1 sm:mt-2 text-[9px] sm:text-xs whitespace-nowrap">{day.day}</div>
                            <div className="text-[9px] sm:text-xs text-muted-foreground">{day.count}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
} 