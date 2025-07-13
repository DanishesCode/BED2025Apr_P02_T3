-- Migration: Change appointmentTime from TIME to VARCHAR(10)
-- Run this script to update existing database schema

USE EaseForLifeDB;

-- Check if appointmentTime column exists and is TIME type
IF EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'Appointments' 
    AND COLUMN_NAME = 'appointmentTime'
    AND DATA_TYPE = 'time'
)
BEGIN
    -- Create a temporary column
    ALTER TABLE Appointments ADD appointmentTime_new VARCHAR(10);
    
    -- Copy data from old column to new column (convert TIME to string)
    UPDATE Appointments 
    SET appointmentTime_new = CONVERT(VARCHAR(10), appointmentTime, 108);
    
    -- Drop the old column
    ALTER TABLE Appointments DROP COLUMN appointmentTime;
    
    -- Rename the new column
    EXEC sp_rename 'Appointments.appointmentTime_new', 'appointmentTime', 'COLUMN';
    
    PRINT 'appointmentTime column changed from TIME to VARCHAR(10) successfully';
END
ELSE
BEGIN
    PRINT 'appointmentTime column is already VARCHAR or does not exist';
END 