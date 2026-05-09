const admin = require("firebase-admin");

if (!admin.apps.length) {
  const serviceAccount = require("../firebase-service-account.json");

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
}

const bucket = admin.storage().bucket();

function extractFirebaseFilePath(imageUrl) {
  if (!imageUrl) return null;

  try {
    if (imageUrl.startsWith("gs://")) {
      const withoutPrefix = imageUrl.replace("gs://", "");
      const parts = withoutPrefix.split("/");
      parts.shift();
      return parts.join("/");
    }

    if (imageUrl.includes("/o/")) {
      const encodedPath = imageUrl.split("/o/")[1].split("?")[0];
      return decodeURIComponent(encodedPath);
    }

    if (imageUrl.startsWith("listings/") || imageUrl.startsWith("auctions/")) {
      return imageUrl;
    }

    return null;
  } catch (error) {
    console.error("Extract Firebase path error:", error);
    return null;
  }
}

async function deleteImageFromFirebase(imageUrl) {
  if (!imageUrl) return;

  try {
    const filePath = extractFirebaseFilePath(imageUrl);

    if (!filePath) {
      console.warn("Could not extract Firebase file path from URL:", imageUrl);
      return;
    }

    await bucket.file(filePath).delete({
      ignoreNotFound: true,
    });

    console.log("Deleted Firebase image:", filePath);
  } catch (error) {
    if (error.code === 404) {
      console.warn("Firebase image already deleted or not found.");
      return;
    }

    console.error("Delete Firebase image error:", error);
  }
}

module.exports = {
  admin,
  bucket,
  deleteImageFromFirebase,
};