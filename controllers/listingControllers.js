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

module.exports = { getConditions, createListing, getListing };
