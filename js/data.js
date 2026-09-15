// ユーザーデータの読み込み
function loadUserData() {
  if (!currentUser) return;

  // LocalStorageキャッシュを優先取得
  const localData = localStorage.getItem(`gourmet_maps_${currentUser.uid}`);
  if (localData) {
    maps = JSON.parse(localData);
    if (maps.length > 0) {
      currentMapId = maps[0].id;
    }
    initMap();
    renderAll();
  }

  // Firestoreから最新データ同期
  db.collection('users').doc(currentUser.uid).get().then((doc) => {
    if (doc.exists && doc.data().maps) {
      maps = doc.data().maps;
      if (!currentMapId && maps.length > 0) {
        currentMapId = maps[0].id;
      }
      saveStorage(false);
      if (!mapInstance) {
        initMap();
      }
      renderAll();
    } else if (maps.length === 0) {
      // 初期デフォルトマップ構築
      const defaultMap = {
        id: "default_" + Date.now(),
        name: "マイマップ",
        stores: [],
        areas: [],
        lists: []
      };
      maps = [defaultMap];
      currentMapId = defaultMap.id;
      saveStorage();
      if (!mapInstance) {
        initMap();
      }
      renderAll();
    }
  });
}

// データの保存処理（LocalStorage ＆ Firestore）
function saveStorage(syncFirestore = true) {
  if (!currentUser) return;

  localStorage.setItem(`gourmet_maps_${currentUser.uid}`, JSON.stringify(maps));

  if (syncFirestore) {
    db.collection('users').doc(currentUser.uid).set({
      maps: maps,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  }
}

// カレントマップ取得関数
function getCurrentMap() {
  return maps.find(m => m.id === currentMapId) || maps[0];
}

// 16文字英数字コード生成ルーチン
function generateDefaultShareCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// 共有コードのエクスポート/カスタマイズ設定画面表示
function exportCode() {
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
      他のユーザーとマップを共有するためのコードです。6〜20文字の英数字を指定できます。
    </p>
    <div class="form-group">
      <label>共有コード (半角英数字)</label>
      <input type="text" id="custom-share-code" class="stylish-input" value="${curMap.id}" minlength="6" maxlength="20">
      <div id="share-code-error" class="error-msg"></div>
      <div id="share-code-success" class="success-msg"></div>
    </div>
    <div class="btn-group">
      <button onclick="saveCustomShareCode()">コード更新・保存</button>
      <button onclick="closeModal()" class="btn-secondary">閉じる</button>
    </div>
  `;
}

// カスタム共有コードの保存処理
function saveCustomShareCode() {
  const curMap = getCurrentMap();
  if (curMap.isShared) return;

  const input = document.getElementById('custom-share-code');
  const errorEl = document.getElementById('share-code-error');
  const successEl = document.getElementById('share-code-success');
  const newCode = input.value.trim();

  errorEl.style.display = 'none';
  successEl.style.display = 'none';

  if (newCode.length < 6 || newCode.length > 20) {
    errorEl.textContent = '⚠️ 共有コードは6文字以上20文字以下で入力してください。';
    errorEl.style.display = 'block';
    return;
  }

  if (!/^[a-zA-Z0-9]+$/.test(newCode)) {
    errorEl.textContent = '⚠️ 半角英数字のみ使用可能です。';
    errorEl.style.display = 'block';
    return;
  }

  // 既存の旧コード情報を削除し更新
  delete sharedStoreDB[curMap.id];
  const oldId = curMap.id;
  curMap.id = newCode;
  if (currentMapId === oldId) currentMapId = newCode;

  // 公開用Firestoreコレクションに保存
  db.collection('shared_maps').doc(newCode).set({
    id: newCode,
    name: curMap.name,
    stores: curMap.stores || [],
    areas: curMap.areas || [],
    lists: curMap.lists || [],
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  saveStorage();
  successEl.textContent = '🎉 共有コードを正常に更新・公開しました！';
  successEl.style.display = 'block';
}

// 共有コード読み込み処理
function importCodePrompt() {
  toggleMenu();
  const code = prompt('読み込む共有コードを入力してください:');
  if (!code || !code.trim()) return;

  const trimmed = code.trim();

  db.collection('shared_maps').doc(trimmed).get().then((doc) => {
    if (!doc.exists) {
      alert('⚠️ 指定された共有コードのマップが見つかりませんでした。');
      return;
    }

    const targetMapData = doc.data();
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

    currentMapId = trimmed;
    saveStorage();
    closeDetailPanel();
    closeSearchResultsPanel();
    alert(`🎉 共有マップ「${targetMapData.name}」を読み込みました！`);
    renderAll();
  }).catch((error) => {
    alert('エラー: ' + error.message);
  });
}