/** Resolves API/static paths so <img src> works from any route (leading /, strip ../). */
export default function assetUrl(path) {
  if (path == null || path === '') return '';
  const s = String(path).trim();
  if (/^https?:\/\//i.test(s)) return s;
  const cleaned = s.replace(/^\.\.\//, '');
  return cleaned.startsWith('/') ? cleaned : `/${cleaned}`;
}
