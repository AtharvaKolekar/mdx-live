const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  const io = new Server(server, {
    cors: {
      origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:3000'],
      methods: ['GET', 'POST']
    }
  });

  // Store room data in memory for real-time collaboration
  const rooms = new Map();

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join-room', (roomId) => {
      socket.join(roomId);
      console.log(`User ${socket.id} joined room ${roomId}`);
      
      // Send current room data to newly joined user
      if (rooms.has(roomId)) {
        socket.emit('room-data', rooms.get(roomId));
      }
    });

    socket.on('content-change', (data) => {
      const { roomId, content } = data;
      
      // Update room data in memory
      const roomData = rooms.get(roomId) || {};
      roomData.content = content;
      rooms.set(roomId, roomData);
      
      // Broadcast to all users in the room except sender
      socket.to(roomId).emit('content-changed', { content });
    });

    socket.on('title-change', (data) => {
      const { roomId, title } = data;
      
      // Update room data in memory
      const roomData = rooms.get(roomId) || {};
      roomData.title = title;
      rooms.set(roomId, roomData);
      
      // Broadcast to all users in the room except sender
      socket.to(roomId).emit('title-changed', { title });
    });

    socket.on('leave-room', (roomId) => {
      socket.leave(roomId);
      console.log(`User ${socket.id} left room ${roomId}`);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  server
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});