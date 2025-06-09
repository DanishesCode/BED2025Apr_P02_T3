const sql = require("mssql");
const dbConfig = require("../dbConfig");

async function getQuestionsByCategory(categoryName){
    let connection;
    try{
        connection = await sql.connect(dbConfig);
        const query = "SELECT question_text FROM Questions WHERE category_name = @categoryName;";
        const request = connection.request();
        request.input("categoryName",categoryName);
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

async function getOptionsByQuestion(questionText){
    let connection;
    try{
        connection = await sql.connect(dbConfig);
        const query = "SELECT answer_text, is_correct FROM Answers WHERE question_text = @questionText;";
        const request = connection.request();
        request.input("questionText",questionText);
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
            }catch(error){
                console.error("Error closing connection",error);
            }
        }
    }
}

module.exports = {
    getQuestionsByCategory,
    getOptionsByQuestion
}