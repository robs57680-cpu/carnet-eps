// Carnet d'entraînement EPS : application (élève, prof, développeur)
import * as fb from "./fb.js";
import { DEV_EMAIL, STUDENT_DOMAIN } from "./config.js";

/* ---------- Référentiel (paramètres par défaut, modifiables dans l'onglet Prof) ---------- */
const DEF_SETTINGS={tol:5,themes:{
  technique:{label:"Technique",desc:"Tonification et amélioration des mouvements",reps:[8,15],pct:[40,60]},
  cardio:{label:"Cardiovasculaire",desc:"Capacités cardio et endurance de force",reps:[15,30],pct:[30,50]},
  force:{label:"Puissance / Force",desc:"Force et VO2max",reps:[3,6],pct:[70,90]}}};
const RX={1:1,2:2,3:3,4:5};
const FACE={1:"🙁",2:"😐",3:"🙂",4:"😄"};
const REPART={"2-6":[2,6],"4-4":[4,4],"6-2":[6,2]};
const AFL3_LABELS={1:"Le spectateur",2:"L'animateur sportif",3:"Le coach sportif",4:"Le prof"};
const AFL2_LABELS={1:"Insuffisant",2:"Partiel",3:"Adapté",4:"Optimal"};
const CRITERES={
 afl2:{titre:"AFL2 · S'entraîner : échauffement et analyse",items:{
  1:["Échauffement inexistant ou inadapté à la pratique.","Carnet d'entraînement absent ou avec trop peu d'informations pour permettre une progression."],
  2:["Échauffement partiellement adapté : il ne permet pas d'être prêt pour la suite de l'entraînement.","Carnet partiellement rempli : informations inexactes ou trop peu précises pour une bonne utilisation."],
  3:["Échauffement adapté et cohérent pour la pratique.","Carnet complet mais analyse manquant de précision, ce qui pénalise la conception des séances suivantes."],
  4:["Échauffement adapté et cohérent pour la pratique.","Carnet complet permettant une conception optimale et une progression au fil des séances."]}},
 afl3:{titre:"AFL3 · Coopérer : partenaire, juge et coach",items:{
  1:["J'agis seul et pour moi-même, ou j'interagis dangereusement avec mes partenaires.","Je suis placé loin de mon partenaire, pas concerné, je manque parfois de respect (je discute, je reste assis). La sécurité n'est pas assurée.","Je ne sais pas dire le nombre de répétitions ou de séries, le placement de la respiration, les trajets moteurs.","Mon évaluation est aléatoire ou absente, je ne repère pas les freins à la réussite.","Pas de conseils ou des conseils inadaptés, quelques encouragements sans penser à la sécurité (« vas-y tu vas battre mon record »). Non fiable."],
  2:["Je collabore avec mon partenaire sur l'organisation, ponctuellement ou de manière inadaptée.","Je suis placé près de mon partenaire mais inactif, je reste souvent à la même place.","Je perds parfois des informations (répétitions, respiration…) faute d'attention continue. Des erreurs, des vérifications nécessaires.","Mon évaluation de mon camarade est erronée, sans lien avec les thèmes. Je repère peu les freins à la réussite.","Impliqué mais conseils génériques, plutôt des encouragements (« c'est bien », « allez, encore deux répétitions »). Hésitant."],
  3:["Je suis disponible et réactif pour observer et aider mon partenaire à partir d'indicateurs simples.","Je suis placé près de mon partenaire et actif la plupart du temps.","J'indique le nombre de séries, de répétitions, le temps de récupération. Je repère un trajet moteur, une respiration, un placement non conforme ou dangereux.","Mon évaluation se rapproche de celle de l'enseignant mais n'est pas assez reliée aux thèmes d'entraînement. Je repère certains problèmes.","Conseils globalement justes selon l'analyse de la prestation (ressentis) et de quelques paramètres. Assez fiable."],
  4:["Je conseille mon partenaire à partir d'indicateurs précis et pertinents (je relie les données et ce que j'observe).","Je suis placé près de mon partenaire, actif, et je me déplace pour relever les indicateurs et vérifier qu'il n'y a pas de danger. Recueil de données fiable.","Attentif et impliqué : j'évalue mon camarade et je remarque les mêmes éléments que l'enseignant.","J'explique et j'exploite cette évaluation pour guider mon camarade.","Sûr, conseils adaptés, j'anticipe la sécurité, je suis réactif."]}}};
const WU_CATS={cardio:"Mise en route cardio",mobilite:"Mobilité articulaire",activation:"Activation / gainage",specifique:"Spécifique au WOD"};
const TYPES={haltero:"Haltérophilie",gym:"Gymnique / PDC",cardio:"Cardio (rameur…)"};
const PARAMS={charge:"Charge",reps:"Répétitions",exercice:"Exercice",repos:"Repos / rythme"};

/* ---------- Utilitaires ---------- */
const $=s=>document.querySelector(s);
const esc=v=>String(v??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const clone=o=>JSON.parse(JSON.stringify(o));
const uid=()=>Math.random().toString(36).slice(2,9);
function load(k){try{const v=localStorage.getItem(k);return v?JSON.parse(v):null}catch(e){return null}}
function store(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}}
function parseT(v){if(v===undefined||v===null)return NaN;v=String(v).trim().replace(",",".");if(!v)return NaN;
  if(v.includes(":")){const[a,b]=v.split(":");const m=+a,s=+b;return a===""||b===""||isNaN(m)||isNaN(s)||s>=60?NaN:m*60+s}
  if(/^\d+([.]\d+)?$/.test(v))return +v;return NaN}
function fmtT(s){if(s===null||s===undefined||isNaN(s))return"–";s=Math.round(s);return Math.floor(s/60)+":"+String(s%60).padStart(2,"0")}
function fmtP(s){if(s===null||s===undefined||isNaN(s))return"–";const t=Math.round(s*10)/10,m=Math.floor(t/60),r=t-m*60;return m+":"+(r<10?"0":"")+r.toFixed(1).replace(".",",")}
const num=v=>v===""||v===null||v===undefined?NaN:+String(v).replace(",",".");
const fmtN=n=>(Math.round(n*10)/10).toString().replace(".",",");
const norm=s=>String(s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/\s+/g," ").trim();
function setPath(o,p,v){const ks=p.split(".");let a=o;for(let i=0;i<ks.length-1;i++){if(a[ks[i]]==null)a[ks[i]]={};a=a[ks[i]]}a[ks[ks.length-1]]=v}
function toast(msg){const t=$("#toast");t.textContent=msg;t.hidden=false;clearTimeout(toast._t);toast._t=setTimeout(()=>t.hidden=true,2600)}
const today=()=>new Date().toISOString().slice(0,10);
const fmtDate=d=>{if(!d)return"Sans date";const[y,m,j]=d.split("-");return`${j}/${m}/${y}`};
const stamp=(d,sm)=>d?`<span class="stamp d${d}${sm?" sm":""}" title="Degré ${d}" aria-label="Degré ${d}">${FACE[d]}</span>`:`<span class="stamp d0${sm?" sm":""}" title="À compléter">?</span>`;

/* ---------- Modèle ---------- */
function blankTour(){return{passage:null,noRep:0,adapt:null}}
function blankSeance(theme){return{id:uid(),ordre:Date.now(),date:today(),theme:theme||"cardio",epreuve:false,valide:false,
  echauffement:{exos:[{nom:"",duree:"",cat:"cardio"}],pret:""},
  wod:{nbTours:4,tempsTour:"",exos:[{nom:"",type:"haltero",reps:"",charge:""},{nom:"",type:"gym",reps:"",charge:"",niveau:""},{nom:"",type:"cardio",reps:"",charge:"",niveau:""}]},
  real:{tours:[],ressentiCharge:"",rpe:""},analyse:{reussite:"",difficulte:"",regulation:""},autoeval:{afl2:null,afl3:null}}}
function blankProfil(){return{projet:"",repartition:"4-4",rms:[{nom:"",kg:""}]}}

/* ---------- Chrono ---------- */
const chrono={run:false,start:0,acc:0};
const elapsed=()=>(chrono.acc+(chrono.run?Date.now()-chrono.start:0))/1000;
function fmtC(s){const t=Math.floor(s*10)/10,m=Math.floor(t/60),r=t-m*60;return String(m).padStart(2,"0")+":"+(r<10?"0":"")+r.toFixed(1).replace(".",",")}
setInterval(()=>{const el=$("#chrono-v");if(el)el.textContent=fmtC(elapsed())},100);

/* ---------- Correction automatique ---------- */
function rmFor(p,name){const r=(p.rms||[]).find(r=>r.nom&&norm(r.nom)===norm(name));return r&&num(r.kg)>0?num(r.kg):NaN}
function nT(s){return Math.max(0,Math.min(12,parseInt(s.wod.nbTours)||0))}
function syncTours(s){const n=nT(s);s.real.tours=s.real.tours||[];while(s.real.tours.length<n)s.real.tours.push(blankTour())}
function durations(s){const n=nT(s),T=(s.real.tours||[]).slice(0,n);return T.map((t,i)=>{const p=num(t.passage),q=i?num(T[i-1].passage):0;return p>0&&(i===0||q>0)?p-q:NaN})}
function tourDeg(d,prev,tol){if(isNaN(d)||isNaN(prev))return null;const e=Math.abs(d-prev);return e<=tol?4:e<=2*tol?3:e<=3*tol?2:1}
const adCount=a=>!a?0:(a.params&&a.params.length)||(a.texte&&a.texte.trim()?1:0);
function exoCheck(e,th,p){
  if(e.type==="cardio")return{ok:true,why:"Cardio : volume libre"};
  const r=num(e.reps);if(!(r>0))return{ok:null,why:"Répétitions manquantes"};
  let pct=null;
  if(e.type==="haltero"){const c=num(e.charge),rm=rmFor(p,e.nom);
    if(!(c>0))return{ok:null,why:"Charge manquante"};
    if(!(rm>0))return{ok:null,why:`1RM de « ${e.nom} » absent du profil`};pct=Math.round(c/rm*100)}
  if(r<th.reps[0]||r>th.reps[1])return{ok:false,pct,why:`${r} rép. hors repère ${th.reps[0]}–${th.reps[1]}`};
  if(pct!==null&&(pct<th.pct[0]||pct>th.pct[1]))return{ok:false,pct,why:`${pct} % du 1RM hors repère ${th.pct[0]}–${th.pct[1]} %`};
  return{ok:true,pct,why:pct!==null?`${r} rép. à ${pct} % du 1RM`:`${r} rép.`}}
function correct(s,p,st){
  const th=st.themes[s.theme]||st.themes.cardio,tol=num(st.tol)||5;
  const n=nT(s),prev=parseT(s.wod.tempsTour),T=(s.real.tours||[]).slice(0,n),D=durations(s);
  const done=T.filter(t=>num(t.passage)>0).length,term=n>0&&done===n;
  const C=[];const add=(dom,key,label,deg,msg,tip)=>C.push({dom,key,label,deg,rx:deg?RX[deg]:0,msg,tip:deg?tip:""});
  const filled=D.filter(d=>!isNaN(d)),inTime=D.filter(d=>!isNaN(d)&&Math.abs(d-prev)<=tol).length;
  const late=filled.filter(d=>d-prev>tol).length,early=filled.filter(d=>prev-d>tol).length;
  const repTip=late>=early?"Tu dépasses le temps prévu : enlève 1 à 3 répétitions sur l'exercice le plus long.":"Tu finis en avance : ajoute 1 à 3 répétitions pour utiliser tout le temps prévu.";
  // Charge
  const halt=s.wod.exos.find(e=>e.type==="haltero"&&e.nom);
  if(!halt)add("Concevoir","charge","Charge d'entraînement",null,"Ajoute un exercice d'haltérophilie à ton WOD.");
  else if(!done)add("Concevoir","charge","Charge d'entraînement",null,"Enregistre tes temps de passage.");
  else if(!term)add("Concevoir","charge","Charge d'entraînement",1,`WOD non terminé (${done}/${n} tours) : la charge ne t'a pas permis d'aller au bout.`,"Baisse la charge de l'haltéro d'environ 10 %.");
  else if(s.real.ressentiCharge==="legere")add("Concevoir","charge","Charge d'entraînement",1,"Charge jugée trop légère pour ton thème.","Augmente la charge de 2,5 à 5 kg.");
  else{const f=D.findIndex(d=>!isNaN(d)&&d-prev>tol);
    if(f<0)add("Concevoir","charge","Charge d'entraînement",4,"Charge adaptée : rythme tenu jusqu'au dernier tour.","Garde cette charge, ou teste +2,5 kg si l'effort te paraît facile.");
    else if(f>=n-2)add("Concevoir","charge","Charge d'entraînement",3,`Tu perds le rythme sur les 2 derniers tours (dès le tour ${f+1}).`,"Baisse légèrement la charge de l'haltéro (−2,5 kg).");
    else if(f>=Math.floor(n/2))add("Concevoir","charge","Charge d'entraînement",2,`Rythme perdu à partir de la moitié du WOD (tour ${f+1}).`,"Baisse la charge de l'haltéro d'environ 10 %.");
    else add("Concevoir","charge","Charge d'entraînement",1,`Rythme perdu dès le début (tour ${f+1}) : charge inadaptée.`,"Baisse nettement la charge (−15 à −20 %).")}
  // Répétitions
  if(!n||isNaN(prev))add("Concevoir","reps","Nombre de répétitions",null,"Renseigne le nombre de tours et le temps prévu par tour.");
  else if(!filled.length)add("Concevoir","reps","Nombre de répétitions",null,"Enregistre tes temps de passage.");
  else{const fr=inTime/n,d=fr>=1&&term?4:fr>=2/3?3:fr>=1/2?2:1;
    add("Concevoir","reps","Nombre de répétitions",d,`${inTime} tour${inTime>1?"s":""} sur ${n} dans le temps prévu (± ${tol} s).`,d===4?"Répétitions bien dosées : garde ce volume.":repTip)}
  // Thème
  const named=s.wod.exos.filter(e=>e.nom),checks=named.slice(0,3).map(e=>({e,r:exoCheck(e,th,p)}));
  if(named.length<3)add("Concevoir","theme","Thème d'entraînement",null,"Conçois 3 exercices.");
  else if(checks.some(x=>x.r.ok===null))add("Concevoir","theme","Thème d'entraînement",null,checks.find(x=>x.r.ok===null).r.why+".");
  else{const bad=checks.filter(x=>!x.r.ok),d=[4,3,2,1][bad.length];
    add("Concevoir","theme","Thème d'entraînement",d,bad.length?`Inadapté au thème ${th.label} : `+bad.map(x=>`${x.e.nom} (${x.r.why})`).join(" ; ")+".":`Les 3 exercices respectent les repères du thème ${th.label}.`,
      bad.length?`Repères ${th.label} : ${th.reps[0]} à ${th.reps[1]} répétitions, haltéro à ${th.pct[0]}–${th.pct[1]} % du 1RM.`:"")}
  // Adaptation
  const pa=T.reduce((a,t)=>a+adCount(t.adapt),0);
  if(!done)add("Concevoir","adapt","Adaptation",null,"Réalise ton WOD.");
  else{const d=pa<=0?4:pa===1?3:pa===2?2:1;add("Concevoir","adapt","Adaptation",d,pa<=0?"Aucune adaptation nécessaire pendant le WOD.":`${pa} paramètre${pa>1?"s":""} modifié${pa>1?"s":""} pendant le WOD.`,pa>0?"Intègre ces changements dans la conception de ta prochaine séance.":"")}
  // Gestuelle
  const nr=T.reduce((a,t)=>a+(num(t.noRep)||0),0);
  if(!done)add("Réaliser","gest","Gestuelle technique",null,"Réalise ton WOD avec un juge qui compte les NO REP.");
  else{const d=nr<=2?4:nr<=4?3:nr<=6?2:1;add("Réaliser","gest","Gestuelle technique",d,`${nr} NO REP sur l'ensemble du WOD.`,d<4?"Ralentis sur l'exercice qui cause les NO REP et demande à ton juge pourquoi.":"")}
  // Décalage
  if(!n||isNaN(prev)||!filled.length)add("Réaliser","decal","Décalage avec le temps prévu",null,"Enregistre tes temps de passage.");
  else{const off=n-inTime,d=off===0?4:off===1?3:off<=3?2:1;
    add("Réaliser","decal","Décalage avec le temps prévu",d,off===0?`Tous les tours à ± ${tol} s du temps prévu.`:`${off} tour${off>1?"s":""} décalé${off>1?"s":""} de plus de ${tol} s.`,off?repTip:"")}
  const rx=C.reduce((a,c)=>a+c.rx,0);
  return{C,rx,note:rx<6?0:Math.min(12,(rx-5)*0.5),complete:C.every(c=>c.deg),checks,nr,pa,inTime,n,done,D,prev,tol,th}}
