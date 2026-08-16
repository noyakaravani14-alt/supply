// זיהוי המספר המודפס (מק"ט/סיריאלי) מתחת לברקוד באמצעות צילום + OCR
// (במקום לנסות לפענח את קווי הברקוד עצמם, שלא נקרא בצורה אמינה ב-Safari באייפון)

function loadTesseract(){
  return new Promise((resolve, reject)=>{
    if(typeof Tesseract !== 'undefined'){ resolve(); return; }
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
    s.onload = ()=>resolve();
    s.onerror = ()=>reject(new Error('tesseract load failed'));
    document.head.appendChild(s);
  });
}

async function startScan(targetInputId){
  const box = document.getElementById('scanBox');
  if(!box){ showToast('לא ניתן לפתוח מצלמה כאן'); return; }
  stopScanner();
  box.style.display = 'block';
  box.innerHTML = `
    <div style="position:relative;">
      <video id="ocrVideo" autoplay playsinline muted style="width:100%;display:block;border-radius:8px;background:#000;"></video>
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:85%;height:150px;border:2px solid var(--accent);border-radius:6px;pointer-events:none;"></div>
    </div>
    <div style="font-size:11px;color:var(--ink-soft);text-align:center;margin-top:6px;">מקמי את כל התווית (הברקוד + המספר מתחתיו) בתוך המסגרת הכתומה</div>
    <div style="display:flex;gap:8px;margin-top:8px;">
      <button class="btn-primary" style="flex:1;" onclick="captureAndRecognize('${targetInputId}')">📸 צלמי את המספר</button>
      <button class="btn-ghost" onclick="stopScanner()">ביטול</button>
    </div>
    <div id="ocrStatus" style="font-size:12px;color:var(--ink-soft);margin-top:6px;text-align:center;"></div>
  `;
  try{
    html5Scanner = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
    document.getElementById('ocrVideo').srcObject = html5Scanner;
  }catch(e){
    showToast('לא ניתן לגשת למצלמה - נא הזנה ידנית');
    stopScanner();
  }
}

async function captureAndRecognize(targetInputId){
  const video = document.getElementById('ocrVideo');
  const statusEl = document.getElementById('ocrStatus');
  if(!video || !video.videoWidth) return;

  // גזירת האזור שבתוך המסגרת הכתומה (85% מהרוחב, 150px גובה, ממורכז)
  const cropCanvas = document.createElement('canvas');
  const scaleX = video.videoWidth / video.clientWidth;
  const scaleY = video.videoHeight / video.clientHeight;
  const cropW = video.clientWidth * 0.85 * scaleX;
  const cropH = 150 * scaleY;
  const cropX = (video.videoWidth - cropW) / 2;
  const cropY = (video.videoHeight - cropH) / 2;
  cropCanvas.width = cropW;
  cropCanvas.height = cropH;
  cropCanvas.getContext('2d').drawImage(video, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

  // הגדלה פי 2 - עוזר משמעותית לזיהוי טקסט קטן
  const canvas = document.createElement('canvas');
  canvas.width = cropW * 2;
  canvas.height = cropH * 2;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(cropCanvas, 0, 0, canvas.width, canvas.height);

  if(statusEl) statusEl.textContent = 'מזהה מספר...';
  try{
    await loadTesseract();
    const { data } = await Tesseract.recognize(canvas, 'eng', {
      tessedit_char_whitelist: '0123456789',
      tessedit_pageseg_mode: '6'
    });
    const digits = (data.text || '').replace(/\D/g, '');
    if(digits){
      const el = document.getElementById(targetInputId);
      if(el) el.value = digits;
      showToast('זוהה: ' + digits + ' - בדקי ותקני אם צריך');
      stopScanner();
    } else if(statusEl){
      statusEl.textContent = 'לא זוהה מספר - כווני טוב יותר ונסי שוב';
    }
  }catch(e){
    if(statusEl) statusEl.textContent = 'שגיאה בזיהוי - נא הזנה ידנית';
  }
}

function stopScanner(){
  if(html5Scanner){
    try{ html5Scanner.getTracks().forEach(t=>t.stop()); }catch(e){}
    html5Scanner = null;
  }
  const box = document.getElementById('scanBox');
  if(box){ box.style.display='none'; box.innerHTML=''; }
}
