"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search, MoreHorizontal, Edit, Trash2, Plus, X, RefreshCw, CheckCircle, XCircle, Building, ChevronDown } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Checkbox } from "@/components/ui/checkbox"
import { AdminLayout } from "@/components/admin-layout"
import { toast } from "@/components/ui/use-toast"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

interface Space {
  id: string;
  name: string;
  capacity: number;
  features: string[];
  image: string;
  created_at: string;
}

export default function SpacesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [showAddSpace, setShowAddSpace] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null)
  const [spaces, setSpaces] = useState<Space[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [spaceImage, setSpaceImage] = useState<File | null>(null)
  const [features, setFeatures] = useState<string[]>([])
  const [newFeature, setNewFeature] = useState("")
  const [selectedSpaces, setSelectedSpaces] = useState<Set<string>>(new Set())
  const [isBulkActionLoading, setIsBulkActionLoading] = useState(false)
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false)

  // Fetch spaces from API
  useEffect(() => {
    const fetchSpaces = async () => {
      setIsLoading(true)
      try {
        const response = await fetch('/api/spaces')
        if (!response.ok) throw new Error('Failed to fetch spaces')
        const data = await response.json()
        
        // Add "Non-specific" space if it doesn't exist
        const nonSpecificExists = data.some((space: Space) => 
          space.name.toLowerCase() === "non-specific" || 
          space.name.toLowerCase() === "non specific"
        )
        
        if (!nonSpecificExists) {
          // Create the non-specific space
          const createResponse = await fetch('/api/spaces', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: "Non-specific",
              capacity: 0,
              features: [],
              image: "/placeholder.jpg"
            })
          })
          
          if (createResponse.ok) {
            const newSpace = await createResponse.json()
            setSpaces([...data, newSpace])
          } else {
            setSpaces(data)
            console.error("Failed to create Non-specific space")
          }
        } else {
          setSpaces(data)
        }
      } catch (error: any) {
        console.error('Error fetching spaces:', error.message)
        toast({
          title: "Error",
          description: "Failed to load spaces. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchSpaces()
  }, [])

  // Filter spaces based on search
  const filteredSpaces = spaces.filter(
    (space) =>
      space.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Reset form state when opening/closing dialogs
  useEffect(() => {
    if (!showAddSpace) {
      setSelectedSpace(null)
      setSpaceImage(null)
      setFeatures([])
      setNewFeature("")
    }
  }, [showAddSpace])

  // Set features when editing a space
  useEffect(() => {
    if (selectedSpace) {
      setFeatures(selectedSpace.features || [])
    }
  }, [selectedSpace])

  // Add feature to the list
  const addFeature = () => {
    if (newFeature.trim() && !features.includes(newFeature.trim())) {
      setFeatures([...features, newFeature.trim()])
      setNewFeature("")
    }
  }

  // Remove feature from the list
  const removeFeature = (feature: string) => {
    setFeatures(features.filter(f => f !== feature))
  }

  // Add or edit space
  const handleAddSpace = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const form = e.target as HTMLFormElement
    const formData = new FormData(form)
    
    const spaceData = {
      name: formData.get('space-name') as string,
      capacity: parseInt(formData.get('space-capacity') as string) || 0,
      features: features,
      image: "/placeholder.jpg", // Default image, will be updated after upload
    }
    
    try {
      if (selectedSpace) {
        // Update existing space
        const response = await fetch('/api/spaces', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: selectedSpace.id,
            ...spaceData,
            image: selectedSpace.image, // Use the current image URL
          })
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to update space')
        }
        
        const updatedSpace = await response.json()
        
        // If there's an image to upload, do it now
        if (spaceImage) {
          const formData = new FormData()
          formData.append('file', spaceImage)
          
          const uploadResponse = await fetch(`/api/spaces/${selectedSpace.id}/image`, {
            method: 'POST',
            body: formData,
          })
          
          if (!uploadResponse.ok) {
            console.error('Failed to upload space image')
            toast({
              title: "Warning",
              description: "Space updated but image upload failed. You can try uploading the image again later.",
              variant: "default",
            })
          } else {
            const { url } = await uploadResponse.json()
            updatedSpace.image = url
          }
        }
        
        // Refresh spaces list from API to get latest data including images
        const refreshResponse = await fetch('/api/spaces')
        if (refreshResponse.ok) {
          const refreshedSpaces = await refreshResponse.json()
          setSpaces(refreshedSpaces || [])
        } else {
          // Fallback to local state update if refresh fails
          setSpaces(spaces.map(space => 
            space.id === selectedSpace.id ? updatedSpace : space
          ))
        }
        
        toast({
          title: "Success",
          description: "Space updated successfully",
        })
      } else {
        // Create new space
        const response = await fetch('/api/spaces', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(spaceData)
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to create space')
        }
        
        const newSpace = await response.json()
        
        // If there's an image to upload, do it now
        if (spaceImage) {
          const formData = new FormData()
          formData.append('file', spaceImage)
          
          const uploadResponse = await fetch(`/api/spaces/${newSpace.id}/image`, {
            method: 'POST',
            body: formData,
          })
          
          if (!uploadResponse.ok) {
            console.error('Failed to upload space image')
            toast({
              title: "Warning",
              description: "Space created but image upload failed. You can try uploading the image again later.",
              variant: "default",
            })
          } else {
            const { url } = await uploadResponse.json()
            newSpace.image = url
          }
        }
        
        // Refresh spaces list from API to get latest data including images
        const refreshResponse = await fetch('/api/spaces')
        if (refreshResponse.ok) {
          const refreshedSpaces = await refreshResponse.json()
          setSpaces(refreshedSpaces || [])
        } else {
          // Fallback to local state update if refresh fails
          setSpaces([...spaces, newSpace])
        }
        
        toast({
          title: "Success",
          description: "Space created successfully",
        })
      }
      
      // Reset form and close dialog
      setSelectedSpace(null)
      setShowAddSpace(false)
      setFeatures([])
      setSpaceImage(null)
    } catch (error: any) {
      console.error('Error saving space:', error.message)
      toast({
        title: "Error",
        description: error.message || "Failed to save space",
        variant: "destructive",
      })
    }
  }

  // Delete space
  const handleDeleteSpace = async () => {
    if (!selectedSpace) return
    
    try {
      const response = await fetch(`/api/spaces?id=${selectedSpace.id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete space')
      }
      
      // Refresh spaces list from API to get latest data
      const refreshResponse = await fetch('/api/spaces')
      if (refreshResponse.ok) {
        const refreshedSpaces = await refreshResponse.json()
        setSpaces(refreshedSpaces || [])
      } else {
        // Fallback to local state update if refresh fails
        setSpaces(spaces.filter(space => space.id !== selectedSpace.id))
      }
      
      toast({
        title: "Success",
        description: "Space deleted successfully",
      })
      
      setShowDeleteConfirm(false)
      setSelectedSpace(null)
    } catch (error: any) {
      console.error('Error deleting space:', error.message)
      toast({
        title: "Error",
        description: error.message || "Failed to delete space",
        variant: "destructive",
      })
    }
  }

  // Bulk action handlers
  const handleBulkSpaceAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedSpaces.size === 0) return

    setIsBulkActionLoading(true)
    try {
      if (action === 'delete') {
        const response = await fetch('/api/spaces/bulk', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ spaceIds: Array.from(selectedSpaces) }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to delete spaces')
        }

        const result = await response.json()
        toast({
          title: "Success",
          description: result.message || `Successfully deleted ${selectedSpaces.size} space(s)`,
        })
      } else {
        const response = await fetch('/api/spaces/bulk', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            spaceIds: Array.from(selectedSpaces),
            action,
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to perform bulk action')
        }

        const result = await response.json()
        toast({
          title: "Success",
          description: result.message || `Successfully ${action === 'activate' ? 'activated' : 'deactivated'} ${selectedSpaces.size} space(s)`,
        })
      }

      // Clear selection and refresh
      setSelectedSpaces(new Set())
      setShowBulkDeleteConfirm(false)
      // Refresh spaces
      const response = await fetch('/api/spaces')
      if (response.ok) {
        const data = await response.json()
        setSpaces(data || [])
      }
    } catch (error: any) {
      console.error('Error performing bulk action:', error)
      toast({
        title: "Error",
        description: error.message || 'Failed to perform bulk action',
        variant: "destructive",
      })
    } finally {
      setIsBulkActionLoading(false)
    }
  }

  const toggleSpaceSelection = (spaceId: string) => {
    setSelectedSpaces(prev => {
      const newSet = new Set(prev)
      if (newSet.has(spaceId)) {
        newSet.delete(spaceId)
      } else {
        newSet.add(spaceId)
      }
      return newSet
    })
  }

  const toggleSelectAllSpaces = () => {
    if (selectedSpaces.size === filteredSpaces.length) {
      setSelectedSpaces(new Set())
    } else {
      setSelectedSpaces(new Set(filteredSpaces.map(s => s.id)))
    }
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 pb-8 sm:pb-12 overflow-x-hidden">
        <div className="flex flex-col gap-4 sm:gap-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6"
          >
            <div>
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
                Space Management
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
                Manage reservable spaces and locations
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={async () => {
                    try {
                      setIsLoading(true);
                      const response = await fetch('/api/spaces');
                      if (!response.ok) throw new Error('Failed to fetch spaces');
                      const data = await response.json();
                      setSpaces(data);
                      toast({
                        title: "Success",
                        description: "Spaces list refreshed",
                      });
                    } catch (error) {
                      console.error('Error refreshing spaces:', error);
                      toast({
                        title: "Error",
                        description: "Failed to refresh spaces",
                        variant: "destructive",
                      });
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  className="rounded-2xl glass border-0 shadow-apple hover:shadow-apple-lg transition-apple"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span className="sr-only">Refresh spaces</span>
                </Button>
              </motion.div>
              <motion.div 
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }}
                className="flex-1 sm:flex-none"
              >
                <Button 
                  onClick={() => setShowAddSpace(true)} 
                  className="w-full sm:w-auto gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-apple hover:shadow-apple-lg border-0 transition-apple text-sm sm:text-base font-semibold h-11 sm:h-10 px-6 sm:px-4"
                >
                  <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>Add New Space</span>
                </Button>
              </motion.div>
            </div>
          </motion.div>

          {/* Bulk Actions Toolbar */}
          <AnimatePresence>
            {selectedSpaces.size > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="mb-4 sm:mb-6"
              >
                <Card className="glass shadow-apple-lg border-0 rounded-3xl">
                  <CardContent className="p-3 sm:p-4 flex flex-wrap items-center gap-2 sm:gap-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Badge variant="secondary" className="text-xs sm:text-sm glass border-0 shadow-apple">
                        {selectedSpaces.size} selected
                      </Badge>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedSpaces(new Set())}
                          className="h-7 sm:h-8 text-xs rounded-2xl"
                        >
                          Clear
                        </Button>
                      </motion.div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleBulkSpaceAction('activate')}
                          disabled={isBulkActionLoading}
                          className="h-8 sm:h-9 text-xs sm:text-sm rounded-2xl glass border-0 shadow-apple hover:shadow-apple-lg transition-apple"
                        >
                          {isBulkActionLoading ? (
                            <div className="h-3 w-3 sm:h-4 sm:w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-1 sm:mr-2" />
                          ) : (
                            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-green-600" />
                          )}
                          Activate
                        </Button>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleBulkSpaceAction('deactivate')}
                          disabled={isBulkActionLoading}
                          className="h-8 sm:h-9 text-xs sm:text-sm rounded-2xl glass border-0 shadow-apple hover:shadow-apple-lg transition-apple"
                        >
                          {isBulkActionLoading ? (
                            <div className="h-3 w-3 sm:h-4 sm:w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-1 sm:mr-2" />
                          ) : (
                            <XCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-red-600" />
                          )}
                          Deactivate
                        </Button>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setShowBulkDeleteConfirm(true)}
                          disabled={isBulkActionLoading}
                          className="h-8 sm:h-9 text-xs sm:text-sm rounded-2xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-apple hover:shadow-apple-lg border-0 transition-apple"
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          Delete
                        </Button>
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          <Card id="spaces-section" className="glass shadow-apple-lg border-0 rounded-3xl overflow-hidden">
            <CardHeader className="border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-br from-gray-50/50 to-white/50 dark:from-gray-900/50 dark:to-gray-800/50 backdrop-blur-xl p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <div>
                  <CardTitle className="text-xl sm:text-2xl font-semibold tracking-tight">Available Spaces</CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-1">View and manage reservable spaces</CardDescription>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:flex-none sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                    <Input
                      placeholder="Search spaces..."
                      className="pl-10 h-10 sm:h-11 rounded-2xl border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-apple transition-apple focus:bg-white dark:focus:bg-gray-900/90"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex justify-center items-center py-12 sm:py-16">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 dark:border-gray-600 border-t-gray-900 dark:border-t-gray-100"></div>
                </div>
              ) : (
                <div className="relative">
                  {/* Desktop Table Header */}
                  <div className="hidden md:block sticky top-0 border-b border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-10">
                    <div className="grid grid-cols-6 gap-4 p-4 text-xs sm:text-sm font-medium text-muted-foreground">
                      <div className="w-10">
                        <Checkbox
                          checked={selectedSpaces.size > 0 && selectedSpaces.size === filteredSpaces.length}
                          onCheckedChange={toggleSelectAllSpaces}
                        />
                      </div>
                      <div className="col-span-2">Space</div>
                      <div>Capacity</div>
                      <div>Features</div>
                      <div className="text-right">Actions</div>
                    </div>
                  </div>
                  
                  {/* Mobile/Desktop List */}
                  <div className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
                    <AnimatePresence mode="popLayout">
                      {filteredSpaces.map((space, index) => {
                        const isSelected = selectedSpaces.has(space.id)
                        return (
                          <motion.div
                            key={space.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            className={`md:grid md:grid-cols-6 gap-3 sm:gap-4 p-3 sm:p-4 transition-apple rounded-2xl mx-2 sm:mx-0 mb-2 sm:mb-0 ${
                              isSelected ? 'bg-blue-50/50 dark:bg-blue-950/20 ring-2 ring-blue-500/30 dark:ring-blue-400/30' : 'bg-white/50 dark:bg-gray-900/30 hover:bg-gray-50/50 dark:hover:bg-gray-900/40'
                            }`}
                          >
                            {/* Desktop: Checkbox */}
                            <div className="hidden md:flex w-10 items-center">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleSpaceSelection(space.id)}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                            
                            {/* Mobile: Top row with checkbox and space info */}
                            <div className="md:hidden flex items-center gap-3 mb-3">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleSpaceSelection(space.id)}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <div className="h-12 w-12 rounded-2xl bg-gray-100 dark:bg-gray-800 overflow-hidden ring-2 ring-white/50 dark:ring-gray-800/50 flex-shrink-0">
                                <img 
                                  src={space.image ? `/api/spaces/${space.id}/image` : "/placeholder.jpg"} 
                                  alt={space.name} 
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    if (target.src && !target.src.includes('placeholder.jpg') && !target.src.includes('data:')) {
                                      target.src = "/placeholder.jpg"
                                    } else {
                                      target.style.display = 'none'
                                    }
                                  }}
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-base text-foreground truncate">{space.name}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {new Date(space.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            
                            {/* Desktop: Space info in columns 2-3 */}
                            <div className="hidden md:flex col-span-2 items-center gap-3">
                              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-gray-100 dark:bg-gray-800 overflow-hidden ring-2 ring-white/50 dark:ring-gray-800/50">
                                <img 
                                  src={space.image ? `/api/spaces/${space.id}/image` : "/placeholder.jpg"} 
                                  alt={space.name} 
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    if (target.src && !target.src.includes('placeholder.jpg') && !target.src.includes('data:')) {
                                      target.src = "/placeholder.jpg"
                                    } else {
                                      target.style.display = 'none'
                                    }
                                  }}
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-sm sm:text-base text-foreground truncate">{space.name}</p>
                                <p className="text-xs sm:text-sm text-muted-foreground">
                                  {new Date(space.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            
                            {/* Mobile: Capacity and Features row */}
                            <div className="md:hidden flex items-center justify-between mb-2">
                              <div>
                                <Badge variant="outline" className="glass border-0 shadow-apple font-mono">
                                  {space.capacity || 0}
                                </Badge>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {space.features && space.features.length > 0 ? (
                                  space.features.slice(0, 2).map((feature, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-xs glass border-0 shadow-apple">
                                      {feature}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-xs text-muted-foreground">No features</span>
                                )}
                              </div>
                            </div>
                            
                            {/* Mobile: Actions row */}
                            <div className="md:hidden flex items-center justify-end">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                    <Button variant="ghost" size="icon" className="rounded-2xl glass border-0 shadow-apple hover:shadow-apple-lg transition-apple h-9 w-9">
                                      <MoreHorizontal className="h-4 w-4" />
                                      <span className="sr-only">Open menu</span>
                                    </Button>
                                  </motion.div>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 glass-strong border-0 shadow-apple-lg rounded-2xl">
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedSpace(space)
                                      setShowAddSpace(true)
                                    }}
                                    className="gap-2 rounded-xl"
                                  >
                                    <Edit className="h-4 w-4" />
                                    Edit Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="text-red-600 dark:text-red-400 gap-2 rounded-xl"
                                    onClick={() => {
                                      setSelectedSpace(space)
                                      setShowDeleteConfirm(true)
                                    }}
                                    disabled={space.name.toLowerCase() === "non-specific"}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    Delete Space
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            
                            {/* Desktop: Capacity column */}
                            <div className="hidden md:block">
                              <Badge variant="outline" className="glass border-0 shadow-apple font-mono">
                                {space.capacity || 0}
                              </Badge>
                            </div>
                            
                            {/* Desktop: Features column */}
                            <div className="hidden md:block flex flex-wrap gap-1">
                              {space.features && space.features.length > 0 ? (
                                <>
                                  {space.features.slice(0, 3).map((feature, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-xs glass border-0 shadow-apple">
                                      {feature}
                                    </Badge>
                                  ))}
                                  {space.features.length > 3 && (
                                    <Badge variant="outline" className="text-xs glass border-0 shadow-apple">
                                      +{space.features.length - 3} more
                                    </Badge>
                                  )}
                                </>
                              ) : (
                                <span className="text-xs text-muted-foreground">No features</span>
                              )}
                            </div>
                            
                            {/* Desktop: Actions column */}
                            <div className="hidden md:block text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                    <Button variant="ghost" size="icon" className="rounded-2xl glass border-0 shadow-apple hover:shadow-apple-lg transition-apple">
                                      <MoreHorizontal className="h-4 w-4" />
                                      <span className="sr-only">Open menu</span>
                                    </Button>
                                  </motion.div>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 glass-strong border-0 shadow-apple-lg rounded-2xl">
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedSpace(space)
                                      setShowAddSpace(true)
                                    }}
                                    className="gap-2 rounded-xl"
                                  >
                                    <Edit className="h-4 w-4" />
                                    Edit Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="text-red-600 dark:text-red-400 gap-2 rounded-xl"
                                    onClick={() => {
                                      setSelectedSpace(space)
                                      setShowDeleteConfirm(true)
                                    }}
                                    disabled={space.name.toLowerCase() === "non-specific"}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    Delete Space
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </motion.div>
                        )
                      })}
                    </AnimatePresence>

                    {filteredSpaces.length === 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="p-8 sm:p-12 text-center"
                      >
                        <div className="mx-auto w-fit rounded-full bg-muted p-3 sm:p-4 mb-3 sm:mb-4">
                          <Search className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground font-medium mb-1 text-sm sm:text-base">No spaces found</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">Try adjusting your search query</p>
                      </motion.div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
      </Card>

          {/* Add/Edit Space Dialog */}
          <Dialog open={showAddSpace} onOpenChange={(open) => {
            setShowAddSpace(open)
            if (!open) {
              setSelectedSpace(null)
            }
          }}>
            <DialogContent className="max-w-md max-h-[90vh] p-0 glass-strong border-0 rounded-3xl shadow-apple-lg flex flex-col overflow-hidden">
              <form onSubmit={handleAddSpace} className="flex flex-col h-full max-h-[90vh] overflow-hidden">
                <DialogHeader className="relative bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 backdrop-blur-xl p-5 sm:p-6 border-b border-gray-200/50 dark:border-gray-700/50 flex-shrink-0">
                  <DialogTitle className="bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent text-xl sm:text-2xl">
                    {selectedSpace ? "Edit Space" : "Add New Space"}
                  </DialogTitle>
                  <DialogDescription className="text-xs sm:text-sm mt-2">
                    {selectedSpace
                      ? "Edit the space details below."
                      : "Create a new reservable space."}
                  </DialogDescription>
                </DialogHeader>

                <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent p-5 sm:p-6" style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'thin', maxHeight: 'calc(90vh - 200px)' }}>
                  <div className="grid gap-4 sm:gap-5">
                    <div className="grid gap-2">
                      <Label htmlFor="space-name" className="text-xs sm:text-sm">Space Name</Label>
                      <Input 
                        id="space-name" 
                        name="space-name"
                        defaultValue={selectedSpace?.name} 
                        placeholder="Enter space name"
                        className="rounded-2xl glass border-0 shadow-apple h-10 sm:h-11"
                        required 
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="space-capacity" className="text-xs sm:text-sm">Capacity</Label>
                      <Input
                        id="space-capacity"
                        name="space-capacity"
                        type="number"
                        min="0"
                        defaultValue={selectedSpace?.capacity || 0}
                        placeholder="Maximum number of people"
                        className="rounded-2xl glass border-0 shadow-apple h-10 sm:h-11"
                        required
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label className="text-xs sm:text-sm">Features</Label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {features.map((feature, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center gap-1 glass border-0 shadow-apple">
                            {feature}
                            <X 
                              className="h-3 w-3 cursor-pointer hover:text-red-500 transition-colors" 
                              onClick={() => removeFeature(feature)}
                            />
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          value={newFeature}
                          onChange={(e) => setNewFeature(e.target.value)}
                          placeholder="Add a feature"
                          className="rounded-2xl glass border-0 shadow-apple h-10 sm:h-11 flex-1"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              addFeature()
                            }
                          }}
                        />
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={addFeature}
                            className="rounded-2xl glass border-0 shadow-apple hover:shadow-apple-lg transition-apple"
                          >
                            Add
                          </Button>
                        </motion.div>
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="space-image" className="text-xs sm:text-sm">Space Image</Label>
                      <div className="flex items-center gap-4">
                        <div className="h-24 w-24 rounded-2xl border-0 overflow-hidden bg-gray-100 dark:bg-gray-800 ring-2 ring-white/50 dark:ring-gray-800/50 shadow-apple flex-shrink-0">
                          {spaceImage ? (
                            <img
                              key={`preview-${spaceImage.name}-${spaceImage.lastModified}`}
                              src={URL.createObjectURL(spaceImage)}
                              alt="Space preview"
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                const target = e.currentTarget as HTMLImageElement
                                if (target.src && !target.src.includes('placeholder.jpg') && !target.src.includes('data:')) {
                                  target.src = "/placeholder.jpg"
                                } else {
                                  target.style.display = 'none'
                                }
                              }}
                            />
                          ) : selectedSpace?.image ? (
                            <img
                              src={`/api/spaces/${selectedSpace.id}/image`}
                              alt="Space preview"
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                const target = e.currentTarget as HTMLImageElement
                                if (target.src && !target.src.includes('placeholder.jpg') && !target.src.includes('data:')) {
                                  target.src = "/placeholder.jpg"
                                } else {
                                  target.style.display = 'none'
                                }
                              }}
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs">
                              No image
                            </div>
                          )}
                        </div>
                        <div className="flex-1 space-y-2">
                          <Input
                            id="space-image-upload"
                            type="file"
                            accept="image/*"
                            className="rounded-2xl glass border-0 shadow-apple"
                            onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 10 * 1024 * 1024) { // 10MB limit
                            toast({
                              title: "Error",
                              description: "Image file is too large. Maximum size is 10MB.",
                              variant: "destructive",
                            });
                            return;
                          }
                          // Set the image file immediately for preview
                          setSpaceImage(file);
                          
                          // If we're editing an existing space, upload the image immediately
                          if (selectedSpace) {
                            const formData = new FormData();
                            formData.append('file', file);
                            
                            try {
                              const response = await fetch(`/api/spaces/${selectedSpace.id}/image`, {
                                method: 'POST',
                                body: formData,
                              });
                              
                              if (!response.ok) {
                                throw new Error('Failed to upload image');
                              }
                              
                              const { url } = await response.json();
                              
                              // Update the local state with the new image URL
                              setSelectedSpace({
                                ...selectedSpace,
                                image: url,
                              });
                              
                              // Refresh spaces list from API to get latest data including images
                              const refreshResponse = await fetch('/api/spaces')
                              if (refreshResponse.ok) {
                                const refreshedSpaces = await refreshResponse.json()
                                setSpaces(refreshedSpaces || [])
                              } else {
                                // Fallback to local state update if refresh fails
                                setSpaces(spaces.map(space => 
                                  space.id === selectedSpace.id 
                                    ? { ...space, image: url }
                                    : space
                                ))
                              }
                              
                              toast({
                                title: "Success",
                                description: "Image uploaded successfully",
                              });
                            } catch (error) {
                              console.error('Error uploading image:', error);
                              toast({
                                title: "Error",
                                description: "Failed to upload image. Please try again.",
                                variant: "destructive",
                              });
                            }
                          }
                        } else {
                          setSpaceImage(null);
                        }
                      }}
                    />
                          <p className="text-xs text-muted-foreground">
                            Upload a photo of the space. Maximum file size: 10MB.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <DialogFooter className="p-5 sm:p-6 border-t border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-br from-gray-50/50 to-white/50 dark:from-gray-900/50 dark:to-gray-800/50 backdrop-blur-xl">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setSelectedSpace(null)
                        setShowAddSpace(false)
                      }}
                      className="rounded-2xl glass border-0 shadow-apple hover:shadow-apple-lg transition-apple"
                    >
                      Cancel
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button 
                      type="submit"
                      className="rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-apple hover:shadow-apple-lg border-0 transition-apple"
                    >
                      {selectedSpace ? "Save Changes" : "Create Space"}
                    </Button>
                  </motion.div>
                </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
            <AlertDialogContent className="glass-strong border-0 rounded-3xl shadow-apple-lg">
              <AlertDialogHeader>
                <AlertDialogTitle className="bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent text-base sm:text-lg">
                  Are you sure?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-sm">
                  This will permanently delete the space "{selectedSpace?.name}".
                  This action cannot be undone. Spaces with existing reservations cannot be deleted.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                <AlertDialogCancel 
                  onClick={() => setSelectedSpace(null)}
                  className="rounded-2xl glass border-0 shadow-apple mt-0"
                >
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDeleteSpace} 
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-2xl shadow-apple hover:shadow-apple-lg border-0 transition-apple"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Bulk Delete Confirmation Dialog */}
          <AlertDialog open={showBulkDeleteConfirm} onOpenChange={setShowBulkDeleteConfirm}>
            <AlertDialogContent className="glass-strong border-0 rounded-3xl shadow-apple-lg">
              <AlertDialogHeader>
                <AlertDialogTitle className="bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent text-base sm:text-lg">
                  Delete {selectedSpaces.size} Space(s)?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-sm">
                  Are you sure you want to delete {selectedSpaces.size} space(s)? This action cannot be undone.
                  Spaces with existing reservations cannot be deleted. All associated data will be permanently removed.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                <AlertDialogCancel 
                  disabled={isBulkActionLoading}
                  className="rounded-2xl glass border-0 shadow-apple mt-0"
                >
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleBulkSpaceAction('delete')}
                  disabled={isBulkActionLoading}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-2xl shadow-apple hover:shadow-apple-lg border-0 transition-apple"
                >
                  {isBulkActionLoading ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Deleting...
                    </>
                  ) : (
                    'Delete All'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          {/* Mobile Scroll to Spaces Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
            className="fixed bottom-6 right-4 sm:hidden z-50"
          >
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Button
                onClick={() => {
                  const spacesSection = document.getElementById('spaces-section')
                  if (spacesSection) {
                    spacesSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }
                }}
                className="h-14 w-14 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-apple-lg hover:shadow-apple-lg border-0 transition-apple flex items-center justify-center"
                size="icon"
              >
                <ChevronDown className="h-6 w-6" />
                <span className="sr-only">Scroll to spaces</span>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </AdminLayout>
  )
} 