const platformFields = { Instagram: 'igLink', YouTube: 'ytLink', Facebook: 'fbLink', LinkedIn: 'liLink' };
const literal = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const IST_OFFSET = 330 * 60 * 1000;
const date = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('Invalid date range');
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) throw new Error('Invalid date range');
  return new Date(parsed.getTime() - IST_OFFSET);
};
const creatorFilters = (query = {}, now = new Date()) => {
  const filter = {};
  if (query.search?.trim()) {
    const expression = { $regex: literal(query.search.trim()), $options: 'i' };
    filter.$or = [{ fullName: expression }, { email: expression }];
  }
  for (const key of ['category', 'city']) {
    if (query[key]) filter[key] = { $regex: `^${literal(query[key])}$`, $options: 'i' };
  }
  if (query.platform) {
    if (!platformFields[query.platform]) throw new Error('Invalid platform');
    filter[platformFields[query.platform]] = { $type: 'string', $regex: '\\S' };
  }
  if (query.period && query.period !== 'all') {
    let start, end;
    if (query.period === 'custom') {
      start = date(query.from);
      end = date(query.to);
      if (start > end) throw new Error('Start date must be before or equal to end date');
    } else {
      if (!['7', '30', '90'].includes(query.period)) throw new Error('Invalid date period');
      const local = new Date(now.getTime() + IST_OFFSET);
      end = new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) - IST_OFFSET);
      start = new Date(end);
      start.setUTCDate(start.getUTCDate() - Number(query.period) + 1);
    }
    end.setUTCDate(end.getUTCDate() + 1);
    filter.createdAt = { $gte: start, $lt: end };
  }
  return filter;
};
module.exports = { creatorFilters };
