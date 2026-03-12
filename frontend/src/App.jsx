import { useState, useRef, useEffect, useCallback } from "react";
import api from "./api";

/* ─── LIGHT THEME COLORS ─────────────────────────────────── */
const C = {
  bg:        "#faf8f4",
  surface:   "#ffffff",
  card:      "#f5f2ec",
  border:    "#e8e0d0",
  accent:    "#c47d1e",
  accentBg:  "#fdf3e3",
  green:     "#3d9655",
  greenBg:   "#edf7f0",
  red:       "#c94e4e",
  redBg:     "#fdf0f0",
  text:      "#1c1814",
  muted:     "#7a7060",
  dim:       "#c8bfb0",
  shadow:    "0 2px 12px rgba(0,0,0,0.08)",
  shadow2:   "0 8px 32px rgba(0,0,0,0.12)",
};
const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');`;
const AVATAR_COLORS = ["#c47d1e","#3d9655","#8b5cf6","#c94e4e","#0891b2","#d97706","#059669"];
const mkInitials = n => n.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2);
const pickColor  = s => AVATAR_COLORS[s.charCodeAt(0) % AVATAR_COLORS.length];
const timeAgo = d => {
  if (!d) return "";
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return "Just now";
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
};

/* ─── SMALL REUSABLE UI ──────────────────────────────────── */
function Av({ user, size = 36, ring = false }) {
  if (!user) return null;
  const col = user.color || pickColor(user.name || "A");
  const initials = user.initials || mkInitials(user.name || "?");
  const src = user.avatar_url
    ? (user.avatar_url.startsWith("http") ? user.avatar_url : user.avatar_url)
    : null;
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      border: ring ? `2.5px solid ${col}` : `2px solid ${col}44`,
      background: src ? "transparent" : `${col}18`,
      display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
    }}>
      {src
        ? <img src={src} alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }} />
        : <span style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:size*0.36, color:col }}>{initials}</span>
      }
    </div>
  );
}

function Field({ label, type="text", value, onChange, placeholder, error, autoFocus, hint }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
      {label && <label style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.muted,letterSpacing:"0.9px",textTransform:"uppercase",fontWeight:600 }}>{label}</label>}
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} autoFocus={autoFocus}
        style={{ background:C.surface, border:`1.5px solid ${error?C.red:C.border}`, borderRadius:12, padding:"13px 15px", color:C.text, outline:"none", fontFamily:"'DM Sans',sans-serif", fontSize:16, width:"100%", boxSizing:"border-box", transition:"border-color .2s" }}
        onFocus={e=>e.target.style.borderColor=error?C.red:C.accent}
        onBlur={e=>e.target.style.borderColor=error?C.red:C.border}
      />
      {hint && !error && <span style={{color:C.muted,fontSize:12,fontFamily:"'DM Sans',sans-serif"}}>{hint}</span>}
      {error && <span style={{color:C.red,fontSize:12,fontFamily:"'DM Sans',sans-serif"}}>{error}</span>}
    </div>
  );
}

function PBtn({ children, onClick, disabled, loading, small, fullWidth=true }) {
  return (
    <button onClick={onClick} disabled={disabled||loading} style={{
      background: disabled||loading ? C.dim : C.accent, border:"none", borderRadius:12,
      padding: small ? "10px 16px" : "14px 20px", width: fullWidth ? "100%" : "auto",
      color: disabled||loading ? "#fff" : "#fff", fontFamily:"'DM Sans',sans-serif",
      fontWeight:700, fontSize:small?13:15, cursor:disabled||loading?"default":"pointer",
      opacity: loading ? 0.7 : 1, transition:"all .15s",
    }}>
      {loading ? "⏳ Loading…" : children}
    </button>
  );
}
function GBtn({ children, onClick, small, fullWidth=true }) {
  return (
    <button onClick={onClick} style={{
      background: C.surface, border:`1.5px solid ${C.border}`, borderRadius:12,
      padding: small ? "10px 16px" : "13px 20px", width: fullWidth ? "100%" : "auto",
      color: C.text, fontFamily:"'DM Sans',sans-serif", fontSize:small?13:15, cursor:"pointer",
    }}>
      {children}
    </button>
  );
}

