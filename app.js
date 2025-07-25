const express = require("express");
const sql = require("mssql");
const dotenv = require("dotenv");
const path = require("path");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const multer = require("multer");
const teleBot = require("./teleBot");
const fs = require('fs');


// Load environment variables FIRST
dotenv.config();

// Import dbConfig AFTER loading environment variables
const dbConfig = require("./dbConfig");


// Create Express app
const app = express();
const port = process.env.PORT || 3000;
// Custom CORS middleware MUST be first to ensure headers are set for all requests
app.use(cors({
    origin: function(origin, callback) {
        const allowedOrigins = [
            'http://localhost:5500',
            'http://127.0.0.1:5500',
            'http://localhost:3000'
        ];
        // Allow requests with no origin (like mobile apps, curl, or Postman)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
// Middleware
app.use(express.json());
app.use(cookieParser());

// Ensure all OPTIONS requests are handled for CORS preflight
app.options('*', cors());

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
// Serve uploaded images at /uploads
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Serve MVC files for browser-side loading
app.use('/middlewares', express.static(path.join(__dirname, 'middlewares')));
app.use('/models', express.static(path.join(__dirname, 'models')));
app.use('/controllers', express.static(path.join(__dirname, 'controllers')));

// Multer setup for file uploads (memory storage)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
});

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
const topicController = require('./controllers/topicController');
const weightController = require('./controllers/weightController');
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

app.get("/weight-tracker", (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'weight-tracker', 'weight-tracker.html'));
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
const weatherValidation = require('./middlewares/weatherValidation');
app.get("/api/weather", weatherValidation.validateLocationMiddleware, weatherApiController.getWeather);
app.get("/api/weather/search", weatherValidation.validateLocationMiddleware, weatherApiController.searchLocations);

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

// Photo Gallery API Routes (grouped together)
app.get("/photos", AuthMiddleware.authenticateToken, photoController.getAllPhotos);
app.get("/photos/:id", AuthMiddleware.authenticateToken, photoController.getPhotoById);
app.post("/photos/upload", AuthMiddleware.authenticateToken, upload.single("photo"), validatePhoto, photoController.uploadPhoto);
app.put("/photos/:id/favorite", AuthMiddleware.authenticateToken, photoController.toggleFavorite);
app.put("/photos/:id", AuthMiddleware.authenticateToken, upload.single("photo"), photoController.updatePhoto);
app.delete("/photos/:id", AuthMiddleware.authenticateToken, photoController.deletePhoto);


// Error handling for multer
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ 
                success: false, 
                message: "File too large. Maximum size is 5MB." 
            });
        }
        return res.status(400).json({ 
            success: false, 
            message: "File upload error: " + error.message 
        });
    }
    if (error.message === 'Only image files are allowed') {
        return res.status(400).json({ 
            success: false, 
            message: "Only image files are allowed" 
        });
    }
    next(error);
});

// Topics Learner routes
app.get("/topics", (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'TopicsLearner', 'topics.html'));
});

app.get("/topics/upload", (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'TopicsLearner', 'upload-topic.html'));
});

// Topics API routes
app.get("/api/topics", AuthMiddleware.optionalAuth, topicController.getAllTopics);
app.get("/api/topics/user", AuthMiddleware.authenticateToken, topicController.getUserTopics);
app.get("/api/topics/category/:category", topicController.getTopicsByCategory);
app.get("/api/topics/:id", topicController.getTopicById);
app.post("/api/topics", AuthMiddleware.authenticateToken, topicController.createTopic);
app.post("/api/topics/upload", AuthMiddleware.authenticateToken, topicController.uploadFile, topicController.createTopic);
app.put("/api/topics/:id", AuthMiddleware.authenticateToken, topicController.uploadFile, topicController.updateTopic);
app.delete("/api/topics/:id", AuthMiddleware.authenticateToken, topicController.deleteTopic);

// Topic like/unlike routes
app.post("/api/topics/:id/toggle-like", AuthMiddleware.authenticateToken, topicController.toggleLike);

// Topic comment routes
app.post("/api/topics/:id/comments", AuthMiddleware.authenticateToken, topicController.addComment);
app.get("/api/topics/:id/comments", topicController.getComments);


// Weight API routes
app.post('/api/weight', AuthMiddleware.authenticateToken, weightController.addWeightEntry);
app.get('/api/weight', AuthMiddleware.authenticateToken, weightController.getWeightHistory);

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