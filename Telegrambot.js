require("dotenv").config();
const TelegramBot = require('node-telegram-bot-api');

// Debugging: Print token value
console.log("Bot Token:", process.env.BOT_TOKEN);

if (!process.env.BOT_TOKEN) {
    throw new Error("BOT_TOKEN is missing!");
}

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "Hello! I am your bot.");
});
