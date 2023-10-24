document.addEventListener("DOMContentLoaded", function () {
    const chatMessages = document.getElementById("chat-messages");
    const userInput = document.getElementById("user-input");
    const sendButton = document.getElementById("send-button");

    // Event listener for sending user input
    sendButton.addEventListener("click", () => {
        const userMessage = userInput.value;
        displayUserMessage(userMessage);
        userInput.value = ""; // Clear the input field
        sendUserMessageToAssistant(userMessage);
    });

    // Function to display user message in the chat
    function displayUserMessage(message) {
        const userMessageElement = document.createElement("div");
        userMessageElement.className = "user-message";
        userMessageElement.textContent = `You: ${message}`;
        chatMessages.appendChild(userMessageElement);
    }

    // Function to display assistant's response in the chat
    function displayAssistantResponse(response) {
        const assistantMessageElement = document.createElement("div");
        assistantMessageElement.className = "assistant-message";
        assistantMessageElement.textContent = `Assistant: ${response}`;
        chatMessages.appendChild(assistantMessageElement);
    }

    // Function to send user message to the backend API
    function sendUserMessageToAssistant(message) {
        fetch('/api/research', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: message }),
        })
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then((data) => {
            displayAssistantResponse(data.response);
        })
        .catch((error) => {
            console.error('Error:', error);
        });
    }
});
