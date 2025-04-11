require("dotenv").config();
const AUTH0_HOOK_SECRET = process.env.AUTH0_HOOK_SECRET;
const nodemailer = require("nodemailer");

const { User, Favourite } = require("../db/mongodb");

const syncUser = async (req, res) => {
  const { user, secret } = req.body;
  if (secret != AUTH0_HOOK_SECRET) {
    return res.status(401).json("Unauthorised");
  }
  try {
    const id = user.user_id.split("|")[1];
    const response = await User.create({
      _id: id,
      email: user.email,
      isNewUser: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    if (response) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL,
          pass: process.env.EMAIL_PASSWORD,
        },
      });

      const mailOptions = {
        from: process.env.EMAIL,
        to: user.email,
        subject: "CollectorX Registration",
        text: "You have successfully registered an account.",
      };

      const info = await transporter.sendMail(mailOptions);

      if (info) {
        res.status(200).json("Successfully created user.");
      }
    }
  } catch (error) {
    console.error(error);
    res.status(500).json("Internal Server Error");
  }
};

const validateNewUser = async (req, res) => {
  const auth0ID = req.auth.sub;
  const id = auth0ID.split("|")[1];
  try {
    const user = await User.findById(id, "isNewUser");
    const isNewUser = user.isNewUser;
    res.json({ isNewUser });
  } catch (error) {
    console.error(error);
    res.status(500).json("Internal Server Error");
  }
};

const registerUser = async (req, res) => {
  const auth0ID = req.auth.sub;
  const id = auth0ID.split("|")[1];
  const {
    fullName,
    username,
    contact,
    birthday,
    gender,
    address,
    preferences,
  } = req.body.userDetails;
  try {
    const registerUser = await User.findByIdAndUpdate(id, {
      $set: {
        name: fullName,
        username: username,
        contact: contact,
        birthday: birthday,
        gender: gender,
        address: address,
        preferences: preferences,
        isNewUser: false,
      },
    });
    if (registerUser) {
      res.status(200).json("Successfully updated User");
    }
  } catch (error) {
    console.error(error);
    res.status(500).json("Internal Server Error");
  }
};

const getProfile = async (req, res) => {
  const auth0ID = req.auth.sub;
  const id = auth0ID.split("|")[1];
  try {
    const profile = await User.findById(id).populate({
      path: "listings",
      options: { sort: { createdAt: -1 } },
      populate: {
        path: "condition",
      },
    });
    if (profile) {
      const listingsWithLikes = await Promise.all(
        profile.listings.map(async (listing) => {
          const likesCount = await Favourite.countDocuments({
            listing: listing._id,
          });
          return { ...listing.toObject(), likes: likesCount };
        })
      );

      res.json({ ...profile.toObject(), listings: listingsWithLikes });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json("Internal Server Error");
  }
};

module.exports = { syncUser, validateNewUser, registerUser, getProfile };
