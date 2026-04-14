function switchPage(name, el, isMob = false) {
  document.querySelectorAll('.page').forEach((page) => page.classList.remove('active'));
  document.getElementById(`page-${name}`).classList.add('active');

  if (!isMob) {
    document.querySelectorAll('.nav-item').forEach((item) => item.classList.remove('active'));
    el.classList.add('active');
  } else {
    document.querySelectorAll('.mob-nav-item').forEach((item) => item.classList.remove('active'));
    el.classList.add('active');

    const sidebarItems = document.querySelectorAll('.nav-item');
    sidebarItems.forEach((item, index) => {
      item.classList.toggle('active', window.leadScope.navOrder[index] === name);
    });
  }

  updateExportStats();
}

function looksLikeApifyKey(value) {
  return /^apify_api_[A-Za-z0-9]+$/.test(String(value || '').trim());
}

function readStoredKey() {
  return '';
}

function saveStoredKey(value) {
  return !String(value || '').trim() || true;
}

function clearStoredKey() {
  return true;
}

function syncKey(value, options = {}) {
  const normalizedValue = value.trim();
  const isValidApifyKey = looksLikeApifyKey(normalizedValue);

  document.getElementById('sidebar-key').value = normalizedValue;
  document.getElementById('key-status').textContent = normalizedValue
    ? !isValidApifyKey
      ? 'Key format looks invalid'
      : 'Key ready for this session'
    : 'No key entered';
  document.getElementById('key-dot').className = `dot ${
    normalizedValue ? (isValidApifyKey ? 'ok' : 'warn') : ''
  }`.trim();
}

function getKey() {
  return document.getElementById('sidebar-key').value.trim();
}

function updateLocationHint(prefix = 'b') {
  const profile =
    typeof buildLocationProfile === 'function'
      ? buildLocationProfile(prefix)
      : {
          country: document.getElementById(`${prefix}-country`).value,
          region: document.getElementById(`${prefix}-state`).value.trim(),
          city: document.getElementById(`${prefix}-city`).value.trim(),
          area: document.getElementById(`${prefix}-area`).value.trim(),
          mode: document.getElementById(`${prefix}-location-mode`)?.value || 'smart',
        };
  const { country, region, city, area, mode } = profile;
  const parts = [city, region, country].filter(Boolean);
  document.getElementById(`${prefix}-loc-hint`).textContent = parts.join(', ') || 'Worldwide';

  const plans = {
    exact: `Exact search: ${[area, city, region, country].filter(Boolean).join(', ') || 'worldwide'}.`,
    smart: 'Smart search: exact target first, then broader city/state/country fallbacks if spelling is imperfect.',
    broad: 'Broad search: city, region, and country variants for maximum coverage with less precision.',
  };
  const planEl = document.getElementById(`${prefix}-loc-plan`);
  if (planEl) {
    planEl.textContent = plans[mode];
  }

  const normalizedEl = document.getElementById(`${prefix}-loc-normalized`);
  if (normalizedEl) {
    normalizedEl.textContent = `Normalized target: ${[area, city, region, country].filter(Boolean).join(', ') || 'Worldwide'}`;
  }

  const warningEl = document.getElementById(`${prefix}-loc-warning`);
  if (warningEl) {
    const warning = buildLocationWarning(prefix);
    warningEl.textContent = warning;
    warningEl.style.display = warning ? 'block' : 'none';
  }

  const verifiedEl = document.getElementById(`${prefix}-loc-verified`);
  if (verifiedEl) {
    verifiedEl.style.display = 'none';
    verifiedEl.textContent = '';
  }
}

function buildLocationWarning(prefix = 'b') {
  const rawState = document.getElementById(`${prefix}-state`).value.trim();
  const rawCity = document.getElementById(`${prefix}-city`).value.trim();
  const warnings = [];

  if (rawState && rawState.length <= 3) {
    warnings.push('State looks abbreviated. Use the full state or region name when possible.');
  }

  if (rawCity && /\d/.test(rawCity)) {
    warnings.push('City contains numbers, which often means the location may be mistyped.');
  }

  if (rawCity && rawCity.length >= 12 && !/[aeiou]/i.test(rawCity)) {
    warnings.push('City spelling looks unusual. Check for a typo before searching.');
  }

  if (rawState && rawState.length >= 12 && !/[aeiou]/i.test(rawState)) {
    warnings.push('State spelling looks unusual. Check for a typo before searching.');
  }

  if (typeof expandLocationAlias === 'function') {
    const expandedState = expandLocationAlias(rawState, 'states');
    const expandedCity = expandLocationAlias(rawCity, 'cities');
    if (rawState && expandedState && expandedState.toLowerCase() !== rawState.toLowerCase()) {
      warnings.push(`State will be searched as "${expandedState}".`);
    }
    if (rawCity && expandedCity && expandedCity.toLowerCase() !== rawCity.toLowerCase()) {
      warnings.push(`City will be searched as "${expandedCity}".`);
    }
  }

  return warnings.join(' ');
}

