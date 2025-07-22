const chatContainer = document.getElementById('chatContainer');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const typingIndicator = document.getElementById('typingIndicator');
let messageCount = 0;
let currentChatId = null; // Track current chat ID
let chatToDelete = null; // Track chat to be deleted

// Custom confirmation dialog functions
function showConfirmDialog(chatId) {
    chatToDelete = chatId;
    const confirmDialog = document.getElementById('confirmDialog');
    confirmDialog.classList.add('show');
}

function hideConfirmDialog() {
    const confirmDialog = document.getElementById('confirmDialog');
    confirmDialog.classList.remove('show');
    chatToDelete = null;
}

function confirmDelete() {
    if (chatToDelete) {
        deleteChat(chatToDelete);
        hideConfirmDialog();
    }
}

// Setup confirmation dialog event listeners
document.addEventListener('DOMContentLoaded', () => {
    const confirmDialog = document.getElementById('confirmDialog');
    const cancelBtn = document.getElementById('cancelBtn');
    const deleteBtn = document.getElementById('deleteBtn');

    if (cancelBtn) {
        cancelBtn.addEventListener('click', hideConfirmDialog);
    }
    if (deleteBtn) {
        deleteBtn.addEventListener('click', confirmDelete);
    }

    // Close dialog when clicking outside
    if (confirmDialog) {
        confirmDialog.addEventListener('click', (e) => {
            if (e.target === confirmDialog) {
                hideConfirmDialog();
            }
        });
    }
});

// Auto-resize textarea
messageInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});

