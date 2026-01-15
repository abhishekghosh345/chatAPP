document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const loginScreen = document.getElementById('login-screen');
    const chatScreen = document.getElementById('chat-screen');
    const usernameInput = document.getElementById('username');
    const joinBtn = document.getElementById('join-btn');
    const leaveBtn = document.querySelector('.leave-btn');
    const currentUserSpan = document.getElementById('current-user');
    const usersListDiv = document.getElementById('users-list');
    const onlineCountSpan = document.querySelector('.online-users h3 span');
    const messagesContainer = document.getElementById('messages-container');
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.querySelector('.send-btn');
    const typingIndicator = document.getElementById('typing-indicator');
    const usernameError = document.getElementById('username-error');

    // Variables
    let socket;
    let currentUsername = '';
    let typingTimeout;
    let isConnected = false;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;

    // Connect to WebSocket server
    function connectSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        socket = io(`${protocol}//${host}`, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: maxReconnectAttempts,
            reconnectionDelay: 1000
        });

        // Socket event handlers
        socket.on('connect', () => {
            console.log('✅ Connected to server');
            isConnected = true;
            reconnectAttempts = 0;
            updateConnectionStatus(true);
        });

        socket.on('disconnect', () => {
            console.log('❌ Disconnected from server');
            isConnected = false;
            updateConnectionStatus(false);
        });

        socket.on('connect_error', (error) => {
            console.error('Connection error:', error);
            if (reconnectAttempts >= maxReconnectAttempts) {
                showSystemMessage('Unable to connect to server. Please refresh the page.');
            }
        });

        socket.on('username-taken', () => {
            showError('Username is already taken. Please choose another.');
            enableJoinButton();
        });

        socket.on('user-joined', (username) => {
            currentUsername = username;
            currentUserSpan.textContent = username;
            loginScreen.classList.add('hidden');
            chatScreen.classList.remove('hidden');
            messageInput.focus();
            
            // Add welcome message
            addSystemMessage(`Welcome to the chat, ${username}!`);
            
            // Clear any previous messages
            messagesContainer.innerHTML = '';
        });

        socket.on('user-connected', (data) => {
            addSystemMessage(`${data.username} joined the chat`);
            updateUsersList([data.username], true);
        });

        socket.on('user-disconnected', (data) => {
            addSystemMessage(`${data.username} left the chat`);
            updateUsersList([data.username], false);
        });

        socket.on('users-list', (users) => {
            updateUsersList(users, true, true);
        });

        socket.on('receive-message', (data) => {
            addMessage(data, data.username === currentUsername);
            scrollToBottom();
        });

        socket.on('user-typing', (data) => {
            if (data.isTyping && data.username !== currentUsername) {
                typingIndicator.textContent = `${data.username} is typing...`;
            } else {
                typingIndicator.textContent = '';
            }
        });
    }

    // Event Listeners
    joinBtn.addEventListener('click', joinChat);
    usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') joinChat();
    });

    usernameInput.addEventListener('input', () => {
        clearError();
        if (usernameInput.value.trim().length >= 3) {
            joinBtn.disabled = false;
        } else {
            joinBtn.disabled = true;
        }
    });

    leaveBtn.addEventListener('click', leaveChat);

    sendBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    messageInput.addEventListener('input', handleTyping);

    // Functions
    function joinChat() {
        const username = usernameInput.value.trim();
        
        if (!validateUsername(username)) {
            return;
        }

        disableJoinButton();
        clearError();
        
        if (!socket) {
            connectSocket();
        }
        
        // Add reconnection check
        if (!socket.connected) {
            showError('Connecting to server...');
            socket.connect();
            
            // Wait for connection before joining
            const checkConnection = setInterval(() => {
                if (socket.connected) {
                    clearInterval(checkConnection);
                    socket.emit('user-join', username);
                }
            }, 100);
            
            // Timeout after 5 seconds
            setTimeout(() => {
                clearInterval(checkConnection);
                if (!socket.connected) {
                    showError('Could not connect to server. Please try again.');
                    enableJoinButton();
                }
            }, 5000);
        } else {
            socket.emit('user-join', username);
        }
    }

    function validateUsername(username) {
        if (!username) {
            showError('Please enter a username');
            return false;
        }
        
        if (username.length < 3) {
            showError('Username must be at least 3 characters');
            return false;
        }
        
        if (username.length > 20) {
            showError('Username must be less than 20 characters');
            return false;
        }
        
        // Basic username validation (alphanumeric and underscores)
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            showError('Username can only contain letters, numbers, and underscores');
            return false;
        }
        
        return true;
    }

    function sendMessage() {
        const message = messageInput.value.trim();
        
        if (!message || !currentUsername || !isConnected) return;
        
        if (message.length > 1000) {
            showSystemMessage('Message is too long (max 1000 characters)');
            return;
        }
        
        socket.emit('send-message', { message });
        messageInput.value = '';
        messageInput.focus();
        
        // Clear typing indicator
        socket.emit('typing', false);
    }

    function handleTyping() {
        if (!currentUsername || !isConnected) return;
        
        socket.emit('typing', true);
        
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
            socket.emit('typing', false);
        }, 1000);
    }

    function addMessage(data, isSent) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isSent ? 'sent' : 'received'}`;
        
        // Format message with line breaks
        const formattedMessage = formatMessage(data.message);
        
        messageDiv.innerHTML = `
            <div class="message-header">
                <span class="message-username">${escapeHtml(data.username)}</span>
                <span class="message-time">${data.timestamp}</span>
            </div>
            <div class="message-content">${formattedMessage}</div>
        `;
        
        messagesContainer.appendChild(messageDiv);
    }

    function addSystemMessage(message) {
        const systemDiv = document.createElement('div');
        systemDiv.className = 'system-message';
        systemDiv.textContent = message;
        messagesContainer.appendChild(systemDiv);
        scrollToBottom();
    }

    function updateUsersList(users, add = true, fullList = false) {
        if (fullList) {
            usersListDiv.innerHTML = '';
            users.forEach(user => {
                if (user !== currentUsername) {
                    addUserToList(user);
                }
            });
        } else {
            if (add) {
                addUserToList(users[0]);
            } else {
                removeUserFromList(users[0]);
            }
        }
        
        // Count online users (excluding current user)
        const userCount = Array.from(usersListDiv.querySelectorAll('.user-item')).length + 1;
        onlineCountSpan.textContent = userCount;
    }

    function addUserToList(username) {
        const existingUser = Array.from(usersListDiv.querySelectorAll('.user-item span'))
            .find(span => span.textContent === username);
        
        if (!existingUser) {
            const userDiv = document.createElement('div');
            userDiv.className = 'user-item';
            userDiv.innerHTML = `
                <i class="fas fa-circle"></i>
                <span>${escapeHtml(username)}</span>
            `;
            usersListDiv.appendChild(userDiv);
        }
    }

    function removeUserFromList(username) {
        const userElements = usersListDiv.querySelectorAll('.user-item');
        userElements.forEach(userEl => {
            if (userEl.querySelector('span').textContent === username) {
                userEl.remove();
            }
        });
    }

    function leaveChat() {
        if (socket) {
            socket.disconnect();
        }
        
        currentUsername = '';
        loginScreen.classList.remove('hidden');
        chatScreen.classList.add('hidden');
        messagesContainer.innerHTML = '';
        usersListDiv.innerHTML = '';
        typingIndicator.textContent = '';
        usernameInput.value = '';
        usernameInput.focus();
        
        // Reset connection status
        updateConnectionStatus(false);
    }

    function showError(message) {
        usernameError.textContent = message;
        usernameError.classList.add('show');
        usernameInput.focus();
    }

    function clearError() {
        usernameError.textContent = '';
        usernameError.classList.remove('show');
    }

    function disableJoinButton() {
        joinBtn.disabled = true;
        joinBtn.innerHTML = '<div class="loading"></div>';
    }

    function enableJoinButton() {
        joinBtn.disabled = false;
        joinBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Join Chat';
    }

    function updateConnectionStatus(connected) {
        const statusEl = document.querySelector('.connection-status');
        if (statusEl) {
            statusEl.innerHTML = connected ? 
                '<i class="fas fa-circle"></i> Connected' :
                '<i class="fas fa-circle" style="color: #dc3545"></i> Disconnected';
        }
    }

    function scrollToBottom() {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function formatMessage(text) {
        // Convert URLs to links
        text = text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');
        
        // Convert newlines to <br>
        text = text.replace(/\n/g, '<br>');
        
        // Convert simple emojis
        const emojiMap = {
            ':)': '😊',
            ':(': '😔',
            ':D': '😃',
            ':P': '😛',
            ';)': '😉',
            ':*': '😘',
            '<3': '❤️'
        };
        
        Object.keys(emojiMap).forEach(emoji => {
            const regex = new RegExp(escapeRegex(emoji), 'g');
            text = text.replace(regex, emojiMap[emoji]);
        });
        
        return text;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // Initialize
    usernameInput.focus();
    updateConnectionStatus(false);

    // Auto-reconnect when page becomes visible
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && socket && !socket.connected) {
            socket.connect();
        }
    });

    // Keep connection alive
    setInterval(() => {
        if (socket && socket.connected) {
            socket.emit('ping');
        }
    }, 30000);
});
