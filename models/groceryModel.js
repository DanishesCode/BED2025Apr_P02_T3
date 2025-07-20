const sql = require('mssql');
const dbConfig = require('../dbConfig');

// Get all grocery items for a user
async function getAllGroceryItems(userId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const request = connection.request();
    request.input('UserID', sql.Int, userId);
    const result = await request.query(
      'SELECT * FROM GroceryItems ORDER BY date_added DESC'
    );
    return result.recordset;
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection:', err);
      }
    }
  }
}

// Get a grocery item by ID
async function getGroceryItemById(itemId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const request = connection.request();
    request.input('item_id', sql.Int, itemId);
    const result = await request.query(
      'SELECT * FROM GroceryItems WHERE item_id = @item_id'
    );
    return result.recordset[0];
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection:', err);
      }
    }
  }
}

// Add a new grocery item
async function addGroceryItem(item) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const request = connection.request();
    request.input('item_name', sql.VarChar, item.item_name)
    request.input('quantity', sql.Int, item.quantity)
    request.input('bought', sql.Bit, item.bought !== undefined ? item.bought : 0)
    request.input('user_id', sql.Int, item.user_id)
    request.input('date_added', sql.Date, item.date_added || new Date())
    request.input('price', sql.Decimal(10, 2), item.price !== undefined ? item.price : 0.00); 
    request.input('notes', sql.VarChar, item.notes || ''); 
    const result = await request.query(`
      INSERT INTO GroceryItems (item_name, quantity, bought, user_id, date_added, price, notes)
      VALUES (@item_name, @quantity, @bought, @user_id, @date_added, @price, @notes) 
    `);
    return result;
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection:', err);
      }
    }
  }
}

// Update a grocery item
async function updateGroceryItem(item_id, updatedItem) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const request = connection.request();
    request.input('item_id', sql.Int, item_id);
    request.input('item_name', sql.VarChar, updatedItem.item_name);
    request.input('quantity', sql.Int, updatedItem.quantity);
    request.input('bought', sql.Bit, updatedItem.bought);
    request.input('price', sql.Decimal(10, 2), updatedItem.price !== undefined ? updatedItem.price : 0.00);
    request.input('notes', sql.VarChar, updatedItem.notes || '');
    const result = await request.query(`
      UPDATE GroceryItems
      SET item_name = @item_name,
          quantity = @quantity,
          bought = @bought,
          price = @price,
          notes = @notes
      WHERE item_id = @item_id
    `);
    return result;
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection:', err);
      }
    }
  }
}

// Delete a grocery item
async function deleteGroceryItem(itemId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const request = connection.request();
    request.input('ItemID', sql.Int, itemId);
    const result = await request.query(
      'DELETE FROM GroceryItems WHERE item_id = @ItemID'
    );
    return result;
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing connection:', err);
      }
    }
  }
}

module.exports = {
  getAllGroceryItems,
  getGroceryItemById,
  addGroceryItem,
  updateGroceryItem,
  deleteGroceryItem,
};
