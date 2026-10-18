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
export const CLOUDINARY_BASE_ENDPOINT = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}`;

/**
 * Upload any File (portrait photo, event banner, gallery photo, payment screenshot, PDF, PPT)
 * directly to Cloudinary using the unsigned preset and return its secure_url.
 * Uses /image/upload for images and /raw/upload for PDFs, PPTs and documents to avoid 401 ACL failure.
 */
export async function uploadToCloudinary(file: File): Promise<string> {
  const isImage = file.type ? file.type.startsWith("image/") : /\.(jpg|jpeg|png|webp|gif|svg|avif)$/i.test(file.name);
  const resourceType = isImage ? "image" : "raw";
  const endpoint = `${CLOUDINARY_BASE_ENDPOINT}/${resourceType}/upload`;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  formData.append("cloud_name", CLOUDINARY_CLOUD_NAME);

  const res = await fetch(endpoint, {
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

/**
 * Cloudinary Face-Detection Avatar Optimization Helper
 * Automatically transforms Cloudinary URLs to center on the person's face
 * with a 4:5 portrait ratio and high quality compression.
 */
export function getOptimizedAvatarUrl(url?: string): string {
  if (!url) return "";
  if (url.includes("res.cloudinary.com") && url.includes("/image/upload/")) {
    if (url.includes("c_fill,g_face")) return url;
    return url.replace("/image/upload/", "/image/upload/c_fill,g_face,w_800,h_1000,q_auto/");
  }
  return url;
}
