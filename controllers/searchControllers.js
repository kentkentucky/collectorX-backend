const { Listing, Category, User, Search } = require("../db/mongodb");

const getSearch = async (req, res) => {
  const auth0ID = req.auth.sub;
  const id = auth0ID.split("|")[1];
  const term = req.query.search;
  try {
    const searchResults = await Promise.all([
      Listing.find({
        $or: [
          { name: { $regex: term, $options: "i" } },
          { description: { $regex: term, $options: "i" } },
        ],
      }),
      Category.find({ name: { $regex: term, $options: "i" } }),
      User.find({
        username: { $regex: term, $options: "i" },
        _id: { $ne: id },
      }),
    ]);
    if (searchResults) {
      res.json({
        listings: searchResults[0],
        categories: searchResults[1],
        users: searchResults[2],
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const getRecentSearches = async (req, res) => {
  const auth0ID = req.auth.sub;
  const id = auth0ID.split("|")[1];
  try {
    const recents = await Search.find({ userID: id }).populate("referenceID");
    if (recents) {
      res.json(recents);
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json("Internal server error");
  }
};

const updateRecentSearches = async (req, res) => {
  const auth0ID = req.auth.sub;
  const id = auth0ID.split("|")[1];
  const refID = req.body.listingID || req.body.categoryID || req.body.userID;
  const { type } = req.body;
  try {
    const existingSearch = await Search.findOne({
      userID: id,
      searchType: type,
      referenceID: refID,
    });

    if (existingSearch) {
      existingSearch.createdAt = new Date();
      existingSearch.updatedAt = new Date();
      await existingSearch.save();
      return res.status(200).json("Search already exists, updated timestamp.");
    }

    const recent = await Search.create({
      userID: id,
      searchType: type,
      referenceID: refID,
    });

    if (recent) {
      res.status(200).json("Successfully saved recent search.");
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json("Internal server error");
  }
};

const deleteRecentSearch = async (req, res) => {
  const { recentID } = req.query;
  try {
    const deleteRecent = await Search.deleteOne({ _id: recentID });
    if (deleteRecent) {
      res.status(200).json("Successfully deleted recent");
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json("Internal server error");
  }
};

module.exports = {
  getSearch,
  getRecentSearches,
  updateRecentSearches,
  deleteRecentSearch,
};
