const { Favourite } = require("../db/mongodb");

const getFavourites = async (req, res) => {
  const auth0ID = req.auth.sub;
  const id = auth0ID.split("|")[1];
  try {
    const favourites = await Favourite.find({ userID: id }).populate({
      path: "listingID",
      populate: {
        path: "condition",
      },
    });
    if (favourites) {
      res.json(favourites);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json("Internal Server Error");
  }
};

const toggleFavourite = async (req, res) => {
  const auth0ID = req.auth.sub;
  const id = auth0ID.split("|")[1];
  const { listingID } = req.body;
  try {
    const record = await Favourite.find({ userID: id, listingID: listingID });
    if (record.length == 0) {
      const favourite = await Favourite.create({
        userID: id,
        listingID: listingID,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      if (favourite) {
        res.status(200).json("Successfully favourite class");
      }
    } else {
      const unfavourite = await Favourite.deleteOne({ _id: record[0].id });
      if (unfavourite.deletedCount > 0) {
        res.status(200).json("Successfully unfavourite class");
      }
    }
  } catch (error) {
    console.error(error);
    res.status(500).json("Internal Server Error");
  }
};

module.exports = { getFavourites, toggleFavourite };
