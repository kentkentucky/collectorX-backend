const { Category, Listing } = require("../db/mongodb");

const getCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    if (categories) {
      res.json(categories);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json("Internal Server Error");
  }
};

const getListings = async (req, res) => {
  const auth0ID = req.auth.sub;
  const id = auth0ID.split("|")[1];
  const { categoryID } = req.query;
  try {
    const category = await Category.findById(categoryID);
    const listings = await Listing.find({
      category: categoryID,
      userID: { $ne: id },
    }).populate("condition");
    if (category && listings) {
      res.json({
        name: category.name,
        listings,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json("Internal Server Error");
  }
};

module.exports = {
  getCategories,
  getListings,
};
