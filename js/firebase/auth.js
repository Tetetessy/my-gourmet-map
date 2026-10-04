// ============================================================
// Gourmet Map - Firebase Authentication
// Firebase Authentication 関連処理
// ============================================================

// Firebase Authentication 状態変化リスナー
// ログイン後はFirebase Realtime Databaseを正本として読み込む
auth.onAuthStateChanged(async (user) => {
  users = JSON.parse(localStorage.getItem('gourmet_users')) || {};
  cloudDataReady = false;

  if (user) {
    currentUser = {
      loggedIn: true,
      email: user.email || '',
      name: user.displayName || (user.email ? user.email.split('@')[0] : 'ユーザー'),
      uid: user.uid
    };
  } else {
    currentUser = {
      loggedIn: false,
      email: '',
      name: '',
      uid: ''
    };
  }

  await loadCurrentUserData();
  cloudDataReady = true;
  updateAuthUI();

  if (map) {
    renderCurrentMap();
  }
});


// ============================================================
// ログイン情報保存
// ============================================================

function getSavedAuthInput(key) {
  try {
    return sessionStorage.getItem(key) || '';
  } catch (e) {
    return '';
  }
}

function saveAuthInputs(email, pass) {
  try {
    sessionStorage.setItem('gourmet_login_email', email || '');
    sessionStorage.setItem('gourmet_login_password', pass || '');
  } catch (e) {}
}


// ============================================================
// ログイン・新規登録モーダル
// ============================================================

function openAuthModal() {
  toggleMenu();

  const content = document.getElementById('modal-content');

  document.getElementById('modal-overlay').style.display = 'flex';

  const savedEmail = getSavedAuthInput('gourmet_login_email');
  const savedPass = getSavedAuthInput('gourmet_login_password');

  content.innerHTML = `
    <div class="modal-header">
      <h3>アカウント ログイン / 登録</h3>
    </div>

    <div class="form-group">
      <label>メールアドレス</label>
      <input
        type="email"
        id="auth-email"
        class="stylish-input"
        value="${savedEmail.replace(/"/g, '&quot;')}"
        autocomplete="email"
      >
    </div>

    <div class="form-group">
      <label>パスワード</label>
      <input
        type="password"
        id="auth-pass"
        class="stylish-input"
        value="${savedPass.replace(/"/g, '&quot;')}"
        autocomplete="current-password"
      >
    </div>

    <div style="text-align:right; margin-bottom:8px;">
      <a
        href="javascript:void(0)"
        onclick="sendForgotOtp()"
        style="font-size:11px; color:var(--primary-color); text-decoration:underline;"
      >
        パスワードを忘れた場合
      </a>
    </div>

    <div class="btn-group">
      <button onclick="handleAuth(false)">ログイン</button>

      <button
        onclick="handleAuth(true)"
        style="background: linear-gradient(135deg, #4ecdc4, #2ab7ca);"
      >
        新規登録
      </button>

      <button onclick="closeModal()" class="btn-secondary">
        閉じる
      </button>
    </div>

    <p style="font-size:10px;color:#777;margin-top:8px;">
      ※新規登録では、メールアドレスとパスワード入力後にアカウント名を登録します。
    </p>
  `;
}


// ============================================================
// パスワード再設定
// ============================================================

function sendForgotOtp() {
  const emailInput = document.getElementById('auth-email');
  const email = emailInput ? emailInput.value.trim() : '';

  if (!email) {
    alert('先にメールアドレスを入力してください。');
    return;
  }

  saveAuthInputs(
    email,
    document.getElementById('auth-pass')?.value || ''
  );

  auth.languageCode = 'ja';

  auth.sendPasswordResetEmail(email)
    .then(() => {
      alert(
        `📩 ${email} 宛にパスワード再設定メールを送信しました。\n\n` +
        '届かない場合は、迷惑メールフォルダとFirebase Authenticationのメールテンプレート設定をご確認ください。'
      );
    })
    .catch((error) => {
      console.error('password reset error:', error);

      const messages = {
        'auth/invalid-email':
          'メールアドレスの形式が正しくありません。',

        'auth/too-many-requests':
          '短時間に送信しすぎています。少し時間を置いて再度お試しください。',

        'auth/network-request-failed':
          '通信に失敗しました。ネットワーク接続を確認してください。'
      };

      alert(
        '⚠️ パスワード再設定メールを送信できませんでした。\n' +
        (messages[error.code] || error.message)
      );
    });
}


