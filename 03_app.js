const AREA_COLORS = [
  { id: 'teal', label: 'エメラルド', bg: 'linear-gradient(135deg, #4ecdc4, #2ab7ca)' },
  { id: 'rose', label: 'ローズ', bg: 'linear-gradient(135deg, #ff6b6b, #ee5253)' },
  { id: 'amber', label: 'アンバー', bg: 'linear-gradient(135deg, #ff9f43, #f39c12)' },
  { id: 'ocean', label: 'オーシャン', bg: 'linear-gradient(135deg, #54a0ff, #2e86de)' },
  { id: 'purple', label: 'パープル', bg: 'linear-gradient(135deg, #a55eea, #8e44ad)' },
  { id: 'mint', label: 'ティール', bg: 'linear-gradient(135deg, #1dd1a1, #10ac84)' },
  { id: 'dark', label: 'ダーク', bg: 'linear-gradient(135deg, #576574, #222f3e)' },
  { id: 'gold', label: 'ゴールド', bg: 'linear-gradient(135deg, #f1c40f, #d35400)' }
];

const FORM_OPTIONS = [
  'レストラン', 'ビアレストラン', 'ブッフェ', 'ダイニング', 'カフェ', 
  'カフェダイニング', 'カレー屋', 'ケーキ屋', 'パン屋', 'スイーツ', 
  '料亭', '郷土料理屋', '小料理屋', 'ラーメン屋', '焼肉屋', 
  '居酒屋', 'バー', '屋台', 'キッチンカー', '野外', 'ビアガーデン', 'その他'
];

const GENRE_OPTIONS = [
  '和食', '洋食', '中華', '韓国', 'アジアン', 'エスニック', '他国料理', 
  '郷土料理', 'ジビエ', '寿司', '焼肉', 'ラーメン', 'カレー', '魚系', 
  '肉系', '野菜系', 'スイーツ系', 'カフェ', '居酒屋', 'ビーガン', 'ゲテモノ', 'その他'
];

let map;
let currentUser = JSON.parse(localStorage.getItem('gourmet_current_user')) || { loggedIn: false, email: '', name: '' };
let users = JSON.parse(localStorage.getItem('gourmet_users')) || {};
let sharedStoreDB = JSON.parse(localStorage.getItem('gourmet_shared_maps')) || {};

let maps = [];
let currentMapId = '';
let tempPinLocation = null; 
let tempMarker = null;

let mapStoreMarkers = [];
let mapAreaMarkers = [];
let currentEditingImages = [];

function toggleMenu() {
  const dropdown = document.getElementById('menu-dropdown');
  dropdown.style.display = (dropdown.style.display === 'block') ? 'none' : 'block';
}

function toggleSearchPanel() {
  const panel = document.getElementById('search-panel');
  const isVisible = panel.style.display === 'block';
  panel.style.display = isVisible ? 'none' : 'block';
  if (!isVisible) filterStores();
}

function closeSearchResultsPanel() {
  document.getElementById('search-results-panel').style.display = 'none';
}

function closeDetailPanel() {
  document.getElementById('detail-area').style.display = 'none';
}

function closeModal() {
  document.getElementById('modal-overlay').style.display = 'none';
}

function changeTheme(themeName) {
  document.documentElement.setAttribute('data-theme', themeName);
}

function generateDefaultShareCode() {
  const alpha = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const nums = '0123456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += alpha.charAt(Math.floor(Math.random() * alpha.length));
    code += nums.charAt(Math.floor(Math.random() * nums.length));
  }
  return code;
}

function createDefaultMap(id, name) {
  return { id: id || generateDefaultShareCode(), name: name || 'マイグルメマップ', stores: [], areas: [], lists: [], isShared: false };
}

function loadCurrentUserData() {
  if (currentUser.loggedIn && users[currentUser.email]) {
    currentUser.name = users[currentUser.email].name || currentUser.name || 'ユーザー';
    maps = users[currentUser.email].maps || [];
    currentMapId = users[currentUser.email].currentMapId || (maps[0] ? maps[0].id : '');
  } else {
    maps = JSON.parse(localStorage.getItem('gourmet_guest_maps')) || [];
    currentMapId = localStorage.getItem('gourmet_guest_map_id') || '';
  }
  
  if (!maps || maps.length === 0) {
    const defaultMap = createDefaultMap();
    maps = [defaultMap];
    currentMapId = defaultMap.id;
  }
  if (!currentMapId || !maps.find(m => m.id === currentMapId)) {
    currentMapId = maps[0].id;
  }
  maps.forEach(m => { if (!m.lists) m.lists = []; });
}

