// 店舗情報の保存
function saveStore(storeId) {
  const curMap = getCurrentMap();
  if (curMap.isShared) return;

  const name = document.getElementById('store-name').value.trim();
  const genre = document.getElementById('store-genre').value;
  const areaId = document.getElementById('store-area').value;
  const lat = parseFloat(document.getElementById('store-lat').value);
  const lng = parseFloat(document.getElementById('store-lng').value);
  const rating = parseInt(document.getElementById('store-rating').value);
  const memo = document.getElementById('store-memo').value.trim();

  if (!name || isNaN(lat) || isNaN(lng)) {
    alert("店名と正しい緯度・経度を入力してください。");
    return;
  }

  if (storeId) {
    const store = curMap.stores.find(s => s.id === storeId);
    if (store) {
      store.name = name;
      store.genre = genre;
      store.areaId = areaId;
      store.lat = lat;
      store.lng = lng;
      store.rating = rating;
      store.memo = memo;
      store.image = tempImageBase64;
    }
  } else {
    const newStore = {
      id: "store_" + Date.now(),
      name: name,
      genre: genre,
      areaId: areaId,
      lat: lat,
      lng: lng,
      rating: rating,
      memo: memo,
      image: tempImageBase64
    };
    curMap.stores.push(newStore);
  }

  saveStorage();
  closeModal();
  renderAll();
}

// 店舗詳細パネルの表示
function showStoreDetail(storeId) {
  const curMap = getCurrentMap();
  const store = curMap.stores.find(s => s.id === storeId);
  if (!store) return;

  const panel = document.getElementById('detail-panel');
  const area = curMap.areas ? curMap.areas.find(a => a.id === store.areaId) : null;

  let stars = '★'.repeat(store.rating || 0) + '☆'.repeat(5 - (store.rating || 0));

  panel.innerHTML = `
    <div style="display:flex; justify-style:space-between; align-items:flex-start;">
      <div>
        <span style="font-size:11px; background:#eee; padding:2px 6px; border-radius:4px;">${store.genre || 'ジャンル未設定'}</span>
        ${area ? `<span style="font-size:11px; background:${area.color}22; color:${area.color}; padding:2px 6px; border-radius:4px; margin-left:4px;">${area.name}</span>` : ''}
        <h2 style="font-size:18px; margin:6px 0 2px 0;">${store.name}</h2>
        <div style="color:#f39c12; font-size:14px; margin-bottom:8px;">${stars}</div>
      </div>
      <span style="cursor:pointer; font-size:18px; opacity:0.5;" onclick="closeDetailPanel()">✕</span>
    </div>
    ${store.image ? `<img src="${store.image}" style="width:100%; max-height:180px; object-fit:cover; border-radius:8px; margin-bottom:10px;">` : ''}
    <p style="font-size:13px; color:#555; line-height:1.4; margin-bottom:15px;">${store.memo || 'メモはありません。'}</p>
    ${!curMap.isShared ? `
      <div style="display:flex; gap:8px;">
        <button onclick="openStoreModal('${store.id}')" style="flex:1; padding:8px; border:1px solid var(--border-color); background:var(--card-bg); border-radius:6px; font-size:12px;"><i class="fa-solid fa-pen"></i> 編集</button>
        <button onclick="deleteStore('${store.id}')" style="flex:1; padding:8px; border:none; background:#e74c3c; color:white; border-radius:6px; font-size:12px;"><i class="fa-solid fa-trash"></i> 削除</button>
      </div>
    ` : ''}
  `;

  panel.classList.add('active');
}

// 店舗詳細パネルを閉じる
function closeDetailPanel() {
  document.getElementById('detail-panel').classList.remove('active');
}

// 店舗削除
function deleteStore(storeId) {
  if (!confirm("この店舗を削除してもよろしいですか？")) return;

  const curMap = getCurrentMap();
  curMap.stores = curMap.stores.filter(s => s.id !== storeId);
  
  // リストからも削除
  if (curMap.lists) {
    curMap.lists.forEach(l => {
      l.storeIds = l.storeIds.filter(id => id !== storeId);
    });
  }

  saveStorage();
  closeDetailPanel();
  renderAll();
}