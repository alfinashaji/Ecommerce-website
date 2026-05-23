const express = require("express");
const app = express();
const session = require("express-session");
const passport = require("./config/passport");
const User = require("./models/userModel");
const auth = require("./middleware/authMiddleware");

const userProductController = require("./controllers/userProductController");
const path = require("path");

app.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

app.use((req, res, next) => {
  console.log("REQUEST:", req.method, req.url);
  next();
});

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, "public")));
app.use(
  "/cropper",
  express.static(path.join(__dirname, "node_modules/cropperjs/dist")),
);

app.set("view engine", "ejs");

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    },
  }),
);

app.use(passport.initialize());
app.use(passport.session());

app.use(async (req, res, next) => {
  try {
    let user = null;

    if (req.user) {
      user = req.user;
    } else if (req.session && req.session.userId) {
      user = await User.findById(req.session.userId);
      req.user = user;
    }

    res.locals.user = user || null;
    next();
  } catch (err) {
    console.log("User middleware error:", err);
    req.user = null;
    res.locals.user = null;
    next();
  }
});

// routes
const authRoutes = require("./routes/authRoutes");
const googleAuthRoutes = require("./routes/googleAuth");
const categoryRoutes = require("./routes/categoryRoutes");
const brandRoutes = require("./routes/brandRoutes");
const productRoutes = require("./routes/productRoutes");
const userProductRoutes = require("./routes/userProductRoutes");
const categoryOfferRoutes = require("./routes/categoryOfferRoutes");
const searchRoutes = require("./routes/searchRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");

app.use("/api/auth", authRoutes);

// GOOGLE AUTH
app.use("/auth", googleAuthRoutes);

// PROFILE
app.use("/profile", auth, require("./routes/profileRoutes"));
app.use("/profile/address", auth, require("./routes/addressRoutes"));
app.use("/profile", auth, require("./routes/uploadRoutes"));

// ADMIN
app.use("/admin", require("./routes/adminRoutes"));
app.use("/admin/category", categoryRoutes);
app.use("/admin/brand", brandRoutes);
app.use("/api/product", productRoutes);
app.use("/admin/category-offer", categoryOfferRoutes);

// user
app.use("/products", userProductRoutes);

app.use("/search", searchRoutes);

app.get("/home", userProductController.getHomePage);

// Wishlist
app.use("/wishlist", wishlistRoutes);

app.get("/", (req, res) => res.redirect("/home"));

module.exports = app;
