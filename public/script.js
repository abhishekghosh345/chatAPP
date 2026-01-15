// script.js - Complete with emoji picker and delete functionality
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
    let typingTimeout;
    let isConnected = false;
    let messageToReply = null;
    let selectedImage = null;
    let lastMessageDate = null;
    let messageToDelete = null;
    
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
    
    function deleteMessage(messageId) {
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
    
    function deleteOwnMessage(messageId) {
        // For now, just delete from UI
        const messageElement = messagesContainer.querySelector(`[data-message-id="${messageId}"]`);
        if (messageElement) {
            messageElement.remove();
            showSystemMessage('Message deleted');
        }
    }
    
    // ==================== MESSAGE FUNCTIONS ====================
    
    function addMessage(data, isSent) {
        if (!messagesContainer) return;
        
        const messageWrapper = document.createElement('div');
        messageWrapper.className = `message-wrapper ${isSent ? 'sent' : 'received'}`;
        messageWrapper.dataset.messageId = data.id || Date.now();
        
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
    
    // ==================== CHAT FUNCTIONS ====================
    
    function joinChat() {
        const username = usernameInput ? usernameInput.value.trim() : '';
        
        if (!validateUsername(username)) {
            return;
        }
        
        console.log("Joining as:", username);
        
        if (joinBtn) {
            joinBtn.disabled = true;
            joinBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connecting...';
        }
        
        // Connect socket if not connected
        if (!socket) {
            connectSocket();
        }
        
        // Simulate connection for now
        setTimeout(() => {
            currentUsername = username;
            
            if (currentUserSpan) {
                currentUserSpan.textContent = username;
            }
            if (loginScreen) loginScreen.classList.add('hidden');
            if (chatScreen) chatScreen.classList.remove('hidden');
            if (messageInput) messageInput.focus();
            
            if (joinBtn) {
                joinBtn.disabled = false;
                joinBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Join Chat';
            }
            
            showSystemMessage(`Welcome to the chat, ${username}!`);
            console.log("Chat screen shown!");
        }, 1000);
    }
    
    function leaveChat() {
        if (socket) {
            socket.disconnect();
        }
        
        currentUsername = '';
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
        
        console.log("Left chat");
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
            username: currentUsername,
            message: message,
            timestamp: Date.now(),
            type: selectedImage ? 'image' : 'text'
        };
        
        if (selectedImage) {
            messageData.imageData = selectedImage.data;
        }
        
        // Add to UI immediately
        addMessage(messageData, true);
        
        // Clear inputs
        if (messageInput) messageInput.value = '';
        removeImage();
        cancelReply();
        if (messageInput) messageInput.focus();
        
        console.log("Message sent:", messageData);
    }
    
    function handleMessageKeypress(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    }
    
    function handleTyping() {
        // Typing indicator logic here
    }
    
    // ==================== SOCKET FUNCTIONS ====================
    
    function connectSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        
        socket = io(`${protocol}//${host}`, {
            transports: ['websocket', 'polling'],
            reconnection: true
        });
        
        socket.on('connect', () => {
            console.log('✅ Connected to server');
            isConnected = true;
            if (connectionStatus) {
                connectionStatus.innerHTML = '<i class="fas fa-circle"></i> Connected';
                connectionStatus.classList.add('connected');
            }
        });
        
        socket.on('disconnect', () => {
            console.log('❌ Disconnected');
            isConnected = false;
            if (connectionStatus) {
                connectionStatus.innerHTML = '<i class="fas fa-circle"></i> Disconnected';
                connectionStatus.classList.remove('connected');
            }
        });
        
        socket.on('receive-message', (data) => {
            addMessage(data, data.username === currentUsername);
        });
        
        socket.on('user-connected', (username) => {
            showSystemMessage(`${username} joined the chat`);
        });
        
        socket.on('user-disconnected', (username) => {
            showSystemMessage(`${username} left the chat`);
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
        setupEventListeners();
        initEmojiPicker();
        initImageInput();
        
        if (usernameInput) usernameInput.focus();
        
        // Add CSS animations
        const style = document.createElement('style');
        style.textContent = `
            .hidden { display: none !important; }
            .show { display: block !important; }
            .fa-spinner { animation: spin 1s linear infinite; }
            @keyframes spin { 100% { transform: rotate(360deg); } }
            .connected i { color: #28a745 !important; }
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

console.log("📄 script.js file loaded successfully!");
