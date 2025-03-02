"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AdminLayout } from "@/components/admin-layout"
import { AlertCircle, Linkedin } from "lucide-react"
import Link from "next/link"

export default function SettingsPage() {
  return (
    <AdminLayout>
      <div className="flex flex-col gap-6 p-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Account Settings</h1>
          <p className="text-muted-foreground">Manage your account credentials</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Work in Progress
            </CardTitle>
            <CardDescription>
              This feature is currently under development
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              The settings page is still in progress. If you need to change your account information, 
              please contact the system administrator.
            </p>
            
            <div className="rounded-lg bg-muted p-4">
              <h3 className="text-sm font-medium mb-2">Contact Information</h3>
              <p className="text-sm text-muted-foreground mb-3">
                For account changes, please contact Abdellah Raissouni
              </p>
              <Button asChild variant="outline" size="sm" className="gap-2">
                <Link href="https://www.linkedin.com/in/abdellah-raissouni-1419432a8" target="_blank" rel="noopener noreferrer">
                  <Linkedin className="h-4 w-4" />
                  LinkedIn Profile
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}

