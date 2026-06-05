const Product = require("../models/productModel");

exports.getInventoryPage = async (req, res) => {
  try {
    const keyword = req.query.q || "";
    const filterStatus = req.query.status || "all";
    const page = parseInt(req.query.page, 10) || 1;
    const limit = 5;
    const LOW_STOCK_THRESHOLD = 5;

    let query = {};
    if (keyword) {
      query.name = {$regex: keyword, $options: "i"};
    }

    let products = await Product.find(query).sort({updatedAt: -1});

    let allInventoryItems = [];
    products.forEach((product) => {
      product.variants.forEach((variant) => {
        const isLowStock = variant.stock <= LOW_STOCK_THRESHOLD;

        if (filterStatus === "lowStock" && !isLowStock) return;

        allInventoryItems.push({
          productId: product._id,
          variantId: variant._id,
          name: product.name,
          image: variant.images?.[0] || "default.jpg",
          size: variant.size,
          color: variant.color,
          stock: variant.stock,
          price: variant.price,
          finalPrice: variant.finalPrice || variant.price,
          isLowStock: isLowStock,
        });
      });
    });

    const totalItems = allInventoryItems.length;
    const totalPages = Math.ceil(totalItems / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const paginatedInventory = allInventoryItems.slice(startIndex, endIndex);

    res.render("admin/inventory", {
      inventory: paginatedInventory,
      searchQuery: keyword,
      currentFilter: filterStatus,
      threshold: LOW_STOCK_THRESHOLD,
      currentPage: page,
      totalPages: totalPages,
    });
  } catch (err) {
    console.error("Inventory calculation error tracking:", err);
    res.status(500).send("Internal Server Inventory Configuration Timeout");
  }
};

exports.updateVariantStock = async (req, res) => {
  try {
    const {productId, variantId} = req.params;
    const {newStock} = req.body;

    const parsedStock = parseInt(newStock, 10);
    if (isNaN(parsedStock) || parsedStock < 0) {
      return res.status(400).json({
        success: false,
        message: "Stock value must be a non-negative integer.",
      });
    }

    const updatedProduct = await Product.findOneAndUpdate(
      {_id: productId, "variants._id": variantId},
      {$set: {"variants.$.stock": parsedStock}},
      {new: true},
    );

    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: "Target variant reference asset not found.",
      });
    }

    res.json({
      success: true,
      message: "Inventory metric updated successfully.",
    });
  } catch (err) {
    console.error("Stock update failure context:", err);
    res.status(500).json({
      success: false,
      message: "Database context update execution crash.",
    });
  }
};
