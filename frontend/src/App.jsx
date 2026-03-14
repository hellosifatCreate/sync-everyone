import { useState, useRef, useEffect, useCallback } from "react";
import api from "./api";

const C = {
  bg:"#faf8f4", surface:"#ffffff", card:"#f5f2ec", border:"#e8e0d0",
  accent:"#c47d1e", accentBg:"#fdf3e3", green:"#3d9655", greenBg:"#edf7f0",
  red:"#c94e4e", redBg:"#fdf0f0", text:"#1c1814", muted:"#7a7060",
  dim:"#c8bfb0", shadow:"0 2px 12px rgba(0,0,0,0.08)", shadow2:"0 8px 32px rgba(0,0,0,0.12)",
};
const FONTS=`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');`;
const AVATAR_COLORS=["#c47d1e","#3d9655","#8b5cf6","#c94e4e","#0891b2","#d97706","#059669"];
const EMOJIS=["✨","🌅","🌿","🎵","🍲","💻","📸","🌊","🔥","🎨","😊","🙌"];
const mkInitials=n=>n.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2);
const pickColor=s=>AVATAR_COLORS[s.charCodeAt(0)%AVATAR_COLORS.length];
const timeAgo=d=>{
  if(!d)return"";
  const s=Math.floor((Date.now()-new Date(d))/1000);
  if(s<60)return"Just now";if(s<3600)return`${Math.floor(s/60)}m ago`;
  if(s<86400)return`${Math.floor(s/3600)}h ago`;return`${Math.floor(s/86400)}d ago`;
};

