const LOCATION_ALIASES = {
  countries: {
    usa: 'United States',
    us: 'United States',
    uk: 'United Kingdom',
    uae: 'United Arab Emirates',
  },
  states: {
    up: 'Uttar Pradesh',
    mh: 'Maharashtra',
    tn: 'Tamil Nadu',
    ka: 'Karnataka',
    dl: 'Delhi',
    nsw: 'New South Wales',
    bc: 'British Columbia',
    ca: 'California',
    tx: 'Texas',
    ny: 'New York',
  },
  cities: {
    blr: 'Bengaluru',
    bglr: 'Bengaluru',
    bom: 'Mumbai',
    'delhi ncr': 'Delhi',
    nyc: 'New York',
    la: 'Los Angeles',
    sf: 'San Francisco',
    hyd: 'Hyderabad',
  },
};

const JOB_COUNTRY_CODES = {
  India: 'IN',
  'United States': 'US',
  'United Kingdom': 'GB',
  UAE: 'AE',
  'United Arab Emirates': 'AE',
  'Saudi Arabia': 'SA',
  Canada: 'CA',
  Australia: 'AU',
  Germany: 'DE',
  Singapore: 'SG',
  Remote: 'US',
};

function normalizeLocationToken(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function titleCaseLocation(value) {
  return value
    .split(' ')
    .map((part) => {
      if (!part) return part;
      if (part.length <= 3 && part === part.toUpperCase()) return part;
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    })
    .join(' ');
}

function expandLocationAlias(value, type) {
  const normalized = normalizeLocationToken(value);
  if (!normalized) {
    return '';
  }

  const aliasMap = LOCATION_ALIASES[type] || {};
  const aliasHit = aliasMap[normalized.toLowerCase()];
  return aliasHit || titleCaseLocation(normalized);
}

function buildBusinessLocationProfile() {
  return buildLocationProfile('b');
}

function buildLocationProfile(prefix) {
  return {
    country: expandLocationAlias(document.getElementById(`${prefix}-country`).value, 'countries'),
    region: expandLocationAlias(document.getElementById(`${prefix}-state`).value, 'states'),
    city: expandLocationAlias(document.getElementById(`${prefix}-city`).value, 'cities'),
    area: titleCaseLocation(normalizeLocationToken(document.getElementById(`${prefix}-area`).value)),
    mode: document.getElementById(`${prefix}-location-mode`).value,
  };
}

function getJobCountryCode(country) {
  return JOB_COUNTRY_CODES[country] || 'US';
}

function normalizePeopleSearchResults(items, sourceLabel, linkedinOnly = true) {
  const rows = [];

  for (const item of items) {
    if (item?.organicResults && Array.isArray(item.organicResults)) {
      rows.push(
        ...item.organicResults.map((result) => ({
          title: result.title || '',
          link: result.url || result.link || '',
          snippet: result.description || result.snippet || '',
          source: sourceLabel,
        }))
      );
      continue;
    }

    rows.push({
      title: item.title || item.name || '',
      link: item.url || item.link || item.profileUrl || '',
      snippet: item.description || item.snippet || item.text || '',
      source: sourceLabel,
    });
  }

  return rows
    .filter((row) => row.link || row.title)
    .filter((row) =>
      linkedinOnly
        ? /linkedin\.com\/(in|pub)\//i.test(row.link) || /linkedin/i.test(row.title)
        : true
    )
    .map((row) => {
      const normalizedTitle = row.title.replace(/\s*\|\s*LinkedIn.*$/i, '').trim();
      const [namePart, rolePart] = normalizedTitle.split(/\s+-\s+/);
      const isLinkedInProfile = /linkedin\.com\/(in|pub)\//i.test(row.link);
      return {
        name: namePart || normalizedTitle || 'Unknown',
        title: rolePart || row.snippet || '',
        company: '',
        location: '',
        email: '',
        phone: '',
        linkedin: isLinkedInProfile ? row.link : '',
        profileUrl: row.link,
        source: row.source,
        summary: row.snippet?.slice(0, 150) || '',
        avatar: '',
        seniority: detectSeniority(`${rolePart || ''} ${row.snippet || ''}`),
      };
    });
}

function detectJobWorkplaceType(item) {
  const workplace = String(item.workplaceType || item.workType || item.workArrangement || '').toLowerCase();
  const title = String(item.title || item.positionName || item.jobTitle || '').toLowerCase();
  const description = String(item.description || '').toLowerCase();
  const haystack = `${title} ${description} ${workplace}`;

  if (/hybrid/.test(haystack)) {
    return 'hybrid';
  }

  if (/remote|work from home|wfh/.test(haystack)) {
    return 'remote';
  }

  if (/on[- ]?site|onsite|in[- ]office|office-based/.test(haystack)) {
    return 'onsite';
  }

  return 'unknown';
}

function normalizeJobTypeLabel(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[\s_-]+/g, ' ')
    .trim();
}

