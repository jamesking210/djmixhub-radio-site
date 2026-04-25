const DEFAULT_CONFIG = {
  siteName: 'DJMixHub',
  siteTagline: 'Open Source Energy. Community Sourced Mixes.',
  siteUrl: 'https://djmixhub.com',
  radioBaseUrl: 'https://radio.djmixhub.com',
  stationShortcode: 'djmixhub',
  stationName: 'DJMixHub',
  nowPlayingUrl: '',
  streamUrl: '',
  mainRepoUrl: 'https://github.com/jamesking210/djmixhub-radio-site',
  azuracastRepoUrl: 'https://github.com/AzuraCast/AzuraCast',
  githubUrl: 'https://github.com/jamesking210',
  contactEmail: 'djmixhubradio@gmail.com',
  termsKey: 'djmixhub_terms_accepted_v1',
  volumeKey: 'djmixhub_player_volume_v3',
  fallbackArtwork: 'assets/logo.jpg',
  pollIntervalMs: 15000
};

function normalizeString(value, fallback = '') {
  if (typeof value !== 'string') {
    return fallback;
  }

  const trimmedValue = value.trim();
  return trimmedValue || fallback;
}

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, '');
}

function buildUrl(baseUrl, path) {
  const normalizedBaseUrl = trimTrailingSlash(normalizeString(baseUrl));

  if (!normalizedBaseUrl) {
    return '';
  }

  return `${normalizedBaseUrl}${path}`;
}

function buildPublicConfig() {
  const runtimeConfig = window.DJMIXHUB_CONFIG || {};
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
    streamUrl: normalizeString(runtimeConfig.streamUrl) || buildUrl(radioBaseUrl, `/listen/${stationShortcode}/radio.mp3`),
    mainRepoUrl: normalizeString(runtimeConfig.mainRepoUrl, DEFAULT_CONFIG.mainRepoUrl),
    azuracastRepoUrl: normalizeString(runtimeConfig.azuracastRepoUrl, DEFAULT_CONFIG.azuracastRepoUrl),
    githubUrl: normalizeString(runtimeConfig.githubUrl, DEFAULT_CONFIG.githubUrl),
    contactEmail: normalizeString(runtimeConfig.contactEmail)
  };
}

const CONFIG = buildPublicConfig();

const state = {
  acceptedTerms: false,
  isPlaying: false,
  currentStreamUrl: CONFIG.streamUrl,
  pollTimer: null,
  reconnectTimer: null,
  volume: 0.5,
  progressTimer: null,
  trackStartedAt: null,
  trackElapsedSeconds: 0,
  trackDurationSeconds: 0,
  lastStreamUrl: '',
  userStopped: false,
  isRecoveringStream: false
};

const elements = {
  radioPlayer: document.getElementById('radioPlayer'),
  playButton: document.getElementById('playButton'),
  volumeSlider: document.getElementById('volumeSlider'),
  acceptTermsButton: document.getElementById('acceptTermsButton'),
  termsGate: document.getElementById('termsGate'),
  playerArt: document.getElementById('playerArt'),
  playerListeners: document.getElementById('playerListeners'),
  playerTitle: document.getElementById('playerTitle'),
  playerArtist: document.getElementById('playerArtist'),
  playerProgress: document.getElementById('playerProgress'),
  playerElapsed: document.getElementById('playerElapsed'),
  playerDuration: document.getElementById('playerDuration')
};

function renderDjs() {
  const djGrid = document.getElementById('djGrid');
  const djs = Array.isArray(window.DJMIXHUB_DJS) ? window.DJMIXHUB_DJS : [];

  if (!djGrid || !djs.length) {
    return;
  }

  djGrid.innerHTML = djs
    .map((dj) => {
      const highlights = Array.isArray(dj.highlights)
        ? dj.highlights.map((item) => `<li>${escapeHtml(item)}</li>`).join('')
        : '';

      const actionLink = dj.linkUrl
        ? `<a href="${escapeHtml(dj.linkUrl)}" target="_blank" rel="noreferrer">${escapeHtml(dj.linkLabel || dj.linkUrl)}</a>`
        : dj.emailSubject
          ? `<a href="mailto:${CONFIG.contactEmail}?subject=${encodeURIComponent(dj.emailSubject)}">${escapeHtml(dj.linkLabel || CONFIG.contactEmail)}</a>`
          : '';

      return `
        <article class="card dj-card">
          <div class="dj-card__media${dj.linkUrl ? '' : ' dj-card__media--open'}">
            <img
              src="${escapeHtml(dj.image || CONFIG.fallbackArtwork)}"
              alt="${escapeHtml(dj.imageAlt || dj.name || CONFIG.siteName)}"
              onerror="this.onerror=null;this.src='${CONFIG.fallbackArtwork}';"
            />
          </div>
          <div class="dj-card__header">
            <span class="dj-tag">${escapeHtml(dj.tag || 'Featured DJ')}</span>
            <h3>${escapeHtml(dj.name || 'DJ')}</h3>
          </div>
          <p>${escapeHtml(dj.bio || '')}</p>
          ${highlights ? `<ul class="dj-card__list">${highlights}</ul>` : ''}
          ${actionLink}
        </article>
      `;
    })
    .join('');
}

