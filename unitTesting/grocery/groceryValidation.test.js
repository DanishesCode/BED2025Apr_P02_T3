const GroceryValidation = require('../../middlewares/groceryValidation');

describe('Grocery Validation Tests', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            body: {},
            params: {}
        };
        res = {
            status: jest.fn(() => res),
            json: jest.fn(() => res)
        };
        next = jest.fn();
    });

    describe('validateGroceryItem', () => {
        test('should pass validation with valid data', () => {
            req.body = {
                item_name: 'Milk',
                quantity: 2,
                unit: 'L',
                user_id: 1,
                price: 5.99,
                notes: 'Day: monday'
            };

            GroceryValidation.validateGroceryItem(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
            expect(req.body.item_name).toBe('Milk'); // Should be trimmed
        });

        test('should fail validation with empty item name', () => {
            req.body = {
                item_name: '',
                quantity: 2,
                unit: 'L',
                user_id: 1
            };

            GroceryValidation.validateGroceryItem(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Validation failed',
                details: expect.arrayContaining(['Item name is required'])
            });
            expect(next).not.toHaveBeenCalled();
        });

        test('should fail validation with invalid quantity', () => {
            req.body = {
                item_name: 'Milk',
                quantity: -1,
                unit: 'L',
                user_id: 1
            };

            GroceryValidation.validateGroceryItem(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Validation failed',
                details: expect.arrayContaining(['Quantity must be a positive number'])
            });
            expect(next).not.toHaveBeenCalled();
        });

        test('should fail validation with invalid unit', () => {
            req.body = {
                item_name: 'Milk',
                quantity: 2,
                unit: 'invalid_unit',
                user_id: 1
            };

            GroceryValidation.validateGroceryItem(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Validation failed',
                details: expect.arrayContaining(['Invalid unit selected'])
            });
            expect(next).not.toHaveBeenCalled();
        });

        test('should fail validation with item name too long', () => {
            req.body = {
                item_name: 'a'.repeat(101), // 101 characters
                quantity: 2,
                unit: 'L',
                user_id: 1
            };

            GroceryValidation.validateGroceryItem(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Validation failed',
                details: expect.arrayContaining(['Item name must be 100 characters or less'])
            });
            expect(next).not.toHaveBeenCalled();
        });

        test('should fail validation with invalid characters in name', () => {
            req.body = {
                item_name: 'Milk<script>alert("xss")</script>',
                quantity: 2,
                unit: 'L',
                user_id: 1
            };

            GroceryValidation.validateGroceryItem(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Validation failed',
                details: expect.arrayContaining(['Item name contains invalid characters'])
            });
            expect(next).not.toHaveBeenCalled();
        });

        test('should sanitize item name', () => {
            req.body = {
                item_name: '  Milk  ',
                quantity: 2,
                unit: 'L',
                user_id: 1
            };

            GroceryValidation.validateGroceryItem(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(req.body.item_name).toBe('Milk');
        });

        test('should fail validation with missing user_id', () => {
            req.body = {
                item_name: 'Milk',
                quantity: 2,
                unit: 'L'
            };

            GroceryValidation.validateGroceryItem(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Validation failed',
                details: expect.arrayContaining(['User ID is required'])
            });
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('validateUpdateGroceryItem', () => {
        test('should pass validation with valid update data', () => {
            req.body = {
                item_name: 'Updated Milk',
                quantity: 3,
                bought: true
            };

            GroceryValidation.validateUpdateGroceryItem(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        test('should pass validation with partial update', () => {
            req.body = {
                quantity: 5
            };

            GroceryValidation.validateUpdateGroceryItem(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        test('should fail validation with invalid quantity in update', () => {
            req.body = {
                quantity: -5
            };

            GroceryValidation.validateUpdateGroceryItem(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Validation failed',
                details: expect.arrayContaining(['Quantity must be a positive number'])
            });
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('validateItemId', () => {
        test('should pass validation with valid item ID', () => {
            req.params.id = '123';

            GroceryValidation.validateItemId(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(req.params.id).toBe(123);
            expect(res.status).not.toHaveBeenCalled();
        });

        test('should fail validation with invalid item ID', () => {
            req.params.id = 'invalid';

            GroceryValidation.validateItemId(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Invalid item ID',
                details: ['Item ID must be a positive integer']
            });
            expect(next).not.toHaveBeenCalled();
        });

        test('should fail validation with negative item ID', () => {
            req.params.id = '-1';

            GroceryValidation.validateItemId(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Invalid item ID',
                details: ['Item ID must be a positive integer']
            });
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('validateUserId', () => {
        test('should pass validation with valid user ID', () => {
            req.params.userId = '456';

            GroceryValidation.validateUserId(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(req.params.userId).toBe(456);
            expect(res.status).not.toHaveBeenCalled();
        });

        test('should fail validation with invalid user ID', () => {
            req.params.userId = 'invalid';

            GroceryValidation.validateUserId(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Invalid user ID',
                details: ['User ID must be a positive integer']
            });
            expect(next).not.toHaveBeenCalled();
        });
    });
});
