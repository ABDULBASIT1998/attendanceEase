
"use client";

import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import type { Student, AttendanceStatus } from '@/types';
import { User, CheckCircle, XCircle, Hand, MousePointerClick } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile'; // Ensure this hook is available

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
    // Reset card style if student changes (e.g., after marking one and moving to next)
    // or if currentStatus changes (though this is less likely to trigger a visual reset here)
    if (cardRef.current) {
      cardRef.current.style.transition = 'transform 0.3s ease-out, border-color 0.3s ease-out';
      cardRef.current.style.transform = 'translateX(0px) rotate(0deg)';
      cardRef.current.style.borderColor = 'hsl(var(--border))';
    }
  }, [student, currentStatus]);


  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isMobile || !cardRef.current) return;
    cardRef.current.style.transition = 'none';
    setTouchStartX(e.touches[0].clientX);
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isMobile || touchStartX === null || !isSwiping || !cardRef.current) return;
    
    const deltaX = e.touches[0].clientX - touchStartX;
    setCurrentX(deltaX); 

    cardRef.current.style.transform = `translateX(${deltaX}px) rotate(${deltaX / 20}deg)`;
    
    if (deltaX > SWIPE_THRESHOLD / 2) {
      cardRef.current.style.borderColor = 'hsl(var(--accent))';
    } else if (deltaX < -SWIPE_THRESHOLD / 2) {
      cardRef.current.style.borderColor = 'hsl(var(--destructive))';
    } else {
      cardRef.current.style.borderColor = 'hsl(var(--border))';
    }
  };

  const handleTouchEnd = () => {
    if (!isMobile || touchStartX === null || !isSwiping) return;

    const swipedFarEnough = Math.abs(currentX) > SWIPE_THRESHOLD;

    if (swipedFarEnough) {
      if (currentX > SWIPE_THRESHOLD) {
        onMarkPresent();
      } else if (currentX < -SWIPE_THRESHOLD) {
        onMarkAbsent();
      }
    }
    
    setIsSwiping(false); 

    if (cardRef.current) {
      cardRef.current.style.transition = 'transform 0.3s ease-out, border-color 0.3s ease-out';
      cardRef.current.style.transform = 'translateX(0px) rotate(0deg)';
      cardRef.current.style.borderColor = 'hsl(var(--border))';
    }

    setTouchStartX(null);
    setCurrentX(0);
  };

  return (
    <Card 
      ref={cardRef}
      className="w-full max-w-md shadow-xl select-none touch-pan-y"
      onTouchStart={isMobile ? handleTouchStart : undefined}
      onTouchMove={isMobile ? handleTouchMove : undefined}
      onTouchEnd={isMobile ? handleTouchEnd : undefined}
      style={{ 
        borderWidth: '2px', 
        borderColor: 'hsl(var(--border))',
        cursor: isMobile ? 'grab' : 'default',
        transition: currentStatus !== 'pending' && !isSwiping ? 'border-color 0.3s ease-out' : (isSwiping ? 'none' : 'transform 0.3s ease-out, border-color 0.3s ease-out'),
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
        {isMobile && isSwiping && Math.abs(currentX) > SWIPE_THRESHOLD / 2 && (
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
        {isMobile && !isSwiping && currentStatus === 'pending' && (
            <p className="text-muted-foreground italic flex items-center justify-center">
              <Hand className="mr-2 h-4 w-4" /> Swipe left for absent, right for present
            </p>
        )}
        {!isMobile && currentStatus === 'pending' && (
           <p className="text-muted-foreground italic flex items-center justify-center">
             <MousePointerClick className="mr-2 h-4 w-4" /> Use buttons below to mark attendance
           </p>
        )}
      </CardContent>
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
