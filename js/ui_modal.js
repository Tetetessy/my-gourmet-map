// モーダル表示の共通基盤
function openModal(contentHtml) {
  const overlay = document.getElementById('modal-overlay');
  const content = document.getElementById('modal-content');
  if (overlay && content) {
    content.innerHTML = contentHtml;
    overlay.style.display = 'flex';
  }
}

function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) {
    overlay.style.display = 'none';
  }
}

// ドロップダウンメニューの開閉制御
function toggleMenu() {
  const menu = document.getElementById('dropdown-menu');
  if (menu) {
    menu.classList.toggle('show');
  }
}

function toggleMapDropdown() {
  const menu = document.getElementById('map-dropdown-menu');
  if (menu) {
    menu.classList.toggle('show');
  }
}

// 共有コードの発行モーダル（コピーボタン付き）
function exportCode() {
  if (typeof saveStorage === 'function') {
    saveStorage();
  }
  
  const exportData = {
    maps: typeof maps !== 'undefined' ? maps : [],
    stores: typeof stores !== 'undefined' ? stores : [],
    customLists: typeof customLists !== 'undefined' ? customLists : [],
    areas: typeof areas !== 'undefined' ? areas : []
  };

  try {
    const jsonStr = JSON.stringify(exportData);
    const code = btoa(encodeURIComponent(jsonStr));

    const html = `
      <div style="padding:15px;">
        <h3 style="margin-top:0;"><i class="fa-solid fa-share-nodes"></i> 共有コードの発行</h3>
        <p style="font-size:12px; color:#666;">このコードをコピーして、別端末の「共有コードで読み込み」に入力してください。</p>
        <textarea id="share-code-input" readonly style="width:100%; height:100px; font-size:11px; margin:10px 0; padding:8px; box-sizing:border-box; word-break:break-all; border:1px solid #ccc; border-radius:4px;">${code}</textarea>
        <div style="display:flex; gap:10px; margin-top:10px;">
          <button onclick="copyShareCode()" style="flex:1; background:var(--primary-color, #ff4757); color:#fff; border:none; padding:10px; border-radius:5px; cursor:pointer; font-weight:bold;">
            <i class="fa-solid fa-copy"></i> コードをコピー
          </button>
          <button onclick="closeModal()" style="background:#ccc; border:none; padding:10px 15px; border-radius:5px; cursor:pointer;">閉じる</button>
        </div>
      </div>
    `;
    openModal(html);
  } catch (err) {
    alert('⚠️ 共有コードの生成に失敗しました: ' + err.message);
  }
}

// クリップボードへの自動コピー機能
function copyShareCode() {
  const codeArea = document.getElementById('share-code-input');
  if (!codeArea) return;

  codeArea.select();
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(codeArea.value).then(() => {
      alert('📋 共有コードをクリップボードにコピーしました！');
    }).catch(() => {
      document.execCommand('copy');
      alert('📋 共有コードをコピーしました！');
    });
  } else {
    document.execCommand('copy');
    alert('📋 共有コードをコピーしました！');
  }
}

// 共有コードの読み込み入力モーダル
function importCodePrompt() {
  const html = `
    <div style="padding:15px;">
      <h3 style="margin-top:0;"><i class="fa-solid fa-download"></i> 共有コードで読み込み</h3>
      <p style="font-size:12px; color:#666;">発行された共有コードを貼り付けて「読み込む」を押してください。<br><span style="color:#e74c3c;">※現在のデータは上書き・同期されます。</span></p>
      <textarea id="import-code-input" placeholder="ここに共有コードを貼り付け..." style="width:100%; height:100px; font-size:11px; margin:10px 0; padding:8px; box-sizing:border-box; word-break:break-all; border:1px solid #ccc; border-radius:4px;"></textarea>
      <div style="display:flex; gap:10px; margin-top:10px;">
        <button onclick="applyImportCode()" style="flex:1; background:var(--primary-color, #ff4757); color:#fff; border:none; padding:10px; border-radius:5px; cursor:pointer; font-weight:bold;">
          <i class="fa-solid fa-check"></i> 読み込んで反映
        </button>
        <button onclick="closeModal()" style="background:#ccc; border:none; padding:10px 15px; border-radius:5px; cursor:pointer;">キャンセル</button>
      </div>
    </div>
  `;
  openModal(html);
}

// 共有コードの解析・適用（エラー回避版）
function applyImportCode() {
  const codeInput = document.getElementById('import-code-input');
  if (!codeInput || !codeInput.value.trim()) {
    alert('⚠️ 共有コードを入力してください。');
    return;
  }

  try {
    const rawCode = codeInput.value.trim();
    const jsonStr = decodeURIComponent(atob(rawCode));
    const importedData = JSON.parse(jsonStr);

    if (!importedData.maps || !importedData.stores) {
      throw new Error('データ構造が無効です。');
    }

    // グローバル変数の安全更新
    if (typeof maps !== 'undefined') maps = importedData.maps || [];
    if (typeof stores !== 'undefined') stores = importedData.stores || [];
    if (typeof customLists !== 'undefined') customLists = importedData.customLists || [];
    if (typeof areas !== 'undefined') areas = importedData.areas || [];
    if (typeof currentMapId !== 'undefined' && maps.length > 0) currentMapId = maps[0].id;

    // ローカル保存・Firestore連携・描画更新
    if (typeof saveStorage === 'function') saveStorage();
    if (typeof renderCurrentMap === 'function') renderCurrentMap();

    closeModal();
    alert('🎉 データを正常に読み込み、画面へ反映しました！');
  } catch (err) {
    alert('⚠️ 共有コードの読み込みに失敗しました。正しいコードかご確認ください。\n(' + err.message + ')');
  }
}