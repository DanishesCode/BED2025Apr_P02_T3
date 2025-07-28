-- init-schema.sql
-- Created: 07-06-2025
-- Initializes the local MSSQL database schema for the project.
-- [Your Name] - [What was added] - [Last Modified Date: YYYY-MM-DD]

-- Ensure the script runs in EaseForLifeDB database
USE EaseForLifeDb;

CREATE TABLE Users (
    userId INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    email NVARCHAR(100) NOT NULL UNIQUE,
    password NVARCHAR(255) NOT NULL,
    date_of_birth DATE NOT NULL,
    created_at DATETIME NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME NOT NULL DEFAULT GETDATE()
);
CREATE TABLE Appointments (
    id INT IDENTITY(1,1) PRIMARY KEY,
    userId INT NOT NULL,
    appointmentDate DATE NOT NULL,
    appointmentTime VARCHAR(10) NOT NULL,
    consultationType NVARCHAR(50) NOT NULL,
    createdAt DATETIME DEFAULT GETDATE()
);

-- Weight history per user
CREATE TABLE WeightHistory (
    id INT IDENTITY(1,1) PRIMARY KEY,
    userId INT NOT NULL,
    date DATE NOT NULL,
    weight FLOAT NOT NULL,
    height FLOAT NOT NULL,
    age INT NOT NULL,
    bmi FLOAT NOT NULL,
    FOREIGN KEY (userId) REFERENCES Users(userId) ON DELETE CASCADE
);

-- [Linn] - [Chat and Messages table to store chats and messages between user and AI] - [Last Modified Date: 2025-07-09]
-- Chats table
CREATE TABLE Chats (
    id INT IDENTITY(1,1) PRIMARY KEY,
    userId INT NOT NULL,
    title NVARCHAR(255) NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

    FOREIGN KEY (userId) REFERENCES Users(userId) ON DELETE CASCADE
);

-- Messages table
CREATE TABLE Messages (
    id INT IDENTITY(1,1) PRIMARY KEY,
    chat_id INT NOT NULL,
    sender_id INT NULL,
    message NVARCHAR(MAX) NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
 is_ai BIT NOT NULL DEFAULT 0,

    FOREIGN KEY (chat_id) REFERENCES Chats(id) ON DELETE CASCADE
);
CREATE TABLE Photos (
    id INT PRIMARY KEY IDENTITY(1,1),
    title NVARCHAR(100) NOT NULL,
    description NVARCHAR(500),
    location NVARCHAR(100),
    date DATE,
    category NVARCHAR(50),
    isFavorite BIT DEFAULT 0,
    photoUrl NVARCHAR(MAX),
    uploadedAt DATETIME DEFAULT GETDATE(),
    userId INT NOT NULL,
    FOREIGN KEY (userId) REFERENCES Users(userId) ON DELETE CASCADE
);


--[Danish] -Create trivia tables and sample data - 09/06/2025
-- Create tables
CREATE TABLE Categories (
    name NVARCHAR(100) PRIMARY KEY
);

CREATE TABLE Questions (
    question_text NVARCHAR(255) PRIMARY KEY,
    category_name NVARCHAR(100) NOT NULL,
    FOREIGN KEY (category_name) REFERENCES Categories(name)
);

CREATE TABLE Answers (
    answer_text NVARCHAR(255) NOT NULL,
    question_text NVARCHAR(255) NOT NULL,
    is_correct BIT NOT NULL,
    FOREIGN KEY (question_text) REFERENCES Questions(question_text)
);

-- Insert categories
INSERT INTO Categories (name) VALUES 
('Science'),
('History'),
('Mathematics'),
('Singapore'),
('General'),
('Sports');

-- Insert Science Questions
INSERT INTO Questions (question_text, category_name) VALUES
('What planet is known as the Red Planet?', 'Science'),
('What is the process by which plants make food?', 'Science'),
('What gas do humans need to breathe to survive?', 'Science'),
('What is the center of an atom called?', 'Science'),
('What force keeps us on the ground?', 'Science');

INSERT INTO Answers (answer_text, question_text, is_correct) VALUES
('Mars', 'What planet is known as the Red Planet?', 1),
('Venus', 'What planet is known as the Red Planet?', 0),
('Jupiter', 'What planet is known as the Red Planet?', 0),
('Saturn', 'What planet is known as the Red Planet?', 0),

