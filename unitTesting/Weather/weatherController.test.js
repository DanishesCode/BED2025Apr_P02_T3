const weatherController = require("../../controllers/weatherApiController");
const weatherModel = require("../../models/weatherModel");
jest.mock("../../models/weatherModel");
jest.mock("node-fetch");
const fetch = require("node-fetch");

describe("weatherController.getWeather", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.WEATHER_API_KEY = "fake-key";
  });

  it("should return 400 if location is missing", async () => {
    const req = { query: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await weatherController.getWeather(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  it("should return 500 if API key is missing", async () => {
    process.env.WEATHER_API_KEY = "";
    const req = { query: { location: "Singapore" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await weatherController.getWeather(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  it("should return weather data if found", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        current: {
          temp_c: 30,
          temp_f: 86,
          condition: { text: "Sunny" },
          humidity: 70,
          feelslike_c: 32,
          uv: 5,
          vis_km: 10,
          wind_kph: 5,
          wind_dir: "N",
          pressure_mb: 1012,
          last_updated: "2024-07-31 10:00"
        },
        location: {
          name: "Singapore",
          country: "Singapore"
        },
        forecast: { forecastday: [{ date: "2024-07-31", day: { avgtemp_c: 30, condition: { text: "Sunny" } }, hour: [] }] }
      })
    });
    weatherModel.getLocationImage.mockResolvedValue("http://img.com/sg.jpg");
    weatherModel.getElderlyActivitiesWithDescriptions.mockReturnValue([{ title: "Walk", description: "Go for a walk" }]);
    weatherModel.getWeatherEmoji.mockReturnValue("☀️");

    const req = { query: { location: "Singapore" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await weatherController.getWeather(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      location: expect.any(String),
      temperature: 30,
      emoji: "☀️"
    }));
  });

  it("should return 500 on fetch error", async () => {
    fetch.mockRejectedValue(new Error("API error"));
    const req = { query: { location: "Singapore" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await weatherController.getWeather(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  it("should return 400 on invalid location (API 400)", async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: { message: "Invalid location" } })
    });
    const req = { query: { location: "InvalidPlace" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await weatherController.getWeather(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });
});

describe("weatherController.searchLocations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.WEATHER_API_KEY = "fake-key";
  });

  it("should return 400 if query is missing", async () => {
    const req = { query: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await weatherController.searchLocations(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  it("should return 500 if API key is missing", async () => {
    process.env.WEATHER_API_KEY = "";
    const req = { query: { q: "Singapore" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await weatherController.searchLocations(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  it("should return locations if found", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ([{ name: "Singapore", country: "Singapore" }])
    });
    const req = { query: { q: "Singapore" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await weatherController.searchLocations(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.any(Array)
    }));
  });

  it("should return 500 on fetch error", async () => {
    fetch.mockRejectedValue(new Error("API error"));
    const req = { query: { q: "Singapore" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await weatherController.searchLocations(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  it("should return 400 on invalid query (API 400)", async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: { message: "Invalid query" } })
    });
    const req = { query: { q: "???" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await weatherController.searchLocations(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });
});