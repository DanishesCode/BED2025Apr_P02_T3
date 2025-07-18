const sql = require("mssql");
const dbConfig = require("../dbConfig");

async function getHospitals(){
    let connection;
    try{
        connection = await sql.connect(dbConfig);
        const query = "SELECT * FROM Hospitals;";
        const request = connection.request();
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

async function getRoute(start,end,profile){
  const apiKey = process.env.MAPBOX_TOKEN;

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
module.exports = {
    getHospitals
}