// --- Helper Functions ---
const getBackendUrl = () => window.location.hostname === '127.0.0.1' && window.location.port === '5500' ? 'http://127.0.0.1:3000' : 'http://localhost:3000';
const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
const escapeHtml = (text) => text.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const showLoading = (show) => { 
    const loadingElement = document.querySelector('.loading-message');
    if (loadingElement) loadingElement.style.display = show ? 'flex' : 'none';
};
const showError = (message) => alert(message);

// --- State ---
const state = {
  allTopics: [],
  filteredTopics: [],
  currentFilter: 'all'
};

// --- DOM Elements ---
const elements = {
    topicsGrid: document.getElementById('topicsGrid'),
    searchInput: document.getElementById('searchInput'),
    emptyState: document.getElementById('emptyState'),
    topicModal: document.getElementById('topicModal'),
    uploadForm: document.getElementById('uploadForm')
};

// --- Authentication & Navigation ---
function checkAuthentication() {
    const token = localStorage.getItem('authToken');
    const currentUser = localStorage.getItem('currentUser');
    const userNameElement = document.getElementById('userName');
    if (currentUser) {
        try {
            const user = JSON.parse(currentUser);
            if (userNameElement) userNameElement.textContent = user.name || 'User';
        } catch (e) {
            if (userNameElement) userNameElement.textContent = 'User';
        }
    } else if (userNameElement) {
        userNameElement.textContent = 'Guest User';
    }
}
function goBack() { window.history.back(); }
function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    window.location.href = '../login/login.html';
}

