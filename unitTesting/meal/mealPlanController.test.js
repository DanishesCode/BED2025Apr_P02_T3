const mealPlanController = require("../../controllers/mealplanController");
const mealPlanModel = require("../../models/mealplanModel");

// Mock the mealPlanModel
jest.mock("../../models/mealplanModel");

describe("mealPlanController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAllMealPlans", () => {
    it("should fetch all meal plans for a user and return JSON response", async () => {
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

      mealPlanModel.getAllMealPlans.mockResolvedValue(mockMealPlans);

      const req = { params: { userId: "1" } };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await mealPlanController.getAllMealPlans(req, res);

      expect(mealPlanModel.getAllMealPlans).toHaveBeenCalledTimes(1);
      expect(mealPlanModel.getAllMealPlans).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith(mockMealPlans);
    });

    it("should return 400 for invalid userId", async () => {
      const req = { params: { userId: "invalid" } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await mealPlanController.getAllMealPlans(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid userId' });
      expect(mealPlanModel.getAllMealPlans).not.toHaveBeenCalled();
    });

    it("should handle database errors and return 500 status", async () => {
      const errorMessage = "Database connection failed";
      mealPlanModel.getAllMealPlans.mockRejectedValue(new Error(errorMessage));

      const req = { params: { userId: "1" } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await mealPlanController.getAllMealPlans(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Server error while retrieving meal plans' });
    });
  });

  describe("getMealPlanById", () => {
    it("should fetch a specific meal plan and return JSON response", async () => {
      const mockMealPlan = {
        PlanID: 1,
        UserID: 1,
        MealID: 1,
        DayOfWeek: "Monday",
        MealTime: "breakfast"
      };

      mealPlanModel.getMealPlanById.mockResolvedValue(mockMealPlan);

      const req = { params: { planId: "1" } };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await mealPlanController.getMealPlanById(req, res);

      expect(mealPlanModel.getMealPlanById).toHaveBeenCalledTimes(1);
      expect(mealPlanModel.getMealPlanById).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith(mockMealPlan);
    });

    it("should return 404 when meal plan not found", async () => {
      mealPlanModel.getMealPlanById.mockResolvedValue(null);

      const req = { params: { planId: "999" } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await mealPlanController.getMealPlanById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Meal plan not found' });
    });

    it("should return 400 for invalid planId", async () => {
      const req = { params: { planId: "invalid" } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await mealPlanController.getMealPlanById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid planId' });
      expect(mealPlanModel.getMealPlanById).not.toHaveBeenCalled();
    });
  });

  describe("addMealPlan", () => {
    it("should add a new meal plan successfully", async () => {
      const mockPlanData = {
        UserID: 1,
        MealID: 1,
        DayOfWeek: "Monday",
        MealTime: "breakfast"
      };

      const mockCreatedPlan = {
        PlanID: 1,
        ...mockPlanData
      };

      mealPlanModel.addMealPlan.mockResolvedValue(mockCreatedPlan);

      const req = { body: mockPlanData };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await mealPlanController.addMealPlan(req, res);

      expect(mealPlanModel.addMealPlan).toHaveBeenCalledWith(mockPlanData);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Meal plan added successfully',
        plan: mockCreatedPlan
      });
    });

    it("should return 400 for missing required fields", async () => {
      const req = { body: { UserID: 1, MealID: 1 } }; // Missing DayOfWeek and MealTime
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await mealPlanController.addMealPlan(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Missing required fields' });
      expect(mealPlanModel.addMealPlan).not.toHaveBeenCalled();
    });

    it("should handle database errors", async () => {
      const mockPlanData = {
        UserID: 1,
        MealID: 1,
        DayOfWeek: "Monday",
        MealTime: "breakfast"
      };

      mealPlanModel.addMealPlan.mockRejectedValue(new Error("Database error"));

      const req = { body: mockPlanData };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await mealPlanController.addMealPlan(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Server error while adding meal plan' });
    });
  });

  describe("updateMealPlan", () => {
    it("should update a meal plan successfully", async () => {
      const mockUpdatedPlan = {
        PlanID: 1,
        UserID: 1,
        MealID: 2,
        DayOfWeek: "Tuesday",
        MealTime: "lunch"
      };

      mealPlanModel.updateMealPlan.mockResolvedValue(mockUpdatedPlan);

      const req = {
        params: { planId: "1" },
        body: {
          MealID: 2,
          DayOfWeek: "Tuesday",
          MealTime: "lunch"
        }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await mealPlanController.updateMealPlan(req, res);

      expect(mealPlanModel.updateMealPlan).toHaveBeenCalledWith(1, {
        MealID: 2,
        DayOfWeek: "Tuesday",
        MealTime: "lunch"
      });
      expect(res.json).toHaveBeenCalledWith({
        message: 'Meal plan updated successfully',
        plan: mockUpdatedPlan
      });
    });

    it("should return 404 when meal plan not found for update", async () => {
      mealPlanModel.updateMealPlan.mockResolvedValue(null);

      const req = {
        params: { planId: "999" },
        body: {
          MealID: 2,
          DayOfWeek: "Tuesday",
          MealTime: "lunch"
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await mealPlanController.updateMealPlan(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Meal plan not found' });
    });

    it("should return 400 for missing required fields", async () => {
      const req = {
        params: { planId: "1" },
        body: { MealID: 2 } // Missing DayOfWeek and MealTime
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await mealPlanController.updateMealPlan(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Missing required fields' });
      expect(mealPlanModel.updateMealPlan).not.toHaveBeenCalled();
    });

    it("should return 400 for invalid planId", async () => {
      const req = {
        params: { planId: "invalid" },
        body: {
          MealID: 2,
          DayOfWeek: "Tuesday",
          MealTime: "lunch"
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await mealPlanController.updateMealPlan(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid planId' });
      expect(mealPlanModel.updateMealPlan).not.toHaveBeenCalled();
    });
  });

  describe("deleteMealPlan", () => {
    it("should delete a meal plan successfully", async () => {
      mealPlanModel.deleteMealPlan.mockResolvedValue(true);

      const req = { params: { planId: "1" } };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };

      await mealPlanController.deleteMealPlan(req, res);

      expect(mealPlanModel.deleteMealPlan).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith({ message: 'Meal plan deleted successfully' });
    });

    it("should return 404 when meal plan not found for deletion", async () => {
      mealPlanModel.deleteMealPlan.mockResolvedValue(false);

      const req = { params: { planId: "999" } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await mealPlanController.deleteMealPlan(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Meal plan not found' });
    });

    it("should return 400 for invalid planId", async () => {
      const req = { params: { planId: "invalid" } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await mealPlanController.deleteMealPlan(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid planId' });
      expect(mealPlanModel.deleteMealPlan).not.toHaveBeenCalled();
    });
  });
});