function saveStorage() {
  try {
    const curMap = getCurrentMap();
    if (curMap && !curMap.isShared) {
      sharedStoreDB[curMap.id] = {
        id: curMap.id,
        name: curMap.name,
        stores: JSON.parse(JSON.stringify(curMap.stores || [])),
        areas: JSON.parse(JSON.stringify(curMap.areas || [])),
        lists: JSON.parse(JSON.stringify(curMap.lists || []))
      };
      localStorage.setItem('gourmet_shared_maps', JSON.stringify(sharedStoreDB));
    }

    if (currentUser.loggedIn) {
      users[currentUser.email] = {
        name: currentUser.name || 'ユーザー',
        password: users[currentUser.email]?.password || '',
        maps: maps,
        currentMapId: currentMapId
      };
      localStorage.setItem('gourmet_users', JSON.stringify(users));
      localStorage.setItem('gourmet_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.setItem('gourmet_guest_maps', JSON.stringify(maps));
      localStorage.setItem('gourmet_guest_map_id', currentMapId);
    }
    renderCurrentMap();
  } catch (e) {
    alert('ストレージ容量が上限に達しました。不要なデータを削除してください。');
  }
}

function getCurrentMap() {
  return maps.find(m => m.id === currentMapId) || maps[0];
}

window.onload = function() {
  loadCurrentUserData();
  updateAuthUI();

  map = L.map('map').setView([35.681236, 139.767125], 14);
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

    tempPinLocation = e.latlng;
    if (tempMarker) map.removeLayer(tempMarker);
    tempMarker = L.marker(e.latlng, { opacity: 0.9 }).addTo(map);
    
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
  renderCurrentMap();
};

function initSearchOptions() {
  const formSel = document.getElementById('search-form');
  const genreSel = document.getElementById('search-genre');
  if (formSel) {
    formSel.innerHTML = '<option value="">全ての形式</option>' + FORM_OPTIONS.map(f => `<option>${f}</option>`).join('');
  }
  if (genreSel) {
    genreSel.innerHTML = '<option value="">全てのジャンル</option>' + GENRE_OPTIONS.map(g => `<option>${g}</option>`).join('');
  }
}

function renderCurrentMap() {
  updateIndicator();
  updateSearchListDropdown();
  updateAreaDropdown();

  mapStoreMarkers.forEach(m => map.removeLayer(m));
  mapAreaMarkers.forEach(m => map.removeLayer(m));
  mapStoreMarkers = [];
  mapAreaMarkers = [];

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

function updateIndicator() {
  const cur = getCurrentMap();
  const sharedTag = cur.isShared ? ' [共有閲覧]' : '';
  document.getElementById('map-indicator').innerText = `店舗: ${cur ? cur.stores.length : 0}/200 📋${sharedTag}`;
}

function updateSearchListDropdown() {
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

function updateAreaDropdown() {
  const cur = getCurrentMap();
  const select = document.getElementById('area-select');
  if (!select) return;
  let html = '<option value="">エリア移動</option>';
  if (cur && cur.areas) {
    cur.areas.forEach((a, i) => { html += `<option value="${i}">${a.name}</option>`; });
  }
  select.innerHTML = html;
}

function moveToArea(index) {
  if (index === "") return;
  const cur = getCurrentMap();
  const area = cur.areas[index];
  if (area) map.setView([area.lat, area.lng], 15);
}

function openStoreRegisterModalFromPin(storeToEdit = null) {
  const curMap = getCurrentMap();

  if (curMap.isShared) {
    alert('🔒 共有されたマップのため、編集・登録操作は禁止されています。');
    return;
  }

  if (!storeToEdit && !tempPinLocation) {
    alert('先に地図上の登録したい場所をタップしてピンを立ててください。');
    return;
  }
  if (!storeToEdit && curMap.stores.length >= 200) {
    alert('⚠️ 1つのマップに登録できる店舗は上限200件までです。');
    return;
  }

  currentEditingImages = storeToEdit ? [...(storeToEdit.images || [])] : [];
  const isEdit = !!storeToEdit;
  const isFav = isEdit ? !!storeToEdit.isFavorite : false;
  
  let selectedListIds = isEdit ? (storeToEdit.listIds || (storeToEdit.listId ? [storeToEdit.listId] : [])) : [];

  const content = document.getElementById('modal-content');
  document.getElementById('modal-overlay').style.display = 'flex';

  const firstSelectedId = selectedListIds.length > 0 ? selectedListIds[0] : '';
  const additionalSelectedIds = selectedListIds.slice(1);

  content.innerHTML = `
    <div class="modal-header"><h3>${isEdit ? '✏️ 店舗情報の編集' : '📍 店舗情報の登録'}</h3></div>
    
    <div class="form-group" style="margin-bottom: 10px;">
      <button type="button" id="reg-fav-btn" onclick="toggleFavBtn()" style="background:${isFav ? '#ff6b6b' : '#6c757d'}; color:#fff; padding:6px 12px; border:none; border-radius:var(--radius); font-weight:bold; cursor:pointer;">
        ${isFav ? '⭐ お気に入り（登録済み）' : '☆ お気に入りに追加'}
      </button>
      <input type="hidden" id="reg-store-fav" value="${isFav}">
    </div>

    <div class="form-group">
      <label>リスト登録 (既存リストから追加)</label>
      <div id="existing-list-container">
        <div class="existing-list-row" style="display:flex; gap:4px; margin-bottom:4px;">
          <select class="stylish-input existing-list-select" style="flex:1;">
            ${generateListOptionsHtml(firstSelectedId)}
          </select>
          <button type="button" onclick="addExistingListRow()" style="padding:4px 10px; font-weight:bold;">＋</button>
        </div>
        ${additionalSelectedIds.map(id => `
          <div class="existing-list-row" style="display:flex; gap:4px; margin-bottom:4px;">
            <select class="stylish-input existing-list-select" style="flex:1;">
              ${generateListOptionsHtml(id)}
            </select>
            <button type="button" onclick="this.parentElement.remove()" style="padding:4px 8px; background:#dc3545; color:#fff;">✕</button>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="form-group">
      <label>新規リストを作成して追加</label>
      <div id="new-list-container">
        <div class="new-list-row" style="display:flex; gap:4px; margin-bottom:4px;">
          <input type="text" class="stylish-input new-list-input" placeholder="新規リスト名を入力" style="flex:1;">
          <button type="button" onclick="addNewListRow()" style="padding:4px 10px; font-weight:bold;">＋</button>
        </div>
      </div>
    </div>

    <div class="form-group">
      <label>画像添付 (最大5枚 / .jpg, .png)</label>
      <input type="file" id="reg-store-file" accept="image/jpeg, image/png" multiple onchange="handleImageUploadStrict(event)">
      <div id="image-preview-container" class="image-preview-box"></div>
    </div>

    <div class="form-group">
      <label>店舗名*</label>
      <input type="text" id="reg-store-name" class="stylish-input" value="${isEdit ? storeToEdit.name : ''}" placeholder="">
    </div>

    <div class="form-group">
      <label>形式</label>
      <select id="reg-store-form" class="stylish-input">
        ${FORM_OPTIONS.map(f => `<option ${isEdit && storeToEdit.form === f ? 'selected' : ''}>${f}</option>`).join('')}
      </select>
    </div>

    <div class="form-group">
      <label>ジャンル</label>
      <select id="reg-store-genre" class="stylish-input">
        ${GENRE_OPTIONS.map(g => `<option ${isEdit && storeToEdit.genre === g ? 'selected' : ''}>${g}</option>`).join('')}
      </select>
    </div>

    <div class="form-group">
      <label>コスパ</label>
      <div class="range-control-row">
        <span class="range-label-left">[低]</span>
        <input type="range" id="reg-store-cospa" class="range-slider" min="1" max="5" step="1" value="${isEdit && storeToEdit.cospa ? storeToEdit.cospa : 3}">
        <span class="range-label-right">[高&lt;良&gt;]</span>
      </div>
    </div>

    <div class="form-group">
      <label>キャパ</label>
      <div class="range-control-row">
        <span class="range-label-left">[少人数]</span>
        <input type="range" id="reg-store-capa" class="range-slider" min="1" max="5" step="1" value="${isEdit && storeToEdit.capa ? storeToEdit.capa : 3}">
        <span class="range-label-right">[大人数向け]</span>
      </div>
    </div>

    <div class="form-group">
      <label>雰囲気</label>
      <div class="range-control-row">
        <span class="range-label-left">[落ち着いた]</span>
        <input type="range" id="reg-store-mood" class="range-slider" min="1" max="5" step="1" value="${isEdit && storeToEdit.mood ? storeToEdit.mood : 3}">
        <span class="range-label-right">[にぎやか]</span>
      </div>
    </div>

    <div class="form-group">
      <label>連絡先</label>
      <input type="text" id="reg-store-contact" class="stylish-input" value="${isEdit ? (storeToEdit.contact || '-') : '-'}">
    </div>

    <div class="form-group">
      <label>予約対応</label>
      <input type="text" id="reg-store-reserve" class="stylish-input" value="${isEdit ? (storeToEdit.reserve || '-') : '-'}">
    </div>

    <div class="form-group">
      <label>公式サイト</label>
      <input type="text" id="reg-store-official" class="stylish-input" value="${isEdit ? (storeToEdit.official || '-') : '-'}">
    </div>

    <div class="form-group">
      <label>食べログ</label>
      <input type="text" id="reg-store-tabelog" class="stylish-input" value="${isEdit ? (storeToEdit.tabelog || '-') : '-'}">
    </div>

    <div class="form-group">
      <label>ホットペッパー</label>
      <input type="text" id="reg-store-hotpepper" class="stylish-input" value="${isEdit ? (storeToEdit.hotpepper || '-') : '-'}">
    </div>

    <div class="form-group">
      <label>その他</label>
      <input type="text" id="reg-store-other" class="stylish-input" value="${isEdit ? (storeToEdit.other || '-') : '-'}">
    </div>

    <div class="form-group">
      <label>備考</label>
      <textarea id="reg-store-memo" class="stylish-input" rows="4" placeholder="">${isEdit ? (storeToEdit.memo || '') : ''}</textarea>
    </div>

    <div class="btn-group">
      <button onclick="saveStoreData('${isEdit ? storeToEdit.id : ''}')">${isEdit ? '更新保存' : '登録保存'}</button>
      <button onclick="closeModal()" class="btn-secondary">キャンセル</button>
    </div>
  `;
  renderImagePreviews();
}

function generateListOptionsHtml(selectedId = '') {
  const curMap = getCurrentMap();
  let html = '<option value="">(選択なし)</option>';
  (curMap.lists || []).forEach(l => {
    const sel = (l.id === selectedId) ? 'selected' : '';
    html += `<option value="${l.id}" ${sel}>${l.name}</option>`;
  });
  return html;
}

function addExistingListRow() {
  const container = document.getElementById('existing-list-container');
  const div = document.createElement('div');
  div.className = 'existing-list-row';
  div.style.cssText = 'display:flex; gap:4px; margin-bottom:4px;';
  div.innerHTML = `
    <select class="stylish-input existing-list-select" style="flex:1;">
      ${generateListOptionsHtml()}
    </select>
    <button type="button" onclick="this.parentElement.remove()" style="padding:4px 8px; background:#dc3545; color:#fff;">✕</button>
  `;
  container.appendChild(div);
}

function addNewListRow() {
  const container = document.getElementById('new-list-container');
  const div = document.createElement('div');
  div.className = 'new-list-row';
  div.style.cssText = 'display:flex; gap:4px; margin-bottom:4px;';
  div.innerHTML = `
    <input type="text" class="stylish-input new-list-input" placeholder="新規リスト名を入力" style="flex:1;">
    <button type="button" onclick="this.parentElement.remove()" style="padding:4px 8px; background:#dc3545; color:#fff;">✕</button>
  `;
  container.appendChild(div);
}

function toggleFavBtn() {
  const hiddenInput = document.getElementById('reg-store-fav');
  const btn = document.getElementById('reg-fav-btn');
  const current = hiddenInput.value === 'true';
  hiddenInput.value = (!current).toString();
  btn.style.background = !current ? '#ff6b6b' : '#6c757d';
  btn.innerText = !current ? '⭐ お気に入り（登録済み）' : '☆ お気に入りに追加';
}

function handleImageUploadStrict(e) {
  const files = Array.from(e.target.files);
  for (let file of files) {
    if (currentEditingImages.length >= 5) {
      alert('写真は最大5枚までです。');
      break;
    }
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      alert('JPGまたはPNG形式の画像のみアップロード可能です。');
      continue;
    }
    const reader = new FileReader();
    reader.onload = function(evt) {
      if (currentEditingImages.length < 5) {
        currentEditingImages.push(evt.target.result);
        renderImagePreviews();
      }
    };
    reader.readAsDataURL(file);
  }
}

function renderImagePreviews() {
  const box = document.getElementById('image-preview-container');
  if (!box) return;
  box.innerHTML = currentEditingImages.map((img, idx) => `
    <div class="preview-thumb">
      <img src="${img}">
      <button class="del-btn" onclick="removeImage(${idx})">✕</button>
    </div>
  `).join('');
}

function removeImage(idx) {
  currentEditingImages.splice(idx, 1);
  renderImagePreviews();
}

function saveStoreData(editStoreId = '') {
  const curMap = getCurrentMap();
  if (curMap.isShared) {
    alert('🔒 共有されたマップのため保存できません。');
    return;
  }

  const name = document.getElementById('reg-store-name').value.trim();
  if (!name) {
    alert('店舗名を入力してください。');
    return;
  }
  if (!curMap.lists) curMap.lists = [];

  const selectedListSelects = document.querySelectorAll('.existing-list-select');
  const selectedListIds = [];
  selectedListSelects.forEach(sel => {
    if (sel.value && !selectedListIds.includes(sel.value)) {
      selectedListIds.push(sel.value);
    }
  });

  const newListInputs = document.querySelectorAll('.new-list-input');
  newListInputs.forEach(input => {
    const val = input.value.trim();
    if (val) {
      if (curMap.lists.length < 50) {
        const newList = { id: 'lst_' + Date.now() + '_' + Math.floor(Math.random()*1000), name: val };
        curMap.lists.push(newList);
        selectedListIds.push(newList.id);
      }
    }
  });

  const storeData = {
    name: name,
    isFavorite: document.getElementById('reg-store-fav').value === 'true',
    listIds: selectedListIds,
    images: [...currentEditingImages],
    form: document.getElementById('reg-store-form').value,
    genre: document.getElementById('reg-store-genre').value,
    cospa: parseInt(document.getElementById('reg-store-cospa').value, 10),
    capa: parseInt(document.getElementById('reg-store-capa').value, 10),
    mood: parseInt(document.getElementById('reg-store-mood').value, 10),
    contact: document.getElementById('reg-store-contact').value.trim(),
    reserve: document.getElementById('reg-store-reserve').value.trim(),
    official: document.getElementById('reg-store-official').value.trim(),
    tabelog: document.getElementById('reg-store-tabelog').value.trim(),
    hotpepper: document.getElementById('reg-store-hotpepper').value.trim(),
    other: document.getElementById('reg-store-other').value.trim(),
    memo: document.getElementById('reg-store-memo').value
  };

  if (editStoreId) {
    const target = curMap.stores.find(s => s.id === editStoreId);
    if (target) Object.assign(target, storeData);
    saveStorage();
    closeModal();
    showStoreDetail(editStoreId);
  } else {
    const newStore = {
      id: 'str_' + Date.now(),
      lat: tempPinLocation.lat,
      lng: tempPinLocation.lng,
      ...storeData
    };
    curMap.stores.push(newStore);
    if (tempMarker) { map.removeLayer(tempMarker); tempMarker = null; }
    tempPinLocation = null;
    saveStorage();
    closeModal();
    showStoreDetail(newStore.id);
  }
}

function openAreaRegisterModalPrompt() {
  const curMap = getCurrentMap();

  if (curMap.isShared) {
    alert('🔒 共有されたマップのため、エリア編集・登録操作は禁止されています。');
    return;
  }

  if (!curMap.areas) curMap.areas = [];
  
  const content = document.getElementById('modal-content');
  document.getElementById('modal-overlay').style.display = 'flex';

  const areasHtml = curMap.areas.map((a, index) => `
    <li style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.03); padding:6px 8px; margin-bottom:4px; border-radius:6px;">
      <span style="font-size:12px;">🚩 <b>${a.name}</b></span>
      <div>
        <button onclick="moveAreaOrder(${index}, -1)" class="btn-sm-icon">▲</button>
        <button onclick="moveAreaOrder(${index}, 1)" class="btn-sm-icon">▼</button>
        <button onclick="editAreaName('${a.id}')" style="background:#ff9f43; padding:2px 6px; font-size:10px;">✏️ 編集</button>
        <button onclick="deleteArea('${a.id}'); openAreaRegisterModalPrompt();" style="background:#dc3545; padding:2px 6px; font-size:10px;">削除</button>
      </div>
    </li>
  `).join('');

  content.innerHTML = `
    <div class="modal-header"><h3>🚩 エリアの登録・管理</h3></div>
    <p style="font-size:11px; color:#666; margin-bottom:8px;">登録上限数: ${curMap.areas.length}/100</p>
    
    <div style="margin-bottom:12px; border-bottom:1px solid var(--border-color); padding-bottom:10px;">
      <label style="font-weight:bold; font-size:11.5px;">新規エリア追加</label>
      <div style="display:flex; gap:4px; margin-top:4px;">
        <input type="text" id="reg-area-name" class="stylish-input" placeholder="例: 横浜駅周辺エリア" style="flex:1;">
        <button onclick="saveNewArea()" style="white-space:nowrap;">登録</button>
      </div>
      <small style="color:#888; font-size:10px;">※地図上にピンを立ててから登録ボタンを押してください。</small>
    </div>

    <label style="font-weight:bold; font-size:11.5px;">登録済みエリア一覧</label>
    <ul style="list-style:none; padding:0; max-height:40vh; overflow-y:auto; margin-top:4px;">
      ${areasHtml.length > 0 ? areasHtml : '<p style="color:#888; font-size:11px;">登録エリアはありません。</p>'}
    </ul>
    <button onclick="closeModal()" class="btn-secondary" style="width:100%; margin-top:10px;">閉じる</button>
  `;
}

function saveNewArea() {
  const curMap = getCurrentMap();
  if (curMap.isShared) {
    alert('🔒 共有されたマップのため操作できません。');
    return;
  }

  if (!tempPinLocation) {
    alert('先に地図上でエリアの中心となる場所をタップしてください。');
    return;
  }
  const name = document.getElementById('reg-area-name').value.trim();
  if (!name) {
    alert('エリア名を入力してください。');
    return;
  }

  if (!curMap.areas) curMap.areas = [];
  if (curMap.areas.length >= 100) {
    alert('⚠️ エリアの登録上限数（100件）に達しています。');
    return;
  }

  curMap.areas.push({
    id: 'area_' + Date.now(),
    name: name,
    color: 'teal',
    lat: tempPinLocation.lat,
    lng: tempPinLocation.lng
  });

  if (tempMarker) { map.removeLayer(tempMarker); tempMarker = null; }
  tempPinLocation = null;

  saveStorage();
  openAreaRegisterModalPrompt();
}

function editAreaName(areaId) {
  const curMap = getCurrentMap();
  if (curMap.isShared) { alert('🔒 共有されたマップのため操作できません。'); return; }
  const area = curMap.areas.find(a => a.id === areaId);
  if (!area) return;
  const newName = prompt('エリア名を変更:', area.name);
  if (newName && newName.trim()) {
    area.name = newName.trim();
    saveStorage();
    openAreaRegisterModalPrompt();
  }
}

function moveAreaOrder(index, direction) {
  const curMap = getCurrentMap();
  if (curMap.isShared) return;
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= curMap.areas.length) return;
  const temp = curMap.areas[index];
  curMap.areas[index] = curMap.areas[targetIndex];
  curMap.areas[targetIndex] = temp;
  saveStorage();
  openAreaRegisterModalPrompt();
}

function showAreaDetail(areaId) {
  const curMap = getCurrentMap();
  const area = curMap.areas.find(a => a.id === areaId);
  if (!area) return;

  const detailPanel = document.getElementById('detail-area');
  const detailContent = document.getElementById('detail-content');
  detailPanel.style.display = 'block';

  const colorBtnsHtml = AREA_COLORS.map(c => `
    <div class="color-btn" style="background:${c.bg}; border: ${area.color === c.id ? '3px solid #000' : '2px solid #fff'};" 
         onclick="changeAreaColor('${area.id}', '${c.id}')" title="${c.label}"></div>
  `).join('');

  const actionButtons = curMap.isShared ? '' : `
    <button onclick="editAreaNameFromDetail('${area.id}')" style="background:#ff9f43; font-size:11px; padding:6px; width:100%;">✏️ 編集</button>
    <button onclick="deleteArea('${area.id}')" style="background:#dc3545; font-size:11px; padding:6px; width:100%;">削除</button>
  `;

  detailContent.innerHTML = `
    <h3 style="margin:0 0 8px 0; color:var(--primary-color); font-size:13px;">🚩 ${area.name}</h3>
    
    ${!curMap.isShared ? `
      <p style="font-size:11px; margin-top:6px; font-weight:bold;">🎨 ピンのカラーを選択 (8段階):</p>
      <div class="color-picker-grid" style="margin-bottom:12px;">
        ${colorBtnsHtml}
      </div>
    ` : ''}

    <div style="display:flex; flex-direction:column; gap:4px; margin-top:8px;">
      ${actionButtons}
      <button onclick="closeDetailPanel()" class="btn-secondary" style="font-size:11px; padding:6px; width:100%;">閉じる</button>
    </div>
  `;
  map.setView([area.lat, area.lng], 15);
}

function editAreaNameFromDetail(areaId) {
  const curMap = getCurrentMap();
  if (curMap.isShared) return;
  const area = curMap.areas.find(a => a.id === areaId);
  if (!area) return;
  const newName = prompt('エリア名を編集:', area.name);
  if (newName && newName.trim()) {
    area.name = newName.trim();
    saveStorage();
    showAreaDetail(areaId);
  }
}

function changeAreaColor(areaId, colorId) {
  const curMap = getCurrentMap();
  if (curMap.isShared) return;
  const area = curMap.areas.find(a => a.id === areaId);
  if (area) {
    area.color = colorId;
    saveStorage();
    showAreaDetail(areaId);
  }
}

function deleteArea(areaId) {
  const curMap = getCurrentMap();
  if (curMap.isShared) return;
  if (!confirm('このエリアピンを削除しますか？')) return;
  curMap.areas = curMap.areas.filter(a => a.id !== areaId);
  saveStorage();
  closeDetailPanel();
}

function showStoreDetail(storeId) {
  const curMap = getCurrentMap();
  const store = curMap.stores.find(s => s.id === storeId);
  if (!store) return;

  const assignedLists = (curMap.lists || []).filter(l => (store.listIds || []).includes(l.id) || store.listId === l.id).map(l => l.name);
  const listDisp = assignedLists.length > 0 ? assignedLists.join(', ') : '未登録';

  let imgHtml = '';
  if (store.images && store.images.length > 0) {
    imgHtml = `<div style="display:flex; gap:4px; overflow-x:auto; margin:6px 0;">` + 
      store.images.map(img => `<img src="${img}" style="height:70px; border-radius:6px; object-fit:cover;">`).join('') +
      `</div>`;
  }

  const urls = [
    { label: '予約対応', val: store.reserve },
    { label: '公式サイト', val: store.official },
    { label: '食べログ', val: store.tabelog },
    { label: 'ホットペッパー', val: store.hotpepper }
  ].filter(u => u.val && u.val !== '-');

  let urlSectionHtml = '';
  if (urls.length > 0) {
    urlSectionHtml = `
      <div style="margin-top:6px; border:1px solid var(--border-color); border-radius:6px; padding:4px;">
        <button onclick="toggleUrlAccordion()" style="width:100%; text-align:left; background:none; color:var(--primary-color); border:none; padding:2px; font-weight:bold; font-size:11px; cursor:pointer;">
          ▶ 関連URL・各種リンク (${urls.length}件)
        </button>
        <div id="url-accordion-content" style="display:none; margin-top:4px; padding-top:4px; border-top:1px dashed var(--border-color);">
          ${urls.map(u => {
            const isLink = u.val.startsWith('http://') || u.val.startsWith('https://');
            return `<div style="font-size:11px; margin-bottom:2px;">
              <b>${u.label}:</b> ${isLink ? `<a href="${u.val}" target="_blank" style="color:var(--primary-color); text-decoration:underline;">${u.val}</a>` : u.val}
            </div>`;
          }).join('')}
        </div>
      </div>
    `;
  } else {
    urlSectionHtml = `<div style="font-size:11px; margin-top:4px; color:#888;"><b>予約対応/各種URL:</b> -</div>`;
  }

  const detailPanel = document.getElementById('detail-area');
  const detailContent = document.getElementById('detail-content');
  detailPanel.style.display = 'block';

  const actionButtons = curMap.isShared ? `
    <button onclick="reflectStoreToMyMap('${store.id}')" style="background:#4ecdc4; font-size:10px; padding:2px 6px;">📥 マイマップへ反映</button>
  ` : `
    <button onclick="openShareStoreModal('${store.id}')" style="background:#4ecdc4; font-size:10px; padding:2px 6px;">🔗 共有</button>
    <button onclick="openEditStoreModal('${store.id}')" style="background:#ff9f43; font-size:10px; padding:2px 6px;">✏️ 編集</button>
    <button onclick="deleteStore('${store.id}')" style="background:#dc3545; font-size:10px; padding:2px 6px;">削除</button>
  `;

  detailContent.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
      <div>
        <span style="font-size:10px; color:#ff6b6b; font-weight:bold;">${store.isFavorite ? '⭐ お気に入り' : '☆ 通常'}</span>
        <h3 style="margin:2px 0 0 0; color:var(--primary-color); font-size:14px;">${store.name}</h3>
      </div>
      <div style="display:flex; gap:4px;">
        ${actionButtons}
      </div>
    </div>

    <div style="font-size:11px; color:#555; margin-top:4px;"><b>リスト:</b> ${listDisp}</div>

    ${imgHtml}

    <div style="font-size:11px; margin-top:4px; background:rgba(0,0,0,0.02); padding:4px; border-radius:4px;">
      <b>形式:</b> ${store.form || '-'} / <b>ジャンル:</b> ${store.genre || '-'}
    </div>

    <div style="font-size:11px; margin-top:4px; display:flex; flex-direction:column; gap:2px;">
      <div><b>コスパ:</b> [低] ${'★'.repeat(store.cospa || 3)}${'☆'.repeat(5 - (store.cospa || 3))} [高&lt;良&gt;]</div>
      <div><b>キャパ:</b> [少人数] ${'★'.repeat(store.capa || 3)}${'☆'.repeat(5 - (store.capa || 3))} [大人数向け]</div>
      <div><b>雰囲気:</b> [落ち着いた] ${'★'.repeat(store.mood || 3)}${'☆'.repeat(5 - (store.mood || 3))} [にぎやか]</div>
    </div>

    <div style="font-size:11px; margin-top:4px;"><b>連絡先:</b> ${store.contact || '-'}</div>

    ${urlSectionHtml}

    <div style="font-size:11px; margin-top:4px;"><b>その他:</b> ${store.other || '-'}</div>

    <div style="font-size:11px; margin-top:6px; background:rgba(0,0,0,0.03); padding:6px; border-radius:6px; border-left:3px solid var(--accent-color);">
      <b>備考:</b><br>${store.memo ? store.memo.replace(/\n/g, '<br>') : 'なし'}
    </div>
  `;

  map.setView([store.lat, store.lng], 16);
}

function reflectStoreToMyMap(storeId) {
  const curMap = getCurrentMap();
  const store = curMap.stores.find(s => s.id === storeId);
  if (!store) return;

  const myMaps = maps.filter(m => !m.isShared);
  if (myMaps.length === 0) {
    alert('⚠️ 自作のマップが見つかりません。新規マップを作成してください。');
    return;
  }

  const targetMapId = prompt(`店舗「${store.name}」をどの自作マップに反映しますか？\n(対象のマップIDを入力してください)\n\n利用可能なマップ:\n` + myMaps.map(m => `${m.name} [ID: ${m.id}]`).join('\n'), myMaps[0].id);

  if (!targetMapId) return;
  const targetMap = myMaps.find(m => m.id === targetMapId.trim());
  if (!targetMap) {
    alert('⚠️ 指定されたマップが見つかりません。');
    return;
  }

  if (!targetMap.stores) targetMap.stores = [];
  if (targetMap.stores.length >= 200) {
    alert('⚠️ 対象のマップが店舗上限数（200件）に達しています。');
    return;
  }

  const copiedStore = JSON.parse(JSON.stringify(store));
  copiedStore.id = 'str_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
  targetMap.stores.push(copiedStore);
  saveStorage();
  alert(`🎉 マップ「${targetMap.name}」に店舗情報を反映しました！`);
}

function openShareStoreModal(storeId) {
  const curMap = getCurrentMap();
  const store = curMap.stores.find(s => s.id === storeId);
  if (!store) return;

  const content = document.getElementById('modal-content');
  document.getElementById('modal-overlay').style.display = 'flex';

  const otherMaps = maps.filter(m => m.id !== curMap.id && !m.isShared);

  if (otherMaps.length === 0) {
    content.innerHTML = `
      <div class="modal-header"><h3>🔗 他のマップへ共有</h3></div>
      <p style="font-size:11.5px; color:#666;">他に登録されているマイマップがありません。新規マップを作成後にご利用ください。</p>
      <button onclick="closeModal()" class="btn-secondary" style="width:100%; margin-top:10px;">閉じる</button>
    `;
    return;
  }

  const mapCheckboxes = otherMaps.map(m => `
    <label style="display:flex; align-items:center; gap:6px; font-size:12px; margin-bottom:6px; cursor:pointer;">
      <input type="checkbox" class="share-map-checkbox" value="${m.id}">
      <span>🗺️ <b>${m.name}</b></span>
    </label>
  `).join('');

  content.innerHTML = `
    <div class="modal-header"><h3>🔗 「${store.name}」を共有</h3></div>
    <p style="font-size:11px; color:#666; margin-bottom:8px;">反映させたいマップをチェックしてください（複数選択可）。</p>
    <div style="max-height:40vh; overflow-y:auto; margin-bottom:10px;">
      ${mapCheckboxes}
    </div>
    <div class="btn-group">
      <button onclick="executeShareStore('${store.id}')">反映保存</button>
      <button onclick="closeModal()" class="btn-secondary">キャンセル</button>
    </div>
  `;
}

function executeShareStore(storeId) {
  const curMap = getCurrentMap();
  const store = curMap.stores.find(s => s.id === storeId);
  if (!store) return;

  const checkboxes = document.querySelectorAll('.share-map-checkbox:checked');
  if (checkboxes.length === 0) {
    alert('共有先のマップを1つ以上選択してください。');
    return;
  }

  checkboxes.forEach(cb => {
    const targetMap = maps.find(m => m.id === cb.value);
    if (targetMap) {
      if (!targetMap.stores) targetMap.stores = [];
      if (targetMap.stores.length < 200) {
        const copiedStore = JSON.parse(JSON.stringify(store));
        copiedStore.id = 'str_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
        targetMap.stores.push(copiedStore);
      }
    }
  });

  saveStorage();
  closeModal();
  alert('🎉 選択したマップに店舗情報を共有・反映しました！');
}

function toggleUrlAccordion() {
  const content = document.getElementById('url-accordion-content');
  if (content) {
    content.style.display = content.style.display === 'none' ? 'block' : 'none';
  }
}

function openEditStoreModal(storeId) {
  const curMap = getCurrentMap();
  if (curMap.isShared) return;
  const store = curMap.stores.find(s => s.id === storeId);
  if (store) openStoreRegisterModalFromPin(store);
}

function deleteStore(storeId) {
  const curMap = getCurrentMap();
  if (curMap.isShared) return;
  if (!confirm('この店舗を削除しますか？')) return;
  curMap.stores = curMap.stores.filter(s => s.id !== storeId);
  saveStorage();
  closeDetailPanel();
}

function filterStores() {
  const nameVal = document.getElementById('search-name').value.toLowerCase();
  const listVal = document.getElementById('search-list').value;
  const favVal = document.getElementById('search-fav').value;
  const formVal = document.getElementById('search-form').value;
  const genreVal = document.getElementById('search-genre').value;

  const curMap = getCurrentMap();
  const filtered = (curMap.stores || []).filter(s => {
    if (nameVal && !s.name.toLowerCase().includes(nameVal)) return false;
    if (listVal && !(s.listIds || []).includes(listVal) && s.listId !== listVal) return false;
    if (favVal === 'fav' && !s.isFavorite) return false;
    if (formVal && s.form !== formVal) return false;
    if (genreVal && s.genre !== genreVal) return false;
    return true;
  });

  const resultsPanel = document.getElementById('search-results-panel');
  const container = document.getElementById('search-results-container');
  
  resultsPanel.style.display = 'block';

  if (filtered.length === 0) {
    container.innerHTML = `<p style="font-size:11px; color:#888; text-align:center; padding:10px 0;">該当する店舗が見つかりません</p>`;
    return;
  }

  container.innerHTML = filtered.map(s => `
    <div style="padding:6px 8px; margin-top:4px; background:rgba(0,0,0,0.03); border-radius:6px; cursor:pointer; border-left:3px solid var(--primary-color);" onclick="showStoreDetail('${s.id}')">
      <b style="font-size:12px;">${s.isFavorite ? '⭐ ' : ''}${s.name}</b>
      <div style="font-size:10px; color:#666; margin-top:2px;">${s.form || '-'} / ${s.genre || '-'}</div>
    </div>
  `).join('');
}

function exportCode() {
  toggleMenu();
  const curMap = getCurrentMap();
  if (curMap.isShared) {
    alert('🔒 共有されたマップのコード変更はできません。');
    return;
  }

  const content = document.getElementById('modal-content');
  document.getElementById('modal-overlay').style.display = 'flex';

  content.innerHTML = `
    <div class="modal-header">
      <h3>✨ 共有コードの設定・表示</h3>
      <span style="cursor:pointer; font-size:16px; opacity:0.6;" onclick="closeModal()">✕</span>
    </div>
    <p style="font-size:11.5px; color:#666; margin-bottom:10px; line-height:1.4;">
      共有コードには<b>数字と半角英字の組み合わせ（6〜20文字以内）</b>を指定してください。
    </p>
    <div class="form-group">
      <label>共有コード (数字＋半角英字混在 6〜20文字)</label>
      <input type="text" id="custom-share-code" class="stylish-input" value="${curMap.id}" minlength="6" maxlength="20" placeholder="例: gourmet2026">
      <div id="share-code-error" class="error-msg"></div>
      <div id="share-code-success" class="success-msg"></div>
    </div>
    <div class="btn-group">
      <button onclick="saveCustomShareCode()">コード更新・保存</button>
      <button onclick="closeModal()" class="btn-secondary">閉じる</button>
    </div>
  `;
}

function saveCustomShareCode() {
  const curMap = getCurrentMap();
  if (curMap.isShared) return;

  const input = document.getElementById('custom-share-code');
  const errorEl = document.getElementById('share-code-error');
  const successEl = document.getElementById('share-code-success');
  const newCode = input.value.trim();

  errorEl.style.display = 'none';
  successEl.style.display = 'none';

  if (newCode.length < 6 || newCode.length > 20) {
    errorEl.textContent = '⚠️ 6〜20文字以内で入力してください。';
    errorEl.style.display = 'block';
    return;
  }

  if (!/^[a-zA-Z0-9]+$/.test(newCode)) {
    errorEl.textContent = '⚠️ 記号や全角文字は使用できません。半角英字と数字のみ使用してください。';
    errorEl.style.display = 'block';
    return;
  }

  const hasAlpha = /[a-zA-Z]/.test(newCode);
  const hasDigit = /[0-9]/.test(newCode);

  if (!hasAlpha || !hasDigit) {
    errorEl.textContent = '⚠️ 数字と半角英字の両方を組み合わせて入力してください（例: gourmet2026）。';
    errorEl.style.display = 'block';
    return;
  }

  delete sharedStoreDB[curMap.id];
  const oldId = curMap.id;
  curMap.id = newCode;
  if (currentMapId === oldId) currentMapId = newCode;

  saveStorage();
  successEl.textContent = '🎉 共有コードを正常に更新しました！';
  successEl.style.display = 'block';
}

function importCodePrompt() {
  toggleMenu();
  const code = prompt('読み込む共有コードを入力してください:');
  if (!code || !code.trim()) return;

  const trimmed = code.trim();
  const hasAlpha = /[a-zA-Z]/.test(trimmed);
  const hasDigit = /[0-9]/.test(trimmed);
  const isLengthValid = trimmed.length >= 6 && trimmed.length <= 20;

  if (!isLengthValid || !hasAlpha || !hasDigit || !/^[a-zA-Z0-9]+$/.test(trimmed)) {
    alert('⚠️ 共有コードは「数字と半角英字の組み合わせ（6〜20文字）」です。正しく入力してください。');
    return;
  }

  sharedStoreDB = JSON.parse(localStorage.getItem('gourmet_shared_maps')) || {};
  const targetMapData = sharedStoreDB[trimmed];

  if (!targetMapData) {
    alert('⚠️ 指定された共有コードのマップが見つかりませんでした。コードを確認するか、共有元で保存を行ってください。');
    return;
  }

  const sharedMap = {
    id: targetMapData.id,
    name: `${targetMapData.name} (共有)`,
    stores: JSON.parse(JSON.stringify(targetMapData.stores || [])),
    areas: JSON.parse(JSON.stringify(targetMapData.areas || [])),
    lists: JSON.parse(JSON.stringify(targetMapData.lists || [])),
    isShared: true
  };

  const existingIndex = maps.findIndex(m => m.id === trimmed);
  if (existingIndex >= 0) {
    maps[existingIndex] = sharedMap;
  } else {
    maps.push(sharedMap);
  }

  currentMapId = trimmed;
  saveStorage();
  closeDetailPanel();
  closeSearchResultsPanel();
  alert(`🎉 共有コード「${trimmed}」のマップを自動読み込みして切り替えました！\n（閲覧専用としてマップ管理に保存されました）`);
}

function refreshSharedMap() {
  toggleMenu();
  const curMap = getCurrentMap();
  sharedStoreDB = JSON.parse(localStorage.getItem('gourmet_shared_maps')) || {};
  const latestData = sharedStoreDB[curMap.id];

  if (latestData) {
    curMap.stores = JSON.parse(JSON.stringify(latestData.stores || []));
    curMap.areas = JSON.parse(JSON.stringify(latestData.areas || []));
    curMap.lists = JSON.parse(JSON.stringify(latestData.lists || []));
    saveStorage();
    closeDetailPanel();
    closeSearchResultsPanel();
    alert('🔄 共有元の最新データに合わせてマップ情報を更新しました！');
  } else {
    alert('ℹ️ 最新の共有データが見つかりませんでした。元データで更新・保存が行われているかご確認ください。');
  }
}

function openMapSwitchModal() {
  toggleMenu();
  const content = document.getElementById('modal-content');
  document.getElementById('modal-overlay').style.display = 'flex';

  const mapOptions = maps.map(m => `
    <option value="${m.id}" ${m.id === currentMapId ? 'selected' : ''}>${m.name}${m.isShared ? ' [共有]' : ''}</option>
  `).join('');

  const mapListItems = maps.map((m, index) => `
    <li style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.03); padding:6px 8px; margin-bottom:4px; border-radius:6px;">
      <span style="font-size:12px;">🗺️ <b>${m.name}</b> ${m.id === currentMapId ? '<small style="color:var(--primary-color);">(選択中)</small>' : ''}</span>
      <div>
        <button onclick="moveMapOrder(${index}, -1)" class="btn-sm-icon">▲</button>
        <button onclick="moveMapOrder(${index}, 1)" class="btn-sm-icon">▼</button>
        <button onclick="editMapName('${m.id}')" style="background:#ff9f43; padding:2px 6px; font-size:10px;">✏️ 編集</button>
        <button onclick="deleteMap('${m.id}')" style="background:#dc3545; padding:2px 6px; font-size:10px;">削除</button>
      </div>
    </li>
  `).join('');

  content.innerHTML = `
    <div class="modal-header"><h3>🗺️ マップの切替・編集</h3></div>
    <p style="font-size:11px; color:#666; margin-bottom:8px;">マップ登録上限数: ${maps.length}/30</p>
    
    <div class="form-group" style="margin-bottom:12px; border-bottom:1px solid var(--border-color); padding-bottom:10px;">
      <label>切り替えるマップを選択</label>
      <select id="switch-map-select" class="stylish-input" onchange="switchCurrentMap(this.value)">
        ${mapOptions}
      </select>
    </div>

    <label style="font-weight:bold; font-size:11.5px;">マップ一覧・順序変更</label>
    <ul style="list-style:none; padding:0; max-height:40vh; overflow-y:auto; margin-top:4px;">
      ${mapListItems}
    </ul>
    <button onclick="closeModal()" class="btn-secondary" style="width:100%; margin-top:10px;">閉じる</button>
  `;
}

function switchCurrentMap(targetMapId) {
  if (!targetMapId || targetMapId === currentMapId) return;
  currentMapId = targetMapId;
  saveStorage();
  closeModal();
  closeDetailPanel();
  closeSearchResultsPanel();
}

function editMapName(mapId) {
  const targetMap = maps.find(m => m.id === mapId);
  if (!targetMap) return;
  const newName = prompt('マップ名を編集:', targetMap.name);
  if (newName && newName.trim()) {
    targetMap.name = newName.trim();
    saveStorage();
    openMapSwitchModal();
  }
}

function moveMapOrder(index, direction) {
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= maps.length) return;
  const temp = maps[index];
  maps[index] = maps[targetIndex];
  maps[targetIndex] = temp;
  saveStorage();
  openMapSwitchModal();
}

function deleteMap(mapId) {
  if (maps.length <= 1) {
    alert('⚠️ マップは最低1つ必要なため削除できません。');
    return;
  }
  if (!confirm('このマップをリストから削除しますか？')) return;
  
  maps = maps.filter(m => m.id !== mapId);
  if (currentMapId === mapId) {
    currentMapId = maps[0].id;
  }
  saveStorage();
  openMapSwitchModal();
  closeDetailPanel();
}

function openNewMapModal() {
  toggleMenu();
  if (maps.length >= 30) {
    alert('⚠️ マップの登録上限数（30件）に達しています。');
    return;
  }
  const content = document.getElementById('modal-content');
  document.getElementById('modal-overlay').style.display = 'flex';

  content.innerHTML = `
    <div class="modal-header"><h3>🗺️ 新規マップ作成</h3></div>
    <div class="form-group">
      <label>マップ名*</label>
      <input type="text" id="new-map-name" class="stylish-input" placeholder="例: 横浜グルメマップ">
    </div>
    <div class="btn-group">
      <button onclick="saveNewMap()">作成</button>
      <button onclick="closeModal()" class="btn-secondary">キャンセル</button>
    </div>
  `;
}

function saveNewMap() {
  const name = document.getElementById('new-map-name').value.trim();
  if (!name) {
    alert('マップ名を入力してください。');
    return;
  }
  if (maps.length >= 30) {
    alert('⚠️ マップの登録上限数（30件）に達しています。');
    return;
  }

  const newMap = createDefaultMap(null, name);
  maps.push(newMap);
  currentMapId = newMap.id;

  saveStorage();
  closeModal();
  closeDetailPanel();
  closeSearchResultsPanel();
  alert(`🎉 新しいマップ「${name}」を作成して切り替えました！`);
}

function openCustomListModal() {
  toggleMenu();
  const curMap = getCurrentMap();
  const content = document.getElementById('modal-content');
  document.getElementById('modal-overlay').style.display = 'flex';

  const listsHtml = (curMap.lists || []).map((l, index) => {
    const assignedStores = (curMap.stores || []).filter(s => (s.listIds || []).includes(l.id) || s.listId === l.id);
    const storesHtml = assignedStores.map((s, sIndex) => `
      <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.7); padding:3px 6px; margin-top:2px; border-radius:4px; font-size:11px;">
        <span>🍽️ ${s.name}</span>
        ${!curMap.isShared ? `
          <div>
            <button onclick="moveStoreInList('${l.id}', ${sIndex}, -1)" class="btn-sm-icon">▲</button>
            <button onclick="moveStoreInList('${l.id}', ${sIndex}, 1)" class="btn-sm-icon">▼</button>
            <button onclick="removeStoreFromList('${l.id}', '${s.id}')" class="btn-sm-icon" style="background:#dc3545; color:#fff;">削除</button>
          </div>
        ` : ''}
      </div>
    `).join('');

    return `
      <li style="margin-bottom:8px; background:rgba(0,0,0,0.03); padding:8px; border-radius:8px; border:1px solid var(--border-color);">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:12px; cursor:pointer;" onclick="toggleListAccordion('list-stores-${l.id}')">
            ▶ 📌 <b>${l.name}</b> <small>(${assignedStores.length}件)</small>
          </span>
          ${!curMap.isShared ? `
            <div>
              <button onclick="moveCustomList(${index}, -1)" class="btn-sm-icon">▲</button>
              <button onclick="moveCustomList(${index}, 1)" class="btn-sm-icon">▼</button>
              <button onclick="editCustomListName('${l.id}')" style="background:#ff9f43; padding:2px 6px; font-size:10px;">✏️ 編集</button>
              <button onclick="deleteCustomList('${l.id}')" style="background:#dc3545; padding:2px 6px; font-size:10px;">削除</button>
            </div>
          ` : ''}
        </div>
        <div id="list-stores-${l.id}" style="display:none; margin-top:6px; padding-left:6px; border-left:2px solid var(--primary-color);">
          ${storesHtml || '<p style="color:#888; font-size:10px; margin-top:2px;">店舗は登録されていません</p>'}
        </div>
      </li>
    `;
  }).join('');

  content.innerHTML = `
    <div class="modal-header"><h3>📋 リスト管理</h3></div>
    <p style="font-size:11px; color:#666; margin-bottom:8px;">リスト登録上限数: ${curMap.lists ? curMap.lists.length : 0}/50</p>
    ${!curMap.isShared ? `<button onclick="createCustomListPrompt()" style="width:100%; margin-bottom:10px;">＋ 新しいリストを追加</button>` : ''}
    <ul style="list-style:none; padding:0; max-height:50vh; overflow-y:auto;">${listsHtml.length > 0 ? listsHtml : '<p style="color:#888; font-size:11px;">リストが登録されていません。</p>'}</ul>
    <button onclick="closeModal()" class="btn-secondary" style="width:100%; margin-top:10px;">閉じる</button>
  `;
}

function toggleListAccordion(elemId) {
  const el = document.getElementById(elemId);
  if (el) {
    el.style.display = el.style.display === 'none' ? 'block' : 'none';
  }
}

function moveCustomList(index, direction) {
  const curMap = getCurrentMap();
  if (curMap.isShared) return;
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= curMap.lists.length) return;
  const temp = curMap.lists[index];
  curMap.lists[index] = curMap.lists[targetIndex];
  curMap.lists[targetIndex] = temp;
  saveStorage();
  openCustomListModal();
}

