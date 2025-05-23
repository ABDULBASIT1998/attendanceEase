
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCircle } from "lucide-react";

export default function ProfilePage() {
  return (
    <div className="container mx-auto py-10 px-4 flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
      <Card className="w-full max-w-md text-center shadow-lg">
        <CardHeader>
          <UserCircle className="mx-auto h-16 w-16 text-primary mb-4" />
          <CardTitle className="text-3xl">User Profile</CardTitle>
          <CardDescription className="mt-2 text-lg">
            This page is currently under construction.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Your profile details and customization options will be available here soon.
            Thank you for your patience!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
