const express = require("express");
const sql = require("mssql");
const dotenv = require("dotenv");
const path = require("path");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const multer = require("multer");
const teleBot = require("./teleBot");
const fs = require('fs');
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger-output.json"); // Import generated spec


// Load environment variables FIRST
dotenv.config();

// Import dbConfig AFTER loading environment variables
const dbConfig = require("./dbConfig");


// Create Express app
const app = express();
const port = process.env.PORT || 3000;
// Custom CORS middleware MUST be first to ensure headers are set for all requests
app.use(cors({
    origin: [
        'http://localhost:5500',
        'http://127.0.0.1:5500',
        'http://localhost:5504',
        'http://127.0.0.1:5504'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
// Middleware
app.use(express.json());
app.use(cookieParser());


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
const hospitalController = require("./controllers/hospitalController");
const { validateAdd, validateUpdate } = require('./middlewares/validateBirthday');
const mealController = require("./controllers/mealController");
const mealPlanController = require('./controllers/mealplanController');
const suggestionController = require('./controllers/mealsuggestionController');
const groceryController = require('./controllers/groceryController');
const {  validateMeal, validateMealUpdate, validateMealId, validateUserId } = require('./middlewares/mealValidation');
const topicController = require('./controllers/topicController');
const weightController = require('./controllers/weightController');
const { validateGroceryItem, validateUpdateGroceryItem, validateItemId, validateUserId: validateGroceryUserId } = require('./middlewares/groceryValidation');
const summarizerController = require('./controllers/summarizerController'); // at the top with other controllers
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
app.get("/trivia/questions/:categoryName",AuthMiddleware.authenticateToken, triviaController.getQuestionsByCategory);
app.get("/trivia/options/:questionText",AuthMiddleware.authenticateToken, triviaController.getOptionsByQuestion);

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
app.get("/caretaker/getrecord/:id",AuthMiddleware.authenticateToken,sosController.retrieveRecord);
app.post("/caretaker/convertaddress",AuthMiddleware.authenticateToken,sosController.convertLocation);
app.post('/caretaker/send-message', AuthMiddleware.authenticateToken,sosController.sendTelegramMessage);
app.post("/caretaker/create/:id",AuthMiddleware.authenticateToken,sosMiddleware.validateCaretakerId,sosMiddleware.validateCaretaker,sosController.createRecord);
app.put("/caretaker/update/:id",AuthMiddleware.authenticateToken,sosMiddleware.validateCaretakerId,sosMiddleware.validateCaretaker,sosController.updateRecord);
app.delete("/caretaker/delete/:id", AuthMiddleware.authenticateToken,sosController.deleteRecord);


//RUN TELEBOT(Danish)
teleBot.startBot();


app.post("/chat/", AuthMiddleware.authenticateToken, aichatController.getAIResponse);

// Retrive Chats and Messages
app.get("/chat/:id", AuthMiddleware.authenticateToken, aichatController.retrieveChats);
app.get("/chat/messages/:chatId", AuthMiddleware.authenticateToken, aichatController.retrieveMessages);

// Save Messages
app.post("/chat/messages", AuthMiddleware.authenticateToken, aichatController.saveMessage);

// Add route for creating new chat
app.post("/chat/new", AuthMiddleware.authenticateToken, aichatController.createChat);
app.post("/chat/:id", AuthMiddleware.authenticateToken, aichatController.getAIResponse);
app.post("/chat", AuthMiddleware.authenticateToken, aichatController.getAIResponse);
app.put("/chat/:id", AuthMiddleware.authenticateToken, aichatController.renameChat);
app.delete("/chat/:id", AuthMiddleware.authenticateToken, aichatController.deleteChat);

// Birthday routes
app.get("/birthdays", AuthMiddleware.authenticateToken, birthdayController.getAllBirthdays);
app.get("/birthdays/dashboard", AuthMiddleware.authenticateToken, birthdayController.getBirthdaysForDashboard);
app.get("/birthdays/:id", AuthMiddleware.authenticateToken, birthdayController.getBirthdayById);
app.post("/birthdays", AuthMiddleware.authenticateToken, validateAdd, birthdayController.addBirthday);
app.put("/birthdays/:id", AuthMiddleware.authenticateToken, validateUpdate, birthdayController.updateBirthday);
app.delete("/birthdays/:id", AuthMiddleware.authenticateToken, birthdayController.deleteBirthday);

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

//Routes for nearest hospital(danish)
app.post("/hospital/getroute",AuthMiddleware.authenticateToken,hospitalController.getRouteData);
app.get("/hospital/getall",AuthMiddleware.authenticateToken,hospitalController.getHopsitals);

//start telebot
/*try{
    teleBot.startBot();
}catch(error){
    console.log(error);
}
*/
//Meal Recipe routes
app.use(express.static(path.join(__dirname, "public")));
app.get("/meals/:userId", 
    AuthMiddleware.authenticateToken,
    mealController.getAllMeals
);
app.get("/meals/:userId/:mealId", 
    AuthMiddleware.authenticateToken,
    mealController.getMealById
);
app.post("/meals", 
    AuthMiddleware.authenticateToken,
    mealController.addMeal
);
app.post("/meals/import-spoonacular", 
    AuthMiddleware.authenticateToken,
    mealController.importSpoonacularRecipe
);
app.put("/meals/:mealId", 
    AuthMiddleware.authenticateToken,
    mealController.updateMeal
);
app.delete("/meals/:mealId", 
    AuthMiddleware.authenticateToken,
    mealController.deleteMeal
);
// Meal Plan routes
app.get("/mealplans/:userId", AuthMiddleware.authenticateToken, mealPlanController.getAllMealPlans);
app.get("/mealplans/:userId/:planId", AuthMiddleware.authenticateToken, mealPlanController.getMealPlanById);
app.post("/mealplans", AuthMiddleware.authenticateToken, mealPlanController.addMealPlan);
app.put("/mealplans/:planId", AuthMiddleware.authenticateToken, mealPlanController.updateMealPlan);
app.delete("/mealplans/:planId", AuthMiddleware.authenticateToken, mealPlanController.deleteMealPlan);

// Recipe Suggestion Routes (Spoonacular API)
app.get("/suggestions", suggestionController.getSuggestions);
app.get("/suggestions/random", suggestionController.getRandomRecipes);
app.get("/suggestions/:recipeId", suggestionController.getRecipeDetails);
app.post("/suggestions/add", suggestionController.addSuggestedRecipe);



app.get("/grocery/user/:userId", AuthMiddleware.authenticateToken, validateGroceryUserId, groceryController.getAllGroceryItems);
app.get("/grocery/item/:id", AuthMiddleware.authenticateToken, validateItemId, groceryController.getGroceryItemById);
app.post("/grocery", AuthMiddleware.authenticateToken, validateGroceryItem, groceryController.addGroceryItem);
app.put("/grocery/item/:id", AuthMiddleware.authenticateToken, validateItemId, validateUpdateGroceryItem, groceryController.updateGroceryItem);
app.delete("/grocery/item/:id", AuthMiddleware.authenticateToken, validateItemId, groceryController.deleteGroceryItem);
app.post("/grocery/generate/:userId", AuthMiddleware.authenticateToken, validateGroceryUserId, groceryController.generateFromMealPlan);


app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
// Summarization API route
app.post('/api/summarize', summarizerController.summarizeText);

// Global error handling middleware
app.use((error, req, res, next) => {
    console.error("=== SERVER ERROR ===");
    console.error(error);
    
    // Handle different types of errors
    if (error.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: "Validation error",
            error: error.message,
            timestamp: new Date().toISOString(),
            path: req.originalUrl
        });
    }
    
    if (error.name === 'DatabaseError') {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message,
            timestamp: new Date().toISOString(),
            path: req.originalUrl
        });
    }
    
    if (error.name === 'APIError') {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message,
            timestamp: new Date().toISOString(),
            path: req.originalUrl
        });
    }
    
    // Default error response
    res.status(500).json({ 
        success: false, 
        message: "Internal server error", 
        error: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred',
        timestamp: new Date().toISOString(),
        path: req.originalUrl
    });
});

// Start server
app.listen(port, async () => {
    try {
        await sql.connect(dbConfig);
        console.log("Database connected");
        
        birthdayController.startAutomaticBirthdayWishes(); // Enabled for testing
        
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