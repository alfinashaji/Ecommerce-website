const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    name: String,
    phone: String,
    street: String,
    city: String,
    state: String,
    pincode: String,

    isDefault: {
      type: Boolean,
      default: false,
    },
  },

  {timestamps: true},
);

module.exports = mongoose.model("Address", addressSchema);
