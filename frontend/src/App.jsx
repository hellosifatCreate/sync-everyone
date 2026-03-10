import { useState, useRef, useEffect } from "react";

const C = {
  bg:"#0c0b09", surface:"#161410", card:"#1e1b16", border:"#2a2620",
  accent:"#e8a045", accentDim:"#b87830", green:"#5aab72", red:"#e06b6b",
  text:"#f0ebe2", muted:"#7a7068", dim:"#3e3a32",
};
const FONTS=`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');`;
const AVATAR_COLORS=["#e8a045","#5aab72","#c07dd4","#e06b6b","#4bacc6","#e87c5a","#6ab8c8"];
const uid=()=>Math.random().toString(36).slice(2,9);
const mkInitials=n=>n.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2);
const pickColor=s=>AVATAR_COLORS[s.charCodeAt(0)%AVATAR_COLORS.length];

const SEED_USERS=[
  {id:"u1",name:"Maya Chen",handle:"mayac",email:"maya@cs.com",password:"maya123",bio:"Photographer & community builder 📸",color:"#e8a045",avatar:null,initials:"MC",followers:[],following:[]},
  {id:"u2",name:"Jordan Park",handle:"jpark",email:"jordan@cs.com",password:"jordan123",bio:"Urban gardener 🌱 Growing food & friendships",color:"#5aab72",avatar:null,initials:"JP",followers:[],following:[]},
  {id:"u3",name:"Priya Nair",handle:"priya_n",email:"priya@cs.com",password:"priya123",bio:"Tech & art intersect here ✦",color:"#c07dd4",avatar:null,initials:"PN",followers:[],following:[]},
  {id:"u4",name:"Sam Rivera",handle:"samr",email:"sam@cs.com",password:"sam123",bio:"Chef & storyteller 🍳",color:"#e06b6b",avatar:null,initials:"SR",followers:[],following:[]},
  {id:"u5",name:"Alex Okafor",handle:"alexo",email:"alex@cs.com",password:"alex123",bio:"Music producer | Finding rhythm 🎵",color:"#4bacc6",avatar:null,initials:"AO",followers:[],following:[]},
];
const SEED_POSTS=[
  {id:"p1",userId:"u1",emoji:"🌅",image:null,caption:"Golden hour at the community garden. These moments make everything worth it.",likes:["u2","u3"],comments:[{userId:"u2",text:"Stunning shot!",time:"2h ago"}],time:"2h ago",tags:["#photography","#community"]},
  {id:"p2",userId:"u2",emoji:"🌿",image:null,caption:"First harvest of the season! Tomatoes are finally coming in strong 🍅",likes:["u1","u5"],comments:[],time:"4h ago",tags:["#urbangarden","#harvest"]},
  {id:"p3",userId:"u5",emoji:"🎵",image:null,caption:"New track dropping Friday. Been working on this one for months.",likes:["u1","u2","u3","u4"],comments:[],time:"6h ago",tags:["#music","#producer"]},
  {id:"p4",userId:"u4",emoji:"🍲",image:null,caption:"Grandma's dal recipe — 50 years of love in one pot.",likes:["u1","u3"],comments:[],time:"8h ago",tags:["#food","#recipe"]},
];
const SEED_CONVS=[
  {id:"c1",type:"direct",members:["u1"],messages:[{from:"u1",text:"Hey! Loved your latest post 😊",time:"10:32"},{from:"__LOGIN__",text:"Thank you so much!",time:"10:35"}]},
  {id:"c2",type:"group",name:"Garden Crew 🌱",members:["u2","u3","u4"],messages:[{from:"u2",text:"Morning! Big harvest today 🌿",time:"9:00"},{from:"u4",text:"Save me some tomatoes 🍅",time:"9:03"}]},
];

/* ═══════════════════════════════ COMPONENTS ═══════════════════════════════ */

function Av({user,size=36,ring=false}){
  if(!user)return null;
  const col=user.color||pickColor(user.name||"A");
  return(
    <div style={{width:size,height:size,borderRadius:"50%",flexShrink:0,border:ring?`2.5px solid ${col}`:`2px solid ${col}44`,background:user.avatar?"transparent":`${col}1a`,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
      {user.avatar
        ?<img src={user.avatar} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
        :<span style={{fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:size*0.36,color:col}}>{user.initials||mkInitials(user.name||"?")}</span>
      }
    </div>
  );
}

function Field({label,type="text",value,onChange,placeholder,error,autoFocus}){
  return(
    <div style={{display:"flex",flexDirection:"column",gap:5}}>
      {label&&<label style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.muted,letterSpacing:"0.9px",textTransform:"uppercase"}}>{label}</label>}
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} autoFocus={autoFocus}
        style={{background:C.card,border:`1px solid ${error?C.red:C.border}`,borderRadius:10,padding:"12px 15px",color:C.text,outline:"none",fontFamily:"'DM Sans',sans-serif",fontSize:14,width:"100%",boxSizing:"border-box",transition:"border-color .2s"}}/>
      {error&&<span style={{color:C.red,fontSize:12,fontFamily:"'DM Sans',sans-serif"}}>{error}</span>}
    </div>
  );
}

