const { Server } = require('socket.io');
const { createServer } = require('http');

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "*", // In production, replace with your actual frontend domain
    methods: ["GET", "POST"]
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// Store active rooms and their users
const rooms = new Map();

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Handle room joining with user data
  socket.on('join-room', ({ room, name }) => {
    // Leave any previous rooms
    if (socket.data.currentRoom) {
      socket.leave(socket.data.currentRoom);
      const prevRoom = rooms.get(socket.data.currentRoom);
      if (prevRoom) {
        prevRoom.delete(socket.id);
        if (prevRoom.size === 0) {
          rooms.delete(socket.data.currentRoom);
        } else {
          io.to(socket.data.currentRoom).emit('roomUsers', Array.from(prevRoom.values()));
        }
      }
    }

    // Join new room
    socket.join(room);
    socket.data.currentRoom = room;
    socket.data.name = name;
    socket.data.color = `#${Math.floor(Math.random()*16777215).toString(16)}`; // Random color

    // Update room users
    if (!rooms.has(room)) {
      rooms.set(room, new Map());
    }
    rooms.get(room).set(socket.id, {
      id: socket.id,
      name: name,
      color: socket.data.color
    });

    // Notify room of new user
    io.to(room).emit('userJoined', {
      id: socket.id,
      name: name,
      color: socket.data.color
    });

    // Send current room users to the new user
    socket.emit('roomUsers', Array.from(rooms.get(room).values()));
    
    console.log(`Client ${socket.id} (${name}) joined room ${room}`);
  });

  // Handle text changes
  socket.on('text-change', (data) => {
    if (socket.data.currentRoom === data.roomId) {
      socket.to(data.roomId).emit('text-change', {
        ...data,
        userId: socket.id,
        userName: socket.data.name
      });
    }
  });

  // Handle cursor movement
  socket.on('cursor-move', (data) => {
    if (socket.data.currentRoom) {
      socket.to(socket.data.currentRoom).emit('cursor-move', {
        ...data,
        userId: socket.id,
        userName: socket.data.name,
        color: socket.data.color
      });
    }
  });

  // Handle room locking
  socket.on('room-lock', ({ roomId, isLocked }) => {
    if (socket.data.currentRoom === roomId) {
      io.to(roomId).emit('room-lock', { isLocked });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    const room = socket.data.currentRoom;
    if (room) {
      const roomUsers = rooms.get(room);
      if (roomUsers) {
        roomUsers.delete(socket.id);
        if (roomUsers.size === 0) {
          rooms.delete(room);
        } else {
          io.to(room).emit('userLeft', socket.id);
          io.to(room).emit('roomUsers', Array.from(roomUsers.values()));
        }
      }
    }
    console.log('Client disconnected:', socket.id);
  });

  // Handle reconnection
  socket.on('reconnect', () => {
    console.log('Client reconnected:', socket.id);
    if (socket.data.currentRoom) {
      socket.join(socket.data.currentRoom);
      const roomUsers = rooms.get(socket.data.currentRoom);
      if (roomUsers) {
        roomUsers.set(socket.id, {
          id: socket.id,
          name: socket.data.name,
          color: socket.data.color
        });
        io.to(socket.data.currentRoom).emit('roomUsers', Array.from(roomUsers.values()));
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
}); 