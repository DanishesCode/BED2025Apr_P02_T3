class WeightTracker {
    constructor() {
        this.weightHistory = [];
        this.exercises = [];
        this.currentFilter = 'all';
        this.init();
    }

    init() {
        this.loadWeightHistory();
        this.setupEventListeners();
        this.loadExercises();
    }

    setupEventListeners() {
        const weightForm = document.getElementById('weightForm');
        weightForm.addEventListener('submit', (e) => this.handleWeightSubmit(e));

        // Exercise filter buttons
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.filterExercises(e.target.dataset.type));
        });
    }

    handleWeightSubmit(e) {
        e.preventDefault();
        
        const currentWeight = parseFloat(document.getElementById('currentWeight').value);
        const height = parseFloat(document.getElementById('height').value);
        const goalWeight = parseFloat(document.getElementById('goalWeight').value);
        const age = parseInt(document.getElementById('age').value);

        if (!currentWeight || !height || !goalWeight || !age) {
            alert('Please fill in all fields');
            return;
        }

        // Calculate BMI
        const currentBMI = this.calculateBMI(currentWeight, height);
        const goalBMI = this.calculateBMI(goalWeight, height);
        const weightDifference = goalWeight - currentWeight;

        // Save to history
        this.saveWeightEntry(currentWeight, height, age);

        // Display results
        this.displayBMIResults(currentBMI, goalBMI, weightDifference);
        this.updateProgressChart();
        this.updateWeightHistory();
        this.showExerciseRecommendations(age, currentBMI);

        // Reset form
        e.target.reset();
    }

    calculateBMI(weight, height) {
        // Convert height from cm to meters
        const heightInMeters = height / 100;
        return (weight / (heightInMeters * heightInMeters)).toFixed(1);
    }

    getBMICategory(bmi) {
        bmi = parseFloat(bmi);
        if (bmi < 18.5) return 'underweight';
        if (bmi < 25) return 'normal';
        if (bmi < 30) return 'overweight';
        return 'obese';
    }

    displayBMIResults(currentBMI, goalBMI, weightDifference) {
        const bmiResults = document.getElementById('bmiResults');
        const bmiNumber = document.getElementById('bmiNumber');
        const bmiCategory = document.getElementById('bmiCategory');
        const currentBMISpan = document.getElementById('currentBMI');
        const goalBMISpan = document.getElementById('goalBMI');
        const weightDifferenceSpan = document.getElementById('weightDifference');

        bmiNumber.textContent = currentBMI;
        currentBMISpan.textContent = currentBMI;
        goalBMISpan.textContent = goalBMI;
        weightDifferenceSpan.textContent = weightDifference > 0 ? `+${weightDifference}` : weightDifference;

        // Set BMI category
        const category = this.getBMICategory(currentBMI);
        bmiCategory.textContent = category.charAt(0).toUpperCase() + category.slice(1);
        bmiCategory.className = `bmi-category ${category}`;

        bmiResults.style.display = 'block';
    }

    saveWeightEntry(weight, height, age) {
        const entry = {
            date: new Date().toISOString().split('T')[0],
            weight: weight,
            height: height,
            age: age,
            bmi: this.calculateBMI(weight, height)
        };

        this.weightHistory.push(entry);
        localStorage.setItem('weightHistory', JSON.stringify(this.weightHistory));
    }

    loadWeightHistory() {
        const saved = localStorage.getItem('weightHistory');
        if (saved) {
            this.weightHistory = JSON.parse(saved);
        }
    }

    updateWeightHistory() {
        const tbody = document.getElementById('weightHistoryBody');
        tbody.innerHTML = '';

        // Show last 10 entries
        const recentEntries = this.weightHistory.slice(-10).reverse();

        recentEntries.forEach((entry, index) => {
            const row = document.createElement('tr');
            
            // Calculate weight change
            let weightChange = '';
            let changeClass = 'neutral';
            
            if (index < recentEntries.length - 1) {
                const prevWeight = recentEntries[index + 1].weight;
                const change = entry.weight - prevWeight;
                weightChange = change > 0 ? `+${change.toFixed(1)}` : change.toFixed(1);
                changeClass = change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral';
            }

            row.innerHTML = `
                <td>${entry.date}</td>
                <td>${entry.weight} kg</td>
                <td>${entry.bmi}</td>
                <td class="weight-change ${changeClass}">${weightChange}</td>
            `;
            tbody.appendChild(row);
        });
    }

    updateProgressChart() {
        const canvas = document.getElementById('weightChart');
        const ctx = canvas.getContext('2d');

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (this.weightHistory.length === 0) return;

        const recentEntries = this.weightHistory.slice(-7); // Last 7 entries
        const weights = recentEntries.map(entry => entry.weight);
        const dates = recentEntries.map(entry => entry.date);

        // Get goal weight from form
        const goalWeight = parseFloat(document.getElementById('goalWeight').value) || weights[weights.length - 1];

        // Chart dimensions
        const padding = 40;
        const chartWidth = canvas.width - 2 * padding;
        const chartHeight = canvas.height - 2 * padding;

        // Find min and max values
        const minWeight = Math.min(...weights, goalWeight) - 5;
        const maxWeight = Math.max(...weights, goalWeight) + 5;
        const weightRange = maxWeight - minWeight;

        // Draw axes
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, canvas.height - padding);
        ctx.lineTo(canvas.width - padding, canvas.height - padding);
        ctx.stroke();

        // Draw weight line
        ctx.strokeStyle = '#667eea';
        ctx.lineWidth = 3;
        ctx.beginPath();
        
        weights.forEach((weight, index) => {
            const x = padding + (index / (weights.length - 1)) * chartWidth;
            const y = canvas.height - padding - ((weight - minWeight) / weightRange) * chartHeight;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();

        // Draw goal line
        ctx.strokeStyle = '#48bb78';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(padding, canvas.height - padding - ((goalWeight - minWeight) / weightRange) * chartHeight);
        ctx.lineTo(canvas.width - padding, canvas.height - padding - ((goalWeight - minWeight) / weightRange) * chartHeight);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw data points
        weights.forEach((weight, index) => {
            const x = padding + (index / (weights.length - 1)) * chartWidth;
            const y = canvas.height - padding - ((weight - minWeight) / weightRange) * chartHeight;
            
            ctx.fillStyle = '#667eea';
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fill();
        });
    }

    async loadExercises() {
        try {
            // Using ExerciseDB API (free, no API key required)
            const response = await fetch('https://exercisedb.p.rapidapi.com/exercises?limit=50', {
                headers: {
                    'X-RapidAPI-Key': 'your-api-key-here', // Optional for basic usage
                    'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com'
                }
            });

            if (!response.ok) {
                // Fallback to local exercise data if API fails
                this.loadLocalExercises();
                return;
            }

            const data = await response.json();
            this.exercises = data.map(exercise => ({
                name: exercise.name,
                type: exercise.bodyPart,
                equipment: exercise.equipment,
                target: exercise.target,
                gifUrl: exercise.gifUrl
            }));

            this.displayExercises();
        } catch (error) {
            console.log('Using local exercise data');
            this.loadLocalExercises();
        }
    }

    loadLocalExercises() {
        // Local exercise data as fallback
        this.exercises = [
            { name: 'Walking', type: 'cardio', equipment: 'None', target: 'Full body' },
            { name: 'Jogging', type: 'cardio', equipment: 'None', target: 'Full body' },
            { name: 'Cycling', type: 'cardio', equipment: 'Bicycle', target: 'Legs' },
            { name: 'Swimming', type: 'cardio', equipment: 'Pool', target: 'Full body' },
            { name: 'Push-ups', type: 'strength', equipment: 'None', target: 'Chest, Arms' },
            { name: 'Squats', type: 'strength', equipment: 'None', target: 'Legs' },
            { name: 'Planks', type: 'strength', equipment: 'None', target: 'Core' },
            { name: 'Lunges', type: 'strength', equipment: 'None', target: 'Legs' },
            { name: 'Yoga', type: 'flexibility', equipment: 'Mat', target: 'Full body' },
            { name: 'Stretching', type: 'flexibility', equipment: 'None', target: 'Full body' },
            { name: 'Pilates', type: 'flexibility', equipment: 'Mat', target: 'Core' },
            { name: 'Tai Chi', type: 'flexibility', equipment: 'None', target: 'Full body' }
        ];
        this.displayExercises();
    }

    displayExercises() {
        const grid = document.getElementById('exercisesGrid');
        grid.innerHTML = '';

        this.exercises.forEach(exercise => {
            const card = document.createElement('div');
            card.className = 'exercise-card';
            card.innerHTML = `
                <h3>${exercise.name}</h3>
                <p><strong>Target:</strong> ${exercise.target}</p>
                <p><strong>Equipment:</strong> ${exercise.equipment}</p>
                <span class="exercise-type ${exercise.type}">${exercise.type}</span>
            `;
            grid.appendChild(card);
        });

        document.getElementById('exerciseRecommendations').style.display = 'block';
    }

    filterExercises(type) {
        this.currentFilter = type;
        
        // Update filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-type="${type}"]`).classList.add('active');

        // Filter exercises
        const grid = document.getElementById('exercisesGrid');
        grid.innerHTML = '';

        const filteredExercises = type === 'all' 
            ? this.exercises 
            : this.exercises.filter(exercise => exercise.type === type);

        filteredExercises.forEach(exercise => {
            const card = document.createElement('div');
            card.className = 'exercise-card';
            card.innerHTML = `
                <h3>${exercise.name}</h3>
                <p><strong>Target:</strong> ${exercise.target}</p>
                <p><strong>Equipment:</strong> ${exercise.equipment}</p>
                <span class="exercise-type ${exercise.type}">${exercise.type}</span>
            `;
            grid.appendChild(card);
        });
    }

    showExerciseRecommendations(age, bmi) {
        const category = this.getBMICategory(bmi);
        let recommendedType = 'cardio';

        // Age-based recommendations
        if (age < 30) {
            recommendedType = 'strength';
        } else if (age < 50) {
            recommendedType = 'cardio';
        } else {
            recommendedType = 'flexibility';
        }

        // BMI-based adjustments
        if (category === 'overweight' || category === 'obese') {
            recommendedType = 'cardio';
        }

        // Auto-filter to recommended type
        this.filterExercises(recommendedType);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new WeightTracker();
}); 