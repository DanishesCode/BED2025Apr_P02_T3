const sql = require("mssql");
const dbConfig = require("../dbConfig");

// Get all meals for a specific user
async function getAllMeals(userId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = "SELECT * FROM Meals WHERE UserID = @UserID";
    const result = await connection.request()
      .input("UserID", sql.Int, userId)
      .query(query);
    return result.recordset;
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Error closing connection:", err);
      }
    }
  }
}

// Get meal by ID
async function getMealById(mealId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = "SELECT * FROM Meals WHERE MealID = @MealID";
    const request = connection.request();
    request.input("MealID", sql.Int, mealId);
    const result = await request.query(query);
    return result.recordset[0] || null;
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Error closing connection:", err);
      }
    }
  }
}

// Add a new meal
async function addMeal(meal) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = `
      INSERT INTO Meals (UserID, MealName, Category, Instructions)
      VALUES (@UserID, @MealName, @Category, @Instructions);
      SELECT SCOPE_IDENTITY() AS MealID;
    `;
    const request = connection.request();
    request.input("UserID", sql.Int, meal.UserID);
    request.input("MealName", sql.NVarChar(100), meal.MealName);
    request.input("Category", sql.NVarChar(50), meal.Category);
    request.input("Instructions", sql.NVarChar(sql.MAX), meal.Instructions);

    const result = await request.query(query);
    const newMealId = result.recordset[0].MealID;
    return await getMealById(newMealId);
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Error closing connection:", err);
      }
    }
  }
}

// Update a meal
async function updateMeal(mealId, updatedMeal) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = `
      UPDATE Meals
      SET MealName = @MealName,
          Category = @Category,
          Instructions = @Instructions
      WHERE MealID = @MealID
    `;
    const request = connection.request();
    request.input("MealID", sql.Int, mealId);
    request.input("MealName", sql.NVarChar(100), updatedMeal.MealName);
    request.input("Category", sql.NVarChar(50), updatedMeal.Category);
    request.input("Instructions", sql.NVarChar(sql.MAX), updatedMeal.Instructions);

    const result = await request.query(query);

    if (result.rowsAffected[0] === 0) {
      return null; // Meal not found
    }

    return await getMealById(mealId); // Return updated meal
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Error closing connection:", err);
      }
    }
  }
}

// Delete a meal
async function deleteMeal(mealId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = "DELETE FROM Meals WHERE MealID = @MealID";
    const request = connection.request();
    request.input("MealID", sql.Int, mealId);
    const result = await request.query(query);
    return result.rowsAffected[0] > 0;
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Error closing connection:", err);
      }
    }
  }
}

module.exports = {
  getAllMeals,
  getMealById,
  addMeal,
  updateMeal,
  deleteMeal,
};