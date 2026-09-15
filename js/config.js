// ==========================================
// 1. Firebase 初期化設定
// ==========================================
// ※FirebaseのSDK読み込みと初期化
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getAuth, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCwCvKcYkGdqsIf9srXHiX4RGKtEEi0Tj8",
  authDomain: "my-gourmet-map-25508.firebaseapp.com",
  databaseURL: "https://my-gourmet-map-25508-default-rtdb.firebaseio.com",
  projectId: "my-gourmet-map-25508",
  storageBucket: "my-gourmet-map-25508.firebasestorage.app",
  messagingSenderId: "118013321716",
  appId: "1:118013321716:web:33dd3ea5c2ce2aa50fd9a1",
  measurementId: "G-RM3R988L24"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// ==========================================
// 2. 定数定義
// ==========================================
export const AREA_COLORS = [
  { id: 'teal', label: 'エメラルド', bg: 'linear-gradient(135deg, #4ecdc4, #2ab7ca)' },
  { id: 'rose', label: 'ローズ', bg: 'linear-gradient(135deg, #ff6b6b, #ee5253)' },
  { id: 'amber', label: 'アンバー', bg: 'linear-gradient(135deg, #ff9f43, #f39c12)' },
  { id: 'ocean', label: 'オーシャン', bg: 'linear-gradient(135deg, #54a0ff, #2e86de)' },
  { id: 'purple', label: 'パープル', bg: 'linear-gradient(135deg, #a55eea, #8e44ad)' },
  { id: 'mint', label: 'ティール', bg: 'linear-gradient(135deg, #1dd1a1, #10ac84)' },
  { id: 'dark', label: 'ダーク', bg: 'linear-gradient(135deg, #576574, #222f3e)' },
  { id: 'gold', label: 'ゴールド', bg: 'linear-gradient(135deg, #f1c40f, #d35400)' }
];

export const FORM_OPTIONS = [
  'レストラン', 'ビアレストラン', 'ブッフェ', 'ダイニング', 'カフェ', 
  'カフェダイニング', 'カレー屋', 'ケーキ屋', 'パン屋', 'スイーツ', 
  '料亭', '郷土料理屋', '小料理屋', 'ラーメン屋', '焼肉屋', 
  '居酒屋', 'バー', '屋台', 'キッチンカー', '野外', 'ビアガーデン', 'その他'
];

export const GENRE_OPTIONS = [
  '和食', '洋食', '中華', '韓国', 'アジアン', 'エスニック', '他国料理', 
  '郷土料理', 'ジビエ', '寿司', '焼肉', 'ラーメン', 'カレー', '魚系', 
  '肉系', '野菜系', 'スイーツ系', 'カフェ', '居酒屋', 'ビーガン', 'ゲテモノ', 'その他'
];

// グローバル状態管理変数
window.map = null;
window.currentUser = { loggedIn: false, email: '', name: '', uid: '' };
window.sharedStoreDB = JSON.parse(localStorage.getItem('gourmet_shared_maps')) || {};

window.maps = [];
window.currentMapId = '';
window.tempPinLocation = null; 
window.tempMarker = null;

window.mapStoreMarkers = [];
window.mapAreaMarkers = [];
window.currentEditingImages = [];

// UI制御関数
window.toggleMenu = function() {
  const dropdown = document.getElementById('menu-dropdown');
  if (dropdown) dropdown.style.display = (dropdown.style.display === 'block') ? 'none' : 'block';
};

window.toggleSearchPanel = function() {
  const panel = document.getElementById('search-panel');
  if (!panel) return;
  const isVisible = panel.style.display === 'block';
  panel.style.display = isVisible ? 'none' : 'block';
  if (!isVisible && typeof filterStores === 'function') filterStores();
};

window.closeSearchResultsPanel = function() {
  const el = document.getElementById('search-results-panel');
  if (el) el.style.display = 'none';
};

window.closeDetailPanel = function() {
  const el = document.getElementById('detail-area');
  if (el) el.style.display = 'none';
};

window.closeModal = function() {
  const el = document.getElementById('modal-overlay');
  if (el) el.style.display = 'none';
};

window.changeTheme = function(themeName) {
  document.documentElement.setAttribute('data-theme', themeName);
};

window.generateDefaultShareCode = function() {
  const alpha = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const nums = '0123456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += alpha.charAt(Math.floor(Math.random() * alpha.length));
    code += nums.charAt(Math.floor(Math.random() * nums.length));
  }
  return code;
};

window.createDefaultMap = function(id, name) {
  return { id: id || window.generateDefaultShareCode(), name: name || 'マイグルメマップ', stores: [], areas: [], lists: [], isShared: false };
};

window.loadCurrentUserData = async function() {
  if (window.currentUser.loggedIn && window.currentUser.uid) {
    try {
      const userDocRef = doc(db, "users", window.currentUser.uid);
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        window.currentUser.name = data.name || window.currentUser.name || 'ユーザー';
        window.maps = data.maps || [];
        window.currentMapId = data.currentMapId || (window.maps[0] ? window.maps[0].id : '');
      } else {
        const defaultMap = window.createDefaultMap();
        window.maps = [defaultMap];
        window.currentMapId = defaultMap.id;
      }
    } catch (e) {
      console.error("Firebaseデータ取得失敗", e);
    }
  } else {
    window.maps = JSON.parse(localStorage.getItem('gourmet_guest_maps')) || [];
    window.currentMapId = localStorage.getItem('gourmet_guest_map_id') || '';
  }
  
  if (!window.maps || window.maps.length === 0) {
    const defaultMap = window.createDefaultMap();
    window.maps = [defaultMap];
    window.currentMapId = defaultMap.id;
  }
  if (!window.currentMapId || !window.maps.find(m => m.id === window.currentMapId)) {
    window.currentMapId = window.maps[0].id;
  }
  window.maps.forEach(m => { if (!m.lists) m.lists = []; });
};

window.getCurrentMap = function() {
  return window.maps.find(m => m.id === window.currentMapId) || window.maps[0];
};

window.saveStorage = async function() {
  try {
    const curMap = window.getCurrentMap();
    if (curMap && !curMap.isShared) {
      window.sharedStoreDB[curMap.id] = {
        id: curMap.id,
        name: curMap.name,
        stores: JSON.parse(JSON.stringify(curMap.stores || [])),
        areas: JSON.parse(JSON.stringify(curMap.areas || [])),
        lists: JSON.parse(JSON.stringify(curMap.lists || []))
      };
      localStorage.setItem('gourmet_shared_maps', JSON.stringify(window.sharedStoreDB));
    }

    if (window.currentUser.loggedIn && window.currentUser.uid) {
      const userDocRef = doc(db, "users", window.currentUser.uid);
      await setDoc(userDocRef, {
        name: window.currentUser.name || 'ユーザー',
        email: window.currentUser.email,
        maps: window.maps,
        currentMapId: window.currentMapId
      }, { merge: true });
    } else {
      localStorage.setItem('gourmet_guest_maps', JSON.stringify(window.maps));
      localStorage.setItem('gourmet_guest_map_id', window.currentMapId);
    }
    if (typeof renderCurrentMap === 'function') renderCurrentMap();
  } catch (e) {
    alert('データの保存に失敗しました。容量オーバーまたは通信状態をご確認ください。');
  }
};