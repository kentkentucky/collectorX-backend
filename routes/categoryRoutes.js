require("dotenv").config();
const express = require("express");
const router = express.Router();
const { expressjwt: expressJwt } = require("express-jwt");
const jwksRsa = require("jwks-rsa");

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

const categoryControllers = require("../controllers/categoryControllers");

router.get(
  "/",
  checkJwt,
  checkScopesMiddleware(["update:user", "read:user"]),
  categoryControllers.getCategories
);

module.exports = router;
