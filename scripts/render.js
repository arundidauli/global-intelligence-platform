function setChip(module, filter, el) {
  const prefix = window.leadScope.prefixes[module];
  document.querySelectorAll(`#${prefix}-results .chip`).forEach((chip) => chip.classList.remove('on'));
  el.classList.add('on');

  window.leadScope.state[module].filter = filter;
  window.leadScope.state[module].page = 1;
  applyFilter(module);
}

function searchFilter(module, value) {
  window.leadScope.state[module].search = value.toLowerCase();
  window.leadScope.state[module].page = 1;
  applyFilter(module);
}

function applyFilter(module) {
  const store = window.leadScope.state[module];
  const filter = store.filter;
  const query = store.search;
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  store.filtered = store.all.filter((item) => {
    if (query) {
      const text = JSON.stringify(item).toLowerCase();
      if (!text.includes(query)) {
        return false;
      }
    }

    if (filter === 'all') {
      return true;
    }

    if (module === 'business') {
      if (filter === 'phone') return Boolean(item.phone);
      if (filter === 'web') return Boolean(item.website);
      if (filter === 'rated') return item.rating >= 4;
      return item.type === filter;
    }

    if (module === 'jobs') {
      if (filter === 'remote') return item.remote;
      if (filter === 'salary') return Boolean(item.salary);
      if (filter === 'new') return item.posted && new Date(item.posted) > sevenDaysAgo;
      if (filter === 'fulltime') return (item.type || '').toLowerCase().includes('full');
      if (filter === 'contract') return (item.type || '').toLowerCase().includes('contract');
    }

    if (module === 'people') {
      if (filter === 'email') return Boolean(item.email);
      if (filter === 'phone') return Boolean(item.phone);
      if (filter === 'linkedin') return Boolean(item.linkedin);
      if (filter === 'clevel') return item.seniority === 'C-level';
    }

    return true;
  });

  renderCards(module);
}

function renderCards(module) {
  const store = window.leadScope.state[module];
  const prefix = window.leadScope.prefixes[module];
  const grid = document.getElementById(`${prefix}-grid`);
  const emptyState = document.getElementById(`${prefix}-empty`);
  const countEl = document.getElementById(`${prefix}-res-count`);

  grid.innerHTML = '';
  countEl.textContent = `— ${store.filtered.length} results`;

  if (!store.filtered.length) {
    emptyState.style.display = 'block';
    document.getElementById(`${prefix}-pgn`).innerHTML = '';
    return;
  }

  emptyState.style.display = 'none';

  const start = (store.page - 1) * window.leadScope.perPage;
  const pageItems = store.filtered.slice(start, start + window.leadScope.perPage);

  pageItems.forEach((item, index) => {
    let card;
    if (module === 'business') {
      card = buildBizCard(item);
    } else if (module === 'jobs') {
      card = buildJobCard(item);
    } else {
      card = buildPeopleCard(item);
    }

    card.style.animationDelay = `${index * 0.04}s`;
    grid.appendChild(card);
  });

  renderPgn(module);
}