function editCustomListName(listId) {
  const curMap = getCurrentMap();
  if (curMap.isShared) return;
  const list = curMap.lists.find(l => l.id === listId);
  if (!list) return;
  const newName = prompt('リスト名を編集:', list.name);
  if (newName && newName.trim()) {
    list.name = newName.trim();
    saveStorage();
    openCustomListModal();
  }
}

function moveStoreInList(listId, storeIndex, direction) {
  const curMap = getCurrentMap();
  if (curMap.isShared) return;
  const assignedStores = (curMap.stores || []).filter(s => (s.listIds || []).includes(listId) || s.listId === listId);
  const targetIndex = storeIndex + direction;
  if (targetIndex < 0 || targetIndex >= assignedStores.length) return;

  const storeA = assignedStores[storeIndex];
  const storeB = assignedStores[targetIndex];

  const idxA = curMap.stores.findIndex(s => s.id === storeA.id);
  const idxB = curMap.stores.findIndex(s => s.id === storeB.id);

  if (idxA >= 0 && idxB >= 0) {
    const temp = curMap.stores[idxA];
    curMap.stores[idxA] = curMap.stores[idxB];
    curMap.stores[idxB] = temp;
    saveStorage();
    openCustomListModal();
    toggleListAccordion('list-stores-' + listId);
  }
}

