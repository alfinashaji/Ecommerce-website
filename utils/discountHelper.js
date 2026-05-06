exports.getCategoryDiscountPrice = (price, category) => {
  const discount = category?.discount;

  if (
    !discount ||
    !discount.isActive ||
    !discount.type ||
    !discount.expiryDate
  ) {
    return price;
  }

  if (new Date(discount.expiryDate) < new Date()) {
    return price;
  }

  let finalPrice = price;

  if (discount.type === "percentage") {
    finalPrice -= (price * discount.value) / 100;
  } else if (discount.type === "flat") {
    finalPrice -= discount.value;
  }

  return Math.max(finalPrice, 0);
};
