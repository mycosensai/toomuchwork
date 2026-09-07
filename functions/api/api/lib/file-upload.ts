/**
 * Image/file upload validation utilities
 * Validates data URIs for image uploads
 */

import { z } from "zod";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

const DATA_URI_PATTERN = /^data:image\/(jpeg|png|gif|webp|svg\+xml);base64,[A-Za-z0-9+/=]+$/;

export function validateImageDataUri(uri: string): boolean {
  if (!uri || typeof uri !== "string") return false;
  if (!DATA_URI_PATTERN.test(uri)) return false;

  try {
    const base64Data = uri.split(",")[1];
    const size = Math.ceil((base64Data.length * 3) / 4);
    if (size > MAX_IMAGE_SIZE) return false;
    return true;
  } catch {
    return false;
  }
}

export function validateImageDataUris(uris: string[]): string[] {
  return uris.filter((uri) => validateImageDataUri(uri));
}

export const imageDataUriSchema = z.string().refine(validateImageDataUri, {
  message: "Invalid image data URI. Must be a valid base64 encoded image under 10MB.",
});

export const imageDataUriArraySchema = z.array(imageDataUriSchema).min(0).max(10);

export function dataUriToBlob(dataUri: string): Blob | null {
  try {
    const matches = dataUri.match(/^data:(.+?);base64,(.+)$/);
    if (!matches) return null;
    const mimeType = matches[1];
    const base64Data = matches[2];
    const byteString = atob(base64Data);
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const uint8Array = new Uint8Array(arrayBuffer);
    for (let i = 0; i < byteString.length; i++) {
      uint8Array[i] = byteString.charCodeAt(i);
    }
    return new Blob([arrayBuffer], { type: mimeType });
  } catch {
    return null;
  }
}

export function getImageMimeType(dataUri: string): string | null {
  try {
    const matches = dataUri.match(/^data:(image\/[a-zA-Z+]+);base64,/);
    return matches ? matches[1] : null;
  } catch {
    return null;
  }
}

export function estimateImageSize(dataUri: string): number {
  try {
    const base64Data = dataUri.split(",")[1];
    return Math.ceil((base64Data.length * 3) / 4);
  } catch {
    return 0;
  }
}
