const sosController = require("../../controllers/sosController");
const sosModel = require("../../models/sosModel");

jest.mock("../../models/sosModel");

describe("sosController.retrieveRecord", () => {
  it("should return 400 if ID is missing", async () => {
    const req = { params: {} };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await sosController.retrieveRecord(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Id is required" });
  });

  it("should return record on success", async () => {
    const mockRecord = { id: 1, name: "John" };
    sosModel.retrieveRecord.mockResolvedValue(mockRecord);

    const req = { params: { id: "1" } };
    const res = {
      json: jest.fn(),
    };

    await sosController.retrieveRecord(req, res);

    expect(res.json).toHaveBeenCalledWith(mockRecord);
  });

  it("should handle errors", async () => {
    sosModel.retrieveRecord.mockRejectedValue(new Error("DB error"));

    const req = { params: { id: "1" } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await sosController.retrieveRecord(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Error retrieving record" });
  });
});

describe("sosController.createRecord", () => {
  it("should return 201 on successful creation", async () => {
    const mockRecord = { id: 1, name: "Jane" };
    sosModel.createRecord.mockResolvedValue(mockRecord);

    const req = { params: { id: "1" }, body: { name: "Jane" } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await sosController.createRecord(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockRecord);
  });

  it("should handle errors", async () => {
    sosModel.createRecord.mockRejectedValue(new Error("DB error"));

    const req = { params: { id: "1" }, body: {} };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await sosController.createRecord(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Error creating record" });
  });
});

describe("sosController.updateRecord", () => {
  it("should return 400 for invalid ID", async () => {
    const req = { params: { id: "abc" } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await sosController.updateRecord(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid user ID" });
  });

  it("should return 404 if record not found", async () => {
    sosModel.updateRecord.mockResolvedValue(null);

    const req = { params: { id: "1" }, body: {} };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await sosController.updateRecord(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
  });

  it("should update and return 200", async () => {
    sosModel.updateRecord.mockResolvedValue(true);

    const req = { params: { id: "1" }, body: {} };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await sosController.updateRecord(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: "Record updated successfully" });
  });

  it("should handle errors", async () => {
    sosModel.updateRecord.mockRejectedValue(new Error("DB error"));

    const req = { params: { id: "1" }, body: {} };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await sosController.updateRecord(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Error updating Record" });
  });
});

describe("sosController.deleteRecord", () => {
  it("should return 400 for invalid ID", async () => {
    const req = { params: { id: "abc" } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await sosController.deleteRecord(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid user ID" });
  });

  it("should return 404 if not found", async () => {
    sosModel.deleteData.mockResolvedValue(false);

    const req = { params: { id: "1" } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await sosController.deleteRecord(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Record not found" });
  });

  it("should return 200 on successful delete", async () => {
    sosModel.deleteData.mockResolvedValue(true);

    const req = { params: { id: "1" } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await sosController.deleteRecord(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: "Record deleted successfully" });
  });

  it("should handle errors", async () => {
    sosModel.deleteData.mockRejectedValue(new Error("DB error"));

    const req = { params: { id: "1" } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await sosController.deleteRecord(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Error deleting record" });
  });
});

describe("sosController.convertLocation", () => {
  it("should return address if found", async () => {
    sosModel.convertLocation.mockResolvedValue("123 Main Street");

    const req = { body: { lat: 1, lng: 2 } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await sosController.convertLocation(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ address: "123 Main Street" });
  });

  it("should return 404 if address not found", async () => {
    sosModel.convertLocation.mockResolvedValue(null);

    const req = { body: { lat: 1, lng: 2 } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await sosController.convertLocation(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Address not found." });
  });

  it("should handle errors", async () => {
    sosModel.convertLocation.mockRejectedValue(new Error("API error"));

    const req = { body: { lat: 1, lng: 2 } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await sosController.convertLocation(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Failed to fetch address from coordinates" });
  });
});

describe("sosController.sendTelegramMessage", () => {
  it("should return 400 if chatId or address is missing", async () => {
    const req = { body: { chatId: null, address: null } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await sosController.sendTelegramMessage(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "chatId and address are required" });
  });

  it("should return 200 if message sent successfully", async () => {
    sosModel.sendTeleMessage.mockResolvedValue(true);

    const req = { body: { chatId: "123", address: "Test address" } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await sosController.sendTelegramMessage(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: "Message sent successfully" });
  });

  it("should return 500 if sending message fails", async () => {
    sosModel.sendTeleMessage.mockResolvedValue(false);

    const req = { body: { chatId: "123", address: "Test address" } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await sosController.sendTelegramMessage(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Failed to send message" });
  });

  it("should handle internal server error", async () => {
    sosModel.sendTeleMessage.mockRejectedValue(new Error("Telegram error"));

    const req = { body: { chatId: "123", address: "Test address" } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await sosController.sendTelegramMessage(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });
});
