const photoController = require("../../controllers/photoController");
const photoModel = require("../../models/photoModel");
const axios = require("axios");
const FormData = require("form-data");

jest.mock("../../models/photoModel");
jest.mock("axios");
//jest.mock("form-data"); //

describe("photoController.uploadPhoto", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.IMGBB_API_KEY = "fake-imgbb-key";
  });

  it("should return 401 if not authenticated", async () => {
    const req = { user: null, body: {}, file: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await photoController.uploadPhoto(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("should return 400 if no image file uploaded", async () => {
    const req = { user: { userId: 1 }, body: {}, file: null };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await photoController.uploadPhoto(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("should return 400 if no title", async () => {
    const req = { user: { userId: 1 }, body: { title: "" }, file: { buffer: Buffer.from("img") } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await photoController.uploadPhoto(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("should upload photo and return 201 on success", async () => {
    // Mock imgbb upload
    axios.post.mockResolvedValue({ data: { data: { url: "http://imgbb.com/photo.jpg" } } });
    photoModel.savePhoto.mockResolvedValue({ success: true, id: 123 });

    const req = {
      user: { userId: 1 },
      body: { title: "A", description: "B", location: "C", date: "2024-08-01", category: "cat", isFavorite: true },
      file: { buffer: Buffer.from("img"), size: 10 }
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await photoController.uploadPhoto(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.objectContaining({ id: 123, imageUrl: "http://imgbb.com/photo.jpg" })
    }));
  });

  it("should return 500 if savePhoto fails", async () => {
    axios.post.mockResolvedValue({ data: { data: { url: "http://imgbb.com/photo.jpg" } } });
    photoModel.savePhoto.mockResolvedValue({ success: false, error: "DB error" });

    const req = {
      user: { userId: 1 },
      body: { title: "A" },
      file: { buffer: Buffer.from("img"), size: 10 }
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await photoController.uploadPhoto(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  it("should return 500 on imgbb upload error", async () => {
    axios.post.mockRejectedValue(new Error("imgbb error"));
    const req = {
      user: { userId: 1 },
      body: { title: "A" },
      file: { buffer: Buffer.from("img"), size: 10 }
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await photoController.uploadPhoto(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });
});

describe("photoController.getAllPhotos", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should return 401 if not authenticated", async () => {
    const req = { user: null };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await photoController.getAllPhotos(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("should return photos if found", async () => {
    photoModel.getPhotosByUserId.mockResolvedValue({ success: true, data: [{ id: 1 }] });
    const req = { user: { userId: 1 } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await photoController.getAllPhotos(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: [{ id: 1 }] }));
  });

  it("should return 500 if model fails", async () => {
    photoModel.getPhotosByUserId.mockResolvedValue({ success: false, message: "DB error" });
    const req = { user: { userId: 1 } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await photoController.getAllPhotos(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });
});

describe("photoController.getPhotoById", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should return 401 if not authenticated", async () => {
    const req = { user: null, params: { id: 1 } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await photoController.getPhotoById(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("should return photo if found", async () => {
    photoModel.getPhotoById.mockResolvedValue({ success: true, data: { id: 1 } });
    const req = { user: { userId: 1 }, params: { id: 1 } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await photoController.getPhotoById(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: { id: 1 } }));
  });

  it("should return 404 if not found", async () => {
    photoModel.getPhotoById.mockResolvedValue({ success: false, message: "Not found" });
    const req = { user: { userId: 1 }, params: { id: 1 } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await photoController.getPhotoById(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });
});

describe("photoController.toggleFavorite", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should return 401 if not authenticated", async () => {
    const req = { user: null, params: { id: 1 }, body: { isFavorite: true } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await photoController.toggleFavorite(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("should return 400 if isFavorite is not boolean", async () => {
    const req = { user: { userId: 1 }, params: { id: 1 }, body: { isFavorite: "yes" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await photoController.toggleFavorite(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("should update favorite and return 200", async () => {
    photoModel.updateFavoriteStatus.mockResolvedValue({ success: true });
    const req = { user: { userId: 1 }, params: { id: 1 }, body: { isFavorite: true } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await photoController.toggleFavorite(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it("should return 404 if not found", async () => {
    photoModel.updateFavoriteStatus.mockResolvedValue({ success: false, message: "Not found" });
    const req = { user: { userId: 1 }, params: { id: 1 }, body: { isFavorite: true } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await photoController.toggleFavorite(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });
});

describe("photoController.updatePhoto", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should return 401 if not authenticated", async () => {
    const req = { user: null, params: { id: 1 }, body: { title: "A" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await photoController.updatePhoto(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("should return 400 if no title", async () => {
    const req = { user: { userId: 1 }, params: { id: 1 }, body: { title: "" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await photoController.updatePhoto(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("should update photo and return 200", async () => {
    photoModel.updatePhoto.mockResolvedValue({ success: true });
    const req = { user: { userId: 1 }, params: { id: 1 }, body: { title: "A" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await photoController.updatePhoto(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it("should return 404 if update fails", async () => {
    photoModel.updatePhoto.mockResolvedValue({ success: false, message: "Not found" });
    const req = { user: { userId: 1 }, params: { id: 1 }, body: { title: "A" } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await photoController.updatePhoto(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });
});

describe("photoController.deletePhoto", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should return 401 if not authenticated", async () => {
    const req = { user: null, params: { id: 1 } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await photoController.deletePhoto(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("should delete photo and return 200", async () => {
    photoModel.deletePhoto.mockResolvedValue({ success: true });
    const req = { user: { userId: 1 }, params: { id: 1 } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await photoController.deletePhoto(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it("should return 404 if not found", async () => {
    photoModel.deletePhoto.mockResolvedValue({ success: false, message: "Not found" });
    const req = { user: { userId: 1 }, params: { id: 1 } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await photoController.deletePhoto(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });
});