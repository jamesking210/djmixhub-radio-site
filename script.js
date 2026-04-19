const CONFIG = {
  termsKey: 'djmixhub_terms_accepted_v1',
  volumeKey: 'djmixhub_player_volume_v1',
  nowPlayingUrl: 'https://radio.djmixhub.com/api/nowplaying_static/djmixhub.json',
  fallbackStreamUrl: 'https://radio.djmixhub.com/listen/djmixhub/radio.mp3',
  fallbackArtwork: 'assets/logo.jpg',
  pollIntervalMs: 15000
};

const state = {
  acceptedTerms: false,
  isPlaying: false,
  currentStreamUrl: CONFIG.fallbackStreamUrl,
  pollTimer: null,
  volume: 0.85
};

const elements = {
  radioPlayer: document.getElementById('radioPlayer'),
  playButton: document.getElementById('playButton'),
  stopButton: document.getElementById('stopButton'),
  volumeSlider: document.getElementById('volumeSlider'),
  playerAgreeButton: document.getElementById('playerAgreeButton'),
  acceptTermsButton: document.getElementById('acceptTermsButton'),
  termsGate: document.getElementById('termsGate'),
  heroListenButton: document.getElementById('heroListenButton'),
  playerArt: document.getElementById('playerArt'),
  playerStatus: document.getElementById('playerStatus'),
  playerListeners: document.getElementById('playerListeners'),
  playerUnique: document.getElementById('playerUnique'),
  playerSource: document.getElementById('playerSource'),
  playerTitle: document.getElementById('playerTitle'),
  playerArtist: document.getElementById('playerArtist'),
  heroStatus: document.getElementById('heroStatus'),
  heroTrack: document.getElementById('heroTrack'),
  heroArtist: document.getElementById('heroArtist'),
  heroListeners: document.getElementById('heroListeners'),
  heroMode: document.getElementById('heroMode'),
  scheduleStatus: document.getElementById('scheduleStatus'),
  scheduleListeners: document.getElementById('scheduleListeners'),
  scheduleNowTitle: document.getElementById('scheduleNowTitle'),
  scheduleNowMeta: document.getElementById('scheduleNowMeta'),
  scheduleNextTitle: document.getElementById('scheduleNextTitle'),
  scheduleNextMeta: document.getElementById('scheduleNextMeta'),
  recentTracks: document.getElementById('recentTracks')
};

function readTermsState() {
  state.acceptedTerms = localStorage.getItem(CONFIG.termsKey) === 'true';
  applyTermsState();
}

function readVolumeState() {
  const savedVolume = Number(localStorage.getItem(CONFIG.volumeKey));
  if (!Number.isNaN(savedVolume) && savedVolume >= 0 && savedVolume <= 1) {
    state.volume = savedVolume;
  }
  if (elements.volumeSlider) {
    elements.volumeSlider.value = String(state.volume);
  }
  if (elements.radioPlayer) {
    elements.radioPlayer.volume = state.volume;
  }
}

function applyTermsState() {
  const canPlay = state.acceptedTerms && Boolean(state.currentStreamUrl);
  if (elements.playButton) {
    elements.playButton.disabled = !canPlay;
  }
  if (elements.stopButton) {
    elements.stopButton.disabled = !state.isPlaying;
  }
  if (elements.playerAgreeButton) {
    elements.playerAgreeButton.style.display = state.acceptedTerms ? 'none' : 'inline-flex';
  }
  if (elements.termsGate) {
    elements.termsGate.classList.toggle('is-visible', !state.acceptedTerms);
    elements.termsGate.setAttribute('aria-hidden', state.acceptedTerms ? 'true' : 'false');
  }
}

function acceptTerms() {
  localStorage.setItem(CONFIG.termsKey, 'true');
  state.acceptedTerms = true;
  applyTermsState();
}

function setPlaybackUi() {
  if (elements.playButton) {
    elements.playButton.disabled = !state.acceptedTerms || !state.currentStreamUrl || state.isPlaying;
  }
  if (elements.stopButton) {
    elements.stopButton.disabled = !state.isPlaying;
  }
}

function setPlayerVolume(rawValue) {
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
    elements.termsGate?.classList.add('is-visible');
    return;
  }

  if (!state.currentStreamUrl) {
    return;
  }

  try {
    if (!elements.radioPlayer.src) {
      elements.radioPlayer.src = state.currentStreamUrl;
    }
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

  elements.radioPlayer.pause();
  elements.radioPlayer.removeAttribute('src');
  elements.radioPlayer.load();
  state.isPlaying = false;
  setPlaybackUi();
}

function getStatusText(np) {
  const isLive = Boolean(np?.live?.is_live);
  const streamerName = np?.live?.streamer_name?.trim();

  if (isLive) {
    return streamerName ? `${streamerName} live on air` : 'Live on air';
  }

  if (np?.is_online) {
    return 'DJMixHub on air';
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
    return `https://radio.djmixhub.com${value}`;
  }

  return value;
}

function getSourceText(np) {
  const isLive = Boolean(np?.live?.is_live);
  const streamerName = np?.live?.streamer_name?.trim();

  if (isLive) {
    return streamerName ? `Live DJ: ${streamerName}` : 'Live DJ';
  }

  if (np?.is_online) {
    return 'DJMixHub station mix';
  }

  return 'Offline';
}

