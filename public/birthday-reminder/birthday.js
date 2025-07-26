document.addEventListener('DOMContentLoaded', () => {
  loadDashboardBirthdays();
});
const API_BASE = 'http://localhost:3000';

// Get auth token for API calls
function getAuthHeaders() {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

async function loadDashboardBirthdays() {
  try {
    const res = await fetch(`${API_BASE}/birthdays/dashboard`, {
      headers: getAuthHeaders()
    });
    
    if (!res.ok) {
      if (res.status === 401) {
        // Redirect to login if unauthorized
        window.location.href = '/login';
        return;
      }
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    
    const data = await res.json();

    updateCurrentDate();
    renderTodaysBirthdays(data.today);
    renderUpcomingBirthdays(data.upcoming);
  } catch (err) {
    console.error('Failed to load birthday data:', err);
    // Redirect to login on auth errors
    if (err.message.includes('401')) {
      window.location.href = '/login';
    }
  }
}

function updateCurrentDate() {
  const now = new Date();
  const options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
  const dateStr = now.toLocaleDateString(undefined, options).toUpperCase();
  document.getElementById('current-date').textContent = dateStr;
}

function renderTodaysBirthdays(birthdays) {
  const container = document.getElementById('today-section');
  container.innerHTML = ''; // Clear existing

  if (birthdays.length === 0) {
    container.innerHTML = `<div class="empty-state">No birthdays today 🎉</div>`;
    return;
  }

  birthdays.forEach(b => {
    container.innerHTML += `
      <div class="birthday-item" data-id="${b.id}" data-name="${b.name}" data-days-until="0">
        <div class="avatar today">${b.initials}</div>
        <div class="birthday-info">
          <div class="name">${b.name} <span class="age-badge">Turning ${b.age}</span></div>
          <div class="relationship">${b.relationship}</div>
          <div class="date-info">${formatDate(b.date)}</div>
        </div>
        <div class="actions">
          <button class="action-btn edit" title="Edit">✏️</button>
          <button class="action-btn delete" title="Delete">🗑️</button>
        </div>
      </div>
    `;
  });
}

function renderUpcomingBirthdays(upcomingList) {
  const container = document.getElementById('upcoming-section');
  container.innerHTML = '';

  if (upcomingList.length === 0) {
    container.innerHTML = `<div class="empty-state">No upcoming birthdays 🥳</div>`;
    return;
  }

  const months = {};

  // Group by month
  upcomingList.forEach(b => {
    if (!months[b.month]) months[b.month] = [];
    months[b.month].push(b);
  });

  for (const [month, birthdays] of Object.entries(months)) {
    container.innerHTML += `<div class="month-header">${month}</div>`;
    birthdays.forEach(b => {
      const avatarClass = b.daysUntil <= 60 ? 'upcoming' : 'placeholder';
      container.innerHTML += `
        <div class="birthday-item" data-id="${b.id}" data-name="${b.name}" data-days-until="${b.daysUntil}">
          <div class="avatar ${avatarClass}">${b.initials}</div>
          <div class="birthday-info">
            <div class="name">${b.name}</div>
            <div class="relationship">${b.relationship}</div>
            <div class="date-info">${formatUpcomingDate(b.date, b.daysUntil)}</div>
          </div>
          <div class="actions">
            <button class="action-btn edit" title="Edit">✏️</button>
            <button class="action-btn delete" title="Delete">🗑️</button>
          </div>
        </div>
      `;
    });
  }
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatUpcomingDate(dateStr, daysUntil) {
  const d = new Date(dateStr);
  return `${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} in ${daysUntil} days`;
}
document.addEventListener('click', async (e) => {
  if (e.target.matches('.action-btn.delete')) {
    const birthdayItem = e.target.closest('.birthday-item');
    const id = birthdayItem.getAttribute('data-id');
    if (confirm('Are you sure you want to delete this birthday?')) {
      await deleteBirthday(id);
      loadDashboardBirthdays(); // reload after delete
    }
  }

  if (e.target.matches('.action-btn.edit')) {
    const birthdayItem = e.target.closest('.birthday-item');
    const id = birthdayItem.getAttribute('data-id');
    window.location.href = `edit-birthday.html?id=${id}`;
  }
});

async function deleteBirthday(id) {
  try {
    const res = await fetch(`${API_BASE}/birthdays/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      if (res.status === 401) {
        window.location.href = '/login';
        return;
      }
      throw new Error('Delete failed');
    }
    console.log('Birthday deleted');
  } catch (err) {
    console.error('Failed to delete birthday:', err);
    alert('Failed to delete. Please try again.');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // existing load
  loadDashboardBirthdays();
});
