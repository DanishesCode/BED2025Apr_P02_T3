const sql = require('mssql');
const dbConfig = require('../dbConfig');
async function getAllBirthdays(userId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const request = connection.request();
    request.input('userId', sql.Int, userId);
    const result = await request.query(
      'SELECT * FROM Birthdays WHERE userId = @userId ORDER BY BirthDate'
    );
    return result.recordset;
  } catch (error) {
    console.error('Database error (getAllBirthdays):', error);
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}
async function getBirthdayById(birthdayId, userId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const request = connection.request();
    request.input('BirthdayID', sql.Int, birthdayId);
    request.input('userId', sql.Int, userId);
    const result = await request.query(
      'SELECT * FROM Birthdays WHERE BirthdayID = @BirthdayID AND userId = @userId'
    );
    return result.recordset[0];
  } catch (error) {
    console.error('Database error (getBirthdayById):', error);
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}
async function addBirthday(birthday, userId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const request = connection.request();
    request.input('userId', sql.Int, userId);
    request.input('FirstName', sql.VarChar(50), birthday.firstName);
    request.input('LastName', sql.VarChar(50), birthday.lastName);
    request.input('BirthDate', sql.Date, birthday.birthDate);
    request.input('Relationship', sql.VarChar(50), birthday.relationship || '');
    request.input('Notes', sql.Text, birthday.notes || '');
    request.input('Phone', sql.VarChar(20), birthday.phone || '');

    const result = await request.query(`
      INSERT INTO Birthdays (userId, FirstName, LastName, BirthDate, Relationship, Notes, Phone)
      VALUES (@userId, @FirstName, @LastName, @BirthDate, @Relationship, @Notes, @Phone)
    `);
    return result;
  } catch (error) {
    console.error('Database error (addBirthday):', error);
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}
async function updateBirthday(birthdayId, updatedBirthday, userId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const request = connection.request();
    request.input('BirthdayID', sql.Int, birthdayId);
    request.input('userId', sql.Int, userId);
    request.input('FirstName', sql.VarChar(50), updatedBirthday.firstName);
    request.input('LastName', sql.VarChar(50), updatedBirthday.lastName);
    request.input('BirthDate', sql.Date, updatedBirthday.birthDate);
    request.input('Relationship', sql.VarChar(50), updatedBirthday.relationship || '');
    request.input('Notes', sql.Text, updatedBirthday.notes || '');
    request.input('Phone', sql.VarChar(20), updatedBirthday.phone || '');

    const result = await request.query(`
      UPDATE Birthdays
      SET FirstName = @FirstName,
          LastName = @LastName,
          BirthDate = @BirthDate,
          Relationship = @Relationship,
          Notes = @Notes,
          Phone = @Phone
      WHERE BirthdayID = @BirthdayID AND userId = @userId
    `);
    return result;
  } catch (error) {
    console.error('Database error (updateBirthday):', error);
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}
async function deleteBirthday(birthdayId, userId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const request = connection.request();
    request.input('BirthdayID', sql.Int, birthdayId);
    request.input('userId', sql.Int, userId);
    const result = await request.query(
      'DELETE FROM Birthdays WHERE BirthdayID = @BirthdayID AND userId = @userId'
    );
    return result;
  } catch (error) {
    console.error('Database error (deleteBirthday):', error);
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}
async function getTodaysBirthdays(userId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const request = connection.request();
    request.input('userId', sql.Int, userId);
    const result = await request.query(`
      SELECT * FROM Birthdays
      WHERE userId = @userId
        AND MONTH(BirthDate) = MONTH(GETDATE())
        AND DAY(BirthDate) = DAY(GETDATE())
    `);
    return result.recordset;
  } catch (error) {
    console.error('Database error (getTodaysBirthdays):', error);
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}

async function getAllBirthdaysForReminder() {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const request = connection.request();
    const result = await request.query(`
      SELECT birthdayId, userId, firstName, lastName, birthDate, relationship, notes, phone
      FROM Birthdays 
      WHERE phone IS NOT NULL AND phone != ''
      ORDER BY firstName
    `);
    return result.recordset;
  } catch (error) {
    console.error('Database error (getAllBirthdaysForReminder):', error);
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}

module.exports = {
  getAllBirthdays,
  getBirthdayById,
  addBirthday,
  updateBirthday,
  deleteBirthday,
  getTodaysBirthdays,
  getAllBirthdaysForReminder,
};