const searchService = require("../services/searchService");

exports.universalSearch = async (req, res) => {
  try {
    const searchTerm = req.query.search || "";

    if (!searchTerm.trim()) {
      return res.redirect("/products");
    }

    const searchResults =
      await searchService.executeUniversalSearch(searchTerm);

    return res.redirect(
      `/products?search=${encodeURIComponent(searchTerm.trim())}`,
    );
  } catch (err) {
    console.error("Search Controller Routing Error:", err);
    res.status(500).redirect("/products");
  }
};
