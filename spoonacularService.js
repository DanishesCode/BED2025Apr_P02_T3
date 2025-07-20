// Simple Spoonacular API service
const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY || 'YOUR_SPOONACULAR_API_KEY';
const SPOONACULAR_BASE_URL = 'https://api.spoonacular.com/recipes';

// Search for recipes
const searchRecipes = async (options) => {
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
};

// Get recipe details
const getRecipeDetails = async (recipeId) => {
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
};

// Get random recipes
const getRandomRecipes = async (options) => {
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
};

module.exports = {
  searchRecipes,
  getRecipeDetails,
  getRandomRecipes
};