const crit=(r,k)=>r.C.find(c=>c.key===k);

/* AFL2 : échauffement + qualité du carnet */
function wuEval(s){const ex=(s.echauffement.exos||[]).filter(e=>e.nom);const dur=ex.reduce((a,e)=>a+(num(e.duree)||0),0);
  const cats=new Set(ex.map(e=>e.cat)),spe=cats.has("specifique");let d,msg;
  if(!ex.length||dur<4){d=1;msg="Échauffement absent ou trop court."}
  else if(!spe||cats.size<2||dur<8){d=2;msg=!spe?"Il manque une partie spécifique (mouvements du WOD à vide ou en charge légère).":dur<8?`Échauffement trop court (${fmtN(dur)} min, vise 8 min ou plus).`:"Varie les contenus : cardio, mobilité, activation, spécifique."}
  else if(cats.size===4&&dur>=10&&s.echauffement.pret==="oui"){d=4;msg=`Rituel complet (${fmtN(dur)} min, 4 contenus) et tu te sens prêt·e.`}
  else{d=3;msg=`Échauffement adapté (${fmtN(dur)} min).`+(cats.size<4?" Ajoute : "+Object.keys(WU_CATS).filter(k=>!cats.has(k)).map(k=>WU_CATS[k].toLowerCase()).join(", ")+".":dur<10?" Vise 10 min.":" Indique si tu te sens prêt·e.")}
  return{d,dur,msg}}
function analyseEval(s){const a=s.analyse,hints=[];let sc=0;
  if((a.reussite||"").trim().length>=15)sc++;else hints.push("décris ce qui a fonctionné");
  if((a.difficulte||"").trim().length>=15)sc++;else hints.push("explique ta difficulté principale");
  const r=(a.regulation||"").toLowerCase();
  if(/\d/.test(r)&&/(kg|charge|r[ée]p|temps|tour|sec|\bs\b|r[ée]cup|repos|exercice|calorie)/.test(r))sc++;else hints.push("chiffre ta régulation (ex. : passer de 20 à 25 kg)");
  return{score:sc/3,d:sc===3?4:sc===2?3:sc===1?2:1,hints}}
function completeness(s,p){const w=s.wod,n=nT(s),T=(s.real.tours||[]).slice(0,n);
  const checks=[(s.echauffement.exos||[]).some(e=>e.nom&&e.duree),!!s.echauffement.pret,n>0,!isNaN(parseT(w.tempsTour)),
    w.exos.filter(e=>e.nom&&e.reps).length>=3,w.exos.filter(e=>e.type==="haltero"&&e.nom).every(e=>e.charge&&rmFor(p,e.nom)>0),
    T.some(t=>num(t.passage)>0),!!s.real.ressentiCharge,!!s.real.rpe,!!(s.analyse.reussite||"").trim(),!!(s.analyse.difficulte||"").trim(),!!(s.analyse.regulation||"").trim()];
  return checks.filter(Boolean).length/checks.length}
function afl2(c){const ss=c.seances.filter(s=>s.valide);const max=REPART[c.profil.repartition||"4-4"][0];
  if(!ss.length)return{deg:0,pts:0,max,wu:0,carnet:0,comp:0,ana:0,n:0};
  const wu=Math.round(ss.reduce((a,s)=>a+wuEval(s).d,0)/ss.length);
  const comp=ss.reduce((a,s)=>a+completeness(s,c.profil),0)/ss.length,ana=ss.reduce((a,s)=>a+analyseEval(s).score,0)/ss.length;
  const carnet=comp>=.95&&ana>=.8&&ss.length>=3?4:comp>=.85?3:comp>=.5?2:1;
  const deg=Math.floor((wu+carnet)/2);return{deg,pts:max*deg/4,max,wu,carnet,comp,ana,n:ss.length}}
function lvlPts(c,afl,d){const m=REPART[c.profil.repartition||"4-4"][afl==="afl2"?0:1];return d?m*d/4:0}
function afl2Estime(s,p){const w=wuEval(s).d,comp=completeness(s,p),an=analyseEval(s).score;const c=comp>=.95&&an>=.99?4:comp>=.85?3:comp>=.5?2:1;return Math.floor((w+c)/2)}
function note20(s,c,st){const r=correct(s,c.profil,st),ae=s.autoeval||{};return{r,a2:lvlPts(c,"afl2",ae.afl2),a3:lvlPts(c,"afl3",ae.afl3),tot:r.note+lvlPts(c,"afl2",ae.afl2)+lvlPts(c,"afl3",ae.afl3),ok:!!(ae.afl2&&ae.afl3)}}
function afl1Final(c,st){const v=c.seances.filter(s=>s.valide),ep=v.filter(s=>s.epreuve);const s=ep.length?ep[ep.length-1]:v[v.length-1];
  if(!s)return null;return{...correct(s,c.profil,st),epreuve:!!ep.length,seance:s}}
function missing(s,p){const m=[],n=nT(s),T=(s.real.tours||[]).slice(0,n),done=T.filter(t=>num(t.passage)>0).length;
  if(!(s.echauffement.exos||[]).some(e=>e.nom&&e.duree))m.push("Ton échauffement");
  if(!n||isNaN(parseT(s.wod.tempsTour)))m.push("Le nombre de tours et le temps prévu par tour");
  if(s.wod.exos.filter(e=>e.nom&&e.reps).length<3)m.push("Les 3 exercices du WOD avec leurs répétitions");
  s.wod.exos.filter(e=>e.type==="haltero"&&e.nom).forEach(e=>{if(!num(e.charge))m.push(`La charge de « ${e.nom} »`);if(!(rmFor(p,e.nom)>0))m.push(`Le 1RM de « ${e.nom} » dans ton profil`)});
  if(done<n)m.push(`Les temps de passage (${done}/${n} tours) : si tu n'as pas terminé le WOD, valide quand même`);
  if(!s.real.ressentiCharge)m.push("Ton ressenti sur la charge");
  if(!(s.analyse.reussite||"").trim()||!(s.analyse.difficulte||"").trim()||!(s.analyse.regulation||"").trim())m.push("Ton analyse de séance");
  const ae=s.autoeval||{};if(!ae.afl2||!ae.afl3)m.push("Ton autoévaluation AFL2 et AFL3");
  return m}


/* ---------- Rendu ---------- */
const fld=(label,k,val,attrs="")=>`<label class="f">${label}<input id="f-${k.replace(/\./g,"-")}" data-k="${k}" value="${esc(val)}" ${attrs}></label>`;
function exBanner(){return""}
function vProfil(){const p=data.profil;
  const rms=p.rms.map((r,i)=>`<div class="rm">${fld(i?"":"Exercice",`profil.rms.${i}.nom`,r.nom,'placeholder="ex. Back squat" list="dl-ex"')}${fld(i?"":"1RM (kg)",`profil.rms.${i}.kg`,r.kg,'inputmode="decimal"')}${RO?"<span></span>":`<button class="btn ghost small" data-act="delRm" data-i="${i}" aria-label="Retirer ce 1RM">Retirer</button>`}</div>`).join("");
  return`<div class="stack"><fieldset class="lock" ${RO?"disabled":""}><legend class="sr">Profil</legend><div class="stack">
  <section class="card"><div class="sec-h"><h2>${RO?"Profil de l'élève":"Mon profil"}</h2><span class="spacer"></span><span class="chip">${esc(RO?(carnetDoc&&carnetDoc._login)||"":me.login||"")}</span></div>
    <label class="f">Mon projet personnel : ce que je veux développer<textarea id="f-projet" data-k="profil.projet">${esc(p.projet)}</textarea></label></section>
  <section class="card"><div class="sec-h"><h2>Mes 1RM</h2><span class="hint">Charge maximale sur 1 répétition</span></div>
    <div class="stack" style="gap:8px">${rms}</div>
    ${RO?"":`<div class="row" style="margin-top:10px"><button class="btn small" data-act="addRm">+ Ajouter un 1RM</button></div>`}
    <p class="hint" style="margin:8px 0 0">L'appli s'en sert pour calculer le % de charge de tes exercices d'haltérophilie. Écris le nom de l'exercice comme dans ton WOD.</p></section>
  <section class="card"><div class="sec-h"><h2>Répartition AFL2 / AFL3</h2><span class="hint">8 points à répartir</span></div>
    <div class="rep-opts">${Object.entries(REPART).map(([k,[a,b]])=>`<label class="rep-opt"><input type="radio" name="rep" data-k="profil.repartition" data-rerender value="${k}" ${p.repartition===k?"checked":""}><span>${a} / ${b}</span>AFL2 / AFL3</label>`).join("")}</div>
    <p class="hint" style="margin:8px 0 0">AFL2 : échauffement et analyse dans ce carnet. AFL3 : rôles de partenaire, juge et coach, évalués par ton enseignant.</p></section>
  </div></fieldset>${datalist()}</div>`}
function datalist(){const names=new Set();data.profil.rms.forEach(r=>r.nom&&names.add(r.nom));data.seances.forEach(s=>s.wod.exos.forEach(e=>e.nom&&names.add(e.nom)));
  ["Thrusters","Back squat","Front squat","Deadlift","Power clean","Push press","Overhead squat","Snatch"].forEach(n=>names.add(n));
  return`<datalist id="dl-ex">${[...names].map(n=>`<option value="${esc(n)}">`).join("")}</datalist>`}
function vListe(){const st=settings;
  const items=data.seances.map((s,i)=>{const th=st.themes[s.theme]||st.themes.cardio;let right,col="var(--line)";
    if(s.valide){const r=correct(s,data.profil,st);const d=r.note>=9?4:r.note>=6?3:r.note>=3?2:1;col=`var(--d${d})`;const N=note20(s,data,st);right=`<div class="big">${N.ok?fmtN(N.tot):fmtN(r.note)}<small>${N.ok?"/ 20":"/ 12 (AFL1)"} · ${r.rx} RX</small></div>`}
    else right=`<span class="chip">En cours</span>`;
    return`<button class="s-item" data-open="${s.id}" style="border-left-color:${col}"><div><div class="row"><strong>Séance ${i+1}</strong>${s.valide?' <span title="Validée">🔒</span>':""}<span class="chip">${esc(th.label)}</span>${s.epreuve?'<span class="chip" style="border-color:var(--accent);color:var(--accent)">Épreuve</span>':""}</div>
      <div class="hint">${fmtDate(s.date)} · ${esc(s.wod.exos.filter(e=>e.nom).map(e=>e.nom).join(", ")||"WOD non conçu")}</div></div>${right}</button>`}).reverse().join("");
  return`<div class="stack">${exBanner()}<div class="row"><h2>${RO?"Séances":"Mes séances"}</h2><span class="spacer"></span>${RO?"":`<button class="btn primary" data-act="newSeance">+ Nouvelle séance</button>`}</div>
  ${items?`<div class="list-s">${items}</div>`:RO?`<div class="card"><p style="margin:0">Aucune séance pour l'instant.</p></div>`:`<div class="card"><p style="margin:0">Aucune séance pour l'instant. Crée ta première séance : échauffement, conception du WOD, réalisation, puis analyse.</p></div>`}</div>`}