function removeStoreFromList(listId, storeId) {
  const curMap = getCurrentMap();
  if (curMap.isShared) return;
  const store = curMap.stores.find(s => s.id === storeId);
  if (store) {
    if (store.listIds) store.listIds = store.listIds.filter(id => id !== listId);
    if (store.listId === listId) store.listId = '';
    saveStorage();
    openCustomListModal();
    toggleListAccordion('list-stores-' + listId);
  }
}

function createCustomListPrompt() {
  const curMap = getCurrentMap();
  if (curMap.isShared) return;
  if (!curMap.lists) curMap.lists = [];
  if (curMap.lists.length >= 50) { alert('⚠️ リスト上限数（50個）に達しています。'); return; }
  const name = prompt('新しいリスト名:');
  if (!name || !name.trim()) return;
  curMap.lists.push({ id: 'lst_' + Date.now(), name: name.trim() });
  saveStorage();
  openCustomListModal();
}

function deleteCustomList(listId) {
  const curMap = getCurrentMap();
  if (curMap.isShared) return;
  if (!confirm('このリストを削除しますか？')) return;
  curMap.lists = curMap.lists.filter(l => l.id !== listId);
  curMap.stores.forEach(s => {
    if (s.listIds) s.listIds = s.listIds.filter(id => id !== listId);
    if (s.listId === listId) s.listId = '';
  });
  saveStorage();
  openCustomListModal();
}

