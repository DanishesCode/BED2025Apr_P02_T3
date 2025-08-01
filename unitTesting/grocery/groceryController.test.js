const groceryController = require("../../controllers/groceryController");
const groceryModel = require("../../models/groceryModel");
const mealsModel = require("../../models/mealsModel");
const { getRecipeDetails } = require("../../models/mealsModel");

// Mock the dependencies
jest.mock("../../models/groceryModel");
jest.mock("../../models/mealsModel");
jest.mock("../../models/mealsModel");

describe("groceryController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console methods to reduce test output
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    console.log.mockRestore();
    console.error.mockRestore();
  });

  describe("getAllGroceryItems", () => {
    it("should fetch all grocery items for a user and return JSON response", async () => {
      const mockGroceryItems = [
        {
          item_id: 1,
          item_name: "Milk",
          quantity: 2,
          unit: "liters",
          bought: false,
          user_id: 1,
          date_added: "2024-01-15",
          price: 3.50,
          notes: "Whole milk"
        },
        {
          item_id: 2,
          item_name: "Bread",
          quantity: 1,
          unit: "loaf",
          bought: true,
          user_id: 1,
          date_added: "2024-01-15",
          price: 2.25,
          notes: "Whole wheat"
        }
      ];

      groceryModel.getAllGroceryItems.mockResolvedValue(mockGroceryItems);

      const req = { params: { userId: "1" } };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await groceryController.getAllGroceryItems(req, res);

      expect(groceryModel.getAllGroceryItems).toHaveBeenCalledTimes(1);
      expect(groceryModel.getAllGroceryItems).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith(mockGroceryItems);
    });

    it("should handle database errors and return 500 status", async () => {
      const errorMessage = "Database connection failed";
      groceryModel.getAllGroceryItems.mockRejectedValue(new Error(errorMessage));

      const req = { params: { userId: "1" } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await groceryController.getAllGroceryItems(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ 
        error: 'Failed to fetch grocery items', 
        details: errorMessage 
      });
    });

    it("should handle invalid userId parameter", async () => {
      groceryModel.getAllGroceryItems.mockResolvedValue([]);

      const req = { params: { userId: "invalid" } };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await groceryController.getAllGroceryItems(req, res);

      expect(groceryModel.getAllGroceryItems).toHaveBeenCalledWith(NaN);
    });
  });

  describe("getGroceryItemById", () => {
    it("should fetch a specific grocery item and return JSON response", async () => {
      const mockGroceryItem = {
        item_id: 1,
        item_name: "Milk",
        quantity: 2,
        unit: "liters",
        bought: false,
        user_id: 1,
        date_added: "2024-01-15",
        price: 3.50,
        notes: "Whole milk"
      };

      groceryModel.getGroceryItemById.mockResolvedValue(mockGroceryItem);

      const req = { params: { id: "1" } };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await groceryController.getGroceryItemById(req, res);

      expect(groceryModel.getGroceryItemById).toHaveBeenCalledTimes(1);
      expect(groceryModel.getGroceryItemById).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith(mockGroceryItem);
    });

    it("should return 404 when grocery item not found", async () => {
      groceryModel.getGroceryItemById.mockResolvedValue(null);

      const req = { params: { id: "999" } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await groceryController.getGroceryItemById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Item not found' });
    });

    it("should handle database errors", async () => {
      const errorMessage = "Database error";
      groceryModel.getGroceryItemById.mockRejectedValue(new Error(errorMessage));

      const req = { params: { id: "1" } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await groceryController.getGroceryItemById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ 
        error: 'Failed to fetch item', 
        details: errorMessage 
      });
    });
  });

  describe("addGroceryItem", () => {
    it("should add a new grocery item successfully", async () => {
      const mockItemData = {
        item_name: "Apples",
        quantity: 6,
        unit: "pieces",
        bought: false,
        user_id: 1,
        price: 4.50,
        notes: "Red apples"
      };

      groceryModel.addGroceryItem.mockResolvedValue({ success: true });

      const req = { body: mockItemData };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await groceryController.addGroceryItem(req, res);

      expect(groceryModel.addGroceryItem).toHaveBeenCalledWith(mockItemData);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ message: 'Item added successfully' });
    });

    it("should handle database errors during item creation", async () => {
      const mockItemData = {
        item_name: "Bananas",
        quantity: 8,
        unit: "pieces"
      };

      const errorMessage = "Database insert failed";
      groceryModel.addGroceryItem.mockRejectedValue(new Error(errorMessage));

      const req = { body: mockItemData };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await groceryController.addGroceryItem(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ 
        error: 'Failed to add item', 
        details: errorMessage 
      });
    });
  });

  describe("updateGroceryItem", () => {
    it("should update a grocery item successfully", async () => {
      const mockUpdateData = {
        item_name: "Organic Milk",
        quantity: 1,
        unit: "liter",
        bought: true,
        price: 4.00,
        notes: "Organic whole milk"
      };

      groceryModel.updateGroceryItem.mockResolvedValue({ success: true });

      const req = {
        params: { id: "1" },
        body: mockUpdateData
      };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await groceryController.updateGroceryItem(req, res);

      expect(groceryModel.updateGroceryItem).toHaveBeenCalledWith(1, mockUpdateData);
      expect(res.json).toHaveBeenCalledWith({ message: 'Item updated successfully' });
    });

    it("should handle database errors during update", async () => {
      const mockUpdateData = {
        item_name: "Updated Item",
        quantity: 2
      };

      const errorMessage = "Update failed";
      groceryModel.updateGroceryItem.mockRejectedValue(new Error(errorMessage));

      const req = {
        params: { id: "1" },
        body: mockUpdateData
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await groceryController.updateGroceryItem(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ 
        error: 'Failed to update item', 
        details: errorMessage 
      });
    });
  });

  describe("deleteGroceryItem", () => {
    it("should delete a grocery item successfully", async () => {
      groceryModel.deleteGroceryItem.mockResolvedValue({ success: true });

      const req = { params: { id: "1" } };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await groceryController.deleteGroceryItem(req, res);

      expect(groceryModel.deleteGroceryItem).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith({ message: 'Item deleted successfully' });
    });

    it("should handle database errors during deletion", async () => {
      const errorMessage = "Delete failed";
      groceryModel.deleteGroceryItem.mockRejectedValue(new Error(errorMessage));

      const req = { params: { id: "1" } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await groceryController.deleteGroceryItem(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ 
        error: 'Failed to delete item', 
        details: errorMessage 
      });
    });
  });

  describe("generateFromMealPlan", () => {
    it("should generate grocery list from meal plan with Spoonacular ingredients", async () => {
      const mockSelectedMeals = [
        { mealId: 1, category: "dinner", servings: 4 },
        { mealId: 2, category: "lunch", servings: 2 }
      ];

      const mockMealDetails1 = {
        MealID: 1,
        MealName: "Spaghetti Bolognese",
        Category: "dinner",
        SpoonacularID: 12345,
        Servings: 4
      };

      const mockMealDetails2 = {
        MealID: 2,
        MealName: "Caesar Salad",
        Category: "lunch",
        Ingredients: JSON.stringify([
          { name: "lettuce", amount: 1, unit: "head" },
          { name: "parmesan cheese", amount: 100, unit: "grams" }
        ]),
        Servings: 2
      };

      const mockSpoonacularResponse = {
        success: true,
        recipe: {
          ingredients: [
            { name: "ground beef", amount: 500, unit: "grams" },
            { name: "pasta", amount: 400, unit: "grams" },
            { name: "tomato sauce", amount: 1, unit: "can" }
          ]
        }
      };

      mealsModel.getMealById.mockResolvedValueOnce(mockMealDetails1);
      mealsModel.getMealById.mockResolvedValueOnce(mockMealDetails2);
      getRecipeDetails.mockResolvedValue(mockSpoonacularResponse);
      groceryModel.addGroceryItem.mockResolvedValue({ success: true });

      const req = {
        params: { userId: "1" },
        body: { selectedMeals: mockSelectedMeals }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await groceryController.generateFromMealPlan(req, res);

      expect(mealsModel.getMealById).toHaveBeenCalledWith(1);
      expect(mealsModel.getMealById).toHaveBeenCalledWith(2);
      expect(getRecipeDetails).toHaveBeenCalledWith(12345);
      expect(groceryModel.addGroceryItem).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining("Added"),
          items: expect.any(Array),
          details: expect.objectContaining({
            totalIngredients: expect.any(Number),
            addedItems: expect.any(Number),
            processedMeals: 2
          })
        })
      );
    });

    it("should handle meals with stored ingredients (no Spoonacular)", async () => {
      const mockSelectedMeals = [
        { mealId: 1, category: "breakfast", servings: 2 }
      ];

      const mockMealDetails = {
        MealID: 1,
        MealName: "Pancakes",
        Category: "breakfast",
        Ingredients: JSON.stringify([
          { name: "flour", amount: 2, unit: "cups" },
          { name: "eggs", amount: 2, unit: "pieces" },
          { name: "milk", amount: 1, unit: "cup" }
        ]),
        Servings: 4 // Base servings
      };

      mealsModel.getMealById.mockResolvedValue(mockMealDetails);
      groceryModel.addGroceryItem.mockResolvedValue({ success: true });

      const req = {
        params: { userId: "1" },
        body: { selectedMeals: mockSelectedMeals }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await groceryController.generateFromMealPlan(req, res);

      expect(mealsModel.getMealById).toHaveBeenCalledWith(1);
      expect(getRecipeDetails).not.toHaveBeenCalled();
      expect(groceryModel.addGroceryItem).toHaveBeenCalled();
      
      // Check that servings were adjusted (2 requested / 4 base = 0.5 multiplier)
      const addGroceryItemCalls = groceryModel.addGroceryItem.mock.calls;
      expect(addGroceryItemCalls.length).toBeGreaterThan(0);
      
      // Find flour item to check quantity adjustment
      const flourItem = addGroceryItemCalls.find(call => 
        call[0].item_name === "flour"
      );
      expect(flourItem[0].quantity).toBe(1); // 2 * 0.5 = 1
    });

    it("should use category fallback when no ingredients available", async () => {
      const mockSelectedMeals = [
        { mealId: 1, category: "breakfast", servings: 4 }
      ];

      const mockMealDetails = {
        MealID: 1,
        MealName: "Generic Breakfast",
        Category: "breakfast",
        Servings: 4
        // No SpoonacularID or Ingredients
      };

      mealsModel.getMealById.mockResolvedValue(mockMealDetails);
      groceryModel.addGroceryItem.mockResolvedValue({ success: true });

      const req = {
        params: { userId: "1" },
        body: { selectedMeals: mockSelectedMeals }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await groceryController.generateFromMealPlan(req, res);

      expect(groceryModel.addGroceryItem).toHaveBeenCalled();
      
      // Check that category ingredients were used
      const addGroceryItemCalls = groceryModel.addGroceryItem.mock.calls;
      const itemNames = addGroceryItemCalls.map(call => call[0].item_name);
      expect(itemNames).toContain("Eggs");
      expect(itemNames).toContain("Bread");
      expect(itemNames).toContain("Milk");
    });

    it("should consolidate duplicate ingredients correctly", async () => {
      const mockSelectedMeals = [
        { mealId: 1, category: "dinner", servings: 4 },
        { mealId: 2, category: "dinner", servings: 4 }
      ];

      const mockMealDetails1 = {
        MealID: 1,
        MealName: "Pasta 1",
        Category: "dinner",
        Ingredients: JSON.stringify([
          { name: "pasta", amount: 200, unit: "grams" },
          { name: "tomato sauce", amount: 1, unit: "can" }
        ]),
        Servings: 4
      };

      const mockMealDetails2 = {
        MealID: 2,
        MealName: "Pasta 2",
        Category: "dinner",
        Ingredients: JSON.stringify([
          { name: "pasta", amount: 300, unit: "grams" },
          { name: "cheese", amount: 100, unit: "grams" }
        ]),
        Servings: 4
      };

      mealsModel.getMealById.mockResolvedValueOnce(mockMealDetails1);
      mealsModel.getMealById.mockResolvedValueOnce(mockMealDetails2);
      groceryModel.addGroceryItem.mockResolvedValue({ success: true });

      const req = {
        params: { userId: "1" },
        body: { selectedMeals: mockSelectedMeals }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await groceryController.generateFromMealPlan(req, res);

      // Check that pasta quantities were consolidated
      const addGroceryItemCalls = groceryModel.addGroceryItem.mock.calls;
      const pastaItem = addGroceryItemCalls.find(call => 
        call[0].item_name === "pasta"
      );
      expect(pastaItem[0].quantity).toBe(500); // 200 + 300 = 500
    });

    it("should return 400 for invalid userId", async () => {
      const req = {
        params: { userId: "invalid" },
        body: { selectedMeals: [{ mealId: 1 }] }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await groceryController.generateFromMealPlan(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid userId' });
    });

    it("should return 400 when no meals selected", async () => {
      const req = {
        params: { userId: "1" },
        body: { selectedMeals: [] }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await groceryController.generateFromMealPlan(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'No meals selected' });
    });

    it("should handle missing selectedMeals in request body", async () => {
      const req = {
        params: { userId: "1" },
        body: {}
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await groceryController.generateFromMealPlan(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'No meals selected' });
    });

    it("should continue processing even if one meal fails", async () => {
      const mockSelectedMeals = [
        { mealId: 1, category: "dinner", servings: 4 },
        { mealId: 999, category: "lunch", servings: 2 } // This will fail
      ];

      const mockMealDetails = {
        MealID: 1,
        MealName: "Working Meal",
        Category: "dinner",
        Ingredients: JSON.stringify([
          { name: "pasta", amount: 200, unit: "grams" }
        ]),
        Servings: 4
      };

      mealsModel.getMealById.mockResolvedValueOnce(mockMealDetails);
      mealsModel.getMealById.mockResolvedValueOnce(null); // Meal not found
      groceryModel.addGroceryItem.mockResolvedValue({ success: true });

      const req = {
        params: { userId: "1" },
        body: { selectedMeals: mockSelectedMeals }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await groceryController.generateFromMealPlan(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          details: expect.objectContaining({
            processedMeals: 2 // Both meals were processed
          })
        })
      );
    });

    it("should handle Spoonacular API failures gracefully", async () => {
      const mockSelectedMeals = [
        { mealId: 1, category: "dinner", servings: 4 }
      ];

      const mockMealDetails = {
        MealID: 1,
        MealName: "Spoonacular Recipe",
        Category: "dinner",
        SpoonacularID: 12345,
        Servings: 4
      };

      mealsModel.getMealById.mockResolvedValue(mockMealDetails);
      getRecipeDetails.mockResolvedValue({ success: false }); // API failure
      groceryModel.addGroceryItem.mockResolvedValue({ success: true });

      const req = {
        params: { userId: "1" },
        body: { selectedMeals: mockSelectedMeals }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await groceryController.generateFromMealPlan(req, res);

      // Should still succeed but use category fallback
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true
        })
      );
    });

    it("should handle grocery item addition failures gracefully", async () => {
      const mockSelectedMeals = [
        { mealId: 1, category: "breakfast", servings: 4 }
      ];

      const mockMealDetails = {
        MealID: 1,
        MealName: "Simple Breakfast",
        Category: "breakfast",
        Servings: 4
      };

      mealsModel.getMealById.mockResolvedValue(mockMealDetails);
      groceryModel.addGroceryItem.mockRejectedValue(new Error("Add item failed"));

      const req = {
        params: { userId: "1" },
        body: { selectedMeals: mockSelectedMeals }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await groceryController.generateFromMealPlan(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          details: expect.objectContaining({
            addedItems: 0 // No items were successfully added
          })
        })
      );
    });
  });
});
