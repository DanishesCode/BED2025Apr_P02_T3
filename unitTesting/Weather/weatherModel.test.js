const weatherModel = require("../../models/weatherModel");
const fetch = require("node-fetch");

jest.mock("node-fetch");

describe("weatherModel.getLocationImage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.PEXELS_API_KEY = "fake-pexels-key";
  });

  it("should return a manual override image for Singapore", async () => {
    const url = await weatherModel.getLocationImage("Singapore", "Singapore");
    expect(url).toContain("unsplash.com");
  });

  it("should return null if no API key", async () => {
    process.env.PEXELS_API_KEY = "";
    const url = await weatherModel.getLocationImage("Paris", "France");
    expect(url).toBeNull();
  });

  it("should return image url from API if found", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        photos: [{ src: { large2x: "http://pexels.com/photo.jpg" } }]
      })
    });
    const url = await weatherModel.getLocationImage("Paris", "France");
    expect(url).toBe("http://pexels.com/photo.jpg");
  });

  it("should return null if no image found", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ photos: [] })
    });
    const url = await weatherModel.getLocationImage("Nowhere", "Nowhere");
    expect(url).toBeNull();
  });

  it("should handle fetch error gracefully", async () => {
    fetch.mockRejectedValue(new Error("API error"));
    const url = await weatherModel.getLocationImage("Paris", "France");
    expect(url).toBeNull();
  });
});

describe("weatherModel.getWeatherEmoji", () => {
  it("should return ☀️ for sunny", () => {
    expect(weatherModel.getWeatherEmoji("Sunny")).toBe("☀️");
  });
  it("should return ⛅ for partly cloudy", () => {
    expect(weatherModel.getWeatherEmoji("Partly Cloudy")).toBe("⛅");
  });
  it("should return ☁️ for overcast", () => {
    expect(weatherModel.getWeatherEmoji("Overcast")).toBe("☁️");
  });
  it("should return 🌦️ for rain", () => {
    expect(weatherModel.getWeatherEmoji("Rain")).toBe("🌦️");
  });
  it("should return ⛈️ for thunderstorm", () => {
    expect(weatherModel.getWeatherEmoji("Thunderstorm")).toBe("⛈️");
  });
  it("should return ❄️ for snow", () => {
    expect(weatherModel.getWeatherEmoji("Snow")).toBe("❄️");
  });
  it("should return 🌫️ for fog", () => {
    expect(weatherModel.getWeatherEmoji("Fog")).toBe("🌫️");
  });
  it("should return 💨 for wind", () => {
    expect(weatherModel.getWeatherEmoji("Windy")).toBe("💨");
  });
  it("should return 🌤️ for unknown", () => {
    expect(weatherModel.getWeatherEmoji("Unknown")).toBe("🌤️");
  });
});

describe("weatherModel.getElderlyActivities", () => {
  it("should return sunny activities", () => {
    const result = weatherModel.getElderlyActivities({ condition: "Sunny", temp_c: 20, uv: 5 });
    expect(result).toContain("Morning walk");
  });
  it("should return hot weather activities", () => {
    const result = weatherModel.getElderlyActivities({ condition: "Sunny", temp_c: 30, uv: 8 });
    expect(result).toContain("Indoor light exercises");
  });
  it("should return cool weather activities", () => {
    const result = weatherModel.getElderlyActivities({ condition: "Clear", temp_c: 10, uv: 2 });
    expect(result).toContain("Warm indoor activities");
  });
  it("should return cold weather activities", () => {
    const result = weatherModel.getElderlyActivities({ condition: "Clear", temp_c: 2, uv: 1 });
    expect(result).toContain("Stay indoors & keep warm");
  });
  it("should return rainy activities", () => {
    const result = weatherModel.getElderlyActivities({ condition: "Rain", temp_c: 18, uv: 2 });
    expect(result).toContain("Cozy indoor day");
  });
  it("should return default activities", () => {
    const result = weatherModel.getElderlyActivities({ condition: "Breezy", temp_c: 22, uv: 2 });
    expect(result).toContain("Enjoy the pleasant weather");
  });
  it("should handle errors gracefully", () => {
    const result = weatherModel.getElderlyActivities({});
    expect(result).toContain("General indoor activities");
  });
});

describe("weatherModel.getElderlyActivitiesWithDescriptions", () => {
  it("should return sunny/clear activities with descriptions", () => {
    const result = weatherModel.getElderlyActivitiesWithDescriptions({ condition: "Sunny", temp_c: 20, uv: 5 });
    expect(result[0]).toHaveProperty("title");
    expect(result[0]).toHaveProperty("description");
    expect(result[0]).toHaveProperty("icon");
  });
  it("should return hot weather activities with descriptions", () => {
    const result = weatherModel.getElderlyActivitiesWithDescriptions({ condition: "Sunny", temp_c: 30, uv: 8 });
    expect(result[0].title).toBe("Indoor Light Exercises");
  });
  it("should return cool weather activities with descriptions", () => {
    const result = weatherModel.getElderlyActivitiesWithDescriptions({ condition: "Clear", temp_c: 10, uv: 2 });
    expect(result[0].title).toBe("Warm Indoor Activities");
  });
  it("should return cold weather activities with descriptions", () => {
    const result = weatherModel.getElderlyActivitiesWithDescriptions({ condition: "Clear", temp_c: 2, uv: 1 });
    expect(result[0].title).toBe("Stay Indoors & Keep Warm");
  });
  it("should return rainy activities with descriptions", () => {
    const result = weatherModel.getElderlyActivitiesWithDescriptions({ condition: "Rain", temp_c: 18, uv: 2 });
    expect(result[0].title).toBe("Cozy Indoor Day");
  });
  it("should return default activities with descriptions", () => {
    const result = weatherModel.getElderlyActivitiesWithDescriptions({ condition: "Breezy", temp_c: 22, uv: 2 });
    expect(result[0].title).toBe("Enjoy the Pleasant Weather");
  });
  it("should handle errors gracefully", () => {
    const result = weatherModel.getElderlyActivitiesWithDescriptions({});
    expect(result[0].title).toBe("General Activities");
  });
});