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
module.exports = {
    getHospitals
}