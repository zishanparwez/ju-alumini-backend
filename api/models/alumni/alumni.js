const { Schema, model } = require("mongoose");

const AlumniSchema = new Schema(
  {
    name: { type: String, required: true },
    linkedIn: { type: String, required: true, unique: true, index: true },
    degree: { type: String },
    stream: { type: String },
    address: { type: String },
    profession: { type: String },
    company: { type: String },
  },
  { timestamps: true }
);

module.exports = model("Alumni", AlumniSchema);
