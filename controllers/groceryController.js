const groceryModel = require('../models/groceryModel');
const mealsModel = require('../models/mealsModel');
const { getRecipeDetails } = require('../models/mealsModel');

// Get all grocery items for a user
async function getAllGroceryItems(req, res) {
  try {
    const userId = parseInt(req.params.userId);
    const items = await groceryModel.getAllGroceryItems(userId);
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch grocery items', details: err.message });
  }
}

// Get one item by ID
async function getGroceryItemById(req, res) {
  try {
    const itemId = parseInt(req.params.id);
    const item = await groceryModel.getGroceryItemById(itemId);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch item', details: err.message });
  }
}

// Add a new grocery item
async function addGroceryItem(req, res) {
  try {
    // Input validation is handled by middleware
    const result = await groceryModel.addGroceryItem(req.body);
    res.status(201).json({ 
      message: 'Item added successfully',
      itemId: result.insertId 
    });
  } catch (err) {
    console.error('Error adding grocery item:', err);
    
    // Handle specific database errors
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ 
        error: 'Duplicate item', 
        details: 'This item already exists in your grocery list' 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to add item', 
      details: err.message 
    });
  }
}

// Update a grocery item
async function updateGroceryItem(req, res) {
  try {
    // Input validation is handled by middleware
    const itemId = req.params.id;
    
    // Check if item exists first
    const existingItem = await groceryModel.getGroceryItemById(itemId);
    if (!existingItem) {
      return res.status(404).json({ 
        error: 'Item not found',
        details: 'The grocery item you are trying to update does not exist'
      });
    }
    
    await groceryModel.updateGroceryItem(itemId, req.body);
    res.json({ message: 'Item updated successfully' });
  } catch (err) {
    console.error('Error updating grocery item:', err);
    res.status(500).json({ 
      error: 'Failed to update item', 
      details: err.message 
    });
  }
}

// Delete a grocery item
async function deleteGroceryItem(req, res) {
  try {
    const itemId = parseInt(req.params.id);
    await groceryModel.deleteGroceryItem(itemId);
    res.json({ message: 'Item deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete item', details: err.message });
  }
}

