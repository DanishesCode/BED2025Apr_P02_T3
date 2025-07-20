const groceryModel = require('../models/groceryModel');

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
    await groceryModel.addGroceryItem(req.body);
    res.status(201).json({ message: 'Item added successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add item', details: err.message });
  }
}

// Update a grocery item
async function updateGroceryItem(req, res) {
  try {
    const itemId = parseInt(req.params.id);
    await groceryModel.updateGroceryItem(itemId, req.body);
    res.json({ message: 'Item updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update item', details: err.message });
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

    const { selectedMeals } = req.body; // Array of { mealId, category, servings }
    
    if (!selectedMeals || selectedMeals.length === 0) {
      return res.status(400).json({ error: 'No meals selected' });
    }

    // For now, we'll use predefined ingredients based on category
    // Later this can be enhanced to use actual recipe ingredients from database or Spoonacular
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

    const consolidatedIngredients = new Map();

    selectedMeals.forEach(meal => {
      const ingredients = categoryIngredients[meal.category.toLowerCase()] || [];
      const servingsMultiplier = (meal.servings || 1) / 4; // Base recipe serves 4
      
      ingredients.forEach(ingredient => {
        const key = ingredient.name.toLowerCase();
        const adjustedAmount = ingredient.amount * servingsMultiplier;
        
        if (consolidatedIngredients.has(key)) {
          const existing = consolidatedIngredients.get(key);
          existing.amount += adjustedAmount;
        } else {
          consolidatedIngredients.set(key, {
            name: ingredient.name,
            amount: adjustedAmount,
            unit: ingredient.unit
          });
        }
      });
    });

    // Convert to grocery items format
    const groceryItems = Array.from(consolidatedIngredients.values()).map(ingredient => ({
      item_name: ingredient.name,
      quantity: Math.ceil(ingredient.amount),
      unit: ingredient.unit,
      bought: false,
      user_id: userId,
      date_added: new Date(),
      price: 0.00,
      notes: `Generated from meal plan`
    }));

    // Add items to database
    for (const item of groceryItems) {
      try {
        await groceryModel.addGroceryItem(item);
      } catch (error) {
        console.error('Error adding grocery item:', error);
      }
    }

    res.json({ 
      success: true, 
      message: `Added ${groceryItems.length} items to grocery list`,
      items: groceryItems
    });

  } catch (err) {
    console.error('Error generating grocery list:', err);
    res.status(500).json({ error: 'Failed to generate grocery list', details: err.message });
  }
}

module.exports = {
  getAllGroceryItems,
  getGroceryItemById,
  addGroceryItem,
  updateGroceryItem,
  deleteGroceryItem,
  generateFromMealPlan
};
