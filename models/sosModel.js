const sql = require("mssql");
const dbConfig = require("../dbConfig");

async function retrieveRecord(id){
    let connection;
    try{
        connection = await sql.connect(dbConfig);
        const query = "SELECT * FROM Caretaker WHERE id = @id;";
        const request = connection.request();
        request.input("id",id);
        const result = await request.query(query);

        if(result.recordset.length === 0){
            return null;
        }
        return result.recordset;
    }
    catch(error){
        console.error("Database error",error);
        throw error;
    } finally{
        if (connection){
            try{
                await connection.close();
            }
            catch(closeError){
                console.error("Error closing connection",closeError);
            }
        }
    }
}

async function createRecord(id, data) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);

    const query = `
      INSERT INTO Caretaker (id, telegram_name, chat_id)
      VALUES (@id, @telegram_name, @chat_id);
    `;

    const request = connection.request();
    request.input("id", id); // id from URL param
    request.input("telegram_name", data.telegram_name);
    request.input("chat_id", data.chat_id);

    await request.query(query);

    return { message: "Caretaker created", id };
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


async function updateRecord(id,data){
    let connection;
    try {
      connection = await sql.connect(dbConfig);
      const query =
        "UPDATE Caretaker SET telegram_name = @telegram_name, chat_id = @chat_id WHERE id = @id";
      const request = connection.request();
      request.input("id", id);
      request.input("telegram_name", data.telegram_name);
      request.input("chat_id", data.chat_id);
  
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

async function deleteData(id){
    let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = "DELETE FROM Caretaker WHERE id = @id";
    const request = connection.request();
    request.input("id", id);

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


async function convertLocation(data){
const latitude = data.latitude;
const longitude = data.longitude;
const apiKey = process.env.Geocoding_ApiKey;

fetch(`https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${apiKey}`)
  .then(response => response.json())
  .then(data => {
    const address = data.results[0].formatted;
    console.log("Address:", address);
    return address;
  })
  .catch(error => {
    console.error("Error fetching address:", error);
  });
}

module.exports = {
    retrieveRecord,
    createRecord,
    updateRecord,
    deleteData,
    convertLocation
}