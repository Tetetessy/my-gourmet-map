import { auth, currentUser, setCurrentUser } from './config.js';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut, 
  updatePassword, 
  sendPasswordResetEmail 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db } from './config.js';
import { loadCurrentUserData, saveStorage, createDefaultMap } from './data.js';
import { renderCurrentMap } from './map.js';
import { closeModal, toggleMenu } from './ui_modal.js';

export function updateAuthUI() {
  const statusElem = document.getElementById('auth-status');
  const btnElem = document.getElementById('auth-btn');
  const editProfileBtn = document.getElementById('btn-edit-profile');
  const changePassBtn = document.getElementById('btn-change-pass');

  if (currentUser.loggedIn) {
    statusElem.innerText = `👤 ${currentUser.name || 'ユーザー'}`;
    btnElem.innerText = 'ログアウト';
    btnElem.onclick = logout;
    if (editProfileBtn) editProfileBtn.style.display = 'block';
    if (changePassBtn) changePassBtn.style.display = 'block';
  } else {
    statusElem.innerText = 'ゲスト利用中';
    btnElem.innerText = 'ログイン / 登録';
    btnElem.onclick = openAuthModal;
    if (editProfileBtn) editProfileBtn.style.display = 'none';
    if (changePassBtn) changePassBtn.style.display = 'none';
  }
}

export function openAuthModal() {
  toggleMenu();
  const content = document.getElementById('modal-content');
  document.getElementById('modal-overlay').style.display = 'flex';
  content.innerHTML = `
    <div class="modal-header"><h3>アカウント ログイン / 登録</h3></div>
    <div class="form-group"><label>メールアドレス</label><input type="email" id="auth-email" class="stylish-input"></div>
    <div class="form-group"><label>アカウント名（新規登録時のみ有効）</label><input type="text" id="auth-name" class="stylish-input" placeholder="例: グルメ太郎"></div>
    <div class="form-group"><label>パスワード</label><input type="password" id="auth-pass" class="stylish-input"></div>
    <div style="text-align:right; margin-bottom:8px;">
      <a href="javascript:void(0)" id="btn-forgot-otp" style="font-size:11px; color:var(--primary-color); text-decoration:underline;">パスワードを忘れた場合</a>
    </div>
    <div class="btn-group">
      <button id="btn-login">ログイン</button>
      <button id="btn-register" style="background: linear-gradient(135deg, #4ecdc4, #2ab7ca);">新規登録</button>
      <button onclick="closeModal()" class="btn-secondary">閉じる</button>
    </div>
  `;
  document.getElementById('btn-forgot-otp').onclick = sendForgotOtp;
  document.getElementById('btn-login').onclick = () => handleAuth(false);
  document.getElementById('btn-register').onclick = () => handleAuth(true);
}

export async function sendForgotOtp() {
  const email = document.getElementById('auth-email').value.trim();
  if (!email) {
    alert('先にメールアドレスを入力してください。');
    return;
  }
  try {
    await sendPasswordResetEmail(auth, email);
    alert(`📩 ${email} 宛にパスワード再設定用のメールを送信しました。\nメール本文をご確認の上、手続きを行ってください。`);
  } catch (error) {
    alert('⚠️ 再設定メールの送信に失敗しました。メールアドレスをご確認ください。');
  }
}

