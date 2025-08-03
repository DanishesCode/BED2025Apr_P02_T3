const AppointmentController = require('../../controllers/appointmentController');
const AppointmentModel = require('../../models/appointmentModel');
const emailService = require('../../services/appointmentEmailService');

// Mock the dependencies
jest.mock('../../models/appointmentModel');
jest.mock('../../services/appointmentEmailService');

describe('AppointmentController', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      user: {
        userId: 1,
        email: 'user@example.com',
        name: 'Test User'
      }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('create', () => {
    const validAppointmentData = {
      date: '2025-12-01',
      time: '14:30',
      consultationType: 'male-doctor',
      phoneNumber: '+1234567890'
    };

    test('should create appointment successfully with valid data', async () => {
      req.body = validAppointmentData;
      
      AppointmentModel.createAppointment.mockResolvedValue({
        success: true,
        appointment: {
          id: 1,
          date: '2025-12-01',
          time: '14:30',
          consultationType: 'M',
          phoneNumber: '+1234567890'
        }
      });

      emailService.sendAppointmentConfirmation.mockResolvedValue({
        success: true
      });

      await AppointmentController.create(req, res);

      expect(AppointmentModel.createAppointment).toHaveBeenCalledWith(
        1, // userId
        '2025-12-01',
        '14:30',
        'male-doctor',
        '+1234567890'
      );
      expect(emailService.sendAppointmentConfirmation).toHaveBeenCalledWith(
        'user@example.com',
        'Test User',
        expect.any(Object)
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Appointment created successfully',
        notificationSent: true
      }));
    });

    test('should return 400 for missing required fields', async () => {
      req.body = { date: '2025-12-01', time: '14:30' }; // Missing consultationType

      await AppointmentController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Date, time, and consultation type are required.',
        error: 'MISSING_REQUIRED_FIELDS'
      });
      expect(AppointmentModel.createAppointment).not.toHaveBeenCalled();
    });

    test('should return 400 for invalid phone number format', async () => {
      req.body = { ...validAppointmentData, phoneNumber: '123-456-7890' };

      await AppointmentController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Please provide a valid phone number with country code (e.g., +1234567890).',
        error: 'INVALID_PHONE_NUMBER'
      });
      expect(AppointmentModel.createAppointment).not.toHaveBeenCalled();
    });

    test('should return 400 for invalid date format', async () => {
      req.body = { ...validAppointmentData, date: 'invalid-date' };

      await AppointmentController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Please provide a valid date.',
        error: 'INVALID_DATE_FORMAT'
      });
      expect(AppointmentModel.createAppointment).not.toHaveBeenCalled();
    });

    test('should return 400 for past date', async () => {
      const pastDate = '2020-01-01';
      req.body = { ...validAppointmentData, date: pastDate, time: '09:00' };

      await AppointmentController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Appointment date and time must be in the future.',
        error: 'PAST_DATE_NOT_ALLOWED'
      });
      expect(AppointmentModel.createAppointment).not.toHaveBeenCalled();
    });

    test('should return 400 for invalid time format', async () => {
      req.body = { ...validAppointmentData, time: '25:70' };

      await AppointmentController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Please provide a valid time in HH:MM format.',
        error: 'INVALID_TIME_FORMAT'
      });
      expect(AppointmentModel.createAppointment).not.toHaveBeenCalled();
    });

    test('should return 400 for invalid consultation type', async () => {
      req.body = { ...validAppointmentData, consultationType: 'invalid-type' };

      await AppointmentController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Doctor preference must be either "male-doctor" or "female-doctor".',
        error: 'INVALID_CONSULTATION_TYPE'
      });
      expect(AppointmentModel.createAppointment).not.toHaveBeenCalled();
    });

    test('should accept female-doctor consultation type', async () => {
      req.body = { ...validAppointmentData, consultationType: 'female-doctor' };
      
      AppointmentModel.createAppointment.mockResolvedValue({
        success: true,
        appointment: { id: 1 }
      });

      emailService.sendAppointmentConfirmation.mockResolvedValue({
        success: true
      });

      await AppointmentController.create(req, res);

      expect(AppointmentModel.createAppointment).toHaveBeenCalledWith(
        1,
        '2025-12-01',
        '14:30',
        'female-doctor',
        '+1234567890'
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });

    test('should handle appointment creation failure', async () => {
      req.body = validAppointmentData;
      
      AppointmentModel.createAppointment.mockResolvedValue({
        success: false,
        error: 'Database error'
      });

      await AppointmentController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Database error',
        error: 'APPOINTMENT_CREATION_FAILED'
      });
    });

    test('should handle email sending failure gracefully', async () => {
      req.body = validAppointmentData;
      
      AppointmentModel.createAppointment.mockResolvedValue({
        success: true,
        appointment: { id: 1 }
      });

      emailService.sendAppointmentConfirmation.mockResolvedValue({
        success: false
      });

      await AppointmentController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        notificationSent: false,
        notification: 'Appointment created but email failed to send'
      }));
    });

    test('should work without phone number', async () => {
      const { phoneNumber, ...dataWithoutPhone } = validAppointmentData;
      req.body = dataWithoutPhone;
      
      AppointmentModel.createAppointment.mockResolvedValue({
        success: true,
        appointment: { id: 1 }
      });

      emailService.sendAppointmentConfirmation.mockResolvedValue({
        success: true
      });

      await AppointmentController.create(req, res);

      expect(AppointmentModel.createAppointment).toHaveBeenCalledWith(
        1,
        '2025-12-01',
        '14:30',
        'male-doctor',
        null
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });

    test('should handle exceptions during creation', async () => {
      req.body = validAppointmentData;
      
      AppointmentModel.createAppointment.mockRejectedValue(new Error('Database connection failed'));

      await AppointmentController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error. Please try again later.',
        error: 'INTERNAL_SERVER_ERROR'
      });
    });
  });

  describe('list', () => {
    test('should get all appointments for authenticated user', async () => {
      const mockAppointments = [
        { id: 1, date: '2025-12-01', time: '14:30' },
        { id: 2, date: '2025-12-02', time: '10:00' }
      ];

      AppointmentModel.listAppointments.mockResolvedValue({
        success: true,
        appointments: mockAppointments
      });

      await AppointmentController.list(req, res);

      expect(AppointmentModel.listAppointments).toHaveBeenCalledWith(1);
      expect(res.status).not.toHaveBeenCalled(); // 200 is default
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        appointments: mockAppointments,
        message: 'Appointments retrieved successfully'
      });
    });

    test('should handle appointment retrieval failure', async () => {
      AppointmentModel.listAppointments.mockResolvedValue({
        success: false,
        error: 'Database error'
      });

      await AppointmentController.list(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Database error',
        error: 'APPOINTMENTS_RETRIEVAL_FAILED'
      });
    });

    test('should handle exceptions during retrieval', async () => {
      AppointmentModel.listAppointments.mockRejectedValue(new Error('Database error'));

      await AppointmentController.list(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error. Please try again later.',
        error: 'INTERNAL_SERVER_ERROR'
      });
    });
  });
});
