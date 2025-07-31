// tests/hospitalController.test.js

const hospitalController = require("../../controllers/hospitalController");
const hospitalModel = require("../../models/hospitalModel");

jest.mock("../../models/hospitalModel");

describe("hospitalController.getHopsitals", () => {
  it("should return 404 if no data", async () => {
    hospitalModel.getHospitals.mockResolvedValue(null);

    const req = {};
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await hospitalController.getHopsitals(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Data not found" });
  });

  it("should return data if found", async () => {
    const mockData = [{ id: 1, name: "Hospital A" }];
    hospitalModel.getHospitals.mockResolvedValue(mockData);

    const req = {};
    const res = {
      json: jest.fn()
    };

    await hospitalController.getHopsitals(req, res);

    expect(res.json).toHaveBeenCalledWith(mockData);
  });

  it("should return 500 on error", async () => {
    hospitalModel.getHospitals.mockRejectedValue(new Error("DB error"));

    const req = {};
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await hospitalController.getHopsitals(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });
});

describe("hospitalController.getRouteData", () => {
  it("should return 404 if no route found", async () => {
    hospitalModel.getRouteData.mockResolvedValue(null);

    const req = {
      body: { profile: "profile1", start: "startPoint", end: "endPoint" }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await hospitalController.getRouteData(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "route not found." });
  });

  it("should return route data if found", async () => {
    const mockRoute = { distance: 100, path: ["A", "B"] };
    hospitalModel.getRouteData.mockResolvedValue(mockRoute);

    const req = {
      body: { profile: "profile1", start: "startPoint", end: "endPoint" }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await hospitalController.getRouteData(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ route: mockRoute });
  });

  it("should return 500 on error", async () => {
    hospitalModel.getRouteData.mockRejectedValue(new Error("API error"));

    const req = {
      body: { profile: "profile1", start: "startPoint", end: "endPoint" }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await hospitalController.getRouteData(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Failed to fetch route from coordinates given" });
  });
});
