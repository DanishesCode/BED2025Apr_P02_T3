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
        console.warn('No auth token found - you may need to login');
        // For testing purposes, don't redirect immediately
        // window.location.href = '../login/login.html';
        // return;
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
    } else {
        // Set a default user name for testing
        const userNameElement = document.getElementById('userName');
        if (userNameElement) {
            userNameElement.textContent = 'Guest User';
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
        
        console.log('Fetching topics from server...');
        const authToken = localStorage.getItem('authToken');
        const headers = {
            'Content-Type': 'application/json'
        };
        
        // Only add auth header if token exists
        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }
        
        const response = await fetch('http://localhost:3000/api/topics', {
            method: 'GET',
            headers: headers
        });
        
        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Response data:', data);
        
        if (data.success) {
            allTopics = data.data || [];
            filteredTopics = [...allTopics];
            console.log('Loaded topics:', allTopics.length);
            renderTopics();
        } else {
            throw new Error(data.message || 'Failed to load topics');
        }
        
        showLoading(false);
        
    } catch (error) {
        console.error('Error loading topics:', error);
        
        // Show error message instead of mock data
        showLoading(false);
        
        if (topicsGrid) {
            topicsGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: white;">
                    <h3 style="font-size: 1.5rem; margin-bottom: 16px;">Unable to Load Topics</h3>
                    <p style="font-size: 1.1rem; opacity: 0.8; margin-bottom: 20px;">
                        ${error.message === 'Failed to fetch' ? 
                          'Please make sure your server is running on localhost:3000' : 
                          error.message}
                    </p>
                    <button onclick="loadTopics()" style="
                        background: rgba(255, 255, 255, 0.2);
                        border: 2px solid rgba(255, 255, 255, 0.3);
                        color: white;
                        padding: 12px 24px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 600;
                        transition: all 0.3s ease;
                    ">Try Again</button>
                </div>
            `;
        }
    }
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
    
    // Use real like and comment data from backend
    const likeCount = topic.likeCount || 0;
    const commentCount = topic.commentCount || 0;
    const isLiked = topic.isLiked || false;
    
    // Determine difficulty based on content type and title
    let difficulty = 'beginner';
    if (topic.title.toLowerCase().includes('advanced') || topic.title.toLowerCase().includes('complex')) {
        difficulty = 'advanced';
    } else if (topic.title.toLowerCase().includes('intermediate') || topic.title.toLowerCase().includes('tutorial')) {
        difficulty = 'intermediate';
    }
    
    // Get author initials for avatar
    const authorInitials = topic.author.split(' ').map(name => name[0]).join('').toUpperCase();
    
    // Get content type display name
    const contentTypeDisplay = {
        'text': 'TEXT',
        'image': 'IMAGE', 
        'video': 'VIDEO'
    }[topic.contentType] || 'TEXT';
    
    return `
        <div class="topic-card" data-topic-id="${topic.id}">
            <div class="topic-card-header">
                <div>
                    <h3 class="topic-title">${escapeHtml(topic.title)}</h3>
                    <p class="topic-summary">${escapeHtml(topic.description || preview)}</p>
                </div>
                <span class="content-type-badge ${topic.contentType}">${contentTypeDisplay}</span>
            </div>
            
            <div class="topic-card-body ${topic.contentType !== 'text' ? 'has-media' : ''}">
                ${topic.contentType === 'text' ? 
                    `<p class="topic-summary">Complete Step-by-Step Guide</p>` : 
                    topic.contentType === 'image' ? 
                    `<div class="topic-media-container">
                        <img src="http://localhost:3000${topic.content}" 
                             alt="${escapeHtml(topic.title)}" 
                             class="topic-image"
                             onerror="this.src='/images/placeholder.png'; this.onerror=null;"
                             onclick="openTopicModal(${topic.id})">
                     </div>` : 
                    `<div class="topic-media-container">
                        <video class="topic-video" 
                               controls 
                               preload="metadata"
                               onclick="openTopicModal(${topic.id})">
                            <source src="http://localhost:3000${topic.content}" type="video/mp4">
                            Your browser does not support the video tag.
                        </video>
                     </div>`
                }
            </div>
            
            <div class="topic-card-footer">
                <div class="topic-meta">
                    <div class="author">
                        <div class="author-avatar">${authorInitials}</div>
                        <span>By ${escapeHtml(topic.author)}</span>
                    </div>
                    <div class="topic-engagement">
                        <div class="engagement-item">
                            <span class="like-icon-btn ${isLiked ? 'liked' : ''}" onclick="toggleLike(${topic.id}, event)">${isLiked ? '❤️' : '🤍'}</span>
                            <span class="like-count">${likeCount}</span>
                        </div>
                        <div class="engagement-item">
                            <span class="comment-icon-btn" onclick="viewComments(${topic.id}, event)">💬</span>
                            <span class="comment-count">${commentCount}</span>
                        </div>
                    </div>
                </div>
                <span class="difficulty-badge ${difficulty}">${difficulty.toUpperCase()}</span>
            </div>
        </div>
    `;
}

// Toggle like for a topic
async function toggleLike(topicId, event) {
    event.stopPropagation(); // Prevent card click
    
    const likeIconBtn = event.currentTarget; // Define outside try block
    
    // Find the like count in the same engagement-item container
    const engagementItem = likeIconBtn.parentElement;
    const likeCount = engagementItem.querySelector('.like-count');
    
    try {
        console.log('Like icon button element:', likeIconBtn);
        console.log('Like count element:', likeCount);
        console.log('Current like count text:', likeCount ? likeCount.textContent : 'NOT FOUND');
        
        if (!likeCount) {
            console.error('Could not find like count element');
            alert('Error: Could not find like elements. Please refresh the page.');
            return;
        }
        
        // Store current values before making the API call
        const currentLikeCount = parseInt(likeCount.textContent) || 0;
        const currentIsLiked = likeIconBtn.classList.contains('liked');
        
        console.log('Toggle like called for topic:', topicId);
        console.log('Current like count:', currentLikeCount);
        console.log('Current is liked:', currentIsLiked);
        
        // Show loading state
        likeIconBtn.style.pointerEvents = 'none';
        
        const authToken = localStorage.getItem('authToken');
        console.log('Auth token present:', !!authToken);
        
        if (!authToken) {
            alert('Please log in to like topics');
            likeIconBtn.style.pointerEvents = 'auto';
            return;
        }
        
        console.log('Making API call to toggle like topic...');
        const response = await fetch(`http://localhost:3000/api/topics/${topicId}/toggle-like`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Response error text:', errorText);
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Response data:', data);
        
        if (data.success) {
            // Get the actual like count from server response
            const serverLikeCount = data.data.likeCount;
            const serverIsLiked = data.data.liked;
            
            console.log('Server response - like count:', serverLikeCount, 'is liked:', serverIsLiked);
            
            // Update UI with server values
            if (serverIsLiked) {
                likeIconBtn.textContent = '❤️';
                likeIconBtn.classList.add('liked');
                // Update count styling directly
                likeCount.style.color = '#dc2626';
                likeCount.style.fontWeight = '800';
                likeCount.style.textShadow = '0 1px 2px rgba(220, 38, 38, 0.2)';
            } else {
                likeIconBtn.textContent = '🤍';
                likeIconBtn.classList.remove('liked');
                // Reset count styling
                likeCount.style.color = '#6b7280';
                likeCount.style.fontWeight = '600';
                likeCount.style.textShadow = 'none';
            }
            
            // Update the like count with the server value
            likeCount.textContent = serverLikeCount.toString();
            
            console.log('UI updated successfully');
            
            // Ensure the element remains clickable and interactive
            likeIconBtn.style.cursor = 'pointer';
            likeIconBtn.style.pointerEvents = 'auto';
            
            // Force a reflow to ensure changes are applied
            likeIconBtn.offsetHeight;
            
            // Update the topic in allTopics array to keep data consistent
            const topicIndex = allTopics.findIndex(t => t.id == topicId);
            if (topicIndex !== -1) {
                allTopics[topicIndex].likeCount = serverLikeCount;
                allTopics[topicIndex].isLiked = serverIsLiked;
                console.log('Updated topic in allTopics array:', allTopics[topicIndex]);
            }
            
            // Update the topic in filteredTopics array as well
            const filteredIndex = filteredTopics.findIndex(t => t.id == topicId);
            if (filteredIndex !== -1) {
                filteredTopics[filteredIndex].likeCount = serverLikeCount;
                filteredTopics[filteredIndex].isLiked = serverIsLiked;
                console.log('Updated topic in filteredTopics array:', filteredTopics[filteredIndex]);
            }
           // Re-render topics so UI always matches latest data
           renderTopics();
            
        } else {
            throw new Error(data.message || 'Failed to toggle like');
        }
        
    } catch (error) {
        console.error('Error toggling like:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack
        });
        
        // Show more specific error message
        if (error.message.includes('401')) {
            alert('Please log in again to like topics');
        } else if (error.message.includes('404')) {
            alert('Topic not found');
        } else if (error.message.includes('Failed to fetch')) {
            alert('Server is not running. Please start your backend server.');
        } else {
            alert(`Failed to like topic: ${error.message}`);
        }
    } finally {
        // Re-enable icon button (with safety check)
        if (likeIconBtn) {
            likeIconBtn.style.pointerEvents = 'auto';
        }
    }
}

