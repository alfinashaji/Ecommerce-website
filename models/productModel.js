const mongoose = require("mongoose");

const variantSchema = new mongoose.Schema({
  size: {
    type: String,
    required: true,
  },

  color: {
    type: String,
    required: true,
  },

  price: {
    type: Number,
    required: true,
  },

  stock: {
    type: Number,
    required: true,
    default: 0,
  },

  images: [
    {
      type: String,
    },
  ],
});

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
    },

    variants: [variantSchema],

    isListed: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Product", productSchema);
