require("dotenv").config();
const TelegramBot = require('node-telegram-bot-api');

console.log("Bot Token:", process.env.BOT_TOKEN); // Debugging step

const token = process.env.BOT_TOKEN;
if (!token) {
    console.error("Error: BOT_TOKEN is missing!");
    process.exit(1); // Stop execution if no token is found
}

const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "Hello! I am your bot.");
});
