import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Single model configuration
const model = genAI.getGenerativeModel({
    model: "gemini-pro",
    generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
    }
});

// Simple rate limiter
let requestsThisMinute = 0;
const MAX_REQUESTS_PER_MINUTE = 60;
let lastResetTime = Date.now();

// Simple conversation history
const conversationHistory = new Map();

export const generatePrompt = async (prompt, projectId) => {
    try {
        // Reset counter if a minute has passed
        if (Date.now() - lastResetTime > 60000) {
            requestsThisMinute = 0;
            lastResetTime = Date.now();
        }

        // Check rate limit
        if (requestsThisMinute >= MAX_REQUESTS_PER_MINUTE) {
            throw new Error("Rate limit reached. Please wait a minute.");
        }

        // Get project history or initialize it
        const history = conversationHistory.get(projectId) || [];
        
        // Add context from last 5 messages
        const context = history.slice(-5).map(msg => msg.text).join('\n');
        const fullPrompt = context ? `${context}\n\nNew question: ${prompt}` : prompt;

        // Generate response
        const result = await model.generateContent(fullPrompt);
        const response = result.response.text();
        requestsThisMinute++;

        // Update history
        conversationHistory.set(projectId, [
            ...history,
            { text: prompt, isAI: false },
            { text: response, isAI: true }
        ].slice(-10)); // Keep last 10 messages

        return response;

    } catch (error) {
        console.error("AI Generation Error:", error);
        throw new Error(error.message);
    }
};

// Clean up old histories every hour
setInterval(() => {
    conversationHistory.clear();
}, 3600000);