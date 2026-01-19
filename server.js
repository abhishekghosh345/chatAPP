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
const chatrooms = new Map(); // roomId -> {name, members: [userIds], messages: []}

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

  // Send current rooms list
  const roomsList = Array.from(chatrooms.values()).map(r => ({
    id: r.id,
    name: r.name,
    members: r.members,
    messages: r.messages.slice(-10) // Send last 10 messages
  }));
  socket.emit('rooms-list', roomsList);

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
      imageName: data.imageName || null,
      recipient: data.recipient || null,
      isPrivate: !!data.recipient
    };

    // Sanitize text messages
    if (messageData.type === 'text') {
      messageData.message = sanitizeMessage(messageData.message.substring(0, 2000));
    }

    if (data.recipient) {
      // Private message
      const recipientSocket = Array.from(users.entries()).find(([id, u]) => u.userId === data.recipient)?.[0];
      if (recipientSocket) {
        // Send to recipient
        io.to(recipientSocket).emit('receive-message', messageData);
        // Send to sender
        socket.emit('receive-message', messageData);
        console.log(`Private message from ${user.username} to ${data.recipient}: ${messageData.message.substring(0, 50)}...`);
      } else {
        socket.emit('error', { message: 'Recipient not found' });
      }
    } else {
      // Room message
      // Store message
      messages.push(messageData);

      // Keep only last 500 messages
      if (messages.length > 500) {
        messages.shift();
      }

      // Broadcast message to all users
      io.emit('receive-message', messageData);
      console.log(`Room message from ${user.username}: ${messageData.message.substring(0, 50)}...`);
    }
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

  // Handle room history request
  socket.on('request-room-history', () => {
    const historyWithReactions = messages.map(msg => ({
      ...msg,
      reactions: messageReactions.get(msg.id) || {}
    }));
    socket.emit('message-history', historyWithReactions.slice(-100));
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

  // Handle room creation
  socket.on('create-room', (data) => {
    const user = users.get(socket.id);
    if (!user) return;

    const { name, members } = data;

    // Validate room name
    if (!name || name.trim().length === 0 || name.length > 50) {
      socket.emit('error', { message: 'Invalid room name' });
      return;
    }

    // Validate members
    if (!members || members.length < 2) {
      socket.emit('error', { message: 'Room must have at least 2 members' });
      return;
    }

    // Check if all members exist
    const validMembers = members.filter(memberId =>
      Array.from(users.values()).some(u => u.userId === memberId)
    );

    if (validMembers.length !== members.length) {
      socket.emit('error', { message: 'Some members not found' });
      return;
    }

    // Generate room ID
    const roomId = 'room_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    // Create room
    const room = {
      id: roomId,
      name: sanitizeMessage(name.trim()),
      members: validMembers,
      messages: [],
      createdBy: user.userId,
      createdAt: Date.now()
    };

    chatrooms.set(roomId, room);

    // Notify all members of the room
    validMembers.forEach(memberId => {
      const memberSocket = Array.from(users.entries()).find(([id, u]) => u.userId === memberId)?.[0];
      if (memberSocket) {
        io.to(memberSocket).emit('room-created', {
          roomId: roomId,
          name: room.name,
          members: room.members
        });
      }
    });

    // Send updated rooms list to all users
    const roomsList = Array.from(chatrooms.values()).map(r => ({
      id: r.id,
      name: r.name,
      members: r.members,
      messages: r.messages.slice(-10) // Send last 10 messages
    }));
    io.emit('rooms-list', roomsList);

    console.log(`Room created: ${room.name} by ${user.username} with ${validMembers.length} members`);
  });

  // Handle room messages
  socket.on('send-room-message', (data) => {
    const user = users.get(socket.id);
    if (!user) return;

    const { roomId, message, type, replyTo, imageData, imageName } = data;

    // Check if user is member of the room
    const room = chatrooms.get(roomId);
    if (!room || !room.members.includes(user.userId)) {
      socket.emit('error', { message: 'Not a member of this room' });
      return;
    }

    const messageData = {
      id: generateMessageId(),
      username: user.username,
      userId: user.userId,
      message: message,
      timestamp: Date.now(),
      type: type || 'text',
      replyTo: replyTo || null,
      imageData: imageData || null,
      imageName: imageName || null,
      roomId: roomId
    };

    // Sanitize text messages
    if (messageData.type === 'text') {
      messageData.message = sanitizeMessage(messageData.message.substring(0, 2000));
    }

    // Store message in room
    room.messages.push(messageData);

    // Keep only last 100 messages per room
    if (room.messages.length > 100) {
      room.messages.shift();
    }

    // Send to all room members
    room.members.forEach(memberId => {
      const memberSocket = Array.from(users.entries()).find(([id, u]) => u.userId === memberId)?.[0];
      if (memberSocket) {
        io.to(memberSocket).emit('room-message', messageData);
      }
    });

    console.log(`Room message in ${room.name} from ${user.username}: ${messageData.message.substring(0, 50)}...`);
  });

  // Handle leaving room
  socket.on('leave-room', (data) => {
    const user = users.get(socket.id);
    if (!user) return;

    const { roomId } = data;
    const room = chatrooms.get(roomId);

    if (room && room.members.includes(user.userId)) {
      // Remove user from room
      room.members = room.members.filter(memberId => memberId !== user.userId);

      // If room has no members left, delete it
      if (room.members.length === 0) {
        chatrooms.delete(roomId);
        console.log(`Room ${room.name} deleted - no members left`);
      } else {
        // Send updated rooms list to all users
        const roomsList = Array.from(chatrooms.values()).map(r => ({
          id: r.id,
          name: r.name,
          members: r.members,
          messages: r.messages.slice(-10)
        }));
        io.emit('rooms-list', roomsList);
        console.log(`User ${user.username} left room ${room.name}`);
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
