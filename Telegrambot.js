require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

// ✅ Load environment variables
const botToken = process.env.BOT_TOKEN;
const movieApiKey = process.env.MOVIE_API_KEY;
const weatherApiKey = process.env.WEATHER_API_KEY;
const currencyApiKey = process.env.CURRENCY_API_KEY;

if (!botToken) {
    console.error("❌ Error: BOT_TOKEN is missing!");
    process.exit(1);
}

// ✅ Initialize Telegram bot
const bot = new TelegramBot(botToken, { polling: true });

/* ================================
  🎬 MOVIE SEARCH FUNCTION
================================= */
async function getMovieInfo(movieName) {
    try {
        const response = await axios.get(`http://www.omdbapi.com/?t=${movieName}&apikey=${movieApiKey}`);
        if (response.data.Response === "True") {
            return {
                title: response.data.Title,
                year: response.data.Year,
                rating: response.data.imdbRating,
                genre: response.data.Genre,
                plot: response.data.Plot,
                poster: response.data.Poster !== "N/A" ? response.data.Poster : null
            };
        } else return null;
    } catch (error) {
        console.error("Error fetching movie data:", error.message);
        return null;
    }
}

// ➤ /start Command
bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "👋 Welcome to the Smart Telegram Bot!\nUse /menu to see available commands.");
});

// ➤ /help Command
bot.onText(/\/help/, (msg) => {
    bot.sendMessage(
        msg.chat.id,
        "📌 Available Commands:\n" +
        "/start - Start the bot\n" +
        "/help - Show help\n" +
        "/menu - Show command list\n" +
        "/movie <name> - Get movie details\n" +
        "/music <song name> - Download music\n" +
        "/weather <city> - Get weather info\n" +
        "/time - Get current time\n" +
        "/crypto <symbol> - Get cryptocurrency price\n" +
        "/news - Get latest news\n" +
        "/fact - Get a random fact\n" +
        "/joke - Get a joke\n" +
        "/calc <expression> - Calculator"
    );
});

// ➤ /menu Command
bot.onText(/\/menu/, (msg) => {
    const menuText =
        "📌 *Main Menu*\n\n" +
        "🎬 /movie <name> - Search for a movie\n" +
        "🎵 /music <song name> - Download music\n" +
        "🌦 /weather <city> - Get weather\n" +
        "⏰ /time - Current time\n" +
        "📈 /crypto <symbol> - Crypto price\n" +
        "📰 /news - Latest news\n" +
        "📖 /fact - Fun fact\n" +
        "😂 /joke - Get a joke\n" +
        "🧮 /calc <expression> - Calculator\n";
    
    bot.sendMessage(msg.chat.id, menuText, { parse_mode: "Markdown", disable_web_page_preview: true });
});

// ➤ /movie Command
bot.onText(/\/movie (.+)/, async (msg, match) => {
    const movieName = match[1];
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "🔍 Searching for the movie...");
    const movie = await getMovieInfo(movieName);
    if (movie) {
        const movieDetails = `🎬 *Title:* ${movie.title}\n📅 *Year:* ${movie.year}\n⭐ *IMDB Rating:* ${movie.rating}\n🎭 *Genre:* ${movie.genre}\n📜 *Plot:* ${movie.plot}`;
        if (movie.poster) {
            bot.sendPhoto(chatId, movie.poster, { caption: movieDetails, parse_mode: "Markdown" });
        } else bot.sendMessage(chatId, movieDetails, { parse_mode: "Markdown" });
    } else {
        bot.sendMessage(chatId, "❌ Movie not found!");
    }
});

// ➤ /time Command
bot.onText(/\/time/, (msg) => {
    const time = new Date().toLocaleString();
    bot.sendMessage(msg.chat.id, `⏰ Current time: ${time}`);
});

// ➤ /weather Command
bot.onText(/\/weather (.+)/, async (msg, match) => {
    const city = match[1];
    try {
        const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${weatherApiKey}&units=metric`);
        const data = response.data;
        const weatherText = `🌦 *Weather in ${data.name}*\nTemperature: ${data.main.temp}°C\nCondition: ${data.weather[0].description}`;
        bot.sendMessage(msg.chat.id, weatherText, { parse_mode: "Markdown" });
    } catch {
        bot.sendMessage(msg.chat.id, "❌ Error: City not found.");
    }
});

// ➤ /crypto Command
bot.onText(/\/crypto (.+)/, async (msg, match) => {
    const symbol = match[1].toUpperCase();
    try {
        const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${symbol}&vs_currencies=usd`);
        const price = response.data[symbol.toLowerCase()]?.usd;
        if (price) bot.sendMessage(msg.chat.id, `💰 *${symbol} Price:* $${price}`, { parse_mode: "Markdown" });
        else bot.sendMessage(msg.chat.id, "❌ Error: Cryptocurrency not found.");
    } catch {
        bot.sendMessage(msg.chat.id, "❌ Error fetching crypto price.");
    }
});

// ➤ /news Command
bot.onText(/\/news/, async (msg) => {
    try {
        const response = await axios.get(`https://newsapi.org/v2/top-headlines?country=us&apiKey=${process.env.NEWS_API_KEY}`);
        const articles = response.data.articles.slice(0, 5).map(article => `📰 [${article.title}](${article.url})`);
        bot.sendMessage(msg.chat.id, `📢 *Top News:*\n\n${articles.join("\n")}`, { parse_mode: "Markdown", disable_web_page_preview: true });
    } catch {
        bot.sendMessage(msg.chat.id, "❌ Error fetching news.");
    }
});

// ➤ /fact Command
bot.onText(/\/fact/, async (msg) => {
    const response = await axios.get("https://uselessfacts.jsph.pl/random.json?language=en");
    bot.sendMessage(msg.chat.id, `🤓 Fun Fact: ${response.data.text}`);
});

// ➤ /joke Command
bot.onText(/\/joke/, async (msg) => {
    const response = await axios.get("https://official-joke-api.appspot.com/random_joke");
    bot.sendMessage(msg.chat.id, `😂 ${response.data.setup}\n👉 ${response.data.punchline}`);
});

// ➤ /calc Command
bot.onText(/\/calc (.+)/, (msg, match) => {
    try {
        const result = eval(match[1]);
        bot.sendMessage(msg.chat.id, `🧮 Result: ${result}`);
    } catch {
        bot.sendMessage(msg.chat.id, "❌ Invalid calculation.");
    }
});

// ➤ Handle Errors
bot.on("polling_error", (error) => {
    console.error("🚨 Polling Error:", error.message);
});

