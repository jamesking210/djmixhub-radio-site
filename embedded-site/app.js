const DEFAULT_CONFIG = {
  siteUrl: 'https://djmixhub.com',
  siteName: 'DJMixHub',
  siteTagline: 'Open Source Energy. Community Sourced Mixes.',
  radioBaseUrl: 'https://radio.djmixhub.com',
  stationShortcode: 'djmixhub',
  stationName: 'DJMixHub',
  nowPlayingUrl: 'https://radio.djmixhub.com/api/nowplaying/djmixhub',
  playerUrl: 'https://radio.djmixhub.com/public/djmixhub',
  mainRepoUrl: 'https://github.com/jamesking210/djmixhub-radio-site',
  azuracastRepoUrl: 'https://github.com/AzuraCast/AzuraCast',
  githubUrl: 'https://github.com/jamesking210',
  contactEmail: 'djmixhubradio@gmail.com',
  termsKey: 'djmixhub_embed_terms_accepted_v1',
  fallbackArtwork: 'assets/logo.jpg',
  pollIntervalMs: 15000
};

function normalizeString(value, fallback = '') {
  if (typeof value !== 'string') {
    return fallback;
  }

  const trimmed = value.trim();
  return trimmed || fallback;
}

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, '');
}

function buildUrl(baseUrl, path) {
  const normalizedBaseUrl = trimTrailingSlash(normalizeString(baseUrl));
  return normalizedBaseUrl ? `${normalizedBaseUrl}${path}` : '';
}

function buildConfig() {
  const runtimeConfig = window.DJMIXHUB_EMBED_CONFIG || {};
  const radioBaseUrl = trimTrailingSlash(normalizeString(runtimeConfig.radioBaseUrl, DEFAULT_CONFIG.radioBaseUrl));
  const stationShortcode = normalizeString(runtimeConfig.stationShortcode, DEFAULT_CONFIG.stationShortcode);
  const siteName = normalizeString(runtimeConfig.siteName, DEFAULT_CONFIG.siteName);
  const stationName = normalizeString(runtimeConfig.stationName, siteName);

  return {
    ...DEFAULT_CONFIG,
    siteName,
    siteTagline: normalizeString(runtimeConfig.siteTagline, DEFAULT_CONFIG.siteTagline),
    siteUrl: normalizeString(runtimeConfig.siteUrl, DEFAULT_CONFIG.siteUrl),
    radioBaseUrl,
    stationShortcode,
    stationName,
    nowPlayingUrl: normalizeString(runtimeConfig.nowPlayingUrl) || buildUrl(radioBaseUrl, `/api/nowplaying/${stationShortcode}`),
    playerUrl: normalizeString(runtimeConfig.playerUrl) || buildUrl(radioBaseUrl, `/public/${stationShortcode}`),
    mainRepoUrl: normalizeString(runtimeConfig.mainRepoUrl, DEFAULT_CONFIG.mainRepoUrl),
    azuracastRepoUrl: normalizeString(runtimeConfig.azuracastRepoUrl, DEFAULT_CONFIG.azuracastRepoUrl),
    githubUrl: normalizeString(runtimeConfig.githubUrl, DEFAULT_CONFIG.githubUrl),
    contactEmail: normalizeString(runtimeConfig.contactEmail, DEFAULT_CONFIG.contactEmail)
  };
}

const CONFIG = buildConfig();
const state = {
  acceptedTerms: false
};

