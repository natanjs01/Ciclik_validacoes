export function appUrl(path: string) {
  // import.meta.env.BASE_URL is provided by Vite and usually starts and ends with '/'
  const rawBase = (import.meta.env.BASE_URL ?? '/').toString();
  // Remove trailing slashes from base to avoid duplicated slashes
  const base = rawBase.replace(/\/+$|^$/g, '').replace(/\/$/, '');
  const normalizedBase = base === '/' || base === '' ? '' : base;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${window.location.origin}${normalizedBase}${normalizedPath}`;
}
