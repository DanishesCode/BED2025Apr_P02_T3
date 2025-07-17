// Topics Learner JavaScript

// Global variables
let allTopics = [];
let filteredTopics = [];
let currentFilter = 'all';

// DOM elements
const topicsGrid = document.getElementById('topicsGrid');
const searchInput = document.getElementById('searchInput');
const emptyState = document.getElementById('emptyState');
const topicModal = document.getElementById('topicModal');
const uploadForm = document.getElementById('uploadForm');

// Add page navigation debugging
window.addEventListener('beforeunload', function(event) {
    console.warn('Page is about to unload/refresh! This might explain the redirect.');
    console.warn('Event:', event);
});

// Add global error handler for debugging
window.addEventListener('error', function(error) {
    console.error('Global JavaScript error:', error);
    console.error('Error details:', {
        message: error.message,
        filename: error.filename,
        lineno: error.lineno,
        colno: error.colno,
        error: error.error
    });
});

// Add unhandled promise rejection handler
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    console.error('Promise rejection details:', event);
});

// Initialize the page (ensure this only runs once)
let isInitialized = false;
document.addEventListener('DOMContentLoaded', function() {
    if (isInitialized) {
        console.log('Already initialized, skipping duplicate initialization');
        return;
    }
    isInitialized = true;
    console.log('Initializing page...');
    checkAuthentication();
    
    if (window.location.pathname.includes('topics.html')) {
        loadTopics();
    } else if (window.location.pathname.includes('upload-topic.html')) {
        initializeUploadForm();
    }
});

// Authentication check
function checkAuthentication() {
    const token = localStorage.getItem('authToken');
    const currentUser = localStorage.getItem('currentUser');
    
    if (!token) {
        window.location.href = '../login/login.html';
        return;
    }
    
    if (currentUser) {
        try {
            const user = JSON.parse(currentUser);
            const userNameElement = document.getElementById('userName');
            if (userNameElement) {
                userNameElement.textContent = user.name || 'User';
            }
        } catch (e) {
            console.error('Error parsing user data:', e);
        }
    }
}

// Navigation functions
function goBack() {
    window.history.back();
}

function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    window.location.href = '../login/login.html';
}

// Load topics from server
async function loadTopics() {
    try {
        showLoading(true);
        
        const response = await fetch('http://localhost:3000/api/topics', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            allTopics = data.data || [];
            filteredTopics = [...allTopics];
            renderTopics();
        } else {
            throw new Error(data.message || 'Failed to load topics');
        }
        
        showLoading(false);
        
    } catch (error) {
        console.error('Error loading topics:', error);
        
        // Fallback to mock data for demonstration
        console.log('Using mock data as fallback');
        const mockTopics = generateMockTopics();
        allTopics = mockTopics;
        filteredTopics = [...allTopics];
        renderTopics();
        
        showLoading(false);
    }
}

// Generate mock topics for demonstration
function generateMockTopics() {
    return [
        {
            id: 1,
            title: "Introduction to JavaScript Promises",
            content: "JavaScript Promises are a powerful way to handle asynchronous operations. They provide a clean alternative to callback functions and help avoid callback hell...",
            contentType: "text",
            category: "technology",
            author: "John Doe",
            createdAt: "2024-01-15T10:30:00Z",
            tags: ["javascript", "promises", "async", "programming"],
            description: "A comprehensive guide to understanding and using JavaScript Promises"
        },
        {
            id: 2,
            title: "Sunset Photography Tips",
            content: "/api/uploads/sunset-tips.jpg",
            contentType: "image",
            category: "arts",
            author: "Jane Smith",
            createdAt: "2024-01-14T18:45:00Z",
            tags: ["photography", "sunset", "tips", "landscape"],
            description: "Essential tips for capturing beautiful sunset photographs"
        },
        {
            id: 3,
            title: "React Hooks Tutorial",
            content: "/api/uploads/react-hooks-tutorial.mp4",
            contentType: "video",
            category: "technology",
            author: "Mike Johnson",
            createdAt: "2024-01-13T14:20:00Z",
            tags: ["react", "hooks", "tutorial", "frontend"],
            description: "Complete tutorial on React Hooks with practical examples"
        },
        {
            id: 4,
            title: "Healthy Morning Routine",
            content: "Starting your day with a healthy routine can significantly improve your productivity and well-being. Here are some key practices to incorporate into your morning...",
            contentType: "text",
            category: "health",
            author: "Sarah Wilson",
            createdAt: "2024-01-12T07:00:00Z",
            tags: ["health", "morning", "routine", "wellness"],
            description: "A guide to building a healthy and productive morning routine"
        },
        {
            id: 5,
            title: "Cooking Pasta Perfectly",
            content: "/api/uploads/pasta-cooking.mp4",
            contentType: "video",
            category: "lifestyle",
            author: "Chef Mario",
            createdAt: "2024-01-11T16:30:00Z",
            tags: ["cooking", "pasta", "italian", "tutorial"],
            description: "Professional chef shows how to cook pasta perfectly every time"
        }
    ];
}

