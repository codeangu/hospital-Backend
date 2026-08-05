
const moment = require('moment');

/**
 * Returns a deterministic integer in [2, 7] for a given 'YYYY-MM-DD' string.
 * The same date always produces the same value (djb2 hash seeded on the date).
 */
function getDailyLimit(dateStr) {
  let hash = 5381;
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) + hash) + dateStr.charCodeAt(i);
    hash = hash & hash; // keep 32-bit
  }
  return (Math.abs(hash) % 6) + 2; // 2–7 inclusive
}

/**
 * Computes the total record cap for the current query.
 *
 * - HOSPITAL role → { bypass: true }  (no cap, return real data)
 * - Date range present → { bypass: false, cap: sum of daily limits per day }
 * - No date range → { bypass: false, cap: today's daily limit }
 *
 * IMPORTANT: call this BEFORE queryBuilder() because queryBuilder deletes
 * startDate / endDate from req.query.
 */
function getQueryLimitCap(req) {
  if (req.user && req.user.role === 'HOSPITAL') {
    return { bypass: true, cap: null };
  }

  const { startDate, endDate } = req.query;

  if (startDate && endDate) {
    const start = moment(startDate).startOf('day');
    const end   = moment(endDate).startOf('day');
    let cap = 0;
    const current = start.clone();
    while (current.isSameOrBefore(end, 'day')) {
      cap += getDailyLimit(current.format('YYYY-MM-DD'));
      current.add(1, 'day');
    }
    return { bypass: false, cap };
  }

  // No date range — cap to today's deterministic limit
  return { bypass: false, cap: getDailyLimit(moment().format('YYYY-MM-DD')) };
}

module.exports = { getDailyLimit, getQueryLimitCap };
