const hospitalModel = require("../models/hospitalModel");

async function getHopsitals(req,res){
    try{
        const data = await hospitalModel.getHospitals();
        if (!data){
            return res.status(404).json({error: "Data not found"});
        }
        res.json(data);
    }catch(error){
        console.error("Error fetching hospitals",error);
        res.status(500).json({error: "Internal server error"});
    }
}
module.exports = {
    getHopsitals
}