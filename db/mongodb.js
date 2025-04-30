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
  watchlist: [{ type: mongoose.ObjectId, ref: "Listing" }],
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

const conditionSchema = new mongoose.Schema({
  name: String,
  description: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
const Condition = mongoose.model("Condition", conditionSchema);

const listingSchema = new mongoose.Schema({
  name: String,
  description: String,
  category: { type: mongoose.ObjectId, ref: "Category" },
  size: String,
  condition: { type: mongoose.ObjectId, ref: "Condition" },
  price: Number,
  dealMethod: { type: String, enum: ["delivery", "meetup", "either"] },
  location: String,
  images: [String],
  isSold: Boolean,
  userID: { type: mongoose.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
const Listing = mongoose.model("Listing", listingSchema);

const favouriteSchema = new mongoose.Schema({
  userID: { type: mongoose.ObjectId, ref: "User" },
  listingID: { type: mongoose.ObjectId, ref: "Listing" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
const Favourite = mongoose.model("Favourite", favouriteSchema);

const searchSchema = new mongoose.Schema({
  userID: { type: mongoose.ObjectId, ref: "User" },
  searchType: { type: String, enum: ["Listing", "Category", "User"] },
  referenceID: { type: mongoose.ObjectId, refPath: "searchType" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
const Search = mongoose.model("Search", searchSchema);

const chatSchema = new mongoose.Schema({
  participants: [{ type: mongoose.ObjectId, ref: "User" }],
  lastMessage: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
const Chat = mongoose.model("Chat", chatSchema);

module.exports = {
  User,
  Category,
  Advertisement,
  Condition,
  Listing,
  Favourite,
  Search,
  Chat,
};
