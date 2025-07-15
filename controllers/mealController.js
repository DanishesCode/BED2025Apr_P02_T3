const mealsModel = require('../models/mealsModel');

// GET /meals/:userId
async function getAllMeals(req, res) {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid userId' });
    }

    const meals = await mealsModel.getAllMeals(userId);
    res.json(meals);
  } catch (error) {
    console.error('Error getting meals:', error);
    res.status(500).json({ message: 'Server error while retrieving meals' });
  }
}

// GET /meals/:userId/:mealId
async function getMealById(req, res) {
  try {
    const mealId = parseInt(req.params.mealId);
    if (isNaN(mealId)) {
      return res.status(400).json({ message: 'Invalid mealId' });
    }

    const meal = await mealsModel.getMealById(mealId);
    if (!meal) {
      return res.status(404).json({ message: 'Meal not found' });
    }

    res.json(meal);
  } catch (error) {
    console.error('Error getting meal:', error);
    res.status(500).json({ message: 'Server error while retrieving meal' });
  }
}

// POST /meals
async function addMeal(req, res) {
  try {
    const { UserID, MealName, Category, Instructions } = req.body;

    // Basic validation
    if (!UserID || !MealName || !Category || !Instructions) {
      return res.status(400).json({ message: 'Missing required meal fields' });
    }

    const newMeal = {
      UserID,
      MealName,
      Category,
      Instructions
    };

    const createdMeal = await mealsModel.addMeal(newMeal);
    res.status(201).json({
      message: 'Meal added successfully',
      meal: createdMeal
    });
  } catch (error) {
    console.error('Error adding meal:', error);
    res.status(500).json({ message: 'Server error while adding meal' });
  }
}

// PUT /meals/:mealId
async function updateMeal(req, res) {
  try {
    const mealId = parseInt(req.params.mealId);
    if (isNaN(mealId)) {
      return res.status(400).json({ message: 'Invalid mealId' });
    }

    const { MealName, Category, Instructions } = req.body;
    if (!MealName || !Category || !Instructions) {
      return res.status(400).json({ message: 'Missing required meal fields' });
    }

    const updatedMeal = {
      MealName,
      Category,
      Instructions
    };

    const result = await mealsModel.updateMeal(mealId, updatedMeal);

    if (!result) {
      return res.status(404).json({ message: 'Meal not found' });
    }

    res.json({
      message: 'Meal updated successfully',
      meal: result
    });
  } catch (error) {
    console.error('Error updating meal:', error);
    res.status(500).json({ message: 'Server error while updating meal' });
  }
}

// DELETE /meals/:mealId
async function deleteMeal(req, res) {
  try {
    const mealId = parseInt(req.params.mealId);
    if (isNaN(mealId)) {
      return res.status(400).json({ message: 'Invalid mealId' });
    }

    const deleted = await mealsModel.deleteMeal(mealId);
    if (!deleted) {
      return res.status(404).json({ message: 'Meal not found' });
    }

    res.json({ message: 'Meal deleted successfully' });
  } catch (error) {
    console.error('Error deleting meal:', error);
    res.status(500).json({ message: 'Server error while deleting meal' });
  }
}

module.exports = {
  getAllMeals,
  getMealById,
  addMeal,
  updateMeal,
  deleteMeal
};