export async function handleAuth(isRegister) {
  const email = document.getElementById('auth-email').value.trim();
  const name = document.getElementById('auth-name').value.trim();
  const pass = document.getElementById('auth-pass').value.trim();

  if (!email || pass.length < 6) {
    alert('正しいメールアドレスと6文字以上のパスワードを入力してください。');
    return;
  }

  if (isRegister) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const user = userCredential.user;
      const accountName = name || email.split('@')[0];
      const defaultMap = createDefaultMap();

      await setDoc(doc(db, "users", user.uid), {
        name: accountName,
        email: email,
        maps: [defaultMap],
        currentMapId: defaultMap.id
      });

      setCurrentUser({ loggedIn: true, email: email, name: accountName, uid: user.uid });
      await loadCurrentUserData();
      updateAuthUI();
      renderCurrentMap();
      closeModal();
      alert(`🎉 新規登録が完了しました！ようこそ、${accountName}さん。`);
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        alert('⚠️ このメールアドレスは既に登録されています。ログインしてください。');
      } else {
        alert('⚠️ 登録エラー: ' + error.message);
      }
    }
  } else {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      const user = userCredential.user;
      setCurrentUser({ loggedIn: true, email: email, name: user.displayName || email.split('@')[0], uid: user.uid });
      await loadCurrentUserData();
      updateAuthUI();
      renderCurrentMap();
      closeModal();
      alert(`🎉 ログインしました！登録されていた全てのマップ情報を復元しました。`);
    } catch (error) {
      alert('⚠️ アカウント情報が一致しないか登録されていません。正しい情報でログインするか新規登録を行ってください。');
    }
  }
}

export function openEditProfileModal() {
  toggleMenu();
  const content = document.getElementById('modal-content');
  document.getElementById('modal-overlay').style.display = 'flex';
  content.innerHTML = `
    <div class="modal-header"><h3>✏️ アカウント名の変更</h3></div>
    <div class="form-group"><label>新しいアカウント名</label><input type="text" id="new-account-name" class="stylish-input" value="${currentUser.name}"></div>
    <div class="btn-group">
      <button id="btn-save-ac-name">保存</button>
      <button onclick="closeModal()" class="btn-secondary">キャンセル</button>
    </div>
  `;
  document.getElementById('btn-save-ac-name').onclick = saveAccountName;
}

export async function saveAccountName() {
  const newName = document.getElementById('new-account-name').value.trim();
  if (!newName) {
    alert('アカウント名を入力してください。');
    return;
  }
  currentUser.name = newName;
  if (currentUser.loggedIn && currentUser.uid) {
    try {
      await updateDoc(doc(db, "users", currentUser.uid), { name: newName });
    } catch (e) {
      console.error(e);
    }
  }
  saveStorage();
  updateAuthUI();
  closeModal();
  alert('アカウント名を更新しました。');
}

export function openChangePasswordModal() {
  toggleMenu();
  const content = document.getElementById('modal-content');
  document.getElementById('modal-overlay').style.display = 'flex';
  content.innerHTML = `
    <div class="modal-header"><h3>🔑 パスワードの変更</h3></div>
    <div class="form-group"><label>現在のパスワード</label><input type="password" id="cur-pass" class="stylish-input"></div>
    <div class="form-group"><label>新しいパスワード (6文字以上)</label><input type="password" id="new-pass" class="stylish-input"></div>
    <div class="btn-group">
      <button id="btn-save-new-pass">パスワード変更</button>
      <button onclick="closeModal()" class="btn-secondary">キャンセル</button>
    </div>
  `;
  document.getElementById('btn-save-new-pass').onclick = saveNewPassword;
}

export async function saveNewPassword() {
  const curPass = document.getElementById('cur-pass').value.trim();
  const newPass = document.getElementById('new-pass').value.trim();

  if (newPass.length < 6) {
    alert('⚠️ 新しいパスワードは6文字以上で入力してください。');
    return;
  }

  if (auth.currentUser) {
    try {
      await signInWithEmailAndPassword(auth, currentUser.email, curPass);
      await updatePassword(auth.currentUser, newPass);
      closeModal();
      alert('🔑 パスワードを正常に変更しました。');
    } catch (error) {
      alert('⚠️ 現在のパスワードが間違っているか、変更処理に失敗しました。');
    }
  }
}

export async function logout() {
  try {
    await signOut(auth);
  } catch (e) {
    console.error(e);
  }
  setCurrentUser({ loggedIn: false, email: '', name: '', uid: '' });
  await loadCurrentUserData();
  updateAuthUI();
  renderCurrentMap();
}

window.openAuthModal = openAuthModal;
window.openEditProfileModal = openEditProfileModal;
window.openChangePasswordModal = openChangePasswordModal;