// --- Topic List Functions ---
async function loadTopics() {
    try {
        showLoading(true);
        const authToken = localStorage.getItem('authToken');
        const headers = { 'Content-Type': 'application/json' };
        if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
        const response = await fetch(`${getBackendUrl()}/api/topics`, { method: 'GET', headers });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        if (data.success) {
            state.allTopics = data.data || [];
            state.filteredTopics = [...state.allTopics];
            renderTopics();
        } else {
            throw new Error(data.message || 'Failed to load topics');
        }
    } catch (error) {
        if (elements.topicsGrid) {
            elements.topicsGrid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: white;"><h3 style="font-size: 1.5rem; margin-bottom: 16px;">Unable to Load Topics</h3><p style="font-size: 1.1rem; opacity: 0.8; margin-bottom: 20px;">${error.message === 'Failed to fetch' ? 'Please make sure your server is running on localhost:3000' : error.message}</p><button onclick="loadTopics()" style="background: rgba(255, 255, 255, 0.2); border: 2px solid rgba(255, 255, 255, 0.3); color: white; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.3s ease;">Try Again</button></div>`;
        }
    } finally {
        showLoading(false);
    }
}
function renderTopics() {
    if (!elements.topicsGrid) return;
    if (state.filteredTopics.length === 0) {
        elements.topicsGrid.style.display = 'none';
        elements.emptyState.style.display = 'block';
        return;
    }
    elements.topicsGrid.style.display = 'grid';
    elements.emptyState.style.display = 'none';
    elements.topicsGrid.innerHTML = state.filteredTopics.map(topic => createTopicCard(topic)).join('');
}
function createTopicCard(topic) {
    const formattedDate = formatDate(topic.createdAt);
    const preview = getContentPreview(topic);
    const likeCount = topic.likeCount || 0;
    const commentCount = topic.commentCount || 0;
    const isLiked = topic.isLiked || false;
    let difficulty = 'beginner';
    if (topic.title.toLowerCase().includes('advanced') || topic.title.toLowerCase().includes('complex')) difficulty = 'advanced';
    else if (topic.title.toLowerCase().includes('intermediate') || topic.title.toLowerCase().includes('tutorial')) difficulty = 'intermediate';
    const authorInitials = topic.author.split(' ').map(name => name[0]).join('').toUpperCase();
    const contentTypeDisplay = { 'text': 'TEXT', 'image': 'IMAGE', 'video': 'VIDEO' }[topic.contentType] || 'TEXT';
    // Cache-busting param for images/videos
    const cacheBuster = `?t=${Date.now()}`;
    return `
        <div class="topic-card" data-topic-id="${topic.id}">
            <div class="topic-overlay">
                <button class="topic-action edit-btn" title="Edit" onclick="editTopic(${topic.id}, event)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
                <button class="topic-action delete-btn" title="Delete" onclick="deleteTopic(${topic.id}, event)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3,6 5,6 21,6"></polyline><path d="m19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2"></path></svg>
                </button>
            </div>
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
                        <img src="${getBackendUrl()}${topic.content}${cacheBuster}" alt="${escapeHtml(topic.title)}" class="topic-image" onclick="openTopicModal(${topic.id})">
                     </div>` : 
                    `<div class="topic-media-container">
                        <video class="topic-video" controls preload="metadata" onclick="openTopicModal(${topic.id})">
                            <source src="${getBackendUrl()}${topic.content}${cacheBuster}" type="video/mp4">
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
function getContentPreview(topic) {
    if (topic.contentType === 'text') {
        return topic.content.substring(0, 150) + (topic.content.length > 150 ? '...' : '');
    }
    return topic.description || 'No description available';
}
function filterTopics() {
    const searchTerm = elements.searchInput.value.toLowerCase();
    state.filteredTopics = state.allTopics.filter(topic => 
        topic.title.toLowerCase().includes(searchTerm) ||
        (topic.description && topic.description.toLowerCase().includes(searchTerm)) ||
        (topic.tags && topic.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
    );
    renderTopics();
}
function filterByType(type) {
    state.currentFilter = type;
    if (type === 'all') {
        state.filteredTopics = [...state.allTopics];
    } else {
        state.filteredTopics = state.allTopics.filter(topic => topic.contentType === type);
    }
    renderTopics();
}

// --- Like & Comment Functions ---
async function toggleLike(topicId, event) {
    event.stopPropagation();
    const likeIconBtn = event.currentTarget;
    const engagementItem = likeIconBtn.parentElement;
    const likeCount = engagementItem.querySelector('.like-count');
    if (!likeCount) return showError('Error: Could not find like elements. Please refresh the page.');
    try {
        likeIconBtn.style.pointerEvents = 'none';
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
            showError('Please log in to like topics');
            likeIconBtn.style.pointerEvents = 'auto';
            return;
        }
        const response = await fetch(`${getBackendUrl()}/api/topics/${topicId}/toggle-like`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        if (data.success) {
            const serverLikeCount = data.data.likeCount;
            const serverIsLiked = data.data.liked;
            likeIconBtn.textContent = serverIsLiked ? '❤️' : '🤍';
            likeIconBtn.classList.toggle('liked', serverIsLiked);
            likeCount.textContent = serverLikeCount.toString();
            likeIconBtn.style.pointerEvents = 'auto';
            const topicIndex = state.allTopics.findIndex(t => t.id == topicId);
            if (topicIndex !== -1) {
                state.allTopics[topicIndex].likeCount = serverLikeCount;
                state.allTopics[topicIndex].isLiked = serverIsLiked;
            }
            const filteredIndex = state.filteredTopics.findIndex(t => t.id == topicId);
            if (filteredIndex !== -1) {
                state.filteredTopics[filteredIndex].likeCount = serverLikeCount;
                state.filteredTopics[filteredIndex].isLiked = serverIsLiked;
            }
            renderTopics();
        } else {
            throw new Error(data.message || 'Failed to toggle like');
        }
    } catch (error) {
        showError('Failed to update like. Please try again.');
        likeIconBtn.style.pointerEvents = 'auto';
    }
}
async function viewComments(topicId, event) {
    event.stopPropagation();
    try {
        const authToken = localStorage.getItem('authToken');
        if (!authToken) return showError('Please log in to view comments');
        const response = await fetch(`${getBackendUrl()}/api/topics/${topicId}/comments`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        if (data.success) {
            showCommentsModal(topicId, data.data);
            const topicIndex = state.allTopics.findIndex(t => t.id == topicId);
            if (topicIndex !== -1) state.allTopics[topicIndex].commentCount = data.data.length;
            renderTopics();
        } else {
            throw new Error(data.message || 'Failed to load comments');
        }
    } catch (error) {
        showError('Failed to load comments. Please try again.');
    }
}
function showCommentsModal(topicId, comments) {
    const modal = document.getElementById('commentsModal');
    const commentsList = document.getElementById('commentsList');
    const commentInput = document.getElementById('commentInput');
    if (!modal || !commentsList || !commentInput) return;
    commentsList.innerHTML = comments.map(comment => `
        <div class="comment-item">
            <div class="comment-header">
                <span class="comment-author">${escapeHtml(comment.author)}</span>
                <span class="comment-date">${formatDate(comment.createdAt)}</span>
            </div>
            <p class="comment-text">${escapeHtml(comment.comment)}</p>
        </div>
    `).join('');
    commentInput.value = '';
    commentInput.setAttribute('data-topic-id', topicId);
    modal.style.display = 'flex';
    const form = document.getElementById('addCommentForm');
    if (form) form.setAttribute('data-topic-id', topicId);
}
function closeCommentsModal() {
    const modal = document.getElementById('commentsModal');
    if (modal) modal.style.display = 'none';
}
async function submitComment(topicId) {
    const commentInput = document.getElementById('commentInput');
    const comment = commentInput.value.trim();
    if (!comment) return showError('Please enter a comment');
    try {
        const authToken = localStorage.getItem('authToken');
        if (!authToken) return showError('Please log in to add comments');
        const response = await fetch(`${getBackendUrl()}/api/topics/${topicId}/comments`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ comment })
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        if (data.success) {
            commentInput.value = '';
            viewComments(topicId, { stopPropagation: () => {} });
        } else {
            throw new Error(data.message || 'Failed to add comment');
        }
    } catch (error) {
        showError('Failed to add comment. Please try again.');
    }
}
function updateCommentCount(topicId) {
    const topicIndex = state.allTopics.findIndex(t => t.id == topicId);
    if (topicIndex !== -1) {
        if (!state.allTopics[topicIndex].commentCount) state.allTopics[topicIndex].commentCount = 0;
        state.allTopics[topicIndex].commentCount++;
    }
    const filteredIndex = state.filteredTopics.findIndex(t => t.id == topicId);
    if (filteredIndex !== -1) {
        if (!state.filteredTopics[filteredIndex].commentCount) state.filteredTopics[filteredIndex].commentCount = 0;
        state.filteredTopics[filteredIndex].commentCount++;
    }
    renderTopics();
}

// --- Modal Functions ---
function openTopicModal(topicId) {
    const topic = state.allTopics.find(t => t.id == topicId);
    if (!topic) return;
    const modal = document.getElementById('topicModal');
    const modalContent = document.getElementById('modalContent');
    if (!modal || !modalContent) return;
    let contentHtml = '';
    if (topic.contentType === 'text') {
        contentHtml = `<div class="modal-text-content">${escapeHtml(topic.content)}</div>`;
    } else if (topic.contentType === 'image') {
        const cacheBuster = `?t=${Date.now()}`;
        contentHtml = `<img src="${getBackendUrl()}${topic.content}${cacheBuster}" alt="${escapeHtml(topic.title)}" class="modal-image">`;
    } else if (topic.contentType === 'video') {
        const cacheBuster = `?t=${Date.now()}`;
        contentHtml = `<video controls class="modal-video"><source src="${getBackendUrl()}${topic.content}${cacheBuster}" type="video/mp4"></video>`;
    }
    modalContent.innerHTML = `
        <div class="modal-header">
            <h2>${escapeHtml(topic.title)}</h2>
            <button onclick="closeModal()" class="close-btn">×</button>
        </div>
        <div class="modal-body">
            ${contentHtml}
            <div class="modal-description">
                <p>${escapeHtml(topic.description || 'No description available')}</p>
            </div>
        </div>
    `;
    modal.style.display = 'flex';
}
function closeModal() {
    const modal = document.getElementById('topicModal');
    if (modal) modal.style.display = 'none';
}

// --- Upload Form Functions ---
function initializeUploadForm() {
    const contentTypeSelect = document.getElementById('contentType');
    const textInput = document.getElementById('textInput');
    const fileInput = document.getElementById('fileInput');
    const uploadArea = document.getElementById('uploadArea');
    if (contentTypeSelect) {
        contentTypeSelect.addEventListener('change', () => {
            const selectedType = contentTypeSelect.value;
            if (selectedType === 'text') {
                textInput.style.display = 'block';
                fileInput.style.display = 'none';
                uploadArea.style.display = 'none';
            } else {
                textInput.style.display = 'none';
                fileInput.style.display = 'block';
                uploadArea.style.display = 'block';
            }
        });
    }
    if (uploadArea) setupDragAndDrop(uploadArea);
    if (elements.uploadForm) elements.uploadForm.addEventListener('submit', handleFormSubmit);
    // File input preview
    if (fileInput) fileInput.addEventListener('change', handleFileSelect);
}
function setupDragAndDrop(area) {
    area.addEventListener('dragover', e => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        area.classList.add('drag-over');
    });
    area.addEventListener('dragleave', () => area.classList.remove('drag-over'));
    area.addEventListener('drop', e => {
        e.preventDefault();
        area.classList.remove('drag-over');
        const files = e.dataTransfer.files;
        if (files.length > 0) handleFileSelect({ target: { files } });
    });
}
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    // Detect content type from radio buttons
    const imageRadio = document.getElementById('contentType-image');
    const videoRadio = document.getElementById('contentType-video');
    const contentType = imageRadio && imageRadio.checked
        ? 'image'
        : videoRadio && videoRadio.checked
            ? 'video'
            : 'text';
    const allowedTypes = contentType === 'image' ? ['image/*'] : ['video/*'];
    if (!allowedTypes.some(type => file.type.match(type))) {
        showError(`Please select a valid ${contentType} file`);
        return;
    }
    const preview = document.getElementById('filePreview');
    if (preview) {
        const reader = new FileReader();
        reader.onload = e => {
            if (contentType === 'image') {
                preview.innerHTML = `<img src="${e.target.result}" alt="Preview" style="max-width: 100%; max-height: 200px;">`;
            } else {
                preview.innerHTML = `<video controls style="max-width: 100%; max-height: 200px;"><source src="${e.target.result}"></video>`;
            }
            preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}
function clearFilePreview() {
    const preview = document.getElementById('filePreview');
    const fileInput = document.getElementById('fileInput');
    if (preview) preview.style.display = 'none';
    if (fileInput) fileInput.value = '';
}
async function handleFormSubmit(event) {
    event.preventDefault();
    const formData = new FormData();
    const titleInput = document.getElementById('topicTitle');
    const title = titleInput ? titleInput.value : '';
    const descriptionInput = document.getElementById('topicDescription');
    const description = descriptionInput ? descriptionInput.value.trim() : '';
    const categoryInput = document.getElementById('topicCategory');
    const category = categoryInput ? categoryInput.value : '';
    const contentTypeRadio = document.querySelector('input[name="contentType"]:checked');
    const contentType = contentTypeRadio ? contentTypeRadio.value : '';
    if (!title) return showError('Please enter a title');
    formData.append('title', title);
    formData.append('description', description);
    formData.append('category', category);
    formData.append('contentType', contentType);
    if (contentType === 'text') {
        const textContent = document.getElementById('textContent').value.trim();
        if (!textContent) return showError('Please enter text content');
        formData.append('textContent', textContent);
    } else {
        const file = document.getElementById('fileInput').files[0];
        if (!file) return showError('Please select a file');
        formData.append('file', file);
    }
    try {
        const authToken = localStorage.getItem('authToken');
        if (!authToken) return showError('Please log in to upload topics');
        const response = await fetch(`${getBackendUrl()}/api/topics/upload`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}` },
            body: formData
        });
        let data = null;
        try {
            data = await response.json();
        } catch (e) {
            // If not JSON, fallback to status text
            data = { success: false, message: response.statusText };
        }
        // Enhanced logging for debugging
        console.log('Upload response status:', response.status);
        console.log('Upload response data:', data);
        if (response.ok && data.success) {
            console.log('Topic upload successful!');
            showSuccessModal("Your topic was uploaded successfully!");
            if (typeof loadTopics === 'function') loadTopics(); // Reload topics if available
        } else {
            console.error('Topic upload failed:', data.message || response.statusText);
            showError(data.message || `Failed to upload topic. Status: ${response.status}`);
        }
    } catch (error) {
        console.error('Upload error:', error);
        showError(error.message || 'Failed to upload topic. Please try again.');
    }
}
function resetForm() {
    if (elements.uploadForm) elements.uploadForm.reset();
    clearFilePreview();
    const textInput = document.getElementById('textInput');
    const fileInput = document.getElementById('fileInput');
    if (textInput) textInput.style.display = 'none';
    if (fileInput) fileInput.style.display = 'none';
}
function showSuccessModal(message) {
  const modal = document.getElementById('successModal');
  const msg = document.getElementById('successMessage');
  if (modal && msg) {
    msg.textContent = message || "Your topic was uploaded successfully.";
    modal.style.display = "flex";
  }
}
function closeSuccessModal() {
  const modal = document.getElementById('successModal');
  if (modal) modal.style.display = "none";
}
function viewTopics() {
    window.location.href = 'topics.html';
}

