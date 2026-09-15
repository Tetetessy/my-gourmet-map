import { db, currentUser, maps, setMaps, currentMapId, setCurrentMapId, sharedStoreDB, setSharedStoreDB } from './config.js';
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { renderCurrentMap } from './map.js';
import { closeModal, closeDetailPanel, closeSearchResultsPanel, toggleMenu } from './ui_modal.js';

export function generateDefaultShareCode() {
  const alpha = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const nums = '0123456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += alpha.charAt(Math.floor(Math.random() * alpha.length));
    code += nums.charAt(Math.floor(Math.random() * nums.length));
  }
  return code;
}

export function createDefaultMap(id, name) {
  return { id: id || generateDefaultShareCode(), name: name || 'マイグルメマップ', stores: [], areas: [], lists: [], isShared: false };
}

export function getCurrentMap() {
  return maps.find(m => m.id === currentMapId) || maps[0];
}

export async function loadCurrentUserData() {
  if (currentUser.loggedIn && currentUser.uid) {
    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        currentUser.name = data.name || currentUser.name || 'ユーザー';
        setMaps(data.maps || []);
        setCurrentMapId(data.currentMapId || (maps[0] ? maps[0].id : ''));
      } else {
        const defaultMap = createDefaultMap();
        setMaps([defaultMap]);
        setCurrentMapId(defaultMap.id);
      }
    } catch (e) {
      console.error("Firebaseデータ取得失敗", e);
    }
  } else {
    setMaps(JSON.parse(localStorage.getItem('gourmet_guest_maps')) || []);
    setCurrentMapId(localStorage.getItem('gourmet_guest_map_id') || '');
  }
  
  if (!maps || maps.length === 0) {
    const defaultMap = createDefaultMap();
    setMaps([defaultMap]);
    setCurrentMapId(defaultMap.id);
  }
  if (!currentMapId || !maps.find(m => m.id === currentMapId)) {
    setCurrentMapId(maps[0].id);
  }
  maps.forEach(m => { if (!m.lists) m.lists = []; });
}

export async function saveStorage() {
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

    if (currentUser.loggedIn && currentUser.uid) {
      const userDocRef = doc(db, "users", currentUser.uid);
      await setDoc(userDocRef, {
        name: currentUser.name || 'ユーザー',
        email: currentUser.email,
        maps: maps,
        currentMapId: currentMapId
      }, { merge: true });
    } else {
      localStorage.setItem('gourmet_guest_maps', JSON.stringify(maps));
      localStorage.setItem('gourmet_guest_map_id', currentMapId);
    }
    renderCurrentMap();
  } catch (e) {
    alert('データの保存に失敗しました。容量オーバーまたは通信状態をご確認ください。');
  }
}

export function exportCode() {
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
      <button id="btn-save-share-code">コード更新・保存</button>
      <button onclick="closeModal()" class="btn-secondary">閉じる</button>
    </div>
  `;
  document.getElementById('btn-save-share-code').onclick = saveCustomShareCode;
}

export function saveCustomShareCode() {
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
  if (currentMapId === oldId) setCurrentMapId(newCode);

  saveStorage();
  successEl.textContent = '🎉 共有コードを正常に更新しました！';
  successEl.style.display = 'block';
}

export function importCodePrompt() {
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

  setSharedStoreDB(JSON.parse(localStorage.getItem('gourmet_shared_maps')) || {});
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

  setCurrentMapId(trimmed);
  saveStorage();
  closeDetailPanel();
  closeSearchResultsPanel();
  alert(`🎉 共有コード「${trimmed}」のマップを自動読み込みして切り替えました！\n（閲覧専用としてマップ管理に保存されました）`);
}

export function refreshSharedMap() {
  toggleMenu();
  const curMap = getCurrentMap();
  setSharedStoreDB(JSON.parse(localStorage.getItem('gourmet_shared_maps')) || {});
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

window.exportCode = exportCode;
window.importCodePrompt = importCodePrompt;
window.refreshSharedMap = refreshSharedMap;