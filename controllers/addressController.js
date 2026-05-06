const Address = require("../models/addressModel");

// address adding
exports.addAddress = async (req, res) => {
  try {
    const address = await Address.create({
      ...req.body,
      user: req.user._id,
    });

    res.json({message: "Address added successfully"});
  } catch (err) {
    return res.render("pages/add-address", {
      error: "Failed to add address. Please try again.",
      formData: req.body,
    });
  }
};

// read all address
exports.getAddresses = async (req, res) => {
  console.log("USER:", req.user);

  const addresses = await Address.find({user: req.user._id});

  console.log("ADDRESSES:", addresses);

  res.render("pages/address", {addresses});
};

// edit address
exports.getEditAddress = async (req, res) => {
  const address = await Address.findById(req.params.id);
  console.log("EDIT PAGE ADDRESS:", address);
  res.render("pages/editAddress", {address});
};
// read single address
exports.getSingleAddress = async (req, res) => {
  const address = await Address.findById(req.params.id);
  res.json(address);
};

// update address
exports.updateAddress = async (req, res) => {
  try {
    const updated = await Address.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!updated) {
      return res.status(404).json({message: "Address not found"});
    }

    res.json({message: "Address updated successfully"});
  } catch (err) {
    console.log(err);
    res.status(500).json({message: "Update failed"});
  }
};

// delete address
exports.deleteAddress = async (req, res) => {
  await Address.findByIdAndDelete(req.params.id);
  res.json({message: "Address deleted"});
};
