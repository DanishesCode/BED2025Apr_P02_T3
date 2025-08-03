const sql = require('mssql');
const {
  getGeminiResponse,
  retrieveChats,
  retrieveMessages,
  saveMessage,
  createChat,
  renameChat,
  deleteChat
} = require('../../models/aichatModel.js');


jest.mock('mssql');
global.fetch = require('jest-fetch-mock');

describe('getGeminiResponse', () => {
  beforeEach(() => {
    fetch.resetMocks();
  });

  it('should return a valid Gemini response', async () => {
    fetch.mockResponseOnce(JSON.stringify({
      candidates: [
        { content: { parts: [{ text: "Hello User!" }] } }
      ]
    }));

    const response = await getGeminiResponse('Hi there!', 'User');
    expect(response).toBe('Hello User!');
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('should handle failed response', async () => {
    fetch.mockResponseOnce('Service Unavailable', { status: 503 });

    await expect(getGeminiResponse('Test')).rejects.toThrow('Failed to get Gemini response');
  });
});

describe('Database functions', () => {
  let mockRequest;

  beforeEach(() => {
    mockRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn()
    };

    sql.connect.mockResolvedValue({
      request: () => mockRequest,
      close: jest.fn()
    });
  });

  it('should create a new chat', async () => {
    mockRequest.query.mockResolvedValueOnce({ recordset: [{ id: 123 }] });

    const result = await createChat(1, 'Hello');
    expect(result).toBe(123);
    expect(mockRequest.input).toHaveBeenCalledWith('title', sql.NVarChar, 'Hello');
  });

  it('should save a message', async () => {
    mockRequest.query.mockResolvedValueOnce({ recordset: [{ id: 456 }] });

    const result = await saveMessage(1, 2, 'Hello AI', 1);
    expect(result).toBe(456);
    expect(mockRequest.input).toHaveBeenCalledWith('message', sql.NVarChar, 'Hello AI');
  });

  it('should retrieve chats', async () => {
    mockRequest.query.mockResolvedValueOnce({
      recordset: [{ id: 1, title: 'Chat 1' }]
    });

    const result = await retrieveChats(5);
    expect(result).toEqual([{ id: 1, title: 'Chat 1' }]);
    expect(mockRequest.input).toHaveBeenCalledWith('userId', sql.Int, 5);
  });

  it('should retrieve messages', async () => {
    mockRequest.query.mockResolvedValueOnce({
      recordset: [{ message: 'Hi!' }]
    });

    const result = await retrieveMessages(7);
    expect(result).toEqual([{ message: 'Hi!' }]);
    expect(mockRequest.input).toHaveBeenCalledWith('chat_id', sql.Int, 7);
  });

  it('should rename a chat', async () => {
    mockRequest.query.mockResolvedValueOnce({
      rowsAffected: [1]
    });

    const result = await renameChat(10, 2, 'Renamed');
    expect(result).toBe(true);
  });

  it('should delete a chat and its messages', async () => {
    const deleteQuery = jest.fn();
    const reqWithQuery = {
      input: jest.fn().mockReturnThis(),
      query: deleteQuery
    };

    sql.connect.mockResolvedValue({
      request: () => reqWithQuery,
      close: jest.fn()
    });

    deleteQuery
      .mockResolvedValueOnce({}) // delete messages
      .mockResolvedValueOnce({ rowsAffected: [1] }); // delete chat

    const result = await deleteChat(3, 4);
    expect(result).toBe(true);
  });
});