function Spinner() {
  return (
    <div style={{ display:"flex", justifyContent:"center", alignItems:"center", padding:40 }}>
      <div style={{ width:32,height:32,borderRadius:"50%",border:`3px solid ${C.border}`,borderTopColor:C.accent,animation:"spin 0.8s linear infinite" }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function Toast({ msg, type="success" }) {
  if (!msg) return null;
  return (
    <div style={{
      position:"fixed", bottom:90, left:"50%", transform:"translateX(-50%)", zIndex:9999,
      background: type==="error" ? C.red : C.green, color:"#fff",
      padding:"12px 20px", borderRadius:20, fontFamily:"'DM Sans',sans-serif",
      fontSize:14, fontWeight:600, boxShadow:C.shadow2, whiteSpace:"nowrap",
    }}>{msg}</div>
  );
}

/* ═══════════════════════════════════════════════════════════ */
/*  AUTH                                                        */
/* ═══════════════════════════════════════════════════════════ */
function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [lf, setLf]     = useState({ id:"", pw:"" });
  const [lerr, setLerr] = useState("");
  const [lload, setLload] = useState(false);
  const [rf, setRf]     = useState({ name:"", handle:"", email:"", pw:"", pw2:"" });
  const [rerr, setRerr] = useState({});
  const [setup, setSetup] = useState({ bio:"", avatar:null, color:AVATAR_COLORS[0] });
  const [rload, setRload] = useState(false);
  const [pendingData, setPendingData] = useState(null); // after step1

  const doLogin = async () => {
    setLerr(""); setLload(true);
    try {
      const { data } = await api.post("/auth/login", { identifier: lf.id, password: lf.pw });
      localStorage.setItem("se_token", data.token);
      onLogin(data.user);
    } catch (e) {
      setLerr(e.response?.data?.error || "Login failed");
    } finally { setLload(false); }
  };

  const doRegStep1 = () => {
    const e = {};
    if (!rf.name.trim()) e.name = "Required";
    if (!rf.handle.trim()) e.handle = "Required";
    else if (!/^[a-z0-9_]+$/i.test(rf.handle)) e.handle = "Letters, numbers, _ only";
    if (!rf.email.trim() || !/\S+@\S+\.\S+/.test(rf.email)) e.email = "Valid email required";
    if (rf.pw.length < 6) e.pw = "Min 6 characters";
    if (rf.pw !== rf.pw2) e.pw2 = "Passwords don't match";
    setRerr(e);
    if (Object.keys(e).length) return;
    setPendingData({ name:rf.name, handle:rf.handle, email:rf.email, password:rf.pw });
    setMode("setup");
  };

  const doCreate = async () => {
    setRload(true);
    try {
      const { data } = await api.post("/auth/register", { ...pendingData, bio:setup.bio, color:setup.color });
      localStorage.setItem("se_token", data.token);
      // Upload avatar if selected
      if (setup.avatar) {
        try {
          const blob = await fetch(setup.avatar).then(r=>r.blob());
          const fd = new FormData(); fd.append("avatar", blob, "avatar.jpg");
          const { data: av } = await api.post("/users/me/avatar", fd);
          data.user.avatar_url = av.avatar_url;
        } catch {}
      }
      onLogin(data.user);
    } catch (e) {
      alert(e.response?.data?.error || "Registration failed");
    } finally { setRload(false); }
  };

  const Shell = ({ children }) => (
    <div style={{ minHeight:"100vh",minHeight:"100dvh", background:C.bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"24px 16px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:28 }}>
        <div style={{ width:44,height:44,borderRadius:13,background:C.accent,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 12px rgba(196,125,30,0.4)" }}>
          <span style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:"#fff",fontWeight:700 }}>SE</span>
        </div>
        <span style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:24,color:C.text,fontWeight:700 }}>Sync Everyone</span>
      </div>
      <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:20, padding:"28px 22px", width:"100%", maxWidth:440, boxShadow:C.shadow2 }}>
        {children}
      </div>
    </div>
  );

  if (mode === "login") return (
    <Shell>
      <h2 style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:28,color:C.text,margin:"0 0 4px",fontWeight:700 }}>Welcome back</h2>
      <p style={{ color:C.muted,fontSize:14,fontFamily:"'DM Sans',sans-serif",margin:"0 0 24px" }}>Sign in to your account</p>
      <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
        <Field label="Username or Email" value={lf.id} onChange={v=>setLf(l=>({...l,id:v}))} placeholder="@handle or email" autoFocus />
        <Field label="Password" type="password" value={lf.pw} onChange={v=>setLf(l=>({...l,pw:v}))} placeholder="••••••••" />
        {lerr && <div style={{ background:C.redBg,border:`1px solid ${C.red}44`,borderRadius:10,padding:"12px 14px",color:C.red,fontFamily:"'DM Sans',sans-serif",fontSize:14 }}>{lerr}</div>}
        <PBtn onClick={doLogin} loading={lload}>Sign In →</PBtn>
      </div>
      <p style={{ marginTop:20,textAlign:"center",fontFamily:"'DM Sans',sans-serif",fontSize:14,color:C.muted }}>
        No account?{" "}
        <button onClick={()=>setMode("register")} style={{ background:"none",border:"none",color:C.accent,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:700 }}>Create one</button>
      </p>
    </Shell>
  );

  if (mode === "register") return (
    <Shell>
      <h2 style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:28,color:C.text,margin:"0 0 4px",fontWeight:700 }}>Create account</h2>
      <p style={{ color:C.muted,fontSize:14,fontFamily:"'DM Sans',sans-serif",margin:"0 0 22px" }}>Join Sync Everyone — free forever</p>
      <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
        <Field label="Full Name" value={rf.name} onChange={v=>setRf(r=>({...r,name:v}))} placeholder="Your full name" error={rerr.name} autoFocus />
        <Field label="Username" value={rf.handle} onChange={v=>setRf(r=>({...r,handle:v.replace(/\s/g,"")}))} placeholder="yourhandle" error={rerr.handle} hint="Letters, numbers, and _ only" />
        <Field label="Email" type="email" value={rf.email} onChange={v=>setRf(r=>({...r,email:v}))} placeholder="you@example.com" error={rerr.email} />
        <Field label="Password" type="password" value={rf.pw} onChange={v=>setRf(r=>({...r,pw:v}))} placeholder="Min 6 characters" error={rerr.pw} />
        <Field label="Confirm Password" type="password" value={rf.pw2} onChange={v=>setRf(r=>({...r,pw2:v}))} placeholder="Repeat password" error={rerr.pw2} />
        <PBtn onClick={doRegStep1}>Continue →</PBtn>
        <GBtn onClick={()=>setMode("login")}>← Back to Sign In</GBtn>
      </div>
    </Shell>
  );

  // Profile setup
  const fileRef = useRef();
  return (
    <Shell>
      <h2 style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:26,color:C.text,margin:"0 0 4px",fontWeight:700 }}>Set up your profile</h2>
      <p style={{ color:C.muted,fontSize:14,fontFamily:"'DM Sans',sans-serif",margin:"0 0 20px" }}>Optional — you can edit this later</p>
      <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:16 }}>
        <div onClick={()=>fileRef.current.click()} style={{ width:90,height:90,borderRadius:"50%",border:`2px dashed ${setup.avatar?C.accent:C.border}`,background:setup.avatar?"transparent":C.card,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",overflow:"hidden" }}>
          {setup.avatar
            ? <img src={setup.avatar} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
            : <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3}}><span style={{fontSize:28}}>📷</span><span style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:C.muted}}>Add Photo</span></div>
          }
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>setSetup(s=>({...s,avatar:ev.target.result}));r.readAsDataURL(f);}} />

        <div style={{width:"100%"}}>
          <label style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.muted,letterSpacing:"0.9px",textTransform:"uppercase",display:"block",marginBottom:6,fontWeight:600}}>Bio</label>
          <textarea value={setup.bio} onChange={e=>setSetup(s=>({...s,bio:e.target.value}))} placeholder="Tell everyone about yourself…" maxLength={150}
            style={{width:"100%",background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"12px 14px",color:C.text,fontFamily:"'DM Sans',sans-serif",fontSize:15,outline:"none",resize:"none",height:80,boxSizing:"border-box"}}/>
        </div>
        <div style={{width:"100%"}}>
          <label style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.muted,letterSpacing:"0.9px",textTransform:"uppercase",display:"block",marginBottom:10,fontWeight:600}}>Profile Color</label>
          <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
            {AVATAR_COLORS.map(col=><button key={col} onClick={()=>setSetup(s=>({...s,color:col}))} style={{width:32,height:32,borderRadius:"50%",background:col,border:`3px solid ${setup.color===col?C.text:C.border}`,cursor:"pointer",transition:"border .15s"}}/>)}
          </div>
        </div>
        <PBtn onClick={doCreate} loading={rload}>🎉 Join Sync Everyone</PBtn>
        <button onClick={()=>setMode("register")} style={{background:"none",border:"none",color:C.muted,fontSize:13,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",textDecoration:"underline"}}>← Back</button>
      </div>
    </Shell>
  );
}

