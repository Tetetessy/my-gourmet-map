import { map, maps, tempPinLocation, setTempPinLocation, tempMarker, setTempMarker, currentEditingImages } from './config.js';
import { getCurrentMap, saveStorage } from './data.js';
import { closeModal, closeDetailPanel } from './ui_modal.js';
import { openStoreRegisterModalFromPin } from './store_modal.js';

export function saveStoreData(editStoreId = '') {
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
    if (tempMarker) { map.removeLayer(tempMarker); setTempMarker(null); }
    setTempPinLocation(null);
    saveStorage();
    closeModal();
    showStoreDetail(newStore.id);
  }
}

export function showStoreDetail(storeId) {
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

export function reflectStoreToMyMap(storeId) {
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

export function openShareStoreModal(storeId) {
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
      <button id="btn-execute-share">反映保存</button>
      <button onclick="closeModal()" class="btn-secondary">キャンセル</button>
    </div>
  `;
  document.getElementById('btn-execute-share').onclick = () => executeShareStore(store.id);
}

export function executeShareStore(storeId) {
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

export function toggleUrlAccordion() {
  const content = document.getElementById('url-accordion-content');
  if (content) {
    content.style.display = content.style.display === 'none' ? 'block' : 'none';
  }
}

export function openEditStoreModal(storeId) {
  const curMap = getCurrentMap();
  if (curMap.isShared) return;
  const store = curMap.stores.find(s => s.id === storeId);
  if (store) openStoreRegisterModalFromPin(store);
}

export function deleteStore(storeId) {
  const curMap = getCurrentMap();
  if (curMap.isShared) return;
  if (!confirm('この店舗を削除しますか？')) return;
  curMap.stores = curMap.stores.filter(s => s.id !== storeId);
  saveStorage();
  closeDetailPanel();
}

window.showStoreDetail = showStoreDetail;
window.reflectStoreToMyMap = reflectStoreToMyMap;
window.openShareStoreModal = openShareStoreModal;
window.toggleUrlAccordion = toggleUrlAccordion;
window.openEditStoreModal = openEditStoreModal;
window.deleteStore = deleteStore;