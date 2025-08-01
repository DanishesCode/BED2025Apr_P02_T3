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
    const { UserID, MealName, Category, Instructions, SpoonacularID } = req.body;

    // Basic validation
    if (!UserID || !MealName || !Category || !Instructions) {
      return res.status(400).json({ message: 'Missing required meal fields' });
    }

    let newMeal = {
      UserID,
      MealName,
      Category,
      Instructions,
      SpoonacularID: SpoonacularID || null,
      Servings: 4,
      ReadyInMinutes: null,
      ImageUrl: null,
      Ingredients: null
    };

    // If SpoonacularID is provided, fetch additional details
    if (SpoonacularID) {
      try {
        console.log(`Fetching Spoonacular details for recipe ${SpoonacularID}`);
        const spoonacularResponse = await mealsModel.getRecipeDetails(SpoonacularID);
        
        if (spoonacularResponse.success && spoonacularResponse.recipe) {
          const recipe = spoonacularResponse.recipe;
          
          // Update meal with Spoonacular data
          newMeal.Servings = recipe.servings || 4;
          newMeal.ReadyInMinutes = recipe.readyInMinutes;
          newMeal.ImageUrl = recipe.image;
          
          // Store ingredients as JSON string
          if (recipe.ingredients && recipe.ingredients.length > 0) {
            newMeal.Ingredients = JSON.stringify(recipe.ingredients);
          }
          
          // If instructions weren't provided or are generic, use Spoonacular instructions
          if (!Instructions || Instructions.trim() === '') {
            newMeal.Instructions = recipe.instructions || 'No instructions available';
          }
        }
      } catch (error) {
        console.error('Error fetching Spoonacular details:', error);
        // Continue with basic meal creation even if Spoonacular fetch fails
      }
    }

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

// POST /meals/import-spoonacular
async function importSpoonacularRecipe(req, res) {
  try {
    const { UserID, SpoonacularID, Category } = req.body;

    // Basic validation
    if (!UserID || !SpoonacularID) {
      return res.status(400).json({ message: 'Missing required fields: UserID and SpoonacularID' });
    }

    console.log(`Importing Spoonacular recipe ${SpoonacularID} for user ${UserID}`);
    
    // Fetch recipe details from Spoonacular
    const spoonacularResponse = await mealsModel.getRecipeDetails(SpoonacularID);
    
    if (!spoonacularResponse.success) {
      return res.status(400).json({ 
        message: 'Failed to fetch recipe from Spoonacular',
        error: spoonacularResponse.error
      });
    }

    const recipe = spoonacularResponse.recipe;
    
    // Create meal object with Spoonacular data
    const newMeal = {
      UserID,
      MealName: recipe.title,
      Category: Category || 'main', // Use provided category or default
      Instructions: recipe.instructions || 'Instructions available at source URL',
      SpoonacularID: SpoonacularID,
      Servings: recipe.servings || 4,
      ReadyInMinutes: recipe.readyInMinutes,
      ImageUrl: recipe.image,
      Ingredients: recipe.ingredients && recipe.ingredients.length > 0 
        ? JSON.stringify(recipe.ingredients) 
        : null
    };

    const createdMeal = await mealsModel.addMeal(newMeal);
    
    res.status(201).json({
      message: 'Spoonacular recipe imported successfully',
      meal: createdMeal,
      sourceUrl: recipe.sourceUrl,
      ingredientsCount: recipe.ingredients ? recipe.ingredients.length : 0
    });
  } catch (error) {
    console.error('Error importing Spoonacular recipe:', error);
    res.status(500).json({ message: 'Server error while importing recipe' });
  }
}

module.exports = {
  getAllMeals,
  getMealById,
  addMeal,
  updateMeal,
  deleteMeal,
  importSpoonacularRecipe
};

