import { api } from "@/services";

/**
 * Sends one local file to storage and returns the key to record against it.
 *
 * Three steps, hidden from the screens: ask the server for permission, send
 * the bytes wherever it says, hand the key back. The bytes never go through
 * the API — a photo relayed through the server is the same photo, slower.
 *
 * A failure here throws with something a person can act on. "Upload failed"
 * on a screen where somebody just chose a picture of themselves is not an
 * answer, and silently keeping the local file path is worse: it looks like it
 * worked and then the photo is missing for everyone else.
 */

/** What a phone gives us, mapped to what storage is told it is receiving. */
const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
  pdf: "application/pdf",
};

function contentTypeOf(uri: string, mimeType?: string | null): string {
  if (mimeType && mimeType !== "application/octet-stream") return mimeType;
  const extension = uri.split("?")[0]!.split(".").pop()?.toLowerCase() ?? "";
  return CONTENT_TYPES[extension] ?? "image/jpeg";
}

export async function uploadFile(input: {
  uri: string;
  kind: "photo" | "badge";
  mimeType?: string | null;
}): Promise<string> {
  const contentType = contentTypeOf(input.uri, input.mimeType);

  // The local file, read once. Needed before signing because the server is
  // asked to approve a specific size, not an open-ended upload.
  const response = await fetch(input.uri);
  if (!response.ok) throw new Error("We could not read that file. Try another.");
  const blob = await response.blob();

  if (blob.size === 0) throw new Error("That file looks empty. Try another.");

  const target = await api.uploads.sign({
    kind: input.kind,
    contentType,
    bytes: blob.size,
  });

  // Two upload shapes, decided by the server. A presigned URL takes the bytes
  // as the whole body; a provider that signs parameters instead needs them as
  // multipart fields next to the file. The screens know about neither.
  const multipart = target.method === "POST";
  let body: BodyInit = blob;

  if (multipart) {
    const form = new FormData();
    for (const [name, value] of Object.entries(target.fields ?? {})) {
      form.append(name, value);
    }
    // Last, and named "file": some providers read the fields in order and
    // reject a body whose file arrives before the signature it is signed by.
    //
    // The Blob itself, not the legacy React Native { uri, name, type } shape.
    // That shape is rejected outright by this version of React Native with
    // "unsupported FormData part implementation", which is what broke every
    // profile photo and every student card. The blob was already read above to
    // measure the file, so appending it costs nothing extra.
    form.append("file", blob, `upload.${contentType.split("/")[1] ?? "jpg"}`);
    body = form;
  }

  const put = await fetch(target.url, {
    method: target.method ?? "PUT",
    headers: target.headers,
    body,
  });

  if (!put.ok) {
    // The signed URL is the only thing that could have failed here, and it
    // has already expired or been refused by storage. Retrying needs a new
    // one, which means starting again.
    throw new Error("The upload did not finish. Check your connection and try again.");
  }

  return target.key;
}
