const sql = require('mssql');
const dbConfig = require('../dbConfig'); // Adjust the path as necessary

const GEMINI_API_KEY = process.env.GEMINI_API_KEY; // <-- Replace this!
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + GEMINI_API_KEY;

async function getGeminiResponse (userMessage, name = 'User') {
    const body = {
        contents: [
            {
                role: "user",
                parts: [
                    {
                        text: "You are a friendly virtual assistant designed to help seniors." +
                              "Your goal is to provide clear, simple, and helpful answers to their questions. " +
                              "Keep answers concise, easy to understand, and gentle in tone. " +
                              "Avoid technical jargon. When possible, explain things step by step. " +
                              "Give accurate and helpful responses tailored to someone who may not be tech-savvy." +
                              `The name of the user is ${name}. Use it if the question requires a personalised response.` +
                              "If you don't know the answer, say so politely and suggest they ask someone else for help. "
                    }
                ]
            },
            {
                role: "user",
                parts: [
                    {
                        text: userMessage
                    }
                ]
            }
        ]
    };

    try {
        const response = await fetch(GEMINI_API_URL, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`API Error: ${response.status} ${errText}`);
        }

        const data = await response.json();
        const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        return reply || "Sorry, I'm having trouble processing your request. Please try again.";
    } catch (error) {
        console.error("Error fetching Gemini response:", error);
        throw new Error("Failed to get Gemini response");
    }
}

async function saveMessage(chatId, senderId, message, is_ai) {
    let connection;
    try {
      connection = await sql.connect(dbConfig);
      const query = `
        INSERT INTO Messages (chat_id, sender_id, message, is_ai)
        OUTPUT INSERTED.id
        VALUES (@chatId, @senderId, @message, @is_ai);
      `;
      const request = connection.request();
      request.input("chatId", sql.Int, chatId);
      request.input("senderId", sql.Int, senderId);
      request.input("message", sql.NVarChar, message);
      request.input("is_ai", sql.Int, is_ai);
      const result = await request.query(query);
      return result.recordset[0].id;
    } catch (error) {
      console.error("Database error:", error);
      throw error;
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (err) {
          console.error("Error closing connection:", err);
        }
      }
    }
}

async function retrieveChats(userId) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = `
      SELECT id, title, created_at
      FROM Chats
      WHERE userId = @userId
      ORDER BY created_at DESC
    `;
    const request = connection.request();
    request.input("userId", sql.Int, userId);
    const result = await request.query(query);
    return result.recordset;

  } catch (error) {
    console.error("Database error:", error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Error closing connection:", err);
      }
    }
  }
}

async function retrieveMessages(chat_id) {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = `
      SELECT chat_id, sender_id, message, created_at, is_ai
      FROM Messages
      WHERE chat_id = @chat_id
      ORDER BY created_at ASC
    `;
    const request = connection.request();
    request.input("chat_id", sql.Int, chat_id);
    const result = await request.query(query);
    return result.recordset;

  } catch (error) {
    console.error("Database error:", error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Error closing connection:", err);
      }
    }
  }
}

async function createChat(userId, title = 'New Chat') {
  let connection;
  try {
    connection = await sql.connect(dbConfig);
    const query = `
      INSERT INTO Chats (userId, title)
      OUTPUT INSERTED.id
      VALUES (@userId, @title);
    `;
    const request = connection.request();
    request.input("userId", sql.Int, userId);
    request.input("title", sql.NVarChar, title);
    const result = await request.query(query);
    return result.recordset[0].id;
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Error closing connection:", err);
      }
    }
  }
}

module.exports = {
    getGeminiResponse,
    retrieveChats,
    retrieveMessages,
    saveMessage,
    createChat
  };