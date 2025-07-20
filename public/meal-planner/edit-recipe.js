// edit-recipe.js
const BASE_URL = "http://localhost:3000";

// Get user ID from localStorage (set during login)
function getUserID() {
  const currentUser = localStorage.getItem('currentUser');
  console.log('Raw currentUser from localStorage:', currentUser);
  
  if (currentUser) {
    try {
      const user = JSON.parse(currentUser);
      console.log('Parsed user object:', user);
      // Try different possible property names for userID
      const userId = user.userId || user.id || user.user_id || user.UserID || 1;
      console.log('Using UserID:', userId);
      console.log('UserID type:', typeof userId);
      return userId;
    } catch (e) {
      console.error('Error parsing user data:', e);
      console.log('Fallback to UserID: 1');
      return 1;
    }
  }
  console.log('No currentUser, fallback to UserID: 1');
  return 1; // Default fallback
}

const UserID = getUserID();

// Helper function to get auth headers
function getAuthHeaders() {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

let currentMealId = null;

// Get meal ID from URL parameters
window.onload = () => {
    // Check authentication first
    const token = localStorage.getItem('authToken');
    if (!token) {
        alert('Please log in to access this page');
        window.location.href = '../login/login.html';
        return;
    }
    
    const urlParams = new URLSearchParams(window.location.search);
    currentMealId = urlParams.get('id');
    
    if (currentMealId) {
        loadMealData(currentMealId);
    } else {
        alert('No recipe ID provided');
        goBack();
    }
};

// Load existing meal data
async function loadMealData(mealId) {
    try {
        const response = await fetch(`${BASE_URL}/meals/${UserID}`, {
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const meals = await response.json();
        console.log('Loaded meals:', meals);
        console.log('Looking for mealId:', mealId);
        
        const meal = meals.find(m => m.MealID == mealId);
        console.log('Found meal:', meal);
        
        if (meal) {
            document.getElementById('mealId').value = meal.MealID;
            document.getElementById('editRecipeName').value = meal.MealName;
            document.getElementById('editRecipeCategory').value = meal.Category;
            document.getElementById('editRecipeInstructions').value = meal.Instructions;
        } else {
            alert('Recipe not found');
            goBack();
        }
    } catch (error) {
        console.error('Error loading meal data:', error);
        alert('Error loading recipe data: ' + error.message);
        goBack();
    }
}

// Handle form submission
document.getElementById('editRecipeForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const mealId = document.getElementById('mealId').value;
    const mealName = document.getElementById('editRecipeName').value.trim();
    const category = document.getElementById('editRecipeCategory').value;
    const instructions = document.getElementById('editRecipeInstructions').value.trim();
    
    // Validation
    if (!mealName || !category || !instructions) {
        alert('Please fill in all fields');
        return;
    }
    
    // Add loading state
    const form = document.getElementById('editRecipeForm');
    form.classList.add('form-loading');
    
    try {
        const response = await fetch(`${BASE_URL}/meals/${mealId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                MealName: mealName,
                Category: category,
                Instructions: instructions
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Add success animation
        form.classList.remove('form-loading');
        form.classList.add('form-success');
        
        // Show success message
        alert('Recipe updated successfully!');
        
        // Redirect back to recipes page
        setTimeout(() => {
            goBack();
        }, 500);
        
    } catch (error) {
        console.error('Error updating recipe:', error);
        form.classList.remove('form-loading');
        alert('Error updating recipe. Please try again.');
    }
});

// Navigate back to recipes page
function goBack() {
    window.location.href = 'meal.html#recipes';
}

// Add input validation feedback
document.getElementById('editRecipeName').addEventListener('blur', validateField);
document.getElementById('editRecipeCategory').addEventListener('change', validateField);
document.getElementById('editRecipeInstructions').addEventListener('blur', validateField);

function validateField(e) {
    const field = e.target;
    const value = field.value.trim();
    const formGroup = field.closest('.form-group');
    
    // Remove existing error state
    formGroup.classList.remove('error');
    const existingError = formGroup.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    // Validate
    if (!value) {
        formGroup.classList.add('error');
        const errorMsg = document.createElement('div');
        errorMsg.className = 'error-message';
        errorMsg.textContent = 'This field is required';
        formGroup.appendChild(errorMsg);
    }
}

// Auto-resize textarea
document.getElementById('editRecipeInstructions').addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = this.scrollHeight + 'px';
});

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        document.getElementById('editRecipeForm').dispatchEvent(new Event('submit'));
    }
    
    if (e.key === 'Escape') {
        goBack();
    }
});