const elements = {
  stationFrame: document.getElementById('stationFrame'),
  acceptTermsButton: document.getElementById('acceptTermsButton'),
  termsGate: document.getElementById('termsGate'),
  heroPlayerLink: document.getElementById('heroPlayerLink'),
  stationName: document.querySelectorAll('[data-config-text="siteName"]'),
  stationTagline: document.querySelectorAll('[data-config-text="siteTagline"]'),
  email: document.querySelectorAll('[data-config-email]'),
  mainRepoLink: document.querySelector('[data-config-href="mainRepoUrl"]'),
  azuracastRepoLink: document.querySelector('[data-config-href="azuracastRepoUrl"]'),
  githubLink: document.querySelector('[data-config-href="githubUrl"]'),
  radioBaseLink: document.querySelector('[data-config-href="radioBaseUrl"]'),
  onAirArt: document.getElementById('onAirArt'),
  onAirTitle: document.getElementById('onAirTitle'),
  onAirArtist: document.getElementById('onAirArtist'),
  headerUniqueListeners: document.getElementById('headerUniqueListeners'),
  listenerCount: document.getElementById('listenerCount'),
  statusBadge: document.getElementById('statusBadge'),
  progress: document.getElementById('trackProgress'),
  progressElapsed: document.getElementById('trackElapsed'),
  progressDuration: document.getElementById('trackDuration'),
  nextTitle: document.getElementById('nextTitle'),
  nextMeta: document.getElementById('nextMeta'),
  historyTitle: document.getElementById('historyTitle'),
  historyMeta: document.getElementById('historyMeta'),
  djGrid: document.getElementById('djGrid')
};

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatDuration(totalSeconds) {
  const normalizedSeconds = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const hours = Math.floor(normalizedSeconds / 3600);
  const minutes = Math.floor((normalizedSeconds % 3600) / 60);
  const seconds = normalizedSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function normalizePossibleUrl(value) {
  if (!value || typeof value !== 'string') {
    return '';
  }

  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }

  if (value.startsWith('//')) {
    return `https:${value}`;
  }

  if (value.startsWith('/')) {
    return `${CONFIG.radioBaseUrl}${value}`;
  }

  return value;
}

function applyConfig() {
  document.title = `${CONFIG.siteName} | Embedded Listener Site`;

  elements.stationName.forEach((node) => {
    node.textContent = CONFIG.siteName;
  });

  elements.stationTagline.forEach((node) => {
    node.textContent = CONFIG.siteTagline;
  });

  elements.email.forEach((node) => {
    node.textContent = CONFIG.contactEmail;
    node.href = `mailto:${CONFIG.contactEmail}`;
  });

  [
    [elements.mainRepoLink, CONFIG.mainRepoUrl],
    [elements.azuracastRepoLink, CONFIG.azuracastRepoUrl],
    [elements.githubLink, CONFIG.githubUrl],
    [elements.radioBaseLink, CONFIG.radioBaseUrl]
  ].forEach(([node, href]) => {
    if (node && href) {
      node.href = href;
      node.hidden = false;
    }
  });

  if (elements.heroPlayerLink) {
    elements.heroPlayerLink.href = CONFIG.playerUrl;
  }
}

function showTermsGate() {
  if (!elements.termsGate) {
    return;
  }

  elements.termsGate.classList.add('is-visible');
  elements.termsGate.setAttribute('aria-hidden', 'false');
}

function hideTermsGate() {
  if (!elements.termsGate) {
    return;
  }

  elements.termsGate.classList.remove('is-visible');
  elements.termsGate.setAttribute('aria-hidden', 'true');
}

function loadEmbeddedPlayer() {
  if (!elements.stationFrame || elements.stationFrame.src) {
    return;
  }

  elements.stationFrame.src = CONFIG.playerUrl;
  elements.stationFrame.title = `${CONFIG.siteName} embedded player`;
}

function applyTermsState() {
  if (state.acceptedTerms) {
    hideTermsGate();
    loadEmbeddedPlayer();
  } else {
    showTermsGate();
  }
}

function readTermsState() {
  state.acceptedTerms = localStorage.getItem(CONFIG.termsKey) === 'true';
  applyTermsState();
}

function acceptTerms() {
  localStorage.setItem(CONFIG.termsKey, 'true');
  state.acceptedTerms = true;
  applyTermsState();
}

function renderDjs() {
  const djs = Array.isArray(window.DJMIXHUB_EMBED_DJS) ? window.DJMIXHUB_EMBED_DJS : [];

  if (!elements.djGrid || !djs.length) {
    return;
  }

  elements.djGrid.innerHTML = djs.map((dj) => {
    const link = dj.linkUrl
      ? `<a href="${escapeHtml(dj.linkUrl)}" target="_blank" rel="noreferrer">${escapeHtml(dj.linkLabel || dj.linkUrl)}</a>`
      : `<a href="mailto:${CONFIG.contactEmail}?subject=${encodeURIComponent(dj.emailSubject || 'DJMixHub DJ Submission')}">${escapeHtml(dj.linkLabel || CONFIG.contactEmail)}</a>`;

    return `
      <article class="card dj-card">
        <div class="dj-card__media">
          <img
            src="${escapeHtml(dj.image || CONFIG.fallbackArtwork)}"
            alt="${escapeHtml(dj.name || CONFIG.siteName)}"
            onerror="this.onerror=null;this.src='${CONFIG.fallbackArtwork}';"
          />
        </div>
        <span class="dj-card__tag">${escapeHtml(dj.tag || 'DJ')}</span>
        <h3>${escapeHtml(dj.name || 'DJ')}</h3>
        <p>${escapeHtml(dj.bio || '')}</p>
        ${link}
      </article>
    `;
  }).join('');
}

