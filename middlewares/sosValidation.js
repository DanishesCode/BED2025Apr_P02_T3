const Joi = require('joi');

// Joi schema for Caretaker
const caretakerSchema = Joi.object({
  telegram_name: Joi.string()
    .max(100)
    .required()
    .messages({
      'string.base': 'Telegram name must be a string',
      'string.max': 'Telegram name must not exceed 100 characters',
      'any.required': 'Telegram name is required',
    }),

  chat_id: Joi.number()
    .integer()
    .required()
    .messages({
      'number.base': 'Chat ID must be a number',
      'number.integer': 'Chat ID must be an integer',
      'any.required': 'Chat ID is required',
    }),
});

// Middleware to validate caretaker payload (POST/PUT)
function validateCaretaker(req, res, next) {
  const { error } = caretakerSchema.validate(req.body, { abortEarly: false });

  if (error) {
    const errorMessage = error.details.map((detail) => detail.message).join(', ');
    return res.status(400).json({ error: errorMessage });
  }

  next();
}

// Middleware to validate caretaker ID in route params
function validateCaretakerId(req, res, next) {
  const id = parseInt(req.params.id);

  if (isNaN(id) || id <= 0) {
    return res.status(400).json({
      error: 'Invalid caretaker ID. ID must be a positive number',
    });
  }

  next();
}

module.exports = { validateCaretaker, validateCaretakerId };