// ============================================================
// ログイン / 新規登録
// ============================================================

function handleAuth(isRegister) {
  const email = document.getElementById('auth-email').value.trim();
  const pass = document.getElementById('auth-pass').value;

  if (!email || pass.length < 6) {
    alert(
      '正しいメールアドレスと6文字以上のパスワードを入力してください。'
    );
    return;
  }

  saveAuthInputs(email, pass);

  if (isRegister) {
    auth.createUserWithEmailAndPassword(email, pass)
      .then((userCredential) => {
        const user = userCredential.user;

        currentUser = {
          loggedIn: true,
          email: user.email,
          name: '',
          uid: user.uid
        };

        // FirebaseのAuth状態反映後、
        // アカウント名だけを続けて登録させる。
        openAccountNameSetupModal(user);
      })
      .catch((error) => {
        const messages = {
          'auth/email-already-in-use':
            'このメールアドレスはすでに登録されています。',

          'auth/invalid-email':
            'メールアドレスの形式が正しくありません。',

          'auth/weak-password':
            'パスワードが弱すぎます。6文字以上で設定してください。'
        };

        alert(
          '⚠️ 登録エラー: ' +
          (messages[error.code] || error.message)
        );
      });

  } else {
    auth.signInWithEmailAndPassword(email, pass)
      .then((userCredential) => {
        const user = userCredential.user;

        currentUser = {
          loggedIn: true,
          email: user.email,
          name: user.displayName || user.email.split('@')[0],
          uid: user.uid
        };

        return loadCurrentUserData();
      })
      .then(() => {
        updateAuthUI();
        renderCurrentMap();
        closeModal();

        alert('🎉 Firebaseログインに成功しました！');
      })
      .catch((error) => {
        console.error('login error:', error);

        alert(
          '⚠️ ログインエラー: メールアドレスまたはパスワードが正しくありません。'
        );
      });
  }
}


// ============================================================
// アカウント名 初回登録
// ============================================================

function openAccountNameSetupModal(user) {
  const content = document.getElementById('modal-content');

  document.getElementById('modal-overlay').style.display = 'flex';

  content.innerHTML = `
    <div class="modal-header">
      <h3>👤 アカウント名の登録</h3>
    </div>

    <p style="font-size:11px;color:#666;line-height:1.5;margin-bottom:10px;">
      メールアドレスとパスワードの登録が完了しました。
      最後に表示用のアカウント名を設定してください。
    </p>

    <div class="form-group">
      <label>アカウント名*</label>
      <input
        type="text"
        id="setup-account-name"
        class="stylish-input"
        placeholder="例: グルメ太郎"
        autofocus
      >
    </div>

    <div class="btn-group">
      <button onclick="completeAccountNameSetup()">
        登録完了
      </button>
    </div>
  `;

  window.pendingAccountSetupUid = user.uid;
}

async function completeAccountNameSetup() {
  const name =
    document.getElementById('setup-account-name').value.trim();

  if (!name) {
    alert('アカウント名を入力してください。');
    return;
  }

  const user = auth.currentUser;

  if (
    !user ||
    user.uid !== window.pendingAccountSetupUid
  ) {
    alert('アカウント情報を確認できませんでした。');
    return;
  }

  try {
    await user.updateProfile({
      displayName: name
    });

    currentUser = {
      loggedIn: true,
      email: user.email,
      name,
      uid: user.uid
    };

    if (!maps || !maps.length) {
      const defaultMap = createDefaultMap();

      maps = [defaultMap];
      currentMapId = defaultMap.id;
    }

    await saveStorage();

    updateAuthUI();
    closeModal();
    renderCurrentMap();

    window.pendingAccountSetupUid = null;

    alert(
      `🎉 アカウント登録が完了しました。ようこそ、${name}さん。`
    );

  } catch (error) {
    alert(
      '⚠️ アカウント名の登録に失敗しました: ' +
      error.message
    );
  }
}