// Toggle content input visibility based on selected type
function toggleContentInput() {
    const textContentGroup = document.getElementById('textContentGroup');
    const fileUploadGroup = document.getElementById('fileUploadGroup');
    const fileInput = document.getElementById('fileInput');
    const filePreview = document.getElementById('filePreview');
    const contentTypeText = document.getElementById('contentType-text').checked;
    const contentTypeImage = document.getElementById('contentType-image').checked;
    const contentTypeVideo = document.getElementById('contentType-video').checked;

    if (contentTypeText) {
        textContentGroup.style.display = 'block';
        fileUploadGroup.style.display = 'none';
        if (fileInput) fileInput.value = '';
        if (filePreview) filePreview.style.display = 'none';
    } else if (contentTypeImage) {
        textContentGroup.style.display = 'none';
        fileUploadGroup.style.display = 'block';
        if (fileInput) fileInput.accept = 'image/*';
    } else if (contentTypeVideo) {
        textContentGroup.style.display = 'none';
        fileUploadGroup.style.display = 'block';
        if (fileInput) fileInput.accept = 'video/*';
    }
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    checkAuthentication();
    if (window.location.pathname.includes('topics.html')) {
        loadTopics();
        if (elements.searchInput) elements.searchInput.addEventListener('input', filterTopics);
    } else if (window.location.pathname.includes('upload-topic.html')) {
        initializeUploadForm();
    }
    // Add comment form handler if present
    const form = document.getElementById('addCommentForm');
    if (form && !form.hasListener) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const topicId = this.getAttribute('data-topic-id');
            submitComment(topicId);
        });
        form.hasListener = true;
    }
});


