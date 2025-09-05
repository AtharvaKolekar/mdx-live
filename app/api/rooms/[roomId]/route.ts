import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    
    let room = await prisma.room.findUnique({
      where: { name: roomId },
    });

    // Create room if it doesn't exist
    if (!room) {
      room = await prisma.room.create({
        data: {
          name: roomId,
          title: '',
          content: '# Welcome to the collaborative MDX editor!\n\nStart typing to create content...',
        },
      });
    }

    return NextResponse.json(room);
  } catch (error) {
    console.error('Error fetching room:', error);
    return NextResponse.json(
      { error: 'Failed to fetch room' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const body = await request.json();
    const { title, content } = body;

    const room = await prisma.room.upsert({
      where: { name: roomId },
      update: {
        title: title !== undefined ? title : undefined,
        content: content !== undefined ? content : undefined,
      },
      create: {
        name: roomId,
        title: title || '',
        content: content || '# Welcome to the collaborative MDX editor!\n\nStart typing to create content...',
      },
    });

    return NextResponse.json(room);
  } catch (error) {
    console.error('Error updating room:', error);
    return NextResponse.json(
      { error: 'Failed to update room' },
      { status: 500 }
    );
  }
}
