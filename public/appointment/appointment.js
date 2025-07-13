// UI logic for selecting date and time

// Base URL for API calls
const API_BASE_URL = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', function () {
    // --- Calendar Setup ---
    const monthSelect = document.getElementById('month-select');
    const yearSelect = document.getElementById('year-select');
    const calendarBody = document.getElementById('calendar-body');
    const timePicker = document.getElementById('time-picker');

    // Month and year options
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const now = new Date();
    let selectedYear = now.getFullYear();
    let selectedMonth = now.getMonth();
    let selectedDay = now.getDate();
    let selectedDate = null;
    let selectedTime = null;
    let selectedConsultationType = null;

    // Populate month/year dropdowns
    months.forEach((m, i) => {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = m;
        if (i === selectedMonth) opt.selected = true;
        monthSelect.appendChild(opt);
    });
    for (let y = now.getFullYear(); y <= now.getFullYear() + 2; y++) {
        const opt = document.createElement('option');
        opt.value = y;
        opt.textContent = y;
        if (y === selectedYear) opt.selected = true;
        yearSelect.appendChild(opt);
    }

    function renderCalendar() {
        calendarBody.innerHTML = '';
        const year = parseInt(yearSelect.value);
        const month = parseInt(monthSelect.value);
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        let startDay = firstDay.getDay(); // 0=Sun, 1=Mon...
        startDay = (startDay === 0) ? 6 : startDay - 1; // Make Monday=0
        let row = document.createElement('tr');
        // Fill blanks before first day
        for (let i = 0; i < startDay; i++) {
            row.appendChild(document.createElement('td'));
        }
        for (let d = 1; d <= lastDay.getDate(); d++) {
            if (row.children.length === 7) {
                calendarBody.appendChild(row);
                row = document.createElement('tr');
            }
            const td = document.createElement('td');
            td.textContent = d;
            td.tabIndex = 0;
            td.classList.add('calendar-day');
            if (
                year === now.getFullYear() &&
                month === now.getMonth() &&
                d === now.getDate()
            ) {
                td.classList.add('today');
            }
            td.addEventListener('click', function () {
                document.querySelectorAll('.calendar-table td.selected').forEach(sel => sel.classList.remove('selected'));
                td.classList.add('selected');
                selectedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            });
            row.appendChild(td);
        }
        // Fill blanks after last day
        while (row.children.length < 7) {
            row.appendChild(document.createElement('td'));
        }
        calendarBody.appendChild(row);
    }

    monthSelect.addEventListener('change', () => {
        renderCalendar();
    });
    yearSelect.addEventListener('change', () => {
        renderCalendar();
    });

    renderCalendar();

    // --- Time Picker Setup ---
    const timeSlots = [];
    for (let h = 9; h <= 17; h++) {
        timeSlots.push(`${String(h).padStart(2, '0')}:00`);
        if (h !== 17) timeSlots.push(`${String(h).padStart(2, '0')}:30`);
    }
    function renderTimeSlots() {
        timePicker.innerHTML = '';
        let row = null;
        timeSlots.forEach((t, i) => {
            if (i % 3 === 0) {
                row = document.createElement('div');
                row.className = 'time-row';
                timePicker.appendChild(row);
            }
            const btn = document.createElement('button');
            btn.className = 'time-btn';
            btn.textContent = t;
            btn.addEventListener('click', function () {
                document.querySelectorAll('.time-btn.selected').forEach(sel => sel.classList.remove('selected'));
                btn.classList.add('selected');
                selectedTime = t;
            });
            row.appendChild(btn);
        });
    }
    renderTimeSlots();

    // --- Consultation Type Selection ---
    document.querySelectorAll('.consultation-option').forEach(option => {
        option.addEventListener('click', function () {
            document.querySelectorAll('.consultation-option.selected').forEach(sel => sel.classList.remove('selected'));
            this.classList.add('selected');
            selectedConsultationType = this.dataset.type;
        });
    });

    // --- CRUD Logic ---
    fetchAppointments();

    document.querySelector('.continue-btn').addEventListener('click', function () {
        if (!selectedDate || !selectedTime || !selectedConsultationType) {
            alert('Please select a date, time, and consultation type.');
            return;
        }
        createAppointment(selectedDate, selectedTime, selectedConsultationType);
    });

    document.querySelector('.back-btn').addEventListener('click', function () {
        window.history.back();
    });
});

