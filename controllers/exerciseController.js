const ExerciseController = {
    async getExercises(req, res) {
        try {
            const apiKey = process.env.EXERCISEDB_API_KEY;
            
            if (!apiKey) {
                console.log('ExerciseDB API key not found, using local exercises');
                return res.json({
                    success: true,
                    exercises: this.getLocalExercises(),
                    source: 'local'
                });
            }

            const limit = req.query.limit || 50;
            const response = await fetch(`https://exercisedb.p.rapidapi.com/exercises?limit=${limit}`, {
                headers: {
                    'X-RapidAPI-Key': apiKey,
                    'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com'
                }
            });

            if (!response.ok) {
                console.log('ExerciseDB API call failed, using local exercises');
                return res.json({
                    success: true,
                    exercises: this.getLocalExercises(),
                    source: 'local'
                });
            }

            const data = await response.json();
            
            if (!Array.isArray(data) || data.length === 0) {
                console.log('ExerciseDB API returned invalid data, using local exercises');
                return res.json({
                    success: true,
                    exercises: this.getLocalExercises(),
                    source: 'local'
                });
            }

            const formattedExercises = data.map(exercise => ({
                name: exercise.name,
                type: exercise.bodyPart,
                equipment: exercise.equipment,
                target: exercise.target,
                gifUrl: exercise.gifUrl,
                instructions: exercise.instructions || []
            }));

            res.json({
                success: true,
                exercises: formattedExercises,
                source: 'api'
            });

        } catch (error) {
            console.error('Exercise API error:', error);
            res.json({
                success: true,
                exercises: this.getLocalExercises(),
                source: 'local'
            });
        }
    },

    getLocalExercises() {
        return [
            { 
                name: 'Walking', 
                type: 'cardio', 
                equipment: 'None', 
                target: 'Full body',
                instructions: ['Start with a comfortable pace', 'Maintain good posture', 'Gradually increase duration']
            },
            { 
                name: 'Jogging', 
                type: 'cardio', 
                equipment: 'None', 
                target: 'Full body',
                instructions: ['Warm up with light walking', 'Maintain steady breathing', 'Cool down gradually']
            },
            { 
                name: 'Cycling', 
                type: 'cardio', 
                equipment: 'Bicycle', 
                target: 'Legs',
                instructions: ['Adjust seat height properly', 'Start with easy resistance', 'Keep knees aligned']
            },
            { 
                name: 'Swimming', 
                type: 'cardio', 
                equipment: 'Pool', 
                target: 'Full body',
                instructions: ['Start with basic strokes', 'Focus on breathing technique', 'Build endurance gradually']
            },
            { 
                name: 'Push-ups', 
                type: 'strength', 
                equipment: 'None', 
                target: 'Chest, Arms',
                instructions: ['Keep body in straight line', 'Lower chest to ground', 'Push up explosively']
            },
            { 
                name: 'Squats', 
                type: 'strength', 
                equipment: 'None', 
                target: 'Legs',
                instructions: ['Keep feet shoulder-width apart', 'Lower until thighs parallel', 'Drive through heels to stand']
            },
            { 
                name: 'Planks', 
                type: 'strength', 
                equipment: 'None', 
                target: 'Core',
                instructions: ['Keep body in straight line', 'Engage core muscles', 'Breathe normally']
            },
            { 
                name: 'Lunges', 
                type: 'strength', 
                equipment: 'None', 
                target: 'Legs',
                instructions: ['Step forward with one leg', 'Lower back knee toward ground', 'Push back to starting position']
            },
            { 
                name: 'Yoga', 
                type: 'flexibility', 
                equipment: 'Mat', 
                target: 'Full body',
                instructions: ['Focus on breathing', 'Move slowly between poses', 'Listen to your body']
            },
            { 
                name: 'Stretching', 
                type: 'flexibility', 
                equipment: 'None', 
                target: 'Full body',
                instructions: ['Hold each stretch 15-30 seconds', 'Never stretch to pain', 'Breathe deeply']
            },
            { 
                name: 'Pilates', 
                type: 'flexibility', 
                equipment: 'Mat', 
                target: 'Core',
                instructions: ['Focus on controlled movements', 'Engage core throughout', 'Maintain proper alignment']
            },
            { 
                name: 'Tai Chi', 
                type: 'flexibility', 
                equipment: 'None', 
                target: 'Full body',
                instructions: ['Move slowly and smoothly', 'Focus on balance', 'Coordinate breathing with movement']
            }
        ];
    }
};

module.exports = ExerciseController;
