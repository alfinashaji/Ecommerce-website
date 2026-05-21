const addressService = require("../services/addressService");

// address adding
exports.addAddress = async (req, res) => {
  try {
    await addressService.createAddress(req.body, req.user._id);
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
  try {
    const addresses = await addressService.getAllAddresses(req.user._id);
    res.render("pages/address", {addresses});
  } catch (err) {
    res.status(500).send("Internal Server Error");
  }
};

// edit address page
exports.getEditAddress = async (req, res) => {
  try {
    const address = await addressService.getAddressById(req.params.id);
    res.render("pages/editAddress", {address});
  } catch (err) {
    res.status(500).send("Internal Server Error");
  }
};

// read single address (API)
exports.getSingleAddress = async (req, res) => {
  try {
    const address = await addressService.getAddressById(req.params.id);
    if (!address) {
      return res.status(404).json({message: "Address not found"});
    }
    res.json(address);
  } catch (err) {
    res.status(500).json({message: "Error fetching address"});
  }
};

// update address
exports.updateAddress = async (req, res) => {
  try {
    const updated = await addressService.updateAddressById(
      req.params.id,
      req.body,
    );

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
  try {
    await addressService.deleteAddressById(req.params.id);
    res.json({message: "Address deleted"});
  } catch (err) {
    res.status(500).json({message: "Deletion failed"});
  }
};
