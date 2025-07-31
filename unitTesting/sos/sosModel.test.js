// tests/sosController.test.js

const sosController = require("../../controllers/sosController");
const sosModel = require("../../models/sosModel");

jest.mock("../../models/sosModel");

describe("sosController.retrieveRecord", () => {
  it("should return 400 if id is missing", async () => {
    const req = { params: {} };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await sosController.retrieveRecord(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Id is required" });
  });

  it("should return record if found", async () => {
    const mockRecord = { id: 1, name: "Test User" };
    sosModel.retrieveRecord.mockResolvedValue(mockRecord);

    const req = { params: { id: "1" } };
    const res = {
      json: jest.fn()
    };

    await sosController.retrieveRecord(req, res);

    expect(res.json).toHaveBeenCalledWith(mockRecord);
  });

  it("should return 500 on error", async () => {
    sosModel.retrieveRecord.mockRejectedValue(new Error("DB error"));
    const req = { params: { id: "1" } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await sosController.retrieveRecord(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Error retrieving record" });
  });
});

describe("sosController.createRecord", () => {
  it("should return 201 on successful creation", async () => {
    sosModel.createRecord.mockResolvedValue({ message: "Caretaker created", id: 1 });

    const req = { params: { id: "1" }, body: { telegram_name: "John", chat_id: "12345" } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await sosController.createRecord(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ message: "Caretaker created", id: 1 });
  });

  it("should return 500 on error", async () => {
    sosModel.createRecord.mockRejectedValue(new Error("Insert error"));

    const req = { params: { id: "1" }, body: {} };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await sosController.createRecord(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Error creating record" });
  });
});

describe("sosController.updateRecord", () => {
  it("should return 400 if id is invalid", async () => {
    const req = { params: { id: "abc" }, body: {} };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await sosController.updateRecord(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid user ID" });
  });

  it("should return 404 if update fails", async () => {
    sosModel.updateRecord.mockResolvedValue(false);

    const req = { params: { id: "1" }, body: {} };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await sosController.updateRecord(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
  });

  it("should return 200 if update succeeds", async () => {
    sosModel.updateRecord.mockResolvedValue(true);

    const req = { params: { id: "1" }, body: {} };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await sosController.updateRecord(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: "Record updated successfully" });
  });
});

describe("sosController.deleteRecord", () => {
  it("should return 400 if id is invalid", async () => {
    const req = { params: { id: "abc" } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await sosController.deleteRecord(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid user ID" });
  });

  it("should return 404 if record not found", async () => {
    sosModel.deleteData.mockResolvedValue(false);

    const req = { params: { id: "1" } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await sosController.deleteRecord(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Record not found" });
  });

  it("should return 200 if record deleted", async () => {
    sosModel.deleteData.mockResolvedValue(true);

    const req = { params: { id: "1" } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await sosController.deleteRecord(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: "Record deleted successfully" });
  });
});

describe("sosController.convertLocation", () => {
  it("should return 200 and address", async () => {
    sosModel.convertLocation.mockResolvedValue("Fake Address");

    const req = { body: { latitude: 1, longitude: 1 } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await sosController.convertLocation(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ address: "Fake Address" });
  });

  it("should return 404 if no address", async () => {
    sosModel.convertLocation.mockResolvedValue(null);

    const req = { body: {} };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await sosController.convertLocation(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Address not found." });
  });

  it("should return 500 on error", async () => {
    sosModel.convertLocation.mockRejectedValue(new Error("API error"));

    const req = { body: {} };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await sosController.convertLocation(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Failed to fetch address from coordinates" });
  });
});

describe("sosController.sendTelegramMessage", () => {
  it("should return 400 if missing fields", async () => {
    const req = { body: { chatId: "123" } }; // address missing
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await sosController.sendTelegramMessage(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "chatId and address are required" });
  });

  it("should return 200 on success", async () => {
    sosModel.sendTeleMessage.mockResolvedValue(true);

    const req = { body: { chatId: "123", address: "Somewhere" } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await sosController.sendTelegramMessage(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: "Message sent successfully" });
  });

  it("should return 500 on failure", async () => {
    sosModel.sendTeleMessage.mockResolvedValue(false);

    const req = { body: { chatId: "123", address: "Nowhere" } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await sosController.sendTelegramMessage(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Failed to send message" });
  });

  it("should return 500 on error", async () => {
    sosModel.sendTeleMessage.mockRejectedValue(new Error("Telegram API down"));

    const req = { body: { chatId: "123", address: "Nowhere" } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await sosController.sendTelegramMessage(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });
});