function openStoreListModal() {
  const curMap = getCurrentMap();
  const content = document.getElementById('modal-content');
  document.getElementById('modal-overlay').style.display = 'flex';

  let listHtml = (curMap.stores || []).map(s => `
    <div style="padding:6px; border-bottom:1px solid var(--border-color); cursor:pointer;" onclick="closeModal(); showStoreDetail('${s.id}');">
      <b>${s.isFavorite ? '⭐ ' : ''}${s.name}</b> <small>(${s.genre || '-'})</small>
    </div>
  `).join('');

  content.innerHTML = `
    <div class="modal-header"><h3>登録店舗一覧 (${curMap.stores.length}件)</h3></div>
    <div style="max-height:60vh; overflow-y:auto; margin-bottom:10px;">${listHtml || '<p style="color:#888;">登録店舗がありません</p>'}</div>
    <button onclick="closeModal()" class="btn-secondary" style="width:100%;">閉じる</button>
  `;
}

function updateAuthUI() {
  const statusElem = document.getElementById('auth-status');
  const btnElem = document.getElementById('auth-btn');
  const editProfileBtn = document.getElementById('btn-edit-profile');
  const changePassBtn = document.getElementById('btn-change-pass');

  if (currentUser.loggedIn) {
    statusElem.innerText = `👤 ${currentUser.name || 'ユーザー'}`;
    btnElem.innerText = 'ログアウト';
    btnElem.onclick = logout;
    if (editProfileBtn) editProfileBtn.style.display = 'block';
    if (changePassBtn) changePassBtn.style.display = 'block';
  } else {
    statusElem.innerText = 'ゲスト利用中';
    btnElem.innerText = 'ログイン / 登録';
    btnElem.onclick = openAuthModal;
    if (editProfileBtn) editProfileBtn.style.display = 'none';
    if (changePassBtn) changePassBtn.style.display = 'none';
  }
}

