const sos = require("../models/sosModel");

async function retrieveRecord(req,res){
    const id  = req.params.id
    if(!id){
        return res.status(400).json({message:"Id is required"});
    }

    try{
        const Record = await sos.retrieveRecord(id);
        res.json(Record)
    }
    catch(error){
        console.error("Controller error in retrieveRecord:",error);
        res.status(500).json({message:"Error retrieving record"});
    }
}

async function createRecord(req,res){
    try {
      const id = parseInt(req.params.id)
        const newRecord = await sos.createRecord(id,req.body);
        res.status(201).json(newRecord);
      } catch (error) {
        console.error("Controller error:", error);
        res.status(500).json({ error: "Error creating record" });
      }
}

async function updateRecord(req,res){
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
          return res.status(400).json({ error: "Invalid user ID" });
        }
    
        const updated = await sos.updateRecord(id, req.body);
        if (!updated) {
          return res.status(404).json({ error: "User not found" });
        }
    
        res.status(200).json({ message: "Record updated successfully" });
      } catch (error) {
        console.error("Controller error:", error);
        res.status(500).json({ error: "Error updating Record" });
      }
    }

async function deleteRecord(req,res){
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
          return res.status(400).json({ error: "Invalid user ID" });
        }
    
        const deleted = await sos.deleteData(id);
        if (!deleted) {
          return res.status(404).json({ error: "Record not found" });
        }
    
        res.status(200).json({ message: "Record deleted successfully" });
      } catch (error) {
        console.error("Controller error:", error);
        res.status(500).json({ error: "Error deleting record" });
      }
}

async function convertLocation(req,res){
  
}

module.exports = {
    retrieveRecord,
    createRecord,
    updateRecord,
    deleteRecord
}