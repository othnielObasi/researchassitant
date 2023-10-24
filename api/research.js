
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const express = require('express');
const fetch = require('node-fetch');
const { OpenAIApi } = require("openai");
const { openaiApiKey, serpapiKey } = process.env;
const { loadConversationHistory, saveConversationHistory } = require('./utils/conversationHistory');


const app = express();
const port = process.env.PORT || 3000;


app.use(express.json());

// Define a route for the root URL
app.get('/', (req, res) => {
  res.send('Welcome to the research assistant.'); // Customize the response as needed
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});


// Endpoint for handling research queries
app.post('/api/research', async (req, res) => {
    try {
        const query = req.body.query;
        const conversationHistory = loadConversationHistory();

        // Add the user's query to the conversation history
        conversationHistory.messages.push({ role: 'user', content: query });

        // Process the user's input and respond
        const response = await processUserInput(query, conversationHistory);

        // Save the updated conversation history
        saveConversationHistory(conversationHistory);

        res.status(200).json({ response, conversationHistory });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

// Function to process user input and generate responses
async function processUserInput(input, conversationHistory) {
    const openai = new OpenAIApi({ key: openaiApiKey });

    // Check if the user's input contains keywords like "research" or "study"
    const isResearchQuery = input.toLowerCase().includes("research") || input.toLowerCase().includes("study");

    // Create a conversation prompt by combining user messages
    const conversationPrompt = conversationHistory.messages.map(message => `${message.role}: ${message.content}`).join('\n');

    if (isResearchQuery) {
        // User is initiating research, so let's conduct the research
        const researchQuery = input; // You can extract specific research-related keywords

        // Use SERPAPI to fetch academic articles
        const serpapiUrl = `https://serpapi.com/search?q=${researchQuery}&engine=google_scholar&api_key=${serpapiKey}`;
        const serpapiResponse = await fetch(serpapiUrl);
        const articles = await serpapiResponse.json();

        // Prepare a list of articles for GPT-3
        const articleList = articles.map((article, index) => {
            return `${index + 1}. ${article.title}. ${article.link}`;
        });

        // Use GPT-3 to generate content
        const gpt3Response = await openai.createCompletion({
            engine: "text-davinci-002",
            prompt: `Please generate content on the topic '${researchQuery}' based on the following articles:\n${articleList.join('\n')}`,
            max_tokens: 500  // Adjust the token limit based on your requirements
        });

        const content = gpt3Response.choices[0].text;

        // Generate reference citations
        const citations = articles.map((article) => {
            // Modify this logic to format citations according to your preferred citation style
            return `${article.author}. (${article.published_date}). ${article.title}. ${article.link}`;
        });

        // Construct a research report
        const researchReport = `Research Query: ${researchQuery}\n\nResearch Findings:\n${content}\n\nReferences:\n${citations.join('\n')}`;

        // Add research findings and citations to the conversation history
        conversationHistory.messages.push({ role: 'assistant', content: `Here are the research findings:\n${content}` });
        conversationHistory.messages.push({ role: 'assistant', content: `Here are the references:\n${citations.join('\n')}` });
        conversationHistory.messages.push({ role: 'assistant', content: `Research report:\n${researchReport}` });

        return researchReport;
    } else {
        // If no research query is detected, use GPT-3 to provide a response based on the entire conversation
        const gpt3Response = await openai.createCompletion({
            engine: "text-davinci-002",
            prompt: `${conversationPrompt}\nUser: ${input}`,
            max_tokens: 500  // Adjust the token limit based on your requirements
        });

        const assistantMessage = gpt3Response.choices[0].text;
        conversationHistory.messages.push({ role: 'assistant', content: assistantMessage });

        return assistantMessage;
    }
}

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
