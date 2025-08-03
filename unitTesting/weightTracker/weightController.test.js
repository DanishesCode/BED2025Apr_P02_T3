const WeightController = require('../../controllers/weightController');
const WeightModel = require('../../models/weightModel');
const sql = require('mssql');

// Mock the dependencies
jest.mock('../../models/weightModel');
jest.mock('mssql');
jest.mock('../../dbConfig', () => ({ mockDbConfig: true }));

describe('WeightController', () => {
  let req, res, mockPool, mockRequest;

  beforeEach(() => {
    req = {
      body: {},
      user: {
        userId: 1
      }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    // Mock SQL pool and request
    mockRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn()
    };
    mockPool = {
      request: jest.fn().mockReturnValue(mockRequest)
    };
    sql.connect.mockResolvedValue(mockPool);

    jest.clearAllMocks();
  });

  describe('addWeightEntry', () => {
    const validWeightData = {
      weight: 70.5,
      height: 175,
      bmi: 23.0,
      date: '2025-08-01'
    };

    const mockUserRecord = {
      recordset: [{
        date_of_birth: '1990-01-01'
      }]
    };

    beforeEach(() => {
      mockRequest.query.mockResolvedValue(mockUserRecord);
    });

    test('should add weight entry successfully with valid data', async () => {
      req.body = validWeightData;
      
      WeightModel.addWeightEntry.mockResolvedValue({
        success: true,
        message: 'Weight entry saved successfully'
      });

      await WeightController.addWeightEntry(req, res);

      expect(sql.connect).toHaveBeenCalled();
      expect(mockRequest.input).toHaveBeenCalledWith('userId', sql.Int, 1);
      expect(mockRequest.query).toHaveBeenCalledWith('SELECT date_of_birth FROM Users WHERE userId = @userId');
      expect(WeightModel.addWeightEntry).toHaveBeenCalledWith(
        1, // userId
        '2025-08-01',
        70.5,
        175,
        35, // calculated age
        23.0
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Weight entry saved successfully',
        data: { age: 35 }
      });
    });

    test('should return 400 for missing required fields', async () => {
      req.body = { weight: 70.5, height: 175 }; // Missing bmi and date

      await WeightController.addWeightEntry(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'All fields (weight, height, bmi, date) are required.',
        error: 'MISSING_REQUIRED_FIELDS'
      });
      expect(WeightModel.addWeightEntry).not.toHaveBeenCalled();
    });

    test('should return 404 when user not found', async () => {
      req.body = validWeightData;
      mockRequest.query.mockResolvedValue({ recordset: [] });

      await WeightController.addWeightEntry(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found.',
        error: 'USER_NOT_FOUND'
      });
      expect(WeightModel.addWeightEntry).not.toHaveBeenCalled();
    });

    test('should return 400 for invalid weight (too low)', async () => {
      req.body = { weight: -1, height: 175, bmi: 23.0, date: '2025-08-01' };
      
      // Make sure the user lookup succeeds so we reach the validation
      mockRequest.query.mockResolvedValue(mockUserRecord);

      await WeightController.addWeightEntry(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Weight must be a valid positive number between 1 and 1000 kg.',
        error: 'INVALID_WEIGHT'
      });
      expect(WeightModel.addWeightEntry).not.toHaveBeenCalled();
    });

    test('should return 400 for invalid weight (too high)', async () => {
      req.body = { ...validWeightData, weight: 1001 };

      await WeightController.addWeightEntry(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Weight must be a valid positive number between 1 and 1000 kg.',
        error: 'INVALID_WEIGHT'
      });
      expect(WeightModel.addWeightEntry).not.toHaveBeenCalled();
    });

    test('should return 400 for invalid weight (not a number)', async () => {
      req.body = { ...validWeightData, weight: 'abc' };

      await WeightController.addWeightEntry(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Weight must be a valid positive number between 1 and 1000 kg.',
        error: 'INVALID_WEIGHT'
      });
      expect(WeightModel.addWeightEntry).not.toHaveBeenCalled();
    });

    test('should return 400 for invalid height (too low)', async () => {
      req.body = { weight: 70.5, height: -1, bmi: 23.0, date: '2025-08-01' };
      
      // Make sure the user lookup succeeds so we reach the validation
      mockRequest.query.mockResolvedValue(mockUserRecord);

      await WeightController.addWeightEntry(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Height must be a valid positive number between 1 and 300 cm.',
        error: 'INVALID_HEIGHT'
      });
      expect(WeightModel.addWeightEntry).not.toHaveBeenCalled();
    });

    test('should return 400 for invalid height (too high)', async () => {
      req.body = { ...validWeightData, height: 301 };

      await WeightController.addWeightEntry(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Height must be a valid positive number between 1 and 300 cm.',
        error: 'INVALID_HEIGHT'
      });
      expect(WeightModel.addWeightEntry).not.toHaveBeenCalled();
    });

    test('should return 400 for invalid BMI (too low)', async () => {
      req.body = { weight: 70.5, height: 175, bmi: -1, date: '2025-08-01' };
      
      // Make sure the user lookup succeeds so we reach the validation
      mockRequest.query.mockResolvedValue(mockUserRecord);

      await WeightController.addWeightEntry(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'BMI must be a valid positive number between 1 and 100.',
        error: 'INVALID_BMI'
      });
      expect(WeightModel.addWeightEntry).not.toHaveBeenCalled();
    });

    test('should return 400 for invalid BMI (too high)', async () => {
      req.body = { ...validWeightData, bmi: 101 };

      await WeightController.addWeightEntry(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'BMI must be a valid positive number between 1 and 100.',
        error: 'INVALID_BMI'
      });
      expect(WeightModel.addWeightEntry).not.toHaveBeenCalled();
    });

    test('should return 400 for invalid date format', async () => {
      req.body = { ...validWeightData, date: 'invalid-date' };

      await WeightController.addWeightEntry(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Please provide a valid date.',
        error: 'INVALID_DATE_FORMAT'
      });
      expect(WeightModel.addWeightEntry).not.toHaveBeenCalled();
    });

    test('should return 400 for future date', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      req.body = { ...validWeightData, date: futureDate.toISOString().split('T')[0] };

      await WeightController.addWeightEntry(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Date cannot be in the future.',
        error: 'FUTURE_DATE_NOT_ALLOWED'
      });
      expect(WeightModel.addWeightEntry).not.toHaveBeenCalled();
    });

    test('should calculate age correctly for users born on leap year', async () => {
      req.body = validWeightData;
      
      // Mock user born on Feb 29, 1992 (leap year)
      const leapYearUser = {
        recordset: [{
          date_of_birth: '1992-02-29'
        }]
      };
      mockRequest.query.mockResolvedValue(leapYearUser);
      
      WeightModel.addWeightEntry.mockResolvedValue({
        success: true,
        message: 'Weight entry saved successfully'
      });

      await WeightController.addWeightEntry(req, res);

      expect(WeightModel.addWeightEntry).toHaveBeenCalledWith(
        1,
        '2025-08-01',
        70.5,
        175,
        33, // Age should be calculated correctly
        23.0
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });

    test('should handle model failure', async () => {
      req.body = validWeightData;
      
      WeightModel.addWeightEntry.mockResolvedValue({
        success: false,
        error: 'Database error'
      });

      await WeightController.addWeightEntry(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Database error',
        error: 'WEIGHT_ENTRY_FAILED'
      });
    });

    test('should handle database connection errors', async () => {
      req.body = validWeightData;
      
      sql.connect.mockRejectedValue(new Error('Database connection failed'));

      await WeightController.addWeightEntry(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error. Please try again later.',
        error: 'INTERNAL_SERVER_ERROR'
      });
    });

    test('should handle exceptions during weight entry creation', async () => {
      req.body = validWeightData;
      
      WeightModel.addWeightEntry.mockRejectedValue(new Error('Unexpected error'));

      await WeightController.addWeightEntry(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error. Please try again later.',
        error: 'INTERNAL_SERVER_ERROR'
      });
    });
  });

  describe('getWeightHistory', () => {
    test('should get weight history successfully', async () => {
      const mockHistory = [
        { id: 1, weight: 70.5, height: 175, bmi: 23.0, date: '2025-08-01' },
        { id: 2, weight: 71.0, height: 175, bmi: 23.2, date: '2025-08-02' }
      ];

      WeightModel.getWeightHistory.mockResolvedValue({
        success: true,
        history: mockHistory
      });

      await WeightController.getWeightHistory(req, res);

      expect(WeightModel.getWeightHistory).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        history: mockHistory,
        message: 'Weight history retrieved successfully'
      });
    });

    test('should handle weight history retrieval failure', async () => {
      WeightModel.getWeightHistory.mockResolvedValue({
        success: false,
        error: 'Database error'
      });

      await WeightController.getWeightHistory(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Database error',
        error: 'HISTORY_RETRIEVAL_FAILED'
      });
    });

    test('should handle exceptions during weight history retrieval', async () => {
      WeightModel.getWeightHistory.mockRejectedValue(new Error('Database error'));

      await WeightController.getWeightHistory(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error. Please try again later.',
        error: 'INTERNAL_SERVER_ERROR'
      });
    });
  });
});
