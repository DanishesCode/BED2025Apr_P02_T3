const inputText = document.getElementById('inputText');
const outputSection = document.getElementById('outputSection');
const summaryText = document.getElementById('summaryText');
const summarizeBtn = document.getElementById('summarizeBtn');
const errorMessage = document.getElementById('errorMessage');
const initialInput = document.getElementById('initialInput');
const outputHeader = document.getElementById('outputHeader');
const token = localStorage.getItem('authToken');

async function summarizeText(textInput, button) {
    const text = textInput.value.trim();
    
    if (!text) {
        showError('Please enter some text to summarize.');
        return;
    }

    if (text.length < 50) {
        showError('Please enter at least 50 characters for meaningful summarization.');
        return;
    }

    // Show loading state with animations
    button.classList.add('loading');
    button.disabled = true;
    hideError();

    // Show output section with staggered animations
    outputSection.style.display = 'block';
    outputHeader.textContent = 'Please wait, summarizing...';
    summaryText.classList.remove('show');
    summaryText.classList.add('blur');
    summaryText.textContent = '';
    initialInput.classList.add('shifted');
    setTimeout(() => {
        outputSection.classList.add('show');
    }, 200);

    try {
        const response = await fetch('http://localhost:3000/api/summarize', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ text })
        });

        if (!response.ok) {
            if (response.status === 503) {
                throw new Error('The AI model is currently loading. Please try again in a few moments.');
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.error) {
            throw new Error(result.error);
        }

        if (result && result.summary) {
            // Remove loading state and display summary with smooth animation
            setTimeout(() => {
                summaryText.classList.remove('blur');
                summaryText.classList.remove('loading');
                summaryText.classList.add('word-by-word');
                outputHeader.textContent = 'Here is the summarized version:';
                wordByWordReveal(result.summary);
            }, 1200); // Delay to show loading animation
        } else {
            throw new Error('Unexpected response format from the API.');
        }

    } catch (error) {
        console.error('Summarization error:', error);
        summaryText.classList.remove('loading');
        
        outputSection.classList.remove('show');
        setTimeout(() => {
            outputSection.style.display = 'none';
        }, 400);
        initialInput.classList.remove('shifted');
        
        showError(`Failed to summarize text: ${error.message}`);
    } finally {
        button.classList.remove('loading');
        button.disabled = false;
    }
}

// Word-by-word reveal with blur fade-out
function wordByWordReveal(summary) {
    summaryText.innerHTML = '';
    summaryText.classList.add('blur');
    summaryText.classList.remove('show');
    const words = summary.split(' ');
    words.forEach((word, idx) => {
        const span = document.createElement('span');
        span.textContent = word + (idx < words.length - 1 ? ' ' : '');
        summaryText.appendChild(span);
    });
    const spans = summaryText.querySelectorAll('span');
    let i = 0;
    function showNextWord() {
        if (i < spans.length) {
            spans[i].classList.add('visible');
            if (i === Math.floor(spans.length * 0.5)) {
                summaryText.classList.remove('blur'); // Remove blur halfway
            }
            i++;
            setTimeout(showNextWord, 70);
        } else {
            summaryText.classList.remove('blur');
            summaryText.classList.add('show');
        }
    }
    showNextWord();
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
    setTimeout(() => {
        hideError();
    }, 5000);
}

function hideError() {
    errorMessage.classList.remove('show');
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 400);
}

// Event listeners
summarizeBtn.addEventListener('click', () => summarizeText(inputText, summarizeBtn));

// Keyboard shortcuts
inputText.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        summarizeText(inputText, summarizeBtn);
    }
});

// Add subtle hover effects
inputText.addEventListener('focus', function() {
    this.parentElement.style.transform += ' translateY(-2px)';
    this.parentElement.style.boxShadow = '0 8px 25px rgba(233, 30, 99, 0.15)';
});
inputText.addEventListener('blur', function() {
    this.parentElement.style.transform = 'translateY(0)';
    this.parentElement.style.boxShadow = 'none';
});