/* ── Avatar ─────────────────────────────────────────────── */
function Av({user,size=36,ring=false}){
  if(!user)return null;
  const col=user.color||pickColor(user.name||"A");
  const src=user.avatar_url||null;
  return(
    <div style={{width:size,height:size,borderRadius:"50%",flexShrink:0,
      border:ring?`2.5px solid ${col}`:`2px solid ${col}44`,
      background:src?"transparent":`${col}18`,
      display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
      {src?<img src={src} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
          :<span style={{fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:size*0.36,color:col}}>{user.initials||mkInitials(user.name||"?")}</span>}
    </div>
  );
}

/* ── Field ───────────────────────────────────────────────── */
function Field({label,type="text",value,onChange,placeholder,error,autoFocus,hint}){
  return(
    <div style={{display:"flex",flexDirection:"column",gap:5}}>
      {label&&<label style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.muted,letterSpacing:"0.9px",textTransform:"uppercase",fontWeight:600}}>{label}</label>}
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} autoFocus={autoFocus}
        style={{background:C.card,border:`1.5px solid ${error?C.red:C.border}`,borderRadius:12,padding:"13px 16px",color:C.text,fontFamily:"'DM Sans',sans-serif",fontSize:16,outline:"none",width:"100%",boxSizing:"border-box"}}/>
      {hint&&<span style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.muted}}>{hint}</span>}
      {error&&<span style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.red}}>{error}</span>}
    </div>
  );
}
function PBtn({children,onClick,loading,disabled,small,fullWidth=true}){
  return(
    <button onClick={onClick} disabled={disabled||loading} style={{
      background:disabled||loading?C.dim:C.accent,border:"none",borderRadius:12,
      padding:small?"10px 16px":"14px 20px",width:fullWidth?"100%":"auto",
      color:"#fff",fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:small?13:15,
      cursor:disabled||loading?"default":"pointer",opacity:loading?0.7:1,transition:"all .15s"}}>
      {loading?"⏳ Loading…":children}
    </button>
  );
}
function GBtn({children,onClick,small,fullWidth=true}){
  return(
    <button onClick={onClick} style={{
      background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:12,
      padding:small?"10px 16px":"13px 20px",width:fullWidth?"100%":"auto",
      color:C.text,fontFamily:"'DM Sans',sans-serif",fontSize:small?13:15,cursor:"pointer"}}>
      {children}
    </button>
  );
}
function Spinner(){
  return(
    <div style={{display:"flex",justifyContent:"center",alignItems:"center",padding:40}}>
      <div style={{width:28,height:28,borderRadius:"50%",border:`3px solid ${C.border}`,borderTopColor:C.accent,animation:"spin 0.8s linear infinite"}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
function Toast({msg,type}){
  if(!msg)return null;
  return(
    <div style={{position:"fixed",bottom:90,left:"50%",transform:"translateX(-50%)",zIndex:9999,
      background:type==="error"?C.red:C.green,color:"#fff",padding:"12px 20px",borderRadius:20,
      fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:600,boxShadow:C.shadow2,whiteSpace:"nowrap"}}>
      {msg}
    </div>
  );
}

/* ── Comment Sheet ───────────────────────────────────────── */
function CommentSheet({post,me,onClose}){
  const [comments,setComments]=useState([]);
  const [text,setText]=useState("");
  const [loading,setLoad]=useState(true);
  const [sending,setSend]=useState(false);
  const inputRef=useRef();

  useEffect(()=>{
    api.get(`/posts/${post.id}/comments`).then(({data})=>setComments(data)).catch(()=>{}).finally(()=>setLoad(false));
    setTimeout(()=>inputRef.current?.focus(),300);
  },[post.id]);

  const send=async()=>{
    if(!text.trim()||sending)return;
    const t=text.trim();setText("");setSend(true);
    try{
      const{data}=await api.post(`/posts/${post.id}/comments`,{text:t});
      setComments(p=>[...p,data]);
    }catch{setText(t);}
    setSend(false);
  };

  return(
    <div style={{position:"fixed",inset:0,zIndex:1000}} onClick={onClose}>
      <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.4)"}}/>
      <div onClick={e=>e.stopPropagation()} style={{
        position:"absolute",bottom:0,left:"50%",transform:"translateX(-50%)",
        width:"100%",maxWidth:600,background:C.surface,borderRadius:"20px 20px 0 0",
        maxHeight:"80vh",display:"flex",flexDirection:"column",boxShadow:C.shadow2}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 16px 12px",borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
          <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontWeight:700,color:C.text}}>Comments</h3>
          <button onClick={onClose} style={{background:C.card,border:"none",borderRadius:"50%",width:32,height:32,cursor:"pointer",fontSize:16,color:C.muted}}>✕</button>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"12px 16px",display:"flex",flexDirection:"column",gap:12}}>
          {loading?<Spinner/>:comments.length===0?(
            <div style={{textAlign:"center",padding:"30px 20px",color:C.muted,fontFamily:"'DM Sans',sans-serif",fontSize:14}}>
              No comments yet — be the first! 💬
            </div>
          ):comments.map(c=>(
            <div key={c.id} style={{display:"flex",gap:10,alignItems:"flex-start"}}>
              <Av user={{name:c.name,handle:c.handle,avatar_url:c.avatar_url,color:c.color}} size={34}/>
              <div style={{flex:1}}>
                <div style={{background:C.card,borderRadius:"4px 14px 14px 14px",padding:"9px 13px",border:`1px solid ${C.border}`}}>
                  <span style={{fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:13,color:C.text}}>@{c.handle} </span>
                  <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:14,color:C.text}}>{c.text}</span>
                </div>
                <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:11,color:C.dim,marginTop:3,display:"block"}}>{timeAgo(c.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
        <div style={{padding:"10px 12px",borderTop:`1px solid ${C.border}`,display:"flex",gap:8,alignItems:"center",paddingBottom:"max(10px,env(safe-area-inset-bottom))"}}>
          <Av user={me} size={32}/>
          <input ref={inputRef} value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()}
            placeholder="Write a comment…"
            style={{flex:1,background:C.card,border:`1.5px solid ${C.border}`,borderRadius:20,padding:"10px 15px",color:C.text,fontFamily:"'DM Sans',sans-serif",fontSize:15,outline:"none"}}/>
          <button onClick={send} disabled={!text.trim()||sending}
            style={{width:38,height:38,borderRadius:"50%",background:text.trim()?C.accent:C.dim,border:"none",cursor:text.trim()?"pointer":"default",fontSize:16,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Post Options Sheet ──────────────────────────────────── */
function PostOptionsSheet({post,me,onEdit,onDelete,onClose}){
  const isOwn=post.user_id===me.id||post.author_handle===me.handle;
  const share=()=>{
    const text=`${post.author_name}: ${post.caption}`;
    if(navigator.share){navigator.share({title:"Sync Everyone",text});}
    else{navigator.clipboard.writeText(text);alert("Copied to clipboard!");}
    onClose();
  };
  return(
    <div style={{position:"fixed",inset:0,zIndex:1000}} onClick={onClose}>
      <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.4)"}}/>
      <div onClick={e=>e.stopPropagation()} style={{
        position:"absolute",bottom:0,left:"50%",transform:"translateX(-50%)",
        width:"100%",maxWidth:600,background:C.surface,borderRadius:"20px 20px 0 0",
        paddingBottom:"max(16px,env(safe-area-inset-bottom))"}}>
        <div style={{width:40,height:4,background:C.border,borderRadius:2,margin:"12px auto 8px"}}/>
        {isOwn&&(
          <>
            <button onClick={onEdit} style={{width:"100%",padding:"16px 20px",background:"none",border:"none",borderBottom:`1px solid ${C.border}`,textAlign:"left",fontFamily:"'DM Sans',sans-serif",fontSize:16,color:C.text,cursor:"pointer",display:"flex",alignItems:"center",gap:12}}>
              ✏️ Edit Post
            </button>
            <button onClick={onDelete} style={{width:"100%",padding:"16px 20px",background:"none",border:"none",borderBottom:`1px solid ${C.border}`,textAlign:"left",fontFamily:"'DM Sans',sans-serif",fontSize:16,color:C.red,cursor:"pointer",display:"flex",alignItems:"center",gap:12}}>
              🗑️ Delete Post
            </button>
          </>
        )}
        <button onClick={share} style={{width:"100%",padding:"16px 20px",background:"none",border:"none",borderBottom:`1px solid ${C.border}`,textAlign:"left",fontFamily:"'DM Sans',sans-serif",fontSize:16,color:C.text,cursor:"pointer",display:"flex",alignItems:"center",gap:12}}>
          🔗 Share Post
        </button>
        <button onClick={onClose} style={{width:"100%",padding:"16px 20px",background:"none",border:"none",textAlign:"left",fontFamily:"'DM Sans',sans-serif",fontSize:16,color:C.muted,cursor:"pointer"}}>
          Cancel
        </button>
      </div>
    </div>
  );
}

/* ── Edit Post Sheet ─────────────────────────────────────── */
function EditPostSheet({post,onSave,onClose}){
  const [caption,setCaption]=useState(post.caption);
  const [saving,setSave]=useState(false);
  const save=async()=>{
    if(!caption.trim())return;setSave(true);
    try{
      await api.put(`/posts/${post.id}`,{caption:caption.trim()});
      onSave({...post,caption:caption.trim()});
    }catch{alert("Failed to update");}
    setSave(false);
  };
  return(
    <div style={{position:"fixed",inset:0,zIndex:1001}} onClick={onClose}>
      <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.4)"}}/>
      <div onClick={e=>e.stopPropagation()} style={{
        position:"absolute",bottom:0,left:"50%",transform:"translateX(-50%)",
        width:"100%",maxWidth:600,background:C.surface,borderRadius:"20px 20px 0 0",
        padding:20,paddingBottom:"max(20px,env(safe-area-inset-bottom))"}}>
        <h3 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontWeight:700,color:C.text,marginBottom:14}}>Edit Post</h3>
        <textarea value={caption} onChange={e=>setCaption(e.target.value)}
          style={{width:"100%",background:C.card,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"12px 14px",color:C.text,fontFamily:"'DM Sans',sans-serif",fontSize:15,resize:"none",outline:"none",height:100,boxSizing:"border-box",marginBottom:14}}/>
        <div style={{display:"flex",gap:8}}>
          <GBtn onClick={onClose} small>Cancel</GBtn>
          <PBtn onClick={save} loading={saving} small>Save</PBtn>
        </div>
      </div>
    </div>
  );
}

