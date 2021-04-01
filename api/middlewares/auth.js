const passport = require("passport");

/**
 * @DESC Passport middleware
 */
const checkAuth = passport.authenticate("jwt", { session: false });

/**
 * @DESC Check Role Middleware
 */
const checkRole = (roles) => (req, res, next) => {
  console.log("haha");
  if (!roles.includes(req.user.role)) {
    res.status(402).json({ message: "Unauthorized", success: false });
  } else {
    next();
  }
};

module.exports = {
  checkAuth,
  checkRole,
};
