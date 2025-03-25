const TelegramBot = require('node-telegram-bot-api');

// Replace with your actual bot token from BotFather
const token = "7856317687:AAEO_zViqJZ9ue91xzRCLXjURTTDpbPlWfk";

// Enable polling
const bot = new TelegramBot(token, { polling: true });
const options = {
    reply_markup: {
        inline_keyboard: [
            [{ text: "Visit Google", url: "https://google.com" }],
            [{ text: "Click Me!", callback_data: "clicked" }]
        ]
    }
};

bot.onText(/\/menu/, (msg) => {
    bot.sendMessage(msg.chat.id, "Choose an option:", options);
});

bot.on("callback_query", (query) => {
    bot.sendMessage(query.message.chat.id, "You clicked a button!");
});


// Start command
bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "Hello! I am your bot. How can I assist you?");
});
bot.onText(/\/help/, (msg) => {
    bot.sendMessage(msg.chat.id, "Here are the available commands:\n/start - Start the bot\n/help - Show this message");
});

// Echo received messages
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    if (msg.text !== "/start") {
        bot.sendMessage(chatId, `You said: ${msg.text}`);
    }
});

// Error handling
bot.on("polling_error", (error) => {
    console.error("Polling Error:", error);
});
