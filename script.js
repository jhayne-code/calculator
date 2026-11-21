

// Reference to display element
const display = document.getElementById('display');

// Track if a calculation was just performed
let isCalculated = false;

// Supported operators
const OPERATORS = ['+', '−', '×', '÷', '%'];

/**
 * Appends a digit (0-9) to the display.
 * @param {number|string} number - The digit to append
 */
function appendNumber(number) {
    if (isCalculated) {
        display.value = '';
        isCalculated = false;
    }

    // Replace initial single '0' unless adding decimal or additional digits
    if (display.value === '0') {
        display.value = number.toString();
    } else {
        display.value += number.toString();
    }
}

/**
 * Appends double zero ('00') to the display (for backward compatibility).
 */
function appendDoubleZero() {
    if (isCalculated) {
        display.value = '';
        isCalculated = false;
    }

    if (display.value !== '' && display.value !== '0') {
        display.value += '00';
    } else if (display.value === '') {
        display.value = '0';
    }
}

/**
 * Toggles the sign (+/-) of the current number segment.
 */
function toggleSign() {
    if (display.value === '' || display.value === '0') {
        return;
    }

    // Split expression by operators to locate the last number segment
    const parts = display.value.split(/([+−×÷%])/);
    let lastPart = parts[parts.length - 1];

    if (lastPart === '') return;

    if (lastPart.startsWith('−')) {
        parts[parts.length - 1] = lastPart.substring(1);
    } else {
        parts[parts.length - 1] = '−' + lastPart;
    }

    display.value = parts.join('');
}

/**
 * Normalizes input operator to consistent visual mathematical symbols:
 * '*' or 'x' -> '×'
 * '/'       -> '÷'
 * '-'       -> '−'
 * @param {string} operator
 * @returns {string} Consistent visual math symbol
 */
function normalizeOperator(operator) {
    if (operator === '*' || operator.toLowerCase() === 'x') return '×';
    if (operator === '/') return '÷';
    if (operator === '-') return '−';
    return operator;
}

/**
 * Appends an operator to the display.
 * Always renders consistent symbols ('×', '÷', '−', '+', '%').
 * @param {string} operator - The operator symbol
 */
function appendOperator(operator) {
    const symbol = normalizeOperator(operator);

    if (isCalculated) {
        isCalculated = false;
    }

    if (display.value === '') {
        // Allow negative number entry at the start
        if (symbol === '−') {
            display.value = '−';
        }
        return;
    }

    const lastChar = display.value.slice(-1);

    // If the last character is already an operator, replace it with the new one
    if (OPERATORS.includes(lastChar)) {
        display.value = display.value.slice(0, -1) + symbol;
    } else {
        display.value += symbol;
    }
}

/**
 * Appends a decimal point.
 * Ensures only one decimal point exists per current number segment.
 */
function appendDecimal() {
    if (isCalculated) {
        display.value = '0';
        isCalculated = false;
    }

    if (display.value === '') {
        display.value = '0.';
        return;
    }

    // Split expression by all operators to get the active number segment
    const parts = display.value.split(/[+−×÷%]/);
    const currentNumber = parts[parts.length - 1];

    if (!currentNumber.includes('.')) {
        display.value += '.';
    }
}

/**
 * Clears the entire display (AC button).
 */
function clearDisplay() {
    display.value = '';
    isCalculated = false;
}

/**
 * Deletes the last character from the display (Backspace/DEL button).
 */
function deleteLast() {
    if (isCalculated) {
        clearDisplay();
        return;
    }
    display.value = display.value.slice(0, -1);
}

/**
 * Evaluates the mathematical expression and displays the result (= button).
 */
function calculate() {
    if (display.value === '') return;

    try {
        let expression = display.value;

        // Convert UI symbols to JavaScript evaluatable operators
        expression = expression.replace(/×/g, '*')
                               .replace(/÷/g, '/')
                               .replace(/−/g, '-');

        // Strip trailing operators if user pressed equals prematurely (e.g., '8×' -> '8')
        expression = expression.replace(/[+\-*/%]+$/, '');
        if (expression === '') return;

        // Handle percentage calculation (% -> /100)
        expression = expression.replace(/(\d+(\.\d+)?)%/g, '($1/100)');

        // Validate character whitelist
        if (!/^[0-9+\-*/.() ]+$/.test(expression)) {
            display.value = 'Error';
            isCalculated = true;
            return;
        }

        // Detect direct division by zero
        if (/\/0(?!\.)(\D|$)/.test(expression)) {
            display.value = 'Error';
            isCalculated = true;
            return;
        }

        // Evaluate using safe Function constructor
        const result = Function(`'use strict'; return (${expression})`)();

        if (isNaN(result) || !isFinite(result)) {
            display.value = 'Error';
        } else {
            // Round floating-point precision issues to max 8 decimal places
            const formatted = Math.round(result * 100000000) / 100000000;
            display.value = formatted.toString();
        }

        isCalculated = true;
    } catch (error) {
        display.value = 'Error';
        isCalculated = true;
    }
}

/* --------------------------------------------------------------------------
   Physical Keyboard Support (Desktop usability)
   -------------------------------------------------------------------------- */
window.addEventListener('keydown', (event) => {
    const key = event.key;

    // Numbers 0 - 9
    if (key >= '0' && key <= '9') {
        appendNumber(key);
        event.preventDefault();
    }
    // Operators
    else if (key === '*' || key.toLowerCase() === 'x') {
        appendOperator('×');
        event.preventDefault();
    }
    else if (key === '/') {
        appendOperator('÷');
        event.preventDefault();
    }
    else if (key === '-') {
        appendOperator('−');
        event.preventDefault();
    }
    else if (key === '+') {
        appendOperator('+');
        event.preventDefault();
    }
    else if (key === '%') {
        appendOperator('%');
        event.preventDefault();
    }
    // Decimal point
    else if (key === '.') {
        appendDecimal();
        event.preventDefault();
    }
    // Equals / Enter
    else if (key === 'Enter' || key === '=') {
        calculate();
        event.preventDefault();
    }
    // Backspace / Delete
    else if (key === 'Backspace') {
        deleteLast();
        event.preventDefault();
    }
    // Clear (Escape or 'c')
    else if (key === 'Escape' || key.toLowerCase() === 'c') {
        clearDisplay();
        event.preventDefault();
    }
});
