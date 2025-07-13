const chatContainer = document.getElementById('chatContainer');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const typingIndicator = document.getElementById('typingIndicator');
let messageCount = 0;
let currentChatId = null; // Track current chat ID

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

            div.innerHTML = `
                <div class="chat-item-title">${chat.title}</div>
                <div class="chat-item-date">${displayTime}</div>
            `;

            // Optional: click handler for loading messages
            div.addEventListener('click', () => {
                console.log(`Loading messages for chat ID: ${chat.id}`);
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

        const res = await fetch('/chat', {
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