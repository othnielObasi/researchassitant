const fs = require('fs').promises;
const path = require('path');
const memoryFilePath = path.join(__dirname, 'memory.json');

// Load conversation history from memory.json
async function loadConversationHistory() {
    try {
        const rawData = await fs.readFile(memoryFilePath, 'utf-8');
        return JSON.parse(rawData);
    } catch (error) {
        console.error('Error loading conversation history:', error);
        return { messages: [] };
    }
}

// Save conversation history to memory.json
async function saveConversationHistory(history) {
    try {
        const data = JSON.stringify(history, null, 2); // Indent JSON for readability
        await fs.writeFile(memoryFilePath, data, 'utf-8');
    } catch (error) {
        console.error('Error saving conversation history:', error);
    }
}

module.exports = { loadConversationHistory, saveConversationHistory };
