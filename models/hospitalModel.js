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



async function getRouteData(profile, start, end) {
    const apiKey = process.env.MAPBOX_TOKEN;
  try {
    if (!apiKey) {
      throw new Error("API key is missing!");
    } 

    // Compose URL for Mapbox Directions API
    const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson&access_token=${apiKey}`;
    console.log("Requesting URL:", url);

    const response = await fetch(url);

    if (!response.ok) {
      const text = await response.text();
      console.error("Response not OK:", response.status, text);
      throw new Error(`Mapbox API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("API result:", data);

    if (!data.routes || data.routes.length === 0) {
      throw new Error("No route found.");
    }

    const route = data.routes[0];

    // Extract needed info
    const distance = route.distance;       // in meters
    const duration = route.duration;       // in seconds
    const geometry = route.geometry;       // GeoJSON LineString

    // Optional: format distance/time for user readability
    const distanceKm = (distance / 1000).toFixed(2);
    const durationMin = (duration / 60).toFixed(1);

    return {
      distanceMeters: distance,
      durationSeconds: duration,
      distanceKm,
      durationMin,
      geometry
    };

  } catch (error) {
    console.error("Model error in getRouteData:", error.message);
    throw error;
  }
}


module.exports = {
    getHospitals,
    getRouteData
}