/* ── Post Card ───────────────────────────────────────────── */
function PostCard({post,me,onProfile,onUpdate,onDelete,showToast}){
  const [liked,setLiked]=useState(!!post.liked_by_me);
  const [likeCount,setLC]=useState(post.like_count||0);
  const [commentCount,setCC]=useState(post.comment_count||0);
  const [showComments,setShowComments]=useState(false);
  const [showOptions,setShowOptions]=useState(false);
  const [showEdit,setShowEdit]=useState(false);
  const isOwn=post.user_id===me.id||post.author_handle===me.handle;
  const authorColor=post.author_color||pickColor(post.author_name||"A");
  const authorObj={name:post.author_name,handle:post.author_handle,avatar_url:post.author_avatar,color:post.author_color};

  const toggleLike=async()=>{
    const wasLiked=liked;
    setLiked(!wasLiked);setLC(c=>wasLiked?c-1:c+1);
    try{await api.post(`/posts/${post.id}/like`);}
    catch{setLiked(wasLiked);setLC(c=>wasLiked?c+1:c-1);}
  };

  const doDelete=async()=>{
    if(!confirm("Delete this post?"))return;
    try{await api.delete(`/posts/${post.id}`);onDelete(post.id);showToast("Post deleted");}
    catch{showToast("Failed to delete","error");}
    setShowOptions(false);
  };

  const share=()=>{
    const text=`${post.author_name}: ${post.caption}`;
    if(navigator.share){navigator.share({title:"Sync Everyone",text});}
    else{navigator.clipboard?.writeText(text);showToast("Copied to clipboard! 📋");}
  };

  return(
    <div style={{borderBottom:`1px solid ${C.border}`,background:C.surface}}>
      {/* Header */}
      <div style={{padding:"12px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",gap:10,alignItems:"center",cursor:"pointer"}} onClick={()=>onProfile(authorObj)}>
          <Av user={authorObj} size={42}/>
          <div>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:15,color:C.text}}>{post.author_name}</div>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.muted}}>@{post.author_handle} · {timeAgo(post.created_at)}</div>
          </div>
        </div>
        <button onClick={()=>setShowOptions(true)} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:20,padding:"4px 8px",borderRadius:8}}>⋯</button>
      </div>

      {/* Image or emoji */}
      {post.image_url
        ?<img src={post.image_url} alt="" style={{width:"100%",maxHeight:380,objectFit:"cover",display:"block"}}/>
        :<div style={{width:"100%",height:220,background:`linear-gradient(135deg,${authorColor}12,${C.card})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:72}}>{post.emoji}</div>
      }

      {/* Caption */}
      <div style={{padding:"10px 14px 6px"}}>
        <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:14,color:C.text,margin:0,lineHeight:1.6}}>
          <span style={{fontWeight:700}}>{post.author_handle} </span>{post.caption}
        </p>
        {post.tags&&<div style={{display:"flex",gap:5,flexWrap:"wrap",marginTop:6}}>
          {post.tags.split(/\s+/).filter(Boolean).map(t=>(
            <span key={t} style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:C.accent,background:C.accentBg,padding:"2px 8px",borderRadius:20}}>{t.startsWith("#")?t:"#"+t}</span>
          ))}
        </div>}
      </div>

      {/* Actions */}
      <div style={{padding:"6px 14px 12px",display:"flex",gap:4,alignItems:"center"}}>
        <button onClick={toggleLike} style={{background:liked?C.redBg:"transparent",border:`1px solid ${liked?C.red+"44":C.border}`,borderRadius:20,padding:"7px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:5,color:liked?C.red:C.muted,fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:500}}>
          {liked?"❤️":"🤍"} {likeCount}
        </button>
        <button onClick={()=>setShowComments(true)} style={{background:"transparent",border:`1px solid ${C.border}`,borderRadius:20,padding:"7px 14px",cursor:"pointer",color:C.muted,fontFamily:"'DM Sans',sans-serif",fontSize:14,display:"flex",alignItems:"center",gap:5}}>
          💬 {commentCount}
        </button>
        <div style={{flex:1}}/>
        <button onClick={share} style={{background:"transparent",border:`1px solid ${C.border}`,borderRadius:20,padding:"7px 12px",cursor:"pointer",color:C.muted,fontSize:16}}>
          🔗
        </button>
      </div>

      {showComments&&<CommentSheet post={post} me={me} onClose={()=>{setShowComments(false);api.get(`/posts/${post.id}/comments`).then(({data})=>setCC(data.length)).catch(()=>{});}}/>}
      {showOptions&&<PostOptionsSheet post={post} me={me}
        onEdit={()=>{setShowOptions(false);setShowEdit(true);}}
        onDelete={doDelete} onClose={()=>setShowOptions(false)}/>}
      {showEdit&&<EditPostSheet post={post}
        onSave={updated=>{onUpdate(updated);setShowEdit(false);}}
        onClose={()=>setShowEdit(false)}/>}
    </div>
  );
}

/* ── AUTH ────────────────────────────────────────────────── */
function AuthScreen({onLogin}){
  const [mode,setMode]=useState("login");
  const [lf,setLf]=useState({id:"",pw:""});
  const [lerr,setLerr]=useState("");
  const [lload,setLload]=useState(false);
  const [rf,setRf]=useState({name:"",handle:"",email:"",pw:"",pw2:""});
  const [rerr,setRerr]=useState({});
  const [setup,setSetup]=useState({bio:"",avatar:null,color:AVATAR_COLORS[0]});
  const [rload,setRload]=useState(false);
  const [pendingData,setPendingData]=useState(null);
  const fileRef=useRef();

  const doLogin=async()=>{
    setLerr("");setLload(true);
    try{
      const{data}=await api.post("/auth/login",{identifier:lf.id,password:lf.pw});
      localStorage.setItem("se_token",data.token);onLogin(data.user);
    }catch(e){setLerr(e.response?.data?.error||"Login failed");}
    setLload(false);
  };
  const doRegister=async()=>{
    const e={};
    if(!rf.name.trim())e.name="Name required";
    if(!rf.handle.trim())e.handle="Username required";
    if(!rf.email.trim())e.email="Email required";
    if(rf.pw.length<6)e.pw="Min 6 characters";
    if(rf.pw!==rf.pw2)e.pw2="Passwords don't match";
    if(Object.keys(e).length){setRerr(e);return;}
    setRerr({});setRload(true);
    try{
      const{data}=await api.post("/auth/register",{name:rf.name.trim(),handle:rf.handle.trim().replace("@",""),email:rf.email.trim(),password:rf.pw});
      setPendingData(data);setMode("setup");
    }catch(e){alert(e.response?.data?.error||"Registration failed");}
    setRload(false);
  };
  const doCreate=async()=>{
    if(!pendingData)return;setRload(true);
    try{
      if(setup.bio||setup.color){
        await api.put("/users/me/profile",{bio:setup.bio,color:setup.color},{headers:{"Authorization":"Bearer "+pendingData.token}});
      }
      if(setup.avatar){
        try{
          const res=await fetch(setup.avatar);const blob=await res.blob();
          const fd=new FormData();fd.append("avatar",blob,"avatar.jpg");
          await api.post("/users/me/avatar",fd,{headers:{"Authorization":"Bearer "+pendingData.token}});
        }catch{}
      }
      const{data}=await api.get("/auth/me",{headers:{"Authorization":"Bearer "+pendingData.token}});
      localStorage.setItem("se_token",pendingData.token);onLogin(data);
    }catch(e){alert(e.response?.data?.error||"Registration failed");}
    setRload(false);
  };

  const Shell=({children})=>(
    <div style={{minHeight:"100dvh",background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px 16px"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:28}}>
        <div style={{width:44,height:44,borderRadius:13,background:C.accent,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 12px rgba(196,125,30,0.4)"}}>
          <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:"#fff",fontWeight:700}}>SE</span>
        </div>
        <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,color:C.text,fontWeight:700}}>Sync Everyone</span>
      </div>
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:20,padding:"28px 22px",width:"100%",maxWidth:440,boxShadow:C.shadow2}}>
        {children}
      </div>
    </div>
  );

  if(mode==="login")return(
    <Shell>
      <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,color:C.text,margin:"0 0 4px",fontWeight:700}}>Welcome back</h2>
      <p style={{color:C.muted,fontSize:14,fontFamily:"'DM Sans',sans-serif",margin:"0 0 24px"}}>Sign in to your account</p>
      <div style={{display:"flex",flexDirection:"column",gap:16}}>
        <Field label="Email or Username" value={lf.id} onChange={v=>setLf(f=>({...f,id:v}))} placeholder="you@email.com" autoFocus/>
        <Field label="Password" type="password" value={lf.pw} onChange={v=>setLf(f=>({...f,pw:v}))} placeholder="••••••••"/>
        {lerr&&<p style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:C.red,margin:0}}>{lerr}</p>}
        <PBtn onClick={doLogin} loading={lload}>Sign In</PBtn>
        <button onClick={()=>setMode("register")} style={{background:"none",border:"none",color:C.muted,fontFamily:"'DM Sans',sans-serif",fontSize:14,cursor:"pointer"}}>
          Don't have an account? <span style={{color:C.accent,fontWeight:600}}>Create one</span>
        </button>
      </div>
    </Shell>
  );

  if(mode==="register")return(
    <Shell>
      <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,color:C.text,margin:"0 0 4px",fontWeight:700}}>Create account</h2>
      <p style={{color:C.muted,fontSize:14,fontFamily:"'DM Sans',sans-serif",margin:"0 0 20px"}}>Join Sync Everyone</p>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <Field label="Full Name" value={rf.name} onChange={v=>setRf(f=>({...f,name:v}))} placeholder="Your name" error={rerr.name}/>
        <Field label="Username" value={rf.handle} onChange={v=>setRf(f=>({...f,handle:v}))} placeholder="@username" error={rerr.handle}/>
        <Field label="Email" type="email" value={rf.email} onChange={v=>setRf(f=>({...f,email:v}))} placeholder="you@email.com" error={rerr.email}/>
        <Field label="Password" type="password" value={rf.pw} onChange={v=>setRf(f=>({...f,pw:v}))} placeholder="Min 6 chars" error={rerr.pw}/>
        <Field label="Confirm Password" type="password" value={rf.pw2} onChange={v=>setRf(f=>({...f,pw2:v}))} placeholder="Repeat password" error={rerr.pw2}/>
        <PBtn onClick={doRegister} loading={rload}>Continue →</PBtn>
        <button onClick={()=>setMode("login")} style={{background:"none",border:"none",color:C.muted,fontFamily:"'DM Sans',sans-serif",fontSize:14,cursor:"pointer"}}>← Back to login</button>
      </div>
    </Shell>
  );

  // Setup
  return(
    <Shell>
      <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,color:C.text,margin:"0 0 4px",fontWeight:700}}>Set up your profile</h2>
      <p style={{color:C.muted,fontSize:14,fontFamily:"'DM Sans',sans-serif",margin:"0 0 20px"}}>Optional — you can edit this later</p>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:16}}>
        <div onClick={()=>fileRef.current.click()} style={{width:90,height:90,borderRadius:"50%",border:`2px dashed ${setup.avatar?C.accent:C.border}`,background:setup.avatar?"transparent":C.card,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",overflow:"hidden"}}>
          {setup.avatar?<img src={setup.avatar} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
            :<div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3}}><span style={{fontSize:28}}>📷</span><span style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:C.muted}}>Add Photo</span></div>}
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>setSetup(s=>({...s,avatar:ev.target.result}));r.readAsDataURL(f);}}/>
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

/* ── FEED ────────────────────────────────────────────────── */
function FeedView({me,onProfile,showToast}){
  const [posts,setPosts]=useState([]);
  const [loading,setLoading]=useState(true);
  const [caption,setCaption]=useState("");
  const [emoji,setEmoji]=useState(null);
  const [img,setImg]=useState(null);
  const [imgFile,setImgFile]=useState(null);
  const [tagStr,setTagStr]=useState("");
  const [compose,setCompose]=useState(false);
  const [posting,setPosting]=useState(false);

  useEffect(()=>{ api.get("/posts/feed").then(({data})=>setPosts(data)).catch(()=>{}).finally(()=>setLoading(false)); },[]);

  const submitPost=async()=>{
    if(!caption.trim())return;setPosting(true);
    try{
      const fd=new FormData();
      fd.append("caption",caption.trim());
      if(emoji) fd.append("emoji",emoji);
      fd.append("tags",tagStr.trim());
      if(imgFile)fd.append("image",imgFile);
      const{data}=await api.post("/posts",fd);
      setPosts(p=>[data,...p]);
      setCaption("");setImg(null);setImgFile(null);setTagStr("");setEmoji(null);setCompose(false);
      showToast("Post shared! 🎉");
    }catch{showToast("Failed to post","error");}
    setPosting(false);
  };

  return(
    <div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch",background:C.bg}}>
      <div style={{padding:"12px 14px",borderBottom:`1px solid ${C.border}`,display:"flex",gap:10,alignItems:"center",background:C.surface}}>
        <Av user={me} size={38}/>
        <button onClick={()=>setCompose(v=>!v)} style={{flex:1,background:C.card,border:`1.5px solid ${C.border}`,borderRadius:22,padding:"11px 16px",color:C.muted,fontFamily:"'DM Sans',sans-serif",fontSize:14,cursor:"pointer",textAlign:"left"}}>
          What's on your mind?
        </button>
      </div>

      {compose&&(
        <div style={{margin:"12px 14px",background:C.surface,borderRadius:16,border:`1.5px solid ${C.accent}44`,padding:14,boxShadow:C.shadow}}>
          <textarea value={caption} onChange={e=>setCaption(e.target.value)} placeholder="Share something with everyone…"
            style={{width:"100%",background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 13px",color:C.text,fontFamily:"'DM Sans',sans-serif",fontSize:15,resize:"none",outline:"none",height:80,boxSizing:"border-box"}}/>
          {img&&(
            <div style={{marginTop:10,position:"relative",display:"inline-block"}}>
              <img src={img} alt="" style={{width:100,height:80,objectFit:"cover",borderRadius:8,border:`1px solid ${C.border}`}}/>
              <button onClick={()=>{setImg(null);setImgFile(null);}} style={{position:"absolute",top:-6,right:-6,width:20,height:20,borderRadius:"50%",background:C.red,border:"none",color:"white",fontSize:11,cursor:"pointer"}}>✕</button>
            </div>
          )}
          {/* Emoji picker - only one selected at a time */}
          <div style={{display:"flex",gap:6,flexWrap:"wrap",margin:"10px 0"}}>
            {EMOJIS.map(e=>(
              <button key={e} onClick={()=>setEmoji(prev=>prev===e?null:e)}
                style={{width:36,height:36,borderRadius:8,background:emoji===e?C.accentBg:C.card,border:`1.5px solid ${emoji===e?C.accent:C.border}`,fontSize:18,cursor:"pointer",transform:emoji===e?"scale(1.15)":"scale(1)",transition:"all .15s"}}>
                {e}
              </button>
            ))}
          </div>
          <input value={tagStr} onChange={e=>setTagStr(e.target.value)} placeholder="#add #tags"
            style={{width:"100%",background:C.card,border:`1px solid ${C.border}`,borderRadius:9,padding:"9px 12px",color:C.text,fontFamily:"'DM Sans',sans-serif",fontSize:14,outline:"none",boxSizing:"border-box",marginBottom:10}}/>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <label style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",color:C.muted,fontFamily:"'DM Sans',sans-serif",fontSize:14,padding:"8px 12px",background:C.card,borderRadius:8,border:`1px solid ${C.border}`}}>
              <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const f=e.target.files[0];if(!f)return;setImgFile(f);const r=new FileReader();r.onload=ev=>setImg(ev.target.result);r.readAsDataURL(f);}}/>
              📷 Photo
            </label>
            <div style={{flex:1}}/>
            <GBtn onClick={()=>setCompose(false)} small fullWidth={false}>Cancel</GBtn>
            <button onClick={submitPost} disabled={!caption.trim()||posting}
              style={{background:caption.trim()&&!posting?C.accent:C.dim,border:"none",borderRadius:9,padding:"9px 20px",color:"#fff",fontFamily:"'DM Sans',sans-serif",fontWeight:700,cursor:caption.trim()&&!posting?"pointer":"default",fontSize:14}}>
              {posting?"Posting…":"Share"}
            </button>
          </div>
        </div>
      )}

      {loading?<Spinner/>:posts.length===0?(
        <div style={{textAlign:"center",padding:"60px 20px",color:C.muted,fontFamily:"'DM Sans',sans-serif"}}>
          <div style={{fontSize:44,marginBottom:12}}>📭</div>
          <div style={{fontSize:16}}>No posts yet — be the first!</div>
          <button onClick={()=>setCompose(true)} style={{marginTop:16,background:C.accent,border:"none",borderRadius:12,padding:"12px 24px",color:"#fff",fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:15,cursor:"pointer"}}>Write a Post</button>
        </div>
      ):posts.map(post=>(
        <PostCard key={post.id} post={post} me={me} onProfile={onProfile}
          onUpdate={updated=>setPosts(p=>p.map(x=>x.id===updated.id?updated:x))}
          onDelete={id=>setPosts(p=>p.filter(x=>x.id!==id))}
          showToast={showToast}/>
      ))}
      <div style={{height:20}}/>
    </div>
  );
}

/* ── SEARCH ──────────────────────────────────────────────── */
function SearchView({me,onProfile}){
  const [q,setQ]=useState("");
  const [users,setUsers]=useState([]);
  const [loading,setLoad]=useState(true);
  useEffect(()=>{api.get("/users").then(({data})=>setUsers(data)).catch(()=>{}).finally(()=>setLoad(false));}, []);
  const filtered=q.trim()?users.filter(u=>(u.name||"").toLowerCase().includes(q.toLowerCase())||(u.handle||"").toLowerCase().includes(q.toLowerCase())):users;
  return(
    <div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch",background:C.bg}}>
      <div style={{padding:"14px 14px 10px",position:"sticky",top:0,background:C.bg,zIndex:10,borderBottom:`1px solid ${C.border}`}}>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="🔍  Search people…"
          style={{width:"100%",background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"12px 16px",color:C.text,fontFamily:"'DM Sans',sans-serif",fontSize:15,outline:"none",boxSizing:"border-box",boxShadow:C.shadow}}/>
      </div>
      {loading?<Spinner/>:(
        <div style={{padding:"4px 0"}}>
          {filtered.map(u=>(
            <div key={u.id} onClick={()=>onProfile(u)} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",cursor:"pointer",borderBottom:`1px solid ${C.border}`,background:C.surface,marginBottom:1}}>
              <Av user={u} size={48}/>
              <div style={{flex:1}}>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:15,color:C.text}}>{u.name}</div>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:C.muted}}>@{u.handle}</div>
                {u.bio&&<div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:C.muted,marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:220}}>{u.bio}</div>}
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

/* ── MESSAGES LIST ───────────────────────────────────────── */
function MsgListView({me,onOpen}){
  const [convs,setConvs]=useState([]);
  const [users,setUsers]=useState([]);
  const [loading,setLoad]=useState(true);
  const [showNew,setNew]=useState(false);
  useEffect(()=>{
    Promise.all([api.get("/messages"),api.get("/users")]).then(([c,u])=>{setConvs(c.data);setUsers(u.data);}).catch(()=>{}).finally(()=>setLoad(false));
  },[]);
  const startDirect=async userId=>{
    try{const{data}=await api.post(`/messages/direct/${userId}`);onOpen(data.id);}catch{}
  };
  return(
    <div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch",background:C.bg}}>
      <div style={{padding:"14px 16px 10px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",background:C.surface}}>
        <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:C.text,fontWeight:700}}>Messages</h2>
        <button onClick={()=>setNew(v=>!v)} style={{background:C.accentBg,border:`1px solid ${C.accent}44`,borderRadius:10,width:36,height:36,color:C.accent,cursor:"pointer",fontSize:20,display:"flex",alignItems:"center",justifyContent:"center"}}>✏️</button>
      </div>
      {showNew&&(
        <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:"12px 16px"}}>
          <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:12,color:C.muted,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.7px",fontWeight:600}}>Start new conversation</p>
          {users.filter(u=>u.id!==me.id).map(u=>(
            <div key={u.id} onClick={()=>{startDirect(u.id);setNew(false);}} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",cursor:"pointer",borderBottom:`1px solid ${C.border}`}}>
              <Av user={u} size={36}/><span style={{fontFamily:"'DM Sans',sans-serif",fontSize:15,color:C.text,flex:1}}>{u.name}</span>
              <span style={{color:C.muted,fontSize:14}}>@{u.handle}</span>
            </div>
          ))}
        </div>
      )}
      {loading?<Spinner/>:convs.length===0?(
        <div style={{textAlign:"center",padding:"50px 20px",color:C.muted,fontFamily:"'DM Sans',sans-serif"}}>
          <div style={{fontSize:40,marginBottom:10}}>💬</div><div>No conversations yet</div>
          <button onClick={()=>setNew(true)} style={{marginTop:16,background:C.accent,border:"none",borderRadius:12,padding:"10px 20px",color:"#fff",fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:14,cursor:"pointer"}}>Start a Chat</button>
        </div>
      ):convs.map(c=>{
        const other=c.members?.[0];
        return(
          <div key={c.id} onClick={()=>onOpen(c.id)} style={{padding:"14px 16px",cursor:"pointer",display:"flex",gap:12,alignItems:"center",borderBottom:`1px solid ${C.border}`,background:C.surface,marginBottom:1}}>
            {other?<Av user={other} size={50}/>:<div style={{width:50,height:50,borderRadius:"50%",background:C.card,border:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>👥</div>}
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

/* ── CHAT ────────────────────────────────────────────────── */
function ChatView({me,convId,onBack}){
  const [msgs,setMsgs]=useState([]);
  const [input,setInput]=useState("");
  const [sending,setSend]=useState(false);
  const [convInfo,setCI]=useState(null);
  const [recording,setRecording]=useState(false);
  const [mediaRec,setMediaRec]=useState(null);
  const bottomRef=useRef();
  const fileRef=useRef();

  useEffect(()=>{if(!convId)return;loadMsgs();},[convId]);
  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:"smooth"});},[msgs]);

  const loadMsgs=async()=>{
    try{
      const{data}=await api.get(`/messages/${convId}/messages`);
      setMsgs(data);
      const other=data.find(m=>m.user_id!==me.id);
      if(other)setCI({name:other.name,handle:other.handle,avatar_url:other.avatar_url,color:other.color});
    }catch{}
  };

  const send=async()=>{
    if(!input.trim()||sending)return;
    const text=input.trim();setInput("");setSend(true);
    try{const{data}=await api.post(`/messages/${convId}/messages`,{text});setMsgs(p=>[...p,data]);}
    catch{setInput(text);}
    setSend(false);
  };

  const sendMedia=async(file,type)=>{
    setSend(true);
    try{
      const fd=new FormData();
      fd.append("media",file);
      fd.append("type",type);
      const{data}=await api.post(`/messages/${convId}/messages/media`,fd);
      setMsgs(p=>[...p,data]);
    }catch{alert("Failed to send");}
    setSend(false);
  };

  const sendPhoto=e=>{const f=e.target.files[0];if(f)sendMedia(f,"image");};

  const startRec=async()=>{
    try{
      const stream=await navigator.mediaDevices.getUserMedia({audio:true});
      const mr=new MediaRecorder(stream);
      const chunks=[];
      mr.ondataavailable=e=>chunks.push(e.data);
      mr.onstop=()=>{
        const blob=new Blob(chunks,{type:"audio/webm"});
        stream.getTracks().forEach(t=>t.stop());
        sendMedia(new File([blob],"voice.webm",{type:"audio/webm"}),"audio");
      };
      mr.start();setMediaRec(mr);setRecording(true);
    }catch{alert("Microphone access denied");}
  };
  const stopRec=()=>{if(mediaRec){mediaRec.stop();setMediaRec(null);setRecording(false);}};

  const renderMsg=msg=>{
    if(msg.media_url){
      if(msg.media_type==="image")return<img src={msg.media_url} alt="" style={{maxWidth:"100%",borderRadius:12,display:"block"}}/>;
      if(msg.media_type==="audio")return<audio controls src={msg.media_url} style={{maxWidth:"100%"}}/>;
    }
    return msg.text;
  };

  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",background:C.bg}}>
      <div style={{padding:"12px 14px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:12,background:C.surface,boxShadow:C.shadow,flexShrink:0}}>
        <button onClick={onBack} style={{background:"none",border:"none",color:C.accent,cursor:"pointer",fontSize:24,padding:"0 8px 0 0",fontWeight:700}}>‹</button>
        {convInfo&&<Av user={convInfo} size={38}/>}
        <div>
          <div style={{fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:15,color:C.text}}>{convInfo?.name||"Chat"}</div>
        </div>
      </div>

      <div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch",padding:"14px",display:"flex",flexDirection:"column",gap:10}}>
        {msgs.length===0&&<div style={{textAlign:"center",padding:"40px 20px",color:C.muted,fontFamily:"'DM Sans',sans-serif",fontSize:14}}>No messages yet — say hello! 👋</div>}
        {msgs.map((msg,i)=>{
          const isMe=msg.user_id===me.id;
          return(
            <div key={msg.id||i} style={{display:"flex",flexDirection:isMe?"row-reverse":"row",gap:8,alignItems:"flex-end"}}>
              {!isMe&&<Av user={{name:msg.name,handle:msg.handle,avatar_url:msg.avatar_url,color:msg.color}} size={30}/>}
              <div style={{maxWidth:"72%",display:"flex",flexDirection:"column",alignItems:isMe?"flex-end":"flex-start"}}>
                <div style={{background:isMe?C.accent:C.surface,color:isMe?"#fff":C.text,padding:"10px 14px",borderRadius:isMe?"18px 18px 4px 18px":"18px 18px 18px 4px",fontFamily:"'DM Sans',sans-serif",fontSize:15,lineHeight:1.5,border:isMe?"none":`1px solid ${C.border}`,boxShadow:C.shadow}}>
                  {renderMsg(msg)}
                </div>
                <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:10,color:C.dim,marginTop:3}}>{timeAgo(msg.created_at)}</span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef}/>
      </div>

      <div style={{padding:"10px 12px",borderTop:`1px solid ${C.border}`,display:"flex",gap:6,alignItems:"center",background:C.surface,paddingBottom:"max(10px,env(safe-area-inset-bottom))"}}>
        {/* Photo button */}
        <label style={{width:38,height:38,borderRadius:"50%",background:C.card,border:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0,fontSize:18}}>
          <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={sendPhoto}/>
          📷
        </label>

        {/* Voice button */}
        <button onClick={recording?stopRec:startRec}
          style={{width:38,height:38,borderRadius:"50%",background:recording?"#c94e4e":C.card,border:`1px solid ${recording?C.red:C.border}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0,fontSize:18,transition:"all .2s"}}>
          {recording?"⏹️":"🎙️"}
        </button>

        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder={recording?"Recording…":"Type a message…"}
          disabled={recording}
          style={{flex:1,background:C.card,border:`1.5px solid ${C.border}`,borderRadius:22,padding:"11px 16px",color:C.text,fontFamily:"'DM Sans',sans-serif",fontSize:15,outline:"none"}}/>
        <button onClick={send} disabled={!input.trim()||sending||recording}
          style={{width:44,height:44,borderRadius:"50%",background:input.trim()&&!recording?C.accent:C.dim,border:"none",cursor:input.trim()&&!recording?"pointer":"default",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:"0 2px 8px rgba(196,125,30,0.35)"}}>
          ➤
        </button>
      </div>
    </div>
  );
}