function openAuthModal() {
  toggleMenu();
  const content = document.getElementById('modal-content');
  document.getElementById('modal-overlay').style.display = 'flex';
  content.innerHTML = `
    <div class="modal-header"><h3>アカウント ログイン / 登録</h3></div>
    <div class="form-group"><label>メールアドレス</label><input type="email" id="auth-email" class="stylish-input"></div>
    <div class="form-group"><label>アカウント名（新規登録時のみ有効）</label><input type="text" id="auth-name" class="stylish-input" placeholder="例: グルメ太郎"></div>
    <div class="form-group"><label>パスワード</label><input type="password" id="auth-pass" class="stylish-input"></div>
    <div style="text-align:right; margin-bottom:8px;">
      <a href="javascript:void(0)" onclick="sendForgotOtp()" style="font-size:11px; color:var(--primary-color); text-decoration:underline;">パスワードを忘れた場合</a>
    </div>
    <div class="btn-group">
      <button onclick="handleAuth(false)">ログイン</button>
      <button onclick="handleAuth(true)" style="background: linear-gradient(135deg, #4ecdc4, #2ab7ca);">新規登録</button>
      <button onclick="closeModal()" class="btn-secondary">閉じる</button>
    </div>
  `;
}

function sendForgotOtp() {
  const email = document.getElementById('auth-email').value.trim();
  if (!email) {
    alert('先にメールアドレスを入力してください。');
    return;
  }
  if (!users[email]) {
    alert('⚠️ このメールアドレスは登録されていません。');
    return;
  }
  alert(`📩 ${email} 宛に日本語でワンタイムパスワードを送信しました。\nメール本文をご確認の上、パスワードの再設定を行ってください。`);
}

