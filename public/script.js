document.addEventListener('DOMContentLoaded', () => {
    const loginScreen = document.getElementById('login-screen');
    const chatScreen = document.getElementById('chat-screen');
    const usernameInput = document.getElementById('username');
    const joinBtn = document.getElementById('join-btn');
    const leaveBtn = document.getElementById('leave-btn');
    const currentUserSpan = document.getElementById('current-user');
    const usersListDiv = document.getElementById('users-list');
    const onlineCountSpan = document.getElementById('online-count');
    const messagesContainer = document.getElementById('messages-container');
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    const typingIndicator = document.getElementById('typing-indicator');

    let socket;
    let currentUsername = '';
    let typingTimeout;

    // Connect to server
    function connectSocket() {
        socket = io();

        socket.on('connect', () => {
            console.log('Connected to server');
        });

        socket.on('username-taken', () => {
            showError('Username is already taken. Please choose another.');
        });

        socket.on('user-joined', (username) => {
            currentUsername = username;
            currentUserSpan.textContent = `Logged in as: ${username}`;
            loginScreen.classList.add('hidden');
            chatScreen.classList.remove('hidden');
            messageInput.focus();
        });

        socket.on('user-connected', (data) => {
            addSystemMessage(`${data.username} joined the chat`, data.timestamp);
        });

        socket.on('user-disconnected', (data) => {
            addSystemMessage(`${data.username} left the chat`, data.timestamp);
        });

        socket.on('users-list', (users) => {
            updateUsersList(users);
        });

        socket.on('receive-message', (data) => {
            addMessage(data, false);
            // Auto-scroll to bottom
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        });

        socket.on('user-typing', (data) => {
            if (data.isTyping) {
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

    leaveBtn.addEventListener('click', () => {
        if (socket) {
            socket.disconnect();
        }
        currentUsername = '';
        loginScreen.classList.remove('hidden');
        chatScreen.classList.add('hidden');
        messagesContainer.innerHTML = '';
        usersListDiv.innerHTML = '';
        typingIndicator.textContent = '';
    });

    sendBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    messageInput.addEventListener('input', () => {
        if (!currentUsername) return;
        
        socket.emit('typing', true);
        
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
            socket.emit('typing', false);
        }, 1000);
    });

    // Functions
    function joinChat() {
        const username = usernameInput.value.trim();
        
        if (!username) {
            showError('Please enter a username');
            return;
        }
        
        if (username.length < 3) {
            showError('Username must be at least 3 characters');
            return;
        }
        
        if (username.length > 20) {
            showError('Username must be less than 20 characters');
            return;
        }

        clearError();
        
        if (!socket) {
            connectSocket();
        }
        
        socket.emit('user-join', username);
    }

    function sendMessage() {
        const message = messageInput.value.trim();
        
        if (!message || !currentUsername) return;
        
        socket.emit('send-message', { message });
        addMessage({
            username: currentUsername,
            message: message,
            timestamp: new Date().toLocaleTimeString()
        }, true);
        
        messageInput.value = '';
        messageInput.focus();
        
        // Clear typing indicator
        socket.emit('typing', false);
        
        // Auto-scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function addMessage(data, isSent) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isSent ? 'sent' : 'received'}`;
        
        messageDiv.innerHTML = `
            <div class="message-header">
                <strong>${data.username}</strong>
                <span>${data.timestamp}</span>
            </div>
            <div class="message-content">${escapeHtml(data.message)}</div>
        `;
        
        messagesContainer.appendChild(messageDiv);
    }

    function addSystemMessage(message, timestamp) {
        const systemDiv = document.createElement('div');
        systemDiv.className = 'system-message';
        systemDiv.textContent = `${message} (${timestamp})`;
        messagesContainer.appendChild(systemDiv);
    }

    function updateUsersList(users) {
        usersListDiv.innerHTML = '';
        onlineCountSpan.textContent = users.length;
        
        users.forEach(user => {
            const userDiv = document.createElement('div');
            userDiv.className = 'user-item';
            userDiv.innerHTML = `
                <i class="fas fa-user-circle"></i>
                <span>${user}</span>
            `;
            usersListDiv.appendChild(userDiv);
        });
    }

    function showError(message) {
        const errorDiv = document.getElementById('username-error');
        errorDiv.textContent = message;
        usernameInput.focus();
    }

    function clearError() {
        const errorDiv = document.getElementById('username-error');
        errorDiv.textContent = '';
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Handle page visibility change
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && socket && !socket.connected) {
            socket.connect();
        }
    });
});
