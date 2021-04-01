const router = require("express").Router();
const { checkAuth, checkRole } = require("../../middlewares/auth");
const { roles } = require("../../roles");

const {
  login,
  postUser,
  deleteUser,
  updateUser,
  getUser,
  getUsers,
} = require("../../controllers/User/user-ctrl");

///////////////////////////////////////////// POST ////////////////////////////////////////////////

// Registration Route
router.post("/register", checkAuth, postUser);

// Users Login Route
router.post("/login", login);

///////////////////////////////////////////// DELETE ////////////////////////////////////////////////

// Profile Route
router.delete("/:id", checkAuth, deleteUser);

///////////////////////////////////////////// PATCH ////////////////////////////////////////////////

// Profile Route
router.patch("/:id", checkAuth, updateUser);

///////////////////////////////////////////// GET /////////////////////////////////////////////////

// Admin and Moderator Protected Route
router.get("/one/:id", checkAuth, getUser);

//Admin, Moderator Protected Route
router.get("/many/:query", checkAuth, checkRole([roles.admin]), getUsers);

module.exports = router;
