const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    discount: {
      type: {
        type: String,
        enum: ["percentage", "flat", null],
        default: null,
      },
      value: {
        type: Number,
        default: 0,
      },
      expiryDate: {
        type: Date,
        default: null,
      },
      isActive: {
        type: Boolean,
        default: false,
      },
    },
  },
  {timestamps: true},
);

module.exports = mongoose.model("Category", categorySchema);
