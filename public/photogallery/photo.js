// Global state
let allPhotos = [], filteredPhotos = [], currentModalIndex = 0, currentEditingPhotoId = null;

// DOM elements
const elements = {
    gallery: document.getElementById('gallery-grid'),
    loading: document.getElementById('loading-spinner'),
    noPhotos: document.getElementById('no-photos'),
    search: document.querySelector('.search-input'),
    filters: document.querySelectorAll('.filter-tab'),
    modal: document.getElementById('photo-modal'),
    modalImg: document.querySelector('.modal-image'),
    modalTitle: document.querySelector('.modal-title'),
    modalDesc: document.querySelector('.modal-description'),
    modalDate: document.querySelector('.modal-date'),
    modalTag: document.querySelector('.modal-tag'),
    modalClose: document.querySelector('.modal-close'),
    modalBackdrop: document.querySelector('.modal-backdrop'),
    modalLeft: document.getElementById('modal-arrow-left'),
    modalRight: document.getElementById('modal-arrow-right')
};

// Helper functions
// Use the same protocol, hostname, and (optionally) port as the page, but default to 3000 if running on 5500 (Live Server)
const getBackendUrl = () => {
    // If running on Live Server (port 5500), assume backend is on 3000 at same host
    if (window.location.port === '5500') {
        return `${window.location.protocol}//${window.location.hostname}:3000`;
    }
    // Otherwise, use same origin
    return `${window.location.protocol}//${window.location.host}`;
};
const formatDate = (date) => new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
const showLoading = () => { elements.loading.style.display = 'flex'; elements.gallery.style.display = 'none'; elements.noPhotos.style.display = 'none'; };
const hideLoading = () => { elements.loading.style.display = 'none'; elements.gallery.style.display = 'grid'; };
const showNoPhotos = () => { elements.gallery.style.display = 'none'; elements.noPhotos.style.display = 'block'; };
const hideNoPhotos = () => { elements.noPhotos.style.display = 'none'; elements.gallery.style.display = 'grid'; };

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const uploadForm = document.getElementById('memory-form');
    if (uploadForm) {
        setupUpload();
        return;
    }
    
    loadPhotos();
    setupEvents();
    
    // Move modal arrows
    const modalContent = elements.modal.querySelector('.modal-content');
    if (elements.modalLeft && elements.modalRight && elements.modal && modalContent) {
        elements.modal.insertBefore(elements.modalLeft, modalContent);
        elements.modal.appendChild(elements.modalRight);
    }
});
document.addEventListener('DOMContentLoaded', function() {
    const uploadForm = document.getElementById('memory-form');
    if (uploadForm) {
        setupUpload();
    } else {
        // Only run gallery logic if not on upload page
        loadPhotos();
        setupEvents();
        // Move modal arrows
        const modalContent = elements.modal.querySelector('.modal-content');
        if (elements.modalLeft && elements.modalRight && elements.modal && modalContent) {
            elements.modal.insertBefore(elements.modalLeft, modalContent);
            elements.modal.appendChild(elements.modalRight);
        }
    }
});

