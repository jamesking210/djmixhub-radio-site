const STATION = {
  name: 'DJMixHub Live',
  stationId: 1,
  shortcode: 'djmixhub',
  publicPlayerUrl: 'https://radio.djmixhub.com/public/djmixhub',
  liveApiUrl: 'https://radio.djmixhub.com/api/nowplaying/djmixhub',
  staticApiUrl: 'https://radio.djmixhub.com/api/nowplaying_static/djmixhub.json',
  currentArtUrl: 'https://radio.djmixhub.com/api/nowplaying/djmixhub/art',
  fallbackStreamUrl: 'https://radio.djmixhub.com/listen/djmixhub/radio.mp3',
  fallbackArtUrl: 'assets/img/logo.jpg',
  scheduleRows: 12,
  scheduleApiUrls: [
    'https://radio.djmixhub.com/api/station/1/schedule?now=now&rows=12',
    'https://radio.djmixhub.com/api/station/djmixhub/schedule?now=now&rows=12'
  ]
};

const audio = document.getElementById('station-audio');
const playToggle = document.getElementById('play-toggle');
const volumeRange = document.getElementById('volume-range');
const yearEl = document.getElementById('year');
const termsConsent = document.getElementById('terms-consent');
const TERMS_KEY = 'djmixhub-terms-accepted';
const VOLUME_KEY = 'djmixhub-volume';

let isPlaying = false;
let currentStreamUrl = STATION.fallbackStreamUrl;
let stationTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Chicago';

const getPlayButtons = () => Array.from(document.querySelectorAll('.js-play-toggle'));
const getNavLinks = () => Array.from(document.querySelectorAll('[data-nav-link]'));
const getSections = () => Array.from(document.querySelectorAll('[data-section]'));

const setText = (selector, value) => {
  const element = document.querySelector(selector);
  if (element) element.textContent = value;
};

const setImage = (selector, src, alt = 'Current album art', fallbackSrc = STATION.fallbackArtUrl) => {
  const element = document.querySelector(selector);
  if (!element) return;

  element.onerror = () => {
    if (element.dataset.fallbackApplied === 'yes') return;
    element.dataset.fallbackApplied = 'yes';
    element.src = fallbackSrc || STATION.fallbackArtUrl;
  };

  element.dataset.fallbackApplied = 'no';
  element.alt = alt;
  element.src = src || fallbackSrc || STATION.fallbackArtUrl;
};

const syncYear = () => {
  if (yearEl) yearEl.textContent = new Date().getFullYear();
};

const updateActiveNav = (sectionId) => {
  getNavLinks().forEach((link) => {
    link.classList.toggle('active', link.dataset.navLink === sectionId);
  });
};

const setPlayButtonState = () => {
  const symbol = isPlaying ? '❚❚' : '▶';
  const label = isPlaying ? 'Pause station' : 'Play station';

  if (playToggle) {
    playToggle.textContent = symbol;
    playToggle.setAttribute('aria-label', label);
  }

  getPlayButtons().forEach((button) => {
    button.textContent = isPlaying ? 'Pause Station' : 'Play Station';
  });
};

const updateTrackText = (title, artist) => {
  setText('#dock-track', title || STATION.name);
  setText('#dock-artist', artist || 'radio.djmixhub.com');
  setText('#np-title', title || STATION.name);
  setText('#np-artist', artist || 'radio.djmixhub.com');
  setText('#hero-track', title || 'Live stream');
};

const updateStatus = (status) => {
  const nice = status || 'Live';
  setText('#hero-live-status', nice);
  setText('#hero-mini-status', nice);
};

const renderRecentTracks = (tracks = []) => {
  const recentTracksList = document.querySelector('#recent-tracks-list');
  if (!recentTracksList) return;

  if (!tracks.length) {
    recentTracksList.innerHTML = '<li>Recent tracks will appear here when available.</li>';
    return;
  }

  recentTracksList.innerHTML = tracks
    .slice(0, 5)
    .map((item) => {
      const song = item.song || {};
      const text = [song.title, song.artist].filter(Boolean).join(' — ');
      return `<li>${text || 'Unknown track'}</li>`;
    })
    .join('');
};

const extractArtwork = (payload) => {
  const nowPlaying = payload?.now_playing || {};
  const song = nowPlaying.song || {};

  return (
    song.art ||
    song.art_url ||
    song.art_original_url ||
    nowPlaying.art ||
    nowPlaying.art_url ||
    payload?.live?.art ||
    STATION.fallbackArtUrl
  );
};

const buildCurrentArtUrl = () => {
  if (!STATION.currentArtUrl) return null;
  const separator = STATION.currentArtUrl.includes('?') ? '&' : '?';
  return `${STATION.currentArtUrl}${separator}t=${Date.now()}`;
};

