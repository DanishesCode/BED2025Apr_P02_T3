const birthdayModel = require('../models/birthdayModel');

async function getAllBirthdays(req, res) {
  try {
    const userId = req.userId;
    const birthdays = await birthdayModel.getAllBirthdays(userId);
    res.json(birthdays);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function getBirthdayById(req, res) {
  try {
    const userId = req.userId;
    const id = parseInt(req.params.id);
    const birthday = await birthdayModel.getBirthdayById(id, userId);
    if (!birthday) return res.status(404).json({ error: 'Not found' });
    res.json(birthday);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function addBirthday(req, res) {
  try {
    const userId = req.userId;
    await birthdayModel.addBirthday(req.body, userId);
    res.status(201).send('Birthday added');
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function updateBirthday(req, res) {
  try {
    const userId = req.userId;
    const id = parseInt(req.params.id);
    await birthdayModel.updateBirthday(id, req.body, userId);
    res.send('Birthday updated');
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function deleteBirthday(req, res) {
  try {
    const userId = req.userId;
    const id = parseInt(req.params.id);
    await birthdayModel.deleteBirthday(id, userId);
    res.send('Birthday deleted');
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

// dashboard showing birthdays
async function getBirthdaysForDashboard(req, res) {
  try {
    const userId = req.userId;
    const allBirthdays = await birthdayModel.getAllBirthdays(userId);

    const today = [];
    const upcoming = [];

    const todayDate = new Date();
    const currentMonth = todayDate.getMonth() + 1;
    const currentDay = todayDate.getDate();
    const currentYear = todayDate.getFullYear();

    allBirthdays.forEach(b => {
      const birthDate = new Date(b.birthDate);
      const birthMonth = birthDate.getMonth() + 1;
      const birthDay = birthDate.getDate();

      if (birthMonth === currentMonth && birthDay === currentDay) {
        // Today's birthday
        today.push({
          id: b.birthdayId,
          initials: getInitials(b.firstName, b.lastName),
          name: `${b.firstName} ${b.lastName || ''}`.trim(),
          age: currentYear - birthDate.getFullYear(),
          date: b.birthDate
        });
      } else {
        // Upcoming birthdays
        const nextBirthday = new Date(currentYear, birthMonth - 1, birthDay);
        if (nextBirthday < todayDate) {
          nextBirthday.setFullYear(currentYear + 1);
        }
        const diffDays = Math.floor((nextBirthday - todayDate) / (1000 * 60 * 60 * 24));

        upcoming.push({
          id: b.birthdayId,
          initials: getInitials(b.firstName, b.lastName),
          name: `${b.firstName} ${b.lastName || ''}`.trim(),
          date: b.birthDate,
          daysUntil: diffDays,
          month: nextBirthday.toLocaleString('default', { month: 'long' })
        });
      }
    });

    // Sort upcoming birthdays
    upcoming.sort((a, b) => a.daysUntil - b.daysUntil);

    res.json({ today, upcoming });
  } catch (err) {
    console.error('Error in getBirthdaysForDashboard:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

function getInitials(firstName, lastName) {
  const fi = firstName ? firstName[0].toUpperCase() : '';
  const li = lastName ? lastName[0].toUpperCase() : '';
  return (fi + li).trim();
}

module.exports = {
  getAllBirthdays,
  getBirthdayById,
  addBirthday,
  updateBirthday,
  deleteBirthday,
  getBirthdaysForDashboard
};