import { FORM_OPTIONS, GENRE_OPTIONS, tempPinLocation, currentEditingImages, setCurrentEditingImages } from './config.js';
import { getCurrentMap } from './data.js';
import { closeModal } from './ui_modal.js';
import { saveStoreData } from './store.js';

export function openStoreRegisterModalFromPin(storeToEdit = null) {
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

  setCurrentEditingImages(storeToEdit ? [...(storeToEdit.images || [])] : []);
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
      <input type="file" id="reg-store-file" accept="image/jpeg, image/png" multiple>
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
      <button id="btn-save-store">${isEdit ? '更新保存' : '登録保存'}</button>
      <button onclick="closeModal()" class="btn-secondary">キャンセル</button>
    </div>
  `;

  document.getElementById('reg-store-file').onchange = handleImageUploadStrict;
  document.getElementById('btn-save-store').onclick = () => saveStoreData(isEdit ? storeToEdit.id : '');
  renderImagePreviews();
}

export function generateListOptionsHtml(selectedId = '') {
  const curMap = getCurrentMap();
  let html = '<option value="">(選択なし)</option>';
  (curMap.lists || []).forEach(l => {
    const sel = (l.id === selectedId) ? 'selected' : '';
    html += `<option value="${l.id}" ${sel}>${l.name}</option>`;
  });
  return html;
}

export function addExistingListRow() {
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

export function addNewListRow() {
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

export function toggleFavBtn() {
  const hiddenInput = document.getElementById('reg-store-fav');
  const btn = document.getElementById('reg-fav-btn');
  const current = hiddenInput.value === 'true';
  hiddenInput.value = (!current).toString();
  btn.style.background = !current ? '#ff6b6b' : '#6c757d';
  btn.innerText = !current ? '⭐ お気に入り（登録済み）' : '☆ お気に入りに追加';
}

export function handleImageUploadStrict(e) {
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

export function renderImagePreviews() {
  const box = document.getElementById('image-preview-container');
  if (!box) return;
  box.innerHTML = currentEditingImages.map((img, idx) => `
    <div class="preview-thumb">
      <img src="${img}">
      <button class="del-btn" onclick="removeImage(${idx})">✕</button>
    </div>
  `).join('');
}

export function removeImage(idx) {
  currentEditingImages.splice(idx, 1);
  renderImagePreviews();
}

window.openStoreRegisterModalFromPin = openStoreRegisterModalFromPin;
window.addExistingListRow = addExistingListRow;
window.addNewListRow = addNewListRow;
window.toggleFavBtn = toggleFavBtn;
window.removeImage = removeImage;