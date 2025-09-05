'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { useDebouncedCallback } from 'use-debounce';
import { MDXEditorComponent } from '@/components/MDXEditorComponent';

interface Room {
  id: string;
  name: string;
  title: string;
  content: string;
  updatedAt: string;
}

export default function RoomPage() {
  const params = useParams();
  const roomId = params.roomId as string;
  const [room, setRoom] = useState<Room | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    // Initialize Socket.IO connection
    const socketInstance = io();
    setSocket(socketInstance);

    // Join the room
    socketInstance.emit('join-room', roomId);

    // Listen for real-time updates
    socketInstance.on('room-data', (data) => {
      setTitle(data.title || '');
      setContent(data.content || '');
    });

    socketInstance.on('content-changed', (data) => {
      setContent(data.content);
    });

    socketInstance.on('title-changed', (data) => {
      setTitle(data.title);
    });

    // Fetch initial room data
    fetchRoom();

    return () => {
      socketInstance.emit('leave-room', roomId);
      socketInstance.disconnect();
    };
  }, [roomId]);

  const fetchRoom = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/rooms/${roomId}`);
      if (response.ok) {
        const roomData = await response.json();
        setRoom(roomData);
        setTitle(roomData.title || '');
        setContent(roomData.content || '');
      } else {
        toast.error('Failed to load room');
      }
    } catch (error) {
      console.error('Error fetching room:', error);
      toast.error('Error loading room');
    } finally {
      setIsLoading(false);
    }
  };

  const saveToDatabase = async (newTitle?: string, newContent?: string) => {
    try {
      const response = await fetch(`/api/rooms/${roomId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newTitle !== undefined ? newTitle : title,
          content: newContent !== undefined ? newContent : content,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save');
      }
    } catch (error) {
      console.error('Error saving to database:', error);
      toast.error('Failed to save changes');
    }
  };

  // Debounced save functions
  const debouncedSaveTitle = useDebouncedCallback(
    (newTitle: string) => {
      saveToDatabase(newTitle);
    },
    1000
  );

  const debouncedSaveContent = useDebouncedCallback(
    (newContent: string) => {
      saveToDatabase(undefined, newContent);
    },
    1000
  );

  // Debounced real-time updates (shorter delay for better UX)
  const debouncedTitleBroadcast = useDebouncedCallback(
    (newTitle: string) => {
      if (socket) {
        socket.emit('title-change', { roomId, title: newTitle });
      }
    },
    300
  );

  const debouncedContentBroadcast = useDebouncedCallback(
    (newContent: string) => {
      if (socket) {
        socket.emit('content-change', { roomId, content: newContent });
      }
    },
    300
  );

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    debouncedTitleBroadcast(newTitle);
    debouncedSaveTitle(newTitle);
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    debouncedContentBroadcast(newContent);
    debouncedSaveContent(newContent);
  };

  const handleCopyContent = async () => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success('Editor content copied to clipboard!');
    } catch (error) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = content;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        toast.success('Editor content copied to clipboard!');
      } catch (err) {
        toast.error('Failed to copy content to clipboard');
      }
      document.body.removeChild(textArea);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title || 'MDX Live Editor',
          text: 'Check out this collaborative document!',
          url: window.location.href,
        });
        toast.success('Shared successfully!');
      } catch (error) {
        // User cancelled or share failed - only show error if it's not user cancellation
        if (error instanceof Error && error.name !== 'AbortError') {
          toast.error('Failed to share');
        }
      }
    } else {
      // Fallback - copy URL to clipboard instead
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Share URL copied to clipboard!');
      } catch (error) {
        toast.error('Share not supported on this browser');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading room...</h1>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-3 sm:px-4 lg:px-6 py-3 flex items-center justify-between min-h-[60px] flex-shrink-0">
        <div className="flex items-center flex-1 min-w-0">
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="text-lg sm:text-xl font-semibold bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-2 py-1 flex-1 min-w-0 truncate"
            placeholder="Untitled Document"
          />
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
          <button
            onClick={handleCopyContent}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            title="Copy editor content"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            onClick={handleShare}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center space-x-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
            <span className="hidden sm:inline">Share</span>
          </button>
        </div>
      </header>

      {/* MDX Editor */}
      <div className="flex-1 overflow-hidden">
        <MDXEditorComponent
          content={content}
          onChange={handleContentChange}
        />
      </div>
    </div>
  );
}
