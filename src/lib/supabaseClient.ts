import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// This client is intentionally limited in what it's used for: uploading
// bytes directly to a private storage object using a short-lived signed
// token minted server-side (see uploads-create.ts). It never queries
// memories/calendar_events/etc — those tables have no RLS policy granted
// to the anon role, so this key could not read them even if it tried.
export const supabaseBrowser = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const STORAGE_BUCKET = "memories";

export async function uploadFileDirect(
  storagePath: string,
  token: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<void> {
  // supabase-js's storage.uploadToSignedUrl doesn't expose progress, so we
  // use XHR directly against the same signed-URL endpoint to get real
  // per-file progress for the upload UI.
  const endpoint = `${url}/storage/v1/object/upload/sign/${STORAGE_BUCKET}/${storagePath}?token=${token}`;

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", endpoint, true);
    xhr.setRequestHeader("x-upsert", "false");
    xhr.upload.onprogress = (evt) => {
      if (evt.lengthComputable && onProgress) {
        onProgress(Math.round((evt.loaded / evt.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed (${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error("Upload failed — check your connection."));
    xhr.send(file);
  });
}