function fetchAppointments() {
    fetch(`${API_BASE_URL}/api/appointments`, { credentials: 'include' })
        .then(res => {
            if (!res.ok) {
                if (res.status === 401) {
                    // User not authenticated, redirect to login
                    window.location.href = '/login';
                    return;
                }
                throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }
            return res.json();
        })
        .then(data => {
            if (data && data.success) {
                renderAppointments(data.appointments);
            } else {
                console.log('No appointments or error:', data);
                renderAppointments([]);
            }
        })
        .catch(err => {
            console.error('Error fetching appointments:', err);
            renderAppointments([]);
        });
}

function renderAppointments(appointments) {
    const sidebar = document.querySelector('.appointments-sidebar');
    let html = '<h3>Appointments</h3><div class="mini-calendar">';
    if (appointments.length === 0) {
        html += '<p>No appointments yet.</p>';
    } else {
        html += '<ul style="list-style:none;padding:0;">';
        appointments.forEach(app => {
            const consultationType = app.consultationType === 'H' ? '👨‍⚕️ Health Coach (Human)' : '🤖 AI Assistant (Bot)';
            html += `<li style="margin-bottom:15px;padding:10px;background:#f9fafb;border-radius:8px;border-left:3px solid #a78bfa;">
                <div style="font-weight:600;margin-bottom:5px;">${app.appointmentDate} ${app.appointmentTime}</div>
                <div style="font-size:0.9rem;color:#6b7280;margin-bottom:8px;">${consultationType}</div>
                <div style="display:flex;gap:8px;">
                    <button onclick="deleteAppointment(${app.id})" style="color:red;border:none;background:none;cursor:pointer;font-size:0.8rem;">Delete</button>
                    <button onclick="startEditAppointment(${app.id}, '${app.appointmentDate}', '${app.appointmentTime}', '${app.consultationType}')" style="color:#2563eb;border:none;background:none;cursor:pointer;font-size:0.8rem;">Edit</button>
                </div>
            </li>`;
        });
        html += '</ul>';
    }
    html += '</div>';
    sidebar.innerHTML = html;
}

