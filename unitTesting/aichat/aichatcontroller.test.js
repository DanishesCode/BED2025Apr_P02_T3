// __tests__/chatController.test.js
const chatController = require('../../controllers/aichatController.js');
const chatModel = require('../../models/aichatModel.js');

jest.mock('../../models/aichatModel.js');

describe('Chat Controller', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('retrieveChats', () => {
    it('should return 400 if no userId or invalid type', async () => {
      req.params = { id: null };
      await chatController.retrieveChats(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User ID is required',
      });
    });

    it('should return 200 with chats on success', async () => {
      req.params = { id: '123' };
      chatModel.retrieveChats.mockResolvedValue([{ id: 1, text: 'hello' }]);
      await chatController.retrieveChats(req, res);
      expect(chatModel.retrieveChats).toHaveBeenCalledWith(123);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        chats: [{ id: 1, text: 'hello' }],
      });
    });

    it('should return 200 with empty array if no chats', async () => {
      req.params = { id: '123' };
      chatModel.retrieveChats.mockResolvedValue(null);
      await chatController.retrieveChats(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        chats: [],
      });
    });

    it('should return 500 on model error', async () => {
      req.params = { id: '123' };
      chatModel.retrieveChats.mockRejectedValue(new Error('fail'));
      await chatController.retrieveChats(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Something went wrong. Please try again later.',
      });
    });
  });

  describe('retrieveMessages', () => {
    it('should return 400 if chatId missing or NaN', async () => {
      req.params = { chatId: 'abc' };
      await chatController.retrieveMessages(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Chat ID is required and must be a number',
      });
    });

    it('should return 200 with messages on success', async () => {
      req.params = { chatId: '42' };
      chatModel.retrieveMessages.mockResolvedValue([{ id: 1, text: 'msg' }]);
      await chatController.retrieveMessages(req, res);
      expect(chatModel.retrieveMessages).toHaveBeenCalledWith(42);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        messages: [{ id: 1, text: 'msg' }],
      });
    });

    it('should return 200 with empty array if no messages', async () => {
      req.params = { chatId: '42' };
      chatModel.retrieveMessages.mockResolvedValue(null);
      await chatController.retrieveMessages(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        messages: [],
      });
    });

    it('should return 500 on model error', async () => {
      req.params = { chatId: '42' };
      chatModel.retrieveMessages.mockRejectedValue(new Error('fail'));
      await chatController.retrieveMessages(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Something went wrong. Please try again later.',
      });
    });
  });

  describe('saveMessage', () => {
    it('should return 400 if chatId missing or NaN', async () => {
      req.body = { chatId: 'abc', message: 'hello' };
      await chatController.saveMessage(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Chat ID is required and must be a number',
      });
    });

    it('should return 400 if message missing or empty', async () => {
      req.body = { chatId: '1', message: '  ' };
      await chatController.saveMessage(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Message is required',
      });
    });

    it('should return 200 with messageId on success', async () => {
      req.body = { chatId: '1', senderId: 5, message: 'hello', is_ai: false };
      chatModel.saveMessage.mockResolvedValue(99);
      await chatController.saveMessage(req, res);
      expect(chatModel.saveMessage).toHaveBeenCalledWith(1, 5, 'hello', false);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, messageId: 99 });
    });

    it('should return 500 on model error', async () => {
      req.body = { chatId: '1', senderId: 5, message: 'hello', is_ai: false };
      chatModel.saveMessage.mockRejectedValue(new Error('fail'));
      await chatController.saveMessage(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Something went wrong. Please try again later.',
      });
    });
  });

  describe('getAIResponse', () => {
    it('should return 400 if message missing or empty', async () => {
      req.body = { message: ' ', userId: 1, name: 'Linn' };
      await chatController.getAIResponse(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Message is required',
      });
    });

    it('should return 200 with AI reply on success', async () => {
      req.body = { message: 'Hello', userId: 1, name: 'Linn' };
      chatModel.getGeminiResponse.mockResolvedValue('Hi there!');
      await chatController.getAIResponse(req, res);
      expect(chatModel.getGeminiResponse).toHaveBeenCalledWith('Hello', 'Linn');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        reply: 'Hi there!',
      });
    });

    it('should return 500 on model error', async () => {
      req.body = { message: 'Hello', userId: 1, name: 'Linn' };
      chatModel.getGeminiResponse.mockRejectedValue(new Error('fail'));
      await chatController.getAIResponse(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Something went wrong. Please try again later.',
      });
    });
  });

  describe('createChat', () => {
    it('should return 400 if userId missing or NaN', async () => {
      req.body = { userId: 'abc' };
      await chatController.createChat(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User ID is required and must be a number',
      });
    });

    it('should return 201 with chatId on success', async () => {
      req.body = { userId: '1', title: 'My Chat' };
      chatModel.createChat.mockResolvedValue(42);
      await chatController.createChat(req, res);
      expect(chatModel.createChat).toHaveBeenCalledWith(1, 'My Chat');
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        chatId: 42,
      });
    });

    it('should use "New Chat" if title missing', async () => {
      req.body = { userId: '1' };
      chatModel.createChat.mockResolvedValue(42);
      await chatController.createChat(req, res);
      expect(chatModel.createChat).toHaveBeenCalledWith(1, 'New Chat');
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should return 500 on model error', async () => {
      req.body = { userId: '1', title: 'My Chat' };
      chatModel.createChat.mockRejectedValue(new Error('fail'));
      await chatController.createChat(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('renameChat', () => {
    it('should return 400 if chatId invalid', async () => {
      req.params = { id: 'abc' };
      req.body = { userId: '1', newTitle: 'New Title' };
      req.user = { id: 1 };
      await chatController.renameChat(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Chat ID is required and must be a number',
      });
    });

    it('should return 400 if userId invalid', async () => {
      req.params = { id: '10' };
      req.body = { userId: 'abc', newTitle: 'New Title' };
      req.user = {};
      await chatController.renameChat(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User ID is required and must be a number',
      });
    });

    it('should return 400 if newTitle missing', async () => {
      req.params = { id: '10' };
      req.body = { userId: '1', newTitle: '  ' };
      req.user = { id: 1 };
      await chatController.renameChat(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'New title is required',
      });
    });

    it('should return 404 if chat not found or not owned', async () => {
      req.params = { id: '10' };
      req.body = { userId: '1', newTitle: 'Valid Title' };
      req.user = { id: 1 };
      chatModel.renameChat.mockResolvedValue(false);
      await chatController.renameChat(req, res);
      expect(chatModel.renameChat).toHaveBeenCalledWith(10, 1, 'Valid Title');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Chat not found or not owned by user',
      });
    });

    it('should return 200 on success', async () => {
      req.params = { id: '10' };
      req.body = { userId: '1', newTitle: 'Valid Title' };
      req.user = { id: 1 };
      chatModel.renameChat.mockResolvedValue(true);
      await chatController.renameChat(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Chat renamed successfully',
      });
    });

    it('should return 500 on error', async () => {
      req.params = { id: '10' };
      req.body = { userId: '1', newTitle: 'Valid Title' };
      req.user = { id: 1 };
      chatModel.renameChat.mockRejectedValue(new Error('fail'));
      await chatController.renameChat(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('deleteChat', () => {
    it('should return 400 if chatId invalid', async () => {
      req.params = { id: 'abc' };
      req.body = { userId: '1' };
      req.user = { id: 1 };
      await chatController.deleteChat(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Chat ID is required and must be a number',
      });
    });

    it('should return 400 if userId invalid', async () => {
      req.params = { id: '10' };
      req.body = { userId: 'abc' };
      req.user = {};
      await chatController.deleteChat(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User ID is required and must be a number',
      });
    });

    it('should return 404 if chat not found or not owned', async () => {
      req.params = { id: '10' };
      req.body = { userId: '1' };
      req.user = { id: 1 };
      chatModel.deleteChat.mockResolvedValue(false);
      await chatController.deleteChat(req, res);
      expect(chatModel.deleteChat).toHaveBeenCalledWith(10, 1);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Chat not found or not owned by user',
      });
    });

    it('should return 200 on success', async () => {
      req.params = { id: '10' };
      req.body = { userId: '1' };
      req.user = { id: 1 };
      chatModel.deleteChat.mockResolvedValue(true);
      await chatController.deleteChat(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Chat deleted successfully',
      });
    });

    it('should return 500 on error', async () => {
      req.params = { id: '10' };
      req.body = { userId: '1' };
      req.user = { id: 1 };
      chatModel.deleteChat.mockRejectedValue(new Error('fail'));
      await chatController.deleteChat(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
