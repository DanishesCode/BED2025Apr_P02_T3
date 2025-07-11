const sql = require('mssql');
const bcrypt = require('bcrypt');
const dbConfig = require('../dbConfig');

class UserModel {
    static async createUser(userData) {
        try {
            const pool = await sql.connect(dbConfig);
            
            // Hash password
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
            
            const query = `


                INSERT INTO Users (name, email, password, date_of_birth)
                OUTPUT INSERTED.userId, INSERTED.name, INSERTED.email
                VALUES (@name, @email, @password, @date_of_birth)

            `;
            
            const request = pool.request();
            request.input('name', sql.NVarChar(100), userData.name);
            request.input('email', sql.NVarChar(100), userData.email);
            request.input('password', sql.NVarChar(255), hashedPassword);
            request.input('date_of_birth', sql.Date, userData.dob);
            
            console.log('Executing query:', query);
            const result = await request.query(query);
            return {
                success: true,
                user: result.recordset[0]
            };
        } catch (error) {
            if (error.number === 2627) { // Unique constraint violation
                return {
                    success: false,
                    message: 'Email already exists'
                };
            }
            throw error;
        }
    }

    static async findUserByEmail(email) {
        try {
            const pool = await sql.connect(dbConfig);
            const query = `
                SELECT userId, name, email, password, date_of_birth
                FROM Users 
                WHERE email = @email
            `;
            
            const request = pool.request();
            request.input('email', sql.NVarChar(100), email);
            
            const result = await request.query(query);
            return result.recordset[0] || null;
        } catch (error) {
            throw error;
        }
    }

    static async validateUser(email, password) {
        try {
            const user = await this.findUserByEmail(email);
            if (!user) {
                return {
                    success: false,
                    message: 'User not found'
                };
            }

            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                return {
                    success: false,
                    message: 'Invalid password'
                };
            }

            // Remove password from returned user object
            const { password: _, ...userWithoutPassword } = user;
            return {
                success: true,
                user: userWithoutPassword
            };
        } catch (error) {
            throw error;
        }
    }

    static async updateUser(userId, updateData) {
        try {
            const pool = await sql.connect(dbConfig);
            const query = `
                UPDATE Users 
                SET name = @name
                OUTPUT INSERTED.userId, INSERTED.name, INSERTED.email
                WHERE userId = @userId


            `;
            
            const request = pool.request();
            request.input('userId', sql.Int, userId);
            request.input('name', sql.NVarChar(100), updateData.name);
            
            const result = await request.query(query);
            return {
                success: true,
                user: result.recordset[0]
            };
        } catch (error) {
            throw error;
        }
    }

    static async deleteUser(userId) {
        try {
            const pool = await sql.connect(dbConfig);
            const query = `DELETE FROM Users WHERE userId = @userId`;


            
            const request = pool.request();
            request.input('userId', sql.Int, userId);
            
            await request.query(query);
            return { success: true };
        } catch (error) {
            throw error;
        }
    }
}

module.exports = UserModel;