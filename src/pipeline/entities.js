// --- Helpers ---
function cleanPhrase(s) {
  if (!s) return s;
  let t = s
    .replace(/\s+/g, " ")          // collapse whitespace/newlines
    .replace(/[^\w\s:@/.-]+$/g, "") // strip trailing non-text noise
    .trim();

  // Hard-cut after "am/pm" or weekday window to kill OCR tails
  t = t.replace(/^(.*?\b(?:am|pm)\b).*/i, "$1");
  t = t.replace(
    /^(.*?\b(mon|tue|wed|thu|fri|sat|sun)(?:day)?\b(?:\s+at\s+\d{1,2}(:\d{2})?\s*(am|pm)?)?).*/i,
    "$1"
  );

  return t.slice(0, 60); // clamp
}

function normalizeSpacesLower(s) {
  return (s || "").toLowerCase().replace(/\s+/g, " ").trim();
}

// --- Department lexicon (extend freely) ---
export const DEPT_ALIASES = [
  // Dentistry
  { key: "dentist", norm: "Dentistry" },
  { key: "dental", norm: "Dentistry" },
  { key: "teeth", norm: "Dentistry" },

  // Dermatology
  { key: "dermatologist", norm: "Dermatology" },
  { key: "derma", norm: "Dermatology" },
  { key: "skin", norm: "Dermatology" },

  // Cardiology
  { key: "cardio", norm: "Cardiology" },
  { key: "cardiologist", norm: "Cardiology" },
  { key: "heart", norm: "Cardiology" },

  // Physiotherapy
  { key: "physio", norm: "Physiotherapy" },
  { key: "physiotherapy", norm: "Physiotherapy" },

  // Ophthalmology
  { key: "ophthalmology", norm: "Ophthalmology" },
  { key: "ophthalmologist", norm: "Ophthalmology" },
  { key: "eye", norm: "Ophthalmology" },
  { key: "eyes", norm: "Ophthalmology" },

  // ENT
  { key: "ent", norm: "ENT" },
  { key: "ear nose throat", norm: "ENT" },
];

function guessDepartment(text) {
  for (const d of DEPT_ALIASES) {
    if (text.includes(d.key)) return d.norm;
  }
  return null;
}

// --- Main extraction ---
export function extractEntities(raw_text) {
  const text = normalizeSpacesLower(raw_text);

  // 1) Department
  const department = guessDepartment(text);

  // 2) Time phrase (prefer strong forms)
  let time_phrase = null;
  let m =
    text.match(/\b(?:at\s*)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/) ||
    text.match(/\b(\d{1,2}):(\d{2})\b/) ||
    text.match(/\b(\d{1,2})\s*(am|pm)\b/);
  if (m) {
    time_phrase = m[0].replace(/^at\s+/, "");
  } else {
    const specials = ["noon", "midday", "midnight", "morning", "evening", "night", "afternoon"];
    for (const k of specials) {
      const idx = text.indexOf(k);
      if (idx !== -1) {
        time_phrase = text.slice(Math.max(0, idx - 5), idx + k.length + 5);
        break;
      }
    }
  }

  // 3) Date phrase (prefer relative keywords)
  let date_phrase = null;
  const relKeywords = [
    "today", "tomorrow", "next",
    "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
  ];
  for (const kw of relKeywords) {
    const idx = text.indexOf(kw);
    if (idx !== -1) {
      date_phrase = text.slice(idx, idx + 30);
      break;
    }
  }
  if (!date_phrase) {
    const dateRegex = /\b(\d{1,2}[-/.]\d{1,2}([-.\/]\d{2,4})?)\b|\b(20\d{2}-\d{2}-\d{2})\b/;
    const mm = text.match(dateRegex);
    if (mm) date_phrase = mm[0];
  }

  // 4) Sanitize phrases
  date_phrase = cleanPhrase(date_phrase);
  time_phrase = cleanPhrase(time_phrase);

  // 5) Confidence heuristic
  const score =
    (department ? 0.35 : 0) +
    (date_phrase ? 0.35 : 0) +
    (time_phrase ? 0.30 : 0);

  return {
    entities: {
      date_phrase: date_phrase || null,
      time_phrase: time_phrase || null,
      department: department || null,
    },
    entities_confidence: Number(score.toFixed(2)),
  };
}