// Generate grocery list from meal plans
async function generateFromMealPlan(req, res) {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid userId' });
    }

    const { selectedMeals } = req.body; // Array of { mealId, category, servings, dayOfWeek }
    
    if (!selectedMeals || selectedMeals.length === 0) {
      return res.status(400).json({ error: 'No meals selected' });
    }

    console.log(`[BACKEND] Auto-assigning days based on meal plan schedule`);

    const consolidatedIngredients = new Map(); // Key will be "ingredientName_day"

    // Process each selected meal
    for (const meal of selectedMeals) {
      try {
        console.log(`[BACKEND] Processing meal:`, meal);
        
        // Get meal details from database
        const mealDetails = await mealsModel.getMealById(meal.mealId);
        
        console.log(`[BACKEND] Meal details from database:`, mealDetails);
        
        if (!mealDetails) {
          console.log(`Meal with ID ${meal.mealId} not found, skipping...`);
          continue;
        }

        // The meal object already contains the scheduled day from the frontend
        // This comes from the meal plan where we know which day it was scheduled for
        const assignedDay = meal.dayOfWeek || 'monday'; // Use the day from meal plan
        console.log(`[BACKEND] Using scheduled day from meal plan: ${assignedDay}`);

        let ingredients = [];

        console.log(`[BACKEND] Checking SpoonacularID: ${mealDetails.SpoonacularID}`);
        console.log(`[BACKEND] Checking stored Ingredients: ${mealDetails.Ingredients}`);

        // If meal has Spoonacular ID, fetch ingredients from Spoonacular API
        if (mealDetails.SpoonacularID) {
          console.log(`[BACKEND] Fetching ingredients for Spoonacular recipe ${mealDetails.SpoonacularID}`);
          const spoonacularResponse = await getRecipeDetails(mealDetails.SpoonacularID);
          
          console.log(`[BACKEND] Spoonacular response:`, spoonacularResponse);
          
          if (spoonacularResponse.success && spoonacularResponse.recipe.ingredients) {
            ingredients = spoonacularResponse.recipe.ingredients.map(ingredient => ({
              name: ingredient.name,
              amount: ingredient.amount,
              unit: ingredient.unit || 'unit'
            }));
            console.log(`[BACKEND] Mapped Spoonacular ingredients:`, ingredients);
          }
        } 
        // If meal has stored ingredients, parse them
        else if (mealDetails.Ingredients) {
          try {
            const storedIngredients = JSON.parse(mealDetails.Ingredients);
            console.log(`[BACKEND] Parsed stored ingredients:`, storedIngredients);
            ingredients = storedIngredients.map(ingredient => ({
              name: ingredient.name,
              amount: ingredient.amount || 1,
              unit: ingredient.unit || 'unit'
            }));
            console.log(`[BACKEND] Mapped stored ingredients:`, ingredients);
          } catch (error) {
            console.error('[BACKEND] Error parsing stored ingredients:', error);
          }
        }
        // Fallback to category-based ingredients
        else {
          console.log(`[BACKEND] Using fallback category ingredients for category: ${mealDetails.Category || meal.category}`);
          ingredients = getCategoryIngredients(mealDetails.Category || meal.category);
          console.log(`[BACKEND] Category fallback ingredients:`, ingredients);
        }

        // Calculate servings multiplier
        const baseServings = mealDetails.Servings || 4;
        const requestedServings = meal.servings || 4;
        const servingsMultiplier = requestedServings / baseServings;
        
        console.log(`[BACKEND] Servings calculation - Base: ${baseServings}, Requested: ${requestedServings}, Multiplier: ${servingsMultiplier}`);
        console.log(`[BACKEND] Final ingredients before consolidation:`, ingredients);
        
        // Add ingredients to consolidated list
        ingredients.forEach(ingredient => {
          const key = `${ingredient.name.toLowerCase().trim()}_${assignedDay}`;
          const adjustedAmount = (ingredient.amount || 1) * servingsMultiplier;
          
          console.log(`[BACKEND] Processing ingredient: ${ingredient.name}, Amount: ${ingredient.amount}, Adjusted: ${adjustedAmount}, Day: ${assignedDay}`);
          
          if (consolidatedIngredients.has(key)) {
            const existing = consolidatedIngredients.get(key);
            existing.amount += adjustedAmount;
            console.log(`[BACKEND] Updated existing ingredient: ${key}, New amount: ${existing.amount}`);
          } else {
            consolidatedIngredients.set(key, {
              name: ingredient.name,
              amount: adjustedAmount,
              unit: ingredient.unit || 'unit',
              assignedDay: assignedDay
            });
            console.log(`[BACKEND] Added new ingredient: ${key}, Amount: ${adjustedAmount}, Day: ${assignedDay}`);
          }
        });

      } catch (error) {
        console.error(`Error processing meal ${meal.mealId}:`, error);
        // Continue with other meals even if one fails
      }
    }

    console.log(`[BACKEND] Consolidated ingredients map:`, Array.from(consolidatedIngredients.entries()));

    // Convert to grocery items format
    const groceryItems = Array.from(consolidatedIngredients.values()).map(ingredient => ({
      item_name: ingredient.name,
      quantity: Math.ceil(ingredient.amount * 100) / 100, // Round to 2 decimal places
      unit: ingredient.unit,
      bought: false,
      user_id: userId,
      date_added: new Date(),
      price: 0.00,
      notes: `Day: ${ingredient.assignedDay}, Generated from meal plan using ${selectedMeals.length} meal(s)`
    }));

    // Add items to database
    let addedCount = 0;
    for (const item of groceryItems) {
      try {
        await groceryModel.addGroceryItem(item);
        addedCount++;
      } catch (error) {
        console.error('Error adding grocery item:', error);
      }
    }

    res.json({ 
      success: true, 
      message: `Added ${addedCount} items to grocery list from ${selectedMeals.length} meals`,
      items: groceryItems,
      details: {
        totalIngredients: groceryItems.length,
        addedItems: addedCount,
        processedMeals: selectedMeals.length
      }
    });

  } catch (err) {
    console.error('Error generating grocery list:', err);
    res.status(500).json({ error: 'Failed to generate grocery list', details: err.message });
  }
}

