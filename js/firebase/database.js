// ============================================================
// Gourmet Map - Firebase Database
// Realtime Database 共通処理
// ============================================================

function getUserDatabaseRef(uid) {
  return database.ref(`users/${uid}`);
}

function getSharedMapDatabaseRef(code) {
  return database.ref(`sharedMaps/${code}`);
}

function getInvalidSharedCodeDatabaseRef(code) {
  return database.ref(`invalidSharedCodes/${code}`);
}