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

// 共有コードの設定・表示モーダル（コピーボタン配置版）
function exportCode() {
  // 現在設定されている共有コード（なければローカルストレージから取得）
  const currentCode = typeof shareCode !== 'undefined' ? shareCode : (localStorage.getItem('gourmet_share_code') || '');

  const html = `
    <div style="padding:15px; background:#fff; border-radius:8px;">
      <h3 style="margin-top:0; color:#ff4757;"><i class="fa-solid fa-share-nodes"></i> 共有コードの設定・表示</h3>
      <p style="font-size:12px; color:#666; margin-bottom:10px;">
        共有コードには数字と半角英字の組み合わせ（6〜20文字以内）を指定してください。
      </p>

      <label style="font-size:12px; font-weight:bold; color:#333; display:block; margin-bottom:5px;">
        共有コード (数字＋半角英字混在 6〜20文字)
      </label>
      
      <div style="display:flex; gap:8px; margin-bottom:10px;">
        <input type="text" id="share-code-input" value="${currentCode}" placeholder="例: teteteshhie78" style="flex:1; padding:10px; border:1px solid #ccc; border-radius:4px; font-size:14px;">
        <button id="btn-copy-code" onclick="copyShareCode()" style="background:#4b6584; color:#fff; border:none; padding:0 15px; border-radius:4px; cursor:pointer; font-weight:bold; font-size:13px; white-space:nowrap;">
          📋 コピー
        </button>
      </div>

      <div id="share-code-msg" style="display:none; padding:8px; background:#e8f8f5; color:#2e7d32; font-size:12px; border-radius:4px; margin-bottom:10px;">
        🎉 共有コードを正常に更新しました！
      </div>

      <div style="display:flex; gap:10px; margin-top:15px;">
        <button onclick="saveShareCodeSetting()" style="flex:1; background:#ff4757; color:#fff; border:none; padding:12px; border-radius:5px; cursor:pointer; font-weight:bold; font-size:14px;">
          コード更新・保存
        </button>
        <button onclick="closeModal()" style="background:#778ca3; color:#fff; border:none; padding:12px 20px; border-radius:5px; cursor:pointer; font-weight:bold;">
          閉じる
        </button>
      </div>
    </div>
  `;
  openModal(html);
}

// クリップボードへのコピー機能
function copyShareCode() {
  const codeInput = document.getElementById('share-code-input');
  const copyBtn = document.getElementById('btn-copy-code');
  if (!codeInput || !codeInput.value.trim()) {
    alert('⚠️ コピーする共有コードがありません。');
    return;
  }

  codeInput.select();
  codeInput.setSelectionRange(0, 99999); // スマホ対応

  const textToCopy = codeInput.value.trim();

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(textToCopy).then(() => {
      showCopyFeedback(copyBtn);
    }).catch(() => {
      document.execCommand('copy');
      showCopyFeedback(copyBtn);
    });
  } else {
    document.execCommand('copy');
    showCopyFeedback(copyBtn);
  }
}

// ボタンの表示切り替えフィードバック
function showCopyFeedback(btn) {
  if (btn) {
    const originalText = btn.innerHTML;
    btn.innerHTML = '✅ コピー完了！';
    btn.style.background = '#2ed573';
    setTimeout(() => {
      btn.innerHTML = originalText;
      btn.style.background = '#4b6584';
    }, 2000);
  }
}

// 共有コードの保存処理
function saveShareCodeSetting() {
  const input = document.getElementById('share-code-input');
  const msg = document.getElementById('share-code-msg');
  if (!input) return;

  const val = input.value.trim();
  if (val.length < 6 || val.length > 20) {
    alert('⚠️ 共有コードは6〜20文字で入力してください。');
    return;
  }

  if (typeof shareCode !== 'undefined') shareCode = val;
  localStorage.setItem('gourmet_share_code', val);

  if (msg) msg.style.display = 'block';
  if (typeof saveStorage === 'function') saveStorage();
}

// 共有コードの読み込み入力モーダル
function importCodePrompt() {
  const html = `
    <div style="padding:15px; background:#fff; border-radius:8px;">
      <h3 style="margin-top:0; color:#ff4757;"><i class="fa-solid fa-download"></i> 共有コードで読み込み</h3>
      <p style="font-size:12px; color:#666; margin-bottom:10px;">
        発行された共有コードを貼り付けて「読み込む」を押してください。<br>
        <span style="color:#e74c3c;">※現在のデータは上書き・同期されます。</span>
      </p>
      <input type="text" id="import-code-input" placeholder="例: teteteshhie78" style="width:100%; padding:10px; border:1px solid #ccc; border-radius:4px; font-size:14px; box-sizing:border-box; margin-bottom:15px;">
      
      <div style="display:flex; gap:10px;">
        <button onclick="applyImportCode()" style="flex:1; background:#ff4757; color:#fff; border:none; padding:12px; border-radius:5px; cursor:pointer; font-weight:bold; font-size:14px;">
          📥 読み込んで反映
        </button>
        <button onclick="closeModal()" style="background:#778ca3; color:#fff; border:none; padding:12px 20px; border-radius:5px; cursor:pointer; font-weight:bold;">
          キャンセル
        </button>
      </div>
    </div>
  `;
  openModal(html);
}

// 共有コードの解析・適用
function applyImportCode() {
  const codeInput = document.getElementById('import-code-input');
  if (!codeInput || !codeInput.value.trim()) {
    alert('⚠️ 共有コードを入力してください。');
    return;
  }

  const codeVal = codeInput.value.trim();

  // 共有コードを保持・適用
  if (typeof shareCode !== 'undefined') shareCode = codeVal;
  localStorage.setItem('gourmet_share_code', codeVal);

  if (typeof saveStorage === 'function') saveStorage();
  if (typeof renderCurrentMap === 'function') renderCurrentMap();

  closeModal();
  alert('🎉 共有コード（' + codeVal + '）を適用しました！');
}