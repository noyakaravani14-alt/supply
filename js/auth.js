// שער כניסה - סיסמה משותפת לצוות (מומש כהתחברות Supabase Auth אמיתית)
// חשוב: זה לא רק תג בממשק - ה-RLS ב-Supabase דורש התחברות, אז בלי סיסמה נכונה
// אי אפשר לקרוא או לכתוב נתונים גם דרך ה-API ישירות.

const SHARED_LOGIN_EMAIL = "team@equipment.local"; // ראו README.md - חייב להתאים למשתמש שיצרת ב-Supabase

async function checkSession(){
  const { data } = await sb.auth.getSession();
  return !!data.session;
}

function renderLoginScreen(errorMsg){
  const app = document.getElementById('app');
  app.innerHTML = `
    <div style="max-width:340px;margin:80px auto;text-align:center;">
      <h1 style="font-size:22px;margin-bottom:6px;">מעקב ציוד ארגוני</h1>
      <div style="color:var(--ink-soft);font-size:13px;margin-bottom:20px;">הזינו את הסיסמה המשותפת כדי להיכנס</div>
      ${errorMsg ? `<div class="banner" style="background:var(--danger-soft);color:var(--danger);margin-bottom:12px;">${esc(errorMsg)}</div>` : ''}
      <div class="field" style="text-align:right;">
        <input id="login_pass" type="password" placeholder="סיסמה" style="text-align:center;">
      </div>
      <button class="btn-primary" style="width:100%;margin-top:8px;" onclick="submitLogin()">כניסה</button>
    </div>
  `;
  document.getElementById('login_pass').addEventListener('keydown', e=>{ if(e.key==='Enter') submitLogin(); });
  document.getElementById('login_pass').focus();
}

async function submitLogin(){
  const pass = document.getElementById('login_pass').value;
  if(!pass){ return; }
  const { error } = await sb.auth.signInWithPassword({ email: SHARED_LOGIN_EMAIL, password: pass });
  if(error){
    renderLoginScreen('שגיאה מ-Supabase: ' + error.message);
    return;
  }
  loadData();
}

async function initApp(){
  const loggedIn = await checkSession();
  if(loggedIn){
    loadData();
  } else {
    renderLoginScreen();
  }
}