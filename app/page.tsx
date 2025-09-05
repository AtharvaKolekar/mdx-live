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
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">MDX Live Editor</h1>
        <p className="text-gray-600">Redirecting to a new room...</p>
      </div>
    </div>
  );
}
