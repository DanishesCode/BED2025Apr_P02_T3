// tests/triviaModel.test.js

const sql = require("mssql");
const triviaModel = require("../../models/triviaModel");

jest.mock("mssql", () => {
  const mssql = {
    connect: jest.fn(),
    request: jest.fn(),
  };
  mssql.Request = function () {
    return {
      input: jest.fn().mockReturnThis(),
      query: jest.fn(),
    };
  };
  return mssql;
});

describe("triviaModel.getQuestionsByCategory", () => {
  let mockConnection, mockRequest;

  beforeEach(() => {
    mockRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn()
    };
    mockConnection = {
      request: () => mockRequest,
      close: jest.fn()
    };

    sql.connect.mockResolvedValue(mockConnection);
  });

  it("should return questions if found", async () => {
    const mockData = [{ question_text: "What is 2+2?" }];
    mockRequest.query.mockResolvedValue({ recordset: mockData });

    const result = await triviaModel.getQuestionsByCategory("math");

    expect(sql.connect).toHaveBeenCalled();
    expect(mockRequest.input).toHaveBeenCalledWith("categoryName", "math");
    expect(result).toEqual(mockData);
  });

  it("should return null if no questions found", async () => {
    mockRequest.query.mockResolvedValue({ recordset: [] });

    const result = await triviaModel.getQuestionsByCategory("unknown");

    expect(result).toBeNull();
  });

  it("should throw error on DB failure", async () => {
    mockRequest.query.mockRejectedValue(new Error("DB error"));

    await expect(triviaModel.getQuestionsByCategory("math")).rejects.toThrow("DB error");
  });
});

describe("triviaModel.getOptionsByQuestion", () => {
  let mockConnection, mockRequest;

  beforeEach(() => {
    mockRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn()
    };
    mockConnection = {
      request: () => mockRequest,
      close: jest.fn()
    };

    sql.connect.mockResolvedValue(mockConnection);
  });

  it("should return options if found", async () => {
    const mockData = [{ answer_text: "Paris", is_correct: true }];
    mockRequest.query.mockResolvedValue({ recordset: mockData });

    const result = await triviaModel.getOptionsByQuestion("Capital of France");

    expect(mockRequest.input).toHaveBeenCalledWith("questionText", "Capital of France");
    expect(result).toEqual(mockData);
  });

  it("should return null if no options found", async () => {
    mockRequest.query.mockResolvedValue({ recordset: [] });

    const result = await triviaModel.getOptionsByQuestion("Unknown question");

    expect(result).toBeNull();
  });

  it("should throw error on DB failure", async () => {
    mockRequest.query.mockRejectedValue(new Error("DB error"));

    await expect(triviaModel.getOptionsByQuestion("some question")).rejects.toThrow("DB error");
  });
});