function buildBizCard(item) {
  const el = document.createElement('div');
  el.className = 'blc';
  const phoneHref = safeTelUrl(item.phone);
  const websiteHref = safeExternalUrl(item.website);
  const mapsHref = safeExternalUrl(item.url);

  const typeClass = {
    export: 'b-exp',
    import: 'b-imp',
    manufacturer: 'b-mfg',
    trading: 'b-trd',
    wholesale: 'b-new',
    other: 'b-oth',
  };
  const typeLabel = {
    export: 'Exporter',
    import: 'Importer',
    manufacturer: 'Mfg',
    trading: 'Trading',
    wholesale: 'Wholesale',
    other: 'Business',
  };
  const badgeClass = typeClass[item.type] || 'b-oth';
  const badgeLabel = typeLabel[item.type] || 'Business';
  const stars = item.rating
    ? `${'★'.repeat(Math.round(item.rating))}${'☆'.repeat(5 - Math.round(item.rating))}`
    : '';

  el.innerHTML = `
    <div class="blc-main">
      <div class="blc-name">
        ${esc(item.name)}
        <span class="badge ${badgeClass}">${badgeLabel}</span>
        ${item.verified ? '<span class="badge b-new">✓ Verified</span>' : ''}
      </div>
      <div class="blc-meta">
        ${item.address ? `<span class="mi">Address ${esc(item.address)}</span>` : ''}
        ${item.phone && phoneHref ? `<span class="mi">Phone <a href="${phoneHref}">${esc(item.phone)}</a></span>` : '<span class="mi" style="opacity:.4">Phone unavailable</span>'}
        ${item.website && websiteHref ? `<span class="mi">Site <a href="${websiteHref}" target="_blank" rel="noopener noreferrer">${esc(item.website.replace(/^https?:\/\//, '').split('/')[0])}</a></span>` : ''}
        ${item.category ? `<span class="mi">Category ${esc(item.category)}</span>` : ''}
        ${item.hours ? `<span class="mi">Hours ${esc(item.hours)}</span>` : ''}
        ${mapsHref ? `<span class="mi"><a href="${mapsHref}" target="_blank" rel="noopener noreferrer" style="color:var(--blue)">Maps →</a></span>` : ''}
      </div>
    </div>
    <div class="blc-right">
      ${item.rating
        ? `
          <div class="rating-big">${item.rating.toFixed(1)}</div>
          <div class="stars-sm">${stars}</div>
          <div class="rev-ct">${item.reviews.toLocaleString()} reviews</div>
        `
        : '<div class="rev-ct" style="margin-top:8px">No rating</div>'}
    </div>
  `;

  return el;
}

function buildJobCard(item) {
  const el = document.createElement('div');
  el.className = 'jc';
  const applyHref = safeExternalUrl(item.url);

  const initials = (item.company || '?').slice(0, 2).toUpperCase();
  const sourceColors = {
    linkedin: '#0077b5',
    indeed: '#003a9b',
    glassdoor: '#0caa41',
    google_jobs: '#4285f4',
  };
  const sourceColor = sourceColors[item.source] || 'var(--blue)';
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const isNew = item.posted && new Date(item.posted) > sevenDaysAgo;

  el.innerHTML = `
    <div class="jc-logo" style="background:${sourceColor}22;color:${sourceColor}">${initials}</div>
    <div class="jc-main">
      <div class="jc-title">${esc(item.title)} ${isNew ? '<span class="badge b-new">NEW</span>' : ''}</div>
      <div class="jc-company">${esc(item.company || 'Unknown Company')}</div>
      <div class="jc-meta">
        ${item.location ? `<span>Location ${esc(item.location)}</span>` : ''}
        ${item.type ? `<span>Type ${esc(item.type)}</span>` : ''}
        ${item.remote ? '<span>Remote</span>' : item.workplaceType === 'hybrid' ? '<span>Hybrid</span>' : item.workplaceType === 'onsite' ? '<span>On-site</span>' : ''}
        ${item.posted ? `<span>Posted ${esc(item.posted)}</span>` : ''}
        <span style="color:${sourceColor};font-size:11px;font-family:'IBM Plex Mono',monospace">${esc(item.source || '')}</span>
      </div>
      ${item.description ? `<div style="font-size:12px;color:var(--text2);margin-top:4px;line-height:1.5">${esc(item.description)}...</div>` : ''}
      <div class="jc-tags">
        ${(item.skills || []).slice(0, 5).map((skill) => `<span class="jc-tag">${esc(skill)}</span>`).join('')}
      </div>
    </div>
    <div class="jc-right">
      ${item.salary ? `<div class="jc-salary">${esc(item.salary)}</div>` : ''}
      ${applyHref ? `<a href="${applyHref}" target="_blank" rel="noopener noreferrer" style="font-size:11px;color:var(--blue);text-decoration:none;font-family:'IBM Plex Mono',monospace">Apply →</a>` : ''}
    </div>
  `;

  return el;
}

function buildPeopleCard(item) {
  const el = document.createElement('div');
  el.className = 'pc';
  const emailHref = safeMailtoUrl(item.email);
  const phoneHref = safeTelUrl(item.phone);
  const linkedinHref = safeExternalUrl(item.linkedin);
  const profileHref = safeExternalUrl(item.profileUrl);

  const initials = (item.name || '?')
    .split(' ')
    .map((word) => word[0] || '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const seniorityBadge =
    {
      'C-level': '<span class="badge b-exp">C-Level</span>',
      director: '<span class="badge b-mfg">Director</span>',
      owner: '<span class="badge b-imp">Owner</span>',
      manager: '<span class="badge b-trd">Manager</span>',
    }[item.seniority] || '';

  el.innerHTML = `
    <div class="pc-avatar">${initials}</div>
    <div class="pc-main">
      <div class="pc-name">${esc(item.name)} ${seniorityBadge}</div>
      <div class="pc-title-role">${esc(item.title || '—')}</div>
      <div class="pc-meta">
        ${item.company ? `<span>Company ${esc(item.company)}</span>` : ''}
        ${item.location ? `<span>Location ${esc(item.location)}</span>` : ''}
        ${item.email && emailHref ? `<span>Email <a href="${emailHref}" style="color:var(--teal)">${esc(item.email)}</a></span>` : '<span style="opacity:.4">Email unavailable</span>'}
        ${item.phone && phoneHref ? `<span>Phone <a href="${phoneHref}" style="color:var(--teal)">${esc(item.phone)}</a></span>` : ''}
      </div>
      ${item.summary ? `<div style="font-size:12px;color:var(--text2);margin-top:4px;line-height:1.5">${esc(item.summary)}...</div>` : ''}
    </div>
    <div class="pc-right">
      <div class="pc-source">${esc(item.source || '')}</div>
      ${linkedinHref ? `<a href="${linkedinHref}" target="_blank" rel="noopener noreferrer" style="font-size:11px;color:#0077b5;font-family:'IBM Plex Mono',monospace;text-decoration:none">LinkedIn →</a>` : profileHref ? `<a href="${profileHref}" target="_blank" rel="noopener noreferrer" style="font-size:11px;color:var(--blue);font-family:'IBM Plex Mono',monospace;text-decoration:none">Open Result →</a>` : ''}
    </div>
  `;

  return el;
}

function renderPgn(module) {
  const store = window.leadScope.state[module];
  const prefix = window.leadScope.prefixes[module];
  const totalPages = Math.ceil(store.filtered.length / window.leadScope.perPage);
  const pagination = document.getElementById(`${prefix}-pgn`);

  pagination.innerHTML = '';
  if (totalPages <= 1) {
    return;
  }

  for (let page = 1; page <= totalPages; page += 1) {
    const button = document.createElement('button');
    button.className = `pgn-btn${page === store.page ? ' on' : ''}`;
    button.textContent = page;
    button.onclick = () => {
      store.page = page;
      renderCards(module);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    pagination.appendChild(button);
  }
}
