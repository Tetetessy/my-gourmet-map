// Firebase Auth イベント監視（ログイン時にデータを全同期）
if (typeof firebase !== 'undefined' && firebase.auth) {
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      currentUser = {
        loggedIn: true,
        email: user.email || '',
        name: user.displayName || user.email.split('@')[0],
        uid: user.uid
      };
      // Firestoreからピン・マップ情報を取得して端末同期
      syncDataFromFirestore(user.uid);
    } else {
      currentUser = { loggedIn: false, email: '', name: '', uid: '' };
    }
    updateAuthUI();
  });
}

// Firestoreから最新のピン・マップ情報を安全取得
function syncDataFromFirestore(uid) {
  if (typeof firebase === 'undefined' || !firebase.firestore) return;

  const db = firebase.firestore();
  db.collection('users').doc(uid).get().then((doc) => {
    if (doc.exists) {
      const data = doc.data();
      if (data.maps) maps = data.maps;
      if (data.stores) stores = data.stores;
      if (data.customLists) customLists = data.customLists;
      if (data.areas) areas = data.areas;
      if (data.currentMapId) currentMapId = data.currentMapId;

      if (typeof saveStorage === 'function') saveStorage();
      if (typeof renderCurrentMap === 'function') renderCurrentMap();
    }
    updateAuthUI();
  }).catch((error) => {
    console.error("Firestore同期エラー:", error);
    updateAuthUI();
  });
}

// 認証UIの更新
function updateAuthUI() {
  const displayElem = document.getElementById('user-display-name');
  if (displayElem) {
    displayElem.textContent = currentUser.loggedIn ? currentUser.name : '未ログイン';
  }
}

// ログイン・登録モーダル表示
function openAccountModal() {
  if (currentUser.loggedIn) {
    const html = `
      <div style="padding:15px;">
        <h3 style="margin-top:0;"><i class="fa-solid fa-user-gear"></i> アカウント設定</h3>
        <p style="font-size:13px;">ログイン中: <strong>${currentUser.name}</strong> (${currentUser.email})</p>
        <div style="display:flex; flex-direction:column; gap:8px; margin-top:15px;">
          <button onclick="openEditProfileModal()" style="padding:8px; border:1px solid #ccc; background:#f9f9f9; border-radius:4px; cursor:pointer;">表示名の変更</button>
          <button onclick="openChangePasswordModal()" style="padding:8px; border:1px solid #ccc; background:#f9f9f9; border-radius:4px; cursor:pointer;">パスワード変更</button>
          <button onclick="handleLogout()" style="padding:8px; border:none; background:#e74c3c; color:#fff; border-radius:4px; cursor:pointer; font-weight:bold;">ログアウト</button>
          <button onclick="closeModal()" style="padding:8px; border:none; background:#ccc; border-radius:4px; cursor:pointer; margin-top:5px;">閉じる</button>
        </div>
      </div>
    `;
    openModal(html);
  } else {
    openAuthModal(false);
  }
}

function openAuthModal(isRegister = false) {
  const title = isRegister ? '新規ユーザー登録' : 'ログイン';
  const actionText = isRegister ? '登録する' : 'ログイン';
  const switchText = isRegister ? 'アカウントをお持ちの方（ログイン）' : '新規登録はこちら';

  const html = `
    <div style="padding:15px;">
      <h3 style="margin-top:0;"><i class="fa-solid fa-right-to-bracket"></i> ${title}</h3>
      <input type="email" id="auth-email" placeholder="メールアドレス" style="width:100%; margin:5px 0; padding:8px; box-sizing:border-box;">
      <input type="password" id="auth-password" placeholder="パスワード(6文字以上)" style="width:100%; margin:5px 0; padding:8px; box-sizing:border-box;">
      <div style="margin-top:10px; display:flex; gap:10px;">
        <button onclick="handleAuth(${isRegister})" style="flex:1; background:var(--primary-color, #ff4757); color:#fff; border:none; padding:10px; border-radius:4px; cursor:pointer; font-weight:bold;">${actionText}</button>
        <button onclick="closeModal()" style="background:#ccc; border:none; padding:10px 15px; border-radius:4px; cursor:pointer;">閉じる</button>
      </div>
      <div style="margin-top:12px; text-align:center;">
        <a href="#" onclick="openAuthModal(${!isRegister}); return false;" style="font-size:12px; color:#666;">${switchText}</a>
      </div>
    </div>
  `;
  openModal(html);
}

