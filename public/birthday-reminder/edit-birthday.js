document.addEventListener('DOMContentLoaded', () => {
  const API_BASE = 'http://localhost:3000/birthdays';
  const birthdayId = new URLSearchParams(window.location.search).get('id');
  const firstNameInput = document.getElementById('first_name');
  const lastNameInput = document.getElementById('last_name');
  const dateInput = document.getElementById('birth_date');
  const relationshipInput = document.getElementById('relationship');
  const notesInput = document.getElementById('notes');

  const saveBtn = document.getElementById('save-btn');
  const cancelBtn = document.getElementById('cancel-btn');
  const deleteBtn = document.getElementById('delete-btn');

  if (birthdayId) {
    fetch(`${API_BASE}/${birthdayId}`)
      .then(res => {
        if (!res.ok) throw new Error('Birthday not found');
        return res.json();
      })
      .then(data => {
        
        firstNameInput.value = data.firstName || '';
        lastNameInput.value = data.lastName || '';
        dateInput.value = data.birthDate ? data.birthDate.split('T')[0] : '';
        relationshipInput.value = data.relationship || '';
        notesInput.value = data.notes || '';
        if (deleteBtn) {
          deleteBtn.style.display = 'inline-block';
        }
      })
      .catch(err => {
        console.error('Error fetching birthday:', err);
        alert('Could not load birthday data.');
        window.location.href = 'birthday.html';
      });
  } else {
    if (deleteBtn) {
      deleteBtn.style.display = 'none';
    }
  }

  saveBtn.addEventListener('click', () => {
    const birthdayData = {
      firstName: firstNameInput.value.trim(),
      lastName: lastNameInput.value.trim(),
      birthDate: dateInput.value,
      relationship: relationshipInput.value.trim(),
      notes: notesInput.value.trim()
    };

    if (!birthdayData.firstName || !birthdayData.birthDate) {
      alert('First Name and Birth Date are required.');
      return;
    }

    const method = birthdayId ? 'PUT' : 'POST';
    const url = birthdayId ? `${API_BASE}/${birthdayId}` : API_BASE;

    fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(birthdayData)
    })
      .then(res => {
        if (!res.ok) throw new Error('Save failed');
        return res.text();
      })
      .then(() => {
        alert(`Birthday ${birthdayId ? 'updated' : 'added'} successfully!`);
        window.location.href = 'birthday.html';
      })
      .catch(err => {
        console.error('Error saving birthday:', err);
        alert('Failed to save birthday.');
      });
  });

  cancelBtn.addEventListener('click', () => {
    window.location.href = 'birthday.html';
  });
  
  if (deleteBtn) {
    deleteBtn.addEventListener('click', () => {
      if (!birthdayId) return;

      if (confirm('Are you sure you want to delete this birthday?')) {
        fetch(`${API_BASE}/${birthdayId}`, {
          method: 'DELETE'
        })
          .then(res => {
            if (!res.ok) throw new Error('Delete failed');
            alert('Birthday deleted!');
            window.location.href = 'birthday.html';
          })
          .catch(err => {
            console.error('Delete failed:', err);
            alert('Could not delete birthday.');
          });
      }
    });
  }
});



