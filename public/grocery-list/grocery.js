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
      const userId = user.userId || user.id || user.user_id || user.UserID;
      
      if (userId) {
        console.log('Using UserID:', userId);
        console.log('UserID type:', typeof userId);
        return userId;
      }
    } catch (e) {
      console.error('Error parsing user data:', e);
    }
  }
  
  console.log('No valid user found in localStorage, redirecting to login');
  alert('Session expired. Please log in again.');
  localStorage.clear();
  window.location.href = '/login/login.html';
  return null;
}

// Helper function to get auth headers
function getAuthHeaders() {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

const UserID = getUserID();

let groceryItems = [];
let nextId = 1;
let allMeals = [];
let mealPlan = [];

// Load initial data
document.addEventListener('DOMContentLoaded', async function() {
    // Check authentication first
    const token = localStorage.getItem('authToken');
    if (!token) {
        alert('Please log in to access this page');
        window.location.href = '../login/login.html';
        return;
    }
    
    await loadGroceryItems();
    await loadMeals();
    await loadMealPlan();
    updateGroceryTable();
    
    // Add real-time validation to inputs
    setupRealTimeValidation();
});

// Setup real-time validation
function setupRealTimeValidation() {
    const nameInput = document.getElementById('newItemInput');
    const quantityInput = document.getElementById('newItemQuantity');
    
    // Real-time validation for item name
    nameInput.addEventListener('input', function() {
        const name = this.value;
        this.setCustomValidity('');
        
        if (name.length > 100) {
            this.setCustomValidity('Item name must be 100 characters or less');
        } else if (name && !/^[a-zA-Z0-9\s\-'.,()&]*$/.test(name)) {
            this.setCustomValidity('Item name contains invalid characters');
        }
    });
    
    // Real-time validation for quantity
    quantityInput.addEventListener('input', function() {
        const quantity = parseFloat(this.value);
        this.setCustomValidity('');
        
        if (isNaN(quantity) || quantity <= 0) {
            this.setCustomValidity('Quantity must be a positive number');
        } else if (quantity > 9999) {
            this.setCustomValidity('Quantity cannot exceed 9999');
        }
    });
}

// Load grocery items from database
async function loadGroceryItems() {
    try {
        const response = await fetch(`${BASE_URL}/grocery/user/${UserID}`, {
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const items = await response.json();
        console.log('Loaded grocery items:', items);
        
        // Check if items is an array before mapping
        if (Array.isArray(items)) {
            groceryItems = items.map(item => ({
                id: item.item_id,
                name: item.item_name,
                quantity: item.quantity,
                unit: item.unit || 'pcs',
                status: item.bought ? 'bought' : 'pending',
                price: item.price || 0,
                notes: item.notes || ''
            }));
        } else {
            console.error('Expected array but got:', typeof items);
            groceryItems = [];
        }
    } catch (error) {
        console.error('Error loading grocery items:', error);
        groceryItems = [];
    }
}

// Load meals from database
async function loadMeals() {
    try {
        const response = await fetch(`${BASE_URL}/meals/${UserID}`, {
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        allMeals = await response.json();
        console.log('Loaded meals:', allMeals);
    } catch (error) {
        console.error('Error loading meals:', error);
        allMeals = [];
    }
}

// Load meal plan from database
async function loadMealPlan() {
    try {
        const response = await fetch(`${BASE_URL}/mealplans/${UserID}`, {
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        mealPlan = await response.json();
        console.log('Loaded meal plan:', mealPlan);
    } catch (error) {
        console.error('Error loading meal plan:', error);
        mealPlan = [];
    }
}

async function generateGroceryList() {
    const breakfast = document.getElementById('breakfast').checked;
    const lunch = document.getElementById('lunch').checked;
    const dinner = document.getElementById('dinner').checked;

    // Get meals from the actual meal plan based on selected categories
    const selectedMeals = [];
    
    console.log('Current meal plan:', mealPlan);
    
    if (breakfast) {
        const breakfastMeals = mealPlan.filter(plan => 
            plan.MealTime.toLowerCase() === 'breakfast'
        );
        console.log('Breakfast meals found:', breakfastMeals);
        breakfastMeals.forEach(meal => {
            selectedMeals.push({
                mealId: meal.MealID,
                category: meal.Category || 'breakfast',
                name: meal.MealName,
                servings: 4, // Default servings
                dayOfWeek: meal.DayOfWeek ? meal.DayOfWeek.toLowerCase() : 'monday'
            });
        });
    }
    
    if (lunch) {
        const lunchMeals = mealPlan.filter(plan => 
            plan.MealTime.toLowerCase() === 'lunch'
        );
        console.log('Lunch meals found:', lunchMeals);
        lunchMeals.forEach(meal => {
            selectedMeals.push({
                mealId: meal.MealID,
                category: meal.Category || 'lunch',
                name: meal.MealName,
                servings: 4,
                dayOfWeek: meal.DayOfWeek ? meal.DayOfWeek.toLowerCase() : 'monday'
            });
        });
    }
    
    if (dinner) {
        const dinnerMeals = mealPlan.filter(plan => 
            plan.MealTime.toLowerCase() === 'dinner'
        );
        console.log('Dinner meals found:', dinnerMeals);
        dinnerMeals.forEach(meal => {
            selectedMeals.push({
                mealId: meal.MealID,
                category: meal.Category || 'dinner',
                name: meal.MealName,
                servings: 4,
                dayOfWeek: meal.DayOfWeek ? meal.DayOfWeek.toLowerCase() : 'monday'
            });
        });
    }

    console.log('Selected meals for grocery generation:', selectedMeals);

    if (selectedMeals.length === 0) {
        alert('No meals found in your meal plan for the selected categories. Please add some meals to your meal plan first.');
        return;
    }

    try {
        // Call backend API to generate grocery list
        console.log('Calling grocery generation API with:', selectedMeals);
        const response = await fetch(`${BASE_URL}/grocery/generate/${UserID}`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                selectedMeals: selectedMeals
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error:', errorText);
            throw new Error('Failed to generate grocery list');
        }

        const result = await response.json();
        console.log('Grocery generation result:', result);
        
        if (result.success) {
            const itemCount = result.items ? result.items.length : 0;
            const addedCount = result.details ? result.details.addedItems : itemCount;
            
            if (itemCount === 0) {
                alert('No ingredients found for the selected meals. This might mean:\n- The meals don\'t have Spoonacular ingredient data\n- The meals are using fallback category ingredients\n- There was an issue processing the meals');
            } else {
                alert(`Successfully added ${addedCount} ingredients to your grocery list!`);
            }
            
            // Reload the grocery items
            await loadGroceryItems();
            updateGroceryTable();
        } else {
            alert('Failed to generate grocery list: ' + result.message);
        }
    } catch (error) {
        console.error('Error generating grocery list:', error);
        alert('Error generating grocery list. Please try again.');
    }
}

// Validation functions
function validateGroceryItem(name, quantity, unit, day) {
    const errors = [];
    
    // Validate item name
    if (!name || typeof name !== 'string') {
        errors.push('Item name is required');
    } else {
        const trimmedName = name.trim();
        if (trimmedName.length < 1) {
            errors.push('Item name cannot be empty');
        } else if (trimmedName.length > 100) {
            errors.push('Item name must be 100 characters or less');
        } else if (!/^[a-zA-Z0-9\s\-'.,()&]+$/.test(trimmedName)) {
            errors.push('Item name contains invalid characters');
        }
    }
    
    // Validate quantity
    if (!quantity && quantity !== 0) {
        errors.push('Quantity is required');
    } else if (isNaN(quantity) || quantity <= 0) {
        errors.push('Quantity must be a positive number');
    } else if (quantity > 9999) {
        errors.push('Quantity cannot exceed 9999');
    }
    
    // Validate unit
    const validUnits = ['pcs', 'kg', 'g', 'lbs', 'oz', 'L', 'ml', 'cups', 'tbsp', 'tsp', 'cans', 'bottles', 'bags', 'boxes'];
    if (!unit || !validUnits.includes(unit)) {
        errors.push('Please select a valid unit');
    }
    
    // Validate day
    const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    if (!day || !validDays.includes(day.toLowerCase())) {
        errors.push('Please select a valid day');
    }
    
    return errors;
}

function sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    return input.trim()
        .replace(/[<>'"&]/g, '') // Remove potentially dangerous characters
        .replace(/\s+/g, ' '); // Replace multiple spaces with single space
}

function displayValidationErrors(errors) {
    const errorContainer = document.getElementById('validationErrors');
    const errorList = document.getElementById('errorList');
    
    if (errors.length > 0) {
        errorList.innerHTML = errors.map(error => `<li>${error}</li>`).join('');
        errorContainer.style.display = 'block';
        setTimeout(() => {
            errorContainer.style.display = 'none';
        }, 5000); // Hide after 5 seconds
    } else {
        errorContainer.style.display = 'none';
    }
}

function checkDuplicateItem(name, day) {
    const sanitizedName = sanitizeInput(name).toLowerCase();
    return groceryItems.some(item => {
        const itemDay = item.notes ? item.notes.replace('Day: ', '').toLowerCase() : '';
        const itemName = item.name.toLowerCase();
        return itemName === sanitizedName && itemDay === day.toLowerCase() && item.status !== 'bought';
    });
}

async function addItem() {
    const nameInput = document.getElementById('newItemInput');
    const quantityInput = document.getElementById('newItemQuantity');
    const unitSelect = document.getElementById('newItemUnit');
    const daySelect = document.getElementById('newItemDay');
    
    const name = nameInput.value;
    const quantity = parseFloat(quantityInput.value);
    const unit = unitSelect.value;
    const day = daySelect.value;

    // Validate input
    const validationErrors = validateGroceryItem(name, quantity, unit, day);
    
    if (validationErrors.length > 0) {
        displayValidationErrors(validationErrors);
        return;
    }

    // Sanitize input
    const sanitizedName = sanitizeInput(name);

    // Check for duplicates
    if (checkDuplicateItem(sanitizedName, day)) {
        displayValidationErrors(['This item already exists for the selected day. Please check your list or choose a different day.']);
        return;
    }

    console.log('Adding item with day:', day);
    console.log('Day select element:', daySelect);
    console.log('Day select value:', daySelect.value);
    console.log('Will store in notes:', `Day: ${day}`);

    try {
        const response = await fetch(`${BASE_URL}/grocery`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                item_name: sanitizedName,
                quantity: quantity,
                unit: unit,
                bought: false,
                user_id: UserID,
                price: 0.00,
                notes: `Day: ${day}`
            })
        });

        if (response.ok) {
            // Clear form
            nameInput.value = '';
            quantityInput.value = '1';
            unitSelect.value = 'pcs';
            daySelect.value = 'monday';
            
            // Hide any error messages
            displayValidationErrors([]);
            
            // Reload data
            await loadGroceryItems();
            updateGroceryTable();
            
            // Show success message
            showSuccessMessage('Item added successfully!');
        } else {
            const errorData = await response.json();
            displayValidationErrors([errorData.error || 'Failed to add item']);
        }
    } catch (error) {
        console.error('Error adding item:', error);
        displayValidationErrors(['Error adding item. Please try again.']);
    }
}

// Success message function
function showSuccessMessage(message) {
    const existingMessage = document.getElementById('successMessage');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    const successDiv = document.createElement('div');
    successDiv.id = 'successMessage';
    successDiv.style.cssText = `
        margin-top: 10px;
        padding: 10px;
        background-color: #d4edda;
        border: 1px solid #c3e6cb;
        border-radius: 5px;
        color: #155724;
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1000;
    `;
    successDiv.textContent = message;
    
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        successDiv.remove();
    }, 3000);
}

// Test function to add sample grocery items
async function addTestItems() {
    const testItems = [
        { name: 'Milk', quantity: 1, unit: 'L' },
        { name: 'Bread', quantity: 2, unit: 'pcs' },
        { name: 'Eggs', quantity: 12, unit: 'pcs' },
        { name: 'Apples', quantity: 6, unit: 'pcs' },
        { name: 'Chicken breast', quantity: 500, unit: 'g' }
    ];

    for (const item of testItems) {
        try {
            await fetch(`${BASE_URL}/grocery`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    item_name: item.name,
                    quantity: item.quantity,
                    unit: item.unit,
                    bought: false,
                    user_id: UserID,
                    price: 0.00,
                    notes: 'Test item'
                })
            });
        } catch (error) {
            console.error('Error adding test item:', error);
        }
    }
    
    await loadGroceryItems();
    updateGroceryTable();
    alert('Test grocery items added!');
}

// Debug function to check meal data
async function debugMealData() {
    console.log('=== DEBUGGING MEAL DATA ===');
    console.log('All meals:', allMeals);
    console.log('Meal plan:', mealPlan);
    
    if (allMeals.length > 0) {
        console.log('Sample meal details:');
        for (let i = 0; i < Math.min(3, allMeals.length); i++) {
            const meal = allMeals[i];
            console.log(`Meal ${i + 1}:`, {
                MealID: meal.MealID,
                MealName: meal.MealName,
                Category: meal.Category,
                SpoonacularID: meal.SpoonacularID,
                Ingredients: meal.Ingredients,
                hasIngredients: !!meal.Ingredients
            });
        }
    }
    
    if (mealPlan.length > 0) {
        console.log('Meal plan entries:');
        mealPlan.forEach((plan, index) => {
            console.log(`Plan ${index + 1}:`, {
                MealID: plan.MealID,
                MealName: plan.MealName,
                MealTime: plan.MealTime,
                DayOfWeek: plan.DayOfWeek
            });
        });
    } else {
        console.log('No meal plan entries found!');
    }
    
    alert('Check the console for meal debugging information');
}

function handleEnterKey(event) {
    if (event.key === 'Enter') {
        addItem();
    }
}

async function toggleItemStatus(id) {
    const item = groceryItems.find(item => item.id === id);
    if (item) {
        const newStatus = item.status === 'pending' ? true : false;
        
        try {
            // Find the database item ID (you might need to store this differently)
            const dbItem = await fetch(`${BASE_URL}/grocery/user/${UserID}`, {
                headers: getAuthHeaders()
            }).then(res => res.json());
            const dbItemData = dbItem.find(dbI => dbI.item_name === item.name);
            
            if (dbItemData) {
                // Normalize the unit to valid values
                const validUnits = ['pcs', 'kg', 'g', 'lbs', 'oz', 'L', 'ml', 'cups', 'tbsp', 'tsp', 'cans', 'bottles', 'bags', 'boxes'];
                let normalizedUnit = item.unit || dbItemData.unit || 'pcs';
                
                // Map common unit names to valid ones
                const unitMapping = {
                    'pieces': 'pcs',
                    'piece': 'pcs',
                    'grams': 'g',
                    'gram': 'g',
                    'liter': 'L',
                    'liters': 'L',
                    'loaves': 'pcs',
                    'loaf': 'pcs'
                };
                
                if (unitMapping[normalizedUnit]) {
                    normalizedUnit = unitMapping[normalizedUnit];
                } else if (!validUnits.includes(normalizedUnit)) {
                    normalizedUnit = 'pcs'; // Default fallback
                }

                const updateData = {
                    item_name: item.name,
                    quantity: parseFloat(item.quantity) || parseFloat(dbItemData.quantity) || 1,
                    unit: normalizedUnit,
                    bought: newStatus,
                    price: parseFloat(item.price) || parseFloat(dbItemData.price) || 0,
                    notes: item.notes || dbItemData.notes || ''
                };

                console.log('Sending update data:', updateData);

                const response = await fetch(`${BASE_URL}/grocery/item/${dbItemData.item_id}`, {
                    method: 'PUT',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(updateData)
                });

                if (response.ok) {
                    item.status = newStatus ? 'bought' : 'pending';
                    updateGroceryTable();
                } else {
                    // Log the error response for debugging
                    const errorData = await response.json();
                    console.error('Update failed:', errorData);
                    alert('Failed to update item status. Please try again.');
                }
            }
        } catch (error) {
            console.error('Error updating item status:', error);
            alert('Error updating item status. Please check your connection.');
        }
    }
}

async function deleteItem(id) {
    const item = groceryItems.find(item => item.id === id);
    if (item && confirm('Are you sure you want to delete this item?')) {
        try {
            // Find the database item ID
            const dbItem = await fetch(`${BASE_URL}/grocery/user/${UserID}`, {
                headers: getAuthHeaders()
            }).then(res => res.json());
            const dbItemData = dbItem.find(dbI => dbI.item_name === item.name);
            
            if (dbItemData) {
                const response = await fetch(`${BASE_URL}/grocery/item/${dbItemData.item_id}`, {
                    method: 'DELETE',
                    headers: getAuthHeaders()
                });

                if (response.ok) {
                    await loadGroceryItems();
                    updateGroceryTable();
                }
            }
        } catch (error) {
            console.error('Error deleting item:', error);
        }
    }
}

async function clearBoughtItems() {
    if (confirm('Are you sure you want to clear all bought items?')) {
        const boughtItems = groceryItems.filter(item => item.status === 'bought');
        
        for (const item of boughtItems) {
            try {
                const dbItem = await fetch(`${BASE_URL}/grocery/user/${UserID}`, {
                    headers: getAuthHeaders()
                }).then(res => res.json());
                const dbItemData = dbItem.find(dbI => dbI.item_name === item.name);
                
                if (dbItemData) {
                    await fetch(`${BASE_URL}/grocery/item/${dbItemData.item_id}`, {
                        method: 'DELETE',
                        headers: getAuthHeaders()
                    });
                }
            } catch (error) {
                console.error('Error deleting bought item:', error);
            }
        }
        
        await loadGroceryItems();
        updateGroceryTable();
    }
}

function updateGroceryTable() {
    const tableBody = document.getElementById('groceryTableBody');
    const emptyState = document.getElementById('emptyState');
    
    // Get filtered items
    const filteredItems = getFilteredGroceryItems();
    
    if (filteredItems.length === 0) {
        tableBody.innerHTML = '';
        emptyState.style.display = 'block';
        if (currentDayFilter !== 'all') {
            emptyState.textContent = `No items for ${currentDayFilter.charAt(0).toUpperCase() + currentDayFilter.slice(1)}. Try selecting a different day or add some items!`;
        } else {
            emptyState.textContent = 'No items in your grocery list yet. Add some items or generate from your meal plan!';
        }
        return;
    }

    emptyState.style.display = 'none';
    
    tableBody.innerHTML = filteredItems.map(item => `
        <tr class="${item.status === 'bought' ? 'bought' : ''}">
            <td>${item.name}</td>
            <td>${item.quantity} ${item.unit}</td>
            <td>
                <span class="day-badge" style="background-color: #007bff; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                    ${extractDayFromNotes(item.notes).charAt(0).toUpperCase() + extractDayFromNotes(item.notes).slice(1)}
                </span>
            </td>
            <td>
                <span class="status-badge status-${item.status}">
                    ${item.status === 'bought' ? '✅ Bought' : '⏳ Pending'}
                </span>
            </td>
            <td>
                <input type="checkbox" class="status-checkbox" 
                       ${item.status === 'bought' ? 'checked' : ''} 
                       onchange="toggleItemStatus(${item.id})">
            </td>
            <td>
                <button class="delete-btn" onclick="deleteItem(${item.id})">🗑️ Delete</button>
            </td>
        </tr>
    `).join('');
}

// Global variable to track current filter
let currentDayFilter = 'all';

// Function to extract day from notes
function extractDayFromNotes(notes) {
    console.log('Extracting day from notes:', notes);
    if (!notes) {
        console.log('No notes found, returning default: monday');
        return 'monday'; // default
    }
    
    // Check for the new format "Day: dayname" (with possible comma and additional text)
    const dayMatch = notes.match(/Day: (\w+)/i);
    if (dayMatch) {
        const extractedDay = dayMatch[1].toLowerCase();
        console.log('Found day in new format:', extractedDay);
        return extractedDay;
    }
    
    // If no day format found, check if it's an old item
    console.log('No day format found, returning default: monday');
    return 'monday'; // default for legacy items
}

// Function to filter grocery items by day
function filterByDay(day) {
    console.log('=== FILTER BUTTON CLICKED ===');
    console.log('Filtering by day:', day);
    currentDayFilter = day;
    
    // Update active button
    document.querySelectorAll('.day-filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const activeButton = document.querySelector(`[data-day="${day}"]`);
    if (activeButton) {
        activeButton.classList.add('active');
        console.log('Active button updated for:', day);
    } else {
        console.log('ERROR: Could not find button for day:', day);
    }
    
    // Filter and update table
    updateGroceryTable();
    console.log('=== END FILTER BUTTON CLICKED ===');
}

// Function to get filtered grocery items
function getFilteredGroceryItems() {
    console.log('=== FILTERING DEBUG ===');
    console.log('Current filter:', currentDayFilter);
    console.log('Total items:', groceryItems.length);
    
    if (currentDayFilter === 'all') {
        console.log('Showing all items');
        return groceryItems;
    }
    
    const filtered = groceryItems.filter(item => {
        const itemDay = extractDayFromNotes(item.notes);
        const matches = itemDay === currentDayFilter;
        console.log(`Item: ${item.item_name}, Notes: "${item.notes}", Extracted day: "${itemDay}", Filter: "${currentDayFilter}", Matches: ${matches}`);
        return matches;
    });
    
    console.log('Filtered items count:', filtered.length);
    console.log('=== END FILTERING DEBUG ===');
    return filtered;
}