/* ==================== テーマ定義 ==================== */
:root {
  --bg-color: #f8f9fa;
  --panel-bg: rgba(255, 255, 255, 0.95);
  --text-color: #212529;
  --primary-color: #ff6b6b;
  --primary-gradient: linear-gradient(135deg, #ff6b6b, #ff8e53);
  --accent-color: #4ecdc4;
  --border-color: #dee2e6;
  --radius: 12px;
  --font-size: 13px;
}
html[data-theme="casual"] {
  --bg-color: #fff8f0; --panel-bg: rgba(255, 248, 240, 0.95); --text-color: #4a3e3d;
  --primary-color: #ff7e67; --primary-gradient: linear-gradient(135deg, #ff7e67, #ffa885);
  --accent-color: #a3deba; --border-color: #e8d5c4; --radius: 14px;
}
html[data-theme="simple"] {
  --bg-color: #ffffff; --panel-bg: rgba(255, 255, 255, 0.98); --text-color: #333333;
  --primary-color: #4a5568; --primary-gradient: linear-gradient(135deg, #4a5568, #718096);
  --accent-color: #718096; --border-color: #e2e8f0; --radius: 6px;
}
html[data-theme="pop"] {
  --bg-color: #fff0f5; --panel-bg: rgba(255, 255, 255, 0.95); --text-color: #1a1a1a;
  --primary-color: #ff007f; --primary-gradient: linear-gradient(135deg, #ff007f, #ff70b5);
  --accent-color: #00e5ff; --border-color: #ffb6c1; --radius: 16px;
}
html[data-theme="light"] {
  --bg-color: #f0f4f8; --panel-bg: rgba(255, 255, 255, 0.95); --text-color: #102a43;
  --primary-color: #0066cc; --primary-gradient: linear-gradient(135deg, #0066cc, #3385ff);
  --accent-color: #38bec9; --border-color: #bccadc; --radius: 8px;
}
html[data-theme="dark"] {
  --bg-color: #121212; --panel-bg: rgba(30, 30, 30, 0.95); --text-color: #e0e0e0;
  --primary-color: #bb86fc; --primary-gradient: linear-gradient(135deg, #bb86fc, #9955e8);
  --accent-color: #03dac6; --border-color: #444444; --radius: 8px;
}

* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; font-size: var(--font-size); color: var(--text-color); background-color: var(--bg-color); height: 100vh; overflow: hidden; }
#map { width: 100vw; height: 100vh; z-index: 1; }