/* ═══════════════════════════════════════════════════════════ */
/*  MAIN APP                                                    */
/* ═══════════════════════════════════════════════════════════ */
export default function App() {
  const [me,    setMe]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab,   setTab]   = useState("feed");
  const [viewUser, setViewUser] = useState(null);
  const [activeChatId, setActiveChatId] = useState(null);
  const [toast, setToast] = useState({ msg:"", type:"success" });

  const showToast = (msg, type="success") => {
    setToast({msg,type});
    setTimeout(()=>setToast({msg:"",type:"success"}), 2500);
  };

  // Auto-login from stored token
  useEffect(()=>{
    const token = localStorage.getItem("se_token");
    if (!token) { setLoading(false); return; }
    api.get("/auth/me")
      .then(({data})=>setMe(data))
      .catch(()=>localStorage.removeItem("se_token"))
      .finally(()=>setLoading(false));
  }, []);

  if (loading) return (
    <>
      <style>{FONTS}</style>
      <div style={{height:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div style={{textAlign:"center"}}>
          <div style={{width:50,height:50,borderRadius:14,background:C.accent,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",boxShadow:"0 4px 16px rgba(196,125,30,0.35)"}}>
            <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:"#fff",fontWeight:700}}>SE</span>
          </div>
          <Spinner/>
        </div>
      </div>
    </>
  );

  if (!me) return (
    <>
      <style>{FONTS}</style>
      <style>{`*{box-sizing:border-box;margin:0;padding:0;}body{background:${C.bg};}input,textarea{caret-color:${C.accent};}input::placeholder,textarea::placeholder{color:${C.dim};}`}</style>
      <AuthScreen onLogin={u=>{setMe(u); setTab("feed");}} />
    </>
  );

  const gotoProfile = u => { setViewUser(u); setTab("profile"); };
  const gotoChat    = id => { setActiveChatId(id); setTab("chat"); };
  const logout      = () => { localStorage.removeItem("se_token"); setMe(null); };

  return (
    <>
      <style>{FONTS}</style>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:${C.bg};overscroll-behavior:none;}
        ::-webkit-scrollbar{width:3px;}
        ::-webkit-scrollbar-thumb{background:${C.dim};border-radius:3px;}
        input,textarea{caret-color:${C.accent};}
        input::placeholder,textarea::placeholder{color:${C.dim};}
      `}</style>
      <div style={{ display:"flex",flexDirection:"column",height:"100vh",height:"100dvh",background:C.bg,maxWidth:600,margin:"0 auto" }}>
        {/* TOP BAR */}
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 16px",borderBottom:`1px solid ${C.border}`,background:C.surface,boxShadow:C.shadow,flexShrink:0 }}>
          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
            <div style={{ width:36,height:36,borderRadius:10,background:C.accent,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 8px rgba(196,125,30,0.35)" }}>
              <span style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:17,color:"#fff",fontWeight:700 }}>SE</span>
            </div>
            <span style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:19,color:C.text,fontWeight:700 }}>Sync Everyone</span>
          </div>
          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
            <button onClick={()=>{setViewUser(null);setTab("profile");}} style={{background:"none",border:"none",cursor:"pointer",padding:0}}>
              <Av user={me} size={34} ring={tab==="profile"&&!viewUser}/>
            </button>
            <button onClick={logout} style={{ background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"6px 10px",color:C.muted,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:13 }}>
              Sign out
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <div style={{ flex:1,overflow:"hidden",display:"flex",flexDirection:"column" }}>
          {tab==="feed"    && <FeedView    me={me} onProfile={gotoProfile} showToast={showToast}/>}
          {tab==="search"  && <SearchView  me={me} onProfile={gotoProfile}/>}
          {tab==="messages"&& <MsgListView me={me} onOpen={gotoChat}/>}
          {tab==="chat"    && <ChatView    me={me} convId={activeChatId} onBack={()=>setTab("messages")}/>}
          {tab==="profile" && <ProfileView me={me} setMe={setMe} viewUser={viewUser} onBack={()=>{setViewUser(null);setTab("feed");}} onProfile={gotoProfile} onChat={id=>{setActiveChatId(id);setTab("chat");}} showToast={showToast}/>}
        </div>

        {/* BOTTOM NAV */}
        <div style={{ display:"flex",borderTop:`1px solid ${C.border}`,background:C.surface,flexShrink:0,paddingBottom:"env(safe-area-inset-bottom)" }}>
          {[
            {id:"feed",    emoji:"🏠", label:"Home"},
            {id:"search",  emoji:"🔍", label:"Search"},
            {id:"messages",emoji:"💬", label:"Chat"},
            {id:"profile", emoji:"👤", label:"Profile"},
          ].map(item=>{
            const active = tab===item.id || (item.id==="messages"&&tab==="chat");
            return (
              <button key={item.id} onClick={()=>{setTab(item.id);if(item.id!=="profile")setViewUser(null);}} style={{
                flex:1,padding:"10px 0 8px",background:"none",border:"none",cursor:"pointer",
                display:"flex",flexDirection:"column",alignItems:"center",gap:3,
                borderTop:`2.5px solid ${active?C.accent:"transparent"}`,
              }}>
                <span style={{fontSize:22}}>{item.emoji}</span>
                <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:active?C.accent:C.muted,fontWeight:active?700:400}}>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      <Toast msg={toast.msg} type={toast.type}/>
    </>
  );
}

/* ═══════════════════════════════ FEED ══════════════════════ */
function FeedView({ me, onProfile, showToast }) {
  const [posts,   setPosts]  = useState([]);
  const [loading, setLoading]= useState(true);
  const [caption, setCaption]= useState("");
  const [emoji,   setEmoji]  = useState("✨");
  const [img,     setImg]    = useState(null);
  const [imgFile, setImgFile]= useState(null);
  const [tagStr,  setTagStr] = useState("");
  const [compose, setCompose]= useState(false);
  const [posting, setPosting]= useState(false);
  const EMOJIS = ["✨","🌅","🌿","🎵","🍲","💻","📸","🌊","🔥","🎨","😊","🙌"];

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/posts/feed");
      setPosts(data);
    } catch {}
    setLoading(false);
  }, []);
  useEffect(()=>{ load(); }, [load]);

  const submitPost = async () => {
    if (!caption.trim()) return;
    setPosting(true);
    try {
      const fd = new FormData();
      fd.append("caption", caption.trim());
      fd.append("emoji", emoji);
      fd.append("tags", tagStr.trim());
      if (imgFile) fd.append("image", imgFile);
      const { data } = await api.post("/posts", fd);
      setPosts(p=>[data,...p]);
      setCaption(""); setImg(null); setImgFile(null); setTagStr(""); setCompose(false);
      showToast("Post shared! 🎉");
    } catch { showToast("Failed to post","error"); }
    setPosting(false);
  };

  const toggleLike = async (postId) => {
    setPosts(p=>p.map(x=>x.id!==postId?x:{...x,
      liked_by_me:!x.liked_by_me,
      like_count:x.liked_by_me?x.like_count-1:x.like_count+1,
    }));
    try { await api.post(`/posts/${postId}/like`); }
    catch { setPosts(p=>p.map(x=>x.id!==postId?x:{...x,liked_by_me:!x.liked_by_me,like_count:x.liked_by_me?x.like_count-1:x.like_count+1})); }
  };

  return (
    <div style={{ flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch",background:C.bg }}>
      {/* Compose bar */}
      <div style={{ padding:"12px 14px",borderBottom:`1px solid ${C.border}`,display:"flex",gap:10,alignItems:"center",background:C.surface }}>
        <Av user={me} size={38}/>
        <button onClick={()=>setCompose(v=>!v)} style={{ flex:1,background:C.card,border:`1.5px solid ${C.border}`,borderRadius:22,padding:"11px 16px",color:C.muted,fontFamily:"'DM Sans',sans-serif",fontSize:14,cursor:"pointer",textAlign:"left" }}>
          What's on your mind?
        </button>
      </div>

      {compose && (
        <div style={{ margin:"12px 14px",background:C.surface,borderRadius:16,border:`1.5px solid ${C.accent}44`,padding:14,boxShadow:C.shadow }}>
          <textarea value={caption} onChange={e=>setCaption(e.target.value)} placeholder="Share something with everyone…"
            style={{ width:"100%",background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 13px",color:C.text,fontFamily:"'DM Sans',sans-serif",fontSize:15,resize:"none",outline:"none",height:80,boxSizing:"border-box" }}/>
          {img && (
            <div style={{ marginTop:10,position:"relative",display:"inline-block" }}>
              <img src={img} alt="" style={{ width:100,height:80,objectFit:"cover",borderRadius:8,border:`1px solid ${C.border}` }}/>
              <button onClick={()=>{setImg(null);setImgFile(null);}} style={{ position:"absolute",top:-6,right:-6,width:20,height:20,borderRadius:"50%",background:C.red,border:"none",color:"white",fontSize:11,cursor:"pointer" }}>✕</button>
            </div>
          )}
          <div style={{ display:"flex",gap:6,flexWrap:"wrap",margin:"10px 0" }}>
            {EMOJIS.map(e=>(
              <button key={e} onClick={()=>setEmoji(e)} style={{ width:36,height:36,borderRadius:8,background:emoji===e?C.accentBg:C.card,border:`1.5px solid ${emoji===e?C.accent:C.border}`,fontSize:18,cursor:"pointer" }}>{e}</button>
            ))}
          </div>
          <input value={tagStr} onChange={e=>setTagStr(e.target.value)} placeholder="#add #tags"
            style={{ width:"100%",background:C.card,border:`1px solid ${C.border}`,borderRadius:9,padding:"9px 12px",color:C.text,fontFamily:"'DM Sans',sans-serif",fontSize:14,outline:"none",boxSizing:"border-box",marginBottom:10 }}/>
          <div style={{ display:"flex",gap:8,alignItems:"center" }}>
            <label style={{ display:"flex",alignItems:"center",gap:6,cursor:"pointer",color:C.muted,fontFamily:"'DM Sans',sans-serif",fontSize:14,padding:"8px 12px",background:C.card,borderRadius:8,border:`1px solid ${C.border}` }}>
              <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const f=e.target.files[0];if(!f)return;setImgFile(f);const r=new FileReader();r.onload=ev=>setImg(ev.target.result);r.readAsDataURL(f);}}/>
              📷 Photo
            </label>
            <div style={{flex:1}}/>
            <GBtn onClick={()=>setCompose(false)} small fullWidth={false}>Cancel</GBtn>
            <button onClick={submitPost} disabled={!caption.trim()||posting} style={{ background:caption.trim()&&!posting?C.accent:C.dim,border:"none",borderRadius:9,padding:"9px 20px",color:"#fff",fontFamily:"'DM Sans',sans-serif",fontWeight:700,cursor:caption.trim()&&!posting?"pointer":"default",fontSize:14 }}>
              {posting?"Posting…":"Share"}
            </button>
          </div>
        </div>
      )}

      {loading ? <Spinner/> : posts.length === 0 ? (
        <div style={{ textAlign:"center",padding:"60px 20px",color:C.muted,fontFamily:"'DM Sans',sans-serif" }}>
          <div style={{fontSize:44,marginBottom:12}}>📭</div>
          <div style={{fontSize:16}}>No posts yet — be the first!</div>
          <button onClick={()=>setCompose(true)} style={{ marginTop:16,background:C.accent,border:"none",borderRadius:12,padding:"12px 24px",color:"#fff",fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:15,cursor:"pointer" }}>Write a Post</button>
        </div>
      ) : posts.map(post=>{
        const liked = !!post.liked_by_me;
        const authorColor = post.author_color || pickColor(post.author_name||"A");
        const initials = mkInitials(post.author_name||"?");
        const authorObj = {name:post.author_name,handle:post.author_handle,avatar_url:post.author_avatar,color:post.author_color,initials};
        return (
          <div key={post.id} style={{ borderBottom:`1px solid ${C.border}`,background:C.surface }}>
            <div style={{ padding:"12px 14px",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
              <div style={{ display:"flex",gap:10,alignItems:"center",cursor:"pointer" }} onClick={()=>onProfile(authorObj)}>
                <Av user={authorObj} size={42}/>
                <div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:15,color:C.text }}>{post.author_name}</div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.muted }}>@{post.author_handle} · {timeAgo(post.created_at)}</div>
                </div>
              </div>
            </div>
            {post.image_url
              ? <img src={post.image_url} alt="" style={{ width:"100%",maxHeight:380,objectFit:"cover",display:"block" }}/>
              : <div style={{ width:"100%",height:260,background:`linear-gradient(135deg,${authorColor}12,${C.card})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:80 }}>{post.emoji}</div>
            }
            <div style={{ padding:"10px 14px 6px",display:"flex",gap:4 }}>
              <button onClick={()=>toggleLike(post.id)} style={{ background:liked?C.redBg:"transparent",border:`1px solid ${liked?C.red+"44":C.border}`,borderRadius:20,padding:"7px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:5,color:liked?C.red:C.muted,fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:500 }}>
                {liked?"❤️":"🤍"} {post.like_count||0}
              </button>
              <button style={{ background:"transparent",border:`1px solid ${C.border}`,borderRadius:20,padding:"7px 14px",cursor:"pointer",color:C.muted,fontFamily:"'DM Sans',sans-serif",fontSize:14,display:"flex",alignItems:"center",gap:5 }}>
                💬 {post.comment_count||0}
              </button>
            </div>
            <div style={{ padding:"4px 14px 14px" }}>
              <p style={{ fontFamily:"'DM Sans',sans-serif",fontSize:14,color:C.text,margin:"0 0 6px",lineHeight:1.6 }}>
                <span style={{fontWeight:700}}>{post.author_handle} </span>{post.caption}
              </p>
              {post.tags && <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                {post.tags.split(/\s+/).filter(Boolean).map(t=><span key={t} style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:C.accent,background:C.accentBg,padding:"2px 8px",borderRadius:20}}>{t.startsWith("#")?t:"#"+t}</span>)}
              </div>}
            </div>
          </div>
        );
      })}
      <div style={{height:20}}/>
    </div>
  );
}