function PhotoPicker({value,onChange,size=90}){
  const ref=useRef();
  const pick=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>onChange(ev.target.result);r.readAsDataURL(f);};
  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
      <div onClick={()=>ref.current.click()} style={{width:size,height:size,borderRadius:"50%",border:`2px dashed ${value?C.accent:C.border}`,background:value?"transparent":C.card,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",overflow:"hidden",position:"relative"}}>
        {value?<img src={value} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
          :<div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}><span style={{fontSize:22}}>📷</span><span style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:C.muted}}>Upload</span></div>}
      </div>
      <input ref={ref} type="file" accept="image/*" style={{display:"none"}} onChange={pick}/>
      {value&&<button onClick={()=>onChange(null)} style={{background:"none",border:"none",color:C.muted,fontSize:11,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",textDecoration:"underline"}}>Remove</button>}
    </div>
  );
}

function PrimaryBtn({children,onClick,disabled}){
  return(
    <button onClick={onClick} disabled={disabled} style={{background:disabled?C.dim:C.accent,border:"none",borderRadius:10,padding:"13px 20px",width:"100%",color:disabled?C.muted:"#0c0b09",fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:14,cursor:disabled?"default":"pointer",transition:"opacity .15s"}}>
      {children}
    </button>
  );
}

function GhostBtn({children,onClick}){
  return(
    <button onClick={onClick} style={{background:"transparent",border:`1px solid ${C.border}`,borderRadius:10,padding:"11px 20px",width:"100%",color:C.text,fontFamily:"'DM Sans',sans-serif",fontSize:14,cursor:"pointer"}}>
      {children}
    </button>
  );
}

/* ═══════════════════════════════ AUTH ═══════════════════════════════════ */

function AuthScreen({users,setUsers,onLogin}){
  const[mode,setMode]=useState("login");
  const[lf,setLf]=useState({id:"",pw:""});
  const[lerr,setLerr]=useState("");
  const[rf,setRf]=useState({name:"",handle:"",email:"",pw:"",pw2:""});
  const[rerr,setRerr]=useState({});
  const[setup,setSetup]=useState({bio:"",avatar:null,color:AVATAR_COLORS[0]});
  const[pendingId,setPendingId]=useState(null);

  const doLogin=()=>{
    setLerr("");
    const u=users.find(u=>(u.handle===lf.id.trim()||u.email===lf.id.trim())&&u.password===lf.pw);
    if(!u){setLerr("Incorrect username/email or password.");return;}
    onLogin(u.id);
  };

  const doRegNext=()=>{
    const e={};
    if(!rf.name.trim())e.name="Required";
    if(!rf.handle.trim())e.handle="Required";
    else if(!/^[a-z0-9_]+$/i.test(rf.handle))e.handle="Letters, numbers & underscores only";
    else if(users.find(u=>u.handle===rf.handle.trim().toLowerCase()))e.handle="Username taken";
    if(!rf.email.trim()||!/\S+@\S+\.\S+/.test(rf.email))e.email="Valid email required";
    else if(users.find(u=>u.email===rf.email.trim()))e.email="Email already registered";
    if(rf.pw.length<6)e.pw="Min 6 characters";
    if(rf.pw!==rf.pw2)e.pw2="Passwords don't match";
    setRerr(e);
    if(Object.keys(e).length)return;
    setPendingId("u"+uid());
    setMode("setup");
  };

  const doCreate=()=>{
    const nu={
      id:pendingId,
      name:rf.name.trim(),
      handle:rf.handle.trim().toLowerCase(),
      email:rf.email.trim(),
      password:rf.pw,
      bio:setup.bio.trim()||"New Sync Everyone member 👋",
      avatar:setup.avatar,
      color:setup.color,
      initials:mkInitials(rf.name),
      followers:[],following:[],
    };
    setUsers(p=>[...p,nu]);
    onLogin(nu.id);
  };

  /* Shared shell */
  const Shell=({children,wide})=>(
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:20,position:"relative",overflow:"hidden"}}>
      <div style={{position:"fixed",top:"15%",left:"35%",width:400,height:400,borderRadius:"50%",background:`${C.accent}07`,filter:"blur(90px)",pointerEvents:"none"}}/>
      <div style={{position:"fixed",bottom:"20%",right:"20%",width:280,height:280,borderRadius:"50%",background:"#5aab7208",filter:"blur(70px)",pointerEvents:"none"}}/>
      <div style={{position:"fixed",top:26,left:30,display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:34,height:34,borderRadius:9,background:`${C.accent}18`,border:`1px solid ${C.accent}44`,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,color:C.accent,fontWeight:700}}>SE</span>
        </div>
        <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:17,color:C.text,fontWeight:600}}>Sync Everyone</span>
      </div>
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:20,padding:"38px 42px",width:"100%",maxWidth:wide?680:420,boxShadow:"0 24px 60px rgba(0,0,0,.45)",position:"relative",zIndex:1}}>
        {children}
      </div>
    </div>
  );

  /* ── LOGIN ── */
  if(mode==="login")return(
    <Shell>
      <style>{FONTS}</style>
      <style>{`*{box-sizing:border-box;margin:0;padding:0;}body{background:${C.bg};}input::placeholder{color:${C.dim};}input{caret-color:${C.accent};}`}</style>
      <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:30,color:C.text,margin:"0 0 5px",fontWeight:700}}>Welcome back</h2>
      <p style={{color:C.muted,fontSize:14,fontFamily:"'DM Sans',sans-serif",margin:"0 0 28px"}}>Sign in to Sync Everyone</p>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <Field label="Username or Email" value={lf.id} onChange={v=>setLf(l=>({...l,id:v}))} placeholder="@handle or email" autoFocus/>
        <Field label="Password" type="password" value={lf.pw} onChange={v=>setLf(l=>({...l,pw:v}))} placeholder="••••••••"/>
        {lerr&&<div style={{background:`${C.red}18`,border:`1px solid ${C.red}44`,borderRadius:8,padding:"10px 14px",color:C.red,fontFamily:"'DM Sans',sans-serif",fontSize:13}}>{lerr}</div>}
        <PrimaryBtn onClick={doLogin}>Sign In →</PrimaryBtn>
      </div>
      <p style={{marginTop:22,textAlign:"center",fontFamily:"'DM Sans',sans-serif",fontSize:13,color:C.muted}}>
        No account?{" "}<button onClick={()=>setMode("register")} style={{background:"none",border:"none",color:C.accent,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:600}}>Create one</button>
      </p>
      <div style={{marginTop:22,borderTop:`1px solid ${C.border}`,paddingTop:18}}>
        <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.dim,marginBottom:10,textAlign:"center",textTransform:"uppercase",letterSpacing:"0.8px"}}>Demo accounts</p>
        <div style={{display:"flex",flexWrap:"wrap",gap:8,justifyContent:"center"}}>
          {SEED_USERS.map(u=>(
            <button key={u.id} onClick={()=>setLf({id:u.handle,pw:u.password})} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:7,padding:"4px 11px",color:C.muted,fontFamily:"'DM Sans',sans-serif",fontSize:12,cursor:"pointer"}}>@{u.handle}</button>
          ))}
        </div>
      </div>
    </Shell>
  );

  /* ── REGISTER ── */
  if(mode==="register")return(
    <Shell>
      <style>{FONTS}</style>
      <style>{`*{box-sizing:border-box;margin:0;padding:0;}body{background:${C.bg};}input::placeholder{color:${C.dim};}input{caret-color:${C.accent};}`}</style>
      <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:30,color:C.text,margin:"0 0 5px",fontWeight:700}}>Create account</h2>
      <p style={{color:C.muted,fontSize:14,fontFamily:"'DM Sans',sans-serif",margin:"0 0 26px"}}>Join Sync Everyone — it's free</p>
      <div style={{display:"flex",flexDirection:"column",gap:13}}>
        <Field label="Full Name" value={rf.name} onChange={v=>setRf(r=>({...r,name:v}))} placeholder="Your full name" error={rerr.name} autoFocus/>
        <Field label="Username" value={rf.handle} onChange={v=>setRf(r=>({...r,handle:v.replace(/\s/g,"")}))} placeholder="yourhandle" error={rerr.handle}/>
        <Field label="Email" type="email" value={rf.email} onChange={v=>setRf(r=>({...r,email:v}))} placeholder="you@example.com" error={rerr.email}/>
        <Field label="Password" type="password" value={rf.pw} onChange={v=>setRf(r=>({...r,pw:v}))} placeholder="Min 6 characters" error={rerr.pw}/>
        <Field label="Confirm Password" type="password" value={rf.pw2} onChange={v=>setRf(r=>({...r,pw2:v}))} placeholder="Repeat password" error={rerr.pw2}/>
        <PrimaryBtn onClick={doRegNext}>Continue →</PrimaryBtn>
        <GhostBtn onClick={()=>setMode("login")}>← Back to Sign In</GhostBtn>
      </div>
    </Shell>
  );

  /* ── PROFILE SETUP ── */
  return(
    <Shell wide>
      <style>{FONTS}</style>
      <style>{`*{box-sizing:border-box;margin:0;padding:0;}body{background:${C.bg};}input::placeholder,textarea::placeholder{color:${C.dim};}input,textarea{caret-color:${C.accent};}`}</style>
      <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,color:C.text,margin:"0 0 4px",fontWeight:700}}>Set up your profile</h2>
      <p style={{color:C.muted,fontSize:14,fontFamily:"'DM Sans',sans-serif",margin:"0 0 28px"}}>How everyone will see you</p>
      <div style={{display:"flex",gap:40,flexWrap:"wrap",alignItems:"flex-start"}}>
        {/* Left panel */}
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:18,minWidth:140}}>
          <PhotoPicker value={setup.avatar} onChange={v=>setSetup(s=>({...s,avatar:v}))} size={96}/>
          <div>
            <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:10,textAlign:"center"}}>Pick a color</p>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center"}}>
              {AVATAR_COLORS.map(col=>(
                <button key={col} onClick={()=>setSetup(s=>({...s,color:col}))} style={{width:26,height:26,borderRadius:"50%",background:col,border:`3px solid ${setup.color===col?C.text:C.border}`,cursor:"pointer"}}/>
              ))}
            </div>
          </div>
          {/* Preview card */}
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 18px",textAlign:"center",minWidth:120}}>
            <Av user={{name:rf.name||"Preview",avatar:setup.avatar,color:setup.color,initials:mkInitials(rf.name||"?")}} size={50} ring/>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:13,color:C.text,marginTop:8}}>{rf.name||"Your Name"}</div>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.muted}}>@{rf.handle||"handle"}</div>
          </div>
        </div>
        {/* Right panel */}
        <div style={{flex:1,display:"flex",flexDirection:"column",gap:14,minWidth:220}}>
          <div>
            <label style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.muted,letterSpacing:"0.9px",textTransform:"uppercase",display:"block",marginBottom:6}}>Bio</label>
            <textarea value={setup.bio} onChange={e=>setSetup(s=>({...s,bio:e.target.value}))} placeholder="Tell everyone about yourself…" maxLength={150}
              style={{width:"100%",background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"12px 14px",color:C.text,fontFamily:"'DM Sans',sans-serif",fontSize:14,outline:"none",resize:"none",height:90,boxSizing:"border-box"}}/>
            <div style={{textAlign:"right",fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.dim,marginTop:3}}>{setup.bio.length}/150</div>
          </div>
          <PrimaryBtn onClick={doCreate}>🎉 Join Sync Everyone</PrimaryBtn>
          <button onClick={()=>setMode("register")} style={{background:"none",border:"none",color:C.muted,fontSize:13,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",textDecoration:"underline",textAlign:"left"}}>← Back</button>
        </div>
      </div>
    </Shell>
  );
}

