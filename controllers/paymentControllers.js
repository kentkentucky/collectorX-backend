require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const createPayment = async (req, res) => {
  const { amount, currency } = req.body;
  try {
    // Convert amount to the smallest currency unit (e.g., cents for SGD)
    const amountInSmallestUnit = Math.round(amount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInSmallestUnit,
      currency,
      metadata: { integration_check: "accept_a_payment" },
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