const extractStationData = (payload) => {
  if (!payload) return null;

  const station = payload.station || {};
  const nowPlaying = payload.now_playing || {};
  const song = nowPlaying.song || {};

  const liveFlag = nowPlaying.is_live ?? payload.is_live ?? false;
  const title = song.title || song.text || nowPlaying.song?.text || 'Live stream';
  const artist = song.artist || station.name || STATION.name;
  const streamUrl = station.listen_url || STATION.fallbackStreamUrl;
  const fallbackArtUrl = extractArtwork(payload);

  if (station.timezone) {
    stationTimezone = station.timezone;
  }

  return {
    title,
    artist,
    streamUrl,
    artUrl: buildCurrentArtUrl() || fallbackArtUrl,
    fallbackArtUrl,
    isLive: liveFlag,
    recent: payload.song_history || []
  };
};

const updateFromPayload = (payload) => {
  const data = extractStationData(payload);
  if (!data) return;

  currentStreamUrl = data.streamUrl || STATION.fallbackStreamUrl;

  if (audio && !audio.src) {
    audio.src = currentStreamUrl;
  }

  updateTrackText(data.title, data.artist);
  updateStatus(data.isLive ? 'Live now' : 'AutoDJ');
  renderRecentTracks(data.recent);
  setImage('#player-art', data.artUrl, `${data.title} album art`, data.fallbackArtUrl);
};

