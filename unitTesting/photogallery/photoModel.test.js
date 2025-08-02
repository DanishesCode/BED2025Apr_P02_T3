const photoModel = require("../../models/photoModel");
const sql = require("mssql");

jest.mock("mssql");

describe("photoModel.savePhoto", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should save a photo and return the new id", async () => {
    const mockRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn().mockResolvedValue({ recordset: [{ id: 123 }] })
    };
    const mockConnection = { request: jest.fn().mockReturnValue(mockRequest) };
    sql.connect.mockResolvedValue(mockConnection);

    const result = await photoModel.savePhoto({ title: "A", description: "B", location: "C", date: new Date(), category: "cat", isFavorite: false, userId: 1, imageUrl: "url" });
    expect(result).toEqual({ success: true, id: 123 });
  });

  it("should handle errors", async () => {
    sql.connect.mockRejectedValue(new Error("DB error"));
    const result = await photoModel.savePhoto({});
    expect(result.success).toBe(false);
    expect(result.error).toBe("DB error");
  });
});

describe("photoModel.getPhotosByUserId", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should return photos for a user", async () => {
    const mockPhotos = [{ id: 1 }];
    const mockRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn().mockResolvedValue({ recordset: mockPhotos })
    };
    const mockConnection = { request: jest.fn().mockReturnValue(mockRequest) };
    sql.connect.mockResolvedValue(mockConnection);

    const result = await photoModel.getPhotosByUserId(1);
    expect(result).toEqual({ success: true, data: mockPhotos });
  });

  it("should handle errors", async () => {
    sql.connect.mockRejectedValue(new Error("DB error"));
    const result = await photoModel.getPhotosByUserId(1);
    expect(result.success).toBe(false);
    expect(result.error).toBe("DB error");
  });
});

describe("photoModel.getAllPhotos", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should return all photos", async () => {
    const mockPhotos = [{ id: 1 }];
    const mockRequest = {
      query: jest.fn().mockResolvedValue({ recordset: mockPhotos })
    };
    const mockConnection = {
      request: jest.fn().mockReturnValue(mockRequest),
      close: jest.fn().mockResolvedValue(undefined)
    };
    sql.connect.mockResolvedValue(mockConnection);

    const result = await photoModel.getAllPhotos();
    expect(result).toEqual({ success: true, data: mockPhotos });
    expect(mockConnection.close).toHaveBeenCalledTimes(1);
  });

  it("should handle errors", async () => {
    sql.connect.mockRejectedValue(new Error("DB error"));
    const result = await photoModel.getAllPhotos();
    expect(result.success).toBe(false);
    expect(result.error).toBe("DB error");
  });
});

describe("photoModel.getPhotoById", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should return photo if found", async () => {
    const mockPhoto = { id: 1 };
    const mockRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn().mockResolvedValue({ recordset: [mockPhoto] })
    };
    const mockConnection = { request: jest.fn().mockReturnValue(mockRequest) };
    sql.connect.mockResolvedValue(mockConnection);

    const result = await photoModel.getPhotoById(1, 1);
    expect(result).toEqual({ success: true, data: mockPhoto });
  });

  it("should return not found if no photo", async () => {
    const mockRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn().mockResolvedValue({ recordset: [] })
    };
    const mockConnection = { request: jest.fn().mockReturnValue(mockRequest) };
    sql.connect.mockResolvedValue(mockConnection);

    const result = await photoModel.getPhotoById(1, 1);
    expect(result).toEqual({ success: false, message: "Photo not found or access denied" });
  });

  it("should handle errors", async () => {
    sql.connect.mockRejectedValue(new Error("DB error"));
    const result = await photoModel.getPhotoById(1, 1);
    expect(result.success).toBe(false);
    expect(result.error).toBe("DB error");
  });
});

describe("photoModel.updatePhoto", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should update photo and return success", async () => {
    const mockRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn().mockResolvedValue({})
    };
    const mockConnection = { request: jest.fn().mockReturnValue(mockRequest) };
    sql.connect.mockResolvedValue(mockConnection);

    const result = await photoModel.updatePhoto(1, { title: "A", description: "B", location: "C", date: new Date(), category: "cat", isFavorite: false, imageUrl: "url" }, 1);
    expect(result).toEqual({ success: true });
  });

  it("should handle errors", async () => {
    sql.connect.mockRejectedValue(new Error("DB error"));
    const result = await photoModel.updatePhoto(1, {}, 1);
    expect(result.success).toBe(false);
    expect(result.error).toBe("DB error");
  });
});

describe("photoModel.deletePhoto", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should delete photo if found", async () => {
    const mockRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest
        .fn()
        .mockResolvedValueOnce({ recordset: [{ id: 1 }] }) // checkResult
        .mockResolvedValueOnce({}) // delete query
    };
    const mockConnection = { request: jest.fn().mockReturnValue(mockRequest) };
    sql.connect.mockResolvedValue(mockConnection);

    const result = await photoModel.deletePhoto(1, 1);
    expect(result).toEqual({ success: true });
  });

  it("should return not found if photo does not belong to user", async () => {
    const mockRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn().mockResolvedValueOnce({ recordset: [] })
    };
    const mockConnection = { request: jest.fn().mockReturnValue(mockRequest) };
    sql.connect.mockResolvedValue(mockConnection);

    const result = await photoModel.deletePhoto(1, 1);
    expect(result).toEqual({ success: false, message: "Photo not found or access denied" });
  });

  it("should handle errors", async () => {
    sql.connect.mockRejectedValue(new Error("DB error"));
    const result = await photoModel.deletePhoto(1, 1);
    expect(result.success).toBe(false);
    expect(result.error).toBe("DB error");
  });
});

describe("photoModel.updateFavoriteStatus", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should update favorite status if photo found", async () => {
    const mockRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest
        .fn()
        .mockResolvedValueOnce({ recordset: [{ id: 1 }] }) // checkResult
        .mockResolvedValueOnce({}) // update query
    };
    const mockConnection = { request: jest.fn().mockReturnValue(mockRequest) };
    sql.connect.mockResolvedValue(mockConnection);

    const result = await photoModel.updateFavoriteStatus(1, true, 1);
    expect(result).toEqual({ success: true });
  });

  it("should return not found if photo does not belong to user", async () => {
    const mockRequest = {
      input: jest.fn().mockReturnThis(),
      query: jest.fn().mockResolvedValueOnce({ recordset: [] })
    };
    const mockConnection = { request: jest.fn().mockReturnValue(mockRequest) };
    sql.connect.mockResolvedValue(mockConnection);

    const result = await photoModel.updateFavoriteStatus(1, true, 1);
    expect(result).toEqual({ success: false, message: "Photo not found or access denied" });
  });

  it("should handle errors", async () => {
    sql.connect.mockRejectedValue(new Error("DB error"));
    const result = await photoModel.updateFavoriteStatus(1, true, 1);
    expect(result.success).toBe(false);
    expect(result.error).toBe("DB error");
  });
});