async function toggleWishlist(button, productId) {
  try {
    const res = await fetch(`/wishlist/toggle/${productId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();

    const icon = button.querySelector("i");

    if (data.added) {
      icon.classList.remove("fa-regular");
      icon.classList.add("fa-solid");
    } else {
      icon.classList.remove("fa-solid");
      icon.classList.add("fa-regular");
    }
  } catch (err) {
    console.log(err);
    alert("Wishlist failed");
  }
}
