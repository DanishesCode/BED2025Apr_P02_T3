// Tool data
const toolsData = {
    ai: [
        {
            title: "AI Chat Bot",
            description: "Get instant help and answers anytime using our smart assistant.",
            icon: "chat",
            url: "#"
        },
        {
            title: "Summarizer",
            description: "Instantly get summaries of long text or websites/links for easy reading.",
            icon: "summarizer",
            url: "#"
        }
    ],
    health: [
        {
            title: "Book Health Appointment",
            description: "Schedule an appointment with your personalized health coach or AI assistant.",
            icon: "chat",
            url: "/appointment"
        },
        {
            title: "Health Tracker",
            description: "Monitor your daily health metrics and wellness goals.",
            icon: "chat",
            url: "#"
        },
        {
            title: "Meditation Guide",
            description: "Guided meditation sessions for stress relief and mindfulness.",
            icon: "summarizer",
            url: "#"
        }
    ],
    learning: [
        {
            title: "Study Planner",
            description: "Organize your study schedule and track learning progress.",
            icon: "chat",
            url: "#"
        },
        {
            title: "Quiz Generator",
            description: "Create interactive quizzes to test your knowledge.",
            icon: "summarizer",
            url: "#"
        },
        {
            title: "Photo Gallery",
            description: "Store and organize your precious memories with a beautiful photo gallery.",
            icon: "chat",
            url: "photogallery/photo.html"
        }
    ],
    scheduling: [
        {
            title: "Book Appointment",
            description: "Schedule an appointment with your personalized health coach or AI assistant.",
            icon: "chat",
            url: "/appointment"
        },
        {
            title: "Birthday Reminder",
            description: "Keep track of important birthdays and get timely reminders.",
            icon: "chat",
            url: "birthday-reminder/birthday.html"
        },
        {
            title: "Task Manager",
            description: "Organize and prioritize your daily tasks efficiently.",
            icon: "chat",
            url: "#"
        },
        {
            title: "Calendar Sync",
            description: "Sync and manage events across all your calendars.",
            icon: "summarizer",
            url: "#"
        }
    ],
    utilities: [
        {
            title: "File Converter",
            description: "Convert files between different formats quickly and easily.",
            icon: "chat",
            url: "#"
        },
        {
            title: "Password Generator",
            description: "Generate secure passwords for all your accounts.",
            icon: "summarizer",
            url: "#"
        },
        {
            title: "Weather",
            description: "Get current weather conditions and forecasts for any location.",
            icon: "chat",
            url: "weather/weather.html"
        }
    ]
};

let currentCategory = 'ai';
let allTools = [];

// Initialize
function init() {
    flattenAllTools();
    renderTools(toolsData[currentCategory]);
    setupEventListeners();
}

// Flatten all tools for search
function flattenAllTools() {
    allTools = [];
    Object.keys(toolsData).forEach(category => {
        toolsData[category].forEach(tool => {
            allTools.push({ ...tool, category });
        });
    });
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
                renderTools(toolsData[currentCategory]);
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

    // Render tools
    renderTools(toolsData[category]);
}

// Search tools
function searchTools(query) {
    const filteredTools = allTools.filter(tool => 
        tool.title.toLowerCase().includes(query) || 
        tool.description.toLowerCase().includes(query)
    );
    renderTools(filteredTools);
}

// Render tools
function renderTools(tools) {
    const toolsGrid = document.getElementById('toolsGrid');
    
    if (tools.length === 0) {
        toolsGrid.innerHTML = `
            <div class="empty-state">
                <h3>No tools found</h3>
                <p>Try searching for something else or browse different categories.</p>
            </div>
        `;
        return;
    }

    toolsGrid.innerHTML = tools.map(tool => `
        <div class="tool-card" onclick="handleToolClick('${tool.url}', '${tool.action || ''}')">
            <div class="tool-icon ${tool.icon}">
                <div style="width: 32px; height: 32px; background: rgba(255,255,255,0.3); border-radius: 4px;"></div>
            </div>
            <h3 class="tool-title">${tool.title}</h3>
            <p class="tool-description">${tool.description}</p>
            <button class="tool-button" onclick="event.stopPropagation(); handleToolClick('${tool.url}', '${tool.action || ''}')">
                Open Tool
                <div class="button-icon"></div>
            </button>
        </div>
    `).join('');
}

// Handle tool click
function handleToolClick(url, action) {
    console.log('Handling tool click:', url, action);
    
    // Handle special actions
    if (action === 'showPhotoGallery') {
        showPhotoGallery();
        return;
    }
    
    // Check if it's a placeholder URL
    if (url === '#') {
        alert('This tool is coming soon!');
        return;
    }
    
    // Navigate to the tool URL
    window.location.href = url;
}

// Show photo gallery as a full page
function showPhotoGallery() {
    // Navigate directly to the photo gallery page
    window.location.href = 'photogallery/photo.html';
}

// Initialize the app
init();