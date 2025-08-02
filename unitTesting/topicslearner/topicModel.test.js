const topicModel = require("../../models/topicModel");
const sql = require("mssql");

jest.mock("mssql");

const fakePool = {
  request: jest.fn(() => fakeRequest)
};
const fakeRequest = {
  input: jest.fn().mockReturnThis(),
  query: jest.fn()
};

beforeEach(() => {
  jest.clearAllMocks();
  sql.connect.mockResolvedValue(fakePool);
});

describe("topicModel.getAllTopics", () => {
  it("should return mapped topics", async () => {
    fakeRequest.query.mockResolvedValue({
      recordset: [
        {
          id: 1,
          title: "Test",
          content: "abc",
          content_type: "text",
          category: "cat",
          description: "desc",
          tags: '["tag1"]',
          created_at: "2024-01-01",
          updated_at: "2024-01-02",
          author: "Author",
          user_id: 2,
          like_count: 1,
          comment_count: 2,
          isLiked: 1
        }
      ]
    });
    const result = await topicModel.getAllTopics({}, 10, 0, 2);
    expect(result[0].id).toBe(1);
    expect(result[0].tags).toEqual(["tag1"]);
    expect(fakeRequest.query).toHaveBeenCalled();
  });
});

describe("topicModel.getTopicById", () => {
  it("should return mapped topic if found", async () => {
    fakeRequest.query.mockResolvedValue({
      recordset: [
        {
          id: 1,
          title: "Test",
          content: "abc",
          content_type: "text",
          category: "cat",
          description: "desc",
          tags: '["tag1"]',
          created_at: "2024-01-01",
          updated_at: "2024-01-02",
          author: "Author",
          userId: 2
        }
      ]
    });
    const result = await topicModel.getTopicById(1);
    expect(result.id).toBe(1);
    expect(result.tags).toEqual(["tag1"]);
  });

  it("should return null if not found", async () => {
    fakeRequest.query.mockResolvedValue({ recordset: [] });
    const result = await topicModel.getTopicById(999);
    expect(result).toBeNull();
  });
});

describe("topicModel.createTopic", () => {
  it("should return new topic id", async () => {
    fakeRequest.query.mockResolvedValue({ recordset: [{ id: 5 }] });
    const result = await topicModel.createTopic({
      userId: 1,
      title: "A",
      content: "B",
      content_type: "text",
      category: "cat",
      description: "desc",
      tags: ["tag1"]
    });
    expect(result).toBe(5);
    expect(fakeRequest.query).toHaveBeenCalled();
  });
});

describe("topicModel.updateTopic", () => {
  it("should update topic fields", async () => {
    fakeRequest.query.mockResolvedValue({});
    await topicModel.updateTopic(1, { title: "New", category: "cat", description: "desc", tags: ["tag1"], content: "abc" });
    expect(fakeRequest.query).toHaveBeenCalled();
  });

  it("should do nothing if no fields", async () => {
    await topicModel.updateTopic(1, {});
    expect(fakeRequest.query).not.toHaveBeenCalled();
  });
});

describe("topicModel.deleteTopic", () => {
  it("should delete topic", async () => {
    fakeRequest.query.mockResolvedValue({});
    await topicModel.deleteTopic(1);
    expect(fakeRequest.query).toHaveBeenCalled();
  });
});

describe("topicModel.getTopicsByUserId", () => {
  it("should return mapped topics", async () => {
    fakeRequest.query.mockResolvedValue({
      recordset: [
        {
          id: 1,
          title: "Test",
          content: "abc",
          content_type: "text",
          category: "cat",
          description: "desc",
          tags: '["tag1"]',
          created_at: "2024-01-01",
          updated_at: "2024-01-02",
          author: "Author",
          userId: 2
        }
      ]
    });
    const result = await topicModel.getTopicsByUserId(2, 10, 0);
    expect(result[0].id).toBe(1);
    expect(result[0].tags).toEqual(["tag1"]);
  });
});

describe("topicModel.getTopicsByCategory", () => {
  it("should return mapped topics", async () => {
    fakeRequest.query.mockResolvedValue({
      recordset: [
        {
          id: 1,
          title: "Test",
          content: "abc",
          content_type: "text",
          category: "cat",
          description: "desc",
          tags: '["tag1"]',
          created_at: "2024-01-01",
          updated_at: "2024-01-02",
          author: "Author",
          userId: 2
        }
      ]
    });
    const result = await topicModel.getTopicsByCategory("cat", 10, 0);
    expect(result[0].id).toBe(1);
    expect(result[0].tags).toEqual(["tag1"]);
  });
});

describe("topicModel.toggleLike", () => {
  it("should unlike if like exists", async () => {
    fakeRequest.query
      .mockResolvedValueOnce({ recordset: [{}] }) // like exists
      .mockResolvedValueOnce({}) // unlike
      .mockResolvedValueOnce({ recordset: [{ count: 0 }] }); // getLikeCount
    const result = await topicModel.toggleLike(1, 2);
    expect(result.liked).toBe(false);
    expect(result.likeCount).toBe(0);
  });

  it("should like if like does not exist", async () => {
    fakeRequest.query
      .mockResolvedValueOnce({ recordset: [] }) // like does not exist
      .mockResolvedValueOnce({}) // like
      .mockResolvedValueOnce({ recordset: [{ count: 1 }] }); // getLikeCount
    const result = await topicModel.toggleLike(1, 2);
    expect(result.liked).toBe(true);
    expect(result.likeCount).toBe(1);
  });
});

describe("topicModel.getLikeCount", () => {
  it("should return like count", async () => {
    fakeRequest.query.mockResolvedValue({ recordset: [{ count: 3 }] });
    const result = await topicModel.getLikeCount(1);
    expect(result).toBe(3);
  });
});

describe("topicModel.addComment", () => {
  it("should add comment", async () => {
    fakeRequest.query.mockResolvedValue({});
    await topicModel.addComment(1, 2, "Nice!");
    expect(fakeRequest.query).toHaveBeenCalled();
  });
});

describe("topicModel.getComments", () => {
  it("should return mapped comments", async () => {
    fakeRequest.query.mockResolvedValue({
      recordset: [
        {
          id: 1,
          comment: "Good",
          created_at: "2024-01-01",
          author: "A",
          userId: 2
        }
      ]
    });
    const result = await topicModel.getComments(1);
    expect(result[0].id).toBe(1);
    expect(result[0].comment).toBe("Good");
  });
});