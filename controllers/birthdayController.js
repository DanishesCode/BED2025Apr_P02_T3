const birthdayModel = require('../models/birthdayModel');
const userModel = require('../models/userModel');
const twilio = require('twilio');
const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_TOKEN;
const twilioNumber = process.env.TWILIO_PHONE;
const twilioClient = twilio(accountSid, authToken);
async function getAllBirthdays(req, res) {
  try {
    let userId = req.user.userId;
    
    // Fallback: if userId is missing, look it up by email
    if (!userId && req.user.email) {
      const user = await userModel.findUserByEmail(req.user.email);
      userId = user ? user.userId : null;
    }
    
    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }
    
    const birthdays = await birthdayModel.getAllBirthdays(userId);
    res.json(birthdays);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function getBirthdayById(req, res) {
  try {
    let userId = req.user.userId;
    
    // Fallback: if userId is missing, look it up by email
    if (!userId && req.user.email) {
      const user = await userModel.findUserByEmail(req.user.email);
      userId = user ? user.userId : null;
    }
    
    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }
    
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
    console.log('addBirthday - req.user:', req.user);
    console.log('addBirthday - req.user.userId:', req.user.userId);
    
    let userId = req.user.userId;
    
    // Fallback: if userId is missing, look it up by email
    if (!userId && req.user.email) {
      console.log('Looking up user by email:', req.user.email);
      const user = await userModel.findUserByEmail(req.user.email);
      userId = user ? user.userId : null;
      console.log('Found userId:', userId);
    }
    
    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }
    
    await birthdayModel.addBirthday(req.body, userId);
    res.status(201).send('Birthday added');
  } catch (err) {
    console.error('Database error (addBirthday):', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function updateBirthday(req, res) {
  try {
    let userId = req.user.userId;
    
    // Fallback: if userId is missing, look it up by email
    if (!userId && req.user.email) {
      const user = await userModel.findUserByEmail(req.user.email);
      userId = user ? user.userId : null;
    }
    
    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }
    
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
    let userId = req.user.userId;
    
    // Fallback: if userId is missing, look it up by email
    if (!userId && req.user.email) {
      const user = await userModel.findUserByEmail(req.user.email);
      userId = user ? user.userId : null;
    }
    
    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }
    
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
    let userId = req.user.userId;
    
    // Fallback: if userId is missing, look it up by email
    if (!userId && req.user.email) {
      const user = await userModel.findUserByEmail(req.user.email);
      userId = user ? user.userId : null;
    }
    
    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }
    
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
          relationship: b.relationship || '',
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
          relationship: b.relationship || '',
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

// SMS function for sending birthday reminders
async function sendBirthdaySMS(req, res) {
  try {
    const { toPhone, name, daysUntil, birthdayId } = req.body;

    if (!toPhone || !name) {
      return res.status(400).json({ error: 'Missing toPhone or name in request' });
    }

    // Generate dynamic message
    let messageBody;
    
    if (daysUntil === 0) {
      messageBody = `🎉 Happy Birthday ${name}! Hope you have an amazing day filled with joy and celebration! 🎂🎈`;
    } else if (daysUntil === 1) {
      // Tomorrow
      messageBody = `⏰ Reminder: It's ${name}'s birthday tomorrow! Don't forget to wish them well! 🎂`;
    } else if (daysUntil <= 7) {
      // Within a week
      messageBody = `📅 Reminder: ${name}'s birthday is coming up in ${daysUntil} days (${getDateDisplay(daysUntil)})! 🎉`;
    } else if (daysUntil <= 30) {
      // Within a month
      messageBody = `📝 Heads up: ${name}'s birthday is in ${daysUntil} days. Mark your calendar! 🗓️`;
    } else {
      // More than a month
      messageBody = `📌 Save the date: ${name}'s birthday is coming up in ${daysUntil} days! 🎂`;
    }

    console.log(`📱 Sending SMS to ${toPhone}: "${messageBody}"`);

    const message = await twilioClient.messages.create({
      body: messageBody,
      from: twilioNumber,
      to: toPhone,
    });

    res.json({ 
      success: true, 
      sid: message.sid,
      message: `Birthday reminder sent for ${name} (${daysUntil === 0 ? 'today' : `${daysUntil} days away`})`
    });
  } catch (err) {
    console.error('Error sending SMS:', err);
    res.status(500).json({ 
      error: 'Failed to send SMS',
      details: err.message 
    });
  }
}
function getDateDisplay(daysUntil) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysUntil);
  return futureDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'short', 
    day: 'numeric' 
  });
}

module.exports = {
  getAllBirthdays,
  getBirthdayById,
  addBirthday,
  updateBirthday,
  deleteBirthday,
  getBirthdaysForDashboard,
  sendBirthdaySMS
};