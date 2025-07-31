const mealsModel = require("../../models/mealsModel");
const sql = require("mssql");

// Mock the dependencies
jest.mock("mssql");
jest.mock("../../dbConfig");

// Mock fetch for Spoonacular API tests
global.fetch = jest.fn();

describe("mealsModel", () => {
  let mockConnection;
  let mockRequest;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn()
    };
    
    mockConnection = {
      request: jest.fn(() => mockRequest),
      close: jest.fn()
    };
    
    sql.connect.mockResolvedValue(mockConnection);
  });

  describe("Database Functions", () => {
    describe("getAllMeals", () => {
      it("should fetch all meals for a specific user", async () => {
        const mockMeals = [
          { MealID: 1, MealName: "Chicken Curry", Category: "dinner", UserID: 1 },
          { MealID: 2, MealName: "Caesar Salad", Category: "lunch", UserID: 1 }
        ];

        mockRequest.query.mockResolvedValue({ recordset: mockMeals });

        const result = await mealsModel.getAllMeals(1);

        expect(sql.connect).toHaveBeenCalledTimes(1);
        expect(mockRequest.input).toHaveBeenCalledWith("UserID", sql.Int, 1);
        expect(mockRequest.query).toHaveBeenCalledWith("SELECT * FROM Meals WHERE UserID = @UserID");
        expect(result).toEqual(mockMeals);
        expect(mockConnection.close).toHaveBeenCalled();
      });

      it("should handle database errors", async () => {
        const error = new Error("Database connection failed");
        sql.connect.mockRejectedValue(error);

        await expect(mealsModel.getAllMeals(1)).rejects.toThrow("Database connection failed");
      });

      it("should close connection even if query fails", async () => {
        const error = new Error("Query failed");
        mockRequest.query.mockRejectedValue(error);

        await expect(mealsModel.getAllMeals(1)).rejects.toThrow("Query failed");
        expect(mockConnection.close).toHaveBeenCalled();
      });
    });

    describe("getMealById", () => {
      it("should fetch a specific meal by ID", async () => {
        const mockMeal = {
          MealID: 1,
          MealName: "Chicken Curry",
          Category: "dinner",
          Instructions: "Cook chicken with spices"
        };

        mockRequest.query.mockResolvedValue({ recordset: [mockMeal] });

        const result = await mealsModel.getMealById(1);

        expect(mockRequest.input).toHaveBeenCalledWith("MealID", sql.Int, 1);
        expect(mockRequest.query).toHaveBeenCalledWith("SELECT * FROM Meals WHERE MealID = @MealID");
        expect(result).toEqual(mockMeal);
      });

      it("should return null when meal not found", async () => {
        mockRequest.query.mockResolvedValue({ recordset: [] });

        const result = await mealsModel.getMealById(999);

        expect(result).toBeNull();
      });
    });

    describe("addMeal", () => {
      it("should add a new meal and return the created meal", async () => {
        const newMeal = {
          UserID: 1,
          MealName: "Test Meal",
          Category: "lunch",
          Instructions: "Test instructions",
          SpoonacularID: null,
          Ingredients: null,
          Servings: 4,
          ReadyInMinutes: null,
          ImageUrl: null
        };

        const mockCreatedMeal = { MealID: 1, ...newMeal };

        // Mock the INSERT query result
        mockRequest.query.mockResolvedValueOnce({ recordset: [{ MealID: 1 }] });
        
        // Mock the getMealById call
        mockRequest.query.mockResolvedValueOnce({ recordset: [mockCreatedMeal] });

        const result = await mealsModel.addMeal(newMeal);

        expect(mockRequest.input).toHaveBeenCalledWith("UserID", sql.Int, 1);
        expect(mockRequest.input).toHaveBeenCalledWith("MealName", sql.NVarChar(100), "Test Meal");
        expect(mockRequest.input).toHaveBeenCalledWith("Category", sql.NVarChar(50), "lunch");
        expect(mockRequest.input).toHaveBeenCalledWith("Instructions", sql.NVarChar(sql.MAX), "Test instructions");
        expect(result).toEqual(mockCreatedMeal);
      });

      it("should handle database errors during meal creation", async () => {
        const newMeal = {
          UserID: 1,
          MealName: "Test Meal",
          Category: "lunch",
          Instructions: "Test instructions"
        };

        const error = new Error("Insert failed");
        mockRequest.query.mockRejectedValue(error);

        await expect(mealsModel.addMeal(newMeal)).rejects.toThrow("Insert failed");
      });
    });

    describe("updateMeal", () => {
      it("should update a meal successfully", async () => {
        const updatedMeal = {
          MealName: "Updated Meal",
          Category: "breakfast",
          Instructions: "Updated instructions"
        };

        const mockUpdatedMeal = { MealID: 1, ...updatedMeal };

        // Mock successful update
        mockRequest.query.mockResolvedValueOnce({ rowsAffected: [1] });
        // Mock getMealById call
        mockRequest.query.mockResolvedValueOnce({ recordset: [mockUpdatedMeal] });

        const result = await mealsModel.updateMeal(1, updatedMeal);

        expect(mockRequest.input).toHaveBeenCalledWith("MealID", sql.Int, 1);
        expect(mockRequest.input).toHaveBeenCalledWith("MealName", sql.NVarChar(100), "Updated Meal");
        expect(result).toEqual(mockUpdatedMeal);
      });

      it("should return null when meal not found for update", async () => {
        const updatedMeal = {
          MealName: "Updated Meal",
          Category: "breakfast",
          Instructions: "Updated instructions"
        };

        // Mock no rows affected (meal not found)
        mockRequest.query.mockResolvedValue({ rowsAffected: [0] });

        const result = await mealsModel.updateMeal(999, updatedMeal);

        expect(result).toBeNull();
      });
    });

    describe("deleteMeal", () => {
      it("should delete a meal successfully", async () => {
        // Mock successful deletion
        mockRequest.query.mockResolvedValue({ rowsAffected: [1] });

        const result = await mealsModel.deleteMeal(1);

        expect(mockRequest.input).toHaveBeenCalledWith("MealID", sql.Int, 1);
        expect(mockRequest.query).toHaveBeenCalledWith("DELETE FROM Meals WHERE MealID = @MealID");
        expect(result).toBe(true);
      });

      it("should return false when meal not found for deletion", async () => {
        // Mock no rows affected (meal not found)
        mockRequest.query.mockResolvedValue({ rowsAffected: [0] });

        const result = await mealsModel.deleteMeal(999);

        expect(result).toBe(false);
      });
    });
  });

  describe("Spoonacular API Functions", () => {
    beforeEach(() => {
      // Set up environment variable for tests
      process.env.SPOONACULAR_API_KEY = "test-api-key";
    });

    afterEach(() => {
      delete process.env.SPOONACULAR_API_KEY;
    });

    describe("searchRecipes", () => {
      it("should search recipes with query and category", async () => {
        const mockApiResponse = {
          results: [
            {
              id: 123,
              title: "Test Recipe",
              image: "http://example.com/image.jpg",
              readyInMinutes: 30,
              servings: 4,
              summary: "A test recipe",
              sourceUrl: "http://example.com/recipe"
            }
          ],
          totalResults: 1
        };

        fetch.mockResolvedValue({
          json: () => Promise.resolve(mockApiResponse)
        });

        const options = {
          query: "chicken",
          category: "dinner",
          number: 6
        };

        const result = await mealsModel.searchRecipes(options);

        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining("complexSearch")
        );
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining("query=chicken")
        );
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining("type=main course")
        );
        expect(result.success).toBe(true);
        expect(result.recipes).toHaveLength(1);
        expect(result.recipes[0].title).toBe("Test Recipe");
      });

      it("should handle API errors", async () => {
        fetch.mockRejectedValue(new Error("API Error"));

        const options = { query: "chicken" };
        const result = await mealsModel.searchRecipes(options);

        expect(result.success).toBe(false);
        expect(result.error).toBe("API Error");
        expect(result.recipes).toEqual([]);
      });

      it("should handle different meal categories", async () => {
        const mockApiResponse = { results: [], totalResults: 0 };
        fetch.mockResolvedValue({
          json: () => Promise.resolve(mockApiResponse)
        });

        // Test breakfast category
        await mealsModel.searchRecipes({ category: "breakfast" });
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining("type=breakfast")
        );

        // Test snack category
        await mealsModel.searchRecipes({ category: "snack" });
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining("type=appetizer")
        );

        // Test dessert category
        await mealsModel.searchRecipes({ category: "dessert" });
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining("type=dessert")
        );
      });
    });

    describe("getRecipeDetails", () => {
      it("should fetch recipe details successfully", async () => {
        const mockRecipe = {
          id: 123,
          title: "Test Recipe",
          image: "http://example.com/image.jpg",
          readyInMinutes: 30,
          servings: 4,
          instructions: "Cook the recipe",
          extendedIngredients: [
            {
              name: "chicken",
              amount: 2,
              unit: "lbs",
              original: "2 lbs chicken"
            }
          ],
          sourceUrl: "http://example.com/recipe"
        };

        fetch.mockResolvedValue({
          json: () => Promise.resolve(mockRecipe)
        });

        const result = await mealsModel.getRecipeDetails(123);

        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining("/123/information")
        );
        expect(result.success).toBe(true);
        expect(result.recipe.title).toBe("Test Recipe");
        expect(result.recipe.ingredients).toHaveLength(1);
        expect(result.recipe.ingredients[0].name).toBe("chicken");
      });

      it("should handle recipes with analyzed instructions", async () => {
        const mockRecipe = {
          id: 123,
          title: "Test Recipe",
          analyzedInstructions: [
            {
              steps: [
                { step: "Step 1: Prepare ingredients" },
                { step: "Step 2: Cook the meal" }
              ]
            }
          ],
          extendedIngredients: []
        };

        fetch.mockResolvedValue({
          json: () => Promise.resolve(mockRecipe)
        });

        const result = await mealsModel.getRecipeDetails(123);

        expect(result.recipe.instructions).toContain("1. Step 1: Prepare ingredients");
        expect(result.recipe.instructions).toContain("2. Step 2: Cook the meal");
      });

      it("should handle API errors", async () => {
        fetch.mockRejectedValue(new Error("Recipe not found"));

        const result = await mealsModel.getRecipeDetails(999);

        expect(result.success).toBe(false);
        expect(result.error).toBe("Recipe not found");
        expect(result.recipe).toBeNull();
      });
    });

    describe("getRandomRecipes", () => {
      it("should fetch random recipes successfully", async () => {
        const mockApiResponse = {
          recipes: [
            {
              id: 123,
              title: "Random Recipe",
              image: "http://example.com/image.jpg",
              readyInMinutes: 25,
              servings: 2,
              summary: "A random recipe",
              sourceUrl: "http://example.com/recipe"
            }
          ]
        };

        fetch.mockResolvedValue({
          json: () => Promise.resolve(mockApiResponse)
        });

        const options = { number: 3, tags: "vegetarian" };
        const result = await mealsModel.getRandomRecipes(options);

        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining("/random")
        );
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining("number=3")
        );
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining("tags=vegetarian")
        );
        expect(result.success).toBe(true);
        expect(result.recipes).toHaveLength(1);
      });

      it("should handle API errors", async () => {
        fetch.mockRejectedValue(new Error("Random recipes error"));

        const result = await mealsModel.getRandomRecipes({});

        expect(result.success).toBe(false);
        expect(result.error).toBe("Random recipes error");
        expect(result.recipes).toEqual([]);
      });
    });
  });
});
