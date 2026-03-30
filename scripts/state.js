window.leadScope = {
  state: {
    business: { all: [], filtered: [], filter: 'all', search: '', page: 1 },
    jobs: { all: [], filtered: [], filter: 'all', search: '', page: 1 },
    people: { all: [], filtered: [], filter: 'all', search: '', page: 1 },
  },
  errorLog: [],
  perPage: 15,
  storageKeys: {
    apifyApiKey: 'leadscope.apifyApiKey',
  },
  storageStatus: {
    apifyUnavailableLogged: false,
  },
  prefixes: {
    business: 'b',
    jobs: 'j',
    people: 'p',
  },
  navOrder: ['business', 'jobs', 'people', 'saved', 'exports'],
};

function esc(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function safeExternalUrl(value) {
  if (!value) {
    return '';
  }

  try {
    const url = new URL(String(value).trim(), window.location.href);
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return url.href;
    }
  } catch (error) {
    return '';
  }

  return '';
}

function safeTelUrl(value) {
  const normalized = String(value || '').replace(/[^\d+().\-\s]/g, '').trim();
  return normalized ? `tel:${normalized}` : '';
}

function safeMailtoUrl(value) {
  const normalized = String(value || '').trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) ? `mailto:${normalized}` : '';
}
