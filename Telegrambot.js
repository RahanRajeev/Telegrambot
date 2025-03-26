require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");

// ✅ Load environment variables
const botToken = process.env.BOT_TOKEN;
const movieApiKey = process.env.MOVIE_API_KEY;

// 🛑 Check if API keys exist
if (!botToken) {
    console.error("❌ Error: BOT_TOKEN is missing! Set it in your Railway environment variables.");
    process.exit(1);
}

if (!movieApiKey) {
    console.error("❌ Error: MOVIE_API_KEY is missing! Set it in your Railway environment variables.");
    process.exit(1);
}

// ✅ Initialize Telegram bot
const bot = new TelegramBot(botToken, { polling: true });

/* 
=============================
  📌 BOT COMMAND HANDLERS
=============================
*/

// 🎬 Fetch Movie Information from OMDb API (Including Poster)
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
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error fetching movie data:", error.message);
        return null;
    }
}

// ➤ /start Command (Shows Start Button for New Users)
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(
        chatId,
        "👋 Welcome to the Movie Bot!\nUse the buttons below or type /help for commands.",
        {
            reply_markup: {
                keyboard: [[{ text: "🎬 Search Movie" }], [{ text: "/help" }]],
                resize_keyboard: true,
                one_time_keyboard: true
            }
        }
    );
});

// ➤ /help Command (Show Available Commands)
bot.onText(/\/help/, (msg) => {
    bot.sendMessage(
        msg.chat.id,
        "📌 Available Commands:\n" +
        "/start - Start the bot\n" +
        "/help - Show this message\n" +
        "/menu - Show menu with buttons\n" +
        "/echo <message> - Repeat your message\n" +
        "/movie <name> - Get movie details (with poster)"
    );
});

// ➤ /echo Command (Repeats User Message)
bot.onText(/\/echo (.+)/, (msg, match) => {
    const response = match[1]; // Extract the message after /echo
    bot.sendMessage(msg.chat.id, `🔄 You said: ${response}`);
});

// ➤ /menu Command (Buttons)
bot.onText(/\/menu/, (msg) => {
    const options = {
        reply_markup: {
            inline_keyboard: [
                [{ text: "🌍 Visit Google", url: "https://google.com" }],
                [{ text: "🎬 Search a Movie", callback_data: "search_movie" }],
                [{ text: "🤖 Click Me!", callback_data: "clicked" }]
            ]
        }
    };
    bot.sendMessage(msg.chat.id, "🔘 Choose an option:", options);
});

// ➤ /movie <name> Command (Search for Movie + Poster)
bot.onText(/\/movie (.+)/, async (msg, match) => {
    const movieName = match[1];
    const chatId = msg.chat.id;

    bot.sendMessage(chatId, "🔍 Searching for the movie...");
    const movie = await getMovieInfo(movieName);

    if (movie) {
        const movieDetails = `🎬 *Title:* ${movie.title}
📅 *Year:* ${movie.year}
⭐ *IMDB Rating:* ${movie.rating}
🎭 *Genre:* ${movie.genre}
📜 *Plot:* ${movie.plot}`;

        if (movie.poster) {
            // Send movie poster first, then details
            bot.sendPhoto(chatId, movie.poster, { caption: movieDetails, parse_mode: "Markdown" });
        } else {
            bot.sendMessage(chatId, movieDetails, { parse_mode: "Markdown" });
        }
    } else {
        bot.sendMessage(chatId, "❌ Movie not found!");
    }
});

// ➤ Handle Button Clicks
bot.on("callback_query", (query) => {
    const chatId = query.message.chat.id;

    if (query.data === "search_movie") {
        bot.sendMessage(chatId, "🎬 Type the movie name using `/movie <name>`");
    } else {
        bot.sendMessage(chatId, "✅ You clicked a button!");
    }
});

// ➤ Handle Regular Messages (If Not a Command)
bot.on("message", (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    // Auto-suggest /movie when user types "Search Movie"
    if (text.toLowerCase().includes("search movie")) {
        bot.sendMessage(chatId, "🎬 Type the movie name using `/movie <name>`");
    } else if (!text.startsWith("/")) {
        bot.sendMessage(chatId, `💬 You said: ${text}`);
    }
});

// ➤ Handle Polling Errors
bot.on("polling_error", (error) => {
    console.error("🚨 Polling Error:", error.message);
});
