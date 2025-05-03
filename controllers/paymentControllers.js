require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const createPayment = async (req, res) => {
  const auth0ID = req.auth.sub;
  const id = auth0ID.split("|")[1];
  const { amount, currency, listingID, sellerID, offerID } = req.body;
  try {
    // Convert amount to the smallest currency unit (e.g., cents for SGD)
    const amountInSmallestUnit = Math.round(amount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInSmallestUnit,
      currency,
      metadata: {
        listingID,
        buyerID: id,
        sellerID,
        offerID,
        integration_check: "accept_a_payment",
      },
    });

    if (paymentIntent) {
      res.json({ clientSecret: paymentIntent.client_secret });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { createPayment };
