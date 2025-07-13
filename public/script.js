let currentCategory = 'ai';

// Initialize
function init() {
    setupEventListeners();
    showCategoryTools('ai');
}

// Setup event listeners
function setupEventListeners() {
    // Mobile menu toggle
    const menuButton = document.getElementById('menuButton');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    
    if (menuButton) {
        menuButton.addEventListener('click', toggleSidebar);
    }
    
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeSidebar);
    }

    // Sidebar navigation
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.addEventListener('click', () => {
            const category = item.dataset.category;
            switchCategory(category, item);
            // Close sidebar on mobile after selection
            if (window.innerWidth <= 768) {
                closeSidebar();
            }
        });
    });

    // Search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            if (query === '') {
                showCategoryTools(currentCategory);
            } else {
                searchTools(query);
            }
        });
    }

    // Handle window resize
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            closeSidebar();
        }
    });
}

// Toggle sidebar
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const menuButton = document.getElementById('menuButton');
    
    if (sidebar && overlay && menuButton) {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
        menuButton.classList.toggle('active');
    }
}

// Close sidebar
function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const menuButton = document.getElementById('menuButton');
    
    if (sidebar && overlay && menuButton) {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
        menuButton.classList.remove('active');
    }
}

// Switch category
function switchCategory(category, clickedItem) {
    // Update active state
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.classList.remove('active');
    });
    clickedItem.classList.add('active');

    // Update current category
    currentCategory = category;

    // Update title
    const categoryNames = {
        health: 'Health & Wellness',
        ai: 'AI Assistance',
        learning: 'Learning & Engagement',
        scheduling: 'Scheduling & Reminders',
        utilities: 'Utilities'
    };
    document.getElementById('categoryTitle').textContent = categoryNames[category];

    // Clear search
    document.getElementById('searchInput').value = '';

    // Show category tools
    showCategoryTools(category);
}

// Show tools for specific category
function showCategoryTools(category) {
    // Hide all tool cards
    document.querySelectorAll('.tool-card').forEach(card => {
        card.style.display = 'none';
    });

    // Show tools for the selected category
    if (category === 'ai') {
        // Show AI tools (first two cards are AI tools)
        document.querySelectorAll('.tool-card').forEach((card, index) => {
            if (index < 2) {
                card.style.display = 'block';
            }
        });
    } else if (category === 'health') {
        // Show health tools
        document.querySelectorAll('.health-tool').forEach(card => {
            card.style.display = 'block';
        });
    } else if (category === 'learning') {
        // Show learning tools
        document.querySelectorAll('.learning-tool').forEach(card => {
            card.style.display = 'block';
        });
    } else if (category === 'scheduling') {
        // Show scheduling tools
        document.querySelectorAll('.scheduling-tool').forEach(card => {
            card.style.display = 'block';
        });
    } else if (category === 'utilities') {
        // Show utilities tools
        document.querySelectorAll('.utilities-tool').forEach(card => {
            card.style.display = 'block';
        });
    }
}

// Search tools
function searchTools(query) {
    // Hide all tools first
    document.querySelectorAll('.tool-card').forEach(card => {
        card.style.display = 'none';
    });

    // Show tools that match the search query
    document.querySelectorAll('.tool-card').forEach(card => {
        const title = card.querySelector('.tool-title').textContent.toLowerCase();
        const description = card.querySelector('.tool-description').textContent.toLowerCase();
        
        if (title.includes(query) || description.includes(query)) {
            card.style.display = 'block';
        }
    });

    // Show empty state if no tools found
    const visibleTools = document.querySelectorAll('.tool-card[style="display: block;"]');
    const toolsGrid = document.getElementById('toolsGrid');
    
    if (visibleTools.length === 0) {
        // Remove existing empty state if any
        const existingEmptyState = toolsGrid.querySelector('.empty-state');
        if (existingEmptyState) {
            existingEmptyState.remove();
        }
        
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
            <h3>No tools found</h3>
            <p>Try searching for something else or browse different categories.</p>
        `;
        toolsGrid.appendChild(emptyState);
    } else {
        // Remove empty state if tools are found
        const existingEmptyState = toolsGrid.querySelector('.empty-state');
        if (existingEmptyState) {
            existingEmptyState.remove();
        }
    }
}

// Open tool
function openTool(url) {
    window.location.href = url;
}

// Initialize the app
init();