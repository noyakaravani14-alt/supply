// סריקת ברקוד/QR במצלמה
/* ---------------- BARCODE SCAN ---------------- */
function startScan(targetInputId){
  const box = document.getElementById('scanBox');
  if(!box){ showToast('לא ניתן לפתוח מצלמה כאן'); return; }
  if(typeof Html5Qrcode === 'undefined'){
    showToast('סורק הברקוד לא נטען - ניתן להזין ידנית');
    return;
  }
  stopScanner();
  box.style.display = 'block';
  box.innerHTML = '<div id="qr-reader" style="width:100%"></div>';
  html5Scanner = new Html5Qrcode("qr-reader", {
    formatsToSupport: [
      Html5QrcodeSupportedFormats.EAN_13,
      Html5QrcodeSupportedFormats.EAN_8,
      Html5QrcodeSupportedFormats.CODE_128,
      Html5QrcodeSupportedFormats.CODE_39,
      Html5QrcodeSupportedFormats.CODE_93,
      Html5QrcodeSupportedFormats.UPC_A,
      Html5QrcodeSupportedFormats.UPC_E,
      Html5QrcodeSupportedFormats.ITF,
      Html5QrcodeSupportedFormats.CODABAR
    ],
    verbose: false
  });
  html5Scanner.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: { width: 260, height: 110 }, experimentalFeatures: { useBarCodeDetectorIfSupported: true } },
    (decodedText)=>{
      const el = document.getElementById(targetInputId);
      if(el) el.value = decodedText;
      stopScanner();
      showToast('נסרק בהצלחה');
    },
    ()=>{}
  ).catch(()=>{
    showToast('לא ניתן לגשת למצלמה - נא הזנה ידנית');
  });
}
function stopScanner(){
  if(html5Scanner){
    try{ html5Scanner.stop().then(()=>html5Scanner.clear()).catch(()=>{}); }catch(e){}
    html5Scanner = null;
  }
  const box = document.getElementById('scanBox');
  if(box){ box.style.display='none'; box.innerHTML=''; }
}
