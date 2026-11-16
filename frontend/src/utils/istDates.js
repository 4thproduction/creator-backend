const IST_OFFSET = 330 * 60 * 1000;
const shifted = (date) => new Date(date.getTime() + IST_OFFSET);

export const istToday = (now = new Date()) => {
  const local = shifted(now);
  return new Date(
    Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) -
      IST_OFFSET,
  );
};
export const daysBefore = (days) =>
  new Date(istToday().getTime() - (days - 1) * 86400000);
export const formatIstDate = (date) => {
  const local = shifted(date);
  return `${String(local.getUTCDate()).padStart(2, "0")}/${String(local.getUTCMonth() + 1).padStart(2, "0")}/${String(local.getUTCFullYear()).slice(-2)}`;
};
export const parseIstDate = (value) => {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{2})$/);
  if (!match) return null;
  const date = new Date(
    Date.UTC(2000 + Number(match[3]), Number(match[2]) - 1, Number(match[1])) -
      IST_OFFSET,
  );
  return formatIstDate(date) === value ? date : null;
};
export const toApiDate = (value) => {
  const date = parseIstDate(value);
  return date ? shifted(date).toISOString().slice(0, 10) : "";
};
