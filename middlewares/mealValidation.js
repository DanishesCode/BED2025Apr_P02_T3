const Joi = require('joi');

// Simple validation schemas
const mealSchemas = {
  addMeal: Joi.object({
    userId: Joi.number().required(),
    mealName: Joi.string().trim().min(1).required(),
    category: Joi.string().required(),
    ingredients: Joi.string().allow('', null),
    instructions: Joi.string().allow('', null),
    servings: Joi.number().allow(null),
    prepTime: Joi.number().allow(null),
    spoonacularId: Joi.number().allow(null)
  }),

  updateMeal: Joi.object({
    mealName: Joi.string().trim().min(1),
    category: Joi.string(),
    ingredients: Joi.string().allow('', null),
    instructions: Joi.string().allow('', null),
    servings: Joi.number().allow(null),
    prepTime: Joi.number().allow(null)
  }),

  mealId: Joi.object({
    mealId: Joi.number().required()
  }),

  userId: Joi.object({
    userId: Joi.number().required()
  })
};

// Simple validation middleware
const validateMeal = (req, res, next) => {
  const { error } = mealSchemas.addMeal.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};

const validateMealUpdate = (req, res, next) => {
  const { error } = mealSchemas.updateMeal.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};

const validateMealId = (req, res, next) => {
  const { error } = mealSchemas.mealId.validate(req.params);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};

const validateUserId = (req, res, next) => {
  const { error } = mealSchemas.userId.validate(req.params);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};

module.exports = {
  validateMeal,
  validateMealUpdate,
  validateMealId,
  validateUserId
};
