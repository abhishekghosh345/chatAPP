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
    const connectionStatus = document.querySelector('.connection-status');
    
    // New Elements for features
    const emojiBtn = document.getElementById('emoji-btn');
    const imageBtn = document.getElementById('image-btn');
    const emojiPicker = document.getElementById('emoji-picker');
    const emojiSearch = document.getElementById('emoji-search');
    const emojiGrid = document.getElementById('emoji-grid');
    const emojiCategories = document.getElementById('emoji-categories');
    const replyToContainer = document.getElementById('reply-to-container');
    const replyToInfo = document.getElementById('reply-to-info');
    const cancelReplyBtn = document.getElementById('cancel-reply');
    const imagePreview = document.getElementById('image-preview');
    const previewImage = document.getElementById('preview-image');
    const removeImageBtn = document.getElementById('remove-image');
    const imageModal = document.getElementById('image-modal');
    const modalImage = document.getElementById('modal-image');
    const closeModalBtn = document.getElementById('close-modal');
    const imageInput = document.createElement('input');

    // Variables
    let socket;
    let currentUsername = '';
    let typingTimeout;
    let isConnected = false;
    let messageToReply = null;
    let selectedImage = null;
    let currentDate = null;
    let lastMessageDate = null;
    let selectedMessageId = null;
    let reactions = {};

    // Emoji Categories
    const emojiCategoriesData = [
        { 
            name: 'Smileys', 
            emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄'] 
        },
        { 
            name: 'People', 
            emojis: ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🦷', '🦴', '👀', '👁️', '👅', '👄', '👶', '🧒', '👦', '👧', '🧑', '👨', '👩', '🧔', '👨‍🦰', '👩‍🦰', '👨‍🦱', '👩‍🦱', '👨‍🦳', '👩‍🦳', '👨‍🦲', '👩‍🦲'] 
        },
        { 
            name: 'Animals', 
            emojis: ['🐵', '🐒', '🦍', '🦧', '🐶', '🐕', '🦮', '🐕‍🦺', '🐩', '🐺', '🦊', '🦝', '🐱', '🐈', '🐈‍⬛', '🦁', '🐯', '🐅', '🐆', '🐴', '🐎', '🦄', '🦓', '🦌', '🐮', '🐂', '🐃', '🐄', '🐷', '🐖', '🐗', '🐽', '🐏', '🐑', '🐐', '🐪', '🐫', '🦙', '🦒', '🐘', '🦏', '🦛', '🐭', '🐁', '🐀', '🐹', '🐰', '🐇', '🐿️', '🦔', '🦇', '🐻', '🐻‍❄️', '🐨', '🐼', '🦥', '🦦', '🦨', '🦘', '🦡'] 
        },
        { 
            name: 'Food', 
            emojis: ['🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠', '🫘', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕', '🫓', '🥪', '🥙', '🧆', '🌮', '🌯', '🫔', '🥗', '🥘', '🫕', '🥫', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🦪', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🍩', '🍪', '🌰', '🥜', '🫘', '🍯'] 
        },
        { 
            name: 'Activities', 
            emojis: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂', '🪂', '🏋️', '🤼', '🤸', '🤺', '⛹️', '🤾', '🏌️', '🏇', '🧘', '🏄', '🏊', '🤽', '🚣', '🧗', '🚵', '🚴'] 
        },
        { 
            name: 'Objects', 
            emojis: ['⌚', '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🎮', '🕹️', '🗜️', '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️', '🎛️', '🧭', '⏱️', '⏲️', '⏰', '🕰️', '⌛', '⏳', '📡', '🔋', '🔌', '💡', '🔦', '🕯️', '🪔', '🧯', '🛢️', '💸', '💵', '💴', '💶', '💷', '💰', '💳', '💎'] 
        },
        { 
            name: 'Symbols', 
            emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❤️‍🔥', '❤️‍🩹', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳', '🈶', '🈚', '🈸', '🈺', '🈷️', '✴️', '🆚', '💮', '🉐', '㊙️', '㊗️', '🈴', '🈵', '🈹', '🈲', '🅰️', '🅱️', '🆎', '🆑', '🅾️', '🆘', '❌', '⭕', '🛑', '⛔', '📛', '🚫', '💯', '💢', '♨️', '🚷', '🚯', '🚳', '🚱', '🔞', '📵', '🚭'] 
        }
    ];

    // Initialize
    function init() {
        setupEventListeners();
        initEmojiPicker();
        initImageInput();
        usernameInput.focus();
        updateConnectionStatus(false);
    }

    // Setup event listeners
    function setupEventListeners() {
        // Login events
        joinBtn.addEventListener('click', joinChat);
        usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') joinChat();
        });
        usernameInput.addEventListener('input', handleUsernameInput);

        // Chat events
        leaveBtn.addEventListener('click', leaveChat);
        sendBtn.addEventListener('click', sendMessage);
        messageInput.addEventListener('keypress', handleMessageKeypress);
        messageInput.addEventListener('input', handleTyping);
        
        // Feature events
        emojiBtn.addEventListener('click', toggleEmojiPicker);
        imageBtn.addEventListener('click', triggerImageUpload);
        cancelReplyBtn.addEventListener('click', cancelReply);
        removeImageBtn.addEventListener('click', removeImage);
        closeModalBtn.addEventListener('click', closeImageModal);
        
        // Click outside emoji picker to close
        document.addEventListener('click', (e) => {
            if (!emojiPicker.contains(e.target) && e.target !== emojiBtn) {
                emojiPicker.classList.remove('show');
            }
        });
        
        // Image modal close on click outside
        imageModal.addEventListener('click', (e) => {
            if (e.target === imageModal) {
                closeImageModal();
            }
        });
        
        // Escape key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeImageModal();
                if (emojiPicker.classList.contains('show')) {
                    emojiPicker.classList.remove('show');
                }
            }
        });
        
        // Connection status indicator
        window.addEventListener('online', () => {
            if (socket && !socket.connected) {
                socket.connect();
            }
        });
        
        window.addEventListener('offline', () => {
            updateConnectionStatus(false);
        });
    }

    // Initialize emoji picker
    function initEmojiPicker() {
        // Create category buttons
        emojiCategoriesData.forEach((category, index) => {
            const btn = document.createElement('button');
            btn.className = 'emoji-category-btn';
            if (index === 0) btn.classList.add('active');
            btn.textContent = category.name;
            btn.dataset.category = index;
            btn.addEventListener('click', () => switchEmojiCategory(index));
            emojiCategories.appendChild(btn);
        });

        // Load first category
        loadEmojiCategory(0);

        // Search emojis
        emojiSearch.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            if (searchTerm) {
                searchEmojis(searchTerm);
            } else {
                const activeCategory = document.querySelector('.emoji-category-btn.active');
                loadEmojiCategory(parseInt(activeCategory.dataset.category));
            }
        });
    }

    // Load emoji category
    function loadEmojiCategory(categoryIndex) {
        emojiGrid.innerHTML = '';
        const category = emojiCategoriesData[categoryIndex];
        
        category.emojis.forEach(emoji => {
            const btn = document.createElement('button');
            btn.className = 'emoji-btn';
            btn.textContent = emoji;
            btn.addEventListener('click', () => insertEmoji(emoji));
            emojiGrid.appendChild(btn);
        });
    }

    // Switch emoji category
    function switchEmojiCategory(categoryIndex) {
        document.querySelectorAll('.emoji-category-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-category="${categoryIndex}"]`).classList.add('active');
        loadEmojiCategory(categoryIndex);
    }

    // Search emojis
    function searchEmojis(searchTerm) {
        emojiGrid.innerHTML = '';
        const allEmojis = emojiCategoriesData.flatMap(category => category.emojis);
        
        const filteredEmojis = allEmojis.filter(emoji => {
            // Convert emoji to text description for search (simplified)
            const emojiText = emoji;
            return emojiText.includes(searchTerm);
        }).slice(0, 64); // Limit results
        
        filteredEmojis.forEach(emoji => {
            const btn = document.createElement('button');
            btn.className = 'emoji-btn';
            btn.textContent = emoji;
            btn.addEventListener('click', () => insertEmoji(emoji));
            emojiGrid.appendChild(btn);
        });
    }

    // Insert emoji into message input
    function insertEmoji(emoji) {
        const cursorPos = messageInput.selectionStart;
        const textBefore = messageInput.value.substring(0, cursorPos);
        const textAfter = messageInput.value.substring(cursorPos);
        
        messageInput.value = textBefore + emoji + textAfter;
        messageInput.focus();
        messageInput.selectionStart = cursorPos + emoji.length;
        messageInput.selectionEnd = cursorPos + emoji.length;
        
        // Trigger input event for typing indicator
        messageInput.dispatchEvent(new Event('input'));
        
        // Close emoji picker after selection
        emojiPicker.classList.remove('show');
    }

    // Toggle emoji picker
    function toggleEmojiPicker() {
        emojiPicker.classList.toggle('show');
        if (emojiPicker.classList.contains('show')) {
            emojiSearch.focus();
        }
    }

    // Initialize image input
    function initImageInput() {
        imageInput.type = 'file';
        imageInput.accept = 'image/*';
        imageInput.style.display = 'none';
        imageInput.addEventListener('change', handleImageSelect);
        document.body.appendChild(imageInput);
    }

    // Trigger image upload
    function triggerImageUpload() {
        imageInput.click();
    }

    // Handle image selection
    function handleImageSelect(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showSystemMessage('Image size should be less than 5MB');
            return;
        }
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
            showSystemMessage('Please select an image file');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (event) => {
            selectedImage = {
                data: event.target.result,
                name: file.name,
                type: file.type
            };
            
            previewImage.src = selectedImage.data;
            imagePreview.classList.add('show');
            
            // Auto-hide preview after 30 seconds
            setTimeout(() => {
                if (selectedImage) {
                    showSystemMessage('Image ready to send. Click send button or select another image.');
                }
            }, 30000);
        };
        
        reader.readAsDataURL(file);
    }

    // Remove selected image
    function removeImage() {
        selectedImage = null;
        imagePreview.classList.remove('show');
        imageInput.value = '';
    }

    // Open image in modal
    function openImageModal(imageSrc) {
        modalImage.src = imageSrc;
        imageModal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    // Close image modal
    function closeImageModal() {
        imageModal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }

    // Format timestamp to local time
    function formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        
        // Today
        if (date.toDateString() === now.toDateString()) {
            if (diffMins < 1) return 'Just now';
            if (diffMins < 60) return `${diffMins}m ago`;
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        
        // Yesterday
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        if (date.toDateString() === yesterday.toDateString()) {
            return `Yesterday ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        }
        
        // This week
        if (diffMs < 7 * 24 * 60 * 60 * 1000) {
            return `${date.toLocaleDateString([], { weekday: 'short' })} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        }
        
        // Older
        return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }

    // Format date for separator
    function formatDate(timestamp) {
        const date = new Date(timestamp);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        }
    }

    // Add date separator if needed
    function addDateSeparator(timestamp) {
        const messageDate = formatDate(timestamp);
        
        if (messageDate !== lastMessageDate) {
            const separator = document.createElement('div');
            separator.className = 'date-separator';
            separator.innerHTML = `<span>${messageDate}</span>`;
            messagesContainer.appendChild(separator);
            lastMessageDate = messageDate;
        }
    }

    // Connect to WebSocket server
    function connectSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        
        socket = io(`${protocol}//${host}`, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 20000
        });

        // Socket event handlers
        socket.on('connect', () => {
            console.log('✅ Connected to server');
            isConnected = true;
            updateConnectionStatus(true);
        });

        socket.on('disconnect', (reason) => {
            console.log('❌ Disconnected:', reason);
            isConnected = false;
            updateConnectionStatus(false);
        });

        socket.on('connect_error', (error) => {
            console.error('Connection error:', error);
            updateConnectionStatus(false);
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
            
            addSystemMessage(`Welcome to the chat, ${username}! Start chatting now.`);
            lastMessageDate = null;
        });

        socket.on('user-connected', (data) => {
            addSystemMessage(`${data.username} joined the chat`);
            updateOnlineCount(data.userCount || 0);
        });

        socket.on('user-disconnected', (data) => {
            addSystemMessage(`${data.username} left the chat`);
            updateOnlineCount(data.userCount || 0);
        });

        socket.on('users-list', (users) => {
            updateUsersList(users);
        });

        socket.on('message-history', (history) => {
            messagesContainer.innerHTML = '';
            lastMessageDate = null;
            
            if (history && history.length > 0) {
                history.forEach(msg => {
                    addMessage(msg, msg.username === currentUsername);
                });
                scrollToBottom();
            } else {
                const welcomeMsg = document.createElement('div');
                welcomeMsg.className = 'welcome-animation';
                welcomeMsg.innerHTML = `
                    <i class="fas fa-comment-alt"></i>
                    <h2>Welcome to Self-Hosted Chat</h2>
                    <p>No messages yet. Start the conversation!</p>
                `;
                messagesContainer.appendChild(welcomeMsg);
            }
        });

        socket.on('receive-message', (data) => {
            addMessage(data, data.username === currentUsername);
            scrollToBottom();
        });

        socket.on('user-typing', (data) => {
            if (data.isTyping && data.username !== currentUsername) {
                typingIndicator.innerHTML = `${data.username} is typing <span class="typing-dots"><span>.</span><span>.</span><span>.</span></span>`;
            } else {
                typingIndicator.innerHTML = '';
            }
        });

        socket.on('update-reaction', (data) => {
            updateMessageReaction(data.messageId, data.reaction, data.username);
        });
    }

    // Update connection status
    function updateConnectionStatus(connected) {
        if (connected) {
            connectionStatus.innerHTML = '<i class="fas fa-circle"></i> Connected';
            connectionStatus.classList.remove('disconnected');
            connectionStatus.classList.add('connected');
        } else {
            connectionStatus.innerHTML = '<i class="fas fa-circle"></i> Disconnected';
            connectionStatus.classList.remove('connected');
            connectionStatus.classList.add('disconnected');
        }
    }

    // Join chat
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
        
        // Wait a moment for connection if needed
        if (!socket.connected) {
            showError('Connecting to server... Please wait.');
            setTimeout(() => {
                if (socket.connected) {
                    socket.emit('user-join', username);
                } else {
                    showError('Could not connect to server. Please refresh and try again.');
                    enableJoinButton();
                }
            }, 1000);
        } else {
            socket.emit('user-join', username);
        }
    }

    // Validate username
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
        
        // Allow letters, numbers, underscores, and basic symbols
        if (!/^[a-zA-Z0-9_\-\. ]+$/.test(username)) {
            showError('Username can only contain letters, numbers, spaces, dots, hyphens, and underscores');
            return false;
        }
        
        return true;
    }

    // Handle username input
    function handleUsernameInput() {
        clearError();
        const username = usernameInput.value.trim();
        joinBtn.disabled = username.length < 3;
    }

    // Send message
    function sendMessage() {
        const message = messageInput.value.trim();
        
        if (!currentUsername || !isConnected) {
            showSystemMessage('Not connected to chat server');
            return;
        }
        
        // Check if we have image or text
        if (!message && !selectedImage) {
            messageInput.focus();
            return;
        }
        
        const messageData = {
            message: message,
            type: selectedImage ? 'image' : 'text',
            replyTo: messageToReply ? messageToReply.id : null
        };
        
        // Add image data if available
        if (selectedImage) {
            messageData.imageData = selectedImage.data;
            messageData.imageName = selectedImage.name;
        }
        
        socket.emit('send-message', messageData);
        
        // Clear inputs
        messageInput.value = '';
        removeImage();
        cancelReply();
        messageInput.focus();
        
        // Clear typing indicator
        socket.emit('typing', false);
    }

    // Handle message keypress
    function handleMessageKeypress(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    }

    // Handle typing indicator
    function handleTyping() {
        if (!currentUsername || !isConnected) return;
        
        socket.emit('typing', true);
        
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
            if (isConnected) {
                socket.emit('typing', false);
            }
        }, 1000);
    }

    // Add message to UI
    function addMessage(data, isSent) {
        // Add date separator if needed
        addDateSeparator(data.timestamp);
        
        const messageWrapper = document.createElement('div');
        messageWrapper.className = `message-wrapper ${isSent ? 'sent' : 'received'}`;
        messageWrapper.dataset.messageId = data.id;
        
        // Create message HTML
        let messageHTML = `
            <div class="message ${isSent ? 'sent' : 'received'}">
                <div class="message-header">
                    <span class="message-username">${escapeHtml(data.username)}</span>
                    <span class="message-time">${formatTimestamp(data.timestamp)}</span>
                </div>
        `;
        
        // Add reply preview if replying to another message
        if (data.replyTo) {
            const repliedMessage = messagesContainer.querySelector(`[data-message-id="${data.replyTo}"]`);
            if (repliedMessage) {
                const repliedContent = repliedMessage.querySelector('.message-content');
                const repliedUsername = repliedMessage.querySelector('.message-username').textContent;
                let previewText = repliedContent.textContent.substring(0, 50);
                if (repliedContent.textContent.length > 50) previewText += '...';
                
                messageHTML += `
                    <div class="reply-preview" data-reply-to="${data.replyTo}">
                        <div class="reply-sender">${escapeHtml(repliedUsername)}</div>
                        <div class="reply-content">${escapeHtml(previewText)}</div>
                    </div>
                `;
            }
        }
        
        // Add message content
        messageHTML += `<div class="message-content">`;
        
        if (data.type === 'image' && data.imageData) {
            messageHTML += `
                <div class="image-message" onclick="openImageModal('${data.imageData}')">
                    <img src="${data.imageData}" alt="Sent image" loading="lazy">
                    ${data.message ? `<div class="image-caption">${escapeHtml(data.message)}</div>` : ''}
                </div>
            `;
        } else {
            messageHTML += formatMessageContent(data.message);
        }
        
        messageHTML += `</div>`;
        
        // Add reactions if any
        if (reactions[data.id] && Object.keys(reactions[data.id]).length > 0) {
            messageHTML += `<div class="reactions-container">`;
            Object.entries(reactions[data.id]).forEach(([reaction, users]) => {
                messageHTML += `
                    <div class="reaction" onclick="reactToMessage('${data.id}', '${reaction}')">
                        <span class="reaction-emoji">${reaction}</span>
                        <span class="reaction-count">${users.length}</span>
                    </div>
                `;
            });
            messageHTML += `</div>`;
        }
        
        messageHTML += `</div>`;
        
        // Add message actions
        messageHTML += `
            <div class="message-actions">
                <button class="action-btn reply-btn" onclick="replyToMessage('${data.id}')" title="Reply">
                    <i class="fas fa-reply"></i>
                </button>
                <button class="action-btn react-btn" onclick="showReactionMenu('${data.id}')" title="React">
                    <i class="fas fa-smile"></i>
                </button>
            </div>
        `;
        
        messageWrapper.innerHTML = messageHTML;
        messagesContainer.appendChild(messageWrapper);
        
        // Add click handler for reply preview
        const replyPreview = messageWrapper.querySelector('.reply-preview');
        if (replyPreview) {
            replyPreview.addEventListener('click', (e) => {
                e.stopPropagation();
                const messageId = replyPreview.dataset.replyTo;
                scrollToMessage(messageId);
            });
        }
        
        // Add click handler for image message
        const imageMessage = messageWrapper.querySelector('.image-message');
        if (imageMessage) {
            imageMessage.addEventListener('click', (e) => {
                e.stopPropagation();
                const img = imageMessage.querySelector('img');
                if (img) {
                    openImageModal(img.src);
                }
            });
        }
    }

    // Format message content with links, emojis, etc.
    function formatMessageContent(text) {
        if (!text) return '';
        
        // Convert URLs to clickable links
        let formatted = text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
        
        // Convert newlines to <br>
        formatted = formatted.replace(/\n/g, '<br>');
        
        // Convert basic emoji shortcuts
        const emojiMap = {
            ':)': '😊',
            ':-)': '😊',
            ':(': '😔',
            ':-(': '😔',
            ':D': '😃',
            ':-D': '😃',
            ':P': '😛',
            ':-P': '😛',
            ';)': '😉',
            ';-)': '😉',
            ':*': '😘',
            ':-*': '😘',
            '<3': '❤️',
            '</3': '💔',
            ':O': '😮',
            ':-O': '😮',
            ':|': '😐',
            ':-|': '😐',
            ':/': '😕',
            ':-/': '😕'
        };
        
        Object.entries(emojiMap).forEach(([shortcut, emoji]) => {
            const regex = new RegExp(escapeRegex(shortcut), 'g');
            formatted = formatted.replace(regex, emoji);
        });
        
        return formatted;
    }

    // Reply to a message
    function replyToMessage(messageId) {
        const messageElement = messagesContainer.querySelector(`[data-message-id="${messageId}"]`);
        if (!messageElement) return;
        
        const username = messageElement.querySelector('.message-username').textContent;
        const messageContent = messageElement.querySelector('.message-content').textContent.substring(0, 100);
        
        messageToReply = {
            id: messageId,
            username: username,
            content: messageContent
        };
        
        updateReplyPreview();
        messageInput.focus();
        
        // Highlight the replied message briefly
        messageElement.classList.add('selected');
        setTimeout(() => {
            messageElement.classList.remove('selected');
        }, 2000);
    }

    // Update reply preview in input area
    function updateReplyPreview() {
        if (messageToReply) {
            replyToContainer.classList.add('show');
            replyToInfo.innerHTML = `
                <div class="reply-to-sender">Replying to ${escapeHtml(messageToReply.username)}</div>
                <div class="reply-to-content">${escapeHtml(messageToReply.content)}</div>
            `;
        } else {
            replyToContainer.classList.remove('show');
        }
    }

    // Cancel reply
    function cancelReply() {
        messageToReply = null;
        updateReplyPreview();
    }

    // Scroll to a specific message
    function scrollToMessage(messageId) {
        const messageElement = messagesContainer.querySelector(`[data-message-id="${messageId}"]`);
        if (messageElement) {
            messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Highlight briefly
            messageElement.classList.add('selected');
            setTimeout(() => {
                messageElement.classList.remove('selected');
            }, 2000);
        }
    }

    // Show reaction menu
    function showReactionMenu(messageId) {
        // Create reaction menu
        const reactionEmojis = ['👍', '❤️', '😂', '😮', '😢', '😠'];
        const menu = document.createElement('div');
        menu.className = 'reaction-menu';
        menu.style.cssText = `
            position: absolute;
            background: white;
            border-radius: 24px;
            padding: 4px;
            display: flex;
            gap: 4px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            animation: fadeIn 0.2s ease;
        `;
        
        reactionEmojis.forEach(emoji => {
            const btn = document.createElement('button');
            btn.textContent = emoji;
            btn.style.cssText = `
                font-size: 20px;
                border: none;
                background: none;
                cursor: pointer;
                padding: 8px;
                border-radius: 50%;
                transition: all 0.2s;
            `;
            btn.onmouseover = () => btn.style.transform = 'scale(1.3)';
            btn.onmouseout = () => btn.style.transform = 'scale(1)';
            btn.onclick = () => {
                reactToMessage(messageId, emoji);
                document.body.removeChild(menu);
            };
            menu.appendChild(btn);
        });
        
        // Position near the react button
        const reactBtn = document.querySelector(`[data-message-id="${messageId}"] .react-btn`);
        if (reactBtn) {
            const rect = reactBtn.getBoundingClientRect();
            menu.style.top = `${rect.top - 50}px`;
            menu.style.left = `${rect.left}px`;
            document.body.appendChild(menu);
            
            // Remove menu after click outside
            setTimeout(() => {
                const removeMenu = (e) => {
                    if (!menu.contains(e.target) && e.target !== reactBtn) {
                        document.body.removeChild(menu);
                        document.removeEventListener('click', removeMenu);
                    }
                };
                document.addEventListener('click', removeMenu);
            }, 100);
        }
    }

    // React to a message
    function reactToMessage(messageId, reaction) {
        if (!currentUsername || !isConnected) return;
        
        socket.emit('message-reaction', {
            messageId: messageId,
            reaction: reaction
        });
        
        // Update local reactions cache
        if (!reactions[messageId]) {
            reactions[messageId] = {};
        }
        if (!reactions[messageId][reaction]) {
            reactions[messageId][reaction] = [];
        }
        if (!reactions[messageId][reaction].includes(currentUsername)) {
            reactions[messageId][reaction].push(currentUsername);
        }
        
        // Update UI
        updateMessageReaction(messageId, reaction, currentUsername);
    }

    // Update message reaction in UI
    function updateMessageReaction(messageId, reaction, username) {
        const messageElement = messagesContainer.querySelector(`[data-message-id="${messageId}"]`);
        if (!messageElement) return;
        
        let reactionsContainer = messageElement.querySelector('.reactions-container');
        if (!reactionsContainer) {
            reactionsContainer = document.createElement('div');
            reactionsContainer.className = 'reactions-container';
            messageElement.querySelector('.message').appendChild(reactionsContainer);
        }
        
        // Update local cache
        if (!reactions[messageId]) reactions[messageId] = {};
        if (!reactions[messageId][reaction]) reactions[messageId][reaction] = [];
        if (!reactions[messageId][reaction].includes(username)) {
            reactions[messageId][reaction].push(username);
        }
        
        // Update or create reaction element
        let reactionElement = reactionsContainer.querySelector(`.reaction[data-reaction="${reaction}"]`);
        if (!reactionElement) {
            reactionElement = document.createElement('div');
            reactionElement.className = 'reaction';
            reactionElement.dataset.reaction = reaction;
            reactionElement.innerHTML = `
                <span class="reaction-emoji">${reaction}</span>
                <span class="reaction-count">1</span>
            `;
            reactionElement.onclick = () => reactToMessage(messageId, reaction);
            reactionsContainer.appendChild(reactionElement);
        } else {
            const countElement = reactionElement.querySelector('.reaction-count');
            countElement.textContent = reactions[messageId][reaction].length;
        }
    }

    // Add system message
    function addSystemMessage(text) {
        const systemDiv = document.createElement('div');
        systemDiv.className = 'system-message';
        systemDiv.textContent = text;
        messagesContainer.appendChild(systemDiv);
        scrollToBottom();
    }

    // Update users list
    function updateUsersList(users) {
        usersListDiv.innerHTML = '';
        const otherUsers = users.filter(u => u !== currentUsername);
        
        if (otherUsers.length === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.className = 'user-item';
            emptyMsg.innerHTML = '<i class="fas fa-user-friends"></i> <span>No other users online</span>';
            usersListDiv.appendChild(emptyMsg);
        } else {
            otherUsers.forEach(user => {
                const userDiv = document.createElement('div');
                userDiv.className = 'user-item';
                userDiv.innerHTML = `
                    <i class="fas fa-circle"></i>
                    <span>${escapeHtml(user)}</span>
                `;
                userDiv.addEventListener('click', () => {
                    // Mention user in chat
                    messageInput.value += `@${user} `;
                    messageInput.focus();
                    messageInput.dispatchEvent(new Event('input'));
                });
                usersListDiv.appendChild(userDiv);
            });
        }
        
        updateOnlineCount(users.length);
    }

    // Update online count
    function updateOnlineCount(count) {
        onlineCountSpan.textContent = count;
    }

    // Leave chat
    function leaveChat() {
        if (socket) {
            socket.disconnect();
        }
        
        currentUsername = '';
        loginScreen.classList.remove('hidden');
        chatScreen.classList.add('hidden');
        messagesContainer.innerHTML = '';
        usersListDiv.innerHTML = '';
        typingIndicator.innerHTML = '';
        usernameInput.value = '';
        usernameInput.focus();
        cancelReply();
        removeImage();
        
        updateConnectionStatus(false);
        enableJoinButton();
    }

    // Show error
    function showError(message) {
        usernameError.textContent = message;
        usernameError.classList.add('show');
        usernameInput.focus();
    }

    // Clear error
    function clearError() {
        usernameError.textContent = '';
        usernameError.classList.remove('show');
    }

    // Disable join button
    function disableJoinButton() {
        joinBtn.disabled = true;
        joinBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connecting...';
    }

    // Enable join button
    function enableJoinButton() {
        joinBtn.disabled = false;
        joinBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Join Chat';
    }

    // Scroll to bottom
    function scrollToBottom() {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Escape HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Escape regex
    function escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // Show system message (temporary)
    function showSystemMessage(text) {
        const msg = document.createElement('div');
        msg.className = 'system-message';
        msg.textContent = text;
        msg.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--dark-color);
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            z-index: 10000;
            animation: fadeInOut 3s ease;
        `;
        
        document.body.appendChild(msg);
        
        setTimeout(() => {
            if (msg.parentNode) {
                msg.remove();
            }
        }, 3000);
    }

    // Make functions available globally
    window.openImageModal = openImageModal;
    window.reactToMessage = reactToMessage;
    window.replyToMessage = replyToMessage;
    window.showReactionMenu = showReactionMenu;

    // Initialize the app
    init();

    // Add CSS for animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeInOut {
            0%, 100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
            10%, 90% { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        .fa-spinner { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
    `;
    document.head.appendChild(style);
});