function vSeance(s){if(!s){cur=null;return vListe()}syncTours(s);
  const st=settings,p=data.profil,th=st.themes[s.theme]||st.themes.cardio,V=s.valide,L=V||RO;
  const r=correct(s,p,st),i0=data.seances.indexOf(s),k=path=>`seances.${i0}.${path}`;
  const n=nT(s),prev=r.prev,wuE=wuEval(s),anE=analyseEval(s);
  const sel=(label,path,val,opts,id)=>`<label class="f">${label}<select id="${id}" data-k="${k(path)}"><option value="">—</option>${opts.map(([v,l])=>`<option value="${v}" ${val===v?"selected":""}>${l}</option>`).join("")}</select></label>`;
  const S=(d)=>V?stamp(d):"";
  // Échauffement
  const wu=s.echauffement.exos.map((e,i)=>`<div class="wu"><div class="nm">${fld("Exercice",k(`echauffement.exos.${i}.nom`),e.nom,'placeholder="ex. Rameur progressif"')}</div>
    ${fld("Min",k(`echauffement.exos.${i}.duree`),e.duree,'inputmode="decimal"')}
    <label class="f">Contenu<select id="f-wu-cat-${i}" data-k="${k(`echauffement.exos.${i}.cat`)}">${Object.entries(WU_CATS).map(([v,l])=>`<option value="${v}" ${e.cat===v?"selected":""}>${l}</option>`).join("")}</select></label>
    ${L?"<span></span>":`<button class="btn ghost small" data-act="delWu" data-i="${i}" aria-label="Retirer cet exercice">✕</button>`}</div>`).join("");
  // Exercices du WOD
  const thD=crit(r,"theme").deg,chD=crit(r,"charge").deg;
  const ex=s.wod.exos.map((e,i)=>{const c=r.checks.find(x=>x.e===e)||{r:exoCheck(e,th,p)};const rm=rmFor(p,e.nom);
    const exStamp=V&&e.nom?stamp(c.r.ok===null?null:c.r.ok?4:1):"";
    let meta="";if(e.type==="haltero"&&e.nom)meta=rm>0?`1RM ${fmtN(rm)} kg${num(e.charge)>0?` · <strong>${Math.round(num(e.charge)/rm*100)} %</strong> du 1RM`:""}`:`<span class="ko">1RM absent du profil</span> <button class="btn ghost small" data-act="goProfil">Ajouter</button>`;
    if(V&&e.nom&&c.r.ok===false)meta+=`${meta?" · ":""}<span class="ko">${esc(c.r.why)}</span>`;
    return`<div class="ex"><div class="nm st">${fld(`Exercice ${i+1}`,k(`wod.exos.${i}.nom`),e.nom,'placeholder="ex. Thrusters" list="dl-ex"')}${exStamp}</div>
    <label class="f">Type<select id="f-ex-type-${i}" data-k="${k(`wod.exos.${i}.type`)}" data-rerender>${Object.entries(TYPES).map(([v,l])=>`<option value="${v}" ${e.type===v?"selected":""}>${l}</option>`).join("")}</select></label>
    ${fld(e.type==="cardio"?"Cal / m":"Répét.",k(`wod.exos.${i}.reps`),e.reps,'inputmode="numeric" data-rerender')}
    ${e.type==="haltero"?`<div class="st">${fld("Charge kg",k(`wod.exos.${i}.charge`),e.charge,'inputmode="decimal" data-rerender')}${V?stamp(chD):""}</div>`:fld("Niveau",k(`wod.exos.${i}.niveau`),e.niveau||"",`placeholder="${e.type==="cardio"?"ex. damper 5":"ex. genoux au sol"}" data-rerender`)}
    ${meta?`<div class="ex-meta">${meta}</div>`:""}</div>`}).join("");
  const TE=!L&&!s.coachUid;
  const steps=stepsOf(s,p),nDone=steps.filter(x=>x.ok).length;
  const head=(no,title,deg,extra="")=>`<div class="sec-h"><span class="num">${no}</span><h3>${title}</h3><span class="spacer"></span>${extra}${V?stamp(deg):(steps[no-1].ok?'<span class="st-ok">✓ Complet</span>':'<span class="st-todo">À remplir</span>')}</div>`;
  return`<div class="stack seance" style="--th:var(--t-${s.theme in st.themes?s.theme:"cardio"})">
  <div class="row"><button class="btn ghost small" data-act="back">← Mes séances</button><span class="spacer"></span>${L?"":`<button class="btn danger small" data-act="delSeance">Supprimer</button>`}</div>
  <section class="hero">
    <div class="hero-top"><span class="eyebrow">Séance ${i0+1}${s.epreuve?" · Épreuve CCF":""}</span><span class="spacer"></span>${L?`<span class="lock-chip">${V?"🔒 Validée":"En cours"}</span>`:`<label class="hero-date"><span class="sr">Date</span><input type="date" id="f-date" data-k="${k("date")}" value="${esc(s.date)}"></label>`}</div>
    <div class="hero-main"><div><h2 class="hero-t">${esc({technique:"Technique",cardio:"Cardio",force:"Force"}[s.theme]||th.label)}</h2><div class="hero-sub">${esc(th.desc)}<br>${L?fmtDate(s.date)+" · ":""}${th.reps[0]}–${th.reps[1]} répétitions · haltéro ${th.pct[0]}–${th.pct[1]} % du 1RM</div></div>${V?ring(s):""}</div>
    ${L?"":`<div class="pills" role="radiogroup" aria-label="Thème de la séance">${Object.entries(st.themes).map(([key,t])=>`<label><input type="radio" name="th" data-k="${k("theme")}" data-rerender value="${key}" ${s.theme===key?"checked":""}>${esc({technique:"Technique",cardio:"Cardio",force:"Force"}[key]||t.label)}</label>`).join("")}</div>
    <label class="hero-ep"><input type="checkbox" id="f-ep" data-k="${k("epreuve")}" data-t="bool" data-rerender ${s.epreuve?"checked":""}> Séance d'épreuve (CCF)</label>`}
    <nav class="steps" aria-label="Étapes de la séance">${steps.map((x,i)=>`<button class="step${x.ok?" ok":""}" data-act="goto" data-to="sec-${i+1}"><span class="dot">${x.ok?"✓":i+1}</span><span class="lb">${x.lb}</span></button>`).join("")}</nav>
    <div class="prog"><span style="width:${nDone*20}%"></span></div>
  </section>
  <fieldset class="lock" ${L?"disabled":""}><legend class="sr">Contenu de la séance</legend><div class="stack">
  <section class="card sec" id="sec-1">${head(1,"Rituel d'échauffement",wuE.d)}
    <div class="stack" style="gap:8px">${wu}</div>
    <div class="row" style="margin-top:10px;align-items:end">${L?"":`<button class="btn small" data-act="addWu">+ Exercice</button>`}<span class="spacer"></span>
    <div style="min-width:170px">${sel("Je me sens prêt·e","echauffement.pret",s.echauffement.pret,[["oui","Oui"],["moyen","Moyennement"],["non","Non"]],"f-pret")}</div></div>
    ${V?`<p class="hint" style="margin:10px 0 0">${esc(wuE.msg)}</p>`:""}</section>

  <section class="card sec" id="sec-2">${head(2,"Je conçois mon WOD",thD)}
    <div class="grid2"><div class="st">${fld("Nombre de tours",k("wod.nbTours"),s.wod.nbTours,'inputmode="numeric" data-rerender')}</div>
      <div class="st">${fld("Temps prévu / tour",k("wod.tempsTour"),s.wod.tempsTour,'inputmode="numeric" placeholder="1:30" data-rerender')}${S(crit(r,"reps").deg)}</div></div>
    <div style="margin-top:4px">${ex}</div>
    ${V&&thD&&thD<4?`<p class="hint" style="margin:6px 0 0">${esc(crit(r,"theme").tip)}</p>`:""}</section>

  ${vResume(s,th)}
  <section class="card sec" id="sec-3">${head(3,"Je réalise",crit(r,"decal").deg)}
    ${vCoachBox(s,L)}
    ${vTours(s,r,TE,V)}
    <div class="grid2" style="margin-top:12px">
      ${sel("Charge de l'haltéro ressentie","real.ressentiCharge",s.real.ressentiCharge,[["legere","Trop légère"],["adaptee","Adaptée"],["lourde","Lourde"]],"f-res")}
      ${sel("Effort perçu (RPE)","real.rpe",s.real.rpe,Array.from({length:10},(_,i)=>[String(i+1),`${i+1}${i===0?" · très facile":i===9?" · maximal":""}`]),"f-rpe")}</div></section>

  <section class="card sec" id="sec-4">${head(4,"J'analyse ma séance",anE.d)}
    <div class="stack" style="gap:10px">
    <label class="f">Ce qui a fonctionné (rythme, technique…)<textarea id="f-a1" data-k="${k("analyse.reussite")}">${esc(s.analyse.reussite)}</textarea></label>
    <label class="f">Ma principale difficulté et sa cause<textarea id="f-a2" data-k="${k("analyse.difficulte")}">${esc(s.analyse.difficulte)}</textarea></label>
    <label class="f">Ce que je change à la prochaine séance (avec des chiffres)<textarea id="f-a3" data-k="${k("analyse.regulation")}" placeholder="ex. passer les thrusters de 25 à 20 kg et de 20 à 15 répétitions">${esc(s.analyse.regulation)}</textarea></label></div>
    ${V&&anE.hints.length?`<p class="hint" style="margin:10px 0 0">À améliorer : ${esc(anE.hints.join(" ; "))}.</p>`:""}</section>

  ${vAuto(s,steps[4].ok)}
  </div></fieldset>
  ${V?vCorr(r,s)+(RO?`<div class="valid-bar"><button class="btn big" data-act="unlock">🔓 Déverrouiller la séance pour l'élève</button></div>`:""):RO?`<p class="hint" style="text-align:center">Séance pas encore validée par l'élève.</p>`:`<div class="valid-bar"><button class="btn big go-valid" data-act="validate"><span>🏁 Valider ma séance</span><small>${nDone}/5 étapes complètes · la séance ne pourra plus être modifiée</small></button></div>`}
  ${datalist()}</div>`}

function vTours(s,r,TE,V){const n=nT(s),prev=r.prev,S=d=>V?stamp(d):"",dis=TE?"":"disabled";
  const nextI=s.real.tours.slice(0,n).findIndex(t=>!(num(t.passage)>0));
  const tours=s.real.tours.slice(0,n).map((t,i)=>{const pv=num(t.passage)>0,d=r.D[i];let inner,cls="pas";
    if(pv){const ec=isNaN(d)||isNaN(prev)?"":` · ${d-prev>0?"+":""}${Math.round(d-prev)} s`;
      inner=`<b>${fmtP(num(t.passage))}</b><small>${isNaN(d)?"tour –":`tour ${fmtT(d)}${V?ec:""}`}</small>${!isNaN(d)&&d<=0?'<span class="warn">Temps incohérent</span>':""}`}
    else if(i===nextI&&TE){cls+=" next";inner="Passage"}else{cls+=" empty";inner="—"}
    const ad=adCount(t.adapt);
    return`<div class="tr"><div class="tn">${i+1}</div>
      <div class="st"><button class="${cls}" data-act="pas" data-i="${i}" ${dis} aria-label="Temps de passage tour ${i+1}">${inner}</button>${V&&pv?stamp(tourDeg(d,prev,r.tol),true):""}</div>
      <div class="cnt" role="group" aria-label="NO REP tour ${i+1}"><button data-act="nr" data-i="${i}" data-d="-1" ${dis} aria-label="Moins">−</button><span id="nr-${i}">${num(t.noRep)||0}</span><button data-act="nr" data-i="${i}" data-d="1" ${dis} aria-label="Plus">+</button></div>
      <button class="adp${ad?" on":""}" data-act="adapt" data-i="${i}" ${dis} aria-label="Adaptation tour ${i+1}">✎${ad?`<span class="badge">${ad}</span>`:""}</button></div>`}).join("");
  const runBtn=chrono.run?`<button class="btn stop" data-act="chStop">Arrêt</button>`:`<button class="btn go" data-act="chGo">${elapsed()>0?"Reprendre":"Départ"}</button>`;
  return`${TE?`<div class="chrono" aria-label="Chronomètre"><span class="v" id="chrono-v">${fmtC(elapsed())}</span>${runBtn}<button class="btn rz" data-act="chReset" ${chrono.run?"disabled":""}>Réinit.</button></div>`:""}
    ${n?`<div class="tours${TE?"":" ro"}"><div class="tr h"><span>N°</span><span>Temps de passage</span><span style="text-align:center">NO REP</span><span>Adapt.</span></div>${tours}</div>`:`<p class="hint">Le nombre de tours n'est pas encore indiqué dans la conception.</p>`}
    <div class="sum">
      <div class="tile st"><div class="k">Dans le temps</div><div class="v">${V?r.inTime:"–"}<small> / ${n}</small></div>${S(crit(r,"decal").deg)}</div>
      <div class="tile st"><div class="k">NO REP</div><div class="v" id="nr-tot">${r.nr}</div>${S(crit(r,"gest").deg)}</div>
      <div class="tile st"><div class="k">Adaptations</div><div class="v">${r.pa}</div>${S(crit(r,"adapt").deg)}</div></div>`}
function vCoachBox(s,L){
  if(s.coachLogin)return`<div class="coach-box on"><span class="cb-ic">📣</span><div><strong>Coach : <code>${esc(s.coachLogin)}</code></strong><div class="hint">${s.valide?"A coaché cette séance.":"Il relève les temps de passage, les NO REP et les adaptations depuis son téléphone. Ils s'affichent ici en direct."}</div></div>${L?"":`<button class="btn ghost small" data-act="delCoach">Retirer</button>`}</div>`;
  if(L)return"";
  return`<div class="coach-box"><span class="cb-ic">📣</span><div style="flex:1;min-width:0"><strong>Mon coach</strong><div class="hint">Entre l'identifiant de l'élève qui te coache : il remplira cette partie depuis son téléphone. Sinon, ton coach utilise ton téléphone.</div>
    <div class="row" style="margin-top:8px;flex-wrap:nowrap"><input id="coach-id" placeholder="ex. 1g2-05-x7p" autocapitalize="none" spellcheck="false" style="flex:1;min-width:0"><button class="btn primary small" data-act="setCoach">Ajouter</button></div><div class="err" id="coach-err"></div></div></div>`}
function vCoach(s){const th=settings.themes[s.theme]||settings.themes.cardio,r=correct(s,data.profil,settings);
  return`<div class="stack seance" style="--th:var(--t-${s.theme in settings.themes?s.theme:"cardio"})">
  <div class="row"><button class="btn ghost small" data-act="coachBack">← Mes activités</button><span class="spacer"></span><span id="sync" class="sync dark"></span></div>
  <section class="hero"><div class="hero-top"><span class="eyebrow">📣 Je coache</span><span class="spacer"></span>${s.valide?'<span class="lock-chip">🔒 Validée</span>':'<span class="lock-chip">En direct</span>'}</div>
    <div class="hero-main"><div><h2 class="hero-t" style="font-size:2rem">${esc(coachCtx.eleveLogin)}</h2><div class="hero-sub">Séance du ${fmtDate(s.date)} · ${esc(th.label)}</div></div></div></section>
  ${s.valide?`<div class="card"><p style="margin:0">Cette séance a été validée par l'élève : elle n'est plus modifiable.</p></div>`:""}
  ${vResume(s,th)}
  <section class="card sec"><div class="sec-h"><span class="num">3</span><h3>Je relève</h3></div>
    <p class="hint" style="margin:-4px 0 10px">Lance le chrono au départ du WOD, appuie sur « Passage » à chaque fin de tour, compte les NO REP et note les adaptations.</p>
    ${vTours(s,r,!s.valide,false)}</section></div>`}
function stepsOf(s,p){const n=nT(s),T=(s.real.tours||[]).slice(0,n),A=s.analyse,ae=s.autoeval||{};
  return[{lb:"Échauff.",ok:(s.echauffement.exos||[]).some(e=>e.nom&&e.duree)&&!!s.echauffement.pret},
    {lb:"WOD",ok:n>0&&!isNaN(parseT(s.wod.tempsTour))&&s.wod.exos.filter(e=>e.nom&&e.reps).length>=3&&s.wod.exos.filter(e=>e.type==="haltero"&&e.nom).every(e=>num(e.charge)>0&&rmFor(p,e.nom)>0)},
    {lb:"Réalisation",ok:T.some(t=>num(t.passage)>0)&&!!s.real.ressentiCharge},
    {lb:"Analyse",ok:!!((A.reussite||"").trim()&&(A.difficulte||"").trim()&&(A.regulation||"").trim())},
    {lb:"Autoéval.",ok:!!(ae.afl2&&ae.afl3)}]}
function ring(s){const N=note20(s,data,settings),v=N.ok?N.tot:N.r.note,max=N.ok?20:12,f=Math.max(0,Math.min(1,v/max)),R=34,L=2*Math.PI*R;
  const msg=f>=.8?"Séance au top !":f>=.6?"Belle séance":f>=.4?"Ça progresse":"On ajuste et on repart";
  return`<div class="ring"><svg viewBox="0 0 84 84" width="84" height="84" aria-hidden="true"><circle cx="42" cy="42" r="${R}" fill="none" stroke="rgba(255,255,255,.22)" stroke-width="8"/><circle cx="42" cy="42" r="${R}" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" stroke-dasharray="${(L*f).toFixed(1)} ${L.toFixed(1)}" transform="rotate(-90 42 42)"/></svg>
  <div class="ring-v"><b>${fmtN(v)}</b><small>/ ${max}</small></div><div class="ring-m">${msg}</div></div>`}
function vResume(s,th){const p=data.profil,n=nT(s),prev=parseT(s.wod.tempsTour),ex=s.wod.exos.filter(e=>e.nom);
  const lines=ex.map(e=>{let det;if(e.type==="haltero"){const c=num(e.charge),rm=rmFor(p,e.nom);det=c>0?`${fmtN(c)} kg${rm>0?` <span class="hint">· ${Math.round(c/rm*100)} %</span>`:""}`:'<span class="ko">charge ?</span>'}
    else det=e.niveau?esc(e.niveau):'<span class="hint">niveau non précisé</span>';
    return`<li><span class="rq">${e.reps?esc(e.reps):"?"}</span><span class="mv">${esc(e.nom)}</span><span class="dt">${det}</span></li>`}).join("");
  return`<section class="card resume" aria-label="Résumé du WOD"><div class="sec-h"><h3>Mon WOD</h3><span class="spacer"></span><span class="chip">${esc(th.label)}</span></div>
  <div class="rs-head">${n||"?"} tour${n>1?"s":""} <span>·</span> ${isNaN(prev)?"? ":fmtT(prev)} par tour</div>
  ${lines?`<ol class="rs">${lines}</ol>`:'<p class="hint" style="margin:0">Conçois tes exercices ci-dessus.</p>'}</section>`}
function vAuto(s,okStep){const c=data,ae=s.autoeval||(s.autoeval={afl2:null,afl3:null}),est=afl2Estime(s,c.profil);
  const blk=(afl,labels)=>{const max=REPART[c.profil.repartition||"4-4"][afl==="afl2"?0:1];
    return`<div class="ae"><div class="row"><strong>${afl==="afl2"?"AFL2 · S'entraîner":"AFL3 · Coopérer"}</strong><span class="spacer"></span><span class="ae-pts">${ae[afl]?fmtN(lvlPts(c,afl,ae[afl])):"–"}<small> / ${max}</small></span></div>
    <div class="lvls">${[1,2,3,4].map(d=>`<button class="lvl d${d}${ae[afl]===d?" on":""}" data-act="lvl" data-afl="${afl}" data-d="${d}"><b>D${d}</b><span>${esc(labels[d])}</span></button>`).join("")}</div>
    ${afl==="afl2"&&s.valide?`<p class="hint" style="margin:6px 0 0">D'après ton carnet, l'appli estime ce niveau à <strong>D${est}</strong>${ae.afl2&&ae.afl2!==est?" : relis les critères.":"."}</p>`:""}</div>`};
  return`<section class="card sec" id="sec-5"><div class="sec-h"><span class="num">5</span><h3>Je m'autoévalue</h3><span class="spacer"></span>${s.valide?"":(okStep?'<span class="st-ok">✓ Complet</span>':'<span class="st-todo">À remplir</span>')}</div>
  <p class="hint" style="margin:-4px 0 10px">Touche un niveau pour lire ses critères.</p>
  <div class="stack" style="gap:14px">${blk("afl2",AFL2_LABELS)}${blk("afl3",AFL3_LABELS)}</div>
  <p class="hint" style="margin:8px 0 0">Répartition choisie : ${esc(c.profil.repartition||"4-4").replace("-"," / ")} (modifiable dans ton profil).</p></section>`}
function vCorr(r,s){const N=note20(s,data,settings);let dom="";const rows=r.C.map(c=>{const h=c.dom!==dom?`<div class="dom">${c.dom}</div>`:"";dom=c.dom;
    return h+`<div class="crit">${stamp(c.deg)}<div><div class="t">${c.label}</div><div class="m">${esc(c.msg)}</div>${c.tip?`<div class="tip">→ ${esc(c.tip)}</div>`:""}</div><div class="rx">${c.deg?c.rx+" RX":"–"}</div></div>`}).join("");
  return`<section class="card corr" id="corr"><div class="sec-h"><h2>Ma correction</h2><span class="hint">Référentiel CA5</span></div>
  <div class="score"><div class="tile"><div class="k">Points RX</div><div class="v">${r.rx}<small> / 30</small></div></div>
    <div class="tile"><div class="k">AFL1</div><div class="v">${fmtN(r.note)}<small> / 12</small></div></div>
    <div class="tile tot"><div class="k">Note</div><div class="v">${N.ok?fmtN(N.tot):"–"}<small> / 20</small></div></div></div>
  <p class="hint" style="margin:8px 0 0">AFL1 ${fmtN(r.note)} (calculé) + AFL2 ${fmtN(N.a2)} + AFL3 ${fmtN(N.a3)} (autoévalués)${N.ok?"":" · complète ton autoévaluation pour obtenir ta note"}.</p>
  ${r.complete?"":`<p class="hint" style="margin:8px 0 0">Les critères marqués « ? » ne rapportent aucun point tant qu'ils ne sont pas complétés.</p>`}
  <div style="margin-top:4px">${rows}</div>
  <div class="legend" style="margin-top:10px">${[1,2,3,4].map(d=>`<span>${stamp(d,true)} D${d} · ${RX[d]} RX</span>`).join("")}</div></section>`}

function chartRX(res){if(!res.length)return"";const W=600,H=200,pl=34,pr=10,pt=12,pb=28,iw=W-pl-pr,ih=H-pt-pb,max=30;
  const bw=Math.min(54,iw/res.length*0.6),y=v=>pt+ih-v/max*ih;let g="";
  [0,10,20,29].forEach(v=>{g+=`<line x1="${pl}" x2="${W-pr}" y1="${y(v)}" y2="${y(v)}" stroke="${v===29?"var(--d4)":"var(--line)"}" ${v===29?'stroke-dasharray="4 4"':""}/><text x="${pl-6}" y="${y(v)+4}" text-anchor="end">${v}</text>`});
  g+=`<text x="${W-pr}" y="${y(29)-5}" text-anchor="end" style="fill:var(--d4);font-weight:700">29 RX = 12/12</text>`;
  res.forEach((r,i)=>{const cx=pl+iw*(i+.5)/res.length;
    g+=`<rect x="${cx-bw/2}" y="${y(r.rx)}" width="${bw}" height="${Math.max(0,ih-(y(r.rx)-pt))}" rx="3" fill="var(--accent)"/><text x="${cx}" y="${y(r.rx)-5}" text-anchor="middle" style="fill:var(--ink);font-weight:700">${r.rx}</text><text x="${cx}" y="${H-10}" text-anchor="middle">S${r.idx}${r.ep?" ★":""}</text>`});
  return`<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Points RX par séance validée">${g}</svg>`}
function vBilan(){const st=settings,c=data;
  const res=c.seances.map((s,i)=>s.valide?{...correct(s,c.profil,st),ep:s.epreuve,idx:i+1}:null).filter(Boolean);
  const f=afl1Final(c,st),a2=afl2(c),a3max=REPART[c.profil.repartition||"4-4"][1];
  const keys=res[0]?res[0].C.map(x=>[x.key,x.label]):[];
  const heat=res.length?`<div class="scroll"><table class="heat"><thead><tr><th>Critère</th>${res.map(r=>`<th>S${r.idx}</th>`).join("")}</tr></thead><tbody>${keys.map(([k,l])=>`<tr><td>${l}</td>${res.map(r=>`<td>${stamp(crit(r,k).deg,true)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`:"";
  const a3p=carnetDoc&&carnetDoc.afl3Prof;
  return`<div class="stack"><h2>${RO?"Bilan de l'élève":"Mon bilan"}</h2>
  <section class="card"><div class="score">
    <div class="tile"><div class="k">AFL1 ${f&&f.epreuve?"· épreuve":"· projection"}</div><div class="v">${f?fmtN(f.note):"–"}<small> / 12</small></div></div>
    <div class="tile"><div class="k">AFL2 · carnet</div><div class="v">${fmtN(a2.pts)}<small> / ${a2.max}</small></div></div>
    <div class="tile"><div class="k">Note ${f&&f.epreuve?"d'épreuve":"dernière séance"}</div><div class="v">${f&&note20(f.seance,c,st).ok?fmtN(note20(f.seance,c,st).tot):"–"}<small> / 20</small></div></div></div>
    <p class="hint" style="margin:8px 0 0">La note sur 20 additionne l'AFL1 calculé et l'autoévaluation AFL2 et AFL3. ${a3p?`AFL3 fixé par l'enseignant : <strong>D${a3p} · ${AFL3_LABELS[a3p]}</strong> (${fmtN(lvlPts(c,"afl3",a3p))} / ${a3max}).`:"L'AFL3 définitif est fixé par l'enseignant."}</p>
    <p class="hint" style="margin:8px 0 0">${f?(f.epreuve?`AFL1 calculé sur ta séance d'épreuve du ${fmtDate(f.seance.date)}.`:"Projection sur ta dernière séance validée. Coche « Séance d'épreuve » le jour du CCF."):"Valide une séance pour voir ta note."}</p></section>
  <section class="card"><div class="sec-h"><h3>Progression des points RX</h3></div>${chartRX(res)||'<p class="hint" style="margin:0">Aucune séance validée.</p>'}</section>
  ${heat?`<section class="card"><div class="sec-h"><h3>Mes degrés séance par séance</h3></div>${heat}</section>`:""}
  <section class="card"><div class="sec-h"><h3>AFL2 · Détail</h3><span class="spacer"></span>${a2.n?stamp(a2.deg):""}</div>
    <div class="crit">${stamp(a2.wu||null)}<div><div class="t">Rituel d'échauffement</div><div class="m">Degré moyen sur ${a2.n} séance${a2.n>1?"s":""} validée${a2.n>1?"s":""}.</div></div><div></div></div>
    <div class="crit">${stamp(a2.carnet||null)}<div><div class="t">Carnet d'entraînement</div><div class="m">Rempli à ${Math.round(a2.comp*100)} %, analyses précises à ${Math.round(a2.ana*100)} %.${a2.carnet<4?` <span class="hint">→ Le degré 4 demande un carnet complet, des analyses chiffrées et au moins 3 séances.</span>`:""}</div></div><div></div></div></section>
</div>`}
/* ---------- Fenêtres ---------- */
function openModal(html,ctx){modalCtx=ctx||null;$("#sheet").innerHTML=html;$("#modal").hidden=false;const f=$("#sheet").querySelector("input,textarea,button");if(f)setTimeout(()=>f.focus(),30)}
function closeModal(){$("#modal").hidden=true;modalCtx=null}
function curS(){return data.seances.find(x=>x.id===cur)}
function modalPassage(i){const s=curS(),t=s.real.tours[i],el=elapsed();
  openModal(`<h3>Tour ${i+1} · temps de passage</h3><p class="hint" style="margin:0">Temps total affiché au chrono quand le tour se termine (min:s).</p>
  <input id="m-pas" class="big-in" inputmode="decimal" value="${num(t.passage)>0?esc(fmtP(num(t.passage))):""}" placeholder="1:30,0">
  <div class="err" id="m-err"></div>
  <div class="grid2"><button class="btn primary" data-mact="savePas">Enregistrer</button>${el>0?`<button class="btn" data-mact="takePas">Prendre le chrono (${fmtC(el)})</button>`:`<button class="btn" data-mact="close">Annuler</button>`}</div>
  <div class="row">${num(t.passage)>0?`<button class="btn danger small" data-mact="clearPas">Effacer ce temps</button>`:""}<span class="spacer"></span>${el>0?`<button class="btn ghost small" data-mact="close">Annuler</button>`:""}</div>`,{type:"pas",i})}
function modalLvl(afl,d){const C=CRITERES[afl],ae=curS().autoeval||{},labels=afl==="afl2"?AFL2_LABELS:AFL3_LABELS;
  openModal(`<h3>${esc(C.titre)}</h3>
  <div class="lvls">${[1,2,3,4].map(x=>`<button class="lvl d${x}${x===d?" on":""}" data-mact="lvlTab" data-afl="${afl}" data-d="${x}"><b>D${x}</b><span>${esc(labels[x])}</span></button>`).join("")}</div>
  <ul class="crits">${C.items[d].map(t=>`<li>${esc(t)}</li>`).join("")}</ul>
  <div class="grid2"><button class="btn primary" data-mact="pickLvl" data-afl="${afl}" data-d="${d}">${ae[afl]===d?"Niveau choisi ✓":"Je choisis D"+d}</button><button class="btn" data-mact="close">Fermer</button></div>`,{type:"lvl",afl,d})}
function modalAdapt(i){const t=curS().real.tours[i],a=t.adapt||{params:[],texte:""};
  openModal(`<h3>Tour ${i+1} · adaptation</h3><p class="hint" style="margin:0">Quel paramètre as-tu modifié pendant ce tour ?</p>
  <div class="checks">${Object.entries(PARAMS).map(([k,l])=>`<label><input type="checkbox" id="m-p-${k}" value="${k}" ${a.params.includes(k)?"checked":""}> ${l}</label>`).join("")}</div>
  <label class="f">Ce que j'ai changé<textarea id="m-txt" placeholder="ex. charge passée de 25 à 20 kg">${esc(a.texte)}</textarea></label>
  <div class="grid2"><button class="btn primary" data-mact="saveAd">Enregistrer</button><button class="btn" data-mact="close">Annuler</button></div>
  ${adCount(t.adapt)?`<button class="btn danger small" data-mact="clearAd">Supprimer l'adaptation</button>`:""}`,{type:"ad",i})}

/* ====================================================================
   Partie en ligne : comptes, classes, carnets synchronisés
   ==================================================================== */
const ACTIVITES={"ca5-crosstraining":{ca:"CA5",titre:"Cross training",desc:"Réaliser et orienter son activité physique pour développer ses ressources et s'entretenir."}};
const ROLE_LABEL={dev:"Développeur",prof:"Professeur",eleve:"Élève"};
let me=null,route={name:"loading"},RO=false,carnetId=null,carnetDoc=null,activite=null;
let data=null,settings=clone(DEF_SETTINGS),view="seances",cur=null,modalCtx=null;
let classes=[],classe=null,eleves=[],classeTab="activites",suivi=null,demandes=[],profs=[];
let dirty=new Set(),dirtyProfil=false,savedValide=new Set(),saveTimer=null,syncState="ok";
let COACH=false,coachCtx=null,coachings=[],watchKey=null,watchUnsub=null;

const SAFE_ALPHA="abcdefghjkmnpqrstuvwxyz23456789";
const rnd=(n,al=SAFE_ALPHA)=>{const a=new Uint32Array(n);crypto.getRandomValues(a);return[...a].map(x=>al[x%al.length]).join("")};
const ANIMAUX=["lynx","puma","koala","zebre","tigre","lama","orque","bison","panda","loup","ours","renard","gecko","aigle","cobra","jaguar","yack","fennec","morse","otarie"];
const genPwdEleve=()=>ANIMAUX[Math.floor(Math.random()*ANIMAUX.length)]+"-"+String(1000+Math.floor(Math.random()*9000));
const genPwdProf=()=>rnd(4)+"-"+rnd(4)+"-"+rnd(2,"23456789");
const slug=s=>norm(s).replace(/[^a-z0-9]+/g,"").slice(0,8)||"classe";
const loginToEmail=l=>{l=String(l||"").trim().toLowerCase();return l.includes("@")?l:`${l}@${STUDENT_DOMAIN}`};
function mergeSettings(r){const s=clone(DEF_SETTINGS);if(!r)return s;if(r.tol)s.tol=r.tol;Object.keys(s.themes).forEach(k=>{if(r.themes&&r.themes[k]){["reps","pct"].forEach(p=>{if(Array.isArray(r.themes[k][p]))s.themes[k][p]=r.themes[k][p]})}});return s}
function authMsg(e){const c=(e&&e.code)||"";return({"auth/invalid-credential":"Identifiant ou mot de passe incorrect.","auth/wrong-password":"Identifiant ou mot de passe incorrect.","auth/user-not-found":"Identifiant ou mot de passe incorrect.","auth/invalid-email":"Identifiant invalide.","auth/too-many-requests":"Trop de tentatives. Réessaie dans quelques minutes.","auth/network-request-failed":"Pas de connexion internet.","auth/email-already-in-use":"Ce compte existe déjà.","auth/weak-password":"Mot de passe trop court (6 caractères minimum).","auth/requires-recent-login":"Par sécurité, déconnectez-vous puis reconnectez-vous avant de changer le mot de passe.","permission-denied":"Action refusée par les règles de sécurité."})[c]||("Erreur : "+((e&&e.message)||c))}
const reperesKey=cid=>"reperes_"+cid;
const getReperes=cid=>load(reperesKey(cid))||{};

/* ---------- Sauvegarde du carnet (élève) ---------- */
function save(){if(COACH){const s=curS();if(!s||s.valide)return;clearTimeout(saveTimer);setSync("pending");saveTimer=setTimeout(flushCoach,500);return}
  if(RO||!carnetId)return;dirtyProfil=true;if(cur)dirty.add(cur);clearTimeout(saveTimer);setSync("pending");saveTimer=setTimeout(flush,700)}
async function flushCoach(){clearTimeout(saveTimer);saveTimer=null;const s=curS();if(!COACH||!s)return;setSync(navigator.onLine===false?"offline":"saving");
  try{await fb.coachSaveTours(carnetId,s.id,s.real.tours);setSync("ok")}catch(e){console.error(e);setSync("error");toast(e&&e.code==="permission-denied"?"Tu n'es plus le coach de cette séance.":authMsg(e))}}
async function flush(){clearTimeout(saveTimer);saveTimer=null;if(COACH)return flushCoach();if(RO||!carnetId)return;const jobs=[];
  if(dirtyProfil){dirtyProfil=false;jobs.push(fb.updateCarnet(carnetId,{profil:data.profil}))}
  for(const id of [...dirty]){dirty.delete(id);const s=data.seances.find(x=>x.id===id);if(!s||savedValide.has(id))continue;const v=!!s.valide;
    let docData=s,merge=false;if(s.coachUid){docData=clone(s);delete docData.real.tours;merge=true}
    jobs.push(fb.saveSeance(carnetId,id,docData,merge).then(()=>{if(v)savedValide.add(id)}))}
  if(!jobs.length){setSync("ok");return}
  setSync(navigator.onLine===false?"offline":"saving");
  try{await Promise.all(jobs);setSync("ok")}catch(e){console.error(e);setSync("error");toast(authMsg(e))}}
function setSync(st){syncState=st;const el=$("#sync");if(el){el.textContent={ok:"✓ Enregistré",pending:"…",saving:"Enregistrement…",offline:"Hors ligne · gardé sur l'appareil",error:"⚠ Non enregistré"}[st]||"";el.className="sync "+st}}
window.addEventListener("online",()=>{if(syncState==="offline")setSync("saving")});
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden")flush()});

/* ---------- Navigation ---------- */
function go(name,params){route={name,...(params||{})};render();window.scrollTo(0,0)}
function setView(v){view=v;if(v!=="seances")cur=null;render();window.scrollTo(0,0)}
function rerenderKeep(){const y=window.scrollY;render();window.scrollTo(0,y)}
function renderHeader(){
  const who=$("#who");
  if(!me){who.innerHTML="";}
  else who.innerHTML=`<span class="role">${ROLE_LABEL[me.role]||""}</span> ${esc(me.role==="eleve"?me.login:me.email||"")}${route.name==="carnet"&&!RO?' <span id="sync" class="sync"></span>':""} <button class="btn small out" data-nav="logout">Déconnexion</button>`;
  if((route.name==="carnet"&&!RO)||route.name==="coach")setSync(syncState);
  const t=$("#tabs");let h="";
  if(route.name==="carnet"){h=`<button class="back" data-nav="${RO?"suivi":"acts"}" aria-label="Retour">←</button>`+[["seances","Séances"],["bilan","Bilan"],["profil","Profil"]].map(([v,l])=>`<button data-view="${v}" aria-current="${view===v}">${l}</button>`).join("")}
  else if(me&&me.role!=="eleve"&&!["loading","login"].includes(route.name)){const cur2=["classes","classe","suivi"].includes(route.name)?"classes":route.name;
    h=[["classes","Mes classes"],...(me.role==="dev"?[["dev","Développeur"]]:[]),["compte","Mon compte"]].map(([v,l])=>`<button data-nav="${v}" aria-current="${cur2===v}">${l}</button>`).join("")}
  t.querySelector(".wrap").innerHTML=h;t.hidden=!h}
function render(){renderHeader();const m=$("#main");let h="";
  try{switch(route.name){
    case"loading":h=`<div class="center-msg"><div class="spinner"></div><p>${esc(route.msg||"Chargement…")}</p></div>`;break;
    case"setup":h=vSetup();break;
    case"login":h=vLogin();break;
    case"noaccount":h=`<div class="card center-card"><h2>Compte non activé</h2><p>Ce compte n'a pas (ou plus) accès au carnet. Demande à ton enseignant de vérifier tes identifiants.</p><button class="btn primary" data-nav="logout">Retour à la connexion</button></div>`;break;
    case"error":h=`<div class="card center-card"><h2>Oups</h2><p>${esc(route.msg)}</p><button class="btn primary" data-nav="home">Réessayer</button></div>`;break;
    case"acts":h=vActs();break;
    case"coach":h=curS()?vCoach(curS()):`<div class="card center-card"><p>Séance introuvable.</p></div>`;break;
    case"carnet":h=view==="profil"?vProfil():view==="bilan"?vBilan()+(RO?vAfl3Prof():""):(cur?vSeance(curS()):vListe());break;
    case"classes":h=vClasses();break;
    case"classe":h=vClasse();break;
    case"suivi":h=vSuivi();break;
    case"dev":h=vDev();break;
    case"compte":h=vCompte();break;
  }}catch(e){console.error(e);h=`<div class="card center-card"><h2>Erreur d'affichage</h2><p>${esc(e.message)}</p></div>`}
  m.innerHTML=h;syncWatch()}
function syncWatch(){const s=curS&&data?curS():null;
  const want=s&&((route.name==="coach"&&COACH)||(route.name==="carnet"&&!RO&&!COACH&&s.coachUid&&!s.valide))?`${carnetId}/${s.id}`:null;
  if(want===watchKey)return;if(watchUnsub){watchUnsub();watchUnsub=null}watchKey=want;if(!want)return;
  const sid=s.id;watchUnsub=fb.watchSeance(carnetId,sid,(d,err)=>{if(err){if(COACH){toast("Tu n'es plus le coach de cette séance.");}return}
    const loc=data&&data.seances.find(x=>x.id===sid);if(!d||!loc)return;
    const busy=!$("#modal").hidden||(document.activeElement&&/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName));
    if(COACH){if(saveTimer)return;const before=JSON.stringify(loc);Object.keys(d).forEach(k=>{if(k!=="id")loc[k]=d[k]});syncTours(loc);if(JSON.stringify(loc)!==before&&!busy)rerenderKeep()}
    else{const nt=d.real&&d.real.tours;if(!nt)return;if(JSON.stringify(nt)!==JSON.stringify(loc.real.tours)){loc.real.tours=nt;syncTours(loc);if(!busy)rerenderKeep();else toast("Ton coach a mis à jour les temps")}}})}