function buildBusinessLocationVariants() {
  return buildLocationVariantsFromProfile(buildBusinessLocationProfile());
}

function buildLocationVariantsFromProfile(profile) {
  const { country, region, city, area, mode } = profile;
  const exact = [[area, city, region, country].filter(Boolean).join(', ')];
  const smart = [
    [area, city, region, country].filter(Boolean).join(', '),
    [city, region, country].filter(Boolean).join(', '),
    [city, country].filter(Boolean).join(', '),
    [region, country].filter(Boolean).join(', '),
    [country].filter(Boolean).join(', '),
  ];
  const broad = [
    [area, city, region, country].filter(Boolean).join(', '),
    [city, region, country].filter(Boolean).join(', '),
    [area, city, country].filter(Boolean).join(', '),
    [city, country].filter(Boolean).join(', '),
    [region, country].filter(Boolean).join(', '),
    [city].filter(Boolean).join(', '),
    [region].filter(Boolean).join(', '),
    [country].filter(Boolean).join(', '),
  ];

  const variantMap = {
    exact,
    smart,
    broad,
  };

  return variantMap[mode]
    .filter(Boolean)
    .map((value) => value.replace(/\s+,/g, ','))
    .filter((value, index, arr) => arr.indexOf(value) === index);
}

function buildBusinessQueries() {
  const locationVariants = buildBusinessLocationVariants();

  const checkedTypes = [...document.querySelectorAll('#b-types .check-pill.checked input')].map(
    (input) => input.value
  );
  const industries = getTagsFromWrap('b-industries-wrap');
  const queries = [];

  for (const location of locationVariants.length ? locationVariants : ['']) {
    for (const type of checkedTypes) {
      if (industries.length === 0 || industries[0] === 'All Industries') {
        queries.push(`${type} ${location}`.trim());
        continue;
      }

      for (const industry of industries.slice(0, 3)) {
        if (industry !== 'All Industries') {
          queries.push(`${industry} ${type} ${location}`.trim());
        }
      }
    }
  }

  return [...new Set(queries)].slice(0, 12);
}

async function verifyBusinessLocation() {
  return verifyLocation('b');
}

async function verifyLocation(prefix) {
  const profile = buildLocationProfile(prefix);
  const query = [profile.area, profile.city, profile.region, profile.country].filter(Boolean).join(', ');

  if (!query) {
    throw new Error('Enter at least a city, state, or country before verifying the location.');
  }

  const button = document.getElementById(`${prefix}-verify-location-btn`);
  const verifiedEl = document.getElementById(`${prefix}-loc-verified`);
  const warningEl = document.getElementById(`${prefix}-loc-warning`);
  const originalLabel = button.textContent;

  button.disabled = true;
  button.textContent = 'Verifying...';

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&addressdetails=1&q=${encodeURIComponent(query)}`,
      {
        headers: {
          Accept: 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Location verification failed with HTTP ${response.status}.`);
    }

    const results = await response.json();
    if (!Array.isArray(results) || !results.length) {
      throw new Error('No matching location found. Try a broader or corrected spelling.');
    }

    const bestMatch = results[0];
    const label = bestMatch.display_name || query;
    verifiedEl.textContent = `Verified match: ${label}`;
    verifiedEl.style.display = 'block';

    if (warningEl && warningEl.textContent.includes('searched as')) {
      warningEl.style.display = 'block';
    }

    addLog(prefix, `Verified location: ${label}`, 'ok');
    return bestMatch;
  } catch (error) {
    logSupportEntry(`${prefix.toUpperCase()} location verification`, error);
    throw error;
  } finally {
    button.disabled = false;
    button.textContent = originalLabel;
  }
}

