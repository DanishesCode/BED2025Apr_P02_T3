const topicController = require("../../controllers/topicController");
const topicModel = require("../../models/topicModel");

jest.mock("../../models/topicModel");

describe("topicController.getAllTopics", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should return topics successfully", async () => {
    topicModel.getAllTopics.mockResolvedValue([{ id: 1, title: "A" }]);
    const req = { query: {}, user: { userId: 1 } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await topicController.getAllTopics(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it("should handle errors", async () => {
    topicModel.getAllTopics.mockRejectedValue(new Error("DB error"));
    const req = { query: {}, user: { userId: 1 } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await topicController.getAllTopics(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });
});

describe("topicController.getTopicById", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should return topic if found", async () => {
    topicModel.getTopicById.mockResolvedValue({ id: 1, title: "A" });
    const req = { params: { id: 1 } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await topicController.getTopicById(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it("should return 404 if not found", async () => {
    topicModel.getTopicById.mockResolvedValue(null);
    const req = { params: { id: 1 } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await topicController.getTopicById(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  it("should return 400 for invalid id", async () => {
    const req = { params: { id: "abc" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await topicController.getTopicById(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });
});

describe("topicController.createTopic", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should return 401 if not authenticated", async () => {
    const req = { user: null, body: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await topicController.createTopic(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("should return 400 if no title", async () => {
    const req = { user: { userId: 1 }, body: { title: "" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await topicController.createTopic(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("should return 400 if no contentType", async () => {
    const req = { user: { userId: 1 }, body: { title: "A" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await topicController.createTopic(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("should create text topic and return 201", async () => {
    topicModel.createTopic.mockResolvedValue(1);
    const req = { user: { userId: 1 }, body: { title: "A", contentType: "text", textContent: "Hello" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await topicController.createTopic(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it("should return 400 if text content is missing", async () => {
    const req = { user: { userId: 1 }, body: { title: "A", contentType: "text", textContent: "" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await topicController.createTopic(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe("topicController.deleteTopic", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should return 401 if not authenticated", async () => {
    const req = { user: null, params: { id: 1 } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await topicController.deleteTopic(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("should return 404 if topic not found", async () => {
    topicModel.getTopicById.mockResolvedValue(null);
    const req = { user: { userId: 1 }, params: { id: 1 } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await topicController.deleteTopic(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("should return 403 if not topic owner", async () => {
    topicModel.getTopicById.mockResolvedValue({ id: 1, userId: 2 });
    const req = { user: { userId: 1 }, params: { id: 1 } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await topicController.deleteTopic(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("should delete topic and return 200", async () => {
    topicModel.getTopicById.mockResolvedValue({ id: 1, userId: 1 });
    topicModel.deleteTopic.mockResolvedValue();
    const req = { user: { userId: 1 }, params: { id: 1 } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await topicController.deleteTopic(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
});