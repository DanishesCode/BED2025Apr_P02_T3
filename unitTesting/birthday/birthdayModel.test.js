const birthdayModel = require("../../models/birthdayModel");
const sql = require("mssql");

// Mock the dependencies
jest.mock("mssql");
jest.mock("../../dbConfig");

describe("birthdayModel", () => {
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

  describe("getAllBirthdays", () => {
    it("should fetch all birthdays for a specific user", async () => {
      const mockBirthdays = [
        {
          birthdayId: 1,
          userId: 1,
          firstName: "John",
          lastName: "Doe",
          birthDate: "1990-05-15",
          relationship: "Friend",
          notes: "Close friend from college",
          phone: "+1234567890"
        },
        {
          birthdayId: 2,
          userId: 1,
          firstName: "Jane",
          lastName: "Smith",
          birthDate: "1985-12-25",
          relationship: "Family",
          notes: "Sister",
          phone: "+0987654321"
        }
      ];

      mockRequest.query.mockResolvedValue({ recordset: mockBirthdays });

      const result = await birthdayModel.getAllBirthdays(1);

      expect(sql.connect).toHaveBeenCalledTimes(1);
      expect(mockRequest.input).toHaveBeenCalledWith("userId", sql.Int, 1);
      expect(mockRequest.query).toHaveBeenCalledWith(
        "SELECT * FROM Birthdays WHERE userId = @userId ORDER BY BirthDate"
      );
      expect(result).toEqual(mockBirthdays);
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it("should handle database errors", async () => {
      const error = new Error("Database connection failed");
      sql.connect.mockRejectedValue(error);

      await expect(birthdayModel.getAllBirthdays(1)).rejects.toThrow("Database connection failed");
    });

    it("should close connection even if query fails", async () => {
      const error = new Error("Query failed");
      mockRequest.query.mockRejectedValue(error);

      await expect(birthdayModel.getAllBirthdays(1)).rejects.toThrow("Query failed");
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it("should return empty array when no birthdays found", async () => {
      mockRequest.query.mockResolvedValue({ recordset: [] });

      const result = await birthdayModel.getAllBirthdays(1);

      expect(result).toEqual([]);
    });
  });

  describe("getBirthdayById", () => {
    it("should fetch a specific birthday by ID and userId", async () => {
      const mockBirthday = {
        birthdayId: 1,
        userId: 1,
        firstName: "John",
        lastName: "Doe",
        birthDate: "1990-05-15",
        relationship: "Friend",
        notes: "Close friend",
        phone: "+1234567890"
      };

      mockRequest.query.mockResolvedValue({ recordset: [mockBirthday] });

      const result = await birthdayModel.getBirthdayById(1, 1);

      expect(mockRequest.input).toHaveBeenCalledWith("BirthdayID", sql.Int, 1);
      expect(mockRequest.input).toHaveBeenCalledWith("userId", sql.Int, 1);
      expect(mockRequest.query).toHaveBeenCalledWith(
        "SELECT * FROM Birthdays WHERE BirthdayID = @BirthdayID AND userId = @userId"
      );
      expect(result).toEqual(mockBirthday);
    });

    it("should return undefined when birthday not found", async () => {
      mockRequest.query.mockResolvedValue({ recordset: [] });

      const result = await birthdayModel.getBirthdayById(999, 1);

      expect(result).toBeUndefined();
    });

    it("should handle database errors", async () => {
      const error = new Error("Database error");
      mockRequest.query.mockRejectedValue(error);

      await expect(birthdayModel.getBirthdayById(1, 1)).rejects.toThrow("Database error");
      expect(mockConnection.close).toHaveBeenCalled();
    });
  });

  describe("addBirthday", () => {
    it("should add a new birthday successfully", async () => {
      const newBirthday = {
        firstName: "Alice",
        lastName: "Johnson",
        birthDate: "1992-08-20",
        relationship: "Colleague",
        notes: "Work friend",
        phone: "+1122334455"
      };

      const mockResult = { rowsAffected: [1] };
      mockRequest.query.mockResolvedValue(mockResult);

      const result = await birthdayModel.addBirthday(newBirthday, 1);

      expect(mockRequest.input).toHaveBeenCalledWith("userId", sql.Int, 1);
      expect(mockRequest.input).toHaveBeenCalledWith("FirstName", sql.VarChar(50), "Alice");
      expect(mockRequest.input).toHaveBeenCalledWith("LastName", sql.VarChar(50), "Johnson");
      expect(mockRequest.input).toHaveBeenCalledWith("BirthDate", sql.Date, "1992-08-20");
      expect(mockRequest.input).toHaveBeenCalledWith("Relationship", sql.VarChar(50), "Colleague");
      expect(mockRequest.input).toHaveBeenCalledWith("Notes", sql.Text, "Work friend");
      expect(mockRequest.input).toHaveBeenCalledWith("Phone", sql.VarChar(20), "+1122334455");
      expect(mockRequest.query).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO Birthdays")
      );
      expect(result).toEqual(mockResult);
    });

    it("should handle optional fields as empty strings", async () => {
      const newBirthday = {
        firstName: "Bob",
        lastName: "Wilson",
        birthDate: "1988-03-10"
        // No relationship, notes, or phone
      };

      mockRequest.query.mockResolvedValue({ rowsAffected: [1] });

      await birthdayModel.addBirthday(newBirthday, 1);

      expect(mockRequest.input).toHaveBeenCalledWith("Relationship", sql.VarChar(50), "");
      expect(mockRequest.input).toHaveBeenCalledWith("Notes", sql.Text, "");
      expect(mockRequest.input).toHaveBeenCalledWith("Phone", sql.VarChar(20), "");
    });

    it("should handle database errors during insertion", async () => {
      const newBirthday = {
        firstName: "Test",
        lastName: "User",
        birthDate: "1990-01-01"
      };

      const error = new Error("Insert failed");
      mockRequest.query.mockRejectedValue(error);

      await expect(birthdayModel.addBirthday(newBirthday, 1)).rejects.toThrow("Insert failed");
      expect(mockConnection.close).toHaveBeenCalled();
    });
  });

  describe("updateBirthday", () => {
    it("should update a birthday successfully", async () => {
      const updatedBirthday = {
        firstName: "John",
        lastName: "Updated",
        birthDate: "1990-05-16",
        relationship: "Best Friend",
        notes: "Updated notes",
        phone: "+9999999999"
      };

      const mockResult = { rowsAffected: [1] };
      mockRequest.query.mockResolvedValue(mockResult);

      const result = await birthdayModel.updateBirthday(1, updatedBirthday, 1);

      expect(mockRequest.input).toHaveBeenCalledWith("BirthdayID", sql.Int, 1);
      expect(mockRequest.input).toHaveBeenCalledWith("userId", sql.Int, 1);
      expect(mockRequest.input).toHaveBeenCalledWith("FirstName", sql.VarChar(50), "John");
      expect(mockRequest.input).toHaveBeenCalledWith("LastName", sql.VarChar(50), "Updated");
      expect(mockRequest.input).toHaveBeenCalledWith("BirthDate", sql.Date, "1990-05-16");
      expect(mockRequest.input).toHaveBeenCalledWith("Relationship", sql.VarChar(50), "Best Friend");
      expect(mockRequest.input).toHaveBeenCalledWith("Notes", sql.Text, "Updated notes");
      expect(mockRequest.input).toHaveBeenCalledWith("Phone", sql.VarChar(20), "+9999999999");
      expect(mockRequest.query).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE Birthdays")
      );
      expect(result).toEqual(mockResult);
    });

    it("should handle optional fields during update", async () => {
      const updatedBirthday = {
        firstName: "John",
        lastName: "Doe",
        birthDate: "1990-05-15"
        // No relationship, notes, or phone
      };

      mockRequest.query.mockResolvedValue({ rowsAffected: [1] });

      await birthdayModel.updateBirthday(1, updatedBirthday, 1);

      expect(mockRequest.input).toHaveBeenCalledWith("Relationship", sql.VarChar(50), "");
      expect(mockRequest.input).toHaveBeenCalledWith("Notes", sql.Text, "");
      expect(mockRequest.input).toHaveBeenCalledWith("Phone", sql.VarChar(20), "");
    });

    it("should handle update failures", async () => {
      const updatedBirthday = {
        firstName: "Test",
        lastName: "User",
        birthDate: "1990-01-01"
      };

      const error = new Error("Update failed");
      mockRequest.query.mockRejectedValue(error);

      await expect(birthdayModel.updateBirthday(1, updatedBirthday, 1)).rejects.toThrow("Update failed");
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it("should return result indicating no rows affected when birthday not found", async () => {
      const updatedBirthday = {
        firstName: "John",
        lastName: "Doe",
        birthDate: "1990-05-15"
      };

      mockRequest.query.mockResolvedValue({ rowsAffected: [0] });

      const result = await birthdayModel.updateBirthday(999, updatedBirthday, 1);

      expect(result.rowsAffected[0]).toBe(0);
    });
  });

  describe("deleteBirthday", () => {
    it("should delete a birthday successfully", async () => {
      const mockResult = { rowsAffected: [1] };
      mockRequest.query.mockResolvedValue(mockResult);

      const result = await birthdayModel.deleteBirthday(1, 1);

      expect(mockRequest.input).toHaveBeenCalledWith("BirthdayID", sql.Int, 1);
      expect(mockRequest.input).toHaveBeenCalledWith("userId", sql.Int, 1);
      expect(mockRequest.query).toHaveBeenCalledWith(
        "DELETE FROM Birthdays WHERE BirthdayID = @BirthdayID AND userId = @userId"
      );
      expect(result).toEqual(mockResult);
    });

    it("should handle deletion when birthday not found", async () => {
      mockRequest.query.mockResolvedValue({ rowsAffected: [0] });

      const result = await birthdayModel.deleteBirthday(999, 1);

      expect(result.rowsAffected[0]).toBe(0);
    });

    it("should handle database errors during deletion", async () => {
      const error = new Error("Delete failed");
      mockRequest.query.mockRejectedValue(error);

      await expect(birthdayModel.deleteBirthday(1, 1)).rejects.toThrow("Delete failed");
      expect(mockConnection.close).toHaveBeenCalled();
    });
  });

  describe("getTodaysBirthdays", () => {
    it("should fetch birthdays for today", async () => {
      const mockTodaysBirthdays = [
        {
          birthdayId: 1,
          userId: 1,
          firstName: "John",
          lastName: "Doe",
          birthDate: "1990-05-15",
          relationship: "Friend"
        }
      ];

      mockRequest.query.mockResolvedValue({ recordset: mockTodaysBirthdays });

      const result = await birthdayModel.getTodaysBirthdays(1);

      expect(mockRequest.input).toHaveBeenCalledWith("userId", sql.Int, 1);
      expect(mockRequest.query).toHaveBeenCalledWith(
        expect.stringContaining("MONTH(BirthDate) = MONTH(GETDATE())")
      );
      expect(mockRequest.query).toHaveBeenCalledWith(
        expect.stringContaining("DAY(BirthDate) = DAY(GETDATE())")
      );
      expect(result).toEqual(mockTodaysBirthdays);
    });

    it("should return empty array when no birthdays today", async () => {
      mockRequest.query.mockResolvedValue({ recordset: [] });

      const result = await birthdayModel.getTodaysBirthdays(1);

      expect(result).toEqual([]);
    });

    it("should handle database errors", async () => {
      const error = new Error("Query failed");
      mockRequest.query.mockRejectedValue(error);

      await expect(birthdayModel.getTodaysBirthdays(1)).rejects.toThrow("Query failed");
      expect(mockConnection.close).toHaveBeenCalled();
    });
  });

  describe("getAllBirthdaysForReminder", () => {
    it("should fetch all birthdays with phone numbers for reminder system", async () => {
      const mockBirthdaysWithPhones = [
        {
          birthdayId: 1,
          userId: 1,
          firstName: "John",
          lastName: "Doe",
          birthDate: "1990-05-15",
          relationship: "Friend",
          notes: "Close friend",
          phone: "+1234567890"
        },
        {
          birthdayId: 2,
          userId: 2,
          firstName: "Jane",
          lastName: "Smith",
          birthDate: "1985-12-25",
          relationship: "Family",
          notes: "Sister",
          phone: "+0987654321"
        }
      ];

      mockRequest.query.mockResolvedValue({ recordset: mockBirthdaysWithPhones });

      const result = await birthdayModel.getAllBirthdaysForReminder();

      expect(mockRequest.query).toHaveBeenCalledWith(
        expect.stringContaining("WHERE phone IS NOT NULL AND phone != ''")
      );
      expect(mockRequest.query).toHaveBeenCalledWith(
        expect.stringContaining("ORDER BY firstName")
      );
      expect(result).toEqual(mockBirthdaysWithPhones);
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it("should return empty array when no birthdays have phone numbers", async () => {
      mockRequest.query.mockResolvedValue({ recordset: [] });

      const result = await birthdayModel.getAllBirthdaysForReminder();

      expect(result).toEqual([]);
    });

    it("should handle database errors", async () => {
      const error = new Error("Database connection failed");
      sql.connect.mockRejectedValue(error);

      await expect(birthdayModel.getAllBirthdaysForReminder()).rejects.toThrow("Database connection failed");
    });

    it("should close connection even if query fails", async () => {
      const error = new Error("Query failed");
      mockRequest.query.mockRejectedValue(error);

      await expect(birthdayModel.getAllBirthdaysForReminder()).rejects.toThrow("Query failed");
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it("should include all required fields in the query", async () => {
      mockRequest.query.mockResolvedValue({ recordset: [] });

      await birthdayModel.getAllBirthdaysForReminder();

      expect(mockRequest.query).toHaveBeenCalledWith(
        expect.stringContaining("birthdayId, userId, firstName, lastName, birthDate, relationship, notes, phone")
      );
    });
  });
});