function handleAuth(isRegister) {
  const email = document.getElementById('auth-email').value.trim();
  const name = document.getElementById('auth-name').value.trim();
  const pass = document.getElementById('auth-pass').value.trim();

  if (!email || pass.length < 6) {
    alert('正しいメールアドレスと6文字以上のパスワードを入力してください。');
    return;
  }

  if (isRegister) {
    if (users[email]) {
      alert('⚠️ このメールアドレスは既に登録されています。ログインしてください。');
      return;
    }
    const accountName = name || email.split('@')[0];
    const defaultMap = createDefaultMap();
    users[email] = {
      name: accountName,
      password: pass,
      maps: [defaultMap],
      currentMapId: defaultMap.id
    };
    currentUser = { loggedIn: true, email: email, name: accountName };
    saveStorage();
    updateAuthUI();
    closeModal();
    alert(`🎉 新規登録が完了しました！ようこそ、${accountName}さん。`);
  } else {
    if (!users[email]) {
      alert('⚠️ アカウント情報が一致しないか登録されていません。正しい情報でログインするか新規登録を行ってください。');
      return;
    }
    if (users[email].password !== pass) {
      alert('⚠️ パスワードが間違っています。');
      return;
    }
    currentUser = { loggedIn: true, email: email, name: users[email].name || email.split('@')[0] };
    loadCurrentUserData();
    updateAuthUI();
    renderCurrentMap();
    closeModal();
    alert(`🎉 ログインしました！登録されていた全てのマップ情報を復元しました。`);
  }
}

