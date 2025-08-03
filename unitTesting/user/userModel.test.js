const UserModel = require('../../models/userModel');
const sql = require('mssql');
const bcrypt = require('bcrypt');

// Mock dependencies
jest.mock('mssql');
jest.mock('bcrypt');
jest.mock('../../dbConfig', () => ({ mockDbConfig: true }));

describe('UserModel', () => {
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

  describe('createUser', () => {
    const userData = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      dob: '1990-01-01'
    };

    test('should create user successfully', async () => {
      bcrypt.hash.mockResolvedValue('hashedPassword123');
      mockRequest.query.mockResolvedValue({
        recordset: [{ userId: 1, name: 'John Doe', email: 'john@example.com' }]
      });

      const result = await UserModel.createUser(userData);

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(mockRequest.input).toHaveBeenCalledWith('name', sql.NVarChar(100), 'John Doe');
      expect(mockRequest.input).toHaveBeenCalledWith('email', sql.NVarChar(100), 'john@example.com');
      expect(mockRequest.input).toHaveBeenCalledWith('password', sql.NVarChar(255), 'hashedPassword123');
      expect(mockRequest.input).toHaveBeenCalledWith('date_of_birth', sql.Date, '1990-01-01');
      
      expect(result).toEqual({
        success: true,
        user: {
          userId: 1,
          name: 'John Doe',
          email: 'john@example.com'
        }
      });
    });

    test('should handle duplicate email error', async () => {
      bcrypt.hash.mockResolvedValue('hashedPassword123');
      const duplicateError = new Error('Duplicate entry');
      duplicateError.number = 2627; // SQL Server duplicate key error
      mockRequest.query.mockRejectedValue(duplicateError);

      const result = await UserModel.createUser(userData);

      expect(result).toEqual({
        success: false,
        message: 'Email already exists'
      });
    });

    test('should handle password hashing failure', async () => {
      bcrypt.hash.mockRejectedValue(new Error('Hashing failed'));

      await expect(UserModel.createUser(userData)).rejects.toThrow('Hashing failed');
    });

    test('should handle database connection failure', async () => {
      sql.connect.mockRejectedValue(new Error('Connection failed'));

      await expect(UserModel.createUser(userData)).rejects.toThrow('Connection failed');
    });

    test('should handle general database errors', async () => {
      bcrypt.hash.mockResolvedValue('hashedPassword123');
      mockRequest.query.mockRejectedValue(new Error('Database error'));

      await expect(UserModel.createUser(userData)).rejects.toThrow('Database error');
    });
  });

  describe('findUserByEmail', () => {
    test('should find user by email', async () => {
      const mockUser = {
        userId: 1,
        name: 'John Doe',
        email: 'john@example.com',
        password: 'hashedPassword123',
        date_of_birth: '1990-01-01'
      };

      mockRequest.query.mockResolvedValue({
        recordset: [mockUser]
      });

      const result = await UserModel.findUserByEmail('john@example.com');

      expect(mockRequest.input).toHaveBeenCalledWith('email', sql.NVarChar(100), 'john@example.com');
      expect(result).toEqual(mockUser);
    });

    test('should return null when user not found', async () => {
      mockRequest.query.mockResolvedValue({
        recordset: []
      });

      const result = await UserModel.findUserByEmail('notfound@example.com');

      expect(result).toBeNull();
    });

    test('should handle database errors', async () => {
      mockRequest.query.mockRejectedValue(new Error('Database error'));

      await expect(UserModel.findUserByEmail('john@example.com')).rejects.toThrow('Database error');
    });
  });

  describe('validateUser', () => {
    const email = 'john@example.com';
    const password = 'password123';

    test('should validate user successfully with correct credentials', async () => {
      const mockUser = {
        userId: 1,
        name: 'John Doe',
        email: 'john@example.com',
        password: 'hashedPassword123'
      };

      // Mock findUserByEmail
      jest.spyOn(UserModel, 'findUserByEmail').mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);

      const result = await UserModel.validateUser(email, password);

      expect(UserModel.findUserByEmail).toHaveBeenCalledWith(email);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, 'hashedPassword123');
      expect(result).toEqual({
        success: true,
        user: {
          userId: 1,
          name: 'John Doe',
          email: 'john@example.com'
        }
      });
    });

    test('should fail validation when user not found', async () => {
      jest.spyOn(UserModel, 'findUserByEmail').mockResolvedValue(null);

      const result = await UserModel.validateUser(email, password);

      expect(result).toEqual({
        success: false,
        message: 'User not found'
      });
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    test('should fail validation with incorrect password', async () => {
      const mockUser = {
        userId: 1,
        name: 'John Doe',
        email: 'john@example.com',
        password: 'hashedPassword123'
      };

      jest.spyOn(UserModel, 'findUserByEmail').mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);

      const result = await UserModel.validateUser(email, password);

      expect(bcrypt.compare).toHaveBeenCalledWith(password, 'hashedPassword123');
      expect(result).toEqual({
        success: false,
        message: 'Invalid password'
      });
    });

    test('should handle findUserByEmail errors', async () => {
      jest.spyOn(UserModel, 'findUserByEmail').mockRejectedValue(new Error('Database error'));

      await expect(UserModel.validateUser(email, password)).rejects.toThrow('Database error');
    });

    test('should handle bcrypt comparison failure', async () => {
      const mockUser = {
        userId: 1,
        name: 'John Doe',
        email: 'john@example.com',
        password: 'hashedPassword123'
      };

      jest.spyOn(UserModel, 'findUserByEmail').mockResolvedValue(mockUser);
      bcrypt.compare.mockRejectedValue(new Error('Bcrypt error'));

      await expect(UserModel.validateUser(email, password)).rejects.toThrow('Bcrypt error');
    });
  });

  describe('updateUser', () => {
    test('should update user successfully', async () => {
      const updatedUser = {
        userId: 1,
        name: 'Jane Doe',
        email: 'john@example.com'
      };

      mockRequest.query.mockResolvedValue({
        recordset: [updatedUser]
      });

      const result = await UserModel.updateUser(1, { name: 'Jane Doe' });

      expect(mockRequest.input).toHaveBeenCalledWith('userId', sql.Int, 1);
      expect(mockRequest.input).toHaveBeenCalledWith('name', sql.NVarChar(100), 'Jane Doe');
      expect(result).toEqual({
        success: true,
        user: updatedUser
      });
    });

    test('should handle database errors', async () => {
      mockRequest.query.mockRejectedValue(new Error('Database error'));

      await expect(UserModel.updateUser(1, { name: 'Jane Doe' })).rejects.toThrow('Database error');
    });
  });

  describe('deleteUser', () => {
    test('should delete user successfully', async () => {
      mockRequest.query.mockResolvedValue({});

      const result = await UserModel.deleteUser(1);

      expect(mockRequest.input).toHaveBeenCalledWith('userId', sql.Int, 1);
      expect(result).toEqual({ success: true });
    });

    test('should handle database errors', async () => {
      mockRequest.query.mockRejectedValue(new Error('Database error'));

      await expect(UserModel.deleteUser(1)).rejects.toThrow('Database error');
    });
  });
});
