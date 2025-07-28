const fetch = require('node-fetch');

const HUGGINGFACE_API_URL = 'https://api-inference.huggingface.co/models/facebook/bart-large-cnn';
const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;

exports.summarize = async (text) => {
    const response = await fetch(HUGGINGFACE_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`
        },
        body: JSON.stringify({
            inputs: text,
            parameters: {
                max_length: Math.min(142, Math.floor(text.length * 0.3)),
                min_length: 30,
                do_sample: false
            }
        })
    });

    if (!response.ok) {
        if (response.status === 503) {
            throw new Error('The AI model is currently loading. Please try again in a few moments.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    if (result.error) throw new Error(result.error);
    if (result && result[0] && result[0].summary_text) {
        return result[0].summary_text;
    }
    throw new Error('Unexpected response format from the API.');
};