function createAppointment(date, time, consultationType) {
    fetch(`${API_BASE_URL}/api/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ date, time, consultationType })
    })
    .then(res => {
        if (!res.ok) {
            if (res.status === 401) {
                alert('Please log in to create appointments');
                window.location.href = '/login';
                return;
            }
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        return res.json();
    })
    .then(data => {
        if (data && data.success) {
            alert('Appointment created successfully!');
            fetchAppointments();
            // Clear selections
            document.querySelectorAll('.calendar-table td.selected').forEach(sel => sel.classList.remove('selected'));
            document.querySelectorAll('.time-btn.selected').forEach(sel => sel.classList.remove('selected'));
        } else {
            alert('Failed to create appointment: ' + (data?.message || 'Unknown error'));
        }
    })
    .catch(err => {
        console.error('Error creating appointment:', err);
        alert('Error creating appointment: ' + err.message);
    });
}

function deleteAppointment(id) {
    if (!confirm('Delete this appointment?')) return;
    fetch(`${API_BASE_URL}/api/appointments/${id}`, {
        method: 'DELETE',
        credentials: 'include'
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            alert('Appointment deleted!');
            fetchAppointments();
        } else {
            alert('Failed to delete appointment: ' + (data.message || 'Unknown error'));
        }
    })
    .catch(err => alert('Error deleting appointment: ' + err));
}

// Edit appointment logic with modal
function startEditAppointment(id, oldDate, oldTime, oldConsultationType) {
    // Create modal overlay
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'edit-modal-overlay';
    modalOverlay.innerHTML = `
        <div class="edit-modal">
            <div class="edit-modal-header">
                <h2>Edit Appointment</h2>
                <button class="close-modal-btn">&times;</button>
            </div>
            <div class="edit-modal-content">
                <div class="edit-form-group">
                    <label>Date:</label>
                    <input type="date" id="edit-date" value="${oldDate}" class="edit-input">
                </div>
                <div class="edit-form-group">
                    <label>Time:</label>
                    <select id="edit-time" class="edit-input">
                        <option value="09:00" ${oldTime === '09:00' ? 'selected' : ''}>09:00</option>
                        <option value="09:30" ${oldTime === '09:30' ? 'selected' : ''}>09:30</option>
                        <option value="10:00" ${oldTime === '10:00' ? 'selected' : ''}>10:00</option>
                        <option value="10:30" ${oldTime === '10:30' ? 'selected' : ''}>10:30</option>
                        <option value="11:00" ${oldTime === '11:00' ? 'selected' : ''}>11:00</option>
                        <option value="11:30" ${oldTime === '11:30' ? 'selected' : ''}>11:30</option>
                        <option value="12:00" ${oldTime === '12:00' ? 'selected' : ''}>12:00</option>
                        <option value="12:30" ${oldTime === '12:30' ? 'selected' : ''}>12:30</option>
                        <option value="13:00" ${oldTime === '13:00' ? 'selected' : ''}>13:00</option>
                        <option value="13:30" ${oldTime === '13:30' ? 'selected' : ''}>13:30</option>
                        <option value="14:00" ${oldTime === '14:00' ? 'selected' : ''}>14:00</option>
                        <option value="14:30" ${oldTime === '14:30' ? 'selected' : ''}>14:30</option>
                        <option value="15:00" ${oldTime === '15:00' ? 'selected' : ''}>15:00</option>
                        <option value="15:30" ${oldTime === '15:30' ? 'selected' : ''}>15:30</option>
                        <option value="16:00" ${oldTime === '16:00' ? 'selected' : ''}>16:00</option>
                        <option value="16:30" ${oldTime === '16:30' ? 'selected' : ''}>16:30</option>
                        <option value="17:00" ${oldTime === '17:00' ? 'selected' : ''}>17:00</option>
                    </select>
                </div>
                <div class="edit-form-group">
                    <label>Consultation Type:</label>
                    <div class="edit-consultation-options">
                        <label class="edit-consultation-option">
                            <input type="radio" name="edit-consultation" value="coach" ${oldConsultationType === 'coach' ? 'checked' : ''}>
                            <span class="edit-consultation-label">
                                <span class="edit-consultation-icon">👨‍⚕️</span>
                                <span>Health Coach</span>
                            </span>
                        </label>
                        <label class="edit-consultation-option">
                            <input type="radio" name="edit-consultation" value="ai" ${oldConsultationType === 'ai' ? 'checked' : ''}>
                            <span class="edit-consultation-label">
                                <span class="edit-consultation-icon">🤖</span>
                                <span>AI Assistant</span>
                            </span>
                        </label>
                    </div>
                </div>
            </div>
            <div class="edit-modal-actions">
                <button class="edit-cancel-btn">Cancel</button>
                <button class="edit-save-btn">Save Changes</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modalOverlay);
    
    // Close modal functionality
    const closeBtn = modalOverlay.querySelector('.close-modal-btn');
    const cancelBtn = modalOverlay.querySelector('.edit-cancel-btn');
    const saveBtn = modalOverlay.querySelector('.edit-save-btn');
    
    function closeModal() {
        modalOverlay.remove();
    }
    
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });
    
    // Save functionality
    saveBtn.addEventListener('click', () => {
        const newDate = document.getElementById('edit-date').value;
        const newTime = document.getElementById('edit-time').value;
        const newConsultationType = document.querySelector('input[name="edit-consultation"]:checked').value;
        
        if (!newDate || !newTime || !newConsultationType) {
            alert('Please fill in all fields');
            return;
        }
        
        updateAppointment(id, newDate, newTime, newConsultationType);
        closeModal();
    });
}

function updateAppointment(id, date, time, consultationType) {
    fetch(`${API_BASE_URL}/api/appointments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ date, time, consultationType })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            alert('Appointment updated!');
            fetchAppointments();
        } else {
            alert('Failed to update appointment: ' + (data.message || 'Unknown error'));
        }
    })
    .catch(err => alert('Error updating appointment: ' + err));
}

// Expose functions for inline onclick
window.deleteAppointment = deleteAppointment;
window.startEditAppointment = startEditAppointment; 