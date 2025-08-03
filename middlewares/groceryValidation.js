const validator = require('validator');

function validateGroceryItem(req, res, next) {
    const { item_name, quantity, unit, user_id, price, notes } = req.body;
    const errors = [];

    // Validate item_name
    if (!item_name || typeof item_name !== 'string') {
        errors.push('Item name is required');
    } else {
        const trimmedName = item_name.trim();
        if (trimmedName.length < 1) {
            errors.push('Item name cannot be empty');
        } else if (trimmedName.length > 100) {
            errors.push('Item name must be 100 characters or less');
        } else if (!/^[a-zA-Z0-9\s\-'.,()&:]+$/.test(trimmedName)) {
            errors.push('Item name contains invalid characters');
        }
        // Sanitize the item name
        req.body.item_name = trimmedName;
    }

    // Validate quantity
    if (quantity === undefined || quantity === null) {
        errors.push('Quantity is required');
    } else if (isNaN(quantity) || quantity <= 0) {
        errors.push('Quantity must be a positive number');
    } else if (quantity > 9999) {
        errors.push('Quantity cannot exceed 9999');
    } else if (!Number.isFinite(parseFloat(quantity))) {
        errors.push('Quantity must be a valid number');
    }

    // Validate unit
    const validUnits = ['pcs', 'kg', 'g', 'lbs', 'oz', 'L', 'ml', 'cups', 'tbsp', 'tsp', 'cans', 'bottles', 'bags', 'boxes'];
    if (!unit || typeof unit !== 'string') {
        errors.push('Unit is required');
    } else if (!validUnits.includes(unit)) {
        errors.push('Invalid unit selected');
    }

    // Validate user_id
    if (!user_id) {
        errors.push('User ID is required');
    } else if (isNaN(user_id) || user_id <= 0) {
        errors.push('Invalid user ID');
    }

    // Validate price (optional)
    if (price !== undefined && price !== null) {
        if (isNaN(price) || price < 0) {
            errors.push('Price must be a non-negative number');
        } else if (price > 99999.99) {
            errors.push('Price cannot exceed 99999.99');
        }
    }

    // Validate notes (optional)
    if (notes !== undefined && notes !== null) {
        if (typeof notes !== 'string') {
            errors.push('Notes must be a string');
        } else if (notes.length > 500) {
            errors.push('Notes cannot exceed 500 characters');
        } else {
            // Sanitize notes
            req.body.notes = notes.trim();
        }
    }

    // Validate bought status (optional)
    if (req.body.bought !== undefined && typeof req.body.bought !== 'boolean') {
        errors.push('Bought status must be a boolean');
    }

    if (errors.length > 0) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors
        });
    }

    next();
}

function validateUpdateGroceryItem(req, res, next) {
    const { item_name, quantity, unit, price, notes, bought } = req.body;
    const errors = [];

    console.log('Validating update for item:', { item_name, quantity, unit, price, notes, bought });

    // For updates, fields are optional but must be valid if provided
    if (item_name !== undefined) {
        if (typeof item_name !== 'string') {
            errors.push('Item name must be a string');
        } else {
            const trimmedName = item_name.trim();
            if (trimmedName.length < 1) {
                errors.push('Item name cannot be empty');
            } else if (trimmedName.length > 100) {
                errors.push('Item name must be 100 characters or less');
            } else if (!/^[a-zA-Z0-9\s\-'.,()&:]+$/.test(trimmedName)) {
                errors.push('Item name contains invalid characters');
            }
            req.body.item_name = trimmedName;
        }
    }

    if (quantity !== undefined) {
        if (isNaN(quantity) || quantity <= 0) {
            errors.push('Quantity must be a positive number');
        } else if (quantity > 9999) {
            errors.push('Quantity cannot exceed 9999');
        }
    }

    if (unit !== undefined) {
        const validUnits = ['pcs', 'kg', 'g', 'lbs', 'oz', 'L', 'ml', 'cups', 'tbsp', 'tsp', 'cans', 'bottles', 'bags', 'boxes'];
        if (!validUnits.includes(unit)) {
            errors.push('Invalid unit selected');
        }
    }

    if (price !== undefined) {
        if (isNaN(price) || price < 0) {
            errors.push('Price must be a non-negative number');
        } else if (price > 99999.99) {
            errors.push('Price cannot exceed 99999.99');
        }
    }

    if (notes !== undefined) {
        if (typeof notes !== 'string') {
            errors.push('Notes must be a string');
        } else if (notes.length > 500) {
            errors.push('Notes cannot exceed 500 characters');
        } else {
            req.body.notes = notes.trim();
        }
    }

    if (bought !== undefined && typeof bought !== 'boolean') {
        errors.push('Bought status must be a boolean');
    }

    if (errors.length > 0) {
        console.log('Validation failed for item:', req.body);
        console.log('Validation errors:', errors);
        return res.status(400).json({
            error: 'Validation failed',
            details: errors
        });
    }

    console.log('Validation passed for item:', req.body);

    next();
}

function validateItemId(req, res, next) {
    const itemId = parseInt(req.params.id);
    
    if (isNaN(itemId) || itemId <= 0) {
        return res.status(400).json({
            error: 'Invalid item ID',
            details: ['Item ID must be a positive integer']
        });
    }

    req.params.id = itemId;
    next();
}

function validateUserId(req, res, next) {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId) || userId <= 0) {
        return res.status(400).json({
            error: 'Invalid user ID',
            details: ['User ID must be a positive integer']
        });
    }

    req.params.userId = userId;
    next();
}

module.exports = {
    validateGroceryItem,
    validateUpdateGroceryItem,
    validateItemId,
    validateUserId
};
