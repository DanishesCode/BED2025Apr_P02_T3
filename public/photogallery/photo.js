// Global variables
let allPhotos = [];
let filteredPhotos = [];
let currentModalIndex = 0;

// DOM elements
const galleryGrid = document.getElementById('gallery-grid');
const loadingSpinner = document.getElementById('loading-spinner');
const noPhotosMessage = document.getElementById('no-photos');
const searchInput = document.querySelector('.search-input');
const filterTabs = document.querySelectorAll('.filter-tab');
const modal = document.getElementById('photo-modal');
const modalImage = document.querySelector('.modal-image');
const modalTitle = document.querySelector('.modal-title');
const modalDescription = document.querySelector('.modal-description');
const modalDate = document.querySelector('.modal-date');
const modalTag = document.querySelector('.modal-tag');
const modalClose = document.querySelector('.modal-close');
const modalBackdrop = document.querySelector('.modal-backdrop');
const modalArrowLeft = document.getElementById('modal-arrow-left');
const modalArrowRight = document.getElementById('modal-arrow-right');

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the upload page
    const uploadForm = document.getElementById('memory-form');
    if (uploadForm) {
        setupUploadForm();
        return; // Don't load gallery functionality on upload page
    }
    
    // Gallery page functionality
    loadPhotos();
    setupEventListeners();
    // Move arrows outside modal-content
    const modal = document.getElementById('photo-modal');
    const modalContent = modal.querySelector('.modal-content');
    const leftArrow = document.getElementById('modal-arrow-left');
    const rightArrow = document.getElementById('modal-arrow-right');
    if (leftArrow && rightArrow && modal && modalContent) {
        modal.insertBefore(leftArrow, modalContent);
        modal.appendChild(rightArrow);
    }
});

