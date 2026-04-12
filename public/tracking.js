/**
 * BeeFrequency Funnel Tracking
 * Include on any page: <script src="https://hive.joffreydeleplanque.com/tracking.js"></script>
 */
(function() {
  'use strict';

  var API_BASE = window.__BF_TRACKING_URL || '';
  var SESSION_KEY = 'bf_session_id';

  function getSessionId() {
    var id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = 'ses_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  }

  function getUTM() {
    var params = new URLSearchParams(window.location.search);
    return {
      source: params.get('utm_source') || null,
      medium: params.get('utm_medium') || null,
      campaign: params.get('utm_campaign') || null,
    };
  }

  function getDevice() {
    var w = window.innerWidth;
    if (w < 768) return 'mobile';
    if (w < 1024) return 'tablet';
    return 'desktop';
  }

  function getBrowser() {
    var ua = navigator.userAgent;
    if (ua.indexOf('Chrome') > -1 && ua.indexOf('Edg') === -1) return 'chrome';
    if (ua.indexOf('Safari') > -1 && ua.indexOf('Chrome') === -1) return 'safari';
    if (ua.indexOf('Firefox') > -1) return 'firefox';
    if (ua.indexOf('Edg') > -1) return 'edge';
    return 'other';
  }

  function track(step, extra) {
    var utm = getUTM();
    var payload = {
      sessionId: getSessionId(),
      step: step,
      page: window.location.pathname,
      source: utm.source,
      medium: utm.medium,
      campaign: utm.campaign,
      referrer: document.referrer || null,
      device: getDevice(),
      browser: getBrowser(),
      language: navigator.language || null,
    };
    if (extra) {
      for (var k in extra) { payload[k] = extra[k]; }
    }
    try {
      navigator.sendBeacon(
        API_BASE + '/api/tracking/event',
        new Blob([JSON.stringify(payload)], { type: 'application/json' })
      );
    } catch(e) {
      // Silent fail
    }
  }

  function identify(email, data) {
    var payload = { sessionId: getSessionId(), email: email, data: data || {} };
    try {
      navigator.sendBeacon(
        API_BASE + '/api/tracking/identify',
        new Blob([JSON.stringify(payload)], { type: 'application/json' })
      );
    } catch(e) {
      // Silent fail
    }
  }

  // Auto-track page view
  track('landing');

  // Expose globally
  window.bfTrack = track;
  window.bfIdentify = identify;
})();
