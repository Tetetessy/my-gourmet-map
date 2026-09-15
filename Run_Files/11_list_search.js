import { getCurrentMap, saveStorage } from './data.js';
import { closeModal, toggleMenu } from './ui_modal.js';
import { showStoreDetail } from './store.js';

export function closeSearchResultsPanel() {
  document.getElementById('search-results-panel').style.display = 'none';
}

export function filterStores() {
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

export function openCustomListModal() {
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
    ${!curMap.isShared ? `<button id="btn-create-list" style="width:100%; margin-bottom:10px;">＋ 新しいリストを追加</button>` : ''}
    <ul style="list-style:none; padding:0; max-height:50vh; overflow-y:auto;">${listsHtml.length > 0 ? listsHtml : '<p style="color:#888; font-size:11px;">リストが登録されていません。</p>'}</ul>
    <button onclick="closeModal()" class="btn-secondary" style="width:100%; margin-top:10px;">閉じる</button>
  `;
  const btnCreate = document.getElementById('btn-create-list');
  if (btnCreate) btnCreate.onclick = createCustomListPrompt;
}

export function toggleListAccordion(elemId) {
  const el = document.getElementById(elemId);
  if (el) {
    el.style.display = el.style.display === 'none' ? 'block' : 'none';
  }
}

export function moveCustomList(index, direction) {
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

export function editCustomListName(listId) {
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

export function moveStoreInList(listId, storeIndex, direction) {
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

export function removeStoreFromList(listId, storeId) {
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

export function createCustomListPrompt() {
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

export function deleteCustomList(listId) {
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

export function openStoreListModal() {
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

window.closeSearchResultsPanel = closeSearchResultsPanel;
window.filterStores = filterStores;
window.openCustomListModal = openCustomListModal;
window.toggleListAccordion = toggleListAccordion;
window.moveCustomList = moveCustomList;
window.editCustomListName = editCustomListName;
window.moveStoreInList = moveStoreInList;
window.removeStoreFromList = removeStoreFromList;
window.deleteCustomList = deleteCustomList;
window.openStoreListModal = openStoreListModal;