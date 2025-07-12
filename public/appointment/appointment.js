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

// Edit appointment logic (simple prompt for demo)
function startEditAppointment(id, oldDate, oldTime, oldConsultationType) {
    const newDate = prompt('Enter new date (YYYY-MM-DD):', oldDate);
    if (!newDate) return;
    const newTime = prompt('Enter new time (HH:MM):', oldTime);
    if (!newTime) return;
    const newConsultationType = prompt('Enter consultation type (coach/ai):', oldConsultationType);
    if (!newConsultationType) return;
    updateAppointment(id, newDate, newTime, newConsultationType);
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