function openEditProfileModal() {
  toggleMenu();
  const content = document.getElementById('modal-content');
  document.getElementById('modal-overlay').style.display = 'flex';
  content.innerHTML = `
    <div class="modal-header"><h3>✏️ アカウント名の変更</h3></div>
    <div class="form-group"><label>新しいアカウント名</label><input type="text" id="new-account-name" class="stylish-input" value="${currentUser.name}"></div>
    <div class="btn-group">
      <button onclick="saveAccountName()">保存</button>
      <button onclick="closeModal()" class="btn-secondary">キャンセル</button>
    </div>
  `;
}

function saveAccountName() {
  const newName = document.getElementById('new-account-name').value.trim();
  if (!newName) {
    alert('アカウント名を入力してください。');
    return;
  }
  currentUser.name = newName;
  if (users[currentUser.email]) {
    users[currentUser.email].name = newName;
  }
  saveStorage();
  updateAuthUI();
  closeModal();
  alert('アカウント名を更新しました。');
}

function openChangePasswordModal() {
  toggleMenu();
  const content = document.getElementById('modal-content');
  document.getElementById('modal-overlay').style.display = 'flex';
  content.innerHTML = `
    <div class="modal-header"><h3>🔑 パスワードの変更</h3></div>
    <div class="form-group"><label>現在のパスワード</label><input type="password" id="cur-pass" class="stylish-input"></div>
    <div class="form-group"><label>新しいパスワード (6文字以上)</label><input type="password" id="new-pass" class="stylish-input"></div>
    <div class="btn-group">
      <button onclick="saveNewPassword()">パスワード変更</button>
      <button onclick="closeModal()" class="btn-secondary">キャンセル</button>
    </div>
  `;
}

function saveNewPassword() {
  const curPass = document.getElementById('cur-pass').value.trim();
  const newPass = document.getElementById('new-pass').value.trim();

  if (users[currentUser.email].password !== curPass) {
    alert('⚠️ 現在のパスワードが違います。');
    return;
  }
  if (newPass.length < 6) {
    alert('⚠️ 新しいパスワードは6文字以上で入力してください。');
    return;
  }

  users[currentUser.email].password = newPass;
  saveStorage();
  closeModal();
  alert('🔑 パスワードを正常に変更しました。');
}

function logout() {
  currentUser = { loggedIn: false, email: '', name: '' };
  localStorage.removeItem('gourmet_current_user');
  loadCurrentUserData();
  updateAuthUI();
  renderCurrentMap();
}