/* ---------- Écrans : connexion ---------- */
function vSetup(){return`<div class="card center-card"><h2>Configuration requise</h2><p>Complétez <code>js/config.js</code> avec la configuration de votre projet Firebase, puis rechargez la page. Le guide est dans le fichier README.md.</p></div>`}
function vLogin(){return`<div class="login">
  <div class="login-hero"><div class="lh-badge">EPS</div><h1>Carnet<br>d'entraînement</h1><p>Conçois, réalise et analyse tes séances. Ta correction arrive à la fin de chaque séance.</p></div>
  <form class="card stack" id="login-form" autocomplete="on">
    <h2>Connexion</h2>
    <label class="f">Identifiant (élève) ou e-mail (prof)<input id="l-id" name="username" autocomplete="username" autocapitalize="none" spellcheck="false" required placeholder="ex. 1g2-07-k4m"></label>
    <label class="f">Mot de passe<input id="l-pw" name="password" type="password" autocomplete="current-password" required></label>
    <div class="err" id="l-err" role="alert"></div>
    <button class="btn primary big" type="submit">Se connecter</button>
    <button class="btn ghost small" type="button" data-act="forgot">Mot de passe oublié ? (profs)</button>
  </form>
  <section class="card"><div class="row"><div><strong>Vous êtes professeur d'EPS ?</strong><div class="hint">Demandez un accès pour créer vos classes.</div></div><span class="spacer"></span><button class="btn" data-act="askAccess">Demander un accès</button></div></section>
  <p class="hint center">Aucun nom d'élève n'est enregistré : chaque élève se connecte avec un identifiant anonyme.</p>
  ${DEV_EMAIL&&!DEV_EMAIL.includes("A_REMPLACER")?`<p class="center"><button class="btn ghost small" data-act="devInit">Initialiser le compte développeur</button></p>`:""}
</div>`}

