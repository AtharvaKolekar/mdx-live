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

  // Add fetchRoom as a useCallback to avoid dependency issues
  const fetchRoom = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/rooms/${roomId}`);
      if (response.ok) {
        const roomData = await response.json();
        setRoom(roomData);
        
        // Ensure title is properly loaded, even if it's an empty string
        const roomTitle = roomData.title !== undefined ? roomData.title : '';
        const roomContent = roomData.content || '';
        
        setTitle(roomTitle);
        setContent(roomContent);
        
        console.log('Room loaded - Title:', `"${roomTitle}"`, 'Content length:', roomContent.length);
      } else {
        toast.error('Failed to load room');
      }
    } catch (error) {
      console.error('Error fetching room:', error);
      toast.error('Error loading room');
    } finally {
      setIsLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    // Initialize Socket.IO connection
    const socketInstance = io();
    setSocket(socketInstance);

    // Join the room
    socketInstance.emit('join-room', roomId);

    // Listen for real-time updates from other users (not initial room data)
    socketInstance.on('content-changed', (data) => {
      console.log('Received content-changed:', data);
      setContent(data.content);
    });

    socketInstance.on('title-changed', (data) => {
      console.log('Received title-changed:', data);
      // Ensure proper title handling even for empty strings
      setTitle(data.title !== undefined ? data.title : '');
    });

    // Fetch initial room data from database (this should take priority)
    fetchRoom();

    return () => {
      socketInstance.emit('leave-room', roomId);
      socketInstance.disconnect();
    };
  }, [roomId, fetchRoom]);

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
  function escapeControlCharacters(str: string) {
  return str
    .replace(/\n/g, '\\n')  // Replace all newline characters with '\n'
    .replace(/\r/g, '\\r')  // Replace all carriage return characters with '\r'
    .replace(/\t/g, '\\t')  // Replace all tab characters with '\t'
    .replace(/\f/g, '\\f')  // Replace all form feed characters with '\f')
    .replace(/\v/g, '\\v');  // Replace all vertical tab characters with '\v')
}

  const handleCopyContent = async () => {
    try {
      // Clean the content by removing backslashes, fixing newlines, and decoding HTML entities
      let cleanedContent = content
        .replace(/\\/g, '')     // Remove all backslashes
        .replace(/\n\n/g, '\n') // Replace double newlines with single newlines
        // Decode HTML entities
        .replace(/&#x20;/g, ' ')   // Space
        .replace(/&#x21;/g, '!')   // Exclamation mark
        .replace(/&#x22;/g, '"')   // Quotation mark
        .replace(/&#x23;/g, '#')   // Hash
        .replace(/&#x24;/g, '$')   // Dollar sign
        .replace(/&#x25;/g, '%')   // Percent
        .replace(/&#x26;/g, '&')   // Ampersand
        .replace(/&#x27;/g, "'")   // Apostrophe
        .replace(/&#x28;/g, '(')   // Left parenthesis
        .replace(/&#x29;/g, ')')   // Right parenthesis
        .replace(/&#x2A;/g, '*')   // Asterisk
        .replace(/&#x2B;/g, '+')   // Plus sign
        .replace(/&#x2C;/g, ',')   // Comma
        .replace(/&#x2D;/g, '-')   // Hyphen-minus
        .replace(/&#x2E;/g, '.')   // Full stop
        .replace(/&#x2F;/g, '/')   // Solidus
        .replace(/&#x3A;/g, ':')   // Colon
        .replace(/&#x3B;/g, ';')   // Semicolon
        .replace(/&#x3C;/g, '<')   // Less-than sign
        .replace(/&#x3D;/g, '=')   // Equals sign
        .replace(/&#x3E;/g, '>')   // Greater-than sign
        .replace(/&#x3F;/g, '?')   // Question mark
        .replace(/&#x40;/g, '@')   // Commercial at
        .replace(/&#x5B;/g, '[')   // Left square bracket
        .replace(/&#x5C;/g, '\\')  // Reverse solidus
        .replace(/&#x5D;/g, ']')   // Right square bracket
        .replace(/&#x5E;/g, '^')   // Circumflex accent
        .replace(/&#x5F;/g, '_')   // Low line
        .replace(/&#x60;/g, '`')   // Grave accent
        .replace(/&#x7B;/g, '{')   // Left curly bracket
        .replace(/&#x7C;/g, '|')   // Vertical line
        .replace(/&#x7D;/g, '}')   // Right curly bracket
        .replace(/&#x7E;/g, '~')   // Tilde
        // Common named entities
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&nbsp;/g, ' ')
        // Generic decoder for any remaining numeric entities
        .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(parseInt(dec, 10)))
        .replace(/&#x([0-9A-Fa-f]+);/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)));
      
      console.log(cleanedContent);
     
      await navigator.clipboard.writeText(cleanedContent);
      toast.success('Editor content copied to clipboard!');
    } catch (error) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      // Apply the same cleaning to fallback content
      let cleanedContent = content
        .replace(/\\/g, '')     // Remove all backslashes
        .replace(/\n\n/g, '\n') // Replace double newlines with single newlines
        // Decode HTML entities (same as above)
        .replace(/&#x20;/g, ' ')
        .replace(/&#x21;/g, '!')
        .replace(/&#x22;/g, '"')
        .replace(/&#x23;/g, '#')
        .replace(/&#x24;/g, '$')
        .replace(/&#x25;/g, '%')
        .replace(/&#x26;/g, '&')
        .replace(/&#x27;/g, "'")
        .replace(/&#x28;/g, '(')
        .replace(/&#x29;/g, ')')
        .replace(/&#x2A;/g, '*')
        .replace(/&#x2B;/g, '+')
        .replace(/&#x2C;/g, ',')
        .replace(/&#x2D;/g, '-')
        .replace(/&#x2E;/g, '.')
        .replace(/&#x2F;/g, '/')
        .replace(/&#x3A;/g, ':')
        .replace(/&#x3B;/g, ';')
        .replace(/&#x3C;/g, '<')
        .replace(/&#x3D;/g, '=')
        .replace(/&#x3E;/g, '>')
        .replace(/&#x3F;/g, '?')
        .replace(/&#x40;/g, '@')
        .replace(/&#x5B;/g, '[')
        .replace(/&#x5C;/g, '\\')
        .replace(/&#x5D;/g, ']')
        .replace(/&#x5E;/g, '^')
        .replace(/&#x5F;/g, '_')
        .replace(/&#x60;/g, '`')
        .replace(/&#x7B;/g, '{')
        .replace(/&#x7C;/g, '|')
        .replace(/&#x7D;/g, '}')
        .replace(/&#x7E;/g, '~')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(parseInt(dec, 10)))
        .replace(/&#x([0-9A-Fa-f]+);/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)));
      
      textArea.value = cleanedContent;
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
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center flex flex-col items-center">
          <span className="loader"></span>
          <p className="mt-4 text-gray-600">Opening your Notepad...</p>
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
            style={{ minWidth: '200px' }}
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