function isMobileVolumeMode() {
  return window.matchMedia('(max-width: 820px) and (hover: none) and (pointer: coarse)').matches;
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

function renderTrackProgress() {
  const duration = Math.max(0, state.trackDurationSeconds);
  const elapsed = Math.min(Math.max(0, state.trackElapsedSeconds), duration || state.trackElapsedSeconds);
  const max = duration > 0 ? duration : 1;

  if (elements.playerProgress) {
    elements.playerProgress.max = max;
    elements.playerProgress.value = Math.min(elapsed, max);
  }

  if (elements.playerElapsed) {
    elements.playerElapsed.textContent = formatDuration(elapsed);
  }

  if (elements.playerDuration) {
    elements.playerDuration.textContent = formatDuration(duration);
  }
}

function stopTrackProgressTimer() {
  window.clearInterval(state.progressTimer);
  state.progressTimer = null;
}

function startTrackProgressTimer() {
  stopTrackProgressTimer();

  if (!state.trackStartedAt || !state.trackDurationSeconds) {
    return;
  }

  state.progressTimer = window.setInterval(() => {
    const elapsedFromClock = Math.floor((Date.now() - state.trackStartedAt) / 1000);

    state.trackElapsedSeconds = Math.min(elapsedFromClock, state.trackDurationSeconds);
    renderTrackProgress();

    if (state.trackElapsedSeconds >= state.trackDurationSeconds) {
      stopTrackProgressTimer();
    }
  }, 1000);
}

function setTrackProgress(elapsedSeconds, durationSeconds) {
  const safeDuration = Math.max(0, Math.floor(Number(durationSeconds) || 0));
  const safeElapsed = Math.max(0, Math.floor(Number(elapsedSeconds) || 0));

  state.trackDurationSeconds = safeDuration;
  state.trackElapsedSeconds = safeDuration > 0 ? Math.min(safeElapsed, safeDuration) : safeElapsed;
  state.trackStartedAt = Date.now() - (state.trackElapsedSeconds * 1000);

  renderTrackProgress();
  startTrackProgressTimer();
}

function updateDocumentMetadata() {
  document.title = `${CONFIG.siteName} | Free Internet Radio`;
}

function applyTextConfig() {
  document.querySelectorAll('[data-config-text]').forEach((element) => {
    const key = element.dataset.configText;
    const value = CONFIG[key];

    if (value) {
      element.textContent = value;
    }
  });
}

function applyHrefConfig() {
  document.querySelectorAll('[data-config-href]').forEach((element) => {
    const key = element.dataset.configHref;
    const value = CONFIG[key];

    if (value) {
      element.hidden = false;
      element.setAttribute('href', value);
    } else if (element.dataset.configOptional) {
      element.hidden = true;
    }
  });
}

function applyEmailConfig() {
  const email = CONFIG.contactEmail;

  document.querySelectorAll('[data-config-email]').forEach((element) => {
    if (!email) {
      element.hidden = true;
      return;
    }

    element.hidden = false;
    element.setAttribute('href', `mailto:${email}`);
    element.textContent = email;
  });

  document.querySelectorAll('[data-config-email-link]').forEach((element) => {
    if (!email) {
      element.hidden = true;
      return;
    }

    const subject = element.dataset.configEmailLink?.trim();
    const mailtoUrl = subject ? `mailto:${email}?subject=${encodeURIComponent(subject)}` : `mailto:${email}`;
    element.hidden = false;
    element.setAttribute('href', mailtoUrl);
  });
}

function applyPublicConfig() {
  updateDocumentMetadata();
  applyTextConfig();
  applyHrefConfig();
  applyEmailConfig();
}

function readTermsState() {
  state.acceptedTerms = localStorage.getItem(CONFIG.termsKey) === 'true';
  applyTermsState();
}

function readVolumeState() {
  if (isMobileVolumeMode()) {
    state.volume = 1;

    if (elements.volumeSlider) {
      elements.volumeSlider.value = '1';
    }

    if (elements.radioPlayer) {
      elements.radioPlayer.volume = 1;
    }

    return;
  }

  const savedVolume = Number(localStorage.getItem(CONFIG.volumeKey));

  if (!Number.isNaN(savedVolume) && savedVolume > 0 && savedVolume <= 1) {
    state.volume = savedVolume;
  } else {
    state.volume = 0.5;
    localStorage.setItem(CONFIG.volumeKey, '0.5');
  }

  if (elements.volumeSlider) {
    elements.volumeSlider.value = String(state.volume);
  }

  if (elements.radioPlayer) {
    elements.radioPlayer.volume = state.volume;
  }
}

function applyTermsState() {
  const canPlay = Boolean(state.currentStreamUrl);

  if (elements.playButton) {
    elements.playButton.disabled = !canPlay;
  }

  if (state.acceptedTerms) {
    hideTermsGate();
  }
}

function acceptTerms() {
  localStorage.setItem(CONFIG.termsKey, 'true');
  state.acceptedTerms = true;
  applyTermsState();
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

function setPlaybackUi() {
  if (elements.playButton) {
    elements.playButton.disabled = !state.currentStreamUrl;
    elements.playButton.textContent = state.isPlaying ? 'Stop' : 'Play';
    elements.playButton.setAttribute('aria-label', state.isPlaying ? 'Stop station' : 'Play station');
  }
}

function clearReconnectTimer() {
  window.clearTimeout(state.reconnectTimer);
  state.reconnectTimer = null;
}

function buildLiveStreamUrl() {
  const baseUrl = state.currentStreamUrl || CONFIG.streamUrl;

  if (!baseUrl) {
    return '';
  }

  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}t=${Date.now()}`;
}

function primeStreamSource() {
  if (!elements.radioPlayer) {
    return '';
  }

  const nextUrl = buildLiveStreamUrl();

  if (!nextUrl) {
    return '';
  }

  if (elements.radioPlayer.src !== nextUrl) {
    elements.radioPlayer.pause();
    elements.radioPlayer.src = nextUrl;
    elements.radioPlayer.load();
  }

  state.lastStreamUrl = nextUrl;
  return nextUrl;
}

function scheduleStreamRecovery(reason = 'unknown') {
  if (!state.isPlaying || state.userStopped || state.isRecoveringStream) {
    return;
  }

  clearReconnectTimer();
  state.isRecoveringStream = true;

  state.reconnectTimer = window.setTimeout(async () => {
    try {
      console.warn(`Recovering stream after ${reason}`);
      primeStreamSource();
      elements.radioPlayer.volume = state.volume;
      await elements.radioPlayer.play();
    } catch (error) {
      console.error('Stream recovery failed:', error);
      state.isPlaying = false;
    } finally {
      state.isRecoveringStream = false;
      setPlaybackUi();
    }
  }, 1200);
}

function setPlayerVolume(rawValue) {
  if (isMobileVolumeMode()) {
    state.volume = 1;

    if (elements.radioPlayer) {
      elements.radioPlayer.volume = 1;
    }

    return;
  }

  const volume = Number(rawValue);

  if (Number.isNaN(volume)) {
    return;
  }

  state.volume = Math.min(1, Math.max(0, volume));

  if (elements.radioPlayer) {
    elements.radioPlayer.volume = state.volume;
  }

  localStorage.setItem(CONFIG.volumeKey, String(state.volume));
}

async function playStream() {
  if (!state.acceptedTerms) {
    showTermsGate();
    return;
  }

  if (!state.currentStreamUrl) {
    return;
  }

  try {
    state.userStopped = false;
    clearReconnectTimer();
    primeStreamSource();
    elements.radioPlayer.volume = state.volume;
    await elements.radioPlayer.play();
    state.isPlaying = true;
  } catch (error) {
    console.error('Unable to start playback:', error);
    state.isPlaying = false;
  }

  setPlaybackUi();
}

function stopStream() {
  if (!elements.radioPlayer) {
    return;
  }

  state.userStopped = true;
  state.isRecoveringStream = false;
  clearReconnectTimer();
  elements.radioPlayer.pause();
  elements.radioPlayer.removeAttribute('src');
  elements.radioPlayer.load();
  state.lastStreamUrl = '';
  state.isPlaying = false;
  setPlaybackUi();
}

async function togglePlayback() {
  if (state.isPlaying) {
    stopStream();
    return;
  }

  await playStream();
}

function getStatusText(np) {
  const isLive = Boolean(np?.live?.is_live);
  const streamerName = np?.live?.streamer_name?.trim();

  if (isLive) {
    return streamerName ? `${streamerName} live on air` : 'Live on air';
  }

  if (np?.is_online) {
    return `${CONFIG.stationName} on air`;
  }

  return 'Station offline';
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

function updateNowPlayingUi(np) {
  const nowSong = np?.now_playing?.song ?? {};
  const totalListeners = np?.listeners?.total ?? np?.listeners?.current ?? 0;
  const isLive = Boolean(np?.live?.is_live);
  const streamerName = np?.live?.streamer_name?.trim();
  const statusText = getStatusText(np);
  const elapsedSeconds = np?.now_playing?.elapsed ?? 0;
  const durationSeconds = np?.now_playing?.duration ?? 0;

  const title = nowSong.title || `${CONFIG.stationName} radio`;
  const artist = nowSong.artist || (isLive && streamerName ? streamerName : 'Always free internet radio');
  const art = normalizePossibleUrl(nowSong.art || np?.live?.art) || CONFIG.fallbackArtwork;

  if (elements.playerArt) {
    elements.playerArt.src = art;
    elements.playerArt.alt = `${title} artwork`;
  }

  if (elements.playerListeners) elements.playerListeners.textContent = totalListeners;
  if (elements.playerTitle) elements.playerTitle.textContent = title;
  if (elements.playerArtist) elements.playerArtist.textContent = artist;
  setTrackProgress(elapsedSeconds, durationSeconds);

  const listenUrl = normalizePossibleUrl(np?.station?.listen_url);

  if (listenUrl) {
    state.currentStreamUrl = listenUrl;
  }

  setPlaybackUi();
}

async function fetchNowPlaying() {
  try {
    const response = await fetch(`${CONFIG.nowPlayingUrl}?t=${Date.now()}`, { cache: 'no-store' });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const nowPlaying = await response.json();
    updateNowPlayingUi(nowPlaying);
  } catch (error) {
    console.error('Could not load now playing data:', error);

    setPlaybackUi();
  } finally {
    window.clearTimeout(state.pollTimer);
    state.pollTimer = window.setTimeout(fetchNowPlaying, CONFIG.pollIntervalMs);
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function init() {
  applyPublicConfig();
  renderDjs();
  renderTrackProgress();

  if (!elements.radioPlayer) {
    return;
  }

  readTermsState();
  readVolumeState();
  fetchNowPlaying();
  setPlaybackUi();

  elements.acceptTermsButton?.addEventListener('click', acceptTerms);

  elements.playButton?.addEventListener('click', togglePlayback);

  elements.volumeSlider?.addEventListener('input', (event) => {
    setPlayerVolume(event.target.value);
  });

  window.addEventListener('resize', readVolumeState);

  elements.radioPlayer.addEventListener('pause', () => {
    if (!state.isRecoveringStream && state.userStopped) {
      state.isPlaying = false;
    }
    setPlaybackUi();
  });

  elements.radioPlayer.addEventListener('play', () => {
    clearReconnectTimer();
    state.userStopped = false;
    state.isRecoveringStream = false;
    state.isPlaying = true;
    setPlaybackUi();
  });

  elements.radioPlayer.addEventListener('ended', () => {
    scheduleStreamRecovery('ended');
  });

  elements.radioPlayer.addEventListener('stalled', () => {
    scheduleStreamRecovery('stalled');
  });

  elements.radioPlayer.addEventListener('error', () => {
    scheduleStreamRecovery('error');
  });

  elements.playerArt?.addEventListener('error', () => {
    elements.playerArt.src = CONFIG.fallbackArtwork;
  });
}

init();