/* ---------- Écrans : élève ---------- */
function vActs(){const cl=coachings.slice().sort((a,b)=>String(b.date||"").localeCompare(String(a.date||"")));
  const coachH=`<section class="card"><div class="sec-h"><h3>📣 Séances à coacher</h3><span class="spacer"></span><button class="btn ghost small" data-act="refreshCoach">Actualiser</button></div>
    ${cl.length?`<div class="list-s">${cl.map(c=>`<button class="s-item" data-act="openCoach" data-id="${c.id}" style="border-left-color:var(--accent)"><div><strong><code>${esc(c.eleveLogin)}</code></strong><div class="hint">${esc((ACTIVITES[c.activite]||{}).titre||"")} · séance du ${fmtDate(c.date)}</div></div><span class="chip">Coacher →</span></button>`).join("")}</div>`:`<p class="hint" style="margin:0">Quand un camarade te choisit comme coach, sa séance apparaît ici.</p>`}</section>`;
  return`<div class="stack">${coachH}<h2>Mes activités</h2><p class="hint" style="margin:-6px 0 0">Choisis l'activité pour ouvrir ton carnet d'entraînement.</p>
  <div class="acts">${Object.entries(ACTIVITES).map(([k,a])=>`<button class="act-card" data-act="openAct" data-a="${k}"><span class="act-ca">${a.ca}</span><span class="act-t">${esc(a.titre)}</span><span class="act-d">${esc(a.desc)}</span><span class="act-go">Ouvrir mon carnet →</span></button>`).join("")}</div></div>`}
