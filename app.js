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
const appointmentController = require("./controllers/appointmentController");
const birthdayController = require('./controllers/birthdayController');
const weatherApiController = require('./controllers/weatherApiController');
const { validateAdd, validateUpdate } = require('./middlewares/validateBirthday');
const mealController = require("./controllers/mealController");
const mealPlanController = require('./controllers/mealplanController');
const suggestionController = require('./controllers/mealsuggestionController');
const groceryController = require('./controllers/groceryController');
const {  validateMeal, validateMealUpdate, validateMealId, validateUserId } = require('./middlewares/mealValidation');
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





app.post("/chat/:id", AuthMiddleware.authenticateToken, aichatController.getAIResponse);
app.post("/chat", AuthMiddleware.authenticateToken, aichatController.getAIResponse);

// Appointment API routes
app.post("/api/appointments", AuthMiddleware.authenticateToken, appointmentController.create);
app.put("/api/appointments/:id", AuthMiddleware.authenticateToken, appointmentController.update);
app.delete("/api/appointments/:id", AuthMiddleware.authenticateToken, appointmentController.delete);
app.get("/api/appointments", AuthMiddleware.authenticateToken, appointmentController.list);


// Birthday routes - Now with authentication
app.get("/birthdays", AuthMiddleware.authenticateToken, birthdayController.getAllBirthdays);
app.get("/birthdays/dashboard", AuthMiddleware.authenticateToken, birthdayController.getBirthdaysForDashboard);
app.get("/birthdays/:id", AuthMiddleware.authenticateToken, birthdayController.getBirthdayById);
app.post("/birthdays", AuthMiddleware.authenticateToken, validateAdd, birthdayController.addBirthday);
app.put("/birthdays/:id", AuthMiddleware.authenticateToken, validateUpdate, birthdayController.updateBirthday);
app.delete("/birthdays/:id", AuthMiddleware.authenticateToken, birthdayController.deleteBirthday);
app.post("/birthdays/send-sms", AuthMiddleware.authenticateToken, birthdayController.sendBirthdaySMS);

// Photo Gallery API Routes

app.get("/photos", photoController.getAllPhotos);
app.get("/photos/:id", photoController.getPhotoById);
app.post("/photos/upload", upload.single("photo"), validatePhoto, photoController.uploadPhoto);

app.put("/photos/:id/favorite", photoController.toggleFavorite);
app.put("/photos/:id", upload.single("photo"), photoController.updatePhoto);
app.delete("/photos/:id", photoController.deletePhoto);

// Weight API routes
app.post('/api/weight', AuthMiddleware.authenticateToken, weightController.addWeightEntry);
app.get('/api/weight', AuthMiddleware.authenticateToken, weightController.getWeightHistory);

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

// Grocery List routes
app.get("/grocery/user/:userId", AuthMiddleware.authenticateToken, groceryController.getAllGroceryItems);
app.get("/grocery/item/:id", AuthMiddleware.authenticateToken, groceryController.getGroceryItemById);
app.post("/grocery", AuthMiddleware.authenticateToken, groceryController.addGroceryItem);
app.put("/grocery/item/:id", AuthMiddleware.authenticateToken, groceryController.updateGroceryItem);
app.delete("/grocery/item/:id", AuthMiddleware.authenticateToken, groceryController.deleteGroceryItem);
app.post("/grocery/generate/:userId", AuthMiddleware.authenticateToken, groceryController.generateFromMealPlan);

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
