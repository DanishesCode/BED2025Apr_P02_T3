// UI logic for selecting date and time

// Base URL for API calls
const API_BASE_URL = 'http://127.0.0.1:3000';

// Helper function to get auth headers
function getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
    };
}

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
        const phoneInput = document.getElementById('phone-input');
        const countryCodeSelect = document.getElementById('country-code-select');
        const phoneNumber = phoneInput ? phoneInput.value.trim() : '';
        const countryCode = countryCodeSelect ? countryCodeSelect.value : '+65';
        
        if (!selectedDate || !selectedTime || !selectedConsultationType) {
            alert('Please select a date, time, and consultation type.');
            return;
        }
        
        if (!phoneNumber) {
            alert('Please enter your phone number for notifications.');
            return;
        }
        
        // Combine country code with phone number
        const fullPhoneNumber = countryCode + phoneNumber;
        
        // Validate phone number format (basic validation for international numbers)
        const phoneRegex = /^\+[1-9]\d{1,14}$/;
        if (!phoneRegex.test(fullPhoneNumber)) {
            alert('Please enter a valid phone number (numbers only, no spaces or dashes).');
            return;
        }
        
        createAppointment(selectedDate, selectedTime, selectedConsultationType, fullPhoneNumber);
    });

    document.querySelector('.back-btn').addEventListener('click', function () {
        window.history.back();
    });

    // Test SMS functionality using existing phone input
    document.getElementById('test-sms-btn').addEventListener('click', async function() {
        const countryCode = document.getElementById('country-code-select').value;
        const phoneNumber = document.getElementById('phone-input').value.trim();
        const resultDiv = document.getElementById('sms-test-result');
        const button = this;
        
        // Clear previous results
        resultDiv.innerHTML = '';
        
        if (!phoneNumber) {
            resultDiv.innerHTML = '<span style="color: red;">Please enter a phone number first</span>';
            return;
        }
        
        // Format full phone number
        const fullPhoneNumber = countryCode + phoneNumber.replace(/^0+/, ''); // Remove leading zeros
        
        // Validate phone number format
        const phoneRegex = /^\+[1-9]\d{1,14}$/;
        if (!phoneRegex.test(fullPhoneNumber)) {
            resultDiv.innerHTML = '<span style="color: red;">Please enter a valid phone number</span>';
            return;
        }
        
        // Disable button and show loading
        button.disabled = true;
        button.textContent = 'Testing...';
        resultDiv.innerHTML = '<span style="color: blue;">📱 Sending test SMS...</span>';
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/appointments/test-sms`, {
                method: 'POST',
                headers: getAuthHeaders(),
                credentials: 'include',
                body: JSON.stringify({
                    phoneNumber: fullPhoneNumber
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                resultDiv.innerHTML = '<span style="color: green;">✅ Test SMS sent successfully!</span>';
            } else {
                if (data.message && data.message.includes('quota')) {
                    resultDiv.innerHTML = '<span style="color: orange;">⚠️ SMS quota limit reached. Free service allows 1 SMS per day per phone number. Your appointment SMS will still work when you book!</span>';
                } else {
                    resultDiv.innerHTML = `<span style="color: red;">❌ Failed: ${data.message}</span>`;
                }
            }
            
        } catch (error) {
            console.error('Test SMS error:', error);
            resultDiv.innerHTML = '<span style="color: red;">❌ Error sending test SMS. Please try again.</span>';
        } finally {
            // Re-enable button
            button.disabled = false;
            button.textContent = 'Test SMS';
        }
    });
});

function fetchAppointments() {
    fetch(`${API_BASE_URL}/api/appointments`, { 
        headers: getAuthHeaders(),
        credentials: 'include' 
    })
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
    const mobileAppointments = document.getElementById('mobile-appointments-list');
    
    // Render desktop sidebar appointments
    let html = '<h3>Appointments</h3><div class="mini-calendar">';
    if (appointments.length === 0) {
        html += '<p>No appointments yet.</p>';
    } else {
        html += '<ul style="list-style:none;padding:0;">';
        appointments.forEach(app => {
            const consultationType = app.consultationType === 'H' ? '👨‍⚕️ Health Coach (Human)' : '🤖 AI Assistant (Bot)';
            html += `<li style="margin-bottom:20px;padding:15px;background:#f9fafb;border-radius:10px;border-left:4px solid #a78bfa;box-shadow:0 2px 8px rgba(0,0,0,0.05);">
                <div style="font-weight:600;margin-bottom:8px;font-size:1rem;color:#1f2937;">${app.appointmentDate} ${app.appointmentTime}</div>
                <div style="font-size:0.9rem;color:#6b7280;margin-bottom:12px;line-height:1.4;">${consultationType}</div>
                ${app.googleMeetLink ? `<div style="margin-bottom:12px;">
                    <button onclick="openGoogleMeet('${app.googleMeetLink}')" style="background:#4285f4;color:white;border:none;padding:8px 14px;border-radius:6px;cursor:pointer;font-size:0.8rem;margin-right:8px;margin-bottom:6px;">
                        📹 Join Video Call
                    </button>
                    <button onclick="copyMeetLink('${app.googleMeetLink}')" style="background:#34a853;color:white;border:none;padding:8px 14px;border-radius:6px;cursor:pointer;font-size:0.8rem;margin-bottom:6px;">
                        📋 Copy Link
                    </button>
                </div>` : ''}
                <div style="display:flex;gap:12px;flex-wrap:wrap;">
                    <button onclick="deleteAppointment(${app.id})" style="color:#ef4444;border:none;background:rgba(239,68,68,0.1);cursor:pointer;font-size:0.8rem;padding:6px 12px;border-radius:6px;transition:all 0.2s;">Delete</button>
                    <button onclick="startEditAppointment(${app.id}, '${app.appointmentDate}', '${app.appointmentTime}', '${app.consultationType}')" style="color:#2563eb;border:none;background:rgba(37,99,235,0.1);cursor:pointer;font-size:0.8rem;padding:6px 12px;border-radius:6px;transition:all 0.2s;">Edit</button>
                </div>
            </li>`;
        });
        html += '</ul>';
    }
    html += '</div>';
    sidebar.innerHTML = html;
    
    // Render mobile appointments
    let mobileHtml = '';
    if (appointments.length === 0) {
        mobileHtml = '<p style="text-align: center; color: #666; padding: 20px;">No appointments yet.</p>';
    } else {
        appointments.forEach(app => {
            const consultationType = app.consultationType === 'H' ? '👨‍⚕️ Health Coach (Human)' : '🤖 AI Assistant (Bot)';
            mobileHtml += `
                <div class="mobile-appointment-item">
                    <div class="mobile-appointment-date">${app.appointmentDate}</div>
                    <div class="mobile-appointment-time">${app.appointmentTime}</div>
                    <div class="mobile-appointment-type">${consultationType}</div>
                    ${app.googleMeetLink ? `<div class="mobile-appointment-meeting">
                        <button class="mobile-join-btn" onclick="openGoogleMeet('${app.googleMeetLink}')">📹 Join Video Call</button>
                        <button class="mobile-copy-btn" onclick="copyMeetLink('${app.googleMeetLink}')">📋 Copy Link</button>
                    </div>` : ''}
                    <div class="mobile-appointment-actions">
                        <button class="mobile-edit-btn" onclick="startEditAppointment(${app.id}, '${app.appointmentDate}', '${app.appointmentTime}', '${app.consultationType}')">Edit</button>
                        <button class="mobile-delete-btn" onclick="deleteAppointment(${app.id})">Delete</button>
                    </div>
                </div>
            `;
        });
    }
    mobileAppointments.innerHTML = mobileHtml;
}

function createAppointment(date, time, consultationType, phoneNumber) {
    fetch(`${API_BASE_URL}/api/appointments`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ date, time, consultationType, phoneNumber })
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
            let message = 'Appointment created successfully!';
            
            if (data.appointment && data.appointment.googleMeetLink) {
                message += `\n\n🔗 Video Meeting Link: ${data.appointment.googleMeetLink}`;
            }
            
            if (data.notificationSent) {
                message += '\n\n📱 Notification sent to your phone!';
            } else if (data.notification) {
                message += `\n\n📱 ${data.notification}`;
            }
            
            alert(message);
            fetchAppointments();
            
            // Clear selections
            document.querySelectorAll('.calendar-table td.selected').forEach(sel => sel.classList.remove('selected'));
            document.querySelectorAll('.time-btn.selected').forEach(sel => sel.classList.remove('selected'));
            document.querySelectorAll('.consultation-option.selected').forEach(sel => sel.classList.remove('selected'));
            
            // Clear phone input if it exists
            const phoneInput = document.getElementById('phone-input');
            if (phoneInput) phoneInput.value = '';
            
            // Reset variables
            selectedDate = null;
            selectedTime = null;
            selectedConsultationType = null;
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
        headers: getAuthHeaders(),
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
        headers: getAuthHeaders(),
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

// Google Meet functions
function openGoogleMeet(meetLink) {
    if (meetLink) {
        window.open(meetLink, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
    } else {
        alert('Video meeting link not available for this appointment.');
    }
}

function copyMeetLink(meetLink) {
    if (meetLink) {
        navigator.clipboard.writeText(meetLink).then(() => {
            // Show success message
            const originalBtnText = event.target.innerHTML;
            event.target.innerHTML = '✅ Copied!';
            event.target.style.background = '#34a853';
            
            setTimeout(() => {
                event.target.innerHTML = originalBtnText;
                event.target.style.background = '#34a853';
            }, 2000);
        }).catch(() => {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = meetLink;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            alert('Video meeting link copied to clipboard!');
        });
    } else {
        alert('No video meeting link available to copy.');
    }
}

// Expose Google Meet functions globally
window.openGoogleMeet = openGoogleMeet;
window.copyMeetLink = copyMeetLink; 