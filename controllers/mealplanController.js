const mealPlanModel = require('../models/mealplanModel');

// GET /mealplan/:userId
async function getAllMealPlans(req, res) {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid userId' });
    }

    const plans = await mealPlanModel.getAllMealPlans(userId);
    res.json(plans);
  } catch (error) {
    console.error('Error getting meal plans:', error);
    res.status(500).json({ message: 'Server error while retrieving meal plans' });
  }
}

// GET /mealplan/item/:planId
async function getMealPlanById(req, res) {
  try {
    const planId = parseInt(req.params.planId);
    if (isNaN(planId)) {
      return res.status(400).json({ message: 'Invalid planId' });
    }

    const plan = await mealPlanModel.getMealPlanById(planId);
    if (!plan) {
      return res.status(404).json({ message: 'Meal plan not found' });
    }

    res.json(plan);
  } catch (error) {
    console.error('Error getting meal plan:', error);
    res.status(500).json({ message: 'Server error while retrieving meal plan' });
  }
}

// POST /mealplan
async function addMealPlan(req, res) {
  try {
    const { UserID, MealID, DayOfWeek, MealTime } = req.body;

    if (!UserID || !MealID || !DayOfWeek || !MealTime) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const newPlan = {
      UserID,
      MealID,
      DayOfWeek,
      MealTime
    };

    const createdPlan = await mealPlanModel.addMealPlan(newPlan);
    res.status(201).json({
      message: 'Meal plan added successfully',
      plan: createdPlan
    });
  } catch (error) {
    console.error('Error adding meal plan:', error);
    res.status(500).json({ message: 'Server error while adding meal plan' });
  }
}

// PUT /mealplan/:planId
async function updateMealPlan(req, res) {
  try {
    const planId = parseInt(req.params.planId);
    if (isNaN(planId)) {
      return res.status(400).json({ message: 'Invalid planId' });
    }

    const { MealID, DayOfWeek, MealTime } = req.body;
    if (!MealID || !DayOfWeek || !MealTime) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const updatedPlan = {
      MealID,
      DayOfWeek,
      MealTime
    };

    const result = await mealPlanModel.updateMealPlan(planId, updatedPlan);

    if (!result) {
      return res.status(404).json({ message: 'Meal plan not found' });
    }

    res.json({
      message: 'Meal plan updated successfully',
      plan: result
    });
  } catch (error) {
    console.error('Error updating meal plan:', error);
    res.status(500).json({ message: 'Server error while updating meal plan' });
  }
}

// DELETE /mealplan/:planId
async function deleteMealPlan(req, res) {
  try {
    const planId = parseInt(req.params.planId);
    if (isNaN(planId)) {
      return res.status(400).json({ message: 'Invalid planId' });
    }

    const deleted = await mealPlanModel.deleteMealPlan(planId);
    if (!deleted) {
      return res.status(404).json({ message: 'Meal plan not found' });
    }

    res.json({ message: 'Meal plan deleted successfully' });
  } catch (error) {
    console.error('Error deleting meal plan:', error);
    res.status(500).json({ message: 'Server error while deleting meal plan' });
  }
}

module.exports = {
  getAllMealPlans,
  getMealPlanById,
  addMealPlan,
  updateMealPlan,
  deleteMealPlan
};
