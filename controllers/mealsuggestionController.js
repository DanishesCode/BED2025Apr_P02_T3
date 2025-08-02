// controllers/suggestionController.js
const { 
  searchRecipes: spoonacularSearchRecipes, 
  getRecipeDetails: spoonacularGetRecipeDetails, 
  getRandomRecipes: spoonacularGetRandomRecipes 
} = require('../models/mealsModel');

// Get recipe suggestions based on search criteria
const getSuggestions = async (req, res) => {
  try {
    const { query, category, number } = req.query;

    // Validate inputs
    const searchOptions = {
      query: query || '',
      category: category || '',
      number: parseInt(number) || 6
    };

    // Limit number of results to prevent abuse
    if (searchOptions.number > 20) {
      searchOptions.number = 20;
    }

    const result = await spoonacularSearchRecipes(searchOptions);

    if (!result.success) {
      return res.status(500).json({
        error: 'Failed to fetch recipe suggestions',
        message: result.error
      });
    }

    res.json({
      success: true,
      recipes: result.recipes,
      totalResults: result.totalResults,
      searchQuery: query || '',
      searchCategory: category || ''
    });

  } catch (error) {
    console.error('Error in getSuggestions:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch recipe suggestions'
    });
  }
};

// Get detailed recipe information
const getRecipeDetails = async (req, res) => {
  try {
    const { recipeId } = req.params;

    // Validate recipe ID
    if (!recipeId || isNaN(recipeId)) {
      return res.status(400).json({
        error: 'Invalid recipe ID',
        message: 'Recipe ID must be a valid number'
      });
    }

    const result = await spoonacularGetRecipeDetails(parseInt(recipeId));

    if (!result.success) {
      return res.status(500).json({
        error: 'Failed to fetch recipe details',
        message: result.error
      });
    }

    if (!result.recipe) {
      return res.status(404).json({
        error: 'Recipe not found',
        message: 'The requested recipe could not be found'
      });
    }

    res.json({
      success: true,
      recipe: result.recipe
    });

  } catch (error) {
    console.error('Error in getRecipeDetails:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch recipe details'
    });
  }
};

// Get random recipes
const getRandomRecipes = async (req, res) => {
  try {
    const { number, tags } = req.query;

    const searchOptions = {
      number: parseInt(number) || 6,
      tags: tags || ''
    };

    // Limit number of results
    if (searchOptions.number > 20) {
      searchOptions.number = 20;
    }

    const result = await spoonacularGetRandomRecipes(searchOptions);

    if (!result.success) {
      return res.status(500).json({
        error: 'Failed to fetch random recipes',
        message: result.error
      });
    }

    res.json({
      success: true,
      recipes: result.recipes
    });

  } catch (error) {
    console.error('Error in getRandomRecipes:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch random recipes'
    });
  }
};

// Add suggested recipe to user's collection
const addSuggestedRecipe = async (req, res) => {
  try {
    const { recipeId, category, userId } = req.body;

    // Validate inputs
    if (!recipeId || !userId) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Recipe ID and User ID are required'
      });
    }

    // Get recipe details from Spoonacular
    const recipeResult = await spoonacularGetRecipeDetails(parseInt(recipeId));

    if (!recipeResult.success || !recipeResult.recipe) {
      return res.status(500).json({
        error: 'Failed to fetch recipe details',
        message: recipeResult.error || 'Recipe not found'
      });
    }

    const recipe = recipeResult.recipe;

    // Here you would add to your database
    // For now, I'll return the formatted recipe data
    const mealData = {
      UserID: userId,
      MealName: recipe.title,
      Category: category || 'main course',
      Instructions: recipe.instructions,
      SpoonacularID: recipe.id,
      Ingredients: recipe.ingredients && recipe.ingredients.length > 0 
        ? JSON.stringify(recipe.ingredients) 
        : null,
      Servings: recipe.servings || 4,
      ReadyInMinutes: recipe.readyInMinutes,
      ImageUrl: recipe.image
    };

    // You would typically save this to your database here
    // const savedMeal = await saveMealToDatabase(mealData);

    res.json({
      success: true,
      message: 'Recipe data prepared successfully',
      mealData: mealData,
      originalRecipe: recipe,
      ingredientsCount: recipe.ingredients ? recipe.ingredients.length : 0
    });

  } catch (error) {
    console.error('Error in addSuggestedRecipe:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process suggested recipe'
    });
  }
};

module.exports = {
  getSuggestions,
  getRecipeDetails,
  getRandomRecipes,
  addSuggestedRecipe
};