async function runBusinessSearch() {
  const queries = buildBusinessQueries();
  const profile = buildBusinessLocationProfile();

  if (!queries.length) {
    showError('b', 'Select at least one company type or industry before searching.');
    return;
  }

  const maxPerQuery = Math.ceil(parseInt(document.getElementById('b-max').value, 10) / queries.length);
  const language = document.getElementById('b-lang').value;

  document.getElementById('b-err').style.display = 'none';
  document.getElementById('b-run-btn').disabled = true;
  document.getElementById('b-prog').style.display = 'block';
  document.getElementById('b-results').style.display = 'none';
  document.getElementById('b-prog-log').innerHTML = '';

  addLog(
    'b',
    `Normalized location: ${[profile.area, profile.city, profile.region, profile.country].filter(Boolean).join(', ') || 'Worldwide'}`,
    'info'
  );
  addLog('b', `Location strategy: ${document.getElementById('b-location-mode').value}`, 'info');
  addLog('b', `Queries: ${queries.join(' | ')}`, 'info');

  try {
    const items = await runApify(
      'compass~crawler-google-places',
      {
        startUrls: queries.map((query) => ({
          url: `https://www.google.com/maps/search/${encodeURIComponent(query)}`,
        })),
        maxCrawledPlacesPerSearch: maxPerQuery,
        language,
        maxImages: 0,
        scrapeReviews: false,
        scrapePhotos: false,
        exportPlaceUrls: false,
      },
      'b'
    );

    addLog('b', `Processing ${items.length} raw records...`, 'ok');
    setProgress('b', 95, 'Processing data...');

    const minRating = parseFloat(document.getElementById('b-rating-range').value);
    window.leadScope.state.business.all = items
      .filter((item) => !minRating || item.totalScore >= minRating)
      .map((item) => ({
        name: item.title || 'Unknown',
        address: item.address || item.street || '',
        city: item.city || '',
        state: item.state || '',
        country: item.countryCode || '',
        phone: item.phone || '',
        website: item.website || '',
        category: item.categoryName || item.categories?.[0] || '',
        rating: item.totalScore || null,
        reviews: item.reviewsCount || 0,
        url: item.url || '',
        type: detectBizType(item.title, item.categoryName, item.categories),
        hours: item.openingHours?.[0]?.hours || '',
        verified: item.claimThisBusiness === false,
        placeId: item.placeId || '',
      }));

    setProgress('b', 100, 'Done!');
    addLog('b', `✓ ${window.leadScope.state.business.all.length} leads ready!`, 'ok');

    await sleep(600);
    document.getElementById('b-prog').style.display = 'none';
    document.getElementById('b-run-btn').disabled = false;
    updateBizStats();
    applyFilter('business');
    document.getElementById('b-results').style.display = 'block';
    document.getElementById('nb-biz').textContent = window.leadScope.state.business.all.length;
  } catch (error) {
    logSupportEntry('Business search', error);
    showError('b', error.message);
    document.getElementById('b-run-btn').disabled = false;
    document.getElementById('b-prog').style.display = 'none';
  }
}

function detectBizType(name = '', category = '', categories = []) {
  const haystack = [name, category, ...(categories || [])].join(' ').toLowerCase();
  if (haystack.includes('export')) return 'export';
  if (haystack.includes('import')) return 'import';
  if (haystack.includes('manufactur')) return 'manufacturer';
  if (haystack.includes('trading') || haystack.includes('trader')) return 'trading';
  if (haystack.includes('wholesale')) return 'wholesale';
  return 'other';
}

