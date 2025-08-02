const mealPlanModel = require("../../models/mealplanModel");
const sql = require("mssql");

// Mock the dependencies
jest.mock("mssql");
jest.mock("../../dbConfig");

describe("mealPlanModel", () => {
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

  describe("getAllMealPlans", () => {
    it("should fetch all meal plans for a specific user with meal details", async () => {
      const mockMealPlans = [
        {
          PlanID: 1,
          UserID: 1,
          MealID: 1,
          DayOfWeek: "Monday",
          MealTime: "breakfast",
          MealName: "Pancakes",
          Category: "breakfast",
          Instructions: "Make fluffy pancakes"
        },
        {
          PlanID: 2,
          UserID: 1,
          MealID: 2,
          DayOfWeek: "Monday",
          MealTime: "lunch",
          MealName: "Caesar Salad",
          Category: "lunch",
          Instructions: "Toss with dressing"
        }
      ];

      mockRequest.query.mockResolvedValue({ recordset: mockMealPlans });

      const result = await mealPlanModel.getAllMealPlans(1);

      expect(sql.connect).toHaveBeenCalledTimes(1);
      expect(mockRequest.input).toHaveBeenCalledWith("UserID", sql.Int, 1);
      expect(mockRequest.query).toHaveBeenCalledWith(
        expect.stringContaining("SELECT MealPlan.*, Meals.MealName, Meals.Category, Meals.Instructions")
      );
      expect(mockRequest.query).toHaveBeenCalledWith(
        expect.stringContaining("INNER JOIN Meals ON MealPlan.MealID = Meals.MealID")
      );
      expect(result).toEqual(mockMealPlans);
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it("should handle database errors", async () => {
      const error = new Error("Database connection failed");
      sql.connect.mockRejectedValue(error);

      await expect(mealPlanModel.getAllMealPlans(1)).rejects.toThrow("Database connection failed");
    });

    it("should close connection even if query fails", async () => {
      const error = new Error("Query failed");
      mockRequest.query.mockRejectedValue(error);

      await expect(mealPlanModel.getAllMealPlans(1)).rejects.toThrow("Query failed");
      expect(mockConnection.close).toHaveBeenCalled();
    });
  });

  describe("getMealPlanById", () => {
    it("should fetch a specific meal plan by ID", async () => {
      const mockMealPlan = {
        PlanID: 1,
        UserID: 1,
        MealID: 1,
        DayOfWeek: "Monday",
        MealTime: "breakfast"
      };

      mockRequest.query.mockResolvedValue({ recordset: [mockMealPlan] });

      const result = await mealPlanModel.getMealPlanById(1);

      expect(mockRequest.input).toHaveBeenCalledWith("PlanID", sql.Int, 1);
      expect(mockRequest.query).toHaveBeenCalledWith(
        expect.stringContaining("SELECT * FROM MealPlan WHERE PlanID = @PlanID")
      );
      expect(result).toEqual(mockMealPlan);
    });

    it("should return null when meal plan not found", async () => {
      mockRequest.query.mockResolvedValue({ recordset: [] });

      const result = await mealPlanModel.getMealPlanById(999);

      expect(result).toBeNull();
    });

    it("should handle database errors", async () => {
      const error = new Error("Database error");
      mockRequest.query.mockRejectedValue(error);

      await expect(mealPlanModel.getMealPlanById(1)).rejects.toThrow("Database error");
      expect(mockConnection.close).toHaveBeenCalled();
    });
  });

  describe("addMealPlan", () => {
    it("should add a new meal plan and return the created plan", async () => {
      const newPlan = {
        UserID: 1,
        MealID: 1,
        DayOfWeek: "Monday",
        MealTime: "breakfast"
      };

      const mockCreatedPlan = { PlanID: 1, ...newPlan };

      // Mock the INSERT query result
      mockRequest.query.mockResolvedValueOnce({ recordset: [{ PlanID: 1 }] });
      
      // Mock the getMealPlanById call
      mockRequest.query.mockResolvedValueOnce({ recordset: [mockCreatedPlan] });

      const result = await mealPlanModel.addMealPlan(newPlan);

      expect(mockRequest.input).toHaveBeenCalledWith("UserID", sql.Int, 1);
      expect(mockRequest.input).toHaveBeenCalledWith("MealID", sql.Int, 1);
      expect(mockRequest.input).toHaveBeenCalledWith("DayOfWeek", sql.NVarChar(10), "Monday");
      expect(mockRequest.input).toHaveBeenCalledWith("MealTime", sql.NVarChar(20), "breakfast");
      expect(mockRequest.query).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO MealPlan")
      );
      expect(result).toEqual(mockCreatedPlan);
    });

    it("should handle database errors during meal plan creation", async () => {
      const newPlan = {
        UserID: 1,
        MealID: 1,
        DayOfWeek: "Monday",
        MealTime: "breakfast"
      };

      const error = new Error("Insert failed");
      mockRequest.query.mockRejectedValue(error);

      await expect(mealPlanModel.addMealPlan(newPlan)).rejects.toThrow("Insert failed");
      expect(mockConnection.close).toHaveBeenCalled();
    });
  });

  describe("updateMealPlan", () => {
    it("should update a meal plan successfully", async () => {
      const updatedPlan = {
        MealID: 2,
        DayOfWeek: "Tuesday",
        MealTime: "lunch"
      };

      const mockUpdatedPlan = { PlanID: 1, UserID: 1, ...updatedPlan };

      // Mock successful update
      mockRequest.query.mockResolvedValueOnce({ rowsAffected: [1] });
      // Mock getMealPlanById call
      mockRequest.query.mockResolvedValueOnce({ recordset: [mockUpdatedPlan] });

      const result = await mealPlanModel.updateMealPlan(1, updatedPlan);

      expect(mockRequest.input).toHaveBeenCalledWith("PlanID", sql.Int, 1);
      expect(mockRequest.input).toHaveBeenCalledWith("MealID", sql.Int, 2);
      expect(mockRequest.input).toHaveBeenCalledWith("DayOfWeek", sql.NVarChar(10), "Tuesday");
      expect(mockRequest.input).toHaveBeenCalledWith("MealTime", sql.NVarChar(20), "lunch");
      expect(mockRequest.query).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE MealPlan")
      );
      expect(result).toEqual(mockUpdatedPlan);
    });

    it("should return null when meal plan not found for update", async () => {
      const updatedPlan = {
        MealID: 2,
        DayOfWeek: "Tuesday",
        MealTime: "lunch"
      };

      // Mock no rows affected (meal plan not found)
      mockRequest.query.mockResolvedValue({ rowsAffected: [0] });

      const result = await mealPlanModel.updateMealPlan(999, updatedPlan);

      expect(result).toBeNull();
    });

    it("should handle database errors during update", async () => {
      const updatedPlan = {
        MealID: 2,
        DayOfWeek: "Tuesday",
        MealTime: "lunch"
      };

      const error = new Error("Update failed");
      mockRequest.query.mockRejectedValue(error);

      await expect(mealPlanModel.updateMealPlan(1, updatedPlan)).rejects.toThrow("Update failed");
      expect(mockConnection.close).toHaveBeenCalled();
    });
  });

  describe("deleteMealPlan", () => {
    it("should delete a meal plan successfully", async () => {
      // Mock successful deletion
      mockRequest.query.mockResolvedValue({ rowsAffected: [1] });

      const result = await mealPlanModel.deleteMealPlan(1);

      expect(mockRequest.input).toHaveBeenCalledWith("PlanID", sql.Int, 1);
      expect(mockRequest.query).toHaveBeenCalledWith(
        expect.stringContaining("DELETE FROM MealPlan WHERE PlanID = @PlanID")
      );
      expect(result).toBe(true);
    });

    it("should return false when meal plan not found for deletion", async () => {
      // Mock no rows affected (meal plan not found)
      mockRequest.query.mockResolvedValue({ rowsAffected: [0] });

      const result = await mealPlanModel.deleteMealPlan(999);

      expect(result).toBe(false);
    });

    it("should handle database errors during deletion", async () => {
      const error = new Error("Delete failed");
      mockRequest.query.mockRejectedValue(error);

      await expect(mealPlanModel.deleteMealPlan(1)).rejects.toThrow("Delete failed");
      expect(mockConnection.close).toHaveBeenCalled();
    });
  });
});
