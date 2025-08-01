const mealController = require("../../controllers/mealController");
const mealsModel = require("../../models/mealsModel");
const { getRecipeDetails } = require("../../models/mealsModel");

// Mock the dependencies
jest.mock("../../models/mealsModel");
jest.mock("../../models/mealsModel");

describe("mealController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAllMeals", () => {
    it("should fetch all meals for a user and return JSON response", async () => {
      const mockMeals = [
        { MealID: 1, MealName: "Chicken Curry", Category: "dinner", UserID: 1 },
        { MealID: 2, MealName: "Caesar Salad", Category: "lunch", UserID: 1 }
      ];

      mealsModel.getAllMeals.mockResolvedValue(mockMeals);

      const req = { params: { userId: "1" } };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await mealController.getAllMeals(req, res);

      expect(mealsModel.getAllMeals).toHaveBeenCalledTimes(1);
      expect(mealsModel.getAllMeals).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith(mockMeals);
    });

    it("should return 400 for invalid userId", async () => {
      const req = { params: { userId: "invalid" } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await mealController.getAllMeals(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid userId' });
      expect(mealsModel.getAllMeals).not.toHaveBeenCalled();
    });

    it("should handle database errors and return 500 status", async () => {
      const errorMessage = "Database connection failed";
      mealsModel.getAllMeals.mockRejectedValue(new Error(errorMessage));

      const req = { params: { userId: "1" } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await mealController.getAllMeals(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Server error while retrieving meals' });
    });
  });

  describe("getMealById", () => {
    it("should fetch a specific meal and return JSON response", async () => {
      const mockMeal = {
        MealID: 1,
        MealName: "Chicken Curry",
        Category: "dinner",
        Instructions: "Cook chicken with spices"
      };

      mealsModel.getMealById.mockResolvedValue(mockMeal);

      const req = { params: { mealId: "1" } };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await mealController.getMealById(req, res);

      expect(mealsModel.getMealById).toHaveBeenCalledTimes(1);
      expect(mealsModel.getMealById).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith(mockMeal);
    });

    it("should return 404 when meal not found", async () => {
      mealsModel.getMealById.mockResolvedValue(null);

      const req = { params: { mealId: "999" } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await mealController.getMealById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Meal not found' });
    });

    it("should return 400 for invalid mealId", async () => {
      const req = { params: { mealId: "invalid" } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await mealController.getMealById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid mealId' });
      expect(mealsModel.getMealById).not.toHaveBeenCalled();
    });
  });

  describe("addMeal", () => {
    it("should add a new meal without Spoonacular integration", async () => {
      const mockMealData = {
        UserID: 1,
        MealName: "Test Meal",
        Category: "lunch",
        Instructions: "Test instructions"
      };

      const mockCreatedMeal = {
        MealID: 1,
        ...mockMealData,
        Servings: 4,
        ReadyInMinutes: null,
        ImageUrl: null,
        Ingredients: null
      };

      mealsModel.addMeal.mockResolvedValue(mockCreatedMeal);

      const req = { body: mockMealData };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await mealController.addMeal(req, res);

      expect(mealsModel.addMeal).toHaveBeenCalledWith({
        UserID: 1,
        MealName: "Test Meal",
        Category: "lunch",
        Instructions: "Test instructions",
        SpoonacularID: null,
        Servings: 4,
        ReadyInMinutes: null,
        ImageUrl: null,
        Ingredients: null
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Meal added successfully',
        meal: mockCreatedMeal
      });
    });

    it("should add a meal with Spoonacular integration", async () => {
      const mockMealData = {
        UserID: 1,
        MealName: "Spoonacular Recipe",
        Category: "dinner",
        Instructions: "Original instructions",
        SpoonacularID: 123456
      };

      const mockSpoonacularResponse = {
        success: true,
        recipe: {
          servings: 6,
          readyInMinutes: 30,
          image: "http://example.com/image.jpg",
          ingredients: [
            { name: "chicken", amount: 2, unit: "lbs" }
          ],
          instructions: "Spoonacular instructions"
        }
      };

      const mockCreatedMeal = {
        MealID: 1,
        ...mockMealData,
        Servings: 6,
        ReadyInMinutes: 30,
        ImageUrl: "http://example.com/image.jpg",
        Ingredients: JSON.stringify(mockSpoonacularResponse.recipe.ingredients)
      };

      getRecipeDetails.mockResolvedValue(mockSpoonacularResponse);
      mealsModel.addMeal.mockResolvedValue(mockCreatedMeal);

      const req = { body: mockMealData };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await mealController.addMeal(req, res);

      expect(getRecipeDetails).toHaveBeenCalledWith(123456);
      expect(mealsModel.addMeal).toHaveBeenCalledWith({
        UserID: 1,
        MealName: "Spoonacular Recipe",
        Category: "dinner",
        Instructions: "Original instructions",
        SpoonacularID: 123456,
        Servings: 6,
        ReadyInMinutes: 30,
        ImageUrl: "http://example.com/image.jpg",
        Ingredients: JSON.stringify(mockSpoonacularResponse.recipe.ingredients)
      });
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("should return 400 for missing required fields", async () => {
      const req = { body: { UserID: 1, MealName: "Test" } }; // Missing Category and Instructions
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await mealController.addMeal(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Missing required meal fields' });
      expect(mealsModel.addMeal).not.toHaveBeenCalled();
    });

    it("should handle database errors", async () => {
      const mockMealData = {
        UserID: 1,
        MealName: "Test Meal",
        Category: "lunch",
        Instructions: "Test instructions"
      };

      mealsModel.addMeal.mockRejectedValue(new Error("Database error"));

      const req = { body: mockMealData };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await mealController.addMeal(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Server error while adding meal' });
    });
  });

  describe("updateMeal", () => {
    it("should update a meal successfully", async () => {
      const mockUpdatedMeal = {
        MealID: 1,
        MealName: "Updated Meal",
        Category: "breakfast",
        Instructions: "Updated instructions"
      };

      mealsModel.updateMeal.mockResolvedValue(mockUpdatedMeal);

      const req = {
        params: { mealId: "1" },
        body: {
          MealName: "Updated Meal",
          Category: "breakfast",
          Instructions: "Updated instructions"
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await mealController.updateMeal(req, res);

      expect(mealsModel.updateMeal).toHaveBeenCalledWith(1, {
        MealName: "Updated Meal",
        Category: "breakfast",
        Instructions: "Updated instructions"
      });
      expect(res.json).toHaveBeenCalledWith({
        message: 'Meal updated successfully',
        meal: mockUpdatedMeal
      });
    });

    it("should return 404 when meal not found for update", async () => {
      mealsModel.updateMeal.mockResolvedValue(null);

      const req = {
        params: { mealId: "999" },
        body: {
          MealName: "Updated Meal",
          Category: "breakfast",
          Instructions: "Updated instructions"
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await mealController.updateMeal(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Meal not found' });
    });

    it("should return 400 for missing required fields", async () => {
      const req = {
        params: { mealId: "1" },
        body: { MealName: "Test" } // Missing Category and Instructions
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await mealController.updateMeal(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Missing required meal fields' });
      expect(mealsModel.updateMeal).not.toHaveBeenCalled();
    });
  });

  describe("deleteMeal", () => {
    it("should delete a meal successfully", async () => {
      mealsModel.deleteMeal.mockResolvedValue(true);

      const req = { params: { mealId: "1" } };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await mealController.deleteMeal(req, res);

      expect(mealsModel.deleteMeal).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith({ message: 'Meal deleted successfully' });
    });

    it("should return 404 when meal not found for deletion", async () => {
      mealsModel.deleteMeal.mockResolvedValue(false);

      const req = { params: { mealId: "999" } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await mealController.deleteMeal(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Meal not found' });
    });

    it("should return 400 for invalid mealId", async () => {
      const req = { params: { mealId: "invalid" } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await mealController.deleteMeal(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid mealId' });
      expect(mealsModel.deleteMeal).not.toHaveBeenCalled();
    });
  });

  describe("importSpoonacularRecipe", () => {
    it("should import a Spoonacular recipe successfully", async () => {
      const mockSpoonacularResponse = {
        success: true,
        recipe: {
          title: "Imported Recipe",
          instructions: "Imported instructions",
          servings: 4,
          readyInMinutes: 25,
          image: "http://example.com/image.jpg",
          ingredients: [
            { name: "ingredient1", amount: 1, unit: "cup" }
          ],
          sourceUrl: "http://example.com/recipe"
        }
      };

      const mockCreatedMeal = {
        MealID: 1,
        UserID: 1,
        MealName: "Imported Recipe",
        Category: "main",
        Instructions: "Imported instructions",
        SpoonacularID: 123456
      };

      getRecipeDetails.mockResolvedValue(mockSpoonacularResponse);
      mealsModel.addMeal.mockResolvedValue(mockCreatedMeal);

      const req = {
        body: {
          UserID: 1,
          SpoonacularID: 123456,
          Category: "main"
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await mealController.importSpoonacularRecipe(req, res);

      expect(getRecipeDetails).toHaveBeenCalledWith(123456);
      expect(mealsModel.addMeal).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Spoonacular recipe imported successfully',
        meal: mockCreatedMeal,
        sourceUrl: "http://example.com/recipe",
        ingredientsCount: 1
      });
    });

    it("should return 400 for missing required fields", async () => {
      const req = { body: { UserID: 1 } }; // Missing SpoonacularID
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await mealController.importSpoonacularRecipe(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Missing required fields: UserID and SpoonacularID' });
      expect(getRecipeDetails).not.toHaveBeenCalled();
    });

    it("should handle Spoonacular API failure", async () => {
      getRecipeDetails.mockResolvedValue({
        success: false,
        error: "Recipe not found"
      });

      const req = {
        body: {
          UserID: 1,
          SpoonacularID: 999999
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await mealController.importSpoonacularRecipe(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Failed to fetch recipe from Spoonacular',
        error: "Recipe not found"
      });
    });
  });
});
