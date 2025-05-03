require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const port = 8080;

const { Transaction, Listing, Offer } = require("./db/mongodb");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_ENDPOINT_SECRET;
const mongoose = require("mongoose");

const userRouter = require("./routes/userRoutes");
const categoryRouter = require("./routes/categoryRoutes");
const homeRouter = require("./routes/homeRoutes");
const listingRouter = require("./routes/listingRoutes");
const paymentRouter = require("./routes/paymentRoutes");
const searchRouter = require("./routes/searchRoutes");
const favouritesRouter = require("./routes/favouritesRoutes");
const chatRouter = require("./routes/chatRoutes");
const offerRouter = require("./routes/offerRoutes");

app.post(
  "/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    let event = req.body;
    // Only verify the event if you have an endpoint secret defined.
    // Otherwise use the basic event deserialized with JSON.parse
    if (endpointSecret) {
      // Get the signature sent by Stripe
      const signature = req.headers["stripe-signature"];
      try {
        event = stripe.webhooks.constructEvent(
          req.body,
          signature,
          endpointSecret
        );
      } catch (err) {
        console.log("⚠️  Webhook signature verification failed.", err.message);
        return res.sendStatus(400);
      }
    }

    // Handle the event
    if (event.type == "payment_intent.succeeded") {
      const paymentIntent = event.data.object;
      const { buyerID, sellerID, listingID, offerID } = paymentIntent.metadata;
      const amount = paymentIntent.amount / 100;
      const currency = paymentIntent.currency;
      const stripePaymentID = paymentIntent.id;

      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        const transaction = await Transaction.create(
          [
            {
              listingID,
              offerID,
              buyerID,
              sellerID,
              amount,
              currency,
              stripePaymentID,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            },
          ],
          { session }
        );

        await Listing.findByIdAndUpdate(
          listingID,
          { isSold: true },
          { session }
        );

        await Offer.findByIdAndUpdate(
          offerID,
          { status: "Completed" },
          { session }
        );

        await session.commitTransaction();
        session.endSession();
      } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Transaction failed:", error);
        return res.sendStatus(500);
      }
    }

    // Return a 200 response to acknowledge receipt of the event
    res.send();
  }
);

app.use(express.json());
app.use(cors());

app.use("/user", userRouter);
app.use("/category", categoryRouter);
app.use("/home", homeRouter);
app.use("/listing", listingRouter);
app.use("/payment", paymentRouter);
app.use("/search", searchRouter);
app.use("/favourites", favouritesRouter);
app.use("/chat", chatRouter);
app.use("/offer", offerRouter);

app.listen(port, () => {
  console.log(`CollectorX listening on port ${port}`);
});
