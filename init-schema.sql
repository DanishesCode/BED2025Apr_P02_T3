-- init-schema.sql
-- Created: 07-06-2025
-- Initializes the local MSSQL database schema for the project.

-- Linn - Create ChatHistory table - 07-06-2025
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ChatHistory')
BEGIN
    CREATE TABLE ChatHistory (
        ChatID INT PRIMARY KEY IDENTITY(1,1),
        AccountID INT NOT NULL,
        Sender NVARCHAR(20) NOT NULL CHECK (Sender IN ('user', 'ai')),
        Message NVARCHAR(MAX) NOT NULL,
        SentAt DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (AccountID) REFERENCES Accounts(AccountID)
    );
END;

-- [Your Name] - [What was added] - [Last Modified Date: YYYY-MM-DD]
