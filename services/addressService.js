const Address = require("../models/addressModel");

exports.createAddress = async (addressData, userId) => {
  if (addressData.isDefault) {
    await Address.updateMany({user: userId}, {isDefault: false});
  }

  return await Address.create({
    ...addressData,
    user: userId,
    isDefault: !!addressData.isDefault,
  });
};

exports.getAllAddresses = async (userId) => {
  return await Address.find({user: userId});
};

exports.getAddressById = async (id) => {
  return await Address.findById(id);
};

exports.updateAddressById = async (id, updateData) => {
  const address = await Address.findById(id);

  if (!address) return null;

  if (updateData.isDefault) {
    await Address.updateMany({user: address.user}, {isDefault: false});
  }

  return await Address.findByIdAndUpdate(
    id,
    {
      ...updateData,
      isDefault: !!updateData.isDefault,
    },
    {new: true},
  );
};

exports.deleteAddressById = async (id) => {
  return await Address.findByIdAndDelete(id);
};
