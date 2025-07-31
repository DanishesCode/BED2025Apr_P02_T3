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

    async function getRouteData(req,res){
        try {
            const data = req.body;
            console.log("Received data:", data);
        
            const route = await hospitalModel.getRouteData(data.profile,data.start,data.end);
            console.log("Received route:", route);
        
            if (!route) {
            return res.status(404).json({ error: "route not found." });
            }
        
            res.status(200).json({ route });
        } catch (error) {
            console.error("Controller error in getRouteData:", error.message);
            res.status(500).json({ error: "Failed to fetch route from coordinates given" });
        }
    }
    module.exports = {
        getHopsitals,
        getRouteData
    }