// Setup event listeners
function setupEvents() {
    elements.search.addEventListener('input', handleSearch);
    elements.filters.forEach(tab => tab.addEventListener('click', handleFilter));
    elements.modalClose.addEventListener('click', closeModal);
    elements.modalBackdrop.addEventListener('click', closeModal);
    elements.modalLeft.addEventListener('click', e => { e.stopPropagation(); showModalPhoto(currentModalIndex - 1); });
    elements.modalRight.addEventListener('click', e => { e.stopPropagation(); showModalPhoto(currentModalIndex + 1); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
}

// Load photos
async function loadPhotos() {
    try {
        showLoading();
        let userId = 1;
        const user = localStorage.getItem('currentUser');
        if (user) {
            try { userId = JSON.parse(user).id || JSON.parse(user).userId || 1; } catch (e) { console.error('Error parsing user data:', e); }
        }
        
        const authToken = localStorage.getItem('authToken');
        const headers = {};
        if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
        
        const response = await fetch(`${getBackendUrl()}/photos`, { 
            method: 'GET',
            headers: headers
        });
        const result = await response.json();
        
        if (result.success && result.data) {
            allPhotos = result.data;
            filteredPhotos = [...allPhotos];
            displayPhotos(filteredPhotos);
        } else {
            showNoPhotos();
        }
    } catch (error) {
        console.error('Error loading photos:', error);
        showNoPhotos();
    } finally {
        hideLoading();
    }
}

// Display photos
function displayPhotos(photos) {
    if (!photos || photos.length === 0) {
        showNoPhotos();
        return;
    }
    hideNoPhotos();
    elements.gallery.innerHTML = '';
    photos.forEach(photo => elements.gallery.appendChild(createPhotoCard(photo)));
}

// Create photo card
function createPhotoCard(photo) {
    const card = document.createElement('div');
    card.className = 'photo-card';
    card.setAttribute('data-category', photo.category?.toLowerCase() || 'other');
    
    const favoriteIcon = photo.isFavorite ? 
        '<svg class="favorite-icon active" viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>' :
        '<svg class="favorite-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';

    // Use imageUrl directly if present (for imgbb), otherwise fallback
    const imgSrc = photo.imageUrl
        ? photo.imageUrl
        : (photo.photoUrl ? photo.photoUrl : 'default-image.png');
    card.innerHTML = `
        <div class="photo-wrapper">
            <img src="${imgSrc}" alt="${photo.title}" class="photo-image" loading="lazy">
            <div class="photo-overlay">
                <button class="photo-action edit-btn" onclick="editPhoto(${photo.id})" data-id="${photo.id}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                </button>
                <button class="photo-action favorite-btn" onclick="toggleFavorite(${photo.id}, this)" data-id="${photo.id}">
                    ${favoriteIcon}
                </button>
                <button class="photo-action delete-btn" onclick="deletePhoto(${photo.id})" data-id="${photo.id}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3,6 5,6 21,6"></polyline>
                        <path d="m19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2"></path>
                    </svg>
                </button>
            </div>
        </div>
        <div class="photo-info">
            <h3 class="photo-title">${photo.title}</h3>
            <p class="photo-description">${photo.description || ''}</p>
            <div class="photo-meta">
                <span class="photo-date">${formatDate(photo.date)}</span>
                ${photo.category ? `<span class="photo-tag">${photo.category}</span>` : ''}
                ${photo.location ? `<span class="photo-location">📍 ${photo.location}</span>` : ''}
            </div>
        </div>
    `;
    card.addEventListener('click', e => { if (!e.target.closest('.photo-action')) openModal(photo); });
    return card;
}

// Centralized search and filter logic (now inside setupEvents)
function filterPhotos() {
    const searchTerm = elements.search.value.toLowerCase();
    let photos = searchTerm === '' ? [...allPhotos] : allPhotos.filter(photo =>
        (photo.title && photo.title.toLowerCase().includes(searchTerm)) ||
        (photo.description && photo.description.toLowerCase().includes(searchTerm)) ||
        (photo.location && photo.location.toLowerCase().includes(searchTerm)) ||
        (photo.category && photo.category.toLowerCase().includes(searchTerm))
    );
    const activeTab = document.querySelector('.filter-tab.active');
    const filter = activeTab ? activeTab.dataset.filter : 'recent';
    switch (filter) {
        case 'recent':
            photos = photos.sort((a, b) => new Date(b.uploadedAt || b.date) - new Date(a.uploadedAt || a.date));
            break;
        case 'favorites':
            photos = photos.filter(photo => photo.isFavorite);
            break;
        case 'family': case 'travel': case 'friends': case 'nature': case 'celebrations': case 'hobbies':
            photos = photos.filter(photo => photo.category && photo.category.toLowerCase() === filter);
            break;
    }
    filteredPhotos = [...photos];
    displayPhotos(photos);
}

function handleSearch() { filterPhotos(); }
function handleFilter(e) {
    elements.filters.forEach(tab => tab.classList.remove('active'));
    e.target.classList.add('active');
    filterPhotos();
}

// Delete photo function 
async function deletePhoto(photoId) {
    if (!confirm('Are you sure you want to delete this memory? This action cannot be undone.')) return;
    try {
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
            alert('Please log in to delete photos');
            return;
        }
        const response = await fetch(`${getBackendUrl()}/photos/${photoId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        let result;
        try {
            result = await response.json();
        } catch (e) {
            result = { success: false, message: 'Invalid JSON response', raw: await response.text() };
        }
        console.log('Delete photo response:', result);
        if (result.success) {
            allPhotos = allPhotos.filter(photo => photo.id !== photoId);
            filteredPhotos = filteredPhotos.filter(photo => photo.id !== photoId);
            filterPhotos();
            alert('Memory deleted successfully');
        } else {
            alert('Failed to delete memory: ' + (result.message || result.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error deleting photo:', error);
        alert('Error deleting memory: ' + (error.message || error));
    }
}

// Edit functions
function editPhoto(photoId) {
    const photo = allPhotos.find(p => p.id === photoId);
    if (!photo) { alert('Photo not found'); return; }

    currentEditingPhotoId = photoId;
    
    document.getElementById('edit-title').value = photo.title || '';
    document.getElementById('edit-description').value = photo.description || '';
    document.getElementById('edit-date').value = photo.date ? photo.date.split('T')[0] : '';
    document.getElementById('edit-category').value = photo.category || '';
    document.getElementById('edit-location').value = photo.location || '';
    document.getElementById('edit-favorite').checked = photo.isFavorite || false;
    
    const currentImage = document.getElementById('current-image');
    const currentImageContainer = document.getElementById('current-image-container');
    const imageSrc = photo.imageUrl || photo.photoUrl || 'default-image.png';
    if (imageSrc) {
        currentImage.src = imageSrc;
        currentImageContainer.style.display = 'block';
    } else {
        currentImageContainer.style.display = 'none';
    }
    
    clearImagePreview();
    document.getElementById('edit-modal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeEditModal() {
    document.getElementById('edit-modal').classList.remove('active');
    document.body.style.overflow = '';
    currentEditingPhotoId = null;
    clearImagePreview();
}

function clearImagePreview() {
    const preview = document.getElementById('edit-image-preview');
    const img = document.getElementById('edit-preview-img');
    const fileInput = document.getElementById('edit-image');
    if (preview && img && fileInput) {
        preview.style.display = 'none';
        img.src = '';
        fileInput.value = '';
    }
}

// Upload functions
function setupUpload() {
    const uploadForm = document.getElementById('memory-form');
    const fileInput = document.getElementById('photo-upload');
    const uploadArea = document.getElementById('upload-area');
    const previewContainer = document.getElementById('preview-container');
    const browseButton = document.getElementById('browse-btn');
    
    if (!uploadForm || !fileInput || !uploadArea || !previewContainer) return;
    
    fileInput.addEventListener('change', handleFileSelection);
    
    if (browseButton) {
        browseButton.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); fileInput.click(); });
    }
    
    uploadArea.addEventListener('click', e => {
        if (e.target.id === 'browse-btn' || e.target.closest('#browse-btn')) return;
        fileInput.click();
    });
    
    uploadArea.addEventListener('dragover', e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; });
    uploadArea.addEventListener('drop', handleFileDrop);
    uploadForm.addEventListener('submit', handleUploadSubmission);
}

function handleFileSelection(e) {
    const files = Array.from(e.target.files);
    if (files.length > 0) displayFilePreview(files[0]);
}

function handleFileDrop(e) {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    if (imageFiles.length > 0) {
        document.getElementById('photo-upload').files = e.dataTransfer.files;
        displayFilePreview(imageFiles[0]);
    }
}

function displayFilePreview(file) {
    const previewContainer = document.getElementById('preview-container');
    const reader = new FileReader();
    
    reader.onload = function(e) {
        previewContainer.innerHTML = `
            <div class="preview-item">
                <img src="${e.target.result}" alt="Preview" class="preview-image">
                <div class="preview-info">
                    <span class="preview-name">${file.name}</span>
                    <span class="preview-size">${(file.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
                <button type="button" class="remove-preview" onclick="removeFilePreview()">×</button>
            </div>
        `;
        previewContainer.style.display = 'block';
    };
    
    reader.readAsDataURL(file);
}

function removeFilePreview() {
    const previewContainer = document.getElementById('preview-container');
    const fileInput = document.getElementById('photo-upload');
    previewContainer.innerHTML = '';
    previewContainer.style.display = 'none';
    fileInput.value = '';
}

async function handleUploadSubmission(e) {
    e.preventDefault();
    console.log('[DEBUG] Upload form submitted');


    const fileInput = document.getElementById('photo-upload');
    if (!fileInput) { alert('Photo input not found'); return; }
    const file = fileInput.files[0];
    console.log('[DEBUG] Selected file:', file);
    if (!file) { alert('Please select a photo to upload'); return; }

    const titleInput = document.getElementById('memory-title');
    const descriptionInput = document.getElementById('memory-description');
    const dateInput = document.getElementById('memory-date');
    const categoryInput = document.getElementById('memory-category');
    const locationInput = document.getElementById('memory-location');
    const favoriteInput = document.getElementById('memory-favorite');

    if (!titleInput || !descriptionInput || !dateInput || !categoryInput || !locationInput || !favoriteInput) {
        alert('One or more form fields are missing.');
        return;
    }

    const title = titleInput.value.trim();
    const description = descriptionInput.value.trim();
    const date = dateInput.value;
    const category = categoryInput.value || 'General';
    const location = locationInput.value.trim();
    const isFavorite = favoriteInput.checked;

    console.log('[DEBUG] Form values:', { title, description, date, category, location, isFavorite });
    if (!title) { alert('Please enter a title for your memory'); return; }

    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalText = submitButton.innerHTML;

    try {
        submitButton.innerHTML = '<span class="button-icon">⏳</span> Saving...';
        submitButton.disabled = true;

        let userId = 1;
        const currentUser = localStorage.getItem('currentUser');
        if (currentUser) {
            try { userId = JSON.parse(currentUser).id || JSON.parse(currentUser).userId || 1; } catch (e) { console.error('[DEBUG] Error parsing user data:', e); }
        }

        const formData = new FormData();
        formData.append('photo', file);
        formData.append('title', title);
        formData.append('description', description);
        formData.append('date', date || new Date().toISOString().split('T')[0]);
        formData.append('category', category);
        formData.append('location', location);
        formData.append('isFavorite', isFavorite);
        formData.append('userId', userId);

        console.log('[DEBUG] FormData entries:');
        for (let pair of formData.entries()) {
            console.log('  ', pair[0], pair[1]);
        }

        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
            throw new Error('Please log in to upload photos');
        }
        let response;
        try {
            console.log('[DEBUG] Sending fetch to:', `${getBackendUrl()}/photos/upload`);
            response = await fetch(`${getBackendUrl()}/photos/upload`, { 
                method: 'POST', 
                headers: { 'Authorization': `Bearer ${authToken}` },
                body: formData,
                credentials: 'include' // Required for CORS with credentials
            });
            console.log('[DEBUG] Fetch response received:', response);
        } catch (networkError) {
            console.error('[DEBUG] Network error or CORS issue:', networkError);
            alert('Network error: Could not reach the server.\nPossible CORS issue, server crash, or network disconnect.');
            return;
        }

        if (!response.ok) {
            let errorText = '';
            try {
                errorText = await response.text();
            } catch (e) {
                errorText = '[No response body]';
            }
            let errorMessage = 'Upload failed';
            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.message || errorData.error || 'Upload failed';
            } catch (e) {
                errorMessage = errorText || `HTTP ${response.status}: Upload failed`;
            }
            // Extra logging for debugging
            console.error('[DEBUG] Upload failed. Status:', response.status, 'Response:', errorText);
            alert('[DEBUG] ' + errorMessage + `\n(HTTP ${response.status})`);
            return;
        }

        let result;
        try {
            result = await response.json();
            console.log('[DEBUG] Parsed JSON result:', result);
        } catch (jsonErr) {
            // Try to get the raw text for debugging
            let rawText = '';
            try {
                rawText = await response.text();
            } catch (e) {
                rawText = '[No response body]';
            }
            console.error('[DEBUG] Failed to parse JSON response:', jsonErr, 'Raw response:', rawText);
            alert('[DEBUG] Upload succeeded but server returned invalid JSON.\nRaw response: ' + rawText);
            return;
        }
        if (result.success) {
            console.log('[DEBUG] Upload success, result.data:', result.data);
            // Optimistically add the new photo to the gallery
            const newPhoto = {
                id: result.data.id,
                title,
                description,
                date: date || new Date().toISOString().split('T')[0],
                category,
                location,
                isFavorite,
                imageUrl: result.data.imageUrl,
                userId
            };
            allPhotos.unshift(newPhoto);
            filterPhotos();
            alert('[DEBUG] Memory saved successfully!');
            // Optionally, you can reset the form or redirect after a short delay
            setTimeout(() => { window.location.href = 'photo.html'; }, 500);
        } else {
            console.error('[DEBUG] Upload failed, result:', result);
            alert('[DEBUG] Failed to save memory: ' + (result.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('[DEBUG] Upload error:', error);
        alert('[DEBUG] ' + ((error && error.message ? error.message : error) || 'Error uploading photo. Please try again.'));
    } finally {
        submitButton.innerHTML = originalText;
        submitButton.disabled = false;
    }
}

// Edit form submission (merged into main DOMContentLoaded)
document.addEventListener('DOMContentLoaded', function() {
    const editForm = document.getElementById('edit-form');
    if (editForm) {
        editForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            if (!currentEditingPhotoId) { alert('No photo selected for editing'); return; }
            const title = document.getElementById('edit-title').value.trim();
            const description = document.getElementById('edit-description').value.trim();
            const date = document.getElementById('edit-date').value;
            const category = document.getElementById('edit-category').value;
            const location = document.getElementById('edit-location').value.trim();
            const isFavorite = document.getElementById('edit-favorite').checked;
            const imageFile = document.getElementById('edit-image').files[0];
            if (!title) { alert('Title is required'); return; }
            try {
                const formData = new FormData();
                formData.append('title', title);
                formData.append('description', description);
                formData.append('date', date);
                formData.append('category', category || 'General');
                formData.append('location', location);
                formData.append('isFavorite', isFavorite);
                if (imageFile) formData.append('photo', imageFile);
                const authToken = localStorage.getItem('authToken');
                if (!authToken) {
                    alert('Please log in to edit photos');
                    return;
                }
                const response = await fetch(`${getBackendUrl()}/photos/${currentEditingPhotoId}`, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${authToken}` },
                    body: formData
                });
                const result = await response.json();
                if (result.success) {
                    const photoIndex = allPhotos.findIndex(p => p.id === currentEditingPhotoId);
                    if (photoIndex !== -1) {
                        const updatedPhoto = { ...allPhotos[photoIndex], title, description, date, category: category || 'General', location, isFavorite };
                        if (result.data && result.data.imageUrl) updatedPhoto.imageUrl = result.data.imageUrl;
                        allPhotos[photoIndex] = updatedPhoto;
                    }
                    filterPhotos();
                    closeEditModal();
                    alert('Memory updated successfully!');
                } else {
                    alert('Error updating memory: ' + (result.message || 'Unknown error'));
                }
            } catch (error) {
                console.error('Update error:', error);
                alert('Error updating memory. Please try again.');
            }
        });
    }

    // Add preview for new image in edit modal
    const editImageInput = document.getElementById('edit-image');
    if (editImageInput) {
        editImageInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            const preview = document.getElementById('edit-image-preview');
            const img = document.getElementById('edit-preview-img');
            if (file && preview && img) {
                const reader = new FileReader();
                reader.onload = function(ev) {
                    img.src = ev.target.result;
                    preview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            } else if (preview && img) {
                preview.style.display = 'none';
                img.src = '';
            }
        });
    }
});


// Utility function
function scrollToGallery() {
    document.getElementById('gallery-start').scrollIntoView({ behavior: 'smooth' });
}

function closeModal() {
    const modal = document.getElementById('photo-modal');
    if (modal) modal.classList.remove('active');
    document.body.style.overflow = '';
}