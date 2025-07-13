const sql = require("mssql");
const dbConfig = require("../dbConfig");
const teleBot = require("../teleBot");

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


async function convertLocation(data) {
  const latitude = data.latitude;
  const longitude = data.longitude;
  const apiKey = process.env.Geocoding_ApiKey;

  try {
    if (!apiKey) {
      throw new Error("API key is missing!");
    }

    const url = `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${apiKey}`;
    console.log("Requesting URL:", url);

    const response = await fetch(url);

    if (!response.ok) {
      const text = await response.text();
      console.error("Response not OK:", response.status, text);
      throw new Error(`OpenCage API error: ${response.status}`);
    }

    const result = await response.json();
    console.log("API result:", result);

    if (!result.results || result.results.length === 0) {
      throw new Error("No address found.");
    }

    const address = result.results[0].formatted;
    return address;
  } catch (error) {
    console.error("Model error in convertLocation:", error.message);
    throw error;
  }
}

async function sendTeleMessage(data){
  try {
    const chatId = data.chatId;
    const address = data.address;
    const name = data.name;
    let message = `🚨ALERT🚨 ${name} HAS PRESSED THE EMERGENCY SOS! HER LOCATION: ${address}`;
    const success = await teleBot.sendMessage(chatId, message);
    return success;
  } catch (error) {
    console.error("Model error in sendMessageToTelegram:", error.message);
    throw error;
  }
}


module.exports = {
    retrieveRecord,
    createRecord,
    updateRecord,
    deleteData,
    convertLocation,
    sendTeleMessage
}