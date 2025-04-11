require("dotenv").config();
const express = require("express");
const router = express.Router();
const { expressjwt: expressJwt } = require("express-jwt");
const jwksRsa = require("jwks-rsa");
const multer = require("multer");

const checkJwt = expressJwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksUri: `${process.env.AUTH0_BASE_URL}.well-known/jwks.json`,
  }),
  audience: process.env.AUTH0_AUDIENCE,
  issuer: process.env.AUTH0_BASE_URL,
  algorithms: ["RS256"],
});

const checkScopesMiddleware = (requiredScopes) => {
  return (req, res, next) => {
    const userScopes = req.auth.scope ? req.auth.scope.split(" ") : []; // Convert string to array

    const hasAllScopes = requiredScopes.every((scope) =>
      userScopes.includes(scope)
    );

    if (!hasAllScopes) {
      return res
        .status(403)
        .json({ error: "Forbidden: Missing required scope(s)" });
    }

    next();
  };
};

const storage = multer.memoryStorage();
const upload = multer({ storage });

const listControllers = require("../controllers/listControllers");

router.get(
  "/condition",
  checkJwt,
  checkScopesMiddleware(["update:user", "read:user"]),
  listControllers.getConditions
);

router.post(
  "/create",
  checkJwt,
  checkScopesMiddleware(["update:user", "read:user"]),
  upload.array("images", 20),
  listControllers.createListing
);

module.exports = router;