async function openActs(){COACH=false;coachCtx=null;carnetId=null;data=null;cur=null;go("loading");
  try{coachings=await fb.listCoachings(me.uid)}catch(e){console.error(e);coachings=[]}go("acts")}
async function openCoach(id){const c=coachings.find(x=>x.id===id);if(!c)return;go("loading",{msg:"Ouverture de la séance…"});
  try{const sd=await fb.getSeance(c.carnetId,c.sid);if(!sd)throw{code:"not-found"};
    const cl=await fb.getClasse(me.classeId).catch(()=>null);settings=mergeSettings(cl&&cl.reglages&&cl.reglages[c.activite]);
    COACH=true;RO=false;coachCtx=c;carnetId=c.carnetId;data={profil:blankProfil(),seances:[sd]};syncTours(sd);cur=sd.id;syncState="ok";chrono.run=false;chrono.acc=0;go("coach")}
  catch(e){console.error(e);toast(e&&e.code==="permission-denied"||e.code==="not-found"?"Cette séance n'est plus disponible : l'élève t'a retiré ou l'a supprimée.":authMsg(e));
    openActs()}}
async function openCarnetEleve(act){go("loading",{msg:"Ouverture du carnet…"});
  try{activite=act;RO=false;carnetId=`${me.uid}_${act}`;
    let c=await fb.getCarnet(carnetId);
    if(!c){const base={eleveUid:me.uid,profId:me.profId,classeId:me.classeId,activite:act,profil:blankProfil()};await fb.createCarnet(carnetId,base);c={id:carnetId,...base}}
    const [ss,cl]=await Promise.all([fb.listSeances(carnetId),fb.getClasse(me.classeId).catch(()=>null)]);
    settings=mergeSettings(cl&&cl.reglages&&cl.reglages[act]);setCarnetData(c,ss);view="seances";cur=null;syncState="ok";go("carnet")}
  catch(e){console.error(e);go("error",{msg:authMsg(e)})}}
function setCarnetData(c,ss){carnetDoc=c;carnetId=c.id;
  data={profil:{...blankProfil(),...(c.profil||{})},seances:ss.slice().sort((a,b)=>(a.ordre||0)-(b.ordre||0))};
  if(!data.profil.rms||!data.profil.rms.length)data.profil.rms=[{nom:"",kg:""}];
  data.seances.forEach(s=>{s.autoeval=s.autoeval||{afl2:null,afl3:null};s.real=s.real||{tours:[]};s.real.tours=s.real.tours||[];s.echauffement=s.echauffement||{exos:[],pret:""};s.analyse=s.analyse||{}});
  savedValide=new Set(data.seances.filter(s=>s.valide).map(s=>s.id));dirty.clear();dirtyProfil=false}

async function setCoach(s){const inp=$("#coach-id"),err=$("#coach-err"),login=String(inp.value||"").trim().toLowerCase();err.textContent="";
  if(!login){err.textContent="Entre l'identifiant de ton coach.";return}
  if(login===String(me.login).toLowerCase()){err.textContent="Tu ne peux pas être ton propre coach.";return}
  try{const l=await fb.getLogin(login);if(!l){err.textContent="Identifiant introuvable dans ta classe.";return}
    s.coachLogin=login;s.coachUid=l.uid;dirty.add(s.id);await flush();
    await fb.setCoaching(`${carnetId}__${s.id}`,{coachUid:l.uid,eleveUid:me.uid,eleveLogin:me.login,carnetId,sid:s.id,classeId:me.classeId,activite,date:s.date});
    toast("Coach ajouté : il retrouve ta séance dans « Séances à coacher »");rerenderKeep()}
  catch(e){console.error(e);err.textContent=e&&e.code==="permission-denied"?"Identifiant introuvable dans ta classe.":authMsg(e)}}
async function delCoach(s){const id=`${carnetId}__${s.id}`;s.coachLogin=null;s.coachUid=null;dirty.add(s.id);
  try{await fb.saveSeance(carnetId,s.id,s,false);await fb.deleteCoaching(id)}catch(e){toast(authMsg(e))}rerenderKeep()}

/* ---------- Écrans : prof ---------- */
async function loadClasses(){classes=(await fb.listClasses(me.uid)).sort((a,b)=>String(a.nom).localeCompare(String(b.nom),"fr",{numeric:true}))}
function vClasses(){const year=(()=>{const d=new Date(),y=d.getFullYear();return d.getMonth()>=7?`${y}-${y+1}`:`${y-1}-${y}`})();
  return`<div class="stack"><div class="row"><h2>Mes classes</h2></div>
  ${classes.length?`<div class="grid-cards">${classes.map(c=>`<button class="class-card" data-act="openClasse" data-id="${c.id}"><span class="cc-n">${esc(c.nom)}</span><span class="hint">${esc(c.annee||"")}</span><span class="chip">${c.nbEleves||0} élève${(c.nbEleves||0)>1?"s":""}</span></button>`).join("")}</div>`:`<div class="card"><p style="margin:0">Aucune classe pour l'instant. Créez votre première classe ci-dessous.</p></div>`}
  <form class="card" id="new-classe"><div class="sec-h"><h3>Nouvelle classe</h3></div>
    <div class="grid2"><label class="f">Nom de la classe<input id="nc-nom" required maxlength="20" placeholder="ex. 1G2"></label><label class="f">Année scolaire<input id="nc-annee" value="${year}" maxlength="12"></label></div>
    <button class="btn primary" type="submit" style="margin-top:10px">Créer la classe</button></form></div>`}
async function openClasse(id,tab){go("loading");try{classe=classes.find(c=>c.id===id)||await fb.getClasse(id);eleves=(await fb.listEleves(id)).sort((a,b)=>(a.numero||0)-(b.numero||0));classeTab=tab||classeTab||"activites";go("classe")}catch(e){go("error",{msg:authMsg(e)})}}
function vClasse(){const c=classe,rep=getReperes(c.id);
  const tabs=`<div class="seg2">${[["activites","Activités"],["eleves",`Élèves (${eleves.length})`]].map(([k,l])=>`<button data-act="classeTab" data-t="${k}" aria-current="${classeTab===k}">${l}</button>`).join("")}</div>`;
  let body="";
  if(classeTab==="activites")body=`<div class="acts">${Object.entries(ACTIVITES).map(([k,a])=>`<button class="act-card" data-act="openSuivi" data-a="${k}"><span class="act-ca">${a.ca}</span><span class="act-t">${esc(a.titre)}</span><span class="act-d">Carnets d'entraînement des élèves, notes et réglages du référentiel.</span><span class="act-go">Voir les carnets →</span></button>`).join("")}</div>`;
  else body=`<section class="card"><div class="sec-h"><h3>Comptes élèves</h3><span class="spacer"></span>${eleves.length?`<button class="btn small" data-act="copyIds">Copier</button><button class="btn small" data-act="printIds">Imprimer les fiches</button>`:""}</div>
    <p class="hint" style="margin:-4px 0 10px">Distribuez les identifiants aux élèves. La colonne « Repère » (initiales, prénom…) reste uniquement sur cet appareil : elle n'est jamais envoyée en ligne.</p>
    ${eleves.length?`<div class="scroll"><table class="ids"><thead><tr><th>N°</th><th>Identifiant</th><th>Mot de passe</th><th>Repère (cet appareil)</th><th></th></tr></thead><tbody>${eleves.map(e=>`<tr><td>${e.numero}</td><td><code>${esc(e.login)}</code></td><td><code>${esc(e.password)}</code></td><td><input id="rep-${e.id}" data-repere="${e.id}" value="${esc(rep[e.id]||"")}" maxlength="30" style="min-width:110px"></td><td><button class="btn ghost small" data-act="delEleve" data-id="${e.id}" aria-label="Supprimer le compte">✕</button></td></tr>`).join("")}</tbody></table></div>`:`<p class="hint">Aucun élève dans cette classe.</p>`}
    <form id="add-eleves" class="row" style="margin-top:12px;align-items:end"><label class="f" style="width:150px">Nombre de comptes<input id="ae-n" type="number" min="1" max="40" value="${eleves.length?1:30}"></label><button class="btn primary" type="submit">Créer les comptes</button></form>
    <div id="ae-prog" class="hint" style="margin-top:8px"></div></section>
    ${eleves.length?"":`<button class="btn danger small" data-act="delClasse">Supprimer la classe</button>`}`;
  return`<div class="stack"><div class="row"><button class="btn ghost small" data-nav="classes">← Mes classes</button></div>
  <div class="class-hero"><span class="eyebrow">${esc(c.annee||"")}</span><h2>${esc(c.nom)}</h2></div>${tabs}${body}</div>`}
async function addEleves(n){const prog=$("#ae-prog"),c=classe;let maxN=eleves.reduce((m,e)=>Math.max(m,e.numero||0),0),ok=0;
  const btn=$("#add-eleves button");if(btn)btn.disabled=true;
  for(let i=0;i<n;i++){const numero=maxN+1,login=`${slug(c.nom)}-${String(numero).padStart(2,"0")}-${rnd(3)}`,password=genPwdEleve();
    if(prog)prog.textContent=`Création du compte ${i+1} / ${n}…`;
    try{const uid=await fb.createAccount(loginToEmail(login),password);
      await fb.setUser(uid,{role:"eleve",login,profId:me.uid,classeId:c.id,numero});
      await fb.addEleve(c.id,uid,{login,password,numero});
      await fb.setLogin(login,{uid,classeId:c.id,profId:me.uid});
      eleves.push({id:uid,login,password,numero});maxN=numero;ok++}
    catch(e){console.error(e);toast(authMsg(e));break}}
  c.nbEleves=eleves.length;try{await fb.updateClasse(c.id,{nbEleves:eleves.length})}catch(e){}
  toast(`${ok} compte${ok>1?"s":""} créé${ok>1?"s":""}`);render()}
function idsText(){return`Carnet d'entraînement EPS · ${classe.nom}\nAdresse : ${location.origin+location.pathname}\n\n`+eleves.map(e=>`N°${e.numero}  identifiant : ${e.login}   mot de passe : ${e.password}`).join("\n")}
function printIds(){const url=location.origin+location.pathname,rep=getReperes(classe.id);
  $("#print").innerHTML=`<div class="pgrid">${eleves.map(e=>`<div class="pcard"><div class="pc-h">Carnet d'entraînement EPS · ${esc(classe.nom)}</div><div class="pc-r">${esc(rep[e.id]||"")}</div><div>N°${e.numero}</div><div>Identifiant : <b>${esc(e.login)}</b></div><div>Mot de passe : <b>${esc(e.password)}</b></div><div class="pc-u">${esc(url)}</div></div>`).join("")}</div>`;
  window.print()}

async function openSuivi(act){go("loading",{msg:"Chargement des carnets…"});
  try{activite=act;const cs=await fb.listCarnets(me.uid,classe.id,act);
    const withS=await Promise.all(cs.map(async c=>({c,ss:await fb.listSeances(c.id)})));
    suivi={act,rows:eleves.map(e=>{const f=withS.find(x=>x.c.eleveUid===e.id);return{e,c:f&&f.c,ss:f&&f.ss}})};
    settings=mergeSettings(classe.reglages&&classe.reglages[act]);go("suivi")}
  catch(e){console.error(e);go("error",{msg:authMsg(e)})}}
function rowStats(r){if(!r.c)return null;const d={profil:{...blankProfil(),...(r.c.profil||{})},seances:r.ss.slice().sort((a,b)=>(a.ordre||0)-(b.ordre||0))};
  const f=afl1Final(d,settings),a2=afl2(d),m3=REPART[d.profil.repartition||"4-4"][1],a3=r.c.afl3Prof?m3*r.c.afl3Prof/4:null;
  const nv=d.seances.filter(s=>s.valide).length,last=f?note20(f.seance,d,settings):null;
  return{d,f,a2,m3,a3,nv,n:d.seances.length,last,tot:a3===null?null:(f?f.note:0)+a2.pts+a3}}
function vSuivi(){const a=ACTIVITES[suivi.act],rep=getReperes(classe.id),st=settings;
  const rows=suivi.rows.map((r,i)=>{const S=rowStats(r);const name=`<strong>N°${r.e.numero}</strong>${rep[r.e.id]?` · ${esc(rep[r.e.id])}`:""}<div class="hint"><code>${esc(r.e.login)}</code></div>`;
    if(!S)return`<tr><td>${name}</td><td colspan="6" class="hint">Carnet pas encore ouvert</td></tr>`;
    const ae3=S.f&&S.f.seance.autoeval&&S.f.seance.autoeval.afl3;
    return`<tr class="clk" data-act="openEleve" data-i="${i}"><td>${name}</td><td class="n">${S.nv}<span class="hint"> / ${S.n}</span></td>
    <td class="n">${S.last&&S.last.ok?fmtN(S.last.tot):"–"}</td><td class="n">${S.f?fmtN(S.f.note):"–"}${S.f&&S.f.epreuve?" ★":""}</td><td class="n">${fmtN(S.a2.pts)}<span class="hint"> / ${S.a2.max}</span></td>
    <td class="noclk"><select id="a3-${i}" data-a3="${i}" aria-label="AFL3"><option value="">—</option>${[1,2,3,4].map(d=>`<option value="${d}" ${r.c.afl3Prof==d?"selected":""}>D${d}</option>`).join("")}</select><div class="hint">/ ${S.m3}${ae3?` · auto D${ae3}`:""}</div></td>
    <td class="n"><strong>${S.tot===null?"–":fmtN(S.tot)}</strong></td></tr>`}).join("");
  const thRows=Object.entries(st.themes).map(([k,t])=>`<tr><td><strong>${esc(t.label)}</strong></td>
    ${["reps","pct"].map(p=>`<td><div class="row" style="flex-wrap:nowrap;gap:4px"><input id="s-${k}-${p}-0" data-set="${k}.${p}.0" value="${t[p][0]}" inputmode="numeric" style="width:60px"><span>–</span><input id="s-${k}-${p}-1" data-set="${k}.${p}.1" value="${t[p][1]}" inputmode="numeric" style="width:60px"></div></td>`).join("")}</tr>`).join("");
  return`<div class="stack"><div class="row"><button class="btn ghost small" data-act="backClasse">← ${esc(classe.nom)}</button><span class="spacer"></span><button class="btn small" data-act="exportCSV">Exporter (.csv)</button></div>
  <div class="class-hero"><span class="eyebrow">${a.ca} · ${esc(classe.nom)}</span><h2>${esc(a.titre)}</h2></div>
  <section class="card"><div class="sec-h"><h3>Carnets des élèves</h3><span class="hint">Touchez une ligne pour ouvrir le carnet</span></div>
    ${rows?`<div class="scroll"><table class="suivi"><thead><tr><th>Élève</th><th class="n">Séances validées</th><th class="n">Dernière note /20</th><th class="n">AFL1 /12</th><th class="n">AFL2</th><th>AFL3 prof</th><th class="n">Total /20</th></tr></thead><tbody>${rows}</tbody></table></div>`:`<p class="hint">Aucun élève dans cette classe : créez des comptes dans l'onglet Élèves.</p>`}
    <p class="hint" style="margin:8px 0 0">AFL1 : séance d'épreuve (★) ou, à défaut, dernière séance validée. AFL2 : estimé sur l'ensemble du carnet. Total = AFL1 + AFL2 + AFL3 fixé par vous. « Dernière note » = note de l'élève avec son autoévaluation.</p></section>
  <section class="card"><div class="sec-h"><h3>Réglages du référentiel</h3><span class="hint">Pour cette classe</span></div>
    <div class="scroll"><table><thead><tr><th>Thème</th><th>Répétitions</th><th>% 1RM haltéro</th></tr></thead><tbody>${thRows}</tbody></table></div>
    <div class="row" style="margin-top:10px;align-items:end"><label class="f" style="width:210px">Tolérance par tour (s)<input id="s-tol" data-set="tol" value="${st.tol}" inputmode="numeric"></label><span class="spacer"></span><button class="btn small" data-act="resetSettings">Valeurs par défaut</button></div></section></div>`}
async function saveReglages(){const r={tol:settings.tol,themes:{}};Object.entries(settings.themes).forEach(([k,t])=>r.themes[k]={reps:t.reps,pct:t.pct});
  classe.reglages={...(classe.reglages||{}),[suivi.act]:r};try{await fb.updateClasse(classe.id,{reglages:classe.reglages});toast("Réglages enregistrés")}catch(e){toast(authMsg(e))}}
function openEleve(i){const r=suivi.rows[i];if(!r||!r.c)return;RO=true;setCarnetData({...r.c,_login:`N°${r.e.numero} · ${r.e.login}`},r.ss);r.ss=data.seances;suivi.cur=i;view="seances";cur=null;go("carnet")}
function vAfl3Prof(){const a3=carnetDoc.afl3Prof,m3=REPART[data.profil.repartition||"4-4"][1];
  return`<section class="card" style="margin-top:14px"><div class="sec-h"><h3>AFL3 · votre évaluation</h3><span class="spacer"></span>${a3?stamp(a3):""}</div>
  <div class="lvls">${[1,2,3,4].map(d=>`<button class="lvl d${d}${a3===d?" on":""}" data-act="setA3" data-d="${d}"><b>D${d}</b><span>${esc(AFL3_LABELS[d])}</span></button>`).join("")}</div>
  <p class="hint" style="margin:8px 0 0">${a3?`${fmtN(m3*a3/4)} / ${m3} points.`:`Sur ${m3} points selon la répartition de l'élève.`}</p></section>`}
async function setAfl3(d,idx){const r=idx!==undefined?suivi.rows[idx]:suivi.rows[suivi.cur];if(!r||!r.c)return;
  try{await fb.updateCarnet(r.c.id,{afl3Prof:d});r.c.afl3Prof=d;if(carnetDoc&&carnetDoc.id===r.c.id)carnetDoc.afl3Prof=d;toast("AFL3 enregistré");rerenderKeep()}catch(e){toast(authMsg(e))}}
function exportCSV(){const L=[["N°","Identifiant","Séances validées","AFL1 /12","AFL2","AFL2 max","AFL3 degré","AFL3","AFL3 max","Total /20"]];
  suivi.rows.forEach(r=>{const S=rowStats(r);L.push([r.e.numero,r.e.login,S?S.nv:0,S&&S.f?S.f.note:"",S?S.a2.pts:"",S?S.a2.max:"",r.c&&r.c.afl3Prof||"",S&&S.a3!==null?S.a3:"",S?S.m3:"",S&&S.tot!==null?S.tot:""])});
  const csv="﻿"+L.map(r=>r.map(v=>`"${typeof v==="number"?String(v).replace(".",","):String(v??"").replace(/"/g,'""')}"`).join(";")).join("\n");
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download=`Notes_${slug(classe.nom)}_${suivi.act}.csv`;document.body.appendChild(a);a.click();a.remove()}

