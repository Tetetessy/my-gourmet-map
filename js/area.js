// エリア管理モーダル
function openAreaManagementModal() {
  toggleMenu();
  const curMap = getCurrentMap();
  const content = document.getElementById('modal-content');
  document.getElementById('modal-overlay').style.display = 'flex';

  let areaListHtml = (curMap.areas || []).map(a => `
    <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid #eee;">
      <div style="display:flex; align-items:center; gap:8px;">
        <span style="width:14px; height:14px; border-radius:50%; background:${a.color}; display:inline-block;"></span>
        <span style="font-size:13px; cursor:pointer;" onclick="selectAreaFilter('${a.id}')">${a.name}</span>
      </div>
      ${!curMap.isShared ? `
        <button onclick="deleteArea('${a.id}')" style="background:none; border:none; color:#e74c3c; cursor:pointer;"><i class="fa-solid fa-trash"></i></button>
      ` : ''}
    </div>
  `).join('');

  content.innerHTML = `
    <div class="modal-header">
      <h3>🗺️ エリア管理</h3>
      <span style="cursor:pointer; font-size:16px; opacity:0.6;" onclick="closeModal()">✕</span>
    </div>
    ${!curMap.isShared ? `
      <div class="form-group">
        <label>新規エリア名</label>
        <input type="text" id="new-area-name" class="stylish-input" placeholder="例: 渋谷エリア">
      </div>
      <div class="form-group">
        <label>カラー</label>
        <input type="color" id="new-area-color" value="#ff6b6b" style="width:100%; height:35px; border:none; border-radius:6px; cursor:pointer;">
      </div>
      <button onclick="createNewArea()" style="width:100%; padding:8px; background:var(--primary-color); color:white; border:none; border-radius:6px; font-weight:bold; margin-bottom:15px;">エリア追加</button>
    ` : ''}
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
      <span style="font-size:12px; font-weight:bold;">エリア一覧</span>
      <button onclick="selectAreaFilter(null)" style="font-size:11px; background:none; border:none; color:var(--primary-color); cursor:pointer;">全表示解除</button>
    </div>
    <div>${areaListHtml || '<div style="font-size:12px; color:#888;">エリアが登録されていません。</div>'}</div>
  `;
}

// エリア作成
function createNewArea() {
  const curMap = getCurrentMap();
  const nameInput = document.getElementById('new-area-name');
  const colorInput = document.getElementById('new-area-color');
  const name = nameInput.value.trim();
  if (!name) return;

  if (!curMap.areas) curMap.areas = [];

  const newArea = {
    id: "area_" + Date.now(),
    name: name,
    color: colorInput.value
  };

  curMap.areas.push(newArea);
  saveStorage();
  openAreaManagementModal();
  renderAll();
}

// エリア削除
function deleteArea(areaId) {
  if (!confirm("エリアを削除しますか？所属する店舗のエリア設定も解除されます。")) return;

  const curMap = getCurrentMap();
  curMap.areas = curMap.areas.filter(a => a.id !== areaId);
  
  if (curMap.stores) {
    curMap.stores.forEach(s => {
      if (s.areaId === areaId) s.areaId = null;
    });
  }

  if (currentSelectedAreaId === areaId) currentSelectedAreaId = null;

  saveStorage();
  openAreaManagementModal();
  renderAll();
}

// エリアフィルタ選択
function selectAreaFilter(areaId) {
  currentSelectedAreaId = areaId;
  closeModal();
  renderAll();
}