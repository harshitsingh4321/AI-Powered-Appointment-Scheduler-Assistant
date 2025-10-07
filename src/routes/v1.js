import { Router } from "express";
import { z } from "zod";

import upload from "../middleware/upload.js";
import { ocrImageFromBuffer, ocrPassThroughText } from "../pipeline/ocr.js";
import { extractEntities } from "../pipeline/entities.js";
import { normalizeEntities } from "../pipeline/normalize.js";
import { guardrail, makeFinalAppointment } from "../pipeline/finalize.js";

const r = Router();

// simple schema to validate text input
const TextSchema = z.object({ text: z.string().min(1, "text is required") });

// health
r.get("/health", (req, res) => {
  res.json({ request_id: req.requestId, ok: true, service: "project_plum", ts: new Date().toISOString() });
});

// text -> pipeline
r.post("/parse/text", async (req, res) => {
  try {
    const minimal = (req.query.minimal || "").toLowerCase() === "true";

    const parsed = TextSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ request_id: req.requestId, error: "Bad Request", detail: parsed.error.flatten() });
    }

    const { text } = parsed.data;
    const ocr = await ocrPassThroughText(text);

    const entities = extractEntities(ocr.raw_text);
    const normalization = normalizeEntities(entities.entities);

    const guard = guardrail(ocr, entities, normalization);
    if (!guard.ok) return res.status(200).json({ request_id: req.requestId, ...guard.error });

    const finalJson = makeFinalAppointment(entities, normalization);
    const payload = minimal
      ? { request_id: req.requestId, ...finalJson }
      : { request_id: req.requestId, ocr, entities, normalization, ...finalJson };

    return res.json(payload);
  } catch (e) {
    console.error(e);
    res.status(500).json({ request_id: req.requestId, error: "Internal error" });
  }
});

// image -> pipeline
r.post("/parse/document", upload, async (req, res) => {
  try {
    const minimal = (req.query.minimal || "").toLowerCase() === "true";

    if (!req.file) return res.status(400).json({ request_id: req.requestId, error: "No file uploaded (use field name: file)" });

    const ocr = await ocrImageFromBuffer(req.file.buffer);
    if (!ocr.raw_text) return res.status(422).json({ request_id: req.requestId, error: "Could not read text from image" });

    const entities = extractEntities(ocr.raw_text);
    const normalization = normalizeEntities(entities.entities);

    const guard = guardrail(ocr, entities, normalization);
    if (!guard.ok) return res.status(200).json({ request_id: req.requestId, ...guard.error });

    const finalJson = makeFinalAppointment(entities, normalization);
    const payload = minimal
      ? { request_id: req.requestId, ...finalJson }
      : { request_id: req.requestId, ocr, entities, normalization, ...finalJson };

    return res.json(payload);
  } catch (e) {
    console.error(e);
    res.status(500).json({ request_id: req.requestId, error: "Internal error" });
  }
});

export default r;