/* ---------- Écrans : développeur et compte ---------- */
async function openDev(){go("loading");try{[demandes,profs]=await Promise.all([fb.listDemandes(),fb.listProfs()]);go("dev")}catch(e){go("error",{msg:authMsg(e)})}}
const tsDate=t=>{try{const d=t&&t.toDate?t.toDate():t?new Date(t):null;return d?d.toLocaleDateString("fr-FR"):""}catch(e){return""}};
function vDev(){const nv=demandes.filter(d=>d.statut==="nouvelle");
  return`<div class="stack"><h2>Espace développeur</h2>
  <section class="card"><div class="sec-h"><h3>Demandes d'accès</h3><span class="chip">${nv.length} nouvelle${nv.length>1?"s":""}</span></div>
    ${demandes.length?demandes.sort((a,b)=>(a.statut==="nouvelle"?0:1)-(b.statut==="nouvelle"?0:1)).map(d=>`<div class="dem${d.statut==="nouvelle"?"":" done"}"><div><strong>${esc(d.email)}</strong> <span class="hint">· ${esc(tsDate(d.createdAt))}</span><div>${esc(d.etablissement)}</div>${d.message?`<div class="hint">${esc(d.message)}</div>`:""}</div>
      <div class="row">${d.statut==="nouvelle"?`<button class="btn primary small" data-act="createProf" data-id="${d.id}">Créer le compte</button><button class="btn ghost small" data-act="refuseDem" data-id="${d.id}">Refuser</button>`:`<span class="chip">${d.statut==="traitee"?"Compte créé":"Refusée"}</span><button class="btn ghost small" data-act="delDem" data-id="${d.id}" aria-label="Supprimer">✕</button>`}</div></div>`).join(""):`<p class="hint" style="margin:0">Aucune demande.</p>`}</section>
  <form class="card" id="new-prof"><div class="sec-h"><h3>Créer un compte prof</h3></div>
    <div class="row" style="align-items:end"><label class="f" style="flex:1;min-width:200px">E-mail du professeur<input id="np-email" type="email" required></label><button class="btn primary" type="submit">Créer</button></div></form>
  <section class="card"><div class="sec-h"><h3>Professeurs</h3><span class="chip">${profs.length}</span></div>
    ${profs.map(p=>`<div class="dem"><div><strong>${esc(p.email||"")}</strong> <span class="hint">· ${ROLE_LABEL[p.role]} · ${esc(tsDate(p.createdAt))}</span></div></div>`).join("")}</section></div>`}
async function createProf(email,demId){email=String(email||"").trim().toLowerCase();if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){toast("E-mail invalide");return}
  const pwd=genPwdProf();go("loading",{msg:"Création du compte…"});
  try{const uid=await fb.createAccount(email,pwd);await fb.setUser(uid,{role:"prof",email});if(demId)await fb.updateDemande(demId,{statut:"traitee"});
    await openDev();const url=location.origin+location.pathname;
    const msg=`Bonjour,\n\nVotre accès au Carnet d'entraînement EPS est prêt.\nAdresse : ${url}\nIdentifiant : ${email}\nMot de passe provisoire : ${pwd}\n\nPensez à le changer dans « Mon compte » après votre première connexion.`;
    openModal(`<h3>Compte prof créé</h3><p style="margin:0">Envoyez ces identifiants au professeur :</p><textarea id="m-msg" readonly style="min-height:190px">${esc(msg)}</textarea><div class="grid2"><button class="btn primary" data-mact="copyMsg">Copier le message</button><button class="btn" data-mact="close">Fermer</button></div>`,{type:"msg"})}
  catch(e){console.error(e);await openDev();toast(authMsg(e))}}
function vCompte(){return`<div class="stack"><h2>Mon compte</h2>
  <section class="card"><div class="row"><span class="chip">${ROLE_LABEL[me.role]}</span><strong>${esc(me.email||"")}</strong></div></section>
  <form class="card stack" id="chg-pwd" style="gap:10px"><h3>Changer mon mot de passe</h3>
    <label class="f">Nouveau mot de passe<input id="cp-1" type="password" minlength="8" autocomplete="new-password" required></label>
    <label class="f">Confirmer<input id="cp-2" type="password" minlength="8" autocomplete="new-password" required></label>
    <div class="err" id="cp-err"></div><button class="btn primary" type="submit">Enregistrer</button></form></div>`}

/* ---------- Fenêtres ---------- */
$("#modal").addEventListener("click",async e=>{if(e.target.id==="modal"){closeModal();return}
  const b=e.target.closest("[data-mact]");if(!b)return;const a=b.dataset.mact,c=modalCtx;
  if(a==="close"){closeModal();return}
  if(a==="copyMsg"){try{await navigator.clipboard.writeText($("#m-msg").value);toast("Message copié")}catch(err){$("#m-msg").select()}return}
  if(a==="sendDem"){const email=$("#d-email").value.trim(),eta=$("#d-eta").value.trim(),msg=$("#d-msg").value.trim();
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)||!eta){$("#m-err").textContent="Indiquez votre e-mail et votre établissement.";return}
    try{await fb.createDemande({email,etablissement:eta.slice(0,190),message:msg.slice(0,990)});closeModal();toast("Demande envoyée. Vous recevrez vos identifiants par e-mail.")}catch(err){$("#m-err").textContent=authMsg(err)}return}
  if(a==="sendReset"){const email=$("#r-email").value.trim();try{await fb.resetPassword(email);closeModal();toast("Si ce compte existe, un e-mail de réinitialisation a été envoyé.")}catch(err){$("#m-err").textContent=authMsg(err)}return}
  if(a==="devCreate"){const p1=$("#dv-1").value,p2=$("#dv-2").value;if(p1.length<8||p1!==p2){$("#m-err").textContent="Mot de passe de 8 caractères minimum, identique dans les deux champs.";return}
    try{await fb.signUpSelf(DEV_EMAIL,p1);closeModal()}catch(err){$("#m-err").textContent=authMsg(err)}return}
  if(a==="confirm"&&c&&c.run){b.disabled=true;await c.run();return}
  const s=curS();
  if(a==="lvlTab"){modalLvl(b.dataset.afl,+b.dataset.d);return}
  if(a==="pickLvl"){if(s&&!s.valide&&!RO&&!COACH){s.autoeval=s.autoeval||{};s.autoeval[b.dataset.afl]=+b.dataset.d;save();rerenderKeep()}closeModal();return}
  if(!s||!c||RO||s.valide)return closeModal();
  if(a==="forceValid"){s.valide=true;dirty.add(s.id);closeModal();setSync("saving");flush().then(()=>{if(s.coachUid)fb.deleteCoaching(`${carnetId}__${s.id}`).catch(()=>{})});render();window.scrollTo({top:0,behavior:"smooth"});toast("Séance validée !");return}
  const t=s.real.tours[c.i];if(!t)return closeModal();
  if(a==="takePas"){t.passage=Math.round(elapsed()*10)/10}
  else if(a==="savePas"){const v=parseT($("#m-pas").value);if(isNaN(v)||v<=0){$("#m-err").textContent="Écris le temps au format min:s, par exemple 3:05 ou 3:05,4.";return}t.passage=Math.round(v*10)/10}
  else if(a==="clearPas"){t.passage=null}
  else if(a==="saveAd"){const params=[...$("#sheet").querySelectorAll(".checks input:checked")].map(x=>x.value),texte=$("#m-txt").value.trim();t.adapt=params.length||texte?{params,texte}:null}
  else if(a==="clearAd"){t.adapt=null}
  save();closeModal();rerenderKeep()});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!$("#modal").hidden)closeModal()});
