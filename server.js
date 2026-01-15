const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Store active users
const users = new Map();

// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Handle all routes by serving index.html (for SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Handle socket connections
io.on('connection', (socket) => {
  console.log('New user connected:', socket.id);

  // Listen for new user joining
  socket.on('user-join', (username) => {
    // Check if username is taken
    const isTaken = Array.from(users.values()).includes(username);
    
    if (isTaken) {
      socket.emit('username-taken');
      return;
    }

    // Store user
    users.set(socket.id, username);
    
    // Notify the user who joined
    socket.emit('user-joined', username);
    
    // Notify all other users
    socket.broadcast.emit('user-connected', {
      username,
      timestamp: new Date().toLocaleTimeString()
    });

    // Send current users list to the new user
    socket.emit('users-list', Array.from(users.values()));
  });

  // Handle incoming messages
  socket.on('send-message', (data) => {
    const username = users.get(socket.id);
    const messageData = {
      username,
      message: data.message,
      timestamp: new Date().toLocaleTimeString()
    };
    
    // Broadcast message to all users
    io.emit('receive-message', messageData);
  });

  // Handle typing indicator
  socket.on('typing', (isTyping) => {
    const username = users.get(socket.id);
    if (username) {
      socket.broadcast.emit('user-typing', {
        username,
        isTyping
      });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    const username = users.get(socket.id);
    if (username) {
      users.delete(socket.id);
      
      // Notify all users
      io.emit('user-disconnected', {
        username,
        timestamp: new Date().toLocaleTimeString()
      });
      
      console.log('User disconnected:', username);
    }
  });
});

// Start server - IMPORTANT: Use 0.0.0.0 for Render
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
  console.log(`Public directory: ${path.join(__dirname, 'public')}`);
});