// --- Topic Edit/Delete Functions ---
async function deleteTopic(topicId, event) {
    event.stopPropagation();
    // Defensive: ensure topicId is a number
    topicId = Number(topicId);
    if (!topicId || isNaN(topicId)) return showError('Invalid topic ID');
    if (!confirm('Are you sure you want to delete this topic?')) return;
    try {
        const authToken = localStorage.getItem('authToken');
        if (!authToken) return showError('Please log in to delete topics');
        const response = await fetch(`${getBackendUrl()}/api/topics/${topicId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (!response.ok) {
            let msg = `HTTP error! status: ${response.status}`;
            try { const err = await response.json(); if (err && err.message) msg = err.message; } catch {}
            throw new Error(msg);
        }
        const data = await response.json();
        if (data.success) {
            // Remove from state (use == for type coercion)
            state.allTopics = state.allTopics.filter(t => t.id != topicId);
            state.filteredTopics = state.filteredTopics.filter(t => t.id != topicId);
            renderTopics();
            // Optionally show a toast or alert
            // alert('Topic deleted successfully.');
        } else {
            throw new Error(data.message || 'Failed to delete topic');
        }
    } catch (error) {
        showError(error.message || 'Failed to delete topic. Please try again.');
    }
}

function editTopic(topicId, event) {
    event.stopPropagation();
    const topic = state.allTopics.find(t => t.id == topicId);
    if (!topic) return showError('Topic not found');
    // Open modal for editing (reuse upload modal if possible)
    const modal = document.getElementById('topicModal');
    const modalContent = document.getElementById('modalContent');
    if (!modal || !modalContent) return showError('Edit modal not found');
    // Build edit form
    let mediaPreview = '';
    let mediaInput = '';
    const cacheBuster = `?t=${Date.now()}`;
    if (topic.contentType === 'image') {
        mediaPreview = `<div id="editMediaPreview" class="edit-preview-media"><img src="${getBackendUrl()}${topic.content}${cacheBuster}" alt="Current Image" style="max-width:100%;max-height:180px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.08);margin-bottom:8px;"></div>`;
        mediaInput = `<label>Replace Image:<input type="file" id="editMediaFile" accept="image/*"></label>`;
    } else if (topic.contentType === 'video') {
        mediaPreview = `<div id="editMediaPreview" class="edit-preview-media"><video src="${getBackendUrl()}${topic.content}${cacheBuster}" controls style="max-width:100%;max-height:180px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.08);margin-bottom:8px;"></video></div>`;
        mediaInput = `<label>Replace Video:<input type="file" id="editMediaFile" accept="video/*"></label>`;
    }
    modalContent.innerHTML = `
        <div class="modal-header">
            <h2>Edit Topic</h2>
            <button onclick="closeModal()" class="close-btn">×</button>
        </div>
        <form id="editTopicForm" class="edit-modal-form">
            <label>Title:<input type="text" id="editTitle" value="${escapeHtml(topic.title)}" required></label>
            <label>Description:<textarea id="editDescription" rows="2">${escapeHtml(topic.description || '')}</textarea></label>
            <label>Category:<input type="text" id="editCategory" value="${escapeHtml(topic.category || '')}"></label>
            ${topic.contentType === 'text' ?
                `<label>Content:<textarea id="editContent" rows="4">${escapeHtml(topic.content)}</textarea></label>` :
                `${mediaPreview}${mediaInput}`
            }
            <button type="submit" class="edit-modal-save">Save Changes</button>
        </form>
    `;
    modal.style.display = 'flex';
    // Add preview for new file selection
    if (topic.contentType !== 'text') {
        const fileInput = document.getElementById('editMediaFile');
        const previewDiv = document.getElementById('editMediaPreview');
        if (fileInput && previewDiv) {
            fileInput.addEventListener('change', function() {
                const file = fileInput.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = function(e) {
                    if (topic.contentType === 'image') {
                        previewDiv.innerHTML = `<img src="${e.target.result}" alt="Preview" style="max-width:100%;max-height:180px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.08);margin-bottom:8px;">`;
                    } else if (topic.contentType === 'video') {
                        previewDiv.innerHTML = `<video src="${e.target.result}" controls style="max-width:100%;max-height:180px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.08);margin-bottom:8px;"></video>`;
                    }
                };
                reader.readAsDataURL(file);
            });
        }
    }
    // Add submit handler
    const form = document.getElementById('editTopicForm');
    if (form) {
        form.onsubmit = async function(e) {
            e.preventDefault();
            const fileInput = document.getElementById('editMediaFile');
            let file = fileInput && fileInput.files && fileInput.files[0] ? fileInput.files[0] : null;
            await submitEditTopic(topicId, file);
        };
    }
}

async function submitEditTopic(topicId, file) {
    const title = document.getElementById('editTitle').value.trim();
    const description = document.getElementById('editDescription').value.trim();
    const category = document.getElementById('editCategory').value.trim();
    const topic = state.allTopics.find(t => t.id == topicId);
    if (!title) return showError('Title is required');
    try {
        const authToken = localStorage.getItem('authToken');
        if (!authToken) return showError('Please log in to edit topics');
        let response, data;
        if (topic && topic.contentType !== 'text') {
            // For image/video, use FormData
            const formData = new FormData();
            formData.append('title', title);
            formData.append('description', description);
            formData.append('category', category);
            if (file) formData.append('file', file);
            response = await fetch(`${getBackendUrl()}/api/topics/${topicId}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${authToken}` },
                body: formData
            });
        } else {
            // For text, send JSON
            const content = document.getElementById('editContent').value.trim();
            const body = { title, description, category, content };
            response = await fetch(`${getBackendUrl()}/api/topics/${topicId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });
        }
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        data = await response.json();
        if (data && data.data && data.data.content) {
            console.log('Backend returned content path:', data.data.content);
        }
        if (data.success) {
            closeModal();
            alert('Topic updated successfully!');
            if (typeof loadTopics === 'function') loadTopics(); // Reload topics from backend
        } else {
            throw new Error(data.message || 'Failed to update topic');
        }
    } catch (error) {
        showError('Failed to update topic. Please try again.');
    }
}

function openEditTopicModal() {
  document.getElementById('editTopicModal').style.display = 'flex';
}
function closeEditTopicModal() {
  document.getElementById('editTopicModal').style.display = 'none';
}
