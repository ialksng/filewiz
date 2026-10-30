const configuredBase = import.meta.env.VITE_API_BASE_URL?.trim();

function normalizeApiBase(value) {
  if (!value) return import.meta.env.DEV ? 'http://localhost:5001/api' : '/work/projects/filewiz/app/api';

  if (value.startsWith('/')) return value.replace(/\/+$/, '');

  // A bare host is treated as a relative URL by fetch. Normalize values such
  // as api.example.com/api to an absolute HTTPS API URL.
  if (!value.startsWith('/') && !/^https?:\/\//i.test(value)) {
    value = `https://${value}`;
  }

  return value.replace(/\/+$/, '');
}

const apiBase = normalizeApiBase(configuredBase);

export default apiBase;