('Photosynthesis', 'What is the process by which plants make food?', 1),
('Respiration', 'What is the process by which plants make food?', 0),
('Digestion', 'What is the process by which plants make food?', 0),
('Fermentation', 'What is the process by which plants make food?', 0),

('Oxygen', 'What gas do humans need to breathe to survive?', 1),
('Carbon Dioxide', 'What gas do humans need to breathe to survive?', 0),
('Nitrogen', 'What gas do humans need to breathe to survive?', 0),
('Hydrogen', 'What gas do humans need to breathe to survive?', 0),

('Nucleus', 'What is the center of an atom called?', 1),
('Electron', 'What is the center of an atom called?', 0),
('Proton', 'What is the center of an atom called?', 0),
('Neutron', 'What is the center of an atom called?', 0),

('Gravity', 'What force keeps us on the ground?', 1),
('Magnetism', 'What force keeps us on the ground?', 0),
('Friction', 'What force keeps us on the ground?', 0),
('Electricity', 'What force keeps us on the ground?', 0);

-- Insert History Questions
INSERT INTO Questions (question_text, category_name) VALUES
('Who was the first President of the United States?', 'History'),
('In which year did the Berlin Wall fall?', 'History'),
('Which empire was ruled by Julius Caesar?', 'History'),
('Who was the British Prime Minister during WWII?', 'History'),
('What ancient civilization built the pyramids?', 'History');

INSERT INTO Answers (answer_text, question_text, is_correct) VALUES
('George Washington', 'Who was the first President of the United States?', 1),
('Abraham Lincoln', 'Who was the first President of the United States?', 0),
('Thomas Jefferson', 'Who was the first President of the United States?', 0),
('John Adams', 'Who was the first President of the United States?', 0),

('1989', 'In which year did the Berlin Wall fall?', 1),
('1991', 'In which year did the Berlin Wall fall?', 0),
('1985', 'In which year did the Berlin Wall fall?', 0),
('1979', 'In which year did the Berlin Wall fall?', 0),

('Roman Empire', 'Which empire was ruled by Julius Caesar?', 1),
('Ottoman Empire', 'Which empire was ruled by Julius Caesar?', 0),
('Mongol Empire', 'Which empire was ruled by Julius Caesar?', 0),
('British Empire', 'Which empire was ruled by Julius Caesar?', 0),

('Winston Churchill', 'Who was the British Prime Minister during WWII?', 1),
('Neville Chamberlain', 'Who was the British Prime Minister during WWII?', 0),
('Clement Attlee', 'Who was the British Prime Minister during WWII?', 0),
('Margaret Thatcher', 'Who was the British Prime Minister during WWII?', 0),

('Egyptians', 'What ancient civilization built the pyramids?', 1),
('Mayans', 'What ancient civilization built the pyramids?', 0),
('Romans', 'What ancient civilization built the pyramids?', 0),
('Aztecs', 'What ancient civilization built the pyramids?', 0);

-- Insert Mathematics Questions
INSERT INTO Questions (question_text, category_name) VALUES
('What is the value of Pi (π) to two decimal places?', 'Mathematics'),
('What is 7 multiplied by 8?', 'Mathematics'),
('What do you call a polygon with five sides?', 'Mathematics'),
('What is the square root of 64?', 'Mathematics'),
('What is 15% of 200?', 'Mathematics');

INSERT INTO Answers (answer_text, question_text, is_correct) VALUES
('3.14', 'What is the value of Pi (π) to two decimal places?', 1),
('3.41', 'What is the value of Pi (π) to two decimal places?', 0),
('3.15', 'What is the value of Pi (π) to two decimal places?', 0),
('2.14', 'What is the value of Pi (π) to two decimal places?', 0),

('56', 'What is 7 multiplied by 8?', 1),
('54', 'What is 7 multiplied by 8?', 0),
('49', 'What is 7 multiplied by 8?', 0),
('63', 'What is 7 multiplied by 8?', 0),

('Pentagon', 'What do you call a polygon with five sides?', 1),
('Hexagon', 'What do you call a polygon with five sides?', 0),
('Quadrilateral', 'What do you call a polygon with five sides?', 0),
('Heptagon', 'What do you call a polygon with five sides?', 0),

