
"use client";

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Users, BookOpen, UserPlus, Settings2, ListChecks, PlusCircle } from 'lucide-react';

export default function AdminDashboardPage() {
  const adminActions = [
    {
      title: "Manage Classes",
      description: "Create new classes, assign subjects to them, and view existing class configurations.",
      href: "/admin/classes",
      icon: Users,
      buttonText: "Go to Classes",
      buttonIcon: ListChecks,
    },
    {
      title: "Manage Subjects",
      description: "Add new subjects to the global list. These subjects can then be assigned to classes.",
      href: "/admin/subjects",
      icon: BookOpen,
      buttonText: "Go to Subjects",
      buttonIcon: PlusCircle,
    },
    {
      title: "Manage Students",
      description: "Add new students, assign them to classes and specific subjects. View student rosters.",
      href: "/admin/students",
      icon: UserPlus,
      buttonText: "Go to Students",
      buttonIcon: PlusCircle,
    },
  ];

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="mb-8 text-center">
        <Settings2 className="mx-auto h-16 w-16 text-primary mb-4" />
        <h1 className="text-4xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-lg text-muted-foreground mt-2">Oversee and manage school data efficiently.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminActions.map((action) => (
          <Card key={action.title} className="flex flex-col hover:shadow-xl transition-shadow duration-300 ease-in-out transform hover:-translate-y-1">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3 mb-2">
                <action.icon className="h-8 w-8 text-primary" />
                <CardTitle className="text-2xl">{action.title}</CardTitle>
              </div>
              <CardDescription className="text-sm leading-relaxed min-h-[60px]">{action.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col justify-end">
              <Link href={action.href} passHref legacyBehavior>
                <Button variant="default" className="w-full mt-4 text-base py-3">
                  {action.buttonText}
                  {action.buttonIcon && <action.buttonIcon className="ml-2 h-5 w-5" />}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
