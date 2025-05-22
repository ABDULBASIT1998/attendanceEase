
"use client";

import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Student, AttendanceStatus } from '@/types';
import { User, CheckCircle, XCircle } from 'lucide-react';
import { useState, useRef } from 'react';

interface StudentAttendanceCardProps {
  student: Student;
  onMarkPresent: () => void;
  onMarkAbsent: () => void;
  currentStatus?: AttendanceStatus;
}

const SWIPE_THRESHOLD = 50; // Minimum pixels to consider a swipe

export function StudentAttendanceCard({ student, onMarkPresent, onMarkAbsent, currentStatus }: StudentAttendanceCardProps) {
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [currentX, setCurrentX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setTouchStartX(e.touches[0].clientX);
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX === null || !isSwiping) return;
    const deltaX = e.touches[0].clientX - touchStartX;
    setCurrentX(deltaX);

    if (cardRef.current) {
      cardRef.current.style.transform = `translateX(${deltaX}px) rotate(${deltaX / 20}deg)`;
      if (deltaX > SWIPE_THRESHOLD / 2) {
        cardRef.current.style.borderColor = 'hsl(var(--accent))';
      } else if (deltaX < -SWIPE_THRESHOLD / 2) {
        cardRef.current.style.borderColor = 'hsl(var(--destructive))';
      } else {
        cardRef.current.style.borderColor = 'hsl(var(--border))';
      }
    }
  };

  const handleTouchEnd = () => {
    if (touchStartX === null || !isSwiping) return;
    setIsSwiping(false);

    if (Math.abs(currentX) > SWIPE_THRESHOLD) {
      if (currentX > SWIPE_THRESHOLD) {
        onMarkPresent();
      } else if (currentX < -SWIPE_THRESHOLD) {
        onMarkAbsent();
      }
    }
    
    setCurrentX(0); // Reset position
    setTouchStartX(null);
    if (cardRef.current) {
      cardRef.current.style.transform = 'translateX(0px) rotate(0deg)';
      cardRef.current.style.borderColor = 'hsl(var(--border))';
      // Add a transition for the card to snap back smoothly
      cardRef.current.style.transition = 'transform 0.3s ease, border-color 0.3s ease';
      setTimeout(() => {
        if(cardRef.current) cardRef.current.style.transition = '';
      }, 300);
    }
  };

  return (
    <Card 
      ref={cardRef}
      className="w-full max-w-md shadow-xl cursor-grab select-none touch-pan-y"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ 
        borderWidth: '2px', 
        borderColor: 'hsl(var(--border))',
        // Initial transition for other properties, not transform during swipe
        transition: currentStatus !== 'pending' ? 'border-color 0.3s ease' : ''
      }}
    >
      <CardHeader className="items-center text-center pointer-events-none">
        {student.photoUrl ? (
           <Image 
             src={student.photoUrl} 
             alt={student.name} 
             width={100} 
             height={100} 
             className="rounded-full border-4 border-primary object-cover"
             data-ai-hint="student portrait"
           />
        ) : (
          <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center border-4 border-primary">
            <User className="w-12 h-12 text-muted-foreground" />
          </div>
        )}
        <CardTitle className="text-2xl mt-4">{student.name}</CardTitle>
        <p className="text-muted-foreground">Roll No: {student.rollNumber}</p>
      </CardHeader>
      <CardContent className="text-center min-h-[60px] pointer-events-none">
        {isSwiping && Math.abs(currentX) > SWIPE_THRESHOLD / 2 && (
          <p className={`font-semibold text-lg p-2 rounded-md ${currentX > 0 ? 'text-accent-foreground bg-accent' : 'text-destructive-foreground bg-destructive'}`}>
            {currentX > 0 ? 'Present?' : 'Absent?'}
          </p>
        )}
        {!isSwiping && currentStatus && currentStatus !== 'pending' && (
          <p className={`font-semibold text-lg ${currentStatus === 'present' ? 'text-accent-foreground bg-accent' : 'text-destructive-foreground bg-destructive'} p-2 rounded-md inline-flex items-center`}>
            {currentStatus === 'present' ? <CheckCircle className="mr-2 h-5 w-5" /> : <XCircle className="mr-2 h-5 w-5" />}
            Marked as: {currentStatus.toUpperCase()}
          </p>
        )}
        {!isSwiping && currentStatus === 'pending' && (
            <p className="text-muted-foreground italic">Swipe left for absent, right for present</p>
        )}
      </CardContent>
      {/* CardFooter removed as buttons are no longer needed */}
    </Card>
  );
}