('8', 'What is the square root of 64?', 1),
('6', 'What is the square root of 64?', 0),
('10', 'What is the square root of 64?', 0),
('4', 'What is the square root of 64?', 0),

('30', 'What is 15% of 200?', 1),
('25', 'What is 15% of 200?', 0),
('35', 'What is 15% of 200?', 0),
('40', 'What is 15% of 200?', 0);

-- Insert Singapore Questions
INSERT INTO Questions (question_text, category_name) VALUES
('What is the national flower of Singapore?', 'Singapore'),
('Which year did Singapore gain independence?', 'Singapore'),
('What is the currency of Singapore?', 'Singapore'),
('Which famous garden is located in Singapore?', 'Singapore'),
('What is the main language spoken in Singapore?', 'Singapore');

INSERT INTO Answers (answer_text, question_text, is_correct) VALUES
('Vanda Miss Joaquim', 'What is the national flower of Singapore?', 1),
('Rafflesia', 'What is the national flower of Singapore?', 0),
('Orchid', 'What is the national flower of Singapore?', 0),
('Hibiscus', 'What is the national flower of Singapore?', 0),

('1965', 'Which year did Singapore gain independence?', 1),
('1959', 'Which year did Singapore gain independence?', 0),
('1975', 'Which year did Singapore gain independence?', 0),
('1980', 'Which year did Singapore gain independence?', 0),

('Singapore Dollar', 'What is the currency of Singapore?', 1),
('Malaysian Ringgit', 'What is the currency of Singapore?', 0),
('US Dollar', 'What is the currency of Singapore?', 0),
('Euro', 'What is the currency of Singapore?', 0),

('Gardens by the Bay', 'Which famous garden is located in Singapore?', 1),
('Kew Gardens', 'Which famous garden is located in Singapore?', 0),
('Butchart Gardens', 'Which famous garden is located in Singapore?', 0),
('Singapore Botanic Gardens', 'Which famous garden is located in Singapore?', 0),

('English', 'What is the main language spoken in Singapore?', 1),
('Mandarin', 'What is the main language spoken in Singapore?', 0),
('Malay', 'What is the main language spoken in Singapore?', 0),
('Tamil', 'What is the main language spoken in Singapore?', 0);

-- Insert General Questions
INSERT INTO Questions (question_text, category_name) VALUES
('What is the tallest mountain in the world?', 'General'),
('Which animal is known as the King of the Jungle?', 'General'),
('What is the capital city of Australia?', 'General'),
('What color do you get by mixing red and white?', 'General'),
('How many continents are there?', 'General');

INSERT INTO Answers (answer_text, question_text, is_correct) VALUES
('Mount Everest', 'What is the tallest mountain in the world?', 1),
('K2', 'What is the tallest mountain in the world?', 0),
('Kangchenjunga', 'What is the tallest mountain in the world?', 0),
('Lhotse', 'What is the tallest mountain in the world?', 0),

('Lion', 'Which animal is known as the King of the Jungle?', 1),
('Tiger', 'Which animal is known as the King of the Jungle?', 0),
('Elephant', 'Which animal is known as the King of the Jungle?', 0),
('Leopard', 'Which animal is known as the King of the Jungle?', 0),

('Canberra', 'What is the capital city of Australia?', 1),
('Sydney', 'What is the capital city of Australia?', 0),
('Melbourne', 'What is the capital city of Australia?', 0),
('Brisbane', 'What is the capital city of Australia?', 0),

('Pink', 'What color do you get by mixing red and white?', 1),
('Purple', 'What color do you get by mixing red and white?', 0),
('Orange', 'What color do you get by mixing red and white?', 0),
('Brown', 'What color do you get by mixing red and white?', 0),

('7', 'How many continents are there?', 1),
('5', 'How many continents are there?', 0),
('6', 'How many continents are there?', 0),
('8', 'How many continents are there?', 0);

-- Insert Sports Questions
INSERT INTO Questions (question_text, category_name) VALUES
('How many players are there in a soccer team?', 'Sports'),
('Which country won the first FIFA World Cup?', 'Sports'),
('In tennis, what is the term for zero points?', 'Sports'),
('How long is an Olympic swimming pool?', 'Sports'),
('Which sport uses a puck?', 'Sports');

