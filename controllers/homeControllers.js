const { Advertisement, Listing, User, Favourite } = require("../db/mongodb");

const getHome = async (req, res) => {
  const auth0ID = req.auth.sub;
  const id = auth0ID.split("|")[1];
  try {
    const advertisements = await Advertisement.find();
    const user = await User.findById(id).select("preferences");
    const preferredCategories = user.preferences;
    const listings = await Listing.find({
      category: { $in: preferredCategories },
      userID: { $ne: id },
    }).populate("condition");
    const favourites = await Favourite.find({ userID: id }).select("listingID");
    if (advertisements && listings && favourites) {
      res.json({ advertisements, listings, favourites });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json("Internal Server Error");
  }
};

module.exports = {
  getHome,
};