// ============================================================
// アカウント名変更
// ============================================================

function openEditProfileModal() {
  toggleMenu();

  const content = document.getElementById('modal-content');

  document.getElementById('modal-overlay').style.display = 'flex';

  content.innerHTML = `
    <div class="modal-header">
      <h3>✏️ アカウント名の変更</h3>
    </div>

    <div class="form-group">
      <label>新しいアカウント名</label>
      <input
        type="text"
        id="new-account-name"
        class="stylish-input"
        value="${currentUser.name}"
      >
    </div>

    <div class="btn-group">
      <button onclick="saveAccountName()">保存</button>
      <button onclick="closeModal()" class="btn-secondary">
        キャンセル
      </button>
    </div>
  `;
}


// Firebase Auth: プロフィール名更新
function saveAccountName() {
  const newName =
    document.getElementById('new-account-name').value.trim();

  if (!newName) {
    alert('アカウント名を入力してください。');
    return;
  }

  const user = auth.currentUser;

  if (user) {
    user.updateProfile({
      displayName: newName
    })
      .then(() => {
        currentUser.name = newName;

        saveStorage();
        updateAuthUI();
        closeModal();

        alert('アカウント名を更新しました。');
      })
      .catch((error) => {
        alert('⚠️ 更新エラー: ' + error.message);
      });

  } else {
    currentUser.name = newName;

    saveStorage();
    updateAuthUI();
    closeModal();
  }
}


// ============================================================
// メールアドレス変更
// ============================================================

function openChangeEmailModal() {
  toggleMenu();

  const content = document.getElementById('modal-content');

  document.getElementById('modal-overlay').style.display = 'flex';

  content.innerHTML = `
    <div class="modal-header">
      <h3>✉️ メールアドレスの変更</h3>
    </div>

    <p style="font-size:10.5px;color:#777;line-height:1.5;margin-bottom:8px;">
      安全確認のため現在のパスワードを入力します。
      変更先アドレスには確認メールが送られます。
    </p>

    <div class="form-group">
      <label>新しいメールアドレス</label>
      <input
        type="email"
        id="new-email"
        class="stylish-input"
        value="${(currentUser.email || '').replace(/"/g, '&quot;')}"
        autocomplete="email"
      >
    </div>

    <div class="form-group">
      <label>現在のパスワード</label>
      <input
        type="password"
        id="email-change-pass"
        class="stylish-input"
        autocomplete="current-password"
      >
    </div>

    <div class="btn-group">
      <button onclick="saveNewEmail()">
        確認メールを送る
      </button>

      <button onclick="closeModal()" class="btn-secondary">
        キャンセル
      </button>
    </div>
  `;
}

async function saveNewEmail() {
  const newEmail =
    document.getElementById('new-email').value.trim();

  const currentPass =
    document.getElementById('email-change-pass').value;

  if (
    !newEmail ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)
  ) {
    alert('正しいメールアドレスを入力してください。');
    return;
  }

  if (!currentPass) {
    alert('現在のパスワードを入力してください。');
    return;
  }

  const user = auth.currentUser;

  if (!user) return;

  if (
    newEmail.toLowerCase() ===
    (user.email || '').toLowerCase()
  ) {
    alert('現在と同じメールアドレスです。');
    return;
  }

  try {
    const credential =
      firebase.auth.EmailAuthProvider.credential(
        user.email,
        currentPass
      );

    await user.reauthenticateWithCredential(credential);

    auth.languageCode = 'ja';

    const actionSettings = {
      url: window.location.href,
      handleCodeInApp: false
    };

    if (typeof user.verifyBeforeUpdateEmail === 'function') {
      await user.verifyBeforeUpdateEmail(
        newEmail,
        actionSettings
      );

      alert(
        `📩 ${newEmail} 宛に確認メールを送信しました。\n` +
        'メール内の確認操作が完了すると新しいアドレスへ変更されます。'
      );

    } else {
      await user.updateEmail(newEmail);

      currentUser.email = newEmail;

      await saveStorage();

      alert('✉️ メールアドレスを変更しました。');
    }

    closeModal();

  } catch (error) {
    console.error('email update error:', error);

    const messages = {
      'auth/wrong-password':
        '現在のパスワードが正しくありません。',

      'auth/invalid-credential':
        '現在のパスワードが正しくありません。',

      'auth/requires-recent-login':
        '再認証に失敗しました。いったんログインし直してください。',

      'auth/email-already-in-use':
        '変更先のメールアドレスはすでに使用されています。',

      'auth/invalid-email':
        '変更先メールアドレスの形式が正しくありません。'
    };

    alert(
      '⚠️ メールアドレス変更に失敗しました。\n' +
      (messages[error.code] || error.message)
    );
  }
}