INSERT INTO Answers (answer_text, question_text, is_correct) VALUES
('11', 'How many players are there in a soccer team?', 1),
('9', 'How many players are there in a soccer team?', 0),
('10', 'How many players are there in a soccer team?', 0),
('12', 'How many players are there in a soccer team?', 0),

('Uruguay', 'Which country won the first FIFA World Cup?', 1),
('Brazil', 'Which country won the first FIFA World Cup?', 0),
('Argentina', 'Which country won the first FIFA World Cup?', 0),
('Germany', 'Which country won the first FIFA World Cup?', 0),

('Love', 'In tennis, what is the term for zero points?', 1),
('Zero', 'In tennis, what is the term for zero points?', 0),
('Nil', 'In tennis, what is the term for zero points?', 0),
('Blank', 'In tennis, what is the term for zero points?', 0),

('50 meters', 'How long is an Olympic swimming pool?', 1),
('25 meters', 'How long is an Olympic swimming pool?', 0),
('100 meters', 'How long is an Olympic swimming pool?', 0),
('75 meters', 'How long is an Olympic swimming pool?', 0),

('Ice Hockey', 'Which sport uses a puck?', 1),
('Basketball', 'Which sport uses a puck?', 0),
('Baseball', 'Which sport uses a puck?', 0),

('Cricket', 'Which sport uses a puck?', 0);
-- [Tze Wei] - [Birthday Reminder Table] - [Last Modified Date: 2025-07-12]
CREATE TABLE Birthdays (
    birthdayId INT PRIMARY KEY IDENTITY(1,1),
    userId INT NOT NULL,                         
    firstName VARCHAR(50) NOT NULL,              
    lastName VARCHAR(50),
    birthDate DATE NOT NULL,
    relationship VARCHAR(50),                    
    notes TEXT,                                   
    FOREIGN KEY (userId) REFERENCES Users(userId)
);
-- Sample data for Birthdays table
INSERT INTO Birthdays (userId, firstName, lastName, birthDate, relationship, notes) VALUES
-- userId, firstName, lastName, birthDate, relationship, notes
(1, 'John', 'Doe', '1990-05-12', 'Friend', 'Loves hiking and camping'),
(1, 'Mary', 'Smith', '1988-11-23', 'Colleague', 'Worked together at ABC Corp'),
(2, 'Alex', 'Johnson', '2000-02-29', 'Sibling', 'Close since childhood'),
(2, 'Sophia', 'Lee', '1995-07-04', 'Partner', 'Met in university'),
(3, 'Michael', NULL, '1982-12-31', 'Uncle', 'Lives in Australia'),
(3, 'Emma', 'Brown', '2010-09-15', 'Daughter', NULL);



-- [Danish] - [added caretaker adatabase] - [9/7/2025]
CREATE TABLE Caretaker (
    id INT PRIMARY KEY, -- References Users.userId
    telegram_name NVARCHAR(100) NOT NULL,
    chat_id BIGINT NOT NULL,
    CONSTRAINT FK_Caretaker_Users FOREIGN KEY (id) REFERENCES Users(userId)
);
INSERT INTO Users (name, email, password, date_of_birth)
VALUES ('Emily Wong', 'emily@example.com', 'hashed_pw_123', '1992-06-15');


-- [Danish] - [added hospitals adatabase] - [17/7/2025]
CREATE TABLE Hospitals (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name VARCHAR(100),
    address VARCHAR(255),
    latitude DECIMAL(9,6),
    longitude DECIMAL(9,6),
    ownership VARCHAR(20),
    emergency_services BIT,
    services TEXT,
    rating DECIMAL(2,1),
    telephone VARCHAR(20)
);

INSERT INTO Hospitals (name, address, latitude, longitude, ownership, emergency_services, services, rating, telephone)
VALUES
-- Public Acute & Specialist Hospitals
('Singapore General Hospital', 'Outram Road, Singapore 169608', 1.279300, 103.834400, 'Public', 1,
 'Acute care, emergency, specialist services, national centers, surgery, cardiology, oncology, orthopedics, plastic surgery, liver transplant, ICU, operating theatres, radiology, pharmacy, health screening, ambulance service',
 4.5, '6321 4377'),