function updateProgress(elapsedSeconds, durationSeconds) {
  const duration = Math.max(0, Math.floor(Number(durationSeconds) || 0));
  const elapsed = Math.min(Math.max(0, Math.floor(Number(elapsedSeconds) || 0)), duration || Number(elapsedSeconds) || 0);
  const max = duration > 0 ? duration : 1;

  if (elements.progress) {
    elements.progress.max = max;
    elements.progress.value = Math.min(elapsed, max);
  }

  if (elements.progressElapsed) {
    elements.progressElapsed.textContent = formatDuration(elapsed);
  }

  if (elements.progressDuration) {
    elements.progressDuration.textContent = formatDuration(duration);
  }
}

function getStatusText(nowPlaying) {
  const isLive = Boolean(nowPlaying?.live?.is_live);
  const streamerName = nowPlaying?.live?.streamer_name?.trim();

  if (isLive) {
    return streamerName ? `${streamerName} live` : 'Live DJ';
  }

  if (nowPlaying?.is_online) {
    return `${CONFIG.stationName} on air`;
  }

  return 'Offline';
}

function updateNowPlaying(nowPlaying) {
  const song = nowPlaying?.now_playing?.song ?? {};
  const nextSong = nowPlaying?.playing_next?.song ?? {};
  const historySong = Array.isArray(nowPlaying?.song_history) ? nowPlaying.song_history[0]?.song ?? {} : {};
  const totalListeners = nowPlaying?.listeners?.total ?? nowPlaying?.listeners?.current ?? 0;
  const uniqueListeners = nowPlaying?.listeners?.unique ?? totalListeners;
  const statusText = getStatusText(nowPlaying);
  const art = normalizePossibleUrl(song.art || nowPlaying?.live?.art) || CONFIG.fallbackArtwork;

  if (elements.onAirArt) {
    elements.onAirArt.src = art;
    elements.onAirArt.alt = `${song.title || CONFIG.stationName} artwork`;
  }

  if (elements.onAirTitle) {
    elements.onAirTitle.textContent = song.title || `${CONFIG.stationName} radio`;
  }

  if (elements.onAirArtist) {
    elements.onAirArtist.textContent = song.artist || 'Always-on mix radio';
  }

  if (elements.listenerCount) {
    elements.listenerCount.textContent = totalListeners;
  }

  if (elements.headerUniqueListeners) {
    elements.headerUniqueListeners.textContent = uniqueListeners;
  }

  if (elements.statusBadge) {
    elements.statusBadge.textContent = statusText;
  }

  updateProgress(nowPlaying?.now_playing?.elapsed ?? 0, nowPlaying?.now_playing?.duration ?? 0);

  if (elements.nextTitle) {
    elements.nextTitle.textContent = nextSong.title || 'Station rotation';
  }

  if (elements.nextMeta) {
    elements.nextMeta.textContent = nextSong.artist || 'More mixes are queued up next.';
  }

  if (elements.historyTitle) {
    elements.historyTitle.textContent = historySong.title || 'Recent set history';
  }

  if (elements.historyMeta) {
    elements.historyMeta.textContent = historySong.artist || 'Recent plays will show here when available.';
  }
}

async function fetchNowPlaying() {
  try {
    const response = await fetch(`${CONFIG.nowPlayingUrl}?t=${Date.now()}`, { cache: 'no-store' });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const nowPlaying = await response.json();
    updateNowPlaying(nowPlaying);
  } catch (error) {
    console.error('Could not load station data:', error);
  } finally {
    window.setTimeout(fetchNowPlaying, CONFIG.pollIntervalMs);
  }
}

function init() {
  applyConfig();
  readTermsState();
  renderDjs();
  updateProgress(0, 0);
  fetchNowPlaying();
  elements.acceptTermsButton?.addEventListener('click', acceptTerms);
}

init();
