// Inject navbar styles
const navbarCSS = document.createElement("link");
navbarCSS.rel = "stylesheet";
navbarCSS.href = "navbar.css"; // Make sure path is correct
document.head.appendChild(navbarCSS);

// Inject navbar HTML
const headerHTML = `
    <div class="header">
        <div class="header-left">
            <button class="menu-button" id="menuButton">
                <div class="hamburger">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </button>
            <div class="logo">Logo Here</div>
        </div>
        <div class="header-right">
            <div class="credit">Credit</div>
            <div class="profile" id="profileSection">
                <span id="userName">Guest</span>
                <div class="profile-icon">👤</div>
                <div class="profile-dropdown" id="profileDropdown">
                    <div class="dropdown-item" id="logoutBtn">Logout</div>
                </div>
            </div>
        </div>
    </div>
`;

document.addEventListener("DOMContentLoaded", function () {
    // Inject navbar HTML
    const container = document.createElement("div");
    container.innerHTML = headerHTML;
    document.body.prepend(container);

    // Auth check
    const token = localStorage.getItem('authToken');
    const currentUser = localStorage.getItem('currentUser');

    if (!token) {
        window.location.href = '/login';
        return;
    }

    // Display user info
    if (currentUser) {
        try {
            const user = JSON.parse(currentUser);
            document.getElementById('userName').textContent = user.name || 'User';
        } catch (e) {
            console.error('Error parsing user data:', e);
        }
    }

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', async function () {
        try {
            const response = await fetch('/auth/logout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
            window.location.href = '/login';
        } catch (error) {
            console.error('Logout error:', error);
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
            window.location.href = '/login';
        }
    });

    // Hamburger toggle (for future use)
    const menuButton = document.getElementById("menuButton");
    menuButton.addEventListener("click", () => {
        menuButton.classList.toggle("active");
    });

    // Profile dropdown toggle
    const profile = document.querySelector('.profile');
    profile.addEventListener('click', function () {
        document.getElementById('profileDropdown').classList.toggle('show');
    });

    // Close dropdown on outside click
    document.addEventListener('click', function (event) {
        if (!event.target.closest('.profile')) {
            document.getElementById('profileDropdown').classList.remove('show');
        }
    });
});
