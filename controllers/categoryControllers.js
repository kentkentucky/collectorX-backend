const { Category } = require("../db/mongodb");

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

module.exports = {
  getCategories,
};
