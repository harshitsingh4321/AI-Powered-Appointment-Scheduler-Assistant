import * as chrono from "chrono-node";
import { DateTime } from "luxon";

const TZ = process.env.TZ || "Asia/Kolkata";

// Optional: disambiguate "next Friday" to "closest Friday if today <= Wed"
function adjustNextFriday(dt, phrase, tz = TZ) {
  const p = (phrase || "").toLowerCase();
  if (!p.includes("next friday")) return dt;

  const now = DateTime.now().setZone(tz);
  const thisWeekFriday = now.startOf("week").plus({ days: 5 }); // ISO week: Mon=1
  const isBeforeOrOnWed = now.weekday <= 3; // Mon=1..Sun=7 (<= Wed)

  // If parsed Friday is this week's Friday but user said "next Friday" early in the week,
  // decide whether to keep "this" or move to next. Tweak to your preference:
  if (isBeforeOrOnWed && dt.hasSame(thisWeekFriday, "day")) {
    return thisWeekFriday; // keep this Friday (closest upcoming)
  }

  return dt; // otherwise keep chrono result
}

export function normalizeEntities(entities) {
  const { date_phrase, time_phrase } = entities || {};
  const phrase = [date_phrase, time_phrase].filter(Boolean).join(" ").trim();
  if (!phrase) {
    return { normalized: null, normalization_confidence: 0.0, reason: "No date/time phrase" };
  }

  const ref = DateTime.now().setZone(TZ).toJSDate();
  const parsed = chrono.parse(phrase, ref, { forwardDate: true });
  if (!parsed.length) {
    return { normalized: null, normalization_confidence: 0.0, reason: "Chrono failed" };
  }

  let dt = DateTime.fromJSDate(parsed[0].date()).setZone(TZ);
  dt = adjustNextFriday(dt, phrase, TZ);

  const dateISO = dt.toFormat("yyyy-LL-dd");
  const time24 = dt.toFormat("HH:mm");

  const normConf = (date_phrase ? 0.45 : 0.25) + (time_phrase ? 0.45 : 0.25);
  return {
    normalized: { date: dateISO, time: time24, tz: TZ },
    normalization_confidence: Number(Math.min(0.99, normConf).toFixed(2)),
  };
}
