import { maps, setMaps, currentMapId, setCurrentMapId } from './config.js';
import { createDefaultMap, saveStorage } from './data.js';
import { closeSearchResultsPanel, filterStores } from './list_search.js';

export function toggleMenu() {
  const dropdown = document.getElementById('menu-dropdown');
  dropdown.style.display = (dropdown.style.display === 'block') ? 'none' : 'block';
}

export function toggleSearchPanel() {
  const panel = document.getElementById('search-panel');
  const isVisible = panel.style.display === 'block';
  panel.style.display = isVisible ? 'none' : 'block';
  if (!isVisible) filterStores();
}

export function closeDetailPanel() {
  document.getElementById('detail-area').style.display = 'none';
}

export function closeModal() {
  document.getElementById('modal-overlay').style.display = 'none';
}

export function changeTheme(themeName) {
  document.documentElement.setAttribute('data-theme', themeName);
}

export function openMapSwitchModal() {
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

export function switchCurrentMap(targetMapId) {
  if (!targetMapId || targetMapId === currentMapId) return;
  setCurrentMapId(targetMapId);
  saveStorage();
  closeModal();
  closeDetailPanel();
  closeSearchResultsPanel();
}

export function editMapName(mapId) {
  const targetMap = maps.find(m => m.id === mapId);
  if (!targetMap) return;
  const newName = prompt('マップ名を編集:', targetMap.name);
  if (newName && newName.trim()) {
    targetMap.name = newName.trim();
    saveStorage();
    openMapSwitchModal();
  }
}

export function moveMapOrder(index, direction) {
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= maps.length) return;
  const temp = maps[index];
  maps[index] = maps[targetIndex];
  maps[targetIndex] = temp;
  saveStorage();
  openMapSwitchModal();
}

export function deleteMap(mapId) {
  if (maps.length <= 1) {
    alert('⚠️ マップは最低1つ必要なため削除できません。');
    return;
  }
  if (!confirm('このマップをリストから削除しますか？')) return;
  
  setMaps(maps.filter(m => m.id !== mapId));
  if (currentMapId === mapId) {
    setCurrentMapId(maps[0].id);
  }
  saveStorage();
  openMapSwitchModal();
  closeDetailPanel();
}

export function openNewMapModal() {
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
      <button id="btn-save-new-map">作成</button>
      <button onclick="closeModal()" class="btn-secondary">キャンセル</button>
    </div>
  `;
  document.getElementById('btn-save-new-map').onclick = saveNewMap;
}

export function saveNewMap() {
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
  setCurrentMapId(newMap.id);

  saveStorage();
  closeModal();
  closeDetailPanel();
  closeSearchResultsPanel();
  alert(`🎉 新しいマップ「${name}」を作成して切り替えました！`);
}

window.toggleMenu = toggleMenu;
window.toggleSearchPanel = toggleSearchPanel;
window.closeDetailPanel = closeDetailPanel;
window.closeModal = closeModal;
window.changeTheme = changeTheme;
window.openMapSwitchModal = openMapSwitchModal;
window.switchCurrentMap = switchCurrentMap;
window.editMapName = editMapName;
window.moveMapOrder = moveMapOrder;
window.deleteMap = deleteMap;
window.openNewMapModal = openNewMapModal;