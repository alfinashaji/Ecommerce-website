const express = require("express");
const app = express();
const session = require("express-session");
const passport = require("./config/passport");
const User = require("./models/userModel");
const auth = require("./middleware/authMiddleware");
const adminAuth = require("./middleware/adminAuth");
const checkBlockStatus = require("./middleware/blockCheckMiddleware");

const userProductController = require("./controllers/userProductController");
const path = require("path");

app.use((req, res, next) => {
  res.set({
    "Cache-Control": "no-store, no-cache, must-revalidate, private",
    Pragma: "no-cache",
    Expires: "0",
  });
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
      secure: false, // Set to true if using HTTPS
      sameSite: "lax",
    },
  }),
);

app.use(passport.initialize());
app.use(passport.session());

// GLOBAL USER MIDDLEWARE (Adjusted to ignore admin routes)
app.use(async (req, res, next) => {
  // If the path starts with /admin, skip user session parsing entirely
  if (req.path.startsWith("/admin")) {
    return next();
  }

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
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const cartCountMiddleware = require("./middleware/cartCountMiddleware");
const wishlistCountMiddleware = require("./middleware/wishlistCountMiddleware");
app.use(cartCountMiddleware);
app.use(wishlistCountMiddleware);
app.use("/api/auth", authRoutes);

// GOOGLE AUTH
app.use("/auth", googleAuthRoutes);

// PROFILE (Protected via user auth)
app.use("/profile", auth, require("./routes/profileRoutes"));
app.use("/profile/address", auth, require("./routes/addressRoutes"));
app.use("/profile", auth, require("./routes/uploadRoutes"));

app.use("/admin", require("./routes/adminRoutes"));

app.use("/admin/category", adminAuth, categoryRoutes);
app.use("/admin/brand", adminAuth, brandRoutes);
app.use("/api/product", adminAuth, productRoutes);
app.use("/admin/category-offer", adminAuth, categoryOfferRoutes);

// USER ROUTES
app.use("/products", userProductRoutes);
app.use("/search", searchRoutes);
app.get("/home", checkBlockStatus, userProductController.getHomePage);
app.use("/wishlist", wishlistRoutes);
app.use("/cart", cartRoutes);
app.use("/", orderRoutes);

app.get("/", (req, res) => res.redirect("/home"));

module.exports = app;