// ログイン・登録実行
function handleAuth(isRegister) {
  const email = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value.trim();

  if (!email || !password) {
    alert('⚠️ メールアドレスとパスワードを入力してください。');
    return;
  }

  const authObj = firebase.auth();
  const authPromise = isRegister
    ? authObj.createUserWithEmailAndPassword(email, password)
    : authObj.signInWithEmailAndPassword(email, password);

  authPromise.then((userCredential) => {
    closeModal();
    alert(isRegister ? '🎉 アカウントを登録しました！' : '🔓 ログインしました！');
  }).catch((error) => {
    alert('⚠️ エラー: ' + error.message);
  });
}

// パスワード変更モーダル
function openChangePasswordModal() {
  const html = `
    <div style="padding:15px;">
      <h3 style="margin-top:0;"><i class="fa-solid fa-key"></i> パスワード変更</h3>
      <input type="password" id="new-pass" placeholder="新しいパスワード(6文字以上)" style="width:100%; margin:10px 0; padding:8px; box-sizing:border-box;">
      <div style="display:flex; gap:10px; margin-top:10px;">
        <button onclick="saveNewPassword()" style="flex:1; background:var(--primary-color, #ff4757); color:#fff; border:none; padding:10px; border-radius:4px; cursor:pointer; font-weight:bold;">変更を保存</button>
        <button onclick="closeModal()" style="background:#ccc; border:none; padding:10px 15px; border-radius:4px; cursor:pointer;">キャンセル</button>
      </div>
    </div>
  `;
  openModal(html);
}

// パスワード変更実行
function saveNewPassword() {
  const newPass = document.getElementById('new-pass').value.trim();
  if (newPass.length < 6) {
    alert('⚠️ パスワードは6文字以上で入力してください。');
    return;
  }

  const user = firebase.auth().currentUser;
  if (user) {
    user.updatePassword(newPass).then(() => {
      closeModal();
      alert('🔑 パスワードを正常に変更しました。');
    }).catch((error) => {
      alert('⚠️ エラー: 再ログインが必要な場合があります。 (' + error.message + ')');
    });
  }
}

// 表示名編集モーダル
function openEditProfileModal() {
  const html = `
    <div style="padding:15px;">
      <h3 style="margin-top:0;"><i class="fa-solid fa-user-pen"></i> 表示名の変更</h3>
      <input type="text" id="edit-user-name" value="${currentUser.name}" style="width:100%; margin:10px 0; padding:8px; box-sizing:border-box;">
      <div style="display:flex; gap:10px; margin-top:10px;">
        <button onclick="saveAccountName()" style="flex:1; background:var(--primary-color, #ff4757); color:#fff; border:none; padding:10px; border-radius:4px; cursor:pointer; font-weight:bold;">保存</button>
        <button onclick="closeModal()" style="background:#ccc; border:none; padding:10px 15px; border-radius:4px; cursor:pointer;">キャンセル</button>
      </div>
    </div>
  `;
  openModal(html);
}

// 表示名保存
function saveAccountName() {
  const nameInput = document.getElementById('edit-user-name');
  if (!nameInput) return;
  const newName = nameInput.value.trim();
  if (!newName) return;

  const user = firebase.auth().currentUser;
  if (user) {
    user.updateProfile({ displayName: newName }).then(() => {
      currentUser.name = newName;
      updateAuthUI();
      closeModal();
      alert('👤 表示名を更新しました。');
    });
  }
}

// ログアウト処理
function handleLogout() {
  if (firebase.auth()) {
    firebase.auth().signOut().then(() => {
      currentUser = { loggedIn: false, email: '', name: '', uid: '' };
      localStorage.removeItem('gourmet_current_user');
      updateAuthUI();
      closeModal();
      alert('ログアウトしました。');
    });
  }
}