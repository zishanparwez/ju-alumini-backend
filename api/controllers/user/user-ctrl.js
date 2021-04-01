const Joi = require("joi");
const qs = require("qs");
const User = require("../../models/user/user");
const { roles } = require("../../roles");
const { KEY } = require("../../../api/config/index");

const {
  getHashSalt,
  generateJWT,
  validatePassword,
} = require("./helpers/helper");

/////////////////////////////////////////////////// POST ///////////////////////////////////////////

/*
    Login
*/

const login = async (req, res) => {
  const userDets = req.body;

  const schema = Joi.object({
    email: Joi.string().min(8).max(25).email().required(),
    password: Joi.string()
      .min(8)
      .max(20)
      .pattern(
        new RegExp("^(?=.*[A-Z])(?=.*[!@#$&*])(?=.*[0-9])(?=.*[a-z]).{8}")
      )
      .required(),
  });

  try {
    Joi.attempt(userDets, schema);
  } catch (ValidationError) {
    console.log(ValidationError);
    return res.status(422).json({
      message: "Validation Error",
      success: false,
    });
  }

  try {
    const user = await User.findOne({
      email: userDets.email,
    });

    if (Object.keys(user).length === 0 && user.constructor === Object) {
      return res.status(404).json({
        message: "User does not exist",
        success: false,
      });
    }

    if (validatePassword(userDets.password, user.hash, user.salt)) {
      const token = generateJWT(user.id, user.email);

      return res.status(200).json({
        token: token,
        message: "Login Successful",
        success: true,
      });
    } else {
      return res.status(401).json({
        message: "Wrong Password",
        success: false,
      });
    }
  } catch (err) {
    return res.status(500).json({
      message: "Unable to login user",
      success: false,
    });
  }
};

const postUser = async (req, res) => {
  const userDets = req.body;

  const schema = Joi.object({
    name: Joi.string()
      .pattern(new RegExp("^[A-Z][a-z]*(\\s[A-Z][a-z]*)?$"))
      .min(1)
      .max(20)
      .required(),
    email: Joi.string().min(8).max(25).email().required(),
    key: Joi.string(),
    password: Joi.string()
      .min(8)
      .max(20)
      .pattern(
        new RegExp("^(?=.*[A-Z])(?=.*[!@#$&*])(?=.*[0-9])(?=.*[a-z]).{8}")
      )
      .required(),
    role: Joi.valid(roles.user, roles.admin),
  });

  try {
    Joi.attempt(userDets, schema);
  } catch (ValidationError) {
    return res.status(422).json({
      err: ValidationError,
      message: "Validation Error",
      success: false,
    });
  }

  try {
    const user = await User.findOne({
      email: userDets.email,
    });

    if (req.user.role === roles.user) {
      return res.status(401).json({
        message: "Unauthorized",
        success: false,
      });
    }

    if (userDets.role === roles.admin && userDets.key !== KEY) {
      return res.status(401).json({
        message: "Unauthorized",
        success: false,
      });
    }

    if (user) {
      return res.status(409).json({
        message: "User already exists",
        success: false,
      });
    }

    const { hash, salt } = getHashSalt(userDets.password);

    try {
      const userDoc = new User({
        name: userDets.name,
        email: userDets.email,
        role: userDets.role ? userDets.role : roles.user,
        hash: hash,
        salt: salt,
      });
      await userDoc.save();

      return res.status(201).json({
        message: "User uploaded successfully",
        success: true,
      });
    } catch (err) {
      return res.status(500).json({
        message: "Unable to upload user",
        success: false,
        error: err,
      });
    }
  } catch (err) {
    return res.status(500).json({
      message: "Unable to register user",
      success: false,
    });
  }
};

/////////////////////////////////////////////////// DELETE ///////////////////////////////////////////

const deleteUser = async (req, res) => {
  const userId = req.params.id;
  const key = req.body.key;

  try {
    Joi.attempt(userId, Joi.string());
  } catch (ValidationError) {
    return res.status(422).json({
      message: "Validation Error",
      success: false,
    });
  }

  try {
    if (userId === "myself" || req.user.id === userId) {
      try {
        await User.deleteOne({ _id: req.user.id });
        return res.status(200).json({
          message: "User deleted successfully",
          success: true,
        });
      } catch (error) {
        return res.status(500).json({
          message: "Unable to delete user",
          success: true,
        });
      }
    }

    const user = await User.findOne({
      _id: userId,
    });

    if (req.user.role === roles.user) {
      return res.status(401).json({
        message: "Unauthorized",
        success: false,
      });
    }

    if (!user) {
      return res.status(409).json({
        message: "User does not exists",
        success: false,
      });
    }

    if (user.role === roles.admin && key !== KEY) {
      return res.status(401).json({
        message: "Unauthorized",
        success: false,
      });
    }

    try {
      await User.deleteOne({ _id: userId });
      return res.status(200).json({
        message: "User deleted successfully",
        success: true,
      });
    } catch (error) {
      return res.status(500).json({
        message: "Unable to delete user",
        success: true,
      });
    }
  } catch (err) {
    return res.status(500).json({
      message: "Unable to delete user",
      success: false,
    });
  }
};

