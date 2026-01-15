const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Store active users
const users = new Map();

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Basic route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check for Render
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Sanitize message function
function sanitizeMessage(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Handle socket connections
io.on('connection', (socket) => {
  console.log('New user connected:', socket.id);

  // Listen for new user joining
  socket.on('user-join', (username) => {
    // Sanitize username
    const sanitizedUsername = sanitizeMessage(username.substring(0, 20));
    
    // Check if username is taken
    const isTaken = Array.from(users.values()).includes(sanitizedUsername);
    
    if (isTaken) {
      socket.emit('username-taken');
      return;
    }

    // Store user
    users.set(socket.id, sanitizedUsername);
    
    // Notify the user who joined
    socket.emit('user-joined', sanitizedUsername);
    
    // Notify all other users
    socket.broadcast.emit('user-connected', {
      username: sanitizedUsername,
      timestamp: new Date().toLocaleTimeString(),
      date: new Date().toLocaleDateString()
    });

    // Send current users list to the new user
    socket.emit('users-list', Array.from(users.values()));
  });

  // Handle incoming messages
  socket.on('send-message', (data) => {
    const username = users.get(socket.id);
    if (!username) return;
    
    // Sanitize message and limit length
    const sanitizedMessage = sanitizeMessage(data.message.substring(0, 1000));
    
    const messageData = {
      username,
      message: sanitizedMessage,
      timestamp: new Date().toLocaleTimeString(),
      date: new Date().toLocaleDateString(),
      isSystem: false
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
        timestamp: new Date().toLocaleTimeString(),
        date: new Date().toLocaleDateString()
      });
      
      console.log('User disconnected:', username);
    }
  });
});

// Start server
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`✅ Server running on http://${HOST}:${PORT}`);
  console.log(`📁 Serving files from: ${path.join(__dirname, 'public')}`);
});
