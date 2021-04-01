const cors = require("cors");
const exp = require("express");
const morgan = require("morgan");
const passport = require("passport");
const { connect } = require("mongoose");
const { success, error } = require("consola");
const { fork } = require("child_process");

//Bot
const { bot_driver } = require("./bot_driver");

//User Model
const User = require("./api/models/user/user");
const { getHashSalt } = require("./api/controllers/user/helpers/helper");

// Bring in the app constants
const { DB, PORT, DEFAULT_SECRET } = require("./api/config/index");
const { roles } = require("./api/roles");

// Initialize the application
const app = exp();

// Middlewares
app.use(cors());
app.use(exp.json());
app.use(exp.urlencoded({ extended: false }));
app.use(morgan("dev"));
app.use(passport.initialize());

require("./api/middlewares/passport")(passport);

// User Router Middleware
app.use("/api/users", require("./api/routes/user/user-route"));
// Alumni Router Middleware
app.use("/api/alumni", require("./api/routes/alumni/alumni-route"));

app.use("*", (req, res) => {
  return res.status(404).json({
    message: "Invalid Route",
    success: false,
  });
});

const startApp = async () => {
  try {
    // Connection With DB
    await connect(DB, {
      useFindAndModify: true,
      useUnifiedTopology: true,
      useNewUrlParser: true,
      useCreateIndex: true,
    });

    success({
      message: "Successfully connected with the Database",
      badge: true,
    });

    setInterval(() => {
      //Bot Driver
      fork("./bot_driver.js");
    }, 1000 * 86400);

    // Start Listenting for the server on PORT
    app.listen(PORT, async () => {
      success({ message: `Server started on PORT ${PORT}`, badge: true });

      const users = await User.find({ role: roles.admin });

      if (users.length === 0) {
        const { hash, salt } = getHashSalt(DEFAULT_SECRET);

        try {
          const admin = new User({
            name: "Admin",
            email: "admin@mail.com",
            role: roles.admin,
            hash: hash,
            salt: salt,
          });

          await admin.save();

          console.log("Default Admin created");
        } catch (err) {
          console.log("Error in creating default admin");
        }
      } else {
        console.log("Admins present, Default Admin creation stopped");
      }
    });
  } catch (err) {
    error({
      message: "Unable to connect with Database",
      error: err,
      badge: true,
    });
    startApp();
  }
};

startApp();
