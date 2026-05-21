let currentCropper = null;
let croppedBlobData = null;

function initCropper({input, preview, aspectRatio = 1}) {
  if (!input || !preview) {
    console.error(
      "Cropper elements missing: check your input or preview bindings.",
    );
    return;
  }

  input.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      alert("Only JPG, PNG, and WEBP images are allowed");
      input.value = "";
      return;
    }

    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      alert("Image size must be below 2MB");
      input.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      preview.style.display = "block";
      preview.src = event.target.result;

      if (currentCropper) {
        currentCropper.destroy();
      }

      currentCropper = new Cropper(preview, {
        aspectRatio,
        viewMode: 1,
        autoCropArea: 1,
        responsive: true,
        background: false,
        cropend() {
          updateCroppedBlob();
        },
        ready() {
          updateCroppedBlob();
        },
      });
    };

    reader.readAsDataURL(file);
  });
}

function updateCroppedBlob() {
  if (!currentCropper) return;

  currentCropper.getCroppedCanvas({width: 500, height: 500}).toBlob((blob) => {
    croppedBlobData = blob;
  }, "image/png");
}

function getCroppedFile() {
  return new Promise((resolve) => {
    if (!croppedBlobData) {
      resolve(null);
      return;
    }

    const croppedFile = new File(
      [croppedBlobData],
      `avatar-${Date.now()}.png`,
      {
        type: "image/png",
      },
    );
    resolve(croppedFile);
  });
}

function destroyCropper() {
  if (currentCropper) {
    currentCropper.destroy();
    currentCropper = null;
  }
  croppedBlobData = null;
}
