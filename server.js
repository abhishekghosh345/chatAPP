const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Store active users and messages
const users = new Map();
const messages = [];

// Increase payload limit for images
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Basic route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check for Render
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    messageCount: messages.length,
    userCount: users.size
  });
});

// Sanitize message function
function sanitizeMessage(text) {
  if (!text) return '';
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

  // Send message history (last 50 messages)
  socket.emit('message-history', messages.slice(-50));

  // Listen for new user joining
  socket.on('user-join', (username) => {
    const sanitizedUsername = sanitizeMessage(username.substring(0, 20));
    
    // Check if username is taken
    const isTaken = Array.from(users.values()).some(u => u.username === sanitizedUsername);
    
    if (isTaken) {
      socket.emit('username-taken');
      return;
    }

    // Store user with additional info
    users.set(socket.id, {
      username: sanitizedUsername,
      joinTime: Date.now(),
      socketId: socket.id
    });
    
    // Notify the user who joined
    socket.emit('user-joined', sanitizedUsername);
    
    // Notify all other users
    socket.broadcast.emit('user-connected', {
      username: sanitizedUsername,
      timestamp: Date.now(),
      userCount: users.size
    });

    // Send current users list to the new user
    const userList = Array.from(users.values()).map(u => u.username);
    socket.emit('users-list', userList);
  });

  // Handle incoming messages
  socket.on('send-message', (data) => {
    const user = users.get(socket.id);
    if (!user) return;
    
    const messageData = {
      id: Date.now() + Math.random().toString(36).substr(2, 9),
      username: user.username,
      message: data.message,
      timestamp: Date.now(),
      type: data.type || 'text',
      replyTo: data.replyTo || null,
      imageData: data.imageData || null,
      imageName: data.imageName || null
    };

    // Sanitize text messages
    if (messageData.type === 'text') {
      messageData.message = sanitizeMessage(messageData.message.substring(0, 2000));
    }

    // Store message
    messages.push(messageData);
    if (messages.length > 200) messages.shift(); // Keep only last 200 messages
    
    // Broadcast message to all users
    io.emit('receive-message', messageData);
  });

  // Handle typing indicator
  socket.on('typing', (isTyping) => {
    const user = users.get(socket.id);
    if (user) {
      socket.broadcast.emit('user-typing', {
        username: user.username,
        isTyping
      });
    }
  });

  // Handle message reactions
  socket.on('message-reaction', (data) => {
    const user = users.get(socket.id);
    if (!user) return;
    
    io.emit('update-reaction', {
      messageId: data.messageId,
      reaction: data.reaction,
      username: user.username
    });
  });

  // Handle message deletion
  socket.on('delete-message', (data) => {
    const user = users.get(socket.id);
    if (!user) return;
    
    // Find the message
    const messageIndex = messages.findIndex(msg => msg.id === data.messageId);
    if (messageIndex !== -1) {
      // Check if user owns the message
      if (messages[messageIndex].username === user.username) {
        // Remove from array
        messages.splice(messageIndex, 1);
        
        // Notify all clients
        io.emit('message-deleted', {
          messageId: data.messageId
        });
        
        console.log(`Message ${data.messageId} deleted by ${user.username}`);
      }
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    if (user) {
      users.delete(socket.id);
      
      // Notify all users
      io.emit('user-disconnected', {
        username: user.username,
        timestamp: Date.now(),
        userCount: users.size
      });
      
      console.log('User disconnected:', user.username);
    }
  });
});

// Start server
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`✅ Server running on http://${HOST}:${PORT}`);
  console.log(`📁 Serving files from: ${path.join(__dirname, 'public')}`);
  console.log(`🚀 Environment: ${process.env.NODE_ENV || 'development'}`);
});
