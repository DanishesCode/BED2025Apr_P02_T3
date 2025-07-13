-- Migration: Add consultationType column to Appointments table
-- Run this script to update existing database schema

USE EaseForLifeDB;

-- Add consultationType column to existing Appointments table
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'Appointments' 
    AND COLUMN_NAME = 'consultationType'
)
BEGIN
    ALTER TABLE Appointments 
    ADD consultationType NVARCHAR(50) NOT NULL DEFAULT 'coach';
    
    PRINT 'consultationType column added successfully to Appointments table';
END
ELSE
BEGIN
    PRINT 'consultationType column already exists in Appointments table';
END 