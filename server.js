const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Store active users and messages
const users = new Map(); // socket.id -> {username, userId, socketId}
const messages = []; // Array of all messages
const messageReactions = new Map(); // messageId -> {reaction: [usernames]}

// Increase payload limit for images
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Basic route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check
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

// Generate unique message ID
function generateMessageId() {
  return 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Handle socket connections
io.on('connection', (socket) => {
  console.log('New connection:', socket.id);

  // Send message history and reactions
  const historyWithReactions = messages.map(msg => ({
    ...msg,
    reactions: messageReactions.get(msg.id) || {}
  }));
  socket.emit('message-history', historyWithReactions.slice(-100));

  // Listen for new user joining
  socket.on('user-join', (username) => {
    const sanitizedUsername = sanitizeMessage(username.substring(0, 20));
    
    // Check if username is already online
    const isAlreadyOnline = Array.from(users.values()).some(u => u.username === sanitizedUsername);
    
    if (isAlreadyOnline) {
      socket.emit('username-taken');
      return;
    }

    // Generate user ID
    const userId = generateUserId();
    
    // Store user info
    const userInfo = {
      username: sanitizedUsername,
      userId: userId,
      socketId: socket.id,
      joinedAt: Date.now()
    };
    
    users.set(socket.id, userInfo);
    
    console.log(`User joined: ${sanitizedUsername} (${userId})`);
    
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

    // Send current users list to ALL users
    const userList = Array.from(users.values()).map(u => ({
      username: u.username,
      userId: u.userId,
      joinedAt: u.joinedAt
    }));
    
    io.emit('users-list', userList);
    
    // Send welcome message
    const welcomeMessage = {
      id: generateMessageId(),
      username: 'System',
      message: `${sanitizedUsername} has joined the chat!`,
      timestamp: Date.now(),
      type: 'system'
    };
    
    messages.push(welcomeMessage);
    io.emit('receive-message', welcomeMessage);
  });

  // Handle incoming messages
  socket.on('send-message', (data) => {
    const user = users.get(socket.id);
    if (!user) {
      socket.emit('error', { message: 'Not authenticated' });
      return;
    }
    
    const messageData = {
      id: generateMessageId(),
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
    
    // Keep only last 500 messages
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
    
    const { messageId, reaction } = data;
    
    // Initialize reactions for this message if not exists
    if (!messageReactions.has(messageId)) {
      messageReactions.set(messageId, {});
    }
    
    const reactions = messageReactions.get(messageId);
    
    // Initialize this reaction if not exists
    if (!reactions[reaction]) {
      reactions[reaction] = [];
    }
    
    // Add user to reaction if not already there
    if (!reactions[reaction].includes(user.username)) {
      reactions[reaction].push(user.username);
    } else {
      // Remove user if already reacted (toggle)
      reactions[reaction] = reactions[reaction].filter(u => u !== user.username);
      // Remove reaction if empty
      if (reactions[reaction].length === 0) {
        delete reactions[reaction];
      }
    }
    
    // Update reactions
    messageReactions.set(messageId, reactions);
    
    // Broadcast updated reaction
    io.emit('update-reaction', {
      messageId: messageId,
      reaction: reaction,
      username: user.username,
      userId: user.userId,
      reactions: reactions
    });
    
    console.log(`Reaction ${reaction} on message ${messageId} by ${user.username}`);
  });

  // Handle message deletion
  socket.on('delete-message', (data) => {
    const user = users.get(socket.id);
    if (!user) return;
    
    const { messageId } = data;
    
    // Find the message
    const messageIndex = messages.findIndex(msg => msg.id === messageId);
    if (messageIndex !== -1) {
      // Check if user owns the message
      if (messages[messageIndex].userId === user.userId) {
        // Remove from array
        const deletedMessage = messages.splice(messageIndex, 1)[0];
        
        // Remove reactions for this message
        messageReactions.delete(messageId);
        
        // Notify all clients
        io.emit('message-deleted', {
          messageId: messageId,
          deletedBy: user.username
        });
        
        // Send deletion notification
        const deletionMessage = {
          id: generateMessageId(),
          username: 'System',
          message: `${user.username} deleted a message`,
          timestamp: Date.now(),
          type: 'system'
        };
        
        messages.push(deletionMessage);
        io.emit('receive-message', deletionMessage);
        
        console.log(`Message ${messageId} deleted by ${user.username}`);
      } else {
        console.log(`User ${user.username} tried to delete message they don't own`);
      }
    } else {
      console.log(`Message ${messageId} not found for deletion`);
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
      
      console.log(`User disconnected: ${user.username} (${user.userId})`);
    }
  });
});

// Start server
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`✅ Server running on http://${HOST}:${PORT}`);
  console.log(`📁 Serving files from: ${path.join(__dirname, 'public')}`);
  console.log(`💾 Memory: Users: ${users.size}, Messages: ${messages.length}`);
});
