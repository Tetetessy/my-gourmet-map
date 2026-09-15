// 店舗登録・編集モーダル表示
function openStoreModal(storeId = null) {
  const curMap = getCurrentMap();
  if (curMap.isShared) {
    alert('🔒 共有マップには店舗を追加・編集できません。');
    return;
  }

  const content = document.getElementById('modal-content');
  document.getElementById('modal-overlay').style.display = 'flex';

  let store = null;
  if (storeId) {
    store = curMap.stores.find(s => s.id === storeId);
  }

  tempImageBase64 = store ? store.image : null;

  let genreOptions = GENRES.map(g => `<option value="${g}" ${store && store.genre === g ? 'selected' : ''}>${g}</option>`).join('');
  let areaOptions = `<option value="">指定なし</option>` + (curMap.areas || []).map(a => `<option value="${a.id}" ${store && store.areaId === a.id ? 'selected' : ''}>${a.name}</option>`).join('');

  content.innerHTML = `
    <div class="modal-header">
      <h3>${store ? '✏️ 店舗情報の編集' : '📍 新しい店舗の登録'}</h3>
      <span style="cursor:pointer; font-size:16px; opacity:0.6;" onclick="closeModal()">✕</span>
    </div>
    <div class="form-group">
      <label>店名 *</label>
      <input type="text" id="store-name" class="stylish-input" value="${store ? store.name : ''}" placeholder="例: ラーメン極">
    </div>
    <div class="form-group">
      <label>ジャンル</label>
      <select id="store-genre" class="stylish-input">${genreOptions}</select>
    </div>
    <div class="form-group">
      <label>エリア</label>
      <select id="store-area" class="stylish-input">${areaOptions}</select>
    </div>
    <div class="form-group">
      <label>緯度・経度 (地図から取得または手入力)</label>
      <div style="display:flex; gap:6px;">
        <input type="number" step="any" id="store-lat" class="stylish-input" value="${store ? store.lat : 35.681236}" placeholder="緯度">
        <input type="number" step="any" id="store-lng" class="stylish-input" value="${store ? store.lng : 139.767125}" placeholder="経度">
      </div>
    </div>
    <div class="form-group">
      <label>評価 (1〜5)</label>
      <input type="number" min="1" max="5" id="store-rating" class="stylish-input" value="${store ? store.rating : 3}">
    </div>
    <div class="form-group">
      <label>メモ・感想</label>
      <textarea id="store-memo" class="stylish-input" rows="3">${store ? store.memo || '' : ''}</textarea>
    </div>
    <div class="form-group">
      <label>店舗画像</label>
      <input type="file" id="store-image-file" accept="image/*" onchange="handleImageUpload(event)" style="font-size:12px;">
      <div id="image-preview" style="margin-top:8px;">
        ${tempImageBase64 ? `<img src="${tempImageBase64}" style="max-width:100%; max-height:120px; border-radius:6px;">` : ''}
      </div>
    </div>
    <div class="btn-group">
      <button onclick="saveStore('${storeId || ''}')">保存</button>
      <button onclick="closeModal()" class="btn-secondary">キャンセル</button>
    </div>
  `;
}

// 画像ファイルのBase64変換ハンドラー
function handleImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(event) {
    tempImageBase64 = event.target.result;
    const preview = document.getElementById('image-preview');
    preview.innerHTML = `<img src="${tempImageBase64}" style="max-width:100%; max-height:120px; border-radius:6px;">`;
  };
  reader.readAsDataURL(file);
}