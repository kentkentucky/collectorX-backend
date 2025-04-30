const { Condition, Listing, User, Favourite } = require("../db/mongodb");
const { bucket } = require("../db/firebase");
const mongoose = require("mongoose");

const getConditions = async (req, res) => {
  try {
    const conditions = await Condition.find();
    if (conditions) {
      res.json(conditions);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json("Internal Server Error");
  }
};

const createListing = async (req, res) => {
  const auth0ID = req.auth.sub;
  const id = auth0ID.split("|")[1];
  const {
    name,
    description,
    category,
    condition,
    size,
    price,
    dealMethod,
    location,
  } = req.body;

  const images = req.files.map((file) => ({
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    buffer: file.buffer,
  }));

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const [listing] = await Listing.create(
      [
        {
          name,
          description,
          category,
          condition,
          size,
          price,
          dealMethod,
          location,
          images: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      { session }
    );

    const imageUrls = await Promise.all(
      images.map(async (image) => {
        const fileName = `Listings/${listing._id}/${image.originalName}`;
        const fileUpload = bucket.file(fileName);

        await fileUpload.save(image.buffer, {
          metadata: {
            contentType: image.mimeType,
          },
        });

        await fileUpload.makePublic();

        return `https://storage.googleapis.com/${bucket.name}/${fileUpload.name}`;
      })
    );

    await Listing.findByIdAndUpdate(
      listing._id,
      { images: imageUrls },
      { new: true, session }
    );

    await User.findByIdAndUpdate(
      id,
      { $push: { listings: listing._id } },
      { session }
    );

    await session.commitTransaction();
    res.status(200).json("Successfully created listing");
  } catch (error) {
    await session.abortTransaction();
    console.error(error);
    res.status(500).json("Internal Server Error");
  } finally {
    session.endSession();
  }
};

const getListing = async (req, res) => {
  const { listingID } = req.query;
  try {
    const listing = await Listing.findById(listingID)
      .populate("condition")
      .populate("userID");
    if (listing) {
      const likesCount = await Favourite.countDocuments({
        listing: listing._id,
      });
      res.json({ ...listing.toObject(), likes: likesCount });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json("Internal Server Error");
  }
};

const deleteListing = async (req, res) => {
  const auth0ID = req.auth.sub;
  const id = auth0ID.split("|")[1];
  const { listingID } = req.query;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const deleteListing = await Listing.deleteOne(
      { _id: listingID },
      { session }
    );
    if (deleteListing.deletedCount > 0) {
      const folderPath = `Listings/${listingID}`;
      const [files] = await bucket.getFiles({ prefix: folderPath });
      await Promise.all(files.map((file) => file.delete()));
      await User.findByIdAndUpdate(
        id,
        { $pull: { listings: listingID } },
        { session }
      );

      await session.commitTransaction();
      res.status(200).json("Successfully deleted listing");
    } else {
      await session.abortTransaction();
      res.status(404).json("Listing not found");
    }
  } catch (error) {
    await session.abortTransaction();
    console.error(error);
    res.status(500).json("Internal Server Error");
  } finally {
    session.endSession();
  }
};

const editListing = async (req, res) => {
  const {
    id,
    name,
    description,
    condition,
    size,
    price,
    dealMethod,
    location,
    existingImages = [],
  } = req.body;

  const newImages = req.files.map((file) => ({
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    buffer: file.buffer,
  }));

  try {
    const listing = await Listing.findById(id);

    // Convert listing.images to an array of strings
    const listingImages = Array.isArray(listing.images)
      ? listing.images.filter((img) => typeof img === "string")
      : [];

    // Convert existingImages to an array of strings
    const parsedImages =
      typeof existingImages === "string"
        ? JSON.parse(existingImages)
        : existingImages;
    const validExistingImages = Array.isArray(parsedImages)
      ? parsedImages.filter((img) => typeof img === "string")
      : [];

    const imagesToDelete = listingImages.filter(
      (imageUrl) =>
        !validExistingImages.map((url) => url.trim()).includes(imageUrl.trim())
    );

    await Promise.all(
      imagesToDelete.map(async (imageUrl) => {
        const filePath = imageUrl.split("/").slice(4).join("/");
        const file = bucket.file(filePath);
        await file.delete();
      })
    );

    const newImageUrls = await Promise.all(
      newImages.map(async (image) => {
        const fileName = `Listings/${id}/${image.originalName}`;
        const fileUpload = bucket.file(fileName);

        await fileUpload.save(image.buffer, {
          metadata: {
            contentType: image.mimeType,
          },
        });

        await fileUpload.makePublic();

        return `https://storage.googleapis.com/${bucket.name}/${fileUpload.name}`;
      })
    );

    const updatedImageUrls = [...validExistingImages, ...newImageUrls];

    const updatedListing = await Listing.findByIdAndUpdate(
      id,
      {
        name,
        description,
        condition,
        size,
        price,
        dealMethod,
        location,
        images: updatedImageUrls,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (updatedListing) {
      res.status(200).json("Successfully updated listing");
    }
  } catch (error) {
    console.error(error);
    res.status(500).json("Internal Server Error");
  }
};

module.exports = {
  getConditions,
  createListing,
  getListing,
  deleteListing,
  editListing,
};
