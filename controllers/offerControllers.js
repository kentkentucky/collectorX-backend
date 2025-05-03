const { Offer } = require("../db/mongodb");

const createOffer = async (req, res) => {
  const auth0ID = req.auth.sub;
  const id = auth0ID.split("|")[1];
  const { listingID, sellerID, offer } = req.body;
  try {
    const createOffer = await Offer.create({
      listingID,
      sellerID,
      buyerID: id,
      offer,
      status: "Pending",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    if (createOffer) {
      res.status(200).json("Successfully created offer");
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json("Internal server error");
  }
};

const getOfferCount = async (req, res) => {
  const auth0ID = req.auth.sub;
  const id = auth0ID.split("|")[1];
  try {
    const offerCount = await Offer.countDocuments({
      $or: [{ sellerID: id }, { buyerID: id }],
      status: { $in: ["Pending", "Accepted"] },
    });
    res.json(offerCount);
  } catch (error) {
    console.error(error);
    return res.status(500).json("Internal server error");
  }
};

const getOffers = async (req, res) => {
  const auth0ID = req.auth.sub;
  const id = auth0ID.split("|")[1];
  try {
    const incoming = await Offer.find({
      sellerID: id,
      status: "Pending",
    }).populate("listingID");
    const outgoing = await Offer.find({
      buyerID: id,
      status: "Pending",
    }).populate("listingID");
    const accepted = await Offer.find({
      buyerID: id,
      status: "Accepted",
    }).populate("listingID");
    const declined = await Offer.find({
      buyerID: id,
      status: "Declined",
    }).populate("listingID");
    const cancelled = await Offer.find({
      buyerID: id,
      status: "Cancelled",
    }).populate("listingID");
    if (incoming && outgoing && accepted && declined && cancelled) {
      res.json({ incoming, outgoing, accepted, declined, cancelled });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json("Internal server error");
  }
};

const updateOffer = async (req, res) => {
  const { offerID, status } = req.body;
  try {
    const updateOffer = await Offer.findByIdAndUpdate(offerID, {
      status: status,
      updatedAt: Date.now(),
    });
    if (updateOffer) {
      res.status(200).json(`Successfully ${status} Offer`);
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json("Internal server error");
  }
};

module.exports = { createOffer, getOfferCount, getOffers, updateOffer };
