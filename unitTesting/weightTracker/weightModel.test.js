const WeightModel = require('../../models/weightModel');
const sql = require('mssql');

// Mock the dependencies
jest.mock('mssql');
jest.mock('../../dbConfig', () => ({ mockDbConfig: true }));

describe('WeightModel', () => {
  let mockPool, mockRequest;

  beforeEach(() => {
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
    test('should add weight entry successfully when no existing entry', async () => {
      // Mock no existing entry
      mockRequest.query
        .mockResolvedValueOnce({ recordset: [] }) // First query - check existing
        .mockResolvedValueOnce({ rowsAffected: [1] }); // Second query - insert

      const result = await WeightModel.addWeightEntry(
        1, // userId
        '2025-08-01',
        70.5,
        175,
        35,
        23.0
      );

      expect(mockRequest.input).toHaveBeenCalledWith('userId', sql.Int, 1);
      expect(mockRequest.input).toHaveBeenCalledWith('date', sql.Date, '2025-08-01');
      expect(mockRequest.input).toHaveBeenCalledWith('weight', sql.Float, 70.5);
      expect(mockRequest.input).toHaveBeenCalledWith('height', sql.Float, 175);
      expect(mockRequest.input).toHaveBeenCalledWith('age', sql.Int, 35);
      expect(mockRequest.input).toHaveBeenCalledWith('bmi', sql.Float, 23.0);

      expect(result).toEqual({
        success: true,
        message: 'Weight entry added successfully'
      });
    });

    test('should update existing weight entry', async () => {
      // Mock existing entry found
      mockRequest.query
        .mockResolvedValueOnce({ recordset: [{ id: 1 }] }) // First query - existing entry found
        .mockResolvedValueOnce({ rowsAffected: [1] }); // Second query - update

      const result = await WeightModel.addWeightEntry(
        1, // userId
        '2025-08-01',
        70.5,
        175,
        35,
        23.0
      );

      expect(result).toEqual({
        success: true,
        message: 'Weight entry updated successfully'
      });
    });

    test('should handle database connection failure', async () => {
      sql.connect.mockRejectedValue(new Error('Connection failed'));

      const result = await WeightModel.addWeightEntry(
        1,
        '2025-08-01',
        70.5,
        175,
        35,
        23.0
      );

      expect(result).toEqual({
        success: false,
        error: 'Connection failed'
      });
    });

    test('should handle database query errors', async () => {
      mockRequest.query.mockRejectedValue(new Error('Query failed'));

      const result = await WeightModel.addWeightEntry(
        1,
        '2025-08-01',
        70.5,
        175,
        35,
        23.0
      );

      expect(result).toEqual({
        success: false,
        error: 'Query failed'
      });
    });
  });

  describe('getWeightHistory', () => {
    test('should get weight history successfully', async () => {
      const mockHistory = [
        {
          id: 1,
          userId: 1,
          date: '2025-08-01',
          weight: 70.5,
          height: 175,
          age: 35,
          bmi: 23.0
        },
        {
          id: 2,
          userId: 1,
          date: '2025-07-31',
          weight: 71.0,
          height: 175,
          age: 35,
          bmi: 23.2
        }
      ];

      mockRequest.query.mockResolvedValue({
        recordset: mockHistory
      });

      const result = await WeightModel.getWeightHistory(1);

      expect(mockRequest.input).toHaveBeenCalledWith('userId', sql.Int, 1);
      expect(result).toEqual({
        success: true,
        history: mockHistory
      });
    });

    test('should return empty array when no history found', async () => {
      mockRequest.query.mockResolvedValue({
        recordset: []
      });

      const result = await WeightModel.getWeightHistory(1);

      expect(result).toEqual({
        success: true,
        history: []
      });
    });

    test('should handle database connection failure', async () => {
      sql.connect.mockRejectedValue(new Error('Connection failed'));

      const result = await WeightModel.getWeightHistory(1);

      expect(result).toEqual({
        success: false,
        error: 'Connection failed'
      });
    });

    test('should handle database query errors', async () => {
      mockRequest.query.mockRejectedValue(new Error('Query failed'));

      const result = await WeightModel.getWeightHistory(1);

      expect(result).toEqual({
        success: false,
        error: 'Query failed'
      });
    });
  });

  describe('getLatestEntry', () => {
    test('should get latest entry successfully', async () => {
      const mockEntry = {
        id: 1,
        userId: 1,
        date: '2025-08-01',
        weight: 70.5,
        height: 175,
        age: 35,
        bmi: 23.0
      };

      mockRequest.query.mockResolvedValue({
        recordset: [mockEntry]
      });

      const result = await WeightModel.getLatestEntry(1);

      expect(mockRequest.input).toHaveBeenCalledWith('userId', sql.Int, 1);
      expect(result).toEqual({
        success: true,
        entry: mockEntry
      });
    });

    test('should handle no entries found', async () => {
      mockRequest.query.mockResolvedValue({
        recordset: []
      });

      const result = await WeightModel.getLatestEntry(1);

      expect(result).toEqual({
        success: true,
        entry: null
      });
    });

    test('should handle database errors during latest entry retrieval', async () => {
      mockRequest.query.mockRejectedValue(new Error('Query failed'));

      const result = await WeightModel.getLatestEntry(1);

      expect(result).toEqual({
        success: false,
        error: 'Query failed'
      });
    });
  });
});