function setupTagInput(inputId, wrapId) {
  const input = document.getElementById(inputId);

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      const value = input.value.trim().replace(/,$/, '');
      if (value) {
        addTag(wrapId, value);
      }
      input.value = '';
    }

    if (event.key === 'Backspace' && input.value === '') {
      const wrap = document.getElementById(wrapId);
      const pills = wrap.querySelectorAll('.tag-pill');
      if (pills.length) {
        pills[pills.length - 1].remove();
      }
    }
  });
}

function addTag(wrapId, text) {
  const wrap = document.getElementById(wrapId);
  const input = wrap.querySelector('.tag-input-hidden');
  const normalizedText = String(text || '').trim();
  if (!normalizedText) {
    return;
  }

  const existing = getTagsFromWrap(wrapId).map((tag) => tag.toLowerCase());
  if (existing.includes(normalizedText.toLowerCase())) {
    return;
  }

  const pill = document.createElement('span');
  pill.className = 'tag-pill';
  pill.innerHTML = `${esc(normalizedText)}<span class="del" data-remove-tag>×</span>`;
  wrap.insertBefore(pill, input);
}

function removeTag(el) {
  el.parentElement.remove();
}

function getTagsFromWrap(wrapId) {
  return [...document.querySelectorAll(`#${wrapId} .tag-pill`)]
    .map((pill) => pill.textContent.replace('×', '').trim())
    .filter(Boolean);
}

function initializeCheckPills() {
  document.querySelectorAll('.check-pill input').forEach((input) => {
    input.parentElement.classList.toggle('checked', input.checked);

    input.addEventListener('change', () => {
      input.parentElement.classList.toggle('checked', input.checked);
    });
  });
}

function setProgress(prefix, percent, status) {
  document.getElementById(`${prefix}-prog-bar`).style.width = `${percent}%`;
  document.getElementById(`${prefix}-prog-pct`).textContent = `${percent}%`;

  if (status) {
    document.getElementById(`${prefix}-prog-status`).textContent = status;
  }
}

function addLog(prefix, message, type = '') {
  const log = document.getElementById(`${prefix}-prog-log`);
  const entry = document.createElement('div');
  entry.className = `log-line log-${type}`;
  entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
  log.appendChild(entry);
  log.scrollTop = log.scrollHeight;
}

function showError(prefix, message) {
  const errorBar = document.getElementById(`${prefix}-err`);
  errorBar.textContent = `❌ ${message}`;
  errorBar.style.display = 'block';
}

function logSupportEntry(context, errorLike) {
  const details = normalizeErrorDetails(context, errorLike);
  window.leadScope.errorLog.unshift(details);
  window.leadScope.errorLog = window.leadScope.errorLog.slice(0, 12);
  renderSupportLog();
}

function normalizeErrorDetails(context, errorLike) {
  const timestamp = new Date().toISOString();
  const error =
    errorLike instanceof Error
      ? errorLike
      : new Error(typeof errorLike === 'string' ? errorLike : JSON.stringify(errorLike));

  return {
    timestamp,
    context,
    message: error.message || 'Unknown error',
    stack: error.stack || '',
  };
}

function renderSupportLog() {
  const output = document.getElementById('support-log-output');
  if (!output) {
    return;
  }

  if (!window.leadScope.errorLog.length) {
    output.textContent = 'No errors logged.';
    return;
  }

  output.textContent = window.leadScope.errorLog
    .map(
      (entry) =>
        `[${entry.timestamp}] ${entry.context}\n${entry.message}${entry.stack ? `\n${entry.stack}` : ''}`
    )
    .join('\n\n');
}

async function copySupportLog() {
  const text = document.getElementById('support-log-output').textContent;
  await navigator.clipboard.writeText(text);

  const button = document.getElementById('copy-support-log-btn');
  const originalLabel = button.textContent;
  button.textContent = 'Copied';
  setTimeout(() => {
    button.textContent = originalLabel;
  }, 1200);
}
