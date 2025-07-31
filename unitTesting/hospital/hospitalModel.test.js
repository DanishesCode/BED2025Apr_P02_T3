// tests/hospitalModel.test.js

const hospitalModel = require("../../models/hospitalModel");
const sql = require("mssql");

jest.mock("mssql");

// Mock global fetch for getRouteData
global.fetch = jest.fn();

describe("hospitalModel.getHospitals", () => {
  let mockRequest;
  beforeEach(() => {
    mockRequest = {
      query: jest.fn()
    };
    sql.connect.mockResolvedValue({
      request: () => mockRequest,
      close: jest.fn()
    });
  });

  it("should return null if no hospitals found", async () => {
    mockRequest.query.mockResolvedValue({ recordset: [] });

    const result = await hospitalModel.getHospitals();

    expect(result).toBeNull();
    expect(sql.connect).toHaveBeenCalled();
    expect(mockRequest.query).toHaveBeenCalledWith("SELECT * FROM Hospitals;");
  });

  it("should return hospitals data if found", async () => {
    const mockData = [{ id: 1, name: "Hospital A" }];
    mockRequest.query.mockResolvedValue({ recordset: mockData });

    const result = await hospitalModel.getHospitals();

    expect(result).toEqual(mockData);
  });

  it("should throw error on DB failure", async () => {
    mockRequest.query.mockRejectedValue(new Error("DB error"));

    await expect(hospitalModel.getHospitals()).rejects.toThrow("DB error");
  });
});

describe("hospitalModel.getRouteData", () => {
  const oldEnv = process.env;

  beforeEach(() => {
    process.env = { ...oldEnv, MAPBOX_TOKEN: "fake-token" };
    fetch.mockReset();
  });

  afterAll(() => {
    process.env = oldEnv;
  });

  it("should throw error if API key is missing", async () => {
    process.env.MAPBOX_TOKEN = "";

    await expect(
      hospitalModel.getRouteData("driving", [1, 2], [3, 4])
    ).rejects.toThrow("API key is missing!");
  });

  it("should throw error if fetch response not ok", async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => "Unauthorized"
    });

    await expect(
      hospitalModel.getRouteData("driving", [1, 2], [3, 4])
    ).rejects.toThrow("Mapbox API error: 401");
  });

  it("should throw error if no routes found", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ routes: [] })
    });

    await expect(
      hospitalModel.getRouteData("driving", [1, 2], [3, 4])
    ).rejects.toThrow("No route found.");
  });

  it("should return route data on success", async () => {
    const mockRoute = {
      distance: 1200,
      duration: 600,
      geometry: { type: "LineString", coordinates: [] }
    };
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ routes: [mockRoute] })
    });

    const result = await hospitalModel.getRouteData("driving", [1, 2], [3, 4]);

    expect(result).toEqual({
      distanceMeters: 1200,
      durationSeconds: 600,
      distanceKm: "1.20",
      durationMin: "10.0",
      geometry: mockRoute.geometry
    });
  });
});
