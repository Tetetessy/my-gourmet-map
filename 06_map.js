import { 
  map, setMap, AREA_COLORS, FORM_OPTIONS, GENRE_OPTIONS, 
  tempMarker, setTempMarker, setTempPinLocation, 
  mapStoreMarkers, setMapStoreMarkers, mapAreaMarkers, setMapAreaMarkers, 
  auth, currentUser, setCurrentUser 
} from './config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getCurrentMap, loadCurrentUserData } from './data.js';
import { updateAuthUI } from './auth.js';
import { showStoreDetail } from './store.js';
import { showAreaDetail } from './area.js';

window.onload = function() {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      setCurrentUser({ loggedIn: true, email: user.email, name: user.displayName || user.email.split('@')[0], uid: user.uid });
    } else {
      setCurrentUser({ loggedIn: false, email: '', name: '', uid: '' });
    }
    await loadCurrentUserData();
    updateAuthUI();
    renderCurrentMap();
  });

  const leafMap = L.map('map').setView([35.681236, 139.767125], 14);
  setMap(leafMap);
  
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
  }).addTo(map);

  map.on('click', function(e) {
    const curMap = getCurrentMap();
    if (curMap.isShared) {
      alert('🔒 共有されたマップのため、ピンの作成はできません。');
      return;
    }

    setTempPinLocation(e.latlng);
    if (tempMarker) map.removeLayer(tempMarker);
    setTempMarker(L.marker(e.latlng, { opacity: 0.9 }).addTo(map));
    
    const detailPanel = document.getElementById('detail-area');
    const detailContent = document.getElementById('detail-content');
    detailPanel.style.display = 'block';

    detailContent.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <p style="color:var(--primary-color); font-weight:bold; margin:0;">📍 ピンを置きました</p>
      </div>
      <p style="font-size:11.5px; color:#666; margin-top:4px;">左上の「📍 店舗登録」または「🚩 エリア登録」を押して情報を登録できます。</p>
    `;
  });

  initSearchOptions();
};

export function initSearchOptions() {
  const formSel = document.getElementById('search-form');
  const genreSel = document.getElementById('search-genre');
  if (formSel) {
    formSel.innerHTML = '<option value="">全ての形式</option>' + FORM_OPTIONS.map(f => `<option>${f}</option>`).join('');
  }
  if (genreSel) {
    genreSel.innerHTML = '<option value="">全てのジャンル</option>' + GENRE_OPTIONS.map(g => `<option>${g}</option>`).join('');
  }
}

export function renderCurrentMap() {
  updateIndicator();
  updateSearchListDropdown();
  updateAreaDropdown();

  mapStoreMarkers.forEach(m => map.removeLayer(m));
  mapAreaMarkers.forEach(m => map.removeLayer(m));
  setMapStoreMarkers([]);
  setMapAreaMarkers([]);

  const curMap = getCurrentMap();

  (curMap.areas || []).forEach(area => {
    const colorObj = AREA_COLORS.find(c => c.id === area.color) || AREA_COLORS[0];
    const areaIcon = L.divIcon({
      className: '',
      html: `<div class="area-custom-pin" style="background: ${colorObj.bg};">🚩 ${area.name}</div>`,
      iconSize: [null, null],
      iconAnchor: [30, 15]
    });
    const marker = L.marker([area.lat, area.lng], { icon: areaIcon }).addTo(map);
    marker.on('click', (e) => {
      L.DomEvent.stopPropagation(e);
      showAreaDetail(area.id);
    });
    mapAreaMarkers.push(marker);
  });

  (curMap.stores || []).forEach(store => {
    const marker = L.marker([store.lat, store.lng]).addTo(map);
    marker.on('click', (e) => {
      L.DomEvent.stopPropagation(e);
      showStoreDetail(store.id);
    });
    mapStoreMarkers.push(marker);
  });
}

export function updateIndicator() {
  const cur = getCurrentMap();
  const sharedTag = cur.isShared ? ' [共有閲覧]' : '';
  document.getElementById('map-indicator').innerText = `店舗: ${cur ? cur.stores.length : 0}/200 📋${sharedTag}`;
}

export function updateSearchListDropdown() {
  const cur = getCurrentMap();
  const select = document.getElementById('search-list');
  if (!select) return;
  const currentVal = select.value;
  let html = '<option value="">全てのリスト</option>';
  if (cur && cur.lists) {
    cur.lists.forEach(l => { html += `<option value="${l.id}">${l.name}</option>`; });
  }
  select.innerHTML = html;
  select.value = currentVal;
}

export function updateAreaDropdown() {
  const cur = getCurrentMap();
  const select = document.getElementById('area-select');
  if (!select) return;
  let html = '<option value="">エリア移動</option>';
  if (cur && cur.areas) {
    cur.areas.forEach((a, i) => { html += `<option value="${i}">${a.name}</option>`; });
  }
  select.innerHTML = html;
}

export function moveToArea(index) {
  if (index === "") return;
  const cur = getCurrentMap();
  const area = cur.areas[index];
  if (area) map.setView([area.lat, area.lng], 15);
}

window.moveToArea = moveToArea;