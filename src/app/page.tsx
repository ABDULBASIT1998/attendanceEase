import { redirect } from 'next/navigation';

export default function HomePage() {
  // In a real app, check auth status here. For now, always redirect to login.
  // If using Clerk, this page might be protected by middleware or handle redirection based on auth state.
  redirect('/login');
  return null; // Or a loading spinner
}
