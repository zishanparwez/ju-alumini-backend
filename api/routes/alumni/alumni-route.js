const router = require("express").Router();
// Bring in the User Registration function
const { checkAuth, checkRole } = require("../../middlewares/auth");
// Institue controllers route
const {
  postAlumnus,
  updateAlumnus,
  getAlumnusById,
  deleteAlumnus,
  getAlumni,
} = require("../../controllers/alumni/alumni-ctrl");

/**
 * Institute post route
 */
router.post("/register", checkAuth, postAlumnus);

/**
 * Institute update route
 *   userAuth,
  checkRole(["superadmin", "admin"]),
 */
router.patch("/:id", checkAuth, updateAlumnus);

/**
 * Institute update route
 */
router.delete("/:id", checkAuth, deleteAlumnus);

/**
 * Get Institutes by id
 */
router.get("/id/:id", checkAuth, getAlumnusById);

/**
 * Get Institutes by custom or text queries
 */
router.get("/search/:query", checkAuth, getAlumni);

module.exports = router;
