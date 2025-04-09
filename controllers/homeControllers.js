const { Advertisement } = require("../db/mongodb");

const getHome = async (req, res) => {
  try {
    const advertisements = await Advertisement.find();
    if (advertisements) {
      res.json({ advertisements });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json("Internal Server Error");
  }
};

module.exports = {
  getHome,
};
