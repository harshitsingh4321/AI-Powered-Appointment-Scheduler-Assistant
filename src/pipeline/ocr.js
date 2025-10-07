import sharp from "sharp";
import Tesseract from "tesseract.js";

export async function ocrImageFromBuffer(buffer) {
  // Upscale small UI text, grayscale, normalize, sharpen → better OCR
  const prepped = await sharp(buffer)
    .resize({ width: 1600, withoutEnlargement: false })
    .grayscale()
    .normalise()
    .sharpen()
    .png()
    .toBuffer();

  const { data } = await Tesseract.recognize(prepped, "eng", {
    tessedit_pageseg_mode: 6, // uniform block of text
    // optional whitelist to reduce garbage
    tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789:@/- ",
    logger: () => {},
  });

  const raw_text = (data.text || "").trim();
  const confidence = (data.confidence ?? 60) / 100;
  return { raw_text, confidence: Number(confidence.toFixed(2)) };
}

export async function ocrPassThroughText(text) {
  const raw = String(text || "").trim();
  return { raw_text: raw, confidence: raw ? 0.99 : 0.0 };
}