function updateNowPlayingUi(np) {
  const nowSong = np?.now_playing?.song ?? {};
  const totalListeners = np?.listeners?.total ?? np?.listeners?.current ?? 0;
  const uniqueListeners = np?.listeners?.unique ?? 0;
  const isLive = Boolean(np?.live?.is_live);
  const streamerName = np?.live?.streamer_name?.trim();
  const statusText = getStatusText(np);
  const sourceText = getSourceText(np);

  const title = nowSong.title || 'DJMixHub radio';
  const artist = nowSong.artist || (isLive && streamerName ? streamerName : 'Always free internet radio');
  const art = normalizePossibleUrl(nowSong.art || np?.live?.art) || CONFIG.fallbackArtwork;

  if (elements.playerArt) {
    elements.playerArt.src = art;
    elements.playerArt.alt = `${title} artwork`;
  }
  if (elements.playerStatus) elements.playerStatus.textContent = statusText;
  if (elements.playerListeners) elements.playerListeners.textContent = totalListeners;
  if (elements.playerUnique) elements.playerUnique.textContent = uniqueListeners;
  if (elements.playerSource) elements.playerSource.textContent = sourceText;
  if (elements.playerTitle) elements.playerTitle.textContent = title;
  if (elements.playerArtist) elements.playerArtist.textContent = artist;

  if (elements.heroStatus) elements.heroStatus.textContent = statusText;
  if (elements.heroTrack) elements.heroTrack.textContent = title;
  if (elements.heroArtist) elements.heroArtist.textContent = artist;
  if (elements.heroListeners) elements.heroListeners.textContent = totalListeners;
  if (elements.heroMode) {
    elements.heroMode.textContent = isLive ? 'Live DJ' : (np?.is_online ? 'DJMixHub' : 'Offline');
  }

  if (elements.scheduleStatus) elements.scheduleStatus.textContent = statusText;
  if (elements.scheduleListeners) elements.scheduleListeners.textContent = totalListeners;
  if (elements.scheduleNowTitle) elements.scheduleNowTitle.textContent = title;
  if (elements.scheduleNowMeta) {
    elements.scheduleNowMeta.textContent = isLive
      ? streamerName
        ? `Live with ${streamerName}`
        : 'A live DJ is on right now.'
      : np?.is_online
        ? 'DJMixHub station mix is currently on air.'
        : 'The station is currently offline.';
  }

  const playingNext = np?.playing_next?.song;
  if (elements.scheduleNextTitle && elements.scheduleNextMeta) {
    if (playingNext?.title || playingNext?.artist) {
      elements.scheduleNextTitle.textContent = playingNext.title || 'Coming up next';
      elements.scheduleNextMeta.textContent = playingNext.artist || 'Upcoming track from the current station flow.';
    } else {
      elements.scheduleNextTitle.textContent = 'Station rotation';
      elements.scheduleNextMeta.textContent = 'A fuller show schedule can be plugged in here later.';
    }
  }

  const history = Array.isArray(np?.song_history) ? np.song_history.slice(0, 4) : [];
  if (elements.recentTracks) {
    if (!history.length) {
      elements.recentTracks.innerHTML = '<li>Recent track history will show here when available.</li>';
    } else {
      elements.recentTracks.innerHTML = history
        .map((item) => {
          const song = item.song || {};
          const titleText = song.title || 'Unknown track';
          const artistText = song.artist || 'Unknown artist';
          return `<li><strong>${escapeHtml(titleText)}</strong> <span>— ${escapeHtml(artistText)}</span></li>`;
        })
        .join('');
    }
  }

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
    if (elements.playerStatus) elements.playerStatus.textContent = 'Station info unavailable';
    if (elements.playerSource) elements.playerSource.textContent = 'Feed unavailable';
    if (elements.heroStatus) elements.heroStatus.textContent = 'Could not reach station feed';
    if (elements.scheduleStatus) elements.scheduleStatus.textContent = 'Feed temporarily unavailable';
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
  if (!elements.radioPlayer) {
    return;
  }

  readTermsState();
  readVolumeState();
  fetchNowPlaying();
  setPlaybackUi();

  elements.acceptTermsButton?.addEventListener('click', acceptTerms);
  elements.playerAgreeButton?.addEventListener('click', () => {
    elements.termsGate?.classList.add('is-visible');
  });
  elements.playButton?.addEventListener('click', playStream);
  elements.stopButton?.addEventListener('click', stopStream);
  elements.volumeSlider?.addEventListener('input', (event) => {
    setPlayerVolume(event.target.value);
  });

  elements.heroListenButton?.addEventListener('click', async () => {
    if (!state.acceptedTerms) {
      elements.termsGate?.classList.add('is-visible');
      return;
    }

    await playStream();
    document.getElementById('bottomPlayer')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  elements.radioPlayer.addEventListener('pause', () => {
    state.isPlaying = false;
    setPlaybackUi();
  });

  elements.radioPlayer.addEventListener('play', () => {
    state.isPlaying = true;
    setPlaybackUi();
  });

  elements.playerArt?.addEventListener('error', () => {
    elements.playerArt.src = CONFIG.fallbackArtwork;
  });
}

init();
