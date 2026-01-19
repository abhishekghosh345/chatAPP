// script.js - Complete with all features working (updated: auto-join & delete-fix)
console.log("✅ script.js is loading!");

document.addEventListener('DOMContentLoaded', function() {
    console.log("✅ DOM is ready!");
    
    // ==================== DOM ELEMENTS ====================
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
    const chatTitle = document.getElementById('chat-title');
    const backToRoomBtn = document.getElementById('back-to-room-btn');
    
    // Feature elements
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
    
    // Delete modal elements
    const deleteModal = document.getElementById('delete-modal');
    const cancelDeleteBtn = document.getElementById('cancel-delete');
    const confirmDeleteBtn = document.getElementById('confirm-delete');

    // Create room modal elements
    const createRoomModal = document.getElementById('create-room-modal');
    const createRoomBtn = document.getElementById('create-room-btn');
    const cancelCreateRoomBtn = document.getElementById('cancel-create-room');
    const confirmCreateRoomBtn = document.getElementById('confirm-create-room');
    const roomNameInput = document.getElementById('room-name');
    const membersSelection = document.getElementById('members-selection');
    const chatroomsList = document.getElementById('chatrooms-list');

    // Room details panel elements
    const roomDetailsPanel = document.getElementById('room-details-panel');
    const closeRoomDetailsBtn = document.getElementById('close-room-details');
    const roomMembersContainer = document.getElementById('room-members-container');
    const leaveRoomBtn = document.getElementById('leave-room-btn');
    
    // ==================== VARIABLES ====================
    let socket;
    let currentUsername = '';
    let currentUserId = null;
    let typingTimeout;
    let isConnected = false;
    let messageToReply = null;
    let selectedImage = null;
    let lastMessageDate = null;
    let messageToDelete = null;
    let messageReactions = new Map(); // messageId -> {reaction: [usernames]}
    let hasAutoJoined = false; // to avoid duplicate auto-joins
    let currentPrivateUser = null; // null for room chat, userId for private chat
    let privateMessages = new Map(); // userId -> [messages]
    let chatrooms = new Map(); // roomId -> {name, members: [], messages: []}
    let currentRoomId = null; // null for main room, roomId for chatroom
    let users = new Map(); // socket.id -> user info
    
    // Emoji data
    const emojiCategoriesData = [
        { 
            name: 'Smileys', 
            emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛']
        },
        { 
            name: 'People', 
            emojis: ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊']
        },
        { 
            name: 'Animals', 
            emojis: ['🐵', '🐒', '🦍', '🦧', '🐶', '🐕', '🦮', '🐕‍🦺', '🐩', '🐺', '🦊', '🦝', '🐱', '🐈', '🐈‍⬛', '🦁', '🐯', '🐅', '🐆', '🐴', '🐎']
        },
        { 
            name: 'Food', 
            emojis: ['🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦']
        },
        { 
            name: 'Symbols', 
            emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝']
        }
    ];
    
    // ==================== SESSION MANAGEMENT ====================
    
    function saveUserSession(username, userId) {
        localStorage.setItem('chat_username', username);
        localStorage.setItem('chat_userId', userId);
        localStorage.setItem('chat_session_time', Date.now().toString());
        console.log('Session saved for:', username);
    }
    
    function loadUserSession() {
        const username = localStorage.getItem('chat_username');
        const userId = localStorage.getItem('chat_userId');
        const sessionTime = localStorage.getItem('chat_session_time');
        
        if (username && userId && sessionTime) {
            const sessionAge = Date.now() - parseInt(sessionTime);
            if (sessionAge < 24 * 60 * 60 * 1000) { // 24 hours
                return { username, userId };
            } else {
                clearUserSession();
            }
        }
        return null;
    }
    
    function clearUserSession() {
        localStorage.removeItem('chat_username');
        localStorage.removeItem('chat_userId');
        localStorage.removeItem('chat_session_time');
        console.log('Session cleared');
    }
    
    // ==================== UTILITY FUNCTIONS ====================
    
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    function showError(message) {
        if (usernameError) {
            usernameError.textContent = message;
            usernameError.classList.add('show');
        }
    }
    
    function clearError() {
        if (usernameError) {
            usernameError.textContent = '';
            usernameError.classList.remove('show');
        }
    }
    
    function showSystemMessage(text) {
        const msg = document.createElement('div');
        msg.className = 'system-message';
        msg.textContent = text;
        if (messagesContainer) {
            messagesContainer.appendChild(msg);
            scrollToBottom();
        }
    }
    
    function scrollToBottom() {
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }
    
    function formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) return 'Just now';
        
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        
        if (date.toDateString() === now.toDateString()) {
            if (diffMins < 1) return 'Just now';
            if (diffMins < 60) return `${diffMins}m ago`;
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        if (date.toDateString() === yesterday.toDateString()) {
            return `Yesterday ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        }
        
        return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
    
    function disableJoinButton() {
        if (joinBtn) {
            joinBtn.disabled = true;
            joinBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connecting...';
        }
    }
    
    function enableJoinButton() {
        if (joinBtn) {
            joinBtn.disabled = false;
            joinBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Join Chat';
        }
    }
    
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
    
    function updateOnlineCount(count) {
        if (onlineCountSpan) {
            onlineCountSpan.textContent = count;
        }
    }

    // ==================== THEME FUNCTIONS ====================

    function initTheme() {
        const savedTheme = localStorage.getItem('chat-theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeButton(savedTheme);
    }

    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('chat-theme', newTheme);
        updateThemeButton(newTheme);
    }

    function updateThemeButton(theme) {
        const themeBtn = document.getElementById('theme-toggle');
        if (themeBtn) {
            const icon = themeBtn.querySelector('i');
            if (theme === 'dark') {
                icon.className = 'fas fa-sun';
                themeBtn.title = 'Switch to light mode';
            } else {
                icon.className = 'fas fa-moon';
                themeBtn.title = 'Switch to dark mode';
            }
        }
    }

    // ==================== NOTIFICATION FUNCTIONS ====================

    function requestNotificationPermission() {
        if ('Notification' in window) {
            if (Notification.permission === 'default') {
                Notification.requestPermission();
            }
        }
    }

    function showNotification(title, body, icon = '/favicon.ico') {
        if ('Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification(title, {
                body: body,
                icon: icon,
                tag: 'chat-message' // Prevents duplicate notifications
            });

            // Auto-close after 5 seconds
            setTimeout(() => {
                notification.close();
            }, 5000);

            // Click to focus window
            notification.onclick = () => {
                window.focus();
                notification.close();
            };
        }
    }

    // ==================== PRIVATE CHAT FUNCTIONS ====================

    function switchToPrivateChat(userId, username) {
        currentPrivateUser = userId;
        if (chatTitle) {
            chatTitle.innerHTML = `<i class="fas fa-user"></i> Private Chat with ${escapeHtml(username)}`;
        }
        if (backToRoomBtn) {
            backToRoomBtn.classList.remove('hidden');
        }
        // Clear current messages and load private messages
        if (messagesContainer) {
            messagesContainer.innerHTML = '';
        }
        messageReactions.clear();
        // Load private messages for this user
        const msgs = privateMessages.get(userId) || [];
        msgs.forEach(msg => {
            addMessage(msg, msg.username === currentUsername);
        });
        scrollToBottom();
    }

    function switchToRoomChat() {
        currentPrivateUser = null;
        currentRoomId = null;
        if (chatTitle) {
            chatTitle.innerHTML = `<i class="fas fa-comments"></i> Chat Room`;
        }
        if (backToRoomBtn) {
            backToRoomBtn.classList.add('hidden');
        }
        // Clear messages and load room history
        if (messagesContainer) {
            messagesContainer.innerHTML = '';
        }
        messageReactions.clear();
        // Request room history from server
        if (socket && isConnected) {
            socket.emit('request-room-history');
        }
    }

    function switchToChatroom(roomId) {
        const room = chatrooms.get(roomId);
        if (!room) return;

        currentPrivateUser = null;
        currentRoomId = roomId;
        if (chatTitle) {
            chatTitle.innerHTML = `<i class="fas fa-comments"></i> ${escapeHtml(room.name)}`;
        }
        if (backToRoomBtn) {
            backToRoomBtn.classList.remove('hidden');
        }
        // Clear messages and load room messages
        if (messagesContainer) {
            messagesContainer.innerHTML = '';
        }
        messageReactions.clear();
        // Load room messages
        room.messages.forEach(msg => {
            addMessage(msg, msg.username === currentUsername);
        });
        scrollToBottom();
    }

    function updateChatroomsList() {
        if (!chatroomsList) return;

        chatroomsList.innerHTML = '';

        chatrooms.forEach((room, roomId) => {
            const roomDiv = document.createElement('div');
            roomDiv.className = `room-item ${currentRoomId === roomId ? 'active' : ''}`;
            roomDiv.dataset.roomId = roomId;

            const initials = room.name.substring(0, 2).toUpperCase();
            roomDiv.innerHTML = `
                <div class="room-avatar">${initials}</div>
                <div class="room-info">
                    <div class="room-name">${escapeHtml(room.name)}</div>
                    <div class="room-members">${room.members.length} members</div>
                </div>
            `;

            roomDiv.addEventListener('click', () => switchToChatroom(roomId));
            chatroomsList.appendChild(roomDiv);
        });
    }

    function showCreateRoomModal() {
        if (!createRoomModal || !membersSelection) return;

        // Populate members selection
        membersSelection.innerHTML = '';
        const availableUsers = Array.from(users.values()).filter(u => u.username !== currentUsername);

        if (availableUsers.length === 0) {
            membersSelection.innerHTML = '<div style="text-align: center; color: var(--secondary-color); padding: 20px;">No other users online</div>';
        } else {
            availableUsers.forEach(user => {
                const memberDiv = document.createElement('div');
                memberDiv.className = 'member-option';

                const initials = user.username.substring(0, 2).toUpperCase();
                memberDiv.innerHTML = `
                    <input type="checkbox" value="${user.userId}" id="member-${user.userId}">
                    <label for="member-${user.userId}" style="display: flex; align-items: center; gap: 10px; cursor: pointer; flex: 1;">
                        <div class="member-avatar">${initials}</div>
                        <span>${escapeHtml(user.username)}</span>
                    </label>
                `;

                // Make the whole div clickable
                memberDiv.addEventListener('click', (e) => {
                    if (e.target.type !== 'checkbox') {
                        const checkbox = memberDiv.querySelector('input[type="checkbox"]');
                        checkbox.checked = !checkbox.checked;
                        memberDiv.classList.toggle('selected', checkbox.checked);
                    }
                });

                const checkbox = memberDiv.querySelector('input[type="checkbox"]');
                checkbox.addEventListener('change', () => {
                    memberDiv.classList.toggle('selected', checkbox.checked);
                });

                membersSelection.appendChild(memberDiv);
            });
        }

        createRoomModal.classList.remove('hidden');
        if (roomNameInput) roomNameInput.focus();
    }

    function hideCreateRoomModal() {
        if (!createRoomModal) return;
        createRoomModal.classList.add('hidden');
        if (roomNameInput) roomNameInput.value = '';
    }

    function createChatroom() {
        const roomName = roomNameInput ? roomNameInput.value.trim() : '';
        if (!roomName) {
            showSystemMessage('Please enter a room name');
            return;
        }

        const selectedMembers = Array.from(membersSelection.querySelectorAll('input[type="checkbox"]:checked'))
            .map(cb => cb.value);

        if (selectedMembers.length === 0) {
            showSystemMessage('Please select at least one member');
            return;
        }

        // Include current user
        selectedMembers.push(currentUserId);

        if (socket && isConnected) {
            socket.emit('create-room', {
                name: roomName,
                members: selectedMembers
            });
        }

        hideCreateRoomModal();
    }

    function showRoomDetails() {
        if (!roomDetailsPanel || !currentRoomId) return;

        const room = chatrooms.get(currentRoomId);
        if (!room) return;

        // Populate room members
        if (roomMembersContainer) {
            roomMembersContainer.innerHTML = '';

            room.members.forEach(memberId => {
                const member = users.get(memberId);
                if (member) {
                    const memberDiv = document.createElement('div');
                    memberDiv.className = 'room-member-item';

                    const initials = member.username.substring(0, 2).toUpperCase();
                    const isOnline = Array.from(users.values()).some(u => u.userId === memberId);

                    memberDiv.innerHTML = `
                        <div class="room-member-avatar">${initials}</div>
                        <div class="room-member-info">
                            <div class="room-member-name">${escapeHtml(member.username)}</div>
                            <div class="room-member-role">${memberId === currentUserId ? 'You' : 'Member'}</div>
                        </div>
                        <div class="room-member-online ${isOnline ? '' : 'room-member-offline'}">
                            ${isOnline ? 'Online' : 'Offline'}
                        </div>
                    `;

                    roomMembersContainer.appendChild(memberDiv);
                }
            });
        }

        roomDetailsPanel.classList.add('show');
    }

    function hideRoomDetails() {
        if (!roomDetailsPanel) return;
        roomDetailsPanel.classList.remove('show');
    }

    function leaveRoom() {
        if (!currentRoomId) return;

        if (socket && isConnected) {
            socket.emit('leave-room', { roomId: currentRoomId });
        }

        // Switch back to main room
        switchToRoomChat();
        hideRoomDetails();

        showSystemMessage('You left the room');
    }
    
    // ==================== VALIDATION FUNCTIONS ====================
    
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
        
        return true;
    }
    
    function handleUsernameInput() {
        clearError();
        const username = usernameInput ? usernameInput.value.trim() : '';
        if (joinBtn) {
            joinBtn.disabled = username.length < 3;
        }
    }
    
    // ==================== EMOJI PICKER FUNCTIONS ====================
    
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
        
        // Setup search
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
    
    function searchEmojis(searchTerm) {
        if (!emojiGrid) return;
        
        emojiGrid.innerHTML = '';
        const allEmojis = emojiCategoriesData.flatMap(category => category.emojis);
        
        const filteredEmojis = allEmojis.filter(emoji => {
            return emoji.includes(searchTerm);
        }).slice(0, 64);
        
        filteredEmojis.forEach(emoji => {
            const btn = document.createElement('button');
            btn.className = 'emoji-btn';
            btn.textContent = emoji;
            btn.addEventListener('click', () => insertEmoji(emoji));
            emojiGrid.appendChild(btn);
        });
    }
    
function insertEmoji(emoji) {
    if (!messageInput) return;

    messageInput.value += emoji;
    messageInput.focus();

    if (emojiPicker) {
        emojiPicker.classList.add('hidden');
    }
}
    
    function toggleEmojiPicker() {
        if (!emojiPicker) return;

        emojiPicker.classList.toggle('show');

        if (emojiPicker.classList.contains('show') && emojiSearch) {
            emojiSearch.focus();
        }
    }
    
    // ==================== IMAGE FUNCTIONS ====================
    
    function initImageInput() {
        const imageInput = document.createElement('input');
        imageInput.type = 'file';
        imageInput.accept = 'image/*';
        imageInput.style.position = 'absolute';
        imageInput.style.left = '-9999px';
        imageInput.style.top = '-9999px';
        imageInput.style.opacity = '0';
        imageInput.addEventListener('change', handleImageSelect);
        document.body.appendChild(imageInput);
        window.imageInput = imageInput;
    }
    
    function triggerImageUpload() {
        if (window.imageInput) {
            window.imageInput.click();
        }
    }
    
    function handleImageSelect(e) {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            showSystemMessage('Image size should be less than 5MB');
            return;
        }

        if (!file.type.startsWith('image/')) {
            showSystemMessage('Please select an image file');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                // Compress image
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // Calculate new size, max 800px width or height
                let { width, height } = img;
                const maxSize = 800;
                if (width > height) {
                    if (width > maxSize) {
                        height = (height * maxSize) / width;
                        width = maxSize;
                    }
                } else {
                    if (height > maxSize) {
                        width = (width * maxSize) / height;
                        height = maxSize;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);

                // Compress to JPEG with 80% quality
                const compressedData = canvas.toDataURL('image/jpeg', 0.8);

                selectedImage = {
                    data: compressedData,
                    name: file.name,
                    type: 'image/jpeg'
                };

                if (previewImage) {
                    previewImage.src = selectedImage.data;
                }
                if (imagePreview) {
                    imagePreview.classList.remove('hidden');
                }
            };
            img.src = event.target.result;
        };

        reader.readAsDataURL(file);
    }
    
    function removeImage() {
        selectedImage = null;
        if (imagePreview) {
            imagePreview.classList.add('hidden');
        }
        if (window.imageInput) {
            window.imageInput.value = '';
        }
    }
    
    function openImageModal(imageSrc) {
        if (!imageModal || !modalImage) return;
        
        modalImage.src = imageSrc;
        imageModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
    
    function closeImageModal() {
        if (!imageModal) return;
        
        imageModal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }
    
    // ==================== REPLY FUNCTIONS ====================
    
    function replyToMessage(messageId) {
        const messageElement = messagesContainer.querySelector(`[data-message-id="${messageId}"]`);
        if (!messageElement) return;
        
        const username = messageElement.querySelector('.message-username').textContent;
        const messageContent = messageElement.querySelector('.message-content').textContent.substring(0, 50);
        
        messageToReply = {
            id: messageId,
            username: username,
            content: messageContent
        };
        
        updateReplyPreview();
        if (messageInput) messageInput.focus();
        
        messageElement.classList.add('selected');
        setTimeout(() => {
            messageElement.classList.remove('selected');
        }, 2000);
    }
    
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
    
    function cancelReply() {
        messageToReply = null;
        updateReplyPreview();
    }
    
    // ==================== DELETE FUNCTIONS ====================
    
    function showDeleteModal(messageId) {
        if (!deleteModal) return;
        
        messageToDelete = messageId;
        deleteModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
    
    function hideDeleteModal() {
        if (!deleteModal) return;
        
        deleteModal.classList.add('hidden');
        messageToDelete = null;
        document.body.style.overflow = 'auto';
    }
    
    function deleteMessage() {
        if (!messageToDelete) return;
        
        console.log('Deleting message:', messageToDelete);
        
        const messageElement = messagesContainer ? messagesContainer.querySelector(`[data-message-id="${messageToDelete}"]`) : null;
        
        // If connected, ask server to delete. If not connected, do a local (optimistic) delete so UX isn't blocked.
        if (socket && isConnected) {
            // Emit delete request to server - server should validate authorization
            socket.emit('delete-message', { messageId: messageToDelete });
            // Optionally, you could optimistically remove message immediately:
            // if (messageElement) { messageElement.remove(); messageReactions.delete(messageToDelete); }
        } else {
            if (messageElement) {
                messageElement.remove();
                messageReactions.delete(messageToDelete);
                showSystemMessage('Message deleted (offline). It will be synced when reconnected.');
            } else {
                showSystemMessage('Message removed locally.');
            }
        }
        
        hideDeleteModal();
    }
    
    // ==================== REACTION FUNCTIONS ====================
    
    function showReactionMenu(messageId, event) {
    console.log('Showing reaction menu for message:', messageId);
    
    // Close any existing reaction menu first
    closeAllReactionMenus();
    
    const reactionEmojis = ['👍', '❤️', '😂', '😮', '😢', '😠'];
    const menu = document.createElement('div');
    menu.id = 'reaction-menu-' + Date.now(); // Unique ID
    menu.className = 'reaction-menu';
    menu.style.cssText = `
        position: fixed;
        background: white;
        border-radius: 24px;
        padding: 8px;
        display: flex;
        gap: 6px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.2);
        z-index: 10000;
        border: 1px solid #e0e0e0;
    `;
    
    // Create reaction buttons
    reactionEmojis.forEach(emoji => {
        const btn = document.createElement('button');
        btn.textContent = emoji;
        btn.style.cssText = `
            font-size: 24px;
            border: none;
            background: none;
            cursor: pointer;
            padding: 8px;
            border-radius: 50%;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 40px;
        `;
        
        btn.addEventListener('mouseover', () => {
            btn.style.transform = 'scale(1.3)';
            btn.style.background = '#f0f0f0';
        });
        
        btn.addEventListener('mouseout', () => {
            btn.style.transform = 'scale(1)';
            btn.style.background = 'none';
        });
        
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log('Reaction clicked:', emoji, 'for message:', messageId);
            
            // Send reaction to server
            if (socket && isConnected) {
                socket.emit('message-reaction', {
                    messageId: messageId,
                    reaction: emoji
                });
            } else {
                // Local optimistic toggle if offline
                const existing = messageReactions.get(messageId) || {};
                const users = existing[emoji] || [];
                const idx = users.indexOf(currentUsername);
                if (idx === -1) users.push(currentUsername);
                else users.splice(idx, 1);
                existing[emoji] = users;
                messageReactions.set(messageId, existing);
                updateMessageReaction(messageId, null, null, existing);
            }
            
            // Close this menu
            closeReactionMenu(menu);
        });
        
        menu.appendChild(btn);
    });
    
    // Position menu
    try {
        const rect = event.target.getBoundingClientRect();
        let top = rect.top - 60;
        let left = rect.left;
        
        // Adjust position if near edges
        if (top < 20) top = 20;
        if (left < 20) left = 20;
        if (left > window.innerWidth - 280) left = window.innerWidth - 280;
        
        menu.style.top = top + 'px';
        menu.style.left = left + 'px';
    } catch (error) {
        console.error('Error positioning menu:', error);
        menu.style.top = '50%';
        menu.style.left = '50%';
        menu.style.transform = 'translate(-50%, -50%)';
    }
    
    // Add to DOM
    document.body.appendChild(menu);
    
    // Set up click outside handler
    const clickOutsideHandler = (e) => {
        if (menu.parentNode && !menu.contains(e.target)) {
            // Don't close if clicking on another react button
            if (!e.target.closest('.react-btn') && !e.target.closest('.reaction')) {
                closeReactionMenu(menu);
            }
        }
    };
    
    // Set up escape key handler
    const escapeHandler = (e) => {
        if (e.key === 'Escape' && menu.parentNode) {
            closeReactionMenu(menu);
        }
    };
    
    // Add event listeners
    document.addEventListener('click', clickOutsideHandler);
    document.addEventListener('keydown', escapeHandler);
    
    // Store handlers on menu for cleanup
    menu._clickHandler = clickOutsideHandler;
    menu._escapeHandler = escapeHandler;
}

// Helper function to close a specific reaction menu
function closeReactionMenu(menu) {
    if (!menu) return;
    
    // Remove event listeners
    if (menu._clickHandler) {
        document.removeEventListener('click', menu._clickHandler);
    }
    if (menu._escapeHandler) {
        document.removeEventListener('keydown', menu._escapeHandler);
    }
    
    // Remove from DOM if still attached
    if (menu.parentNode) {
        menu.parentNode.removeChild(menu);
    }
}

// Helper function to close all reaction menus
function closeAllReactionMenus() {
    const menus = document.querySelectorAll('.reaction-menu');
    menus.forEach(menu => {
        closeReactionMenu(menu);
    });
}

// New: updateMessageReaction - updates reactions UI for a message
function updateMessageReaction(messageId, reaction, username, reactions) {
    // reactions expected as object: { emoji: [usernames] }
    if (!messagesContainer) return;
    
    // If server provided a full reactions object, use it; otherwise use stored map
    const currentReactions = reactions || messageReactions.get(messageId) || {};
    messageReactions.set(messageId, currentReactions);
    
    const messageElement = messagesContainer.querySelector(`[data-message-id="${messageId}"]`);
    if (!messageElement) return;
    
    // Find or create reactions container inside .message
    let reactionsContainer = messageElement.querySelector('.reactions-container');
    if (!reactionsContainer) {
        const messageDiv = messageElement.querySelector('.message') || messageElement;
        reactionsContainer = document.createElement('div');
        reactionsContainer.className = 'reactions-container';
        messageDiv.appendChild(reactionsContainer);
    }
    
    // Rebuild reactions markup
    reactionsContainer.innerHTML = '';
    Object.entries(currentReactions).forEach(([emojiKey, usersArray]) => {
        if (!usersArray || usersArray.length === 0) return;
        const reactionDiv = document.createElement('div');
        reactionDiv.className = 'reaction';
        reactionDiv.dataset.reaction = emojiKey;
        
        const emojiSpan = document.createElement('span');
        emojiSpan.className = 'reaction-emoji';
        emojiSpan.textContent = emojiKey;
        
        const countSpan = document.createElement('span');
        countSpan.className = 'reaction-count';
        countSpan.textContent = usersArray.length;
        
        reactionDiv.appendChild(emojiSpan);
        reactionDiv.appendChild(countSpan);
        
        // visually mark if current user reacted
        if (currentUsername && usersArray.includes(currentUsername)) {
            reactionDiv.classList.add('reacted');
        }
        
        // Clicking a reaction toggles it (sends to server if connected)
        reactionDiv.addEventListener('click', (e) => {
            e.stopPropagation();
            const emo = reactionDiv.dataset.reaction;
            if (socket && isConnected) {
                socket.emit('message-reaction', { messageId: messageId, reaction: emo });
            } else {
                // toggle locally
                const users = currentReactions[emo] || [];
                const idx = users.indexOf(currentUsername);
                if (idx === -1) users.push(currentUsername);
                else users.splice(idx, 1);
                currentReactions[emo] = users;
                messageReactions.set(messageId, currentReactions);
                updateMessageReaction(messageId, null, null, currentReactions);
            }
        });
        
        reactionsContainer.appendChild(reactionDiv);
    });
}
    
    // ==================== MESSAGE FUNCTIONS ====================
    
    function addMessage(data, isSent) {
        if (!messagesContainer) return;
        
        // Determine if this message is sent by current user.
        // Support detection by username OR userId (if server includes userId in messages).
        const sent = isSent ||
                     (data.username && currentUsername && data.username === currentUsername) ||
                     (data.userId && currentUserId && data.userId === currentUserId);
        
        const messageWrapper = document.createElement('div');
        messageWrapper.className = `message-wrapper ${sent ? 'sent' : 'received'} ${data.isPrivate ? 'private' : ''}`;
        messageWrapper.dataset.messageId = data.id;
        
        let messageHTML = `
            <div class="message ${sent ? 'sent' : 'received'}">
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
                <div class="image-message">
                    <img src="${data.imageData}" alt="Sent image" loading="lazy">
                    ${data.message ? `<div class="image-caption">${escapeHtml(data.message)}</div>` : ''}
                </div>
            `;
        } else {
            messageHTML += escapeHtml(data.message || '');
        }
        
        messageHTML += `</div>`;
        
        // Add reactions if any
        if (data.reactions && Object.keys(data.reactions).length > 0) {
            messageHTML += `<div class="reactions-container">`;
            Object.entries(data.reactions).forEach(([reaction, users]) => {
                if (users.length > 0) {
                    messageHTML += `
                        <div class="reaction" data-reaction="${reaction}">
                            <span class="reaction-emoji">${reaction}</span>
                            <span class="reaction-count">${users.length}</span>
                        </div>
                    `;
                }
            });
            messageHTML += `</div>`;
        }
        
        messageHTML += `</div>`;
        
        // Add message actions (only if not system message)
        if (data.username !== 'System') {
            messageHTML += `
                <div class="message-actions">
                    <button class="action-btn reply-btn" title="Reply">
                        <i class="fas fa-reply"></i>
                    </button>
                    <button class="action-btn react-btn" title="React">
                        <i class="fas fa-smile"></i>
                    </button>
                    ${sent ? `<button class="action-btn delete-btn" title="Delete">
                        <i class="fas fa-trash-alt"></i>
                    </button>` : ''}
                </div>
            `;
        }
        
        messageWrapper.innerHTML = messageHTML;
        messagesContainer.appendChild(messageWrapper);
        
        // Store reactions
        if (data.reactions) {
            messageReactions.set(data.id, data.reactions);
        }
        
        // Add event listeners
        if (data.username !== 'System') {
            const replyBtn = messageWrapper.querySelector('.reply-btn');
            if (replyBtn) {
                replyBtn.addEventListener('click', () => replyToMessage(data.id));
            }
            
            const reactBtn = messageWrapper.querySelector('.react-btn');
            if (reactBtn) {
                reactBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    showReactionMenu(data.id, e);
                });
            }
            
            const deleteBtn = messageWrapper.querySelector('.delete-btn');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', () => {
                    console.log('Delete button clicked for message:', data.id);
                    showDeleteModal(data.id);
                });
            }
            
            // Add click handlers for reactions
            const reactionElements = messageWrapper.querySelectorAll('.reaction');
            reactionElements.forEach(reactionEl => {
                reactionEl.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const reaction = reactionEl.dataset.reaction;
                    if (socket && isConnected) {
                        socket.emit('message-reaction', {
                            messageId: data.id,
                            reaction: reaction
                        });
                    } else {
                        // local toggle
                        const existing = messageReactions.get(data.id) || {};
                        const users = existing[reaction] || [];
                        const idx = users.indexOf(currentUsername);
                        if (idx === -1) users.push(currentUsername);
                        else users.splice(idx, 1);
                        existing[reaction] = users;
                        messageReactions.set(data.id, existing);
                        updateMessageReaction(data.id, null, null, existing);
                    }
                });
            });
        }
        
        const replyPreview = messageWrapper.querySelector('.reply-preview');
        if (replyPreview) {
            replyPreview.addEventListener('click', (e) => {
                e.stopPropagation();
                const messageId = replyPreview.dataset.replyTo;
                const targetMessage = messagesContainer.querySelector(`[data-message-id="${messageId}"]`);
                if (targetMessage) {
                    targetMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    targetMessage.classList.add('selected');
                    setTimeout(() => {
                        targetMessage.classList.remove('selected');
                    }, 2000);
                }
            });
        }
        
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
        
        scrollToBottom();
    }
    
    // ==================== USER LIST FUNCTIONS ====================
    
    function updateUsersList(users) {
        if (!usersListDiv) return;
        
        usersListDiv.innerHTML = '';
        
        if (!users || users.length === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.className = 'user-item';
            emptyMsg.innerHTML = '<i class="fas fa-user-friends"></i> <span>No other users online</span>';
            usersListDiv.appendChild(emptyMsg);
            updateOnlineCount(1);
        } else {
            // Filter out current user
            const otherUsers = users.filter(u => u.username !== currentUsername);
            
            if (otherUsers.length === 0) {
                const emptyMsg = document.createElement('div');
                emptyMsg.className = 'user-item';
                emptyMsg.innerHTML = '<i class="fas fa-user-friends"></i> <span>No other users online</span>';
                usersListDiv.appendChild(emptyMsg);
            } else {
                otherUsers.forEach(user => {
                    const userDiv = document.createElement('div');
                    userDiv.className = 'user-item';
                    
                    const joinTime = new Date(user.joinedAt || Date.now());
                    const now = new Date();
                    const diffMs = now - joinTime;
                    const diffMins = Math.floor(diffMs / 60000);
                    let onlineTime = '';
                    
                    if (diffMins < 1) onlineTime = 'Just now';
                    else if (diffMins < 60) onlineTime = `${diffMins}m ago`;
                    else if (diffMins < 1440) onlineTime = `${Math.floor(diffMins / 60)}h ago`;
                    else onlineTime = `${Math.floor(diffMins / 1440)}d ago`;
                    
                    const initials = user.username.substring(0, 2).toUpperCase();
                    userDiv.innerHTML = `
                        <div class="user-avatar">${initials}</div>
                        <div class="user-info">
                            <span class="username">${escapeHtml(user.username)}</span>
                            <small class="online-time">${onlineTime}</small>
                        </div>
                        <i class="fas fa-circle online-indicator"></i>
                    `;
                    
                    userDiv.addEventListener('click', () => {
                        // Single-click: start private chat
                        switchToPrivateChat(user.userId, user.username);
                    });
                    
                    usersListDiv.appendChild(userDiv);
                });
            }
            
            updateOnlineCount(otherUsers.length);
        }
    }
    
    // ==================== CHAT FUNCTIONS ====================
    
    function joinChat() {
        const username = usernameInput ? usernameInput.value.trim() : '';
        
        if (!validateUsername(username)) {
            return;
        }

        console.log("Joining as:", username);
        
        disableJoinButton();
        clearError();
        
        // Check for existing session
        const session = loadUserSession();
        if (session && session.username === username) {
            // Use existing session
            currentUserId = session.userId;
            console.log('Using existing session:', session);
        }
        
        if (!socket) {
            connectSocket();
        }
        
        // Give time for socket connection
        setTimeout(() => {
            if (socket && socket.connected) {
                socket.emit('user-join', username);
            } else {
                showError('Could not connect to server. Please refresh and try again.');
                enableJoinButton();
            }
        }, 500);
    }
    
    function leaveChat() {
        if (socket) {
            socket.disconnect();
        }
        
        clearUserSession();
        
        currentUsername = '';
        currentUserId = null;
        
        if (loginScreen) loginScreen.classList.remove('hidden');
        if (chatScreen) chatScreen.classList.add('hidden');
        if (messagesContainer) messagesContainer.innerHTML = '';
        if (usersListDiv) usersListDiv.innerHTML = '';
        if (typingIndicator) typingIndicator.innerHTML = '';
        if (usernameInput) {
            usernameInput.value = '';
            usernameInput.focus();
        }
        
        cancelReply();
        removeImage();
        hideDeleteModal();
        
        updateConnectionStatus(false);
        enableJoinButton();
    }
    
    function sendMessage() {
        const message = messageInput ? messageInput.value.trim() : '';

        if (!currentUsername) {
            showSystemMessage('Please join chat first');
            return;
        }

        if (!message && !selectedImage) {
            if (messageInput) messageInput.focus();
            return;
        }

    const messageData = {
      message: message,
      type: selectedImage ? 'image' : 'text',
      replyTo: messageToReply ? messageToReply.id : null,
      recipient: currentPrivateUser,
      roomId: currentRoomId,
      imageData: selectedImage ? selectedImage.data : null,
      imageName: selectedImage ? selectedImage.name : null
    };

        // Send via socket
        if (socket && isConnected) {
            if (currentRoomId) {
                // Send room message
                socket.emit('send-room-message', messageData);
            } else {
                // Send regular message
                socket.emit('send-message', messageData);
            }
        } else {
            showSystemMessage('Not connected to server');
            return;
        }

        // Clear inputs
        if (messageInput) messageInput.value = '';
        removeImage();
        cancelReply();
        if (messageInput) messageInput.focus();

        // Clear typing indicator
        if (socket && isConnected) {
            socket.emit('typing', false);
        }
    }
    
    function handleMessageKeypress(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    }
    
    function handleTyping() {
        if (!currentUsername || !isConnected) return;
        
        if (socket && isConnected) {
            socket.emit('typing', true);
            
            clearTimeout(typingTimeout);
            typingTimeout = setTimeout(() => {
                if (isConnected) {
                    socket.emit('typing', false);
                }
            }, 1000);
        }
    }
    
    // ==================== SOCKET FUNCTIONS ====================
    
    function connectSocket() {
        // Prevent multiple socket connections
        if (socket && socket.connected) return;
        
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        
        socket = io(`${protocol}//${host}`, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            timeout: 10000
        });

        // Socket event handlers
        socket.on('connect', () => {
            console.log('✅ Connected to server');
            isConnected = true;
            updateConnectionStatus(true);

            // Auto-join if we have a recent session and haven't auto-joined yet
            const session = loadUserSession();
            if (!hasAutoJoined && session && session.username) {
                console.log('Auto-joining with saved session:', session.username);
                socket.emit('user-join', session.username);
                hasAutoJoined = true;
            }
        });

        socket.on('disconnect', () => {
            console.log('❌ Disconnected');
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

        socket.on('user-joined', (data) => {
            currentUsername = data.username;
            currentUserId = data.userId;

            // Save session
            saveUserSession(currentUsername, currentUserId);

            if (currentUserSpan) {
                currentUserSpan.textContent = currentUsername;
            }
            if (loginScreen) loginScreen.classList.add('hidden');
            if (chatScreen) chatScreen.classList.remove('hidden');
            if (messageInput) messageInput.focus();

            showSystemMessage(`Welcome to the chat, ${currentUsername}! There are ${data.onlineCount || 0} users online.`);

            enableJoinButton();
        });

        socket.on('user-connected', (data) => {
            showSystemMessage(`${data.username} joined the chat`);
            if (data.userCount !== undefined) {
                updateOnlineCount(data.userCount);
            }
        });

        socket.on('user-disconnected', (data) => {
            showSystemMessage(`${data.username} left the chat`);
            if (data.userCount !== undefined) {
                updateOnlineCount(data.userCount);
            }
        });

        socket.on('users-list', (usersList) => {
            // Update local users map
            users.clear();
            usersList.forEach(user => {
                // We don't have socket.id here, but we can use userId as key for member selection
                users.set(user.userId, user);
            });
            updateUsersList(usersList);
        });

        socket.on('message-history', (history) => {
            if (!messagesContainer) return;
            
            messagesContainer.innerHTML = '';
            messageReactions.clear();
            
            if (history && history.length > 0) {
                history.forEach(msg => {
                    // Let addMessage determine sent vs received by checking username/userId
                    addMessage(msg, msg.username === currentUsername);
                });
                scrollToBottom();
            }
        });

        socket.on('receive-message', (data) => {
            // Handle room messages
            if (data.roomId) {
                const room = chatrooms.get(data.roomId);
                if (room) {
                    room.messages.push(data);
                    // Keep only last 100 messages per room
                    if (room.messages.length > 100) {
                        room.messages.shift();
                    }

                    // Show message if we're in this room
                    if (currentRoomId === data.roomId) {
                        addMessage(data, data.username === currentUsername);
                        // Show notification if not sent by current user and window not focused
                        if (data.username !== currentUsername && !document.hasFocus()) {
                            showNotification(`New message in ${room.name}`, data.message.substring(0, 100), '/favicon.ico');
                        }
                    }
                }
                return;
            }

            // Store private messages
            if (data.isPrivate) {
                const otherUserId = data.username === currentUsername ? data.recipient : data.userId;
                if (!privateMessages.has(otherUserId)) {
                    privateMessages.set(otherUserId, []);
                }
                privateMessages.get(otherUserId).push(data);
                // Keep only last 100 private messages per user
                const msgs = privateMessages.get(otherUserId);
                if (msgs.length > 100) {
                    msgs.shift();
                }
            }
            // Only show message if it's for current chat mode
            let messageShown = false;
            if (data.isPrivate) {
                // Private message - show only if it's for the current private chat
                if (data.username === currentUsername || data.recipient === currentUserId) {
                    const otherUserId = data.username === currentUsername ? data.recipient : data.userId;
                    if (currentPrivateUser === otherUserId) {
                        addMessage(data, data.username === currentUsername);
                        messageShown = true;
                    }
                }
            } else if (currentPrivateUser === null && currentRoomId === null) {
                // Main room message only in main room mode
                addMessage(data, data.username === currentUsername);
                messageShown = true;
            }

            // Show notification if message was shown and not sent by current user
            if (messageShown && data.username !== currentUsername && !document.hasFocus()) {
                const title = data.isPrivate ? `Private message from ${data.username}` : `New message from ${data.username}`;
                const body = data.type === 'image' ? 'Sent an image' : data.message.substring(0, 100);
                showNotification(title, body);
            }
        });

        socket.on('user-typing', (data) => {
            if (!typingIndicator) return;
            
            if (data.isTyping && data.username !== currentUsername) {
                typingIndicator.innerHTML = `${data.username} is typing <span class="typing-dots"><span>.</span><span>.</span><span>.</span></span>`;
            } else {
                typingIndicator.innerHTML = '';
            }
        });

        socket.on('message-deleted', (data) => {
            const messageElement = messagesContainer.querySelector(`[data-message-id="${data.messageId}"]`);
            if (messageElement) {
                messageElement.remove();
                messageReactions.delete(data.messageId);
                showSystemMessage(`Message deleted by ${data.deletedBy}`);
            }
        });

        socket.on('update-reaction', (data) => {
            updateMessageReaction(data.messageId, data.reaction, data.username, data.reactions);
        });

        socket.on('room-created', (data) => {
            // Add room to local storage
            chatrooms.set(data.roomId, {
                name: data.name,
                members: data.members,
                messages: []
            });
            updateChatroomsList();
            showSystemMessage(`Chatroom "${data.name}" created successfully!`);
        });

        socket.on('room-message', (data) => {
            // Add message to room
            const room = chatrooms.get(data.roomId);
            if (room) {
                room.messages.push(data);
                // Keep only last 100 messages per room
                if (room.messages.length > 100) {
                    room.messages.shift();
                }

                // Show message if we're in this room
                if (currentRoomId === data.roomId) {
                    addMessage(data, data.username === currentUsername);
                } else {
                    // Show notification for room messages
                    if (data.username !== currentUsername && !document.hasFocus()) {
                        showNotification(`New message in ${room.name}`, data.message.substring(0, 100), '/favicon.ico');
                    }
                }
            }
        });

        socket.on('rooms-list', (rooms) => {
            // Update local rooms list
            chatrooms.clear();
            rooms.forEach(room => {
                chatrooms.set(room.id, {
                    name: room.name,
                    members: room.members,
                    messages: room.messages || []
                });
            });
            updateChatroomsList();
        });
    }
    
    // ==================== EVENT LISTENERS ====================
    
    function setupEventListeners() {
        // Login events
        if (joinBtn) {
            joinBtn.addEventListener('click', joinChat);
        }
        
        if (usernameInput) {
            usernameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') joinChat();
            });
            usernameInput.addEventListener('input', handleUsernameInput);
        }
        
        // Chat events
        if (leaveBtn) leaveBtn.addEventListener('click', leaveChat);
        if (sendBtn) sendBtn.addEventListener('click', sendMessage);
        if (backToRoomBtn) backToRoomBtn.addEventListener('click', switchToRoomChat);

        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', toggleTheme);
        }
        
        if (messageInput) {
            messageInput.addEventListener('keypress', handleMessageKeypress);
            messageInput.addEventListener('input', handleTyping);
        }
        
        // Feature events
        if (emojiBtn) {
            emojiBtn.addEventListener('click', toggleEmojiPicker);
        }
        
        if (imageBtn) imageBtn.addEventListener('click', triggerImageUpload);
        if (cancelReplyBtn) cancelReplyBtn.addEventListener('click', cancelReply);
        if (removeImageBtn) removeImageBtn.addEventListener('click', removeImage);
        if (closeModalBtn) closeModalBtn.addEventListener('click', closeImageModal);
        
        // Delete modal events
        if (cancelDeleteBtn) {
            cancelDeleteBtn.addEventListener('click', hideDeleteModal);
        }

        if (confirmDeleteBtn) {
            confirmDeleteBtn.addEventListener('click', deleteMessage);
        }

        // Create room modal events
        if (createRoomBtn) {
            createRoomBtn.addEventListener('click', showCreateRoomModal);
        }

        if (cancelCreateRoomBtn) {
            cancelCreateRoomBtn.addEventListener('click', hideCreateRoomModal);
        }

        if (confirmCreateRoomBtn) {
            confirmCreateRoomBtn.addEventListener('click', createChatroom);
        }

        if (roomNameInput) {
            roomNameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') createChatroom();
            });
        }

        // Room details panel events
        if (chatTitle) {
            chatTitle.addEventListener('click', () => {
                if (currentRoomId) {
                    showRoomDetails();
                }
            });
        }

        if (closeRoomDetailsBtn) {
            closeRoomDetailsBtn.addEventListener('click', hideRoomDetails);
        }

        if (leaveRoomBtn) {
            leaveRoomBtn.addEventListener('click', leaveRoom);
        }
        
        // Close modals on click outside
        document.addEventListener('click', (e) => {
            if (emojiPicker && !emojiPicker.contains(e.target) && e.target !== emojiBtn && emojiPicker.classList.contains('show')) {
                emojiPicker.classList.remove('show');
            }

            if (deleteModal && !deleteModal.contains(e.target) && !deleteModal.classList.contains('hidden')) {
                hideDeleteModal();
            }

            if (imageModal && !imageModal.contains(e.target) && e.target !== modalImage && !imageModal.classList.contains('hidden')) {
                closeImageModal();
            }

            if (roomDetailsPanel && !roomDetailsPanel.contains(e.target) && roomDetailsPanel.classList.contains('show') && e.target !== chatTitle && !chatTitle.contains(e.target)) {
                hideRoomDetails();
            }
        });
        
        // Escape key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (emojiPicker && emojiPicker.classList.contains('show')) {
                    emojiPicker.classList.remove('show');
                }
                if (deleteModal && !deleteModal.classList.contains('hidden')) {
                    hideDeleteModal();
                }
                if (imageModal && !imageModal.classList.contains('hidden')) {
                    closeImageModal();
                }
                if (roomDetailsPanel && roomDetailsPanel.classList.contains('show')) {
                    hideRoomDetails();
                }
            }
        });
    }
    
    // ==================== INITIALIZATION ====================
    
    function init() {
        console.log("Initializing app...");
        
        // Try to auto-login if session exists
        const session = loadUserSession();
        if (session) {
            console.log("Found existing session for:", session.username);
            if (usernameInput) {
                usernameInput.value = session.username;
                usernameInput.dispatchEvent(new Event('input'));
            }
        }
        
        setupEventListeners();
        initEmojiPicker();
        initImageInput();
        
        if (usernameInput) usernameInput.focus();
        
        // Connect socket early so we can auto-rejoin if session exists
        connectSocket();
        
        // Add CSS animations
        const style = document.createElement('style');
        style.textContent = `
            .hidden { display: none !important; }
            .show { display: block !important; }
            .fa-spinner { animation: spin 1s linear infinite; }
            @keyframes spin { 100% { transform: rotate(360deg); } }
            .connected i { color: #28a745 !important; }
            .disconnected i { color: #dc3545 !important; }
            .typing-dots { display: inline-flex; gap: 2px; margin-left: 4px; }
            .typing-dots span { width: 4px; height: 4px; background: #65676b; border-radius: 50%; animation: typing 1.4s infinite; }
            .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
            .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
            @keyframes typing { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
            .reaction.reacted { box-shadow: 0 0 0 2px rgba(0,0,0,0.04); background: rgba(0,0,0,0.03); border-radius: 12px; }
        `;
        document.head.appendChild(style);
        
        console.log("✅ App initialized successfully!");
    }
    
    // Start the app
    init();
    initTheme();
    requestNotificationPermission();
});

// Global error handler
window.addEventListener('error', function(e) {
    console.error('Global error:', e.message, 'at', e.filename, ':', e.lineno);
});

// Make functions available globally
window.openImageModal = function(imageSrc) {
    document.getElementById('modal-image').src = imageSrc;
    document.getElementById('image-modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
};

console.log("📄 script.js file loaded successfully!");