/////////////////////////////////////////////////// PATCH ///////////////////////////////////////////

const updateUser = async (req, res) => {
  const userDets = req.body;
  const userId = req.params.id;
  const key = req.body.key;

  const schema = Joi.object({
    name: Joi.string()
      .pattern(new RegExp("^[A-Z][a-z]*(\\s[A-Z][a-z]*)?$"))
      .min(1)
      .max(20),
    key: Joi.string(),
    password: Joi.string()
      .min(8)
      .max(20)
      .pattern(
        new RegExp("^(?=.*[A-Z])(?=.*[!@#$&*])(?=.*[0-9])(?=.*[a-z]).{8}")
      ),
  });

  try {
    Joi.attempt(userDets, schema);
  } catch (ValidationError) {
    return res.status(422).json({
      message: "Validation Error",
      success: false,
    });
  }

  const userData = {};

  if (userDets.name) {
    userData["name"] = userDets.name;
  }

  if (userDets.password) {
    const { hash, salt } = getHashSalt(userDets.password);
    userData["hash"] = hash;
    userData["salt"] = salt;
  }

  try {
    if (userId === "myself" || req.user.id === userId) {
      try {
        await User.updateOne({ _id: req.user.id }, { $set: { ...userData } });
        return res.status(200).json({
          message: "User updated successfully",
          success: true,
        });
      } catch (error) {
        return res.status(500).json({
          message: "Unable to update user",
          success: true,
        });
      }
    }

    const user = await User.findOne({
      _id: userId,
    });

    if (!user) {
      return res.status(409).json({
        message: "User does not exists",
        success: false,
      });
    }

    if (req.user.role === roles.user) {
      return res.status(401).json({
        message: "Unauthorized",
        success: false,
      });
    }

    if (user.role === roles.admin && key !== KEY) {
      return res.status(401).json({
        message: "Unauthorized",
        success: false,
      });
    }

    try {
      await User.updateOne({ _id: userId }, { $set: { ...userData } });
      return res.status(200).json({
        message: "User updated successfully",
        success: true,
      });
    } catch (error) {
      return res.status(500).json({
        message: "Unable to update user",
        success: true,
      });
    }
  } catch (err) {
    return res.status(500).json({
      message: "Unable to update user",
      success: false,
    });
  }
};

/////////////////////////////////////////////////// GET /////////////////////////////////////////////

const getUser = async (req, res) => {
  const userId = req.params.id;
  const key = req.body.key;

  try {
    Joi.attempt(userId, Joi.string());
  } catch (ValidationError) {
    return res.status(422).json({
      message: "Validation Error",
      success: false,
    });
  }

  try {
    if (userId === "myself" || req.user.id === userId) {
      return res.status(200).json({
        message: "User Found",
        user: req.user,
        success: true,
      });
    }

    const user = await User.findOne({
      _id: userId,
    });

    if (req.user.role === roles.user) {
      return res.status(401).json({
        message: "Unauthorized",
        success: false,
      });
    }

    if (user.role === roles.admin && key !== KEY) {
      return res.status(401).json({
        message: "Unauthorized",
        success: false,
      });
    }

    if (!user) {
      return res.status(409).json({
        message: "User does not exists",
        success: false,
      });
    }

    return res.status(200).json({
      message: "User Found",
      user: user,
      success: true,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Unable to find user",
      success: false,
    });
  }
};

const getUsers = async (req, res) => {
  const query = qs.parse(req.params.query);
  const key = req.body.key;
  const { name, email, role = roles.user } = query;

  const and_filters = [];
  and_filters.push({ role: role });

  if (name) {
    and_filters.push({ name: name });
  }

  if (email) {
    and_filters.push({ email: email });
  }

  try {
    if (req.user.role === roles.user) {
      return res.status(401).json({
        message: "Unauthorized",
        success: false,
      });
    }

    if (role === roles.admin && key !== KEY) {
      return res.status(401).json({
        message: "Unauthorized",
        success: false,
      });
    }

    const users = await User.find({ $and: and_filters });

    return res.status(200).json({
      count: users.length,
      users: users,
      success: true,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Unable to find user",
      success: false,
    });
  }
};

module.exports = {
  login,
  postUser,
  deleteUser,
  updateUser,
  getUser,
  getUsers,
};