// View comments for a topic
async function viewComments(topicId, event) {
    event.stopPropagation(); // Prevent card click
    
    try {
        console.log('View comments called for topic:', topicId);
        
        const response = await fetch(`http://localhost:3000/api/topics/${topicId}/comments`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Comments data:', data);
        
        if (data.success) {
            showCommentsModal(topicId, data.data);
        } else {
            throw new Error(data.message || 'Failed to fetch comments');
        }
        
    } catch (error) {
        console.error('Error fetching comments:', error);
        alert(`Failed to load comments: ${error.message}`);
    }
}

// Show comments in a modal (placeholder for now)
function showCommentsModal(topicId, comments) {
    console.log(`Showing comments for topic ${topicId}:`, comments);
    
    // Create modal HTML dynamically
    const modalHTML = `
        <div class="modal-overlay show" id="commentsModalOverlay">
            <div class="modal-content comments-modal">
                <div class="modal-header">
                    <h3>Comments</h3>
                    <button class="close-btn" onclick="closeCommentsModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="comments-list" id="commentsList">
                        ${comments.length === 0 ? 
                            '<p class="no-comments">No comments yet. Be the first to comment!</p>' : 
                            comments.map(comment => {
                                console.log('Rendering comment:', comment);
                                return `
                                <div class="comment-item">
                                    <div class="comment-header">
                                        <strong class="comment-author">${escapeHtml(comment.author || 'Anonymous')}</strong>
                                        <span class="comment-date">${formatDate(comment.createdAt || new Date())}</span>
                                    </div>
                                    <div class="comment-text">${escapeHtml(comment.comment || 'No comment text')}</div>
                                </div>
                                `;
                            }).join('')
                        }
                    </div>
                    <div class="add-comment-section">
                        <h4>Add a Comment</h4>
                        <div class="comment-form">
                            <textarea 
                                id="newCommentText" 
                                placeholder="Share your thoughts..." 
                                rows="3"
                                maxlength="500"
                            ></textarea>
                            <div class="comment-form-actions">
                                <span class="char-count" id="charCount">0/500</span>
                                <button 
                                    class="submit-comment-btn" 
                                    id="submitCommentBtn"
                                    onclick="submitComment(${topicId})"
                                >
                                    Post Comment
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if present
    const existingModal = document.getElementById('commentsModalOverlay');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Add click outside to close
    const modal = document.getElementById('commentsModalOverlay');
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeCommentsModal();
        }
    });
    
    // Add event listeners
    const textarea = document.getElementById('newCommentText');
    const charCount = document.getElementById('charCount');
    
    textarea.addEventListener('input', function() {
        const length = this.value.length;
        charCount.textContent = `${length}/500`;
        
        if (length > 450) {
            charCount.style.color = '#ef4444';
        } else {
            charCount.style.color = '#6b7280';
        }
    });
    
    // Show modal
    document.body.style.overflow = 'hidden';
    
    // Focus on textarea for better UX
    setTimeout(() => {
        textarea.focus();
    }, 100);
}

// Close comments modal
function closeCommentsModal() {
    const modal = document.getElementById('commentsModalOverlay');
    if (modal) {
        modal.remove();
        document.body.style.overflow = 'auto';
    }
}

// Submit a new comment
async function submitComment(topicId) {
    try {
        const textarea = document.getElementById('newCommentText');
        const submitBtn = document.getElementById('submitCommentBtn');
        const comment = textarea.value.trim();
        
        if (!comment) {
            alert('Please enter a comment before submitting.');
            return;
        }
        
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
            alert('Please log in to comment.');
            return;
        }
        
        // Show loading state
        submitBtn.disabled = true;
        submitBtn.textContent = 'Posting...';
        
        console.log('Submitting comment for topic:', topicId, 'Comment:', comment);
        
        const response = await fetch(`http://localhost:3000/api/topics/${topicId}/comments`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ comment: comment })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Comment response:', data);
        
        if (data.success) {
            // Clear the textarea
            textarea.value = '';
            document.getElementById('charCount').textContent = '0/500';
            
            // Show success message
            alert('Comment posted successfully!');
            
            // Refresh the comments in the modal
            const commentsResponse = await fetch(`http://localhost:3000/api/topics/${topicId}/comments`);
            if (commentsResponse.ok) {
                const commentsData = await commentsResponse.json();
                if (commentsData.success) {
                    // Update the comments list
                    const commentsList = document.getElementById('commentsList');
                    const updatedComments = commentsData.data;
                    
                    commentsList.innerHTML = updatedComments.length === 0 ? 
                        '<p class="no-comments">No comments yet. Be the first to comment!</p>' : 
                        updatedComments.map(comment => {
                            console.log('Refreshing comment:', comment);
                            return `
                            <div class="comment-item">
                                <div class="comment-header">
                                    <strong class="comment-author">${escapeHtml(comment.author || 'Anonymous')}</strong>
                                    <span class="comment-date">${formatDate(comment.createdAt || new Date())}</span>
                                </div>
                                <div class="comment-text">${escapeHtml(comment.comment || 'No comment text')}</div>
                            </div>
                            `;
                        }).join('');
                    
                    // Update comment count in the topic card
                    updateCommentCountInUI(topicId, updatedComments.length);
                }
            }
            
        } else {
            throw new Error(data.message || 'Failed to post comment');
        }
        
    } catch (error) {
        console.error('Error posting comment:', error);
        alert(`Failed to post comment: ${error.message}`);
    } finally {
        // Reset button state
        const submitBtn = document.getElementById('submitCommentBtn');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Post Comment';
        }
    }
}

// Update comment count in the UI
function updateCommentCountInUI(topicId, newCount) {
    // Find the topic card and update the comment count
    const topicCard = document.querySelector(`[data-topic-id="${topicId}"]`);
    if (topicCard) {
        const commentCountElement = topicCard.querySelector('.comment-count');
        if (commentCountElement) {
            commentCountElement.textContent = newCount;
        }
    }
    
    // Also update the arrays
    const topicIndex = allTopics.findIndex(t => t.id == topicId);
    if (topicIndex !== -1) {
        allTopics[topicIndex].commentCount = newCount;
    }
    
    const filteredIndex = filteredTopics.findIndex(t => t.id == topicId);
    if (filteredIndex !== -1) {
        filteredTopics[filteredIndex].commentCount = newCount;
    }
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
    
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

// Close modal
function closeModal() {
    const modal = document.getElementById('topicModal');
    if (modal) {
        modal.classList.remove('show');
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
        if (event.target.id === 'commentsModalOverlay') {
            closeCommentsModal();
        } else {
            closeModal();
            closeSuccessModal();
        }
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeModal();
        closeSuccessModal();
        closeCommentsModal();
    }
});
