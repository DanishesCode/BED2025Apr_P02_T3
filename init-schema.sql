-- init-schema.sql
-- Created: 07-06-2025
-- Initializes the local MSSQL database schema for the project.


-- [Your Name] - [What was added] - [Last Modified Date: YYYY-MM-DD]

CREATE TABLE Users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    email NVARCHAR(100) NOT NULL UNIQUE,
    password NVARCHAR(255) NOT NULL,
    date_of_birth DATE NOT NULL,
    created_at DATETIME NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME NOT NULL DEFAULT GETDATE()
);

-- Sample users for testing
INSERT INTO Users (name, email, password, date_of_birth)
VALUES
('Alice Tan', 'alice@example.com', '$2b$10$Q9n8Qw9b8Qw9b8Qw9b8QwOQ9n8Qw9b8Qw9b8Qw9b8Qw9b8Qw9b8Qw', '2000-01-01'),
('Bob Lee', 'bob@example.com', '$2b$10$Q9n8Qw9b8Qw9b8Qw9b8QwOQ9n8Qw9b8Qw9b8Qw9b8Qw9b8Qw9b8Qw', '1999-05-15');

-- [Your Name] - [What was added] - [Last Modified Date: YYYY-MM-DD]
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

-- [Danish] - [added caretaker adatabase] - [9/7/2025]
CREATE TABLE Caretaker (
    id INT IDENTITY(1,1) PRIMARY KEY,
    telegram_name NVARCHAR(100) NOT NULL,
    chat_id BIGINT NOT NULL
);
