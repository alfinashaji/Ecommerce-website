const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    address: {
      name: String,
      phone: String,
      street: String,
      city: String,
      state: String,
      pincode: String,
    },

    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },

        productName: String,
        productImage: String,

        quantity: Number,

        size: String,

        color: String,

        price: Number,

        finalPrice: Number,

        status: {
          type: String,
          enum: [
            "Placed",
            "Processing",
            "Shipped",
            "Out For Delivery",
            "Delivered",
            "Cancelled",
            "Returned",
            "Return Requested",
          ],
          default: "Placed",
        },

        cancelReason: {
          type: String,
          default: "",
        },

        returnReason: {
          type: String,
          default: "",
        },
      },
    ],

    subtotal: {
      type: Number,
      required: true,
    },

    shipping: {
      type: Number,
      required: true,
    },

    totalAmount: {
      type: Number,
      required: true,
    },

    paymentMethod: {
      type: String,
      enum: ["COD", "Online"],
      default: "COD",
    },

    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed", "Refunded"],
      default: "Pending",
    },

    orderStatus: {
      type: String,
      enum: [
        "Placed",
        "Processing",
        "Shipped",
        "Out For Delivery",
        "Delivered",
        "Cancelled",
        "Returned",
      ],
      default: "Placed",
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Order", orderSchema);
