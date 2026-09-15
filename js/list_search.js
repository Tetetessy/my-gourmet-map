// カスタムリスト管理モーダル
function openCustomListModal() {
  toggleMenu();
  const curMap = getCurrentMap();
  const content = document.getElementById('modal-content');
  document.getElementById('modal-overlay').style.display = 'flex';

  let listHtml = (curMap.lists || []).map(l => `
    <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid #eee;">
      <span style="font-size:13px; cursor:pointer;" onclick="selectListFilter('${l.id}')"><i class="fa-solid fa-list-check"></i> ${l.name} (${l.storeIds ? l.storeIds.length : 0})</span>
      ${!curMap.isShared ? `
        <button onclick="deleteCustomList('${l.id}')" style="background:none; border:none; color:#e74c3c; cursor:pointer;"><i class="fa-solid fa-trash"></i></button>
      ` : ''}
    </div>
  `).join('');

  content.innerHTML = `
    <div class="modal-header">
      <h3>📋 カスタムリスト管理</h3>
      <span style="cursor:pointer; font-size:16px; opacity:0.6;" onclick="closeModal()">✕</span>
    </div>
    ${!curMap.isShared ? `
      <div class="form-group">
        <label>新規リスト名</label>
        <input type="text" id="new-list-name" class="stylish-input" placeholder="例: 行きたいお店">
      </div>
      <button onclick="createNewList()" style="width:100%; padding:8px; background:var(--primary-color); color:white; border:none; border-radius:6px; font-weight:bold; margin-bottom:15px;">リスト作成</button>
    ` : ''}
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
      <span style="font-size:12px; font-weight:bold;">リスト一覧</span>
      <button onclick="selectListFilter(null)" style="font-size:11px; background:none; border:none; color:var(--primary-color); cursor:pointer;">全店舗表示</button>
    </div>
    <div>${listHtml || '<div style="font-size:12px; color:#888;">リストが登録されていません。</div>'}</div>
  `;
}

// リスト作成
function createNewList() {
  const curMap = getCurrentMap();
  const nameInput = document.getElementById('new-list-name');
  const name = nameInput.value.trim();
  if (!name) return;

  if (!curMap.lists) curMap.lists = [];

  const newList = {
    id: "list_" + Date.now(),
    name: name,
    storeIds: []
  };

  curMap.lists.push(newList);
  saveStorage();
  openCustomListModal();
  renderAll();
}

// リスト削除
function deleteCustomList(listId) {
  if (!confirm("このリストを削除しますか？")) return;

  const curMap = getCurrentMap();
  curMap.lists = curMap.lists.filter(l => l.id !== listId);

  if (currentSelectedListId === listId) currentSelectedListId = null;

  saveStorage();
  openCustomListModal();
  renderAll();
}

// リストフィルタ選択
function selectListFilter(listId) {
  currentSelectedListId = listId;
  closeModal();
  renderAll();
}

// 検索入力制御ハンドラー
function handleSearchInput(e) {
  const query = e.target.value.trim().toLowerCase();
  if (!query) {
    closeSearchResultsPanel();
    return;
  }

  const curMap = getCurrentMap();
  const results = (curMap.stores || []).filter(s => {
    const area = curMap.areas ? curMap.areas.find(a => a.id === s.areaId) : null;
    const areaName = area ? area.name.toLowerCase() : '';
    return s.name.toLowerCase().includes(query) ||
           (s.genre && s.genre.toLowerCase().includes(query)) ||
           areaName.includes(query);
  });

  showSearchResults(results);
}

// 検索結果パネル表示
function showSearchResults(results) {
  const panel = document.getElementById('search-results-panel');
  
  if (results.length === 0) {
    panel.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span style="font-size:13px; color:#888;">該当する店舗が見つかりませんでした。</span>
        <span style="cursor:pointer; font-size:16px; opacity:0.5;" onclick="closeSearchResultsPanel()">✕</span>
      </div>
    `;
  } else {
    let listHtml = results.map(s => `
      <div style="padding:10px 0; border-bottom:1px solid #eee; cursor:pointer;" onclick="focusStoreOnMap('${s.id}')">
        <div style="font-weight:bold; font-size:14px;">${s.name}</div>
        <div style="font-size:11px; color:#666;">${s.genre || ''} | ★${s.rating || 0}</div>
      </div>
    `).join('');

    panel.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
        <span style="font-size:13px; font-weight:bold;">検索結果 (${results.length}件)</span>
        <span style="cursor:pointer; font-size:16px; opacity:0.5;" onclick="closeSearchResultsPanel()">✕</span>
      </div>
      <div>${listHtml}</div>
    `;
  }

  panel.classList.add('active');
}

// 検索結果パネル閉じる
function closeSearchResultsPanel() {
  document.getElementById('search-results-panel').classList.remove('active');
}

// 検索結果からマップ上の店舗へフォーカス
function focusStoreOnMap(storeId) {
  const curMap = getCurrentMap();
  const store = curMap.stores.find(s => s.id === storeId);
  if (store && mapInstance) {
    mapInstance.setView([store.lat, store.lng], 16);
    showStoreDetail(store.id);
    closeSearchResultsPanel();
  }
}