// Leafletマップの初期化
function initMap() {
  if (mapInstance) return;

  mapInstance = L.map('map', { zoomControl: false }).setView([35.681236, 139.767125], 13);
  
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(mapInstance);

  L.control.zoom({ position: 'topright' }).addTo(mapInstance);

  markersGroup = L.layerGroup().addTo(mapInstance);
  areaLayersGroup = L.layerGroup().addTo(mapInstance);

  mapInstance.on('click', function(e) {
    closeDetailPanel();
    closeSearchResultsPanel();
  });
}

// 全描画更新関数
function renderAll() {
  if (!mapInstance) return;

  const curMap = getCurrentMap();
  
  // マップタイトルの表示更新
  const titleEl = document.getElementById('map-title-display');
  if (titleEl) {
    titleEl.textContent = curMap.name + (curMap.isShared ? " [共有]" : "");
  }

  // 1. エリア描画
  areaLayersGroup.clearLayers();
  if (curMap.areas) {
    curMap.areas.forEach(area => {
      if (currentSelectedAreaId && area.id !== currentSelectedAreaId) return;

      if (area.bounds) {
        const polygon = L.polygon(area.bounds, {
          color: area.color || '#ff6b6b',
          fillColor: area.color || '#ff6b6b',
          fillOpacity: 0.2,
          weight: 2
        }).addTo(areaLayersGroup);

        polygon.bindTooltip(area.name, { permanent: false, direction: 'center' });
      }
    });
  }

  // 2. ピン描画
  markersGroup.clearLayers();
  if (curMap.stores) {
    curMap.stores.forEach(store => {
      // エリアフィルター
      if (currentSelectedAreaId && store.areaId !== currentSelectedAreaId) return;
      // リストフィルター
      if (currentSelectedListId) {
        const targetList = curMap.lists ? curMap.lists.find(l => l.id === currentSelectedListId) : null;
        if (targetList && !targetList.storeIds.includes(store.id)) return;
      }

      // ピンカラー決定（所属エリアの色優先、未設定時はデフォルト）
      let pinColor = '#ff6b6b';
      if (store.areaId && curMap.areas) {
        const area = curMap.areas.find(a => a.id === store.areaId);
        if (area && area.color) pinColor = area.color;
      }

      const customIcon = L.divIcon({
        className: 'custom-pin-icon',
        html: `<div style="background-color: ${pinColor}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3); display:flex; align-items:center; justify-content:center; color:white; font-size:10px;"><i class="fa-solid fa-utensils"></i></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const marker = L.marker([store.lat, store.lng], { icon: customIcon }).addTo(markersGroup);
      marker.on('click', () => {
        showStoreDetail(store.id);
      });
    });
  }

  updateIndicators();
}

// 下部インジケーターテキスト更新
function updateIndicators() {
  const curMap = getCurrentMap();
  
  const areaBtn = document.getElementById('area-indicator');
  if (areaBtn) {
    if (currentSelectedAreaId && curMap.areas) {
      const area = curMap.areas.find(a => a.id === currentSelectedAreaId);
      areaBtn.innerHTML = `<i class="fa-solid fa-layer-group"></i> エリア: ${area ? area.name : '未選択'}`;
      areaBtn.style.color = 'var(--primary-color)';
    } else {
      areaBtn.innerHTML = `<i class="fa-solid fa-layer-group"></i> エリア全表示`;
      areaBtn.style.color = 'var(--text-color)';
    }
  }

  const listBtn = document.getElementById('list-indicator');
  if (listBtn) {
    if (currentSelectedListId && curMap.lists) {
      const list = curMap.lists.find(l => l.id === currentSelectedListId);
      listBtn.innerHTML = `<i class="fa-solid fa-list-check"></i> リスト: ${list ? list.name : '未選択'}`;
      listBtn.style.color = 'var(--primary-color)';
    } else {
      listBtn.innerHTML = `<i class="fa-solid fa-list-check"></i> 全店舗表示`;
      listBtn.style.color = 'var(--text-color)';
    }
  }
}