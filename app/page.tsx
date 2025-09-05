'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

function generateRoomId() {
  return Math.random().toString(36).substring(2, 8);
}

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Generate a random room ID and redirect
    const roomId = generateRoomId();
    router.push(`/p/${roomId}`);
  }, [router]);

  return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center flex flex-col items-center">
          <span className="loader"></span>
          <p className="mt-4 text-gray-600">Creating a new Notepad...</p>
        </div>
      </div>
  );
}
