const triviaModel = require("../models/triviaModel");

async function getQuestionsByCategory(req,res){
    try{
        const categoryName = req.params.categoryName;
        const category = await triviaModel.getQuestionsByCategory(categoryName);
        if (!category){
            return res.status(404).json({error: "Category not found"});
        }
        res.json(category);
    }catch(error){
        console.error("Error fetching question",error);
        res.status(500).json({error: "Internal server error"});
    }
}

async function getOptionsByQuestion(req,res){
    try{
        const questionText = req.params.questionText;
        const options = await triviaModel.getOptionsByQuestion(questionText);
        if (!options){
            return res.status(404).json({error: "Options not found"});
        }
        res.json(options);
    }catch(error){
        console.error("Error fetching options",error);
        res.status(500).json({error: "Internal server error"});
    }
}


module.exports = {
    getQuestionsByCategory,
    getOptionsByQuestion
}