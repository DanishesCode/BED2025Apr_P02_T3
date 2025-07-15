// script.js
const BASE_URL = "http://localhost:3000"; // Change if different
const UserID = 1; // Change based on logged-in user

let allMeals = [];
let mealPlan = [];
let selectedSlotId = "";

window.onload = () => {
  loadPlanner();
  loadRecipes();
  
  // Check if we need to show a specific section from URL hash
  const hash = window.location.hash.substring(1);
  if (hash) {
    showSection(hash);
  }
};

async function fetchMeals() {
  const res = await fetch(`${BASE_URL}/meals/${UserID}`);
  return res.json();
}

async function fetchMealPlan() {
  const res = await fetch(`${BASE_URL}/mealplans/${UserID}`);
  return res.json();
}

async function loadPlanner() {
  mealPlan = await fetchMealPlan();
  mealPlan.forEach(item => {
    const slotId = `${item.DayOfWeek.toLowerCase()}-${item.MealTime.toLowerCase()}`;
    const textEl = document.getElementById(`${slotId}-text`);
    if (textEl) {
      textEl.textContent = item.MealName;
    }
  });
  document.getElementById('plannedMeals').textContent = mealPlan.length;
}

async function loadRecipes() {
  allMeals = await fetchMeals();
  document.getElementById('totalRecipes').textContent = allMeals.length;

  const recipeList = document.getElementById('recipeList');
  recipeList.innerHTML = '';

  allMeals.forEach(meal => {
    const div = document.createElement('div');
    div.className = 'recipe-item';

    div.innerHTML = `
      <h4>${meal.MealName}</h4>
      <div class="recipe-category">${meal.Category}</div>
      <div class="recipe-instructions">${meal.Instructions}</div>
      <div class="recipe-actions">
        <button class="btn btn-sm edit" onclick="editRecipe(${meal.MealID})">
          <span class="btn-icon">✏️</span>
          Edit
        </button>
        <button class="btn btn-sm delete" onclick="deleteRecipe(${meal.MealID})">
          <span class="btn-icon">🗑️</span>
          Delete
        </button>
      </div>
    `;

    recipeList.appendChild(div);
  });
}


function openMealModal(slotId) {
  selectedSlotId = slotId;
  const recipeOptions = document.getElementById("recipeOptions");
  recipeOptions.innerHTML = "";

  allMeals.forEach(meal => {
    const btn = document.createElement("button");
    btn.textContent = `${meal.MealName} (${meal.Category})`;
    btn.onclick = () => selectMeal(meal.MealID, meal.MealName);
    recipeOptions.appendChild(btn);
  });

  const slotEl = document.getElementById(`${slotId}-text`);
  if (slotEl && !slotEl.textContent.includes("+ Add")) {
    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete Meal from Plan";
    delBtn.style.backgroundColor = "red";
    delBtn.style.color = "white";
    delBtn.onclick = () => deleteMealFromPlan();
    recipeOptions.appendChild(delBtn);
  }

  document.getElementById("mealModal").classList.add("active");
}

function closeMealModal() {
  document.getElementById("mealModal").classList.remove("active");
}

async function selectMeal(mealId, mealName) {
  const [day, time] = selectedSlotId.split("-");
  const existing = mealPlan.find(p => p.DayOfWeek.toLowerCase() === day && p.MealTime.toLowerCase() === time);

  if (existing) {
    await fetch(`${BASE_URL}/mealplans/${existing.PlanID}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ MealID: mealId, DayOfWeek: day, MealTime: time })
    });
  } else {
    await fetch(`${BASE_URL}/mealplans`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ UserID, MealID: mealId, DayOfWeek: day, MealTime: time })
    });
  }

  await loadPlanner();
  closeMealModal();
}

async function deleteMealFromPlan() {
  const [day, time] = selectedSlotId.split("-");
  const existing = mealPlan.find(p => p.DayOfWeek.toLowerCase() === day && p.MealTime.toLowerCase() === time);

  if (existing) {
    try {
      await fetch(`${BASE_URL}/mealplans/${existing.PlanID}`, { method: "DELETE" });
      
      // Remove from local mealPlan array
      const index = mealPlan.findIndex(p => p.PlanID === existing.PlanID);
      if (index > -1) {
        mealPlan.splice(index, 1);
      }
      
      // Update the UI immediately
      const textEl = document.getElementById(`${selectedSlotId}-text`);
      if (textEl) {
        const mealType = time.charAt(0).toUpperCase() + time.slice(1);
        textEl.textContent = `+ Add ${mealType}`;
      }
      
      // Update the planned meals counter
      document.getElementById('plannedMeals').textContent = mealPlan.length;
      
    } catch (error) {
      console.error('Error deleting meal from plan:', error);
      alert('Failed to delete meal from plan. Please try again.');
    }
  }

  closeMealModal();
}

function showSection(sectionId) {
  document.querySelectorAll('.section').forEach(section => section.classList.remove('active'));
  document.getElementById(sectionId).classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
}
document.getElementById('recipeForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const MealName = document.getElementById('recipeName').value.trim();
  const Category = document.getElementById('recipeCategory').value;
  const Instructions = document.getElementById('recipeInstructions').value.trim();

  if (!MealName || !Category || !Instructions) {
    alert('Please fill in all fields');
    return;
  }

  try {
    await fetch(`${BASE_URL}/meals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        UserID,
        MealName,
        Category,
        Instructions
      })
    });

    alert('Recipe added successfully!');
    document.getElementById('recipeForm').reset();

    await loadRecipes();
  } catch (error) {
    console.error('Error adding recipe:', error);
    alert('Error adding recipe. Please try again.');
  }
});
// Navigate to edit recipe page
function editRecipe(mealId) {
  window.location.href = `edit-recipe.html?id=${mealId}`;
}

