const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { SECRET } = require("../../../config/");

const getHashSalt = (password) => {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, 10000, 512, "sha512")
    .toString("hex");

  return { salt, hash };
};

const validatePassword = (password, hash, salt) => {
  const curr_hash = crypto
    .pbkdf2Sync(password, salt, 10000, 512, "sha512")
    .toString("hex");
  return hash === curr_hash;
};

const generateJWT = (id, email) => {
  const today = new Date();
  let exp = new Date(today);
  exp.setDate(today.getDate() + 30);

  return jwt.sign(
    {
      id: id,
      email: email,
      exp: parseInt(exp.getTime() / 1000),
    },
    SECRET
  );
};

module.exports = {
  getHashSalt,
  validatePassword,
  generateJWT,
};
