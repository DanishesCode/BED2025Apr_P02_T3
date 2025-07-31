class WeightTracker {
    constructor() {
        this.weightHistory = [];
        this.exercises = [];
        this.currentFilter = 'all';
        this.chart = null; // For Chart.js instance
        this.apiBaseUrl = 'http://localhost:3000'; // Backend server URL
        this.init();
    }

    async init() {
        // Set default date to today
        document.getElementById('weightDate').value = new Date().toISOString().split('T')[0];
        
        // Debug: Check authentication
        this.checkAuth();
        
        await this.loadWeightHistory();
        this.setupEventListeners();
        this.loadExercises();
        
        // Try to auto-fill age from user profile
        this.loadUserProfile();
    }

    checkAuth() {
        const authToken = localStorage.getItem('authToken');
        const currentUser = localStorage.getItem('currentUser');
        
        console.log('Auth Status:', {
            hasToken: !!authToken,
            hasUser: !!currentUser,
            tokenPreview: authToken ? authToken.substring(0, 20) + '...' : 'None'
        });
        
        if (!authToken) {
            this.showError('Please log in to use the weight tracker. Redirecting to login page...');
            setTimeout(() => {
                window.location.href = '/login/login.html';
            }, 3000);
        }
    }

    async loadUserProfile() {
        try {
            // Try to load user profile and show age info if available
            const currentUser = localStorage.getItem('currentUser');
            if (currentUser) {
                const user = JSON.parse(currentUser);
                if (user.date_of_birth) {
                    const age = await this.getUserAge();
                    console.log(`User age calculated: ${age} years`);
                    
                    // You could display this in the UI if needed
                    // const ageDisplay = document.getElementById('ageDisplay');
                    // if (ageDisplay) ageDisplay.textContent = `Age: ${age} years`;
                }
            }
        } catch (e) {
            console.log('Could not load user profile');
        }
    }

    showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        
        // Hide success message if shown
        document.getElementById('successMessage').style.display = 'none';
        
        // Scroll to error message
        errorDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    showSuccess(message) {
        const successDiv = document.getElementById('successMessage');
        successDiv.textContent = message;
        successDiv.style.display = 'block';
        
        // Hide error message if shown
        document.getElementById('errorMessage').style.display = 'none';
        
        // Auto-hide success message after 3 seconds
        setTimeout(() => {
            successDiv.style.display = 'none';
        }, 3000);
    }

    hideMessages() {
        document.getElementById('errorMessage').style.display = 'none';
        document.getElementById('successMessage').style.display = 'none';
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

    async handleWeightSubmit(e) {
        e.preventDefault();
        
        // Clear previous messages
        this.hideMessages();
        
        const weightDate = document.getElementById('weightDate').value;
        const currentWeight = parseFloat(document.getElementById('currentWeight').value);
        const height = parseFloat(document.getElementById('height').value);
        const goalWeight = parseFloat(document.getElementById('goalWeight').value);

        // Validate all fields are filled
        if (!weightDate || !currentWeight || !height || !goalWeight) {
            this.showError('Please fill in all fields');
            return;
        }

        // Validate date
        const selectedDate = new Date(weightDate);
        const today = new Date();
        today.setHours(23, 59, 59, 999); // Set to end of today
        if (selectedDate > today) {
            this.showError('Date cannot be in the future');
            return;
        }

        // Validate numeric values
        if (currentWeight <= 0 || currentWeight > 1000) {
            this.showError('Weight must be between 1 and 1000 kg');
            return;
        }

        if (height <= 50 || height > 300) {
            this.showError('Height must be between 50 and 300 cm');
            return;
        }

        if (goalWeight <= 0 || goalWeight > 1000) {
            this.showError('Goal weight must be between 1 and 1000 kg');
            return;
        }

        // Calculate BMI
        const currentBMI = this.calculateBMI(currentWeight, height);
        const goalBMI = this.calculateBMI(goalWeight, height);
        const weightDifference = goalWeight - currentWeight;

        // Prepare data for backend (no age needed - calculated server-side)
        const entry = {
            date: weightDate,
            weight: currentWeight,
            height: height,
            bmi: parseFloat(currentBMI)
        };

        try {
            // Check if user is authenticated
            const authToken = localStorage.getItem('authToken');
            if (!authToken) {
                this.showError('Please log in to save your weight entry');
                return;
            }

            console.log('Making API request to:', `${this.apiBaseUrl}/api/weight`);
            console.log('Request data:', entry);

            const res = await fetch(`${this.apiBaseUrl}/api/weight`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(entry)
            });

            console.log('Response status:', res.status);
            console.log('Response headers:', Object.fromEntries(res.headers.entries()));

            let data;
            try {
                data = await res.json();
                console.log('Response data:', data);
            } catch (jsonError) {
                console.error('JSON parsing error:', jsonError);
                throw new Error('Invalid response from server. Please try again.');
            }
            
            if (!res.ok) {
                throw new Error(data.message || `HTTP error! status: ${res.status}`);
            }

            // Success - get age from response for exercise recommendations
            const calculatedAge = data.data?.age || await this.getUserAge();
            this.showSuccess(data.message || 'Weight entry saved successfully!');
            
            // Reload history from backend
            await this.loadWeightHistory();

            // Display results
            this.displayBMIResults(currentBMI, goalBMI, weightDifference);
            this.updateProgressChart();
            this.updateWeightHistory();
            
            // Show exercise recommendations with calculated age
            if (calculatedAge) {
                this.showExerciseRecommendations(calculatedAge, currentBMI);
            }

            // Reset form
            e.target.reset();
            // Set date to today by default
            document.getElementById('weightDate').value = new Date().toISOString().split('T')[0];

        } catch (err) {
            console.error('Error saving weight entry:', err);
            this.showError(err.message || 'Failed to save weight entry. Please try again.');
        }
    }

    async getUserAge() {
        try {
            // Get age from user's date of birth
            const currentUser = localStorage.getItem('currentUser');
            if (currentUser) {
                const user = JSON.parse(currentUser);
                if (user.date_of_birth) {
                    const dob = new Date(user.date_of_birth);
                    const today = new Date();
                    let age = today.getFullYear() - dob.getFullYear();
                    const m = today.getMonth() - dob.getMonth();
                    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
                        age--;
                    }
                    return age;
                }
            }
            return null;
        } catch (e) {
            console.log('Could not calculate age from user profile');
            return null;
        }
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

    async loadWeightHistory() {
        try {
            const authToken = localStorage.getItem('authToken');
            if (!authToken) {
                console.log('No auth token found, user needs to log in');
                this.weightHistory = [];
                this.updateWeightHistory();
                return;
            }

            const res = await fetch(`${this.apiBaseUrl}/api/weight`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            if (!res.ok) {
                if (res.status === 401 || res.status === 403) {
                    // Token expired or invalid
                    localStorage.removeItem('authToken');
                    throw new Error('Session expired. Please log in again.');
                }
                throw new Error(`HTTP error! status: ${res.status}`);
            }

            let data;
            try {
                data = await res.json();
            } catch (jsonError) {
                // Check if response is empty (no content)
                const text = await res.text();
                if (!text) {
                    throw new Error('No data received from server.');
                }
                throw new Error('Invalid response format from server.');
            }
            
            if (data.success && data.history && Array.isArray(data.history)) {
                this.weightHistory = data.history.map(entry => ({
                    date: entry.date.split('T')[0], // Format date properly
                    weight: entry.weight,
                    height: entry.height,
                    age: entry.age,
                    bmi: entry.bmi
                }));
            } else {
                this.weightHistory = [];
            }
            
            this.updateWeightHistory();
            this.updateProgressChart();
            
        } catch (err) {
            console.error('Error loading weight history:', err);
            this.weightHistory = [];
            this.updateWeightHistory();
            
            // Only show error if it's not just missing data
            if (err.message.includes('log in')) {
                this.showError(err.message);
            }
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

        // Destroy existing chart if it exists
        if (this.chart) {
            this.chart.destroy();
        }

        if (this.weightHistory.length === 0) {
            // Show empty state
            ctx.fillStyle = '#666';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('No weight data to display', canvas.width / 2, canvas.height / 2);
            return;
        }

        // Prepare data for Chart.js
        const sortedHistory = this.weightHistory.sort((a, b) => new Date(a.date) - new Date(b.date));
        const labels = sortedHistory.map(entry => {
            const date = new Date(entry.date);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });
        const weights = sortedHistory.map(entry => entry.weight);
        
        // Get goal weight from form or use target weight
        const goalWeightInput = document.getElementById('goalWeight');
        const goalWeight = goalWeightInput && goalWeightInput.value ? 
            parseFloat(goalWeightInput.value) : 
            weights[weights.length - 1]; // fallback to current weight

        // Create goal line data (same value for all dates)
        const goalData = new Array(labels.length).fill(goalWeight);

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Weight (kg)',
                        data: weights,
                        borderColor: '#667eea',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: '#667eea',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 6,
                        pointHoverRadius: 8
                    },
                    {
                        label: 'Goal Weight (kg)',
                        data: goalData,
                        borderColor: '#48bb78',
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                        borderDash: [10, 5],
                        fill: false,
                        pointRadius: 0,
                        pointHoverRadius: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            padding: 20,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        cornerRadius: 8,
                        callbacks: {
                            label: function(context) {
                                if (context.datasetIndex === 0) {
                                    const weight = context.parsed.y;
                                    const entry = sortedHistory[context.dataIndex];
                                    return `Weight: ${weight} kg (BMI: ${entry.bmi})`;
                                }
                                return `Goal: ${context.parsed.y} kg`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Date',
                            font: {
                                size: 12,
                                weight: 'bold'
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Weight (kg)',
                            font: {
                                size: 12,
                                weight: 'bold'
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        beginAtZero: false,
                        min: Math.min(...weights, goalWeight) - 5,
                        max: Math.max(...weights, goalWeight) + 5
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
    }

    async loadExercises() {
        try {
            const response = await fetch('https://exercisedb.p.rapidapi.com/exercises?limit=50', {
                headers: {
                    'X-RapidAPI-Key': '2ff47c855amshd24d8991b878e49p1682dfjsn4660081b250d',
                    'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com'
                }
            });
            if (!response.ok) {
                this.loadLocalExercises();
                return;
            }
            const data = await response.json();
            if (!Array.isArray(data) || data.length === 0) {
                this.loadLocalExercises();
                return;
            }
            this.exercises = data.map(exercise => ({
                name: exercise.name,
                type: exercise.bodyPart, // bodyPart is the main category
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

        // Map filter type to ExerciseDB bodyPart(s)
        let filteredExercises = [];
        if (type === 'all') {
            filteredExercises = this.exercises;
        } else if (type === 'cardio') {
            filteredExercises = this.exercises.filter(ex => ex.type && ex.type.toLowerCase() === 'cardio');
        } else if (type === 'strength') {
            // Strength: upper arms, lower arms, chest, upper legs, lower legs, back, shoulders
            const strengthParts = [
                'upper arms', 'lower arms', 'chest', 'upper legs', 'lower legs', 'back', 'shoulders', 'forearms', 'traps', 'neck'
            ];
            filteredExercises = this.exercises.filter(ex => ex.type && strengthParts.includes(ex.type.toLowerCase()));
        } else if (type === 'flexibility') {
            // Flexibility: waist, lower back, neck, etc.
            const flexibilityParts = [
                'waist', 'lower back', 'neck', 'spine', 'abs', 'adductors', 'abductors', 'calves', 'glutes', 'hamstrings', 'lats', 'pectorals', 'serratus anterior', 'upper back', 'delts', 'levator scapulae'
            ];
            filteredExercises = this.exercises.filter(ex => ex.type && flexibilityParts.includes(ex.type.toLowerCase()));
        }

        const grid = document.getElementById('exercisesGrid');
        grid.innerHTML = '';
        if (filteredExercises.length === 0) {
            grid.innerHTML = '<div class="no-exercises">No exercises found for this category.</div>';
            return;
        }
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