const fetchJson = async (url) => {
  const response = await fetch(url, {
    method: 'GET',
    mode: 'cors',
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}`);
  }

  return response.json();
};

const fetchFirstJson = async (urls = []) => {
  let lastError;

  for (const url of urls) {
    try {
      return await fetchJson(url);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('No schedule URLs configured.');
};

const refreshStationData = async () => {
  try {
    const payload = await fetchJson(STATION.staticApiUrl);
    updateFromPayload(payload);
  } catch (staticError) {
    try {
      const payload = await fetchJson(STATION.liveApiUrl);
      updateFromPayload(payload);
    } catch (liveError) {
      updateTrackText(STATION.name, 'Metadata unavailable');
      updateStatus('Stream ready');
      renderRecentTracks([]);
      setImage('#player-art', STATION.fallbackArtUrl, 'DJMixHub logo');
    }
  }
};

const togglePlayback = async () => {
  if (!audio) return;

  try {
    if (isPlaying) {
      audio.pause();
      isPlaying = false;
    } else {
      if (!audio.src || audio.src !== currentStreamUrl) {
        audio.src = currentStreamUrl;
      }
      await audio.play();
      isPlaying = true;
    }
  } catch (error) {
    window.open(STATION.publicPlayerUrl, '_blank', 'noopener');
  }

  setPlayButtonState();
};

const showTermsIfNeeded = () => {
  if (!termsConsent) return;
  const accepted = localStorage.getItem(TERMS_KEY) === 'yes';
  termsConsent.hidden = accepted;
};

const observeSections = () => {
  const sections = getSections();
  if (!sections.length || !('IntersectionObserver' in window)) {
    const first = sections[0];
    if (first) updateActiveNav(first.dataset.section);
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (!visible) return;

    const sectionId = visible.target.dataset.section;
    updateActiveNav(sectionId);
  }, {
    rootMargin: '-25% 0px -55% 0px',
    threshold: [0.15, 0.4, 0.65]
  });

  sections.forEach((section) => observer.observe(section));
};

const parsePossibleDate = (value) => {
  if (!value && value !== 0) return null;

  if (value instanceof Date) return value;

  if (typeof value === 'number') {
    return new Date(value < 1000000000000 ? value * 1000 : value);
  }

  if (typeof value === 'string') {
    if (/^\d+$/.test(value)) {
      const numeric = Number(value);
      return new Date(numeric < 1000000000000 ? numeric * 1000 : numeric);
    }

    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return null;
};

const formatInTimezone = (date, options = {}, timezone = stationTimezone) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return 'TBD';

  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      ...options
    }).format(date);
  } catch (error) {
    return new Intl.DateTimeFormat('en-US', options).format(date);
  }
};

const getScheduleItems = (payload) => {
  const baseItems = Array.isArray(payload)
    ? payload
    : payload?.schedule || payload?.items || payload?.results || [];

  if (!Array.isArray(baseItems)) return [];

  return baseItems
    .map((item, index) => {
      const title =
        item?.title ||
        item?.name ||
        item?.playlist_name ||
        item?.playlist?.name ||
        item?.streamer_name ||
        item?.streamer?.display_name ||
        item?.text ||
        `Scheduled block ${index + 1}`;

      const detail =
        item?.description ||
        item?.playlist?.type ||
        item?.type ||
        item?.streamer?.display_name ||
        item?.streamer_name ||
        '';

      const start = parsePossibleDate(
        item?.start ||
        item?.start_at ||
        item?.start_time ||
        item?.start_timestamp ||
        item?.timestamp_start ||
        item?.from
      );

      const end = parsePossibleDate(
        item?.end ||
        item?.end_at ||
        item?.end_time ||
        item?.end_timestamp ||
        item?.timestamp_end ||
        item?.to
      );

      const isLive = Boolean(item?.is_now || item?.is_active || item?.current || item?.playing_now);

      const chip = isLive
        ? 'Live now'
        : item?.streamer || item?.streamer_name
          ? 'DJ block'
          : item?.playlist || item?.playlist_name
            ? 'Playlist'
            : 'Scheduled';

      return {
        title,
        detail,
        start,
        end,
        isLive,
        chip,
        raw: item
      };
    })
    .filter((item) => item.start || item.end || item.isLive || item.title)
    .sort((a, b) => {
      const aTime = itemTimeValue(a);
      const bTime = itemTimeValue(b);
      return aTime - bTime;
    });
};

const itemTimeValue = (item) => {
  const candidate = item?.start || item?.end;
  if (!(candidate instanceof Date) || Number.isNaN(candidate.getTime())) return Number.MAX_SAFE_INTEGER;
  return candidate.getTime();
};

const scheduleTimeLabel = (item) => {
  const day = item.start ? formatInTimezone(item.start, { weekday: 'short', month: 'short', day: 'numeric' }) : 'Day TBD';
  const startTime = item.start ? formatInTimezone(item.start, { hour: 'numeric', minute: '2-digit' }) : 'TBD';
  const endTime = item.end ? formatInTimezone(item.end, { hour: 'numeric', minute: '2-digit' }) : 'TBD';
  return {
    day,
    range: `${startTime} – ${endTime}`
  };
};

const renderSchedule = (items = []) => {
  const scheduleList = document.querySelector('#schedule-list');
  const badge = document.querySelector('#schedule-board-badge');

  if (!scheduleList) return;

  if (!items.length) {
    scheduleList.innerHTML = '<div class="schedule-row schedule-row-empty">No schedule items are available right now.</div>';
    setText('#schedule-now', 'Schedule unavailable');
    setText('#schedule-next', 'Nothing queued yet');
    setText('#schedule-status', 'Could not pull schedule data from AzuraCast.');
    setText('#schedule-timezone', `Timezone: ${stationTimezone}`);
    if (badge) badge.textContent = 'Unavailable';
    return;
  }

  const nowItem = items.find((item) => item.isLive) || items[0];
  const nextItem = items.find((item) => item.start && nowItem.start && item.start.getTime() > nowItem.start.getTime()) || items[1] || null;

  setText('#schedule-now', nowItem?.title || 'On air');
  setText('#schedule-status', nowItem?.detail || 'Live schedule from AzuraCast.');
  setText('#schedule-next', nextItem?.title || 'More blocks coming soon');
  setText('#schedule-timezone', `Station timezone: ${stationTimezone}`);

  if (badge) badge.textContent = `${items.length} blocks`;

  scheduleList.innerHTML = items
    .slice(0, 8)
    .map((item) => {
      const time = scheduleTimeLabel(item);
      return `
        <div class="schedule-row${item.isLive ? ' is-live' : ''}">
          <div>
            <div class="schedule-row-day">${time.day}</div>
            <div class="schedule-row-time">${time.range}</div>
          </div>
          <div>
            <h4>${item.title}</h4>
            <p class="schedule-meta">${item.detail || 'Scheduled block from AzuraCast.'}</p>
          </div>
          <span class="schedule-chip${item.isLive ? ' live' : ''}">${item.chip}</span>
        </div>
      `;
    })
    .join('');
};

const refreshScheduleData = async () => {
  try {
    const payload = await fetchFirstJson(STATION.scheduleApiUrls);
    const maybeTimezone = payload?.timezone || payload?.station?.timezone;
    if (maybeTimezone) {
      stationTimezone = maybeTimezone;
    }
    renderSchedule(getScheduleItems(payload));
  } catch (error) {
    renderSchedule([]);
  }
};

if (audio) {
  audio.src = currentStreamUrl;
  audio.volume = Number(localStorage.getItem(VOLUME_KEY) || 0.85);
}

if (volumeRange && audio) {
  volumeRange.value = audio.volume;
  volumeRange.addEventListener('input', (event) => {
    audio.volume = Number(event.target.value);
    localStorage.setItem(VOLUME_KEY, event.target.value);
  });
}

document.addEventListener('click', (event) => {
  const acceptButton = event.target.closest('[data-accept-terms]');
  if (acceptButton) {
    localStorage.setItem(TERMS_KEY, 'yes');
    showTermsIfNeeded();
    return;
  }

  const playButton = event.target.closest('.js-play-toggle');
  if (playButton) {
    event.preventDefault();
    togglePlayback();
  }
});

if (playToggle) {
  playToggle.addEventListener('click', togglePlayback);
}

if (audio) {
  audio.addEventListener('ended', () => {
    isPlaying = false;
    setPlayButtonState();
  });

  audio.addEventListener('pause', () => {
    isPlaying = false;
    setPlayButtonState();
  });

  audio.addEventListener('play', () => {
    isPlaying = true;
    setPlayButtonState();
  });
}

syncYear();
showTermsIfNeeded();
setPlayButtonState();
observeSections();
refreshStationData();
refreshScheduleData();
setInterval(refreshStationData, 30000);
setInterval(refreshScheduleData, 300000);
