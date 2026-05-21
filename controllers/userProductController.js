const userProductService = require("../services/userProductService");

// get all products
exports.getUserProducts = async (req, res) => {
  try {
    const result = await userProductService.getFilteredUserProducts(req.query);
    return res.json(result);
  } catch (err) {
    console.error("User Product Catalog Sifting Error:", err);
    return res.status(500).json({message: err.message});
  }
};

// get product
exports.getProductDetails = async (req, res) => {
  try {
    const bundle = await userProductService.getProductDetailBundle(
      req.params.id,
    );

    if (!bundle) {
      return res.redirect("/products");
    }

    return res.render("pages/productDetails", {
      product: bundle.product,
      relatedProducts: bundle.relatedProducts,
    });
  } catch (err) {
    console.error("Product Details Retrieval Error:", err);
    return res.redirect("/products");
  }
};

// get home page
exports.getHomePage = async (req, res) => {
  try {
    const products = await userProductService.getHomepageShowcaseProducts();
    console.log("HOME PRODUCTS:", products);
    return res.render("pages/home", {products});
  } catch (err) {
    console.error("Home Controller View Mount Error:", err);
    return res.render("pages/home", {products: []});
  }
};
