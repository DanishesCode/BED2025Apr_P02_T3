// unitTesting/summarizerModel.test.js
const fetch = require('node-fetch');
const { Response } = jest.requireActual('node-fetch');
const summarizer = require('../../models/summarizerModel');

jest.mock('node-fetch');

describe('summarize', () => {
    const validText = 'This is a long article text that needs to be summarized. It contains multiple sentences that elaborate on a single topic.';

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('returns summary text on successful response', async () => {
        const mockResponse = {
            ok: true,
            json: async () => [
                { summary_text: 'This is a summary.' }
            ]
        };
        fetch.mockResolvedValue(mockResponse);

        const result = await summarizer.summarize(validText);
        expect(result).toBe('This is a summary.');
    });

    test('throws error on 503 model loading', async () => {
        fetch.mockResolvedValue({
            ok: false,
            status: 503
        });

        await expect(summarizer.summarize(validText)).rejects.toThrow(
            'The AI model is currently loading. Please try again in a few moments.'
        );
    });

    test('throws error on other HTTP error', async () => {
        fetch.mockResolvedValue({
            ok: false,
            status: 500
        });

        await expect(summarizer.summarize(validText)).rejects.toThrow(
            'HTTP error! status: 500'
        );
    });

    test('throws error if response has "error" field', async () => {
        fetch.mockResolvedValue({
            ok: true,
            json: async () => ({
                error: 'Rate limit exceeded'
            })
        });

        await expect(summarizer.summarize(validText)).rejects.toThrow('Rate limit exceeded');
    });

    test('throws error on unexpected response format', async () => {
        fetch.mockResolvedValue({
            ok: true,
            json: async () => ({ some: 'junk' })
        });

        await expect(summarizer.summarize(validText)).rejects.toThrow('Unexpected response format from the API.');
    });
});
