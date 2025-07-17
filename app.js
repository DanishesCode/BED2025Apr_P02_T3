const express = require("express");
const sql = require("mssql");
const dotenv = require("dotenv");
const path = require("path");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const multer = require("multer");
const teleBot = require("./teleBot");

// Load environment variables FIRST
dotenv.config();

// Import dbConfig AFTER loading environment variables
const dbConfig = require("./dbConfig");


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
            'http://127.0.0.1:5500',
            'http://localhost:5500',
            'http://127.0.0.1:3000'
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

// Serve MVC files for browser-side loading
app.use('/middlewares', express.static(path.join(__dirname, 'middlewares')));
app.use('/models', express.static(path.join(__dirname, 'models')));
app.use('/controllers', express.static(path.join(__dirname, 'controllers')));

// Multer setup for file uploads
const upload = multer();

app.options('*', cors());

// controller variables
const triviaController = require("./controllers/trivIaController");
const userController = require("./controllers/userController");
const sosController = require("./controllers/sosController");
const photoController = require("./controllers/photoController");
const AuthMiddleware = require("./middlewares/authMiddleware.js");
const ValidationMiddleware = require("./middlewares/validationMiddleware");
const validatePhoto = require("./middlewares/PhotoValidation");
const sosMiddleware = require("./middlewares/sosValidation.js");
const aichatController = require("./controllers/aichatController");
const birthdayController = require('./controllers/birthdayController');
const weatherApiController = require('./controllers/weatherApiController');
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

// Photo Gallery routes
app.get("/photogallery", (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'photogallery', 'photo.html'));
});

app.get("/photoupload", (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'photogallery', 'photoupload.html'));
});

// Weather route
app.get("/weather", (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'weather', 'weather.html'));
});

// Weather API routes - secure backend endpoints
app.get("/api/weather", weatherApiController.getWeather);
app.get("/api/weather/search", weatherApiController.searchLocations);

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


//ROUTES FOR SOS(Danish)
app.get("/caretaker/getrecord/:id",sosController.retrieveRecord);
app.post("/caretaker/convertaddress",sosController.convertLocation);
app.post('/caretaker/send-message', sosController.sendTelegramMessage);
app.post("/caretaker/create/:id",sosMiddleware.validateCaretakerId,sosMiddleware.validateCaretaker,sosController.createRecord);
app.put("/caretaker/update/:id",sosMiddleware.validateCaretakerId,sosMiddleware.validateCaretaker,sosController.updateRecord);
app.delete("/caretaker/delete/:id", sosController.deleteRecord);


//RUN TELEBOT(Danish)
teleBot.startBot();


app.post("/chat/:id", AuthMiddleware.authenticateToken, aichatController.getAIResponse);


// Birthday routes
app.get("/birthdays", birthdayController.getAllBirthdays);
app.get("/birthdays/dashboard", birthdayController.getBirthdaysForDashboard);
app.get("/birthdays/:id", birthdayController.getBirthdayById);
app.post("/birthdays", validateAdd, birthdayController.addBirthday);
app.put("/birthdays/:id", validateUpdate, birthdayController.updateBirthday);
app.delete("/birthdays/:id", birthdayController.deleteBirthday);

// Photo Gallery API Routes

app.get("/photos", photoController.getAllPhotos);
app.get("/photos/:id", photoController.getPhotoById);
app.post("/photos/upload", upload.single("photo"), validatePhoto, photoController.uploadPhoto);

app.put("/photos/:id/favorite", photoController.toggleFavorite);
app.put("/photos/:id", upload.single("photo"), photoController.updatePhoto);
app.delete("/photos/:id", photoController.deletePhoto);

//start telebot
try{
    teleBot.startBot();
}catch(error){
    console.log(error);
}

// Error handling middleware
app.use((error, req, res, next) => {
    console.error("=== SERVER ERROR ===");
    console.error(error);
    res.status(500).json({ 
        success: false, 
        message: "Server error", 
        error: error.message 
    });
});

// Start server
app.listen(port, async () => {
    try {
        await sql.connect(dbConfig);
        console.log("Database connected");
    } catch (err) {
        console.error("DB connection error:", err);
        process.exit(1);
    }
    console.log(`Server running on port ${port}`);
});

// Graceful shutdown
process.on("SIGINT", async () => {
    console.log("Server is gracefully shutting down");
    await sql.close();
    console.log("Database connections closed");
    process.exit(0);
});