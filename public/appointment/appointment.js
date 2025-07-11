// UI logic for selecting date and time

document.addEventListener('DOMContentLoaded', function () {
    // Date selection
    document.querySelectorAll('.calendar-table td').forEach(td => {
        td.addEventListener('click', function () {
            document.querySelectorAll('.calendar-table td.selected').forEach(sel => sel.classList.remove('selected'));
            td.classList.add('selected');
        });
    });

    // Time selection
    document.querySelectorAll('.time-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.time-btn.selected').forEach(sel => sel.classList.remove('selected'));
            btn.classList.add('selected');
        });
    });

    // Load appointments on page load
    fetchAppointments();

    // Continue button (create appointment)
    document.querySelector('.continue-btn').addEventListener('click', function () {
        const selectedDate = document.querySelector('.calendar-table td.selected');
        const selectedTime = document.querySelector('.time-btn.selected');
        if (!selectedDate || !selectedTime) {
            alert('Please select a date and time.');
            return;
        }
        // For demo, use August 2023 as in the UI
        const date = `2023-08-${selectedDate.textContent.padStart(2, '0')}`;
        const time = selectedTime.textContent;
        createAppointment(date, time);
    });

    // Back button
    document.querySelector('.back-btn').addEventListener('click', function () {
        window.history.back();
    });
});

function fetchAppointments() {
    fetch('/api/appointments', { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                renderAppointments(data.appointments);
            } else {
                alert('Failed to load appointments: ' + (data.message || 'Unknown error'));
            }
        })
        .catch(err => alert('Error fetching appointments: ' + err));
}

function renderAppointments(appointments) {
    const sidebar = document.querySelector('.appointments-sidebar');
    let html = '<h3>Appointments</h3><div class="mini-calendar">';
    if (appointments.length === 0) {
        html += '<p>No appointments yet.</p>';
    } else {
        html += '<ul style="list-style:none;padding:0;">';
        appointments.forEach(app => {
            html += `<li style="margin-bottom:10px;">${app.appointmentDate} ${app.appointmentTime} <button onclick="deleteAppointment(${app.id})" style="color:red;border:none;background:none;cursor:pointer;">Delete</button> <button onclick="startEditAppointment(${app.id}, '${app.appointmentDate}', '${app.appointmentTime}')" style="color:#2563eb;border:none;background:none;cursor:pointer;">Edit</button></li>`;
        });
        html += '</ul>';
    }
    html += '</div>';
    sidebar.innerHTML = html;
}

function createAppointment(date, time) {
    fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ date, time })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            alert('Appointment created!');
            fetchAppointments();
        } else {
            alert('Failed to create appointment: ' + (data.message || 'Unknown error'));
        }
    })
    .catch(err => alert('Error creating appointment: ' + err));
}

function deleteAppointment(id) {
    if (!confirm('Delete this appointment?')) return;
    fetch(`/api/appointments/${id}`, {
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
function startEditAppointment(id, oldDate, oldTime) {
    const newDate = prompt('Enter new date (YYYY-MM-DD):', oldDate);
    if (!newDate) return;
    const newTime = prompt('Enter new time (HH:MM):', oldTime);
    if (!newTime) return;
    updateAppointment(id, newDate, newTime);
}

function updateAppointment(id, date, time) {
    fetch(`/api/appointments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ date, time })
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