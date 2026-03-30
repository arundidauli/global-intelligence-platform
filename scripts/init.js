setupTagInput('b-ind-input', 'b-industries-wrap');
setupTagInput('j-skill-input', 'j-skills-wrap');
initializeCheckPills();

document.getElementById('b-state').value = 'Uttar Pradesh';
document.getElementById('b-city').value = 'Moradabad';
updateLocationHint('b');
updateLocationHint('j');
updateLocationHint('p');
syncKey(readStoredKey() || getKey());
renderSupportLog();

document.querySelectorAll('.nav-item[data-page]').forEach((item) => {
  item.addEventListener('click', () => switchPage(item.dataset.page, item));
});

document.querySelectorAll('.mob-nav-item[data-page]').forEach((item) => {
  item.addEventListener('click', () => switchPage(item.dataset.page, item, true));
});

document.getElementById('sidebar-key').addEventListener('input', (event) => {
  syncKey(event.target.value, { persist: true });
});

document.getElementById('remove-key-btn').addEventListener('click', () => {
  clearStoredKey();
  syncKey('');
});

[
  { prefix: 'b', countryEvent: 'change' },
  { prefix: 'j', countryEvent: 'change' },
  { prefix: 'p', countryEvent: 'change' },
].forEach(({ prefix, countryEvent }) => {
  [`${prefix}-country`, `${prefix}-state`, `${prefix}-city`, `${prefix}-area`].forEach((id) => {
    const eventName = id.endsWith('-country') ? countryEvent : 'input';
    document.getElementById(id).addEventListener(eventName, () => updateLocationHint(prefix));
  });

  document.getElementById(`${prefix}-location-mode`).addEventListener('change', () => updateLocationHint(prefix));
  document.getElementById(`${prefix}-verify-location-btn`).addEventListener('click', () => {
    verifyLocation(prefix).catch((error) => {
      const warningEl = document.getElementById(`${prefix}-loc-warning`);
      warningEl.textContent = error.message;
      warningEl.style.display = 'block';
    });
  });
});

document.querySelectorAll('[data-focus-target]').forEach((wrap) => {
  wrap.addEventListener('click', () => {
    document.getElementById(wrap.dataset.focusTarget).focus();
  });
});

document.addEventListener('click', (event) => {
  const removeTrigger = event.target.closest('[data-remove-tag]');
  if (removeTrigger) {
    removeTag(removeTrigger);
    return;
  }

  const chip = event.target.closest('.chip[data-module][data-filter]');
  if (chip) {
    setChip(chip.dataset.module, chip.dataset.filter, chip);
    return;
  }

  const exportButton = event.target.closest('[data-export-module]');
  if (exportButton) {
    exportData(exportButton.dataset.exportModule, exportButton.dataset.exportFormat || 'csv');
    return;
  }

  const addTagButton = event.target.closest('[data-add-tag][data-wrap-id]');
  if (addTagButton) {
    addTag(addTagButton.dataset.wrapId, addTagButton.dataset.addTag);
    return;
  }

  const clearButton = event.target.closest('[data-clear-module]');
  if (clearButton) {
    clearResults(clearButton.dataset.clearModule);
  }
});

document.querySelectorAll('[data-search-module]').forEach((input) => {
  input.addEventListener('input', (event) => {
    searchFilter(input.dataset.searchModule, event.target.value);
  });
});

document.getElementById('b-run-btn').addEventListener('click', runBusinessSearch);
document.getElementById('j-run-btn').addEventListener('click', runJobSearch);
document.getElementById('p-run-btn').addEventListener('click', runPeopleSearch);
document.getElementById('exp-run-btn').addEventListener('click', exportFromCenter);

document.getElementById('b-rating-range').addEventListener('input', (event) => {
  const value = event.target.value;
  document.getElementById('b-rating-val').textContent = value === '0' ? 'Any' : `${value}★`;
  event.target.style.setProperty('--pct', `${(value / 5) * 100}%`);
});
document.getElementById('b-rating-range').style.setProperty('--pct', '0%');

document.getElementById('copy-support-log-btn').addEventListener('click', () => {
  copySupportLog().catch((error) => {
    logSupportEntry('Copy support log', error);
  });
});

window.addEventListener('error', (event) => {
  logSupportEntry(`Unhandled error${event.filename ? ` in ${event.filename}` : ''}`, event.error || event.message);
});

window.addEventListener('unhandledrejection', (event) => {
  logSupportEntry('Unhandled promise rejection', event.reason || 'Unknown rejection');
});
