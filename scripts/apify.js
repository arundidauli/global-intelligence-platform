async function runApify(actorId, input, prefix) {
  const key = getKey();

  if (!key) {
    throw new Error('Please enter your Apify API key in the sidebar.');
  }

  if (typeof looksLikeApifyKey === 'function' && !looksLikeApifyKey(key)) {
    throw new Error('Apify API key format looks invalid. It should start with "apify_api_".');
  }

  addLog(prefix, `Starting actor: ${actorId}`, 'info');
  setProgress(prefix, 8, 'Launching Apify actor...');

  const runResponse = await fetch(`https://api.apify.com/v2/acts/${actorId}/runs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(input),
  });

  if (!runResponse.ok) {
    const errorData = await runResponse.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `HTTP ${runResponse.status} - Check your API key`);
  }

  const runData = await runResponse.json();
  const runId = runData.data.id;
  addLog(prefix, `Run ID: ${runId}`, 'ok');

  return pollRun(key, runId, prefix);
}

async function pollRun(key, runId, prefix) {
  for (let attempt = 0; attempt < 72; attempt += 1) {
    await sleep(5000);
    const progress = Math.min(12 + Math.floor((attempt / 72) * 70), 82);
    setProgress(prefix, progress, `Scraping... (${(attempt + 1) * 5}s elapsed)`);

    const response = await fetch(`https://api.apify.com/v2/actor-runs/${runId}`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    const data = await response.json();
    const status = data.data.status;
    const itemCount = data.data.stats?.itemCount || 0;

    if (itemCount > 0) {
      addLog(prefix, `Found ${itemCount} records so far...`, 'info');
    }

    if (status === 'SUCCEEDED') {
      addLog(prefix, 'Run completed!', 'ok');
      setProgress(prefix, 87, 'Fetching results...');
      return fetchDataset(key, runId);
    }

    if (['FAILED', 'ABORTED', 'TIMED-OUT'].includes(status)) {
      throw new Error(`Actor run ${status}. Check Apify console for details.`);
    }
  }

  throw new Error('Timed out (6 min). Run may still complete in your Apify account.');
}

async function fetchDataset(key, runId) {
  const response = await fetch(
    `https://api.apify.com/v2/actor-runs/${runId}/dataset/items?format=json&limit=1000`,
    {
      headers: { Authorization: `Bearer ${key}` },
    }
  );

  return response.json();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
