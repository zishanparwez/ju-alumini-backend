const { Schema, model } = require("mongoose");
const userValidator = require("mongoose-unique-validator");
const { roles } = require("../../roles");

const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      lowercase: true,
      unique: true,
      required: [true, "can't be blank"],
      match: [/\S+@\S+\.\S+/, "is invalid"],
      index: true,
    },
    role: {
      type: String,
      default: roles.user,
      enum: [roles.user, roles.admin],
    },
    hash: {
      type: String,
      required: true,
    },
    salt: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

UserSchema.plugin(userValidator);
module.exports = model("User", UserSchema);
