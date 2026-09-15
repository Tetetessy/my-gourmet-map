import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

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

export let map;
export function setMap(instance) { map = instance; }

export let currentUser = { loggedIn: false, email: '', name: '', uid: '' };
export function setCurrentUser(val) { currentUser = val; }

export let sharedStoreDB = JSON.parse(localStorage.getItem('gourmet_shared_maps')) || {};
export function setSharedStoreDB(val) { sharedStoreDB = val; }

export let maps = [];
export function setMaps(val) { maps = val; }

export let currentMapId = '';
export function setCurrentMapId(val) { currentMapId = val; }

export let tempPinLocation = null;
export function setTempPinLocation(val) { tempPinLocation = val; }

export let tempMarker = null;
export function setTempMarker(val) { tempMarker = val; }

export let mapStoreMarkers = [];
export function setMapStoreMarkers(val) { mapStoreMarkers = val; }

export let mapAreaMarkers = [];
export function setMapAreaMarkers(val) { mapAreaMarkers = val; }

export let currentEditingImages = [];
export function setCurrentEditingImages(val) { currentEditingImages = val; }