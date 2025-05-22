
"use client";

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Users, Book, PlusCircle, ListChecks, Settings } from 'lucide-react';

export default function AdminDashboardPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="w-full max-w-3xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl flex items-center">
            <Settings className="mr-3 h-8 w-8 text-primary" />
            Admin Panel
          </CardTitle>
          <CardDescription>Manage classes, subjects, and students.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/admin/classes" passHref>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <Users className="mr-2 h-5 w-5 text-primary" /> Manage Classes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Add new classes and assign subjects.</p>
                <Button variant="outline" className="mt-4 w-full">
                  Go to Classes <ListChecks className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/subjects" passHref>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <Book className="mr-2 h-5 w-5 text-primary" /> Manage Subjects
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Add new subjects to the global list.</p>
                 <Button variant="outline" className="mt-4 w-full">
                  Go to Subjects <PlusCircle className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/students" passHref>
            <Card className="hover:shadow-md transition-shadow cursor-pointer md:col-span-2"> 
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <Users className="mr-2 h-5 w-5 text-primary" /> Manage Students
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Add new students and assign them to classes.</p>
                 <Button variant="outline" className="mt-4 w-full">
                  Go to Students <PlusCircle className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
