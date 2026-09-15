// モーダルを閉じる
function closeModal() {
  document.getElementById('modal-overlay').style.display = 'none';
  document.getElementById('modal-content').innerHTML = '';
}

// ドロップダウンメニューの切り替え
function toggleMenu() {
  const menu = document.getElementById('dropdown-menu');
  menu.classList.toggle('active');
}

// マップ選択ドロップダウンの表示切替
function toggleMapDropdown() {
  const menu = document.getElementById('map-dropdown-menu');
  if (menu.classList.contains('active')) {
    menu.classList.remove('active');
    return;
  }

  let html = '';
  maps.forEach(m => {
    const isCurrent = m.id === currentMapId;
    html += `
      <div class="menu-item" style="${isCurrent ? 'font-weight:bold; color:var(--primary-color);' : ''}" onclick="switchMap('${m.id}')">
        <i class="fa-solid fa-map-pin"></i> ${m.name} ${m.isShared ? '(共有)' : ''}
      </div>
    `;
  });

  menu.innerHTML = html;
  menu.classList.add('active');
}

// マップの切り替え
function switchMap(mapId) {
  currentMapId = mapId;
  currentSelectedAreaId = null;
  currentSelectedListId = null;
  document.getElementById('map-dropdown-menu').classList.remove('active');
  closeDetailPanel();
  closeSearchResultsPanel();
  renderAll();
}

// マップ管理・作成モーダル
function openMapManagementModal() {
  toggleMenu();
  const content = document.getElementById('modal-content');
  document.getElementById('modal-overlay').style.display = 'flex';

  let mapListHtml = maps.map(m => `
    <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid #eee;">
      <span style="font-size:13px; font-weight:${m.id === currentMapId ? 'bold' : 'normal'}">${m.name} ${m.isShared ? '<small>(共有)</small>' : ''}</span>
      ${!m.isShared && maps.length > 1 ? `<button onclick="deleteMap('${m.id}')" style="background:none; border:none; color:#e74c3c; cursor:pointer;"><i class="fa-solid fa-trash"></i></button>` : ''}
    </div>
  `).join('');

  content.innerHTML = `
    <div class="modal-header">
      <h3>🗺️ マップ管理・新規作成</h3>
      <span style="cursor:pointer; font-size:16px; opacity:0.6;" onclick="closeModal()">✕</span>
    </div>
    <div class="form-group">
      <label>新規マップ名</label>
      <input type="text" id="new-map-name" class="stylish-input" placeholder="例: 東京グルメ巡り">
    </div>
    <button onclick="createNewMap()" style="width:100%; padding:8px; background:var(--primary-color); color:white; border:none; border-radius:6px; font-weight:bold; margin-bottom:15px;">作成</button>
    <div style="font-size:12px; font-weight:bold; margin-bottom:8px;">マップ一覧</div>
    <div>${mapListHtml}</div>
  `;
}

// 新規マップ作成
function createNewMap() {
  const nameInput = document.getElementById('new-map-name');
  const name = nameInput.value.trim();
  if (!name) return;

  const newMap = {
    id: "map_" + Date.now(),
    name: name,
    stores: [],
    areas: [],
    lists: []
  };

  maps.push(newMap);
  currentMapId = newMap.id;
  saveStorage();
  closeModal();
  renderAll();
}

// マップ削除
function deleteMap(mapId) {
  if (!confirm("このマップを削除してもよろしいですか？")) return;

  maps = maps.filter(m => m.id !== mapId);
  if (currentMapId === mapId) {
    currentMapId = maps[0].id;
  }
  saveStorage();
  openMapManagementModal();
  renderAll();
}

// テーマ（ダークモード）切り替え
function toggleTheme() {
  toggleMenu();
  const currentTheme = document.body.getAttribute('data-theme');
  if (currentTheme === 'dark') {
    document.body.removeAttribute('data-theme');
  } else {
    document.body.setAttribute('data-theme', 'dark');
  }
}