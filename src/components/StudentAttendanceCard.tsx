
"use client";

import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import type { Student, AttendanceStatus } from '@/types';
import { User, CheckCircle, XCircle, Hand, MousePointerClick } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();

  useEffect(() => {
    if (cardRef.current) {
      cardRef.current.style.transition = 'transform 0.3s ease-out, border-color 0.3s ease-out';
      cardRef.current.style.transform = 'translateX(0px) rotate(0deg)';
      cardRef.current.style.borderColor = 'hsl(var(--border))'; // Reset border color
    }
    // Reset currentX when student changes or status changes to ensure visual consistency
    setCurrentX(0);
  }, [student, currentStatus]);


  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isMobile || !cardRef.current) return;
    cardRef.current.style.transition = 'none'; // Make movement immediate during swipe
    setTouchStartX(e.touches[0].clientX);
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isMobile || touchStartX === null || !isSwiping || !cardRef.current) return;
    
    const deltaX = e.touches[0].clientX - touchStartX;
    setCurrentX(deltaX); 

    cardRef.current.style.transform = `translateX(${deltaX}px) rotate(${deltaX / 20}deg)`;
    
    // Visual feedback for swipe direction based on border color
    if (deltaX > SWIPE_THRESHOLD / 2) {
      cardRef.current.style.borderColor = 'hsl(var(--accent))'; // Greenish for present
    } else if (deltaX < -SWIPE_THRESHOLD / 2) {
      cardRef.current.style.borderColor = 'hsl(var(--destructive))'; // Reddish for absent
    } else {
      cardRef.current.style.borderColor = 'hsl(var(--border))'; // Default border
    }
  };

  const handleTouchEnd = () => {
    if (!isMobile || touchStartX === null || !isSwiping || !cardRef.current) return;

    const swipedFarEnough = Math.abs(currentX) > SWIPE_THRESHOLD;

    if (swipedFarEnough) {
      if (currentX > SWIPE_THRESHOLD) { // Swiped right
        onMarkPresent();
      } else if (currentX < -SWIPE_THRESHOLD) { // Swiped left
        onMarkAbsent();
      }
    }
    
    setIsSwiping(false); // End swiping state

    // Animate card back to original position smoothly
    if (cardRef.current) {
      cardRef.current.style.transition = 'transform 0.3s ease-out, border-color 0.3s ease-out';
      cardRef.current.style.transform = 'translateX(0px) rotate(0deg)';
      cardRef.current.style.borderColor = 'hsl(var(--border))'; // Reset border after swipe action or snap back
    }

    setTouchStartX(null);
    // setCurrentX(0); // currentX is reset by useEffect on student/status change
  };

  return (
    <Card 
      ref={cardRef}
      className="w-full max-w-md shadow-xl select-none touch-pan-y" // touch-pan-y allows vertical scroll
      onTouchStart={isMobile ? handleTouchStart : undefined}
      onTouchMove={isMobile ? handleTouchMove : undefined}
      onTouchEnd={isMobile ? handleTouchEnd : undefined}
      style={{ 
        borderWidth: '2px', 
        borderColor: 'hsl(var(--border))', // Initial border color
        cursor: isMobile ? 'grab' : 'default', // Indicate grabbable on mobile
        // Transition applied here will affect snap-back and status change border color change
        transition: currentStatus !== 'pending' && !isSwiping ? 'border-color 0.3s ease-out' : (isSwiping ? 'none' : 'transform 0.3s ease-out, border-color 0.3s ease-out'),
      }}
    >
      <CardHeader className="items-center text-center pointer-events-none"> {/* pointer-events-none on children for better swipe */}
        {student.photoUrl ? (
           <Image 
             src={student.photoUrl} 
             alt={student.name} 
             width={100} 
             height={100} 
             className="rounded-full border-4 border-primary object-cover"
             data-ai-hint="student portrait indian" // More specific hint
           />
        ) : (
          <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center border-4 border-primary" data-ai-hint="student avatar placeholder">
            <User className="w-12 h-12 text-muted-foreground" />
          </div>
        )}
        <CardTitle className="text-2xl mt-4">{student.name}</CardTitle>
        <p className="text-muted-foreground">Roll No: {student.rollNumber}</p>
      </CardHeader>
      <CardContent className="text-center min-h-[60px] pointer-events-none">
        {/* Feedback during swipe */}
        {isMobile && isSwiping && Math.abs(currentX) > SWIPE_THRESHOLD / 2 && (
          <p className={`font-semibold text-lg p-2 rounded-md ${currentX > 0 ? 'text-accent-foreground bg-accent' : 'text-destructive-foreground bg-destructive'}`}>
            {currentX > 0 ? 'Mark Present?' : 'Mark Absent?'}
          </p>
        )}
        {/* Feedback after marking or if status already set */}
        {!isSwiping && currentStatus && currentStatus !== 'pending' && (
          <p className={`font-semibold text-lg ${currentStatus === 'present' ? 'text-accent-foreground bg-accent' : 'text-destructive-foreground bg-destructive'} p-2 rounded-md inline-flex items-center`}>
            {currentStatus === 'present' ? <CheckCircle className="mr-2 h-5 w-5" /> : <XCircle className="mr-2 h-5 w-5" />}
            Marked: {currentStatus.toUpperCase()}
          </p>
        )}
        {/* Instructions for user */}
        {isMobile && !isSwiping && currentStatus === 'pending' && (
            <p className="text-muted-foreground italic flex items-center justify-center">
              <Hand className="mr-2 h-4 w-4" /> Swipe left (absent) or right (present)
            </p>
        )}
        {!isMobile && currentStatus === 'pending' && (
           <p className="text-muted-foreground italic flex items-center justify-center">
             <MousePointerClick className="mr-2 h-4 w-4" /> Use buttons below to mark attendance
           </p>
        )}
      </CardContent>
      {/* Buttons only shown on non-mobile devices */}
      {!isMobile && (
        <CardFooter className="flex justify-around pb-6">
          <Button variant="destructive" onClick={onMarkAbsent} className="w-2/5 text-base py-3">
            <XCircle className="mr-2 h-5 w-5" /> Absent
          </Button>
          <Button variant="default" onClick={onMarkPresent} className="w-2/5 text-base py-3 bg-accent hover:bg-accent/90 text-accent-foreground">
            <CheckCircle className="mr-2 h-5 w-5" /> Present
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
