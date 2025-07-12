-- Simple fix for Appointments table
-- Run this to recreate the table with simple fields

USE EaseForLifeDB;

-- Drop existing table if it exists
IF OBJECT_ID('Appointments', 'U') IS NOT NULL
    DROP TABLE Appointments;

-- Create simple Appointments table
CREATE TABLE Appointments (
    id INT IDENTITY(1,1) PRIMARY KEY,
    userId INT NOT NULL,
    appointmentDate VARCHAR(10) NOT NULL,
    appointmentTime VARCHAR(10) NOT NULL,
    consultationType VARCHAR(10) NOT NULL,
    createdAt DATETIME DEFAULT GETDATE()
);

PRINT 'Appointments table created successfully with simple fields'; 