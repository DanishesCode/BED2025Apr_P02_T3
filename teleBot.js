const TelegramBot = require('node-telegram-bot-api');

function startBot() {
  const bot = new TelegramBot("8199800212:AAGfq6zaGFC8ktKqMmI6A7PGnO2YQWT45Qk", { polling: true });
  
  console.log("Telegram bot started");

  bot.on('message', (msg) => {
    console.log(`Received message from chatId=${msg.chat.id}: ${msg.text}`);
  });

  bot.onText(/\/chatid/, (msg) => {
    console.log(`/chatid command received from chatId=${msg.chat.id}`);
    bot.sendMessage(msg.chat.id, `Your chat ID is: ${msg.chat.id}`);
  });

  bot.on('polling_error', (error) => {
    console.error('Polling error:', error);
  });

  return bot;
}
const TelegramBot = require('node-telegram-bot-api');

let bot; // will hold the bot instance

function startBot() {
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
    console.error('Polling error:', error);
  });
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


module.exports = { startBot, sendMessage };

