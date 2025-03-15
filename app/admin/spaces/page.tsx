"use client"

import { useState, useEffect } from "react"
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
import { Search, MoreHorizontal, Edit, Trash2, Plus, X, RefreshCw } from "lucide-react"
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
              image: "/spaces/default.jpg"
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
      image: "/spaces/default.jpg", // Default image, will be updated after upload
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
        
        // Update local state
        setSpaces(spaces.map(space => 
          space.id === selectedSpace.id ? updatedSpace : space
        ))
        
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
        
        // Update local state
        setSpaces([...spaces, newSpace])
        
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
      
      // Remove from local state
      setSpaces(spaces.filter(space => space.id !== selectedSpace.id))
      
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

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Space Management</h1>
          <p className="text-muted-foreground">Manage reservable spaces and locations</p>
        </div>
        <div className="flex items-center gap-2">
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
          >
            <RefreshCw className="h-4 w-4" />
            <span className="sr-only">Refresh spaces</span>
          </Button>
          <Button onClick={() => setShowAddSpace(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add New Space
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Available Spaces</CardTitle>
              <CardDescription>View and manage reservable spaces</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search spaces..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
            </div>
          ) : (
            <div className="rounded-md border">
              <div className="grid grid-cols-5 gap-4 p-4 text-sm font-medium text-muted-foreground border-b">
                <div className="col-span-2">Space</div>
                <div>Capacity</div>
                <div>Features</div>
                <div className="text-right">Actions</div>
              </div>
              <div className="divide-y">
                {filteredSpaces.map((space) => (
                  <div key={space.id} className="grid grid-cols-5 gap-4 p-4 items-center">
                    <div className="col-span-2 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-md bg-gray-100 dark:bg-gray-800 overflow-hidden">
                        <img 
                          src={space.image || "/spaces/default.jpg"} 
                          alt={space.name} 
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/spaces/default.jpg"
                          }}
                        />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{space.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(space.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div>
                      <Badge variant="outline" className="font-mono">
                        {space.capacity || 0}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {space.features && space.features.length > 0 ? (
                        space.features.slice(0, 3).map((feature, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">None</span>
                      )}
                      {space.features && space.features.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{space.features.length - 3} more
                        </Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedSpace(space)
                              setShowAddSpace(true)
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600 dark:text-red-400"
                            onClick={() => {
                              setSelectedSpace(space)
                              setShowDeleteConfirm(true)
                            }}
                            disabled={space.name.toLowerCase() === "non-specific"}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Space
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}

                {filteredSpaces.length === 0 && (
                  <div className="p-4 text-center text-muted-foreground">No spaces found matching your search.</div>
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
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleAddSpace}>
            <DialogHeader>
              <DialogTitle>{selectedSpace ? "Edit Space" : "Add New Space"}</DialogTitle>
              <DialogDescription>
                {selectedSpace
                  ? "Edit the space details below."
                  : "Create a new reservable space."}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 py-3">
              <div className="grid gap-2">
                <Label htmlFor="space-name">Space Name</Label>
                <Input 
                  id="space-name" 
                  name="space-name"
                  defaultValue={selectedSpace?.name} 
                  placeholder="Enter space name" 
                  required 
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="space-capacity">Capacity</Label>
                <Input
                  id="space-capacity"
                  name="space-capacity"
                  type="number"
                  min="0"
                  defaultValue={selectedSpace?.capacity || 0}
                  placeholder="Maximum number of people"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label>Features</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {features.map((feature, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {feature}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
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
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addFeature()
                      }
                    }}
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={addFeature}
                  >
                    Add
                  </Button>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="space-image">Space Image</Label>
                <div className="flex items-center gap-4">
                  <div className="h-24 w-24 rounded-lg border overflow-hidden bg-gray-100 dark:bg-gray-800">
                    {selectedSpace?.image || spaceImage ? (
                      <img
                        src={spaceImage ? URL.createObjectURL(spaceImage) : (selectedSpace?.image || "/spaces/default.jpg")}
                        alt="Space preview"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.currentTarget.src = "/spaces/default.jpg")
                        }}
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <Input
                      id="space-image-upload"
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 5 * 1024 * 1024) { // 5MB limit
                            toast({
                              title: "Error",
                              description: "Image file is too large. Maximum size is 5MB.",
                              variant: "destructive",
                            });
                            return;
                          }
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
                              
                              // Update the spaces list
                              setSpaces(spaces.map(space => 
                                space.id === selectedSpace.id 
                                  ? { ...space, image: url }
                                  : space
                              ));
                              
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
                        }
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      Upload a photo of the space. Maximum file size: 5MB.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSelectedSpace(null)
                  setShowAddSpace(false)
                }}
              >
                Cancel
              </Button>
              <Button type="submit">{selectedSpace ? "Save Changes" : "Create Space"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the space "{selectedSpace?.name}".
              This action cannot be undone. Spaces with existing reservations cannot be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedSpace(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSpace} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  )
} 