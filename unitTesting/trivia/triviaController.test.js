// tests/triviaController.test.js

const triviaController = require("../../controllers/trivIaController");
const triviaModel = require("../../models/triviaModel");

jest.mock("../../models/triviaModel");

describe("triviaController.getQuestionsByCategory", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return questions when category exists", async () => {
    const mockQuestions = [
      { id: 1, question: "What is the capital of France?" },
      { id: 2, question: "Who painted the Mona Lisa?" }
    ];

    triviaModel.getQuestionsByCategory.mockResolvedValue(mockQuestions);

    const req = { params: { categoryName: "general" } };
    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };

    await triviaController.getQuestionsByCategory(req, res);

    expect(triviaModel.getQuestionsByCategory).toHaveBeenCalledWith("general");
    expect(res.json).toHaveBeenCalledWith(mockQuestions);
  });

  it("should return 404 if category not found", async () => {
    triviaModel.getQuestionsByCategory.mockResolvedValue(null);

    const req = { params: { categoryName: "unknown" } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await triviaController.getQuestionsByCategory(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Category not found" });
  });

  it("should handle internal server error", async () => {
    triviaModel.getQuestionsByCategory.mockRejectedValue(new Error("DB error"));

    const req = { params: { categoryName: "general" } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await triviaController.getQuestionsByCategory(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });
});

describe("triviaController.getOptionsByQuestion", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return options when question exists", async () => {
    const mockOptions = ["Paris", "London", "Berlin", "Madrid"];

    triviaModel.getOptionsByQuestion.mockResolvedValue(mockOptions);

    const req = { params: { questionText: "What is the capital of France?" } };
    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };

    await triviaController.getOptionsByQuestion(req, res);

    expect(triviaModel.getOptionsByQuestion).toHaveBeenCalledWith("What is the capital of France?");
    expect(res.json).toHaveBeenCalledWith(mockOptions);
  });

  it("should return 404 if options not found", async () => {
    triviaModel.getOptionsByQuestion.mockResolvedValue(null);

    const req = { params: { questionText: "Unknown question" } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await triviaController.getOptionsByQuestion(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Options not found" });
  });

  it("should handle internal server error", async () => {
    triviaModel.getOptionsByQuestion.mockRejectedValue(new Error("DB error"));

    const req = { params: { questionText: "What is the capital of France?" } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await triviaController.getOptionsByQuestion(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });
});
