import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="container mx-auto px-0">
      <Card className="overflow-hidden border-0 shadow-none">
        <CardContent className="p-0">
          <div className="flex items-center justify-between p-3 border-b">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-10 w-40" />
          </div>
          <div className="flex h-[calc(100vh-8rem)]">
            {/* Conversations List Skeleton */}
            <div className="w-1/3 md:w-1/4 border-r flex flex-col">
              <div className="p-3 border-b">
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="p-3 space-y-3 flex-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-2">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Conversation Area Skeleton */}
            <div className="flex-1 flex flex-col">
              <div className="p-3 border-b flex items-center">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div>
                    <Skeleton className="h-5 w-32 mb-1" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </div>
              
              <div className="flex-1 p-3 space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                    <Skeleton className={`h-16 ${i % 2 === 0 ? 'w-64' : 'w-48'} rounded-lg`} />
                  </div>
                ))}
              </div>
              
              <div className="p-3 border-t">
                <div className="flex gap-2">
                  <Skeleton className="h-20 flex-1 rounded-md" />
                  <Skeleton className="h-10 w-10 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 