import { auth } from './03_app.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

function initSearchOptions() {
  const formSel = document.getElementById('search-form');
  const genreSel = document.getElementById('search-genre');
  if (formSel && typeof FORM_OPTIONS !== 'undefined') {
    formSel.innerHTML = '<option value="">全ての形式</option>' + FORM_OPTIONS.map(f => `<option>${f}</option>`).join('');
  }
  if (genreSel && typeof GENRE_OPTIONS !== 'undefined') {
    genreSel.innerHTML = '<option value="">全てのジャンル</option>' + GENRE_OPTIONS.map(g => `<option>${g}</option>`).join('');
  }
}

function initLeafletMap() {
  if (window.map) return; // 既に初期化済みの場合はスキップ

  const mapContainer = document.getElementById('map');
  if (!mapContainer) return;

  window.map = L.map('map').setView([35.681236, 139.767125], 14);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
  }).addTo(window.map);

  window.map.on('click', function(e) {
    const curMap = window.getCurrentMap();
    if (curMap && curMap.isShared) {
      alert('🔒 共有されたマップのため、ピンの作成はできません。');
      return;
    }

    window.tempPinLocation = e.latlng;
    if (window.tempMarker) window.map.removeLayer(window.tempMarker);
    window.tempMarker = L.marker(e.latlng, { opacity: 0.9 }).addTo(window.map);
    
    const detailPanel = document.getElementById('detail-area');
    const detailContent = document.getElementById('detail-content');
    if (detailPanel && detailContent) {
      detailPanel.style.display = 'block';
      detailContent.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <p style="color:var(--primary-color); font-weight:bold; margin:0;">📍 ピンを置きました</p>
        </div>
        <p style="font-size:11.5px; color:#666; margin-top:4px;">左上の「📍 店舗登録」または「🚩 エリア登録」を押して情報を登録できます。</p>
      `;
    }
  });

  initSearchOptions();
}

// アプリのメイン初期化（DOMContentLoaded または window.onload 相当）
document.addEventListener('DOMContentLoaded', () => {
  try {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        window.currentUser = { loggedIn: true, email: user.email, name: user.displayName || user.email.split('@')[0], uid: user.uid };
      } else {
        window.currentUser = { loggedIn: false, email: '', name: '', uid: '' };
      }
      await window.loadCurrentUserData();
      if (typeof updateAuthUI === 'function') updateAuthUI();
      if (typeof renderCurrentMap === 'function') renderCurrentMap();
      initLeafletMap();
    });
  } catch (err) {
    console.warn("Firebase認証に失敗したため、ゲストモードで起動します:", err);
    // Firebaseエラー時でもゲストモードで確実に起動させる
    window.currentUser = { loggedIn: false, email: '', name: '', uid: '' };
    window.loadCurrentUserData().then(() => {
      if (typeof updateAuthUI === 'function') updateAuthUI();
      if (typeof renderCurrentMap === 'function') renderCurrentMap();
      initLeafletMap();
    });
  }
});