// Tool data
const toolsData = {
    ai: [
        {
            title: "AI Chat Bot",
            description: "Get instant help and answers anytime using our smart assistant.",
            icon: "chat",
            url: "aichat/aichat.html"
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
            title: "Meal Planner",
            description: "Plan your weekly meals and generate grocery lists automatically.",
            icon: "chat",
            url: "meal-planner/meal.html"
        },
        {
            title: "Grocery List",
            description: "Smart grocery lists with units, auto-generated from your meal plans.",
            icon: "summarizer",
            url: "grocery-list/grocery.html"
        },
        {
            title: "Book Health Appointment",
            description: "Schedule an appointment with your personalized health coach or AI assistant.",
            icon: "chat",
            url: "appointment/appointment.html"
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
            title: "Topics Learner",
            description: "Share and discover knowledge through text, images, and videos uploaded by the community.",
            icon: "chat",
            url: "TopicsLearner/topics.html"
        },
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
        },
        {
            title: "Trivia",
            description: "Test out your knowledge by playing our trivia consisting of 6 different topics consisting of 5 different questions each.",
            icon: "chat",
            url: "trivia/trivia.html"
        }
    ],
    scheduling: [
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
            title: "Weight Tracker",
            description: "Track your weight, calculate BMI, and view your progress over time.",
            icon: "summarizer",
            url: "weight-tracker/weight-tracker.html"
        },
        {
            title: "Weather",
            description: "Get current weather conditions and forecasts for any location.",
            icon: "chat",
            url: "weather/weather.html"
        },
        {
            title: "SOS System",
            description: "Alert your caretaker via telegram with a button.",
            icon: "chat",
            url: "sos/main.html"
        },
        {
            title: "Find Hospitals Near You",
            description: "Get routes,distance and estimated time of arrival to hospitals near you in Singapore.",
            icon: "chat",
            url: "nearestHospital/hospital.html"
        }
    ]
};

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
    renderToolCards(category);
}

function renderToolCards(category) {
    const toolsGrid = document.getElementById('toolsGrid');
    toolsGrid.innerHTML = '';
    
    const tools = toolsData[category] || [];
    if (tools.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
            <h3>No tools found</h3>
            <p>Try searching for something else or browse different categories.</p>
        `;
        toolsGrid.appendChild(emptyState);
        return;
    }
    
    tools.forEach(tool => {
        const card = document.createElement('div');
        card.className = `tool-card ${category}-tool`;
        card.innerHTML = `
            <div class="tool-icon ${tool.icon}"></div>
            <div class="tool-title">${tool.title}</div>
            <div class="tool-description">${tool.description}</div>
            <button class="tool-button">Open</button>
        `;
        card.querySelector('.tool-button').addEventListener('click', (e) => {
            e.stopPropagation();
            openTool(tool.url);
        });
        card.addEventListener('click', () => openTool(tool.url));
        toolsGrid.appendChild(card);
    });
}
document.querySelector(".credit").addEventListener("click",function(){
    window.location.href = "credits/credit.html";
})

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

function openTool(url) {
    window.location.href = url;
}

// Initialize the app
init();