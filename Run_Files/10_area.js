import { map, AREA_COLORS, tempPinLocation, setTempPinLocation, tempMarker, setTempMarker } from './config.js';
import { getCurrentMap, saveStorage } from './data.js';
import { closeModal, closeDetailPanel } from './ui_modal.js';

export function openAreaRegisterModalPrompt() {
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
        <button id="btn-save-new-area" style="white-space:nowrap;">登録</button>
      </div>
      <small style="color:#888; font-size:10px;">※地図上にピンを立ててから登録ボタンを押してください。</small>
    </div>

    <label style="font-weight:bold; font-size:11.5px;">登録済みエリア一覧</label>
    <ul style="list-style:none; padding:0; max-height:40vh; overflow-y:auto; margin-top:4px;">
      ${areasHtml.length > 0 ? areasHtml : '<p style="color:#888; font-size:11px;">登録エリアはありません。</p>'}
    </ul>
    <button onclick="closeModal()" class="btn-secondary" style="width:100%; margin-top:10px;">閉じる</button>
  `;
  document.getElementById('btn-save-new-area').onclick = saveNewArea;
}

export function saveNewArea() {
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

  if (tempMarker) { map.removeLayer(tempMarker); setTempMarker(null); }
  setTempPinLocation(null);

  saveStorage();
  openAreaRegisterModalPrompt();
}

export function editAreaName(areaId) {
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

export function moveAreaOrder(index, direction) {
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

export function showAreaDetail(areaId) {
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

export function editAreaNameFromDetail(areaId) {
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

export function changeAreaColor(areaId, colorId) {
  const curMap = getCurrentMap();
  if (curMap.isShared) return;
  const area = curMap.areas.find(a => a.id === areaId);
  if (area) {
    area.color = colorId;
    saveStorage();
    showAreaDetail(areaId);
  }
}

export function deleteArea(areaId) {
  const curMap = getCurrentMap();
  if (curMap.isShared) return;
  if (!confirm('このエリアピンを削除しますか？')) return;
  curMap.areas = curMap.areas.filter(a => a.id !== areaId);
  saveStorage();
  closeDetailPanel();
}

window.openAreaRegisterModalPrompt = openAreaRegisterModalPrompt;
window.moveAreaOrder = moveAreaOrder;
window.editAreaName = editAreaName;
window.deleteArea = deleteArea;
window.showAreaDetail = showAreaDetail;
window.editAreaNameFromDetail = editAreaNameFromDetail;
window.changeAreaColor = changeAreaColor;