// Render topics
function renderTopics() {
    if (!topicsGrid) return;
    
    if (filteredTopics.length === 0) {
        topicsGrid.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    topicsGrid.style.display = 'grid';
    emptyState.style.display = 'none';
    
    topicsGrid.innerHTML = filteredTopics.map(topic => createTopicCard(topic)).join('');
}

// Create topic card HTML
function createTopicCard(topic) {
    const formattedDate = formatDate(topic.createdAt);
    const preview = getContentPreview(topic);
    const tags = topic.tags ? topic.tags.slice(0, 3) : [];
    
    // Create media content based on type
    let mediaContent = '';
    if (topic.contentType === 'image') {
        mediaContent = `
            <div class="topic-media">
                <img src="http://localhost:3000${topic.content}" alt="${escapeHtml(topic.title)}" class="topic-thumbnail" onerror="this.src='../images/placeholder.png'">
            </div>
        `;
    } else if (topic.contentType === 'video') {
        mediaContent = `
            <div class="topic-media">
                <video class="topic-thumbnail" preload="metadata">
                    <source src="http://localhost:3000${topic.content}#t=0.1" type="video/mp4">
                </video>
                <div class="video-overlay">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                </div>
            </div>
        `;
    }
    
    return `
        <div class="topic-card" onclick="openTopicModal(${topic.id})">
            <div class="topic-header">
                <span class="content-type-badge ${topic.contentType}">${topic.contentType}</span>
            </div>
            ${mediaContent}
            <div class="topic-content">
                <h3 class="topic-title">${escapeHtml(topic.title)}</h3>
                <p class="topic-preview">${preview}</p>
                ${tags.length > 0 ? `
                    <div class="topic-tags">
                        ${tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
                    </div>
                ` : ''}
                <div class="topic-meta">
                    <span class="author">By ${escapeHtml(topic.author)}</span>
                    <span class="date">${formattedDate}</span>
                </div>
            </div>
        </div>
    `;
}

// Get content preview
function getContentPreview(topic) {
    if (topic.contentType === 'text') {
        return escapeHtml(topic.content.substring(0, 150) + (topic.content.length > 150 ? '...' : ''));
    } else if (topic.contentType === 'image') {
        return topic.description || 'Click to view image';
    } else if (topic.contentType === 'video') {
        return topic.description || 'Click to watch video';
    }
    return '';
}

// Filter topics
function filterTopics() {
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    
    filteredTopics = allTopics.filter(topic => {
        const matchesSearch = !searchTerm || 
            topic.title.toLowerCase().includes(searchTerm) ||
            topic.content.toLowerCase().includes(searchTerm) ||
            topic.author.toLowerCase().includes(searchTerm) ||
            (topic.tags && topic.tags.some(tag => tag.toLowerCase().includes(searchTerm)));
        
        const matchesFilter = currentFilter === 'all' || topic.contentType === currentFilter;
        
        return matchesSearch && matchesFilter;
    });
    
    renderTopics();
}

// Filter by content type
function filterByType(type) {
    currentFilter = type;
    
    // Update filter button states
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-type="${type}"]`).classList.add('active');
    
    filterTopics();
}

// Open topic modal
function openTopicModal(topicId) {
    const topic = allTopics.find(t => t.id === topicId);
    if (!topic) return;
    
    const modal = document.getElementById('topicModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalAuthor = document.getElementById('modalAuthor');
    const modalDate = document.getElementById('modalDate');
    const modalType = document.getElementById('modalType');
    const modalContent = document.getElementById('modalContent');
    
    if (!modal) return;
    
    modalTitle.textContent = topic.title;
    modalAuthor.textContent = topic.author;
    modalDate.textContent = formatDate(topic.createdAt);
    modalType.textContent = topic.contentType.toUpperCase();
    modalType.className = `content-type-badge ${topic.contentType}`;
    
    // Set content based on type
    if (topic.contentType === 'text') {
        modalContent.innerHTML = `
            <div class="text-content">
                ${escapeHtml(topic.content).replace(/\n/g, '<br>')}
            </div>
            ${topic.description ? `<div class="topic-description"><strong>Description:</strong> ${escapeHtml(topic.description)}</div>` : ''}
        `;
    } else if (topic.contentType === 'image') {
        modalContent.innerHTML = `
            <div class="image-content">
                <img src="http://localhost:3000${topic.content}" alt="${topic.title}" onerror="this.src='../images/placeholder.png'">
                ${topic.description ? `<p>${escapeHtml(topic.description)}</p>` : ''}
            </div>
        `;
    } else if (topic.contentType === 'video') {
        modalContent.innerHTML = `
            <div class="video-content">
                <video controls>
                    <source src="http://localhost:3000${topic.content}" type="video/mp4">
                    Your browser does not support the video tag.
                </video>
                ${topic.description ? `<p>${escapeHtml(topic.description)}</p>` : ''}
            </div>
        `;
    }
    
    // Add tags if available
    if (topic.tags && topic.tags.length > 0) {
        modalContent.innerHTML += `
            <div class="topic-tags" style="margin-top: 16px;">
                ${topic.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
            </div>
        `;
    }
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// Close modal
function closeModal() {
    const modal = document.getElementById('topicModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Upload form functions
function initializeUploadForm() {
    if (!uploadForm) return;
    
    // Set up drag and drop
    const fileUploadArea = document.getElementById('fileUploadArea');
    if (fileUploadArea) {
        setupDragAndDrop(fileUploadArea);
    }
    
    // Set up form submission
    // Add form submit handler (remove any existing listeners first)
    if (uploadForm) {
        uploadForm.removeEventListener('submit', handleFormSubmit);
        uploadForm.addEventListener('submit', handleFormSubmit);
    }
    
    // Initialize content type
    toggleContentInput();
}

// Toggle content input based on selected type
function toggleContentInput() {
    const selectedType = document.querySelector('input[name="contentType"]:checked');
    const textGroup = document.getElementById('textContentGroup');
    const fileGroup = document.getElementById('fileUploadGroup');
    const fileInput = document.getElementById('fileInput');
    
    if (!selectedType || !textGroup || !fileGroup || !fileInput) return;
    
    if (selectedType.value === 'text') {
        textGroup.style.display = 'flex';
        fileGroup.style.display = 'none';
        document.getElementById('textContent').required = true;
        fileInput.required = false;
        fileInput.accept = '';
    } else {
        textGroup.style.display = 'none';
        fileGroup.style.display = 'flex';
        document.getElementById('textContent').required = false;
        fileInput.required = true;
        
        if (selectedType.value === 'image') {
            fileInput.accept = 'image/*';
        } else if (selectedType.value === 'video') {
            fileInput.accept = 'video/*';
        }
    }
    
    // Clear file preview
    clearFilePreview();
}

// Setup drag and drop
function setupDragAndDrop(area) {
    area.addEventListener('dragover', function(e) {
        e.preventDefault();
        area.classList.add('dragover');
    });
    
    area.addEventListener('dragleave', function(e) {
        e.preventDefault();
        area.classList.remove('dragover');
    });
    
    area.addEventListener('drop', function(e) {
        e.preventDefault();
        area.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const fileInput = document.getElementById('fileInput');
            fileInput.files = files;
            handleFileSelect({ target: fileInput });
        }
    });
}

// Handle file selection
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const filePreview = document.getElementById('filePreview');
    const uploadPlaceholder = document.getElementById('uploadPlaceholder');
    
    if (!filePreview || !uploadPlaceholder) return;
    
    // Validate file type
    const selectedType = document.querySelector('input[name="contentType"]:checked').value;
    if ((selectedType === 'image' && !file.type.startsWith('image/')) ||
        (selectedType === 'video' && !file.type.startsWith('video/'))) {
        alert(`Please select a valid ${selectedType} file.`);
        event.target.value = '';
        return;
    }
    
    // Show preview
    uploadPlaceholder.style.display = 'none';
    filePreview.style.display = 'block';
    
    const fileSize = formatFileSize(file.size);
    
    if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            filePreview.innerHTML = `
                <img src="${e.target.result}" alt="Preview">
                <div class="file-info">
                    <div class="file-name">${file.name}</div>
                    <div class="file-size">${fileSize}</div>
                    <button type="button" class="remove-file" onclick="clearFilePreview()">Remove File</button>
                </div>
            `;
        };
        reader.readAsDataURL(file);
    } else if (file.type.startsWith('video/')) {
        const videoURL = URL.createObjectURL(file);
        filePreview.innerHTML = `
            <video controls>
                <source src="${videoURL}" type="${file.type}">
            </video>
            <div class="file-info">
                <div class="file-name">${file.name}</div>
                <div class="file-size">${fileSize}</div>
                <button type="button" class="remove-file" onclick="clearFilePreview()">Remove File</button>
            </div>
        `;
    }
}

// Clear file preview
function clearFilePreview() {
    const fileInput = document.getElementById('fileInput');
    const filePreview = document.getElementById('filePreview');
    const uploadPlaceholder = document.getElementById('uploadPlaceholder');
    
    if (fileInput) fileInput.value = '';
    if (filePreview) {
        filePreview.style.display = 'none';
        filePreview.innerHTML = '';
    }
    if (uploadPlaceholder) uploadPlaceholder.style.display = 'block';
}

// Handle form submission
// Flag to prevent multiple submissions
let isSubmitting = false;

async function handleFormSubmit(event) {
    event.preventDefault();
    event.stopPropagation();
    
    // Prevent multiple submissions
    if (isSubmitting) {
        console.log('Already submitting, ignoring duplicate submission');
        return;
    }
    
    isSubmitting = true;
    console.log('Form submission prevented, handling upload...');
    
    const submitBtn = document.getElementById('submitBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');
    
    // Show loading state
    submitBtn.disabled = true;
    btnText.style.display = 'none';
    btnLoading.style.display = 'flex';
    
    try {
        const formData = new FormData(uploadForm);
        
        // Get content type for success message
        const contentType = formData.get('contentType');
        console.log('Content type:', contentType);
        
        // Log form data for debugging
        console.log('FormData contents:');
        for (let [key, value] of formData.entries()) {
            console.log(key, value);
        }
        
        const authToken = localStorage.getItem('authToken');
        console.log('Auth token:', authToken ? 'Present' : 'Missing');
        
        if (!authToken) {
            throw new Error('Authentication token is missing. Please log in again.');
        }
        
        // Send the data to backend
        const response = await fetch('http://localhost:3000/api/topics', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            body: formData
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        console.log('Response URL:', response.url);
        
        // Check if response is JSON
        const contentTypeHeader = response.headers.get('content-type');
        console.log('Content-Type:', contentTypeHeader);
        
        if (!contentTypeHeader || !contentTypeHeader.includes('application/json')) {
            const textResponse = await response.text();
            console.error('Non-JSON response:', textResponse);
            console.error('Full response details:', {
                status: response.status,
                statusText: response.statusText,
                headers: Array.from(response.headers.entries()),
                url: response.url
            });
            throw new Error(`Server returned non-JSON response: ${textResponse.substring(0, 100)}...`);
        }
        
        const data = await response.json();
        console.log('Response data:', data);
        
        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Failed to upload content');
        }
        
        console.log('Upload successful! Showing success modal...');
        showSuccessModal(contentType);
        
        console.log('Success modal should now be visible. Form will not be reset automatically.');
        
        // Don't do anything else - let the user decide what to do next
        // No automatic form reset, no automatic page refresh, no automatic loadTopics calls
        
    } catch (error) {
        console.error('Error uploading content:', error);
        alert('Failed to upload content. Please try again. Error: ' + error.message);
    } finally {
        console.log('Finally block - resetting button state');
        isSubmitting = false;
        submitBtn.disabled = false;
        btnText.style.display = 'block';
        btnLoading.style.display = 'none';
    }
}

// Reset form
function resetForm() {
    console.log('resetForm called');
    if (uploadForm) {
        console.log('Resetting upload form...');
        uploadForm.reset();
        toggleContentInput();
        clearFilePreview();
        console.log('Form reset completed');
    } else {
        console.log('Upload form not found, skipping reset');
    }
}

// Show success modal (prevent multiple calls)
let isShowingSuccessModal = false;
function showSuccessModal(contentType) {
    if (isShowingSuccessModal) {
        console.log('Success modal already showing, ignoring duplicate call');
        return;
    }
    
    isShowingSuccessModal = true;
    console.log('showSuccessModal called with contentType:', contentType);
    const modal = document.getElementById('successModal');
    const titleElement = document.getElementById('successTitle');
    const messageElement = document.getElementById('successMessage');
    
    console.log('Success modal element:', modal);
    
    if (modal) {
        // Set content-specific messages
        if (contentType === 'image') {
            titleElement.textContent = 'Image Uploaded Successfully!';
            messageElement.textContent = 'Your image has been shared with the community.';
        } else if (contentType === 'video') {
            titleElement.textContent = 'Video Uploaded Successfully!';
            messageElement.textContent = 'Your video has been shared with the community.';
        } else if (contentType === 'text') {
            titleElement.textContent = 'Text Content Uploaded Successfully!';
            messageElement.textContent = 'Your text content has been shared with the community.';
        } else {
            titleElement.textContent = 'Content Uploaded Successfully!';
            messageElement.textContent = 'Your knowledge has been shared with the community.';
        }
        
        console.log('Showing success modal...');
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        console.log('Success modal shown and will stay open until user closes it');
        
        // Don't auto-close - let user decide what to do next
        
    } else {
        console.error('Success modal element not found!');
        isShowingSuccessModal = false;
    }
}

// Close success modal
function closeSuccessModal() {
    const modal = document.getElementById('successModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        isShowingSuccessModal = false; // Reset the flag
        
        // Reset the form when user closes modal to upload another
        console.log('Resetting form after modal close...');
        resetForm();
        
        // Only refresh topics if we're on the topics viewing page, not upload page
        if (window.location.pathname.includes('topics.html') && typeof loadTopics === 'function') {
            console.log('Refreshing topics list...');
            loadTopics();
        }
    }
}

// View topics from success modal
function viewTopics() {
    window.location.href = 'topics.html';
}

// Utility functions
function showLoading(show) {
    const loadingMessage = document.querySelector('.loading-message');
    if (loadingMessage) {
        loadingMessage.style.display = show ? 'flex' : 'none';
    }
}

function showError(message) {
    alert(message); // Replace with better error handling
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

// Event listeners
if (searchInput) {
    searchInput.addEventListener('input', filterTopics);
}

// Close modal when clicking outside
document.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal-overlay')) {
        closeModal();
        closeSuccessModal();
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeModal();
        closeSuccessModal();
    }
});
