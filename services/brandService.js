const Brand = require("../models/brandModel");

exports.createBrand = async ({name, description, logoPath}) => {
  const existing = await Brand.findOne({name});
  if (existing) {
    throw new Error("Brand already exists");
  }

  const brand = new Brand({
    name,
    description,
    logo: logoPath || "",
  });

  return await brand.save();
};

exports.getAllBrands = async () => {
  return await Brand.find();
};

exports.updateBrandById = async (id, {name, description, logoPath}) => {
  const brand = await Brand.findById(id);
  if (!brand) return null;

  if (logoPath) {
    brand.logo = logoPath;
  }

  brand.name = name || brand.name;
  brand.description = description || brand.description;

  return await brand.save();
};

exports.toggleBrandListing = async (id) => {
  const brand = await Brand.findById(id);
  if (!brand) return null;

  brand.isListed = !brand.isListed;
  await brand.save();

  return brand;
};