('Tan Tock Seng Hospital', '11 Jalan Tan Tock Seng, Singapore 308433', 1.321900, 103.846200, 'Public', 1,
 'General acute, trauma, infectious diseases, geriatrics, emergency, isolation ward, internal medicine, outpatient services, diagnostics, rehabilitation',
 4.3, '6256 6011'),

('National University Hospital', '5 Lower Kent Ridge Road, Singapore 119074', 1.293100, 103.783400, 'Public', 1,
 'General acute, surgical, oncology, cardiology, pediatrics, cancer treatment, heart centre, specialist clinics, operating theatres, ICU, imaging services',
 4.4, '6779 5555'),

('Changi General Hospital', '2 Simei Street 3, Singapore 529889', 1.341800, 103.953400, 'Public', 1,
 'General acute, emergency, geriatrics, rehabilitation, diagnostics, surgery, outpatient clinics',
 4.2, '6850 3333'),

('Khoo Teck Puat Hospital', '90 Yishun Central, Singapore 768828', 1.424500, 103.838800, 'Public', 1,
 'Acute care, emergency, internal medicine, surgery, diagnostics, outpatient services, physiotherapy',
 4.3, '6555 8000'),

('Sengkang General Hospital', '110 Sengkang East Way, Singapore 544886', 1.393800, 103.897700, 'Public', 1,
 'Acute care, surgical, internal medicine, rehabilitation, specialist clinics, imaging',
 4.1, '6930 6000'),

('Ng Teng Fong General Hospital', '1 Jurong East Street 21, Singapore 609606', 1.333300, 103.743000, 'Public', 1,
 'Acute care, emergency, multispecialty, surgery, outpatient clinics, diagnostics',
 4.2, '6716 2000'),

('KK Women''s and Children''s Hospital', '100 Bukit Timah Road, Singapore 229899', 1.313800, 103.845200, 'Public', 1,
 'Obstetrics, gynecology, pediatrics, neonatology, adolescent medicine, fertility, emergency for women and children',
 4.5, '6225 5554'),

('Alexandra Hospital', '378 Alexandra Road, Singapore 159964', 1.288700, 103.803000, 'Public', 1,
 'Urgent care, internal medicine, community care, geriatric services, rehabilitation',
 4.0, '6908 2222'),

('Woodlands Health Campus', '2 Woodlands Drive 17, Singapore 737754', 1.442300, 103.796900, 'Public', 1,
 'Emergency, general medicine, rehabilitation, specialist outpatient services, diagnostics',
 4.1, '6363 8000'),

-- Public Psychiatric Hospital
('Institute of Mental Health', '10 Buangkok View, Singapore 539747', 1.382200, 103.879800, 'Public', 0,
 'Psychiatric care, inpatient and outpatient mental health, geriatrics, addiction treatment, counselling',
 4.0, '6389 2000'),

-- Private Hospitals
('Mount Elizabeth Hospital (Orchard)', '3 Mount Elizabeth, Singapore 228510', 1.305400, 103.835600, 'Private', 1,
 'Cardiology, oncology, surgery, transplant, emergency, specialist clinics, diagnostics, imaging',
 4.6, '6737 2666'),

('Mount Elizabeth Novena Hospital', '38 Irrawaddy Road, Singapore 329563', 1.321900, 103.844200, 'Private', 1,
 'Specialist services, surgical care, diagnostics, cardiology, gastroenterology, neurology, orthopedics',
 4.5, '6898 6898'),

('Gleneagles Hospital', '6A Napier Road, Singapore 258500', 1.305200, 103.822100, 'Private', 1,
 'Cardiology, gastroenterology, oncology, surgery, diagnostics, emergency, imaging',
 4.4, '6473 7222'),

('Raffles Hospital', '585 North Bridge Road, Singapore 188770', 1.302700, 103.860800, 'Private', 1,
 'General surgery, emergency, diagnostics, specialist services, executive health screening',
 4.3, '6311 1111'),

('Parkway East Hospital', '321 Joo Chiat Place, Singapore 427990', 1.313500, 103.905800, 'Private', 1,
 'General medicine, orthopedics, emergency, surgery, diagnostics, ENT, health screening',
 4.2, '6344 7588'),