// Setup event listeners
function setupEventListeners() {
    // Search functionality
    searchInput.addEventListener('input', handleSearch);
    
    // Filter tabs
    filterTabs.forEach(tab => {
        tab.addEventListener('click', handleFilterClick);
    });
    
    // Modal close functionality
    modalClose.addEventListener('click', closeModal);
    modalBackdrop.addEventListener('click', closeModal);
    
    // Modal arrow navigation
    modalArrowLeft.addEventListener('click', function(e) {
        e.stopPropagation();
        showModalPhoto(currentModalIndex - 1);
    });
    
    modalArrowRight.addEventListener('click', function(e) {
        e.stopPropagation();
        showModalPhoto(currentModalIndex + 1);
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
}

// Load photos from the server
async function loadPhotos() {
    try {
        showLoading();
        
        const response = await fetch('http://localhost:3000/photos');
        const result = await response.json();
        
        if (result.success && result.data) {
            allPhotos = result.data;
            filteredPhotos = [...allPhotos];
            displayPhotos(filteredPhotos);
        } else {
            console.error('Failed to load photos:', result.message);
            showNoPhotos();
        }
    } catch (error) {
        console.error('Error loading photos:', error);
        showNoPhotos();
    } finally {
        hideLoading();
    }
}

// Display photos in the gallery
function displayPhotos(photos) {
    console.log('displayPhotos called with:', photos ? photos.length : 0, 'photos');
    
    if (!photos || photos.length === 0) {
        console.log('No photos to display, showing no photos message');
        showNoPhotos();
        return;
    }

    console.log('Displaying photos...');
    hideNoPhotos();
    galleryGrid.innerHTML = '';

    photos.forEach((photo, index) => {
        console.log(`Creating card for photo ${index}:`, photo.title);
        const photoCard = createPhotoCard(photo);
        galleryGrid.appendChild(photoCard);
    });
    
    console.log('All photo cards added to gallery');
}

// Create a photo card element
function createPhotoCard(photo) {
    const card = document.createElement('div');
    card.className = 'photo-card';
    card.setAttribute('data-category', photo.category?.toLowerCase() || 'other');
    
    const favoriteIcon = photo.isFavorite ? 
        '<svg class="favorite-icon active" viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>' :
        '<svg class="favorite-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';

    card.innerHTML = `
        <div class="photo-wrapper">
            <img src="${photo.imageUrl}" alt="${photo.title}" class="photo-image" loading="lazy">
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

    // Add click event to open modal
    card.addEventListener('click', function(e) {
        // Don't open modal if clicking on action buttons
        if (!e.target.closest('.photo-action')) {
            openModal(photo);
        }
    });

    return card;
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Open photo modal
function openModal(photo) {
    currentModalIndex = filteredPhotos.findIndex(p => p.id === photo.id);
    showModalPhoto(currentModalIndex);
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Show photo in modal by index
function showModalPhoto(index) {
    if (filteredPhotos.length === 0) return;
    
    // Wrap around - if index is negative, go to last photo
    if (index < 0) index = filteredPhotos.length - 1;
    // If index is beyond the last photo, go to first photo
    if (index >= filteredPhotos.length) index = 0;
    
    currentModalIndex = index;
    const photo = filteredPhotos[index];
    
    modalImage.src = photo.imageUrl;
    modalImage.alt = photo.title;
    modalTitle.textContent = photo.title;
    modalDescription.textContent = photo.description || 'No description';
    modalDate.textContent = formatDate(photo.date);
    modalTag.textContent = photo.category || 'General';
}

// Close photo modal
function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// Handle search functionality
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    
    if (searchTerm === '') {
        filteredPhotos = [...allPhotos];
    } else {
        filteredPhotos = allPhotos.filter(photo => 
            photo.title.toLowerCase().includes(searchTerm) ||
            (photo.description && photo.description.toLowerCase().includes(searchTerm)) ||
            (photo.location && photo.location.toLowerCase().includes(searchTerm)) ||
            (photo.category && photo.category.toLowerCase().includes(searchTerm))
        );
    }
    
    // Apply current filter
    const activeFilter = document.querySelector('.filter-tab.active').dataset.filter;
    applyFilter(activeFilter);
}

// Handle filter tab clicks
function handleFilterClick(e) {
    // Remove active class from all tabs
    filterTabs.forEach(tab => tab.classList.remove('active'));
    
    // Add active class to clicked tab
    e.target.classList.add('active');
    
    // Apply filter
    const filter = e.target.dataset.filter;
    applyFilter(filter);
}

// Apply filter to photos
function applyFilter(filter) {
    console.log('Applying filter:', filter);
    console.log('All photos count:', allPhotos.length);
    
    // Start with either all photos or search-filtered photos
    const searchTerm = searchInput.value.toLowerCase();
    let photosToDisplay;
    
    if (searchTerm === '') {
        photosToDisplay = [...allPhotos];
        console.log('No search term, using all photos:', photosToDisplay.length);
    } else {
        photosToDisplay = allPhotos.filter(photo => 
            photo.title.toLowerCase().includes(searchTerm) ||
            (photo.description && photo.description.toLowerCase().includes(searchTerm)) ||
            (photo.location && photo.location.toLowerCase().includes(searchTerm)) ||
            (photo.category && photo.category.toLowerCase().includes(searchTerm))
        );
        console.log('With search term, filtered to:', photosToDisplay.length);
    }
    
    // Apply category filter
    switch (filter) {
        case 'recent':
            photosToDisplay = photosToDisplay.sort((a, b) => new Date(b.uploadedAt || b.date) - new Date(a.uploadedAt || a.date));
            break;
        case 'favorites':
            photosToDisplay = photosToDisplay.filter(photo => photo.isFavorite);
            break;
        case 'family':
        case 'travel':
        case 'friends':
        case 'nature':
        case 'celebrations':
        case 'hobbies':
            photosToDisplay = photosToDisplay.filter(photo => 
                photo.category && photo.category.toLowerCase() === filter
            );
            break;
        case 'all':
        default:
            // Show all filtered photos (no additional filtering needed)
            console.log('All filter selected, showing:', photosToDisplay.length, 'photos');
            break;
    }
    
    console.log('Final photos to display:', photosToDisplay.length);
    
    // Update the filteredPhotos array for other functions
    filteredPhotos = [...photosToDisplay];
    
    // Display the photos
    displayPhotos(photosToDisplay);
}

// Toggle favorite status
async function toggleFavorite(photoId, buttonElement) {
    try {
        const photo = allPhotos.find(p => p.id === photoId);
        const newFavoriteStatus = !photo.isFavorite;
        
        const response = await fetch(`http://localhost:3000/photos/${photoId}/favorite`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ isFavorite: newFavoriteStatus })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Update the photo in our local data
            photo.isFavorite = newFavoriteStatus;
            
            // Update the UI
            const icon = buttonElement.querySelector('svg');
            if (newFavoriteStatus) {
                icon.classList.add('active');
                icon.setAttribute('fill', 'currentColor');
                icon.removeAttribute('stroke');
            } else {
                icon.classList.remove('active');
                icon.setAttribute('fill', 'none');
                icon.setAttribute('stroke', 'currentColor');
            }
        } else {
            console.error('Failed to toggle favorite:', result.message);
            alert('Failed to update favorite status');
        }
    } catch (error) {
        console.error('Error toggling favorite:', error);
        alert('Error updating favorite status');
    }
}

