const BASE_URL = "http://localhost:3000";
const UserID = 1; // This should match your current user system

let groceryItems = [];
let nextId = 1;
let allMeals = [];
let mealPlan = [];

// Load initial data
document.addEventListener('DOMContentLoaded', async function() {
    await loadGroceryItems();
    await loadMeals();
    await loadMealPlan();
    updateGroceryTable();
});

// Load grocery items from database
async function loadGroceryItems() {
    try {
        const response = await fetch(`${BASE_URL}/grocery`);
        const items = await response.json();
        groceryItems = items.map(item => ({
            id: item.item_id,
            name: item.item_name,
            quantity: item.quantity,
            unit: item.unit || 'pcs',
            status: item.bought ? 'bought' : 'pending',
            price: item.price || 0,
            notes: item.notes || ''
        }));
    } catch (error) {
        console.error('Error loading grocery items:', error);
        groceryItems = [];
    }
}

// Load meals from database
async function loadMeals() {
    try {
        const response = await fetch(`${BASE_URL}/meals/${UserID}`);
        allMeals = await response.json();
    } catch (error) {
        console.error('Error loading meals:', error);
        allMeals = [];
    }
}

// Load meal plan from database
async function loadMealPlan() {
    try {
        const response = await fetch(`${BASE_URL}/mealplans/${UserID}`);
        mealPlan = await response.json();
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
    
    if (breakfast) {
        const breakfastMeals = mealPlan.filter(plan => 
            plan.MealTime.toLowerCase() === 'breakfast'
        );
        breakfastMeals.forEach(meal => {
            selectedMeals.push({
                mealId: meal.MealID,
                category: meal.Category || 'breakfast',
                name: meal.MealName,
                servings: 4 // Default servings
            });
        });
    }
    
    if (lunch) {
        const lunchMeals = mealPlan.filter(plan => 
            plan.MealTime.toLowerCase() === 'lunch'
        );
        lunchMeals.forEach(meal => {
            selectedMeals.push({
                mealId: meal.MealID,
                category: meal.Category || 'lunch',
                name: meal.MealName,
                servings: 4
            });
        });
    }
    
    if (dinner) {
        const dinnerMeals = mealPlan.filter(plan => 
            plan.MealTime.toLowerCase() === 'dinner'
        );
        dinnerMeals.forEach(meal => {
            selectedMeals.push({
                mealId: meal.MealID,
                category: meal.Category || 'dinner',
                name: meal.MealName,
                servings: 4
            });
        });
    }

    if (selectedMeals.length === 0) {
        alert('No meals found in your meal plan for the selected categories. Please add some meals to your meal plan first.');
        return;
    }

    try {
        // Call backend API to generate grocery list
        const response = await fetch(`${BASE_URL}/grocery/generate/${UserID}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                selectedMeals: selectedMeals
            })
        });

        if (!response.ok) {
            throw new Error('Failed to generate grocery list');
        }

        const result = await response.json();
        
        if (result.success) {
            alert(`Successfully added ${result.items.length} ingredients to your grocery list!`);
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

async function addItem() {
    const nameInput = document.getElementById('newItemInput');
    const quantityInput = document.getElementById('newItemQuantity');
    const unitInput = document.getElementById('newItemUnit');
    
    const name = nameInput.value.trim();
    const quantity = parseFloat(quantityInput.value) || 1;
    const unit = unitInput.value;

    if (name) {
        try {
            const response = await fetch(`${BASE_URL}/grocery`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    item_name: name,
                    quantity: quantity,
                    unit: unit,
                    bought: false,
                    user_id: UserID,
                    price: 0.00,
                    notes: 'Added manually'
                })
            });

            if (response.ok) {
                nameInput.value = '';
                quantityInput.value = '1';
                unitInput.value = 'pcs';
                await loadGroceryItems();
                updateGroceryTable();
            } else {
                alert('Failed to add item');
            }
        } catch (error) {
            console.error('Error adding item:', error);
            alert('Error adding item. Please try again.');
        }
    }
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
            const dbItem = await fetch(`${BASE_URL}/grocery`).then(res => res.json());
            const dbItemData = dbItem.find(dbI => dbI.item_name === item.name);
            
            if (dbItemData) {
                const response = await fetch(`${BASE_URL}/grocery/${dbItemData.item_id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        item_name: item.name,
                        quantity: item.quantity,
                        bought: newStatus,
                        price: item.price || 0,
                        notes: item.notes || ''
                    })
                });

                if (response.ok) {
                    item.status = newStatus ? 'bought' : 'pending';
                    updateGroceryTable();
                }
            }
        } catch (error) {
            console.error('Error updating item status:', error);
        }
    }
}

async function deleteItem(id) {
    const item = groceryItems.find(item => item.id === id);
    if (item && confirm('Are you sure you want to delete this item?')) {
        try {
            // Find the database item ID
            const dbItem = await fetch(`${BASE_URL}/grocery`).then(res => res.json());
            const dbItemData = dbItem.find(dbI => dbI.item_name === item.name);
            
            if (dbItemData) {
                const response = await fetch(`${BASE_URL}/grocery/${dbItemData.item_id}`, {
                    method: 'DELETE'
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
                const dbItem = await fetch(`${BASE_URL}/grocery`).then(res => res.json());
                const dbItemData = dbItem.find(dbI => dbI.item_name === item.name);
                
                if (dbItemData) {
                    await fetch(`${BASE_URL}/grocery/${dbItemData.item_id}`, {
                        method: 'DELETE'
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
    
    if (groceryItems.length === 0) {
        tableBody.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';
    
    tableBody.innerHTML = groceryItems.map(item => `
        <tr class="${item.status === 'bought' ? 'bought' : ''}">
            <td>${item.name}</td>
            <td>${item.quantity} ${item.unit}</td>
            <td>
                <span class="status-badge status-${item.status}">
                    ${item.status === 'pending' ? '⏳ Pending' : '✅ Bought'}
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