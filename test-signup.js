const sql = require('mssql');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const dbConfig = require('./dbConfig');

async function testSignup() {
    try {
        console.log('Testing signup functionality...');
        
        // 1. Test database connection
        console.log('\n1. Testing database connection...');
        const connection = await sql.connect(dbConfig);
        console.log('✅ Database connection successful!');
        
        // 2. Check if Users table exists
        console.log('\n2. Checking Users table...');
        const tableCheck = await connection.request().query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME = 'Users'
        `);
        
        if (tableCheck.recordset.length === 0) {
            console.error('❌ Users table does not exist!');
            console.log('You need to run the init-schema.sql file to create the Users table.');
            return;
        }
        console.log('✅ Users table exists!');
        
        // 3. Check table structure
        console.log('\n3. Checking Users table structure...');
        const columns = await connection.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'Users'
            ORDER BY ORDINAL_POSITION
        `);
        
        console.log('Table columns:');
        columns.recordset.forEach(col => {
            console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? 'nullable' : 'not null'})`);
        });
        
        // 4. Test password hashing
        console.log('\n4. Testing password hashing...');
        const testPassword = 'password123';
        const hashedPassword = await bcrypt.hash(testPassword, 10);
        console.log('✅ Password hashing works!');
        
        // 5. Test user creation query
        console.log('\n5. Testing user creation query...');
        const testUser = {
            name: 'Test User',
            email: 'test@example.com',
            password: hashedPassword,
            dob: '1990-01-01'
        };
        
        const query = `
            INSERT INTO Users (name, email, password, date_of_birth, created_at, updated_at)
            OUTPUT INSERTED.id, INSERTED.name, INSERTED.email, INSERTED.created_at
            VALUES (@name, @email, @password, @dob, GETDATE(), GETDATE())
        `;
        
        const request = connection.request();
        request.input('name', sql.NVarChar(100), testUser.name);
        request.input('email', sql.NVarChar(100), testUser.email);
        request.input('password', sql.NVarChar(255), testUser.password);
        request.input('dob', sql.Date, testUser.dob);
        
        const result = await request.query(query);
        console.log('✅ User creation query works!');
        console.log('Created user:', result.recordset[0]);
        
        // 6. Clean up test user
        console.log('\n6. Cleaning up test user...');
        await connection.request()
            .input('email', sql.NVarChar(100), testUser.email)
            .query('DELETE FROM Users WHERE email = @email');
        console.log('✅ Test user cleaned up!');
        
        await connection.close();
        console.log('\n✅ All signup tests passed!');
        
    } catch (error) {
        console.error('❌ Signup test failed:');
        console.error('Error:', error.message);
        console.error('Code:', error.code);
        console.error('Stack:', error.stack);
    }
}

testSignup(); 