('Farrer Park Hospital', '1 Farrer Park Station Road, Singapore 217562', 1.312300, 103.854500, 'Private', 1,
 'Multispecialty, surgical, imaging, emergency, specialist outpatient clinics, medical aesthetics',
 4.3, '6363 1818'),

('Thomson Medical Centre', '339 Thomson Road, Singapore 307677', 1.324400, 103.842400, 'Private', 1,
 'Obstetrics, pediatrics, general medicine, urgent care, fertility centre, specialist services',
 4.4, '6250 2222'),

('Mount Alvernia Hospital', '820 Thomson Road, Singapore 574623', 1.344100, 103.839600, 'Not-for-Profit', 1,
 'General medicine, pediatrics, maternity, urgent care centre, diagnostics, outpatient clinics',
 4.5, '6347 6688'),

('Crawfurd Hospital', '339 Changi Road, Singapore 419821', 1.318500, 103.909700, 'Private', 0,
 'Day surgery, wellness, rehabilitation, diagnostics, preventive health, specialist consultation',
 4.0, '6344 2333');

-- [Dev] - [Topics Learner table for user-generated content] - [2025-07-17]
CREATE TABLE Topics (
    id INT IDENTITY(1,1) PRIMARY KEY,
    userId INT NOT NULL,
    title NVARCHAR(255) NOT NULL,
    content NTEXT NOT NULL,
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('text', 'image', 'video')),
    category VARCHAR(50) NOT NULL DEFAULT 'general',
    description NTEXT,
    tags NTEXT, -- JSON array of tags
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT FK_Topics_Users FOREIGN KEY (userId) REFERENCES Users(userId) ON DELETE CASCADE
);
-- Dev Topic Learner
CREATE TABLE TopicLikes (
    id INT IDENTITY(1,1) PRIMARY KEY,
    topicId INT NOT NULL,
    userId INT NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT FK_TopicLikes_Topics FOREIGN KEY (topicId) REFERENCES Topics(id) ON DELETE CASCADE,
    CONSTRAINT FK_TopicLikes_Users FOREIGN KEY (userId) REFERENCES Users(userId) ON DELETE NO ACTION,
    CONSTRAINT UQ_TopicLikes UNIQUE (topicId, userId)
);

-- Dev Topic Learner
CREATE TABLE TopicComments (
    id INT IDENTITY(1,1) PRIMARY KEY,
    topicId INT NOT NULL,
    userId INT NOT NULL,
    comment NVARCHAR(1000) NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT FK_TopicComments_Topics FOREIGN KEY (topicId) REFERENCES Topics(id) ON DELETE CASCADE,
    CONSTRAINT FK_TopicComments_Users FOREIGN KEY (userId) REFERENCES Users(userId) ON DELETE NO ACTION
);

-- Sample data for Topics table
INSERT INTO Topics (userId, title, content, content_type, category, description, tags) VALUES
(1, 'Introduction to JavaScript Promises', 'JavaScript Promises are a powerful way to handle asynchronous operations. They provide a clean alternative to callback functions and help avoid callback hell. A Promise represents a value that may be available now, in the future, or never.', 'text', 'technology', 'A comprehensive guide to understanding and using JavaScript Promises', '["javascript", "promises", "async", "programming"]'),
(2, 'Healthy Morning Routine', 'Starting your day with a healthy routine can significantly improve your productivity and well-being. Here are some key practices: 1. Wake up early and get sunlight exposure, 2. Drink water immediately, 3. Exercise or stretch, 4. Eat a nutritious breakfast, 5. Practice mindfulness or meditation.', 'text', 'health', 'A guide to building a healthy and productive morning routine', '["health", "morning", "routine", "wellness"]'),
(3, 'React Best Practices', 'When developing React applications, following best practices ensures maintainable and performant code. Key practices include: using functional components with hooks, proper state management, avoiding prop drilling, and implementing proper error boundaries.', 'text', 'technology', 'Essential best practices for React development', '["react", "best-practices", "frontend", "development"]'),
(1, 'Beautiful Sunset Photo', '/uploads/topics/sunset_2025_001.jpg', 'image', 'photography', 'A stunning sunset captured during my vacation in Bali', '["sunset", "photography", "bali", "nature"]'),
(2, 'Cooking Tutorial Video', '/uploads/topics/pasta_recipe_2025_002.mp4', 'video', 'cooking', 'Step-by-step guide to making authentic Italian pasta', '["cooking", "pasta", "italian", "tutorial"]'),
(3, 'Mountain Hiking Adventure', '/uploads/topics/mountain_hike_2025_003.jpg', 'image', 'travel', 'Epic mountain hiking experience with breathtaking views', '["hiking", "mountain", "adventure", "nature"]');

