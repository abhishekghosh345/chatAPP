const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Store active users and messages
const users = new Map(); // socket.id -> {username, userId, socketId, joinedAt}
const messages = []; // Array of all messages
const userSessions = new Map(); // username -> {socketId, lastActive}

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
    userCount: users.size,
    onlineUsers: Array.from(users.values()).map(u => u.username)
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

// Generate unique user ID
function generateUserId() {
  return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Handle socket connections
io.on('connection', (socket) => {
  console.log('New socket connection:', socket.id);
  
  // Send message history (last 100 messages)
  socket.emit('message-history', messages.slice(-100));

  // Listen for new user joining
  socket.on('user-join', (username) => {
    const sanitizedUsername = sanitizeMessage(username.substring(0, 20));
    
    // Check if username is already online
    const isAlreadyOnline = Array.from(users.values()).some(u => u.username === sanitizedUsername);
    
    if (isAlreadyOnline) {
      socket.emit('username-taken');
      return;
    }

    // Generate or retrieve user ID
    let userId = userSessions.get(sanitizedUsername)?.userId || generateUserId();
    
    // Store user info
    const userInfo = {
      username: sanitizedUsername,
      userId: userId,
      socketId: socket.id,
      joinedAt: Date.now(),
      lastActive: Date.now()
    };
    
    users.set(socket.id, userInfo);
    userSessions.set(sanitizedUsername, { userId, socketId: socket.id, lastActive: Date.now() });
    
    console.log(`User joined: ${sanitizedUsername} (${socket.id})`);
    
    // Notify the user who joined
    socket.emit('user-joined', {
      username: sanitizedUsername,
      userId: userId,
      messageCount: messages.length,
      onlineCount: users.size
    });
    
    // Notify all other users
    socket.broadcast.emit('user-connected', {
      username: sanitizedUsername,
      userId: userId,
      timestamp: Date.now(),
      userCount: users.size
    });

    // Send current users list to ALL users (including the new one)
    const userList = Array.from(users.values()).map(u => ({
      username: u.username,
      userId: u.userId,
      joinedAt: u.joinedAt
    }));
    
    io.emit('users-list', userList);
    
    // Send welcome message
    const welcomeMessage = {
      id: Date.now() + '_welcome',
      username: 'System',
      message: `${sanitizedUsername} has joined the chat!`,
      timestamp: Date.now(),
      type: 'system'
    };
    
    messages.push(welcomeMessage);
    io.emit('receive-message', welcomeMessage);
  });

  // Handle reconnection with user ID
  socket.on('user-reconnect', (data) => {
    const { username, userId } = data;
    
    // Check if user exists in sessions
    const session = userSessions.get(username);
    if (session && session.userId === userId) {
      // Update socket ID
      session.socketId = socket.id;
      session.lastActive = Date.now();
      
      // Update users map
      const userInfo = {
        username: username,
        userId: userId,
        socketId: socket.id,
        joinedAt: Date.now(),
        lastActive: Date.now()
      };
      
      users.set(socket.id, userInfo);
      
      // Send reconnection success
      socket.emit('reconnect-success', {
        username: username,
        userId: userId,
        messageCount: messages.length,
        onlineCount: users.size
      });
      
      // Update user list for everyone
      const userList = Array.from(users.values()).map(u => ({
        username: u.username,
        userId: u.userId,
        joinedAt: u.joinedAt
      }));
      
      io.emit('users-list', userList);
      
      console.log(`User reconnected: ${username} (${socket.id})`);
    }
  });

  // Handle incoming messages
  socket.on('send-message', (data) => {
    const user = users.get(socket.id);
    if (!user) {
      socket.emit('error', { message: 'Not authenticated' });
      return;
    }
    
    const messageData = {
      id: Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      username: user.username,
      userId: user.userId,
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
    
    // Keep only last 500 messages to prevent memory issues
    if (messages.length > 500) {
      messages.shift();
    }
    
    // Broadcast message to all users
    io.emit('receive-message', messageData);
    console.log(`Message from ${user.username}: ${messageData.message.substring(0, 50)}...`);
  });

  // Handle typing indicator
  socket.on('typing', (isTyping) => {
    const user = users.get(socket.id);
    if (user) {
      socket.broadcast.emit('user-typing', {
        username: user.username,
        userId: user.userId,
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
      username: user.username,
      userId: user.userId
    });
  });

  // Handle message deletion
  socket.on('delete-message', (data) => {
    const user = users.get(socket.id);
    if (!user) return;
    
    // Find the message
    const messageIndex = messages.findIndex(msg => msg.id === data.messageId);
    if (messageIndex !== -1) {
      // Check if user owns the message (by userId)
      if (messages[messageIndex].userId === user.userId) {
        // Remove from array
        const deletedMessage = messages.splice(messageIndex, 1)[0];
        
        // Notify all clients
        io.emit('message-deleted', {
          messageId: data.messageId,
          deletedBy: user.username
        });
        
        // Send deletion notification
        const deletionMessage = {
          id: Date.now() + '_deletion',
          username: 'System',
          message: `${user.username} deleted a message`,
          timestamp: Date.now(),
          type: 'system'
        };
        
        messages.push(deletionMessage);
        io.emit('receive-message', deletionMessage);
        
        console.log(`Message ${data.messageId} deleted by ${user.username}`);
      }
    }
  });

  // Handle user activity
  socket.on('user-active', () => {
    const user = users.get(socket.id);
    if (user) {
      user.lastActive = Date.now();
      userSessions.get(user.username).lastActive = Date.now();
    }
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    const user = users.get(socket.id);
    if (user) {
      users.delete(socket.id);
      
      // Update last active time but keep in sessions for reconnection
      const session = userSessions.get(user.username);
      if (session) {
        session.lastActive = Date.now();
        session.socketId = null; // Clear socket ID but keep user data
      }
      
      // Notify all users
      io.emit('user-disconnected', {
        username: user.username,
        userId: user.userId,
        timestamp: Date.now(),
        userCount: users.size
      });
      
      // Update user list
      const userList = Array.from(users.values()).map(u => ({
        username: u.username,
        userId: u.userId,
        joinedAt: u.joinedAt
      }));
      
      io.emit('users-list', userList);
      
      console.log(`User disconnected: ${user.username} (${socket.id}), Reason: ${reason}`);
      
      // Remove from sessions if inactive for too long (30 minutes)
      setTimeout(() => {
        const oldSession = userSessions.get(user.username);
        if (oldSession && Date.now() - oldSession.lastActive > 30 * 60 * 1000) {
          userSessions.delete(user.username);
          console.log(`Removed inactive session for ${user.username}`);
        }
      }, 30 * 60 * 1000);
    }
  });

  // Periodic cleanup of old messages
  setInterval(() => {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    const oldCount = messages.length;
    
    // Keep messages from last 24 hours only
    const recentMessages = messages.filter(msg => 
      msg.type === 'system' || (Date.now() - msg.timestamp < 24 * 60 * 60 * 1000)
    );
    
    if (recentMessages.length < messages.length) {
      messages.length = 0;
      messages.push(...recentMessages);
      console.log(`Cleaned up ${oldCount - messages.length} old messages`);
    }
  }, 30 * 60 * 1000); // Run every 30 minutes
});

// Start server
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`✅ Server running on http://${HOST}:${PORT}`);
  console.log(`📁 Serving files from: ${path.join(__dirname, 'public')}`);
  console.log(`🚀 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`💾 Memory: Users: ${users.size}, Messages: ${messages.length}, Sessions: ${userSessions.size}`);
});
