const groceryModel = require("../../models/groceryModel");
const sql = require("mssql");

// Mock the dependencies
jest.mock("mssql");
jest.mock("../../dbConfig");

describe("groceryModel", () => {
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

  describe("getAllGroceryItems", () => {
    it("should fetch all grocery items for a specific user", async () => {
      const mockGroceryItems = [
        {
          item_id: 1,
          item_name: "Milk",
          quantity: 2.0,
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
          quantity: 1.0,
          unit: "loaf",
          bought: true,
          user_id: 1,
          date_added: "2024-01-15",
          price: 2.25,
          notes: "Whole wheat"
        }
      ];

      mockRequest.query.mockResolvedValue({ recordset: mockGroceryItems });

      const result = await groceryModel.getAllGroceryItems(1);

      expect(sql.connect).toHaveBeenCalledTimes(1);
      expect(mockRequest.input).toHaveBeenCalledWith("UserID", sql.Int, 1);
      expect(mockRequest.query).toHaveBeenCalledWith(
        "SELECT * FROM GroceryItems WHERE user_id = @UserID ORDER BY date_added DESC"
      );
      expect(result).toEqual(mockGroceryItems);
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it("should handle database errors", async () => {
      const error = new Error("Database connection failed");
      sql.connect.mockRejectedValue(error);

      await expect(groceryModel.getAllGroceryItems(1)).rejects.toThrow("Database connection failed");
    });

    it("should close connection even if query fails", async () => {
      const error = new Error("Query failed");
      mockRequest.query.mockRejectedValue(error);

      await expect(groceryModel.getAllGroceryItems(1)).rejects.toThrow("Query failed");
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it("should return empty array when no grocery items found", async () => {
      mockRequest.query.mockResolvedValue({ recordset: [] });

      const result = await groceryModel.getAllGroceryItems(1);

      expect(result).toEqual([]);
    });
  });

  describe("getGroceryItemById", () => {
    it("should fetch a specific grocery item by ID", async () => {
      const mockGroceryItem = {
        item_id: 1,
        item_name: "Milk",
        quantity: 2.0,
        unit: "liters",
        bought: false,
        user_id: 1,
        date_added: "2024-01-15",
        price: 3.50,
        notes: "Whole milk"
      };

      mockRequest.query.mockResolvedValue({ recordset: [mockGroceryItem] });

      const result = await groceryModel.getGroceryItemById(1);

      expect(mockRequest.input).toHaveBeenCalledWith("item_id", sql.Int, 1);
      expect(mockRequest.query).toHaveBeenCalledWith(
        "SELECT * FROM GroceryItems WHERE item_id = @item_id"
      );
      expect(result).toEqual(mockGroceryItem);
    });

    it("should return undefined when grocery item not found", async () => {
      mockRequest.query.mockResolvedValue({ recordset: [] });

      const result = await groceryModel.getGroceryItemById(999);

      expect(result).toBeUndefined();
    });

    it("should handle database errors", async () => {
      const error = new Error("Database error");
      mockRequest.query.mockRejectedValue(error);

      await expect(groceryModel.getGroceryItemById(1)).rejects.toThrow("Database error");
      expect(mockConnection.close).toHaveBeenCalled();
    });
  });

  describe("addGroceryItem", () => {
    it("should add a new grocery item with all fields", async () => {
      const newItem = {
        item_name: "Apples",
        quantity: 6,
        unit: "pieces",
        bought: false,
        user_id: 1,
        date_added: new Date("2024-01-15"),
        price: 4.50,
        notes: "Red apples"
      };

      const mockResult = { rowsAffected: [1] };
      mockRequest.query.mockResolvedValue(mockResult);

      const result = await groceryModel.addGroceryItem(newItem);

      expect(mockRequest.input).toHaveBeenCalledWith("item_name", sql.VarChar, "Apples");
      expect(mockRequest.input).toHaveBeenCalledWith("quantity", sql.Decimal(10, 2), 6);
      expect(mockRequest.input).toHaveBeenCalledWith("unit", sql.VarChar, "pieces");
      expect(mockRequest.input).toHaveBeenCalledWith("bought", sql.Bit, false);
      expect(mockRequest.input).toHaveBeenCalledWith("user_id", sql.Int, 1);
      expect(mockRequest.input).toHaveBeenCalledWith("date_added", sql.Date, newItem.date_added);
      expect(mockRequest.input).toHaveBeenCalledWith("price", sql.Decimal(10, 2), 4.50);
      expect(mockRequest.input).toHaveBeenCalledWith("notes", sql.VarChar, "Red apples");
      expect(mockRequest.query).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO GroceryItems")
      );
      expect(result).toEqual(mockResult);
    });

    it("should handle optional fields with default values", async () => {
      const newItem = {
        item_name: "Basic Item",
        quantity: 1,
        user_id: 1
        // Missing unit, bought, date_added, price, notes
      };

      mockRequest.query.mockResolvedValue({ rowsAffected: [1] });

      await groceryModel.addGroceryItem(newItem);

      expect(mockRequest.input).toHaveBeenCalledWith("unit", sql.VarChar, "pcs");
      expect(mockRequest.input).toHaveBeenCalledWith("bought", sql.Bit, 0);
      expect(mockRequest.input).toHaveBeenCalledWith("date_added", sql.Date, expect.any(Date));
      expect(mockRequest.input).toHaveBeenCalledWith("price", sql.Decimal(10, 2), 0.00);
      expect(mockRequest.input).toHaveBeenCalledWith("notes", sql.VarChar, "");
    });

    it("should handle bought field when explicitly set to true", async () => {
      const newItem = {
        item_name: "Already Bought Item",
        quantity: 1,
        bought: true,
        user_id: 1
      };

      mockRequest.query.mockResolvedValue({ rowsAffected: [1] });

      await groceryModel.addGroceryItem(newItem);

      expect(mockRequest.input).toHaveBeenCalledWith("bought", sql.Bit, true);
    });

    it("should handle price field when set to 0", async () => {
      const newItem = {
        item_name: "Free Item",
        quantity: 1,
        price: 0,
        user_id: 1
      };

      mockRequest.query.mockResolvedValue({ rowsAffected: [1] });

      await groceryModel.addGroceryItem(newItem);

      expect(mockRequest.input).toHaveBeenCalledWith("price", sql.Decimal(10, 2), 0);
    });

    it("should handle database errors during insertion", async () => {
      const newItem = {
        item_name: "Test Item",
        quantity: 1,
        user_id: 1
      };

      const error = new Error("Insert failed");
      mockRequest.query.mockRejectedValue(error);

      await expect(groceryModel.addGroceryItem(newItem)).rejects.toThrow("Insert failed");
      expect(mockConnection.close).toHaveBeenCalled();
    });
  });

  describe("updateGroceryItem", () => {
    it("should update a grocery item successfully", async () => {
      const updatedItem = {
        item_name: "Organic Milk",
        quantity: 1.5,
        unit: "liters",
        bought: true,
        price: 5.00,
        notes: "Organic whole milk"
      };

      const mockResult = { rowsAffected: [1] };
      mockRequest.query.mockResolvedValue(mockResult);

      const result = await groceryModel.updateGroceryItem(1, updatedItem);

      expect(mockRequest.input).toHaveBeenCalledWith("item_id", sql.Int, 1);
      expect(mockRequest.input).toHaveBeenCalledWith("item_name", sql.VarChar, "Organic Milk");
      expect(mockRequest.input).toHaveBeenCalledWith("quantity", sql.Decimal(10, 2), 1.5);
      expect(mockRequest.input).toHaveBeenCalledWith("unit", sql.VarChar, "liters");
      expect(mockRequest.input).toHaveBeenCalledWith("bought", sql.Bit, true);
      expect(mockRequest.input).toHaveBeenCalledWith("price", sql.Decimal(10, 2), 5.00);
      expect(mockRequest.input).toHaveBeenCalledWith("notes", sql.VarChar, "Organic whole milk");
      expect(mockRequest.query).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE GroceryItems")
      );
      expect(result).toEqual(mockResult);
    });

    it("should handle optional fields during update with defaults", async () => {
      const updatedItem = {
        item_name: "Updated Item",
        quantity: 2,
        bought: false
        // Missing unit, price, notes
      };

      mockRequest.query.mockResolvedValue({ rowsAffected: [1] });

      await groceryModel.updateGroceryItem(1, updatedItem);

      expect(mockRequest.input).toHaveBeenCalledWith("unit", sql.VarChar, "pcs");
      expect(mockRequest.input).toHaveBeenCalledWith("price", sql.Decimal(10, 2), 0.00);
      expect(mockRequest.input).toHaveBeenCalledWith("notes", sql.VarChar, "");
    });

    it("should handle price field when explicitly set to 0", async () => {
      const updatedItem = {
        item_name: "Free Item",
        quantity: 1,
        bought: false,
        price: 0
      };

      mockRequest.query.mockResolvedValue({ rowsAffected: [1] });

      await groceryModel.updateGroceryItem(1, updatedItem);

      expect(mockRequest.input).toHaveBeenCalledWith("price", sql.Decimal(10, 2), 0);
    });

    it("should handle update failures", async () => {
      const updatedItem = {
        item_name: "Test Item",
        quantity: 1,
        bought: false
      };

      const error = new Error("Update failed");
      mockRequest.query.mockRejectedValue(error);

      await expect(groceryModel.updateGroceryItem(1, updatedItem)).rejects.toThrow("Update failed");
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it("should return result indicating no rows affected when item not found", async () => {
      const updatedItem = {
        item_name: "Non-existent Item",
        quantity: 1,
        bought: false
      };

      mockRequest.query.mockResolvedValue({ rowsAffected: [0] });

      const result = await groceryModel.updateGroceryItem(999, updatedItem);

      expect(result.rowsAffected[0]).toBe(0);
    });
  });

  describe("deleteGroceryItem", () => {
    it("should delete a grocery item successfully", async () => {
      const mockResult = { rowsAffected: [1] };
      mockRequest.query.mockResolvedValue(mockResult);

      const result = await groceryModel.deleteGroceryItem(1);

      expect(mockRequest.input).toHaveBeenCalledWith("ItemID", sql.Int, 1);
      expect(mockRequest.query).toHaveBeenCalledWith(
        "DELETE FROM GroceryItems WHERE item_id = @ItemID"
      );
      expect(result).toEqual(mockResult);
    });

    it("should handle deletion when item not found", async () => {
      mockRequest.query.mockResolvedValue({ rowsAffected: [0] });

      const result = await groceryModel.deleteGroceryItem(999);

      expect(result.rowsAffected[0]).toBe(0);
    });

    it("should handle database errors during deletion", async () => {
      const error = new Error("Delete failed");
      mockRequest.query.mockRejectedValue(error);

      await expect(groceryModel.deleteGroceryItem(1)).rejects.toThrow("Delete failed");
      expect(mockConnection.close).toHaveBeenCalled();
    });
  });

  describe("Database Connection Management", () => {
    it("should close connection when successful operation completes", async () => {
      mockRequest.query.mockResolvedValue({ recordset: [] });

      await groceryModel.getAllGroceryItems(1);

      expect(mockConnection.close).toHaveBeenCalled();
    });

    it("should close connection even when operation fails", async () => {
      const error = new Error("Operation failed");
      mockRequest.query.mockRejectedValue(error);

      await expect(groceryModel.getAllGroceryItems(1)).rejects.toThrow();
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it("should handle connection close errors gracefully", async () => {
      const closeError = new Error("Close failed");
      mockConnection.close.mockRejectedValue(closeError);
      mockRequest.query.mockResolvedValue({ recordset: [] });

      // Should not throw even if close fails
      await expect(groceryModel.getAllGroceryItems(1)).resolves.toEqual([]);
    });

    it("should handle null connection gracefully", async () => {
      sql.connect.mockResolvedValue(null);

      // Should handle null connection without throwing
      await expect(groceryModel.getAllGroceryItems(1)).rejects.toThrow();
    });
  });

  describe("Data Type Handling", () => {
    it("should handle decimal quantities correctly", async () => {
      const newItem = {
        item_name: "Milk",
        quantity: 2.5,
        user_id: 1
      };

      mockRequest.query.mockResolvedValue({ rowsAffected: [1] });

      await groceryModel.addGroceryItem(newItem);

      expect(mockRequest.input).toHaveBeenCalledWith("quantity", sql.Decimal(10, 2), 2.5);
    });

    it("should handle decimal prices correctly", async () => {
      const newItem = {
        item_name: "Expensive Item",
        quantity: 1,
        price: 99.99,
        user_id: 1
      };

      mockRequest.query.mockResolvedValue({ rowsAffected: [1] });

      await groceryModel.addGroceryItem(newItem);

      expect(mockRequest.input).toHaveBeenCalledWith("price", sql.Decimal(10, 2), 99.99);
    });

    it("should handle boolean bought field correctly", async () => {
      const newItem1 = {
        item_name: "Item 1",
        quantity: 1,
        bought: true,
        user_id: 1
      };

      const newItem2 = {
        item_name: "Item 2",
        quantity: 1,
        bought: false,
        user_id: 1
      };

      mockRequest.query.mockResolvedValue({ rowsAffected: [1] });

      await groceryModel.addGroceryItem(newItem1);
      expect(mockRequest.input).toHaveBeenCalledWith("bought", sql.Bit, true);

      await groceryModel.addGroceryItem(newItem2);
      expect(mockRequest.input).toHaveBeenCalledWith("bought", sql.Bit, false);
    });

    it("should handle Date objects correctly", async () => {
      const testDate = new Date("2024-01-15T10:30:00Z");
      const newItem = {
        item_name: "Dated Item",
        quantity: 1,
        date_added: testDate,
        user_id: 1
      };

      mockRequest.query.mockResolvedValue({ rowsAffected: [1] });

      await groceryModel.addGroceryItem(newItem);

      expect(mockRequest.input).toHaveBeenCalledWith("date_added", sql.Date, testDate);
    });
  });
});