/* ═══════════════════════════════ MAIN APP ═══════════════════════════════ */
export default function App(){
  const[users,setUsers]=useState(SEED_USERS);
  const[posts,setPosts]=useState(SEED_POSTS);
  const[convs,setConvs]=useState(SEED_CONVS);
  const[uid2,setUid2]=useState(null);
  const[tab,setTab]=useState("feed");
  const[viewUser,setViewUser]=useState(null);

  const me=users.find(u=>u.id===uid2);

  if(!me)return(
    <AuthScreen users={users} setUsers={setUsers} onLogin={id=>{setUid2(id);setTab("feed");}}/>
  );

  const gotoProfile=u=>{setViewUser(u);setTab("profile");};

  return(
    <>
      <style>{FONTS}</style>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:${C.bg};}
        ::-webkit-scrollbar{width:4px;height:4px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:${C.dim};border-radius:4px;}
        input::placeholder,textarea::placeholder{color:${C.dim};}
        input,textarea{caret-color:${C.accent};}
        .pc:hover{border-color:${C.accent}44!important;}
        .go:hover .gol{opacity:1!important;}
        .avh:hover .avo{opacity:1!important;}
      `}</style>
      <div style={{display:"flex",height:"100vh",maxWidth:1280,margin:"0 auto",border:`1px solid ${C.border}`,overflow:"hidden",background:C.bg}}>
        {/* Sidebar nav */}
        <nav style={{width:70,background:C.surface,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",alignItems:"center",padding:"18px 0",gap:6,flexShrink:0}}>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontWeight:700,fontSize:17,color:C.accent,marginBottom:18,writingMode:"vertical-rl",transform:"rotate(180deg)",letterSpacing:"1px"}}>SE</div>
          {[{id:"feed",icon:"⊞"},{id:"messages",icon:"◎"},{id:"profile",icon:"◉"}].map(item=>(
            <button key={item.id} onClick={()=>{setTab(item.id);if(item.id!=="profile")setViewUser(null);}} style={{width:44,height:44,borderRadius:12,background:tab===item.id?`${C.accent}15`:"transparent",border:`1px solid ${tab===item.id?C.accent+"44":"transparent"}`,color:tab===item.id?C.accent:C.muted,fontSize:17,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .2s"}}>{item.icon}</button>
          ))}
          <div style={{marginTop:"auto",display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
            <button onClick={()=>{setViewUser(null);setTab("profile");}} style={{background:"none",border:"none",cursor:"pointer",padding:0}}><Av user={me} size={38} ring={tab==="profile"&&!viewUser}/></button>
            <button onClick={()=>{setUid2(null);setTab("feed");setViewUser(null);}} title="Log out" style={{background:"none",border:"none",color:C.dim,cursor:"pointer",fontSize:15}}>⏻</button>
          </div>
        </nav>

        <main style={{flex:1,overflow:"hidden"}}>
          {tab==="feed"&&<FeedView me={me} users={users} posts={posts} setPosts={setPosts} onProfile={gotoProfile}/>}
          {tab==="messages"&&<MessagesView me={me} users={users} convs={convs} setConvs={setConvs}/>}
          {tab==="profile"&&<ProfileView me={me} users={users} setUsers={setUsers} posts={posts} viewUser={viewUser} onBack={()=>{setViewUser(null);setTab("feed");}} onProfile={gotoProfile}/>}
        </main>
      </div>
    </>
  );
}

/* ═══════════════════════════════ FEED ══════════════════════════════════ */
function FeedView({me,users,posts,setPosts,onProfile}){
  const[caption,setCaption]=useState("");
  const[emoji,setEmoji]=useState("✨");
  const[img,setImg]=useState(null);
  const[tagStr,setTagStr]=useState("");
  const[compose,setCompose]=useState(false);
  const[fol,setFol]=useState(()=>Object.fromEntries(users.filter(u=>u.id!==me.id).map(u=>[u.id,false])));
  const EMOJIS=["✨","🌅","🌿","🎵","🍲","💻","📸","🌊","🔥","🎨","🏔️","🌸"];

  const submit=()=>{
    if(!caption.trim())return;
    setPosts(p=>[{id:"p"+uid(),userId:me.id,emoji,image:img,caption:caption.trim(),likes:[],comments:[],time:"Just now",tags:tagStr.trim().split(/\s+/).filter(Boolean).map(t=>t.startsWith("#")?t:"#"+t)},...p]);
    setCaption("");setImg(null);setTagStr("");setCompose(false);
  };
  const toggleLike=pid=>setPosts(p=>p.map(x=>x.id!==pid?x:{...x,likes:x.likes.includes(me.id)?x.likes.filter(i=>i!==me.id):[...x.likes,me.id]}));

  const getUser=id=>users.find(u=>u.id===id)||me;

  return(
    <div style={{display:"flex",height:"100%",overflow:"hidden"}}>
      <div style={{flex:1,overflowY:"auto",minWidth:0}}>
        {/* Header */}
        <div style={{padding:"22px 30px 16px",borderBottom:`1px solid ${C.border}`,position:"sticky",top:0,background:C.bg,zIndex:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,color:C.text,margin:0,fontWeight:700}}>Sync Feed</h1>
            <p style={{color:C.muted,fontSize:13,margin:"3px 0 0",fontFamily:"'DM Sans',sans-serif"}}>What's happening in everyone</p>
          </div>
          <button onClick={()=>setCompose(v=>!v)} style={{background:C.accent,color:"#0c0b09",border:"none",borderRadius:10,padding:"8px 16px",fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:13,cursor:"pointer"}}>+ Post</button>
        </div>

        {/* Stories */}
        <div style={{padding:"16px 30px",borderBottom:`1px solid ${C.border}`,display:"flex",gap:12,overflowX:"auto"}}>
          {[me,...users.filter(u=>u.id!==me.id)].map(u=>(
            <div key={u.id} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:5,cursor:"pointer",flexShrink:0}}>
              <div style={{padding:2,borderRadius:"50%",background:u.id===me.id?C.border:`linear-gradient(135deg,${u.color||C.accent},${C.accentDim})`}}>
                <div style={{padding:2,background:C.bg,borderRadius:"50%"}}><Av user={u} size={44}/></div>
              </div>
              <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:C.muted,maxWidth:52,textAlign:"center",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.id===me.id?"Your story":u.handle}</span>
            </div>
          ))}
        </div>

        {/* Compose */}
        {compose&&(
          <div style={{margin:"18px 30px",background:C.card,borderRadius:16,border:`1px solid ${C.accent}44`,padding:18}}>
            <div style={{display:"flex",gap:11,alignItems:"flex-start",marginBottom:12}}>
              <Av user={me} size={36}/>
              <textarea value={caption} onChange={e=>setCaption(e.target.value)} placeholder="Share something with everyone…"
                style={{flex:1,background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:"9px 13px",color:C.text,fontFamily:"'DM Sans',sans-serif",fontSize:14,resize:"none",outline:"none",height:72}}/>
            </div>
            {img&&(
              <div style={{marginBottom:11,position:"relative",display:"inline-block"}}>
                <img src={img} alt="" style={{width:110,height:90,objectFit:"cover",borderRadius:9,border:`1px solid ${C.border}`}}/>
                <button onClick={()=>setImg(null)} style={{position:"absolute",top:-6,right:-6,width:20,height:20,borderRadius:"50%",background:C.red,border:"none",color:"white",fontSize:11,cursor:"pointer"}}>✕</button>
              </div>
            )}
            <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:10}}>
              {EMOJIS.map(e=>(
                <button key={e} onClick={()=>setEmoji(e)} style={{width:32,height:32,borderRadius:8,background:emoji===e?`${C.accent}22`:C.surface,border:`1px solid ${emoji===e?C.accent:C.border}`,fontSize:16,cursor:"pointer"}}>{e}</button>
              ))}
            </div>
            <div style={{marginBottom:11}}>
              <input value={tagStr} onChange={e=>setTagStr(e.target.value)} placeholder="#tags space-separated"
                style={{width:"100%",background:C.surface,border:`1px solid ${C.border}`,borderRadius:9,padding:"8px 12px",color:C.text,fontFamily:"'DM Sans',sans-serif",fontSize:13,outline:"none",boxSizing:"border-box"}}/>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <label style={{display:"flex",alignItems:"center",gap:7,cursor:"pointer",color:C.muted,fontFamily:"'DM Sans',sans-serif",fontSize:13}}>
                <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>setImg(ev.target.result);r.readAsDataURL(f);}}/>
                📷 Add photo
              </label>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>setCompose(false)} style={{background:"transparent",border:`1px solid ${C.border}`,borderRadius:8,padding:"6px 13px",color:C.muted,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",fontSize:13}}>Cancel</button>
                <button onClick={submit} disabled={!caption.trim()} style={{background:caption.trim()?C.accent:C.dim,border:"none",borderRadius:8,padding:"6px 16px",color:caption.trim()?"#0c0b09":C.muted,fontFamily:"'DM Sans',sans-serif",fontWeight:600,cursor:caption.trim()?"pointer":"default",fontSize:13}}>Share</button>
              </div>
            </div>
          </div>
        )}

        {/* Posts */}
        {posts.map(post=>{
          const author=getUser(post.userId);
          const liked=post.likes.includes(me.id);
          return(
            <div key={post.id} className="pc" style={{margin:"18px 30px",background:C.card,borderRadius:16,border:`1px solid ${C.border}`,overflow:"hidden",transition:"border-color .2s"}}>
              <div style={{padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{display:"flex",gap:11,alignItems:"center",cursor:"pointer"}} onClick={()=>onProfile(author)}>
                  <Av user={author} size={40}/>
                  <div>
                    <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:14,color:C.text}}>{author.name}</div>
                    <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.muted}}>@{author.handle} · {post.time}</div>
                  </div>
                </div>
                {author.id!==me.id&&(
                  <button onClick={()=>setFol(f=>({...f,[author.id]:!f[author.id]}))} style={{background:fol[author.id]?"transparent":C.accent,border:`1px solid ${fol[author.id]?C.border:C.accent}`,borderRadius:8,padding:"4px 11px",color:fol[author.id]?C.muted:"#0c0b09",fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:600,cursor:"pointer"}}>
                    {fol[author.id]?"Following":"Follow"}
                  </button>
                )}
              </div>
              {post.image
                ?<img src={post.image} alt="" style={{width:"100%",maxHeight:320,objectFit:"cover",borderTop:`1px solid ${C.border}`,borderBottom:`1px solid ${C.border}`,display:"block"}}/>
                :<div style={{height:240,background:`linear-gradient(135deg,${author.color||C.accent}14,${C.surface})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:72,borderTop:`1px solid ${C.border}`,borderBottom:`1px solid ${C.border}`}}>{post.emoji}</div>
              }
              <div style={{padding:"11px 18px 7px",display:"flex",gap:18}}>
                <button onClick={()=>toggleLike(post.id)} style={{background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:5,color:liked?"#e06b6b":C.muted,fontFamily:"'DM Sans',sans-serif",fontSize:13}}>{liked?"♥":"♡"} {post.likes.length}</button>
                <button style={{background:"none",border:"none",cursor:"pointer",color:C.muted,fontFamily:"'DM Sans',sans-serif",fontSize:13,display:"flex",alignItems:"center",gap:5}}>◯ {post.comments.length}</button>
                <button style={{background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:13,marginLeft:"auto"}}>⇧</button>
              </div>
              <div style={{padding:"0 18px 14px"}}>
                <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:14,color:C.text,margin:"0 0 5px",lineHeight:1.55}}><span style={{fontWeight:600}}>{author.handle} </span>{post.caption}</p>
                {post.tags?.length>0&&<div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{post.tags.map(t=><span key={t} style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.accent}}>{t}</span>)}</div>}
              </div>
            </div>
          );
        })}
        {posts.length===0&&<div style={{textAlign:"center",padding:"70px 20px",color:C.muted,fontFamily:"'DM Sans',sans-serif"}}><div style={{fontSize:36,marginBottom:10}}>📭</div><div>No posts yet — be the first to share!</div></div>}
      </div>

      {/* Right sidebar */}
      <div style={{width:220,borderLeft:`1px solid ${C.border}`,padding:"22px 16px",overflowY:"auto",flexShrink:0,display:"flex",flexDirection:"column",gap:22}}>
        <div>
          <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:12,color:C.muted,textTransform:"uppercase",letterSpacing:"1.5px",marginBottom:14}}>Suggested</p>
          {users.filter(u=>u.id!==me.id).slice(0,5).map(u=>(
            <div key={u.id} style={{display:"flex",alignItems:"center",gap:9,marginBottom:13,cursor:"pointer"}} onClick={()=>onProfile(u)}>
              <Av user={u} size={32}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,fontWeight:500,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{u.name}</div>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.muted}}>@{u.handle}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{borderTop:`1px solid ${C.border}`,paddingTop:18}}>
          <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:12,color:C.muted,textTransform:"uppercase",letterSpacing:"1.5px",marginBottom:12}}>Active Now</p>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {users.filter(u=>u.id!==me.id).slice(0,5).map(u=>(
              <div key={u.id} style={{position:"relative"}}><Av user={u} size={30}/>
                <span style={{position:"absolute",bottom:0,right:0,width:8,height:8,borderRadius:"50%",background:C.green,border:`2px solid ${C.bg}`}}/>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════ MESSAGES ═══════════════════════════════ */
function MessagesView({me,users,convs,setConvs}){
  const[activeId,setActiveId]=useState(convs[0]?.id||null);
  const[input,setInput]=useState("");
  const[showNew,setShowNew]=useState(false);
  const bottomRef=useRef();
  const active=convs.find(c=>c.id===activeId);
  const getUser=id=>users.find(u=>u.id===id)||me;

  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:"smooth"});},[activeId,convs]);

  const send=()=>{
    if(!input.trim()||!active)return;
    setConvs(p=>p.map(c=>c.id===active.id?{...c,messages:[...c.messages,{from:me.id,text:input.trim(),time:"Now"}]}:c));
    setInput("");
  };

  const convName=c=>c.type==="group"?c.name:getUser(c.members[0]).name;
  const convPreview=c=>{const l=c.messages.slice(-1)[0];if(!l)return"No messages yet";const s=l.from===me.id?"You":getUser(l.from).name.split(" ")[0];return`${s}: ${l.text}`;};

  return(
    <div style={{display:"flex",height:"100%",overflow:"hidden"}}>
      {/* List */}
      <div style={{width:265,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",flexShrink:0}}>
        <div style={{padding:"22px 16px 13px",borderBottom:`1px solid ${C.border}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:C.text,fontWeight:700}}>Messages</h2>
            <button onClick={()=>setShowNew(v=>!v)} style={{background:`${C.accent}18`,border:`1px solid ${C.accent}44`,borderRadius:8,width:30,height:30,color:C.accent,cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
          </div>
          <input placeholder="Search…" style={{width:"100%",background:C.card,border:`1px solid ${C.border}`,borderRadius:9,padding:"8px 12px",color:C.text,fontFamily:"'DM Sans',sans-serif",fontSize:13,outline:"none",boxSizing:"border-box"}}/>
        </div>
        {showNew&&(
          <div style={{padding:"11px 16px",borderBottom:`1px solid ${C.border}`,background:C.card}}>
            <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.muted,marginBottom:9,textTransform:"uppercase",letterSpacing:"0.7px"}}>New conversation</p>
            {users.filter(u=>u.id!==me.id&&!convs.find(c=>c.type==="direct"&&c.members.includes(u.id))).map(u=>(
              <div key={u.id} onClick={()=>{const nc={id:"c"+uid(),type:"direct",members:[u.id],messages:[]};setConvs(p=>[...p,nc]);setActiveId(nc.id);setShowNew(false);}} style={{display:"flex",alignItems:"center",gap:9,padding:"7px 0",cursor:"pointer"}}>
                <Av user={u} size={28}/><span style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:C.text}}>{u.name}</span>
              </div>
            ))}
            {users.filter(u=>u.id!==me.id&&!convs.find(c=>c.type==="direct"&&c.members.includes(u.id))).length===0&&
              <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.muted}}>All users already have conversations</p>
            }
          </div>
        )}
        <div style={{overflowY:"auto",flex:1}}>
          {convs.map(c=>{
            const cu=c.type==="direct"?getUser(c.members[0]):null;
            return(
              <div key={c.id} onClick={()=>setActiveId(c.id)} style={{padding:"11px 16px",cursor:"pointer",background:activeId===c.id?`${C.accent}0d`:"transparent",borderLeft:`3px solid ${activeId===c.id?C.accent:"transparent"}`,display:"flex",gap:10,alignItems:"center",transition:"all .15s"}}>
                {cu?<Av user={cu} size={38}/>:<div style={{width:38,height:38,borderRadius:"50%",background:C.card,border:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0}}>{c.name?.slice(-2)}</div>}
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:13,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{convName(c)}</div>
                  <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginTop:2}}>{convPreview(c)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat */}
      {active?(
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <div style={{padding:"14px 22px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:12,background:C.surface}}>
            {active.type==="direct"?<Av user={getUser(active.members[0])} size={38}/>:<div style={{width:38,height:38,borderRadius:"50%",background:C.card,border:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>{active.name?.slice(-2)}</div>}
            <div>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:15,color:C.text}}>{convName(active)}</div>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.green}}>{active.type==="group"?`${active.members.length+1} members`:"● Online"}</div>
            </div>
          </div>
          <div style={{flex:1,overflowY:"auto",padding:"18px 22px",display:"flex",flexDirection:"column",gap:11}}>
            {active.messages.length===0&&<div style={{textAlign:"center",padding:"40px",color:C.muted,fontFamily:"'DM Sans',sans-serif",fontSize:13}}>No messages yet — say hello! 👋</div>}
            {active.messages.map((msg,i)=>{
              const isMe=msg.from===me.id;
              const sender=isMe?me:getUser(msg.from);
              const showName=!isMe&&active.type==="group"&&(i===0||active.messages[i-1]?.from!==msg.from);
              return(
                <div key={i} style={{display:"flex",flexDirection:isMe?"row-reverse":"row",gap:8,alignItems:"flex-end"}}>
                  {!isMe&&<Av user={sender} size={26}/>}
                  <div style={{maxWidth:"65%",display:"flex",flexDirection:"column",alignItems:isMe?"flex-end":"flex-start"}}>
                    {showName&&<span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.muted,marginBottom:3}}>{sender.name}</span>}
                    <div style={{background:isMe?C.accent:C.card,color:isMe?"#0c0b09":C.text,padding:"9px 13px",borderRadius:isMe?"15px 15px 4px 15px":"15px 15px 15px 4px",fontFamily:"'DM Sans',sans-serif",fontSize:14,lineHeight:1.5,border:isMe?"none":`1px solid ${C.border}`}}>
                      {msg.text}
                    </div>
                    <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:C.dim,marginTop:3}}>{msg.time}</span>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef}/>
          </div>
          <div style={{padding:"12px 22px",borderTop:`1px solid ${C.border}`,display:"flex",gap:10,alignItems:"center"}}>
            <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Type a message…"
              style={{flex:1,background:C.card,border:`1px solid ${C.border}`,borderRadius:11,padding:"10px 15px",color:C.text,fontFamily:"'DM Sans',sans-serif",fontSize:14,outline:"none"}}/>
            <button onClick={send} style={{width:40,height:40,borderRadius:11,background:C.accent,border:"none",cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>➤</button>
          </div>
        </div>
      ):(
        <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",color:C.muted,fontFamily:"'DM Sans',sans-serif",flexDirection:"column",gap:8}}>
          <div style={{fontSize:32}}>💬</div><div>Select a conversation</div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════ PROFILE ════════════════════════════════ */
function ProfileView({me,users,setUsers,posts,viewUser,onBack,onProfile}){
  const user=viewUser||me;
  const isMe=user.id===me.id;
  const[editing,setEditing]=useState(false);
  const[draft,setDraft]=useState({name:user.name,bio:user.bio||"",avatar:user.avatar,color:user.color||AVATAR_COLORS[0]});
  const[activeTab,setActiveTab]=useState("posts");
  const[fol,setFol]=useState(me.following?.includes(user.id)||false);
  const userPosts=posts.filter(p=>p.userId===user.id);

  const save=()=>{
    setUsers(p=>p.map(u=>u.id===me.id?{...u,...draft,initials:mkInitials(draft.name)}:u));
    setEditing(false);
  };

  return(
    <div style={{height:"100%",overflowY:"auto"}}>
      <div style={{padding:"22px 38px 0",maxWidth:840,margin:"0 auto"}}>
        {viewUser&&<button onClick={onBack} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:13,marginBottom:14,display:"flex",alignItems:"center",gap:5}}>← Back</button>}

        {/* Cover */}
        <div style={{height:120,borderRadius:16,background:`linear-gradient(135deg,${user.color||C.accent}28,${C.surface})`,border:`1px solid ${C.border}`,marginBottom:-38,position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",inset:0,backgroundImage:`radial-gradient(circle at 25% 50%,${user.color||C.accent}20 0%,transparent 65%)`}}/>
        </div>

        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",paddingBottom:20}}>
          {/* Avatar */}
          {isMe&&editing
            ?<div style={{position:"relative",zIndex:1}}><PhotoPicker value={draft.avatar} onChange={v=>setDraft(d=>({...d,avatar:v}))} size={80}/></div>
            :<div style={{width:80,height:80,borderRadius:"50%",background:`${user.color||C.accent}1a`,border:`3px solid ${C.bg}`,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",position:"relative",zIndex:1,flexShrink:0}}>
              {user.avatar?<img src={user.avatar} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:26,color:user.color||C.accent}}>{user.initials||mkInitials(user.name)}</span>}
              {!isMe&&<span style={{position:"absolute",bottom:3,right:3,width:13,height:13,borderRadius:"50%",background:C.green,border:`2px solid ${C.bg}`}}/>}
            </div>
          }
          {/* Actions */}
          {isMe
            ?editing
              ?<div style={{display:"flex",gap:9}}>
                  <button onClick={()=>setEditing(false)} style={{background:"transparent",border:`1px solid ${C.border}`,borderRadius:9,padding:"8px 14px",color:C.muted,fontFamily:"'DM Sans',sans-serif",fontSize:13,cursor:"pointer"}}>Cancel</button>
                  <button onClick={save} style={{background:C.accent,border:"none",borderRadius:9,padding:"8px 16px",color:"#0c0b09",fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:13,cursor:"pointer"}}>Save</button>
                </div>
              :<button onClick={()=>{setDraft({name:me.name,bio:me.bio||"",avatar:me.avatar,color:me.color||AVATAR_COLORS[0]});setEditing(true);}} style={{background:"transparent",border:`1px solid ${C.border}`,borderRadius:9,padding:"8px 16px",color:C.text,fontFamily:"'DM Sans',sans-serif",fontSize:13,cursor:"pointer"}}>✏️ Edit Profile</button>
            :<div style={{display:"flex",gap:9}}>
                <button style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:9,padding:"8px 14px",color:C.text,fontFamily:"'DM Sans',sans-serif",fontSize:13,cursor:"pointer"}}>Message</button>
                <button onClick={()=>setFol(f=>!f)} style={{background:fol?"transparent":C.accent,border:`1px solid ${fol?C.border:C.accent}`,borderRadius:9,padding:"8px 16px",color:fol?C.muted:"#0c0b09",fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:13,cursor:"pointer"}}>{fol?"Following":"Follow"}</button>
              </div>
          }
        </div>

        {/* Bio / Edit */}
        {isMe&&editing?(
          <div style={{marginBottom:22,display:"flex",flexDirection:"column",gap:13}}>
            <Field label="Display Name" value={draft.name} onChange={v=>setDraft(d=>({...d,name:v}))}/>
            <div>
              <label style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.muted,letterSpacing:"0.9px",textTransform:"uppercase",display:"block",marginBottom:6}}>Bio</label>
              <textarea value={draft.bio} onChange={e=>setDraft(d=>({...d,bio:e.target.value}))} maxLength={150}
                style={{width:"100%",background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 13px",color:C.text,fontFamily:"'DM Sans',sans-serif",fontSize:14,outline:"none",resize:"none",height:76,boxSizing:"border-box"}}/>
            </div>
            <div>
              <label style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.muted,letterSpacing:"0.9px",textTransform:"uppercase",display:"block",marginBottom:8}}>Profile Color</label>
              <div style={{display:"flex",gap:9}}>
                {AVATAR_COLORS.map(col=><button key={col} onClick={()=>setDraft(d=>({...d,color:col}))} style={{width:26,height:26,borderRadius:"50%",background:col,border:`3px solid ${draft.color===col?C.text:C.border}`,cursor:"pointer"}}/>)}
              </div>
            </div>
          </div>
        ):(
          <div style={{paddingBottom:22,borderBottom:`1px solid ${C.border}`}}>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,color:C.text,margin:"0 0 2px",fontWeight:700}}>{user.name}</h2>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:C.muted,marginBottom:9}}>@{user.handle}</div>
            {user.bio&&<p style={{fontFamily:"'DM Sans',sans-serif",fontSize:14,color:C.text,margin:"0 0 16px",lineHeight:1.65,maxWidth:480}}>{user.bio}</p>}
            <div style={{display:"flex",gap:26}}>
              {[{label:"Posts",value:userPosts.length},{label:"Followers",value:user.followers?.length||0},{label:"Following",value:user.following?.length||0}].map(s=>(
                <div key={s.label} style={{display:"flex",flexDirection:"column"}}>
                  <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:700,color:C.text}}>{s.value}</span>
                  <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.muted,marginTop:2}}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{display:"flex"}}>
          {["posts","tagged","saved"].map(t=>(
            <button key={t} onClick={()=>setActiveTab(t)} style={{background:"none",border:"none",borderBottom:`2px solid ${activeTab===t?C.accent:"transparent"}`,padding:"12px 20px",fontFamily:"'DM Sans',sans-serif",fontWeight:500,fontSize:13,color:activeTab===t?C.accent:C.muted,cursor:"pointer",textTransform:"capitalize",transition:"all .15s"}}>{t}</button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div style={{padding:"18px 38px 40px",maxWidth:840,margin:"0 auto"}}>
        {userPosts.length>0
          ?<div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
            {userPosts.map(p=>(
              <div key={p.id} className="go" style={{aspectRatio:"1",background:`linear-gradient(135deg,${user.color||C.accent}14,${C.card})`,borderRadius:11,border:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",position:"relative",cursor:"pointer"}}>
                {p.image?<img src={p.image} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{fontSize:44}}>{p.emoji}</span>}
                <div className="gol" style={{position:"absolute",inset:0,background:"rgba(0,0,0,.55)",opacity:0,transition:"opacity .2s",display:"flex",alignItems:"center",justifyContent:"center",gap:16}}>
                  <span style={{color:"white",fontFamily:"'DM Sans',sans-serif",fontSize:13}}>♥ {p.likes.length}</span>
                  <span style={{color:"white",fontFamily:"'DM Sans',sans-serif",fontSize:13}}>◯ {p.comments.length}</span>
                </div>
              </div>
            ))}
          </div>
          :<div style={{textAlign:"center",padding:"60px 20px",color:C.muted,fontFamily:"'DM Sans',sans-serif"}}><div style={{fontSize:34,marginBottom:10}}>📷</div><div>{isMe?"Share your first post on Sync":"Nothing shared yet"}</div></div>
        }
      </div>
    </div>
  );
}
