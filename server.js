require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const WebSocket = require('ws');
const axios = require('axios'); // Import axios
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'your-api-key';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

// Security Middleware
app.use(helmet());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cors());

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});
app.use('/gemini', limiter);

// WebSocket Server
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
    console.log('✅ New WebSocket connection established');

    ws.on('message', async (message) => { // Make this function async
        try {
            const userMessage = message.toString().trim(); // Convert message to string and trim spaces
            console.log("Received message:", userMessage);

            const response = await axios.post(
                "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent",
                { contents: [{ parts: [{ text: userMessage }] }] },
                { params: { key: GEMINI_API_KEY }, headers: { "Content-Type": "application/json" } }
            );

            console.log("Gemini Response:", response.data);

            let botReply = response.data.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't process that.";
            botReply = botReply.replace(/\*/g, '').replace(/\\. /g, '\n');

            ws.send(JSON.stringify({ type: "chat", message: botReply }));
        } catch (error) {
            console.error("❌ Gemini API Error:", error.response?.data || error.message);
            ws.send(JSON.stringify({ type: "chat", message: "I'm having trouble responding right now. Please try again later." }));
        }
    });

    ws.on('close', () => {
        console.log('WebSocket connection closed');
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

// Gemini API endpoint
app.post('/gemini', async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt || typeof prompt !== 'string') {
            return res.status(400).json({
                success: false,
                error: "Invalid prompt. Please provide a valid text prompt."
            });
        }

        const healthPrompt = `As a health assistant, provide helpful advice about the following health query: ${prompt}`;

        const result = await model.generateContent(healthPrompt);
        const response = await result.response.text();

        res.status(200).json({
            success: true,
            response: response + "\n\n⚠️ Note: Consult a healthcare professional for personalized medical advice."
        });

    } catch (error) {
        console.error('❌ Gemini API Error:', error);
        res.status(500).json({
            success: false,
            error: "Service unavailable. Please try again later."
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('❌ Server error:', err);
    res.status(500).json({
        success: false,
        error: "An unexpected error occurred. Please try again later."
    });
});

// Static Files
app.use(express.static('public'));

// Start server
app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
});