const TelegramBot = require('node-telegram-bot-api');

let bot; // will hold the bot instance
let pollingConflict = false;

function startBot() {
  try {
    bot = new TelegramBot(process.env.TeleBot_Token, { polling: true });

    console.log("Telegram bot started");

    bot.on('message', (msg) => {
      console.log(`Received message from chatId=${msg.chat.id}: ${msg.text}`);
    });

    bot.onText(/\/chatid/, (msg) => {
      console.log(`/chatid command received from chatId=${msg.chat.id}`);
      bot.sendMessage(msg.chat.id, `Your chat ID is: ${msg.chat.id}`);
    });

    bot.on('polling_error', (error) => {
      if (error.code === 'ETELEGRAM' && error.response?.body?.error_code === 409) {
        if (!pollingConflict) {
          console.log('Telegram bot polling conflict - another instance may be running');
          pollingConflict = true;
        }
        // Optionally, you could stop the bot here:
        // bot.stopPolling();
      } else {
        console.error('Telegram polling error:', error.message);
      }
    });
  } catch (error) {
    console.error('Failed to start Telegram bot:', error.message);
  }
}

async function sendMessage(chatId, text) {
  if (!bot) {
    console.error("Bot is not started yet! Call startBot() first.");
    return false;
  }
  try {
    await bot.sendMessage(chatId, text);
    return true;  // success
  } catch (error) {
    console.error(`Failed to send message to chatId ${chatId}:`, error.message);
    return false; // failure
  }
}


module.exports = { startBot,sendMessage};

