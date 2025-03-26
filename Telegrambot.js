require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

// ✅ Load environment variables
const botToken = process.env.BOT_TOKEN;
const movieApiKey = process.env.MOVIE_API_KEY;

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


/* =============================
  🎬 MOVIE SEARCH FUNCTION
============================= */
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

// ➤ /start Command
bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "👋 Welcome to the Movie & Music Bot!\nUse /help to see available commands.");
});

// ➤ /help Command
bot.onText(/\/help/, (msg) => {
    bot.sendMessage(
        msg.chat.id,
        "📌 Available Commands:\n" +
        "/start - Start the bot\n" +
        "/help - Show this message\n" +
        "/menu - Show menu with buttons\n" +
        "/echo <message> - Repeat your message\n" +
        "/movie <name> - Get movie details (with poster)\n" +
        "/music <song name> - Get music from YouTube"
    );
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
        } else {
            bot.sendMessage(chatId, movieDetails, { parse_mode: "Markdown" });
        }
    } else {
        bot.sendMessage(chatId, "❌ Movie not found!");
    }
});

/* =============================
  🎵 MUSIC SEARCH FUNCTION
============================= */
async function getMusic(chatId, songName) {
    const sanitizedSongName = songName.replace(/[^a-zA-Z0-9 ]/g, "").trim();
    const outputFilePath = path.join(__dirname, `${sanitizedSongName}.mp3`);

    bot.sendMessage(chatId, `🎵 Searching for "${songName}"...`);

    // Check if yt-dlp is installed
    exec("yt-dlp --version", (err) => {
        if (err) {
            bot.sendMessage(chatId, "❌ Error: yt-dlp is not installed. Please install it to use this feature.");
            return;
        }
        
        // Use yt-dlp to get the best audio format from YouTube
        const command = `yt-dlp -x --audio-format mp3 --output \"${outputFilePath}\" \"ytsearch1:${songName}\"`;

        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error("Error downloading music:", error);
                bot.sendMessage(chatId, "❌ Sorry, could not fetch the song.");
                return;
            }

            if (!fs.existsSync(outputFilePath)) {
                bot.sendMessage(chatId, "❌ Error: File not found after download.");
                return;
            }

            // Send the audio file to the user
            bot.sendAudio(chatId, fs.createReadStream(outputFilePath), {
                caption: `🎶 Here is your song: *${songName}*`,
                parse_mode: "Markdown"
            }).then(() => {
                fs.unlinkSync(outputFilePath); // Delete the file after sending
            }).catch(err => {
                console.error("Error sending music:", err);
                bot.sendMessage(chatId, "❌ Failed to send the song.");
            });
        });
    });
}

// ➤ /music Command
bot.onText(/\/music (.+)/, (msg, match) => {
    const songName = match[1];
    getMusic(msg.chat.id, songName);
});

// ➤ Handle Errors
bot.on("polling_error", (error) => {
    console.error("🚨 Polling Error:", error.message);
});