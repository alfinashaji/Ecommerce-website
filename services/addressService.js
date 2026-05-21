const Address = require("../models/addressModel");

exports.createAddress = async (addressData, userId) => {
  return await Address.create({
    ...addressData,
    user: userId,
  });
};

exports.getAllAddresses = async (userId) => {
  return await Address.find({user: userId});
};

exports.getAddressById = async (id) => {
  return await Address.findById(id);
};

exports.updateAddressById = async (id, updateData) => {
  return await Address.findByIdAndUpdate(id, updateData, {
    new: true,
  });
};

exports.deleteAddressById = async (id) => {
  return await Address.findByIdAndDelete(id);
};