// Fallback function for category-based ingredients
function getCategoryIngredients(category) {
  const categoryIngredients = {
    breakfast: [
      { name: 'Eggs', amount: 6, unit: 'pieces' },
      { name: 'Bread', amount: 1, unit: 'loaf' },
      { name: 'Milk', amount: 1, unit: 'liter' },
      { name: 'Butter', amount: 1, unit: 'pack' },
      { name: 'Cereal', amount: 1, unit: 'box' },
      { name: 'Bananas', amount: 6, unit: 'pieces' },
      { name: 'Orange juice', amount: 1, unit: 'carton' }
    ],
    lunch: [
      { name: 'Chicken breast', amount: 500, unit: 'grams' },
      { name: 'Lettuce', amount: 1, unit: 'head' },
      { name: 'Tomatoes', amount: 4, unit: 'pieces' },
      { name: 'Cheese', amount: 200, unit: 'grams' },
      { name: 'Bread', amount: 1, unit: 'loaf' },
      { name: 'Mayo', amount: 1, unit: 'bottle' },
      { name: 'Onions', amount: 2, unit: 'pieces' }
    ],
    dinner: [
      { name: 'Ground beef', amount: 500, unit: 'grams' },
      { name: 'Pasta', amount: 500, unit: 'grams' },
      { name: 'Tomato sauce', amount: 2, unit: 'cans' },
      { name: 'Garlic', amount: 1, unit: 'bulb' },
      { name: 'Onions', amount: 2, unit: 'pieces' },
      { name: 'Parmesan cheese', amount: 100, unit: 'grams' },
      { name: 'Olive oil', amount: 1, unit: 'bottle' }
    ],
    'main course': [
      { name: 'Beef stew meat', amount: 800, unit: 'grams' },
      { name: 'Potatoes', amount: 6, unit: 'pieces' },
      { name: 'Carrots', amount: 4, unit: 'pieces' },
      { name: 'Onions', amount: 2, unit: 'pieces' },
      { name: 'Celery', amount: 3, unit: 'stalks' },
      { name: 'Beef broth', amount: 2, unit: 'cans' },
      { name: 'Mushroom soup', amount: 1, unit: 'can' },
      { name: 'Green onions', amount: 1, unit: 'bunch' }
    ],
    'main dish': [
      { name: 'Chicken breast', amount: 800, unit: 'grams' },
      { name: 'Rice', amount: 2, unit: 'cups' },
      { name: 'Mixed vegetables', amount: 500, unit: 'grams' },
      { name: 'Soy sauce', amount: 1, unit: 'bottle' },
      { name: 'Garlic', amount: 1, unit: 'bulb' },
      { name: 'Ginger', amount: 1, unit: 'piece' },
      { name: 'Olive oil', amount: 1, unit: 'bottle' }
    ],
    snack: [
      { name: 'Apples', amount: 4, unit: 'pieces' },
      { name: 'Yogurt', amount: 4, unit: 'cups' },
      { name: 'Nuts', amount: 200, unit: 'grams' }
    ],
    dessert: [
      { name: 'Sugar', amount: 500, unit: 'grams' },
      { name: 'Flour', amount: 1, unit: 'kg' },
      { name: 'Vanilla extract', amount: 1, unit: 'bottle' },
      { name: 'Chocolate chips', amount: 200, unit: 'grams' }
    ]
  };

  return categoryIngredients[category?.toLowerCase()] || [];
}

module.exports = {
  getAllGroceryItems,
  getGroceryItemById,
  addGroceryItem,
  updateGroceryItem,
  deleteGroceryItem,
  generateFromMealPlan
};