/* ── POST FEED VIEWER (from profile) ────────────────────── */
function PostFeedViewer({posts,startIndex,me,onClose,showToast,onUpdate,onDelete}){
  const [idx,setIdx]=useState(startIndex||0);
  const current=posts[idx];
  return(
    <div style={{position:"fixed",inset:0,zIndex:500,background:C.bg,display:"flex",flexDirection:"column"}}>
      <div style={{padding:"12px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:12,background:C.surface}}>
        <button onClick={onClose} style={{background:"none",border:"none",color:C.accent,cursor:"pointer",fontSize:24,fontWeight:700}}>‹</button>
        <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:C.text,fontWeight:700}}>Posts</span>
        <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:C.muted,marginLeft:"auto"}}>{idx+1} / {posts.length}</span>
      </div>
      <div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch"}}>
        {current&&<PostCard post={current} me={me} onProfile={()=>{}}
          onUpdate={u=>{onUpdate&&onUpdate(u);}}
          onDelete={id=>{onDelete&&onDelete(id);if(idx>=posts.length-1)setIdx(Math.max(0,idx-1));}}
          showToast={showToast}/>}
        <div style={{display:"flex",justifyContent:"space-between",padding:"12px 16px"}}>
          <button onClick={()=>setIdx(i=>Math.max(0,i-1))} disabled={idx===0}
            style={{background:idx===0?C.card:C.accent,border:"none",borderRadius:10,padding:"10px 20px",color:idx===0?C.muted:"#fff",fontFamily:"'DM Sans',sans-serif",fontWeight:600,cursor:idx===0?"default":"pointer"}}>
            ← Prev
          </button>
          <button onClick={()=>setIdx(i=>Math.min(posts.length-1,i+1))} disabled={idx===posts.length-1}
            style={{background:idx===posts.length-1?C.card:C.accent,border:"none",borderRadius:10,padding:"10px 20px",color:idx===posts.length-1?C.muted:"#fff",fontFamily:"'DM Sans',sans-serif",fontWeight:600,cursor:idx===posts.length-1?"default":"pointer"}}>
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── PROFILE ─────────────────────────────────────────────── */
function ProfileView({me,setMe,viewUser,onBack,onProfile,onChat,showToast}){
  const isMe=!viewUser||viewUser.id===me.id||viewUser.handle===me.handle;
  const [user,setUser]=useState(isMe?me:null);
  const [posts,setPosts]=useState([]);
  const [loading,setLoad]=useState(true);
  const [editing,setEdit]=useState(false);
  const [draft,setDraft]=useState({name:"",bio:"",color:""});
  const [saving,setSave]=useState(false);
  const [following,setFol]=useState(false);
  const [viewerIdx,setViewer]=useState(null);
  const fileRef=useRef();

  useEffect(()=>{
    const uid=isMe?me.id:viewUser?.id;
    if(!uid){setLoad(false);return;}
    Promise.all([
      isMe?api.get("/auth/me"):api.get(`/users/${viewUser.handle||viewUser.id}`),
      api.get(`/posts/user/${uid}`)
    ]).then(([u,p])=>{setUser(u.data);setPosts(p.data);if(!isMe)setFol(u.data.is_following||false);})
    .catch(()=>{}).finally(()=>setLoad(false));
  },[isMe,me.id,viewUser]);

  const saveProfile=async()=>{
    setSave(true);
    try{const{data}=await api.put("/users/me/profile",draft);setUser(data);setMe(data);setEdit(false);showToast("Profile updated ✅");}
    catch{showToast("Update failed","error");}
    setSave(false);
  };
  const uploadAvatar=async file=>{
    const fd=new FormData();fd.append("avatar",file);
    try{const{data}=await api.post("/users/me/avatar",fd);setUser(data);setMe(data);showToast("Photo updated ✅");}
    catch{showToast("Upload failed","error");}
  };
  const toggleFollow=async()=>{
    try{const{data}=await api.post(`/users/${user.id}/follow`);setFol(data.following);setUser(u=>({...u,followers:data.following?u.followers+1:u.followers-1}));}catch{}
  };
  const startChat=async()=>{try{const{data}=await api.post(`/messages/direct/${user.id}`);onChat(data.id);}catch{}};
  const u=user||(isMe?me:viewUser);

  return(
    <div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch",background:C.bg}}>
      {viewerIdx!==null&&(
        <PostFeedViewer posts={posts} startIndex={viewerIdx} me={me}
          onClose={()=>setViewer(null)} showToast={showToast}
          onUpdate={updated=>setPosts(p=>p.map(x=>x.id===updated.id?updated:x))}
          onDelete={id=>setPosts(p=>p.filter(x=>x.id!==id))}/>
      )}

      {viewUser&&(
        <button onClick={onBack} style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",color:C.accent,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:15,padding:"12px 16px",fontWeight:600}}>
          ‹ Back
        </button>
      )}

      <div style={{height:100,background:`linear-gradient(135deg,${u?.color||C.accent}22,${C.card})`,marginBottom:-42,position:"relative"}}>
        <div style={{position:"absolute",inset:0,backgroundImage:`radial-gradient(circle at 30% 60%,${u?.color||C.accent}28 0%,transparent 70%)`}}/>
      </div>

      <div style={{padding:"0 16px 0"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",paddingBottom:14}}>
          <div style={{position:"relative"}}>
            <div style={{width:80,height:80,borderRadius:"50%",background:`${u?.color||C.accent}18`,border:`3px solid ${C.bg}`,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",flexShrink:0,boxShadow:C.shadow}}>
              {u?.avatar_url?<img src={u.avatar_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                :<span style={{fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:26,color:u?.color||C.accent}}>{mkInitials(u?.name||"?")}</span>}
            </div>
            {isMe&&(
              <>
                <button onClick={()=>fileRef.current.click()} style={{position:"absolute",bottom:0,right:0,width:24,height:24,borderRadius:"50%",background:C.accent,border:`2px solid ${C.bg}`,cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff"}}>✏️</button>
                <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>{if(e.target.files[0])uploadAvatar(e.target.files[0]);}}/>
              </>
            )}
          </div>
          {isMe?(
            editing
              ?<div style={{display:"flex",gap:8}}>
                <GBtn onClick={()=>setEdit(false)} small fullWidth={false}>Cancel</GBtn>
                <button onClick={saveProfile} disabled={saving} style={{background:C.accent,border:"none",borderRadius:10,padding:"9px 18px",color:"#fff",fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:13,cursor:"pointer"}}>{saving?"Saving…":"Save"}</button>
               </div>
              :<button onClick={()=>{setDraft({name:u?.name||"",bio:u?.bio||"",color:u?.color||AVATAR_COLORS[0]});setEdit(true);}} style={{background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"9px 16px",color:C.text,fontFamily:"'DM Sans',sans-serif",fontSize:14,cursor:"pointer",boxShadow:C.shadow}}>✏️ Edit Profile</button>
          ):(
            <div style={{display:"flex",gap:8}}>
              <button onClick={startChat} style={{background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"9px 14px",color:C.text,fontFamily:"'DM Sans',sans-serif",fontSize:14,cursor:"pointer"}}>💬 Message</button>
              <button onClick={toggleFollow} style={{background:following?C.surface:C.accent,border:`1.5px solid ${following?C.border:C.accent}`,borderRadius:10,padding:"9px 16px",color:following?C.muted:"#fff",fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:14,cursor:"pointer"}}>{following?"Following":"Follow"}</button>
            </div>
          )}
        </div>

        {editing?(
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
        ):(
          <div style={{paddingBottom:16,borderBottom:`1px solid ${C.border}`}}>
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:C.text,margin:"0 0 2px",fontWeight:700}}>{u?.name}</h2>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,color:C.muted,marginBottom:8}}>@{u?.handle}</div>
            {u?.bio&&<p style={{fontFamily:"'DM Sans',sans-serif",fontSize:14,color:C.text,margin:"0 0 14px",lineHeight:1.6}}>{u.bio}</p>}
            {loading?<Spinner/>:(
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
          <button style={{flex:1,background:"none",border:"none",borderBottom:`2px solid ${C.accent}`,padding:"12px 0",fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:13,color:C.accent,cursor:"pointer"}}>Posts</button>
        </div>
      </div>

      {/* Posts grid — click opens feed viewer */}
      <div style={{padding:"10px 14px 40px"}}>
        {loading?<Spinner/>:posts.length>0?(
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:3}}>
            {posts.map((p,i)=>(
              <div key={p.id} onClick={()=>setViewer(i)}
                style={{aspectRatio:"1",background:`linear-gradient(135deg,${u?.color||C.accent}12,${C.card})`,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",cursor:"pointer",borderRadius:4,position:"relative"}}>
                {p.image_url
                  ?<img src={p.image_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                  :<span style={{fontSize:36}}>{p.emoji}</span>}
              </div>
            ))}
          </div>
        ):(
          <div style={{textAlign:"center",padding:"50px 20px",color:C.muted,fontFamily:"'DM Sans',sans-serif"}}>
            <div style={{fontSize:32,marginBottom:8}}>📷</div>
            <div>{isMe?"Share your first post!":"Nothing posted yet"}</div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── MAIN APP ────────────────────────────────────────────── */
export default function App(){
  const [me,setMe]=useState(null);
  const [loading,setLoading]=useState(true);
  const [tab,setTab]=useState("feed");
  const [viewUser,setViewUser]=useState(null);
  const [activeChatId,setActiveChatId]=useState(null);
  const [toast,setToast]=useState({msg:"",type:"success"});

  const showToast=(msg,type="success")=>{setToast({msg,type});setTimeout(()=>setToast({msg:"",type:"success"}),2500);};

  useEffect(()=>{
    const token=localStorage.getItem("se_token");
    if(!token){setLoading(false);return;}
    api.get("/auth/me").then(({data})=>setMe(data)).catch(()=>localStorage.removeItem("se_token")).finally(()=>setLoading(false));
  },[]);

  if(loading)return(
    <>
      <style>{FONTS}</style>
      <div style={{height:"100dvh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div style={{textAlign:"center"}}>
          <div style={{width:50,height:50,borderRadius:14,background:C.accent,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",boxShadow:"0 4px 16px rgba(196,125,30,0.35)"}}>
            <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:"#fff",fontWeight:700}}>SE</span>
          </div>
          <Spinner/>
        </div>
      </div>
    </>
  );
  if(!me)return(
    <>
      <style>{FONTS}</style>
      <style>{`*{box-sizing:border-box;margin:0;padding:0;}body{background:${C.bg};}input,textarea{caret-color:${C.accent};}input::placeholder,textarea::placeholder{color:${C.dim};}`}</style>
      <AuthScreen onLogin={u=>{setMe(u);setTab("feed");}}/>
    </>
  );

  const gotoProfile=u=>{setViewUser(u);setTab("profile");};
  const gotoChat=id=>{setActiveChatId(id);setTab("chat");};
  const logout=()=>{localStorage.removeItem("se_token");setMe(null);};

  return(
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
      <div style={{display:"flex",flexDirection:"column",height:"100dvh",background:C.bg,maxWidth:600,margin:"0 auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 16px",borderBottom:`1px solid ${C.border}`,background:C.surface,boxShadow:C.shadow,flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:36,height:36,borderRadius:10,background:C.accent,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 2px 8px rgba(196,125,30,0.35)"}}>
              <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:17,color:"#fff",fontWeight:700}}>SE</span>
            </div>
            <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:19,color:C.text,fontWeight:700}}>Sync Everyone</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <button onClick={()=>{setViewUser(null);setTab("profile");}} style={{background:"none",border:"none",cursor:"pointer",padding:0}}>
              <Av user={me} size={34} ring={tab==="profile"&&!viewUser}/>
            </button>
            <button onClick={logout} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"6px 10px",color:C.muted,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:13}}>Sign out</button>
          </div>
        </div>

        <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
          {tab==="feed"    &&<FeedView    me={me} onProfile={gotoProfile} showToast={showToast}/>}
          {tab==="search"  &&<SearchView  me={me} onProfile={gotoProfile}/>}
          {tab==="messages"&&<MsgListView me={me} onOpen={gotoChat}/>}
          {tab==="chat"    &&<ChatView    me={me} convId={activeChatId} onBack={()=>setTab("messages")}/>}
          {tab==="profile" &&<ProfileView me={me} setMe={setMe} viewUser={viewUser} onBack={()=>{setViewUser(null);setTab("feed");}} onProfile={gotoProfile} onChat={id=>{setActiveChatId(id);setTab("chat");}} showToast={showToast}/>}
        </div>

        <div style={{display:"flex",borderTop:`1px solid ${C.border}`,background:C.surface,flexShrink:0,paddingBottom:"env(safe-area-inset-bottom)"}}>
          {[{id:"feed",emoji:"🏠",label:"Home"},{id:"search",emoji:"🔍",label:"Search"},{id:"messages",emoji:"💬",label:"Chat"},{id:"profile",emoji:"👤",label:"Profile"}].map(item=>{
            const active=tab===item.id||(item.id==="messages"&&tab==="chat");
            return(
              <button key={item.id} onClick={()=>{setTab(item.id);if(item.id!=="profile")setViewUser(null);}} style={{
                flex:1,padding:"10px 0 8px",background:"none",border:"none",cursor:"pointer",
                display:"flex",flexDirection:"column",alignItems:"center",gap:3,
                borderTop:`2.5px solid ${active?C.accent:"transparent"}`}}>
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