// Delete photo
async function deletePhoto(photoId) {
    if (!confirm('Are you sure you want to delete this memory? This action cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch(`http://localhost:3000/photos/${photoId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Remove from local data
            allPhotos = allPhotos.filter(photo => photo.id !== photoId);
            filteredPhotos = filteredPhotos.filter(photo => photo.id !== photoId);
            
            // Refresh display
            const activeFilter = document.querySelector('.filter-tab.active').dataset.filter;
            applyFilter(activeFilter);
            
            alert('Memory deleted successfully');
        } else {
            console.error('Failed to delete photo:', result.message);
            alert('Failed to delete memory');
        }
    } catch (error) {
        console.error('Error deleting photo:', error);
        alert('Error deleting memory');
    }
}

// Edit photo functionality
let currentEditingPhotoId = null;

function editPhoto(photoId) {
    const photo = allPhotos.find(p => p.id === photoId);
    if (!photo) {
        alert('Photo not found');
        return;
    }

    currentEditingPhotoId = photoId;
    
    // Populate the edit form
    document.getElementById('edit-title').value = photo.title || '';
    document.getElementById('edit-description').value = photo.description || '';
    document.getElementById('edit-date').value = photo.date ? photo.date.split('T')[0] : '';
    document.getElementById('edit-category').value = photo.category || '';
    document.getElementById('edit-location').value = photo.location || '';
    document.getElementById('edit-favorite').checked = photo.isFavorite || false;
    
    // Show current image
    const currentImage = document.getElementById('current-image');
    const currentImageContainer = document.getElementById('current-image-container');
    if (photo.imageUrl) {
        currentImage.src = photo.imageUrl;
        currentImageContainer.style.display = 'block';
    } else {
        currentImageContainer.style.display = 'none';
    }
    
    // Clear any existing image preview
    clearImagePreview();
    
    // Show the edit modal
    const editModal = document.getElementById('edit-modal');
    editModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeEditModal() {
    const editModal = document.getElementById('edit-modal');
    editModal.classList.remove('active');
    document.body.style.overflow = '';
    currentEditingPhotoId = null;
    clearImagePreview();
}

// Image preview functionality
document.addEventListener('DOMContentLoaded', function() {
    const editImageInput = document.getElementById('edit-image');
    if (editImageInput) {
        editImageInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const preview = document.getElementById('edit-image-preview');
                    const img = document.getElementById('edit-preview-img');
                    img.src = e.target.result;
                    preview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });
    }
});

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