button, input, select, textarea {
  font-size: var(--font-size); padding: 6px 10px; border: 1px solid var(--border-color); border-radius: var(--radius); background: var(--panel-bg); color: var(--text-color); margin: 2px 0; outline: none; transition: all 0.2s;
}
button { cursor: pointer; background: var(--primary-gradient); color: #fff; border: none; font-weight: bold; box-shadow: 0 2px 5px rgba(0,0,0,0.12); }
button:hover { opacity: 0.92; transform: translateY(-1px); }

.top-bar {
  position: absolute; top: 10px; left: 50%; transform: translateX(-50%); z-index: 1000;
  background: var(--panel-bg); padding: 4px 12px; border-radius: var(--radius); border: 1px solid var(--border-color);
  display: flex; gap: 8px; align-items: center; box-shadow: 0 4px 12px rgba(0,0,0,0.08); backdrop-filter: blur(8px); white-space: nowrap;
}

.indicator-btn { cursor: pointer; padding: 3px 6px; border-radius: 6px; user-select: none; font-weight: bold; }
.indicator-btn:hover { background-color: rgba(0, 0, 0, 0.06); text-decoration: underline; }

/* 画面左上：3つのボタンのサイズとスタイルを全統一 */
.top-left { position: absolute; top: 10px; left: 10px; z-index: 1000; display: flex; flex-direction: column; gap: 4px; align-items: flex-start; }
.top-left .action-btn { width: 130px; text-align: center; background: var(--primary-gradient); color: #fff; border: none; }
.top-right { position: absolute; top: 10px; right: 10px; z-index: 1000; }

.area-custom-pin {
  color: #ffffff; border: 2px solid #ffffff; border-radius: 20px; padding: 4px 10px; font-weight: bold; font-size: 11px; white-space: nowrap; box-shadow: 0 3px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; gap: 3px; cursor: pointer;
}

.bottom-left-area { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; width: 100%; }
.search-panel {
  background: var(--panel-bg); backdrop-filter: blur(8px); padding: 10px; border-radius: var(--radius); border: 1px solid var(--border-color); box-shadow: 0 4px 14px rgba(0,0,0,0.15); width: 220px; max-height: 40vh; overflow-y: auto; display: none;
}

.search-results-panel {
  position: absolute; top: 50px; right: 10px; z-index: 999; background: var(--panel-bg); backdrop-filter: blur(8px); padding: 10px; border-radius: var(--radius); border: 1px solid var(--border-color); box-shadow: 0 4px 14px rgba(0,0,0,0.15); width: 250px; max-height: 60vh; overflow-y: auto; display: none;
}

.bottom-center-area { position: absolute; top: 50px; right: 270px; z-index: 1000; width: 260px; display: none; }
.detail-panel { background: var(--panel-bg); backdrop-filter: blur(10px); padding: 12px; border-radius: var(--radius); border: 1px solid var(--border-color); box-shadow: 0 6px 20px rgba(0,0,0,0.2); max-height: 70vh; overflow-y: auto; }

@media (max-width: 768px) {
  :root { --font-size: 11px; }
  button, input, select, textarea { padding: 4px 6px; font-size: 11px; }
  .top-bar { top: 6px; left: 6px; transform: none; right: 55px; justify-content: space-between; padding: 2px 6px; }
  .top-left { top: 40px; left: 6px; gap: 4px; }
  .top-left .action-btn { width: 110px; }
  .top-right { top: 6px; right: 6px; }
  .search-panel { width: 80vw; max-height: 35vh; }
  .search-results-panel { width: 80vw; top: 80px; right: 10px; max-height: 40vh; }
  .bottom-center-area { width: 80vw; top: 130px; right: 10px; }
}

.menu-dropdown {
  display: none; position: absolute; right: 0; top: 36px; background: var(--panel-bg); backdrop-filter: blur(10px); border: 1px solid var(--border-color); border-radius: var(--radius); padding: 8px; width: 210px; max-height: 80vh; overflow-y: auto; box-shadow: 0 8px 24px rgba(0,0,0,0.15); z-index: 1001;
}
.menu-dropdown button { display: block; width: 100%; text-align: left; margin: 2px 0; }

.modal-overlay {
  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0, 0, 0, 0.45); backdrop-filter: blur(4px); z-index: 2000; display: none; justify-content: center; align-items: center; animation: fadeIn 0.2s ease-out;
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

.modal-content {
  background: var(--panel-bg); color: var(--text-color); border-radius: calc(var(--radius) * 1.2); padding: 18px; max-width: 460px; width: 92%; max-height: 85vh; overflow-y: auto; border: 1px solid rgba(255, 255, 255, 0.6); box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
}

.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 2px solid var(--border-color); }
.modal-header h3 { font-size: 15px; font-weight: 700; background: var(--primary-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }

.form-group { margin-bottom: 10px; display: flex; flex-direction: column; gap: 2px; }
.form-group label { font-weight: 600; font-size: 11.5px; opacity: 0.9; }
.stylish-input { width: 100%; padding: 8px 10px; font-size: 13px; border: 1px solid var(--border-color); border-radius: var(--radius); background: rgba(255, 255, 255, 0.9); }
.stylish-input:focus { border-color: var(--primary-color); box-shadow: 0 0 0 2px rgba(255, 107, 107, 0.2); }

/* スライダー（コスパ・キャパ・雰囲気）レイアウトの統一 */
.range-control-row {
  display: grid;
  grid-template-columns: 75px 1fr 75px;
  align-items: center;
  gap: 6px;
  width: 100%;
}
.range-label-left { text-align: right; font-size: 11px; color: #666; white-space: nowrap; }
.range-label-right { text-align: left; font-size: 11px; color: #666; white-space: nowrap; }
.range-slider { width: 100%; cursor: pointer; margin: 0; }

.btn-group { display: flex; gap: 6px; margin-top: 14px; }
.btn-group button { flex: 1; padding: 8px; font-size: 12px; }
.btn-secondary { background: #6c757d; }

.error-msg { color: #e63946; font-size: 11px; margin-top: 4px; display: none; font-weight: 600; background: rgba(230, 57, 70, 0.08); padding: 5px 8px; border-radius: 6px; border-left: 3px solid #e63946; }
.success-msg { color: #2a9d8f; font-size: 11px; margin-top: 4px; display: none; font-weight: 600; background: rgba(42, 157, 143, 0.08); padding: 5px 8px; border-radius: 6px; border-left: 3px solid #2a9d8f; }

.image-preview-box { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 4px; }
.preview-thumb { position: relative; width: 50px; height: 50px; border-radius: 6px; overflow: hidden; border: 1px solid var(--border-color); }
.preview-thumb img { width: 100%; height: 100%; object-fit: cover; }
.preview-thumb .del-btn { position: absolute; top: 0; right: 0; background: rgba(220,53,69,0.85); color: #fff; border: none; font-size: 10px; width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; cursor: pointer; }

.color-picker-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-top: 6px; }
.color-btn { height: 30px; border-radius: 6px; border: 2px solid #fff; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }

.btn-sm-icon { padding: 1px 5px; font-size: 10px; margin-left: 2px; }