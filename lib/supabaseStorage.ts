const offerImagesBucket = "offer-images";
const maxImageSize = 5 * 1024 * 1024;
const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase URL or service role key is missing.");
  }

  return {
    url: url.replace(/\/$/, ""),
    serviceRoleKey
  };
}

function getStorageHeaders(contentType = "application/json") {
  const { serviceRoleKey } = getSupabaseConfig();

  return {
    apikey: serviceRoleKey,
    authorization: `Bearer ${serviceRoleKey}`,
    "content-type": contentType
  };
}

async function ensureOfferImagesBucket() {
  const { url } = getSupabaseConfig();
  const bucketResponse = await fetch(`${url}/storage/v1/bucket/${offerImagesBucket}`, {
    headers: getStorageHeaders()
  });
  const bucketResponseText = bucketResponse.ok ? "" : await bucketResponse.text();

  if (bucketResponse.ok) {
    return;
  }

  if (bucketResponse.status !== 404 && !bucketResponseText.includes("NoSuchBucket") && !bucketResponseText.includes("Bucket not found")) {
    throw new Error(`Could not check Supabase Storage bucket (${bucketResponse.status}): ${bucketResponseText}`);
  }

  const createResponse = await fetch(`${url}/storage/v1/bucket`, {
    method: "POST",
    headers: getStorageHeaders(),
    body: JSON.stringify({
      id: offerImagesBucket,
      name: offerImagesBucket,
      public: true,
      file_size_limit: maxImageSize,
      allowed_mime_types: Array.from(allowedImageTypes)
    })
  });

  if (!createResponse.ok) {
    const errorText = await createResponse.text();
    throw new Error(`Could not create Supabase Storage bucket (${createResponse.status}): ${errorText}`);
  }
}

function getSafeExtension(file: File) {
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

export async function uploadOfferImage(file: File, offerSlug: string, role: "hero" | "gallery", index = 0) {
  if (file.size === 0) {
    return null;
  }

  if (!allowedImageTypes.has(file.type)) {
    throw new Error("Only JPG, PNG and WEBP images are allowed.");
  }

  if (file.size > maxImageSize) {
    throw new Error("Image files must be 5MB or smaller.");
  }

  await ensureOfferImagesBucket();

  const { url } = getSupabaseConfig();
  const extension = getSafeExtension(file);
  const objectPath = `${offerSlug}/${role}-${index}-${crypto.randomUUID()}.${extension}`;
  const uploadResponse = await fetch(`${url}/storage/v1/object/${offerImagesBucket}/${objectPath}`, {
    method: "POST",
    headers: {
      ...getStorageHeaders(file.type),
      "x-upsert": "false"
    },
    body: file
  });

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    throw new Error(`Could not upload image to Supabase Storage (${uploadResponse.status}): ${errorText}`);
  }

  return `${url}/storage/v1/object/public/${offerImagesBucket}/${objectPath}`;
}