// Handle edit form submission
document.addEventListener('DOMContentLoaded', function() {
    const editForm = document.getElementById('edit-form');
    if (editForm) {
        editForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (!currentEditingPhotoId) {
                alert('No photo selected for editing');
                return;
            }

            const title = document.getElementById('edit-title').value.trim();
            const description = document.getElementById('edit-description').value.trim();
            const date = document.getElementById('edit-date').value;
            const category = document.getElementById('edit-category').value;
            const location = document.getElementById('edit-location').value.trim();
            const isFavorite = document.getElementById('edit-favorite').checked;
            const imageFile = document.getElementById('edit-image').files[0];

            if (!title) {
                alert('Title is required');
                return;
            }

            try {
                // Create FormData for both metadata and optional image
                const formData = new FormData();
                formData.append('title', title);
                formData.append('description', description);
                formData.append('date', date);
                formData.append('category', category || 'General');
                formData.append('location', location);
                formData.append('isFavorite', isFavorite);
                
                // Add image if a new one was selected
                if (imageFile) {
                    formData.append('photo', imageFile);
                }

                const response = await fetch(`http://localhost:3000/photos/${currentEditingPhotoId}`, {
                    method: 'PUT',
                    body: formData
                });

                const result = await response.json();

                if (result.success) {
                    // Update the photo in local data
                    const photoIndex = allPhotos.findIndex(p => p.id === currentEditingPhotoId);
                    if (photoIndex !== -1) {
                        const updatedPhoto = {
                            ...allPhotos[photoIndex],
                            title,
                            description,
                            date,
                            category: category || 'General',
                            location,
                            isFavorite
                        };
                        
                        // Update image URL if a new image was uploaded
                        if (result.data && result.data.imageUrl) {
                            updatedPhoto.imageUrl = result.data.imageUrl;
                        }
                        
                        allPhotos[photoIndex] = updatedPhoto;
                    }

                    // Refresh the display
                    const activeFilter = document.querySelector('.filter-tab.active').dataset.filter;
                    applyFilter(activeFilter);

                    // Close the modal
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
});

// Handle upload form submission
function setupUploadForm() {
    const uploadForm = document.getElementById('memory-form');
    const fileInput = document.getElementById('photo-upload');
    const uploadArea = document.getElementById('upload-area');
    const previewContainer = document.getElementById('preview-container');
    
    // Handle file selection
    fileInput.addEventListener('change', handleFileSelection);
    
    // Handle drag and drop
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('drop', handleFileDrop);
    uploadArea.addEventListener('click', () => fileInput.click());
    
    // Handle form submission
    uploadForm.addEventListener('submit', handleUploadSubmission);
}

function handleFileSelection(e) {
    const files = Array.from(e.target.files);
    displayFilePreview(files[0]); // For now, handle single file
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
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
    
    const fileInput = document.getElementById('photo-upload');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Please select a photo to upload');
        return;
    }
    
    // Get form data
    const title = document.getElementById('memory-title').value.trim();
    const description = document.getElementById('memory-description').value.trim();
    const date = document.getElementById('memory-date').value;
    const category = document.getElementById('memory-category').value || 'General';
    const location = document.getElementById('memory-location').value.trim();
    const isFavorite = document.getElementById('memory-favorite').checked;
    
    if (!title) {
        alert('Please enter a title for your memory');
        return;
    }
    
    try {
        // Show loading state
        const submitButton = e.target.querySelector('button[type="submit"]');
        const originalText = submitButton.innerHTML;
        submitButton.innerHTML = '<span class="button-icon">⏳</span> Saving...';
        submitButton.disabled = true;
        
        // Create FormData
        const formData = new FormData();
        formData.append('photo', file);
        formData.append('title', title);
        formData.append('description', description);
        formData.append('date', date || new Date().toISOString().split('T')[0]);
        formData.append('category', category);
        formData.append('location', location);
        formData.append('isFavorite', isFavorite);
        
        console.log('Uploading photo...');
        
        // Upload to server
        const response = await fetch('http://localhost:3000/photos/upload', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Memory saved successfully!');
            // Redirect to gallery
            window.location.href = 'photo.html';
        } else {
            console.error('Upload failed:', result.message);
            alert('Failed to save memory: ' + (result.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Upload error:', error);
        alert('Error uploading photo. Please try again.');
    } finally {
        // Reset button state
        const submitButton = e.target.querySelector('button[type="submit"]');
        submitButton.innerHTML = originalText;
        submitButton.disabled = false;
    }
}

// Utility functions for loading states
function showLoading() {
    console.log('showLoading called');
    loadingSpinner.style.display = 'flex';
    galleryGrid.style.display = 'none';
    noPhotosMessage.style.display = 'none';
}

function hideLoading() {
    console.log('hideLoading called');
    loadingSpinner.style.display = 'none';
    galleryGrid.style.display = 'grid';
}

function showNoPhotos() {
    console.log('showNoPhotos called');
    galleryGrid.style.display = 'none';
    noPhotosMessage.style.display = 'block';
}

function hideNoPhotos() {
    console.log('hideNoPhotos called');
    noPhotosMessage.style.display = 'none';
    galleryGrid.style.display = 'grid';
    console.log('Gallery grid display set to:', galleryGrid.style.display);
}

// Scroll to gallery function
function scrollToGallery() {
    document.getElementById('gallery-start').scrollIntoView({ behavior: 'smooth' });
}

// Setup upload form functionality
function setupUploadForm() {
    const uploadForm = document.getElementById('memory-form');
    const fileInput = document.getElementById('photo-upload');
    const uploadArea = document.getElementById('upload-area');
    const previewContainer = document.getElementById('preview-container');
    
    // Handle file selection
    fileInput.addEventListener('change', handleFileSelection);
    
    // Handle drag and drop
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('drop', handleFileDrop);
    uploadArea.addEventListener('click', () => fileInput.click());
    
    // Handle form submission
    uploadForm.addEventListener('submit', handleUploadSubmission);
}

function handleFileSelection(e) {
    const files = Array.from(e.target.files);
    displayFilePreview(files[0]); // For now, handle single file
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
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
    
    const fileInput = document.getElementById('photo-upload');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Please select a photo to upload');
        return;
    }
    
    // Get form data
    const title = document.getElementById('memory-title').value.trim();
    const description = document.getElementById('memory-description').value.trim();
    const date = document.getElementById('memory-date').value;
    const category = document.getElementById('memory-category').value || 'General';
    const location = document.getElementById('memory-location').value.trim();
    const isFavorite = document.getElementById('memory-favorite').checked;
    
    if (!title) {
        alert('Please enter a title for your memory');
        return;
    }
    
    try {
        // Show loading state
        const submitButton = e.target.querySelector('button[type="submit"]');
        const originalText = submitButton.innerHTML;
        submitButton.innerHTML = '<span class="button-icon">⏳</span> Saving...';
        submitButton.disabled = true;
        
        // Create FormData
        const formData = new FormData();
        formData.append('photo', file);
        formData.append('title', title);
        formData.append('description', description);
        formData.append('date', date || new Date().toISOString().split('T')[0]);
        formData.append('category', category);
        formData.append('location', location);
        formData.append('isFavorite', isFavorite);
        
        console.log('Uploading photo...');
        
        // Upload to server
        const response = await fetch('http://localhost:3000/photos/upload', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Memory saved successfully!');
            // Redirect to gallery
            window.location.href = 'photo.html';
        } else {
            console.error('Upload failed:', result.message);
            alert('Failed to save memory: ' + (result.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Upload error:', error);
        alert('Error uploading photo. Please try again.');
    } finally {
        // Reset button state
        const submitButton = e.target.querySelector('button[type="submit"]');
        submitButton.innerHTML = originalText;
        submitButton.disabled = false;
    }
}
