const birthdayController = require("../../controllers/birthdayController");
const birthdayModel = require("../../models/birthdayModel");
const userModel = require("../../models/userModel");
const twilio = require("twilio");

// Mock the dependencies
jest.mock("../../models/birthdayModel");
jest.mock("../../models/userModel");
jest.mock("twilio");

describe("birthdayController", () => {
  let mockTwilioClient;
  let mockResponse;
  let mockRequest;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock Twilio client
    mockTwilioClient = {
      messages: {
        create: jest.fn()
      }
    };
    twilio.mockReturnValue(mockTwilioClient);

    // Mock response object
    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    };

    // Mock request object with user info
    mockRequest = {
      user: { userId: 1, email: "test@example.com" },
      params: {},
      body: {}
    };

    // Set up environment variables
    process.env.TWILIO_SID = "test_sid";
    process.env.TWILIO_TOKEN = "test_token";
    process.env.TWILIO_PHONE = "+1234567890";
  });

  afterEach(() => {
    delete process.env.TWILIO_SID;
    delete process.env.TWILIO_TOKEN;
    delete process.env.TWILIO_PHONE;
  });

  describe("getAllBirthdays", () => {
    it("should fetch all birthdays for a user and return JSON response", async () => {
      const mockBirthdays = [
        {
          birthdayId: 1,
          userId: 1,
          firstName: "John",
          lastName: "Doe",
          birthDate: "1990-05-15",
          relationship: "Friend",
          phone: "+1234567890"
        },
        {
          birthdayId: 2,
          userId: 1,
          firstName: "Jane",
          lastName: "Smith",
          birthDate: "1985-12-25",
          relationship: "Family",
          phone: "+0987654321"
        }
      ];

      birthdayModel.getAllBirthdays.mockResolvedValue(mockBirthdays);

      await birthdayController.getAllBirthdays(mockRequest, mockResponse);

      expect(birthdayModel.getAllBirthdays).toHaveBeenCalledTimes(1);
      expect(birthdayModel.getAllBirthdays).toHaveBeenCalledWith(1);
      expect(mockResponse.json).toHaveBeenCalledWith(mockBirthdays);
    });

    it("should handle missing userId by looking up user by email", async () => {
      const mockUser = { userId: 2 };
      const mockBirthdays = [];

      mockRequest.user = { email: "test@example.com" }; // No userId
      userModel.findUserByEmail.mockResolvedValue(mockUser);
      birthdayModel.getAllBirthdays.mockResolvedValue(mockBirthdays);

      await birthdayController.getAllBirthdays(mockRequest, mockResponse);

      expect(userModel.findUserByEmail).toHaveBeenCalledWith("test@example.com");
      expect(birthdayModel.getAllBirthdays).toHaveBeenCalledWith(2);
      expect(mockResponse.json).toHaveBeenCalledWith(mockBirthdays);
    });

    it("should return 401 when user ID not found", async () => {
      mockRequest.user = { email: "test@example.com" }; // No userId
      userModel.findUserByEmail.mockResolvedValue(null);

      await birthdayController.getAllBirthdays(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'User ID not found' });
    });

    it("should handle database errors and return 500 status", async () => {
      birthdayModel.getAllBirthdays.mockRejectedValue(new Error("Database error"));

      await birthdayController.getAllBirthdays(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Server error' });
    });
  });

  describe("getBirthdayById", () => {
    it("should fetch a specific birthday and return JSON response", async () => {
      const mockBirthday = {
        birthdayId: 1,
        userId: 1,
        firstName: "John",
        lastName: "Doe",
        birthDate: "1990-05-15",
        relationship: "Friend"
      };

      mockRequest.params = { id: "1" };
      birthdayModel.getBirthdayById.mockResolvedValue(mockBirthday);

      await birthdayController.getBirthdayById(mockRequest, mockResponse);

      expect(birthdayModel.getBirthdayById).toHaveBeenCalledWith(1, 1);
      expect(mockResponse.json).toHaveBeenCalledWith(mockBirthday);
    });

    it("should return 404 when birthday not found", async () => {
      mockRequest.params = { id: "999" };
      birthdayModel.getBirthdayById.mockResolvedValue(null);

      await birthdayController.getBirthdayById(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Not found' });
    });

    it("should handle invalid ID parameter", async () => {
      mockRequest.params = { id: "invalid" };
      birthdayModel.getBirthdayById.mockResolvedValue(null);

      await birthdayController.getBirthdayById(mockRequest, mockResponse);

      expect(birthdayModel.getBirthdayById).toHaveBeenCalledWith(NaN, 1);
    });
  });

  describe("addBirthday", () => {
    it("should add a new birthday successfully", async () => {
      const mockBirthdayData = {
        firstName: "Alice",
        lastName: "Johnson",
        birthDate: "1992-08-20",
        relationship: "Colleague",
        phone: "+1122334455"
      };

      mockRequest.body = mockBirthdayData;
      birthdayModel.addBirthday.mockResolvedValue({ success: true });

      await birthdayController.addBirthday(mockRequest, mockResponse);

      expect(birthdayModel.addBirthday).toHaveBeenCalledWith(mockBirthdayData, 1);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.send).toHaveBeenCalledWith('Birthday added');
    });

    it("should handle database errors during birthday creation", async () => {
      const mockBirthdayData = {
        firstName: "Alice",
        lastName: "Johnson",
        birthDate: "1992-08-20"
      };

      mockRequest.body = mockBirthdayData;
      birthdayModel.addBirthday.mockRejectedValue(new Error("Database error"));

      await birthdayController.addBirthday(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Server error' });
    });

    it("should handle missing userId by looking up user by email", async () => {
      const mockUser = { userId: 3 };
      const mockBirthdayData = {
        firstName: "Bob",
        lastName: "Wilson",
        birthDate: "1988-03-10"
      };

      mockRequest.user = { email: "test@example.com" }; // No userId
      mockRequest.body = mockBirthdayData;
      userModel.findUserByEmail.mockResolvedValue(mockUser);
      birthdayModel.addBirthday.mockResolvedValue({ success: true });

      await birthdayController.addBirthday(mockRequest, mockResponse);

      expect(userModel.findUserByEmail).toHaveBeenCalledWith("test@example.com");
      expect(birthdayModel.addBirthday).toHaveBeenCalledWith(mockBirthdayData, 3);
    });
  });

  describe("updateBirthday", () => {
    it("should update a birthday successfully", async () => {
      const mockUpdateData = {
        firstName: "John",
        lastName: "Updated",
        birthDate: "1990-05-16",
        relationship: "Best Friend"
      };

      mockRequest.params = { id: "1" };
      mockRequest.body = mockUpdateData;
      birthdayModel.updateBirthday.mockResolvedValue({ success: true });

      await birthdayController.updateBirthday(mockRequest, mockResponse);

      expect(birthdayModel.updateBirthday).toHaveBeenCalledWith(1, mockUpdateData, 1);
      expect(mockResponse.send).toHaveBeenCalledWith('Birthday updated');
    });

    it("should handle database errors during update", async () => {
      mockRequest.params = { id: "1" };
      mockRequest.body = { firstName: "Test" };
      birthdayModel.updateBirthday.mockRejectedValue(new Error("Update failed"));

      await birthdayController.updateBirthday(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Server error' });
    });
  });

  describe("deleteBirthday", () => {
    it("should delete a birthday successfully", async () => {
      mockRequest.params = { id: "1" };
      birthdayModel.deleteBirthday.mockResolvedValue({ success: true });

      await birthdayController.deleteBirthday(mockRequest, mockResponse);

      expect(birthdayModel.deleteBirthday).toHaveBeenCalledWith(1, 1);
      expect(mockResponse.send).toHaveBeenCalledWith('Birthday deleted');
    });

    it("should handle database errors during deletion", async () => {
      mockRequest.params = { id: "1" };
      birthdayModel.deleteBirthday.mockRejectedValue(new Error("Delete failed"));

      await birthdayController.deleteBirthday(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Server error' });
    });
  });

  describe("getBirthdaysForDashboard", () => {
    it("should return today's and upcoming birthdays for dashboard", async () => {
      const today = new Date(); // July 31, 2025
      // Create a birthday for today - July 31st, but in a past year
      // Format: YYYY-MM-DD (ensuring we get July 31st)
      const todayMonth = String(today.getMonth() + 1).padStart(2, '0'); // 07
      const todayDay = String(today.getDate()).padStart(2, '0'); // 31
      const todayBirthdayStr = `1990-${todayMonth}-${todayDay}`; // "1990-07-31"
      const futureBirthdayStr = `1985-08-15`; // August 15, 1985

      const mockBirthdays = [
        {
          birthdayId: 1,
          firstName: "John",
          lastName: "Doe",
          birthDate: todayBirthdayStr,
          relationship: "Friend"
        },
        {
          birthdayId: 2,
          firstName: "Jane",
          lastName: "Smith",
          birthDate: futureBirthdayStr,
          relationship: "Family"
        }
      ];

      birthdayModel.getAllBirthdays.mockResolvedValue(mockBirthdays);

      await birthdayController.getBirthdaysForDashboard(mockRequest, mockResponse);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          today: expect.arrayContaining([
            expect.objectContaining({
              name: "John Doe",
              initials: "JD"
            })
          ]),
          upcoming: expect.any(Array)
        })
      );
    });

    it("should calculate ages correctly for today's birthdays", async () => {
      const today = new Date(); // July 31, 2025
      const birthYear = today.getFullYear() - 25; // 25 years old - so 2000
      // Create birthday for today's date (July 31st) but in the birth year
      const todayMonth = String(today.getMonth() + 1).padStart(2, '0'); // 07
      const todayDay = String(today.getDate()).padStart(2, '0'); // 31
      const todayBirthdayStr = `${birthYear}-${todayMonth}-${todayDay}`; // "2000-07-31"

      const mockBirthdays = [
        {
          birthdayId: 1,
          firstName: "John",
          lastName: "Doe",
          birthDate: todayBirthdayStr,
          relationship: "Friend"
        }
      ];

      birthdayModel.getAllBirthdays.mockResolvedValue(mockBirthdays);

      await birthdayController.getBirthdaysForDashboard(mockRequest, mockResponse);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          today: expect.arrayContaining([
            expect.objectContaining({
              age: 25
            })
          ])
        })
      );
    });

    it("should handle empty birthdays list", async () => {
      birthdayModel.getAllBirthdays.mockResolvedValue([]);

      await birthdayController.getBirthdaysForDashboard(mockRequest, mockResponse);

      expect(mockResponse.json).toHaveBeenCalledWith({
        today: [],
        upcoming: []
      });
    });
  });

  describe("checkAndSendAutomaticBirthdayWishes", () => {
    beforeEach(() => {
      // Mock console methods to reduce test output
      jest.spyOn(console, 'log').mockImplementation();
      jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
      console.log.mockRestore();
      console.error.mockRestore();
    });

    it("should send birthday wishes to people with birthdays today", async () => {
      const today = new Date(); // July 31, 2025
      const birthYear = today.getFullYear() - 30; // 30 years old - so 1995
      // Create birthday for today's date
      const todayMonth = String(today.getMonth() + 1).padStart(2, '0'); // 07
      const todayDay = String(today.getDate()).padStart(2, '0'); // 31
      const todayBirthdayStr = `${birthYear}-${todayMonth}-${todayDay}`; // "1995-07-31"

      const mockBirthdays = [
        {
          birthdayId: 1,
          firstName: "John",
          lastName: "Doe",
          birthDate: todayBirthdayStr,
          phone: "+1234567890"
        }
      ];

      birthdayModel.getAllBirthdaysForReminder.mockResolvedValue(mockBirthdays);
      mockTwilioClient.messages.create.mockResolvedValue({ sid: "test_message_sid" });

      await birthdayController.checkAndSendAutomaticBirthdayWishes();

      expect(birthdayModel.getAllBirthdaysForReminder).toHaveBeenCalledTimes(1);
      expect(mockTwilioClient.messages.create).toHaveBeenCalledWith({
        body: expect.stringContaining("🎉 Happy 30th Birthday, John! 🎂"),
        from: "+1234567890",
        to: "+1234567890"
      });
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("✅ Birthday wish sent to John")
      );
    });

    it("should not send wishes to people without phone numbers", async () => {
      const today = new Date(); // July 31, 2025
      const birthYear = today.getFullYear() - 35; // 35 years old - so 1990
      const todayBirthday = new Date(birthYear, today.getMonth(), today.getDate()); // July 31, 1990

      const mockBirthdays = [
        {
          birthdayId: 1,
          firstName: "John",
          lastName: "Doe",
          birthDate: todayBirthday.toISOString().split('T')[0],
          phone: null // No phone number
        }
      ];

      birthdayModel.getAllBirthdaysForReminder.mockResolvedValue(mockBirthdays);

      await birthdayController.checkAndSendAutomaticBirthdayWishes();

      expect(mockTwilioClient.messages.create).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(
        "📅 No birthdays today or no phone numbers available"
      );
    });

    it("should not send wishes for birthdays on different days", async () => {
      const today = new Date();
      // Create a birthday for tomorrow
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      
      const tomorrowMonth = String(tomorrow.getMonth() + 1).padStart(2, '0');
      const tomorrowDay = String(tomorrow.getDate()).padStart(2, '0');
      const birthYear = tomorrow.getFullYear() - 25; // 25 years old
      const differentDayBirthdayString = `${birthYear}-${tomorrowMonth}-${tomorrowDay}`;

      const mockBirthdays = [
        {
          birthdayId: 1,
          firstName: "John",
          lastName: "Doe",
          birthDate: differentDayBirthdayString,
          phone: "+1234567890"
        }
      ];

      birthdayModel.getAllBirthdaysForReminder.mockResolvedValue(mockBirthdays);

      await birthdayController.checkAndSendAutomaticBirthdayWishes();

      expect(mockTwilioClient.messages.create).not.toHaveBeenCalled();
    });

    it("should handle SMS sending errors gracefully", async () => {
      const today = new Date();
      const todayMonth = String(today.getMonth() + 1).padStart(2, '0');
      const todayDay = String(today.getDate()).padStart(2, '0');
      const birthYear = today.getFullYear() - 28; // 28 years old
      
      const todayBirthdayString = `${birthYear}-${todayMonth}-${todayDay}`;

      const mockBirthdays = [
        {
          birthdayId: 1,
          firstName: "John",
          lastName: "Doe",
          birthDate: todayBirthdayString,
          phone: "+1234567890"
        }
      ];

      birthdayModel.getAllBirthdaysForReminder.mockResolvedValue(mockBirthdays);
      mockTwilioClient.messages.create.mockRejectedValue(new Error("SMS failed"));

      await birthdayController.checkAndSendAutomaticBirthdayWishes();

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("❌ Failed to send birthday wish to John"),
        expect.any(String)
      );
    });

    it("should calculate correct age including leap years", async () => {
      const today = new Date();
      const birthYear = today.getFullYear() - 25;
      
      // Test case where birthday hasn't occurred this year yet
      const futureMonth = String((today.getMonth() + 2) % 12 + 1).padStart(2, '0'); // Next month
      const futureDay = String(today.getDate()).padStart(2, '0');
      const futureBirthdayString = `${birthYear}-${futureMonth}-${futureDay}`;
      
      const mockBirthdays = [
        {
          birthdayId: 1,
          firstName: "John",
          lastName: "Doe",
          birthDate: futureBirthdayString,
          phone: "+1234567890"
        }
      ];

      birthdayModel.getAllBirthdaysForReminder.mockResolvedValue(mockBirthdays);

      await birthdayController.checkAndSendAutomaticBirthdayWishes();

      // Should not send message since birthday is in the future
      expect(mockTwilioClient.messages.create).not.toHaveBeenCalled();
    });

    it("should handle database errors gracefully", async () => {
      birthdayModel.getAllBirthdaysForReminder.mockRejectedValue(new Error("Database error"));

      await birthdayController.checkAndSendAutomaticBirthdayWishes();

      expect(console.error).toHaveBeenCalledWith(
        "❌ Error in automatic birthday reminder system:",
        expect.any(Error)
      );
    });

    it("should format ordinal numbers correctly in birthday messages", async () => {
      const today = new Date();
      const todayMonth = String(today.getMonth() + 1).padStart(2, '0');
      const todayDay = String(today.getDate()).padStart(2, '0');
      
      const testCases = [
        { age: 21, expected: "21st" },
        { age: 22, expected: "22nd" },
        { age: 23, expected: "23rd" },
        { age: 24, expected: "24th" },
        { age: 31, expected: "31st" }
      ];

      for (const testCase of testCases) {
        const birthYear = today.getFullYear() - testCase.age;
        const todayBirthdayString = `${birthYear}-${todayMonth}-${todayDay}`;

        const mockBirthdays = [
          {
            birthdayId: 1,
            firstName: "John",
            lastName: "Doe",
            birthDate: todayBirthdayString,
            phone: "+1234567890"
          }
        ];

        birthdayModel.getAllBirthdaysForReminder.mockResolvedValue(mockBirthdays);
        mockTwilioClient.messages.create.mockResolvedValue({ sid: "test_sid" });

        await birthdayController.checkAndSendAutomaticBirthdayWishes();

        expect(mockTwilioClient.messages.create).toHaveBeenCalledWith({
          body: expect.stringContaining(`🎉 Happy ${testCase.expected} Birthday`),
          from: "+1234567890",
          to: "+1234567890"
        });

        jest.clearAllMocks();
      }
    });
  });
});