function updateBizStats() {
  const records = window.leadScope.state.business.all;
  document.getElementById('bs-total').textContent = records.length;
  document.getElementById('bs-phone').textContent = records.filter((item) => item.phone).length;
  document.getElementById('bs-web').textContent = records.filter((item) => item.website).length;

  const rated = records.filter((item) => item.rating);
  document.getElementById('bs-rating').textContent = rated.length
    ? `${(rated.reduce((sum, item) => sum + item.rating, 0) / rated.length).toFixed(1)}⭐`
    : '—';
}

async function runJobSearch() {
  const title = document.getElementById('j-title').value.trim();
  const country = document.getElementById('j-country').value;
  const city = document.getElementById('j-city').value.trim();
  const source = document.getElementById('j-source').value;
  const workType = document.getElementById('j-work-type').value;
  const experience = document.getElementById('j-exp').value;
  const jobType = document.getElementById('j-type').value;
  const maxResults = parseInt(document.getElementById('j-max').value, 10);
  const postedWithin = parseInt(document.getElementById('j-posted').value, 10);
  const skills = getTagsFromWrap('j-skills-wrap');

  if (!title && skills.length === 0) {
    showError('j', 'Enter a job title or at least one skill before searching.');
    return;
  }

  const locationProfile = buildLocationProfile('j');
  const locationVariants = buildLocationVariantsFromProfile(locationProfile);
  const location = [locationProfile.area, locationProfile.city, locationProfile.region, locationProfile.country]
    .filter(Boolean)
    .join(', ');
  const experienceLabelMap = {
    entry: 'entry level',
    mid: 'mid level',
    senior: 'senior',
    lead: 'lead',
  };
  const jobTypeLabelMap = {
    fulltime: 'full time',
    parttime: 'part time',
    contract: 'contract',
    internship: 'internship',
    freelance: 'freelance',
  };
  const keywordParts = [title, ...skills];
  if (experienceLabelMap[experience]) {
    keywordParts.push(experienceLabelMap[experience]);
  }
  if (jobTypeLabelMap[jobType]) {
    keywordParts.push(jobTypeLabelMap[jobType]);
  }
  if (workType === 'remote') {
    keywordParts.push('remote');
  }
  if (workType === 'hybrid') {
    keywordParts.push('hybrid');
  }
  if (workType === 'onsite') {
    keywordParts.push('on-site');
  }

  const keywords = keywordParts.join(' ');
  const actorMap = {
    linkedin: 'curious_coder~linkedin-jobs-scraper',
    indeed: 'misceres~indeed-scraper',
    glassdoor: 'bebity~glassdoor-jobs-scraper',
    google_jobs: 'misceres~google-jobs-scraper',
    all: 'misceres~google-jobs-scraper',
    naukri: 'misceres~google-jobs-scraper',
  };
  const actor = actorMap[source] || 'misceres~google-jobs-scraper';
  const startUrls = (locationVariants.length ? locationVariants : [''])
    .map((variant) => `https://www.google.com/search?q=${encodeURIComponent(`${keywords} jobs ${variant}`.trim())}&ibp=htl;jobs`)
    .slice(0, 5)
    .map((url) => ({ url }));
  const countryCode = getJobCountryCode(locationProfile.country || country);
  const actorInput = {
    startUrls,
    maxItems: maxResults,
    country: countryCode,
    position: title,
    location,
  };

  if (Number.isFinite(postedWithin)) {
    actorInput.maxAge = postedWithin;
  }

  document.getElementById('j-err').style.display = 'none';
  document.getElementById('j-run-btn').disabled = true;
  document.getElementById('j-prog').style.display = 'block';
  document.getElementById('j-results').style.display = 'none';
  document.getElementById('j-prog-log').innerHTML = '';

  addLog('j', `Searching: "${keywords}" in ${location || 'worldwide'}`, 'info');
  addLog('j', `Normalized location: ${location || 'Worldwide'}`, 'info');
  addLog('j', `Actor country code: ${countryCode}`, 'info');

  try {
    const items = await runApify(actor, actorInput, 'j');

    addLog('j', `Processing ${items.length} jobs...`, 'ok');
    setProgress('j', 95, 'Processing...');

    const normalizedJobType = jobType.toLowerCase();
    window.leadScope.state.jobs.all = items
      .map((item) => {
        const workplaceType = detectJobWorkplaceType(item);
        return {
          title: item.title || item.positionName || item.jobTitle || 'Unknown',
          company: item.company || item.companyName || '',
          location: item.location || item.city || '',
          type: item.employmentType || item.jobType || '',
          workplaceType,
          remote: workplaceType === 'remote',
          salary: item.salary || item.salaryRange || '',
          posted: item.postedAt || item.datePosted || '',
          url: item.url || item.jobUrl || item.externalApplyUrl || '',
          source: item.source || source,
          description: item.description?.slice(0, 200) || '',
          skills: item.skills || [],
          logo: '',
        };
      })
      .filter((item) => {
        if (workType !== 'all' && item.workplaceType !== workType) {
          return false;
        }

        if (normalizedJobType === 'all') {
          return true;
        }

        const normalizedType = normalizeJobTypeLabel(item.type);
        const expectedType = normalizeJobTypeLabel(jobTypeLabelMap[normalizedJobType] || normalizedJobType);

        return normalizedType.includes(expectedType);
      });

    setProgress('j', 100, 'Done!');
    addLog('j', `✓ ${window.leadScope.state.jobs.all.length} jobs ready!`, 'ok');

    await sleep(600);
    document.getElementById('j-prog').style.display = 'none';
    document.getElementById('j-run-btn').disabled = false;
    updateJobStats();
    applyFilter('jobs');
    document.getElementById('j-results').style.display = 'block';
    document.getElementById('nb-jobs').textContent = window.leadScope.state.jobs.all.length;
  } catch (error) {
    logSupportEntry('Job search', error);
    showError('j', error.message);
    document.getElementById('j-run-btn').disabled = false;
    document.getElementById('j-prog').style.display = 'none';
  }
}

