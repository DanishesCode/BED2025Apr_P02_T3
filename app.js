const express = require("express");
const sql = require("mssql");
const dotenv = require("dotenv");
const path = require("path");
const cookieParser = require("cookie-parser");
const cors = require("cors");

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true
}));

// controller variables
const triviaController = require("./controllers/trivIaController");
const userController = require("./controllers/userController");
const AuthMiddleware = require("./middlewares/authMiddleware");
const ValidationMiddleware = require("./middlewares/validationMiddleware");


// Trivia routes (DANISH)
app.get("/trivia/questions/:categoryName", triviaController.getQuestionsByCategory);
app.get("/trivia/options/:questionText", triviaController.getOptionsByQuestion);

// User authentication routes
app.post(
    "/auth/signup",
    ValidationMiddleware.sanitizeInput,
    ValidationMiddleware.validateSignup,
    userController.signup
);

app.post(
    "/auth/login",
    ValidationMiddleware.sanitizeInput,
    ValidationMiddleware.validateLogin,
    AuthMiddleware.rateLimitLogin,
    userController.login
);

app.post("/auth/logout", AuthMiddleware.authenticateToken, userController.logout);

// User profile routes
app.get(
    "/user/profile",
    AuthMiddleware.authenticateToken,
    userController.getProfile
);

app.put(
    "/user/profile",
    AuthMiddleware.authenticateToken,
    ValidationMiddleware.sanitizeInput,
    ValidationMiddleware.validateUpdateProfile,
    userController.updateProfile
);

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