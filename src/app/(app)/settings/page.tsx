
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="container mx-auto py-10 px-4 flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
      <Card className="w-full max-w-md text-center shadow-lg">
        <CardHeader>
          <Settings className="mx-auto h-16 w-16 text-primary mb-4" />
          <CardTitle className="text-3xl">Application Settings</CardTitle>
          <CardDescription className="mt-2 text-lg">
            This page is currently under construction.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Configuration options and preferences will be available here in a future update.
            Thank you for your patience!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
