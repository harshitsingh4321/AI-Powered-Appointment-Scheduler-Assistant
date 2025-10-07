export function guardrail(ocr, entities, normalization) {
  const { raw_text } = ocr || {};
  const { entities: e, entities_confidence } = entities || {};
  const { normalized, normalization_confidence } = normalization || {};

  const missing = [];
  if (!e?.department) missing.push("department");
  if (!e?.date_phrase) missing.push("date");
  if (!e?.time_phrase) missing.push("time");

  const lowConf =
    (entities_confidence ?? 0) < 0.5 ||
    (normalization_confidence ?? 0) < 0.5;

  if (missing.length || lowConf || !normalized) {
    return {
      ok: false,
      error: {
        status: "needs_clarification",
        message: `Ambiguous or missing: ${missing.join(", ") || "low confidence"}`,
        hints: {
          ask: "Please specify clear department, date (YYYY-MM-DD) and time (HH:mm).",
          seen_text: raw_text || ""
        }
      }
    };
  }
  return { ok: true };
}

export function makeFinalAppointment(entities, normalization) {
  return {
    appointment: {
      department: entities.entities.department,
      date: normalization.normalized.date,
      time: normalization.normalized.time,
      tz: normalization.normalized.tz
    },
    status: "ok"
  };
}
