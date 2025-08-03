// tests/summarizerController.test.js
const summarizerController = require('../../controllers/summarizerController.js');
const summarizerModel = require('../../models/summarizerModel.js');

jest.mock('../../models/summarizerModel.js'); // Mock the model

describe('summarizeText Controller', () => {
    let req, res;

    beforeEach(() => {
        req = {
            body: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        jest.clearAllMocks();
    });

    test('should return 400 if no text is provided', async () => {
        req.body.text = '';
        await summarizerController.summarizeText(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: 'Please provide at least 50 characters of text.'
        });
    });

    test('should return 400 if text is too short', async () => {
        req.body.text = 'Short text';
        await summarizerController.summarizeText(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: 'Please provide at least 50 characters of text.'
        });
    });

    test('should return summary if input is valid', async () => {
        req.body.text = 'This is a valid input text that is long enough to be summarized properly.';
        const mockSummary = 'This is the summary.';
        summarizerModel.summarize.mockResolvedValue(mockSummary);

        await summarizerController.summarizeText(req, res);

        expect(summarizerModel.summarize).toHaveBeenCalledWith(req.body.text);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            summary: mockSummary
        });
    });

    test('should return 500 on summarizerModel error', async () => {
        req.body.text = 'This is a valid input text that is long enough to be summarized properly.';
        summarizerModel.summarize.mockRejectedValue(new Error('API failure'));

        await summarizerController.summarizeText(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            error: 'API failure'
        });
    });
});
