// ============================================================
// Gourmet Map - State
// アプリケーション共通状態
// ============================================================

let map;

let currentUser = {
  loggedIn: false,
  email: '',
  name: '',
  uid: ''
};

let users = JSON.parse(
  localStorage.getItem('gourmet_users')
) || {};

let sharedStoreDB = JSON.parse(
  localStorage.getItem('gourmet_shared_maps')
) || {};

let maps = [];

let currentMapId = '';

let tempPinLocation = null;

let tempMarker = null;

let pendingRegistrationType = null;

let pendingMoveTarget = null;

let mapStoreMarkers = [];

let mapAreaMarkers = [];

let currentEditingImages = [];

let cloudDataReady = false;

let cloudSaveInProgress = Promise.resolve();