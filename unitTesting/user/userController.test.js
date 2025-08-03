const UserController = require('../../controllers/userController');
const UserModel = require('../../models/userModel');
const jwt = require('jsonwebtoken');

// Mock the UserModel
jest.mock('../../models/userModel');
jest.mock('jsonwebtoken');

describe('UserController', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      user: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('signup', () => {
    const validSignupData = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      dob: '1990-01-01'
    };

    test('should create user successfully with valid data', async () => {
      req.body = validSignupData;
      
      UserModel.createUser.mockResolvedValue({
        success: true,
        user: {
          userId: 1,
          name: 'John Doe',
          email: 'john@example.com'
        }
      });

      await UserController.signup(req, res);

      expect(UserModel.createUser).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        dob: '1990-01-01'
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'User created successfully',
        user: {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com'
        }
      });
    });

    test('should return 400 for missing required fields', async () => {
      req.body = { name: 'John Doe', email: 'john@example.com' }; // Missing password and dob

      await UserController.signup(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'All fields (name, email, password, dob) are required.',
        error: 'MISSING_REQUIRED_FIELDS'
      });
      expect(UserModel.createUser).not.toHaveBeenCalled();
    });

    test('should return 400 for invalid email format', async () => {
      req.body = { ...validSignupData, email: 'invalid-email' };

      await UserController.signup(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Please provide a valid email address.',
        error: 'INVALID_EMAIL_FORMAT'
      });
      expect(UserModel.createUser).not.toHaveBeenCalled();
    });

    test('should return 400 for weak password', async () => {
      req.body = { ...validSignupData, password: '123' };

      await UserController.signup(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Password must be at least 6 characters long.',
        error: 'WEAK_PASSWORD'
      });
      expect(UserModel.createUser).not.toHaveBeenCalled();
    });

    test('should return 400 for invalid date format', async () => {
      req.body = { ...validSignupData, dob: 'invalid-date' };

      await UserController.signup(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Please provide a valid date of birth.',
        error: 'INVALID_DATE_FORMAT'
      });
      expect(UserModel.createUser).not.toHaveBeenCalled();
    });

    test('should return 409 for duplicate email', async () => {
      req.body = validSignupData;
      
      UserModel.createUser.mockResolvedValue({
        success: false,
        message: 'duplicate email error'
      });

      await UserController.signup(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'An account with this email already exists.',
        error: 'EMAIL_ALREADY_EXISTS'
      });
    });

    test('should handle database errors gracefully', async () => {
      req.body = validSignupData;
      
      const dbError = new Error('Database connection failed');
      dbError.code = 'ER_DUP_ENTRY';
      UserModel.createUser.mockRejectedValue(dbError);

      await UserController.signup(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'An account with this email already exists.',
        error: 'EMAIL_ALREADY_EXISTS'
      });
    });

    test('should handle general errors with 500 status', async () => {
      req.body = validSignupData;
      
      UserModel.createUser.mockRejectedValue(new Error('Unexpected error'));

      await UserController.signup(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error. Please try again later.',
        error: 'INTERNAL_SERVER_ERROR'
      });
    });
  });

  describe('login', () => {
    const validLoginData = {
      email: 'john@example.com',
      password: 'password123'
    };

    beforeEach(() => {
      process.env.JWT_SECRET = 'test-secret';
    });

    test('should login successfully with valid credentials', async () => {
      req.body = validLoginData;
      
      UserModel.validateUser.mockResolvedValue({
        success: true,
        user: {
          userId: 1,
          email: 'john@example.com',
          name: 'John Doe'
        }
      });

      jwt.sign.mockReturnValue('mock-jwt-token');

      await UserController.login(req, res);

      expect(UserModel.validateUser).toHaveBeenCalledWith('john@example.com', 'password123');
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: 1, email: 'john@example.com' },
        'test-secret',
        { expiresIn: '24h' }
      );
      expect(res.cookie).toHaveBeenCalledWith('token', 'mock-jwt-token', expect.any(Object));
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Login successful',
        user: {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com'
        },
        token: 'mock-jwt-token'
      });
    });

    test('should return 400 for missing credentials', async () => {
      req.body = { email: 'john@example.com' }; // Missing password

      await UserController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Email and password are required.',
        error: 'MISSING_CREDENTIALS'
      });
      expect(UserModel.validateUser).not.toHaveBeenCalled();
    });

    test('should return 400 for invalid email format', async () => {
      req.body = { email: 'invalid-email', password: 'password123' };

      await UserController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Please provide a valid email address.',
        error: 'INVALID_EMAIL_FORMAT'
      });
      expect(UserModel.validateUser).not.toHaveBeenCalled();
    });

    test('should return 401 for invalid credentials', async () => {
      req.body = validLoginData;
      
      UserModel.validateUser.mockResolvedValue({
        success: false,
        message: 'Invalid credentials'
      });

      await UserController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid email or password. Please check your credentials.',
        error: 'INVALID_CREDENTIALS'
      });
      expect(jwt.sign).not.toHaveBeenCalled();
    });

    test('should handle login errors gracefully', async () => {
      req.body = validLoginData;
      
      UserModel.validateUser.mockRejectedValue(new Error('Database error'));

      await UserController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error. Please try again later.',
        error: 'INTERNAL_SERVER_ERROR'
      });
    });
  });
});
