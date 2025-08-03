const sql = require('mssql');
const AppointmentModel = require('../../models/appointmentModel');

// Mock mssql
jest.mock('mssql');

// Mock dbConfig
jest.mock('../../dbConfig', () => ({ mockDbConfig: true }));

describe('AppointmentModel', () => {
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
    sql.Int = jest.fn();
    sql.VarChar = jest.fn((length) => ({ length }));
    sql.Date = jest.fn();

    jest.clearAllMocks();
  });

  describe('createAppointment', () => {
    it('should create appointment successfully', async () => {
      const mockResult = {
        recordset: [{ appointment_id: 1, googleMeetLink: 'https://meet.jit.si/test' }]
      };
      mockRequest.query.mockResolvedValue(mockResult);

      const result = await AppointmentModel.createAppointment(
        1,
        '2025-12-01',
        '14:30',
        'male-doctor',
        '+1234567890'
      );

      expect(result).toEqual({
        success: true,
        appointment: { appointment_id: 1, googleMeetLink: 'https://meet.jit.si/test' }
      });
    });

    it('should handle database connection error', async () => {
      sql.connect.mockRejectedValue(new Error('Connection failed'));

      const result = await AppointmentModel.createAppointment(
        1,
        '2025-12-01',
        '14:30',
        'male-doctor',
        '+1234567890'
      );

      expect(result).toEqual({
        success: false,
        error: 'Connection failed'
      });
    });

    it('should handle query error', async () => {
      mockRequest.query.mockRejectedValue(new Error('Query failed'));

      const result = await AppointmentModel.createAppointment(
        1,
        '2025-12-01',
        '14:30',
        'male-doctor',
        '+1234567890'
      );

      expect(result).toEqual({
        success: false,
        error: 'Query failed'
      });
    });

    it('should handle female-doctor consultation type', async () => {
      const mockResult = {
        recordset: [{ appointment_id: 2, googleMeetLink: 'https://meet.jit.si/test2' }]
      };
      mockRequest.query.mockResolvedValue(mockResult);

      const result = await AppointmentModel.createAppointment(
        1,
        '2025-12-01',
        '14:30',
        'female-doctor',
        '+1234567890'
      );

      expect(result).toEqual({
        success: true,
        appointment: { appointment_id: 2, googleMeetLink: 'https://meet.jit.si/test2' }
      });
    });
  });

  describe('listAppointments', () => {
    it('should list appointments for user successfully', async () => {
      const mockResult = {
        recordset: [
          {
            appointment_id: 1,
            appointment_date: '2025-12-01',
            appointment_time: '14:30',
            consultation_type: 'M',
            phone_number: '+1234567890'
          }
        ]
      };
      mockRequest.query.mockResolvedValue(mockResult);

      const result = await AppointmentModel.listAppointments(1);

      expect(result).toEqual({
        success: true,
        appointments: mockResult.recordset
      });
    });

    it('should handle database connection error', async () => {
      sql.connect.mockRejectedValue(new Error('Connection failed'));

      const result = await AppointmentModel.listAppointments(1);

      expect(result).toEqual({
        success: false,
        error: 'Connection failed'
      });
    });

    it('should handle query error', async () => {
      mockRequest.query.mockRejectedValue(new Error('Query failed'));

      const result = await AppointmentModel.listAppointments(1);

      expect(result).toEqual({
        success: false,
        error: 'Query failed'
      });
    });
  });

  describe('updateAppointment', () => {
    it('should update appointment successfully', async () => {
      const mockResult = {
        recordset: [{ appointment_id: 1, appointmentDate: '2025-12-02' }]
      };
      mockRequest.query.mockResolvedValue(mockResult);

      const result = await AppointmentModel.updateAppointment(
        1,
        1,
        '2025-12-02',
        '15:30',
        'female-doctor'
      );

      expect(result).toEqual({
        success: true,
        appointment: { appointment_id: 1, appointmentDate: '2025-12-02' }
      });
    });

    it('should handle appointment not found', async () => {
      const mockResult = {
        recordset: []
      };
      mockRequest.query.mockResolvedValue(mockResult);

      const result = await AppointmentModel.updateAppointment(
        999,
        1,
        '2025-12-02',
        '15:30',
        'female-doctor'
      );

      expect(result).toEqual({
        success: true,
        appointment: undefined
      });
    });

    it('should handle database connection error', async () => {
      sql.connect.mockRejectedValue(new Error('Connection failed'));

      const result = await AppointmentModel.updateAppointment(
        1,
        1,
        '2025-12-02',
        '15:30',
        'female-doctor'
      );

      expect(result).toEqual({
        success: false,
        error: 'Connection failed'
      });
    });

    it('should handle query error', async () => {
      mockRequest.query.mockRejectedValue(new Error('Query failed'));

      const result = await AppointmentModel.updateAppointment(
        1,
        1,
        '2025-12-02',
        '15:30',
        'female-doctor'
      );

      expect(result).toEqual({
        success: false,
        error: 'Query failed'
      });
    });
  });

  describe('deleteAppointment', () => {
    it('should delete appointment successfully', async () => {
      const mockResult = {};
      mockRequest.query.mockResolvedValue(mockResult);

      const result = await AppointmentModel.deleteAppointment(1, 1);

      expect(result).toEqual({
        success: true
      });
    });

    it('should handle appointment not found - still returns success', async () => {
      const mockResult = {};
      mockRequest.query.mockResolvedValue(mockResult);

      const result = await AppointmentModel.deleteAppointment(999, 1);

      expect(result).toEqual({
        success: true
      });
    });

    it('should handle database connection error', async () => {
      sql.connect.mockRejectedValue(new Error('Connection failed'));

      const result = await AppointmentModel.deleteAppointment(1, 1);

      expect(result).toEqual({
        success: false,
        error: 'Connection failed'
      });
    });

    it('should handle query error', async () => {
      mockRequest.query.mockRejectedValue(new Error('Query failed'));

      const result = await AppointmentModel.deleteAppointment(1, 1);

      expect(result).toEqual({
        success: false,
        error: 'Query failed'
      });
    });
  });
});