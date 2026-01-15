// script.js - Complete with emoji picker, delete functionality, and session persistence
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
    let reconnectAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 5;
    
    // Emoji data
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
            name: 'Symbols', 
            emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❤️‍🔥', '❤️‍🩹', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳', '🈶', '🈚', '🈸', '🈺', '🈷️', '✴️', '🆚', '💮', '🉐', '㊙️', '㊗️', '🈴', '🈵', '🈹', '🈲', '🅰️', '🅱️', '🆎', '🆑', '🅾️', '🆘', '❌', '⭕', '🛑', '⛔', '📛', '🚫', '💯', '💢', '♨️', '🚷', '🚯', '🚳', '🚱', '🔞', '📵', '🚭'] 
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
            console.log("Error shown:", message);
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
        if (!emojiCategories || !emojiGrid) {
            console.log("Emoji picker elements not found");
            return;
        }
        
        console.log("Initializing emoji picker...");
        
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
        
        console.log("Emoji picker initialized");
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
        
        const cursorPos = messageInput.selectionStart;
        const textBefore = messageInput.value.substring(0, cursorPos);
        const textAfter = messageInput.value.substring(cursorPos);
        
        messageInput.value = textBefore + emoji + textAfter;
        messageInput.focus();
        messageInput.selectionStart = cursorPos + emoji.length;
        messageInput.selectionEnd = cursorPos + emoji.length;
        
        messageInput.dispatchEvent(new Event('input'));
        
        // Close emoji picker
        if (emojiPicker) {
            emojiPicker.classList.add('hidden');
        }
    }
    
    function toggleEmojiPicker() {
        if (!emojiPicker) {
            console.log("Emoji picker element not found");
            return;
        }
        
        console.log("Toggling emoji picker");
        emojiPicker.classList.toggle('hidden');
        
        if (!emojiPicker.classList.contains('hidden') && emojiSearch) {
            emojiSearch.focus();
        }
    }
    
    // ==================== IMAGE FUNCTIONS ====================
    
    function initImageInput() {
        const imageInput = document.createElement('input');
        imageInput.type = 'file';
        imageInput.accept = 'image/*';
        imageInput.style.display = 'none';
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
            selectedImage = {
                data: event.target.result,
                name: file.name,
                type: file.type
            };
            
            if (previewImage) {
                previewImage.src = selectedImage.data;
            }
            if (imagePreview) {
                imagePreview.classList.remove('hidden');
            }
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
    
    function deleteOwnMessage(messageId) {
        if (!socket || !isConnected) return;
        
        // Emit delete event to server
        socket.emit('delete-message', { messageId: messageId });
        
        // Remove from UI immediately
        const messageElement = messagesContainer.querySelector(`[data-message-id="${messageId}"]`);
        if (messageElement) {
            messageElement.remove();
        }
        
        hideDeleteModal();
        showSystemMessage('Message deleted');
    }
    
    // ==================== MESSAGE FUNCTIONS ====================
    
    function addMessage(data, isSent) {
        if (!messagesContainer) return;
        
        const messageWrapper = document.createElement('div');
        messageWrapper.className = `message-wrapper ${isSent ? 'sent' : 'received'}`;
        messageWrapper.dataset.messageId = data.id || 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        let messageHTML = `
            <div class="message ${isSent ? 'sent' : 'received'}">
                <div class="message-header">
                    <span class="message-username">${escapeHtml(data.username)}</span>
                    <span class="message-time">${formatTimestamp(data.timestamp || Date.now())}</span>
                </div>
                <div class="message-content">
        `;
        
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
        
        messageHTML += `
                </div>
            </div>
            <div class="message-actions">
                <button class="action-btn reply-btn" title="Reply">
                    <i class="fas fa-reply"></i>
                </button>
                <button class="action-btn react-btn" title="React">
                    <i class="fas fa-smile"></i>
                </button>
                ${isSent ? `<button class="action-btn delete-btn" title="Delete">
                    <i class="fas fa-trash-alt"></i>
                </button>` : ''}
            </div>
        `;
        
        messageWrapper.innerHTML = messageHTML;
        messagesContainer.appendChild(messageWrapper);
        
        // Add event listeners
        const replyBtn = messageWrapper.querySelector('.reply-btn');
        if (replyBtn) {
            replyBtn.addEventListener('click', () => replyToMessage(messageWrapper.dataset.messageId));
        }
        
        const reactBtn = messageWrapper.querySelector('.react-btn');
        if (reactBtn) {
            reactBtn.addEventListener('click', () => showReactionMenu(messageWrapper.dataset.messageId));
        }
        
        const deleteBtn = messageWrapper.querySelector('.delete-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => showDeleteModal(messageWrapper.dataset.messageId));
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
    
    function showReactionMenu(messageId) {
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
                // React to message
                if (socket && isConnected) {
                    socket.emit('message-reaction', {
                        messageId: messageId,
                        reaction: emoji
                    });
                }
                document.body.removeChild(menu);
            };
            menu.appendChild(btn);
        });
        
        const reactBtn = document.querySelector(`[data-message-id="${messageId}"] .react-btn`);
        if (reactBtn) {
            const rect = reactBtn.getBoundingClientRect();
            menu.style.top = `${rect.top - 50}px`;
            menu.style.left = `${rect.left}px`;
            document.body.appendChild(menu);
            
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
    
    // ==================== USER LIST FUNCTIONS ====================
    
    function updateUsersList(users) {
        if (!usersListDiv) return;
        
        console.log('Updating users list with:', users);
        
        usersListDiv.innerHTML = '';
        
        if (!users || users.length === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.className = 'user-item';
            emptyMsg.innerHTML = '<i class="fas fa-user-friends"></i> <span>No other users online</span>';
            usersListDiv.appendChild(emptyMsg);
            updateOnlineCount(1); // Just yourself
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
                    
                    // Calculate how long user has been online
                    const joinTime = new Date(user.joinedAt || Date.now());
                    const now = new Date();
                    const diffMs = now - joinTime;
                    const diffMins = Math.floor(diffMs / 60000);
                    let onlineTime = '';
                    
                    if (diffMins < 1) onlineTime = 'Just now';
                    else if (diffMins < 60) onlineTime = `${diffMins}m ago`;
                    else if (diffMins < 1440) onlineTime = `${Math.floor(diffMins / 60)}h ago`;
                    else onlineTime = `${Math.floor(diffMins / 1440)}d ago`;
                    
                    userDiv.innerHTML = `
                        <i class="fas fa-circle" style="color: #31a24c"></i>
                        <span>${escapeHtml(user.username)}</span>
                        <small style="margin-left: auto; color: #65676b; font-size: 11px;">${onlineTime}</small>
                    `;
                    
                    userDiv.addEventListener('click', () => {
                        if (messageInput) {
                            messageInput.value += `@${user.username} `;
                            messageInput.focus();
                            messageInput.dispatchEvent(new Event('input'));
                        }
                    });
                    
                    usersListDiv.appendChild(userDiv);
                });
            }
            
            updateOnlineCount(users.length);
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
            // Try to reconnect with existing session
            currentUserId = session.userId;
            console.log('Attempting reconnection with session:', session);
            
            if (!socket) {
                connectSocket();
            }
            
            // Give time for socket connection
            setTimeout(() => {
                if (socket && socket.connected) {
                    socket.emit('user-reconnect', {
                        username: username,
                        userId: currentUserId
                    });
                } else {
                    // Fall back to regular join
                    socket.emit('user-join', username);
                }
            }, 500);
        } else {
            // New join
            if (!socket) {
                connectSocket();
            }
            
            setTimeout(() => {
                if (socket && socket.connected) {
                    socket.emit('user-join', username);
                } else {
                    showError('Could not connect to server. Please refresh and try again.');
                    enableJoinButton();
                }
            }, 500);
        }
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
        
        console.log("Left chat and cleared session");
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
            replyTo: messageToReply ? messageToReply.id : null
        };
        
        if (selectedImage) {
            messageData.imageData = selectedImage.data;
            messageData.imageName = selectedImage.name;
        }
        
        // Send via socket
        if (socket && isConnected) {
            socket.emit('send-message', messageData);
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
        
        console.log("Message sent:", messageData);
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
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        
        socket = io(`${protocol}//${host}`, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 10000
        });

        // Socket event handlers
        socket.on('connect', () => {
            console.log('✅ Connected to server');
            isConnected = true;
            reconnectAttempts = 0;
            updateConnectionStatus(true);
            
            // Send periodic activity updates
            setInterval(() => {
                if (socket.connected && currentUsername) {
                    socket.emit('user-active');
                }
            }, 30000); // Every 30 seconds
        });

        socket.on('disconnect', (reason) => {
            console.log('❌ Disconnected:', reason);
            isConnected = false;
            updateConnectionStatus(false);
            
            // Try to reconnect if it wasn't a manual leave
            if (currentUsername && reason !== 'io client disconnect') {
                reconnectAttempts++;
                if (reconnectAttempts <= MAX_RECONNECT_ATTEMPTS) {
                    console.log(`Reconnection attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}`);
                    setTimeout(() => {
                        if (!socket.connected && currentUsername) {
                            socket.connect();
                        }
                    }, 2000);
                }
            }
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
            currentUserId = data.userId || data.username;
            
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
            
            console.log("User joined successfully:", data);
        });

        socket.on('reconnect-success', (data) => {
            currentUsername = data.username;
            currentUserId = data.userId;
            
            if (currentUserSpan) {
                currentUserSpan.textContent = currentUsername;
            }
            if (loginScreen) loginScreen.classList.add('hidden');
            if (chatScreen) chatScreen.classList.remove('hidden');
            if (messageInput) messageInput.focus();
            
            showSystemMessage(`Welcome back, ${currentUsername}! Reconnected successfully. ${data.onlineCount || 0} users online.`);
            
            enableJoinButton();
            
            console.log("Reconnected successfully:", data);
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
            
            // Remove from users list
            if (usersListDiv) {
                const userElements = usersListDiv.querySelectorAll('.user-item');
                userElements.forEach(userEl => {
                    if (userEl.querySelector('span').textContent === data.username) {
                        userEl.remove();
                    }
                });
            }
        });

        socket.on('users-list', (users) => {
            console.log('Received users list:', users);
            updateUsersList(users);
        });

        socket.on('message-history', (history) => {
            if (!messagesContainer) return;
            
            console.log('Received message history:', history?.length || 0, 'messages');
            
            messagesContainer.innerHTML = '';
            
            if (history && history.length > 0) {
                history.forEach(msg => {
                    addMessage(msg, msg.username === currentUsername);
                });
                scrollToBottom();
            } else {
                const welcomeMsg = document.createElement('div');
                welcomeMsg.className = 'welcome-message';
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

        socket.on('message-deleted', (data) => {
            const messageElement = messagesContainer.querySelector(`[data-message-id="${data.messageId}"]`);
            if (messageElement) {
                messageElement.remove();
                showSystemMessage(`A message was deleted by ${data.deletedBy}`);
            }
        });

        socket.on('update-reaction', (data) => {
            // Handle reaction updates
            const messageElement = messagesContainer.querySelector(`[data-message-id="${data.messageId}"]`);
            if (messageElement) {
                // Add reaction UI here
                console.log('Reaction update:', data);
            }
        });
    }
    
    // ==================== EVENT LISTENERS ====================
    
    function setupEventListeners() {
        // Login events
        if (joinBtn) {
            joinBtn.addEventListener('click', joinChat);
            console.log("Join button event listener added");
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
        
        if (messageInput) {
            messageInput.addEventListener('keypress', handleMessageKeypress);
            messageInput.addEventListener('input', handleTyping);
        }
        
        // Feature events
        if (emojiBtn) {
            emojiBtn.addEventListener('click', toggleEmojiPicker);
            console.log("Emoji button event listener added");
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
            confirmDeleteBtn.addEventListener('click', () => {
                if (messageToDelete) {
                    deleteOwnMessage(messageToDelete);
                }
            });
        }
        
        // Close modals on click outside
        document.addEventListener('click', (e) => {
            if (emojiPicker && !emojiPicker.contains(e.target) && e.target !== emojiBtn && !emojiPicker.classList.contains('hidden')) {
                emojiPicker.classList.add('hidden');
            }
            
            if (deleteModal && !deleteModal.contains(e.target) && !deleteModal.classList.contains('hidden')) {
                hideDeleteModal();
            }
            
            if (imageModal && !imageModal.contains(e.target) && e.target !== modalImage && !imageModal.classList.contains('hidden')) {
                closeImageModal();
            }
        });
        
        // Escape key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (emojiPicker && !emojiPicker.classList.contains('hidden')) {
                    emojiPicker.classList.add('hidden');
                }
                if (deleteModal && !deleteModal.classList.contains('hidden')) {
                    hideDeleteModal();
                }
                if (imageModal && !imageModal.classList.contains('hidden')) {
                    closeImageModal();
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
            
            // Auto-join after a short delay
            setTimeout(() => {
                if (usernameInput && usernameInput.value === session.username) {
                    joinChat();
                }
            }, 500);
        }
        
        setupEventListeners();
        initEmojiPicker();
        initImageInput();
        
        if (usernameInput && !session) {
            usernameInput.focus();
        }
        
        // Add CSS animations
        const style = document.createElement('style');
        style.textContent = `
            .hidden { display: none !important; }
            .show { display: block !important; }
            .fa-spinner { animation: spin 1s linear infinite; }
            @keyframes spin { 100% { transform: rotate(360deg); } }
            .connected i { color: #28a745 !important; }
            .disconnected i { color: #dc3545 !important; }
            .user-item small { opacity: 0.7; }
            .typing-dots { display: inline-flex; gap: 2px; margin-left: 4px; }
            .typing-dots span { width: 4px; height: 4px; background: #65676b; border-radius: 50%; animation: typing 1.4s infinite; }
            .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
            .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
            @keyframes typing { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
        `;
        document.head.appendChild(style);
        
        console.log("✅ App initialized successfully!");
    }
    
    // Start the app
    init();
});

// Global error handler
window.addEventListener('error', function(e) {
    console.error('Global error:', e.message, 'at', e.filename, ':', e.lineno);
});

// Make openImageModal available globally
window.openImageModal = function(imageSrc) {
    document.getElementById('modal-image').src = imageSrc;
    document.getElementById('image-modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
};

console.log("📄 script.js file loaded successfully!");
