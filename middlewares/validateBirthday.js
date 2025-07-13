function validateAdd(req, res, next) {
  const { firstName, birthDate } = req.body;
  if (!firstName || !birthDate) {
    return res.status(400).json({ error: 'firstName and birthDate are required.' });
  }
  next();
}

function validateUpdate(req, res, next) {
  const { firstName, birthDate } = req.body;
  if (firstName && typeof firstName !== 'string') {
    return res.status(400).json({ error: 'firstName must be a string.' });
  }
  if (birthDate && isNaN(Date.parse(birthDate))) {
    return res.status(400).json({ error: 'birthDate must be a valid date.' });
  }
  next();
}

module.exports = {
  validateAdd,
  validateUpdate
};
