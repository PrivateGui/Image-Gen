const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const { Readable } = require('stream');
const fs = require('fs');

// API Keys
const TELEGRAM_BOT_TOKEN = '7510725977:AAHmeCufLyZdHRXnhY-WfbdrSRV08l8OJPI';
const HUGGING_FACE_API_KEY = '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';
const API_URL = 'https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell';

// Initialize Telegram Bot
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

// Function to generate an image using FLUX.1-schnell
async function generateImage(prompt) {
    try {
        const response = await axios({
            method: 'post',
            url: API_URL,
            data: { inputs: prompt },
            headers: {
                'Authorization': `Bearer ${HUGGING_FACE_API_KEY}`,
                'Content-Type': 'application/json'
            },
            responseType: 'arraybuffer'  // Get binary data directly
        });

        // Create a buffer from the response data
        const buffer = Buffer.from(response.data, 'binary');
        return buffer;
    } catch (error) {
        console.error('Error generating image:', error.message);
        throw error;
    }
}

// Handle "/gen" command
bot.onText(/\/gen (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const prompt = match[1];

    try {
        // Send typing action to show the bot is working
        await bot.sendChatAction(chatId, 'upload_photo');
        
        // Notify user that the image is being generated
        const statusMessage = await bot.sendMessage(chatId, `🎨 Generating image for: "${prompt}"...`);

        // Generate the image
        const imageBuffer = await generateImage(prompt);

        // Send the image directly using the buffer
        await bot.sendPhoto(chatId, imageBuffer, {
            caption: `✨ Generated image for: "${prompt}"`
        });

        // Delete the status message
        await bot.deleteMessage(chatId, statusMessage.message_id);
    } catch (error) {
        await bot.sendMessage(chatId, '❌ Failed to generate image. Please try again later.');
        console.error('Error in /gen command:', error.message);
    }
});

// Handle "/start" command
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const welcomeMessage = 
        '🎨 Welcome to the Image Generation Bot!\n\n' +
        'Use /gen followed by your prompt to generate an image.\n' +
        'Example: /gen a beautiful sunset over mountains';
    
    bot.sendMessage(chatId, welcomeMessage);
});

// Error handling for the bot
bot.on('polling_error', (error) => {
    console.error('Polling error:', error.message);
});

console.log('Bot is running...');