async function loadChats() {
    const chatHistory = document.getElementById('chatHistory');
    chatHistory.innerHTML = ''; // Clear previous items

    try {
        const token = localStorage.getItem('authToken');
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const userId = currentUser.id;

        const res = await fetch(`http://localhost:3000/chat/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!res.ok) throw new Error('Failed to fetch chats');

        const response = await res.json();
        const chats = response.chats;
        
        chats.forEach(chat => {
            const div = document.createElement('div');
            div.classList.add('chat-item');
            div.dataset.chatId = chat.id;

            const created = new Date(chat.created_at);
            const now = new Date();
            const sameDay = created.toDateString() === now.toDateString();
            const displayTime = sameDay
                ? created.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : created.toLocaleDateString();

            // Chat item content with three-dots and dropdown
            div.innerHTML = `
                <div class="chat-item-title-wrapper" style="display: flex; align-items: center; justify-content: space-between; position: relative;">
                    <span class="chat-item-title">${chat.title}</span>
                    <span class="chat-item-menu" style="cursor:pointer; padding: 0 6px; font-size: 18px;">&#8942;</span>
                    <div class="chat-item-dropdown" style="display:none; position:absolute; right:0; top:24px; background:#fff; border:1px solid #dee2e6; border-radius:6px; box-shadow:0 2px 8px rgba(0,0,0,0.08); z-index:10; min-width:120px;">
                        <div class="dropdown-option rename-option" style="padding:8px 16px; cursor:pointer;">Rename chat</div>
                        <div class="dropdown-option delete-option" style="padding:8px 16px; cursor:pointer; color:#fa5252;">Delete chat</div>
                    </div>
                </div>
                <div class="chat-item-date">${displayTime}</div>
            `;

            // Dropdown menu logic
            const menuBtn = div.querySelector('.chat-item-menu');
            const dropdown = div.querySelector('.chat-item-dropdown');
            let dropdownOpen = false;

            menuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                // Close other open dropdowns
                document.querySelectorAll('.chat-item-dropdown').forEach(d => { if (d !== dropdown) d.style.display = 'none'; });
                dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
                dropdownOpen = dropdown.style.display === 'block';
            });
            // Hide dropdown on click outside
            document.addEventListener('click', (e) => {
                if (!div.contains(e.target)) dropdown.style.display = 'none';
            });

            // Rename logic
            dropdown.querySelector('.rename-option').addEventListener('click', (e) => {
                e.stopPropagation();
                dropdown.style.display = 'none';
                // Replace title with input
                const titleSpan = div.querySelector('.chat-item-title');
                const oldTitle = titleSpan.textContent;
                const input = document.createElement('input');
                input.type = 'text';
                input.value = oldTitle;
                input.className = 'chat-rename-input';
                input.style.width = '90%';
                input.style.fontSize = '14px';
                input.style.padding = '2px 6px';
                input.style.border = '1px solid #dee2e6';
                input.style.borderRadius = '4px';
                input.style.marginRight = '4px';
                titleSpan.replaceWith(input);
                input.focus();
                input.select();
                // Save on Enter or blur
                input.addEventListener('keydown', (ev) => {
                    if (ev.key === 'Enter') {
                        finishRename();
                    } else if (ev.key === 'Escape') {
                        cancelRename();
                    }
                });
                input.addEventListener('blur', cancelRename);
                function finishRename() {
                    const newTitle = input.value.trim();
                    if (newTitle && newTitle !== oldTitle) {
                        renameChat(chat.id, newTitle);
                    } else {
                        cancelRename();
                    }
                }
                function cancelRename() {
                    input.replaceWith(titleSpan);
                }
            });

            // Delete logic
            dropdown.querySelector('.delete-option').addEventListener('click', (e) => {
                e.stopPropagation();
                dropdown.style.display = 'none';
                showConfirmDialog(chat.id);
            });

            // Click handler for loading messages
            div.addEventListener('click', (e) => {
                // Prevent loading messages if menu or dropdown is clicked
                if (e.target.classList.contains('chat-item-menu') || e.target.classList.contains('dropdown-option') || e.target.classList.contains('chat-rename-input')) return;
                loadChatMessages(chat.id);
            });

            chatHistory.appendChild(div);
        });

    } catch (err) {
        console.error("Error loading chats:", err);
    }
}

async function loadChatMessages(chatId) {
    const token = localStorage.getItem('authToken');
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const userId = currentUser.id;
  
    try {
      chatContainer.innerHTML = ''; // clear existing messages
      currentChatId = chatId; // Set current chat ID
  
      const res = await fetch(`http://localhost:3000/chat/messages/${chatId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
  
      if (!res.ok) throw new Error('Failed to load messages');
  
      const data = await res.json();
  
      if (!data.success) throw new Error(data.message || 'Failed to load messages');
  
      const messages = data.messages;
  
      messages.forEach(msg => {
        if (msg.is_ai === 1) {
          addAIMessage(msg.message);
        } else if (msg.sender_id === userId) {
          addUserMessage(msg.message);
        } else {
          // Optionally handle messages from other users differently, or treat as AI
          addAIMessage(msg.message);
        }
      });
  
      scrollToBottom();
  
    } catch (err) {
      addAIMessage('Failed to load messages. Please try again.');
      console.error('Error loading messages:', err);
    }
  }

  async function saveMessage(chatId, senderId, message, is_ai, token) {
    try {
      const res = await fetch('http://localhost:3000/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // make sure token is passed in
        },
        body: JSON.stringify({
          chatId: chatId,
          senderId: senderId,
          message: message,
          is_ai: is_ai
        })
      });
  
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Server error: ${res.status} - ${errorText}`);
      }
  
      const data = await res.json();
      console.log('Message saved:', data);
      return data;
  
    } catch (err) {
      console.error('Error saving message:', err);
      return null;
    }
  }
  
  



// Convert **bold** markdown to <b>bold</b>
function markdownBoldToHtml(text) {
    return text.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
}

function addAIMessage(content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';
    const htmlContent = markdownBoldToHtml(content);
    messageDiv.innerHTML = `
        <div class="message-header">
            <div class="message-avatar ai-avatar">AI</div>
            <span class="message-sender">AI Assistant</span>
        </div>
        <div class="message-content ai-message">${htmlContent}</div>
    `;
    chatContainer.appendChild(messageDiv);
    scrollToBottom();
}

function addUserMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user-message-container';
    messageDiv.innerHTML = `<div class="user-message">${message}</div>`;
    chatContainer.appendChild(messageDiv);
    scrollToBottom();
}


// Function to show typing indicator
function showTypingIndicator() {
    typingIndicator.style.display = 'flex';
    typingIndicator.style.opacity = '0';
    setTimeout(() => {
        typingIndicator.style.transition = 'opacity 0.3s ease';
        typingIndicator.style.opacity = '1';
    }, 50);
    scrollToBottom();
}

// Function to hide typing indicator
function hideTypingIndicator() {
    typingIndicator.style.opacity = '0';
    setTimeout(() => {
        typingIndicator.style.display = 'none';
    }, 300);
}

// Function to scroll to bottom
function scrollToBottom() {
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Send message to backend
async function sendMessage() {
    const message = messageInput.value.trim();
    const senderId = JSON.parse(localStorage.getItem('currentUser')).id;
    if (!message) return;

    // If no current chat, create a new one
    if (!currentChatId) {
        try {
            const token = localStorage.getItem('authToken');
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            const userId = currentUser.id;

            const createChatRes = await fetch('http://localhost:3000/chat/new', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ userId, title: 'New Chat' })
            });

            if (!createChatRes.ok) throw new Error('Failed to create chat');

            const chatData = await createChatRes.json();
            currentChatId = chatData.chatId;
            console.log('Created new chat with ID:', currentChatId);
        } catch (err) {
            console.error('Error creating chat:', err);
            addAIMessage('Sorry, something went wrong while creating a new chat.');
            return;
        }
    }

    // Use current chat ID
    const chatIdToUse = currentChatId;
    
    saveMessage(chatIdToUse, senderId, message, 0, localStorage.getItem('authToken'));
    addUserMessage(message);
    messageInput.value = '';
    messageInput.style.height = 'auto';
    showTypingIndicator();

    try {
        const token = localStorage.getItem('authToken');
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const userId = currentUser.id;
        const name = currentUser.name;

        const res = await fetch('http://localhost:3000/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ message, userId, name })
        });

        if (!res.ok) throw new Error('Failed to contact AI');

        const data = await res.json();
        hideTypingIndicator();
        saveMessage(chatIdToUse, null, data.reply, 1, localStorage.getItem('authToken')); 
        addAIMessage(data.reply);
    } catch (err) {
        hideTypingIndicator();
        addAIMessage('Sorry, something went wrong.');
        console.error('Error contacting backend:', err);
    }
}

// Event listeners
sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// Add button click animations
document.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', function() {
        this.style.transform = 'scale(0.95)';
        setTimeout(() => {
            this.style.transform = '';
        }, 150);
    });
});

// Voice button functionality (placeholder)
document.querySelector('.voice-btn').addEventListener('click', () => {
    console.log('Voice functionality would be implemented here');
});

// Summarize button functionality (placeholder)
document.querySelector('.summarize-btn').addEventListener('click', () => {
    console.log('Summarize functionality would be implemented here');
});

// New Chat button functionality
document.querySelector('.new-chat-btn').addEventListener('click', () => {
    currentChatId = null; // Reset current chat ID
    chatContainer.innerHTML = ''; // Clear chat container
    addAIMessage("Hello, I'm your helpful AI assistant, here to make things easier for you. Feel free to ask me anything!");
    messageInput.focus();
});

// Focus input on load
window.addEventListener('load', () => {
    messageInput.focus();
    addAIMessage("Hello, I'm your helpful AI assistant, here to make things easier for you. Feel free to ask me anything!");
    loadChats(); // Load chat history on page load
});

async function renameChat(chatId, newTitle) {
    const token = localStorage.getItem('authToken');
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const userId = currentUser.id;
    try {
        const res = await fetch(`http://localhost:3000/chat/${chatId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ newTitle, userId })
        });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            alert(data.message || 'Failed to rename chat');
            return;
        }
        loadChats(); // Refresh chat list
    } catch (err) {
        alert('Failed to rename chat');
        console.error('Error renaming chat:', err);
    }
}

async function deleteChat(chatId) {
    const token = localStorage.getItem('authToken');
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const userId = currentUser.id;
    try {
        const res = await fetch(`http://localhost:3000/chat/${chatId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ userId })
        });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            alert(data.message || 'Failed to delete chat');
            return;
        }
        // If the deleted chat was open, clear the chat container
        if (currentChatId == chatId) {
            currentChatId = null;
            chatContainer.innerHTML = '';
        }
        loadChats();
    } catch (err) {
        alert('Failed to delete chat');
        console.error('Error deleting chat:', err);
    }
}