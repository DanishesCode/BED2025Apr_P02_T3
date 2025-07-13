const chatContainer = document.getElementById('chatContainer');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const typingIndicator = document.getElementById('typingIndicator');
let messageCount = 0;

// Auto-resize textarea
messageInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});

// Convert **bold** markdown to <b>bold</b>
function markdownBoldToHtml(text) {
    return text.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
}

// Function to add AI message
function addAIMessage(content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';
    // Convert **bold** to <b>bold</b>
    const htmlContent = markdownBoldToHtml(content);
    messageDiv.innerHTML = `
        <div class="message-header">
            <div class="message-avatar ai-avatar">AI</div>
            <span class="message-sender">AI Assistant</span>
        </div>
        <div class="message-content ai-message">${htmlContent}</div>
    `;
    chatContainer.insertBefore(messageDiv, typingIndicator);
    scrollToBottom();
}

// Function to add user message
function addUserMessage(content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user-message-container';
    
    messageDiv.innerHTML = `
        <div class="user-message">${content}</div>
    `;
    
    chatContainer.insertBefore(messageDiv, typingIndicator);
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

// Removed GEMINI_API_KEY and direct fetch to Gemini

// Send message to backend
async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message) return;

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

// Focus input on load
window.addEventListener('load', () => {
    messageInput.focus();
    addAIMessage("Hello, I'm your helpful AI assistant, here to make things easier for you. Feel free to ask me anything!");
});