// ============================================================
// パスワード変更
// ============================================================

function openChangePasswordModal() {
  toggleMenu();

  const content = document.getElementById('modal-content');

  document.getElementById('modal-overlay').style.display = 'flex';

  content.innerHTML = `
    <div class="modal-header">
      <h3>🔑 パスワードの変更</h3>
    </div>

    <div class="form-group">
      <label>新しいパスワード (6文字以上)</label>
      <input
        type="password"
        id="new-pass"
        class="stylish-input"
      >
    </div>

    <div class="btn-group">
      <button onclick="saveNewPassword()">
        パスワード変更
      </button>

      <button onclick="closeModal()" class="btn-secondary">
        キャンセル
      </button>
    </div>
  `;
}


// Firebase Auth: パスワード更新
async function saveNewPassword() {
  const newPass =
    document.getElementById('new-pass').value;

  if (newPass.length < 6) {
    alert(
      '⚠️ 新しいパスワードは6文字以上で入力してください。'
    );
    return;
  }

  const user = auth.currentUser;

  if (!user) return;

  try {
    await user.updatePassword(newPass);

    saveAuthInputs(
      user.email || currentUser.email,
      newPass
    );

    await saveStorage();

    closeModal();

    alert('🔑 パスワードを正常に変更しました。');

  } catch (error) {

    if (error.code === 'auth/requires-recent-login') {
      const currentPass = prompt(
        '安全確認のため、現在のパスワードを入力してください。'
      );

      if (!currentPass) return;

      try {
        const credential =
          firebase.auth.EmailAuthProvider.credential(
            user.email,
            currentPass
          );

        await user.reauthenticateWithCredential(credential);
        await user.updatePassword(newPass);

        saveAuthInputs(
          user.email || currentUser.email,
          newPass
        );

        closeModal();

        alert('🔑 パスワードを変更しました。');

      } catch (reauthError) {
        alert(
          '⚠️ 現在のパスワード確認に失敗しました。'
        );
      }

    } else {
      alert(
        '⚠️ パスワード変更に失敗しました: ' +
        error.message
      );
    }
  }
}


// ============================================================
// ログイン入力値の自動保存
// ============================================================

document.addEventListener('input', function(e) {

  if (
    e.target &&
    e.target.id === 'auth-email'
  ) {
    saveAuthInputs(
      e.target.value,
      document.getElementById('auth-pass')?.value || ''
    );
  }

  if (
    e.target &&
    e.target.id === 'auth-pass'
  ) {
    saveAuthInputs(
      document.getElementById('auth-email')?.value || '',
      e.target.value
    );
  }
});


// ============================================================
// ログアウト
// ============================================================

function logout() {
  auth.signOut()
    .then(() => {

      currentUser = {
        loggedIn: false,
        email: '',
        name: '',
        uid: ''
      };

      localStorage.removeItem('gourmet_current_user');

      loadCurrentUserData();
      updateAuthUI();
      renderCurrentMap();

      alert('ログアウトしました。');
    });
}