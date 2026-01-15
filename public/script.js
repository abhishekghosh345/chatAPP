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
    
    // New Elements for features - with null checks
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

    // ... (keep all other variable declarations and emoji data)

    // Initialize
    function init() {
        setupEventListeners();
        initEmojiPicker();
        initImageInput();
        usernameInput.focus();
        updateConnectionStatus(false);
    }

    // Setup event listeners with null checks
    function setupEventListeners() {
        // Login events
        if (joinBtn) joinBtn.addEventListener('click', joinChat);
        if (usernameInput) {
            usernameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') joinChat();
            });
            usernameInput.addEventListener('input', handleUsernameInput);
        }

        // Chat events
        if (leaveBtn) leaveBtn.addEventListener('click', leaveChat);
        if (sendBtn) sendBtn.addEventListener('click', sendMessage);
        if (messageInput) {
            messageInput.addEventListener('keypress', handleMessageKeypress);
            messageInput.addEventListener('input', handleTyping);
        }
        
        // Feature events - only add listeners if elements exist
        if (emojiBtn) emojiBtn.addEventListener('click', toggleEmojiPicker);
        if (imageBtn) imageBtn.addEventListener('click', triggerImageUpload);
        if (cancelReplyBtn) cancelReplyBtn.addEventListener('click', cancelReply);
        if (removeImageBtn) removeImageBtn.addEventListener('click', removeImage);
        if (closeModalBtn) closeModalBtn.addEventListener('click', closeImageModal);
        
        // Click outside emoji picker to close
        if (emojiPicker) {
            document.addEventListener('click', (e) => {
                if (!emojiPicker.contains(e.target) && e.target !== emojiBtn && emojiPicker.classList.contains('show')) {
                    emojiPicker.classList.remove('show');
                }
            });
        }
        
        // Image modal close on click outside
        if (imageModal) {
            imageModal.addEventListener('click', (e) => {
                if (e.target === imageModal) {
                    closeImageModal();
                }
            });
        }
        
        // Escape key to close modal and emoji picker
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeImageModal();
                if (emojiPicker && emojiPicker.classList.contains('show')) {
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

    // Initialize emoji picker with null check
    function initEmojiPicker() {
        if (!emojiCategories || !emojiGrid) return;
        
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
        if (emojiSearch) {
            emojiSearch.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                if (searchTerm) {
                    searchEmojis(searchTerm);
                } else {
                    const activeCategory = document.querySelector('.emoji-category-btn.active');
                    if (activeCategory) {
                        loadEmojiCategory(parseInt(activeCategory.dataset.category));
                    }
                }
            });
        }
    }

    // Load emoji category
    function loadEmojiCategory(categoryIndex) {
        if (!emojiGrid) return;
        
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
        const activeBtn = document.querySelector(`[data-category="${categoryIndex}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
            loadEmojiCategory(categoryIndex);
        }
    }

    // Search emojis
    function searchEmojis(searchTerm) {
        if (!emojiGrid) return;
        
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
        if (!messageInput) return;
        
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
        if (emojiPicker) {
            emojiPicker.classList.remove('show');
        }
    }

    // Toggle emoji picker
    function toggleEmojiPicker() {
        if (!emojiPicker) return;
        
        emojiPicker.classList.toggle('show');
        if (emojiPicker.classList.contains('show') && emojiSearch) {
            emojiSearch.focus();
        }
    }

    // Initialize image input
    function initImageInput() {
        const imageInput = document.createElement('input');
        imageInput.type = 'file';
        imageInput.accept = 'image/*';
        imageInput.style.display = 'none';
        imageInput.addEventListener('change', handleImageSelect);
        document.body.appendChild(imageInput);
        
        // Store reference
        window.imageInput = imageInput;
    }

    // Trigger image upload
    function triggerImageUpload() {
        if (window.imageInput) {
            window.imageInput.click();
        }
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
            
            if (previewImage) {
                previewImage.src = selectedImage.data;
            }
            if (imagePreview) {
                imagePreview.classList.add('show');
            }
            
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
        if (imagePreview) {
            imagePreview.classList.remove('show');
        }
        if (window.imageInput) {
            window.imageInput.value = '';
        }
    }

    // Open image in modal
    function openImageModal(imageSrc) {
        if (!imageModal || !modalImage) return;
        
        modalImage.src = imageSrc;
        imageModal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    // Close image modal
    function closeImageModal() {
        if (!imageModal) return;
        
        imageModal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }

    // Update reply preview in input area
    function updateReplyPreview() {
        if (!replyToContainer || !replyToInfo) return;
        
        if (messageToReply) {
            replyToContainer.classList.remove('hidden');
            replyToInfo.innerHTML = `
                <div class="reply-to-sender">Replying to ${escapeHtml(messageToReply.username)}</div>
                <div class="reply-to-content">${escapeHtml(messageToReply.content)}</div>
            `;
        } else {
            replyToContainer.classList.add('hidden');
        }
    }

    // Cancel reply
    function cancelReply() {
        messageToReply = null;
        updateReplyPreview();
    }

    // ... (keep all other functions as they are, just add null checks where needed)

    // Format timestamp to local time
    function formatTimestamp(timestamp) {
        // If timestamp is already a Date object or number
        const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
        if (isNaN(date.getTime())) {
            return 'Just now';
        }
        
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

    // Connect to WebSocket server - Fixed version
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
            // Don't show error here - it might be temporary
        });

        socket.on('username-taken', () => {
            showError('Username is already taken. Please choose another.');
            enableJoinButton();
        });

        socket.on('user-joined', (username) => {
            currentUsername = username;
            if (currentUserSpan) {
                currentUserSpan.textContent = username;
            }
            if (loginScreen) loginScreen.classList.add('hidden');
            if (chatScreen) chatScreen.classList.remove('hidden');
            if (messageInput) {
                messageInput.focus();
            }
            
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
            if (!messagesContainer) return;
            
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
            if (!typingIndicator) return;
            
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
        if (!connectionStatus) return;
        
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

    // Join chat - Fixed with better error handling
    function joinChat() {
        const username = usernameInput ? usernameInput.value.trim() : '';
        
        if (!validateUsername(username)) {
            return;
        }

        disableJoinButton();
        clearError();
        
        if (!socket) {
            connectSocket();
        }
        
        // Give socket.io time to establish connection
        setTimeout(() => {
            if (socket && socket.connected) {
                socket.emit('user-join', username);
            } else {
                showError('Could not connect to server. Please refresh and try again.');
                enableJoinButton();
                // Try to reconnect
                if (socket) {
                    socket.connect();
                }
            }
        }, 500);
    }

    // ... (keep all other functions with proper null checks)

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
        .hidden { display: none !important; }
    `;
    document.head.appendChild(style);
});
