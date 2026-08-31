// שער כניסה - התחברות אישית (Supabase Auth אמיתי, לפי role)
let currentUserRole = null; // 'admin' | 'technician'

async function checkSession(){
  const { data } = await sb.auth.getSession();
  if(!data.session) return false;
  await loadCurrentUserRole();
  return true;
}

async function loadCurrentUserRole(){
  const { data: userData } = await sb.auth.getUser();
  if(!userData?.user) { currentUserRole = null; return; }
  const { data: profile, error } = await sb
    .from('profiles')
    .select('role, full_name')
    .eq('id', userData.user.id)
    .single();
  if(error){
    console.error('שגיאה בטעינת role:', error);
    currentUserRole = null;
    return;
  }
  currentUserRole = profile.role;
}

function renderLoginScreen(errorMsg){
  const app = document.getElementById('app');
  app.innerHTML = `
    <div style="max-width:340px;margin:80px auto;text-align:center;">
      <h1 style="font-size:22px;margin-bottom:6px;">מעקב ציוד ארגוני</h1>
      <div style="color:var(--ink-soft);font-size:13px;margin-bottom:20px;">הזינו שם משתמש וסיסמה</div>
      ${errorMsg ? `<div class="banner" style="background:var(--danger-soft);color:var(--danger);margin-bottom:12px;">${esc(errorMsg)}</div>` : ''}
      <div class="field" style="text-align:right;">
        <input id="login_user" type="text" placeholder="שם משתמש" style="text-align:center;margin-bottom:8px;">
        <input id="login_pass" type="password" placeholder="סיסמה" style="text-align:center;">
      </div>
      <button class="btn-primary" style="width:100%;margin-top:8px;" onclick="submitLogin()">כניסה</button>
    </div>
  `;
  document.getElementById('login_pass').addEventListener('keydown', e=>{ if(e.key==='Enter') submitLogin(); });
  document.getElementById('login_user').focus();
}

async function submitLogin(){
  const user = document.getElementById('login_user').value.trim();
  const pass = document.getElementById('login_pass').value;
  if(!user || !pass){ return; }
  // אם הוזן שם בלי @, ממירים לאימייל פנימי; אם כבר מייל מלא (כמו team@equipment.local), משתמשים כמו שהוא
  const email = user.includes('@') ? user : `${user}@internal.local`;
  const { error } = await sb.auth.signInWithPassword({ email, password: pass });
  if(error){
    renderLoginScreen('שגיאה: שם משתמש או סיסמה שגויים');
    return;
  }
  await loadCurrentUserRole();
  if(!currentUserRole){
    renderLoginScreen('המשתמש קיים אך אין לו הרשאה מוגדרת במערכת. פנו למנהל.');
    await sb.auth.signOut();
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
async function logout(){
  await sb.auth.signOut();
  currentUserRole = null;
  location.reload();
}