/* ═══════════════════════════════ SEARCH ════════════════════ */
function SearchView({ me, onProfile }) {
  const [q,     setQ]     = useState("");
  const [users, setUsers] = useState([]);
  const [loading,setLoad] = useState(true);

  useEffect(()=>{
    api.get("/users").then(({data})=>setUsers(data)).catch(()=>{}).finally(()=>setLoad(false));
  },[]);

  const filtered = q.trim()
    ? users.filter(u=>(u.name||"").toLowerCase().includes(q.toLowerCase())||(u.handle||"").toLowerCase().includes(q.toLowerCase()))
    : users;

  return (
    <div style={{ flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch",background:C.bg }}>
      <div style={{ padding:"14px 14px 10px",position:"sticky",top:0,background:C.bg,zIndex:10,borderBottom:`1px solid ${C.border}` }}>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="🔍  Search people…"
          style={{ width:"100%",background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"12px 16px",color:C.text,fontFamily:"'DM Sans',sans-serif",fontSize:15,outline:"none",boxSizing:"border-box",boxShadow:C.shadow }}/>
      </div>
      {loading ? <Spinner/> : (
        <div style={{padding:"4px 0"}}>
          {filtered.map(u=>(
            <div key={u.id} onClick={()=>onProfile(u)} style={{ display:"flex",alignItems:"center",gap:12,padding:"12px 16px",cursor:"pointer",borderBottom:`1px solid ${C.border}`,background:C.surface,marginBottom:1 }}>
              <Av user={u} size={48}/>
              <div style={{flex:1}}>
                <div style={{ fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:15,color:C.text }}>{u.name}</div>
                <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:13,color:C.muted }}>@{u.handle}</div>
                {u.bio && <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:13,color:C.muted,marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:220 }}>{u.bio}</div>}
              </div>
              <span style={{color:C.dim,fontSize:20}}>›</span>
            </div>
          ))}
          {filtered.length===0&&<div style={{textAlign:"center",padding:40,color:C.muted,fontFamily:"'DM Sans',sans-serif"}}>No users found</div>}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════ MESSAGES LIST ═════════════ */
function MsgListView({ me, onOpen }) {
  const [convs, setConvs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading,setLoad] = useState(true);
  const [showNew,setNew]  = useState(false);

  const load = async ()=>{
    try {
      const [c,u] = await Promise.all([api.get("/messages"), api.get("/users")]);
      setConvs(c.data); setUsers(u.data);
    } catch {} finally { setLoad(false); }
  };
  useEffect(()=>{ load(); },[]);

  const startDirect = async userId => {
    try {
      const { data } = await api.post(`/messages/direct/${userId}`);
      onOpen(data.id);
    } catch {}
  };

  return (
    <div style={{ flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch",background:C.bg }}>
      <div style={{ padding:"14px 16px 10px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",background:C.surface }}>
        <h2 style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:C.text,fontWeight:700 }}>Messages</h2>
        <button onClick={()=>setNew(v=>!v)} style={{ background:C.accentBg,border:`1px solid ${C.accent}44`,borderRadius:10,width:36,height:36,color:C.accent,cursor:"pointer",fontSize:20,display:"flex",alignItems:"center",justifyContent:"center" }}>✏️</button>
      </div>

      {showNew && (
        <div style={{ background:C.surface,borderBottom:`1px solid ${C.border}`,padding:"12px 16px" }}>
          <p style={{ fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.muted,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.7px",fontWeight:600 }}>Start new conversation</p>
          {users.filter(u=>!convs.find(c=>c.type==="direct"&&c.members?.some(m=>m.id===u.id))).map(u=>(
            <div key={u.id} onClick={()=>{startDirect(u.id);setNew(false);}} style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 0",cursor:"pointer",borderBottom:`1px solid ${C.border}` }}>
              <Av user={u} size={36}/><span style={{fontFamily:"'DM Sans',sans-serif",fontSize:15,color:C.text,flex:1}}>{u.name}</span>
              <span style={{color:C.muted,fontSize:14}}>@{u.handle}</span>
            </div>
          ))}
        </div>
      )}

      {loading ? <Spinner/> : convs.length===0 ? (
        <div style={{textAlign:"center",padding:"50px 20px",color:C.muted,fontFamily:"'DM Sans',sans-serif"}}>
          <div style={{fontSize:40,marginBottom:10}}>💬</div>
          <div>No conversations yet</div>
          <button onClick={()=>setNew(true)} style={{marginTop:16,background:C.accent,border:"none",borderRadius:12,padding:"10px 20px",color:"#fff",fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:14,cursor:"pointer"}}>Start a Chat</button>
        </div>
      ) : convs.map(c=>{
        const other = c.members?.[0];
        return (
          <div key={c.id} onClick={()=>onOpen(c.id)} style={{ padding:"14px 16px",cursor:"pointer",display:"flex",gap:12,alignItems:"center",borderBottom:`1px solid ${C.border}`,background:C.surface,marginBottom:1 }}>
            {other ? <Av user={other} size={50}/> : <div style={{width:50,height:50,borderRadius:"50%",background:C.card,border:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>👥</div>}
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:15,color:C.text}}>{c.name||other?.name||"Group"}</div>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:C.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginTop:2}}>{c.last_message||"No messages yet"}</div>
            </div>
            <span style={{color:C.dim,fontSize:20}}>›</span>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════ CHAT ══════════════════════ */
function ChatView({ me, convId, onBack }) {
  const [msgs,  setMsgs] = useState([]);
  const [input, setInput]= useState("");
  const [sending,setSend]= useState(false);
  const [convInfo,setCI] = useState(null);
  const bottomRef = useRef();

  useEffect(()=>{ if(!convId)return; loadMsgs(); },[convId]);
  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:"smooth"}); },[msgs]);

  const loadMsgs = async ()=>{
    try {
      const {data}=await api.get(`/messages/${convId}/messages`);
      setMsgs(data);
      if(data[0]) {
        const other=data.find(m=>m.user_id!==me.id);
        if(other) setCI({name:other.name,handle:other.handle,avatar_url:other.avatar_url,color:other.color});
      }
    } catch {}
  };

  const send = async ()=>{
    if(!input.trim()||sending) return;
    const text=input.trim(); setInput(""); setSend(true);
    try {
      const {data}=await api.post(`/messages/${convId}/messages`,{text});
      setMsgs(p=>[...p,data]);
    } catch { setInput(text); }
    setSend(false);
  };

  return (
    <div style={{ flex:1,display:"flex",flexDirection:"column",overflow:"hidden",background:C.bg }}>
      <div style={{ padding:"12px 14px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:12,background:C.surface,boxShadow:C.shadow,flexShrink:0 }}>
        <button onClick={onBack} style={{ background:"none",border:"none",color:C.accent,cursor:"pointer",fontSize:24,padding:"0 8px 0 0",fontWeight:700 }}>‹</button>
        {convInfo && <Av user={convInfo} size={38}/>}
        <div>
          <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:15,color:C.text}}>{convInfo?.name||"Chat"}</div>
          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.green}}>● Online</div>
        </div>
      </div>

      <div style={{ flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch",padding:"14px",display:"flex",flexDirection:"column",gap:10 }}>
        {msgs.length===0&&<div style={{textAlign:"center",padding:"40px 20px",color:C.muted,fontFamily:"'DM Sans',sans-serif",fontSize:14}}>No messages yet — say hello! 👋</div>}
        {msgs.map((msg,i)=>{
          const isMe = msg.user_id===me.id;
          return (
            <div key={msg.id||i} style={{ display:"flex",flexDirection:isMe?"row-reverse":"row",gap:8,alignItems:"flex-end" }}>
              {!isMe && <Av user={{name:msg.name,handle:msg.handle,avatar_url:msg.avatar_url,color:msg.color}} size={30}/>}
              <div style={{ maxWidth:"72%",display:"flex",flexDirection:"column",alignItems:isMe?"flex-end":"flex-start" }}>
                <div style={{ background:isMe?C.accent:C.surface, color:isMe?"#fff":C.text, padding:"10px 14px", borderRadius:isMe?"18px 18px 4px 18px":"18px 18px 18px 4px", fontFamily:"'DM Sans',sans-serif", fontSize:15, lineHeight:1.5, border:isMe?"none":`1px solid ${C.border}`, boxShadow:C.shadow }}>
                  {msg.text}
                </div>
                <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:C.dim,marginTop:3}}>{timeAgo(msg.created_at)}</span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef}/>
      </div>

      <div style={{ padding:"10px 12px",borderTop:`1px solid ${C.border}`,display:"flex",gap:8,alignItems:"center",background:C.surface,paddingBottom:"max(10px,env(safe-area-inset-bottom))" }}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Type a message…"
          style={{ flex:1,background:C.card,border:`1.5px solid ${C.border}`,borderRadius:22,padding:"11px 16px",color:C.text,fontFamily:"'DM Sans',sans-serif",fontSize:15,outline:"none" }}/>
        <button onClick={send} style={{ width:44,height:44,borderRadius:"50%",background:C.accent,border:"none",cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:"0 2px 8px rgba(196,125,30,0.35)" }}>➤</button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════ PROFILE ═══════════════════ */
function ProfileView({ me, setMe, viewUser, onBack, onProfile, onChat, showToast }) {
  const [user,    setUser]  = useState(null);
  const [posts,   setPosts] = useState([]);
  const [loading, setLoad]  = useState(true);
  const [editing, setEdit]  = useState(false);
  const [draft,   setDraft] = useState({});
  const [saving,  setSave]  = useState(false);
  const [following,setFol]  = useState(false);
  const isMe = !viewUser || viewUser.id === me.id;
  const fileRef = useRef();

  useEffect(()=>{
    const target = isMe ? me : viewUser;
    if (!target) return;
    setLoad(true);
    Promise.all([
      api.get(`/users/${target.handle}`),
      api.get(`/posts/user/${target.id}`),
    ]).then(([u,p])=>{
      setUser(u.data); setPosts(p.data);
    }).catch(()=>setUser(target)).finally(()=>setLoad(false));
  },[viewUser]);

  const saveProfile = async ()=>{
    setSave(true);
    try {
      const {data}=await api.put("/users/me/profile",{name:draft.name,bio:draft.bio,color:draft.color});
      setMe(m=>({...m,...data})); setUser(data); setEdit(false);
      showToast("Profile updated ✅");
    } catch { showToast("Update failed","error"); }
    setSave(false);
  };

  const uploadAvatar = async (file)=>{
    const fd=new FormData(); fd.append("avatar",file);
    try {
      const {data}=await api.post("/users/me/avatar",fd);
      setMe(m=>({...m,avatar_url:data.avatar_url}));
      setUser(u=>({...u,avatar_url:data.avatar_url}));
      showToast("Photo updated ✅");
    } catch { showToast("Upload failed","error"); }
  };

  const toggleFollow = async ()=>{
    try {
      const {data}=await api.post(`/users/${user.id}/follow`);
      setFol(data.following);
      setUser(u=>({...u,followers:data.following?u.followers+1:u.followers-1}));
    } catch {}
  };

  const startChat = async ()=>{
    try {
      const {data}=await api.post(`/messages/direct/${user.id}`);
      onChat(data.id);
    } catch {}
  };

  const u = user || (isMe?me:viewUser);

  return (
    <div style={{ flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch",background:C.bg }}>
      {viewUser && (
        <button onClick={onBack} style={{ display:"flex",alignItems:"center",gap:6,background:"none",border:"none",color:C.accent,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:15,padding:"12px 16px",fontWeight:600 }}>
          ‹ Back
        </button>
      )}

      {/* Cover strip */}
      <div style={{ height:100,background:`linear-gradient(135deg,${u?.color||C.accent}22,${C.card})`,marginBottom:-42,position:"relative" }}>
        <div style={{ position:"absolute",inset:0,backgroundImage:`radial-gradient(circle at 30% 60%,${u?.color||C.accent}28 0%,transparent 70%)` }}/>
      </div>

      <div style={{ padding:"0 16px 0" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-end",paddingBottom:14 }}>
          {/* Avatar */}
          <div style={{ position:"relative" }}>
            <div style={{ width:80,height:80,borderRadius:"50%",background:`${u?.color||C.accent}18`,border:`3px solid ${C.bg}`,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",flexShrink:0,boxShadow:C.shadow }}>
              {u?.avatar_url
                ? <img src={u.avatar_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                : <span style={{fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:26,color:u?.color||C.accent}}>{mkInitials(u?.name||"?")}</span>
              }
            </div>
            {isMe && (
              <>
                <button onClick={()=>fileRef.current.click()} style={{ position:"absolute",bottom:0,right:0,width:24,height:24,borderRadius:"50%",background:C.accent,border:`2px solid ${C.bg}`,cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff" }}>✏️</button>
                <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>{ if(e.target.files[0]) uploadAvatar(e.target.files[0]); }}/>
              </>
            )}
          </div>
          {/* Action buttons */}
          {isMe ? (
            editing
              ? <div style={{display:"flex",gap:8}}>
                  <GBtn onClick={()=>setEdit(false)} small fullWidth={false}>Cancel</GBtn>
                  <button onClick={saveProfile} disabled={saving} style={{background:C.accent,border:"none",borderRadius:10,padding:"9px 18px",color:"#fff",fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:13,cursor:"pointer"}}>{saving?"Saving…":"Save"}</button>
                </div>
              : <button onClick={()=>{setDraft({name:u?.name||"",bio:u?.bio||"",color:u?.color||AVATAR_COLORS[0]});setEdit(true);}} style={{background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"9px 16px",color:C.text,fontFamily:"'DM Sans',sans-serif",fontSize:14,cursor:"pointer",boxShadow:C.shadow}}>✏️ Edit Profile</button>
          ) : (
            <div style={{display:"flex",gap:8}}>
              <button onClick={startChat} style={{background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"9px 14px",color:C.text,fontFamily:"'DM Sans',sans-serif",fontSize:14,cursor:"pointer"}}>💬 Message</button>
              <button onClick={toggleFollow} style={{background:following?C.surface:C.accent,border:`1.5px solid ${following?C.border:C.accent}`,borderRadius:10,padding:"9px 16px",color:following?C.muted:"#fff",fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:14,cursor:"pointer"}}>{following?"Following":"Follow"}</button>
            </div>
          )}
        </div>

        {editing ? (
          <div style={{marginBottom:18,display:"flex",flexDirection:"column",gap:12}}>
            <Field label="Display Name" value={draft.name} onChange={v=>setDraft(d=>({...d,name:v}))}/>
            <div>
              <label style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.muted,letterSpacing:"0.9px",textTransform:"uppercase",display:"block",marginBottom:6,fontWeight:600}}>Bio</label>
              <textarea value={draft.bio} onChange={e=>setDraft(d=>({...d,bio:e.target.value}))} maxLength={150}
                style={{width:"100%",background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"11px 13px",color:C.text,fontFamily:"'DM Sans',sans-serif",fontSize:15,outline:"none",resize:"none",height:76,boxSizing:"border-box"}}/>
            </div>
            <div>
              <label style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.muted,letterSpacing:"0.9px",textTransform:"uppercase",display:"block",marginBottom:8,fontWeight:600}}>Profile Color</label>
              <div style={{display:"flex",gap:10}}>
                {AVATAR_COLORS.map(col=><button key={col} onClick={()=>setDraft(d=>({...d,color:col}))} style={{width:30,height:30,borderRadius:"50%",background:col,border:`3px solid ${draft.color===col?C.text:C.border}`,cursor:"pointer"}}/>)}
              </div>
            </div>
          </div>
        ) : (
          <div style={{paddingBottom:16,borderBottom:`1px solid ${C.border}`}}>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:C.text,margin:"0 0 2px",fontWeight:700}}>{u?.name}</h2>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:C.muted,marginBottom:8}}>@{u?.handle}</div>
            {u?.bio && <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:14,color:C.text,margin:"0 0 14px",lineHeight:1.6}}>{u.bio}</p>}
            {loading ? <Spinner/> : (
              <div style={{display:"flex",gap:28}}>
                {[{label:"Posts",value:u?.post_count||posts.length},{label:"Followers",value:u?.followers||0},{label:"Following",value:u?.following||0}].map(s=>(
                  <div key={s.label} style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
                    <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:700,color:C.text}}>{s.value}</span>
                    <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.muted,marginTop:1}}>{s.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div style={{display:"flex",marginBottom:2}}>
          {["Posts"].map(t=>(
            <button key={t} style={{flex:1,background:"none",border:"none",borderBottom:`2px solid ${C.accent}`,padding:"12px 0",fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:13,color:C.accent,cursor:"pointer"}}>{t}</button>
          ))}
        </div>
      </div>

      {/* Posts grid */}
      <div style={{padding:"10px 14px 40px"}}>
        {loading ? <Spinner/> : posts.length > 0 ? (
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:3}}>
            {posts.map(p=>(
              <div key={p.id} style={{aspectRatio:"1",background:`linear-gradient(135deg,${u?.color||C.accent}12,${C.card})`,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",cursor:"pointer",borderRadius:4}}>
                {p.image_url
                  ? <img src={p.image_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                  : <span style={{fontSize:36}}>{p.emoji}</span>
                }
              </div>
            ))}
          </div>
        ) : (
          <div style={{textAlign:"center",padding:"50px 20px",color:C.muted,fontFamily:"'DM Sans',sans-serif"}}>
            <div style={{fontSize:32,marginBottom:8}}>📷</div>
            <div>{isMe?"Share your first post!":"Nothing posted yet"}</div>
          </div>
        )}
      </div>
    </div>
  );
}