function confirmBox(title,text,label,run,danger){openModal(`<h3>${esc(title)}</h3><p style="margin:0">${text}</p><div class="grid2"><button class="btn" data-mact="close">Annuler</button><button class="btn ${danger?"danger":"primary"}" data-mact="confirm">${esc(label)}</button></div>`,{type:"confirm",run})}

/* ---------- Événements ---------- */
document.addEventListener("click",async e=>{const n=e.target.closest("[data-nav]");if(!n)return;const v=n.dataset.nav;
  if(v==="logout"){await flush();if(watchUnsub){watchUnsub();watchUnsub=null;watchKey=null}RO=false;COACH=false;carnetId=null;data=null;await fb.signOut();return}
  if(v==="home"){location.reload();return}
  if(v==="acts"){await flush();openActs();return}
  if(v==="suivi"){RO=false;carnetId=null;cur=null;go("suivi");return}
  if(v==="classes"){go("loading");try{await loadClasses();go("classes")}catch(err){go("error",{msg:authMsg(err)})}return}
  if(v==="dev"){openDev();return}
  if(v==="compte"){go("compte");return}});
$("#tabs").addEventListener("click",e=>{const b=e.target.closest("button[data-view]");if(b)setView(b.dataset.view)});
const main=$("#main");
function onField(e){const el=e.target;
  if(el.dataset.repere!==undefined){const r=getReperes(classe.id);r[el.dataset.repere]=el.value.slice(0,30);store(reperesKey(classe.id),r);return}
  if(el.dataset.a3!==undefined){if(e.type==="change")setAfl3(el.value?+el.value:null,+el.dataset.a3);return}
  if(el.dataset.set){if(route.name!=="suivi")return;const st=settings;if(el.dataset.set==="tol")st.tol=num(el.value)||5;else{const[t,p,i]=el.dataset.set.split(".");const v=num(el.value);if(!isNaN(v))st.themes[t][p][+i]=v}
    if(e.type==="change"){saveReglages();rerenderKeep()}return}
  if(!el.dataset.k||RO||route.name!=="carnet")return;
  if(/^seances\.\d+\./.test(el.dataset.k)){const si=+el.dataset.k.split(".")[1];if(data.seances[si]&&data.seances[si].valide)return}
  const v=el.dataset.t==="bool"?el.checked:el.value;setPath(data,el.dataset.k,v);save();
  if(e.type==="change"&&(el.dataset.rerender!==undefined||el.dataset.k.startsWith("profil.repartition")))rerenderKeep()}
main.addEventListener("input",onField);main.addEventListener("change",onField);
main.addEventListener("submit",async e=>{e.preventDefault();const f=e.target;
  if(f.id==="login-form"){const err=$("#l-err"),btn=f.querySelector("button[type=submit]");err.textContent="";btn.disabled=true;btn.textContent="Connexion…";
    try{await fb.signIn(loginToEmail($("#l-id").value),$("#l-pw").value)}catch(x){err.textContent=authMsg(x);btn.disabled=false;btn.textContent="Se connecter"}return}
  if(f.id==="new-classe"){const nom=$("#nc-nom").value.trim(),annee=$("#nc-annee").value.trim();if(!nom)return;
    try{const id=await fb.createClasse({profId:me.uid,nom,annee,nbEleves:0,reglages:{}});await loadClasses();await openClasse(id,"eleves");toast("Classe créée : ajoutez les comptes élèves")}catch(x){toast(authMsg(x))}return}
  if(f.id==="add-eleves"){const n=Math.max(1,Math.min(40,parseInt($("#ae-n").value)||0));addEleves(n);return}
  if(f.id==="new-prof"){createProf($("#np-email").value);return}
  if(f.id==="chg-pwd"){const a=$("#cp-1").value,b=$("#cp-2").value,err=$("#cp-err");if(a!==b){err.textContent="Les deux mots de passe sont différents.";return}
    try{await fb.changePassword(a);f.reset();err.textContent="";toast("Mot de passe modifié")}catch(x){err.textContent=authMsg(x)}return}});
main.addEventListener("click",e=>{const o=e.target.closest("[data-open]");if(o){cur=o.dataset.open;render();window.scrollTo(0,0);return}
  const b=e.target.closest("[data-act]");if(!b)return;if(b.dataset.act==="openEleve"&&e.target.closest(".noclk"))return;
  const a=b.dataset.act,i=+b.dataset.i;
  // Connexion
  if(a==="askAccess"){openModal(`<h3>Demander un accès prof</h3><label class="f">E-mail professionnel<input id="d-email" type="email" autocomplete="email"></label><label class="f">Établissement<input id="d-eta" maxlength="190"></label><label class="f">Message (facultatif)<textarea id="d-msg" maxlength="990"></textarea></label><div class="err" id="m-err"></div><div class="grid2"><button class="btn" data-mact="close">Annuler</button><button class="btn primary" data-mact="sendDem">Envoyer</button></div>`);return}
  if(a==="forgot"){openModal(`<h3>Mot de passe oublié</h3><p class="hint" style="margin:0">Réservé aux professeurs. Élèves : demandez votre mot de passe à votre enseignant.</p><label class="f">E-mail<input id="r-email" type="email" value="${esc(($("#l-id")||{}).value||"")}"></label><div class="err" id="m-err"></div><div class="grid2"><button class="btn" data-mact="close">Annuler</button><button class="btn primary" data-mact="sendReset">Envoyer le lien</button></div>`);return}
  if(a==="devInit"){openModal(`<h3>Compte développeur</h3><p class="hint" style="margin:0">À faire une seule fois. Adresse : <strong>${esc(DEV_EMAIL)}</strong></p><label class="f">Mot de passe<input id="dv-1" type="password" autocomplete="new-password"></label><label class="f">Confirmer<input id="dv-2" type="password" autocomplete="new-password"></label><div class="err" id="m-err"></div><div class="grid2"><button class="btn" data-mact="close">Annuler</button><button class="btn primary" data-mact="devCreate">Créer</button></div>`);return}
  // Élève
  if(a==="openAct"){openCarnetEleve(b.dataset.a);return}
  if(a==="openCoach"){openCoach(b.dataset.id);return}
  if(a==="refreshCoach"){openActs();return}
  if(a==="coachBack"){flushCoach().finally(openActs);return}
  // Prof
  if(a==="openClasse"){openClasse(b.dataset.id);return}
  if(a==="classeTab"){classeTab=b.dataset.t;render();return}
  if(a==="backClasse"){go("classe");return}
  if(a==="openSuivi"){openSuivi(b.dataset.a);return}
  if(a==="openEleve"){if(e.target.closest("select"))return;openEleve(i);return}
  if(a==="copyIds"){navigator.clipboard.writeText(idsText()).then(()=>toast("Identifiants copiés")).catch(()=>toast("Copie impossible"));return}
  if(a==="printIds"){printIds();return}
  if(a==="delEleve"){const el=eleves.find(x=>x.id===b.dataset.id);confirmBox("Supprimer ce compte élève ?",`Le compte <code>${esc(el.login)}</code> et tous ses carnets seront supprimés définitivement.`,"Supprimer",async()=>{
      try{const cs=await fb.listCarnetsEleve(me.uid,el.id);for(const c of cs){const ss=await fb.listSeances(c.id);for(const s of ss)await fb.deleteSeance(c.id,s.id);await fb.deleteCarnet(c.id)}
        await fb.deleteUser(el.id);await fb.deleteEleve(classe.id,el.id);await fb.deleteLogin(el.login).catch(()=>{});eleves=eleves.filter(x=>x.id!==el.id);classe.nbEleves=eleves.length;await fb.updateClasse(classe.id,{nbEleves:eleves.length});closeModal();toast("Compte supprimé");render()}
      catch(x){closeModal();toast(authMsg(x))}},true);return}
  if(a==="delClasse"){confirmBox("Supprimer la classe ?",`La classe ${esc(classe.nom)} sera supprimée.`,"Supprimer",async()=>{try{await fb.deleteClasse(classe.id);closeModal();await loadClasses();go("classes")}catch(x){closeModal();toast(authMsg(x))}},true);return}
  if(a==="exportCSV"){exportCSV();return}
  if(a==="resetSettings"){settings=clone(DEF_SETTINGS);saveReglages();render();return}
  if(a==="setA3"){setAfl3(+b.dataset.d);return}
  if(a==="unlock"){const s=curS();confirmBox("Déverrouiller la séance ?","L'élève pourra de nouveau la modifier, puis devra la valider à nouveau.","Déverrouiller",async()=>{
      try{await fb.setSeanceValide(carnetId,s.id,false);s.valide=false;savedValide.delete(s.id);closeModal();toast("Séance déverrouillée");render()}catch(x){closeModal();toast(authMsg(x))}});return}
  // Développeur
  if(a==="createProf"){const d=demandes.find(x=>x.id===b.dataset.id);if(d)createProf(d.email,d.id);return}
  if(a==="refuseDem"){fb.updateDemande(b.dataset.id,{statut:"refusee"}).then(openDev).catch(x=>toast(authMsg(x)));return}
  if(a==="delDem"){fb.deleteDemande(b.dataset.id).then(openDev).catch(x=>toast(authMsg(x)));return}
  // Carnet (élève)
  if(route.name!=="carnet"&&route.name!=="coach")return;
  const s=curS();
  const TOUR_ACTS=["pas","nr","adapt","chGo","chStop","chReset"];
  if(COACH&&(!TOUR_ACTS.includes(a)||!s||s.valide))return;
  if(!COACH&&s&&s.coachUid&&TOUR_ACTS.includes(a))return;
  if(a==="goto"){const t=document.getElementById(b.dataset.to);if(t){const y=t.getBoundingClientRect().top+window.scrollY-58;window.scrollTo({top:y,behavior:"smooth"})}return}
  if(a==="back"){flush();cur=null;render();return}
  if(a==="lvl"){if(!RO)modalLvl(b.dataset.afl,+b.dataset.d);return}
  if(RO)return;
  if(a==="goProfil"){setView("profil");return}
  if(a==="addRm"){data.profil.rms.push({nom:"",kg:""});save();rerenderKeep();return}
  if(a==="delRm"){data.profil.rms.splice(i,1);if(!data.profil.rms.length)data.profil.rms.push({nom:"",kg:""});save();rerenderKeep();return}
  if(a==="newSeance"){const last=data.seances[data.seances.length-1];const n=blankSeance(last?last.theme:"cardio");
    if(last){n.echauffement=clone(last.echauffement);n.wod=clone(last.wod);n.wod.exos.forEach(x=>{if(x.niveau===undefined)x.niveau=""})}data.seances.push(n);cur=n.id;save();render();window.scrollTo(0,0);if(last)toast("Échauffement et WOD repris de ta séance précédente");return}
  if(!s||s.valide)return;
  if(a==="delSeance"){confirmBox("Supprimer cette séance ?","Toutes les données de la séance seront effacées.","Supprimer",async()=>{
      const id=s.id;dirty.delete(id);data.seances=data.seances.filter(x=>x.id!==id);cur=null;closeModal();render();
      try{await fb.deleteSeance(carnetId,id);toast("Séance supprimée")}catch(x){toast(authMsg(x))}},true);return}
  if(a==="setCoach"){setCoach(s);return}
  if(a==="delCoach"){delCoach(s);return}
  if(a==="addWu"){s.echauffement.exos.push({nom:"",duree:"",cat:"mobilite"});save();rerenderKeep();return}
  if(a==="delWu"){s.echauffement.exos.splice(i,1);save();rerenderKeep();return}
  if(a==="chGo"){chrono.run=true;chrono.start=Date.now();rerenderKeep();return}
  if(a==="chStop"){chrono.acc+=Date.now()-chrono.start;chrono.run=false;rerenderKeep();return}
  if(a==="chReset"){chrono.acc=0;chrono.run=false;rerenderKeep();return}
  if(a==="pas"){const t=s.real.tours[i];
    if(!(num(t.passage)>0)&&b.classList.contains("next")&&elapsed()>0){t.passage=Math.round(elapsed()*10)/10;save();rerenderKeep();return}
    modalPassage(i);return}
  if(a==="nr"){const t=s.real.tours[i];t.noRep=Math.max(0,(num(t.noRep)||0)+(+b.dataset.d));save();
    $("#nr-"+i).textContent=t.noRep;$("#nr-tot").textContent=s.real.tours.slice(0,nT(s)).reduce((x,t)=>x+(num(t.noRep)||0),0);return}
  if(a==="adapt"){modalAdapt(i);return}
  if(a==="validate"){const m=missing(s,data.profil);
    if(!m.length){openModal(`<h3>Valider la séance ?</h3><p style="margin:0">Ta séance est complète. Une fois validée, elle ne pourra plus être modifiée ni supprimée.</p><div class="grid2"><button class="btn" data-mact="close">Relire</button><button class="btn primary" data-mact="forceValid">Valider</button></div>`,{type:"valid",i:0});return}
    openModal(`<h3>Il manque des éléments</h3><ul class="miss">${m.map(x=>`<li>${esc(x)}</li>`).join("")}</ul><p class="hint" style="margin:0">Les critères incomplets ne rapporteront pas de points. Une fois validée, la séance ne peut plus être modifiée ni supprimée.</p>
      <div class="grid2"><button class="btn" data-mact="close">Compléter</button><button class="btn primary" data-mact="forceValid">Valider quand même</button></div>`,{type:"valid",i:0});return}
});

/* ---------- Démarrage ---------- */
if(!fb.configured){route={name:"setup"};render()}
else{render();
  fb.onAuth(async u=>{
    if(!u){me=null;RO=false;carnetId=null;data=null;go("login");return}
    go("loading");
    try{let d=await fb.getUser(u.uid);
      if(!d&&u.email&&u.email.toLowerCase()===String(DEV_EMAIL).toLowerCase()){await fb.setUser(u.uid,{role:"dev",email:u.email});d={role:"dev",email:u.email}}
      if(!d){me={uid:u.uid,role:""};go("noaccount");return}
      me={uid:u.uid,...d};
      if(me.role==="eleve"){openActs()}else{await loadClasses();go("classes")}}
    catch(e){console.error(e);go("error",{msg:authMsg(e)})}})}
