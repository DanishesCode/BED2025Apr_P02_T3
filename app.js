const express = require("express");
const sql = require("mssql");
const dotenv = require("dotenv");
const path = require("path");
// Load environment variables
dotenv.config();
// Create Express app
const app = express();
const port = process.env.PORT || 3000;

//controller variables
const triviaController = require("./controllers/trivIaController");


//routes
//trivia routes(DANISH)
app.get("/trivia/questions/:categoryName",triviaController.getQuestionsByCategory);
app.get("/trivia/options/:questionText",triviaController.getOptionsByQuestion);


// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
  
  // Graceful shutdown
  process.on("SIGINT", async () => {
    console.log("Server is gracefully shutting down");
    await sql.close();
    console.log("Database connections closed");
    process.exit(0);
  });
  