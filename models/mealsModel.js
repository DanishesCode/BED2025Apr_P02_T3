const sql = require("mssql");
const dbConfig = require("../dbConfig");

// Spoonacular API configuration
const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY || 'YOUR_SPOONACULAR_API_KEY';
const SPOONACULAR_BASE_URL = 'https://api.spoonacular.com/recipes';

// Spoonacular API functions

// Search for recipes
async function searchRecipes(options) {
  const query = options.query || '';
  const category = options.category || '';
  const number = options.number || 6;

  // Include additional information in the search
  let url = `${SPOONACULAR_BASE_URL}/complexSearch?apiKey=${SPOONACULAR_API_KEY}&number=${number}&addRecipeInformation=true&fillIngredients=false`;
  
  if (query) {
    url += `&query=${query}`;
  }
  
  if (category === 'breakfast') {
    url += `&type=breakfast`;
  } else if (category === 'lunch' || category === 'dinner') {
    url += `&type=main course`;
  } else if (category === 'snack') {
    url += `&type=appetizer`;
  } else if (category === 'dessert') {
    url += `&type=dessert`;
  }

  try {
    const response = await fetch(url);
    const data = await response.json();
    
    // Map the results to include timing and servings data
    const recipes = (data.results || []).map(recipe => ({
      id: recipe.id,
      title: recipe.title,
      image: recipe.image,
      readyInMinutes: recipe.readyInMinutes || null,
      servings: recipe.servings || null,
      summary: recipe.summary,
      sourceUrl: recipe.sourceUrl
    }));
    
    return {
      success: true,
      recipes: recipes,
      totalResults: data.totalResults || 0
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      recipes: []
    };
  }
}

// Get recipe details
async function getRecipeDetails(recipeId) {
  const url = `${SPOONACULAR_BASE_URL}/${recipeId}/information?apiKey=${SPOONACULAR_API_KEY}`;

  try {
    const response = await fetch(url);
    const recipe = await response.json();
    
    // Get instructions
    let instructions = '';
    if (recipe.instructions) {
      instructions = recipe.instructions.replace(/<[^>]*>/g, ''); // Remove HTML tags
    } else if (recipe.analyzedInstructions && recipe.analyzedInstructions.length > 0) {
      const steps = recipe.analyzedInstructions[0].steps;
      instructions = steps.map((step, index) => `${index + 1}. ${step.step}`).join('\n');
    } else {
      instructions = 'No instructions available';
    }

    // Extract ingredients
    let ingredients = [];
    if (recipe.extendedIngredients) {
      ingredients = recipe.extendedIngredients.map(ingredient => ({
        name: ingredient.name,
        amount: ingredient.amount,
        unit: ingredient.unit,
        original: ingredient.original
      }));
    }

    return {
      success: true,
      recipe: {
        id: recipe.id,
        title: recipe.title,
        image: recipe.image,
        readyInMinutes: recipe.readyInMinutes,
        servings: recipe.servings,
        instructions: instructions,
        ingredients: ingredients,
        sourceUrl: recipe.sourceUrl
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      recipe: null
    };
  }
}

// Get random recipes
async function getRandomRecipes(options) {
  const number = options.number || 6;
  const tags = options.tags || '';

  let url = `${SPOONACULAR_BASE_URL}/random?apiKey=${SPOONACULAR_API_KEY}&number=${number}`;
  
  if (tags) {
    url += `&tags=${tags}`;
  }

  try {
    const response = await fetch(url);
    const data = await response.json();
    
    // Map the results to include consistent structure
    const recipes = (data.recipes || []).map(recipe => ({
      id: recipe.id,
      title: recipe.title,
      image: recipe.image,
      readyInMinutes: recipe.readyInMinutes || null,
      servings: recipe.servings || null,
      summary: recipe.summary,
      sourceUrl: recipe.sourceUrl
    }));
    
    return {
      success: true,
      recipes: recipes
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      recipes: []
    };
  }
}

// Database functions for meals

// Get all meals for a specific user
async function getAllMeals(userId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = "SELECT * FROM Meals WHERE UserID = @UserID";
    const result = await connection.request()
      .input("UserID", sql.Int, userId)
      .query(query);
    return result.recordset;
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Error closing connection:", err);
      }
    }
  }
}

// Get meal by ID
async function getMealById(mealId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = "SELECT * FROM Meals WHERE MealID = @MealID";
    const request = connection.request();
    request.input("MealID", sql.Int, mealId);
    const result = await request.query(query);
    return result.recordset[0] || null;
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Error closing connection:", err);
      }
    }
  }
}

// Add a new meal
async function addMeal(meal) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = `
      INSERT INTO Meals (UserID, MealName, Category, Instructions, SpoonacularID, Ingredients, Servings, ReadyInMinutes, ImageUrl)
      VALUES (@UserID, @MealName, @Category, @Instructions, @SpoonacularID, @Ingredients, @Servings, @ReadyInMinutes, @ImageUrl);
      SELECT SCOPE_IDENTITY() AS MealID;
    `;
    const request = connection.request();
    request.input("UserID", sql.Int, meal.UserID);
    request.input("MealName", sql.NVarChar(100), meal.MealName);
    request.input("Category", sql.NVarChar(50), meal.Category);
    request.input("Instructions", sql.NVarChar(sql.MAX), meal.Instructions);
    request.input("SpoonacularID", sql.Int, meal.SpoonacularID || null);
    request.input("Ingredients", sql.NVarChar(sql.MAX), meal.Ingredients || null);
    request.input("Servings", sql.Int, meal.Servings || 4);
    request.input("ReadyInMinutes", sql.Int, meal.ReadyInMinutes || null);
    request.input("ImageUrl", sql.NVarChar(500), meal.ImageUrl || null);

    const result = await request.query(query);
    const newMealId = result.recordset[0].MealID;
    return await getMealById(newMealId);
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Error closing connection:", err);
      }
    }
  }
}

// Update a meal
async function updateMeal(mealId, updatedMeal) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = `
      UPDATE Meals
      SET MealName = @MealName,
          Category = @Category,
          Instructions = @Instructions
      WHERE MealID = @MealID
    `;
    const request = connection.request();
    request.input("MealID", sql.Int, mealId);
    request.input("MealName", sql.NVarChar(100), updatedMeal.MealName);
    request.input("Category", sql.NVarChar(50), updatedMeal.Category);
    request.input("Instructions", sql.NVarChar(sql.MAX), updatedMeal.Instructions);

    const result = await request.query(query);

    if (result.rowsAffected[0] === 0) {
      return null; // Meal not found
    }

    return await getMealById(mealId); // Return updated meal
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Error closing connection:", err);
      }
    }
  }
}

// Delete a meal
async function deleteMeal(mealId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = "DELETE FROM Meals WHERE MealID = @MealID";
    const request = connection.request();
    request.input("MealID", sql.Int, mealId);
    const result = await request.query(query);
    return result.rowsAffected[0] > 0;
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Error closing connection:", err);
      }
    }
  }
}

module.exports = {
  getAllMeals,
  getMealById,
  addMeal,
  updateMeal,
  deleteMeal,
  searchRecipes,
  getRecipeDetails,
  getRandomRecipes,
};