const express = require("express");
const sql = require("mssql");
const dotenv = require("dotenv");
const path = require("path");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const teleBot = require("./teleBot");

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const port = process.env.PORT || 3000;
// Middleware
app.use(express.json());
app.use(cookieParser());
// CORS configuration - allow multiple origins
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:3001',
            'http://127.0.0.1:5500',
            'http://localhost:5500',
            'http://127.0.0.1:5501',
            'http://localhost:5501',
            'http://127.0.0.1:5502',
            'http://localhost:5502',
            'http://127.0.0.1:5503',
            'http://localhost:5503',
            'http://127.0.0.1:5504',
            'http://localhost:5504',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:3001'
        ];
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// controller variables
const triviaController = require("./controllers/trivIaController");
const userController = require("./controllers/userController");
const sosController = require("./controllers/sosController");
const AuthMiddleware = require("./middlewares/authMiddleware.js");
const ValidationMiddleware = require("./middlewares/validationMiddleware");
const sosMiddleware = require("./middlewares/sosValidation.js");
const aichatController = require("./controllers/aichatController");
const appointmentController = require("./controllers/appointmentController");
const birthdayController = require('./controllers/birthdayController');
const { validateAdd, validateUpdate } = require('./middlewares/validateBirthday');
// Routes for pages
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login', 'login.html'));
});

app.get("/signup", (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'signup', 'signup.html'));
});

app.get("/appointment", (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'appointment', 'appointment.html'));
});


// Environment variables endpoint for client-side usage
app.get("/api/env", (req, res) => {
    res.json({
        WEATHER_API_KEY: process.env.WEATHER_API_KEY,
        PEXELS_API_KEY: process.env.PEXELS_API_KEY
    });
});


// SOS routes
app.get("/sos", (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'sos', 'main.html'));
});

app.get("/sos/settings", (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'sos', 'setting.html'));
});


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

app.post("/chat/", AuthMiddleware.authenticateToken, aichatController.getAIResponse);

// Retrive Chats and Messages
app.get("/chat/:id", AuthMiddleware.authenticateToken, aichatController.retrieveChats);
app.get("/chat/messages/:chatId", AuthMiddleware.authenticateToken, aichatController.retrieveMessages);

// Save Messages
app.post("/chat/messages", AuthMiddleware.authenticateToken, aichatController.saveMessage);

// Add route for creating new chat
app.post("/chat/new", AuthMiddleware.authenticateToken, aichatController.createChat);


//ROUTES FOR SOS(Danish)
app.get("/caretaker/getrecord/:id",sosController.retrieveRecord);
app.post("/caretaker/convertaddress",sosController.convertLocation);
app.post('/caretaker/send-message', sosController.sendTelegramMessage);
app.post("/caretaker/create/:id",sosMiddleware.validateCaretakerId,sosMiddleware.validateCaretaker,sosController.createRecord);
app.put("/caretaker/update/:id",sosMiddleware.validateCaretakerId,sosMiddleware.validateCaretaker,sosController.updateRecord);
app.delete("/caretaker/delete/:id", sosController.deleteRecord);

// Birthday routes
app.get("/birthdays", birthdayController.getAllBirthdays);
app.get("/birthdays/dashboard", birthdayController.getBirthdaysForDashboard);
app.get("/birthdays/:id", birthdayController.getBirthdayById);
app.post("/birthdays", validateAdd, birthdayController.addBirthday);
app.put("/birthdays/:id", validateUpdate, birthdayController.updateBirthday);
app.delete("/birthdays/:id", birthdayController.deleteBirthday);



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