// Delete a recipe from Meals table
async function deleteRecipe(mealId) {
  if (!confirm('Are you sure you want to delete this recipe? This will also remove it from any meal plans.')) {
    return;
  }

  try {
    const res = await fetch(`${BASE_URL}/meals/${mealId}`, {
      method: 'DELETE'
    });

    if (!res.ok) {
      throw new Error('Failed to delete recipe');
    }

    alert('Recipe deleted successfully!');
    await loadRecipes();
    await loadPlanner();

  } catch (error) {
    console.error('Error deleting recipe:', error);
    alert('Error deleting recipe. Please try again.');
  }
}

// Get suggested meals from backend API
async function getSuggestedMeals() {
  const category = document.getElementById('suggestionCategory').value;
  const query = document.getElementById('suggestionQuery').value.trim();
  const suggestedMealsSection = document.getElementById('suggestedMeals');
  const suggestedMealsList = document.getElementById('suggestedMealsList');

  // Show loading state
  suggestedMealsSection.style.display = 'block';
  suggestedMealsList.innerHTML = '<div class="suggestions-loading">Finding delicious recipes for you...</div>';

  try {
    // Build search parameters for backend API
    const searchParams = new URLSearchParams();
    
    if (query) {
      searchParams.append('query', query);
    }
    
    if (category) {
      searchParams.append('category', category);
    }
    
    searchParams.append('number', '6'); // Get 6 suggestions

    const response = await fetch(`${BASE_URL}/suggestions?${searchParams}`);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch suggestions');
    }

    displaySuggestedMeals(data.recipes, category);

  } catch (error) {
    console.error('Error fetching suggested meals:', error);
    suggestedMealsList.innerHTML = `
      <div class="error-message" style="text-align: center; padding: 2rem; color: #ef4444;">
        <h4>Oops! Unable to fetch recipe suggestions</h4>
        <p>Please check your internet connection and try again.</p>
        <button class="btn" onclick="getSuggestedMeals()">Retry</button>
      </div>
    `;
  }
}

// Display suggested meals
function displaySuggestedMeals(recipes, category) {
  const suggestedMealsList = document.getElementById('suggestedMealsList');
  
  if (!recipes || recipes.length === 0) {
    suggestedMealsList.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: #64748b;">
        <h4>No recipes found</h4>
        <p>Try different keywords or category</p>
      </div>
    `;
    return;
  }

  suggestedMealsList.innerHTML = '';

  recipes.forEach(recipe => {
    const div = document.createElement('div');
    div.className = 'suggested-meal-item recipe-item';

    // Extract diet and nutrition info
    const diets = recipe.diets || [];
    const readyInMinutes = recipe.readyInMinutes || 'N/A';
    const servings = recipe.servings || 'N/A';

    div.innerHTML = `
      ${recipe.image ? `<img src="${recipe.image}" alt="${recipe.title}" onerror="this.style.display='none'">` : ''}
      <h4>${recipe.title}</h4>
      
      <div class="suggested-meal-badges">
        <span class="suggested-meal-badge time-badge">⏱️ ${readyInMinutes} min</span>
        <span class="suggested-meal-badge serving-badge">🍽️ ${servings} servings</span>
        ${diets.slice(0, 2).map(diet => `<span class="suggested-meal-badge diet-badge">${diet}</span>`).join('')}
      </div>
      
      <div class="suggested-meal-actions">
        <button class="btn btn-sm add-suggestion" onclick="addSuggestedRecipe(${recipe.id}, '${recipe.title.replace(/'/g, "\\'")}', '${category || 'main course'}')">
          <span class="btn-icon">➕</span>
          Add to My Recipes
        </button>
        <button class="btn btn-sm view-recipe" onclick="viewSpoonacularRecipe(${recipe.id})">
          <span class="btn-icon">👁️</span>
          View Full Recipe
        </button>
      </div>
    `;

    suggestedMealsList.appendChild(div);
  });
}

// Add suggested recipe to user's recipes via backend
async function addSuggestedRecipe(spoonacularId, title, category) {
  try {
    // Call backend API to get recipe details and add to collection
    const response = await fetch(`${BASE_URL}/suggestions/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        recipeId: spoonacularId,
        category: category || 'main course',
        userId: UserID
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to add recipe');
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to add recipe');
    }

    // Now add to local database using the prepared meal data
    const response2 = await fetch(`${BASE_URL}/meals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data.mealData)
    });

    if (!response2.ok) {
      throw new Error('Failed to save recipe to database');
    }

    alert('Recipe added to your collection successfully!');
    await loadRecipes(); // Refresh the recipes list

  } catch (error) {
    console.error('Error adding suggested recipe:', error);
    alert('Error adding recipe. Please try again.');
  }
}

// View full recipe on Spoonacular (opens in new tab)
function viewSpoonacularRecipe(spoonacularId) {
  window.open(`https://spoonacular.com/recipes/-${spoonacularId}`, '_blank');
}

// Auto-suggest as user types
let suggestionTimeout;
document.getElementById('suggestionQuery').addEventListener('input', function() {
  clearTimeout(suggestionTimeout);
  suggestionTimeout = setTimeout(() => {
    if (this.value.length >= 3) {
      getSuggestedMeals();
    }
  }, 1000); // Wait 1 second after user stops typing
});

// Trigger suggestion on category change
document.getElementById('suggestionCategory').addEventListener('change', function() {
  if (this.value) {
    getSuggestedMeals();
  }
});