-- [Assistant] - [Topic Likes table for tracking user likes] - [2025-07-17]
-- Add like_count column to Topics table
ALTER TABLE Topics ADD like_count INT DEFAULT 0;

-- Create TopicLikes table
CREATE TABLE TopicLikes (
    id INT IDENTITY(1,1) PRIMARY KEY,
    topicId INT NOT NULL,
    userId INT NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT FK_TopicLikes_Topics FOREIGN KEY (topicId) REFERENCES Topics(id) ON DELETE CASCADE,
    CONSTRAINT FK_TopicLikes_Users FOREIGN KEY (userId) REFERENCES Users(userId) ON DELETE CASCADE,
    CONSTRAINT UQ_TopicLikes UNIQUE (topicId, userId) -- Prevent duplicate likes
);

-- Sample data for TopicLikes table
INSERT INTO TopicLikes (topicId, userId) VALUES
(1, 2), -- User 2 likes topic 1
(1, 3), -- User 3 likes topic 1
(2, 1), -- User 1 likes topic 2
(2, 3), -- User 3 likes topic 2
(3, 1), -- User 1 likes topic 3
(4, 2), -- User 2 likes topic 4
(5, 1), -- User 1 likes topic 5
(5, 3), -- User 3 likes topic 5
(6, 1), -- User 1 likes topic 6
(6, 2); -- User 2 likes topic 6

-- Update like counts in Topics table
UPDATE Topics SET like_count = 2 WHERE id = 1;
UPDATE Topics SET like_count = 2 WHERE id = 2;
UPDATE Topics SET like_count = 1 WHERE id = 3;
UPDATE Topics SET like_count = 1 WHERE id = 4;
UPDATE Topics SET like_count = 2 WHERE id = 5;
UPDATE Topics SET like_count = 2 WHERE id = 6;

-- [Tze Wei] - [Meal and Meal Plan Tables] - [Last Modified Date: 2025-07-20]
CREATE TABLE Meals (
    MealID INT PRIMARY KEY IDENTITY(1,1),
    UserID INT FOREIGN KEY REFERENCES Users(userId),
    MealName NVARCHAR(100) NOT NULL,
    Category NVARCHAR(50),
    Instructions NVARCHAR(MAX),
    SpoonacularID INT NULL,
    Ingredients NVARCHAR(MAX) NULL,
    Servings INT DEFAULT 4,
    ReadyInMinutes INT NULL,
    ImageUrl NVARCHAR(500) NULL
);
Meal Plan Table:
CREATE TABLE MealPlan (
  PlanID INT IDENTITY(1,1) PRIMARY KEY,
  UserID INT NOT NULL,
  MealID INT NOT NULL,
  DayOfWeek NVARCHAR(10) NOT NULL,
  MealTime NVARCHAR(20) NOT NULL
);
-- For foreign keys of Meal Plan Table:
ALTER TABLE MealPlan
  ADD CONSTRAINT FK_MealPlan_UserID FOREIGN KEY (UserID) REFERENCES Users(userId);

ALTER TABLE MealPlan
  ADD CONSTRAINT FK_MealPlan_MealID FOREIGN KEY (MealID) REFERENCES Meals(MealID);

-- [Tze Wei] - [Grocery List Tables] - [Last Modified Date: 2025-07-20]
CREATE TABLE GroceryItems (
    item_id INT IDENTITY(1,1) PRIMARY KEY,
    item_name VARCHAR(255) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit VARCHAR(20) DEFAULT 'pcs',
    bought BIT DEFAULT 0,
    user_id INT NOT NULL,
    date_added DATE DEFAULT GETDATE(),
    notes VARCHAR(500),
    price DECIMAL(10,2) DEFAULT 0.00
);
ALTER TABLE GroceryItems 
ADD CONSTRAINT FK_GroceryItems_Users 
FOREIGN KEY (user_Id) REFERENCES Users(userId);

