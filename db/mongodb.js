require("dotenv").config();
const mongoose = require("mongoose");
const mongoDB = process.env.MONGODB_URL;
mongoose.set("strictQuery", false);

async function main() {
  try {
    await mongoose.connect(mongoDB);
    console.log("Successfully connected to the collectorX database");
  } catch (error) {
    console.error(error);
  }
}

main().catch((err) => console.log(err));

const userSchema = new mongoose.Schema({
  name: String,
  username: String,
  email: String,
  contact: String,
  gender: { type: String, enum: ["Male", "Female", "Other"] },
  birthday: Date,
  address: String,
  image: String,
  preferences: [{ type: mongoose.ObjectId, ref: "Category" }],
  isNewUser: { type: Boolean, default: false },
  purchases: [{ type: mongoose.ObjectId, ref: "Transaction" }],
  sales: [{ type: mongoose.ObjectId, ref: "Transaction" }],
  listings: [{ type: mongoose.ObjectId, ref: "Listing" }],
  reviews: [{ type: mongoose.ObjectId, ref: "Review" }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
const User = mongoose.model("User", userSchema);

const categorySchema = new mongoose.Schema({
  name: String,
  description: String,
  image: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
const Category = mongoose.model("Category", categorySchema);

const advertisementSchema = new mongoose.Schema({
  name: String,
  image: String,
  link: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
const Advertisement = mongoose.model("Advertisement", advertisementSchema);

module.exports = { User, Category, Advertisement };
