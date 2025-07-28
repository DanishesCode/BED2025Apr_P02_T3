const sql = require("mssql");
const dbConfig = require("../dbConfig");

// Get all meal plans for a specific user
async function getAllMealPlans(userId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = `
      SELECT MealPlan.*, Meals.MealName, Meals.Category, Meals.Instructions
      FROM MealPlan
      INNER JOIN Meals ON MealPlan.MealID = Meals.MealID
      WHERE MealPlan.UserID = @UserID
    `;
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

// Get a single meal plan by PlanID
async function getMealPlanById(planId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = `
      SELECT * FROM MealPlan WHERE PlanID = @PlanID
    `;
    const request = connection.request();
    request.input("PlanID", sql.Int, planId);
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

// Add a new meal plan entry
async function addMealPlan(plan) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = `
      INSERT INTO MealPlan (UserID, MealID, DayOfWeek, MealTime)
      VALUES (@UserID, @MealID, @DayOfWeek, @MealTime);
      SELECT SCOPE_IDENTITY() AS PlanID;
    `;
    const request = connection.request();
    request.input("UserID", sql.Int, plan.UserID);
    request.input("MealID", sql.Int, plan.MealID);
    request.input("DayOfWeek", sql.NVarChar(10), plan.DayOfWeek);
    request.input("MealTime", sql.NVarChar(20), plan.MealTime);

    const result = await request.query(query);
    const newPlanId = result.recordset[0].PlanID;
    return await getMealPlanById(newPlanId);
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

// Update a meal plan entry
async function updateMealPlan(planId, updatedPlan) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = `
      UPDATE MealPlan
      SET MealID = @MealID,
          DayOfWeek = @DayOfWeek,
          MealTime = @MealTime
      WHERE PlanID = @PlanID
    `;
    const request = connection.request();
    request.input("PlanID", sql.Int, planId);
    request.input("MealID", sql.Int, updatedPlan.MealID);
    request.input("DayOfWeek", sql.NVarChar(10), updatedPlan.DayOfWeek);
    request.input("MealTime", sql.NVarChar(20), updatedPlan.MealTime);

    const result = await request.query(query);

    if (result.rowsAffected[0] === 0) {
      return null; // Not found
    }

    return await getMealPlanById(planId);
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

// Delete a meal plan entry
async function deleteMealPlan(planId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = `
      DELETE FROM MealPlan WHERE PlanID = @PlanID
    `;
    const request = connection.request();
    request.input("PlanID", sql.Int, planId);
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
  getAllMealPlans,
  getMealPlanById,
  addMealPlan,
  updateMealPlan,
  deleteMealPlan
};
