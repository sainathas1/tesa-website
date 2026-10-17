/**
 * Universal Cloudinary Unsigned Upload Helper
 *
 * Cloud Name: cc0vold0
 * Upload Preset: tesasggs
 * Endpoint: https://api.cloudinary.com/v1_1/cc0vold0/image/upload
 */

export const CLOUDINARY_CLOUD_NAME =
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "cc0vold0";
export const CLOUDINARY_UPLOAD_PRESET =
  process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "tesasggs";
export const CLOUDINARY_ENDPOINT = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

/**
 * Upload any File (portrait photo, event banner, gallery photo, payment screenshot)
 * directly to Cloudinary using the unsigned preset and return its secure_url.
 */
export async function uploadToCloudinary(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  formData.append("cloud_name", CLOUDINARY_CLOUD_NAME);

  const res = await fetch(CLOUDINARY_ENDPOINT, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData?.error?.message ||
        `Cloudinary upload failed with status ${res.status}. Please check your connection.`
    );
  }

  const data = await res.json();
  const secureUrl = data.secure_url || data.url;

  if (!secureUrl) {
    throw new Error("Cloudinary response did not return a secure image URL.");
  }

  return secureUrl;
}