function updateJobStats() {
  const records = window.leadScope.state.jobs.all;
  document.getElementById('js-total').textContent = records.length;
  document.getElementById('js-remote').textContent = records.filter((item) => item.remote).length;
  document.getElementById('js-salary').textContent = records.filter((item) => item.salary).length;

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  document.getElementById('js-new').textContent = records.filter((item) => {
    if (!item.posted) {
      return false;
    }

    return new Date(item.posted) > sevenDaysAgo;
  }).length;
}

async function runPeopleSearch() {
  const name = document.getElementById('p-name').value.trim();
  const role = document.getElementById('p-role').value.trim();
  const company = document.getElementById('p-company').value.trim();
  const country = document.getElementById('p-country').value;
  const region = document.getElementById('p-state').value.trim();
  const city = document.getElementById('p-city').value.trim();
  const industry = document.getElementById('p-industry').value.trim();
  const seniority = document.getElementById('p-seniority').value;
  const source = document.getElementById('p-source').value;
  const maxResults = parseInt(document.getElementById('p-max').value, 10);
  const locationProfile = buildLocationProfile('p');
  const locationVariants = buildLocationVariantsFromProfile(locationProfile);
  const location = [locationProfile.area, locationProfile.city, locationProfile.region, locationProfile.country]
    .filter(Boolean)
    .join(', ');

  if (!role && !name && !company) {
    showError('p', 'Please enter at least a name, role, or company to search.');
    return;
  }

  document.getElementById('p-err').style.display = 'none';
  document.getElementById('p-run-btn').disabled = true;
  document.getElementById('p-prog').style.display = 'block';
  document.getElementById('p-results').style.display = 'none';
  document.getElementById('p-prog-log').innerHTML = '';

  const searchBase = [name, role, company, industry, seniority !== 'all' ? seniority : '']
    .filter(Boolean)
    .join(' ');
  const searchQuery = [searchBase, location].filter(Boolean).join(' ');
  addLog('p', `Search: "${searchQuery}"`, 'info');
  addLog('p', `Normalized location: ${location || 'Worldwide'}`, 'info');

  try {
    const actorId = 'apify/google-search-scraper';
    const countryCode = getJobCountryCode(locationProfile.country || country);
    const queryVariants = [];
    const effectiveVariants = (locationVariants.length ? locationVariants : ['']).slice(0, 5);

    if (source === 'linkedin' || source === 'both') {
      effectiveVariants.forEach((variant) => {
        queryVariants.push(
          [searchBase, variant, 'site:linkedin.com/in']
            .filter(Boolean)
            .join(' ')
        );
      });

      if (source === 'both') {
        queryVariants.push(
          [searchBase, location, 'site:linkedin.com/pub']
            .filter(Boolean)
            .join(' ')
        );
      }
    }

    if (source === 'google' || source === 'both') {
      effectiveVariants.forEach((variant) => {
        queryVariants.push(
          [searchBase, variant]
            .filter(Boolean)
            .join(' ')
        );
      });
    }

    const items = await runApify(
      actorId,
      {
        queries: queryVariants,
        maxPagesPerQuery: Math.min(Math.max(Math.ceil(maxResults / 10), 1), 5),
        resultsPerPage: Math.min(Math.max(maxResults, 10), 100),
        countryCode: countryCode.toLowerCase(),
        languageCode: 'en',
      },
      'p'
    );
    addLog('p', `Processing ${items.length} search results...`, 'ok');
    setProgress('p', 95, 'Processing...');

    const normalizedPeople = [];

    if (source === 'linkedin') {
      normalizedPeople.push(...normalizePeopleSearchResults(items, 'linkedin', true));
    } else if (source === 'google') {
      normalizedPeople.push(...normalizePeopleSearchResults(items, 'google', false));
    } else {
      normalizedPeople.push(...normalizePeopleSearchResults(items, 'linkedin', true));
      normalizedPeople.push(...normalizePeopleSearchResults(items, 'google', false));
    }

    const seen = new Set();
    window.leadScope.state.people.all = normalizedPeople
      .filter((person) => {
        const dedupeKey = String(person.linkedin || `${person.name}|${person.title}|${person.location}`)
          .toLowerCase()
          .trim();
        if (!dedupeKey || seen.has(dedupeKey)) {
          return false;
        }
        seen.add(dedupeKey);
        return true;
      })
      .slice(0, maxResults);

    setProgress('p', 100, 'Done!');
    addLog('p', `✓ ${window.leadScope.state.people.all.length} people found!`, 'ok');

    await sleep(600);
    document.getElementById('p-prog').style.display = 'none';
    document.getElementById('p-run-btn').disabled = false;
    updatePeopleStats();
    applyFilter('people');
    document.getElementById('p-results').style.display = 'block';
    document.getElementById('nb-people').textContent = window.leadScope.state.people.all.length;
  } catch (error) {
    logSupportEntry('People search', error);
    showError('p', error.message);
    document.getElementById('p-run-btn').disabled = false;
    document.getElementById('p-prog').style.display = 'none';
  }
}

function detectSeniority(title) {
  const normalized = title.toLowerCase();
  if (
    normalized.includes('ceo') ||
    normalized.includes('cto') ||
    normalized.includes('coo') ||
    normalized.includes('cfo') ||
    normalized.includes('founder') ||
    normalized.includes('president')
  ) {
    return 'C-level';
  }

  if (normalized.includes('director') || normalized.includes('vp') || normalized.includes('vice president')) {
    return 'director';
  }

  if (normalized.includes('manager') || normalized.includes('head of')) {
    return 'manager';
  }

  if (normalized.includes('owner') || normalized.includes('proprietor')) {
    return 'owner';
  }

  return 'professional';
}

function updatePeopleStats() {
  const records = window.leadScope.state.people.all;
  document.getElementById('pf-total').textContent = records.length;
  document.getElementById('pf-email').textContent = records.filter((item) => item.email).length;
  document.getElementById('pf-phone').textContent = records.filter((item) => item.phone).length;
  document.getElementById('pf-linkedin').textContent = records.filter((item) => item.linkedin).length;
}
