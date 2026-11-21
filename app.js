// Carnet d'entraînement EPS : application (élève, prof, développeur)
import * as fb from "./fb.js?v=2026.11.21-15";
import { DEV_EMAIL, STUDENT_DOMAIN } from "./config.js?v=2026.11.21-15";
const APP_VERSION="2026.11.21-15";

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
/* Temps : « 4:30 », « 4'30 », « 4'30" », « 4’30’’ », « 4 min 30 », « 4' » = 4 min 30 s / 4 min ; un nombre seul = secondes (2026.11.21-15) */
function parseT(v){if(v===undefined||v===null)return NaN;v=String(v).trim().toLowerCase().replace(/\s+/g,"");if(!v)return NaN;
  v=v.replace(/(''|’’|′′|"|″|”|“|s|sec)$/,"").replace(/(mn|min|m|'|’|′|‘|´)/,":").replace(",",".");if(v.endsWith(":"))v+="0";
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
const MOUTH={1:'<path d="M40 83 Q60 66 80 83" fill="none" stroke="url(#sm-e1)" stroke-width="6" stroke-linecap="round"/>',
  2:'<path d="M38 77 Q60 72 82 77" fill="none" stroke="url(#sm-e2)" stroke-width="6" stroke-linecap="round"/>',
  3:'<path d="M40 72 Q60 86 80 72" fill="none" stroke="url(#sm-e3)" stroke-width="6" stroke-linecap="round"/>',
  4:'<path d="M35 67 Q60 101 85 67 Q60 75 35 67 Z" fill="url(#sm-e4)" stroke="url(#sm-e4)" stroke-width="3" stroke-linejoin="round"/>'};
const smRing=g=>`<circle cx="60" cy="60" r="56" fill="#fff"/><circle cx="60" cy="60" r="44" fill="none" stroke="${g}" stroke-width="10.5" stroke-dasharray="11 6.3" transform="rotate(-96 60 60)"/>`;
const stamp=(d,sm)=>d?`<span class="stamp d${d}${sm?" sm":""}" role="img" title="Degré ${d}" aria-label="Degré ${d}"><svg viewBox="0 0 120 120" aria-hidden="true">${smRing(`url(#sm-r${d})`)}<ellipse cx="46" cy="50" rx="6.5" ry="8" fill="url(#sm-e${d})"/><ellipse cx="74" cy="50" rx="6.5" ry="8" fill="url(#sm-e${d})"/>${MOUTH[d]}</svg></span>`
  :`<span class="stamp d0${sm?" sm":""}" role="img" title="À compléter" aria-label="À compléter"><svg viewBox="0 0 120 120" aria-hidden="true">${smRing("#a7adb3")}<text x="60" y="76" text-anchor="middle" font-size="46" font-weight="800" fill="#8a9097" font-family="system-ui,sans-serif">?</text></svg></span>`;

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
  return`<div class="coach-box"><span class="cb-ic">📣</span><div style="flex:1;min-width:0"><strong>Mon coach</strong><div class="hint">Choisis l'élève qui te coache : il remplira cette partie depuis son téléphone. Sinon, ton coach utilise ton téléphone.</div>
    <div class="row" style="margin-top:8px;flex-wrap:nowrap">${rosterSelect("coach-id",[],"Choisir mon coach…")}<button class="btn primary small" data-act="setCoach">Ajouter</button></div><div class="err" id="coach-err"></div></div></div>`}
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
let classeActs=[],classes=[],classe=null,eleves=[],classeTab="activites",suivi=null,demandes=[],profs=[];
let dirty=new Set(),dirtyProfil=false,savedValide=new Set(),saveTimer=null,syncState="ok";
let COACH=false,coachCtx=null,coachings=[],watchKey=null,watchUnsub=null;
let CORR=null,CVIEW=null,CORRS={},DIFF=null,SBX=null,CX=null;

const SAFE_ALPHA="abcdefghjkmnpqrstuvwxyz23456789";
const rnd=(n,al=SAFE_ALPHA)=>{const a=new Uint32Array(n);crypto.getRandomValues(a);return[...a].map(x=>al[x%al.length]).join("")};
const ANIMAUX=["lynx","puma","koala","zebre","tigre","lama","orque","bison","panda","loup","ours","renard","gecko","aigle","cobra","jaguar","yack","fennec","morse","otarie"];
const genPwdEleve=()=>ANIMAUX[Math.floor(Math.random()*ANIMAUX.length)]+"-"+String(1000+Math.floor(Math.random()*9000));
const genPwdProf=()=>rnd(4)+"-"+rnd(4)+"-"+rnd(2,"23456789");
const slug=s=>norm(s).replace(/[^a-z0-9]+/g,"").slice(0,8)||"classe";
const loginToEmail=l=>{l=String(l||"").trim().toLowerCase();return l.includes("@")?l:`${l}@${STUDENT_DOMAIN}`};
function mergeSettings(r){const s=clone(DEF_SETTINGS);if(!r)return s;if(r.tol)s.tol=r.tol;Object.keys(s.themes).forEach(k=>{if(r.themes&&r.themes[k]){["reps","pct"].forEach(p=>{if(Array.isArray(r.themes[k][p]))s.themes[k][p]=r.themes[k][p]})}});return s}
function authMsg(e){const c=(e&&e.code)||"";return({"auth/invalid-credential":"Identifiant ou mot de passe incorrect.","auth/wrong-password":"Identifiant ou mot de passe incorrect.","auth/user-not-found":"Identifiant ou mot de passe incorrect.","auth/invalid-email":"Identifiant invalide.","auth/too-many-requests":"Trop de tentatives. Réessaie dans quelques minutes.","auth/network-request-failed":"Pas de connexion internet.","auth/email-already-in-use":"Ce compte existe déjà.","auth/weak-password":"Mot de passe trop court (6 caractères minimum).","auth/requires-recent-login":"Par sécurité, déconnectez-vous puis reconnectez-vous avant de changer le mot de passe.","permission-denied":"Action refusée par les règles de sécurité.","lent":"La connexion est trop lente ou figée. Réessaie (la connexion sera relancée).","unavailable":"Serveur injoignable (connexion coupée). Réessaie dans un instant.","not-found":"Document introuvable (il a peut-être été supprimé)."})[c]||("Erreur : "+((e&&e.message)||c))}
const reperesKey=cid=>"reperes_"+cid;
const getReperes=cid=>load(reperesKey(cid))||{};

/* ---------- Sauvegarde du carnet (élève) ---------- */
function save(){if(CORR){clearTimeout(saveTimer);setSync("pending");saveTimer=setTimeout(corrFlush,700);return}if(COACH){const s=curS();if(!s||s.valide)return;clearTimeout(saveTimer);setSync("pending");saveTimer=setTimeout(flushCoach,500);return}
  if(RO||!carnetId)return;dirtyProfil=true;if(cur)dirty.add(cur);clearTimeout(saveTimer);setSync("pending");saveTimer=setTimeout(flush,700)}
async function flushCoach(){clearTimeout(saveTimer);saveTimer=null;const s=curS();if(!COACH||!s)return;setSync(navigator.onLine===false?"offline":"saving");
  try{if(MOD){const up={};coachPaths(MOD).forEach(p=>{up["valeurs."+p]=gVal(s,p)??null});if(MOD.versions&&s.valeurs._version)up["valeurs._version"]=s.valeurs._version;await fb.updateSeance(carnetId,s.id,up)}else await fb.coachSaveTours(carnetId,s.id,s.real.tours);setSync("ok")}catch(e){console.error(e);setSync("error");toast(e&&e.code==="permission-denied"?"Tu n'es plus le coach de cette séance.":authMsg(e))}}
async function flush(){if(CORR)return corrFlush();clearTimeout(saveTimer);saveTimer=null;if(VUE){dirty.clear();dirtyProfil=false;return}if(COACH)return flushCoach();if(RO||!carnetId)return;const jobs=[];
  if(dirtyProfil){dirtyProfil=false;jobs.push(fb.updateCarnet(carnetId,{profil:data.profil}))}
  for(const id of [...dirty]){dirty.delete(id);const s=data.seances.find(x=>x.id===id);if(!s||savedValide.has(id))continue;const v=!!s.valide;
    if(isGroupe()&&SYNCED[id]){const p=groupPatch(s);if(p&&Object.keys(p).length){const snap=flatVals(s);jobs.push(fb.updateSeance(carnetId,id,p).then(()=>{SYNCED[id]=snap;if(v)savedValide.add(id)}))}continue}
    let docData=s,merge=false;if(s.coachUid){docData=clone(s);if(MOD){coachPaths(MOD).forEach(p=>{const[a,b]=p.split(".");if(docData.valeurs&&docData.valeurs[a])delete docData.valeurs[a][b]})}else delete docData.real.tours;merge=true}
    jobs.push(fb.saveSeance(carnetId,id,docData,merge).then(()=>{if(v)savedValide.add(id);if(isGroupe())markSynced(s)}))}
  if(!jobs.length){setSync("ok");return}
  setSync(navigator.onLine===false?"offline":"saving");
  try{await Promise.all(jobs);setSync("ok")}catch(e){console.error(e);setSync("error");toast(authMsg(e))}}
function setSync(st){syncState=st;const el=$("#sync");if(el){el.textContent={ok:"✓ Enregistré",pending:"…",saving:"Enregistrement…",offline:"Hors ligne · gardé sur l'appareil",error:"⚠ Non enregistré"}[st]||"";el.className="sync "+st}}
window.addEventListener("online",()=>{if(syncState==="offline")setSync("saving")});
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden")flush()});

/* ---------- Navigation ---------- */
let RETRY=null,LOADT=null;
function go(name,params){clearTimeout(LOADT);route={name,...(params||{})};
  if(name==="loading"){const r0=route;LOADT=setTimeout(()=>{if(route===r0){try{fb.relancerReseau()}catch(e){}go("error",{msg:"Le chargement prend trop de temps (connexion lente ou figée). Touche « Réessayer » : la connexion est relancée.",retry:true})}},20000)}
  render();window.scrollTo(0,0)}
async function retryNow(){go("loading",{msg:"Relance de la connexion…"});try{await fb.relancerReseau()}catch(e){}const f=RETRY;if(f){try{await f()}catch(e){go("error",{msg:authMsg(e),retry:true})}}else go("home")}
function setView(v){view=v;if(v!=="seances")cur=null;render();window.scrollTo(0,0)}
/* Demande à l'IA de l'éditeur : gardée d'un affichage à l'autre (2026.11.21-15) */
document.addEventListener("input",e=>{if(e.target&&e.target.id==="ia-req")iaDraft=e.target.value});
document.addEventListener("change",e=>{if(e.target&&e.target.id==="ia-file"){const f=e.target.files&&e.target.files[0];if(f){iaFile=f;iaOpen=true;rerenderKeep()}}});
document.addEventListener("toggle",e=>{if(e.target&&e.target.classList&&e.target.classList.contains("ia-box"))iaOpen=e.target.open},true);
/* Case remplie par l'observateur : l'élève qui la touche est prévenu (2026.11.21-15) */
document.addEventListener("click",e=>{const c=e.target.closest&&e.target.closest(".coach-lock");if(c)toast("📣 Cette case est remplie par ton observateur (coach), depuis son téléphone")});
function rerenderKeep(){const y=window.scrollY;render();window.scrollTo(0,y)}
function renderHeader(){
  const who=$("#who");
  if(!me){who.innerHTML="";}
  else who.innerHTML=`<span class="role">${ROLE_LABEL[me.role]||""}</span> ${esc(me.role==="eleve"?me.login:me.email||"")}${route.name==="carnet"&&!RO?' <span id="sync" class="sync"></span>':""} <button class="btn small out" data-nav="logout">Déconnexion</button>`;
  if((route.name==="carnet"&&!RO)||route.name==="coach")setSync(syncState);
  const t=$("#tabs");let h="";
  if(route.name==="carnet"&&CORR){h=`<button class="back" data-nav="corrExit" aria-label="Retour">←</button><button aria-current="true">✏️ Correction · ${esc(carnetDoc&&carnetDoc._login||"")}</button>`}
  else if(route.name==="carnet"){const w=PW(MOD);h=`<button class="back" data-nav="${RO?"suivi":dossierCtx?"dossier":"acts"}" aria-label="Retour">←</button>`+[["seances",MOD&&MOD.pages==="cycle"?"Ma page":w.many[0].toUpperCase()+w.many.slice(1)],["bilan","Bilan"],["profil",isGroupe()?"Groupe":"Profil"]].map(([v,l])=>`<button data-view="${v}" aria-current="${view===v}">${l}</button>`).join("")}
  else if(me&&me.role!=="eleve"&&!["loading","login"].includes(route.name)){const cur2=["classes","classe","suivi"].includes(route.name)?"classes":["modele","dossiers","dossierEd"].includes(route.name)?"modeles":route.name==="profAccueil"?"accueilEl":route.name;
    h=[["classes","Classes"],["modeles","Activités"],["accueilEl","Élèves"],["stock","Stock"],...(me.role==="dev"?[["dev","Dév."]]:[]),["compte","Compte"]].map(([v,l])=>`<button data-nav="${v}" aria-current="${cur2===v}">${l}</button>`).join("")}
  t.querySelector(".wrap").innerHTML=h;t.hidden=!h}
function render(){DIFF=null;document.body.classList.toggle("vue",!!VUE);document.body.classList.toggle("wide",route.name==="modele"&&!!modeleEdit&&SB());document.body.classList.toggle("shell",isShell());document.body.classList.toggle("carnet",["carnet","coach"].includes(route.name)||(route.name==="modele"&&!!modeleEdit&&modeleEdit.tab==="apercu"));renderHeader();const m=$("#main");let h="";
  try{switch(route.name){
    case"loading":h=`<div class="center-msg"><div class="spinner"></div><p>${esc(route.msg||"Chargement…")}</p></div>`;break;
    case"setup":h=vSetup();break;
    case"login":h=vLogin();break;
    case"noaccount":h=`<div class="card center-card"><h2>Compte non activé</h2><p>Ce compte n'a pas (ou plus) accès au carnet. Demande à ton enseignant de vérifier tes identifiants.</p><button class="btn primary" data-nav="logout">Retour à la connexion</button></div>`;break;
    case"error":h=`<div class="card center-card"><h2>Oups</h2><p>${esc(route.msg)}</p>${RETRY?`<button class="btn primary" data-act="retryNow">↻ Réessayer</button> <button class="btn" data-nav="home">Retour à l'accueil</button>`:`<button class="btn primary" data-nav="home">Réessayer</button>`}</div>`;break;
    case"acts":h=vActs();break;
    case"coach":h=curS()?(MOD?gCoach(curS()):vCoach(curS())):`<div class="card center-card"><p>Séance introuvable.</p></div>`;break;
    case"carnet":h=MOD&&carnetDoc&&carnetDoc.sansGroupe?vSansGroupe():MOD?(view==="profil"?gProfil():view==="bilan"?gBilan()+(RO?vAfl3Prof():""):(cur?gSeance(curS()):gListe())):(view==="profil"?vProfil():view==="bilan"?vBilan()+(RO?vAfl3Prof():""):(cur?vSeance(curS()):vListe()));break;
    case"modeles":h=vModeles();break;
    case"dossiers":h=vDossiers();break;
    case"dossierEd":h=vDossierEd();break;
    case"qcmEd":h=QE?vQcmEd():"";break;
    case"qcm":h=QV?vQcm():"";break;
    case"dossier":h=vDossierEleve()+(me&&me.role==="eleve"?vBottomNav():"");break;
    case"progres":h=vProgres()+vBottomNav();break;
    case"stock":h=vStock();break;
    case"home":h=vHome()+vBottomNav();break;
    case"enclasse":h=vEnClasse()+vBottomNav();break;
    case"profilEl":h=vProfilEl()+vBottomNav();break;
    case"conseils":h=vConseilsPage()+vBottomNav();break;
    case"actus":h=vActusPage()+vBottomNav();break;
    case"profAccueil":h=PA?vProfAccueil():"";break;
    case"feuille":h=FE?vFeuillePage():"";break;
    case"feuilleLocale":h=FL?vFeuilleLocale():"";break;
    case"outilProf":h=OP?vOutilProf():"";break;
    case"co":h=CO?vCo():"";break;
    case"coProf":h=CP?vCoProf():"";break;
    case"coCfg":h=CC?vCoCfg():"";break;
    case"modele":h=vModele();break;
    case"classes":h=vClasses();break;
    case"classe":h=vClasse();break;
    case"suivi":h=MOD?gSuivi():vSuivi();break;
    case"dev":h=vDev();break;
    case"compte":h=vCompte();break;
  }}catch(e){console.error(e);h=(isShell()&&["dossier","enclasse","progres"].includes(route.name)?vVueBanner():"")+`<div class="card center-card"><h2>Erreur d'affichage</h2><p>${esc(e.message)}</p>${isShell()?`<button class="btn primary" data-act="shTab" data-t="home">← Retour à l'accueil</button>`:""}</div>`+(isShell()?vBottomNav():"")}
  m.innerHTML=(isShell()&&["dossier","enclasse","progres"].includes(route.name)?"":vVueBanner())+h;syncWatch();tutoInject()}
function syncWatch(){const s=curS&&data?curS():null;
  const want=s&&((route.name==="coach"&&COACH)||(route.name==="carnet"&&!RO&&!COACH&&!CORR&&(s.coachUid||isGroupe())&&!s.valide))?`${carnetId}/${s.id}`:null;
  if(want===watchKey)return;if(watchUnsub){watchUnsub();watchUnsub=null}watchKey=want;if(!want)return;
  const sid=s.id;watchUnsub=fb.watchSeance(carnetId,sid,(d,err)=>{if(err){if(COACH){toast("Tu n'es plus le coach de cette séance.");}return}
    const loc=data&&data.seances.find(x=>x.id===sid);if(!d||!loc)return;
    const busy=!$("#modal").hidden||(document.activeElement&&/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName));
    if(COACH){if(saveTimer)return;const before=JSON.stringify(loc);Object.keys(d).forEach(k=>{if(k!=="id")loc[k]=d[k]});if(MOD)gEnsure(MOD,loc);else syncTours(loc);if(JSON.stringify(loc)!==before&&!busy)rerenderKeep()}
    else if(MOD&&isGroupe()){if(mergeRemote(loc,d)){gEnsure(MOD,loc);if(!busy)rerenderKeep()}}
    else if(MOD){let ch=false;if(MOD.versions&&d.valeurs&&d.valeurs._version&&JSON.stringify(d.valeurs._version)!==JSON.stringify(loc.valeurs._version)&&(+d.valeurs._version.t||0)>=(+(loc.valeurs._version||{}).t||0)){loc.valeurs._version=d.valeurs._version;ch=true}coachPaths(MOD).forEach(p=>{const[a,b]=p.split("."),nt=gVal(d,p);if(nt===undefined)return;if(JSON.stringify(nt)!==JSON.stringify(gVal(loc,p))){loc.valeurs[a]=loc.valeurs[a]||{};loc.valeurs[a][b]=nt;ch=true}});if(ch){gEnsure(MOD,loc);if(!busy)rerenderKeep();else toast("Ton coach a mis à jour ta page")}}
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
  ${DEV_EMAIL&&!DEV_EMAIL.includes("A_REMPLACER")&&new URLSearchParams(location.search).has("init")?`<p class="center"><button class="btn ghost small" data-act="devInit">Initialiser le compte développeur</button></p>`:""}
</div>`}

/* ---------- Écrans : élève ---------- */
function vActs(){const cl=coachings.slice().sort((a,b)=>String(b.date||"").localeCompare(String(a.date||"")));
  const coachH=`<section class="card"><div class="sec-h"><h3>📣 Séances à coacher</h3><span class="spacer"></span><button class="btn ghost small" data-act="refreshCoach">Actualiser</button></div>
    ${cl.length?`<div class="list-s">${cl.map(c=>`<button class="s-item" data-act="openCoach" data-id="${c.id}" style="border-left-color:var(--accent)"><div><strong><code>${esc(c.eleveLogin)}</code></strong><div class="hint">${esc((ACTIVITES[c.activite]||{}).titre||"")} · séance du ${fmtDate(c.date)}</div></div><span class="chip">Coacher →</span></button>`).join("")}</div>`:`<p class="hint" style="margin:0">Quand un camarade te choisit comme coach, sa séance apparaît ici.</p>`}</section>`;
  if(actsDossiers)return`<div class="stack">${coachH}${vPseudoCard()}${vOutilsGeneraux()}<h2>Mes activités</h2><p class="hint" style="margin:-6px 0 0">Choisis une activité : tu y trouves ton carnet d'entraînement et les fiches de ton enseignant.</p>
  ${actsDossiers.length?`<div class="acts">${actsDossiers.map(d=>`<button class="act-card" data-act="openDossier" data-id="${d.id}"><span class="act-ca">${esc(d.ca||"")}</span><span class="act-t">${esc(d.titre)}</span><span class="act-d">${esc(d.desc||"")}</span><span class="act-go">Ouvrir →</span></button>`).join("")}</div>`:`<div class="card"><p style="margin:0">Ton enseignant n'a pas encore ouvert d'activité pour ta classe.</p></div>`}</div>`;
  return`<div class="stack">${coachH}${vPseudoCard()}${vOutilsGeneraux()}<h2>Mes activités</h2><p class="hint" style="margin:-6px 0 0">Choisis l'activité pour ouvrir ton carnet d'entraînement.</p>
  <div class="acts">${[...Object.entries(ACTIVITES).map(([k,a])=>({id:k,...a})),...actsList].map(a=>`<button class="act-card" data-act="openAct" data-a="${a.id}"><span class="act-ca">${esc(a.ca||"")}</span><span class="act-t">${esc(a.titre)}</span><span class="act-d">${esc(a.desc||"")}</span><span class="act-go">Ouvrir mon carnet →</span></button>`).join("")}</div></div>`}
async function openActs(){RETRY=()=>openActs();dossierCtx=null;COACH=false;coachCtx=null;carnetId=null;data=null;cur=null;MOD=null;PREVIEW=false;go("loading");
  try{coachings=await fb.listCoachings(me.uid)}catch(e){console.error(e);coachings=[]}
  try{const cl=await fb.getClasse(me.classeId);eleveClasse=cl;actsDossiers=await loadClasseDossiers(cl);actsList=actsDossiers?[]:await loadActs(cl)}catch(e){console.error(e);actsList=[];actsDossiers=null}
  try{eleveSessions=await fb.listSessionsActives(me.classeId,me.profId)}catch(e){eleveSessions=[]}go(actsDossiers?"enclasse":"acts")}
let actsDossiers=null;
async function openCoach(id){RETRY=()=>openCoach(id);const c=coachings.find(x=>x.id===id);if(!c)return;go("loading",{msg:"Ouverture de la séance…"});
  try{const sd=await fb.getSeance(c.carnetId,c.sid);if(!sd)throw{code:"not-found"};
    if(c.activite===CA5_ID){MOD=(await ca5Modele(me.profId)).M;ca5Convert(sd)}else{const d=await fb.getModele(c.activite);if(!d)throw{code:"not-found"};MOD=normModele(d.modele||d.brouillon)}gEnsure(MOD,sd);
    COACH=true;RO=false;coachCtx=c;carnetId=c.carnetId;data={profil:blankProfil(),seances:[sd]};cur=sd.id;syncState="ok";chrono.run=false;chrono.acc=0;go("coach")}
  catch(e){console.error(e);toast(e&&e.code==="permission-denied"||e.code==="not-found"?"Cette séance n'est plus disponible : l'élève t'a retiré ou l'a supprimée.":authMsg(e));
    openActs()}}
async function openCarnetEleve(act){RETRY=()=>openCarnetEleve(act);return openCarnetModele(act);go("loading",{msg:"Ouverture du carnet…"});
  try{MOD=null;PREVIEW=false;activite=act;RO=false;carnetId=`${me.uid}_${act}`;
    let c=await fb.getCarnet(carnetId);
    if(!c){const base={eleveUid:me.uid,profId:me.profId,classeId:me.classeId,activite:act,profil:blankProfil()};await fb.createCarnet(carnetId,base);c={id:carnetId,...base}}
    const [ss,cl]=await Promise.all([fb.listSeances(carnetId),fb.getClasse(me.classeId).catch(()=>null)]);
    settings=mergeSettings(cl&&cl.reglages&&cl.reglages[act]);setCarnetData(c,ss);view="seances";cur=null;syncState="ok";go("carnet")}
  catch(e){console.error(e);go("error",{msg:authMsg(e)})}}
function setCarnetData(c,ss){carnetDoc=c;carnetId=c.id;
  data={profil:{...blankProfil(),...(c.profil||{})},seances:ss.slice().sort((a,b)=>(a.ordre||0)-(b.ordre||0))};
  if(!data.profil.rms||!data.profil.rms.length)data.profil.rms=[{nom:"",kg:""}];
  if(MOD)data.seances.forEach(s=>{if(c.activite===CA5_ID||activite===CA5_ID)ca5Convert(s);gEnsure(MOD,s)});
  else data.seances.forEach(s=>{s.autoeval=s.autoeval||{afl2:null,afl3:null};s.real=s.real||{tours:[]};s.real.tours=s.real.tours||[];s.echauffement=s.echauffement||{exos:[],pret:""};s.analyse=s.analyse||{}});
  savedValide=new Set(data.seances.filter(s=>s.valide).map(s=>s.id));dirty.clear();dirtyProfil=false;if(c.groupe)data.seances.forEach(markSynced)}

async function setCoach(s){if(apercuBloque())return;const inp=$("#coach-id"),err=$("#coach-err"),login=String(inp.value||"").trim().toLowerCase();err.textContent="";
  if(!login){err.textContent="Entre l'identifiant de ton coach.";return}
  if(login===String(me.login).toLowerCase()){err.textContent="Tu ne peux pas être ton propre coach.";return}
  try{const l=await fb.getLogin(login);if(!l){err.textContent="Identifiant introuvable dans ta classe.";return}
    s.coachLogin=login;s.coachUid=l.uid;if(MOD)s.coachChamp=gCoachField(MOD,s);dirty.add(s.id);await flush();
    await fb.setCoaching(`${carnetId}__${s.id}`,{coachUid:l.uid,eleveUid:me.uid,eleveLogin:me.login,carnetId,sid:s.id,classeId:me.classeId,activite,date:s.date});
    toast("Coach ajouté : il retrouve ta séance dans « Séances à coacher »");rerenderKeep()}
  catch(e){console.error(e);err.textContent=e&&e.code==="permission-denied"?"Identifiant introuvable dans ta classe.":authMsg(e)}}
async function delCoach(s){const id=`${carnetId}__${s.id}`;s.coachLogin=null;s.coachUid=null;dirty.add(s.id);
  try{await fb.saveSeance(carnetId,s.id,s,false);await fb.deleteCoaching(id)}catch(e){toast(authMsg(e))}rerenderKeep()}

/* ---------- Écrans : prof ---------- */
async function loadClasses(){classes=(await fb.listClasses(me.uid)).sort((a,b)=>String(a.nom).localeCompare(String(b.nom),"fr",{numeric:true}))}
function vClasses(){const year=(()=>{const d=new Date(),y=d.getFullYear();return d.getMonth()>=7?`${y}-${y+1}`:`${y-1}-${y}`})();
  return`<div class="stack"><div class="row"><h2>Mes classes</h2></div>${vEtabNudge()}
  ${classes.length?`<div class="grid-cards">${classes.map(c=>`<button class="class-card" data-act="openClasse" data-id="${c.id}"><span class="cc-n">${esc(c.nom)}</span><span class="hint">${esc(c.annee||"")}</span><span class="chip">${c.nbEleves||0} élève${(c.nbEleves||0)>1?"s":""}</span></button>`).join("")}</div>`:`<div class="card"><p style="margin:0">Aucune classe pour l'instant. Créez votre première classe ci-dessous.</p></div>`}
  <form class="card" id="new-classe"><div class="sec-h"><h3>Nouvelle classe</h3></div>
    <div class="grid2"><label class="f">Nom de la classe<input id="nc-nom" required maxlength="20" placeholder="ex. 1G2"></label><label class="f">Année scolaire<input id="nc-annee" value="${year}" maxlength="12"></label></div>
    <button class="btn primary" type="submit" style="margin-top:10px">Créer la classe</button></form></div>`}
let classeDossiers=null;
async function openClasse(id,tab){RETRY=()=>openClasse(id,tab);go("loading");try{await migrerDossiers();classe=await fb.getClasse(id)||classes.find(c=>c.id===id);classeDossiers=await loadClasseActs(classe);classeActs=classeDossiers?[]:await loadActs(classe);dossiers=(await fb.listDossiers(me.uid)).sort((a,b)=>String(a.titre).localeCompare(String(b.titre),"fr"));eleves=(await fb.listEleves(id)).sort((a,b)=>(a.numero||0)-(b.numero||0));classeTab=tab||classeTab||"activites";if(classeTab==="correction"){await openCorrTab();return}go("classe")}catch(e){go("error",{msg:authMsg(e)})}}
function vClasse(){const c=classe,rep=getReperes(c.id);
  const tabs=`<div class="seg2">${[["activites","Activités"],["correction","✏️ Correction"],["eleves",`Élèves (${eleves.length})`],["vigie","📵 Téléphone"]].map(([k,l])=>`<button data-act="classeTab" data-t="${k}" aria-current="${classeTab===k}">${l}</button>`).join("")}</div>`;
  let body="";
  if(classeTab==="activites"&&classeDossiers)body=vSeanceJourProf()+(classeDossiers.length?classeDossiers.map(({d,carnets,outils})=>`<section class="card"><div class="sec-h"><span class="act-ca">${esc(d.ca||"")}</span><h3>${esc(d.titre)}</h3><span class="spacer"></span><button class="btn ghost small" data-act="openDossierEd" data-id="${d.id}">Modifier</button></div>
      ${carnets.length?`<div class="list-s">${carnets.map(x=>`<button class="s-item" data-act="openSuivi" data-a="${x.id}" style="border-left-color:var(--accent)"><div><strong>📒 ${esc(x.titre)}</strong><div class="hint">${x.pub?"Carnets des élèves et notes":"Pas encore publié"}</div></div><span class="chip">Voir →</span></button>`).join("")}</div>`:""}${(outils||[]).length?`<div class="list-s" style="margin-top:8px">${outils.map(x=>`<button class="s-item" data-act="openOutilProf" data-d="${d.id}" data-o="${x.id}" style="border-left-color:var(--d2)"><div><strong>${OUTILS[x.kind].ic} ${esc(x.titre)}</strong><div class="hint">Réglages, ${x.kind==="feuille"?"poules et séances":"séances"}</div></div><span class="chip">Ouvrir →</span></button>`).join("")}</div>`:""}${!carnets.length&&!(outils||[]).length?'<p class="hint" style="margin:0">Rien dans cette activité.</p>':""}</section>`).join(""):`<div class="card"><p style="margin:0">Aucune activité ouverte pour cette classe.</p></div>`)
    +`<section class="card"><div class="sec-h"><h3>Activités de la classe</h3></div>${dossiers.map(d=>`<label class="row" style="gap:8px;font-weight:600"><input type="checkbox" data-clsdos="${d.id}" ${(classe.dossiers||[]).includes(d.id)?"checked":""} style="width:20px;height:20px"> ${esc(d.titre)}</label>`).join("")||'<p class="hint">Aucune activité.</p>'}
      <div class="row" style="margin-top:8px"><button class="btn small" data-nav="modeles">Gérer mes activités</button></div></section>`;
  else if(classeTab==="activites")body=`<div class="acts">${[...Object.entries(ACTIVITES).map(([k,a])=>({id:k,...a})),...classeActs].map(a=>`<button class="act-card" data-act="openSuivi" data-a="${a.id}"><span class="act-ca">${esc(a.ca||"")}</span><span class="act-t">${esc(a.titre)}</span><span class="act-d">Carnets d'entraînement des élèves et notes.</span><span class="act-go">Voir les carnets →</span></button>`).join("")}</div>
    <section class="card"><div class="row"><div><strong>Une autre activité ?</strong><div class="hint">Créez un carnet avec l'IA à partir de son référentiel, puis activez-le pour cette classe.</div></div><span class="spacer"></span><button class="btn" data-nav="modeles">Mes carnets</button></div></section>`;
  else if(classeTab==="vigie")body=vVgProf();
  else if(classeTab==="correction")body=vCorrTab();
  else body=`<section class="card"><div class="sec-h"><h3>Comptes élèves</h3><span class="spacer"></span>${eleves.length?`<button class="btn small" data-act="copyIds">Copier</button><button class="btn small" data-act="printIds">Imprimer les fiches</button>`:""}</div>
    <p class="hint" style="margin:-4px 0 10px">Distribuez les identifiants aux élèves. La colonne « Nom » reste sur cet appareil : elle n'est jamais envoyée en clair (voir « Noms des élèves » ci-dessous).</p>
    ${eleves.length?`<div class="scroll"><table class="ids"><thead><tr><th>N°</th><th>Identifiant</th><th>Mot de passe</th><th>Nom (cet appareil)</th><th></th></tr></thead><tbody>${eleves.map(e=>`<tr><td>${e.numero}</td><td><code>${esc(e.login)}</code></td><td><code>${esc(e.password)}</code></td><td><input id="rep-${e.id}" data-repere="${e.id}" value="${esc(rep[e.id]||"")}" maxlength="40" style="min-width:140px"></td><td><button class="btn ghost small" data-act="delEleve" data-id="${e.id}" aria-label="Supprimer le compte">✕</button></td></tr>`).join("")}</tbody></table></div>`:`<p class="hint">Aucun élève dans cette classe.</p>`}
    <form id="add-eleves" class="row" style="margin-top:12px;align-items:end"><label class="f" style="width:150px">Nombre de comptes<input id="ae-n" type="number" min="1" max="40" value="${eleves.length?1:30}"></label><button class="btn primary" type="submit">Créer les comptes</button></form>
    <div id="ae-prog" class="hint" style="margin-top:8px"></div></section>
    ${eleves.length?vNomsCard():""}
    ${eleves.length?"":`<button class="btn danger small" data-act="delClasse">Supprimer la classe</button>`}`;
  return`<div class="stack"><div class="row"><button class="btn ghost small" data-nav="classes">← Mes classes</button><span class="spacer"></span><button class="btn small" data-act="vueEleve">👁 Vue élève</button></div>
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

async function openSuivi(act){RETRY=()=>openSuivi(act);dossierCtx=null;go("loading",{msg:"Chargement des carnets…"});
  try{activite=act;PREVIEW=false;MOD=null;if(act===CA5_ID){const r=await ca5Modele(me.uid);MODDOC=r.doc;MOD=r.M}else{const d=await fb.getModele(act);if(!d)throw{code:"not-found"};MODDOC=d;MOD=normModele(d.modele||d.brouillon)}MODBASE=MOD;const cs=await fb.listCarnets(me.uid,classe.id,act);
    const withS=await Promise.all(cs.map(async c=>({c,ss:(await fb.listSeances(c.id)).map(x=>{if(act===CA5_ID)ca5Convert(x);gEnsure(MOD,x);return x})})));
    CORRS={};CORR=null;try{(await fb.listCorrections(me.uid,classe.id,act)).forEach(c=>CORRS[c.id]=c)}catch(e){console.warn(e)}
    await qsLoad(act);
    suivi={act,rows:eleves.map(e=>{const f=withS.find(x=>x.c.eleveUid===e.id||(x.c.membres||[]).includes(e.id));return{e,c:f&&f.c,ss:f&&f.ss}})};
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
function openEleve(i){const r=suivi.rows[i];if(!r||!r.c)return;RO=true;MOD=modFor(MODBASE,r.e.id);setCarnetData({...r.c,_login:`N°${r.e.numero} · ${r.e.login}`},r.ss);r.ss=data.seances;suivi.cur=i;view="seances";cur=null;go("carnet")}
function vAfl3Prof(){const a3=a3Of(carnetDoc,suivi&&suivi.rows[suivi.cur]?suivi.rows[suivi.cur].e.id:null),m3=REPART[data.profil.repartition||"4-4"][1];
  return`<section class="card" style="margin-top:14px"><div class="sec-h"><h3>AFL3 · votre évaluation</h3><span class="spacer"></span>${a3?stamp(a3):""}</div>
  <div class="lvls">${[1,2,3,4].map(d=>`<button class="lvl d${d}${a3===d?" on":""}" data-act="setA3" data-d="${d}"><b>D${d}</b><span>${esc(AFL3_LABELS[d])}</span></button>`).join("")}</div>
  <p class="hint" style="margin:8px 0 0">${a3?`${fmtN(m3*a3/4)} / ${m3} points.`:`Sur ${m3} points selon la répartition de l'élève.`}</p></section>`}
const a3Of=(c,uid)=>c?(c.groupe?(c.afl3Profs||{})[uid]||null:c.afl3Prof||null):null;
async function setAfl3(d,idx){const r=idx!==undefined?suivi.rows[idx]:suivi.rows[suivi.cur];if(!r||!r.c)return;
  try{if(r.c.groupe){const m={...(r.c.afl3Profs||{}),[r.e.id]:d};await fb.updateCarnet(r.c.id,{afl3Profs:m});r.c.afl3Profs=m;if(carnetDoc&&carnetDoc.id===r.c.id)carnetDoc.afl3Profs=m}
    else{await fb.updateCarnet(r.c.id,{afl3Prof:d});r.c.afl3Prof=d;if(carnetDoc&&carnetDoc.id===r.c.id)carnetDoc.afl3Prof=d}toast("AFL3 enregistré");rerenderKeep()}catch(e){toast(authMsg(e))}}
function exportCSV(){const L=[["N°","Identifiant","Séances validées","AFL1 /12","AFL2","AFL2 max","AFL3 degré","AFL3","AFL3 max","Total /20"]];
  suivi.rows.forEach(r=>{const S=rowStats(r);L.push([r.e.numero,r.e.login,S?S.nv:0,S&&S.f?S.f.note:"",S?S.a2.pts:"",S?S.a2.max:"",r.c&&r.c.afl3Prof||"",S&&S.a3!==null?S.a3:"",S?S.m3:"",S&&S.tot!==null?S.tot:""])});
  const csv="﻿"+L.map(r=>r.map(v=>`"${typeof v==="number"?String(v).replace(".",","):String(v??"").replace(/"/g,'""')}"`).join(";")).join("\n");
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download=`Notes_${slug(classe.nom)}_${suivi.act}.csv`;document.body.appendChild(a);a.click();a.remove()}

/* ---------- Écrans : développeur et compte ---------- */
async function openDev(){RETRY=()=>openDev();go("loading");try{[demandes,profs,ET.tous]=await Promise.all([fb.listDemandes(),fb.listProfs(),fb.listEtabs().catch(()=>[])]);go("dev")}catch(e){go("error",{msg:authMsg(e)})}}
const tsDate=t=>{try{const d=t&&t.toDate?t.toDate():t?new Date(t):null;return d?d.toLocaleDateString("fr-FR"):""}catch(e){return""}};
function vDev(){const nv=demandes.filter(d=>d.statut==="nouvelle");
  return`<div class="stack"><h2>Espace développeur</h2>
  <section class="card"><div class="sec-h"><h3>Demandes d'accès</h3><span class="chip">${nv.length} nouvelle${nv.length>1?"s":""}</span></div>
    ${demandes.length?demandes.sort((a,b)=>(a.statut==="nouvelle"?0:1)-(b.statut==="nouvelle"?0:1)).map(d=>`<div class="dem${d.statut==="nouvelle"?"":" done"}"><div><strong>${esc(d.email)}</strong> <span class="hint">· ${esc(tsDate(d.createdAt))}</span><div>${esc(d.etablissement)}</div>${d.message?`<div class="hint">${esc(d.message)}</div>`:""}</div>
      <div class="row">${d.statut==="nouvelle"?`<button class="btn primary small" data-act="createProf" data-id="${d.id}">Créer le compte</button><button class="btn ghost small" data-act="refuseDem" data-id="${d.id}">Refuser</button>`:`<span class="chip">${d.statut==="traitee"?"Compte créé":"Refusée"}</span><button class="btn ghost small" data-act="delDem" data-id="${d.id}" aria-label="Supprimer">✕</button>`}</div></div>`).join(""):`<p class="hint" style="margin:0">Aucune demande.</p>`}</section>
  <form class="card" id="new-prof"><div class="sec-h"><h3>Créer un compte prof</h3></div>
    <div class="row" style="align-items:end"><label class="f" style="flex:1;min-width:200px">E-mail du professeur<input id="np-email" type="email" required></label><button class="btn primary" type="submit">Créer</button></div></form>
  <section class="card"><div class="sec-h"><h3>Professeurs</h3><span class="chip">${profs.length}</span></div>
    ${profs.map(p=>`<div class="dem"><div><strong>${esc(p.email||"")}</strong> <span class="hint">· ${ROLE_LABEL[p.role]} · ${esc(tsDate(p.createdAt))}</span></div></div>`).join("")}</section>
  <section class="card"><div class="sec-h"><h3>🏫 Établissements</h3><span class="chip">${(ET.tous||[]).length}</span></div>
    ${(ET.tous||[]).map(x=>`<div class="dem"><div><strong>${esc(x.nom)}</strong> <span class="hint">· ${esc(x.commune||"")} · ${(x.profs||[]).length} prof${(x.profs||[]).length>1?"s":""} · admin : ${esc((x.admins||[]).map(u=>(x.emails||{})[u]).filter(Boolean).join(", "))}</span></div></div>`).join("")||'<p class="hint" style="margin:0">Aucun établissement.</p>'}</section></div>`}
async function createProf(email,demId){email=String(email||"").trim().toLowerCase();if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){toast("E-mail invalide");return}
  const pwd=genPwdProf();go("loading",{msg:"Création du compte…"});
  try{const uid=await fb.createAccount(email,pwd);await fb.setUser(uid,{role:"prof",email});if(demId)await fb.updateDemande(demId,{statut:"traitee"});
    await openDev();const url=location.origin+location.pathname;
    const msg=`Bonjour,\n\nVotre accès au Carnet d'entraînement EPS est prêt.\nAdresse : ${url}\nIdentifiant : ${email}\nMot de passe provisoire : ${pwd}\n\nPensez à le changer dans « Mon compte » après votre première connexion.`;
    openModal(`<h3>Compte prof créé</h3><p style="margin:0">Envoyez ces identifiants au professeur :</p><textarea id="m-msg" readonly style="min-height:190px">${esc(msg)}</textarea><div class="grid2"><button class="btn primary" data-mact="copyMsg">Copier le message</button><button class="btn" data-mact="close">Fermer</button></div>`,{type:"msg"})}
  catch(e){console.error(e);await openDev();toast(authMsg(e))}}
function vCompte(){return`<div class="stack"><h2>Mon compte</h2>
  <section class="card"><div class="row"><span class="chip">${ROLE_LABEL[me.role]}</span><strong>${esc(me.email||"")}</strong></div></section>
  ${vEtabCard()}
  <form class="card stack" id="chg-pwd" style="gap:10px"><h3>Changer mon mot de passe</h3>
    <label class="f">Nouveau mot de passe<input id="cp-1" type="password" minlength="8" autocomplete="new-password" required></label>
    <label class="f">Confirmer<input id="cp-2" type="password" minlength="8" autocomplete="new-password" required></label>
    <div class="err" id="cp-err"></div><button class="btn primary" type="submit">Enregistrer</button></form>
  <form class="card stack" id="ia-key" style="gap:10px"><div class="row"><h3>Mon quota IA personnel</h3><span class="spacer"></span><span class="chip" style="${IAKEY?"border-color:var(--d4);color:var(--d4)":""}">${IAKEY?"✓ Clé personnelle active":"Quota partagé"}</span></div>
    <p class="hint" style="margin:0">Par défaut, l'IA utilise un quota gratuit partagé entre tous les profs de l'appli. Avec votre propre clé Gemini (gratuite, sans carte bancaire), vous avez votre quota rien qu'à vous.</p>
    <ol class="hint" style="margin:0;padding-left:20px"><li>Ouvrez <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">aistudio.google.com/apikey</a> avec votre compte Google.</li><li>Cliquez sur « Create API key » et copiez la clé.</li><li>Collez-la ci-dessous. Elle est enregistrée dans votre compte, visible de vous seul.</li></ol>
    <label class="f">Clé Gemini<input id="ik-val" type="password" autocomplete="off" placeholder="${IAKEY?"•••••••• (clé enregistrée)":"AIza…"}"></label>
    <div class="err" id="ik-err"></div>
    <div class="row"><button class="btn primary" type="submit">Vérifier et enregistrer</button>${IAKEY?`<button class="btn danger" type="button" data-act="delIaKey">Retirer ma clé</button>`:""}</div></form></div>`}

/* ---------- Fenêtres ---------- */
$("#modal").addEventListener("click",async e=>{if(e.target.id==="modal"){closeModal();return}
  const b=e.target.closest("[data-mact]");if(!b)return;const a=b.dataset.mact,c=modalCtx;
  if(a==="close"){closeModal();return}
  if(a==="vgVu"){closeModal();vgVu(b.dataset.id);return}
  if(a==="copyMsg"){try{await navigator.clipboard.writeText($("#m-msg").value);toast("Message copié")}catch(err){$("#m-msg").select()}return}
  if(a==="sendDem"){const email=$("#d-email").value.trim(),eta=$("#d-eta").value.trim(),msg=$("#d-msg").value.trim();
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)||!eta){$("#m-err").textContent="Indiquez votre e-mail et votre établissement.";return}
    try{await fb.createDemande({email,etablissement:eta.slice(0,190),message:msg.slice(0,990)});closeModal();toast("Demande envoyée. Vous recevrez vos identifiants par e-mail.")}catch(err){$("#m-err").textContent=authMsg(err)}return}
  if(a==="sendReset"){const email=$("#r-email").value.trim();try{await fb.resetPassword(email);closeModal();toast("Si ce compte existe, un e-mail de réinitialisation a été envoyé.")}catch(err){$("#m-err").textContent=authMsg(err)}return}
  if(a==="devCreate"){const p1=$("#dv-1").value,p2=$("#dv-2").value;if(p1.length<8||p1!==p2){$("#m-err").textContent="Mot de passe de 8 caractères minimum, identique dans les deux champs.";return}
    try{await fb.signUpSelf(DEV_EMAIL,p1);closeModal()}catch(err){$("#m-err").textContent=authMsg(err)}return}
  if(a==="confirm"&&c&&c.run){b.disabled=true;await c.run();return}
  const s=curS();
  if(gModalAction(a,b,c,s))return;
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
  if(v==="logout"&&VUE){quitterVueEleve();return}
  if(v==="logout"){await flush();if(watchUnsub){watchUnsub();watchUnsub=null;watchKey=null}RO=false;COACH=false;MOD=null;PREVIEW=false;carnetId=null;data=null;await fb.signOut();return}
  if(v==="home"){location.replace(location.pathname+"?r="+Date.now());return}
  if(v==="acts"){await flush();dossierCtx=null;openActs();return}
  if(v==="corrExit"){corrExit();return}
  if(v==="suivi"){RO=false;carnetId=null;cur=null;go("suivi");return}
  if(v==="modeles"){PREVIEW=false;openDossiers();return}
  if(v==="dossier"){await flush();if(watchUnsub){watchUnsub();watchUnsub=null;watchKey=null}if(dossierCtx)openDossier(dossierCtx.id);else openActs();return}
  if(v==="classes"){PREVIEW=false;MOD=null;go("loading");try{await loadClasses();go("classes")}catch(err){go("error",{msg:authMsg(err)})}return}
  if(v==="dev"){openDev();return}
  if(v==="compte"){go("compte");return}
  if(v==="stock"){openStock();return}
  if(v==="accueilEl"){openProfAccueil();return}});
$("#tabs").addEventListener("click",e=>{const b=e.target.closest("button[data-view]");if(!b)return;if(b.dataset.view==="fiches")openFiches();else setView(b.dataset.view)});
const main=$("#main");
function onField(e){const el=e.target;
  if(el.dataset.co!==undefined||el.dataset.cc!==undefined){coField(el,e);return}
  if(el.dataset.vg!==undefined){vgField(el,e);return}
  if(corrField(el,e)||sbxField(el,e)||mbField(el,e))return;
  if(el.dataset.repere!==undefined){const r=getReperes(classe.id);r[el.dataset.repere]=el.value.slice(0,40);store(reperesKey(classe.id),r);etPushSoon(classe.id);return}
  if(el.dataset.a3!==undefined){if(e.type==="change")setAfl3(el.value?+el.value:null,+el.dataset.a3);return}
  if(el.dataset.set){if(route.name!=="suivi")return;const st=settings;if(el.dataset.set==="tol")st.tol=num(el.value)||5;else{const[t,p,i]=el.dataset.set.split(".");const v=num(el.value);if(!isNaN(v))st.themes[t][p][+i]=v}
    if(e.type==="change"){saveReglages();rerenderKeep()}return}
  if(el.dataset.dos!==undefined){if(e.type==="change"){const v=el.value.trim();if(el.dataset.dos==="titre"&&!v)return;saveDossier({[el.dataset.dos]:v}).then(()=>{if(el.dataset.dos!=="desc")rerenderKeep()})}return}
  if(el.dataset.pa!==undefined){if(e.type==="change"&&PA){paField(el.dataset.pa,el.type==="color"?el.value:el.value);if(el.type!=="color")rerenderKeep()}return}
  if(el.id==="sj-d"){if(e.type==="change"){SJ.d=el.value;rerenderKeep()}return}
  if(el.dataset.flj!==undefined){FL.joueurs[+el.dataset.flj]=el.value.slice(0,20);lsSet("feuilleLocale",FL);return}
  if(el.dataset.flt!==undefined){if(e.type==="change"){FL.cfg.terrains=parseInt(el.value)||2;delete FL.M.cfg_0;lsSet("feuilleLocale",FL)}return}
  if(el.dataset.flc!==undefined){if(e.type==="change")flCfg(el.dataset.flc,el.value);return}
  if(el.dataset.ms!==undefined){if(e.type==="change")saveScore(el);return}
  if(el.dataset.ter!==undefined){if(e.type==="change"&&FE)matchSet(FE.S.id,"cfg_"+el.dataset.ter,{terrains:parseInt(el.value)||1}).catch(x=>toast(authMsg(x)));return}
  if(el.dataset.cfg!==undefined){if(e.type==="change")feuilleCfgChange(el.dataset.cfg,el.dataset.k2,el.value);return}
  if(el.dataset.aff!==undefined){if(e.type==="change"&&OP&&OP.draft){OP.draft.aff[el.dataset.aff]=parseInt(el.value)||0;rerenderKeep()}return}
  if(el.id==="op-nbp"){if(e.type==="change"&&OP&&OP.draft){OP.draft.nbP=Math.max(1,Math.min(10,parseInt(el.value)||1));rerenderKeep()}return}
  if(el.id==="op-date"){if(OP&&OP.draft)OP.draft.date=el.value;return}
  if(el.dataset.outilTitre!==undefined){if(e.type==="change"){const t=el.value.trim().slice(0,40);if(!t)return;const it=(dossier.items||[]).map(x=>x.id===el.dataset.outilTitre?{...x,titre:t}:x);const di=dossierItems.find(x=>x.id===el.dataset.outilTitre);if(di)di.titre=t;dosItems(it).then(()=>toast("Nom enregistré"))}return}
  if(el.dataset.clsdos!==undefined){if(e.type==="change"){const ds=new Set(classe.dossiers||[]);el.checked?ds.add(el.dataset.clsdos):ds.delete(el.dataset.clsdos);fb.updateClasse(classe.id,{dossiers:[...ds]}).then(()=>{classe.dossiers=[...ds];const c=classes.find(x=>x.id===classe.id);if(c)c.dossiers=classe.dossiers;openClasse(classe.id,"activites")}).catch(x=>toast(authMsg(x)))}return}
  if(el.dataset.doscls!==undefined){if(e.type==="change")toggleDossierClasse(el.dataset.doscls,el.checked);return}
  if(el.dataset.ficheTitre!==undefined){if(e.type==="change"){const t=el.value.trim().slice(0,80);const f=fiches.find(x=>x.id===el.dataset.ficheTitre);if(f&&t){f.titre=t;const di=dossierItems.find(x=>x.id===f.id);if(di)di.titre=t;fb.updateFiche(f.id,{titre:t}).then(()=>toast("Titre enregistré")).catch(x=>toast(authMsg(x)))}}return}
  if(crField(el,e))return;
  if(mField(el,e)){liveSoon();return}
  if(el.dataset.actcls!==undefined){if(e.type==="change")toggleActivite(el.dataset.actcls,el.checked);return}
  if(!el.dataset.k||RO||(route.name!=="carnet"&&route.name!=="modele"))return;
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
  if(f.id==="fiche-form"){if(!ficheBusy)deposerFiches();return}
  if(f.id==="actu-form"){const d={profId:me.uid,type:$("#au-type").value,titre:$("#au-t").value.trim().slice(0,60),date:$("#au-date").value,lieu:$("#au-lieu").value.trim().slice(0,60),lien:$("#au-lien").value.trim().slice(0,300),classes:[...document.querySelectorAll(".au-cls:checked")].map(x=>x.value),inscription:!!($("#au-ins")||{}).checked,portee:($("#au-portee")||{}).value==="etab"&&ET.etab?"etab":"classes",etabId:ET.etab?ET.etab.id:""};if(d.portee==="etab")d.classes=[];
    if(!d.titre||!d.date)return;if(d.lien&&!/^https?:\/\//.test(d.lien)){toast("Le lien doit commencer par https://");return}
    try{if(PA.edit){await fb.updateActu(PA.edit,d);d.id=PA.edit;PA.actus=PA.actus.map(x=>x.id===d.id?d:x);PA.edit=null;toast("Actualité modifiée")}
      else{d.id=await fb.createActu(d);PA.actus.push(d);toast("Actualité publiée — vous pouvez en ajouter une autre")}
      PA.actus.sort((a,b)=>String(a.date).localeCompare(String(b.date)));rerenderKeep()}catch(x){toast(authMsg(x))}return}
  if(f.id==="new-dossier"){const t=$("#nd-t").value.trim();if(!t)return;try{const id=await fb.createDossier({profId:me.uid,titre:t,ca:$("#nd-ca").value,desc:"",items:[]});openDossierEd(id)}catch(x){toast(authMsg(x))}return}
  if(f.id==="gen-form"){if(!iaBusy)iaGenerer();return}
  if(f.id==="ia-key"){const v=$("#ik-val").value.trim(),err=$("#ik-err"),btn=f.querySelector("button[type=submit]");err.textContent="";if(!v){err.textContent="Collez votre clé.";return}
    btn.disabled=true;btn.textContent="Vérification…";
    try{const ia=await import("./ia.js?v=2026.11.21-15");await ia.testerCle(v);await fb.setPrefs(me.uid,{geminiKey:v});IAKEY=v;toast("Clé personnelle enregistrée");render()}
    catch(x){btn.disabled=false;btn.textContent="Vérifier et enregistrer";err.textContent=/40[013]|API key|API_KEY/i.test(String(x&&x.message))?"Cette clé est refusée par Google. Vérifiez qu'elle est complète.":/429|quota/i.test(String(x&&x.message))?"Clé valide mais quota déjà atteint aujourd'hui.":authMsg(x)}return}
  if(f.id==="new-prof"){createProf($("#np-email").value);return}
  if(f.id==="chg-pwd"){const a=$("#cp-1").value,b=$("#cp-2").value,err=$("#cp-err");if(a!==b){err.textContent="Les deux mots de passe sont différents.";return}
    try{await fb.changePassword(a);f.reset();err.textContent="";toast("Mot de passe modifié")}catch(x){err.textContent=authMsg(x)}return}});
main.addEventListener("click",e=>{const o=e.target.closest("[data-open]");if(o){cur=o.dataset.open;render();window.scrollTo(0,0);return}
  const b=e.target.closest("[data-act]");if(!b)return;if(b.dataset.act==="openEleve"&&e.target.closest(".noclk"))return;
  const a=b.dataset.act,i=+b.dataset.i;
  if(a==="retryNow"){retryNow();return}
  if(a==="iaStop"){import("./ia.js?v=2026.11.21-15").then(ia=>ia.annulerIA()).catch(()=>{});return}
  if(/^(cr|mAddBloc|mPaste)/.test(a)&&crClick(a,b))return;
  if(/^(co|cc)[A-Z]/.test(a)&&coClick(a,b))return;
  if(/^cp[A-Z]/.test(a)&&cpClick(a,b))return;
  if(/^vg[A-Z]/.test(a)&&vgClick(a,b))return;
  if(/^qe[A-Z]/.test(a)&&qeClick(a,b))return;
  if(/^qv[A-Z]/.test(a)&&qvClick(a,b))return;
  if(/^ff[A-Z]/.test(a)&&ffClick(a,b))return;
  if(a==="mCalcAbove"&&modeleEdit){mCalcAbove(+b.dataset.si,+b.dataset.fi);return}
  if(a==="qOpenEd"){openQcmEd(b.dataset.id||null);return}
  if(a==="qOpen"){openQcmEleve(b.dataset.id);return}
  if(/^(corr|cx|cView)/.test(a)&&corrClick(a,b))return;
  if(/^sbx[A-Z]/.test(a)&&sbxClick(a,b))return;
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
  if(a==="classeTab"){if(b.dataset.t==="correction"){openCorrTab();return}classeTab=b.dataset.t;render();return}
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
  if(a==="gExport"){gExportCSV();return}
  if(a==="delIaKey"){fb.setPrefs(me.uid,{geminiKey:""}).then(()=>{IAKEY="";toast("Clé retirée : retour au quota partagé");render()}).catch(x=>toast(authMsg(x)));return}
  if(a==="resetSettings"){settings=clone(DEF_SETTINGS);saveReglages();render();return}
  if(a==="setA3"){setAfl3(+b.dataset.d);return}
  if(a==="unlock"){const s=curS();confirmBox("Déverrouiller la séance ?","L'élève pourra de nouveau la modifier, puis devra la valider à nouveau.","Déverrouiller",async()=>{
      try{await fb.setSeanceValide(carnetId,s.id,false);s.valide=false;savedValide.delete(s.id);closeModal();toast("Séance déverrouillée");render()}catch(x){closeModal();toast(authMsg(x))}});return}
  // Développeur
  if(a==="createProf"){const d=demandes.find(x=>x.id===b.dataset.id);if(d)createProf(d.email,d.id);return}
  if(a==="refuseDem"){fb.updateDemande(b.dataset.id,{statut:"refusee"}).then(openDev).catch(x=>toast(authMsg(x)));return}
  if(a==="delDem"){fb.deleteDemande(b.dataset.id).then(openDev).catch(x=>toast(authMsg(x)));return}
  // Carnet (élève)
  if(a==="showFiche"){showFiche(b.dataset.id);return}
  if(a==="ficheUp"||a==="ficheDown"){ficheMove(i,a==="ficheUp"?-1:1);return}
  if(a==="ficheDel"){const f=fiches.find(x=>x.id===b.dataset.id);if(!f)return;confirmBox("Supprimer cette fiche ?",`« ${esc(f.titre)} » ne sera plus visible par les élèves.`,"Supprimer",async()=>{try{await fb.deleteFiche(f.id,f.nb);closeModal();await loadFiches(true);toast("Fiche supprimée");rerenderKeep()}catch(x){closeModal();toast(authMsg(x))}},true);return}
  if(a==="openCa5"||(a==="openModele"&&b.dataset.id===CA5_ID)){openCa5();return}
  if(a==="openModele"){(async()=>{go("loading");try{await loadClasses();const d=await fb.getModele(b.dataset.id);if(!d)throw{code:"not-found"};startEditor(d)}catch(x){go("error",{msg:authMsg(x)})}})();return}
  if(a==="backModeles"){if(modeleEdit&&modeleEdit.dirty){confirmBox("Quitter sans enregistrer ?","Les modifications de ce carnet seront perdues.","Quitter",async()=>{closeModal();leaveEditor()},true);return}leaveEditor();return}
  if(a==="saveModele"){saveModele();return}
  // Dossiers d'activité
  if(a==="openDossier"){openDossier(b.dataset.id);return}
  if(a==="openDossierEd"){openDossierEd(b.dataset.id);return}
  if(a==="dosGen"){dosGen=dosGen?false:"ref";rerenderKeep();return}
  if(a==="dosAddCa5"){(async()=>{await dosAddCarnet(CA5_ID);openDossierEd(dossier.id)})();return}
  if(a==="dosUp"||a==="dosDown"){const it=[...(dossier.items||[])],j=i+(a==="dosUp"?-1:1);if(j<0||j>=it.length)return;[it[i],it[j]]=[it[j],it[i]];[dossierItems[i],dossierItems[j]]=[dossierItems[j],dossierItems[i]];dosItems(it);rerenderKeep();return}
  if(a==="dosDel"){const x=dossierItems[i];if(!x)return;if(x.t==="qcm"){openQcmEd(x.id);return}
    confirmBox(x.t==="fiche"?"Supprimer cette fiche ?":"Retirer ce carnet de l'activité ?",x.t==="fiche"?`« ${esc(x.titre)} » ne sera plus visible par les élèves.`:`« ${esc(x.titre)} » n'apparaîtra plus dans l'activité. Les carnets déjà remplis par les élèves sont conservés.`,x.t==="fiche"?"Supprimer":"Retirer",async()=>{
      try{if(x.t==="fiche")await fb.deleteFiche(x.id,x.f.nb);await dosItems((dossier.items||[]).filter(y=>y.id!==x.id));closeModal();openDossierEd(dossier.id)}catch(y){closeModal();toast(authMsg(y))}},true);return}
  if(a==="dosDelete"){confirmBox("Supprimer cette activité ?","Le dossier, ses fiches et ses carnets seront supprimés et retirés de vos classes. Les carnets déjà remplis par les élèves restent en base.","Supprimer",async()=>{
      try{for(const c of classes){if((c.dossiers||[]).includes(dossier.id)){const ds=c.dossiers.filter(x=>x!==dossier.id);await fb.updateClasse(c.id,{dossiers:ds});c.dossiers=ds}}
        for(const x of dossierItems){if(x.t==="fiche")await fb.deleteFiche(x.id,x.f.nb).catch(()=>{});else if(x.id!==CA5_ID)await fb.deleteModele(x.id).catch(()=>{})}
        await fb.deleteDossier(dossier.id);closeModal();dossierCtx=null;openDossiers()}catch(y){closeModal();toast(authMsg(y))}},true);return}
  // Espace élève
  if(a==="vueEleve"){entrerVueEleve();return}
  if(a==="vueQuit"){quitterVueEleve();return}
  if(a==="shTab"){shTab(b.dataset.t);return}
  if(a==="shConseils"){go("conseils");return}
  if(a==="shActus"){go("actus");return}
  if(a==="shDefi"){toggleDefi(b.dataset.id);return}
  if(a==="shDefiNav"){DI+=+b.dataset.d;rerenderKeep();return}
  if(a==="ecFold"){ecFold[b.dataset.k]=!ecFold[b.dataset.k];rerenderKeep();return}
  if(a==="dosTab"){dosTab=b.dataset.t;rerenderKeep();return}
  if(a==="openBilan"){openCarnetEleve(b.dataset.a).then(()=>{if(route.name==="carnet"&&MOD){view="bilan";render()}});return}
  if(a==="paDefiAdd"||a==="paDefiDel"||a==="paDefiRel"){paDefi(a,b.dataset.id);return}
  if(a==="paEditActu"){PA.edit=b.dataset.id;rerenderKeep();setTimeout(()=>{const f=$("#actu-form");if(f)f.scrollIntoView({behavior:"smooth",block:"center"})},30);return}
  if(a==="paCancelActu"){PA.edit=null;rerenderKeep();return}
  if(a==="acSave"){saveActivite();return}
  if(a==="avPick"){savePseudoAvatar(b.dataset.v);return}
  if(a==="sjOpen"){sjOpen(b.dataset.d,b.dataset.id,b.dataset.t);return}
  if(a==="sjFeuille"){openFeuille(b.dataset.id);return}
  // Prof : accueil élèves et séance du jour
  if(a==="paSave"){(async()=>{try{await fb.setProfCfg(me.uid,PA.pc);toast("Barème enregistré");rerenderKeep()}catch(x){toast(authMsg(x))}})();return}
  if(a==="paDelActu"){confirmBox("Supprimer cette actualité ?","Elle ne sera plus affichée aux élèves.","Supprimer",async()=>{try{await fb.deleteActu(b.dataset.id);PA.actus=PA.actus.filter(x=>x.id!==b.dataset.id);closeModal();rerenderKeep()}catch(x){closeModal();toast(authMsg(x))}},true);return}
  if(a==="sjSave"){(async()=>{const did=$("#sj-d").value,dd=(classeDossiers||[]).find(x=>x.d.id===did);if(!dd)return;const ids=[...document.querySelectorAll(".sj-it:checked")].map(x=>x.value);
      const items=dd.all.filter(x=>ids.includes(x.id)).map(x=>({id:x.id,t:x.t,titre:x.titre,...(x.kind?{kind:x.kind}:{})}));const old=classe.seanceJour&&classe.seanceJour.date===today()?classe.seanceJour:null,autres=old?(old.items||[]).filter(x=>x.d&&x.d!==did&&x.t==="qcm"):[];
      const sj={date:today(),dossierId:did,titre:dd.d.titre,items:[...items,...autres],qcms:[...items,...autres].filter(x=>x.t==="qcm").map(x=>x.id)};
      if(old&&old.versions)sj.versions=old.versions;try{await verRepartir(sj,dd)}catch(x){console.warn(x)}
      try{await fb.updateClasse(classe.id,{seanceJour:sj});classe.seanceJour=sj;toast("Séance d'aujourd'hui affichée aux élèves");rerenderKeep()}catch(x){toast(authMsg(x))}})();return}
  if(a==="sjClear"){(async()=>{try{await fb.updateClasse(classe.id,{seanceJour:null});classe.seanceJour=null;rerenderKeep()}catch(x){toast(authMsg(x))}})();return}
  // Outils généraux
  if(a==="toolScoreur"){openScoreur({cfg:lsGet("scoreurCfg",CFG_DEF),reglable:true});return}
  if(a==="toolFeuille"){openFeuilleLocale();return}
  if(a==="flBack"){FE=null;openActs();return}
  if(a==="flAdd"){if(FL.joueurs.length<8){FL.joueurs.push("");lsSet("feuilleLocale",FL);rerenderKeep()}return}
  if(a==="flDel"){if(FL.joueurs.length>3){const n=FL.joueurs.length;FL.joueurs.splice(i,1);if(Array.isArray(FL.src))FL.src.splice(i,1);FL.M={};lsSet("feuilleLocale",FL);rerenderKeep();if(Object.keys(FL.M).length===0&&n)toast("Liste des joueurs modifiée")}return}
  if(a==="flStart"){FL.etape="feuille";lsSet("feuilleLocale",FL);render();window.scrollTo(0,0);return}
  if(a==="flEdit"){FL.etape="reglages";lsSet("feuilleLocale",FL);render();return}
  if(a==="flReset"){confirmBox("Nouveau tournoi ?","Les scores de cette feuille seront effacés.","Effacer",async()=>{closeModal();FL.M={};FL.etape="reglages";lsSet("feuilleLocale",FL);render()},true);return}
  // Outils
  if(a==="psSave"){savePseudo();return}
  if(a==="openOutil"){const x=dossierItems.find(y=>y.id===b.dataset.id);if(x)ouvrirOutilEleve(x);return}
  if(a==="feuilleBack"){if(matchUnsub){matchUnsub();matchUnsub=null}FE=null;if(dossierCtx)openDossier(dossierCtx.id);else openActs();return}
  if(a==="scoreLibre"){openScoreur({cfg:FE?cfgFor({},null,FE.S):OP?cfgFor(OP.item,OP.cls,null):CFG_DEF,reglable:!!(FE&&FE.local)});return}
  if(a==="arbitrer"){if(!FE)return;const pi=+b.dataset.pi,x=b.dataset.a,y=b.dataset.b;openScoreur({a:nomDe(x,FE.S.noms),b:nomDe(y,FE.S.noms),cfg:cfgFor({},null,FE.S),ctx:{sid:FE.S.id,key:mKey(pi,x,y),a:x,b:y,pi}});return}
  if(a==="openOutilProf"){openOutilProf(classe.id,b.dataset.d,b.dataset.o);return}
  if(a==="opBack"){if(matchUnsub){matchUnsub();matchUnsub=null}FE=null;const c=OP.cls.id;OP=null;openClasse(c,"activites");return}
  if(a==="opAuto"||a==="opMix"){opAuto(a==="opMix");return}
  if(a==="opOpen"){opOpen();return}
  if(a==="opNew"){if(matchUnsub){matchUnsub();matchUnsub=null}FE=null;OP.draft=newDraft();render();return}
  if(a==="opHist"){const s=OP.sessions.find(z=>z.id===b.dataset.id);if(s)openFeuilleProf(s);return}
  if(a==="opClose"){confirmBox("Clôturer la séance ?","Les élèves ne pourront plus modifier les scores. Vous pourrez la rouvrir.","Clôturer",async()=>{try{await fb.updateSession(FE.S.id,{active:false});FE.S.active=false;closeModal();toast("Séance clôturée");render()}catch(x){closeModal();toast(authMsg(x))}});return}
  if(a==="opReopen"){(async()=>{try{for(const s of OP.sessions.filter(z=>z.active&&z.id!==FE.S.id)){await fb.updateSession(s.id,{active:false});s.active=false}await fb.updateSession(FE.S.id,{active:true});FE.S.active=true;toast("Séance rouverte");render()}catch(x){toast(authMsg(x))}})();return}
  if(a==="opSaveCls"){(async()=>{try{const m={...(OP.cls.outilsCfg||{}),[OP.item.id]:OP.cfgCls};await fb.updateClasse(OP.cls.id,{outilsCfg:m});OP.cls.outilsCfg=m;toast("Réglages enregistrés pour la classe")}catch(x){toast(authMsg(x))}})();return}
  if(a==="dosAddOutil"){const k=b.dataset.k;(async()=>{const id="o_"+Math.random().toString(36).slice(2,9);try{if(k==="co")await fb.setOrient(id,{profId:me.uid,...normCo(CO_DEF)});await dosItems([...(dossier.items||[]),{t:"outil",id,kind:k,titre:OUTILS[k].nom,...(k==="co"?{}:{cfg:CFG_DEF})}]);if(k==="co"){await openDossierEd(dossier.id);openCoCfg(id)}else openDossierEd(dossier.id)}catch(x){toast(authMsg(x))}})();return}
  // Stock
  if(a==="stockDos"){stockDos=b.dataset.k;stockOpen=null;ficheOpen=null;render();window.scrollTo(0,0);return}
  if(a==="stockBack"){stockDos=null;render();return}
  if(a==="stockFiche"){const e=stockList.find(x=>x.id===b.dataset.e);if(!e)return;if(stockOpen!==e.id){stockOpen=e.id;ficheOpen=null}fiches=e.fiches||[];showFiche(b.dataset.id);return}
  if(a==="stockImport"){const e=stockList.find(x=>x.id===b.dataset.id);if(e&&!stockBusy)importer(e);return}
  if(a==="stockDel"){const e=stockList.find(x=>x.id===b.dataset.id);if(!e)return;confirmBox("Retirer ce partage du stock ?","Vos collègues ne pourront plus l'importer. Les copies déjà importées restent chez eux.","Retirer",async()=>{try{await retirerStock(e);closeModal();openStock()}catch(x){closeModal();toast(authMsg(x))}},true);return}
  if(a==="shareToggle"){shareOpen=!shareOpen;rerenderKeep();return}
  if(a==="shareGo"){if(!stockBusy)partager();return}
  if(a==="shareDel"){confirmBox("Retirer cette activité du stock ?","Vos collègues ne pourront plus l'importer. Les copies déjà importées restent chez eux.","Retirer",async()=>{try{const e=await fb.getStock(dossier.stockId);if(e)await retirerStock(e);await saveDossier({stockId:null});closeModal();shareOpen=false;toast("Partage retiré");rerenderKeep()}catch(x){closeModal();toast(authMsg(x))}},true);return}
  // Groupes d'élèves
  if(a==="grpCreate"){creerGroupe();return}
  if(a==="grpRefresh"){openCarnetModele(activite);return}
  if(a==="grpAdd"){ajouterMembre();return}
  if(a==="grpLeave"){confirmBox("Quitter le groupe ?","Tu n'auras plus accès aux pages du groupe. Tu pourras créer ou rejoindre un autre groupe.","Quitter",quitterGroupe,true);return}
  if(route.name==="modele"||a==="mBlank"){if(mClick(a,b))return}
  if(a==="iaEdit"){if(!iaBusy)iaModifier();return}
  if(a==="iaFileX"){iaFile=null;rerenderKeep();return}
  if(a==="iaUndo"){if(modeleHist.length){modeleEdit.draft=modeleHist.pop();modeleEdit.dirty=true;setPreview();rerenderKeep()}return}
  if(a==="delModele"&&modeleEdit&&modeleEdit.builtin){confirmBox("Revenir à la version d'origine ?","Vos modifications du carnet de cross training seront supprimées et vos élèves retrouveront la version d'origine. Leurs réponses sont conservées.","Revenir à l'origine",async()=>{
      try{await fb.deleteModele(modeleEdit.id);closeModal();toast("Version d'origine rétablie");openCa5()}catch(x){closeModal();toast(authMsg(x))}},true);return}
  if(a==="delModele"){confirmBox("Supprimer ce carnet ?","Le modèle sera supprimé et retiré de vos classes. Les carnets déjà remplis par les élèves restent en base mais ne seront plus accessibles.","Supprimer",async()=>{
      try{for(const c of classes){if((c.activites||[]).includes(modeleEdit.id)){const a2=c.activites.filter(x=>x!==modeleEdit.id);await fb.updateClasse(c.id,{activites:a2});c.activites=a2}}
        if(modeleEdit.dossier){const d=await fb.getDossier(modeleEdit.dossier);if(d)await fb.updateDossier(d.id,{items:(d.items||[]).filter(x=>x.id!==modeleEdit.id)})}
        await fb.deleteModele(modeleEdit.id);closeModal();leaveEditor()}catch(x){closeModal();toast(authMsg(x))}},true);return}
  if(route.name!=="carnet"&&route.name!=="coach"&&route.name!=="modele")return;
  const s=curS();
  if(MOD&&a==="gNew"&&!RO){const rep2=newPage();render();window.scrollTo(0,0);if(rep2.length)toast(`Repris de ta ${PW(MOD).one} précédente : ${rep2.map(S=>S.titre.toLowerCase()).join(", ")}`);return}

  if(MOD&&gClick(a,b,s))return;
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
    if(!u){me=null;RO=false;carnetId=null;data=null;ET={etab:null,dem:null,loaded:false,loading:null,demandes:[],sugg:null,form:{nom:"",commune:""}};go("login");return}
    go("loading");
    try{const lent=setTimeout(()=>{if(route.name==="loading")go("error",{msg:"Le chargement est bloqué, sans doute par un autre onglet resté ouvert sur une ancienne version de l'appli. Ferme les autres onglets du Carnet d'entraînement (ou redémarre le navigateur), puis touche « Réessayer »."})},15000);
      let d=await fb.getUser(u.uid);clearTimeout(lent);
      if(!d&&u.email&&u.email.toLowerCase()===String(DEV_EMAIL).toLowerCase()){await fb.setUser(u.uid,{role:"dev",email:u.email});d={role:"dev",email:u.email}}
      if(!d){me={uid:u.uid,role:""};go("noaccount");return}
      me={uid:u.uid,...d};
      if(me.role==="eleve"){try{const l=await fb.getLogin(me.login);me.pseudo=(l&&l.pseudo)||"";me.avatar=(l&&l.avatar)||""}catch(e){me.pseudo=""}openHome()}else{try{const pr=await fb.getPrefs(u.uid);IAKEY=(pr&&pr.geminiKey)||""}catch(e){IAKEY=""}await loadClasses();go("classes");etLoad().then(etRefresh)}}
    catch(e){console.error(e);go("error",{msg:authMsg(e)})}})}

/* ====================================================================
   Carnets génériques (modèles créés avec l'IA à partir d'un référentiel)
   ==================================================================== */
let MODBASE=null,IAKEY="",MOD=null,MODDOC=null,PREVIEW=false,modeles=[],modeleEdit=null,modeleHist=[],iaBusy=false,actsList=[],iaDraft="",iaFile=null,iaOpen=false;
const G_TYPES={texte:"Texte",texte_long:"Texte long",nombre:"Nombre",temps:"Temps",choix:"Choix",case:"Case à cocher",echelle:"Échelle",compteur:"Compteur",tableau:"Tableau",passages:"Temps de passage",exercices:"Exercices (WOD)",resume:"Résumé du WOD",grille:"Tableau à double entrée (note)",calcul:"Calcul automatique (total…)",pseudo:"Pseudo (rempli automatiquement)"};
const AGG_FR={moyenne:"moyenne",somme:"somme",max:"maximum",min:"minimum",nombre:"nombre de lignes",dernier:"dernière valeur",ecart_premier_dernier:"écart entre première et dernière valeur"};
const MES_FR={proportion_dans_cible:"part des tours dans le temps visé",nb_hors_cible:"tours hors du temps visé",norep:"total des NO REP",adaptations:"paramètres adaptés",termine:"séance terminée",temps_total:"temps total"};
const idOk=s=>norm(s).replace(/[^a-z0-9_]+/g,"_").replace(/^_+|_+$/g,"").slice(0,40)||"x";
/* --- Cross training CA5 : carnet de référence exprimé avec le moteur commun --- */
const CA5_ID="ca5-crosstraining";
const ca5DocId=profId=>"ca5_"+profId;
const C_TEMPS={champ:"wod.temps"},C_TOURS="realisation.tours";
const CA5_MODELE={titre:"Cross training",ca:"CA5",apsa:"Cross training",description:"Réaliser et orienter son activité physique pour développer ses ressources et s'entretenir.",rm:true,
  themes:Object.entries(DEF_SETTINGS.themes).map(([id,t])=>({id,label:t.label,desc:t.desc,reps:t.reps,pct:t.pct})),
  sections:[
    {id:"echauffement",titre:"Rituel d'échauffement",consigne:"Cardio, mobilité, activation et spécifique : vise 10 minutes.",reprise:true,champs:[
      {id:"exos",type:"tableau",label:"Exercices",colonnes:[{id:"nom",type:"texte",label:"Exercice"},{id:"duree",type:"nombre",label:"Min"},{id:"cat",type:"choix",label:"Contenu",options:Object.values(WU_CATS)}]},
      {id:"pret",type:"choix",label:"Je me sens prêt·e",options:["Oui","Moyennement","Non"]}]},
    {id:"wod",titre:"Je conçois mon WOD",consigne:"",reprise:true,champs:[
      {id:"tours",type:"nombre",label:"Nombre de tours"},{id:"temps",type:"temps",label:"Temps prévu / tour"},
      {id:"exos",type:"exercices",label:"Exercices du WOD",nb:3}]},
    {id:"resume",titre:"Mon WOD",consigne:"",champs:[{id:"recap",type:"resume",label:"Résumé",requis:false,src:{exos:"wod.exos",tours:"wod.tours",temps:"wod.temps"}}]},
    {id:"realisation",titre:"Je réalise",consigne:"",champs:[
      {id:"tours",type:"passages",label:"Temps de passage",nb:4,nbChamp:"wod.tours",noRep:true,adapt:true,coach:true},
      {id:"ressenti",type:"choix",label:"Charge de l'haltéro ressentie",options:["Trop légère","Adaptée","Lourde"]},
      {id:"rpe",type:"echelle",label:"Effort perçu (RPE)",min:1,max:10}]},
    {id:"analyse",titre:"J'analyse ma séance",consigne:"",champs:[
      {id:"reussite",type:"texte_long",label:"Ce qui a fonctionné (rythme, technique…)"},
      {id:"difficulte",type:"texte_long",label:"Ma principale difficulté et sa cause"},
      {id:"regulation",type:"texte_long",label:"Ce que je change à la prochaine séance (avec des chiffres)",aide:"ex. passer les thrusters de 25 à 20 kg et de 20 à 15 répétitions"}]}],
  criteres:[
    {id:"charge",afl:"AFL1",label:"Charge d'entraînement",points:[1,2,3,5],
      descripteurs:["Charge inadaptée : WOD non terminé, rythme perdu dès le début ou charge jugée trop légère.","Rythme perdu à partir de la moitié du WOD.","Rythme perdu sur les 2 derniers tours.","Charge adaptée : rythme tenu jusqu'au dernier tour."],
      conseils:["Baisse nettement la charge (−15 à −20 %), ou augmente-la de 2,5 à 5 kg si elle était trop légère.","Baisse la charge de l'haltéro d'environ 10 %.","Baisse légèrement la charge de l'haltéro (−2,5 kg).","Garde cette charge, ou teste +2,5 kg si l'effort te paraît facile."],
      calcul:{type:"rythme",source:{champ:C_TOURS,cible:C_TEMPS,tolerance:5},condition:{champ:"realisation.ressenti",valeur:"Trop légère"}}},
    {id:"reps",afl:"AFL1",label:"Nombre de répétitions",points:[1,2,3,5],
      descripteurs:["Moins de la moitié des tours dans le temps prévu.","Au moins la moitié des tours dans le temps prévu.","Au moins 2 tours sur 3 dans le temps prévu.","Tous les tours dans le temps prévu."],
      conseils:["Enlève 1 à 3 répétitions sur l'exercice le plus long si tu dépasses, ajoutes-en si tu finis en avance.","Ajuste de 1 à 3 répétitions l'exercice le plus long pour tenir le temps prévu.","Ajuste de 1 à 3 répétitions l'exercice le plus long pour tenir le temps prévu.","Répétitions bien dosées : garde ce volume."],
      calcul:{type:"seuils",source:{champ:C_TOURS,mesure:"proportion_dans_cible",cible:C_TEMPS,tolerance:5},sens:"haut",seuils:[1,0.66,0.5]}},
    {id:"theme",afl:"AFL1",label:"Thème d'entraînement",points:[1,2,3,5],
      descripteurs:["Les exercices sont hors des repères du thème.","2 exercices hors des repères du thème.","1 exercice hors des repères du thème.","Les 3 exercices respectent les repères du thème (répétitions, % du 1RM)."],
      conseils:["Relis les repères du thème : nombre de répétitions et % du 1RM pour l'haltéro.","Relis les repères du thème : nombre de répétitions et % du 1RM pour l'haltéro.","Ajuste l'exercice hors repère : nombre de répétitions ou charge.",""],
      calcul:{type:"reperes",source:{champ:"wod.exos"},min:3}},
    {id:"adapt",afl:"AFL1",label:"Adaptation",points:[1,2,3,5],
      descripteurs:["3 paramètres ou plus modifiés pendant le WOD.","2 paramètres modifiés pendant le WOD.","1 paramètre modifié pendant le WOD.","Aucune adaptation nécessaire pendant le WOD."],
      conseils:["Intègre ces changements dans la conception de ta prochaine séance.","Intègre ces changements dans la conception de ta prochaine séance.","Intègre ce changement dans la conception de ta prochaine séance.",""],
      calcul:{type:"seuils",source:{champ:C_TOURS,mesure:"adaptations"},sens:"bas",seuils:[0,1,2]}},
    {id:"gest",afl:"AFL1",label:"Gestuelle technique",points:[1,2,3,5],
      descripteurs:["Plus de 6 NO REP sur l'ensemble du WOD.","5 ou 6 NO REP.","3 ou 4 NO REP.","2 NO REP ou moins."],
      conseils:["Ralentis sur l'exercice qui cause les NO REP et demande à ton juge pourquoi.","Ralentis sur l'exercice qui cause les NO REP et demande à ton juge pourquoi.","Demande à ton juge quel mouvement a causé les NO REP.",""],
      calcul:{type:"seuils",source:{champ:C_TOURS,mesure:"norep"},sens:"bas",seuils:[2,4,6]}},
    {id:"decal",afl:"AFL1",label:"Décalage avec le temps prévu",points:[1,2,3,5],
      descripteurs:["Plus de 3 tours décalés de plus de la tolérance.","2 ou 3 tours décalés.","1 tour décalé.","Tous les tours dans la tolérance."],
      conseils:["Ajuste de 1 à 3 répétitions l'exercice le plus long pour tenir le temps prévu.","Ajuste de 1 à 3 répétitions l'exercice le plus long pour tenir le temps prévu.","Régule ton allure sur le tour qui a décroché.",""],
      calcul:{type:"seuils",source:{champ:C_TOURS,mesure:"nb_hors_cible",cible:C_TEMPS,tolerance:5},sens:"bas",seuils:[0,1,3]}},
    {id:"afl2",afl:"AFL2",label:"S'entraîner : échauffement et analyse",points:[1,2,3,4],descripteurs:[1,2,3,4].map(d=>CRITERES.afl2.items[d].join(" ")),calcul:{type:"autoeval"}},
    {id:"afl3",afl:"AFL3",label:"Coopérer : partenaire, juge et coach",points:[1,2,3,4],descripteurs:[1,2,3,4].map(d=>CRITERES.afl3.items[d].join(" ")),calcul:{type:"autoeval"}}],
  bareme:{afl1:{max:12,table:Array.from({length:24},(_,i)=>({pts:i+6,note:(i+1)*.5}))}}};
async function ca5Modele(profId){let d=null;try{d=await fb.getModele(ca5DocId(profId))}catch(e){console.warn(e)}return{doc:d,M:normModele(d&&d.modele||CA5_MODELE)}}
/** Convertit une séance enregistrée par l'ancien carnet CA5 vers les cases du moteur commun. */
function ca5Convert(s){if(s.valeurs&&s.valeurs.wod)return s;
  const P={oui:"Oui",moyen:"Moyennement",non:"Non"},R={legere:"Trop légère",adaptee:"Adaptée",lourde:"Lourde"};
  const e=s.echauffement||{},w=s.wod||{},r=s.real||{},a=s.analyse||{};
  s.valeurs={echauffement:{exos:(e.exos||[]).map(x=>({nom:x.nom||"",duree:x.duree??"",cat:WU_CATS[x.cat]||""})),pret:P[e.pret]||""},
    wod:{tours:w.nbTours??"",temps:w.tempsTour||"",exos:(w.exos||[]).map(x=>({nom:x.nom||"",type:x.type||"haltero",reps:x.reps??"",charge:x.charge??"",niveau:x.niveau||""}))},
    realisation:{tours:(r.tours||[]).map(t=>({passage:t.passage??null,noRep:t.noRep||0,adapt:t.adapt||null})),ressenti:R[r.ressentiCharge]||"",rpe:r.rpe??""},
    analyse:{reussite:a.reussite||"",difficulte:a.difficulte||"",regulation:a.regulation||""}};
  delete s.echauffement;delete s.wod;delete s.real;delete s.analyse;s.autoeval=s.autoeval||{};return s}
const gTheme=(M,s)=>{const t=M.themes.find(x=>x.id===s.theme);return t?{label:t.label,reps:t.reps||[0,9999],pct:t.pct||[0,1000],has:!!(t.reps||t.pct)}:null};
function gDatalist(M,s){if(!M.rm)return"";const names=new Set();(data.profil.rms||[]).forEach(r=>r.nom&&names.add(r.nom));
  data.seances.forEach(x=>M.sections.forEach(S=>S.champs.forEach(f=>{if(f.type==="exercices")((x.valeurs||{})[S.id]||{})[f.id]&&x.valeurs[S.id][f.id].forEach(e=>e&&e.nom&&names.add(e.nom))})));
  ["Thrusters","Back squat","Front squat","Deadlift","Power clean","Push press","Overhead squat","Snatch"].forEach(n=>names.add(n));
  return`<datalist id="dl-ex">${[...names].map(n=>`<option value="${esc(n)}">`).join("")}</datalist>`}
const blankExo=t=>({nom:"",type:t||"gym",reps:"",charge:"",niveau:""});
const coachPaths=M=>M.sections.flatMap(S=>S.champs.filter(f=>f.coach).map(f=>S.id+"."+f.id));
function gCoachField(M,s){return coachPaths(M)[0]||C_TOURS}
function gCoach(s,prev){const M=MOD;gEnsure(M,s);if(!prev)gAutoPseudo(M,s);const base="seances.0.valeurs",th=M.themes.find(t=>t.id===s.theme),V=!!s.valide;
  const res=M.sections.flatMap(S2=>S2.champs.filter(x=>x.type==="resume").map(x=>`<section class="card resume">${gFieldHTML(M,s,S2,x,base,true,false)}</section>`)).join("");
  const mine=verSections(M,s).filter(S=>S.champs.some(f=>f.coach)),other=verSections(M,s).filter(S=>!S.champs.some(f=>f.coach)&&!S.champs.every(f=>f.type==="resume"));
  const sec=(S,only)=>`<section class="card sec"><div class="sec-h"><h3>${esc(S.titre)}</h3></div>${S.consigne?`<p class="hint" style="margin:-4px 0 10px">${esc(S.consigne)}</p>`:""}<div class="stack" style="gap:12px">${S.champs.filter(f=>!only||f.coach).map(f=>gFieldHTML(M,s,S,f,base,V||!f.coach,false)).join("")}</div></section>`;
  return`<div class="stack seance" style="--th:var(--accent)">
  ${prev?"":`<div class="row"><button class="btn ghost small" data-act="coachBack">← Mes activités</button><span class="spacer"></span><span id="sync" class="sync dark"></span></div>`}
  <section class="hero"><div class="hero-top"><span class="eyebrow">📣 Je coache</span><span class="spacer"></span><span class="lock-chip">${V?"🔒 Validée":"En direct"}</span></div>
    <div class="hero-main"><div><h2 class="hero-t" style="font-size:2rem">${esc(coachCtx.eleveLogin)}</h2><div class="hero-sub">${esc(M.titre)} · ${PW(M).one} du ${fmtDate(s.date)}${th?" · "+esc(th.label):""}</div></div></div></section>
  ${V?`<div class="card"><p style="margin:0">Cette page a été validée par l'élève : elle n'est plus modifiable.</p></div>`:""}${res}${M.versions?verBar(M,s,!V):""}
  ${M.gabarit?`<p class="hint" style="margin:0">Remplis la fiche : tes cases (📣) s'affichent en direct dans le carnet de ton camarade.</p>${ffHTML(M,s,base,f=>V||!f.coach,false,null)}`:mine.length?`<p class="hint" style="margin:0">Remplis les cases ci-dessous : elles s'affichent en direct dans le carnet de ton camarade.</p><div class="coach-sec stack">${mine.map(S=>sec(S,true)).join("")}</div>`:'<div class="card"><p style="margin:0">Aucune case n\'est à remplir par le coach.</p></div>'}
  ${other.length&&!M.gabarit?`<details class="card"><summary><strong>Voir toute la page de ${esc(coachCtx.eleveLogin)}</strong></summary><fieldset class="lock" disabled style="border:0;padding:0;margin:10px 0 0"><div class="stack">${other.map(S=>sec(S,false)).join("")}</div></fieldset></details>`:""}</div>`}
function gModalAdapt(sec,fid,i){const t=curS().valeurs[sec][fid][i],a=t.adapt||{params:[],texte:""};
  openModal(`<h3>Tour ${i+1} · adaptation</h3><p class="hint" style="margin:0">Quel paramètre as-tu modifié pendant ce tour ?</p>
  <div class="checks">${Object.entries(PARAMS).map(([k,l])=>`<label><input type="checkbox" id="m-p-${k}" value="${k}" ${(a.params||[]).includes(k)?"checked":""}> ${l}</label>`).join("")}</div>
  <label class="f">Ce que j'ai changé<textarea id="m-txt" placeholder="ex. charge passée de 25 à 20 kg">${esc(a.texte||"")}</textarea></label>
  <div class="grid2"><button class="btn primary" data-mact="gSaveAd">Enregistrer</button><button class="btn" data-mact="close">Annuler</button></div>
  ${adCount(t.adapt)?`<button class="btn danger small" data-mact="gClearAd">Supprimer l'adaptation</button>`:""}`,{type:"gad",sec,fid,i})}
function gExportCSV(){const QA=qsAfls(),L=[["N°","Identifiant","Séances validées","AFL1","AFL1 max","AFL2 auto","AFL3 degré","AFL3","AFL3 max",...QA.map(a=>a+" retenu (QCM)"),"Total /20"]];
  suivi.rows.forEach(r=>{const S=gRowStats(r);L.push([r.e.numero,r.e.login,S?S.nv:0,S&&S.res?S.res.n1:"",S&&S.res?S.res.max1:"",S&&S.res?S.res.a2.p:"",a3Of(r.c,r.e.id)||"",S&&S.a3!==null?S.a3:"",S?S.m3:"",...QA.map(a=>{const x=S&&S.q&&S.q[a];return x&&x.val!==null?x.val:""}),S&&S.tot!==null?S.tot:""])});
  const csv="﻿"+L.map(r=>r.map(v=>`"${typeof v==="number"?String(v).replace(".",","):String(v??"").replace(/"/g,'""')}"`).join(";")).join("\n");
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download=`Notes_${slug(classe.nom)}_${slug(MOD.titre)}.csv`;document.body.appendChild(a);a.click();a.remove()}


/** Nettoie et sécurise un modèle produit par l'IA. */
function normModele(m){m=m&&typeof m==="object"?clone(m):{};
  const out={titre:String(m.titre||"Nouvelle activité").slice(0,60),ca:String(m.ca||"").slice(0,6),apsa:String(m.apsa||"").slice(0,60),description:String(m.description||"").slice(0,300),
    rm:!!m.rm,pages:["seance","plusieurs","cycle"].includes(m.pages)?m.pages:"seance",partage:["aucun","coach","groupe"].includes(m.partage)?m.partage:null,noteGroupe:m.noteGroupe!==false,groupeMin:Math.max(1,Math.min(30,parseInt(m.groupeMin)||2)),groupeMax:Math.max(1,Math.min(30,parseInt(m.groupeMax)||4)),
    themes:[],sections:[],criteres:[],bareme:{afl1:{max:12,table:[]}}};
  const pair=x=>{if(!x||typeof x!=="object")return null;const a=[x[0],x[1]].map(v=>v===""||v==null?NaN:+v);return a.every(Number.isFinite)?a:null};
  const seen=new Set(),uniq=(id,set)=>{let b=idOk(id),x=b,i=2;while(set.has(x))x=b+"_"+i++;set.add(x);return x};
  (Array.isArray(m.themes)?m.themes:[]).slice(0,8).forEach(t=>{if(t&&t.label){const th={id:uniq(t.id||t.label,seen),label:String(t.label).slice(0,40),desc:String(t.desc||"").slice(0,160)};const r=pair(t.reps),q=pair(t.pct);if(r)th.reps=r;if(q)th.pct=q;out.themes.push(th)}});
  const secIds=new Set();
  (Array.isArray(m.sections)?m.sections:[]).slice(0,12).forEach(S=>{if(!S)return;const sec={id:uniq(S.id||S.titre,secIds),titre:String(S.titre||"Section").slice(0,60),consigne:String(S.consigne||"").slice(0,300),reprise:!!S.reprise,portee:S.portee==="individuelle"?"individuelle":"collective",champs:[]};const cids=new Set();
    (Array.isArray(S.champs)?S.champs:[]).slice(0,20).forEach(C=>{if(!C)return;const type=G_TYPES[C.type]?C.type:"texte";
      const f={id:uniq(C.id||C.label,cids),type,label:String(C.label||"Champ").slice(0,80),aide:String(C.aide||"").slice(0,200),unite:String(C.unite||"").slice(0,12),requis:C.requis!==false};
      if(type==="choix")f.options=(Array.isArray(C.options)?C.options:[]).map(x=>String(x).slice(0,60)).slice(0,12);
      if(type==="echelle"){f.min=Number.isFinite(+C.min)?+C.min:1;f.max=Number.isFinite(+C.max)?+C.max:10;if(f.max<=f.min)f.max=f.min+9}
      if(type==="tableau"){const ccids=new Set();f.colonnes=(Array.isArray(C.colonnes)?C.colonnes:[]).slice(0,6).map(c=>{const o={id:uniq(c.id||c.label,ccids),type:["texte","nombre","temps","choix","membres"].includes(c.type)?c.type:"texte",label:String(c.label||"").slice(0,40),options:(Array.isArray(c.options)?c.options:[]).map(String).slice(0,12)};
        if(o.type==="nombre"){const mn=parseFloat(c.min),mx=parseFloat(c.max);if(Number.isFinite(mn))o.min=mn;if(Number.isFinite(mx))o.max=mx}if(o.type==="membres"&&c.nbCol)o.nbCol=String(c.nbCol);return o});
        f.colonnes.forEach(o=>{if(o.nbCol&&!f.colonnes.some(k=>k.id===o.nbCol&&k.type==="nombre"))delete o.nbCol});if(!f.colonnes.length)f.colonnes=[{id:"valeur",type:"texte",label:"Valeur",options:[]}]}
      if(type==="passages"){f.nb=Math.max(1,Math.min(30,parseInt(C.nb)||4));if(C.nbChamp)f.nbChamp=String(C.nbChamp);f.noRep=!!C.noRep;f.adapt=!!C.adapt}
      f.coach=!!C.coach;
      if(type==="exercices")f.nb=Math.max(1,Math.min(10,parseInt(C.nb)||3));
      if(type==="grille"){Object.assign(f,normGrille(C));f.requis=false;f.coach=false}
      if(type==="resume"){const r=C.src&&typeof C.src==="object"?C.src:{};f.src={exos:String(r.exos||""),tours:String(r.tours||""),temps:String(r.temps||"")};f.requis=false}
      if(type==="grille")f.coach=false;
      if(type==="calcul"){f.op=CALC_OPS[C.op]?C.op:"somme";f.src=(Array.isArray(C.src)?C.src:[]).filter(x=>x&&x.champ).map(x=>x.colonne?{champ:String(x.champ),colonne:String(x.colonne)}:{champ:String(x.champ)}).slice(0,30);f.requis=false;f.coach=false}
      if(type==="texte"&&estNomEleve(f.label)){f.type="pseudo";f.qui=estNomJuge(f.label)||f.coach?"juge":"eleve"}
      if(f.type==="pseudo"){f.qui=C.qui==="juge"||f.qui==="juge"?"juge":"eleve";f.coach=f.qui==="juge";f.requis=false}
      sec.champs.push(f)});
    out.sections.push(sec)});
  if(!out.sections.length)out.sections.push({id:"seance",titre:"Ma séance",consigne:"",champs:[{id:"notes",type:"texte_long",label:"Ce que j'ai fait",aide:"",unite:"",requis:true}]});
  const exists=p=>{const[a,b]=String(p||"").split(".");const S=out.sections.find(x=>x.id===a);return!!(S&&S.champs.find(c=>c.id===b))};
  out.sections.forEach(S=>S.champs.forEach(f=>{if(f.type==="grille")["lignes","colonnes"].forEach(k=>f[k].src=f[k].src.filter(x=>exists(x.champ)));if(f.type==="calcul")f.src=f.src.filter(x=>exists(x.champ)&&x.champ!==S.id+"."+f.id)}));
  gCapSync(out);
  const fixSrc=src=>src&&typeof src==="object"&&exists(src.champ)?src:null;
  const crIds=new Set();
  (Array.isArray(m.criteres)?m.criteres:[]).slice(0,20).forEach(K=>{if(!K)return;const afl=["AFL1","AFL2","AFL3"].includes(K.afl)?K.afl:"AFL1";
    let d=(Array.isArray(K.descripteurs)?K.descripteurs:[]).map(x=>String(x).slice(0,1200));while(d.length<4)d.push("");d=d.slice(0,4);
    let pts=(Array.isArray(K.points)?K.points:[]).map(Number).filter(Number.isFinite);if(pts.length!==4)pts=[1,2,3,4];
    let cal=K.calcul&&typeof K.calcul==="object"?K.calcul:{type:"autoeval"};
    if(cal.type==="seuils"||cal.type==="ecart"){const src=fixSrc(cal.source);const sl=(Array.isArray(cal.seuils)?cal.seuils:[]).map(Number);
      if(!src||sl.length!==3||sl.some(x=>!Number.isFinite(x)))cal={type:"autoeval"};
      else cal={type:cal.type,source:src,seuils:sl,sens:cal.sens==="bas"?"bas":"haut",...(cal.type==="ecart"?{cible:typeof cal.cible==="number"?cal.cible:(fixSrc(cal.cible)||0)}:{})}}
    else if(cal.type==="complet"){const ch=(Array.isArray(cal.champs)?cal.champs:[]).filter(exists);const sl=(Array.isArray(cal.seuils)?cal.seuils:[1,.85,.5]).map(Number);cal=ch.length?{type:"complet",champs:ch,seuils:sl.length===3?sl:[1,.85,.5]}:{type:"autoeval"}}
    else if(cal.type==="rythme"){const src=fixSrc(cal.source);cal=src?{type:"rythme",source:src,...(cal.condition&&exists(cal.condition.champ)?{condition:{champ:cal.condition.champ,valeur:String(cal.condition.valeur||"")}}:{})}:{type:"autoeval"}}
    else if(cal.type==="grille"){const g=String(cal.champ||"");const[a,b]=g.split(".");const S=out.sections.find(x=>x.id===a),f=S&&S.champs.find(c=>c.id===b);const G1=out.sections.flatMap(S=>S.champs.filter(c=>c.type==="grille").map(c=>S.id+"."+c.id));cal=f&&f.type==="grille"?{type:"grille",champ:g}:G1.length===1?{type:"grille",champ:G1[0]}:{type:"autoeval"}}
    else if(cal.type==="reperes"){const src=fixSrc(cal.source);cal=src?{type:"reperes",source:{champ:src.champ},min:Math.max(1,Math.min(10,parseInt(cal.min)||3))}:{type:"autoeval"}}
    else cal={type:"autoeval"};
    const cr={id:uniq(K.id||K.label,crIds),afl,label:String(K.label||"Critère").slice(0,120),descripteurs:d,points:pts,calcul:cal};
    if(Array.isArray(K.conseils)&&K.conseils.some(x=>x&&String(x).trim())){cr.conseils=[0,1,2,3].map(i=>String(K.conseils[i]||"").slice(0,300))}
    out.criteres.push(cr)});
  ["AFL2","AFL3"].forEach(a=>{if(!out.criteres.some(c=>c.afl===a))out.criteres.push({id:uniq(a.toLowerCase(),crIds),afl:a,label:a==="AFL2"?"S'entraîner, s'échauffer, analyser":"Coopérer : partenaire, juge, coach",descripteurs:["Insuffisant","Partiel","Adapté","Optimal"],points:[1,2,3,4],calcul:{type:"autoeval"}})});
  const b=m.bareme&&m.bareme.afl1||{};out.bareme.afl1.max=Number.isFinite(+b.max)&&+b.max>0?+b.max:12;
  out.bareme.afl1.table=(Array.isArray(b.table)?b.table:[]).map(r=>Array.isArray(r)?{pts:+r[0],note:+r[1]}:{pts:+r.pts,note:+r.note}).filter(r=>Number.isFinite(r.pts)&&Number.isFinite(r.note)).slice(0,60);
  if(!out.partage)out.partage=out.sections.some(S=>S.champs.some(f=>f.coach))?"coach":"aucun";
  if(out.groupeMax<out.groupeMin)out.groupeMax=out.groupeMin;
  const gb=normGabarit(m.gabarit);if(gb){out.gabarit=gb;if(!m.partage)out.partage="coach"}
  const vs=normVersions(m.versions);if(vs)out.versions=vs;
  const jg=m.juge&&typeof m.juge==="object"?m.juge:{};out.juge={max:Number.isFinite(+jg.max)&&+jg.max>0?Math.min(100,+jg.max):4,perte:Number.isFinite(+jg.perte)&&+jg.perte>=0?Math.min(100,+jg.perte):1};
  return out}

/* ===== Case « Calcul automatique » (2026.11.20-12) et case « Pseudo » (2026.11.20-11) ===== */
const CALC_OPS={somme:"Somme (total)",moyenne:"Moyenne",max:"Plus grande valeur",min:"Plus petite valeur",nombre:"Nombre de cases remplies"};
const CALC_SYM={somme:" + ",moyenne:" , ",max:" , ",min:" , ",nombre:" , "};
function gCalcVals(M,s,f,depth){const out=[];if((depth||0)>5)return out;
  for(const o of f.src||[]){const g=gField(M,o.champ);if(!g)continue;let v;const raw=gVal(s,o.champ);
    if(g.type==="calcul")v=gCalc(M,s,g,(depth||0)+1);
    else if(g.type==="choix"){if(raw===""||raw==null)continue;v=choixVal(g,raw)}
    else if(g.type==="case")v=raw?1:0;
    else if(g.type==="tableau"){if(!o.colonne)continue;v=gSource(M,s,{champ:o.champ,colonne:o.colonne,agg:"somme"})}
    else{if(raw===""||raw==null)continue;v=gSource(M,s,{champ:o.champ})}
    if(Number.isFinite(v))out.push(v)}
  return out}
function gCalc(M,s,f,depth){const v=gCalcVals(M,s,f,depth);if(f.op==="nombre")return v.filter(x=>x).length;if(!v.length)return NaN;
  switch(f.op){case"moyenne":return Math.round(v.reduce((a,b)=>a+b,0)/v.length*100)/100;case"max":return Math.max(...v);case"min":return Math.min(...v);default:return Math.round(v.reduce((a,b)=>a+b,0)*100)/100}}
function gCalcHTML(M,s,f,lab){const v=gCalc(M,s,f),names=(f.src||[]).map(o=>{const g=gField(M,o.champ);if(!g)return"";const c=o.colonne&&g.colonnes?(g.colonnes.find(k=>k.id===o.colonne)||{}).label:"";return c?`${g.label} (${c})`:g.label}).filter(Boolean);
  return`<div class="f"><span class="mlab">${lab}</span><div class="calc-v">${Number.isFinite(v)?`<b>${fmtN(v)}</b>${f.unite?` <span class="hint">${esc(f.unite)}</span>`:""}`:"<span class=\"hint\">–</span>"}</div>
    <div class="hint">🧮 Calculé automatiquement${f.op!=="somme"?` (${esc(CALC_OPS[f.op].toLowerCase())})`:""}${names.length?" : "+esc(names.join(CALC_SYM[f.op]||" + ")):" — aucune case choisie"}</div></div>`}
function mCalcEd(M,p,si,fi,f){const self=M.sections[si].id+"."+f.id,on=new Set((f.src||[]).map(o=>o.champ+(o.colonne?"#"+o.colonne:"")));
  const opts=[];M.sections.forEach(S=>S.champs.forEach(c=>{const q=S.id+"."+c.id;if(q===self)return;
    if(["nombre","compteur","echelle","choix","case","temps","calcul","grille"].includes(c.type))opts.push([q,`${S.titre} › ${c.label}`]);
    if(c.type==="tableau")(c.colonnes||[]).filter(k=>k.type==="nombre"||k.type==="temps").forEach(k=>opts.push([q+"#"+k.id,`${S.titre} › ${c.label} › colonne « ${k.label} »`]))}));
  return`${mSel(p+".op",f.op||"somme",Object.entries(CALC_OPS),"Calcul","data-rerender")}
  <div class="f"><span class="mlab">Cases utilisées</span><div class="mchecks">${opts.map(([v,l])=>`<label><input type="checkbox" data-mgsrc="${p}" value="${esc(v)}" ${on.has(v)?"checked":""}> ${esc(l)}</label>`).join("")||'<span class="hint">Ajoutez d\'abord des cases nombre, compteur, échelle ou liste déroulante.</span>'}</div></div>
  <button class="btn small" data-act="mCalcAbove" data-si="${si}" data-fi="${fi}" style="justify-self:start">↑ Toutes les cases au-dessus dans cette partie</button>
  <p class="hint" style="margin:0">Une liste déroulante vaut le dernier nombre de son texte (« ★★★ (3 étoiles) » → 3), sinon son rang ; une case cochée vaut 1. Jamais saisie par l'élève.</p>`}
function mCalcAbove(si,fi){mutDraft(M=>{const S=M.sections[si],f=S.champs[fi];f.src=S.champs.slice(0,fi).filter(c=>["nombre","compteur","echelle","choix","case","calcul"].includes(c.type)).map(c=>({champ:S.id+"."+c.id}))})}
const estNomEleve=l=>{const n=norm(l).replace(/[:*.]+$/,"").trim();
  return/\bpre ?noms?\b|\bidentite\b/.test(n)||/^noms?( et| ?\/| de l'| de la| du| des|$)/.test(n)&&!/figure|exercice|activite|equipe|groupe|enchainement|atelier|epreuve|mouvement|element/.test(n)
    ||/^(eleve|juge|observateur|observatrice|coach|arbitre|pratiquant|pratiquante|evaluateur|partenaire|gymnaste|nageur|coureur|athlete)s?( observe| evalue)?$/.test(n)};
const estNomJuge=l=>/juge|observ|coach|arbitre|evaluat|correct/.test(norm(l));
// Remplit les cases pseudo : l'élève propriétaire de la page, ou le coach quand il ouvre la page
function gAutoPseudo(M,s){if(!s||PREVIEW||RO||CORR||VUE||s.valide||!me)return;const moi=me.pseudo||me.login||"";if(!moi)return;let ch=false;
  M.sections.forEach(S=>S.champs.forEach(f=>{if(f.type!=="pseudo")return;const o=s.valeurs[S.id]=s.valeurs[S.id]||{};
    if(COACH){if(f.qui==="juge"&&o[f.id]!==moi){o[f.id]=moi;ch=true}}
    else if(f.qui==="eleve"&&!o[f.id]){o[f.id]=moi;ch=true}}));
  if(ch)setTimeout(save,0)}
/* --- Lecture des valeurs et correction --- */
const gSec=(M,id)=>M.sections.find(x=>x.id===id);
function gField(M,path){const[a,b]=String(path||"").split(".");const S=gSec(M,a);return S&&S.champs.find(c=>c.id===b)}
function gVal(s,path){const[a,b]=String(path||"").split(".");return((s.valeurs||{})[a]||{})[b]}
function gNb(M,s,f){if(f.nbChamp){const n=parseInt(num(gVal(s,f.nbChamp)));if(n>0)return Math.min(30,n)}return f.nb||4}
function passDur(tours){return tours.map((t,i)=>{const p=num(t&&t.passage),q=i?num(tours[i-1]&&tours[i-1].passage):0;return p>0&&(i===0||q>0)?p-q:NaN})}
function gRef(M,s,ref){return typeof ref==="number"?ref:ref&&ref.champ?gSource(M,s,ref):NaN}
function gSource(M,s,src){const f=gField(M,src.champ);if(!f)return NaN;if(f.type==="calcul")return gCalc(M,s,f);const v=gVal(s,src.champ);
  if(f.type==="passages"){const n=gNb(M,s,f),T=(Array.isArray(v)?v:[]).slice(0,n),D=passDur(T),tol=num(src.tolerance)||5,c=src.cible!==undefined?gRef(M,s,src.cible):NaN;
    const inT=D.filter(d=>!isNaN(d)&&!isNaN(c)&&Math.abs(d-c)<=tol).length;
    switch(src.mesure){case"adaptations":return T.some(t=>num(t&&t.passage)>0)?T.reduce((a,t)=>a+adCount(t&&t.adapt),0):NaN;case"norep":return T.reduce((a,t)=>a+(num(t&&t.noRep)||0),0);case"termine":return T.length===n&&T.every(t=>num(t&&t.passage)>0)?1:0;
      case"temps_total":{const l=[...T].reverse().find(t=>num(t&&t.passage)>0);return l?num(l.passage):NaN}
      case"nb_hors_cible":return isNaN(c)||!T.some(t=>num(t&&t.passage)>0)?NaN:n-inT;
      default:return isNaN(c)||!T.some(t=>num(t&&t.passage)>0)?NaN:inT/n}}
  if(f.type==="tableau"){const rows=Array.isArray(v)?v:[],col=(f.colonnes||[]).find(c=>c.id===src.colonne);
    if(src.agg==="nombre")return rows.filter(r=>r&&Object.values(r).some(x=>x!==""&&x!=null)).length;
    if(!col)return NaN;const vals=rows.map(r=>col.type==="temps"?parseT(r&&r[col.id]):num(r&&r[col.id])).filter(x=>!isNaN(x));if(!vals.length)return NaN;
    switch(src.agg){case"somme":return vals.reduce((a,b)=>a+b,0);case"max":return Math.max(...vals);case"min":return Math.min(...vals);case"dernier":return vals[vals.length-1];
      case"ecart_premier_dernier":return vals.length>1?vals[vals.length-1]-vals[0]:NaN;default:return vals.reduce((a,b)=>a+b,0)/vals.length}}
  if(f.type==="temps")return parseT(v);if(f.type==="case")return v?1:0;
  if(f.type==="choix"){const i=(f.options||[]).indexOf(v);return i<0?NaN:i+1}
  return isTxtT(v)?parseT(v):num(v)}
function gFilled(M,s,path){const f=gField(M,path),v=gVal(s,path);if(!f)return false;
  if(f.type==="tableau")return Array.isArray(v)&&v.some(r=>r&&Object.values(r).some(x=>x!==""&&x!=null));
  if(f.type==="passages")return Array.isArray(v)&&v.some(t=>num(t&&t.passage)>0);
  if(f.type==="exercices")return Array.isArray(v)&&v.some(e=>e&&e.nom);
  if(f.type==="resume"||f.type==="grille"||f.type==="calcul"||f.type==="pseudo")return true;
  if(f.type==="case"||f.type==="compteur")return true;
  return v!==undefined&&v!==null&&String(v).trim()!==""}
function gDegree(M,s,cr,profil){const c=cr.calcul||{type:"autoeval"};
  if(c.type==="grille"){const g=gGrille(M,s,gField(M,c.champ));return g&&g.note!=null?g.deg:null}
  if(c.type==="autoeval")return(s.autoeval||{})[cr.id]||null;
  if(c.type==="rythme"){const src=c.source,f=gField(M,src.champ);if(!f||f.type!=="passages")return null;const n=gNb(M,s,f),T=(Array.isArray(gVal(s,src.champ))?gVal(s,src.champ):[]).slice(0,n),D=passDur(T),cb=gRef(M,s,src.cible),tol=num(src.tolerance)||5;
    const done=T.filter(t=>num(t&&t.passage)>0).length;if(!done)return null;if(done<n)return 1;
    if(c.condition&&c.condition.champ&&String(gVal(s,c.condition.champ)||"")===c.condition.valeur)return 1;if(isNaN(cb))return null;
    const fi=D.findIndex(d=>!isNaN(d)&&d-cb>tol);return fi<0?4:fi>=n-2?3:fi>=Math.floor(n/2)?2:1}
  if(c.type==="reperes"){const th=gTheme(M,s);if(!th)return null;const rows=(Array.isArray(gVal(s,c.source.champ))?gVal(s,c.source.champ):[]).filter(e=>e&&e.nom),min=c.min||3;if(rows.length<min)return null;
    const ch=rows.slice(0,min).map(e=>exoCheck(e,th,profil||{rms:[]}));if(ch.some(x=>x.ok===null))return null;return[4,3,2,1][Math.min(3,ch.filter(x=>!x.ok).length)]}
  if(c.type==="complet"){const fr=c.champs.filter(p=>gFilled(M,s,p)).length/c.champs.length;return fr>=c.seuils[0]?4:fr>=c.seuils[1]?3:fr>=c.seuils[2]?2:1}
  let x=gSource(M,s,c.source);if(isNaN(x))return null;
  if(c.type==="ecart"){const cb=gRef(M,s,c.cible);if(isNaN(cb))return null;x=Math.abs(x-cb);return x<=c.seuils[0]?4:x<=c.seuils[1]?3:x<=c.seuils[2]?2:1}
  if(c.sens==="bas")return x<=c.seuils[0]?4:x<=c.seuils[1]?3:x<=c.seuils[2]?2:1;
  return x>=c.seuils[0]?4:x>=c.seuils[1]?3:x>=c.seuils[2]?2:1}
function gCorrect(M,s,profil){const rep=REPART[(profil&&profil.repartition)||"4-4"];
  const R=M.criteres.map(cr=>{if(cr.calcul&&cr.calcul.type==="grille"){const f=gField(M,cr.calcul.champ),g=gGrille(M,s,f);return{cr,deg:g&&g.note!=null?g.deg:null,val:g&&g.note!=null?g.note:null,vmax:f?grilleMax(f):0}}return{cr,deg:gDegree(M,s,cr,profil)}});
  const a1=R.filter(x=>x.cr.afl==="AFL1"),pts=a1.reduce((a,x)=>a+(x.vmax!==undefined?(x.val||0):x.deg?x.cr.points[x.deg-1]:0),0),pmax=a1.reduce((a,x)=>a+(x.vmax!==undefined?x.vmax:Math.max(...x.cr.points)),0);
  const B=M.bareme.afl1;let n1=0;
  if(B.table&&B.table.length){const t=B.table.slice().sort((a,b)=>a.pts-b.pts);t.forEach(r=>{if(pts>=r.pts)n1=r.note})}else n1=pmax?pts/pmax*B.max:0;
  n1=Math.max(0,Math.min(B.max,Math.round(n1*10)/10));
  const aflPts=(afl,max)=>{const L=R.filter(x=>x.cr.afl===afl);if(!L.length||L.some(x=>!x.deg))return{d:null,p:0};const d=Math.floor(L.reduce((a,x)=>a+x.deg,0)/L.length);return{d,p:max*d/4}};
  const A2=aflPts("AFL2",rep[0]),A3=aflPts("AFL3",rep[1]);
  return{R,pts,pmax,n1,max1:B.max,a2:A2,a3:A3,rep,tot:n1+A2.p+A3.p,complete:R.every(x=>x.deg)}}
function gMissing(M,s){const m=[];M.sections.forEach(S=>S.champs.forEach(f=>{
    if(f.type==="exercices"){const rows=(gVal(s,S.id+"."+f.id)||[]).filter(e=>e&&e.nom);if(f.requis&&rows.filter(e=>String(e.reps??"").trim()).length<f.nb)m.push(`${S.titre} : ${f.nb} exercices avec leurs répétitions`);
      rows.filter(e=>e.type==="haltero").forEach(e=>{if(!(num(e.charge)>0))m.push(`La charge de « ${e.nom} »`);if(M.rm&&!(rmFor(data.profil,e.nom)>0))m.push(`Le 1RM de « ${e.nom} » dans ton profil`)});return}
    if(f.requis&&!["case","compteur","resume","grille"].includes(f.type)&&!gFilled(M,s,S.id+"."+f.id))m.push(`${S.titre} : ${f.label}`)}));
  M.criteres.filter(c=>c.calcul.type==="autoeval").forEach(c=>{if(!(s.autoeval||{})[c.id])m.push(`Autoévaluation : ${c.label}`)});return m}
function gEnsure(M,s){s.valeurs=s.valeurs||{};s.autoeval=s.autoeval||{};M.sections.forEach(S=>{const o=s.valeurs[S.id]=s.valeurs[S.id]||{};S.champs.forEach(f=>{
  if(f.type==="tableau"){if(!Array.isArray(o[f.id])||!o[f.id].length)o[f.id]=[Object.fromEntries(f.colonnes.map(c=>[c.id,""]))]}
  else if(f.type==="passages"){if(!Array.isArray(o[f.id]))o[f.id]=[];const n=gNb(M,s,f);while(o[f.id].length<n)o[f.id].push({passage:null,noRep:0})}
  else if(f.type==="compteur"){if(o[f.id]===undefined)o[f.id]=0}
  else if(f.type==="exercices"){if(!Array.isArray(o[f.id])||!o[f.id].length)o[f.id]=Array.from({length:f.nb||3},(_,i)=>blankExo(["haltero","gym","cardio"][i%3]))}
  else if(f.type==="resume"||f.type==="grille"||f.type==="calcul"){}
  else if(o[f.id]===undefined)o[f.id]=f.type==="case"?false:""})})}
function gCalcText(M,cr){const c=cr.calcul,src=x=>{if(typeof x==="number")return String(x);const f=gField(M,x.champ);if(!f)return"?";let t=`« ${f.label} »`;if(x.agg)t=`${AGG_FR[x.agg]||x.agg} de ${t}${x.colonne?` (${x.colonne})`:""}`;if(x.mesure)t=`${MES_FR[x.mesure]||x.mesure} de ${t}${x.cible!==undefined?` (cible : ${src(x.cible)}, ± ${x.tolerance||5} s)`:""}`;return t};
  if(c.type==="autoeval")return"Autoévaluation de l'élève";
  if(c.type==="grille"){const f=gField(M,c.champ);return f?`Note lue dans « ${f.label} » (${f.lignes.titre} × ${f.colonnes.titre})`:"Tableau à double entrée"}
  if(c.type==="rythme")return`Décrochage du rythme sur ${src(c.source)} (cible : ${src(c.source.cible??0)}, ± ${c.source.tolerance||5} s)`;
  if(c.type==="reperes")return`Repères du thème (répétitions, % du 1RM) sur ${src({champ:c.source.champ})}`;
  if(c.type==="complet")return`Remplissage de ${c.champs.length} champ(s) : D4 si ≥ ${Math.round(c.seuils[0]*100)} %, D3 ≥ ${Math.round(c.seuils[1]*100)} %, D2 ≥ ${Math.round(c.seuils[2]*100)} %`;
  if(c.type==="ecart")return`Écart entre ${src(c.source)} et ${src(c.cible)} : D4 si ≤ ${c.seuils[0]}, D3 ≤ ${c.seuils[1]}, D2 ≤ ${c.seuils[2]}`;
  const op=c.sens==="bas"?"≤":"≥";return`${src(c.source)} : D4 si ${op} ${c.seuils[0]}, D3 ${op} ${c.seuils[1]}, D2 ${op} ${c.seuils[2]}`}

/* Colonne « partenaires » d'un tableau : liste déroulante du groupe avec cases à cocher (2026.11.21-2) */
function mbList(){const moi=me&&String(me.login||"").toLowerCase();let L;
  if(carnetDoc&&carnetDoc.groupe)L=(carnetDoc.logins||[]).filter(l=>String(l).toLowerCase()!==moi);
  else{if(!ROSTER&&me&&me.role==="eleve"){loadRoster().then(()=>rerenderKeep());return null}L=(ROSTER||[]).map(x=>x.login).filter(l=>l!==moi)}
  return L.map(l=>{const r=(ROSTER||[]).find(x=>x.login===l);return{login:l,lab:r&&r.pseudo?`${r.pseudo} · ${l}`:l}})}
const mbVal=v=>Array.isArray(v)?v.filter(Boolean):v?[String(v)]:[];
function mbCell(f,c,r,k,id,L){const sel=mbVal(r[c.id]),nb=c.nbCol?parseInt(num(r[c.nbCol])):NaN,lim=Number.isFinite(nb)?Math.max(0,nb-1):null,list=mbList();
  const txt=sel.length?sel.join(", "):c.nbCol&&!(nb>0)?"Remplis d'abord le nombre":"Choisir…";
  if(L||list===null||(c.nbCol&&!(nb>0)))return`<span class="mb-ro${sel.length?"":" hint"}" id="${id}">${esc(list===null&&!L?"Chargement…":sel.length?sel.join(", "):L?"—":txt)}</span>`;
  return`<details class="mb-dd" id="${id}"><summary aria-label="${esc(c.label)}">${esc(txt)}</summary><div class="mb-pan">${lim!==null?`<div class="hint">${lim} partenaire${lim>1?"s":""} à cocher</div>`:""}
    ${list.length?list.map(x=>`<label><input type="checkbox" data-mb="${esc(k)}" data-lim="${lim??""}" value="${esc(x.login)}" ${sel.includes(x.login)?"checked":""}> ${esc(x.lab)}</label>`).join(""):'<span class="hint">Aucun camarade dans ton groupe pour l\'instant.</span>'}</div></details>`}
function mbField(el,e){if(el.dataset.mb===undefined)return false;if(e.type!=="change")return true;
  if(RO&&!CORR){el.checked=!el.checked;return true}const k=el.dataset.mb,box=el.closest(".mb-pan"),lim=el.dataset.lim===""?null:+el.dataset.lim;
  let sel=[...box.querySelectorAll("input:checked")].map(x=>x.value);
  if(lim!==null&&sel.length>lim){el.checked=false;sel=sel.filter(x=>x!==el.value);toast(lim?`${lim} partenaire${lim>1?"s":""} au plus pour cette figure`:"Indique d'abord combien de personnes il y a dans la figure");return true}
  if(/^seances\.\d+\./.test(k)){const si=+k.split(".")[1];if(data.seances[si]&&data.seances[si].valide)return true}
  setPath(data,k,sel);save();const sm=el.closest("details").querySelector("summary");if(sm)sm.textContent=sel.length?sel.join(", "):"Choisir…";return true}
/* ===================== Tableau à double entrée (2026.11.21-2) =====================
   Champ calculé « grille » : deux axes (ex. points acros × étoiles collectives), chacun alimenté par une ou plusieurs cases additionnées
   (nombre, compteur, échelle, choix, colonne d'un tableau…). La note est lue au croisement. Un critère « grille » la compte directement en AFL1. */
const isTxtT=x=>/\d\s*(:|'|’|′|mn|min)/i.test(String(x??""));
const numsOf=a=>(Array.isArray(a)?a:String(a??"").split(/[,;\s]+/)).map(x=>isTxtT(x)?parseT(x):parseFloat(String(x).replace(",","."))).filter(Number.isFinite);
function normGrille(C){const ax=(x,t)=>{x=x&&typeof x==="object"?x:{};let src=Array.isArray(x.src)?x.src:x.src&&typeof x.src==="object"?[x.src]:[];
    src=src.filter(o=>o&&o.champ).slice(0,8).map(o=>({champ:String(o.champ),...(o.colonne?{colonne:String(o.colonne)}:{})}));
    const bas=x.sens==="bas";let sl=numsOf(x.seuils).slice(0,100);if(!sl.length)sl=[0];sl=[...new Set(sl)].sort((a,b)=>bas?b-a:a-b);
    const labels=(Array.isArray(x.labels)?x.labels:typeof x.labels==="string"?x.labels.split(";"):[]).slice(0,100).map(l=>String(l??"").trim().slice(0,40));
    const cap=x.cap&&typeof x.cap==="object"&&x.cap.champ?{champ:String(x.cap.champ),n:Math.max(0,Math.min(11,parseInt(x.cap.n)||0))}:null;
    return{titre:String(x.titre||t).slice(0,30),src,seuils:sl,labels,...(bas?{sens:"bas"}:{}),...(cap?{cap}:{})}};
  const L=ax(C.lignes,"Lignes"),K=ax(C.colonnes,"Colonnes"),raw=C.notes||[];
  /* Si l'IA a donné plus de lignes / colonnes de notes que de paliers, on ne perd rien : paliers ajoutés à la suite (à corriger dans l'éditeur). */
  const rowOf=rw=>Array.isArray(rw)?rw:(rw&&rw.v)||[];const nC=Math.min(100,Math.max(0,...raw.map(rw=>rowOf(rw).length))),nR=Math.min(100,raw.length);
  const pad=(A,n)=>{while(A.seuils.length<n)A.seuils.push(A.seuils[A.seuils.length-1]+(A.sens==="bas"?-1:1))};pad(K,nC-axE(K));pad(L,nR-axE(L));
  /* Firestore refuse les tableaux imbriqués : chaque ligne est rangée sous la forme {v:[…]} */
  const notes=axS(L).map(r=>{const rw=raw[r]||{},row=Array.isArray(rw)?rw:rw.v||{};return{v:axS(K).map(c=>{const v=parseFloat(String(row[c]??"").replace(",","."));return Number.isFinite(v)?v:null})}});
  return{lignes:L,colonnes:K,notes}}
const gCell=(f,r,c)=>{const rw=(f.notes||[])[r];const v=rw?(Array.isArray(rw)?rw:rw.v||[])[c]:null;return Number.isFinite(v)?v:null};
/* Time cap : une liste déroulante (1re option = « terminé », les suivantes = « -0,5 exo », « -1 exo »…) ajoute des paliers AVANT le 1er palier de l'axe
   (les moins bons). ax.cap = {champ, n} ; n = nombre d'options - 1 (tenu à jour par gCapSync). Les notes rangent ces paliers en premier. */
function axE(ax){return ax&&ax.cap&&ax.cap.n>0?ax.cap.n:0}
function axN(ax){return axE(ax)+((ax&&ax.seuils)||[]).length}
function axS(ax){return[...Array(axN(ax)).keys()]}
/* Ordre d'affichage : un axe « moins c'est mieux » (temps) se lit comme sur le référentiel, du meilleur au moins bon, puis les colonnes time cap. */
function axD(ax){const a=axS(ax);return ax&&ax.sens==="bas"?a.reverse():a}
function gCapSync(M){let chg=false;(M.sections||[]).forEach(S=>(S.champs||[]).forEach(f=>{if(!f||f.type!=="grille")return;["lignes","colonnes"].forEach(k=>{const ax=f[k];if(!ax||!ax.cap)return;
    const[a,b]=String(ax.cap.champ||"").split("."),SS=(M.sections||[]).find(x=>x.id===a),cf=SS&&(SS.champs||[]).find(c=>c.id===b);
    const old=Math.max(0,parseInt(ax.cap.n)||0),nw=cf&&cf.type==="choix"?Math.max(0,Math.min(11,(cf.options||[]).length-1)):0,d=nw-old;
    if(!cf||cf.type!=="choix"||!ax.cap.champ){delete ax.cap}else ax.cap.n=nw;if(!d&&ax.cap)return;chg=true;if(!d)return;
    f.notes=Array.isArray(f.notes)?f.notes:[];
    if(k==="colonnes")f.notes=f.notes.map(rw=>{const v=[...(Array.isArray(rw)?rw:(rw&&rw.v)||[])];if(d>0)v.unshift(...Array(d).fill(null));else v.splice(0,-d);return{v}});
    else{const nc=axN(f.colonnes);if(d>0)f.notes.unshift(...Array.from({length:d},()=>({v:Array(nc).fill(null)})));else f.notes.splice(0,-d)}})}));return chg}
/** Palier « time cap » choisi : -1 si l'élève a terminé (1re option) ou rien n'est choisi */
function gCapIdx(M,s,ax){const e=axE(ax);if(!e)return-1;const f=gField(M,ax.cap.champ);if(!f||f.type!=="choix")return-1;const k=(f.options||[]).indexOf(gVal(s,ax.cap.champ));return k<1?-1:Math.max(0,e-k)}
function gAxSlot(M,ax,i){const e=axE(ax);if(i<e){const f=gField(M,ax.cap.champ);return(f&&(f.options||[])[e-i])||`Time cap (${e-i})`}return gAxL(M,ax,i-e)}
const grilleMax=f=>{let m=0;(f.notes||[]).forEach((_,r)=>axS(f.colonnes).forEach(c=>{const v=gCell(f,r,c);if(v!=null&&v>m)m=v}));return m};
/** Valeur d'un axe : somme des cases choisies. Un choix vaut le dernier nombre de son texte (« … (3 étoiles) » → 3), sinon son rang. */
function gAxis(M,s,ax){if(!ax.src.length)return NaN;let tot=0,any=false;
  for(const o of ax.src){const f=gField(M,o.champ);if(!f)continue;let v;
    if(f.type==="choix"){const t=gVal(s,o.champ);if(t===""||t==null)continue;v=choixVal(f,t)}
    else if(f.type==="tableau")v=gSource(M,s,{champ:o.champ,colonne:o.colonne,agg:"somme"});
    else if(f.type==="calcul")v=gCalc(M,s,f);
    else{const raw=gVal(s,o.champ);if(raw===""||raw==null)continue;v=gSource(M,s,{champ:o.champ})}
    if(Number.isFinite(v)){tot+=v;any=true}}
  return any?tot:NaN}
/* Valeur d'un choix : dernier nombre de son texte ; sinon déduite des autres choix (texte coupé) en comptant 1 de moins par rang. */
const lastNum=t=>{const m=String(t).match(/-?\d+(?:[.,]\d+)?/g);return m?parseFloat(m[m.length-1].replace(",",".")):NaN};
function choixVal(f,t){const O=f.options||[],i=O.indexOf(t),n=lastNum(t);if(Number.isFinite(n))return n;if(i<0)return NaN;
  const k=O.findIndex(o=>Number.isFinite(lastNum(o)));return k<0?O.length-i:lastNum(O[k])+(k-i)}
const gIdx=(sl,x,bas)=>{let i=-1;sl.forEach((t,k)=>{if(bas?x<=t:x>=t)i=k});return i<0?0:i};
/* Axe en temps : toutes ses cases sont des temps → paliers et valeurs affichés en min:s */
function gAxT(M,ax){return!!(ax.src.length&&ax.src.every(o=>{const f=gField(M,o.champ);if(!f)return false;if(f.type==="tableau"){const c=(f.colonnes||[]).find(k=>k.id===o.colonne);return!!c&&c.type==="temps"}return f.type==="temps"}))}
const gAxLabT=(ax,i)=>ax.labels[i]||(ax.sens==="bas"?(i===0&&ax.seuils.length>1?`> ${fmtT(ax.seuils[1])}`:`≤ ${fmtT(ax.seuils[i])}`):i<ax.seuils.length-1?`${fmtT(ax.seuils[i])} à ${fmtT(ax.seuils[i+1]-1)}`:`≥ ${fmtT(ax.seuils[i])}`);
const gAxL=(M,ax,i)=>gAxT(M,ax)?gAxLabT(ax,i):gAxLab(ax,i);
const gAxLab=(ax,i)=>ax.labels[i]||(ax.sens==="bas"?(i===0&&ax.seuils.length>1?`> ${fmtN(ax.seuils[1])}`:`≤ ${fmtN(ax.seuils[i])}`):i<ax.seuils.length-1?(ax.seuils[i+1]-ax.seuils[i]===1?fmtN(ax.seuils[i]):`${fmtN(ax.seuils[i])}–${fmtN(Number.isInteger(ax.seuils[i])&&Number.isInteger(ax.seuils[i+1])?ax.seuils[i+1]-1:ax.seuils[i+1])}`):`≥ ${fmtN(ax.seuils[i])}`);
function gGrille(M,s,f){if(!f||f.type!=="grille")return null;const x=gAxis(M,s,f.lignes),y=gAxis(M,s,f.colonnes),mx=grilleMax(f),rc=gCapIdx(M,s,f.lignes),cc=gCapIdx(M,s,f.colonnes);
  if((rc<0&&isNaN(x))||(cc<0&&isNaN(y)))return{x,y,rc,cc,note:null,max:mx};const r=rc>=0?rc:axE(f.lignes)+gIdx(f.lignes.seuils,x,f.lignes.sens==="bas"),c=cc>=0?cc:axE(f.colonnes)+gIdx(f.colonnes.seuils,y,f.colonnes.sens==="bas"),n=gCell(f,r,c);
  const note=Number.isFinite(n)?n:null,fr=mx?note/mx:0;return{x,y,r,c,rc,cc,note,max:mx,deg:note==null?null:fr>=.75?4:fr>=.5?3:fr>=.25?2:1}}
function gGrilleHTML(M,s,f,lab){const g=gGrille(M,s,f),mx=g.max,vide=!mx;
  const axTxt=(ax,v,ci)=>`${esc(ax.titre)} : <b>${ci>=0?esc(gAxSlot(M,ax,ci)):isNaN(v)?"?":gAxT(M,ax)?fmtT(v):fmtN(v)}</b>`;
  const tab=`<div class="scroll"><table class="grille"><thead><tr><th class="gc">${esc(f.lignes.titre)} ↓ · ${esc(f.colonnes.titre)} →</th>${axD(f.colonnes).map(c=>`<th${g.note!=null&&g.c===c?' class="on"':""}>${esc(gAxSlot(M,f.colonnes,c))}</th>`).join("")}</tr></thead>
    <tbody>${axD(f.lignes).map(r=>`<tr><th${g.note!=null&&g.r===r?' class="on"':""}>${esc(gAxSlot(M,f.lignes,r))}</th>${axD(f.colonnes).map(c=>{const n=gCell(f,r,c);return`<td class="${g.note!=null&&g.r===r&&g.c===c?"hit":g.note!=null&&(g.r===r||g.c===c)?"axe":""}">${Number.isFinite(n)?fmtN(n):"·"}</td>`}).join("")}</tr>`).join("")}</tbody></table></div>`;
  const src=ax=>ax.src.length?ax.src.map(o=>{const ff=gField(M,o.champ);return ff?esc(ff.label)+(o.colonne?` (${esc(((ff.colonnes||[]).find(c=>c.id===o.colonne)||{}).label||o.colonne)})`:""):""}).filter(Boolean).join(" + "):"aucune case choisie";
  return`<div class="f gri"><span class="mlab">${lab}</span>
    <div class="gri-res"><span>${axTxt(f.lignes,g.x,g.rc)}</span><span>×</span><span>${axTxt(f.colonnes,g.y,g.cc)}</span><span class="spacer"></span><span class="gri-n">${vide?"Tableau à compléter":g.note==null?"Note : —":`Note : <b>${fmtN(g.note)}</b> / ${fmtN(mx)}`}</span></div>
    ${tab}<div class="hint">Calculé automatiquement. ${esc(f.lignes.titre)} = ${src(f.lignes)} · ${esc(f.colonnes.titre)} = ${src(f.colonnes)}.${[f.lignes,f.colonnes].filter(ax=>axE(ax)).map(ax=>{const cf=gField(M,ax.cap.champ);return cf?` Time cap : si « ${esc(cf.label)} » indique des exercices non faits, la note se lit dans la colonne correspondante (le temps n'est pas pris en compte).`:""}).join("")}</div></div>`}
/* Éditeur : axes (titre, cases additionnées, paliers) et notes du tableau */
function mGrilleEd(M,p,f){const G=normGrille(f);
  const opts=allFields(M,["nombre","compteur","echelle","choix","case","temps","calcul"]).filter(([v])=>v!==p),tabs=[];
  M.sections.forEach(S=>S.champs.forEach(c=>{if(c.type==="tableau")(c.colonnes||[]).filter(k=>k.type==="nombre"||k.type==="temps").forEach(k=>tabs.push([S.id+"."+c.id+"#"+k.id,`${S.titre} › ${c.label} › colonne « ${k.label} »`]))}));
  const self=p.split(".");const selfPath=(()=>{const S=M.sections[+self[1]];return S?S.id+"."+S.champs[+self[3]].id:""})();
  const axEd=(k,ax)=>{const on=new Set(ax.src.map(o=>o.champ+(o.colonne?"#"+o.colonne:"")));
    return`<div class="mfield stack" style="gap:6px"><strong>${k==="lignes"?"↓ Lignes":"→ Colonnes"}</strong>
    <div class="grid2">${mIn(`${p}.${k}.titre`,ax.titre,'data-rerender',"Nom (ex. Acros, Étoiles)")}${gAxT(M,ax)?mIn(`${p}.${k}.seuils`,ax.seuils.map(fmtT).join(", "),'data-mt="list" data-rerender',"Paliers en min:s (ex. 15:00, 14:45, 14:30) : "+(ax.sens==="bas"?"temps maximal":"temps minimal")+" de chaque "+(k==="lignes"?"ligne":"colonne")):mIn(`${p}.${k}.seuils`,ax.seuils.join(", "),'data-mt="list" data-rerender inputmode="decimal"',"Paliers : valeur "+(ax.sens==="bas"?"maximale":"minimale")+" de chaque "+(k==="lignes"?"ligne":"colonne"))}</div>
    ${mSel(`${p}.${k}.sens`,ax.sens==="bas"?"bas":"haut",[["haut","Plus c'est haut, mieux c'est (points…) : palier = valeur minimale"],["bas","Plus c'est bas, mieux c'est (temps…) : palier = valeur maximale"]],"Sens","data-rerender")}
    ${mIn(`${p}.${k}.labels`,ax.labels.join(" ; "),'data-mt="tlist" data-rerender',"Intitulés affichés, comme sur le référentiel (facultatif, séparés par ;) — ex. < 10 ; 10 à 19 ; ≥ 20")}
    ${mSel(`${p}.${k}.cap.champ`,ax.cap&&ax.cap.champ||"",[["","— pas de time cap —"],...allFields(M,["choix"])],"Au-delà du dernier palier (time cap) : liste déroulante « exercices non faits »",'data-rerender')}
    <p class="hint" style="margin:0">Facultatif. 1re option de la liste = « terminé » (on lit le temps) ; chaque option suivante (« -0,5 exo », « -1 exo »…) ajoute une ${k==="lignes"?"ligne":"colonne"} après le palier le moins bon (ex. après 15'00+), de la moins mauvaise à la pire.</p>
    <div class="f"><span class="mlab">Cases additionnées</span><div class="mchecks">${[...opts.filter(([v])=>v!==selfPath),...tabs].map(([v,l])=>`<label><input type="checkbox" data-mgsrc="${p}.${k}" value="${esc(v)}" ${on.has(v)?"checked":""}> ${esc(l)}</label>`).join("")||'<span class="hint">Ajoutez d\'abord des cases nombre, compteur ou choix.</span>'}</div></div></div>`};
  const grid=`<div class="scroll"><table class="grille ed"><thead><tr><th class="gc">${esc(G.lignes.titre)} ↓ · ${esc(G.colonnes.titre)} →</th>${axD(G.colonnes).map(c=>`<th>${esc(gAxSlot(M,G.colonnes,c))}</th>`).join("")}</tr></thead><tbody>${axD(G.lignes).map(r=>`<tr><th>${esc(gAxSlot(M,G.lignes,r))}</th>${axD(G.colonnes).map(c=>`<td><input data-m="${p}.notes.${r}.v.${c}" data-mt="num" value="${G.notes[r].v[c]??""}" inputmode="decimal" aria-label="Note ligne ${r+1} colonne ${c+1}"></td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  return`${axEd("lignes",G.lignes)}${axEd("colonnes",G.colonnes)}<div class="f"><span class="mlab">Notes du tableau (au croisement)</span>${grid}<p class="hint" style="margin:0">Une ligne par palier de ${esc(G.lignes.titre)}, une colonne par palier de ${esc(G.colonnes.titre)}. Un choix compte pour le dernier nombre de son texte : « Tous éléments présents (3 étoiles) » vaut 3. Pour noter l'AFL1 avec ce tableau : onglet Critères › Correction › « tableau à double entrée ».</p></div>`}
/* --- Rendu d'une séance générique --- */
function gFieldHTML(M,s,S,f,base,L,V,deg){const lockF=!L&&f.type!=="resume"&&(!PREVIEW||sbxOn())&&!CORR&&(((COACH||SBXOBS)&&!f.coach)||(!COACH&&!SBXOBS&&f.coach&&s.coachUid&&M.partage==="coach"));L=L||lockF;const v=s.valeurs[S.id][f.id],k=`${base}.${S.id}.${f.id}`,id="g-"+S.id+"-"+f.id,lab=`${esc(f.label)}${f.unite?` <span class="hint">(${esc(f.unite)})</span>`:""}`,help=f.aide?`<div class="hint">${esc(f.aide)}</div>`:"",st=V&&deg?stamp(deg):"";
  let inner;
  switch(f.type){
    case"texte_long":inner=`<label class="f">${lab}<textarea id="${id}" data-k="${k}">${esc(v)}</textarea></label>`;break;
    case"nombre":inner=`<label class="f">${lab}<input id="${id}" data-k="${k}" value="${esc(v)}" inputmode="decimal" data-rerender></label>`;break;
    case"temps":inner=`<label class="f">${lab}<input id="${id}" data-k="${k}" value="${esc(v)}" inputmode="numeric" placeholder="min:s" data-rerender></label>`;break;
    case"choix":if(f.ffTiles){inner=ffTiles(f,v,id,k,L);break}inner=`<label class="f">${lab}<select id="${id}" data-k="${k}" data-rerender><option value="">—</option>${(f.options||[]).map(o=>`<option ${v===o?"selected":""}>${esc(o)}</option>`).join("")}</select></label>`;break;
    case"echelle":inner=`<label class="f">${lab}<select id="${id}" data-k="${k}" data-rerender><option value="">—</option>${Array.from({length:f.max-f.min+1},(_,i)=>f.min+i).map(n=>`<option ${String(v)===String(n)?"selected":""}>${n}</option>`).join("")}</select></label>`;break;
    case"case":inner=`<label class="row" style="font-weight:600;gap:10px"><input type="checkbox" id="${id}" data-k="${k}" data-t="bool" ${v?"checked":""} style="width:22px;height:22px"> ${lab}</label>`;break;
    case"compteur":inner=`<div class="f"><span style="font-size:.85rem;font-weight:600;color:var(--muted)">${lab}</span><div class="cnt" style="width:150px"><button data-act="gCnt" data-sec="${S.id}" data-f="${f.id}" data-d="-1" ${L?"disabled":""} aria-label="Moins">−</button><span>${num(v)||0}</span><button data-act="gCnt" data-sec="${S.id}" data-f="${f.id}" data-d="1" ${L?"disabled":""} aria-label="Plus">+</button></div></div>`;break;
    case"tableau":{const rows=Array.isArray(v)?v:[];
      inner=`<div class="f"><span style="font-size:.85rem;font-weight:600;color:var(--muted)">${lab}</span><div class="gtab" style="--cols:${f.colonnes.length}">${f.colonnes.map(c=>`<span class="gth">${esc(c.label)}</span>`).join("")}<span></span>
      ${rows.map((r,ri)=>f.colonnes.map(c=>c.type==="membres"?mbCell(f,c,r,`${k}.${ri}.${c.id}`,`${id}-${ri}-${c.id}`,L):c.type==="nombre"&&Number.isFinite(c.max)&&c.max-(c.min??1)<=12?`<select id="${id}-${ri}-${c.id}" data-k="${k}.${ri}.${c.id}" data-rerender aria-label="${esc(c.label)}"><option value="">—</option>${Array.from({length:c.max-(c.min??1)+1},(_,i)=>(c.min??1)+i).map(n=>`<option ${String(r[c.id])===String(n)?"selected":""}>${n}</option>`).join("")}</select>`:c.type==="choix"?`<select id="${id}-${ri}-${c.id}" data-k="${k}.${ri}.${c.id}" aria-label="${esc(c.label)}"><option value="">—</option>${c.options.map(o=>`<option ${r[c.id]===o?"selected":""}>${esc(o)}</option>`).join("")}</select>`:`<input id="${id}-${ri}-${c.id}" data-k="${k}.${ri}.${c.id}" value="${esc(r[c.id])}" ${c.type!=="texte"?'inputmode="decimal"':""} ${c.type==="temps"?'placeholder="min:s"':""} aria-label="${esc(c.label)}">`).join("")+(L?"<span></span>":`<button class="btn ghost small" data-act="gDelRow" data-sec="${S.id}" data-f="${f.id}" data-i="${ri}" aria-label="Retirer la ligne">✕</button>`)).join("")}</div>
      ${L?"":`<button class="btn small" data-act="gAddRow" data-sec="${S.id}" data-f="${f.id}" style="justify-self:start">+ Ligne</button>`}</div>`;break}
    case"passages":{const n=gNb(M,s,f),T=(Array.isArray(v)?v:[]).slice(0,n),D=passDur(T),nextI=T.findIndex(t=>!(num(t&&t.passage)>0));
      const PS=V?gPassStamps(M,S.id+"."+f.id):{},cbv=PS.cible?gRef(M,s,PS.cible.cible):NaN,tolv=PS.cible?num(PS.cible.tolerance)||5:5,inT=D.filter(d=>!isNaN(d)&&!isNaN(cbv)&&Math.abs(d-cbv)<=tolv).length;
      const fi=isNaN(cbv)?-1:D.findIndex(d=>!isNaN(d)&&d-cbv>tolv),tileS=k=>V&&k in PS?stamp(PS[k]):"";
      const cols=`24px minmax(0,1fr)${f.noRep?" 106px":""}${f.adapt?" 44px":""}`,nrT=T.reduce((a,t)=>a+(num(t&&t.noRep)||0),0),adT=T.reduce((a,t)=>a+adCount(t&&t.adapt),0),doneT=T.filter(t=>num(t&&t.passage)>0).length;
      const runBtn=chrono.run?`<button class="btn stop" data-act="chStop">Arrêt</button>`:`<button class="btn go" data-act="chGo">${elapsed()>0?"Reprendre":"Départ"}</button>`;
      inner=`<div class="f"><span style="font-size:.85rem;font-weight:600;color:var(--muted)">${lab}</span>
      ${L?"":`<div class="chrono" aria-label="Chronomètre"><span class="v" id="chrono-v">${fmtC(elapsed())}</span>${runBtn}<button class="btn rz" data-act="chReset" ${chrono.run?"disabled":""}>Réinit.</button></div>`}
      <div class="tours${L?" ro":""}">${T.map((t,i)=>{const pv=num(t&&t.passage)>0,d=D[i];let cls="pas",inn;
        if(pv)inn=`<b>${fmtP(num(t.passage))}</b><small>${isNaN(d)?"tour –":`tour ${fmtT(d)}`}${V&&!isNaN(d)&&!isNaN(cbv)?` · ${d-cbv>0?"+":""}${Math.round(d-cbv)} s`:""}</small>`;else if(i===nextI&&!L){cls+=" next";inn="Passage"}else{cls+=" empty";inn="—"}
        const ad=adCount(t&&t.adapt);
        return`<div class="tr" style="grid-template-columns:${cols}"><div class="tn">${i+1}</div><div class="st"><button class="${cls}" data-act="gPas" data-sec="${S.id}" data-f="${f.id}" data-i="${i}" ${L?"disabled":""}>${inn}</button>${V&&pv&&!isNaN(cbv)?stamp(tourDeg(d,cbv,tolv),true):""}</div>
        ${f.noRep?`<div class="cnt"><button data-act="gNr" data-sec="${S.id}" data-f="${f.id}" data-i="${i}" data-d="-1" ${L?"disabled":""} aria-label="Moins">−</button><span>${num(t&&t.noRep)||0}</span><button data-act="gNr" data-sec="${S.id}" data-f="${f.id}" data-i="${i}" data-d="1" ${L?"disabled":""} aria-label="Plus">+</button></div>`:""}
        ${f.adapt?`<button class="adp${ad?" on":""}" data-act="gAdapt" data-sec="${S.id}" data-f="${f.id}" data-i="${i}" ${L?"disabled":""} aria-label="Adaptation tour ${i+1}">✎${ad?`<span class="badge">${ad}</span>`:""}</button>`:""}</div>`}).join("")}</div>
      ${(()=>{const tl=[];
        if(!isNaN(cbv)&&V)tl.push(`<div class="tile st"><div class="k">Dans le temps</div><div class="v">${inT}<small> / ${n}</small></div>${tileS("temps")}</div>`);
        else tl.push(`<div class="tile st"><div class="k">Tours faits</div><div class="v">${doneT}<small> / ${n}</small></div>${tileS("tours")}</div>`);
        if(V&&"rythme" in PS)tl.push(`<div class="tile st"><div class="k">Rythme</div><div class="v" style="font-size:1.15rem">${doneT<n?"non terminé":fi<0?"tenu":"décroche au tour "+(fi+1)}</div>${tileS("rythme")}</div>`);
        if(f.noRep)tl.push(`<div class="tile st"><div class="k">NO REP</div><div class="v">${nrT}</div>${tileS("norep")}</div>`);
        if(f.adapt)tl.push(`<div class="tile st"><div class="k">Adaptations</div><div class="v">${adT}</div>${tileS("adapt")}</div>`);
        return tl.length>1||V?`<div class="sum" style="grid-template-columns:repeat(${tl.length>2?2:tl.length},minmax(0,1fr))">${tl.join("")}</div>`:""})()}</div>`;break}
    case"exercices":{const rows=Array.isArray(v)?v:[],th=gTheme(M,s),p=data.profil;
      inner=`<div class="f"><span class="mlab">${lab}</span>${rows.map((e,ri)=>{const kk=`${k}.${ri}`,rm=rmFor(p,e.nom);let meta="";
        if(M.rm&&e.type==="haltero"&&e.nom)meta=rm>0?`1RM ${fmtN(rm)} kg${num(e.charge)>0?` · <strong>${Math.round(num(e.charge)/rm*100)} %</strong> du 1RM`:""}`:`<span class="ko">1RM absent du profil</span>${L||COACH?"":` <button class="btn ghost small" data-act="goProfil">Ajouter</button>`}`;
        let exSt="",chSt="";if(V&&e.nom&&th&&th.has&&GRES&&GRES.R.some(x=>x.cr.calcul.type==="reperes"&&x.cr.calcul.source.champ===S.id+"."+f.id)){const c=exoCheck(e,th,p);exSt=stamp(c.ok===null?null:c.ok?4:1);if(c.ok===false)meta+=`${meta?" · ":""}<span class="ko">${esc(c.why)}</span>`}
        if(V&&e.type==="haltero"&&GRES){const ry=GRES.R.find(x=>x.cr.calcul.type==="rythme");if(ry)chSt=stamp(ry.deg)}
        return`<div class="ex"><div class="nm st">${fld(`Exercice ${ri+1}`,kk+".nom",e.nom,'placeholder="ex. Thrusters" list="dl-ex"')}${exSt}</div>
        <label class="f">Type<select id="f-${kk.replace(/\./g,"-")}-type" data-k="${kk}.type" data-rerender>${Object.entries(TYPES).map(([x,l])=>`<option value="${x}" ${e.type===x?"selected":""}>${l}</option>`).join("")}</select></label>
        ${fld(e.type==="cardio"?"Cal / m":"Répét.",kk+".reps",e.reps,'inputmode="numeric" data-rerender')}
        ${e.type==="haltero"?`<div class="st">${fld("Charge kg",kk+".charge",e.charge,'inputmode="decimal" data-rerender')}${chSt}</div>`:fld("Niveau",kk+".niveau",e.niveau||"",`placeholder="${e.type==="cardio"?"ex. damper 5":"ex. genoux au sol"}" data-rerender`)}
        ${meta||(!L&&rows.length>1)?`<div class="ex-meta">${meta}${!L&&rows.length>1?`<span class="spacer"></span><button class="btn ghost small" data-act="gDelRow" data-sec="${S.id}" data-f="${f.id}" data-i="${ri}" aria-label="Retirer l'exercice">Retirer</button>`:""}</div>`:""}</div>`}).join("")}
        ${L?"":`<button class="btn small" data-act="gAddRow" data-sec="${S.id}" data-f="${f.id}" style="justify-self:start;margin-top:8px">+ Exercice</button>`}</div>`;break}
    case"grille":inner=gGrilleHTML(M,s,f,lab);break;
    case"calcul":inner=gCalcHTML(M,s,f,lab);break;
    case"pseudo":inner=`<div class="f"><span class="mlab">${lab}</span><div class="ps-auto" id="${id}">🔒 ${v?esc(v):`<span class="hint">${f.qui==="juge"?"pseudo du coach (rempli quand il ouvre la page)":"ton pseudo (rempli automatiquement)"}</span>`}</div></div>`;break;
    case"resume":{const r=f.src||{},th=gTheme(M,s),p=data.profil,ex=(Array.isArray(gVal(s,r.exos))?gVal(s,r.exos):[]).filter(e=>e&&e.nom),n=parseInt(num(gVal(s,r.tours)))||0,prev=parseT(gVal(s,r.temps));
      const lines=ex.map(e=>{let det;if(e.type==="haltero"){const c=num(e.charge),rm=rmFor(p,e.nom);det=c>0?`${fmtN(c)} kg${rm>0?` <span class="hint">· ${Math.round(c/rm*100)} %</span>`:""}`:'<span class="ko">charge ?</span>'}
        else det=e.niveau?esc(e.niveau):'<span class="hint">niveau non précisé</span>';
        return`<li><span class="rq">${e.reps!==""&&e.reps!=null?esc(e.reps):"?"}</span><span class="mv">${esc(e.nom)}</span><span class="dt">${det}</span></li>`}).join("");
      inner=`<div class="sec-h"><h3>${esc(S.titre)}</h3><span class="spacer"></span>${th?`<span class="chip">${esc(th.label)}</span>`:""}</div>
        ${r.tours||r.temps?`<div class="rs-head">${n||"?"} tour${n>1?"s":""} <span>·</span> ${isNaN(prev)?"? ":fmtT(prev)} par tour</div>`:""}
        ${lines?`<ol class="rs">${lines}</ol>`:'<p class="hint" style="margin:0">Conçois tes exercices ci-dessus.</p>'}`;return inner}
    default:inner=`<label class="f">${lab}<input id="${id}" data-k="${k}" value="${esc(v)}"></label>`}
  const dh=DIFF&&!["resume","grille","calcul","pseudo"].includes(f.type)?diffChip(M,S,f,s):"";
  const out=`<div class="gf st${dh?" cd-on":""}">${inner}${help}${dh}${st}</div>`;
  const cl=lockF&&!COACH&&!SBXOBS&&f.coach;
  return lockF?`<fieldset class="lock${cl?" coach-lock":""}" disabled style="border:0;padding:0;margin:0;min-width:0">${out}</fieldset>`:out}
let GRES=null;
/* Où tamponner chaque critère : sur la case mesurée ; pour les temps de passage, sur la tuile de la mesure (NO REP, adaptations, rythme…). */
function gStampMap(M,res){const m={};res.R.forEach(x=>{const c=x.cr.calcul;if(!x.deg)return;let ps=[];
    if(c.type==="complet"){const sec=String(c.champs[0]||"").split(".")[0];if(sec)ps=["@"+sec]}
    else if(c.source){const f=gField(M,c.source.champ);ps=f&&f.type==="passages"?[]:[c.source.champ]}
    ps.forEach(p=>{if(!m[p]||x.deg<m[p])m[p]=x.deg})});return m}
function gPassStamps(M,path){const o={};if(!GRES)return o;GRES.R.forEach(x=>{const c=x.cr.calcul;if(!c.source||c.source.champ!==path)return;
  const k=c.type==="rythme"?"rythme":{norep:"norep",adaptations:"adapt",proportion_dans_cible:"temps",nb_hors_cible:"temps",termine:"tours",temps_total:"tours"}[c.source.mesure]||"tours";
  o[k]=o[k]?Math.min(o[k],x.deg||0)||null:x.deg;if(c.source.cible!==undefined&&!o.cible)o.cible=c.source});return o}
function gSeance(s){if(!s){cur=null;return gListe()}const M=MOD,w=PW(M);gEnsure(M,s);gAutoPseudo(M,s);gAutoVersion(M,s);const i0=data.seances.indexOf(s),base=`seances.${i0}.valeurs`;
  const cdoc=!PREVIEW&&!VUE&&carnetId&&CORRS[carnetId+"__"+s.id]||null,eleveC=!RO&&!COACH&&!CORR&&cdoc;
  let raw=null;if(eleveC&&CVIEW===s.id){raw=s;s=corrApply(s,cdoc);gEnsure(M,s);s.valide=true}
  DIFF=CORR?{orig:CORR.orig,who:"prof"}:raw?{orig:raw,who:"eleve",coachLogin:raw.coachLogin}:null;
  const V=!!s.valide||!!CORR,L=CORR?false:(V||RO||!!raw);
  const res=gCorrect(M,s,data.profil),sm=gStampMap(M,res),th=M.themes.find(t=>t.id===s.theme);GRES=V?res:null;
  const auto=M.criteres.filter(c=>c.calcul.type==="autoeval");
  let no=0;const secs=verSections(M,s).map(S=>[S,M.sections.indexOf(S)]).map(([S,si])=>S.champs.length&&S.champs.every(f=>f.type==="resume")?`<section class="card resume" id="gsec-${si}">${S.champs.map(f=>gFieldHTML(M,s,S,f,base,L,V)).join("")}</section>`:`<section class="card sec" id="gsec-${si}"><div class="sec-h"><span class="num">${++no}</span><h3>${esc(S.titre)}</h3>${V&&sm["@"+S.id]?`<span class="spacer"></span>${stamp(sm["@"+S.id])}`:""}</div>
    ${S.consigne?`<p class="hint" style="margin:-4px 0 10px">${esc(S.consigne)}</p>`:""}<div class="stack" style="gap:12px">${S.champs.map(f=>gFieldHTML(M,s,S,f,base,L,V,sm[S.id+"."+f.id])).join("")}</div></section>`).join("");
  if(M.gabarit)no=1;
  const ae=auto.length?`<section class="card sec"><div class="sec-h"><span class="num">${no+1}</span><h3>Je m'autoévalue</h3></div><p class="hint" style="margin:-4px 0 10px">Touche un niveau pour lire ses critères.</p>
    <div class="stack" style="gap:12px">${auto.map(c=>`<div class="ae"><div class="row"><strong>${esc(c.afl)} · ${esc(c.label)}</strong>${V?`<span class="spacer"></span>${stamp(s.autoeval[c.id]||null)}`:""}</div><div class="lvls">${[1,2,3,4].map(d=>`<button class="lvl d${d}${s.autoeval[c.id]===d?" on":""}" data-act="gLvl" data-c="${c.id}" data-d="${d}"><b>D${d}</b><span>${esc((c.descripteurs[d-1]||"").slice(0,38))}${(c.descripteurs[d-1]||"").length>38?"…":""}</span></button>`).join("")}</div>${DIFF&&((DIFF.orig.autoeval||{})[c.id]||null)!==(s.autoeval[c.id]||null)?`<div class="cdiff"><span class="cd-who">${DIFF.who==="prof"?(carnetDoc&&carnetDoc.groupe?"👥 Groupe":"👤 Élève"):"👤 Toi"}</span> ${(DIFF.orig.autoeval||{})[c.id]?"D"+DIFF.orig.autoeval[c.id]:"rien"} <span class="cd-ar">→</span> <b>Prof : ${s.autoeval[c.id]?"D"+s.autoeval[c.id]:"rien"}</b></div>`:""}</div>`).join("")}</div></section>`:"";
  const html=`<div class="stack seance" style="--th:var(--accent)">
  ${CORR?"":PREVIEW||(M.pages==="cycle"&&!RO)?"":`<div class="row"><button class="btn ghost small" data-act="back">← ${RO?w.many[0].toUpperCase()+w.many.slice(1):w.mes}</button><span class="spacer"></span>${L?"":`<button class="btn danger small" data-act="delSeance">Supprimer</button>`}</div>`}
  ${CORR?corrTopCard(M,s):RO&&!PREVIEW&&suivi&&route.name==="carnet"?corrStartCard(s,w):eleveC?corrEleveCard(s,cdoc,w,!!raw):""}
  ${M.partage==="coach"&&(!PREVIEW||sbxOn())&&!COACH&&M.sections.some(S=>S.champs.some(f=>f.coach))?vCoachBox(s,L||!!CORR||PREVIEW):""}
  <section class="hero"><div class="hero-top"><span class="eyebrow">${esc(M.ca||"")} · ${M.pages==="cycle"?"Page du cycle":w.One+" "+(i0+1)}${s.epreuve?" · Épreuve":""}</span><span class="spacer"></span>${L||CORR?`<span class="lock-chip">${CORR?"✏️ Correction":raw?"📝 Corrigée":V?"🔒 Validée":"En cours"}</span>`:`<label class="hero-date"><span class="sr">Date</span><input type="date" id="g-date" data-k="seances.${i0}.date" value="${esc(s.date)}"></label>`}</div>
    <div class="hero-main"><div><h2 class="hero-t" style="font-size:2.1rem">${esc(M.titre)}</h2><div class="hero-sub">${th?`<strong>${esc(th.label)}</strong> · ${esc(th.desc||"")}${th.reps?`<br>${th.reps[0]}–${th.reps[1]} répétitions`:""}${th.pct?` · haltéro ${th.pct[0]}–${th.pct[1]} % du 1RM`:""}`:esc(M.description||"")}</div></div>${V?gRing(res):""}</div>
    ${M.themes.length&&!L&&!CORR?`<div class="pills" style="grid-template-columns:repeat(${Math.min(3,M.themes.length)},minmax(0,1fr))">${M.themes.map(t=>`<label title="${esc(t.desc)}"><input type="radio" name="gth" data-k="seances.${i0}.theme" data-rerender value="${t.id}" ${s.theme===t.id?"checked":""}>${esc(t.label)}</label>`).join("")}</div>`:""}
    ${L||CORR||M.pages!=="seance"?"":`<label class="hero-ep"><input type="checkbox" id="g-ep" data-k="seances.${i0}.epreuve" data-t="bool" data-rerender ${s.epreuve?"checked":""}> Séance d'épreuve</label>`}${isGroupe()?`<div class="hint" style="color:#cfd6dc;margin-top:6px">👥 Page partagée avec ${esc((carnetDoc.logins||[]).filter(l=>l!==me.login).join(", "))}</div>`:""}</section>
  ${M.versions?verBar(M,s,PREVIEW&&!L):""}<fieldset class="lock" ${L?"disabled":""}><legend class="sr">Séance</legend><div class="stack">${M.gabarit?ffHTML(M,s,base,()=>L,V,sm):secs}${ae}</div></fieldset>${gDatalist(M,s)}
  ${V?gCorrHTML(M,res):""}
  ${CORR?corrBar(M,s):raw?"":PREVIEW?`<div class="valid-bar"><button class="btn big" data-act="gTest">${V?"Revenir en saisie":"🧪 Tester la correction"}</button></div>`:V?(RO?`<div class="valid-bar"><button class="btn big" data-act="unlock">🔓 Déverrouiller la ${w.one} pour l'élève</button></div>`:""):RO?`<p class="hint" style="text-align:center">${w.One} pas encore validée par l'élève.</p>`:`<div class="valid-bar"><button class="btn big go-valid" data-act="gValidate"><span>🏁 ${w.val}</span><small>La ${w.one} ne pourra plus être modifiée${isGroupe()?" (pour tout le groupe)":""}</small></button></div>`}</div>`;DIFF=null;return html}
function gRing(res){const ok=res.complete,v=ok?res.tot:res.n1,max=ok?20:res.max1,f=Math.max(0,Math.min(1,v/max)),R=34,Lg=2*Math.PI*R;
  return`<div class="ring"><svg viewBox="0 0 84 84" width="84" height="84" aria-hidden="true"><circle cx="42" cy="42" r="${R}" fill="none" stroke="rgba(255,255,255,.22)" stroke-width="8"/><circle cx="42" cy="42" r="${R}" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" stroke-dasharray="${(Lg*f).toFixed(1)} ${Lg.toFixed(1)}" transform="rotate(-90 42 42)"/></svg><div class="ring-v"><b>${fmtN(v)}</b><small>/ ${max}</small></div><div class="ring-m">${f>=.8?"Séance au top !":f>=.6?"Belle séance":f>=.4?"Ça progresse":"On ajuste et on repart"}</div></div>`}
function gCorrHTML(M,res){let dom="";const rows=res.R.slice().sort((a,b)=>a.cr.afl.localeCompare(b.cr.afl)).map(x=>{const h=x.cr.afl!==dom?`<div class="dom">${x.cr.afl}</div>`:"";dom=x.cr.afl;
    return h+`<div class="crit">${stamp(x.deg)}<div><div class="t">${esc(x.cr.label)}</div><div class="m">${x.deg?esc(x.cr.descripteurs[x.deg-1]||""):"À compléter"}</div>${x.deg&&x.cr.conseils&&x.cr.conseils[x.deg-1]?`<div class="tip">→ ${esc(x.cr.conseils[x.deg-1])}</div>`:""}<div class="hint" style="font-size:.78rem;margin-top:2px">${esc(gCalcText(M,x.cr))}</div></div><div class="rx">${x.cr.afl==="AFL1"&&x.deg?(x.vmax!==undefined?fmtN(x.val)+" / "+fmtN(x.vmax):fmtN(x.cr.points[x.deg-1])+" pt"):""}</div></div>`}).join("");
  return`<section class="card corr" id="corr"><div class="sec-h"><h2>Ma correction</h2><span class="hint">Référentiel ${esc(M.ca||"")}</span></div>
  <div class="score"><div class="tile"><div class="k">AFL1</div><div class="v">${fmtN(res.n1)}<small> / ${res.max1}</small></div></div>
  <div class="tile"><div class="k">AFL2 + AFL3</div><div class="v">${fmtN(res.a2.p+res.a3.p)}<small> / 8</small></div></div>
  <div class="tile tot"><div class="k">Note</div><div class="v">${res.complete?fmtN(res.tot):"–"}<small> / 20</small></div></div></div>
  <div style="margin-top:4px">${rows}</div><div class="legend" style="margin-top:10px">${[1,2,3,4].map(d=>`<span>${stamp(d,true)} D${d}</span>`).join("")}</div></section>`}
function newPage(){const last=data.seances[data.seances.length-1];const n={id:uid(),ordre:Date.now(),date:today(),valide:false,epreuve:false,theme:last?last.theme:(MOD.themes[0]&&MOD.themes[0].id)||"",valeurs:{},autoeval:{}};
  const rep2=last&&MOD.pages==="seance"?MOD.sections.filter(S=>S.reprise&&last.valeurs&&last.valeurs[S.id]):[];rep2.forEach(S=>n.valeurs[S.id]=clone(last.valeurs[S.id]));
  gEnsure(MOD,n);data.seances.push(n);cur=n.id;save();return rep2}
function gListe(){if(MOD.pages==="cycle"&&data.seances.length&&!RO){cur=data.seances[0].id;return gSeance(curS())}const w=PW(MOD);const items=data.seances.map((s,i)=>{let right=`<span class="chip">En cours</span>`,col="var(--line)";
    const cd=carnetId&&CORRS[carnetId+"__"+s.id],se=cd?sEff(s):s;
    if(s.valide||cd){const r=gCorrect(MOD,se,data.profil);const f=r.complete?r.tot/20:r.n1/r.max1,d=f>=.8?4:f>=.6?3:f>=.4?2:1;col=`var(--d${d})`;right=`<div class="big">${r.complete?fmtN(r.tot):fmtN(r.n1)}<small>${r.complete?"/ 20":"/ "+r.max1+" (AFL1)"}</small></div>`}
    return`<button class="s-item" data-open="${s.id}" style="border-left-color:${col}"><div><div class="row"><strong>${w.One} ${i+1}</strong>${s.valide?" 🔒":""}${cd?`<span class="chip corr-chip">${RO?(cd.envoye?"📤 Corrigée":"✏️ Brouillon"):"📝 Corrigée"}</span>`:""}${s.epreuve?'<span class="chip" style="border-color:var(--accent);color:var(--accent)">Épreuve</span>':""}</div><div class="hint">${fmtDate(s.date)}</div></div>${right}</button>`}).reverse().join("");
  return`<div class="stack"><div class="row"><h2>${RO?w.many[0].toUpperCase()+w.many.slice(1):w.mes}</h2><span class="spacer"></span>${RO||MOD.pages==="cycle"?"":`<button class="btn primary" data-act="gNew">${w.nouv}</button>`}</div>
  ${isGroupe()?`<p class="hint" style="margin:-6px 0 0">Pages partagées avec ${esc((carnetDoc.logins||[]).filter(l=>l!==me.login).join(", ")||"ton groupe")}.</p>`:""}
  ${items?`<div class="list-s">${items}</div>`:`<div class="card"><p style="margin:0">Aucune ${w.one} pour l'instant.</p></div>`}</div>`}
function gBilan(){const V=data.seances.map((s,i)=>s.valide?{s,i,r:gCorrect(MOD,sEff(s),data.profil)}:null).filter(Boolean);
  const ep=V.filter(x=>x.s.epreuve),last=ep.length?ep[ep.length-1]:V[V.length-1],a3p=carnetDoc&&carnetDoc.afl3Prof;
  const heat=V.length?`<div class="scroll"><table class="heat"><thead><tr><th>Critère</th>${V.map(x=>`<th>S${x.i+1}</th>`).join("")}</tr></thead><tbody>${MOD.criteres.map(c=>`<tr><td>${esc(c.afl)} · ${esc(c.label)}</td>${V.map(x=>`<td>${stamp(x.r.R.find(y=>y.cr.id===c.id).deg,true)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`:"";
  return`<div class="stack"><h2>${RO?"Bilan de l'élève":"Mon bilan"}</h2>
  <section class="card"><div class="score"><div class="tile"><div class="k">AFL1 ${last&&last.s.epreuve?"· épreuve":"· dernière"}</div><div class="v">${last?fmtN(last.r.n1):"–"}<small> / ${last?last.r.max1:12}</small></div></div>
  <div class="tile"><div class="k">Note ${last&&last.s.epreuve?"d'épreuve":"dernière séance"}</div><div class="v">${last&&last.r.complete?fmtN(last.r.tot):"–"}<small> / 20</small></div></div>
  <div class="tile"><div class="k">Séances validées</div><div class="v">${V.length}</div></div></div>
  <p class="hint" style="margin:8px 0 0">${a3p?`AFL3 fixé par l'enseignant : <strong>D${a3p}</strong>.`:"L'AFL3 définitif est fixé par l'enseignant."}</p></section>
  ${heat?`<section class="card"><div class="sec-h"><h3>Degrés séance par séance</h3></div>${heat}</section>`:""}</div>`}
function gProfil(){const p=data.profil;
  return`<div class="stack">${vGroupeCard()}<fieldset class="lock" ${RO?"disabled":""}><legend class="sr">Profil</legend><div class="stack">
  <section class="card"><div class="sec-h"><h2>${RO?"Profil de l'élève":"Mon profil"}</h2><span class="spacer"></span><span class="chip">${esc(RO?(carnetDoc&&carnetDoc._login)||"":me.login||"")}</span></div>
    <label class="f">Mon projet : ce que je veux développer<textarea id="g-projet" data-k="profil.projet">${esc(p.projet||"")}</textarea></label></section>
  ${MOD&&MOD.rm?`<section class="card"><div class="sec-h"><h2>Mes 1RM</h2><span class="hint">Charge maximale sur 1 répétition</span></div>
    <div class="stack" style="gap:8px">${(p.rms||[]).map((r,i)=>`<div class="rm">${fld(i?"":"Exercice",`profil.rms.${i}.nom`,r.nom,'placeholder="ex. Back squat" list="dl-ex"')}${fld(i?"":"1RM (kg)",`profil.rms.${i}.kg`,r.kg,'inputmode="decimal"')}${RO?"<span></span>":`<button class="btn ghost small" data-act="delRm" data-i="${i}" aria-label="Retirer ce 1RM">Retirer</button>`}</div>`).join("")}</div>
    ${RO?"":`<div class="row" style="margin-top:10px"><button class="btn small" data-act="addRm">+ Ajouter un 1RM</button></div>`}
    <p class="hint" style="margin:8px 0 0">L'appli s'en sert pour calculer le % de charge de tes exercices d'haltérophilie. Écris le nom de l'exercice comme dans ta séance.</p></section>`:""}
  <section class="card"><div class="sec-h"><h2>Répartition AFL2 / AFL3</h2></div>
    <div class="rep-opts">${Object.entries(REPART).map(([k,[a,b]])=>`<label class="rep-opt"><input type="radio" name="grep" data-k="profil.repartition" data-rerender value="${k}" ${p.repartition===k?"checked":""}><span>${a} / ${b}</span>AFL2 / AFL3</label>`).join("")}</div></section></div></fieldset>${MOD?gDatalist(MOD):""}</div>`}
function gModalPas(sec,fid,i){const s=curS(),t=s.valeurs[sec][fid][i],el=elapsed();
  openModal(`<h3>Tour ${i+1} · temps de passage</h3><input id="m-pas" class="big-in" inputmode="decimal" value="${num(t.passage)>0?esc(fmtP(num(t.passage))):""}" placeholder="1:30,0"><div class="err" id="m-err"></div>
  <div class="grid2"><button class="btn primary" data-mact="gSavePas">Enregistrer</button>${el>0?`<button class="btn" data-mact="gTakePas">Prendre le chrono (${fmtC(el)})</button>`:`<button class="btn" data-mact="close">Annuler</button>`}</div>
  ${num(t.passage)>0?`<button class="btn danger small" data-mact="gClearPas">Effacer ce temps</button>`:""}`,{type:"gpas",sec,fid,i})}
function gModalLvl(cid,d){const c=MOD.criteres.find(x=>x.id===cid),s=curS();
  openModal(`<h3>${esc(c.afl)} · ${esc(c.label)}</h3><div class="lvls">${[1,2,3,4].map(x=>`<button class="lvl d${x}${x===d?" on":""}" data-mact="gLvlTab" data-c="${cid}" data-d="${x}"><b>D${x}</b></button>`).join("")}</div>
  <p style="margin:0">${esc(c.descripteurs[d-1]||"")}</p>
  <div class="grid2"><button class="btn primary" data-mact="gPickLvl" data-c="${cid}" data-d="${d}">${s.autoeval[cid]===d?"Niveau choisi ✓":"Je choisis D"+d}</button><button class="btn" data-mact="close">Fermer</button></div>`,{type:"glvl"})}

/* --- Activités : chargement des modèles --- */
async function loadActs(classeDoc){const ids=(classeDoc&&classeDoc.activites)||[];const list=[];
  for(const id of ids){try{const m=await fb.getModele(id);if(m&&m.modele)list.push({id,titre:m.modele.titre,ca:m.modele.ca,desc:m.modele.description,doc:m})}catch(e){console.warn(e)}}return list}
async function openCarnetModele(act){RETRY=()=>openCarnetModele(act);go("loading",{msg:"Ouverture du carnet…"});
  try{if(act===CA5_ID){const r=await ca5Modele(me.profId);MODDOC=r.doc;MOD=r.M}
    else{const md=actsList.find(a=>a.id===act)||{doc:await fb.getModele(act)};if(!md.doc)throw{code:"not-found"};MODDOC=md.doc;MOD=normModele(md.doc.modele||md.doc.brouillon)}
    activite=act;RO=false;PREVIEW=false;MODBASE=MOD;let c;
    if(VUE){carnetId="apercu";c={id:"apercu",eleveUid:me.uid,profId:me.profId,classeId:me.classeId,activite:act,profil:blankProfil()};setCarnetData(c,[]);view="seances";cur=null;syncState="ok";if(MOD.pages==="cycle"){newPage();cur=data.seances[0].id}go("carnet");toast("Vue élève : tu peux tout essayer, rien n'est enregistré");return}
    if(MOD.partage==="groupe"){c=await fb.findGroupeCarnet(me.uid,act);if(!c){carnetId=null;carnetDoc={sansGroupe:true};data={profil:blankProfil(),seances:[]};view="seances";cur=null;go("carnet");return}MOD=modFor(MODBASE,me.uid);carnetId=c.id}
    else{carnetId=`${me.uid}_${act}`;c=await fb.getCarnet(carnetId);
      if(!c){const b={eleveUid:me.uid,profId:me.profId,classeId:me.classeId,activite:act,profil:blankProfil()};await fb.createCarnet(carnetId,b);c={id:carnetId,...b}}}
    if(MOD.versions&&me.role==="eleve"){try{const cl=await fb.getClasse(me.classeId);if(cl)eleveClasse=cl}catch(e){console.warn(e)}}
    const ss=await fb.listSeances(carnetId);CORRS={};CVIEW=null;try{(await fb.listCorrectionsEleve(me.uid,carnetId)).forEach(x=>CORRS[x.id]=x)}catch(e){console.warn(e)}
    setCarnetData(c,ss);view="seances";cur=null;syncState="ok";
    if(MOD.pages==="cycle"){if(!data.seances.length)newPage();cur=data.seances[0].id}
    go("carnet")}
  catch(e){console.error(e);go("error",{msg:authMsg(e)})}}

/* --- Suivi prof (activité générique) --- */
function gRowStats(r){if(!r.c)return null;const d={profil:{repartition:"4-4",...(r.c.profil||{})},seances:r.ss.slice().sort((a,b)=>(a.ordre||0)-(b.ordre||0)).map(x=>CORRS[r.c.id+"__"+x.id]?corrApply(x,CORRS[r.c.id+"__"+x.id]):x)};
  const V=d.seances.filter(s=>s.valide),ep=V.filter(s=>s.epreuve),last=ep.length?ep[ep.length-1]:V[V.length-1];
  const M=modFor(MODBASE||MOD,r.e.id);d.seances.forEach(x=>gEnsure(M,x));const a3d=a3Of(r.c,r.e.id);
  const res=last?gCorrect(M,last,d.profil):null,m3=REPART[d.profil.repartition||"4-4"][1],a3=a3d?m3*a3d/4:null;
  const nc=r.ss.filter(x=>CORRS[r.c.id+"__"+x.id]).length;
  const m2=REPART[d.profil.repartition||"4-4"][0],q={AFL1:qsAfl(r.e.id,"AFL1",res?res.max1:((M.bareme&&M.bareme.afl1&&M.bareme.afl1.max)||12),res?res.n1:null),AFL2:qsAfl(r.e.id,"AFL2",m2,res?res.a2.p:null),AFL3:qsAfl(r.e.id,"AFL3",m3,a3)};
  const v1=q.AFL1?q.AFL1.val:res&&res.n1,v2=q.AFL2?q.AFL2.val:res&&res.a2.p,v3=q.AFL3?q.AFL3.val:a3;
  const tot=[v1,v2,v3].some(x=>x===null||x===undefined)?null:Math.round((v1+v2+v3)*10)/10;
  return{nv:V.length,n:d.seances.length,res,ep:!!ep.length,m3,a3,tot,ae3:res&&res.a3.d,nc,q}}
function qsCell(e,S,afl){const P=afl==="AFL1"?((MOD.bareme&&MOD.bareme.afl1&&MOD.bareme.afl1.max)||12):4,x=S&&S.q?S.q[afl]:qsAfl(e.id,afl,P,null);if(!x)return`<td class="n">–</td>`;
  return`<td class="noclk n"><input data-qsn="${e.id}|${afl}" value="${x.manuel===null?"":fmtN(x.manuel)}" placeholder="${x.auto===null?"–":fmtN(x.auto)}" inputmode="decimal" style="width:58px" aria-label="${afl} retenu"><div class="hint">/ ${fmtN(x.P)} · 📝 ${x.n}/${x.tot}</div></td>`}
function gSuivi(){const rep=getReperes(classe.id),JG=MOD.partage==="coach"&&MOD.sections.some(S=>S.champs.some(f=>f.coach)),QA=qsAfls(),qc=(e,S)=>QA.map(a=>qsCell(e,S,a)).join("");
  const jCell=e=>{if(!JG)return"";const j=jugeDe(e.id);return`<td class="n">${j?`<strong>${fmtN(j.note)}</strong><span class="hint"> / ${fmtN(j.max)}</span><div class="hint">${j.n} p. · ${j.ec} écart${j.ec>1?"s":""}</div>`:"–"}</td>`};
  const rows=suivi.rows.map((r,i)=>{const S=gRowStats(r);const name=`<strong>N°${r.e.numero}</strong>${rep[r.e.id]?` · ${esc(rep[r.e.id])}`:""}<div class="hint"><code>${esc(r.e.login)}</code>${S&&S.nc?` · ✏️ ${S.nc}`:""}</div>`;
    if(!S)return`<tr><td>${name}</td><td colspan="5" class="hint">Carnet pas encore ouvert</td>${qc(r.e,null)}${jCell(r.e)}</tr>`;
    return`<tr class="clk" data-act="openEleve" data-i="${i}"><td>${name}</td><td class="n">${S.nv}<span class="hint"> / ${S.n}</span></td><td class="n">${S.res&&S.res.complete?fmtN(S.res.tot):"–"}</td><td class="n">${S.res?fmtN(S.res.n1):"–"}${S.ep?" ★":""}</td>
    <td class="noclk"><select id="a3-${i}" data-a3="${i}" aria-label="AFL3"><option value="">—</option>${[1,2,3,4].map(d=>`<option value="${d}" ${a3Of(r.c,r.e.id)==d?"selected":""}>D${d}</option>`).join("")}</select><div class="hint">/ ${S.m3}${S.ae3?` · auto D${S.ae3}`:""}${r.c.groupe?` · 👥 ${(r.c.logins||[]).length}`:""}</div></td>
    <td class="n"><strong>${S.tot===null?"–":fmtN(S.tot)}</strong></td>${qc(r.e,S)}${jCell(r.e)}</tr>`}).join("");
  return`<div class="stack"><div class="row"><button class="btn ghost small" data-act="backClasse">← ${esc(classe.nom)}</button><span class="spacer"></span><button class="btn small" data-act="gExport">Exporter (.csv)</button><button class="btn small" data-act="openModele" data-id="${suivi.act}">Modifier le carnet</button></div>
  <div class="class-hero"><span class="eyebrow">${esc(MOD.ca||"")} · ${esc(classe.nom)}</span><h2>${esc(MOD.titre)}</h2></div>
  <section class="card"><div class="sec-h"><h3>Carnets des élèves</h3><span class="hint">Touchez une ligne pour ouvrir le carnet</span></div>
  ${rows?`<div class="scroll"><table class="suivi"><thead><tr><th>Élève</th><th class="n">Séances validées</th><th class="n">Dernière note /20</th><th class="n">AFL1</th><th>AFL3 prof</th><th class="n">Total /20</th>${QA.map(a=>`<th class="n">📝 ${a} retenu</th>`).join("")}${JG?'<th class="n">⚖️ Note de juge</th>':""}</tr></thead><tbody>${rows}</tbody></table></div>`:`<p class="hint">Aucun élève dans cette classe.</p>`}
  <p class="hint" style="margin:8px 0 0">Total = AFL1 et AFL2 de la séance d'épreuve (★) ou de la dernière séance validée + AFL3 fixé par vous. Les pages que vous avez corrigées (✏️) sont notées avec vos choix.${QA.length?` 📝 ${QA.join(", ")} retenu : note du QCM + reste venant du carnet ; tapez une note pour la remplacer (vide = calcul automatique), elle compte dans le Total.`:""}${JG?` Note de juge : moyenne des pages jugées par l'élève, − ${fmtN(jugeCfg(MOD).perte)} pt par écart avec votre correction.`:""}</p></section></div>`}

/* ===================== Correction du prof (2026.11.21-2) =====================
   Le prof ouvre la page d'un élève et déplace les marqueurs (réponses de l'élève, cases du juge / observateur, autoévaluation).
   Ses choix sont rangés à part (corrections/{carnetId__sid}) : la page de l'élève n'est jamais écrasée.
   Chaque case du juge modifiée par le prof = un écart : la note de juge baisse automatiquement.
   « Envoyer » distribue la correction ; l'élève ne la voit que si le prof l'a rendue visible. */
const cNorm=v=>v===undefined||v===null||v===""?"":JSON.stringify(v);
const jugeCfg=M=>(M&&M.juge)||{max:4,perte:1};
function corrApply(s,c){const x=clone(s);if(!c)return x;x.valeurs=x.valeurs||{};
  Object.entries(c.valeurs||{}).forEach(([a,o])=>{x.valeurs[a]={...(x.valeurs[a]||{})};Object.entries(o||{}).forEach(([b,v])=>x.valeurs[a][b]=clone(v))});
  if(c.autoeval&&Object.keys(c.autoeval).length)x.autoeval={...(x.autoeval||{}),...c.autoeval};return x}
/** Page vue avec la correction (prof : brouillons compris ; élève : seulement les corrections visibles chargées). */
function sEff(s){if(CORR&&data&&s===data.seances[CORR.i])return s;const c=carnetId&&CORRS[carnetId+"__"+s.id];return c?corrApply(s,c):s}
function fmtCVal(f,v){if(f.type==="case")return v?"✔ cochée":"✗ non cochée";
  if(cNorm(v)==="")return"vide";
  if(f.type==="passages")return(Array.isArray(v)?v:[]).filter(t=>num(t&&t.passage)>0).map(t=>fmtP(num(t.passage))+(num(t.noRep)?` (${t.noRep} NO REP)`:"")).join(" · ")||"aucun temps";
  if(f.type==="tableau")return(Array.isArray(v)?v:[]).map(r=>Object.values(r||{}).filter(x=>x!==""&&x!=null).join(" / ")).filter(Boolean).join(" ; ").slice(0,90)||"vide";
  if(f.type==="exercices")return(Array.isArray(v)?v:[]).filter(e=>e&&e.nom).map(e=>`${e.reps||"?"} ${e.nom}${num(e.charge)>0?" "+e.charge+" kg":""}`).join(" · ").slice(0,90)||"vide";
  return String(v).slice(0,80)}
function diffWho(f){const D=DIFF;if(f.coach&&D.orig.coachUid)return D.who==="prof"?`⚖️ Juge ${esc(D.orig.coachLogin||"")}`:`⚖️ Ton observateur${D.orig.coachLogin?" "+esc(D.orig.coachLogin):""}`;
  return D.who==="prof"?(carnetDoc&&carnetDoc.groupe?"👥 Groupe":"👤 Élève"):"👤 Toi"}
function diffChip(M,S,f,s){const p=S.id+"."+f.id,o=gVal(DIFF.orig,p),v=gVal(s,p);if(cNorm(o)===cNorm(v))return"";
  return`<div class="cdiff${f.coach&&DIFF.orig.coachUid?" juge":""}"><span class="cd-who">${diffWho(f)}</span> ${esc(fmtCVal(f,o))} <span class="cd-ar">→</span> <b>Prof : ${esc(fmtCVal(f,v))}</b></div>`}
function corrOverlay(){const M=MOD,o=CORR.orig,w=data.seances[CORR.i],old=CORRS[CORR.key]||{},val={},ae={};
  Object.entries(old.valeurs||{}).forEach(([a,x])=>{if(!M.sections.some(S=>S.id===a))val[a]=x});/* parties individuelles des autres membres du groupe */
  M.sections.forEach(S=>S.champs.forEach(f=>{if(["resume","grille","calcul","pseudo"].includes(f.type))return;const p=S.id+"."+f.id,b=gVal(w,p);if(cNorm(gVal(o,p))!==cNorm(b))(val[S.id]=val[S.id]||{})[f.id]=clone(b??null)}));
  Object.entries(old.autoeval||{}).forEach(([k,v])=>{if(!M.criteres.some(c=>c.id===k))ae[k]=v});
  M.criteres.filter(c=>c.calcul.type==="autoeval").forEach(c=>{const a=(o.autoeval||{})[c.id]||null,b=(w.autoeval||{})[c.id]||null;if(a!==b)ae[c.id]=b});
  return{valeurs:val,autoeval:ae}}
function corrStats(ov){const M=MOD,o=CORR.orig,hasJ=!!o.coachUid&&coachPaths(MOD).length>0,jc=jugeCfg(M);
  const n=Object.values(ov.valeurs).reduce((a,x)=>a+Object.keys(x||{}).length,0)+Object.keys(ov.autoeval).length;
  const ec=hasJ?coachPaths(M).filter(p=>{const[a,b]=p.split(".");return ov.valeurs[a]&&b in ov.valeurs[a]}).length:0;
  return{n,hasJ,ec,note:hasJ?Math.max(0,Math.round((jc.max-jc.perte*ec)*10)/10):null,max:hasJ?jc.max:null}}
async function corrFlush(extra){clearTimeout(saveTimer);saveTimer=null;if(!CORR)return;const ov=corrOverlay(),st=corrStats(ov),old=CORRS[CORR.key];
  if(!old&&!st.n&&!extra){setSync("ok");return}
  const o=CORR.orig,r=CORR.row,c=carnetDoc||{};
  const d={envoye:false,partage:true,...(old||{}),profId:me.uid,classeId:classe.id,activite:suivi.act,carnetId,sid:o.id,
    eleves:c.groupe?(c.membres||[]):[c.eleveUid],eleveLogin:c.groupe?(c.logins||[]).join(", "):r.e.login,eleveNum:r.e.numero||null,page:CORR.i+1,date:o.date||"",
    coachUid:st.hasJ?o.coachUid:null,coachLogin:st.hasJ?(o.coachLogin||""):null,valeurs:ov.valeurs,autoeval:ov.autoeval,nbModifs:st.n,ecarts:st.ec,jugeNote:st.note,jugeMax:st.max,...(extra||{})};
  d.visible=!!(d.envoye&&d.partage);delete d.id;delete d.maj;
  setSync(navigator.onLine===false?"offline":"saving");
  try{await fb.setCorrection(CORR.key,d);CORRS[CORR.key]={id:CORR.key,...d};setSync("ok")}catch(e){console.error(e);setSync("error");toast(authMsg(e))}}
function corrStart(from){const s=curS();if(!s||!suivi||RO!==true)return;const i=data.seances.indexOf(s);gEnsure(MOD,s);
  const w=corrApply(s,CORRS[carnetId+"__"+s.id]);gEnsure(MOD,w);w.valide=false;data.seances[i]=w;
  CORR={key:carnetId+"__"+s.id,i,orig:s,row:suivi.rows[suivi.cur],from:from||null};RO=false;syncState="ok";render();window.scrollTo(0,0)}
async function corrExit(){if(!CORR)return;await corrFlush();const C=CORR;data.seances[C.i]=C.orig;CORR=null;RO=true;
  if(C.from==="tab"){openClasse(classe.id,"correction");return}render()}
async function corrEnvoyer(){if(!CORR)return;const p=$("#corr-vis"),partage=p?p.checked:true;
  await corrFlush({envoye:true,partage,envoyeLe:new Date().toISOString()});
  toast(partage?"Correction envoyée : l'élève la voit dans son carnet":"Correction enregistrée comme envoyée (non visible par l'élève)");rerenderKeep()}
async function corrVisible(v){if(!CORR)return;const old=CORRS[CORR.key];if(!old){rerenderKeep();return}await corrFlush({partage:!!v});toast(v?(old.envoye?"L'élève voit maintenant la correction":"Elle sera visible à l'envoi"):"Correction masquée pour l'élève");rerenderKeep()}
function corrStartCard(s,w){const c=CORRS[carnetId+"__"+s.id];
  return`<section class="card corr-start"><div class="row"><span style="font-size:1.5rem">✏️</span><div style="flex:1;min-width:180px"><strong>${c?(c.envoye?"Correction envoyée":"Correction en brouillon"):"Évaluer cette "+w.one}</strong>
  <div class="hint">${c?`${c.nbModifs||0} modification${(c.nbModifs||0)>1?"s":""}${c.jugeNote!=null?` · juge ${esc(c.coachLogin||"")} : ${fmtN(c.jugeNote)} / ${fmtN(c.jugeMax)}`:""}${c.envoye?(c.visible?" · visible par l'élève":" · masquée pour l'élève"):""}`:"Déplacez les réponses de l'élève et du juge : la note se recalcule, et le juge perd des points à chaque écart."}</div></div>
  <button class="btn primary" data-act="corrStart">${c?"Reprendre la correction":"Corriger"}</button></div></section>`}
function corrTopCard(M,s){const st=corrStats(corrOverlay()),c=CORRS[CORR.key];
  return`<section class="card corr-top"><div class="row"><button class="btn ghost small" data-act="corrExit">← Terminer</button><span class="spacer"></span><span id="sync" class="sync"></span></div>
  <p style="margin:8px 0 0"><strong>✏️ Vous corrigez.</strong> Touchez les cases pour placer vos choix : les écarts avec l'élève ou le juge s'affichent en orange. Rien n'est modifié dans le carnet de l'élève.</p>
  <div class="row" style="margin-top:8px;gap:6px"><span class="chip">${st.n} modification${st.n>1?"s":""}</span>${st.hasJ?`<span class="chip juge-chip">⚖️ Juge ${esc(CORR.orig.coachLogin||"")} : ${st.ec} écart${st.ec>1?"s":""} → <b>${fmtN(st.note)} / ${fmtN(st.max)}</b></span>`:CORR.orig.coachUid?"":`<span class="hint">Pas de juge sur cette page.</span>`}${c?`<span class="chip">${c.envoye?"📤 Envoyée":"Brouillon"}</span>`:""}</div></section>`}
function corrBar(M,s){const c=CORRS[CORR.key],vis=c?c.partage!==false:true;
  return`<section class="card corr-bar stack" style="gap:10px"><label class="row" style="gap:8px;font-weight:600"><input type="checkbox" id="corr-vis" data-corrvis ${vis?"checked":""} style="width:22px;height:22px"> L'élève voit la correction (ses choix et ceux de son juge face aux vôtres)</label>
  <div class="valid-bar"><button class="btn big go-valid" data-act="corrSend"><span>📤 ${c&&c.envoye?"Renvoyer la correction":"Envoyer la correction"}</span><small>${c&&c.envoye?"Déjà envoyée"+(c.envoyeLe?" le "+new Date(c.envoyeLe).toLocaleDateString("fr-FR"):"")+" · vos dernières modifications sont déjà en ligne":"Le carnet corrigé est distribué à l'élève"}</small></button>
  <button class="btn" data-act="corrExit">Terminer plus tard (brouillon)</button></div></section>`}
function corrEleveCard(s,c,w,on){const n=c.nbModifs||0;
  return`<section class="card corr-el"><div class="row"><span style="font-size:1.6rem">📝</span><div style="flex:1;min-width:170px"><strong>Ton prof a corrigé cette ${w.one}</strong><div class="hint">${n?`${n} réponse${n>1?"s":""} déplacée${n>1?"s":""} par ton prof.`:"Ton prof est d'accord avec toutes tes réponses."}${on?" En orange : ta réponse (ou celle de ton observateur) et celle du prof.":""}</div></div>
  <button class="btn ${on?"":"primary"} small" data-act="cView">${on?"Revoir ma version":"Voir la correction"}</button></div></section>`}
/* --- Onglet Correction de la classe --- */
async function openCorrTab(){RETRY=()=>openCorrTab();go("loading",{msg:"Chargement des corrections…"});
  try{const L=await fb.listCorrections(me.uid,classe.id);const acts=(classeDossiers||[]).flatMap(x=>x.carnets.map(k=>({id:k.id,titre:k.titre,pub:k.pub,dos:x.d.titre})));
    (classeActs||[]).forEach(a=>{if(!acts.some(x=>x.id===a.id))acts.push({id:a.id,titre:a.titre,pub:true})});
    L.forEach(c=>{if(!acts.some(x=>x.id===c.activite))acts.push({id:c.activite,titre:c.activite===CA5_ID?"Cross training CA5":"Carnet",pub:true})});
    CX={list:L.sort((a,b)=>String(a.date).localeCompare(String(b.date))),acts};classeTab="correction";go("classe")}
  catch(e){console.error(e);go("error",{msg:authMsg(e)})}}
function vCorrTab(){if(!CX)return`<div class="card"><p style="margin:0">Chargement…</p></div>`;const rep=getReperes(classe.id);
  const who=c=>{const e=eleves.find(x=>(c.eleves||[]).includes(x.id));return`<strong>${e?"N°"+e.numero:""}${e&&rep[e.id]?" · "+esc(rep[e.id]):""}</strong><div class="hint"><code>${esc(c.eleveLogin||"")}</code></div>`};
  const cards=CX.acts.map(a=>{const L=CX.list.filter(c=>c.activite===a.id),nb=L.filter(c=>!c.envoye).length;
    const juges={};L.forEach(c=>{if(c.coachUid&&c.jugeNote!=null){const j=juges[c.coachUid]=juges[c.coachUid]||{login:c.coachLogin,n:0,s:0,max:c.jugeMax,ec:0};j.n++;j.s+=c.jugeNote;j.ec+=c.ecarts||0}});
    const rows=L.map(c=>`<tr><td>${who(c)}</td><td>${c.page?"P"+c.page:""}<div class="hint">${c.date?fmtDate(c.date):""}</div></td><td class="n">${c.nbModifs||0}</td>
      <td>${c.coachUid?`<code>${esc(c.coachLogin||"")}</code><div class="hint">${c.ecarts||0} écart${(c.ecarts||0)>1?"s":""} · <b>${fmtN(c.jugeNote)} / ${fmtN(c.jugeMax)}</b></div>`:'<span class="hint">—</span>'}</td>
      <td>${c.envoye?`<span class="chip ok-chip">📤 Envoyée</span>`:`<span class="chip">Brouillon</span>`}</td>
      <td><label class="row" style="gap:6px;font-weight:600;flex-wrap:nowrap"><input type="checkbox" data-cxvis="${esc(c.id)}" ${c.partage!==false?"checked":""} style="width:20px;height:20px"> ${c.visible?"Visible":c.envoye?"Masquée":"À l'envoi"}</label></td>
      <td><div class="row" style="gap:4px;flex-wrap:nowrap"><button class="btn ghost small" data-act="cxOpen" data-id="${esc(c.id)}">Ouvrir</button>${c.envoye?"":`<button class="btn small primary" data-act="cxSend" data-id="${esc(c.id)}">Envoyer</button>`}</div></td></tr>`).join("");
    const jl=Object.values(juges);
    return`<section class="card"><div class="sec-h"><h3>📒 ${esc(a.titre)}</h3><span class="spacer"></span><button class="btn small" data-act="cxSuivi" data-a="${esc(a.id)}">Corriger des carnets →</button></div>
      ${L.length?`<div class="scroll"><table class="suivi"><thead><tr><th>Élève</th><th>Page</th><th class="n">Modifs</th><th>Juge</th><th>Statut</th><th>Élève voit</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>
      ${nb?`<div class="row" style="margin-top:10px"><button class="btn primary" data-act="cxSendAll" data-a="${esc(a.id)}">📤 Envoyer les ${nb} correction${nb>1?"s":""} en brouillon</button></div>`:""}
      ${jl.length?`<div class="sec-h" style="margin-top:14px"><h3 style="font-size:1rem">⚖️ Notes de juge</h3><span class="hint">Calculées automatiquement à partir des écarts avec vos corrections</span></div>
        <div class="row" style="gap:6px">${jl.map(j=>`<span class="chip"><code>${esc(j.login||"")}</code> <b>${fmtN(Math.round(j.s/j.n*10)/10)} / ${fmtN(j.max)}</b> <span class="hint">· ${j.n} page${j.n>1?"s":""}, ${j.ec} écart${j.ec>1?"s":""}</span></span>`).join("")}</div>`:""}`
      :`<p class="hint" style="margin:0">Aucune correction. Ouvrez un carnet d'élève puis « Corriger » sur une page.</p>`}</section>`}).join("");
  return`<p class="hint" style="margin:0">Vos corrections restent privées jusqu'à l'envoi. Une correction envoyée n'est visible par l'élève que si « Élève voit » est coché ; il voit alors ses choix et ceux de son juge face aux vôtres.</p>${cards||'<div class="card"><p style="margin:0">Aucun carnet dans cette classe.</p></div>'}`}
async function cxPatch(c,patch){const d={...c,...patch};d.visible=!!(d.envoye&&d.partage!==false);const up={...patch,visible:d.visible};
  try{await fb.updateCorrection(c.id,up);Object.assign(c,up);return true}catch(e){toast(authMsg(e));return false}}
async function cxOpen(id){const c=CX&&CX.list.find(x=>x.id===id);if(!c)return;await openSuivi(c.activite);if(route.name!=="suivi")return;
  const i=suivi.rows.findIndex(r=>r.c&&r.c.id===c.carnetId);if(i<0){toast("Carnet introuvable");return}openEleve(i);if(!data.seances.some(s=>s.id===c.sid)){toast("Page introuvable (supprimée ?)");return}cur=c.sid;corrStart("tab")}
function corrClick(a,b){
  if(a==="corrStart"){corrStart();return true}
  if(a==="corrExit"){corrExit();return true}
  if(a==="corrSend"){corrEnvoyer();return true}
  if(a==="cView"){const s=curS();if(s){CVIEW=CVIEW===s.id?null:s.id;rerenderKeep()}return true}
  if(a==="cxOpen"){cxOpen(b.dataset.id);return true}
  if(a==="cxSuivi"){openSuivi(b.dataset.a);return true}
  if(a==="cxSend"){const c=CX.list.find(x=>x.id===b.dataset.id);if(c)cxPatch(c,{envoye:true,envoyeLe:new Date().toISOString()}).then(ok=>{if(ok){toast(c.visible?"Correction envoyée":"Correction envoyée (masquée pour l'élève)");rerenderKeep()}});return true}
  if(a==="cxSendAll"){const L=CX.list.filter(x=>x.activite===b.dataset.a&&!x.envoye);
    confirmBox("Envoyer les corrections ?",`${L.length} correction${L.length>1?"s":""} vont être distribuées. Seules celles cochées « Élève voit » seront visibles par les élèves.`,"Envoyer",async()=>{closeModal();let ok=0;for(const c of L)if(await cxPatch(c,{envoye:true,envoyeLe:new Date().toISOString()}))ok++;toast(`${ok} correction${ok>1?"s":""} envoyée${ok>1?"s":""}`);rerenderKeep()});return true}
  return false}
function corrField(el,e){
  if(el.dataset.corrvis!==undefined){if(e.type==="change")corrVisible(el.checked);return true}
  if(el.dataset.cxvis!==undefined){if(e.type==="change"){const c=CX&&CX.list.find(x=>x.id===el.dataset.cxvis);if(c)cxPatch(c,{partage:el.checked}).then(()=>rerenderKeep())}return true}
  return false}
/** Notes de juge d'un élève (en tant que juge / observateur) dans l'activité ouverte. */
function jugeDe(uid){const L=Object.values(CORRS).filter(c=>c.coachUid===uid&&c.jugeNote!=null);if(!L.length)return null;
  return{n:L.length,note:Math.round(L.reduce((a,c)=>a+c.jugeNote,0)/L.length*10)/10,max:L[0].jugeMax,ec:L.reduce((a,c)=>a+(c.ecarts||0),0)}}

/* ===================== Bac à sable : « ▶ Essayer » avec un carnet rempli (2026.11.21-2) =====================
   Données d'exemple, groupe factice déjà formé, vue observateur avec choix de l'observateur. Rien n'est enregistré. */
let SBXOBS=false;
const sbxOn=()=>PREVIEW&&!!SBX&&!!modeleEdit&&modeleEdit.tab==="apercu";
const SBX_LOGINS=["eleve-02","eleve-05","eleve-08","eleve-11","eleve-14","eleve-17"];
function sbxRand(seed){let x=seed*9301+49297;return()=>{x=(x*9301+49297)%233280;return x/233280}}
function sbxFillField(M,s,S,f,R){const o=s.valeurs[S.id],pick=a=>a[Math.floor(R()*a.length)],lab=norm(f.label);
  switch(f.type){
    case"pseudo":o[f.id]=f.qui==="juge"?"eleve-02":"eleve-01";break;
    case"calcul":break;
    case"texte":o[f.id]=/objectif|projet|but/.test(lab)?"Tenir mon allure jusqu'au bout":/echauf/.test(lab)?"Footing 5 min + gammes":"Exemple de réponse";break;
    case"texte_long":o[f.id]=/conseil|comment/.test(lab)?"Garde le dos droit et respire sur l'effort.":"J'ai bien tenu le rythme au début, je dois mieux gérer ma récupération à la fin.";break;
    case"nombre":o[f.id]=String(f.unite==="bpm"||/cardia|bpm/.test(lab)?150+Math.floor(R()*30):/tour/.test(lab)?4:5+Math.floor(R()*15));break;
    case"temps":o[f.id]=fmtT(80+Math.floor(R()*40));break;
    case"choix":o[f.id]=(f.options||[]).length?pick(f.options):"";break;
    case"echelle":o[f.id]=String(Math.round(f.min+(f.max-f.min)*(.4+R()*.4)));break;
    case"case":o[f.id]=R()>.35;break;
    case"compteur":o[f.id]=3+Math.floor(R()*10);break;
    case"tableau":{const nbMax=M.partage==="groupe"?Math.max(2,M.groupeMax||4):4,grp=(SBX&&SBX.grp)||(carnetDoc&&carnetDoc.logins)||SBX_LOGINS;
      o[f.id]=[0,1,2].map(i=>{const row={};f.colonnes.forEach(c=>{const lb=norm(c.label);
        if(c.type==="nombre"){const lo=c.min??(/personne|pyramide|membre|eleve|gymnaste/.test(lb)?2:1),hi=c.max??(/personne|pyramide|membre|eleve|gymnaste/.test(lb)?nbMax:/acro|point/.test(lb)?4:10);row[c.id]=String(lo+Math.floor(R()*(hi-lo+1)))}
        else if(c.type==="choix")row[c.id]=c.options[i%Math.max(1,c.options.length)]||"";
        else if(c.type==="temps")row[c.id]=fmtT(60+i*15);
        else if(c.type!=="membres")row[c.id]=["Roue","ATR","Pyramide à 3"][i]||"Élément "+(i+1)});
      f.colonnes.filter(c=>c.type==="membres").forEach(c=>{const n=c.nbCol?parseInt(row[c.nbCol])||2:2;row[c.id]=grp.filter(l=>l!=="élève essai"&&l!=="toi").slice(i%2,i%2+Math.max(0,n-1))});return row});break}
    case"passages":{const n=gNb(M,s,f),lap=85+Math.floor(R()*15);let t=0;o[f.id]=Array.from({length:n},(_,i)=>{t+=lap+Math.round((R()-.3)*8+i*1.5);return{passage:t,noRep:f.noRep&&R()>.7?1:0}});break}
    case"exercices":o[f.id]=[{...blankExo("haltero"),nom:"Thrusters",reps:"10",charge:"25"},{...blankExo("gym"),nom:"Burpees",reps:"12",niveau:"complet"},{...blankExo("cardio"),nom:"Rameur",reps:"15",niveau:"damper 5"}].slice(0,f.nb||3);break}}
function sbxFill(M,s,seed,onlyInd){const R=sbxRand(seed);gEnsure(M,s);
  M.sections.forEach(S=>{if(onlyInd&&!S.base)return;S.champs.forEach(f=>{if(f.type!=="resume"&&!f.nbChamp)sbxFillField(M,s,S,f,R)})});
  M.sections.forEach(S=>{if(onlyInd&&!S.base)return;S.champs.forEach(f=>{if(f.nbChamp)sbxFillField(M,s,S,f,R)})});
  M.criteres.filter(c=>c.calcul.type==="autoeval").forEach(c=>s.autoeval[c.id]=2+Math.floor(R()*2))}
const sbxCoach=M=>M.partage==="coach";
const sbxGroupe=M=>M.partage==="groupe";
/** Prépare l'essai : appelée par setPreview quand l'onglet « ▶ Essayer » est ouvert. */
function sbxSetup(){const base=MOD;SBX=SBX&&SBX.keep?SBX:{vue:"eleve",obs:0,mb:0,vide:false};SBX.keep=false;
  const s=data.seances[0];if(base.themes.length&&!s.theme)s.theme=base.themes[0].id;
  if(sbxGroupe(base)){const n=Math.max(2,Math.min(SBX_LOGINS.length,base.groupeMax||3)),L=["toi",...SBX_LOGINS.slice(0,n-1)];SBX.grp=L;SBX.mb=Math.min(SBX.mb,n-1);
    const sd=(SBX.seed||0)*17;if(!SBX.vide){sbxFill(base,s,1+sd,false);L.forEach((l,k)=>{const Mk=modFor(base,"sbx"+k);sbxFill(Mk,s,10+k+sd,true)})}
    sbxMember()}
  else{if(!SBX.vide)sbxFill(base,s,1+(SBX.seed||0)*17,false);if(sbxCoach(base)){s.coachLogin=SBX_LOGINS[SBX.obs];s.coachUid="sbx-obs"}}
  gEnsure(MOD,s)}
function sbxMember(){const base=normModele(modeleEdit.draft),k=SBX.mb;MOD=modFor(base,"sbx"+k);const others=SBX.grp.filter((l,i)=>i!==k);
  carnetDoc={groupe:true,membres:SBX.grp.map((l,i)=>"sbx"+i),logins:others.map(l=>l==="toi"?"élève essai":l)};gEnsure(MOD,data.seances[0])}
function vSbxBar(){const M=MOD,c=sbxCoach(M),g=sbxGroupe(M),hasObs=M.sections.some(S=>S.champs.some(f=>f.coach));
  return`<section class="card sbx-bar stack" style="gap:10px"><div class="row"><strong>🧪 Essai avec des données d'exemple</strong><span class="spacer"></span><button class="btn ghost small" data-act="sbxFill">↺ Nouvel exemple</button><button class="btn ghost small" data-act="sbxVide">Page vide</button></div>
  ${c?`<div class="seg2" style="grid-template-columns:1fr 1fr"><button data-act="sbxVue" data-v="eleve" aria-current="${SBX.vue==="eleve"}">👤 Vue élève</button><button data-act="sbxVue" data-v="obs" aria-current="${SBX.vue==="obs"}">📣 Vue observateur</button></div>
    <label class="f">Observateur<select data-sbx="obs">${SBX_LOGINS.map((l,i)=>`<option value="${i}" ${SBX.obs===i?"selected":""}>${esc(l)}</option>`).join("")}</select></label>
    ${hasObs?"":`<p class="hint" style="margin:0">Aucune case n'est cochée « Remplie par le coach » : l'observateur n'a rien à remplir.</p>`}`:""}
  ${g?`<p style="margin:0">👥 Groupe factice formé : ${SBX.grp.map((l,i)=>`<span class="chip">${i===SBX.mb?"<b>":""}${esc(l==="toi"?"élève essai":l)}${i===SBX.mb?" (vous)</b>":""}</span>`).join(" ")}</p>
    ${M.sections.some(S=>S.base)?`<label class="f">Voir la page comme<select data-sbx="mb">${SBX.grp.map((l,i)=>`<option value="${i}" ${SBX.mb===i?"selected":""}>${esc(l==="toi"?"élève essai":l)}</option>`).join("")}</select></label><p class="hint" style="margin:0">Les parties individuelles changent selon l'élève choisi ; les parties collectives sont communes.</p>`:""}`:""}
  </section>`}
function vSbx(){const s=curS();if(SBX&&SBX.vue==="obs"&&sbxCoach(MOD)){const keep=coachCtx;coachCtx={eleveLogin:"élève essai"};SBXOBS=true;try{return vSbxBar()+gCoach(s,true)}finally{coachCtx=keep;SBXOBS=false}}
  return vSbxBar()+gSeance(s)}
function sbxClick(a,b){if(!modeleEdit)return false;
  if(a==="sbxVue"){SBX.vue=b.dataset.v;rerenderKeep();return true}
  if(a==="sbxFill"){SBX.vide=false;SBX.keep=true;SBX.seed=(SBX.seed||1)+1;setPreview();rerenderKeep();return true}
  if(a==="sbxVide"){SBX.vide=true;SBX.keep=true;setPreview();rerenderKeep();return true}
  return false}
function sbxField(el,e){if(el.dataset.sbx===undefined)return false;if(e.type!=="change")return true;const v=+el.value;
  if(el.dataset.sbx==="obs"){SBX.obs=v;const s=curS();s.coachLogin=SBX_LOGINS[v]}
  if(el.dataset.sbx==="mb"){SBX.mb=v;sbxMember()}rerenderKeep();return true}

/* --- Modèles : liste et éditeur avec l'IA --- */
let ca5Doc=null;
async function openModeles(){RETRY=()=>openModeles();go("loading");try{const all=await fb.listModeles(me.uid);ca5Doc=all.find(m=>m.id===ca5DocId(me.uid))||null;modeles=all.filter(m=>m.id!==ca5DocId(me.uid)).sort((a,b)=>String(a.titre).localeCompare(String(b.titre),"fr"));go("modeles")}catch(e){go("error",{msg:authMsg(e)})}}
async function openCa5(){RETRY=()=>openCa5();go("loading");try{await loadClasses();ca5Doc=await fb.getModele(ca5DocId(me.uid)).catch(()=>null);const d=ca5Doc||{};
  startEditor({id:ca5Doc?ca5Doc.id:null,fixedId:ca5DocId(me.uid),builtin:true,modele:d.modele||CA5_MODELE,brouillon:d.brouillon||null,statut:d.statut||"publie",publieLe:d.publieLe||null})}catch(e){go("error",{msg:authMsg(e)})}}
function vModeles(){const st=m=>m.modele&&m.statut!=="brouillon"?'<span class="chip" style="border-color:var(--d4);color:var(--d4)">Publié</span>':m.modele?'<span class="chip" style="border-color:var(--d2);color:#8a6400">Bac à sable · version publiée en ligne</span>':'<span class="chip">Bac à sable</span>';
  const c5=ca5Doc||{modele:CA5_MODELE,statut:"publie"},M5=c5.brouillon||c5.modele||CA5_MODELE;
  return`<div class="stack"><h2>Mes carnets</h2>
  <p class="hint" style="margin:-6px 0 0">Chaque carnet se modifie librement en bac à sable, puis se publie pour vos élèves. Pour une nouvelle activité, importez votre référentiel (et si vous voulez votre fiche d'observation) : l'IA prépare une ébauche.</p>
  <div class="list-s"><button class="s-item" data-act="openCa5" style="border-left-color:var(--accent)"><div><strong>Cross training · CA5</strong><div class="row" style="margin-top:4px;gap:6px">${st(c5)}<span class="hint">${ca5Doc?"Votre version":"Version d'origine"} · ${(M5.sections||[]).length} parties · ${(M5.criteres||[]).length} critères · toutes vos classes</span></div></div><span class="chip">Ouvrir →</span></button>
  ${modeles.map(m=>{const M=m.brouillon||m.modele||{};return`<button class="s-item" data-act="openModele" data-id="${m.id}" style="border-left-color:var(--accent)"><div><strong>${esc(m.titre)}</strong><div class="row" style="margin-top:4px;gap:6px">${st(m)}<span class="hint">${(M.sections||[]).length} parties · ${(M.criteres||[]).length} critères</span></div></div><span class="chip">Ouvrir →</span></button>`}).join("")}</div>
  <form class="card stack" id="gen-form" style="gap:10px"><h3>Nouveau carnet avec l'IA</h3>
    <label class="f">1. Référentiel d'évaluation (PDF ou photo)<input type="file" id="gen-file" accept="application/pdf,image/*"></label>
    <label class="f">2. Fiche d'observation / d'évaluation (facultatif)<input type="file" id="gen-fiche" accept="application/pdf,image/*"></label>
    <details><summary class="hint">Pas de fichier ? Coller le texte du référentiel</summary><textarea id="gen-text" placeholder="Texte du référentiel"></textarea></details>
    <label class="f">Vos consignes (facultatif)<textarea id="gen-cons" placeholder="ex. Séances de 1 h, 4 tours de 8 min, niveau terminale"></textarea></label>
    <div class="err" id="gen-err"></div>
    <button class="btn primary big" type="submit" ${iaBusy?"disabled":""}>${iaBusy?"L'IA lit vos documents…":"✨ Créer l'ébauche avec l'IA"}</button>${iaBusy?`<button type="button" class="btn ghost small" data-act="iaStop" style="margin-top:6px">✕ Annuler</button><p class="hint" style="margin:4px 0 0">Cela peut prendre 1 à 3 minutes (4 minutes au plus).</p>`:""}
    <button class="btn" type="button" data-act="mBlank">Partir d'un carnet vide</button>
    <p class="hint" style="margin:0">${IAKEY?"Gemini avec votre clé personnelle (votre propre quota gratuit).":"Gemini, quota gratuit partagé entre les profs de l'appli. Pour avoir votre propre quota, ajoutez votre clé Gemini dans « Compte »."} Comptez 30 secondes à 2 minutes.</p></form></div>`}

/* --- Éditeur : bac à sable / publié --- */
const newId=p=>p+"_"+Math.random().toString(36).slice(2,7);
function blankModele(){return{titre:"Nouvelle activité",ca:"",apsa:"",description:"",themes:[],sections:[{id:newId("s"),titre:"Ma séance",consigne:"",champs:[{id:newId("c"),type:"texte_long",label:"Ce que j'ai fait",aide:"",unite:"",requis:true}]}],criteres:[],bareme:{afl1:{max:12,table:[]}}}}
function leaveEditor(){PREVIEW=false;const d=modeleEdit&&modeleEdit.dossier;modeleEdit=null;if(d)openDossierEd(d);else openDossiers()}
function startEditor(doc){iaDraft="";iaFile=null;iaOpen=false;const pub=doc.modele?normModele(doc.modele):null,draft=normModele(doc.brouillon||doc.modele||blankModele());
  modeleEdit={dossier:doc.dossier||(dossierCtx&&route.name!=="carnet"?dossierCtx.id:null),id:doc.id||null,fixedId:doc.fixedId||null,builtin:!!doc.builtin,draft,pub,statut:pub&&doc.statut!=="brouillon"?"publie":"brouillon",publieLe:doc.publieLe||null,dirty:!doc.id&&!doc.builtin,tab:"seance"};
  modeleHist=[];ficheOpen=null;setPreview();go("modele");loadFiches(true).then(()=>{if(route.name==="modele")rerenderKeep()})}
function setPreview(){MOD=normModele(modeleEdit.draft);PREVIEW=true;RO=false;carnetId=null;carnetDoc=null;const s={id:"apercu",ordre:1,date:today(),valide:false,epreuve:false,theme:MOD.themes[0]&&MOD.themes[0].id||"",valeurs:{},autoeval:{}};gEnsure(MOD,s);data={profil:{projet:"",repartition:"4-4"},seances:[s]};cur=s.id;if(modeleEdit&&modeleEdit.tab==="apercu")sbxSetup();else SBX=null}
const SB=()=>modeleEdit&&modeleEdit.statut==="brouillon";
function mIn(path,val,attrs="",label=""){return`<label class="f">${label}<input data-m="${path}" value="${esc(val??"")}" ${attrs}></label>`}
function mTa(path,val,label,attrs=""){return`<label class="f">${label}<textarea data-m="${path}" ${attrs}>${esc(val??"")}</textarea></label>`}
function mSel(path,val,opts,label,attrs=""){return`<label class="f">${label}<select data-m="${path}" ${attrs}>${opts.map(([v,l])=>`<option value="${esc(v)}" ${String(v)===String(val)?"selected":""}>${esc(l)}</option>`).join("")}</select></label>`}
function allFields(M,types){const out=[];M.sections.forEach(S=>S.champs.forEach(f=>{if(!types||types.includes(f.type))out.push([S.id+"."+f.id,`${S.titre} › ${f.label}`])}));return out}
function mFieldEd(M,si,fi,f){const p=`sections.${si}.champs.${fi}`;let extra="";
  if(f.type==="choix")extra=mIn(p+".options",(f.options||[]).join(", "),'data-mt="list"',"Choix proposés (séparés par des virgules)");
  if(f.type==="echelle")extra=`<div class="grid2">${mIn(p+".min",f.min,'data-mt="num" inputmode="numeric"',"De")}${mIn(p+".max",f.max,'data-mt="num" inputmode="numeric"',"À")}</div>`;
  if(f.type==="tableau")extra=`<div class="f"><span class="mlab">Colonnes</span>${(f.colonnes||[]).map((c,ci)=>`<div class="mcol">${mIn(`${p}.colonnes.${ci}.label`,c.label,"","")}${mSel(`${p}.colonnes.${ci}.type`,c.type,[["texte","Texte"],["nombre","Nombre"],["temps","Temps"],["choix","Choix"],["membres","Partenaires du groupe"]],"","data-rerender")}<button class="btn ghost small" data-act="mDelCol" data-si="${si}" data-fi="${fi}" data-ci="${ci}" aria-label="Retirer la colonne">✕</button>${c.type==="choix"?`<div style="grid-column:1/-1">${mIn(`${p}.colonnes.${ci}.options`,(c.options||[]).join(", "),'data-mt="list"',"Choix (virgules)")}</div>`:""}
    ${c.type==="nombre"?`<div class="grid2" style="grid-column:1/-1">${mIn(`${p}.colonnes.${ci}.min`,c.min??"",'data-mt="num" inputmode="numeric"',"Minimum (facultatif)")}${mIn(`${p}.colonnes.${ci}.max`,c.max??"",'data-mt="num" inputmode="numeric"',"Maximum (facultatif)")}</div>`:""}
    ${c.type==="membres"?`<div style="grid-column:1/-1">${mSel(`${p}.colonnes.${ci}.nbCol`,c.nbCol||"",[["","Pas de limite"],...(f.colonnes||[]).filter(k=>k.type==="nombre").map(k=>[k.id,`Nombre de partenaires = « ${k.label} » − 1`])],"Combien de partenaires ?")}<p class="hint" style="margin:4px 0 0">L'élève coche ses partenaires dans la liste de son groupe (ou de sa classe).</p></div>`:""}</div>`).join("")}<button class="btn small" data-act="mAddCol" data-si="${si}" data-fi="${fi}" style="justify-self:start">+ Colonne</button></div>`;
  if(f.type==="exercices")extra=mIn(p+".nb",f.nb,'data-mt="num" inputmode="numeric" style="max-width:120px"',"Lignes au départ");
  if(f.type==="grille")extra=mGrilleEd(M,p,f);
  if(f.type==="calcul")extra=mCalcEd(M,p,si,fi,f);
  if(f.type==="pseudo")extra=mSel(p+".qui",f.qui||"eleve",[["eleve","L'élève qui pratique (propriétaire de la page)"],["juge","Le coach / juge / observateur"]],"Pseudo de qui ?","data-rerender")+`<p class="hint" style="margin:0">Jamais de nom ni de prénom : la case affiche le pseudo choisi dans l'appli, rempli automatiquement.</p>`;
  if(f.type==="resume"){const sr=f.src||{};extra=`${mSel(p+".src.exos",sr.exos||"",[["","—"],...allFields(M,["exercices"])],"Exercices résumés")}<div class="grid2">${mSel(p+".src.tours",sr.tours||"",[["","—"],...allFields(M,["nombre"])],"Nombre de tours")}${mSel(p+".src.temps",sr.temps||"",[["","—"],...allFields(M,["temps"])],"Temps par tour")}</div>`}
  if(f.type==="passages")extra=`<div class="grid2">${mIn(p+".nb",f.nb,'data-mt="num" inputmode="numeric"',"Nombre de tours")}${mSel(p+".nbChamp",f.nbChamp||"",[["","Nombre fixe"],...allFields(M,["nombre"])],"ou lu dans la case","data-rerender")}</div><label class="row" style="gap:8px;font-weight:600"><input type="checkbox" data-m="${p}.noRep" data-mt="bool" ${f.noRep?"checked":""} style="width:20px;height:20px"> Compteur de NO REP par tour</label>
    <label class="row" style="gap:8px;font-weight:600"><input type="checkbox" data-m="${p}.adapt" data-mt="bool" ${f.adapt?"checked":""} style="width:20px;height:20px"> Bouton adaptation par tour</label>`;
  return`<div class="mfield" id="mf-${esc(M.sections[si].id)}-${esc(f.id)}"><div class="mf-h"><span class="chip">${esc(G_TYPES[f.type]||f.type)}</span><span class="spacer"></span>
    <button class="btn ghost small" data-act="mUpChamp" data-si="${si}" data-fi="${fi}" aria-label="Monter">↑</button><button class="btn ghost small" data-act="mDownChamp" data-si="${si}" data-fi="${fi}" aria-label="Descendre">↓</button><button class="btn ghost small danger" data-act="mDelChamp" data-si="${si}" data-fi="${fi}" aria-label="Supprimer la case">✕</button></div>
    <div class="grid2">${mIn(p+".label",f.label,"","Intitulé")}${mSel(p+".type",f.type,Object.entries(G_TYPES),"Type de case","data-rerender")}</div>
    ${extra}
    ${M.partage==="coach"&&!["resume","calcul","pseudo","grille"].includes(f.type)?`<label class="row" style="gap:8px;font-weight:600"><input type="checkbox" data-m="${p}.coach" data-mt="bool" ${f.coach?"checked":""} style="width:20px;height:20px"> 📣 Remplie par le coach</label>`:""}
    <details class="madv"><summary>Plus d'options</summary><div class="stack" style="gap:8px;margin-top:8px"><div class="grid2">${mIn(p+".unite",f.unite,"","Unité (facultatif)")}${mIn(p+".aide",f.aide,"","Aide pour l'élève")}</div>
    <label class="row" style="gap:8px;font-weight:600"><input type="checkbox" data-m="${p}.requis" data-mt="bool" ${f.requis?"checked":""} style="width:20px;height:20px"> Obligatoire pour valider</label></div></details></div>`}
function mCritEd(M,ci,c){const p=`criteres.${ci}`,cal=c.calcul||{type:"autoeval"};const nums=allFields(M,["nombre","temps","echelle","compteur","case","choix","tableau","passages","calcul"]);
  let cfg="";const srcF=cal.source&&gField(M,cal.source.champ);
  if(cal.type==="seuils"||cal.type==="ecart"){
    cfg+=mSel(p+".calcul.source.champ",cal.source&&cal.source.champ||"",[["","— choisir une case —"],...nums],"Case mesurée","data-rerender");
    if(srcF&&srcF.type==="tableau")cfg+=`<div class="grid2">${mSel(p+".calcul.source.colonne",cal.source.colonne||"",[["","—"],...(srcF.colonnes||[]).map(x=>[x.id,x.label])],"Colonne")}${mSel(p+".calcul.source.agg",cal.source.agg||"moyenne",Object.entries(AGG_FR),"Calcul")}</div>`;
    if(srcF&&srcF.type==="passages"){const cb=cal.source.cible;cfg+=`<div class="grid2">${mSel(p+".calcul.source.mesure",cal.source.mesure||"proportion_dans_cible",Object.entries(MES_FR),"Mesure")}${mIn(p+".calcul.source.tolerance",cal.source.tolerance??5,'data-mt="num" inputmode="numeric"',"Tolérance (s)")}</div>
      <div class="grid2"><label class="f">Temps visé par tour<select data-mcible="${ci}" data-where="source" data-rerender>${[["num","Valeur fixe"],...allFields(M,["temps","nombre"])].map(([v,l])=>`<option value="${v}" ${(typeof cb==="object"&&cb&&cb.champ===v)||(v==="num"&&typeof cb!=="object")?"selected":""}>${esc(l)}</option>`).join("")}</select></label>${typeof cb!=="object"||!cb?mIn(p+".calcul.source.cible",cb??60,'data-mt="num" inputmode="numeric"',"Secondes"):"<span></span>"}</div>`}
    if(cal.type==="ecart"){const cb=cal.cible;cfg+=`<div class="grid2"><label class="f">Comparée à<select data-mcible="${ci}" data-where="calcul" data-rerender>${[["num","Valeur fixe"],...nums].map(([v,l])=>`<option value="${v}" ${(typeof cb==="object"&&cb&&cb.champ===v)||(v==="num"&&typeof cb!=="object")?"selected":""}>${esc(l)}</option>`).join("")}</select></label>${typeof cb!=="object"||!cb?mIn(p+".calcul.cible",cb??0,'data-mt="num" inputmode="decimal"',"Valeur"):"<span></span>"}</div>`}
    if(cal.type==="seuils")cfg+=mSel(p+".calcul.sens",cal.sens||"haut",[["haut","Plus c'est haut, mieux c'est"],["bas","Plus c'est bas, mieux c'est"]],"Sens","data-rerender");
    const op=cal.type==="ecart"?"écart ≤":cal.sens==="bas"?"≤":"≥";
    cfg+=`<div class="grid3">${[0,1,2].map(k=>mIn(`${p}.calcul.seuils.${k}`,(cal.seuils||[])[k],'data-mt="num" inputmode="decimal"',`D${4-k} si ${op}`)).join("")}</div><p class="hint" style="margin:0">Sinon : D1.</p>`}
  if(cal.type==="rythme"){const cb=cal.source&&cal.source.cible,cond=cal.condition||{},cf=cond.champ&&gField(M,cond.champ);
    cfg=`${mSel(p+".calcul.source.champ",cal.source&&cal.source.champ||"",[["","— choisir —"],...allFields(M,["passages"])],"Temps de passage","data-rerender")}
    <div class="grid2"><label class="f">Temps visé par tour<select data-mcible="${ci}" data-where="source" data-rerender>${[["num","Valeur fixe"],...allFields(M,["temps","nombre"])].map(([v,l])=>`<option value="${v}" ${(typeof cb==="object"&&cb&&cb.champ===v)||(v==="num"&&typeof cb!=="object")?"selected":""}>${esc(l)}</option>`).join("")}</select></label>${mIn(p+".calcul.source.tolerance",cal.source&&cal.source.tolerance!=null?cal.source.tolerance:5,'data-mt="num" inputmode="numeric"',"Tolérance (s)")}</div>
    ${typeof cb!=="object"||!cb?mIn(p+".calcul.source.cible",cb??60,'data-mt="num" inputmode="numeric"',"Secondes"):""}
    <div class="grid2">${mSel(p+".calcul.condition.champ",cond.champ||"",[["","Aucune"],...allFields(M,["choix"])],"D1 aussi si la case…","data-rerender")}${cf?mSel(p+".calcul.condition.valeur",cond.valeur||"",[["",""],...(cf.options||[]).map(o=>[o,o])],"vaut"):"<span></span>"}</div>
    <p class="hint" style="margin:0">D4 : rythme tenu jusqu'au bout · D3 : décroche sur les 2 derniers tours · D2 : à partir de la moitié · D1 : avant, ou séance non terminée.</p>`}
  if(cal.type==="reperes")cfg=`<div class="grid2">${mSel(p+".calcul.source.champ",cal.source&&cal.source.champ||"",[["","— choisir —"],...allFields(M,["exercices"])],"Exercices")}${mIn(p+".calcul.min",cal.min||3,'data-mt="num" inputmode="numeric"',"Exercices vérifiés")}</div><p class="hint" style="margin:0">Compare répétitions et % du 1RM aux repères du thème choisi (onglet Infos). D4 : tous conformes, puis un degré de moins par exercice hors repère.</p>`;
  if(cal.type==="grille"){const gs=allFields(M,["grille"]);cfg=`${mSel(p+".calcul.champ",cal.champ||"",[["","— choisir le tableau —"],...gs],"Tableau à double entrée","data-rerender")}<p class="hint" style="margin:0">${gs.length?"La note lue dans le tableau compte directement pour l'AFL1 (sur le maximum du tableau) ; les degrés D1 à D4 suivent la part de la note obtenue.":"Ajoutez d'abord un bloc « 🧮 Tableau à double entrée » dans une partie de la page."}</p>`}
  if(cal.type==="complet")cfg=`<div class="f"><span class="mlab">Cases à remplir</span><div class="mchecks">${allFields(M).map(([v,l])=>`<label><input type="checkbox" data-mcomplet="${ci}" value="${v}" ${(cal.champs||[]).includes(v)?"checked":""}> ${esc(l)}</label>`).join("")}</div></div>`;
  return`<div class="mfield"><div class="mf-h"><span class="chip">${esc(c.afl)}</span><strong style="flex:1;min-width:0">${esc(c.label)}</strong><button class="btn ghost small danger" data-act="mDelCrit" data-ci="${ci}" aria-label="Supprimer le critère">✕</button></div>
    <div class="grid2">${mSel(p+".afl",c.afl,[["AFL1","AFL1"],["AFL2","AFL2"],["AFL3","AFL3"]],"AFL","data-rerender")}${mIn(p+".label",c.label,"","Élément évalué")}</div>
    ${[0,1,2,3].map(d=>`<div class="mdeg"><span class="cell d${d+1}">D${d+1}</span><div class="stack" style="gap:4px">${mTa(`${p}.descripteurs.${d}`,c.descripteurs[d],"",'rows="2"')}${c.afl==="AFL1"?mIn(`${p}.conseils.${d}`,(c.conseils||[])[d]||"",'placeholder="Conseil affiché à l\'élève (facultatif)"',""):""}</div>${c.afl==="AFL1"?mIn(`${p}.points.${d}`,c.points[d],'data-mt="num" inputmode="decimal" style="width:70px"',"pts"):""}</div>`).join("")}
    ${mSel(p+".calcul.type",cal.type,[["autoeval","Autoévaluation de l'élève"],["seuils","Calcul automatique : seuils"],["ecart","Calcul automatique : écart à une valeur"],["complet","Calcul automatique : cases remplies"],["rythme","Calcul automatique : décrochage du rythme"],["reperes","Calcul automatique : repères du thème"],["grille","Calcul automatique : tableau à double entrée"]],"Correction","data-rerender")}${cfg}</div>`}
/* L'option 1RM n'a de sens qu'en cross training et en musculation (charges en % du maximum). */
const RM_ACT=/cross|muscu|halt|renfo|force athl|powerlift|ca5/;
function rmOk(M,E){if(E&&E.builtin)return true;const dz=typeof dossier!=="undefined"&&dossier&&(!E||!E.dossier||dossier.id===E.dossier)?dossier:{};return RM_ACT.test(norm([M.titre,M.apsa,dz.titre].join(" ")))}
function vModele(){const E=modeleEdit,M=E.draft,sb=SB(),pubDate=(()=>{const p=E.publieLe;if(!p)return"";const d=p.toDate?p.toDate():typeof p==="string"?new Date(p):null;return d&&!isNaN(d)?d.toLocaleDateString("fr-FR"):""})();
  const act=E.builtin?'<p class="hint" style="margin:0">Le carnet de cross training est disponible pour toutes vos classes.</p>':classes.map(c=>`<label class="row" style="gap:8px;font-weight:600"><input type="checkbox" data-actcls="${c.id}" ${E.id&&(c.activites||[]).includes(E.id)?"checked":""} ${E.id?"":"disabled"} style="width:20px;height:20px"> ${esc(c.nom)}</label>`).join("");
  const head=`<div class="row"><button class="btn ghost small" data-act="backModeles">← ${modeleEdit.dossier?"Activité":"Mes activités"}</button><span class="spacer"></span>${E.id?`<button class="btn danger small" data-act="delModele">${E.builtin?"Version d'origine":"Supprimer"}</button>`:""}${sb?`<button class="btn small" data-act="saveModele">${E.dirty?"Enregistrer":"Enregistré ✓"}</button>`:""}</div>
  <section class="class-hero"><span class="eyebrow">${esc(M.ca||"")}${M.apsa?" · "+esc(M.apsa):""}</span><h2>${esc(M.titre)}</h2>
    <div class="row" style="margin-top:8px">${sb?`<span class="chip" style="background:#fff3cd;color:#7a5a00;border-color:#f2d16b">🧪 Bac à sable</span>${E.pub?`<span class="hint" style="color:#cfd6dc">Les élèves utilisent la version publiée${pubDate?" du "+pubDate:""}.</span>`:`<span class="hint" style="color:#cfd6dc">Pas encore visible par les élèves.</span>`}`:`<span class="chip" style="background:#d9f2e4;color:#155c36;border-color:#8fd3ae">✅ Publié${pubDate?" le "+pubDate:""}</span><span class="hint" style="color:#cfd6dc">Les élèves remplissent cette version.</span>`}</div></section>`;
  if(!sb)return`<div class="stack">${head}
    <section class="card"><div class="row"><div style="flex:1;min-width:200px"><strong>Modifier ce carnet ?</strong><div class="hint">Repassez en bac à sable : les élèves gardent la version publiée et toutes leurs données jusqu'à ce que vous republiiez.</div></div><button class="btn primary" data-act="mSandbox">✏️ Repasser en bac à sable</button></div></section>
    <section class="card"><div class="sec-h"><h3>Fonctionnement</h3></div><p style="margin:0">${esc(PAGES_FR[M.pages])} · ${esc(PARTAGE_FR[M.partage])}${M.partage==="groupe"?` · ${M.noteGroupe?"parties collectives notées":"parties collectives non notées"}`:""}.</p></section>
    <h2 style="margin-top:6px">Aperçu élève</h2>${gSeance(curS())}</div>`;
  const tabs=[["seance","Page"],["infos","Réglages"],["criteres","Critères"],["apercu","▶ Essayer"]];
  let body="";
  if(E.tab==="seance")body=M.sections.map((S,si)=>`<section class="card sec"><div class="sec-h"><span class="num">${si+1}</span><h3>${esc(S.titre)}</h3><span class="spacer"></span><button class="btn ghost small" data-act="mUpSec" data-si="${si}" aria-label="Monter">↑</button><button class="btn ghost small" data-act="mDownSec" data-si="${si}" aria-label="Descendre">↓</button><button class="btn ghost small danger" data-act="mDelSec" data-si="${si}" aria-label="Supprimer la partie">✕</button></div>
      <div class="grid2">${mIn(`sections.${si}.titre`,S.titre,"","Titre de la partie")}${mIn(`sections.${si}.consigne`,S.consigne,"","Consigne pour l'élève")}</div>
      ${M.pages==="seance"?`<label class="row" style="gap:8px;font-weight:600;margin-top:6px"><input type="checkbox" data-m="sections.${si}.reprise" data-mt="bool" ${S.reprise?"checked":""} style="width:20px;height:20px"> Reprendre les réponses de la séance précédente</label>`:""}
      ${M.partage==="groupe"?mSel(`sections.${si}.portee`,S.portee||"collective",[["collective","👥 Collective : une seule réponse pour le groupe"],["individuelle","👤 Individuelle : chaque élève du groupe remplit la sienne"]],"Partie"):""}
      <div class="stack" style="gap:10px;margin-top:10px">${S.champs.map((f,fi)=>mFieldEd(M,si,fi,f)).join("")}</div>
      <div style="margin-top:10px">${vBlocs(si)}</div></section>`).join("")+`<button class="btn" data-act="mAddSec">+ Ajouter une partie</button>`;
  if(E.tab==="seance")body=(M.gabarit?ffEdCard(M):"")+verEdCard(M)+body;
  if(E.tab==="criteres")body=`<p class="hint" style="margin:0">Chaque critère a 4 degrés. Choisissez s'il est corrigé automatiquement à partir d'une case, ou par l'autoévaluation de l'élève.${M.criteres.length?"":" Aucun critère : le carnet n'est pas noté."}</p>`+M.criteres.map((c,ci)=>mCritEd(M,ci,c)).join("")+`<button class="btn" data-act="mAddCrit">+ Ajouter un critère</button>
    <details class="card madv"><summary>Barème AFL1 (note sur ${M.bareme.afl1.max}, proportionnelle par défaut)</summary><div style="margin-top:10px">${mIn("bareme.afl1.max",M.bareme.afl1.max,'data-mt="num" inputmode="numeric" style="max-width:120px"',"Note maximale")}
    <p class="hint">Table de conversion (facultative) : à partir de tant de points, la note vaut… Sans table, la note est proportionnelle aux points.</p>
    ${M.bareme.afl1.table.map((r,ri)=>`<div class="mcol">${mIn(`bareme.afl1.table.${ri}.pts`,r.pts,'data-mt="num" inputmode="decimal"',"Points ≥")}${mIn(`bareme.afl1.table.${ri}.note`,r.note,'data-mt="num" inputmode="decimal"',"Note")}<button class="btn ghost small" data-act="mDelRow" data-ri="${ri}" aria-label="Retirer">✕</button></div>`).join("")}<button class="btn small" data-act="mAddRow">+ Ligne</button></div></details>`;
  if(E.tab==="infos")body=`<section class="card stack" style="gap:10px"><h3>Utilisation de la page</h3>
    ${mSel("pages",M.pages||"seance",Object.entries(PAGES_FR),"Une page du carnet sert…","data-rerender")}
    <p class="hint" style="margin:-4px 0 0">${M.pages==="cycle"?"Ex. construction d'un enchaînement d'acrosport : l'élève complète la même page tout au long du cycle.":M.pages==="plusieurs"?"L'élève crée une page et la complète sur plusieurs séances, puis la valide.":"Ex. cross training : une nouvelle page à chaque séance."}</p>
    ${mSel("partage",M.partage||"aucun",Object.entries(PARTAGE_FR),"Partage","data-rerender")}
    <p class="hint" style="margin:-4px 0 0">${M.partage==="groupe"?"Ex. acrosport, feuille de poule : les élèves forment leur groupe et remplissent les mêmes pages. Dans l'onglet Page, indiquez les parties individuelles.":M.partage==="coach"?"Ex. CA1, CA5 : un camarade remplit depuis son téléphone les cases cochées « Remplie par le coach ».":"Chaque élève remplit seul son carnet."}</p>
    ${M.partage==="coach"?`<div class="mfield stack" style="gap:6px"><strong>⚖️ Note de juge (observateur)</strong><div class="grid2">${mIn("juge.max",jugeCfg(M).max,'data-mt="num" inputmode="decimal"',"Note de juge sur")}${mIn("juge.perte",jugeCfg(M).perte,'data-mt="num" inputmode="decimal"',"Points perdus par écart")}</div><p class="hint" style="margin:0">Quand vous corrigez une page, chaque case du juge que vous déplacez lui retire ces points, automatiquement.</p></div>`:""}
    ${M.partage==="groupe"?`<label class="row" style="gap:8px;font-weight:600"><input type="checkbox" data-m="noteGroupe" data-mt="bool" ${M.noteGroupe!==false?"checked":""} style="width:20px;height:20px"> Noter les parties collectives (même note pour tout le groupe)</label><p class="hint" style="margin:-4px 0 0">Les critères liés aux parties individuelles donnent toujours une note à chaque élève.</p>
    <div class="grid2">${mIn("groupeMin",M.groupeMin||2,'data-mt="num" inputmode="numeric"',"Élèves par groupe : au moins")}${mIn("groupeMax",M.groupeMax||4,'data-mt="num" inputmode="numeric"',"au plus")}</div>`:""}</section>
    <section class="card stack" style="gap:10px"><h3>Présentation</h3>${mIn("titre",M.titre,"","Nom du carnet")}<div class="grid2">${mSel("ca",M.ca,[["",""],["CA1","CA1"],["CA2","CA2"],["CA3","CA3"],["CA4","CA4"],["CA5","CA5"]],"Champ d'apprentissage")}${mIn("apsa",M.apsa,"","APSA")}</div>${mTa("description",M.description,"Description pour l'élève")}
</section>
    <details class="card madv"${(rmOk(M,E)&&M.rm)||M.themes.length?" open":""}><summary>Options avancées : ${rmOk(M,E)?"1RM, ":""}thèmes au choix de l'élève</summary><div style="margin-top:10px">
    ${rmOk(M,E)?`<label class="row" style="gap:8px;font-weight:600;margin-bottom:12px"><input type="checkbox" data-m="rm" data-mt="bool" ${M.rm?"checked":""} style="width:20px;height:20px"> Les élèves notent leurs 1RM dans leur profil</label>`:""}
    <div class="sec-h"><h3>Thèmes au choix de l'élève</h3></div>${M.themes.map((t,ti)=>`<div class="mfield" style="margin-bottom:8px"><div class="mcol" style="margin:0">${mIn(`themes.${ti}.label`,t.label,"","Thème")}${mIn(`themes.${ti}.desc`,t.desc,"","Description")}<button class="btn ghost small" data-act="mDelTheme" data-ti="${ti}" aria-label="Retirer">✕</button></div>
      <div class="grid4">${mIn(`themes.${ti}.reps.0`,(t.reps||[])[0],'data-mt="num" inputmode="numeric"',"Rép. min")}${mIn(`themes.${ti}.reps.1`,(t.reps||[])[1],'data-mt="num" inputmode="numeric"',"Rép. max")}${mIn(`themes.${ti}.pct.0`,(t.pct||[])[0],'data-mt="num" inputmode="numeric"',"% 1RM min")}${mIn(`themes.${ti}.pct.1`,(t.pct||[])[1],'data-mt="num" inputmode="numeric"',"% 1RM max")}</div></div>`).join("")}
    <p class="hint" style="margin:0 0 8px">Repères facultatifs, utilisés par le critère « repères du thème ».</p><button class="btn small" data-act="mAddTheme">+ Thème</button></div></details>`;
  if(E.tab==="apercu")body=`<p class="hint" style="margin:0">Un carnet d'exemple déjà rempli : modifiez-le, puis « Tester la correction ». Rien n'est enregistré.</p>${vSbx()}`;
  return`<div class="stack">${head}
  <details class="card ia-box"${iaBusy||modeleHist.length||iaOpen||iaDraft||iaFile?" open":""}><summary class="sec-h"><h3>✨ Modifier en parlant à l'IA</h3><span class="hint">« ajoute un chrono pour le gainage », « enlève le bilan »…</span></summary><div class="sec-h" style="margin-top:8px">${modeleHist.length?`<span class="spacer"></span><button class="btn ghost small" data-act="iaUndo">↶ Annuler (${modeleHist.length})</button>`:""}</div>
    <p class="hint" style="margin:-4px 0 0">Donnez vos consignes de correction : l'IA modifie le bac à sable, vous vérifiez puis vous publiez.</p>
    <textarea id="ia-req" placeholder="ex. Ajoute la fréquence cardiaque à la fin de chaque tour · Le critère de régularité doit tolérer 3 s">${esc(iaDraft)}</textarea>
    ${iaFile?`<div class="row" style="gap:8px;align-items:center"><span class="hint" style="flex:1">📎 ${esc(iaFile.name)}</span><button type="button" class="btn ghost small" data-act="iaFileX" aria-label="Retirer le document">✕</button></div>`:`<label class="f">Joindre un document (facultatif)<input type="file" id="ia-file" accept="application/pdf,image/*"></label>`}
    <div class="err" id="ia-err"></div><button class="btn primary" data-act="iaEdit" ${iaBusy?"disabled":""}>${iaBusy?"L'IA modifie le carnet…":"Envoyer à l'IA"}</button>${iaBusy?`<button type="button" class="btn ghost small" data-act="iaStop" style="margin-top:6px">✕ Annuler</button><p class="hint" style="margin:4px 0 0">Cela peut prendre 1 à 3 minutes (4 minutes au plus).</p>`:""}</details>
  <div class="m-split${E.tab==="apercu"?" solo":""}"><div class="m-left stack"><div class="seg2" style="grid-template-columns:repeat(4,minmax(0,1fr))">${tabs.map(([k,l])=>`<button data-act="mTab" data-t="${k}" aria-current="${E.tab===k}">${l}</button>`).join("")}</div>
  ${body}</div>${E.tab==="apercu"?"":`<aside class="m-live"><div class="m-ph-h"><span>📱 Aperçu élève en direct</span><span class="hint">touchez une case pour la retrouver</span></div><div class="m-phone" id="m-live">${gSeance(curS())}</div></aside>`}</div>
  <div class="valid-bar"><button class="btn big go-valid" style="--th:var(--d4)" data-act="mPublish"><span>✅ Valider et publier</span><small>${E.pub?"Remplace la version des élèves · leurs données sont conservées":"Le carnet apparaît pour les élèves des classes activées"}</small></button></div></div>`}
const fileToB64=f=>new Promise((ok,ko)=>{const r=new FileReader();r.onload=()=>ok(String(r.result).split(",")[1]);r.onerror=ko;r.readAsDataURL(f)});
async function iaGenerer(){const fv=id=>{const x=$(id);return x&&x.files?x.files[0]:null},f1=fv("#gen-file"),f2=fv("#gen-fiche"),texte=(($("#gen-text")||{}).value||"").trim(),consignes=(($("#gen-cons")||{}).value||"").trim(),mode=(($("#gen-form")||{}).dataset||{}).mode||"ref",err=$("#gen-err");err.textContent="";
  if(mode==="ref"&&!f1&&!texte){err.textContent="Ajoutez le référentiel (fichier ou texte).";return}
  if((mode==="photo"||mode==="fidele")&&!f2){err.textContent="Prenez en photo ou choisissez votre fiche.";return}
  if(mode==="phrase"&&consignes.length<8){err.textContent="Décrivez votre carnet en une ou deux phrases.";return}
  if((f1&&f1.size>15e6)||(f2&&f2.size>15e6)){err.textContent="Fichier trop lourd (15 Mo maximum chacun).";return}
  iaBusy=true;render();
  try{const ia=await import("./ia.js?v=2026.11.21-15");const fichiers=[];
    if(f1)fichiers.push({role:"referentiel",mime:f1.type||"application/pdf",base64:await fileToB64(f1)});
    if(f2)fichiers.push({role:"fiche",mime:f2.type||"application/pdf",base64:await fileToB64(f2)});
    let m;if(mode==="fidele"){const r=await ia.genererFicheFidele({fichiers,consignes,cle:IAKEY});m=r&&r.modele?r.modele:r;if(!r||!r.gabarit||!r.gabarit.html)throw new Error("Réponse de l'IA illisible.");m.gabarit=r.gabarit;if(r.versions&&!m.versions)m.versions=r.versions;m.partage=m.partage==="groupe"?"groupe":"coach";
      try{const pr=/pdf/i.test(f2.type)||/\.pdf$/i.test(f2.name)?await pdfParts(f2,()=>{}):{type:"images",parts:await imageParts(f2)};m.gabarit.ficheId=await fb.addFiche({profId:me.uid,activite:dossier?dossier.id:"",titre:"Fiche d'origine · "+String(m.titre||f2.name).slice(0,60),type:pr.type,origine:true},pr.parts)}catch(x){console.warn("fiche d'origine",x)}}
    else m=await ia.genererModele({fichiers,texte:texte.slice(0,60000),consignes,cle:IAKEY,mode});iaBusy=false;dosGen=false;startEditor({modele:null,brouillon:iaGrilleAfl(m)});toast("Ébauche prête : modifiez-la en bac à sable, puis publiez")}
  catch(e){console.error(e);iaBusy=false;render();let msg=String(e&&e.message||e);try{const ia=await import("./ia.js?v=2026.11.21-15");msg=ia.iaMessage(e)}catch(x){}const el=$("#gen-err");if(el)el.textContent=msg}}
/* Après l'IA : un tableau à double entrée que rien ne lit donne la note de l'AFL1 (jamais une autoévaluation) — 2026.11.21-15 */
function iaInfo(t){openModal(`<h3>✨ Ce que l'IA a fait</h3><p>${esc(t)}</p><p class="hint">Vérifiez dans l'aperçu, puis publiez. « ↶ Annuler » revient à la version d'avant.</p><div class="row"><span class="spacer"></span><button class="btn primary" data-mact="close">OK</button></div>`)}
function iaGrilleAfl(m){if(!m||!Array.isArray(m.sections)||!Array.isArray(m.criteres))return m;
  const G=m.sections.flatMap(S=>(S.champs||[]).filter(c=>c&&c.type==="grille").map(c=>S.id+"."+c.id));if(!G.length)return m;
  const used=new Set(m.criteres.filter(c=>c&&c.calcul&&c.calcul.type==="grille").map(c=>c.calcul.champ));const libre=G.filter(g=>!used.has(g));if(!libre.length)return m;
  const c=m.criteres.find(c=>c&&/AFL\s*1/i.test(String(c.afl||""))&&(!c.calcul||c.calcul.type==="autoeval"));if(c)c.calcul={type:"grille",champ:libre[0]};return m}
async function iaModifier(){const ta=$("#ia-req");if(ta)iaDraft=ta.value;const req=iaDraft.trim(),err=$("#ia-err");if(!req){err.textContent="Écrivez votre demande.";return}
  const fl=iaFile||($("#ia-file")&&$("#ia-file").files[0])||null;if(fl&&fl.size>15e6){err.textContent="Fichier trop lourd (15 Mo maximum).";return}
  let fichiers=[];try{if(fl)fichiers=[{mime:fl.type||"application/pdf",base64:await fileToB64(fl)}]}catch(x){}
  iaBusy=true;rerenderKeep();
  try{const ia=await import("./ia.js?v=2026.11.21-15");const g0=modeleEdit.draft.gabarit;const m=await ia.modifierModele(normModele(modeleEdit.draft),req,IAKEY,fichiers);const chg=m&&typeof m._changements==="string"?m._changements.trim().slice(0,400):"";if(m)delete m._changements;const v0=modeleEdit.draft.versions;if(v0&&m&&!("versions" in m))m.versions=v0;if(g0&&m&&!m.gabarit)m.gabarit=g0;else if(g0&&m&&m.gabarit&&g0.ficheId)m.gabarit.ficheId=g0.ficheId;modeleHist.push(clone(modeleEdit.draft));modeleEdit.draft=normModele(iaGrilleAfl(m));modeleEdit.dirty=true;iaBusy=false;iaDraft="";iaFile=null;iaOpen=true;setPreview();rerenderKeep();if(chg)iaInfo(chg);else toast("Carnet modifié par l'IA : vérifiez-le")}
  catch(e){console.error(e);iaBusy=false;rerenderKeep();let msg=String(e&&e.message||e);try{const ia=await import("./ia.js?v=2026.11.21-15");msg=ia.iaMessage(e)}catch(x){}const el=$("#ia-err");if(el){el.textContent=msg;$("#ia-req").value=req}}}
async function saveModele(quiet){const E=modeleEdit,M=normModele(E.draft);E.draft=M;
  try{if(E.id)await fb.updateModele(E.id,{titre:M.titre,ca:M.ca,brouillon:M,statut:E.statut});
    else if(E.fixedId){await fb.setModele(E.fixedId,{profId:me.uid,titre:M.titre,ca:M.ca,brouillon:M,modele:E.pub||null,statut:E.statut});E.id=E.fixedId}
    else{E.id=await fb.createModele({profId:me.uid,titre:M.titre,ca:M.ca,brouillon:M,modele:null,statut:"brouillon"});if(E.dossier)await dosAddCarnet(E.id)}
    E.dirty=false;if(!quiet)toast("Brouillon enregistré");rerenderKeep();return true}catch(e){toast(authMsg(e));return false}}
async function publierModele(){const E=modeleEdit,M=normModele(E.draft);E.draft=M;
  const prob=[];if(!M.criteres.some(c=>c.afl==="AFL1"))prob.push("aucun critère AFL1");M.criteres.forEach(c=>{if(c.descripteurs.some(d=>!d.trim()))prob.push(`descripteurs vides pour « ${c.label} »`)});
  const go2=async()=>{try{if(!E.id){E.statut="brouillon";if(!await saveModele(true))return}
      await fb.updateModele(E.id,{titre:M.titre,ca:M.ca,brouillon:M,modele:M,statut:"publie",publieLe:new Date().toISOString()});
      E.pub=M;E.statut="publie";E.publieLe={toDate:()=>new Date()};E.dirty=false;closeModal();setPreview();toast("Carnet publié pour les élèves");rerenderKeep()}catch(e){closeModal();toast(authMsg(e))}};
  confirmBox("Publier ce carnet ?",`${E.pub?"Les élèves passeront à cette nouvelle version. Les réponses déjà saisies sont conservées ; une case supprimée n'est plus affichée.":"Il apparaîtra pour les élèves des classes activées."}${prob.length?`<br><br><strong>À vérifier :</strong> ${esc(prob.join(" ; "))}.`:""}`,"Publier",go2)}
function mutDraft(fn,rr=true){const M=modeleEdit.draft;fn(M);modeleEdit.dirty=true;setPreview();if(rr)rerenderKeep()}
function mClick(a,b){if(a==="mBlank"){startEditor({modele:null,brouillon:blankModele()});return true}if(!modeleEdit)return false;const si=+b.dataset.si,fi=+b.dataset.fi,ci=+b.dataset.ci,mv=(arr,i,d)=>{const j=i+d;if(j<0||j>=arr.length)return;[arr[i],arr[j]]=[arr[j],arr[i]]};
  switch(a){
    case"mTab":modeleEdit.tab=b.dataset.t;if(modeleEdit.tab==="apercu"){SBX=null;setPreview()}else setPreview();render();return true;
    case"mSandbox":modeleEdit.statut="brouillon";(modeleEdit.id?fb.updateModele(modeleEdit.id,{statut:"brouillon"}):saveModele(true)).catch(x=>toast(authMsg(x)));modeleEdit.tab="seance";render();toast("Bac à sable : les élèves gardent la version publiée");return true;
    case"mPublish":publierModele();return true;
    case"mAddSec":mutDraft(M=>M.sections.push({id:newId("s"),titre:"Nouvelle partie",consigne:"",champs:[]}));return true;
    case"mDelSec":confirmBox("Supprimer cette partie ?","Ses cases ne seront plus affichées. Les réponses déjà saisies restent enregistrées.","Supprimer",async()=>{closeModal();mutDraft(M=>M.sections.splice(si,1))},true);return true;
    case"mUpSec":mutDraft(M=>mv(M.sections,si,-1));return true;
    case"mDownSec":mutDraft(M=>mv(M.sections,si,1));return true;
    case"mAddChamp":mutDraft(M=>M.sections[si].champs.push({id:newId("c"),type:"nombre",label:"Nouvelle case",aide:"",unite:"",requis:true}));return true;
    case"mDelChamp":mutDraft(M=>M.sections[si].champs.splice(fi,1));return true;
    case"mUpChamp":mutDraft(M=>mv(M.sections[si].champs,fi,-1));return true;
    case"mDownChamp":mutDraft(M=>mv(M.sections[si].champs,fi,1));return true;
    case"mAddCol":mutDraft(M=>{const f=M.sections[si].champs[fi];f.colonnes=f.colonnes||[];f.colonnes.push({id:newId("k"),type:"texte",label:"Colonne",options:[]})});return true;
    case"mDelCol":mutDraft(M=>M.sections[si].champs[fi].colonnes.splice(ci,1));return true;
    case"mAddCrit":mutDraft(M=>M.criteres.push({id:newId("k"),afl:"AFL1",label:"Nouveau critère",descripteurs:["","","",""],points:[1,2,3,4],calcul:{type:"autoeval"}}));return true;
    case"mDelCrit":mutDraft(M=>M.criteres.splice(ci,1));return true;
    case"mAddTheme":mutDraft(M=>M.themes.push({id:newId("t"),label:"Thème",desc:""}));return true;
    case"mDelTheme":mutDraft(M=>M.themes.splice(+b.dataset.ti,1));return true;
    case"mAddRow":mutDraft(M=>M.bareme.afl1.table.push({pts:0,note:0}));return true;
    case"mDelRow":mutDraft(M=>M.bareme.afl1.table.splice(+b.dataset.ri,1));return true;
    case"mBlank":startEditor({modele:null,brouillon:blankModele()});return true}
  return false}
function mField(el,e){if(!modeleEdit||route.name!=="modele")return false;const M=modeleEdit.draft;
  if(el.dataset.mcomplet!==undefined){if(e.type!=="change")return true;const c=M.criteres[+el.dataset.mcomplet].calcul;c.champs=c.champs||[];el.checked?c.champs.push(el.value):c.champs=c.champs.filter(x=>x!==el.value);modeleEdit.dirty=true;return true}
  if(el.dataset.mcible!==undefined){if(e.type!=="change")return true;const c=M.criteres[+el.dataset.mcible].calcul,tgt=el.dataset.where==="source"?c.source:c;tgt.cible=el.value==="num"?(el.dataset.where==="source"?60:0):{champ:el.value};modeleEdit.dirty=true;rerenderKeep();return true}
  if(el.dataset.mgsrc!==undefined){if(e.type!=="change")return true;const ax=el.dataset.mgsrc.split(".").reduce((o,k)=>o[k],M);const[ch,col]=el.value.split("#");ax.src=(ax.src||[]).filter(x=>!(x.champ===ch&&(x.colonne||"")===(col||"")));if(el.checked)ax.src.push(col?{champ:ch,colonne:col}:{champ:ch});modeleEdit.dirty=true;return true}
  if(el.dataset.m===undefined)return false;
  const path=el.dataset.m,t=el.dataset.mt;let v=t==="bool"?el.checked:el.value;
  if(t==="num")v=el.value===""?"":num(el.value);if(t==="list")v=el.value.split(/[,\n]/).map(x=>x.trim()).filter(Boolean);if(t==="list"&&/\.(lignes|colonnes)\.seuils$/.test(path))v=numsOf(v);if(t==="tlist"){v=el.value.split(/[;\n]/).map(x=>x.trim());while(v.length&&!v[v.length-1])v.pop()}
  setPath(M,path,v);modeleEdit.dirty=true;if(path==="versions.nb"&&e.type==="change")rerenderKeep();
  if(/\.cap\.champ$/.test(path)&&!v){const o=path.split(".").slice(0,-2).reduce((o,k)=>o&&o[k],M);if(o&&o.cap){o.cap.champ="";}}
  if(gCapSync(M)&&e.type==="change")rerenderKeep();
  if(/\.type$/.test(path)&&/^sections\.\d+\.champs\.\d+\.type$/.test(path)&&e.type==="change"){const[, si,fi]=path.match(/sections\.(\d+)\.champs\.(\d+)/);const f=M.sections[+si].champs[+fi];
    if(v==="tableau"&&!(f.colonnes&&f.colonnes.length))f.colonnes=[{id:newId("k"),type:"texte",label:"Colonne",options:[]}];if(v==="passages"&&!f.nb)f.nb=4;if(v==="exercices"&&!f.nb)f.nb=3;if(v==="resume")f.src=f.src||{exos:(allFields(normModele(M),["exercices"])[0]||[""])[0],tours:"",temps:""};if(v==="echelle"){f.min=f.min||1;f.max=f.max||10}if(v==="choix"&&!f.options)f.options=[]}
  if(/^criteres\.\d+\.calcul\.type$/.test(path)&&e.type==="change"){const ci=+path.split(".")[1],c=M.criteres[ci],first=(allFields(normModele(M),["nombre","temps","compteur","echelle"])[0]||[""])[0];
    c.calcul=v==="seuils"?{type:"seuils",source:{champ:first},sens:"haut",seuils:[3,2,1]}:v==="ecart"?{type:"ecart",source:{champ:first},cible:0,seuils:[1,2,3]}:v==="complet"?{type:"complet",champs:[],seuils:[1,.85,.5]}:v==="rythme"?{type:"rythme",source:{champ:(allFields(normModele(M),["passages"])[0]||[""])[0],cible:60,tolerance:5}}:v==="reperes"?{type:"reperes",source:{champ:(allFields(normModele(M),["exercices"])[0]||[""])[0]},min:3}:{type:"autoeval"}}
  if(/calcul\.condition\.champ$/.test(path)&&e.type==="change"){const c=M.criteres[+path.split(".")[1]].calcul;if(!v)delete c.condition;else c.condition={champ:v,valeur:""}}
  if(/calcul\.source\.champ$/.test(path)&&e.type==="change"){const ci=+path.split(".")[1],c=M.criteres[ci].calcul,f=gField(normModele(M),v);
    if(f&&f.type==="passages"){c.source.mesure=c.source.mesure||"proportion_dans_cible";if(c.source.cible===undefined)c.source.cible=60;c.source.tolerance=c.source.tolerance??5}
    if(f&&f.type==="tableau"){c.source.colonne=c.source.colonne||(f.colonnes[0]&&f.colonnes[0].id);c.source.agg=c.source.agg||"moyenne"}}
  if(e.type==="change"&&el.dataset.rerender!==undefined)rerenderKeep();
  return true}

async function toggleActivite(cid,on){const c=classes.find(x=>x.id===cid);if(!c||!modeleEdit.id)return;const a=new Set(c.activites||[]);on?a.add(modeleEdit.id):a.delete(modeleEdit.id);
  try{await fb.updateClasse(cid,{activites:[...a]});c.activites=[...a];toast(on?`Activé pour ${c.nom}`:`Retiré de ${c.nom}`)}catch(e){toast(authMsg(e))}}

/* --- Événements des carnets génériques --- */
function gClick(a,b,s){const sec=b.dataset.sec,fid=b.dataset.f,i=+b.dataset.i;
  if(a==="gLvl"){if(!RO&&s&&!s.valide)gModalLvl(b.dataset.c,+b.dataset.d);return true}
  if(a==="gTest"){if(s){s.valide=!s.valide;rerenderKeep();if(s.valide){const c=$("#corr");if(c)c.scrollIntoView({behavior:"smooth",block:"start"})}}return true}
  if(RO||!s||s.valide)return["gCnt","gAddRow","gDelRow","gPas","gNr","gAdapt","gValidate"].includes(a);
  if(a==="gCnt"){s.valeurs[sec][fid]=Math.max(0,(num(s.valeurs[sec][fid])||0)+(+b.dataset.d));save();rerenderKeep();return true}
  if(a==="gAddRow"){const f=gField(MOD,sec+"."+fid);s.valeurs[sec][fid].push(f.type==="exercices"?blankExo("gym"):Object.fromEntries(f.colonnes.map(c=>[c.id,""])));save();rerenderKeep();return true}
  if(a==="gAdapt"){gModalAdapt(sec,fid,i);return true}
  if(a==="gDelRow"){s.valeurs[sec][fid].splice(i,1);gEnsure(MOD,s);save();rerenderKeep();return true}
  if(a==="gPas"){const t=s.valeurs[sec][fid][i];if(!(num(t.passage)>0)&&b.classList.contains("next")&&elapsed()>0){t.passage=Math.round(elapsed()*10)/10;save();rerenderKeep()}else gModalPas(sec,fid,i);return true}
  if(a==="gNr"){const t=s.valeurs[sec][fid][i];t.noRep=Math.max(0,(num(t.noRep)||0)+(+b.dataset.d));save();rerenderKeep();return true}
  if(a==="gValidate"){const m=gMissing(MOD,s);
    openModal(m.length?`<h3>Il manque des éléments</h3><ul class="miss">${m.map(x=>`<li>${esc(x)}</li>`).join("")}</ul><p class="hint" style="margin:0">Les critères incomplets ne rapporteront pas de points. Une fois validée, la séance ne peut plus être modifiée.</p><div class="grid2"><button class="btn" data-mact="close">Compléter</button><button class="btn primary" data-mact="forceValid">Valider quand même</button></div>`
      :`<h3>Valider la séance ?</h3><p style="margin:0">Une fois validée, elle ne pourra plus être modifiée ni supprimée.</p><div class="grid2"><button class="btn" data-mact="close">Relire</button><button class="btn primary" data-mact="forceValid">Valider</button></div>`,{type:"valid",i:0});return true}
  return false}
function gModalAction(a,b,c,s){
  if(a==="gLvlTab"){gModalLvl(b.dataset.c,+b.dataset.d);return true}
  if(a==="gPickLvl"){if(s&&!s.valide&&!RO){s.autoeval[b.dataset.c]=+b.dataset.d;save();rerenderKeep()}closeModal();return true}
  if(!["gSavePas","gTakePas","gClearPas","gSaveAd","gClearAd"].includes(a))return false;
  if(!s||RO||s.valide||!c){closeModal();return true}const t=s.valeurs[c.sec][c.fid][c.i];
  if(a==="gSaveAd"||a==="gClearAd"){if(a==="gClearAd")t.adapt=null;else{const params=[...$("#sheet").querySelectorAll(".checks input:checked")].map(x=>x.value),texte=$("#m-txt").value.trim();t.adapt=params.length||texte?{params,texte}:null}save();closeModal();rerenderKeep();return true}
  if(a==="gTakePas")t.passage=Math.round(elapsed()*10)/10;
  else if(a==="gClearPas")t.passage=null;
  else{const v=parseT($("#m-pas").value);if(isNaN(v)||v<=0){$("#m-err").textContent="Écris le temps au format min:s, par exemple 3:05.";return true}t.passage=Math.round(v*10)/10}
  save();closeModal();rerenderKeep();return true}


/* ---------- Fiches ressources (images ou PDF déposés par le prof, affichés tels quels) ---------- */
let fiches=[],fichesKey=null,ficheOpen=null,ficheBusy="";const ficheData={};
const PDFJS="https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs",PDFJS_W="https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs";
const actKey=()=>route.name==="modele"&&modeleEdit?(modeleEdit.builtin?CA5_ID:modeleEdit.id):activite;
const ficheProf=()=>route.name==="modele"?me.uid:RO?me.uid:me.profId;
async function loadFiches(force){const k=ficheProf()+"|"+actKey();if(!actKey())return;if(!force&&fichesKey===k)return;
  try{fiches=(await fb.listFiches(ficheProf(),actKey())).sort((a,b)=>(a.ordre||0)-(b.ordre||0)||String(a.titre).localeCompare(String(b.titre),"fr"));fichesKey=k}catch(e){console.error(e);fiches=[];toast(authMsg(e))}}
async function openFiches(){RETRY=()=>openFiches();view="fiches";cur=null;ficheOpen=null;render();await loadFiches();render()}
function ficheIcon(f){return f.type==="texte"?"📝":f.type==="pdf"?"📄":"🖼️"}
function vFicheViewer(f){const d=ficheData[f.id];
  if(f.type==="texte")return`<div class="fiche-txt">${esc(f.texte||"")}</div>`;
  if(!d)return`<div class="center-msg" style="padding:24px"><div class="spinner"></div><p>Ouverture de la fiche…</p></div>`;
  if(d.err)return`<p class="err">${esc(d.err)}</p>`;
  if(f.type==="pdf")return`<p class="hint" style="margin:0 0 8px">Fiche au format PDF.</p><a class="btn primary big" href="${d.url}" target="_blank" rel="noopener">📄 Ouvrir la fiche</a><object data="${d.url}" type="application/pdf" class="fiche-pdf"></object>`;
  return`<div class="fiche-pages">${d.pages.map((u,i)=>`<img src="${u}" alt="${esc(f.titre)} · page ${i+1}" loading="lazy">`).join("")}</div>`}
async function loadFicheData(f){if(f.type==="texte"||ficheData[f.id])return;
  try{const parts=await fb.getFicheParts(f.id);
    if(f.type==="pdf"){const b64=parts.map(p=>p.data).join(""),bin=atob(b64),u8=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u8[i]=bin.charCodeAt(i);ficheData[f.id]={url:URL.createObjectURL(new Blob([u8],{type:"application/pdf"}))}}
    else ficheData[f.id]={pages:parts.map(p=>`data:${p.mime||"image/jpeg"};base64,${p.data}`)}}
  catch(e){console.error(e);ficheData[f.id]={err:"Impossible d'ouvrir la fiche. Vérifie ta connexion."}}}
async function showFiche(id){ficheOpen=ficheOpen===id?null:id;rerenderKeep();const f=fiches.find(x=>x.id===id);if(f&&ficheOpen===id&&!ficheData[id]){await loadFicheData(f);if(ficheOpen===id)rerenderKeep()}}
function vFiches(){const ed=route.name==="modele";
  const items=fiches.map((f,i)=>`<div class="fiche${ficheOpen===f.id?" open":""}"><div class="fiche-h"><button class="fiche-t" data-act="showFiche" data-id="${f.id}" aria-expanded="${ficheOpen===f.id}"><span class="fi-ic">${ficheIcon(f)}</span><span><strong>${esc(f.titre)}</strong>${f.type!=="texte"?`<span class="hint"> · ${f.type==="pdf"?"PDF":f.nb+" page"+(f.nb>1?"s":"")}</span>`:""}</span><span class="spacer"></span><span class="chip">${ficheOpen===f.id?"Fermer":"Voir"}</span></button>
    ${ed?`<div class="row" style="gap:4px;margin-top:6px"><input data-fiche-titre="${f.id}" value="${esc(f.titre)}" aria-label="Titre de la fiche" style="flex:1;min-width:0"><button class="btn ghost small" data-act="ficheUp" data-i="${i}" aria-label="Monter">↑</button><button class="btn ghost small" data-act="ficheDown" data-i="${i}" aria-label="Descendre">↓</button><button class="btn ghost small danger" data-act="ficheDel" data-id="${f.id}" aria-label="Supprimer la fiche">✕</button></div>`:""}</div>
    ${ficheOpen===f.id?`<div class="fiche-b">${vFicheViewer(f)}</div>`:""}</div>`).join("");
  const form=ed?`<form class="card stack" id="fiche-form" style="gap:10px"><h3>Déposer une fiche</h3>
    <label class="f">Fichier (PDF ou photo)<input type="file" id="fi-file" accept="application/pdf,image/*" multiple></label>
    <details><summary class="hint">Ou écrire une fiche texte</summary><textarea id="fi-texte" placeholder="Contenu de la fiche"></textarea></details>
    <label class="f">Titre (facultatif)<input id="fi-titre" maxlength="80" placeholder="ex. Repères de charge, Fiche technique du thruster"></label>
    <div class="err" id="fi-err"></div><div class="hint" id="fi-prog">${esc(ficheBusy)}</div>
    <button class="btn primary" type="submit" ${ficheBusy?"disabled":""}>${ficheBusy?"Dépôt en cours…":"Déposer"}</button>
    <p class="hint" style="margin:0">Les PDF sont transformés en images page par page pour s'afficher tels quels sur les téléphones. Les fiches sont visibles tout de suite par les élèves, sans republier le carnet.</p></form>`:"";
  return`<div class="stack">${ed?"":`<h2>Fiches ressources</h2>`}${ed&&!actKey()?`<p class="hint">Enregistrez d'abord le carnet pour déposer des fiches.</p>`:`${items?`<div class="fiches">${items}</div>`:`<div class="card"><p style="margin:0">${ed?"Aucune fiche pour l'instant.":"Ton enseignant n'a pas encore déposé de fiche pour cette activité."}</p></div>`}${form}`}</div>`}
/* Préparation des fichiers côté prof */
const b64OfBlob=b=>new Promise((ok,ko)=>{const r=new FileReader();r.onload=()=>ok(String(r.result).split(",")[1]);r.onerror=ko;r.readAsDataURL(b)});
function canvasJpeg(cv){let q=.82,b64;do{b64=cv.toDataURL("image/jpeg",q).split(",")[1];q-=.12}while(b64.length>900000&&q>.3);if(b64.length>1000000)throw new Error("Image trop détaillée pour être enregistrée.");return b64}
async function imageParts(file){const url=URL.createObjectURL(file);try{const img=await new Promise((ok,ko)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=ko;i.src=url});
  const sc=Math.min(1,1600/Math.max(img.width,img.height)),cv=document.createElement("canvas");cv.width=Math.round(img.width*sc);cv.height=Math.round(img.height*sc);const cx=cv.getContext("2d");cx.fillStyle="#fff";cx.fillRect(0,0,cv.width,cv.height);cx.drawImage(img,0,0,cv.width,cv.height);
  return[{mime:"image/jpeg",data:await canvasJpeg(cv)}]}finally{URL.revokeObjectURL(url)}}
async function pdfParts(file,prog){try{const pdfjs=await import(PDFJS);pdfjs.GlobalWorkerOptions.workerSrc=PDFJS_W;const doc=await pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise;
    if(doc.numPages>30)throw new Error("trop de pages");const out=[];
    for(let i=1;i<=doc.numPages;i++){prog(`Page ${i} / ${doc.numPages}…`);const pg=await doc.getPage(i),vp0=pg.getViewport({scale:1}),sc=Math.min(2.5,1500/vp0.width),vp=pg.getViewport({scale:sc});
      const cv=document.createElement("canvas");cv.width=Math.round(vp.width);cv.height=Math.round(vp.height);const cx=cv.getContext("2d");cx.fillStyle="#fff";cx.fillRect(0,0,cv.width,cv.height);
      await pg.render({canvasContext:cx,viewport:vp}).promise;out.push({mime:"image/jpeg",data:await canvasJpeg(cv)})}
    return{type:"images",parts:out}}
  catch(e){console.warn("PDF gardé tel quel",e);if(file.size>8e6)throw new Error("PDF trop lourd (8 Mo maximum).");const b64=await b64OfBlob(file),parts=[];for(let i=0;i<b64.length;i+=900000)parts.push({mime:"application/pdf",data:b64.slice(i,i+900000)});return{type:"pdf",parts}}}
async function deposerFiches(){const files=[...$("#fi-file").files],texte=($("#fi-texte")||{value:""}).value.trim(),titre=$("#fi-titre").value.trim(),err=$("#fi-err");err.textContent="";
  if(!files.length&&!texte){err.textContent="Choisissez un fichier ou écrivez le texte de la fiche.";return}
  const base={profId:me.uid,activite:dossier.id};let ordre=fiches.reduce((m,f)=>Math.max(m,f.ordre||0),0);const added=[];
  const prog=t=>{ficheBusy=t;const el=$("#fi-prog");if(el)el.textContent=t};ficheBusy="Préparation…";rerenderKeep();
  try{if(texte)added.push(await fb.addFiche({...base,titre:titre||"Fiche",type:"texte",texte:texte.slice(0,20000),ordre:++ordre},[]));
    for(const[i,f]of files.entries()){prog(`Fichier ${i+1} / ${files.length} : ${f.name}`);const t=(files.length===1&&titre)||f.name.replace(/\.[a-z0-9]+$/i,"").slice(0,80);
      let r;if(/pdf/i.test(f.type)||/\.pdf$/i.test(f.name))r=await pdfParts(f,x=>prog(`${f.name} · ${x}`));else if(/^image\//.test(f.type))r={type:"images",parts:await imageParts(f)};else throw new Error(`« ${f.name} » n'est ni un PDF ni une image.`);
      prog(`${f.name} · envoi…`);added.push(await fb.addFiche({...base,titre:t,type:r.type,ordre:++ordre},r.parts))}
    ficheBusy="";await dosItems([...(dossier.items||[]),...added.map(id=>({t:"fiche",id}))]);toast("Fiche déposée");openDossierEd(dossier.id)}
  catch(e){console.error(e);ficheBusy="";if(added.length)await dosItems([...(dossier.items||[]),...added.map(id=>({t:"fiche",id}))]);rerenderKeep();const el=$("#fi-err");if(el)el.textContent=e&&e.code?authMsg(e):String(e&&e.message||e)}}
async function ficheMove(i,d){const j=i+d;if(j<0||j>=fiches.length)return;[fiches[i],fiches[j]]=[fiches[j],fiches[i]];rerenderKeep();
  try{await Promise.all(fiches.map((f,k)=>f.ordre===k+1?null:(f.ordre=k+1,fb.updateFiche(f.id,{ordre:k+1}))))}catch(e){toast(authMsg(e))}}


/* ====================================================================
   Dossiers d'activité : chaque activité est un dossier qui contient des
   documents (carnets, feuilles de poule, fiches ressources, référentiel…)
   ==================================================================== */
let dossiers=[],dossier=null,dossierItems=[],dossierCtx=null,dosGen=false;
/* Réglages de page et de partage d'un carnet */
const PAGES_FR={seance:"Une page par séance",plusieurs:"Une page sur plusieurs séances",cycle:"Une seule page pour tout le cycle"};
const PARTAGE_FR={aucun:"Pas de partage",coach:"L'élève partage sa page avec un coach",groupe:"Les élèves créent un groupe qui partage les pages"};
const PW=M=>M&&M.pages&&M.pages!=="seance"?{one:"page",One:"Page",many:"pages",mes:"Mes pages",nouv:"+ Nouvelle page",val:"Valider ma page"}:{one:"séance",One:"Séance",many:"séances",mes:"Mes séances",nouv:"+ Nouvelle séance",val:"Valider ma séance"};
const isGroupe=()=>!!(carnetDoc&&carnetDoc.groupe);
/** Modèle vu par un élève d'un groupe : ses parties individuelles ont leur propre place dans la page partagée. */
function modFor(M,uid){if(!M||M.partage!=="groupe"||!uid)return M;
  const ind=new Set(M.sections.filter(S=>S.portee==="individuelle").map(S=>S.id)),sfx="__"+uid;
  const mp=p=>{if(!p||typeof p!=="string")return p;const i=p.indexOf(".");const a=i<0?p:p.slice(0,i);return ind.has(a)?a+sfx+(i<0?"":p.slice(i)):p};
  const M2=clone(M);M2.sections.forEach(S=>{if(ind.has(S.id)){S.base=S.id;S.id=S.id+sfx}S.champs.forEach(f=>{if(f.nbChamp)f.nbChamp=mp(f.nbChamp);if(f.type==="grille")["lignes","colonnes"].forEach(k=>{f[k].src.forEach(x=>x.champ=mp(x.champ));if(f[k].cap)f[k].cap.champ=mp(f[k].cap.champ)});else if(f.type==="calcul")(f.src||[]).forEach(x=>x.champ=mp(x.champ));else if(f.src)Object.keys(f.src).forEach(k=>f.src[k]=mp(f.src[k]))})});
  const fixC=c=>{if(!c)return;if(c.source){c.source.champ=mp(c.source.champ);if(c.source.cible&&typeof c.source.cible==="object")c.source.cible.champ=mp(c.source.cible.champ)}
    if(c.cible&&typeof c.cible==="object")c.cible.champ=mp(c.cible.champ);if(c.condition)c.condition.champ=mp(c.condition.champ);if(c.champs)c.champs=c.champs.map(mp);if(c.champ)c.champ=mp(c.champ)};
  const paths=c=>[c.source&&c.source.champ,c.champ,...(c.champs||[])].filter(Boolean);
  M2.criteres=M2.criteres.filter(cr=>{const c=cr.calcul;
    if(c.type==="autoeval"){cr.id=cr.id+sfx;return true}
    const indiv=paths(c).length&&paths(c).every(p=>ind.has(String(p).split(".")[0]));
    fixC(c);return indiv||M.noteGroupe});
  return M2}
/* --- Pages partagées : enregistrement case par case et fusion des modifications des camarades --- */
const SYNCED={};
const flatVals=s=>{const o={};Object.entries(s.valeurs||{}).forEach(([a,sec])=>Object.entries(sec||{}).forEach(([b,v])=>o["valeurs."+a+"."+b]=JSON.stringify(v)));
  Object.entries(s.autoeval||{}).forEach(([k,v])=>o["autoeval."+k]=JSON.stringify(v));["date","theme","epreuve","valide","ordre"].forEach(k=>o[k]=JSON.stringify(s[k]));return o};
function markSynced(s){SYNCED[s.id]=flatVals(s)}
function groupPatch(s){const now=flatVals(s),old=SYNCED[s.id];if(!old)return null;const p={};Object.keys(now).forEach(k=>{if(now[k]!==old[k])p[k]=now[k]===undefined?null:JSON.parse(now[k])});return p}
function mergeRemote(loc,d){const old=SYNCED[loc.id]||{},mine=flatVals(loc),rem=flatVals(d);let ch=false;
  Object.keys(rem).forEach(k=>{if(rem[k]===mine[k])return;if(mine[k]!==old[k]&&old[k]!==undefined)return;/* modifié ici, pas encore envoyé */
    const v=rem[k]===undefined?undefined:JSON.parse(rem[k]),ks=k.split(".");let o=loc;for(let i=0;i<ks.length-1;i++){if(o[ks[i]]==null)o[ks[i]]={};o=o[ks[i]]}o[ks[ks.length-1]]=v;ch=true});
  SYNCED[loc.id]=rem;return ch}
/* --- Groupes --- */
async function creerGroupe(){if(apercuBloque())return;const err=$("#grp-err"),raw=[...document.querySelectorAll(".grp-m:checked")].map(x=>x.value.toLowerCase());err.textContent="";
  const logins=[...new Set(raw)].filter(l=>l!==String(me.login).toLowerCase()),uids=[me.uid],lg=[me.login],mx=MOD.groupeMax||4;
  if(logins.length+1>mx){err.textContent=`Un groupe compte au plus ${mx} élèves (toi compris).`;return}
  try{for(const l of logins){const x=await fb.getLogin(l).catch(()=>null);if(!x){err.textContent=`Identifiant introuvable dans ta classe : ${l}`;return}uids.push(x.uid);lg.push(l)}
    const id="g_"+Math.random().toString(36).slice(2,12),b={groupe:true,membres:uids,logins:lg,profId:me.profId,classeId:me.classeId,activite,profil:blankProfil()};
    await fb.createCarnet(id,b);toast(uids.length>1?"Groupe créé : tes camarades le retrouvent dans l'activité":"Groupe créé : ajoute tes camarades dans « Groupe »");openCarnetModele(activite)}
  catch(e){console.error(e);err.textContent=authMsg(e)}}
async function ajouterMembre(){if(apercuBloque())return;const err=$("#gm-err"),l=String(($("#gm-id")||{}).value||"").trim().toLowerCase();err.textContent="";if(!l)return;
  if((carnetDoc.logins||[]).includes(l)){err.textContent="Déjà dans le groupe.";return}
  if((carnetDoc.membres||[]).length>=(MOD.groupeMax||4)){err.textContent=`Le groupe est complet (${MOD.groupeMax||4} élèves au plus).`;return}
  try{const x=await fb.getLogin(l);if(!x){err.textContent="Identifiant introuvable dans ta classe.";return}
    const membres=[...carnetDoc.membres,x.uid],logins=[...(carnetDoc.logins||[]),l];await fb.updateCarnet(carnetId,{membres,logins});carnetDoc.membres=membres;carnetDoc.logins=logins;toast("Camarade ajouté au groupe");rerenderKeep()}
  catch(e){err.textContent=authMsg(e)}}
async function quitterGroupe(){if(apercuBloque()){closeModal();return}const i=carnetDoc.membres.indexOf(me.uid);const membres=carnetDoc.membres.filter(u=>u!==me.uid),logins=(carnetDoc.logins||[]).filter((l,k)=>k!==i);
  try{await fb.updateCarnet(carnetId,{membres,logins});closeModal();toast("Tu as quitté le groupe");openCarnetModele(activite)}catch(e){closeModal();toast(authMsg(e))}}
function vGroupeCard(){if(!isGroupe())return"";const c=carnetDoc;
  return`<section class="card"><div class="sec-h"><h2>Mon groupe</h2><span class="spacer"></span><span class="chip">${(c.membres||[]).length} / ${MOD.groupeMax||4} élèves</span></div>
  ${(c.membres||[]).length<(MOD.groupeMin||2)?`<p class="err" style="margin:6px 0 0">Il manque ${(MOD.groupeMin||2)-(c.membres||[]).length} camarade${(MOD.groupeMin||2)-(c.membres||[]).length>1?"s":""} : un groupe compte au moins ${MOD.groupeMin||2} élèves.</p>`:""}
  <div class="row" style="gap:6px">${(c.logins||[]).map(l=>`<span class="chip"><code>${esc(l)}</code></span>`).join("")}</div>
  ${RO||(c.membres||[]).length>=(MOD.groupeMax||4)?"":`<div class="row" style="margin-top:10px;align-items:end"><label class="f" style="flex:1;min-width:160px">Ajouter un camarade${rosterSelect("gm-id",c.logins||[],"Choisir dans la classe…")}</label><button class="btn" data-act="grpAdd">Ajouter</button></div><div class="err" id="gm-err"></div>
  <p class="hint" style="margin:8px 0 0">Toutes les pages sont partagées. ${MOD.sections.some(S=>S.base)?"Les parties marquées « individuelle » sont propres à chacun.":""}</p>
  <button class="btn ghost small danger" data-act="grpLeave" style="margin-top:6px">Quitter le groupe</button>`}</section>`}
function vSansGroupe(){return`<div class="stack"><div class="class-hero"><span class="eyebrow">${esc(MOD.ca||"")}</span><h2>${esc(MOD.titre)}</h2></div>
  <section class="card stack" style="gap:10px"><h3>Ce carnet se remplit en groupe</h3>
  <p style="margin:0"><strong>Groupes de ${MOD.groupeMin===MOD.groupeMax?MOD.groupeMin:`${MOD.groupeMin} à ${MOD.groupeMax}`} élèves.</strong> Crée ton groupe en cochant tes camarades dans la liste de la classe. Si un camarade a déjà créé votre groupe, demande-lui de t'ajouter : le carnet apparaîtra ici.</p>
  <div class="f"><span class="mlab">Coche tes camarades (${MOD.groupeMax-1} au plus)</span>${rosterChecks("grp-m",[],MOD.groupeMax-1)}</div>
  <div class="err" id="grp-err"></div><button class="btn primary" data-act="grpCreate">Créer mon groupe</button>
  <button class="btn ghost small" data-act="grpRefresh">J'ai été ajouté·e : actualiser</button></section></div>`}
/* --- Élève : dossiers de la classe --- */
async function loadClasseDossiers(cl){const ids=(cl&&cl.dossiers)||null;if(!ids)return null;
  const r=await Promise.all(ids.map(id=>fb.getDossier(id).catch(e=>{console.warn(e);return null})));return r.filter(Boolean)}
async function itemsOf(d,profId){
  const one=async it=>{try{
    if(it.t==="carnet"){if(it.id===CA5_ID){const r=await ca5Modele(profId);return{...it,titre:r.M.titre,M:r.M,doc:r.doc,pub:true}}
      const m=await fb.getModele(it.id);return m?{...it,titre:(m.modele||m.brouillon||{}).titre||m.titre,doc:m,pub:!!m.modele,statut:m.statut}:null}
    if(it.t==="outil")return{...it,titre:it.titre||OUTILS[it.kind].nom,pub:true};
    if(it.t==="qcm"){const q=await fb.getQcm(it.id);return q?{...it,titre:q.titre||"QCM",q,pub:true}:null}
    const f=await fb.getFiche(it.id);return f?{...it,titre:f.titre,f}:null}catch(e){console.warn(e);return null}};
  return(await Promise.all((d.items||[]).map(one))).filter(Boolean)}
async function openDossier(id){RETRY=()=>openDossier(id);go("loading",{msg:"Ouverture de l'activité…"});if(!dossier||dossier.id!==id)dosTab="act";
  try{const d=await fb.getDossier(id);if(!d)throw{code:"not-found"};dossier=d;dossierCtx={id};activite=null;
    dossierItems=await itemsOf(d,me.role==="eleve"?me.profId:me.uid);fiches=dossierItems.filter(x=>x.t==="fiche").map(x=>x.f);ficheOpen=null;
    if(me.role==="eleve"&&dossierItems.some(x=>x.t==="outil")){try{[eleveSessions,eleveClasse]=await Promise.all([fb.listSessionsActives(me.classeId,me.profId),fb.getClasse(me.classeId)])}catch(e){console.warn(e);eleveSessions=[]}}
    qRepsDos={};const qq=dossierItems.filter(x=>x.t==="qcm");if(me.role==="eleve"&&qq.length){try{const[cl,...rs]=await Promise.all([fb.getClasse(me.classeId).catch(()=>eleveClasse),...qq.map(x=>VUE?null:fb.getQcmRep(x.id+"__"+me.uid).catch(()=>null))]);if(cl)eleveClasse=cl;qq.forEach((x,k)=>{if(rs[k])qRepsDos[x.id]=rs[k]})}catch(e){console.warn(e)}}
    go("dossier")}
  catch(e){console.error(e);go("error",{msg:authMsg(e)})}}
let dosTab="act";
function vDossierEleve(){const d=dossier,its=dossierItems.filter(x=>x.t==="fiche"||x.pub),carnets=its.filter(x=>x.t==="carnet"),k=CA_FR[d.ca]?d.ca:"";
  const item=x=>{if(x.t==="outil"){const s=(eleveSessions||[]).find(z=>z.outilId===x.id&&z.active),ok=x.kind!=="feuille"||s;
      return`<div class="dl-it outil"><span class="dl-ic">${IC.tool}</span><div class="dl-t"><b>${esc(x.titre)}</b><small>${IC.folder}${x.kind==="feuille"||x.kind==="co"?(s?`Séance du ${fmtDate(s.date)} en cours`:"Pas de séance ouverte"):"Outil"}</small></div><button class="dl-go" data-act="openOutil" data-id="${x.id}" ${ok?"":'aria-disabled="true"'}>${ok?`Ouvrir ${IC.arrow}`:"Fermé"}</button></div>`}
    if(x.t==="qcm"){const o=qOuvertPour(eleveClasse,x.id),r=qRepsDos[x.id];return`<div class="dl-it fiche"><span class="dl-ic">📝</span><div class="dl-t"><b>${esc(x.titre)}</b><small>${IC.folder}QCM · ${r?"fait ✓":o?"disponible":"pas encore ouvert"}</small></div><button class="dl-go" data-act="qOpen" data-id="${x.id}" ${o||r||VUE?"":'aria-disabled="true"'}>${r?`Voir ${IC.arrow}`:o||VUE?`Faire ${IC.arrow}`:"Fermé"}</button></div>`}
    if(x.t==="carnet")return`<div class="dl-it carnet"><span class="dl-ic">${IC.kettle}</span><div class="dl-t"><b>${esc(x.titre)}</b><small>${IC.folder}${x.M&&x.M.partage==="groupe"?"Carnet de groupe":"Carnet"}</small></div><button class="dl-go" data-act="openAct" data-a="${x.id}">Ouvrir ${IC.arrow}</button></div>`;
    const o=ficheOpen===x.id;return`<div class="dl-it fiche${o?" open":""}"><span class="dl-ic">${IC.certif}</span><div class="dl-t"><b>${esc(x.titre)}</b><small>${IC.folder}Fiche</small></div><button class="dl-go" data-act="showFiche" data-id="${x.id}" aria-expanded="${o}">${o?"Fermer":`Voir ${IC.arrow}`}</button>${o?`<div class="dl-fb">${vFicheViewer(x.f)}</div>`:""}</div>`};
  return`<div class="shell-home dos">
  <div class="dos-h"><button class="dos-back" data-nav="acts" aria-label="Retour">${IC.chev}</button><div><h1>Carnet d'entraînement</h1><p>EPS${k?" · Bac":""}</p></div><span class="spacer"></span><button class="dos-st" data-act="dosTab" data-t="res" aria-label="Mes résultats">${IC.bars}</button></div>
  ${vVueBanner(true)}
  <div class="dos-seg" role="tablist"><button role="tab" data-act="dosTab" data-t="act" aria-selected="${dosTab==="act"}"><span>${IC.cal}</span>Mes activités</button><button role="tab" data-act="dosTab" data-t="res" aria-selected="${dosTab==="res"}"><span>${IC.trophy}</span>Mes résultats</button></div>
  <button class="dos-hero" ${carnets[0]?`data-act="openAct" data-a="${carnets[0].id}"`:"disabled"} style="--c:${CA_COL[k]}"><img src="ca-hero.jpg?v=2026.11.21-15" alt=""><span class="dh-ic">${IC.runner}</span><span class="dh-t">${k?`<small>${k}</small>`:""}<b>${esc(d.titre)}</b><em>${esc(d.desc||CA_TAG[k]||"Donne le meilleur de toi-même !")}</em></span><span class="dh-go">${IC.chev}</span></button>
  ${dosTab==="res"?qResItems(its)+coResItems(its)+(carnets.length||its.some(x=>x.kind==="co")?carnets.map(x=>`<div class="dl-it carnet"><span class="dl-ic">${IC.trophy}</span><div class="dl-t"><b>${esc(x.titre)}</b><small>Bilan et note de ton carnet</small></div><button class="dl-go" data-act="openBilan" data-a="${x.id}">Voir ${IC.arrow}</button></div>`).join(""):`<section class="ec-empty">Pas encore de carnet dans cette activité.</section>`)
    :(its.length?its.map(item).join(""):`<section class="ec-empty">Ton enseignant n'a encore rien déposé dans cette activité.</section>`)}</div>`}
/* --- Prof : dossiers --- */
async function migrerDossiers(){try{const pr=await fb.getPrefs(me.uid).catch(()=>null);if(pr&&pr.dossiersOk)return;
    const ex=await fb.listDossiers(me.uid);if(ex.length){await fb.setPrefs(me.uid,{dossiersOk:true});return}
    const [mods,fis]=await Promise.all([fb.listModeles(me.uid),fb.listFichesProf(me.uid).catch(()=>[])]);
    const fOf=k=>fis.filter(f=>f.activite===k).sort((a,b)=>(a.ordre||0)-(b.ordre||0)).map(f=>({t:"fiche",id:f.id}));
    const map={};map[CA5_ID]=await fb.createDossier({profId:me.uid,titre:"Cross training",ca:"CA5",desc:"",items:[{t:"carnet",id:CA5_ID},...fOf(CA5_ID)]});
    for(const m of mods){if(m.id===ca5DocId(me.uid))continue;const M=m.brouillon||m.modele||{};map[m.id]=await fb.createDossier({profId:me.uid,titre:M.titre||m.titre||"Activité",ca:M.ca||m.ca||"",desc:"",items:[{t:"carnet",id:m.id},...fOf(m.id)]})}
    await loadClasses();for(const c of classes){const ds=[map[CA5_ID],...(c.activites||[]).map(a=>map[a]).filter(Boolean)];await fb.updateClasse(c.id,{dossiers:ds});c.dossiers=ds}
    await fb.setPrefs(me.uid,{dossiersOk:true})}catch(e){console.error("migration dossiers",e)}}
async function openDossiers(){RETRY=()=>openDossiers();go("loading");try{await migrerDossiers();await loadClasses();dossiers=(await fb.listDossiers(me.uid)).sort((a,b)=>String(a.titre).localeCompare(String(b.titre),"fr"));go("dossiers")}catch(e){go("error",{msg:authMsg(e)})}}
function vDossiers(){return`<div class="stack"><h2>Mes activités</h2>
  <p class="hint" style="margin:-6px 0 0">Chaque activité est un dossier : vous y rangez les carnets (carnet d'entraînement, feuille de poule…) et les fiches ressources (consignes, référentiel…). Vous l'activez ensuite pour vos classes.</p>
  ${dossiers.length?`<div class="grid-cards">${dossiers.map(d=>`<button class="class-card" data-act="openDossierEd" data-id="${d.id}"><span class="act-ca">${esc(d.ca||"")}</span><span class="cc-n" style="font-size:1.3rem">${esc(d.titre)}</span><span class="hint">${(d.items||[]).filter(x=>x.t==="carnet").length} carnet(s) · ${(d.items||[]).filter(x=>x.t==="fiche").length} fiche(s)</span><span class="chip">${classes.filter(c=>(c.dossiers||[]).includes(d.id)).map(c=>esc(c.nom)).join(", ")||"Aucune classe"}</span></button>`).join("")}</div>`:""}
  <form class="card" id="new-dossier"><div class="sec-h"><h3>Nouvelle activité</h3></div><div class="grid2"><label class="f">Nom<input id="nd-t" required maxlength="60" placeholder="ex. Acrosport"></label><label class="f">Champ d'apprentissage<select id="nd-ca">${["","CA1","CA2","CA3","CA4","CA5"].map(x=>`<option>${x}</option>`).join("")}</select></label></div>
  <button class="btn primary" type="submit" style="margin-top:10px">Créer l'activité</button></form></div>`}
async function openDossierEd(id){RETRY=()=>openDossierEd(id);shareOpen=false;go("loading");try{await loadClasses();const d=await fb.getDossier(id);if(!d)throw{code:"not-found"};dossier=d;dossierCtx={id};dosGen=false;CR=null;
  dossierItems=await itemsOf(d,me.uid);fiches=dossierItems.filter(x=>x.t==="fiche").map(x=>x.f);ficheOpen=null;go("dossierEd")}catch(e){go("error",{msg:authMsg(e)})}}
function vDossierEd(){const d=dossier,its=dossierItems;
  const st=x=>x.id===CA5_ID?(x.doc?(x.doc.statut==="brouillon"?"Bac à sable · version publiée en ligne":"Publié · votre version"):"Publié · version d'origine"):x.pub?(x.statut==="brouillon"?"Bac à sable · version publiée en ligne":"Publié"):"Bac à sable · pas encore visible";
  const rows=its.map((x,i)=>`<div class="doc-row${x.t==="fiche"&&ficheOpen===x.id?" open":""}"><div class="row" style="gap:6px;flex-wrap:nowrap">
    ${x.t==="qcm"?`<button class="doc-item" data-act="qOpenEd" data-id="${x.id}" style="flex:1"><span class="di-ic">📝</span><span class="di-t"><strong>${esc(x.titre)}</strong><span class="hint">QCM · ${x.q.questions.length} question${x.q.questions.length>1?"s":""} · ${x.q.afl} · noté sur ${fmtN(qNorm(x.q).sur)}</span></span><span class="chip">Modifier →</span></button>`:x.t==="outil"?`<div class="doc-item outil" style="flex:1;cursor:default"><span class="di-ic">${OUTILS[x.kind].ic}</span><span class="di-t"><input data-outil-titre="${x.id}" value="${esc(x.titre)}" maxlength="40" aria-label="Nom de l'outil"><span class="hint">${OUTILS[x.kind].nom} · séances${x.kind==="co"?"":" et réglages"} : Classes › la classe › Activités</span></span>${x.kind==="co"?`<button class="chip cc-go" data-act="ccOpen" data-id="${x.id}">Cartons et correction →</button>`:""}</div>`:x.t==="carnet"?`<button class="doc-item carnet" data-act="openModele" data-id="${x.id}" style="flex:1"><span class="di-ic">📒</span><span class="di-t"><strong>${esc(x.titre)}</strong><span class="hint">${st(x)}</span></span><span class="chip">Modifier →</span></button>`
      :`<button class="doc-item" data-act="showFiche" data-id="${x.id}" style="flex:1"><span class="di-ic">${ficheIcon(x.f)}</span><span class="di-t"><strong>${esc(x.titre)}</strong><span class="hint">Fiche${x.f.type==="pdf"?" PDF":x.f.type==="texte"?" texte":` · ${x.f.nb} page${x.f.nb>1?"s":""}`}</span></span><span class="chip">${ficheOpen===x.id?"Fermer":"Voir"}</span></button>`}
    <div class="stack" style="gap:2px"><button class="btn ghost small" data-act="dosUp" data-i="${i}" aria-label="Monter">↑</button><button class="btn ghost small" data-act="dosDown" data-i="${i}" aria-label="Descendre">↓</button></div><button class="btn ghost small danger" data-act="dosDel" data-i="${i}" aria-label="Retirer">✕</button></div>
    ${x.t==="fiche"&&ficheOpen===x.id?`<div class="fiche-b"><label class="f">Titre<input data-fiche-titre="${x.id}" value="${esc(x.titre)}" maxlength="80"></label>${vFicheViewer(x.f)}</div>`:""}</div>`).join("");
  const hasCa5=its.some(x=>x.id===CA5_ID);
  return`<div class="stack"><div class="row"><button class="btn ghost small" data-nav="modeles">← Mes activités</button><span class="spacer"></span><button class="btn danger small" data-act="dosDelete">Supprimer l'activité</button></div>
  <section class="class-hero"><span class="eyebrow">${esc(d.ca||"Activité")}</span><h2>${esc(d.titre)}</h2></section>
  <section class="card"><div class="grid2"><label class="f">Nom<input data-dos="titre" value="${esc(d.titre)}" maxlength="60"></label><label class="f">Champ d'apprentissage<select data-dos="ca">${["","CA1","CA2","CA3","CA4","CA5"].map(x=>`<option ${d.ca===x?"selected":""}>${x}</option>`).join("")}</select></label></div>
    <label class="f" style="margin-top:8px">Présentation pour les élèves (facultatif)<textarea data-dos="desc" rows="2">${esc(d.desc||"")}</textarea></label></section>
  <section class="card"><div class="sec-h"><h3>Documents de l'activité</h3><span class="hint">Ce que l'élève trouve dans le dossier</span></div>
    ${rows?`<div class="docs">${rows}</div>`:'<p class="hint" style="margin:0">Le dossier est vide : ajoutez un carnet ou une fiche ci-dessous.</p>'}</section>
  ${vCreer(hasCa5)}
  <section class="card stack" style="gap:8px"><h3>Ajouter un QCM</h3><p class="hint" style="margin:0">Questions à choix multiples corrigées automatiquement ; la note peut compter dans un AFL du carnet. L'IA peut écrire les questions à partir d'une fiche.</p>
    <div class="row"><button class="btn" data-act="qOpenEd">📝 Nouveau QCM</button></div></section>
  <section class="card stack" style="gap:8px"><h3>Ajouter un outil</h3><p class="hint" style="margin:0">Feuille de match : poules de 3 à 8 joueurs sur 1 à 4 terrains, scores reportés par les élèves arbitres. Scoreur : compteur de points avec bonus et chrono. Course d'orientation : formats de course, cartons de contrôle corrigés automatiquement, chrono.</p>
    <div class="row"><button class="btn" data-act="dosAddOutil" data-k="feuille">🏆 Feuille de match</button><button class="btn" data-act="dosAddOutil" data-k="scoreur">⏱️ Scoreur</button><button class="btn" data-act="dosAddOutil" data-k="co">🧭 Course d'orientation</button></div></section>
  <form class="card stack" id="fiche-form" style="gap:10px"><h3>Ajouter une fiche</h3>
    <label class="f">Fichier (PDF ou photo : consignes, fiche technique, référentiel…)<input type="file" id="fi-file" accept="application/pdf,image/*" multiple></label>
    <details><summary class="hint">Ou écrire une fiche texte</summary><textarea id="fi-texte" placeholder="Contenu de la fiche"></textarea></details>
    <label class="f">Titre (facultatif)<input id="fi-titre" maxlength="80" placeholder="ex. Référentiel d'évaluation, Fiche technique du thruster"></label>
    <div class="err" id="fi-err"></div><div class="hint" id="fi-prog">${esc(ficheBusy)}</div>
    <button class="btn primary" type="submit" ${ficheBusy?"disabled":""}>${ficheBusy?"Dépôt en cours…":"Déposer"}</button>
    <p class="hint" style="margin:0">Les PDF sont transformés en images page par page pour s'afficher tels quels sur les téléphones.</p></form>
  <section class="card"><div class="sec-h"><h3>Activer pour mes classes</h3></div>${classes.map(c=>`<label class="row" style="gap:8px;font-weight:600"><input type="checkbox" data-doscls="${c.id}" ${(c.dossiers||[]).includes(d.id)?"checked":""} style="width:20px;height:20px"> ${esc(c.nom)}</label>`).join("")||'<p class="hint">Aucune classe.</p>'}
    <p class="hint" style="margin:6px 0 0">Les élèves voient les carnets publiés et toutes les fiches.</p></section>${vShareBox()}</div>`}
function vGenForm(mode){mode=mode||"ref";const ft=`<p class="hint" style="margin:0">${IAKEY?"Gemini avec votre clé personnelle.":"Gemini, quota gratuit partagé. Votre propre quota : ajoutez votre clé dans « Compte »."} Comptez 30 secondes à 2 minutes. Vous vérifiez ensuite tout en bac à sable avant de publier.</p>`;
  const go=`<div class="err" id="gen-err"></div><button class="btn primary big" type="submit" ${iaBusy?"disabled":""}>${iaBusy?"L'IA prépare votre carnet…":"✨ Créer l'ébauche avec l'IA"}</button>${iaBusy?`<button type="button" class="btn ghost small" data-act="iaStop" style="margin-top:6px">✕ Annuler</button><p class="hint" style="margin:4px 0 0">Cela peut prendre 1 à 3 minutes (4 minutes au plus).</p>`:""}`;
  if(mode==="photo")return`<form class="stack" id="gen-form" data-mode="photo" style="gap:10px">
    <label class="f">Votre fiche (photo prise avec le téléphone, image ou PDF)<input type="file" id="gen-fiche" accept="application/pdf,image/*"></label>
    <label class="f">Précisions (facultatif)<textarea id="gen-cons" placeholder="ex. C'est un camarade qui remplit la fiche · Ajoute un chrono pour le gainage"></textarea></label>
    <details><summary class="hint">Ajouter aussi le référentiel pour la correction (facultatif)</summary><input type="file" id="gen-file" accept="application/pdf,image/*"></details>${go}${ft}</form>`;
  if(mode==="fidele")return`<form class="stack" id="gen-form" data-mode="fidele" style="gap:10px">
    <p class="hint" style="margin:0">L'IA redessine votre fiche à l'identique (tableaux, couleurs, intitulés) et rend chaque case cliquable. Elle ajoute seulement le pseudo de l'élève et le choix d'un coach : le coach remplit la fiche depuis son téléphone. Elle compte dans la note comme un carnet (critères, votre correction, note de juge).</p>
    <label class="f">Votre fiche d'observation (photo, image ou PDF d'une page)<input type="file" id="gen-fiche" accept="application/pdf,image/*"></label>
    <label class="f">Précisions (facultatif)<textarea id="gen-cons" placeholder="ex. Une fiche par séance · Le total des réussites compte pour l'AFL1 · L'élève remplit lui-même son ressenti"></textarea></label>${go}${ft}</form>`;
  if(mode==="phrase")return`<form class="stack" id="gen-form" data-mode="phrase" style="gap:10px">
    <label class="f">Décrivez le carnet en une ou deux phrases<textarea id="gen-cons" rows="3" placeholder="ex. Fiche d'observation du smash en badminton, remplie par un camarade, avec le nombre de smashs réussis et 3 critères techniques"></textarea></label>${go}${ft}</form>`;
  return`<form class="stack" id="gen-form" data-mode="ref" style="gap:10px">
    <label class="f">1. Référentiel d'évaluation (PDF ou photo)<input type="file" id="gen-file" accept="application/pdf,image/*"></label>
    <label class="f">2. Fiche d'observation / d'évaluation (facultatif)<input type="file" id="gen-fiche" accept="application/pdf,image/*"></label>
    <details><summary class="hint">Pas de fichier ? Coller le texte du référentiel</summary><textarea id="gen-text" placeholder="Texte du référentiel"></textarea></details>
    <label class="f">Vos consignes (facultatif)<textarea id="gen-cons" placeholder="ex. Feuille de poule pour 4 équipes · Carnet de construction de l'enchaînement sur tout le cycle, en groupe"></textarea></label>${go}${ft}</form>`}
async function saveDossier(patch){Object.assign(dossier,patch);try{await fb.updateDossier(dossier.id,patch)}catch(e){toast(authMsg(e))}}
async function dosItems(items){dossier.items=items;await saveDossier({items})}
async function dosAddCarnet(id){if(!dossierCtx)return;const d=await fb.getDossier(dossierCtx.id);if(!d)return;if((d.items||[]).some(x=>x.id===id))return;
  dossier=d;await dosItems([...(d.items||[]),{t:"carnet",id}])}
async function toggleDossierClasse(cid,on){const c=classes.find(x=>x.id===cid);if(!c)return;const ds=new Set(c.dossiers||[]);on?ds.add(dossier.id):ds.delete(dossier.id);
  try{await fb.updateClasse(cid,{dossiers:[...ds]});c.dossiers=[...ds];toast(on?`Activité visible pour ${c.nom}`:`Activité retirée pour ${c.nom}`)}catch(e){toast(authMsg(e))}}
async function loadClasseActs(cl){const ds=await loadClasseDossiers(cl);if(!ds)return null;
  const all=await Promise.all(ds.map(d=>itemsOf(d,me.uid)));return ds.map((d,k)=>{const its=all[k];return{d,all:its,carnets:its.filter(x=>x.t==="carnet"),outils:its.filter(x=>x.t==="outil")}})}


/* ====================================================================
   Stock : activités partagées entre profs (carnets + fiches + principe d'évaluation)
   ==================================================================== */
let stockList=[],stockDos=null,stockOpen=null,stockBusy="",shareOpen=false;
const actKeyOf=t=>norm(String(t||"")).replace(/[^a-z0-9]+/g," ").trim()||"activite";
async function openStock(){RETRY=()=>openStock();go("loading",{msg:"Ouverture du stock…"});try{stockList=[...STOCK_INT,...await fb.listStock()];stockDos=null;stockOpen=null;go("stock")}catch(e){go("error",{msg:authMsg(e)})}}
function stockFolders(){const m=new Map();stockList.forEach(e=>{const k=e.cle||actKeyOf(e.titre);if(!m.has(k))m.set(k,{cle:k,titre:e.titre,ca:e.ca,items:[]});m.get(k).items.push(e)});
  return[...m.values()].sort((a,b)=>a.titre.localeCompare(b.titre,"fr"))}
function vStockEntry(e){const open=stockOpen===e.id;
  return`<section class="card stack" style="gap:8px"><div class="sec-h"><span class="di-ic">📁</span><h3 style="flex:1;min-width:0">${esc(e.signature||"Collègue")}</h3>${e.auteurId===me.uid?'<span class="chip">Vous</span>':""}${e.integre?'<span class="chip">Prêt à l\'emploi</span>':""}<span class="chip">${esc(e.ca||"")}</span></div>
    <div class="principe"><strong>Principe d'évaluation</strong><p style="margin:4px 0 0;white-space:pre-wrap">${esc(e.principe)}</p></div>
    <div class="docs">${(e.carnets||[]).map(c=>`<div class="doc-item carnet" style="cursor:default"><span class="di-ic">📒</span><span class="di-t"><strong>${esc(c.titre)}</strong><span class="hint">${(c.modele.sections||[]).length} parties · ${(c.modele.criteres||[]).length} critères · ${esc(PAGES_FR[c.modele.pages]||"")}${c.modele.partage&&c.modele.partage!=="aucun"?" · "+esc(c.modele.partage==="groupe"?"en groupe":"avec un coach"):""}</span></span></div>`).join("")}
      ${(e.outils||[]).map(o=>`<div class="doc-item outil" style="cursor:default"><span class="di-ic">${(OUTILS[o.kind]||{}).ic||"🧰"}</span><span class="di-t"><strong>${esc(o.titre)}</strong><span class="hint">${o.kind==="co"?`Outil · formats : ${esc(((o.cfg&&o.cfg.formats)||[]).map(f=>f.nom).join(", "))} · réponses : ${esc(((o.cfg&&o.cfg.reponses)||[]).join(" / ")||"code libre")}`:"Outil"}</span></span></div>`).join("")}
      ${(e.fiches||[]).map(f=>`<div class="fiche${open&&ficheOpen===f.id?" open":""}"><div class="fiche-h"><button class="fiche-t" data-act="stockFiche" data-e="${e.id}" data-id="${f.id}"><span class="fi-ic">${ficheIcon(f)}</span><span><strong>${esc(f.titre)}</strong></span><span class="spacer"></span><span class="chip">${open&&ficheOpen===f.id?"Fermer":"Voir"}</span></button></div>${open&&ficheOpen===f.id?`<div class="fiche-b">${vFicheViewer(f)}</div>`:""}</div>`).join("")}</div>
    <div class="row"><button class="btn primary" data-act="stockImport" data-id="${e.id}" ${stockBusy?"disabled":""}>${stockBusy===e.id?"Import en cours…":"⬇️ Importer dans mes activités"}</button>${e.auteurId===me.uid?`<button class="btn ghost small danger" data-act="stockDel" data-id="${e.id}">Retirer du stock</button>`:""}</div></section>`}
function vStock(){const F=stockFolders();
  if(stockDos){const f=F.find(x=>x.cle===stockDos);if(!f){stockDos=null;return vStock()}
    return`<div class="stack"><div class="row"><button class="btn ghost small" data-act="stockBack">← Stock</button></div>
    <section class="class-hero"><span class="eyebrow">${esc(f.ca||"")} · ${f.items.length} partage${f.items.length>1?"s":""}</span><h2>📂 ${esc(f.titre)}</h2></section>
    <p class="hint" style="margin:0">${f.items.length>1?"Chaque sous-dossier est la proposition d'un collègue, avec son principe d'évaluation.":"Proposition d'un collègue."} L'import crée une copie dans « Activités » : vous l'adaptez en bac à sable avant de la publier.</p>
    ${f.items.map(vStockEntry).join("")}</div>`}
  return`<div class="stack"><h2>Stock</h2><p class="hint" style="margin:-6px 0 0">Activités partagées par les profs de l'appli : carnets, référentiels et fiches, rangés par activité. Pour partager les vôtres : Activités › une activité › « Partager dans le stock ».</p>
  ${F.length?`<div class="grid-cards">${F.map(f=>`<button class="class-card" data-act="stockDos" data-k="${esc(f.cle)}"><span class="act-ca">${esc(f.ca||"")}</span><span class="cc-n" style="font-size:1.3rem">📂 ${esc(f.titre)}</span><span class="hint">${f.items.length>1?`${f.items.length} sous-dossiers`:"1 partage"}</span></button>`).join("")}</div>`:`<div class="card"><p style="margin:0">Le stock est vide pour l'instant.</p></div>`}</div>`}
function vShareBox(){const d=dossier,its=dossierItems,sh=d.stockId;
  if(!shareOpen)return`<section class="card"><div class="row"><div style="flex:1;min-width:200px"><strong>${sh?"✅ Activité partagée dans le stock":"Partager dans le stock"}</strong><div class="hint">${sh?"Vos collègues peuvent l'importer. Vous pouvez mettre le partage à jour ou le retirer.":"Proposez vos carnets et votre référentiel aux autres profs de l'appli. Vous choisissez ce que vous partagez."}</div></div><button class="btn" data-act="shareToggle">${sh?"Gérer le partage":"Partager…"}</button></div></section>`;
  return`<section class="card stack" style="gap:10px" id="share-box"><h3>Partager dans le stock</h3>
    <p class="hint" style="margin:0">Le partage sera rangé dans le dossier « ${esc(d.titre)} » du stock (sous-dossier à votre nom s'il y a déjà d'autres partages). Aucune donnée d'élève n'est partagée.</p>
    <div class="f"><span class="mlab">Ce que vous acceptez de partager</span><div class="mchecks">${its.map(x=>`<label><input type="checkbox" class="sh-it" value="${x.id}" ${x.t==="carnet"&&!(x.pub||x.id===CA5_ID)?"disabled":"checked"}> ${x.t==="carnet"?"📒":x.t==="outil"?(OUTILS[x.kind]||{}).ic||"🧰":ficheIcon(x.f)} ${esc(x.titre)}${x.t==="carnet"&&!(x.pub||x.id===CA5_ID)?' <span class="hint">(pas encore publié)</span>':""}</label>`).join("")||'<span class="hint">Le dossier est vide.</span>'}</div></div>
    <label class="f">Votre principe d'évaluation (obligatoire, quelques lignes)<textarea id="sh-principe" rows="4" placeholder="ex. AFL1 noté sur l'enchaînement final (difficulté des figures et exécution), AFL2 sur la construction de la séquence dans le carnet de groupe, AFL3 sur les rôles de juge et de pareur.">${esc(d.principe||"")}</textarea></label>
    <label class="f">Signature (facultatif)<input id="sh-sign" maxlength="60" value="${esc(d.signature||"")}" placeholder="ex. Robin, lycée de Verdun"></label>
    <div class="err" id="sh-err"></div>
    <div class="row"><button class="btn primary" data-act="shareGo" ${stockBusy?"disabled":""}>${stockBusy==="share"?"Partage en cours…":sh?"Mettre à jour le partage":"Partager"}</button>${sh?'<button class="btn danger small" data-act="shareDel">Retirer du stock</button>':""}<button class="btn ghost small" data-act="shareToggle">Fermer</button></div></section>`}
async function copyFiche(f,meta){const parts=f.type==="texte"?[]:(await fb.getFicheParts(f.id)).map(p=>({mime:p.mime,data:p.data}));return fb.addFiche({profId:me.uid,titre:f.titre,type:f.type,texte:f.texte||"",...meta},parts)}
async function retirerStock(e){for(const f of e.fiches||[])await fb.deleteFiche(f.id,f.nb).catch(()=>{});await fb.deleteStock(e.id)}
async function partager(){const err=$("#sh-err"),principe=$("#sh-principe").value.trim(),signature=$("#sh-sign").value.trim().slice(0,60);err.textContent="";
  const ids=[...document.querySelectorAll(".sh-it:checked")].map(x=>x.value),sel=dossierItems.filter(x=>ids.includes(x.id));
  if(principe.length<30){err.textContent="Décrivez votre principe d'évaluation en quelques lignes.";return}
  if(!sel.length){err.textContent="Cochez au moins un carnet ou une fiche.";return}
  stockBusy="share";rerenderKeep();
  try{const carnets=sel.filter(x=>x.t==="carnet").map(x=>({titre:x.titre,modele:normModele(x.id===CA5_ID?x.M:(x.doc.modele||x.doc.brouillon))}));
    const fiches=[];for(const x of sel.filter(x=>x.t==="fiche")){const id=await copyFiche(x.f,{activite:"stock"});fiches.push({id,titre:x.f.titre,type:x.f.type,nb:x.f.nb||0,texte:x.f.texte||""})}
    const outils=[];for(const x of sel.filter(x=>x.t==="outil")){let cfg=x.cfg||null;if(x.kind==="co"){const n=normCo(await fb.getOrient(x.id).catch(()=>null)||CO_DEF);cfg={reponses:n.reponses,formats:n.formats}}outils.push({kind:x.kind,titre:x.titre,cfg})}
    const doc={auteurId:me.uid,titre:dossier.titre,cle:actKeyOf(dossier.titre),ca:dossier.ca||"",principe:principe.slice(0,1500),signature,carnets,fiches,outils,maj:new Date().toISOString()};
    let sid=dossier.stockId;if(sid){const old=await fb.getStock(sid).catch(()=>null);if(old&&old.auteurId===me.uid){for(const f of old.fiches||[])await fb.deleteFiche(f.id,f.nb).catch(()=>{});await fb.setStock(sid,doc)}else sid=null}
    if(!sid)sid=await fb.createStock(doc);
    await saveDossier({stockId:sid,principe,signature});stockBusy="";shareOpen=false;toast("Activité partagée dans le stock");rerenderKeep()}
  catch(e){console.error(e);stockBusy="";rerenderKeep();const el=$("#sh-err");if(el)el.textContent=authMsg(e)}}
async function importer(e){stockBusy=e.id;rerenderKeep();
  try{const id=await fb.createDossier({profId:me.uid,titre:e.titre,ca:e.ca||"",desc:"",items:[],principe:e.principe});const items=[];
    for(const c of e.carnets||[]){const M=normModele(c.modele);const mid=await fb.createModele({profId:me.uid,titre:M.titre,ca:M.ca,brouillon:M,modele:null,statut:"brouillon"});items.push({t:"carnet",id:mid})}
    for(const f of e.fiches||[]){const fid=await copyFiche(f,{activite:id});items.push({t:"fiche",id:fid})}
    for(const o of e.outils||[]){if(!OUTILS[o.kind])continue;const oid="o_"+Math.random().toString(36).slice(2,9);if(o.kind==="co")await fb.setOrient(oid,{profId:me.uid,...normCo({...(o.cfg||{}),cartons:[],corr:{}})});items.push({t:"outil",id:oid,kind:o.kind,titre:o.titre||OUTILS[o.kind].nom,...(o.kind==="co"?{}:{cfg:o.cfg||CFG_DEF})})}
    await fb.updateDossier(id,{items});stockBusy="";toast("Activité importée : adaptez les carnets puis publiez-les");openDossierEd(id)}
  catch(x){console.error(x);stockBusy="";rerenderKeep();toast(authMsg(x))}}


/* ====================================================================
   Outils : feuille de match (poules, rotations, terrains) et scoreur
   ==================================================================== */
const OUTILS={feuille:{ic:"🏆",nom:"Feuille de match"},scoreur:{ic:"⏱️",nom:"Scoreur"}};
const CFG_DEF={bonus:[{label:"Bonus",val:3}],duree:0,terrains:2};
const normCfg=c=>{c=c||{};const b=(Array.isArray(c.bonus)?c.bonus:CFG_DEF.bonus).slice(0,3).map(x=>({label:String(x&&x.label||"Bonus").slice(0,14),val:Math.max(1,Math.min(20,parseInt(x&&x.val)||1))}));
  return{bonus:b,bonusMode:c.bonusMode==="eval"?"eval":"score",duree:Math.max(0,Math.min(60,parseFloat(c.duree)||0)),terrains:Math.max(1,Math.min(4,parseInt(c.terrains)||2))}};
const cfgFor=(item,cls,sess)=>normCfg(sess&&sess.reglages||(cls&&cls.outilsCfg&&cls.outilsCfg[item.id])||item.cfg||CFG_DEF);
let OP=null,FE=null,matchUnsub=null,pseudoCache={};
/* --- Pseudos --- */
const nomDe=(uid,noms)=>{const n=(noms||{})[uid]||{};return pseudoCache[uid]||n.pseudo||n.login||"?"};
async function chargerPseudos(noms){await Promise.all(Object.entries(noms||{}).map(async([uid,n])=>{if(pseudoCache[uid])return;try{const l=await fb.getLogin(n.login);if(l&&l.pseudo)pseudoCache[uid]=l.pseudo}catch(e){}}))}
function vPseudoCard(){const p=me.pseudo||"";
  return`<section class="card"><div class="row" style="align-items:end"><label class="f" style="flex:1;min-width:170px">Mon pseudo ${p?"":'<span class="chip" style="margin-left:4px">à choisir</span>'}<input id="ps-in" maxlength="20" value="${esc(p)}" placeholder="ex. Smash57" autocomplete="off"></label><button class="btn" data-act="psSave">Enregistrer</button></div>
    <p class="hint" style="margin:6px 0 0">Il s'affiche sur les feuilles de match. N'écris pas ton vrai nom.</p><div class="err" id="ps-err"></div></section>`}
async function savePseudo(){if(apercuBloque())return;const v=$("#ps-in").value.trim().replace(/\s+/g," "),err=$("#ps-err");err.textContent="";
  if(v.length<2){err.textContent="2 caractères minimum.";return}
  try{await fb.updateLogin(me.login,{pseudo:v.slice(0,20)});me.pseudo=v.slice(0,20);pseudoCache[me.uid]=me.pseudo;toast("Pseudo enregistré");rerenderKeep()}catch(e){err.textContent=authMsg(e)}}
/* --- Tournoi : rencontres de chaque poule réparties en rotations sur les terrains --- */
function rrRounds(ids){const p=[...ids];if(p.length%2)p.push(null);const n=p.length,R=[];
  for(let r=0;r<n-1;r++){const m=[];for(let i=0;i<n/2;i++){const a=p[i],b=p[n-1-i];if(a&&b)m.push(r%2?[b,a]:[a,b])}R.push(m);p.splice(1,0,p.pop())}return R}
function planning(ids,T){const out=[];let rot=0;rrRounds(ids).forEach(m=>{for(let i=0;i<m.length;i+=T){rot++;m.slice(i,i+T).forEach((x,k)=>out.push({rot,ter:k+1,a:x[0],b:x[1]}))}});return out}
const mKey=(pi,a,b)=>`p${pi}_${[a,b].sort().join("_")}`;
function scoresOf(M,pi,a,b){const d=M[mKey(pi,a,b)];if(!d||d.sa==null||d.sb==null)return null;return d.a===a?{sa:d.sa,sb:d.sb,d}:{sa:d.sb,sb:d.sa,d}}
function classement(ids,pi,M){const t={};ids.forEach(u=>t[u]={u,j:0,v:0,n:0,d:0,pm:0,pe:0,bo:0});
  for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){const a=ids[i],b=ids[j],s=scoresOf(M,pi,a,b);if(!s)continue;
    const A=t[a],B=t[b],dt=s.d.detail||{},sum=o=>Object.values(o||{}).reduce((x,y)=>x+(+y||0),0);A.bo+=sum(s.d.a===a?dt.ba:dt.bb);B.bo+=sum(s.d.a===a?dt.bb:dt.ba);A.j++;B.j++;A.pm+=s.sa;A.pe+=s.sb;B.pm+=s.sb;B.pe+=s.sa;if(s.sa>s.sb){A.v++;B.d++}else if(s.sa<s.sb){B.v++;A.d++}else{A.n++;B.n++}}
  return Object.values(t).sort((x,y)=>y.v-x.v||y.n-x.n||(y.pm-y.pe)-(x.pm-x.pe)||y.pm-x.pm)}
function vFeuille(S,M,edit){const myPi=S.poules.findIndex(p=>p.joueurs.includes(me.uid)),order=S.poules.map((p,i)=>i).sort((a,b)=>(b===myPi)-(a===myPi));
  return order.map(pi=>{const P=S.poules[pi],T=Math.max(1,Math.min(4,parseInt((M["cfg_"+pi]||{}).terrains)||cfgFor({},null,S).terrains)),pl=planning(P.joueurs,T),cl=classement(P.joueurs,pi,M),mine=pi===myPi;
    const nb=pl.length,faits=pl.filter(x=>scoresOf(M,pi,x.a,x.b)).length;let rot=0;
    const rows=pl.map(x=>{const s=scoresOf(M,pi,x.a,x.b),k=mKey(pi,x.a,x.b),head=x.rot!==rot?(rot=x.rot,`<div class="rot-h">Rotation ${x.rot}</div>`):"";const me2=x.a===me.uid||x.b===me.uid;
      return`${head}<div class="mrow${me2?" me":""}${s?" done":""}"><span class="ter">T${x.ter}</span><span class="pa">${esc(nomDe(x.a,S.noms))}</span>
        <input class="sc" inputmode="numeric" aria-label="Score de ${esc(nomDe(x.a,S.noms))}" data-ms="${k}" data-a="${x.a}" data-b="${x.b}" data-side="a" value="${s?s.sa:""}" ${edit?"":"disabled"}><span class="dash">–</span>
        <input class="sc" inputmode="numeric" aria-label="Score de ${esc(nomDe(x.b,S.noms))}" data-ms="${k}" data-a="${x.a}" data-b="${x.b}" data-side="b" value="${s?s.sb:""}" ${edit?"":"disabled"}><span class="pb">${esc(nomDe(x.b,S.noms))}</span>
        ${edit?`<button class="btn small arb" data-act="arbitrer" data-pi="${pi}" data-a="${x.a}" data-b="${x.b}" aria-label="J'arbitre ce match">⚖️ J'arbitre</button>`:""}
        ${s&&s.d.arbitre?`<span class="hint arb-by">arbitré par ${esc(s.d.arbitre)}</span>`:""}</div>`}).join("");
    return`<details class="card poule" ${mine||S.poules.length===1?"open":""}><summary><strong>${esc(P.nom)}</strong>${mine?' <span class="chip">Ma poule</span>':""}<span class="spacer"></span><span class="hint">${faits} / ${nb} matchs</span></summary>
      <div class="row" style="margin:8px 0"><label class="f" style="max-width:160px">Terrains<select data-ter="${pi}" ${edit?"":"disabled"}>${[1,2,3,4].map(n=>`<option value="${n}" ${n===T?"selected":""}>${n} terrain${n>1?"s":""}</option>`).join("")}</select></label><span class="hint">${P.joueurs.length} joueurs · ${pl.length?pl[pl.length-1].rot:0} rotations</span><span class="spacer"></span><button class="btn ghost small" data-fm="detail" data-pi="${pi}">🔍 Détail de la poule</button></div>
      ${(()=>{const ev=cfgFor({},null,S).bonusMode==="eval"&&cfgFor({},null,S).bonus.length;return`<table class="classt"><thead><tr><th>#</th><th>Joueur</th><th>V</th><th>N</th><th>D</th><th>Diff</th>${ev?"<th>Bonus</th>":""}</tr></thead><tbody>${cl.map((r,i)=>`<tr${r.u===me.uid?' class="me"':""}><td>${i+1}</td><td>${esc(nomDe(r.u,S.noms))}</td><td>${r.v}</td><td>${r.n}</td><td>${r.d}</td><td>${r.pm-r.pe>0?"+":""}${r.pm-r.pe}</td>${ev?`<td>${r.bo}</td>`:""}</tr>`).join("")}</tbody></table>`})()}
      <div class="matchs">${rows}</div></details>`}).join("")}
async function saveScore(el){if(!FE)return;const k=el.dataset.ms,a=el.dataset.a,b=el.dataset.b,row=el.closest(".mrow"),[ia,ib]=row.querySelectorAll("input.sc");
  const va=ia.value.trim(),vb=ib.value.trim();if((va==="")!==(vb==="")&&!(va===""&&vb===""))return;/* attendre les deux scores */
  const pi=parseInt(k.slice(1));const data=va===""?{a,b,pi,sa:null,sb:null,arbitre:null,maj:new Date().toISOString()}:{a,b,pi,sa:Math.max(0,parseInt(va)||0),sb:Math.max(0,parseInt(vb)||0),arbitre:FE.S.id==="local"?"":(me.pseudo||me.login||"prof"),maj:new Date().toISOString()};
  try{await matchSet(FE.S.id,k,data);toast("Score enregistré")}catch(e){toast(authMsg(e))}}
async function openFeuille(sid){RETRY=()=>openFeuille(sid);go("loading",{msg:"Ouverture de la feuille de match…"});
  try{const S=await fb.getSession(sid);if(!S)throw{code:"not-found"};FE={S,M:{}};await chargerPseudos(S.noms);
    if(matchUnsub)matchUnsub();matchUnsub=fb.watchMatchs(sid,list=>{if(!FE||FE.S.id!==sid)return;FE.M=Object.fromEntries(list.map(x=>[x.id,x]));if(["feuille","outilProf"].includes(route.name))rerenderKeep()});go("feuille")}
  catch(e){console.error(e);go("error",{msg:authMsg(e)})}}
function vFeuillePage(){const S=FE.S,cfg=cfgFor({},null,S);
  return`<div class="stack"><div class="row"><button class="btn ghost small" data-act="feuilleBack">← ${me.role==="eleve"?"Activité":"Retour"}</button><span class="spacer"></span><button class="btn small" data-act="scoreLibre">⏱️ Scoreur</button></div>
  <section class="class-hero"><span class="eyebrow">${S.active?"Séance en cours":"Séance terminée"} · ${fmtDate(S.date)}</span><h2>🏆 ${esc(S.titre||"Feuille de match")}</h2>
    <p style="margin:6px 0 0;color:#cfd6dc">${cfg.bonus.length?`Bonus : ${cfg.bonus.map(b=>`${esc(b.label)} ${cfg.bonusMode==="eval"?"(compté pour l'évaluation)":"+"+b.val}`).join(" · ")}`:"Pas de bonus"}${cfg.duree?` · matchs de ${fmtN(cfg.duree)} min`:""}</p></section>
  <p class="hint" style="margin:0">Entre les scores directement, ou touche « ⚖️ J'arbitre » pour compter les points avec le scoreur : le score est reporté ici à la fin du match.</p>
  ${vFeuille(S,FE.M,S.active||me.role!=="eleve")}</div>`}
/* --- Scoreur plein écran --- */
let SC=null,scTimer=null;
function openScoreur(o){SC={A:{nom:o.a||"Équipe A",pts:0,h:[],b:{}},B:{nom:o.b||"Équipe B",pts:0,h:[],b:{}},cfg:normCfg(o.cfg),acc:0,t0:null,ctx:o.ctx||null,libre:!o.ctx,reglable:!!o.reglable,cfgOpen:false};
  let el=$("#scoreur");if(!el){el=document.createElement("div");el.id="scoreur";el.setAttribute("role","dialog");el.setAttribute("aria-modal","true");el.setAttribute("aria-label","Scoreur");document.body.appendChild(el)}
  document.body.classList.add("sc-open");scRender();scTimer=setInterval(scTick,250)}
function closeScoreur(){clearInterval(scTimer);scTimer=null;SC=null;const el=$("#scoreur");if(el)el.remove();document.body.classList.remove("sc-open")}
const scEl=()=>SC.acc+(SC.t0?Date.now()-SC.t0:0);
function scClock(){const ms=scEl(),d=SC.cfg.duree*60000;let t=d?Math.max(0,d-ms):ms;const s=Math.floor(t/1000)+(d&&t%1000?1:0);return`${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`}
function scTick(){if(!SC)return;const c=$("#sc-clock");if(c)c.textContent=scClock();if(SC.cfg.duree&&SC.t0&&scEl()>=SC.cfg.duree*60000){SC.acc=SC.cfg.duree*60000;SC.t0=null;scRender();toast("Temps écoulé !");if(navigator.vibrate)navigator.vibrate([200,100,200])}}
function scSide(k){const T=SC[k],c=k==="A"?"blue":"orange";
  return`<div class="sc-team ${c}"><div class="sc-emb" aria-hidden="true">${esc((T.nom.trim()[0]||"?").toUpperCase())}</div>
    ${SC.libre?`<input class="sc-name" data-scn="${k}" value="${esc(T.nom)}" maxlength="20" aria-label="Nom ${k==="A"?"de la première équipe":"de la deuxième équipe"}">`:`<div class="sc-name">${esc(T.nom)}</div>`}
    <div class="sc-score" aria-live="polite">${T.pts}</div>
    ${SC.cfg.bonusMode==="eval"&&SC.cfg.bonus.length?`<div class="sc-bcount">${SC.cfg.bonus.map(b=>`<span>${esc(b.label)} ×${T.b[b.label]||0}</span>`).join("")}</div>`:""}
    <div class="sc-btns"><button class="sc-pt" data-sc="${k}" data-v="1"><b>+1</b><small>Point</small></button>${SC.cfg.bonus.map(b=>`<button data-sc="${k}" data-v="${b.val}" data-l="${esc(b.label)}" data-bonus="1"><b>+${b.val}</b><small>${esc(b.label)}</small></button>`).join("")}</div>
    <button class="sc-undo" data-scu="${k}" ${T.h.length?"":"disabled"}>↶ Annuler (${T.h.length?(T.h[T.h.length-1].bonus?T.h[T.h.length-1].l:"+"+T.h[T.h.length-1].v):"–"})</button></div>`}
function scRender(){const el=$("#scoreur");if(!el||!SC)return;
  if(SC.cfgOpen){el.innerHTML=`<div class="sc-top"><button class="sc-round" data-scx="cfgDone" aria-label="Retour au scoreur">‹</button><h2>Scoreur</h2><span style="width:44px"></span></div>${scCfgPanel()}`;return}
  el.innerHTML=`<div class="sc-top"><button class="sc-round" data-scx="close" aria-label="Fermer le scoreur">‹</button><h2>Scoreur</h2>${SC.reglable?`<button class="sc-round" data-scx="cfg" aria-label="Réglages du scoreur">⚙</button>`:'<span style="width:44px"></span>'}</div>
  <div class="sc-vs">${scSide("A")}<div class="sc-v" aria-hidden="true">VS</div>${scSide("B")}</div>
  <div class="sc-clock-bar"><span aria-hidden="true">⏱️</span><span id="sc-clock">${scClock()}</span><button class="sc-round" data-scx="play" aria-label="${SC.t0?"Pause":"Démarrer le chrono"}">${SC.t0?"❚❚":"▶"}</button></div>
  <div class="sc-actions"><button class="sc-reset" data-scx="reset">↻ Réinitialiser</button>${SC.ctx?`<button class="sc-valid" data-scx="valid">✅ Valider le score</button>`:""}</div>`}
function scClick(e){const b=e.target.closest("button");if(!b||!SC)return;
  if(b.dataset.sc){const T=SC[b.dataset.sc],v=parseInt(b.dataset.v)||1,l=b.dataset.l||"Point";
    if(b.dataset.bonus&&SC.cfg.bonusMode==="eval"){T.b[l]=(T.b[l]||0)+1;T.h.push({v:0,l,bonus:true})}else if(b.dataset.bonus){T.pts+=v;T.b[l]=(T.b[l]||0)+1;T.h.push({v,l,bonus2:true})}else{T.pts+=v;T.h.push({v,l})}if(navigator.vibrate)navigator.vibrate(15);scRender();return}
  if(b.dataset.scu){const T=SC[b.dataset.scu],x=T.h.pop();if(x){if(x.bonus)T.b[x.l]=Math.max(0,(T.b[x.l]||0)-1);else{T.pts-=x.v;if(x.bonus2)T.b[x.l]=Math.max(0,(T.b[x.l]||0)-1)}}scRender();return}
  const x=b.dataset.scx;
  if(x==="cfg"){SC.cfgOpen=true;scRender();return}
  if(x==="cfgDone"){SC.cfgOpen=false;scRender();return}
  if(x==="close"){if((SC.A.h.length||SC.B.h.length)&&SC.ctx){confirmBox("Quitter le scoreur ?","Le score n'a pas été validé : il ne sera pas reporté sur la feuille de match.","Quitter",async()=>{closeModal();closeScoreur()},true);return}closeScoreur();return}
  if(x==="play"){if(SC.t0){SC.acc+=Date.now()-SC.t0;SC.t0=null}else{if(SC.cfg.duree&&scEl()>=SC.cfg.duree*60000)SC.acc=0;SC.t0=Date.now()}scRender();return}
  if(x==="reset"){confirmBox("Réinitialiser ?","Les scores et le chrono reviennent à zéro.","Réinitialiser",async()=>{closeModal();SC.A.pts=0;SC.B.pts=0;SC.A.h=[];SC.B.h=[];SC.A.b={};SC.B.b={};SC.acc=0;SC.t0=null;scRender()},true);return}
  if(x==="valid"){const c=SC.ctx;if(c.sid!=="local"&&apercuBloque())return;confirmBox("Valider le score ?",`${esc(SC.A.nom)} ${SC.A.pts} – ${SC.B.pts} ${esc(SC.B.nom)} sera reporté sur la feuille de match.`,"Valider",async()=>{
      try{await matchSet(c.sid,c.key,{a:c.a,b:c.b,pi:c.pi,sa:SC.A.pts,sb:SC.B.pts,arbitre:c.sid==="local"?"":me.pseudo||me.login||"prof",detail:{a:SC.A.h.filter(h=>!h.bonus).map(h=>h.v),b:SC.B.h.filter(h=>!h.bonus).map(h=>h.v),ba:SC.A.b,bb:SC.B.b},maj:new Date().toISOString()});closeModal();closeScoreur();toast("Score reporté sur la feuille de match")}
      catch(y){closeModal();toast(authMsg(y))}});return}}
document.addEventListener("click",e=>{if(e.target.closest("#scoreur"))scClick(e)});
document.addEventListener("change",e=>{const i=e.target.closest("[data-scc]");if(i&&SC){SC.cfg=editCfg(SC.cfg,i.dataset.scc,i.value);lsSet("scoreurCfg",SC.cfg);scRender()}});
document.addEventListener("input",e=>{const i=e.target.closest("[data-scn]");if(i&&SC){SC[i.dataset.scn].nom=i.value;const em=i.parentElement.querySelector(".sc-emb");if(em)em.textContent=(i.value.trim()[0]||"?").toUpperCase()}});
/* --- Prof : réglages et séances d'un outil pour une classe --- */
async function openOutilProf(cid,did,oid){RETRY=()=>openOutilProf(cid,did,oid);go("loading",{msg:"Chargement…"});
  try{const cls=await fb.getClasse(cid),d=await fb.getDossier(did),item=(d.items||[]).find(x=>x.id===oid);if(!item)throw{code:"not-found"};
    if(item.kind==="co"){await openCoProf(cls,d,item);return}
    const [sessions,eleves]=await Promise.all([fb.listSessions(me.uid,cid,oid),fb.listEleves(cid)]);eleves.sort((a,b)=>a.numero-b.numero);
    await Promise.all(eleves.map(async e=>{try{const l=await fb.getLogin(e.login);if(l&&l.pseudo)pseudoCache[e.id]=l.pseudo}catch(x){}}));
    sessions.sort((a,b)=>String(b.date).localeCompare(String(a.date)));const act=sessions.find(s=>s.active);
    OP={cls,d,item,sessions,eleves,cfgCls:normCfg(cls.outilsCfg&&cls.outilsCfg[oid]||item.cfg),draft:null};
    if(act){await openFeuilleProf(act)}else{OP.draft=newDraft();FE=null;if(matchUnsub){matchUnsub();matchUnsub=null}go("outilProf")}}
  catch(e){console.error(e);go("error",{msg:authMsg(e)})}}
function newDraft(){const n=OP.eleves.length,k=OP.item.kind==="feuille"?Math.max(1,Math.round(n/5)):0;return{date:today(),reglages:clone(OP.cfgCls),nbP:k,aff:{}}}
async function openFeuilleProf(S){RETRY=()=>openFeuilleProf(S);FE={S,M:{}};await chargerPseudos(S.noms);if(matchUnsub)matchUnsub();matchUnsub=fb.watchMatchs(S.id,list=>{if(!FE||FE.S.id!==S.id)return;FE.M=Object.fromEntries(list.map(x=>[x.id,x]));if(route.name==="outilProf")rerenderKeep()});go("outilProf")}
function vCfgEd(c,pre){return`<div class="grid2"><label class="f">Nombre de bonus<select data-cfg="${pre}" data-k2="nb">${[0,1,2,3].map(n=>`<option value="${n}" ${c.bonus.length===n?"selected":""}>${n}</option>`).join("")}</select></label>
    <label class="f">Durée d'un match (min, 0 = chrono libre)<input data-cfg="${pre}" data-k2="duree" inputmode="decimal" value="${c.duree||0}"></label></div>
    ${c.bonus.map((b,i)=>`<div class="grid2"><label class="f">Bonus ${i+1} : nom<input data-cfg="${pre}" data-k2="bl${i}" maxlength="14" value="${esc(b.label)}"></label><label class="f">Valeur (points)<input data-cfg="${pre}" data-k2="bv${i}" inputmode="numeric" value="${b.val}"></label></div>`).join("")}
    ${c.bonus.length?`<label class="f">Les bonus<select data-cfg="${pre}" data-k2="mode"><option value="score" ${c.bonusMode!=="eval"?"selected":""}>comptent dans le score du match</option><option value="eval" ${c.bonusMode==="eval"?"selected":""}>servent seulement à l'évaluation (ne changent pas le résultat)</option></select></label>`:""}
    ${OP.item.kind==="feuille"?`<label class="f" style="max-width:220px">Terrains par poule au départ<select data-cfg="${pre}" data-k2="terrains">${[1,2,3,4].map(n=>`<option value="${n}" ${c.terrains===n?"selected":""}>${n}</option>`).join("")}</select></label>`:""}`}
function editCfg(c,k,v){if(k==="nb"){const n=parseInt(v)||0;while(c.bonus.length<n)c.bonus.push({label:"Bonus",val:c.bonus.length?c.bonus[c.bonus.length-1].val+1:3});c.bonus.length=n}
  else if(k==="mode")c.bonusMode=v==="eval"?"eval":"score";
  else if(k==="duree")c.duree=Math.max(0,parseFloat(String(v).replace(",","."))||0);else if(k==="terrains")c.terrains=parseInt(v)||2;
  else if(k[1]==="l")c.bonus[+k.slice(2)].label=String(v).slice(0,14)||"Bonus";else if(k[1]==="v")c.bonus[+k.slice(2)].val=Math.max(1,parseInt(v)||1);return normCfg(c)}
function poulesOf(dr){const P=Array.from({length:dr.nbP},(_,i)=>({nom:`Poule ${i+1}`,joueurs:[]}));OP.eleves.forEach(e=>{const p=dr.aff[e.id];if(p>=1&&p<=dr.nbP)P[p-1].joueurs.push(e.id)});return P}
function vOutilProf(){const it=OP.item,O=OUTILS[it.kind],S=FE&&FE.S,dr=OP.draft;
  const hist=OP.sessions.filter(s=>!s.active&&!s.prep);
  let body="";
  if(S){body=`<section class="card stack" style="gap:10px"><div class="sec-h"><h3>${S.active?"🟢 Séance ouverte aux élèves":"Séance du "+fmtDate(S.date)}</h3><span class="spacer"></span>${S.active?`<button class="btn danger small" data-act="opClose">Clôturer la séance</button>`:`<button class="btn small" data-act="opReopen">Rouvrir</button>`}</div>
      <p class="hint" style="margin:0">Réglages de cette séance : ils s'appliquent tout de suite sur les téléphones des élèves.</p>${vCfgEd(cfgFor(it,null,S),"sess")}</section>
      ${it.kind==="feuille"&&!S.active?vResumePoules(S,FE.M):""}
      ${it.kind==="feuille"?vFeuille(S,FE.M,true):`<section class="card"><p style="margin:0">Les élèves ouvrent le scoreur depuis l'activité avec ces réglages.</p><button class="btn" data-act="scoreLibre" style="margin-top:8px">⏱️ Tester le scoreur</button></section>`}
      <button class="btn ghost small" data-act="opNew">+ Préparer une nouvelle séance</button>${vPrepList()}`}
  else{const P=it.kind==="feuille"?poulesOf(dr):[],bad=P.filter(p=>p.joueurs.length<3||p.joueurs.length>8);
    body=`<section class="card stack" style="gap:10px"><h3>Préparer la séance</h3><label class="f" style="max-width:200px">Date<input type="date" id="op-date" value="${dr.date}"></label>${vCfgEd(dr.reglages,"draft")}</section>
    ${it.kind==="feuille"?`<section class="card stack" style="gap:10px"><div class="sec-h"><h3>Poules</h3><span class="spacer"></span><span class="hint">3 à 8 joueurs par poule</span></div>
      <div class="row" style="align-items:end"><label class="f" style="max-width:160px">Nombre de poules<input id="op-nbp" inputmode="numeric" value="${dr.nbP}"></label><button class="btn small" data-act="opAuto">Répartir automatiquement</button><button class="btn ghost small" data-act="opMix">Mélanger</button></div>
      <div class="pchips">${P.map(p=>`<span class="chip${p.joueurs.length<3||p.joueurs.length>8?" ko":""}">${esc(p.nom)} : ${p.joueurs.length}</span>`).join("")}<span class="chip">Sans poule : ${OP.eleves.filter(e=>!(dr.aff[e.id]>=1&&dr.aff[e.id]<=dr.nbP)).length}</span></div>
      ${vPoulesEdit(P)}
      ${bad.length?`<p class="err" style="margin:0">${bad.map(p=>esc(p.nom)).join(", ")} : il faut entre 3 et 8 joueurs.</p>`:""}</section>`:""}
    ${dr.prepId?`<p class="hint" style="margin:0">✏️ Vous modifiez une séance préparée.</p>`:""}<div class="grid2"><button class="btn big" data-fm="savePrep">💾 Enregistrer pour plus tard</button><button class="btn primary big" data-act="opOpen" ${it.kind==="feuille"&&(bad.length||!P.length)?"disabled":""}>Ouvrir la séance aux élèves</button></div>${vPrepList()}`}
  return`<div class="stack"><div class="row"><button class="btn ghost small" data-act="opBack">← ${esc(OP.cls.nom)}</button></div>
  <section class="class-hero"><span class="eyebrow">${esc(OP.d.titre)} · ${esc(OP.cls.nom)}</span><h2>${O.ic} ${esc(it.titre||O.nom)}</h2></section>
  <details class="card"><summary><strong>Réglages de la classe</strong> <span class="hint">· par défaut pour chaque nouvelle séance</span></summary><div class="stack" style="gap:10px;margin-top:10px">${vCfgEd(OP.cfgCls,"cls")}<button class="btn small" data-act="opSaveCls" style="justify-self:start">Enregistrer pour la classe</button></div></details>
  ${body}
  ${hist.length?`<section class="card"><div class="sec-h"><h3>Séances précédentes</h3></div><div class="list-s">${hist.map(s=>`<button class="s-item" data-act="opHist" data-id="${s.id}"><div><strong>${fmtDate(s.date)}</strong><div class="hint">${(s.poules||[]).length} poule(s)</div></div><span class="chip">Voir →</span></button>`).join("")}</div></section>`:""}</div>`}
function opAuto(mix){const dr=OP.draft,n=OP.eleves.length;let k=Math.max(1,Math.min(Math.floor(n/3)||1,parseInt($("#op-nbp")&&$("#op-nbp").value)||dr.nbP||1));
  if(Math.ceil(n/k)>8)k=Math.ceil(n/8);dr.nbP=k;const L=[...OP.eleves];if(mix)for(let i=L.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[L[i],L[j]]=[L[j],L[i]]}
  dr.aff={};L.forEach((e,i)=>dr.aff[e.id]=(i%k)+1);rerenderKeep()}
async function opOpen(){const it=OP.item,dr=OP.draft;dr.date=($("#op-date")||{value:dr.date}).value||today();
  const poules=it.kind==="feuille"?poulesOf(dr):[];if(poules.some(p=>p.joueurs.length<3||p.joueurs.length>8))return;
  const noms={};OP.eleves.forEach(e=>{if(poules.some(p=>p.joueurs.includes(e.id)))noms[e.id]={login:e.login,pseudo:pseudoCache[e.id]||""}});
  try{for(const s of OP.sessions.filter(s=>s.active)){await fb.updateSession(s.id,{active:false});s.active=false}
    const S={profId:me.uid,classeId:OP.cls.id,dossierId:OP.d.id,outilId:it.id,kind:it.kind,titre:it.titre||OUTILS[it.kind].nom,date:dr.date,active:true,prep:false,reglages:normCfg(dr.reglages),poules,noms};
    if(dr.prepId){await fb.updateSession(dr.prepId,S);S.id=dr.prepId;OP.sessions=OP.sessions.filter(x=>x.id!==S.id)}else S.id=await fb.createSession(S);OP.sessions.unshift(S);toast("Séance ouverte : les élèves y ont accès");openFeuilleProf(S)}catch(e){toast(authMsg(e))}}
function feuilleCfgChange(pre,k,v){if(pre==="draft"){OP.draft.reglages=editCfg(OP.draft.reglages,k,v);rerenderKeep();return}
  if(pre==="cls"){OP.cfgCls=editCfg(OP.cfgCls,k,v);rerenderKeep();return}
  if(pre==="sess"&&FE){const c=editCfg(cfgFor(OP.item,null,FE.S),k,v);FE.S.reglages=c;fb.updateSession(FE.S.id,{reglages:c}).then(()=>toast("Réglage appliqué à la séance")).catch(x=>toast(authMsg(x)));rerenderKeep()}}
async function ouvrirOutilEleve(x){if(x.kind==="co"){openCo(x);return}
  const sess=(eleveSessions||[]).find(s=>s.outilId===x.id&&s.active);
  if(x.kind==="feuille"){if(!sess){toast("Pas de séance ouverte pour la feuille de match");return}openFeuille(sess.id);return}
  openScoreur({cfg:cfgFor(x,eleveClasse,sess)})}
let eleveSessions=[],eleveClasse=null;


/* ---------- Outils généraux : scoreur et feuille de match libres, réglés par l'élève ---------- */
const lsGet=(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k)||"null");return v==null?d:v}catch(e){return d}};
const lsSet=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
function vOutilsGeneraux(){return`<section class="card"><div class="sec-h"><h3>🧰 Outils</h3><span class="hint">Pour toutes tes activités</span></div>
  <div class="tools-g"><button class="doc-item outil" data-act="toolScoreur"><span class="di-ic">⏱️</span><span class="di-t"><strong>Scoreur</strong><span class="hint">Points, bonus, chrono</span></span></button>
  <button class="doc-item outil" data-act="toolFeuille"><span class="di-ic">🏆</span><span class="di-t"><strong>Feuille de match</strong><span class="hint">3 à 8 joueurs, 1 à 4 terrains</span></span></button></div></section>`}
let FL=null;
async function matchSet(sid,key,data){if(sid!=="local"){if(apercuBloque())return;return fb.setMatch(sid,key,data)}
  FL.M[key]={...(FL.M[key]||{}),...data};lsSet("feuilleLocale",FL);if(FE&&FE.local)FE.M=FL.M;if(["feuilleLocale"].includes(route.name))rerenderKeep()}
function openFeuilleLocale(){FL=lsGet("feuilleLocale",null)||{etape:"reglages",joueurs:["","","",""],cfg:normCfg(lsGet("scoreurCfg",CFG_DEF)),M:{}};FL.cfg=normCfg(FL.cfg);FE=null;go("feuilleLocale")}
function flSession(){const ids=FL.joueurs.map((n,i)=>"j"+i);return{id:"local",active:true,date:today(),titre:"Feuille de match",reglages:FL.cfg,poules:[{nom:"Mon tournoi",joueurs:ids}],noms:Object.fromEntries(FL.joueurs.map((n,i)=>["j"+i,{login:n.trim()||`Joueur ${i+1}`}]))}}
function vCfgLibre(c,pre){return`<div class="grid2"><label class="f">Nombre de bonus<select data-${pre}="nb">${[0,1,2,3].map(n=>`<option value="${n}" ${c.bonus.length===n?"selected":""}>${n}</option>`).join("")}</select></label>
  <label class="f">Durée d'un match (min, 0 = chrono libre)<input data-${pre}="duree" inputmode="decimal" value="${c.duree||0}"></label></div>
  ${c.bonus.map((b,i)=>`<div class="grid2"><label class="f">Bonus ${i+1} : nom<input data-${pre}="bl${i}" maxlength="14" value="${esc(b.label)}"></label><label class="f">Valeur (points)<input data-${pre}="bv${i}" inputmode="numeric" value="${b.val}"></label></div>`).join("")}
  ${c.bonus.length?`<label class="f">Les bonus<select data-${pre}="mode"><option value="score" ${c.bonusMode!=="eval"?"selected":""}>comptent dans le score du match</option><option value="eval" ${c.bonusMode==="eval"?"selected":""}>sont seulement comptés (évaluation)</option></select></label>`:""}`}
function vFeuilleLocale(){
  if(FL.etape==="reglages")return`<div class="stack"><div class="row"><button class="btn ghost small" data-act="flBack">← Mes activités</button></div>
    <section class="class-hero"><span class="eyebrow">Outil</span><h2>🏆 Feuille de match</h2></section>
    <section class="card stack" style="gap:10px"><h3>Joueurs (3 à 8)</h3>
      ${flHintListe()}${FL.joueurs.map((n,i)=>`<div class="row" style="flex-wrap:nowrap">${flJoueurField(n,i)}${FL.joueurs.length>3?`<button class="btn ghost small danger" data-act="flDel" data-i="${i}" aria-label="Retirer le joueur ${i+1}">✕</button>`:""}</div>`).join("")}
      ${FL.joueurs.length<8?`<button class="btn small" data-act="flAdd" style="justify-self:start">+ Joueur</button>`:""}
      <label class="f" style="max-width:200px">Terrains<select data-flt>${[1,2,3,4].map(n=>`<option value="${n}" ${FL.cfg.terrains===n?"selected":""}>${n} terrain${n>1?"s":""}</option>`).join("")}</select></label></section>
    <section class="card stack" style="gap:10px"><h3>Scoreur</h3>${vCfgLibre(FL.cfg,"flc")}</section>
    <button class="btn primary big" data-act="flStart">Commencer la feuille de match</button></div>`;
  const S=flSession();FE={S,M:FL.M,local:true};
  return`<div class="stack"><div class="row"><button class="btn ghost small" data-act="flBack">← Mes activités</button><span class="spacer"></span><button class="btn small" data-act="scoreLibre">⏱️ Scoreur</button></div>
  <section class="class-hero"><span class="eyebrow">Outil · ${FL.joueurs.length} joueurs</span><h2>🏆 Feuille de match</h2><p style="margin:6px 0 0;color:#cfd6dc">${FL.cfg.bonus.length?`Bonus : ${FL.cfg.bonus.map(b=>`${esc(b.label)} ${FL.cfg.bonusMode==="eval"?"(compté à part)":"+"+b.val}`).join(" · ")}`:"Pas de bonus"}</p></section>
  ${vFeuille(S,FL.M,true)}
  <div class="row"><button class="btn" data-act="flEdit">Modifier les réglages</button><button class="btn ghost small danger" data-act="flReset">Nouveau tournoi</button></div></div>`}
function flCfg(k,v){FL.cfg=editCfg(FL.cfg,k,v);lsSet("feuilleLocale",FL);lsSet("scoreurCfg",FL.cfg);rerenderKeep()}
/* Réglages du scoreur par l'élève (outil général) */
function scCfgPanel(){return`<div class="sc-cfg"><h3>Réglages du scoreur</h3>${vCfgLibre(SC.cfg,"scc")}<button class="sc-reset" data-scx="cfgDone">Terminé</button></div>`}


/* ====================================================================
   Espace élève : Accueil · En classe · Profil (barre d'onglets en bas)
   ==================================================================== */
const PC_DEF={act:{cible:420,pts:40},jours:{cible:5,pts:30},sed:{pts:15,seuils:[4,6]},ecran:{pts:15,seuils:[2,4]},
  couleurs:["#22c55e","#f59e0b","#ef4444"],niveaux:[75,50],objectifJours:5,defis:[]};
const normPC=p=>{p=p||{};const n=(v,d,a,b)=>{v=parseFloat(String(v??"").replace(",","."));return isFinite(v)?Math.max(a,Math.min(b,v)):d};
  const pair=(s,d)=>{const a=n(s&&s[0],d[0],0,24),b=n(s&&s[1],d[1],0,24);return[Math.min(a,b),Math.max(a,b)]};
  const col=(c,i)=>/^#[0-9a-f]{6}$/i.test(String(c||""))?c:PC_DEF.couleurs[i];
  return{act:{cible:n(p.act&&p.act.cible,420,30,3000),pts:n(p.act&&p.act.pts,40,0,100)},jours:{cible:n(p.jours&&p.jours.cible,5,1,7),pts:n(p.jours&&p.jours.pts,30,0,100)},
    sed:{pts:n(p.sed&&p.sed.pts,15,0,100),seuils:pair(p.sed&&p.sed.seuils,[4,6])},ecran:{pts:n(p.ecran&&p.ecran.pts,15,0,100),seuils:pair(p.ecran&&p.ecran.seuils,[2,4])},
    couleurs:[0,1,2].map(i=>col((p.couleurs||[])[i],i)),niveaux:[n((p.niveaux||[])[0],75,1,100),n((p.niveaux||[])[1],50,0,99)],objectifJours:n(p.objectifJours,5,1,7),
    defis:(Array.isArray(p.defis)?p.defis:(p.defi&&p.defi.valeur?[{id:"d0",...p.defi}]:[])).slice(0,30).map((d,i)=>({id:String(d&&d.id||"d"+i).slice(0,20),valeur:String(d&&d.valeur||"").slice(0,20),texte:String(d&&d.texte||"").slice(0,60),semaine:String(d&&d.semaine||"")})).filter(d=>d.valeur||d.texte)}};
const defisSem=P=>(P.defis||[]).filter(d=>!d.semaine||d.semaine===semaineId());
const defiFait=(a,d)=>{const s=semaineId(),m=a&&a.defis||{};return!!(m[s+":"+d.id]||(d.id==="d0"&&m[s]===true))};
let DI=0;
function semaineId(d=new Date()){const t=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));const day=t.getUTCDay()||7;t.setUTCDate(t.getUTCDate()+4-day);const y=t.getUTCFullYear(),w=Math.ceil(((t-Date.UTC(y,0,1))/864e5+1)/7);return`${y}-S${String(w).padStart(2,"0")}`}
let H={pc:normPC(),ac:null,actus:[],cls:null,sessions:[],ins:[],edefis:[]};
const defisH=()=>[...defisSem(H.pc),...(H.edefis||[])];
const lvl3=(v,s)=>v<=s[0]?0:v<=s[1]?1:2;
function scoreAct(a,P){if(!a||a.semaine!==semaineId())return null;const tot=P.act.pts+P.jours.pts+P.sed.pts+P.ecran.pts||1;
  const d={act:Math.min(1,(+a.min||0)/P.act.cible),jours:Math.min(1,(+a.jours||0)/P.jours.cible),sed:[1,.5,0][lvl3(+a.sed||0,P.sed.seuils)],ecran:[1,.5,0][lvl3(+a.ecran||0,P.ecran.seuils)]};
  const s=d.act*P.act.pts+d.jours*P.jours.pts+d.sed*P.sed.pts+d.ecran*P.ecran.pts;return{score:Math.round(s*100/tot),d}}
function niveauDe(sc,P){return sc>=P.niveaux[0]?{lab:"Bon niveau",t:"Très bien !",m:"Tu es actif cette semaine. Continue sur cette lancée !",c:P.couleurs[0]}
  :sc>=P.niveaux[1]?{lab:"Dans la moyenne",t:"Pas mal !",m:"Tu es dans la moyenne. Un petit effort et tu passes au niveau supérieur.",c:P.couleurs[1]}
  :{lab:"À améliorer",t:"On s'y met ?",m:"Tu bouges moins que recommandé. Regarde les conseils pour progresser.",c:P.couleurs[2]}}
const fmtHM=m=>{m=Math.round(+m||0);return`${Math.floor(m/60)}h${String(m%60).padStart(2,"0")}`};
const fmtH=h=>{h=+h||0;const m=Math.round(h*60);return`${Math.floor(m/60)}h${String(m%60).padStart(2,"0")}`};
function conseils(a,P){if(!a)return[];const out=[],r=scoreAct(a,P);if(!r)return[];
  const manque=Math.max(0,P.act.cible-(+a.min||0));
  if(manque>0)out.push({ic:"🏃",t:`Il te manque ${fmtHM(manque)} d'activité cette semaine`,d:`Recommandé : ${fmtHM(P.act.cible)} par semaine. 3 sorties de ${Math.max(10,Math.ceil(manque/3/5)*5)} min (marche rapide, vélo, footing, danse…) suffisent.`});
  if((+a.jours||0)<P.jours.cible)out.push({ic:"📅",t:`Bouge au moins ${P.jours.cible} jours par semaine`,d:"Mieux vaut un peu tous les jours qu'une grosse séance : va au lycée à pied ou à vélo, prends les escaliers."});
  const ls=lvl3(+a.sed||0,P.sed.seuils);if(ls)out.push({ic:"🪑",t:"Trop de temps assis",d:"Lève-toi au moins une fois par heure : quelques pas, des étirements ou 10 squats pendant les pauses."});
  const le=lvl3(+a.ecran||0,P.ecran.seuils);if(le)out.push({ic:"📱",t:"Beaucoup de temps d'écran",d:"Pose ton téléphone 1 h avant de dormir et remplace une partie de ce temps par une activité dehors."});
  if(!out.length)out.push({ic:"🏆",t:"Tout est dans le vert !",d:"Garde ce rythme et pense à varier les activités : endurance, renforcement, souplesse."});
  return out}
async function openHome(){RETRY=()=>openHome();go("loading",{msg:"Chargement de ton espace…"});
  try{const[pc,ac,actus,cls,sess]=await Promise.all([fb.getProfCfg(me.profId).catch(()=>null),fb.getActivite(me.uid).catch(()=>null),fb.listActus(me.profId).catch(()=>[]),fb.getClasse(me.classeId).catch(()=>null),fb.listSessionsActives(me.classeId,me.profId).catch(()=>[])]);
    const eid=cls&&cls.etabId||"",[eActus,eDefis,ins]=await Promise.all([eid?fb.listActusEtab(eid).catch(()=>[]):[],eid?fb.listEtabDefis(eid).catch(()=>[]):[],VUE?[]:fb.listMesInscriptions(me.uid).catch(()=>[])]);
    const vus=new Set(),tous=[...actus.filter(x=>x.portee!=="etab"||x.etabId===eid),...eActus].filter(x=>!vus.has(x.id)&&vus.add(x.id));
    H={pc:normPC(pc),ac,cls,sessions:sess,ins:ins.map(i=>i.actuId),edefis:eDefis.filter(d=>d.semaine===semaineId()).map(d=>({id:"e_"+d.id,valeur:d.valeur,texte:d.texte,semaine:d.semaine,etab:true})),
      actus:tous.filter(x=>String(x.date||"")>=today()&&(x.portee==="etab"||!(x.classes||[]).length||(x.classes||[]).includes(me.classeId))).sort((a,b)=>String(a.date).localeCompare(String(b.date)))};
    eleveClasse=cls;eleveSessions=sess;go("home");vgInit()}catch(e){console.error(e);go("error",{msg:authMsg(e)})}}
const AVATARS=["🏃","🤸","⚽","🏀","🏐","🤾","🏸","🎾","🚴","🏊","🧗","🥋","🦊","🐯","🐺","🦁"];
function avatarHTML(cls=""){return`<div class="h-av ${cls}" aria-hidden="true">${esc(me.avatar||AVATARS[0])}</div>`}
const dLong=d=>{const x=new Date(String(d)+"T12:00:00");return isNaN(x)?"":x.toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"})};
const dansJours=d=>{const n=Math.round((new Date(String(d)+"T12:00:00")-new Date(today()+"T12:00:00"))/864e5);return n<=0?"Aujourd'hui":n===1?"Demain":n<7?`Dans ${n} jours`:n<14?"Dans 1 semaine":`Dans ${Math.floor(n/7)} semaines`};
const ACTU_T={competition:{lab:"Compétition à venir",ic:"🏆"},as:{lab:"Activité AS",ic:"🏅"},info:{lab:"Info EPS",ic:"📣"}};
function vConseilsPage(){const P=H.pc,a=H.ac,L=conseils(a,P);
  return`<div class="shell-home"><div class="row"><button class="h-link" data-act="shTab" data-t="home">← Accueil</button></div><div class="h-sech"><span class="h-ic">💡</span><h2>Mes conseils</h2></div>
  ${L.length?L.map(c=>`<section class="h-card h-tip"><span>${c.ic}</span><div><b>${esc(c.t)}</b><p>${esc(c.d)}</p></div></section>`).join(""):`<section class="h-card"><p class="h-empty">Saisis tes données de la semaine dans ton profil pour recevoir des conseils.</p><button class="h-btn" data-act="shTab" data-t="profilEl">Saisir mes données</button></section>`}
  <section class="h-card"><b>Les repères de ton enseignant</b><ul class="h-rep"><li>Activité : ${fmtHM(P.act.cible)} par semaine (environ ${Math.round(P.act.cible/7)} min par jour)</li><li>Au moins ${P.jours.cible} jours actifs par semaine</li>
    <li><i style="background:${P.couleurs[0]}"></i>Temps assis jusqu'à ${fmtH(P.sed.seuils[0])} par jour, <i style="background:${P.couleurs[1]}"></i>jusqu'à ${fmtH(P.sed.seuils[1])}, <i style="background:${P.couleurs[2]}"></i>au-delà</li>
    <li><i style="background:${P.couleurs[0]}"></i>Écran jusqu'à ${fmtH(P.ecran.seuils[0])} par jour, <i style="background:${P.couleurs[1]}"></i>jusqu'à ${fmtH(P.ecran.seuils[1])}, <i style="background:${P.couleurs[2]}"></i>au-delà</li></ul></section></div>`}
function vActusPage(){return`<div class="shell-home"><div class="row"><button class="h-link" data-act="shTab" data-t="home">← Accueil</button></div><div class="h-sech"><span class="h-ic">📢</span><h2>Actualités</h2></div>
  ${H.actus.map(x=>`<div class="h-row"><span class="hr-ic">${(ACTU_T[x.type]||ACTU_T.info).ic}</span><div><b>${esc(x.titre)}</b><small>${esc(dLong(x.date))} · ${dansJours(x.date)}${x.lieu?` · ${esc(x.lieu)}`:""}</small></div><span class="spacer"></span>${x.inscription&&x.type==="competition"?etInsBtn(x):x.lien?`<a href="${esc(x.lien)}" target="_blank" rel="noopener" aria-label="S'inscrire">S'inscrire ›</a>`:""}</div>`).join("")||'<p class="h-empty">Rien de prévu pour l\'instant.</p>'}</div>`}
/* --- En classe --- */
const CA_FR={CA1:"Réaliser une performance motrice maximale",CA2:"Adapter ses déplacements à des environnements variés",CA3:"Réaliser une prestation corporelle à voir et à apprécier",CA4:"Conduire et maîtriser un affrontement pour gagner",CA5:"Réaliser et orienter son activité physique pour s'entretenir"};
const CA_COL={CA1:"#ef4444",CA2:"#22c55e",CA3:"#a855f7",CA4:"#f97316",CA5:"#0ea5e9","":"#64748b"};
const CA_TAG={CA1:"Repousse tes records !",CA2:"Pars à l'aventure !",CA3:"Exprime-toi et brille !",CA4:"Joue, coopère, gagne !",CA5:"Défie-toi et dépasse tes limites !"};
let ecFold={};
function vEnClasse(){const sj=eleveClasse&&eleveClasse.seanceJour,isToday=sj&&sj.date===today(),sess=(eleveSessions||[]).filter(s=>s.active);
  const ds=actsDossiers||[],groups={};ds.forEach(d=>{const k=CA_FR[d.ca]?d.ca:"";(groups[k]=groups[k]||[]).push(d)});
  const cl=(coachings||[]).slice().sort((a,b)=>String(b.date||"").localeCompare(String(a.date||"")));
  const docs=isToday?(sj.items||[]):[],feuilles=sess.filter(s=>s.kind==="feuille"&&!(isToday&&(sj.items||[]).some(i=>i.id===s.outilId)));
  return`<div class="shell-home ec">${vVueBanner()}
  <div class="ec-h"><span class="ec-hic">${IC.people}</span><div><h1>En classe</h1><p>Ta classe, tes défis, vos activités !</p></div><span class="ec-crown" aria-hidden="true">${IC.crown}</span><i class="ec-sw" aria-hidden="true"></i></div>
  <section class="ec-today"><div class="ec-tag"><span class="ec-tagic">${IC.cal}</span>Séance d'aujourd'hui</div>
    <div class="ec-tbody"><span class="ec-run" aria-hidden="true">${IC.runner}</span><span class="ec-chev" aria-hidden="true">›</span><div>
    ${isToday||feuilles.length?`${isToday?`<b>${esc(sj.titre||"Séance du jour")}</b>`:`<b>Feuille de match ouverte</b>`}
      <div class="ec-docs">${docs.map(it=>`<button data-act="sjOpen" data-d="${it.d||sj.dossierId}" data-id="${it.id}" data-t="${it.t}"><span>${it.t==="carnet"?IC.kettle:it.t==="outil"?IC.tool:it.t==="qcm"?"📝":IC.certif}</span>${esc(it.titre||"Document")}</button>`).join("")}${feuilles.map(s=>`<button data-act="sjFeuille" data-id="${s.id}"><span>${IC.trophy}</span>${esc(s.titre||"Feuille de match")}</button>`).join("")}</div>
      ${isToday&&!docs.length&&!feuilles.length?`<small>Ton enseignant n'a pas encore déposé de document pour cette séance.</small>`:""}`
    :`<b>Pas de séance programmée aujourd'hui.</b><small>Profite pour bouger quand même !</small>`}</div></div><i class="ec-sw pink" aria-hidden="true"></i></section>
  ${cl.length?`<div class="ec-sub"><h2>Séances à coacher</h2><span class="spacer"></span><button class="h2-link" data-act="refreshCoach">Actualiser</button></div>${cl.map(c=>`<button class="ec-row" data-act="openCoach" data-id="${c.id}"><span class="ec-rowic">📣</span><div><b>${esc(c.eleveLogin)}</b><small>${fmtDate(c.date)}</small></div><span class="spacer"></span><span class="h2-chev">${IC.chev}</span></button>`).join("")}`:""}
  ${Object.keys(CA_FR).concat([""]).filter(k=>groups[k]).map(k=>`<button class="ec-ca" data-act="ecFold" data-k="${k}" aria-expanded="${!ecFold[k]}" style="--c:${CA_COL[k]}"><span class="ec-cab">${k||"+"}</span><span class="ec-cat">${esc(CA_FR[k]||"Autres activités")}</span><span class="ec-cach">${IC.chev}</span></button>
    ${ecFold[k]?"":groups[k].map(d=>`<button class="ec-act" data-act="openDossier" data-id="${d.id}" style="--c:${CA_COL[k]}"><img class="ec-actimg" src="gym.jpg?v=2026.11.21-15" alt=""><span class="ec-actic">${IC.dumbbell}</span><span class="ec-chev sm" aria-hidden="true">›</span><span class="ec-actt"><b>${esc(d.titre)}</b><span>Ouvrir ›</span></span></button>`).join("")}`).join("")}
  ${ds.length?"":`<section class="ec-empty">Ton enseignant n'a pas encore ouvert d'activité pour ta classe.</section>`}
  <div class="ec-h tools"><span class="ec-hic tb" aria-hidden="true">🧰</span><div><h1>Outils</h1><p>Pour toutes tes activités</p></div><i class="ec-sw" aria-hidden="true"></i></div>
  <div class="ec-tools"><button data-act="toolScoreur" class="sc"><span class="ec-tic">⏱️</span><b>Scoreur</b><small>Compte tes points en temps réel</small><span class="ec-tch">${IC.chev}</span></button>
    <button data-act="toolFeuille" class="fm"><span class="ec-tic">🏆</span><b>Feuille de match</b><small>Organise tes matchs et compétitions</small><span class="ec-tch">${IC.chev}</span></button></div></div>`}
async function sjOpen(did,id,t){await openDossier(did);if(route.name!=="dossier")return;const x=dossierItems.find(y=>y.id===id);if(!x){toast("Document introuvable");return}
  if(t==="carnet"){openCarnetEleve(id);return}if(t==="fiche"){showFiche(id);return}if(t==="qcm"){openQcmEleve(id,"enclasse");return}ouvrirOutilEleve(x)}
/* --- Profil élève --- */
function vProfilEl(){const a=H.ac&&H.ac.semaine===semaineId()?H.ac:{};const hm=m=>m?`${Math.floor(m/60)}:${String(Math.round(m%60)).padStart(2,"0")}`:"";
  return`<div class="shell-home"><section class="h-hero small"><div class="h-stripes" aria-hidden="true"></div><div><div class="h-date">MON PROFIL</div><h1><span>${esc(me.pseudo||me.login)}</span></h1><p>${esc(me.login)}</p></div>${avatarHTML()}</section>
  <section class="h-card stack" style="gap:10px"><b>Mon avatar</b><div class="av-pick">${AVATARS.map(x=>`<button data-act="avPick" data-v="${x}" aria-pressed="${(me.avatar||AVATARS[0])===x}" aria-label="Avatar ${x}">${x}</button>`).join("")}</div></section>
  <section class="h-card stack light-in" style="gap:10px"><label class="f">Mon pseudo<input id="ps-in" maxlength="20" value="${esc(me.pseudo||"")}" placeholder="ex. Smash57" autocomplete="off"></label><p class="hint" style="margin:0;color:#94a3b8">Il s'affiche sur les feuilles de match et l'accueil. N'écris pas ton vrai nom.</p><div class="err" id="ps-err"></div><button class="h-btn" data-act="psSave">Enregistrer le pseudo</button></section>
  <section class="h-card stack light-in" style="gap:10px"><b>Mon activité cette semaine</b><p class="hint" style="margin:0;color:#94a3b8">Bientôt récupérée automatiquement depuis l'app Santé de ton téléphone. En attendant, saisis-la toi-même.</p>
    <div class="grid2"><label class="f">Temps d'activité (h:min)<input id="ac-min" inputmode="numeric" placeholder="ex. 5:12" value="${hm(+a.min||0)}"></label><label class="f">Jours actifs (0 à 7)<input id="ac-j" inputmode="numeric" value="${a.jours??""}"></label></div>
    <div class="grid2"><label class="f">Temps assis par jour (h:min)<input id="ac-sed" inputmode="numeric" placeholder="ex. 4:10" value="${a.sed!=null?hm(a.sed*60):""}"></label><label class="f">Temps d'écran par jour (h:min)<input id="ac-ecr" inputmode="numeric" placeholder="ex. 3:00" value="${a.ecran!=null?hm(a.ecran*60):""}"></label></div>
    <div class="err" id="ac-err"></div><button class="h-btn" data-act="acSave">Enregistrer</button></section>
  <section class="h-card"><div class="row"><div><b>${esc(me.login)}</b><small style="display:block;color:#94a3b8">Identifiant de connexion</small></div><span class="spacer"></span><button class="h-btn ghost" data-nav="logout">Déconnexion</button></div></section></div>`}
const parseHM=v=>{v=String(v||"").trim().replace("h",":").replace(",",".");if(!v)return null;if(v.includes(":")){const[h,m]=v.split(":");return(parseInt(h)||0)*60+(parseInt(m)||0)}const n=parseFloat(v);return isFinite(n)?(n<=24?n*60:n):null};
async function saveActivite(){if(apercuBloque())return;const err=$("#ac-err");err.textContent="";const min=parseHM($("#ac-min").value),j=parseInt($("#ac-j").value),sed=parseHM($("#ac-sed").value),ecr=parseHM($("#ac-ecr").value);
  if(min==null||isNaN(j)||sed==null||ecr==null){err.textContent="Remplis les 4 cases (ex. 5:12, 4, 4:10, 3:00).";return}
  if(j<0||j>7||sed>24*60||ecr>24*60){err.textContent="Vérifie tes valeurs.";return}
  const d={profId:me.profId,classeId:me.classeId,semaine:semaineId(),min,jours:j,sed:Math.round(sed/60*100)/100,ecran:Math.round(ecr/60*100)/100,defis:(H.ac&&H.ac.defis)||{},maj:new Date().toISOString()};
  try{await fb.setActivite(me.uid,d);H.ac=d;toast("Activité enregistrée");shTab("home")}catch(e){err.textContent=authMsg(e)}}
async function toggleDefi(id){if(apercuBloque())return;const d=defisH().find(x=>x.id===id);if(!d)return;const sem=semaineId(),k=sem+":"+id,a=H.ac||{profId:me.profId,classeId:me.classeId,semaine:"",min:0,jours:0,sed:0,ecran:0,defis:{}};
  const was=defiFait(a,d),m={...(a.defis||{})};if(id==="d0")delete m[sem];m[k]=!was;a.defis=m;
  try{await fb.setActivite(me.uid,{...a,profId:me.profId,classeId:me.classeId});H.ac=a;if(!was)toast("Bravo, défi relevé ! 💪");rerenderKeep()}catch(e){toast(authMsg(e))}}
async function savePseudoAvatar(av){if(apercuBloque())return;try{await fb.updateLogin(me.login,{avatar:av});me.avatar=av;rerenderKeep()}catch(e){toast(authMsg(e))}}
function shTab(t){if(t==="enclasse"){openActs();return}go(t)}
/* --- Prof : réglages de l'accueil élèves --- */
let PA=null;
async function openProfAccueil(){RETRY=()=>openProfAccueil();go("loading");try{await loadClasses();const[pc,actus]=await Promise.all([fb.getProfCfg(me.uid).catch(()=>null),fb.listActus(me.uid).catch(()=>[])]);
  await etLoad();let edefis=[],etActus=[];if(ET.etab){[edefis,etActus]=await Promise.all([fb.listEtabDefis(ET.etab.id).catch(()=>[]),fb.listActusEtab(ET.etab.id).catch(()=>[])])}
  PA={pc:normPC(pc),actus:actus.sort((a,b)=>String(a.date).localeCompare(String(b.date))),edit:null,edefis,etActus:etActus.filter(x=>x.profId!==me.uid).sort((a,b)=>String(a.date).localeCompare(String(b.date)))};go("profAccueil")}catch(e){go("error",{msg:authMsg(e)})}}
function vProfAccueil(){const P=PA.pc,sem=semaineId();const num=(k,v,l,at="")=>`<label class="f">${l}<input data-pa="${k}" inputmode="decimal" value="${v}" ${at}></label>`;
  return`<div class="stack"><h2>Accueil des élèves</h2><p class="hint" style="margin:-6px 0 0">Ce que vos élèves voient en ouvrant l'appli : leur score d'activité physique, vos actualités et les défis de la semaine.</p>
  <section class="card stack" style="gap:10px"><div class="sec-h"><h3>Barème du score d'activité (/100)</h3></div>
    <p class="hint" style="margin:0">Chaque partie rapporte ses points en entier quand l'objectif est atteint. Le total est ramené sur 100.</p>
    <div class="grid2">${num("act.cible",P.act.cible,"Activité visée (min / semaine)")}${num("act.pts",P.act.pts,"Points")}</div>
    <div class="grid2">${num("jours.cible",P.jours.cible,"Jours actifs visés / semaine")}${num("jours.pts",P.jours.pts,"Points")}</div>
    <div class="grid3">${num("sed.seuils.0",P.sed.seuils[0],"Temps assis : vert jusqu'à (h/j)")}${num("sed.seuils.1",P.sed.seuils[1],"orange jusqu'à (h/j)")}${num("sed.pts",P.sed.pts,"Points")}</div>
    <div class="grid3">${num("ecran.seuils.0",P.ecran.seuils[0],"Écran : vert jusqu'à (h/j)")}${num("ecran.seuils.1",P.ecran.seuils[1],"orange jusqu'à (h/j)")}${num("ecran.pts",P.ecran.pts,"Points")}</div>
    <p class="hint" style="margin:0">Temps assis et écran : tous les points dans le vert, la moitié dans l'orange, aucun au-delà.</p>
    <div class="grid2">${num("niveaux.0",P.niveaux[0],"« Bon niveau » à partir de")}${num("niveaux.1",P.niveaux[1],"« Dans la moyenne » à partir de")}</div>
    ${num("objectifJours",P.objectifJours,"Objectif de la semaine : bouger … jours",'style="max-width:120px"')}
    <div class="f"><span class="mlab">Couleurs d'affichage (temps assis, écran, niveaux)</span><div class="row">${["Bien","Moyen","À améliorer"].map((l,i)=>`<label class="colp"><input type="color" data-pa="couleurs.${i}" value="${P.couleurs[i]}"> ${l}</label>`).join("")}</div></div>
    <button class="btn primary" data-act="paSave" style="justify-self:start">Enregistrer le barème</button></section>
  <section class="card stack" style="gap:10px"><div class="sec-h"><h3>🔥 Défis de la semaine</h3><span class="spacer"></span><span class="hint">${(()=>{const n=defisSem(P).length;return n?`${n} en cours`:"Aucun défi cette semaine"})()}</span></div>
    <p class="hint" style="margin:0">Ajoutez autant de défis que vous voulez : les élèves les font défiler sur leur accueil et les cochent un par un.</p>
    ${P.defis.length?`<div class="list-s">${P.defis.slice().sort((x,y)=>(y.semaine===sem)-(x.semaine===sem)).map(d=>`<div class="s-item" style="cursor:default"><div><strong>🔥 ${esc(d.valeur)}</strong> ${esc(d.texte)}<div class="hint">${!d.semaine||d.semaine===sem?"Cette semaine":`Semaine ${esc(d.semaine.split("-S")[1]||d.semaine)} · terminé`}</div></div><div class="row" style="gap:6px;flex-wrap:nowrap">${d.semaine&&d.semaine!==sem?`<button class="btn ghost small" data-act="paDefiRel" data-id="${d.id}">Relancer</button>`:""}<button class="btn ghost small danger" data-act="paDefiDel" data-id="${d.id}" aria-label="Supprimer">✕</button></div></div>`).join("")}</div>`:""}
    <div class="grid2" style="border-top:1px solid var(--line);padding-top:10px"><label class="f">Objectif<input id="df-v" maxlength="20" placeholder="ex. 5 min"></label><label class="f">Défi<input id="df-t" maxlength="60" placeholder="ex. de gainage cumulé"></label></div>
    <button class="btn primary" data-act="paDefiAdd" style="justify-self:start">＋ Ajouter ce défi cette semaine</button></section>
  <section class="card stack" style="gap:10px"><div class="sec-h"><h3>📢 Actualités</h3><span class="hint">Compétitions, AS, informations</span></div>
    ${PA.actus.length?`<div class="list-s">${PA.actus.map(x=>`<div class="s-item" style="cursor:default${PA.edit===x.id?";outline:2px solid var(--accent)":""}"><div><strong>${(ACTU_T[x.type]||ACTU_T.info).ic} ${esc(x.titre)}</strong><div class="hint">${esc(dLong(x.date))}${x.lieu?" · "+esc(x.lieu):""} · ${x.portee==="etab"?"🏫 tout l'établissement":(x.classes||[]).length?esc(classes.filter(c=>x.classes.includes(c.id)).map(c=>c.nom).join(", ")):"toutes mes classes"}${x.inscription&&x.type==="competition"?" · inscriptions dans l'appli":""}${String(x.date)<today()?" · passée":""}</div></div><div class="row" style="gap:6px;flex-wrap:nowrap">${x.inscription&&x.type==="competition"?`<button class="btn ghost small" data-et="etInscrits" data-id="${x.id}">👥 Inscrits</button>`:""}<button class="btn ghost small" data-act="paEditActu" data-id="${x.id}" aria-label="Modifier">✎</button><button class="btn ghost small danger" data-act="paDelActu" data-id="${x.id}" aria-label="Supprimer">✕</button></div></div>`).join("")}</div>`:'<p class="hint" style="margin:0">Aucune actualité.</p>'}
    ${(()=>{const E=PA.edit&&PA.actus.find(x=>x.id===PA.edit)||null,v=k=>esc(E&&E[k]||"");return`<form class="stack" id="actu-form" style="gap:8px;border-top:1px solid var(--line);padding-top:10px">
      <strong>${E?"Modifier l'actualité":PA.actus.length?"Ajouter une autre actualité":"Nouvelle actualité"}</strong>
      <div class="grid2"><label class="f">Type<select id="au-type">${[["competition","🏆 Compétition"],["as","🏅 Activité AS"],["info","📣 Information"]].map(([k,l])=>`<option value="${k}" ${E&&E.type===k?"selected":""}>${l}</option>`).join("")}</select></label><label class="f">Date<input type="date" id="au-date" value="${E?v("date"):today()}" required></label></div>
      <label class="f">Titre<input id="au-t" maxlength="60" required placeholder="ex. Cross académique UNSS" value="${v("titre")}"></label>
      <div class="grid2"><label class="f">Lieu (facultatif)<input id="au-lieu" maxlength="60" value="${v("lieu")}"></label><label class="f">Lien d'inscription (facultatif)<input id="au-lien" type="url" placeholder="https://…" value="${v("lien")}"></label></div>
      <label style="display:flex;gap:8px;align-items:center;font-weight:600"><input type="checkbox" id="au-ins" ${!E||E.inscription?"checked":""} style="width:20px;height:20px"> Inscriptions dans l'appli (bouton « Je m'inscris » pour une compétition)</label>
      ${ET.etab?`<label class="f">Pour qui ?<select id="au-portee"><option value="classes" ${E&&E.portee==="etab"?"":"selected"}>Mes classes</option><option value="etab" ${E&&E.portee==="etab"?"selected":""}>🏫 Tout l'établissement (${esc(ET.etab.nom)})</option></select></label>`:""}
      <div class="f"><span class="mlab">Classes</span><div class="mchecks">${classes.map(c=>`<label><input type="checkbox" class="au-cls" value="${c.id}" ${E&&(E.classes||[]).includes(c.id)?"checked":""}> ${esc(c.nom)}</label>`).join("")}</div><span class="hint">Aucune cochée = toutes vos classes${ET.etab?" (ignoré pour « tout l'établissement »)":""}.</span></div>
      <div class="row"><button class="btn primary" type="submit">${E?"Enregistrer les modifications":"＋ Publier l'actualité"}</button>${E?`<button class="btn ghost" type="button" data-act="paCancelActu">Annuler</button>`:""}</div></form>`})()}</section>${vEtabAccueil()}</div>`}
async function paDefi(a,id){const P=PA.pc,sem=semaineId();let L=P.defis.slice();
  if(a==="paDefiAdd"){const v=($("#df-v")||{}).value||"",t=($("#df-t")||{}).value||"";if(!v.trim()&&!t.trim()){toast("Indiquez l'objectif du défi");return}
    L.push({id:Date.now().toString(36),valeur:v.trim().slice(0,20),texte:t.trim().slice(0,60),semaine:sem})}
  else if(a==="paDefiDel")L=L.filter(d=>d.id!==id);
  else L=L.map(d=>d.id===id?{...d,semaine:sem}:d);
  const pc={...P,defis:L};try{await fb.setProfCfg(me.uid,pc);PA.pc=normPC(pc);toast(a==="paDefiAdd"?"Défi ajouté — vous pouvez en ajouter un autre":a==="paDefiDel"?"Défi supprimé":"Défi relancé cette semaine");rerenderKeep()}catch(x){toast(authMsg(x))}}
function paField(k,v){const o=clone(PA.pc);setPath(o,k,v);PA.pc=normPC(o)}
/* --- Prof : séance du jour d'une classe --- */
function vSeanceJourProf(){const sj=classe.seanceJour||{},isT=sj.date===today(),ds=classeDossiers||[],dsel=ds.find(x=>x.d.id===(SJ.d||sj.dossierId))||ds[0];
  return`<section class="card stack" style="gap:8px"><div class="sec-h"><h3>📌 Séance d'aujourd'hui</h3><span class="spacer"></span><span class="hint">${isT?`Affichée aux élèves : ${esc(sj.titre||"")}`:"Rien d'affiché aujourd'hui"}</span></div>
    ${ds.length?`<label class="f">Activité<select id="sj-d">${ds.map(x=>`<option value="${x.d.id}" ${dsel&&dsel.d.id===x.d.id?"selected":""}>${esc(x.d.titre)}</option>`).join("")}</select></label>
    <div class="f"><span class="mlab">Documents mis en avant</span><div class="mchecks">${(dsel&&dsel.all||[]).map(x=>`<label><input type="checkbox" class="sj-it" value="${x.id}" ${isT&&sj.dossierId===dsel.d.id&&(sj.items||[]).some(i=>i.id===x.id)?"checked":""}> ${x.t==="carnet"?"📒":x.t==="outil"?OUTILS[x.kind].ic:x.t==="qcm"?"📝":"📄"} ${esc(x.titre)}</label>`).join("")||'<span class="hint">Activité vide.</span>'}</div></div>
    <div class="row"><button class="btn primary small" data-act="sjSave">Afficher pour aujourd'hui</button>${isT?`<button class="btn ghost small" data-act="sjClear">Retirer</button>`:""}</div>${isT?vVersionsProf(sj):""}`:'<p class="hint" style="margin:0">Activez d\'abord une activité pour cette classe.</p>'}</section>`}
let SJ={};


/* ---------- Liste des élèves de la classe (choix du coach et des membres d'un groupe) ---------- */
var ROSTER=null,rosterKey="";
async function loadRoster(){const k=me.profId+"|"+me.classeId;if(ROSTER&&rosterKey===k)return ROSTER;
  try{ROSTER=(await fb.listLoginsClasse(me.profId,me.classeId)).map(x=>({login:x.id,uid:x.uid,pseudo:x.pseudo||"",avatar:x.avatar||""})).sort((a,b)=>a.login.localeCompare(b.login,"fr",{numeric:true}));rosterKey=k}catch(e){console.warn(e);ROSTER=[]}
  return ROSTER}
const rosterLabel=x=>x.pseudo?`${esc(x.pseudo)} <span class="hint">${esc(x.login)}</span>`:`<code>${esc(x.login)}</code>`;
function rosterSelect(id,exclude,ph){const L=(ROSTER||[]).filter(x=>!exclude.includes(x.login)&&x.login!==me.login);
  if(!ROSTER){loadRoster().then(()=>rerenderKeep());return`<p class="hint" style="margin:0">Chargement de la liste de la classe…</p>`}
  return`<select id="${id}" style="flex:1;min-width:0"><option value="">${esc(ph)}</option>${L.map(x=>`<option value="${esc(x.login)}">${esc(x.pseudo?x.pseudo+" · "+x.login:x.login)}</option>`).join("")}</select>`}
function rosterChecks(cls,exclude,max){if(!ROSTER){loadRoster().then(()=>rerenderKeep());return`<p class="hint" style="margin:0">Chargement de la liste de la classe…</p>`}
  const L=ROSTER.filter(x=>!exclude.includes(x.login)&&x.login!==me.login);
  return`<div class="roster" data-max="${max}">${L.map(x=>`<label class="ro-it"><input type="checkbox" class="${cls}" value="${esc(x.login)}"><span class="ro-av" aria-hidden="true">${esc(x.avatar||"👤")}</span><span>${rosterLabel(x)}</span></label>`).join("")||'<span class="hint">Aucun camarade dans la liste.</span>'}</div>`}
/* ---------- Vue élève pour le prof : l'appli comme un élève de la classe, sans rien enregistrer ---------- */
var VUE=null;
function apercuBloque(){if(!VUE)return false;toast("Vue élève : rien n'est enregistré");return true}
async function entrerVueEleve(){if(!classe)return;VUE={prof:me,classeId:classe.id,nom:classe.nom};
  me={uid:"apercu-"+me.uid,role:"eleve",login:"apercu",pseudo:"Élève",avatar:"🙂",profId:VUE.prof.uid,classeId:classe.id,apercu:true};ROSTER=null;openHome()}
function quitterVueEleve(){if(!VUE)return;const c=VUE.classeId;me=VUE.prof;VUE=null;ROSTER=null;COACH=false;RO=false;MOD=null;carnetId=null;data=null;dossierCtx=null;FE=null;if(matchUnsub){matchUnsub();matchUnsub=null}openClasse(c,"activites")}
const SHELL_R=["home","enclasse","profilEl","conseils","actus","dossier","progres"];
function isShell(){return!!(me&&me.role==="eleve"&&SHELL_R.includes(route.name))}
function vVueBanner(alt){if(!VUE)return"";
  if(!isShell())return`<div class="vue-banner" role="status"><span>👁 Vue élève · ${esc(VUE.nom)}</span><span class="hint" style="color:#cbd5e1">rien n'est enregistré</span><button data-act="vueQuit">Quitter</button></div>`;
  return`<div class="vb2${alt?" alt":""}" role="status">${alt?"":`<img class="vb2-img" src="vue-bar.jpg?v=2026.11.21-15" alt="">`}<span class="vb2-eye" aria-hidden="true">👁️</span><div class="vb2-t"><b>Vue élève · ${esc(VUE.nom)}</b><small>Rien n'est enregistré</small></div><button data-act="vueQuit">Quitter${alt?`<span class="vb2-x">${IC.exit}</span>`:""}</button></div>`}


/* --- Accueil élève fidèle à la maquette : icônes SVG maison --- */
const IC={
  pulse:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h4l2.5-6 4 13 3-9 1.5 2H22"/></svg>',
  shoe:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 15.5c0-1 .4-2 1-2.8l1.6-2.1c.3-.4.9-.5 1.3-.2l2 1.4 1.4-1.8 1.4 1.1 1.3-1.5c1 .9 2.1 1.6 3.4 2.1l3 1.1c1.4.5 2.4 1.8 2.4 3.3v.4H3z"/><rect x="3" y="18" width="18.8" height="2" rx="1"/></svg>',
  cal:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4" stroke-linecap="round"/><g fill="currentColor" stroke="none"><rect x="7" y="13" width="2.4" height="2.4" rx=".5"/><rect x="10.8" y="13" width="2.4" height="2.4" rx=".5"/><rect x="14.6" y="13" width="2.4" height="2.4" rx=".5"/><rect x="7" y="16.6" width="2.4" height="2.4" rx=".5"/><rect x="10.8" y="16.6" width="2.4" height="2.4" rx=".5"/></g></svg>',
  sit:'<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="3.6" r="2.2"/><path d="M10.2 7h2.6c.9 0 1.6.7 1.6 1.6V13h3.2c.8 0 1.4.6 1.4 1.4V21h-2.4v-5.4h-5c-.8 0-1.4-.6-1.4-1.4z"/><path d="M5 9h2v8h6v2H6.4c-.8 0-1.4-.6-1.4-1.4zM5 21h2v-2H5z"/></svg>',
  phone:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M10.5 18.5h3" stroke-linecap="round"/></svg>',
  trend:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/></svg>',
  mega:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 9.5v5c0 .8.7 1.5 1.5 1.5H6l1.4 4.3c.2.4.6.7 1 .7h1.4c.6 0 1-.6.8-1.2L9.4 16H10l7 4V4l-7 4H4.5C3.7 8 3 8.7 3 9.5z"/><path d="M19.5 9.5a3 3 0 010 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M20 4l1.6-1.4M20.4 12h2M20 20l1.6 1.4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  target:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="13" r="8.5"/><circle cx="11" cy="13" r="4.5"/><circle cx="11" cy="13" r="1" fill="currentColor"/><path d="M11 13l9-9M17 4h3v3"/></svg>',
  grid:'<svg viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="8" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/><rect x="13" y="13" width="8" height="8" rx="2"/></svg>',
  bars:'<svg viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="13" width="5" height="8" rx="1.2"/><rect x="9.5" y="8" width="5" height="13" rx="1.2"/><rect x="16" y="3" width="5" height="18" rx="1.2"/></svg>',
  people:'<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="7" r="3.2"/><circle cx="5" cy="9" r="2.4"/><circle cx="19" cy="9" r="2.4"/><path d="M6 20c0-3.6 2.7-6.4 6-6.4s6 2.8 6 6.4z"/><path d="M1 19c0-2.6 1.8-4.6 4-4.6 1 0 1.8.3 2.5.9A8 8 0 005.2 19zM23 19c0-2.6-1.8-4.6-4-4.6-1 0-1.8.3-2.5.9a8 8 0 012.3 3.7z"/></svg>',
  book:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M2 5.2C2 4.5 2.6 4 3.3 4.1 6 4.3 8.6 5 11 6.4V20c-2.4-1.3-5-2-7.7-2.2-.7 0-1.3-.6-1.3-1.3zM22 5.2c0-.7-.6-1.2-1.3-1.1-2.7.2-5.3.9-7.7 2.3V20c2.4-1.3 5-2 7.7-2.2.7 0 1.3-.6 1.3-1.3z"/></svg>',
  house:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3l9.5 8.2c.5.4.2 1.3-.5 1.3H19V20c0 .6-.4 1-1 1h-4v-5.5h-4V21H6c-.6 0-1-.4-1-1v-7.5H3c-.7 0-1-.9-.5-1.3z"/></svg>',
  school:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l10 5.2v1.6H2V7.2z"/><rect x="3.5" y="10" width="17" height="10" rx="1"/><rect x="2" y="20" width="20" height="2" rx="1"/><rect x="10" y="14" width="4" height="6" fill="#0f1420"/><rect x="5.5" y="12" width="2.5" height="2.5" fill="#0f1420"/><rect x="16" y="12" width="2.5" height="2.5" fill="#0f1420"/></svg>',
  user:'<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="7.5" r="4.5"/><path d="M3 21c0-4.4 4-7.5 9-7.5s9 3.1 9 7.5z"/></svg>',
  chev:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>',
  dumbbell:'<svg viewBox="0 0 24 24" fill="currentColor" transform="rotate(-35)"><rect x="1" y="9" width="3" height="6" rx="1"/><rect x="4" y="7" width="3" height="10" rx="1"/><rect x="7" y="11" width="10" height="2"/><rect x="17" y="7" width="3" height="10" rx="1"/><rect x="20" y="9" width="3" height="6" rx="1"/></svg>'};
Object.assign(IC,{
  exit:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 4H6a2 2 0 00-2 2v12a2 2 0 002 2h4"/><path d="M14 8l4 4-4 4M18 12H9"/></svg>',
  kettle:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M8.2 9.2A3.8 3.8 0 0112 4a3.8 3.8 0 013.8 5.2"/><path d="M8.5 7.5h7"/><circle cx="12" cy="15" r="6.2"/></svg>',
  certif:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M13 21H6.5A1.5 1.5 0 015 19.5v-15A1.5 1.5 0 016.5 3H14l5 5v4"/><path d="M14 3v5h5M8 9h4M8 12.5h7M8 16h3"/><circle cx="17" cy="16.5" r="2.6"/><path d="M15.6 18.8l-.8 3.2 2.2-1.1 2.2 1.1-.8-3.2"/></svg>',
  tool:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="7.5"/><path d="M12 9v4l2.5 2M10 2.5h4M12 2.5v3"/></svg>',
  folder:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"><path d="M3 7.5A1.5 1.5 0 014.5 6h4.2l2 2h8.8A1.5 1.5 0 0121 9.5v8A1.5 1.5 0 0119.5 19h-15A1.5 1.5 0 013 17.5z"/></svg>',
  arrow:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  runner:'<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="15.5" cy="3.8" r="2.3"/><path d="M11.3 7.2l3.4.6c.6.1 1 .4 1.3.9l1.4 2.4 2.5.8c.6.2.9.8.7 1.4-.2.6-.8.9-1.4.7l-2.9-.9c-.3-.1-.6-.3-.7-.6l-.6-1-1.2 3.2 2.4 2c.3.2.4.5.4.9l-.2 4.4c0 .6-.5 1.1-1.2 1.1-.6 0-1.1-.5-1.1-1.2l.2-3.8-2.9-2.3-1.4 3.2c-.2.4-.6.7-1 .7H4.6c-.6 0-1.1-.5-1.1-1.1s.5-1.1 1.1-1.1h3.6l2.6-6.2-1.5.4-1.4 2.3c-.3.5-1 .7-1.5.4-.5-.3-.7-1-.4-1.5l1.6-2.8c.2-.3.5-.5.8-.6z"/></svg>',
  trophy:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4h10v5a5 5 0 01-10 0z"/><path d="M7 6H4v1.5A3.5 3.5 0 007.5 11M17 6h3v1.5a3.5 3.5 0 01-3.5 3.5M12 14v3M8.5 20.5h7M9.5 17h5v3.5h-5z"/></svg>',
  dumbbellH:'<svg viewBox="0 0 24 24" fill="currentColor"><rect x="1.5" y="9" width="2.6" height="6" rx="1"/><rect x="4.4" y="6.5" width="3.2" height="11" rx="1.2"/><rect x="7.6" y="11" width="8.8" height="2" rx=".6"/><rect x="16.4" y="6.5" width="3.2" height="11" rx="1.2"/><rect x="19.9" y="9" width="2.6" height="6" rx="1"/></svg>',
  crown:'<svg viewBox="0 0 40 34" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 30L7 9l8 12 5-16 5 16 9-12-2 20"/><path d="M15 5l1-3M24 4l2-3M33 6l3-2"/></svg>'});
function homeAvatar(){return me.avatar?`<div class="h2-av2"><span>${esc(me.avatar)}</span></div>`:`<div class="h2-av2"><img src="avatar.jpg?v=2026.11.21-15" alt=""></div>`}
function vHome(){const P=H.pc,a=H.ac,r=scoreAct(a,P),nv=r?niveauDe(r.score,P):null,col=(v,s)=>P.couleurs[lvl3(+v||0,s)];
  const ring=(v,max,id,c1,c2,R,W)=>{const C=2*Math.PI*R,p=Math.max(0,Math.min(1,v/max)),S=2*R+W+4;return`<svg viewBox="0 0 ${S} ${S}" class="ring-svg" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs><circle cx="${S/2}" cy="${S/2}" r="${R}" fill="none" stroke="#1c2433" stroke-width="${W}"/><circle cx="${S/2}" cy="${S/2}" r="${R}" fill="none" stroke="url(#${id})" stroke-width="${W}" stroke-linecap="round" stroke-dasharray="${C*p} ${C}" transform="rotate(-90 ${S/2} ${S/2})"/></svg>`};
  const cur=a&&a.semaine===semaineId(),jours=cur?+a.jours||0:0,DS=defisH();DI=DS.length?((DI%DS.length)+DS.length)%DS.length:0;const dfi=DS[DI],defiOk=dfi&&defiFait(a,dfi);
  const [a0,...aRest]=H.actus,nvC=nv?nv.c:"#22c55e";
  const stat=(ic,v,l,c)=>`<div class="hs"><span class="hs-ic">${IC[ic]}</span><div><b style="${c?`color:${c}`:""}">${v}</b><small>${l}</small></div></div>`;
  return`<div class="shell-home home2">
  <section class="h2-hero"><div class="h2-img" aria-hidden="false"><img class="bg" src="hero.jpg?v=2026.11.21-15" alt=""><button class="h2-avbtn" data-act="shTab" data-t="profilEl" aria-label="Mon profil">${homeAvatar()}</button></div>
    <div class="h2-txt"><div class="h2-date"><span>${esc(new Date().toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"}).toUpperCase())}</span><i></i></div>
      <h1>Salut <em>${esc(me.pseudo||"toi")}</em> ! <span class="wave" aria-hidden="true">👋</span></h1><p>Prêt à bouger aujourd'hui ?</p></div></section>
  ${vgHomeCard()}
  <section class="h2-card act"><div class="h2-ch"><span class="h2-ic teal">${IC.pulse}</span><h2>Mon activité physique</h2><span class="spacer"></span>${nv?`<span class="h2-chip" style="--c:${nvC}"><i></i>${nv.lab}</span>`:""}</div>
    ${r?`<div class="h2-main"><div class="h2-ring">${ring(r.score,100,"gsc","#22d3ee","#22c55e",80,14)}<div class="h2-ringv"><b>${r.score}</b><small>/100</small></div></div>
      <div class="h2-msg"><div class="h2-t" style="color:${nvC}">${nv.t}</div><div class="h2-m"><span class="h2-tr" style="color:${nvC}">${IC.trend}</span><p>${nv.m}</p></div></div>
      <div class="h2-deco" aria-hidden="true"><i style="height:38%"></i><i style="height:58%"></i><i style="height:82%"></i></div></div>
      <div class="h2-stats">${stat("shoe",fmtHM(a.min),"d'activité")}${stat("cal",`${jours} / 7`,"jours actifs")}${stat("sit",fmtH(a.sed),"de sédentarité/jour",col(a.sed,P.sed.seuils))}${stat("phone",fmtH(a.ecran),"d'écran/jour",col(a.ecran,P.ecran.seuils))}</div>
      <button class="h2-link" data-act="shConseils">Voir mes conseils <span>→</span></button>`
    :`<p class="h-empty">Saisis ton activité de la semaine pour voir ton score et des conseils adaptés.</p><button class="h-btn" data-act="shTab" data-t="profilEl">Saisir mes données</button>`}</section>
  <div class="h2-sh"><span class="h2-ic blue">${IC.mega}</span><h2>Actualités</h2><span class="spacer"></span><button class="h2-link" data-act="shActus">Tout voir <span>→</span></button></div>
  ${a0?`<section class="h2-news"><div class="hn2-tro" aria-hidden="true">${(ACTU_T[a0.type]||ACTU_T.info).ic}</div><div class="hn2-b"><span class="hn2-tag">${(ACTU_T[a0.type]||ACTU_T.info).lab}</span><h3>${esc(a0.titre)}</h3><p><span class="hn2-cal">${IC.cal}</span>${esc(dLong(a0.date).replace(/^./,m=>m.toUpperCase()))} · ${dansJours(a0.date)}</p></div>${a0.inscription&&a0.type==="competition"?`<div class="hn2-go">${etInsBtn(a0)}</div>`:a0.lien?`<a class="hn2-go" href="${esc(a0.lien)}" target="_blank" rel="noopener">S'inscrire <span>→</span></a>`:""}</section>
    ${aRest.slice(0,4).map(x=>x.inscription&&x.type==="competition"?`<div class="h2-row"><span class="h2-medal" aria-hidden="true">${(ACTU_T[x.type]||ACTU_T.info).ic}</span><div><b>${esc(x.titre)}</b><small>${esc(dLong(x.date).replace(/^./,m=>m.toUpperCase()))}${x.portee==="etab"?" · 🏫":""}</small></div><span class="spacer"></span>${etInsBtn(x)}</div>`:`<a class="h2-row" ${x.lien?`href="${esc(x.lien)}" target="_blank" rel="noopener"`:""}><span class="h2-medal" aria-hidden="true">${(ACTU_T[x.type]||ACTU_T.info).ic}</span><div><b>${esc(x.titre)}</b><small>${esc(dLong(x.date).replace(/^./,m=>m.toUpperCase()))}</small></div><span class="spacer"></span><span class="h2-chev">${IC.chev}</span></a>`).join("")}`
    :`<div class="h2-row"><span class="h2-medal" aria-hidden="true">📣</span><div><b>Pas d'actualité pour l'instant</b><small>Les compétitions et l'AS apparaîtront ici.</small></div></div>`}
  <div class="h2-sh"><span class="h2-ic blue">${IC.target}</span><h2>Mes objectifs</h2><span class="spacer"></span><button class="h2-link" data-act="shTab" data-t="progres">Voir mes progrès <span>→</span></button></div>
  <div class="h2-obj"><section class="h2-card goal"><div class="h2-ring sm">${ring(Math.min(jours,P.objectifJours),P.objectifJours,"ggo","#a855f7","#3b82f6",40,9)}<div class="h2-ringv"><b>${jours} / ${P.objectifJours}</b></div></div>
      <div class="g-txt"><b>Bouger ${P.objectifJours} jours cette semaine</b><small>${jours>=P.objectifJours?"Objectif atteint, bravo !":`Encore ${P.objectifJours-jours} jour${P.objectifJours-jours>1?"s":""} pour atteindre ton objectif !`}</small><div class="h2-bar"><i style="width:${Math.min(100,jours/P.objectifJours*100)}%"></i></div></div></section>
    <section class="h2-card defi"><div class="d-h"><span aria-hidden="true">🔥</span> ${DS.length>1?"Défis":"Défi"} de la semaine</div>${dfi?`${dfi.etab?`<span class="et-tag">🏫 Établissement</span>`:""}<b>${esc(dfi.valeur)}</b><small>${esc(dfi.texte)}</small>
      <button class="d-btn${defiOk?" ok":""}" data-act="shDefi" data-id="${dfi.id}"><span class="d-ic">${defiOk?"✅":IC.dumbbell}</span>${defiOk?"Défi relevé !":"Je relève le défi !"}</button>
      ${DS.length>1?`<div class="d-nav"><button data-act="shDefiNav" data-d="-1" aria-label="Défi précédent">‹</button>${DS.map((x,i)=>`<i class="${i===DI?"on":""}${defiFait(a,x)?" ok":""}"></i>`).join("")}<button data-act="shDefiNav" data-d="1" aria-label="Défi suivant">›</button></div>`:""}`:`<small>Pas de défi cette semaine.</small>`}</section></div>
  <div class="h2-sh"><span class="h2-ic blue">${IC.grid}</span><h2>Ton espace EPS</h2></div>
  <div class="h2-tiles"><button data-act="shTab" data-t="enclasse" class="t-blue"><span>${IC.cal}</span>Séance du jour</button><button data-act="shTab" data-t="progres" class="t-green"><span>${IC.bars}</span>Mes progrès</button>
    <button data-act="shTab" data-t="enclasse" class="t-purple"><span>${IC.people}</span>Ma classe</button><button data-act="shConseils" class="t-orange"><span>${IC.book}</span>Ressources &amp; conseils</button></div></div>`}
function vProgres(){const P=H.pc,a=H.ac,r=scoreAct(a,P),nv=r?niveauDe(r.score,P):null,cur=a&&a.semaine===semaineId(),jours=cur?+a.jours||0:0,DS=defisH(),ok=DS.filter(d=>defiFait(a,d)).length,col=(v,s)=>P.couleurs[lvl3(+v||0,s)];
  const bar=(l,v,max,txt,c)=>`<div class="pg-b"><div class="pg-bl"><span>${l}</span><b style="${c?`color:${c}`:""}">${txt}</b></div><div class="h2-bar"><i style="width:${Math.max(0,Math.min(100,v/max*100))}%;${c?`background:${c}`:""}"></i></div></div>`;
  return`<div class="shell-home ec">${vVueBanner()}
  <div class="ec-h"><button class="dos-back" data-act="shTab" data-t="home" aria-label="Retour à l'accueil">${IC.chev}</button><span class="ec-hic green">${IC.bars}</span><div><h1>Progrès</h1><p>Ton activité, tes objectifs, tes défis !</p></div><i class="ec-sw" aria-hidden="true"></i></div>
  <section class="h2-card act"><div class="h2-ch"><span class="h2-ic teal">${IC.pulse}</span><h2>Ma semaine</h2><span class="spacer"></span>${nv?`<span class="h2-chip" style="--c:${nv.c}"><i></i>${nv.lab}</span>`:""}</div>
    ${r?`<div class="pg-sc"><b style="color:${nv.c}">${r.score}</b><small>/100</small><span>${nv.t}</span></div>
      ${bar("Activité",+a.min||0,P.act.cible,`${fmtHM(a.min)} / ${fmtHM(P.act.cible)}`)}${bar("Jours actifs",jours,P.jours.cible,`${jours} / ${P.jours.cible}`)}
      ${bar("Temps assis / jour",+a.sed||0,Math.max(P.sed.seuils[1]*1.5,1),fmtH(a.sed),col(a.sed,P.sed.seuils))}${bar("Écran / jour",+a.ecran||0,Math.max(P.ecran.seuils[1]*1.5,1),fmtH(a.ecran),col(a.ecran,P.ecran.seuils))}
      <button class="h2-link" data-act="shConseils">Voir mes conseils <span>→</span></button>`
    :`<p class="h-empty">Saisis ton activité de la semaine pour suivre tes progrès.</p>`}<button class="h-btn" data-act="shTab" data-t="profilEl">${r?"Mettre à jour mes données":"Saisir mes données"}</button></section>
  <section class="h2-card"><div class="h2-ch"><span class="h2-ic blue">${IC.target}</span><h2>Objectif de la semaine</h2></div>${bar(`Bouger ${P.objectifJours} jours`,jours,P.objectifJours,`${jours} / ${P.objectifJours}`)}</section>
  <section class="h2-card"><div class="h2-ch"><span aria-hidden="true">🔥</span><h2>Défis de la semaine</h2><span class="spacer"></span>${DS.length?`<span class="h2-chip" style="--c:#f472b6"><i></i>${ok} / ${DS.length} relevé${ok>1?"s":""}</span>`:""}</div>
    ${DS.length?DS.map(d=>{const f=defiFait(a,d);return`<div class="pg-d"><div><b>${esc(d.valeur)}</b><small>${esc(d.texte)}</small></div><button class="d-btn${f?" ok":""}" data-act="shDefi" data-id="${d.id}">${f?"✅ Relevé":"Je relève !"}</button></div>`}).join(""):`<p class="h-empty" style="margin:8px 0 0">Pas de défi cette semaine.</p>`}</section></div>`}
function vBottomNav(){const t=route.name,on=k=>t===k||(k==="home"&&["conseils","actus"].includes(t))||(k==="enclasse"&&t==="dossier");
  return`<nav class="bnav" aria-label="Onglets">${[["home","house","Accueil"],["enclasse",t==="dossier"?"dbh":"people","En classe"],["profilEl","user","Profil"]].map(([k,ic,l])=>`<button data-act="shTab" data-t="${k}" aria-current="${on(k)}"><span class="${ic==="dbh"?"dbh":""}">${ic==="dbh"?IC.dumbbellH:IC[ic]}</span>${l}</button>`).join("")}</nav>`}


/* ---------- Création simplifiée : modèles, assistant, blocs, « une ligne = un critère » ---------- */
const FX=(id,type,label,x)=>({id,type,label,aide:"",unite:"",requis:true,...(x||{})});
const BLOCS={
  series:{ic:"🏋️",lab:"Séries muscu",mk:()=>FX(newId("c"),"tableau","Mes séries",{colonnes:[{id:"exo",type:"texte",label:"Exercice",options:[]},{id:"charge",type:"nombre",label:"Charge (kg)",options:[]},{id:"reps",type:"nombre",label:"Répétitions",options:[]},{id:"series",type:"nombre",label:"Séries",options:[]},{id:"recup",type:"temps",label:"Récup",options:[]}]})},
  chrono:{ic:"⏱️",lab:"Chrono",mk:()=>FX(newId("c"),"temps","Mon temps")},
  tours:{ic:"🔁",lab:"Temps de passage",mk:()=>FX(newId("c"),"passages","Mes temps de passage",{nb:4})},
  compteur:{ic:"➕",lab:"Compteur",mk:()=>FX(newId("c"),"compteur","Nombre de réussites")},
  fc:{ic:"❤️",lab:"Fréquence cardiaque",mk:()=>FX(newId("c"),"nombre","Fréquence cardiaque",{unite:"bpm"})},
  ressenti:{ic:"😮‍💨",lab:"Ressenti",mk:()=>FX(newId("c"),"echelle","Difficulté ressentie (1 facile → 10 très dur)",{min:1,max:10})},
  check:{ic:"✅",lab:"Critère oui / non",mk:()=>FX(newId("c"),"choix","Critère observé",{options:["Oui","En cours","Non"]})},
  texte:{ic:"📝",lab:"Texte libre",mk:()=>FX(newId("c"),"texte_long","Mon bilan")},
  nombre:{ic:"🔢",lab:"Nombre",mk:()=>FX(newId("c"),"nombre","Nombre")},
  choix:{ic:"🔘",lab:"Choix",mk:()=>FX(newId("c"),"choix","Choix",{options:["Choix 1","Choix 2"]})},
  note:{ic:"⭐",lab:"Note sur 10",mk:()=>FX(newId("c"),"echelle","Note",{min:0,max:10})},
  calcul:{ic:"➕",lab:"Total calculé",mk:si=>{const S=modeleEdit&&modeleEdit.draft.sections[si];const src=S?S.champs.filter(c=>["nombre","compteur","echelle","choix"].includes(c.type)).map(c=>({champ:S.id+"."+c.id})):[];return FX(newId("c"),"calcul","Total",{op:"somme",src,requis:false})}},
  pseudo:{ic:"🪪",lab:"Pseudo",mk:()=>FX(newId("c"),"pseudo","Élève",{qui:"eleve",requis:false})},
  grille:{ic:"🧮",lab:"Tableau à double entrée (note)",mk:()=>FX(newId("c"),"grille","Note lue dans le tableau",{requis:false,lignes:{titre:"Points",src:[],seuils:[0,5,10]},colonnes:{titre:"Étoiles",src:[],seuils:[0,4,8]},notes:[{v:[2,3,4]},{v:[4,6,8]},{v:[6,9,12]}]})}};
/* Une ligne = une case : le type est deviné, et peut être forcé par (compteur) (temps) (note) (oui/non) (texte) (nombre) en fin de ligne */
function lignesChamps(txt,def,coach){return String(txt||"").split(/\n/).map(x=>x.replace(/^[\s\-•*·]+/,"").trim()).filter(Boolean).slice(0,20).map(l=>{
  let k=null;const m=l.match(/\(\s*(compteur|nombre|temps|chrono|note|oui\s*\/\s*non|texte)\s*\)\s*$/i);
  if(m){l=l.slice(0,m.index).trim();const t=norm(m[1]).replace(/\s/g,"");k=t==="chrono"?"temps":t==="oui/non"?"check":t}
  else{const n=norm(l);k=/^(nombre|nb|combien)\b|repetition|\breps?\b|\bfois\b|touches|\bpoints?\b|\bpasses\b|reussi|valides?\b|\bfautes?\b|\berreurs?\b/.test(n)?"compteur":/\btemps\b|duree|chrono|secondes|\bsec\b|tenu/.test(n)?"temps":/\bnote\b|\/ ?10|sur 10/.test(n)?"note":def}
  const f=k==="compteur"?FX(newId("c"),"compteur",l):k==="temps"?FX(newId("c"),"temps",l):k==="note"?FX(newId("c"),"echelle",l,{min:0,max:10}):k==="nombre"?FX(newId("c"),"nombre",l):k==="texte"?FX(newId("c"),"texte_long",l):FX(newId("c"),"choix",l,{options:["Oui","En cours","Non"]});
  f.label=f.label.slice(0,80);if(coach)f.coach=true;
  if(estNomEleve(l)){f.type="pseudo";delete f.options;f.qui=coach||estNomJuge(l)?"juge":"eleve";f.coach=f.qui==="juge";f.requis=false}
  else if(/^(total|somme|score|nombre total|moyenne)\b/.test(norm(l))){f.type="calcul";delete f.options;f.op=/moyenne/.test(norm(l))?"moyenne":"somme";f.src=[];f.requis=false;f.coach=false}
  return f})}
const DESC4=(a,b,c,d)=>[a,b,c,d];
const TPL={
  muscu:{ic:"🏋️",nom:"Carnet de musculation",d:"Séries, charges, répétitions, ressenti",qui:"aucun",pages:"seance",
    ex:[["objectif","Objectif de la séance",1],["echauf","Échauffement",1],["ressenti","Ressenti",1],["fc","Fréquence cardiaque",0],["bilan","Bilan",1]],
    build:c=>{const av=[],ap=[];if(c.ex.objectif)av.push(FX("objectif","texte","Mon objectif du jour"));if(c.ex.echauf)av.push(FX("echauf","texte_long","Mon échauffement",{requis:false}));
      if(c.ex.ressenti)ap.push(FX("ressenti","echelle","Difficulté ressentie (1 facile → 10 très dur)",{min:1,max:10}));if(c.ex.fc)ap.push(FX("fc","nombre","Fréquence cardiaque en fin de séance",{unite:"bpm"}));if(c.ex.bilan)ap.push(FX("bilan","texte_long","Mon bilan : ce que je garde, ce que je change"));
      const se=BLOCS.series.mk();se.id="series";return{sections:[{id:"avant",titre:"Avant la séance",champs:av},{id:"seance",titre:"Ma séance",champs:[se]},{id:"apres",titre:"Après la séance",champs:ap}],
      criteres:[{id:"k_complet",afl:"AFL2",label:"Carnet complet et régulier",descripteurs:DESC4("Carnet très incomplet.","Carnet partiellement rempli.","Carnet presque complet.","Carnet complet à chaque séance."),points:[1,2,3,4],calcul:{type:"complet",champs:[],seuils:[1,.85,.5]}},
        {id:"k_charge",afl:"AFL1",label:"Je respecte les charges et répétitions prévues",descripteurs:DESC4("Rarement.","Parfois.","Souvent.","Toujours."),points:[1,2,3,4],calcul:{type:"autoeval"}}]}}},
  course:{ic:"🏃",nom:"Carnet de course",d:"Temps visé, temps de passage, régularité",qui:"coach",pages:"seance",
    ex:[["fc","Fréquence cardiaque",1],["ressenti","Ressenti",1],["bilan","Bilan",1]],
    build:c=>{const ap=[];if(c.ex.fc)ap.push(FX("fc","nombre","Fréquence cardiaque à l'arrivée",{unite:"bpm"}));if(c.ex.ressenti)ap.push(FX("ressenti","echelle","Difficulté ressentie (1 facile → 10 très dur)",{min:1,max:10}));if(c.ex.bilan)ap.push(FX("bilan","texte_long","Mon bilan"));
      return{sections:[{id:"objectif",titre:"Mon projet",champs:[FX("nbtours","nombre","Nombre de tours prévus"),FX("cible","temps","Temps visé par tour")]},{id:"course",titre:"Ma course",champs:[FX("passages","passages","Mes temps de passage",{nb:4,nbChamp:"objectif.nbtours",coach:true})]},{id:"apres",titre:"Après la course",champs:ap}],
      criteres:[{id:"k_rythme",afl:"AFL1",label:"Régularité de l'allure",descripteurs:DESC4("Décroche tôt ou course non terminée.","Décroche à partir de la moitié.","Décroche sur les 2 derniers tours.","Rythme tenu jusqu'au bout."),points:[1,2,3,4],calcul:{type:"rythme",source:{champ:"course.passages",cible:{champ:"objectif.cible"},tolerance:5}}}]}}},
  technique:{ic:"🤸",nom:"Progression technique",d:"Gym, acrosport, danse… éléments et niveau d'acquisition",qui:"groupe",pages:"cycle",
    ex:[["bilan","Bilan individuel",1]],
    build:c=>({sections:[{id:"elements",titre:"Nos éléments",champs:[FX("liste","tableau","Éléments travaillés",{colonnes:[{id:"el",type:"texte",label:"Élément",options:[]},{id:"diff",type:"choix",label:"Difficulté",options:["A","B","C","D"]},{id:"etat",type:"choix",label:"Où on en est",options:["À travailler","En cours","Acquis ✅"]}]})]},
      ...(c.ex.bilan?[{id:"bilan",titre:"Mon bilan",portee:"individuelle",champs:[FX("bilan","texte_long","Ce que je maîtrise, ce qu'il me reste à travailler")]}]:[])],
      criteres:[{id:"k_maitrise",afl:"AFL1",label:"Maîtrise des éléments",descripteurs:DESC4("Peu d'éléments maîtrisés.","Quelques éléments maîtrisés.","La plupart des éléments maîtrisés.","Tous les éléments maîtrisés."),points:[1,2,3,4],calcul:{type:"autoeval"}}]})},
  observation:{ic:"👀",nom:"Fiche d'observation",d:"Un camarade observe : critères oui / non, compteurs, chrono",qui:"coach",pages:"seance",lignes:"Dos droit pendant l'exercice\nNombre de répétitions valides\nTemps de gainage tenu",def:"check",
    ex:[["conseil","Conseil de l'observateur",1],["ressenti","Ressenti de l'élève",0]],
    build:c=>{const co=c.qui==="coach",ob=lignesChamps(c.lignes,"check",co);if(c.ex.conseil)ob.push(FX("conseil","texte_long","Mon conseil",{coach:co,requis:false}));
      return{sections:[{id:"obs",titre:"Observation",consigne:co?"Rempli par ton observateur depuis son téléphone.":"",champs:ob},...(c.ex.ressenti?[{id:"moi",titre:"Mon ressenti",champs:[FX("ressenti","echelle","Difficulté ressentie (1 facile → 10 très dur)",{min:1,max:10})]}]:[])],
      criteres:[{id:"k_obs",afl:"AFL3",label:"Observation complète",descripteurs:DESC4("Fiche presque vide.","Fiche partiellement remplie.","Fiche presque complète.","Fiche complète."),points:[1,2,3,4],calcul:{type:"complet",champs:[],seuils:[1,.85,.5]}}]}}},
  juge:{ic:"⚖️",nom:"Fiche de juge",d:"Co-évaluation : une note par critère",qui:"coach",pages:"seance",lignes:"Amplitude\nRythme\nOriginalité",def:"note",
    ex:[["conseil","Commentaire du juge",1]],
    build:c=>{const co=c.qui==="coach",ob=lignesChamps(c.lignes,"note",co);if(c.ex.conseil)ob.push(FX("conseil","texte_long","Commentaire du juge",{coach:co,requis:false}));
      return{sections:[{id:"jury",titre:"Jugement",champs:ob}],criteres:[]}}},
  vierge:{ic:"📄",nom:"Carnet vierge",d:"Partir de zéro, bloc par bloc",qui:"aucun",pages:"seance",ex:[],
    build:()=>({sections:[{id:"seance",titre:"Ma séance",champs:[FX("notes","texte_long","Ce que j'ai fait")]}],criteres:[]})}};
let CR=null;
function crStart(k){const t=TPL[k];if(!t)return;CR={k,qui:t.qui,pages:t.pages,gmin:2,gmax:4,note:true,lignes:t.lignes||"",ex:Object.fromEntries(t.ex.map(([id,,on])=>[id,!!on]))}}
function crBuild(){const t=TPL[CR.k],b=t.build(CR),dz=typeof dossier!=="undefined"&&dossier||{};
  const m={titre:t.nom,ca:dz.ca||"",apsa:dz.titre||"",description:"",themes:[],pages:CR.pages,partage:CR.qui,noteGroupe:true,groupeMin:CR.gmin,groupeMax:CR.gmax,bareme:{afl1:{max:12,table:[]}},...b};
  m.sections=m.sections.filter(S=>S.champs.length).map(S=>({consigne:"",...S}));
  m.criteres=CR.note?(m.criteres||[]).map(k=>{if(k.calcul&&k.calcul.type==="complet")k.calcul.champs=m.sections.flatMap(S=>S.champs.filter(f=>f.type!=="resume"&&(k.afl!=="AFL3"||f.coach||CR.qui!=="coach")).map(f=>S.id+"."+f.id));return k}):[];
  if(m.partage!=="coach")m.sections.forEach(S=>S.champs.forEach(f=>delete f.coach));
  return m}
function crCreate(){if(CR.k==="observation"||CR.k==="juge"){if(!String(CR.lignes).trim()){toast("Écrivez au moins un critère (une ligne = un critère).");return}}
  const m=crBuild();CR=null;startEditor({modele:null,brouillon:m});toast("Carnet prêt en bac à sable : ajustez-le, puis publiez")}
function vCreer(hasCa5){const opt=(k,v,l,ic)=>`<button type="button" class="cr-o" data-act="crSet" data-k="${k}" data-v="${v}" aria-pressed="${String(CR[k])===String(v)}">${ic?`<span>${ic}</span>`:""}${l}</button>`;
  if(dosGen)return`<section class="card stack" style="gap:8px"><div class="row"><button class="btn ghost small" data-act="crIA" data-m="">← Retour</button><h3 style="margin:0">${{fidele:"🖼️ Ma fiche d'observation cliquable",photo:"📷 À partir de ma fiche papier",phrase:"💬 Décrire mon carnet",ref:"📑 À partir du référentiel"}[dosGen]||"✨ Avec l'IA"}</h3></div>${vGenForm(dosGen)}</section>`;
  if(!CR)return`<section class="card stack" style="gap:10px"><div class="sec-h"><h3>Ajouter un carnet</h3><span class="hint">Choisissez un point de départ, tout reste modifiable</span></div>
    <div class="cr-g">${Object.entries(TPL).map(([k,t])=>`<button class="cr-t" data-act="crTpl" data-k="${k}"><span class="cr-ic">${t.ic}</span><b>${esc(t.nom)}</b><small>${esc(t.d)}</small></button>`).join("")}${hasCa5?"":`<button class="cr-t" data-act="dosAddCa5"><span class="cr-ic">🔥</span><b>Cross training CA5</b><small>Le carnet complet, prêt à l'emploi</small></button>`}</div>
    <div class="sec-h" style="margin-top:4px"><h3 style="font-size:1rem">✨ Ou laissez l'IA le préparer</h3></div>
    <div class="cr-g ia">${[["fidele","🖼️","Ma fiche d'observation cliquable","Même design que votre fiche ; pseudo et coach ajoutés"],["photo","📷","Ma fiche papier","Photo ou PDF de la fiche que vous utilisez déjà"],["phrase","💬","En une phrase","« Fiche d'observation du smash en badminton »"],["ref","📑","Mon référentiel","Carnet corrigé fidèlement au référentiel"]].map(([m,ic,l,d])=>`<button class="cr-t" data-act="crIA" data-m="${m}"><span class="cr-ic">${ic}</span><b>${l}</b><small>${esc(d)}</small></button>`).join("")}</div></section>`;
  const t=TPL[CR.k],lig=CR.k==="observation"||CR.k==="juge";
  return`<section class="card stack cr-q" style="gap:14px"><div class="row"><button class="btn ghost small" data-act="crBack">← Changer</button><h3 style="margin:0">${t.ic} ${esc(t.nom)}</h3></div>
    <div><div class="cr-l">1. Qui remplit ?</div><div class="cr-os">${opt("qui","aucun","L'élève seul","👤")}${opt("qui","coach",CR.k==="observation"||CR.k==="juge"?"Un camarade observateur":"L'élève + un coach","📣")}${opt("qui","groupe","Un groupe","👥")}</div>
      ${CR.qui==="groupe"?`<div class="row" style="margin-top:8px;gap:8px"><span class="hint">Élèves par groupe : de</span><input class="cr-n" data-cr="gmin" inputmode="numeric" value="${CR.gmin}"><span class="hint">à</span><input class="cr-n" data-cr="gmax" inputmode="numeric" value="${CR.gmax}"></div>`:""}
      ${CR.qui==="coach"?`<p class="hint" style="margin:6px 0 0">L'élève choisit un camarade qui remplit ${lig?"la fiche":"les temps et mesures"} depuis son propre téléphone.</p>`:""}</div>
    <div><div class="cr-l">2. Une page…</div><div class="cr-os">${opt("pages","seance","à chaque séance","📅")}${opt("pages","cycle","pour tout le cycle","🗂️")}</div></div>
    ${lig?`<div><div class="cr-l">3. ${CR.k==="juge"?"Les critères notés":"Ce que l'on observe"} — une ligne = un critère</div><textarea data-cr="lignes" rows="5" placeholder="Un critère par ligne">${esc(CR.lignes)}</textarea>
      <div class="cr-guess">${lignesChamps(CR.lignes,TPL[CR.k].def).map(f=>`<span class="chip">${{choix:"✅ oui / non",compteur:"➕ compteur",temps:"⏱️ chrono",echelle:"⭐ note /10",nombre:"🔢 nombre",texte_long:"📝 texte"}[f.type]} · ${esc(f.label)}</span>`).join("")}</div>
      <p class="hint" style="margin:4px 0 0">Le type est deviné (« Nombre de… » → compteur, « Temps… » → chrono). Pour le forcer, terminez la ligne par (compteur), (temps), (note), (oui/non) ou (texte).</p></div>`:""}
    ${t.ex.length?`<div><div class="cr-l">${lig?4:3}. ${lig?"À ajouter":"Ce que l'élève note en plus"}</div><div class="cr-ck">${t.ex.map(([id,l])=>`<label><input type="checkbox" data-crx="${id}" ${CR.ex[id]?"checked":""}> ${esc(l)}</label>`).join("")}</div></div>`:""}
    ${CR.k!=="vierge"&&CR.k!=="juge"?`<div><div class="cr-l">${(lig?4:3)+(t.ex.length?1:0)}. Évaluation</div><div class="cr-os">${opt("note","false","Autoévaluation seulement","🙋")}${opt("note","true","Avec correction automatique","🎯")}</div></div>`:""}
    <button class="btn primary big" data-act="crGo">Créer et voir l'aperçu →</button></section>`}
function crClick(a,b){
  if(a==="crTpl"){crStart(b.dataset.k);dosGen=false;rerenderKeep();return true}
  if(a==="crBack"){CR=null;rerenderKeep();return true}
  if(a==="crIA"){CR=null;dosGen=b.dataset.m||false;rerenderKeep();return true}
  if(a==="crSet"){const k=b.dataset.k,v=b.dataset.v;CR[k]=k==="note"?v==="true":v;rerenderKeep();return true}
  if(a==="crGo"){crCreate();return true}
  if(a==="mAddBloc"&&modeleEdit){const si=+b.dataset.si,B=BLOCS[b.dataset.k];if(!B)return true;const f=B.mk(si);mutDraft(M=>M.sections[si].champs.push(f));mFocus(M0=>M0.sections[si].id+"-"+f.id);return true}
  if(a==="mPaste"&&modeleEdit){mPasteSi=mPasteSi===+b.dataset.si?null:+b.dataset.si;rerenderKeep();return true}
  if(a==="mPasteGo"&&modeleEdit){const si=+b.dataset.si,ta=$("#mp-"+si),M=modeleEdit.draft,co=M.partage==="coach";const fs=lignesChamps(ta&&ta.value,"check",false);if(!fs.length){toast("Écrivez au moins une ligne.");return true}mPasteSi=null;mutDraft(D=>D.sections[si].champs.push(...fs));toast(fs.length+" case"+(fs.length>1?"s":"")+" ajoutée"+(fs.length>1?"s":"")+(co?" — cochez « Remplie par le coach » si besoin":""));return true}
  return false}
function crField(el,e){if(el.dataset.cr!==undefined){const k=el.dataset.cr;if(k==="lignes"){CR.lignes=el.value;if(e.type==="input"){clearTimeout(crField.t);crField.t=setTimeout(()=>{const g=document.querySelector(".cr-guess");if(g)g.innerHTML=lignesChamps(CR.lignes,TPL[CR.k].def).map(f=>`<span class="chip">${{choix:"✅ oui / non",compteur:"➕ compteur",temps:"⏱️ chrono",echelle:"⭐ note /10",nombre:"🔢 nombre",texte_long:"📝 texte"}[f.type]} · ${esc(f.label)}</span>`).join("")},250)}return true}
    CR[k]=Math.max(1,Math.min(30,parseInt(el.value)||1));return true}
  if(el.dataset.crx!==undefined){if(e.type==="change")CR.ex[el.dataset.crx]=el.checked;return true}
  return false}
let mPasteSi=null;
function vBlocs(si){return`<div class="bloc-pal"><span class="hint" style="width:100%">Ajouter :</span>${Object.entries(BLOCS).map(([k,B])=>`<button class="btn small" data-act="mAddBloc" data-k="${k}" data-si="${si}">${B.ic} ${B.lab}</button>`).join("")}<button class="btn small" data-act="mPaste" data-si="${si}">📋 Une liste (une ligne = une case)</button></div>
  ${mPasteSi===si?`<div class="stack" style="gap:6px;margin-top:8px"><textarea id="mp-${si}" rows="4" placeholder="Dos droit pendant le squat&#10;Nombre de répétitions valides&#10;Temps de gainage tenu"></textarea><p class="hint" style="margin:0">Type deviné pour chaque ligne ; forcez-le avec (compteur), (temps), (note), (oui/non), (texte) en fin de ligne.</p><button class="btn primary small" data-act="mPasteGo" data-si="${si}" style="justify-self:start">Ajouter ces cases</button></div>`:""}`}
/* Aperçu en direct à côté de l'éditeur */
function liveRefresh(){const box=$("#m-live");if(!box||!modeleEdit)return;setPreview();box.innerHTML=gSeance(curS())}
function liveSoon(){clearTimeout(liveSoon.t);liveSoon.t=setTimeout(liveRefresh,350)}
function mFocus(fn){setTimeout(()=>{try{const el=document.getElementById("mf-"+fn(modeleEdit.draft));if(el){el.scrollIntoView({behavior:"smooth",block:"center"});el.classList.add("flash");const i=el.querySelector("input");if(i){i.focus({preventScroll:true});i.select&&i.select()}setTimeout(()=>el.classList.remove("flash"),1400)}}catch(x){}},60)}
document.addEventListener("click",e=>{const live=e.target.closest("#m-live");if(!live||!modeleEdit)return;const t=e.target.closest("[id^='g-']")||(e.target.closest(".field,.gf,label,section,div")||live).querySelector("[id^='g-']");if(!t)return;
  const id=t.id.slice(2),el=document.getElementById("mf-"+id);if(!el)return;if(modeleEdit.tab!=="seance"){return}el.scrollIntoView({behavior:"smooth",block:"center"});el.classList.add("flash");setTimeout(()=>el.classList.remove("flash"),1400)});


/* ---------- Didacticiel « ? » des pages de carnet : écrans successifs générés depuis la page ---------- */
const TUTO_T={pseudo:"Cette case se remplit toute seule avec le pseudo : jamais de nom ni de prénom.",calcul:"Cette case se calcule toute seule à partir des cases au-dessus : tu n'as rien à écrire.",texte:"Écris une réponse courte.",texte_long:"Écris quelques phrases avec tes mots.",nombre:"Tape le nombre (le pavé numérique s'ouvre).",temps:"Tape le temps en minutes:secondes, par ex. 1:30.",choix:"Choisis la réponse dans la liste.",case:"Coche la case quand c'est fait.",
  echelle:"Choisis la valeur qui correspond le mieux.",compteur:"Touche + à chaque fois, − si tu t'es trompé.",tableau:"Remplis une ligne à la fois ; ajoute une ligne avec le bouton +.",passages:"Note ton temps à la fin de chaque tour.",exercices:"Une ligne par exercice : nom, répétitions, charge…",resume:"Se remplit tout seul à partir de tes réponses."};
function tutoInject(){if(!["carnet","coach","modele"].includes(route.name))return;
  document.querySelectorAll("#main .stack.seance .hero-top").forEach(h=>{if(h.closest("#m-live")||h.querySelector(".tuto-q"))return;
    h.insertAdjacentHTML("beforeend",`<button type="button" class="tuto-q" aria-label="Comment remplir cette page ?" title="Comment remplir cette page ?">?</button>`)})}
function tutoSteps(root){const M=typeof MOD!=="undefined"?MOD:null,st=[],coachPage=route.name==="coach";
  const hero=root.querySelector(".hero");
  if(hero){let t=coachPage?"Tu es le coach : tu remplis les cases de ton camarade depuis ton téléphone. Tout est enregistré tout seul.":"Cette page est ton carnet. Tes réponses sont enregistrées automatiquement, même sans réseau au gymnase.";
    if(!coachPage&&M){t+=M.pages==="cycle"?" Tu complètes la même page pendant tout le cycle.":M.pages==="plusieurs"?" Tu peux la compléter sur plusieurs séances.":" Tu crées une nouvelle page à chaque séance.";if(M.partage==="groupe")t+=" Ton groupe remplit la même page.";}
    if(hero.querySelector('input[type="date"]'))t+=" En haut à droite : vérifie la date.";
    if(hero.querySelector(".pills"))t+=" Choisis ton thème du jour en touchant une pastille.";
    st.push({el:hero,ti:"👋 Bienvenue",tx:t})}
  [...root.querySelectorAll("section.card")].forEach(sec=>{if(sec.classList.contains("hero")||!sec.offsetParent)return;
    const h=sec.querySelector("h3"),titre=h?h.textContent.trim():"",m=/^gsec-(\d+)$/.exec(sec.id||""),S=m&&M?M.sections[+m[1]]:null;let tx="",lis=[];
    if(sec.classList.contains("ff-wrap")&&M){const ls=[];M.sections.forEach(S2=>S2.champs.forEach(f=>{if(f.type==="resume")return;const coach=M.partage==="coach"&&f.coach&&!coachPage;ls.push(`<li><b>${esc(f.label)}</b> — ${coach?"📣 rempli par ton coach depuis son téléphone.":esc(f.aide||TUTO_T[f.type]||"")}</li>`)}));
      st.push({el:sec,ti:(st.length)+". Ta fiche",tx:coachPage?"C'est la fiche de ton enseignant : touche les cases 📣 pour les remplir. Si la fiche est large, fais-la glisser sur le côté.":"C'est la fiche de ton enseignant, comme sur papier. Ton coach remplit les cases 📣 depuis son téléphone ; toi, tu remplis les autres. Si la fiche est large, fais-la glisser sur le côté.",lis:ls.slice(0,14)});return}
    if(S){if(sec.classList.contains("resume")){st.push({el:sec,ti:"📊 Résumé",tx:"Ce résumé se calcule tout seul à partir de ce que tu as rempli."});return}
      if(S.consigne)tx=S.consigne;
      const seen=new Set();S.champs.forEach(f=>{if(f.type==="resume")return;const coach=M.partage==="coach"&&f.coach&&!coachPage;lis.push(`<li><b>${esc(f.label)}</b> — ${coach?"📣 rempli par ton coach depuis son téléphone.":esc(f.aide||TUTO_T[f.type]||"")}</li>`);seen.add(f.type)});
      if(M.partage==="groupe"&&S.portee==="individuelle")tx+=(tx?" ":"")+"Cette partie est personnelle : chacun remplit la sienne.";}
    else if(/autoévalue/i.test(titre))tx="Pour chaque critère, touche le niveau (1 à 4) qui te correspond le mieux. Touche un niveau pour lire ce qu'il veut dire.";
    else if(/coach/i.test(sec.textContent.slice(0,200))&&sec.querySelector("select,input"))tx="Choisis le camarade qui sera ton coach : il remplira certaines cases depuis son téléphone.";
    else{const c=[];if(sec.querySelector("textarea"))c.push("écris tes réponses dans les zones de texte");if(sec.querySelector("select"))c.push("choisis dans les listes");if(sec.querySelector('input[inputmode="numeric"],input[inputmode="decimal"]'))c.push("tape les nombres et les temps (pavé numérique)");if(sec.querySelector("button.btn:not(.danger)"))c.push("utilise les boutons pour ajouter une ligne ou un tour");
      tx=c.length?c.join(", ").replace(/^./,x=>x.toUpperCase())+".":sec.querySelector(".hint")?sec.querySelector(".hint").textContent.trim().slice(0,220):"Lis cette partie attentivement."}
    st.push({el:sec,ti:(st.length)+". "+(titre||"Partie"),tx,lis})});
  const vb=root.querySelector(".valid-bar");
  if(vb&&vb.offsetParent){const go=vb.querySelector(".go-valid");st.push({el:vb,ti:"🏁 Pour finir",tx:go?"Quand tout est rempli, touche ce bouton pour valider. Attention : après, tu ne pourras plus modifier la page. Ta note apparaît alors dans l'onglet « Bilan » en haut.":"Ici s'affiche l'état de la page."})}
  return st}
let TUTO=null;
function tutoOpen(btn){const root=btn.closest(".stack.seance")||document.querySelector("#main .stack.seance");if(!root)return;const steps=tutoSteps(root);if(!steps.length)return;TUTO={steps,i:0};
  if(!document.getElementById("tuto")){document.body.insertAdjacentHTML("beforeend",`<div id="tuto" role="dialog" aria-modal="true" aria-label="Didacticiel"><div class="tuto-hole"></div><div class="tuto-card"><div class="tuto-top"><span class="tuto-n"></span><button type="button" class="tuto-x" data-tuto="x" aria-label="Fermer">✕</button></div><h3 class="tuto-ti"></h3><p class="tuto-tx"></p><ul class="tuto-li"></ul><div class="tuto-dots"></div><div class="tuto-nav"><button type="button" class="btn" data-tuto="prev">‹ Précédent</button><button type="button" class="btn primary" data-tuto="next">Suivant ›</button></div></div></div>`);
    const T=document.getElementById("tuto");T.addEventListener("click",e=>{const b=e.target.closest("[data-tuto]");if(!b){if(e.target===T||e.target.classList.contains("tuto-hole"))tutoClose();return}const a=b.dataset.tuto;if(a==="x")tutoClose();else if(a==="prev")tutoGo(TUTO.i-1);else if(a==="next"){TUTO.i>=TUTO.steps.length-1?tutoClose():tutoGo(TUTO.i+1)}else if(a==="dot")tutoGo(+b.dataset.i)});
    let x0=null;T.addEventListener("touchstart",e=>{x0=e.touches[0].clientX},{passive:true});T.addEventListener("touchend",e=>{if(x0==null)return;const dx=e.changedTouches[0].clientX-x0;x0=null;if(Math.abs(dx)>50)tutoGo(TUTO.i+(dx<0?1:-1))});
    document.addEventListener("keydown",e=>{if(!TUTO)return;if(e.key==="Escape")tutoClose();if(e.key==="ArrowRight")tutoGo(TUTO.i+1);if(e.key==="ArrowLeft")tutoGo(TUTO.i-1)});
    window.addEventListener("resize",()=>TUTO&&tutoPlace());window.addEventListener("scroll",()=>TUTO&&tutoPlace(),{passive:true})}
  document.getElementById("tuto").hidden=false;document.body.classList.add("tuto-on");tutoGo(0)}
function tutoClose(){TUTO=null;const T=document.getElementById("tuto");if(T)T.hidden=true;document.body.classList.remove("tuto-on")}
function tutoGo(i){if(!TUTO)return;const n=TUTO.steps.length;if(i<0||i>=n)return;TUTO.i=i;const s=TUTO.steps[i],T=document.getElementById("tuto");
  T.querySelector(".tuto-n").textContent=`Étape ${i+1} / ${n}`;T.querySelector(".tuto-ti").textContent=s.ti;T.querySelector(".tuto-tx").textContent=s.tx||"";T.querySelector(".tuto-tx").hidden=!s.tx;
  const ul=T.querySelector(".tuto-li");ul.innerHTML=(s.lis||[]).slice(0,8).join("")+((s.lis||[]).length>8?`<li>… et ${(s.lis.length-8)} autre(s)</li>`:"");ul.hidden=!(s.lis||[]).length;
  T.querySelector(".tuto-dots").innerHTML=TUTO.steps.map((_,k)=>`<button type="button" data-tuto="dot" data-i="${k}" aria-label="Étape ${k+1}" aria-current="${k===i}"></button>`).join("");
  T.querySelector('[data-tuto="prev"]').disabled=i===0;T.querySelector('[data-tuto="next"]').textContent=i===n-1?"J'ai compris ✓":"Suivant ›";
  const r=s.el.getBoundingClientRect(),vh=window.innerHeight;const top=window.scrollY+r.top-Math.max(70,Math.min(140,(vh-Math.min(r.height,vh*.5))/4));window.scrollTo({top:Math.max(0,top),behavior:"smooth"});
  tutoPlace();setTimeout(tutoPlace,350)}
function tutoPlace(){if(!TUTO)return;const s=TUTO.steps[TUTO.i],T=document.getElementById("tuto"),h=T.querySelector(".tuto-hole"),c=T.querySelector(".tuto-card"),r=s.el.getBoundingClientRect(),vh=window.innerHeight,p=6;
  h.style.cssText=`left:${r.left-p}px;top:${r.top-p}px;width:${r.width+2*p}px;height:${r.height+2*p}px`;
  const ch=c.offsetHeight,below=vh-r.bottom,above=r.top;c.classList.toggle("up",!(below>ch+20)&&above>ch+20);
  c.style.top=below>ch+20?`${Math.min(vh-ch-10,r.bottom+14)}px`:above>ch+20?`${r.top-ch-14}px`:`${vh-ch-10}px`}
document.addEventListener("click",e=>{const q=e.target.closest(".tuto-q");if(!q)return;e.preventDefault();e.stopPropagation();tutoOpen(q)},true);

/* ---------- Mises à jour de l'appli ---------- */
let majVersion=null;
const vKey=v=>String(v||"").split(/[.-]/).map(x=>String(parseInt(x)||0).padStart(5,"0")).join(".");
const newer=v=>v&&v!==APP_VERSION&&vKey(v)>vKey(APP_VERSION);
function showMaj(v){if(!newer(v))return;majVersion=v;let b=$("#maj");
  if(!b){b=document.createElement("div");b.id="maj";b.className="maj";b.setAttribute("role","status");document.body.prepend(b)}
  const q=new URLSearchParams(location.search),deja=q.get("v")===String(v);
  b.innerHTML=deja?`<span>🔄 La nouvelle version arrive : elle peut mettre quelques minutes à être disponible partout.</span><button class="btn small" id="maj-go">Réessayer</button>`:`<span>🔄 Une nouvelle version de l'appli est disponible.</span><button class="btn small" id="maj-go">Mettre à jour</button>`;
  $("#maj-go").onclick=deja?async()=>{await majCache();location.replace(location.pathname+"?v="+encodeURIComponent(v)+"&r="+Date.now())}:majNow;
  if(deja)return;
  if(document.visibilityState==="hidden")majNow()}
async function majNow(){try{await Promise.race([flush(),new Promise(r=>setTimeout(r,3000))])}catch(e){}await majCache();location.replace(location.pathname+"?v="+encodeURIComponent(majVersion||"")+"&t="+Date.now())}
/* Force le navigateur à recharger les fichiers de l'appli (évite une ancienne copie gardée en cache) */
async function majCache(){const v=encodeURIComponent(majVersion||"");try{await Promise.race([Promise.all(["index.html","app.js","fb.js","ia.js","config.js","app.js?v="+v,"fb.js?v="+v,"ia.js?v="+v].map(u=>fetch(u,{cache:"reload"}).catch(()=>{}))),new Promise(r=>setTimeout(r,4000))])}catch(e){}}
async function checkVersion(){try{const r=await fetch("version.json?t="+Date.now(),{cache:"no-store"});if(!r.ok)return;const j=await r.json();showMaj(j.version)}catch(e){}}
let bc=null;try{bc=new BroadcastChannel("carnet-eps");bc.onmessage=e=>{const d=e.data||{};if(d.type==="hello"&&newer(d.v))showMaj(d.v);else if(d.type==="hello"&&d.v&&vKey(d.v)<vKey(APP_VERSION))bc.postMessage({type:"hello",v:APP_VERSION})};bc.postMessage({type:"hello",v:APP_VERSION})}catch(e){}
checkVersion();setInterval(checkVersion,5*60*1000);
let partant=false;window.addEventListener("pagehide",()=>{partant=true});
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")checkVersion();else if(majVersion&&!partant)setTimeout(()=>{if(!partant&&document.visibilityState==="hidden")majNow()},1500)});

/* ---------- Pavé numérique intégré (virgule et deux-points) ---------- */
const PAD_SEL='input[inputmode="numeric"],input[inputmode="decimal"]';
const tactile=()=>{try{return matchMedia("(pointer: coarse)").matches}catch(e){return false}};
let padField=null,padEl=null;
function padPrepare(root){if(!tactile())return;(root.querySelectorAll?root:document).querySelectorAll(PAD_SEL).forEach(i=>{if(i.dataset.pad)return;i.dataset.pad=i.getAttribute("inputmode");i.setAttribute("inputmode","none");i.setAttribute("autocomplete","off")})}
function padBuild(){if(padEl)return padEl;padEl=document.createElement("div");padEl.id="pad";padEl.className="pad";padEl.hidden=true;padEl.setAttribute("role","group");padEl.setAttribute("aria-label","Pavé numérique");
  const keys=[["1"],["2"],["3"],["⌫","del"],["4"],["5"],["6"],[":","sep"],["7"],["8"],["9"],[",","sep"],["Effacer","clear"],["0"],["Suivant","next"],["OK","ok"]];
  padEl.innerHTML=`<div class="pad-top"><span id="pad-label"></span><b id="pad-val"></b></div><div class="pad-keys">${keys.map(([k,c])=>`<button type="button" class="pk${c?" "+c:""}" data-pk="${k}">${k}</button>`).join("")}</div>`;
  padEl.addEventListener("pointerdown",e=>{const b=e.target.closest("button");e.preventDefault();if(b)padKey(b.dataset.pk)});
  document.body.appendChild(padEl);return padEl}
function padLabel(i){const l=i.closest("label");if(l){const t=[...l.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join(" ").trim();if(t)return t}return i.getAttribute("aria-label")||i.placeholder||""}
function padShow(i){padBuild();padField=i;padEl.hidden=false;document.body.classList.add("pad-open");$("#pad-label").textContent=padLabel(i);padSync();setTimeout(()=>i.scrollIntoView({block:"center",behavior:"smooth"}),50)}
function padHide(){if(!padEl)return;padEl.hidden=true;document.body.classList.remove("pad-open");padField=null}
function padSync(){if(padField)$("#pad-val").textContent=padField.value||"–"}
function padSet(v){const i=padField;if(!i)return;i.value=v;i.dispatchEvent(new Event("input",{bubbles:true}));padSync()}
function padCommit(){const i=padField;if(!i)return;i.dispatchEvent(new Event("change",{bubbles:true}))}
function padKey(k){const i=padField;if(!i)return;const v=i.value||"";
  if(k==="⌫")return padSet(v.slice(0,-1));
  if(k==="Effacer")return padSet("");
  if(k==="OK"){padCommit();padHide();i.blur();return}
  if(k==="Suivant"){const all=[...document.querySelectorAll("input[data-pad]")].filter(x=>!x.disabled&&x.offsetParent);const n=all[all.indexOf(i)+1];padCommit();if(n){setTimeout(()=>{const id=n.id;const el=id?document.getElementById(id):n;(el||n).focus()},30)}else{padHide();i.blur()}return}
  if(k===","&&(/[,.]/.test(v.split(":").pop())))return;
  if(k===":"&&v.includes(":"))return;
  padSet(v+k)}
document.addEventListener("focusin",e=>{const i=e.target;if(i.matches&&i.matches("input[data-pad]")&&!i.disabled&&!i.readOnly){if(padField&&padField!==i)padCommit();padShow(i)}else if(padField&&!(padEl&&padEl.contains(i)))padHide()});
document.addEventListener("pointerdown",e=>{if(!padField)return;if(padEl.contains(e.target)||e.target===padField)return;if(!(e.target.matches&&e.target.matches("input[data-pad]"))){padCommit();padHide()}},true);
new MutationObserver(ms=>{for(const m of ms)m.addedNodes.forEach(n=>{if(n.nodeType===1)padPrepare(n)});if(padField&&!document.body.contains(padField))padHide()}).observe(document.body,{childList:true,subtree:true});
padPrepare(document);


/* ====================================================================
   Course d'orientation (CA2) : formats de course, cartons de contrôle,
   correction importée par le prof (PDF, Excel, Numbers, CSV, photo via l'IA).
   - orient/{outilId} : réglages du prof (jamais lus par les élèves)
   - sessions/{sid} (kind "co") : cartons autorisés pour la séance
   - sessions/{sid}/corr/{carton} : correction, lisible par l'élève après validation de ce carton
   - sessions/{sid}/courses/{uid}_{carton} : chrono et réponses de l'élève
   ==================================================================== */
OUTILS.co={ic:"🧭",nom:"Course d'orientation"};
const CO_REP=["Haut","Bas","Gauche","Droite"];
const CO_FORMATS=[
  {id:"etoile",nom:"Étoile",ordre:"libre",limite:0,desc:"Tu pars du poste central vers une balise et tu reviens au centre avant de repartir vers la suivante."},
  {id:"circuit",nom:"Circuit",ordre:"impose",limite:0,desc:"Les balises s'enchaînent dans l'ordre du carton, du départ jusqu'à l'arrivée."},
  {id:"imbrique",nom:"Circuit imbriqué",ordre:"impose",limite:0,desc:"Plusieurs circuits se croisent sur la même carte : suis uniquement l'ordre de ton carton."},
  {id:"papillon",nom:"Papillon",ordre:"impose",limite:0,desc:"Des boucles successives repassent par le poste central (les ailes du papillon), dans l'ordre du carton."},
  {id:"score",nom:"Course au score",ordre:"libre",limite:20,desc:"Trouve le plus de balises possible avant la fin du temps limite, dans l'ordre que tu veux."}];
const CO_DEF={reponses:CO_REP,formats:CO_FORMATS,cartons:[],corr:{}};
const coId=()=>Math.random().toString(36).slice(2,8);
const coBal=v=>(Array.isArray(v)?v:String(v||"").split(/[\s,;\/→>]+|\s-\s/)).map(x=>String(x).trim().slice(0,12)).filter(Boolean).filter((x,i,a)=>a.indexOf(x)===i).slice(0,80);
function normCo(o){o=o||{};
  const reponses=(Array.isArray(o.reponses)?o.reponses:CO_REP).map(x=>String(x||"").trim().slice(0,16)).filter(Boolean).filter((x,i,a)=>a.indexOf(x)===i).slice(0,8);
  const formats=(Array.isArray(o.formats)&&o.formats.length?o.formats:CO_FORMATS).slice(0,12).map(f=>({id:String(f.id||coId()),nom:String(f.nom||"Format").slice(0,40),ordre:f.ordre==="impose"?"impose":"libre",limite:Math.max(0,Math.min(180,parseInt(f.limite)||0)),desc:String(f.desc||"").slice(0,300)}));
  const cartons=(Array.isArray(o.cartons)?o.cartons:[]).slice(0,80).map(c=>({id:String(c.id||coId()),nom:String(c.nom||"Carton").slice(0,40),format:formats.some(f=>f.id===c.format)?c.format:formats[0].id,balises:coBal(c.balises)}));
  const corr={};for(const c of cartons){const s=(o.corr||{})[c.id]||{};corr[c.id]={};for(const b of c.balises)if(s[b]!=null&&String(s[b]).trim())corr[c.id][b]=String(s[b]).trim().slice(0,16)}
  return{reponses,formats,cartons,corr,doc:o.doc||null}}
const CO_ARROW={haut:"↑",bas:"↓",gauche:"←",droite:"→"};
const coArrow=r=>CO_ARROW[norm(r)]||"";
const coSame=(a,b)=>!!norm(a)&&norm(a)===norm(b);
// Lit une réponse écrite dans le document du prof (H, haut, ↑, B, ←…) et la ramène à une des réponses possibles
function coNormRep(v,reps){const s=String(v??"").trim();if(!s)return"";
  const AR={"↑":"haut","⬆":"haut","⇧":"haut","▲":"haut","↓":"bas","⬇":"bas","⇩":"bas","▼":"bas","←":"gauche","⬅":"gauche","⇦":"gauche","◄":"gauche","◀":"gauche","→":"droite","➡":"droite","⇨":"droite","►":"droite","▶":"droite"};
  const n=AR[s]||AR[s[0]]||norm(s);if(!reps.length)return s.slice(0,16);
  let r=reps.find(x=>norm(x)===n);if(r)return r;
  const SYN={h:"haut",b:"bas",g:"gauche",d:"droite",up:"haut",down:"bas",left:"gauche",right:"droite",nord:"haut",sud:"bas",ouest:"gauche",est:"droite",n:"haut",s:"bas",o:"gauche",e:"droite"};
  if(SYN[n]){r=reps.find(x=>norm(x)===SYN[n]);if(r)return r}
  if(n.length<=2){const c=reps.filter(x=>norm(x).startsWith(n));if(c.length===1)return c[0]}
  return s.slice(0,16)}
function coScore(k,c,corr){const B=(k&&k.balises)||[],rep=(c&&c.rep)||{};let ok=0,nr=0;
  B.forEach(b=>{if(rep[b])nr++;if(corr&&corr[b]&&coSame(rep[b],corr[b]))ok++});
  return{n:B.length,ok,rep:nr,pending:!corr||!Object.keys(corr).length,ms:c&&c.fin&&c.debut?c.fin-c.debut:null}}
const fmtDur=ms=>{if(ms==null||isNaN(ms))return"–";const s=Math.max(0,Math.floor(ms/1000)),h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60;return(h?h+":"+String(m).padStart(2,"0"):m)+":"+String(x).padStart(2,"0")};

/* ---------- Élève : choisir son carton, chrono, réponses, correction ---------- */
let CO=null,coTimer=null,coSaveT=null,coWake=null;
async function openCo(x,tab){RETRY=()=>openCo(x,tab);go("loading",{msg:"Ouverture de la course d'orientation…"});
  try{const all=(await fb.listSessionsOutil(me.classeId,me.profId,x.id).catch(e=>{console.warn(e);return[]})).sort((a,b)=>String(b.date).localeCompare(String(a.date)));
    const S=all.find(s=>s.active)||null;CO={x,S,all,mine:{},corr:{},tab:tab||"run",pick:null,voir:null,hist:null};
    if(S&&!me.apercu){const L=await fb.listMesCourses(S.id,me.uid);L.forEach(c=>CO.mine[c.cartonId]=c);for(const c of L.filter(c=>c.fini))await coLoadCorr(S.id,c.cartonId)}
    go("co");coTick();const r=coRun();if(r&&!r.fin)coWakeOn()}
  catch(e){console.error(e);go("error",{msg:authMsg(e)})}}
async function coLoadCorr(sid,cid){const k=sid+"/"+cid;if(CO.corr[k])return CO.corr[k];
  try{const d=await fb.getCorr(sid,cid);CO.corr[k]=(d&&d.rep)||null}catch(e){console.warn(e);CO.corr[k]=null}return CO.corr[k]}
const coRun=()=>CO&&CO.S?Object.values(CO.mine).find(c=>!c.fini)||null:null;
const coCarton=id=>CO&&CO.S?(CO.S.cartons||[]).find(k=>k.id===id)||null:null;
function coTick(){clearInterval(coTimer);coTimer=setInterval(()=>{
  if(route.name==="co"){const c=coRun(),el=document.getElementById("co-t");if(c&&el&&!c.fin){const t=Date.now()-c.debut,k=coCarton(c.cartonId);el.textContent=fmtDur(t);if(k&&k.limite)el.parentElement.classList.toggle("over",t>k.limite*60000)}}
  else if(route.name==="coProf")document.querySelectorAll("[data-live]").forEach(el=>el.textContent=fmtDur(Date.now()-(+el.dataset.live)));
  else{clearInterval(coTimer);coTimer=null}},1000)}
async function coWakeOn(){try{if(!coWake&&navigator.wakeLock&&document.visibilityState==="visible"){coWake=await navigator.wakeLock.request("screen");coWake.addEventListener("release",()=>{coWake=null})}}catch(e){}}
function coWakeOff(){try{if(coWake)coWake.release()}catch(e){}coWake=null}
function vCo(){const{x,S}=CO,c=coRun();
  const seg=`<div class="seg2">${[["run","Ma course"],["res","Mes résultats"]].map(([k,l])=>`<button data-act="coTab" data-t="${k}" aria-current="${CO.tab===k}">${l}</button>`).join("")}</div>`;
  let body;
  if(CO.voir)body=vCoVoir();
  else if(CO.tab==="res")body=vCoRes();
  else if(!S)body=`<section class="card co-empty"><p style="margin:0"><b>Pas de séance ouverte pour l'instant.</b><br>Ton enseignant ouvre la course d'orientation au début du cours. Tes anciennes courses sont dans « Mes résultats ».</p><button class="btn small" data-act="coReload" style="margin-top:10px">↻ Actualiser</button></section>`;
  else if(c)body=vCoRun(c);
  else if(CO.pick)body=vCoPick(coCarton(CO.pick));
  else body=vCoList();
  return`<div class="stack co-page"><div class="row"><button class="btn ghost small" data-act="coBack">← ${esc(dossierCtx&&dossier?dossier.titre:"Retour")}</button>${c?"":`<span class="spacer"></span><button class="btn ghost small" data-act="coReload" aria-label="Actualiser">↻</button>`}</div>
  <section class="class-hero co-hero"><span class="eyebrow">CA2 · ${S?`Séance du ${fmtDate(S.date)}`:"Course d'orientation"}</span><h2>🧭 ${esc(x.titre||"Course d'orientation")}</h2></section>
  ${c||CO.pick||CO.voir?"":seg}${body}</div>`}
function vCoList(){const S=CO.S,ks=S.cartons||[];
  return`<p class="hint" style="margin:0">Choisis ton carton de contrôle. Au départ, le chrono démarre : il ne s'arrête qu'à ton retour au point d'arrivée.</p>
  <div class="co-list">${ks.map(k=>{const c=CO.mine[k.id],sc=c?coScore(k,c,CO.corr[S.id+"/"+k.id]):null;
    return`<button class="co-k${c?" done":""}" data-act="${c?"coVoir":"coPick"}" data-id="${esc(k.id)}"><span class="co-ki">🗺️</span><span class="co-kt"><b>${esc(k.nom)}</b><small>${esc(k.format||"")} · ${k.balises.length} balise${k.balises.length>1?"s":""}${k.limite?` · ${k.limite} min`:""}</small></span>${c?`<span class="co-ks">${sc.pending?"✅":`${sc.ok}/${sc.n}`}<small>${fmtDur(sc.ms)}</small></span>`:`<span class="chip">Choisir →</span>`}</button>`}).join("")||'<p class="hint">Aucun carton pour cette séance.</p>'}</div>`}
function vCoPick(k){if(!k)return"";
  return`<section class="card stack co-pick" style="gap:12px"><div class="sec-h"><h3>🗺️ ${esc(k.nom)}</h3><span class="spacer"></span><span class="chip">${esc(k.format||"")}</span></div>
  ${k.desc?`<p style="margin:0">${esc(k.desc)}</p>`:""}
  <div class="co-bals">${k.balises.map((b,i)=>`<span>${k.ordre==="impose"?`<small>${i+1}</small>`:""}${esc(b)}</span>`).join("")}</div>
  <p class="hint" style="margin:0">${k.ordre==="impose"?"<b>Ordre imposé</b> : passe aux balises dans l'ordre du carton.":"<b>Ordre libre</b> : choisis ton itinéraire."}${k.limite?` Temps limite : <b>${k.limite} min</b>.`:""}</p>
  <div class="co-warn">⏱️ Quand tu touches « Départ », le chrono démarre. <b>Il ne peut pas être arrêté</b> avant ton retour au point d'arrivée.</div>
  <button class="btn primary big co-go" data-act="coStart" data-id="${esc(k.id)}">▶ Départ</button><button class="btn ghost small" data-act="coPickNo">← Choisir un autre carton</button></section>`}
function vCoRun(c){const S=CO.S,k=coCarton(c.cartonId)||{balises:[],nom:"Carton"},reps=S.reponses||[],fin=!!c.fin,nb=k.balises.filter(b=>!c.rep[b]).length;
  return`<section class="co-chrono${fin?" stop":""}${!fin&&k.limite&&Date.now()-c.debut>k.limite*60000?" over":""}"><small>${fin?"🏁 Temps de course":"⏱️ Chrono en cours · il s'arrête à ton arrivée"}</small><b id="co-t">${fmtDur((c.fin||Date.now())-c.debut)}</b>${k.limite?`<span>Temps limite : ${k.limite} min</span>`:""}</section>
  <section class="card stack" style="gap:10px"><div class="sec-h"><h3>🗺️ ${esc(k.nom)}</h3><span class="spacer"></span><span class="chip">${esc(k.format||"")}</span></div>
    <p class="hint" style="margin:0">${k.ordre==="impose"?"Ordre imposé : suis l'ordre du carton.":"Ordre libre."} Pour chaque balise, note ce que tu trouves sur le poste.</p>
    <div class="co-rows">${k.balises.map((b,i)=>`<div class="co-b${c.rep[b]?" ok":""}"><div class="co-bn">${k.ordre==="impose"?`<small>${i+1}</small>`:""}<span>Balise</span><b>${esc(b)}</b></div>
      ${reps.length?`<div class="co-r">${reps.map(r=>`<button data-act="coRep" data-b="${esc(b)}" data-v="${esc(r)}" aria-pressed="${coSame(c.rep[b],r)}">${coArrow(r)?`<i>${coArrow(r)}</i>`:""}<span>${esc(r)}</span></button>`).join("")}</div>`
        :`<input class="co-in" data-co="rep" data-b="${esc(b)}" value="${esc(c.rep[b]||"")}" maxlength="16" placeholder="Code du poste" autocomplete="off">`}</div>`).join("")}</div></section>
  ${fin?`<section class="card stack" style="gap:8px">${nb?`<p class="err" style="margin:0">${nb} balise${nb>1?"s":""} sans réponse.</p>`:`<p style="margin:0">Toutes les balises ont une réponse.</p>`}<button class="btn primary big" data-act="coValider">✅ Valider mon carton</button><p class="hint" style="margin:0">Après validation, ton carton est corrigé et tes réponses ne peuvent plus être modifiées.</p></section>`
    :`<button class="btn big co-stop" data-act="coArrivee">🏁 Je suis arrivé · stopper le chrono</button>`}`}
function vCoVoir(){const{sid,cid}=CO.voir,isCur=CO.S&&sid===CO.S.id,S=isCur?CO.S:CO.all.find(s=>s.id===sid),k=S&&(S.cartons||[]).find(x=>x.id===cid);
  const c=isCur?CO.mine[cid]:((CO.hist||{})[sid]||[]).find(z=>z.cartonId===cid);if(!k||!c)return`<button class="btn" data-act="coVoirNo">← Retour</button>`;
  const C=CO.corr[sid+"/"+cid],sc=coScore(k,c,C);
  return`<section class="co-res"><div><small>${esc(k.nom)} · ${esc(k.format||"")}</small><b>${sc.pending?"Correction en attente":`${sc.ok} / ${sc.n}`}</b><span>${sc.pending?"Ton enseignant n'a pas encore saisi la correction de ce carton (ou tu n'as pas de réseau).":`balise${sc.ok>1?"s":""} juste${sc.ok>1?"s":""}`}</span></div><div class="co-rt"><small>Temps</small><b>${fmtDur(sc.ms)}</b></div></section>
  <section class="card"><table class="co-tab"><thead><tr><th>Balise</th><th>Ta réponse</th>${sc.pending?"":"<th>Correction</th><th></th>"}</tr></thead><tbody>${k.balises.map(b=>{const r=(c.rep||{})[b]||"",ok=!sc.pending&&coSame(r,C[b]);
    return`<tr class="${sc.pending?"":ok?"ok":"ko"}"><td><b>${esc(b)}</b></td><td>${r?`${coArrow(r)} ${esc(r)}`:"—"}</td>${sc.pending?"":`<td>${C[b]?`${coArrow(C[b])} ${esc(C[b])}`:"?"}</td><td>${ok?"✅":"❌"}</td>`}</tr>`}).join("")}</tbody></table></section>
  <div class="row"><button class="btn" data-act="coVoirNo">← Retour</button>${sc.pending?`<button class="btn ghost small" data-act="coReCorr">↻ Réessayer la correction</button>`:""}</div>`}
function vCoRes(){if(!CO.hist){if(!CO.histL)coLoadHist();return`<div class="center-msg"><div class="spinner"></div></div>`}
  const out=CO.all.map(S=>{const L=CO.hist[S.id]||[];if(!L.length)return"";
    return`<section class="card"><div class="sec-h"><h3>${fmtDate(S.date)}</h3>${S.active?'<span class="chip">En cours</span>':""}</div><div class="co-list">${L.map(c=>{const k=(S.cartons||[]).find(x=>x.id===c.cartonId)||{nom:"Carton",balises:[]},sc=coScore(k,c,CO.corr[S.id+"/"+c.cartonId]);
      return`<button class="co-k done" data-act="${c.fini?"coVoir":"coTab"}" data-t="run" data-sid="${S.id}" data-id="${esc(c.cartonId)}"><span class="co-ki">🗺️</span><span class="co-kt"><b>${esc(k.nom)}</b><small>${esc(k.format||"")}</small></span><span class="co-ks">${!c.fini?"En cours":sc.pending?"✅":`${sc.ok}/${sc.n}`}<small>${fmtDur(sc.ms)}</small></span></button>`}).join("")}</div></section>`}).join("");
  return out||`<section class="card"><p style="margin:0">Tu n'as pas encore fait de course d'orientation.</p></section>`}
async function coLoadHist(){CO.histL=true;const h={};
  try{for(const S of CO.all){const L=me.apercu?[]:await fb.listMesCourses(S.id,me.uid);h[S.id]=L.sort((a,b)=>(a.debut||0)-(b.debut||0));for(const c of L.filter(c=>c.fini))await coLoadCorr(S.id,c.cartonId)}}catch(e){console.warn(e)}
  CO.hist=h;CO.histL=false;if(route.name==="co")rerenderKeep()}
async function coStart(cid){if(apercuBloque())return;const S=CO.S,k=coCarton(cid);if(!k||coRun())return;
  const c={eleveUid:me.uid,login:me.login||"",profId:me.profId,classeId:me.classeId,sessionId:S.id,cartonId:cid,debut:Date.now(),fin:null,rep:{},fini:false};
  CO.mine[cid]=c;CO.pick=null;render();window.scrollTo(0,0);coWakeOn();
  try{await fb.setCourse(S.id,me.uid+"_"+cid,c)}catch(e){console.error(e);delete CO.mine[cid];coWakeOff();toast(authMsg(e));if(route.name==="co")render()}}
function coSave(c,now){if(me.apercu)return;clearTimeout(coSaveT);const run=()=>fb.updateCourse(CO.S.id,me.uid+"_"+c.cartonId,{rep:c.rep,maj:Date.now()}).catch(e=>{console.warn(e);toast(authMsg(e))});if(now)return run();coSaveT=setTimeout(run,400)}
function coSetRep(b,v,toggle){const c=coRun();if(!c||c.fini)return;v=String(v||"").trim().slice(0,16);if(!v||(toggle&&coSame(c.rep[b],v)))delete c.rep[b];else c.rep[b]=v;coSave(c)}
function coArrivee(){const c=coRun();if(!c||c.fin)return;
  confirmBox("Tu es au point d'arrivée ?","Le chrono s'arrête définitivement. Tu pourras encore vérifier tes réponses avant de valider ton carton.","Stopper le chrono",async()=>{closeModal();
    clearTimeout(coSaveT);c.fin=Date.now();coWakeOff();render();window.scrollTo(0,0);
    if(!me.apercu)fb.updateCourse(CO.S.id,me.uid+"_"+c.cartonId,{rep:c.rep,fin:c.fin,maj:Date.now()}).catch(e=>{console.warn(e);toast(authMsg(e))})})}
function coValider(){const c=coRun();if(!c||!c.fin)return;const k=coCarton(c.cartonId),nb=k?k.balises.filter(b=>!c.rep[b]).length:0;
  confirmBox("Valider ton carton ?",(nb?`Il reste <b>${nb} balise${nb>1?"s":""} sans réponse</b>. `:"")+"Après validation, tu ne pourras plus rien modifier.","Valider",async()=>{closeModal();
    clearTimeout(coSaveT);const sid=CO.S.id;c.fini=true;c.valideAt=Date.now();CO.voir={sid,cid:c.cartonId};render();window.scrollTo(0,0);
    if(me.apercu)return;
    try{await fb.updateCourse(sid,me.uid+"_"+c.cartonId,{rep:c.rep,fin:c.fin,fini:true,valideAt:c.valideAt});delete CO.corr[sid+"/"+c.cartonId];await coLoadCorr(sid,c.cartonId);if(route.name==="co")rerenderKeep()}
    catch(e){console.error(e);toast(authMsg(e))}})}
function coBack(){coWakeOff();CO=null;if(dossierCtx)openDossier(dossierCtx.id);else openActs()}
// Lien « Mes résultats » du dossier de l'activité
let qRepsDos={};
function qResItems(its){return its.filter(x=>x.t==="qcm"&&qRepsDos[x.id]).map(x=>`<div class="dl-it fiche"><span class="dl-ic">📝</span><div class="dl-t"><b>${esc(x.titre)}</b><small>Ton QCM : ${qRepsDos[x.id].essais||1} essai${(qRepsDos[x.id].essais||1)>1?"s":""}</small></div><button class="dl-go" data-act="qOpen" data-id="${x.id}">Voir ${IC.arrow}</button></div>`).join("")}
function coResItems(its){return its.filter(x=>x.t==="outil"&&x.kind==="co").map(x=>`<div class="dl-it outil"><span class="dl-ic">${IC.trophy}</span><div class="dl-t"><b>${esc(x.titre)}</b><small>Tes cartons, tes temps et la correction</small></div><button class="dl-go" data-act="coOpenRes" data-id="${x.id}">Voir ${IC.arrow}</button></div>`).join("")}

/* ---------- Prof : formats, cartons et correction (orient/{outilId}) ---------- */
let CC=null,ccSaveT=null;
async function openCoCfg(oid,from){RETRY=()=>openCoCfg(oid,from);go("loading",{msg:"Chargement des cartons…"});
  try{const it=((dossier&&dossier.items)||[]).find(x=>x.id===oid);if(!it)throw{code:"not-found"};let o=await fb.getOrient(oid).catch(()=>null);
    if(!o){o={profId:me.uid,...normCo(CO_DEF)};await fb.setOrient(oid,o)}
    CC={id:oid,it,o:normCo(o),imp:null,open:null,busy:"",msg:"",msgErr:false,saved:true,from:from||null,file:null};go("coCfg")}
  catch(e){console.error(e);go("error",{msg:authMsg(e)})}}
function ccSave(now){CC.saved=false;clearTimeout(ccSaveT);const s0=$("#cc-saved");if(s0)s0.textContent="Enregistrement…";
  const id=CC.id,o=CC.o,run=async()=>{try{await fb.setOrient(id,{profId:me.uid,...o,maj:new Date().toISOString()});if(CC&&CC.id===id){CC.saved=true;const s=$("#cc-saved");if(s)s.textContent="✓ Enregistré"}}catch(e){toast(authMsg(e))}};
  if(now)return run();ccSaveT=setTimeout(run,600)}
function ccBack(){clearTimeout(ccSaveT);const f=CC.from,p=CC.saved?null:ccSave(true);CC=null;Promise.resolve(p).then(()=>{if(f)openOutilProf(f.cid,f.did,f.oid);else openDossierEd(dossier.id)})}
const ccCorrN=(o,c)=>c.balises.filter(b=>o.corr[c.id]&&o.corr[c.id][b]).length;
function vCoCfg(){const o=CC.o,F=o.formats,reps=o.reponses;
  const fmt=F.map((f,i)=>`<div class="cc-f"><div class="cc-fr"><label class="f">Nom<input data-cc="f.nom" data-i="${i}" value="${esc(f.nom)}" maxlength="40"></label><label class="f">Ordre des balises<select data-cc="f.ordre" data-i="${i}"><option value="libre" ${f.ordre==="libre"?"selected":""}>Libre</option><option value="impose" ${f.ordre==="impose"?"selected":""}>Imposé</option></select></label><label class="f">Temps limite (min)<input data-cc="f.limite" data-i="${i}" inputmode="numeric" value="${f.limite||""}" placeholder="aucun"></label><button class="btn ghost small danger" data-act="ccFDel" data-i="${i}" aria-label="Supprimer le format" ${F.length<2?"disabled":""}>✕</button></div>
    <label class="f">Consigne affichée à l'élève<input data-cc="f.desc" data-i="${i}" value="${esc(f.desc)}" maxlength="300"></label></div>`).join("");
  const cartons=o.cartons.map((c,i)=>{const n=ccCorrN(o,c),open=CC.open===c.id,full=c.balises.length&&n===c.balises.length;
    return`<div class="cc-c${open?" open":""}"><div class="cc-cr"><input data-cc="c.nom" data-i="${i}" value="${esc(c.nom)}" maxlength="40" aria-label="Nom du carton"><select data-cc="c.format" data-i="${i}" aria-label="Format">${F.map(f=>`<option value="${esc(f.id)}" ${c.format===f.id?"selected":""}>${esc(f.nom)}</option>`).join("")}</select><input data-cc="c.balises" data-i="${i}" value="${esc(c.balises.join(", "))}" placeholder="ex. 4, 12, 7, 31" aria-label="Balises du carton"><button class="cc-st ${full?"ok":"ko"}" data-act="ccOpenC" data-id="${esc(c.id)}" aria-expanded="${open}">${c.balises.length?`${full?"✓":"⚠"} ${n}/${c.balises.length}`:"—"}</button><button class="btn ghost small danger" data-act="ccCDel" data-i="${i}" aria-label="Supprimer le carton">✕</button></div>
    ${open?`<div class="cc-corr">${c.balises.length?c.balises.map(b=>{const v=(o.corr[c.id]||{})[b]||"",bad=v&&reps.length&&!reps.includes(v);
      return`<div class="cc-cb${bad?" bad":""}${v?"":" vide"}"><b>${esc(b)}</b>${reps.length?`<div class="co-r sm" style="grid-template-columns:repeat(${reps.length},1fr)">${reps.map(r=>`<button data-act="ccRep" data-c="${esc(c.id)}" data-b="${esc(b)}" data-v="${esc(r)}" aria-pressed="${v===r}" title="${esc(r)}">${coArrow(r)||esc(r.slice(0,3))}</button>`).join("")}</div>${bad?`<small>« ${esc(v)} » non reconnu</small>`:""}`
        :`<input data-cc="corr" data-c="${esc(c.id)}" data-b="${esc(b)}" value="${esc(v)}" maxlength="16" aria-label="Réponse de la balise ${esc(b)}">`}</div>`}).join(""):'<p class="hint" style="margin:0">Indiquez d\'abord les balises du carton.</p>'}</div>`:""}</div>`}).join("");
  return`<div class="stack cc-page"><div class="row"><button class="btn ghost small" data-act="ccBack">← ${esc(CC.from?CC.from.nom:(dossier&&dossier.titre)||"Retour")}</button><span class="spacer"></span><span class="hint" id="cc-saved">${CC.saved?"✓ Enregistré":"Enregistrement…"}</span></div>
  <section class="class-hero"><span class="eyebrow">CA2 · ${esc((dossier&&dossier.titre)||"")}</span><h2>🧭 ${esc(CC.it.titre||"Course d'orientation")}</h2></section>
  <section class="card stack" style="gap:8px"><h3>1. Réponses possibles sur les postes</h3>
    <label class="f">Séparées par des virgules<input data-cc="reponses" value="${esc(reps.join(", "))}" placeholder="Haut, Bas, Gauche, Droite"></label>
    <p class="hint" style="margin:0">Ce sont les boutons que l'élève touche pour chaque balise (par exemple l'orientation du symbole trouvé sur le poste). Laissez vide pour que l'élève recopie un code libre (lettres, chiffres).</p></section>
  <section class="card stack" style="gap:10px"><div class="sec-h"><h3>2. Formats de course</h3><span class="spacer"></span><button class="btn small" data-act="ccFAdd">+ Format</button></div>${fmt}</section>
  <section class="card stack" style="gap:10px"><div class="sec-h"><h3>3. Cartons de contrôle</h3><span class="spacer"></span><button class="btn small" data-act="ccCAdd">+ Carton</button></div>
    <p class="hint" style="margin:0">Un carton = un parcours : son format et ses balises (dans l'ordre pour un format à ordre imposé). Touchez ✓ / ⚠ pour vérifier ou corriger la correction du carton.</p>
    ${o.cartons.length?`<div class="cc-cs"><div class="cc-cr cc-head"><span>Carton</span><span>Format</span><span>Balises</span><span>Corr.</span><span></span></div>${cartons}</div>`:'<p style="margin:0">Aucun carton pour l\'instant. Ajoutez-les ici, ou importez votre document de correction ci-dessous : l\'appli peut créer un carton par ligne du document.</p>'}
    <div class="row" style="gap:6px;align-items:end"><label class="f" style="width:90px">Nombre<input id="cc-nb" inputmode="numeric" value="6"></label><label class="f" style="flex:1;min-width:130px">Nom<input id="cc-pre" value="Carton" maxlength="30"></label><button class="btn small" data-act="ccCMany">+ Créer plusieurs cartons</button></div></section>
  ${vCcImport()}</div>`}
function vCcImport(){const I=CC.imp,o=CC.o,canIA=CC.file&&(/pdf$/i.test(CC.file.name)||/^image\//.test(CC.file.type));
  let h=`<section class="card stack" style="gap:10px"><h3>4. Correction des balises</h3>
   <p class="hint" style="margin:0">Importez le document qui contient la correction (PDF, Excel, Numbers, CSV ou photo). L'appli lit le tableau, puis vous reliez chaque carton à sa ligne (ou sa colonne) : la correction se remplit toute seule. Vérifiez-la ensuite carton par carton (✓ / ⚠ ci-dessus).</p>
   <label class="f">Document de correction<input type="file" id="cc-file" accept=".pdf,.xlsx,.xls,.numbers,.ods,.csv,.txt,image/*"></label>
   ${CC.busy?`<p class="hint" style="margin:0">⏳ ${esc(CC.busy)}</p>`:""}${CC.msg?`<p class="${CC.msgErr?"err":"cc-ok"}" style="margin:0">${esc(CC.msg)}</p>`:""}
   ${!I&&canIA&&!CC.busy?`<button class="btn small" data-act="ccIA" style="justify-self:start">✨ Lire le document avec l'IA</button>`:""}
   ${o.doc&&o.doc.nom?`<p class="hint" style="margin:0">Dernier document relié : ${esc(o.doc.nom)}${o.doc.date?` (${fmtDate(String(o.doc.date).slice(0,10))})`:""}</p>`:""}`;
  if(!I)return h+`</section>`;
  const T=ccTable(),lc=ccLc(T),labels=ccLignes(T),L=I.sens==="ligne"?"ligne":"colonne";
  h+=`<div class="cc-imp stack" style="gap:10px">${I.sheets.length>1?`<label class="f">Feuille / page<select data-cc="imp.si">${I.sheets.map((s,i)=>`<option value="${i}" ${I.si===i?"selected":""}>${esc(s.nom)}</option>`).join("")}</select></label>`:""}
    <div class="grid2"><label class="f">Le document est rangé…<select data-cc="imp.sens"><option value="ligne" ${I.sens==="ligne"?"selected":""}>une ligne par carton (balises en colonnes)</option><option value="col" ${I.sens==="col"?"selected":""}>une colonne par carton (balises en lignes)</option></select></label>
    <label class="f">${L[0].toUpperCase()+L.slice(1)} des numéros de balise<select data-cc="imp.h">${T.slice(0,40).map((r,i)=>`<option value="${i}" ${I.h===i?"selected":""}>${L} ${i+1} : ${esc(r.filter(Boolean).slice(0,7).join(" · ").slice(0,48))}</option>`).join("")}</select></label></div>
    ${vCcPreview(T,lc)}
    ${o.cartons.length?`<div class="stack" style="gap:6px"><b>Relier chaque carton à sa ${L}</b>${o.cartons.map(c=>`<label class="cc-map"><span>${esc(c.nom)}</span><select data-cc="imp.map" data-c="${esc(c.id)}"><option value="">— pas dans ce document —</option>${labels.map(l=>`<option value="${l.i}" ${I.map[c.id]===l.i?"selected":""}>${esc(l.lab)} · ${l.n} réponse${l.n>1?"s":""}</option>`).join("")}</select></label>`).join("")}</div>
      <div class="row"><button class="btn primary" data-act="ccApply">Relier et remplir la correction</button>${labels.some(l=>!Object.values(I.map).includes(l.i))?`<button class="btn small" data-act="ccFromDoc">+ Créer les cartons manquants</button>`:""}</div>`
    :`<button class="btn primary" data-act="ccFromDoc" style="justify-self:start">Créer un carton par ${L} du document (${labels.length})</button>`}
    ${I.ia||!canIA?"":`<p class="hint" style="margin:0">Tableau mal lu (PDF scanné, cases décalées) ? <button class="btn ghost small" data-act="ccIA">✨ Lire avec l'IA</button></p>`}</div>`;
  return h+`</section>`}
function vCcPreview(T,lc){const I=CC.imp,R=T.slice(0,14),nc=Math.min(16,Math.max(0,...R.map(r=>r.length)));
  return`<div class="scroll cc-prev"><table><tbody>${R.map((r,i)=>`<tr class="${i===I.h?"h":""}">${Array.from({length:nc},(_,j)=>`<td class="${j===lc?"lc":""}">${esc(String(r[j]||"").slice(0,14))}</td>`).join("")}</tr>`).join("")}</tbody></table>${T.length>14?`<p class="hint" style="margin:4px 0 0">… ${T.length-14} ${I.sens==="ligne"?"lignes":"colonnes"} de plus</p>`:""}</div>`}
/* Lecture du tableau importé */
const coTr=R=>{const n=Math.max(0,...R.map(r=>r.length));return Array.from({length:n},(_,j)=>R.map(r=>r[j]==null?"":r[j]))};
function coTrim(rows){let R=(rows||[]).slice(0,300).map(r=>(r||[]).slice(0,120).map(x=>String(x??"").replace(/\s+/g," ").trim()));
  R=R.filter(r=>r.some(Boolean));if(!R.length)return[];
  if(R.filter(r=>r.filter(Boolean).length>=3).length>=3)R=R.filter(r=>r.filter(Boolean).length>=2);   // titres et pieds de page
  const n=Math.max(...R.map(r=>r.length));R=R.map(r=>Array.from({length:n},(_,j)=>r[j]||""));
  const keep=[...Array(n).keys()].filter(j=>R.some(r=>r[j]));return R.map(r=>keep.map(j=>r[j]))}
function ccTable(){const I=CC.imp,R=(I.sheets[I.si]||{rows:[]}).rows;return I.sens==="col"?coTr(R):R}
const coIdLike=s=>/^(balise|bal\.?|b|n°|no)?\s*\d{1,3}[a-z]?$/i.test(String(s).trim())||/^[a-z]\d{0,2}$/i.test(String(s).trim());
function ccLc(T){const n=Math.max(0,...T.map(r=>r.length));for(let j=0;j<Math.min(n,4);j++){const col=T.map(r=>r[j]).filter(Boolean);if(col.length>=Math.max(2,T.length*.4)&&col.filter(coIdLike).length<col.length*.6)return j}return 0}
const coBk=s=>norm(s).replace(/^(balise|bal\.?|n°|no)\s*/,"").replace(/^0+(?=\d)/,"");
function ccLignes(T){const I=CC.imp,lc=ccLc(T),H=T[I.h]||[];const out=[];
  T.forEach((r,i)=>{if(i===I.h)return;let n=0;H.forEach((b,j)=>{if(j!==lc&&String(b).trim()&&String(r[j]||"").trim())n++});if(n)out.push({i,lab:String(r[lc]||"").trim()||`${I.sens==="ligne"?"Ligne":"Colonne"} ${i+1}`,n})});return out}
function ccDetect(){const I=CC.imp,R=(I.sheets[I.si]||{rows:[]}).rows;let best=null;
  for(const sens of["ligne","col"]){const T=sens==="col"?coTr(R):R,lc=ccLc(T);
    for(let i=0;i<Math.min(T.length,15);i++){const cells=T[i].filter((x,j)=>j!==lc&&x),ids=cells.filter(coIdLike).length;
      if(ids>=2&&ids>=cells.length*.6){const sc=ids*10-i*3+(T.length-1);if(!best||sc>best.sc)best={sens,h:i,sc};break}}}
  I.sens=best?best.sens:"ligne";I.h=best?best.h:0;ccAutoMap()}
function ccAutoMap(){const I=CC.imp,T=ccTable(),labels=ccLignes(T),o=CC.o,dig=s=>(String(s).match(/\d+/g)||[]).join("-");I.map={};
  for(const c of o.cartons){const l=labels.find(l=>coBk(l.lab)===coBk(c.nom))||labels.find(l=>norm(l.lab).includes(norm(c.nom))||norm(c.nom).includes(norm(l.lab)))||labels.find(l=>dig(l.lab)&&dig(l.lab)===dig(c.nom));if(l)I.map[c.id]=l.i}
  if(!Object.keys(I.map).length&&labels.length===o.cartons.length)o.cartons.forEach((c,k)=>I.map[c.id]=labels[k].i)}
function ccValsOf(T,r){const I=CC.imp,lc=ccLc(T),H=T[I.h]||[],row=T[r]||[],vals=[];H.forEach((b,j)=>{b=String(b||"").trim();if(j===lc||!b)return;const v=String(row[j]||"").trim();if(v)vals.push([b,v])});return vals}
function ccApply(){const I=CC.imp,o=CC.o,T=ccTable();let nc=0,nr=0,bad=0,miss=0;
  for(const c of o.cartons){const r=I.map[c.id];if(r==null||r==="")continue;const vals=ccValsOf(T,r),byK={};vals.forEach(([b,v])=>byK[coBk(b)]=v);
    if(!c.balises.length)c.balises=coBal(vals.map(x=>x[0]));
    const corr={...(o.corr[c.id]||{})};for(const b of c.balises){const v=byK[coBk(b)];if(v==null){miss++;continue}const x=coNormRep(v,o.reponses);corr[b]=x;nr++;if(o.reponses.length&&!o.reponses.includes(x))bad++}
    o.corr[c.id]=corr;nc++}
  if(!nc){CC.msg="Reliez au moins un carton à une ligne du document.";CC.msgErr=true;rerenderKeep();return}
  o.doc={nom:I.nom,date:new Date().toISOString(),sens:I.sens};
  CC.msg=`Correction remplie pour ${nc} carton${nc>1?"s":""} (${nr} réponses).`+(bad?` ${bad} réponse${bad>1?"s":""} non reconnue${bad>1?"s":""} : à vérifier (⚠).`:"")+(miss?` ${miss} balise${miss>1?"s":""} des cartons absente${miss>1?"s":""} du document.`:"");CC.msgErr=false;
  ccSave();rerenderKeep()}
function ccFromDoc(){const I=CC.imp,o=CC.o,T=ccTable(),used=new Set(Object.values(I.map));let n=0;
  for(const l of ccLignes(T)){if(used.has(l.i))continue;const c={id:coId(),nom:l.lab.slice(0,40),format:o.formats[0].id,balises:coBal(ccValsOf(T,l.i).map(x=>x[0]))};o.cartons.push(c);o.corr[c.id]={};I.map[c.id]=l.i;n++}
  if(n)toast(`${n} carton${n>1?"s":""} créé${n>1?"s":""} : choisissez leur format`);ccApply()}
async function ccImport(f){if(!f)return;CC.busy="Lecture du document…";CC.msg="";CC.msgErr=false;CC.file=f;CC.imp=null;rerenderKeep();
  try{const n=f.name.toLowerCase();let sheets,ia=false;
    if(/\.pdf$/.test(n)||f.type==="application/pdf")sheets=await coLirePdf(f);
    else if(/\.(csv|txt)$/.test(n))sheets=[{nom:f.name,rows:coCsv(await f.text())}];
    else if(/^image\//.test(f.type)){sheets=await ccIaSheets(f);ia=true}
    else sheets=await coLireTableur(f);
    sheets=sheets.map(s=>({nom:s.nom,rows:coTrim(s.rows)})).filter(s=>s.rows.length);
    if(!sheets.length)throw new Error(/\.pdf$/.test(n)?"Aucun texte trouvé dans ce PDF (document scanné ?). Touchez « Lire le document avec l'IA ».":"Le document semble vide.");
    CC.imp={nom:f.name,sheets,si:0,sens:"ligne",h:0,map:{},ia};ccDetect();CC.busy=""}
  catch(e){console.error(e);CC.busy="";CC.imp=null;CC.msg=e.message||String(e);CC.msgErr=true}
  if(route.name==="coCfg")rerenderKeep()}
async function ccIaSheets(f){CC.busy="L'IA lit le document (30 secondes à 1 minute)…";if(route.name==="coCfg")rerenderKeep();const ia=await import("./ia.js?v=2026.11.21-15");
  try{const mime=f.type||(/\.pdf$/i.test(f.name)?"application/pdf":"image/jpeg"),r=await ia.lireTableau({fichiers:[{mime,base64:await fileToB64(f)}],cle:IAKEY});
    return((r&&r.tableaux)||[]).map((t,i)=>({nom:t.nom||`Tableau ${i+1}`,rows:(t.lignes||[]).map(l=>(Array.isArray(l)?l:[]).map(x=>String(x??"")))}))}
  catch(e){throw new Error(ia.iaMessage(e))}}
async function ccIA(){const f=CC.file;if(!f)return;CC.msg="";CC.msgErr=false;
  try{const sheets=(await ccIaSheets(f)).map(s=>({nom:s.nom,rows:coTrim(s.rows)})).filter(s=>s.rows.length);if(!sheets.length)throw new Error("L'IA n'a trouvé aucun tableau dans ce document.");
    CC.imp={nom:f.name,sheets,si:0,sens:"ligne",h:0,map:{},ia:true};ccDetect();CC.busy=""}
  catch(e){CC.busy="";CC.msg=e.message||String(e);CC.msgErr=true}if(route.name==="coCfg")rerenderKeep()}
function coCsv(t){const L=String(t).replace(/^﻿/,"").split(/\r?\n/).filter(l=>l.trim()),f=L[0]||"",d=[";","\t",","].sort((a,b)=>f.split(b).length-f.split(a).length)[0];
  return L.map(l=>{const out=[];let cur="",q=false;for(let i=0;i<l.length;i++){const ch=l[i];if(q){if(ch==='"'&&l[i+1]==='"'){cur+='"';i++}else if(ch==='"')q=false;else cur+=ch}else if(ch==='"')q=true;else if(ch===d){out.push(cur);cur=""}else cur+=ch}out.push(cur);return out})}
// PDF : texte de chaque page rangé en lignes (même hauteur) et en colonnes (même position)
async function coLirePdf(f){const pdfjs=await import(PDFJS);pdfjs.GlobalWorkerOptions.workerSrc=PDFJS_W;const doc=await pdfjs.getDocument({data:new Uint8Array(await f.arrayBuffer())}).promise,sheets=[];
  for(let p=1;p<=Math.min(doc.numPages,12);p++){const tc=await(await doc.getPage(p)).getTextContent(),it=[];
    for(const i of tc.items){const s=String(i.str||"").trim();if(!s)continue;const x=i.transform[4],y=i.transform[5],w=i.width||s.length*5,h=Math.abs(i.transform[3])||10,toks=s.split(/\s+/);
      if(toks.length>=3&&toks.every(t=>t.length<=4)){let off=0;for(const t of toks){const k=s.indexOf(t,off);it.push({s:t,x:x+w*(k+t.length/2)/s.length,y,h});off=k+t.length}}
      else it.push({s,x:x+w/2,y,h})}
    if(!it.length)continue;it.sort((a,b)=>b.y-a.y);
    const lines=[];for(const i of it){const L=lines.find(l=>Math.abs(l.y-i.y)<=Math.max(2.5,i.h*.45));if(L)L.it.push(i);else lines.push({y:i.y,it:[i]})}
    const xs=[];for(const l of lines)for(const i of l.it){const C=xs.find(c=>Math.abs(c.x-i.x)<=Math.max(5,i.h*.7));if(C){C.x=(C.x*C.n+i.x)/(C.n+1);C.n++}else xs.push({x:i.x,n:1})}
    xs.sort((a,b)=>a.x-b.x);
    let rows=lines.sort((a,b)=>b.y-a.y).map(l=>{const r=new Array(xs.length).fill("");for(const i of l.it.sort((a,b)=>a.x-b.x)){let k=0,bd=1e9;xs.forEach((c,j)=>{const dd=Math.abs(c.x-i.x);if(dd<bd){bd=dd;k=j}});r[k]=r[k]?r[k]+" "+i.s:i.s}return r});
    // Fusionne les colonnes voisines jamais remplies sur la même ligne (libellés de longueurs différentes)
    for(let j=0;j<xs.length-1;){const near=xs[j+1].x-xs[j].x<40,clash=rows.some(r=>r[j]&&r[j+1]);if(near&&!clash){rows=rows.map(r=>{const m=[...r];m[j]=m[j]||m[j+1];m.splice(j+1,1);return m});xs.splice(j+1,1)}else j++}
    sheets.push({nom:`Page ${p}`,rows})}
  return sheets}
// Tableurs : lecteur .xlsx intégré (sans réseau), SheetJS pour Numbers, .xls et .ods
const XLSX_URL="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";
const coScript=u=>new Promise((ok,ko)=>{const s=document.createElement("script");s.src=u;s.onload=ok;s.onerror=()=>ko(new Error("Chargement impossible"));document.head.appendChild(s)});
async function coLireTableur(f){const buf=await f.arrayBuffer(),n=f.name.toLowerCase();
  if(/\.xlsx$/.test(n)){try{return await coLireXlsx(buf)}catch(e){console.warn("xlsx intégré",e)}}
  try{if(!window.XLSX)await coScript(XLSX_URL);const wb=XLSX.read(new Uint8Array(buf),{type:"array"});return wb.SheetNames.map(s=>({nom:s,rows:XLSX.utils.sheet_to_json(wb.Sheets[s],{header:1,raw:false,defval:""})}))}
  catch(e){console.warn("SheetJS",e);if(/\.numbers$/.test(n))throw new Error("Ce fichier Numbers n'a pas pu être lu. Dans Numbers : Fichier › Exporter vers › Excel (ou PDF), puis importez ce fichier.");
    throw new Error("Ce fichier n'a pas pu être lu. Enregistrez-le en Excel (.xlsx), CSV ou PDF puis réessayez.")}}
async function coUnzip(buf){const dv=new DataView(buf),u8=new Uint8Array(buf);let e=u8.length-22;while(e>=0&&dv.getUint32(e,true)!==0x06054b50)e--;if(e<0)throw new Error("zip");
  const n=dv.getUint16(e+10,true);let p=dv.getUint32(e+16,true);const files={},td=new TextDecoder();
  for(let i=0;i<n;i++){const meth=dv.getUint16(p+10,true),csz=dv.getUint32(p+20,true),nl=dv.getUint16(p+28,true),xl=dv.getUint16(p+30,true),cl=dv.getUint16(p+32,true),off=dv.getUint32(p+42,true),name=td.decode(u8.subarray(p+46,p+46+nl));
    const st=off+30+dv.getUint16(off+26,true)+dv.getUint16(off+28,true);files[name]={meth,data:u8.subarray(st,st+csz)};p+=46+nl+xl+cl}
  return async name=>{const f=files[name];if(!f)return null;if(f.meth===0)return td.decode(f.data);return new Response(new Blob([f.data]).stream().pipeThrough(new DecompressionStream("deflate-raw"))).text()}}
async function coLireXlsx(buf){const get=await coUnzip(buf),P=s=>new DOMParser().parseFromString(s,"application/xml"),tags=(d,t)=>[...d.getElementsByTagName(t)];
  const ss=[],sx=await get("xl/sharedStrings.xml");if(sx)tags(P(sx),"si").forEach(si=>ss.push(tags(si,"t").map(t=>t.textContent).join("")));
  const wb=P(await get("xl/workbook.xml")),rx=await get("xl/_rels/workbook.xml.rels"),rm={};if(rx)tags(P(rx),"Relationship").forEach(r=>rm[r.getAttribute("Id")]=r.getAttribute("Target"));
  const col=ref=>{const m=/^([A-Z]+)/.exec(ref||"");let c=0;if(m)for(const ch of m[1])c=c*26+ch.charCodeAt(0)-64;return c-1},out=[];
  for(const s of tags(wb,"sheet")){const rid=s.getAttribute("r:id")||[...s.attributes].find(a=>a.localName==="id")?.value,t=String(rm[rid]||"").replace(/^\/?(xl\/)?/,""),x=t&&await get("xl/"+t);if(!x)continue;const rows=[];
    tags(P(x),"row").forEach(r=>{const ri=(+r.getAttribute("r")||rows.length+1)-1,row=rows[ri]=[];tags(r,"c").forEach((c,k)=>{const j=c.getAttribute("r")?col(c.getAttribute("r")):k,ty=c.getAttribute("t"),v=tags(c,"v")[0];
      row[j]=ty==="s"?(ss[+(v&&v.textContent)]||""):ty==="inlineStr"?tags(c,"t").map(z=>z.textContent).join(""):(v?v.textContent:"")})});
    out.push({nom:s.getAttribute("name")||"Feuille",rows:Array.from(rows,r=>Array.from(r||[],z=>z||""))})}
  return out}

/* ---------- Prof : séance de la classe (cartons autorisés, résultats en direct) ---------- */
let CP=null,cpUnsub=null;
async function openCoProf(cls,d,item){RETRY=()=>openCoProf(cls,d,item);
  const[o,sessions,eleves0,vig]=await Promise.all([fb.getOrient(item.id).catch(()=>null),fb.listSessions(me.uid,cls.id,item.id),fb.listEleves(cls.id),fb.listVigie(me.uid,cls.id).catch(()=>[])]);
  const eleves=eleves0.sort((a,b)=>(a.numero||0)-(b.numero||0));
  await Promise.all(eleves.map(async e=>{if(pseudoCache[e.id])return;try{const l=await fb.getLogin(e.login);if(l&&l.pseudo)pseudoCache[e.id]=l.pseudo}catch(x){}}));
  sessions.sort((a,b)=>String(b.date).localeCompare(String(a.date)));const O=normCo(o||CO_DEF);
  CP={cls,d,item,o:O,sessions,eleves,vig:Object.fromEntries(vig.map(v=>[v.id,v])),S:null,courses:[],corr:{},editSel:false,draftDate:dloc(Date.now())};
  const act=sessions.find(s=>s.active);if(act)await cpShow(act);else go("coProf");coTick()}
async function cpShow(S){if(cpUnsub){cpUnsub();cpUnsub=null}CP.S=S;CP.courses=[];CP.corr={};CP.editSel=false;
  try{(await fb.listCorr(S.id)).forEach(c=>CP.corr[c.id]=c.rep||{})}catch(e){console.warn(e)}
  cpUnsub=fb.watchCourses(S.id,L=>{if(!CP||CP.S!==S)return;CP.courses=L;if(route.name==="coProf")rerenderKeep()});go("coProf");coTick()}
const cpCartons=sel=>sel.map(c=>{const f=CP.o.formats.find(f=>f.id===c.format)||{};return{id:c.id,nom:c.nom,balises:c.balises,format:f.nom||"",ordre:f.ordre||"libre",limite:f.limite||0,desc:f.desc||""}});
async function cpSendCorr(S,ids){for(const id of ids){const rep=CP.o.corr[id]||{};await fb.setCorr(S.id,id,{rep});CP.corr[id]=rep}}
function vCpSel(sel){const o=CP.o;return`<div class="cp-sel">${o.cartons.filter(c=>c.balises.length).map(c=>{const n=ccCorrN(o,c),f=o.formats.find(f=>f.id===c.format);
  return`<label><input type="checkbox" class="cp-ck" value="${esc(c.id)}" ${sel.includes(c.id)?"checked":""}><span><b>${esc(c.nom)}</b> <span class="hint">${esc(f?f.nom:"")} · ${c.balises.length} balises · ${n===c.balises.length?"correction ✓":`<span class="cp-warn">correction ${n}/${c.balises.length}</span>`}</span></span></label>`}).join("")}</div>`}
const vgDayCell=(uid,date)=>{const v=CP.vig[uid],j=v&&v.j&&v.j[date];if(!j)return`<span class="hint">0</span>`;return`${j.n?`<b class="vg-hot">${j.n}</b>`:"0"}${j.nv?` <span class="hint" title="À confirmer (iPhone)">+${j.nv}?</span>`:""}`};
function vCoProf(){const{cls,d,item,o,S}=CP,ok=o.cartons.filter(c=>c.balises.length);let body="";
  if(!ok.length)body=`<section class="card stack" style="gap:8px"><h3>Préparez d'abord vos cartons</h3><p style="margin:0">Indiquez vos formats de course et vos cartons de contrôle, puis importez votre document de correction.</p><button class="btn primary" data-act="cpCfg" style="justify-self:start">🗺️ Cartons et correction</button></section>`;
  if(S){const by={};CP.courses.forEach(c=>{(by[c.eleveUid]=by[c.eleveUid]||[]).push(c)});const K=id=>(S.cartons||[]).find(k=>k.id===id)||{nom:"?",balises:[]};
    const rows=CP.eleves.map(e=>{const L=(by[e.id]||[]).sort((a,b)=>(a.debut||0)-(b.debut||0)),who=`<td>${e.numero}</td><td>${esc(pseudoCache[e.id]||e.login)}</td>`;
      if(!L.length)return`<tr class="none">${who}<td colspan="3" class="hint">Pas encore parti</td><td>${vgDayCell(e.id,S.date)}</td><td></td></tr>`;
      return L.map((c,j)=>{const k=K(c.cartonId),sc=coScore(k,c,CP.corr[c.cartonId]);
        const st=!c.fin?`<span class="cp-run">⏱️ <span data-live="${c.debut}">${fmtDur(Date.now()-c.debut)}</span></span>`:!c.fini?"🏁 Arrivé, pas validé":sc.pending?"✅ Validé · correction ?":`<b>${sc.ok}/${sc.n}</b>`;
        return`<tr>${j?"<td></td><td></td>":who}<td>${esc(k.nom)}</td><td>${st}</td><td>${c.fin?fmtDur(c.fin-c.debut):""}</td><td>${j?"":vgDayCell(e.id,S.date)}</td><td><button class="btn ghost small" data-act="cpDelC" data-id="${esc(c.id)}" aria-label="Annuler cette course" title="Annuler : l'élève pourra refaire ce carton">↺</button></td></tr>`}).join("")}).join("");
    const nv=CP.courses.filter(c=>c.fini).length,nr=CP.courses.filter(c=>!c.fin).length;
    body+=`<section class="card stack" style="gap:10px"><div class="sec-h"><h3>${S.active?"🟢 Séance ouverte aux élèves":"Séance du "+fmtDate(S.date)}</h3><span class="spacer"></span>${S.active?`<button class="btn danger small" data-act="cpClose">Clôturer</button>`:`<button class="btn small" data-act="cpReopen">Rouvrir</button>`}</div>
      ${CP.editSel?`<div><b>Cartons autorisés</b>${vCpSel(CP.editSel)}</div><div class="row"><button class="btn primary small" data-act="cpSelSave">Enregistrer</button><button class="btn ghost small" data-act="cpSelNo">Annuler</button></div>`
        :`<div class="pchips">${(S.cartons||[]).map(k=>`<span class="chip">${esc(k.nom)} · ${esc(k.format)} · ${k.balises.length} bal.</span>`).join("")}</div>
        <div class="row"><button class="btn small" data-act="cpSelEd">Modifier les cartons autorisés</button><button class="btn small" data-act="cpCorr">Renvoyer la correction</button><button class="btn ghost small" data-act="cpCfg">🗺️ Cartons et correction</button></div>`}</section>
    <section class="card stack" style="gap:8px"><div class="sec-h"><h3>Résultats</h3><span class="spacer"></span><span class="hint">${nv} validé${nv>1?"s":""} · ${nr} en course</span><button class="btn small" data-act="cpCsv">Export CSV</button></div>
      <div class="scroll"><table class="ids cp-tab"><thead><tr><th>N°</th><th>Élève</th><th>Carton</th><th>Résultat</th><th>Temps</th><th title="Sorties de l'appli ce jour-là">📵</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>
      <p class="hint" style="margin:0">Mise à jour en direct. ↺ annule une course : l'élève pourra refaire ce carton. 📵 : sorties de l'appli pendant le créneau d'EPS ce jour-là (onglet « Téléphone » de la classe).</p></section>
    <button class="btn ghost small" data-act="cpNew" style="justify-self:start">+ Préparer une nouvelle séance</button>`}
  else if(ok.length)body+=`<section class="card stack" style="gap:10px"><h3>Préparer la séance</h3><label class="f" style="max-width:200px">Date<input type="date" id="cp-date" value="${CP.draftDate}"></label>
      <div><b>Cartons que les élèves peuvent utiliser</b>${vCpSel(ok.map(c=>c.id))}</div>
      <button class="btn primary big" data-act="cpOpen">Ouvrir la séance aux élèves</button></section>`;
  const hist=CP.sessions.filter(s=>!s.active&&(!S||s.id!==S.id));
  return`<div class="stack"><div class="row"><button class="btn ghost small" data-act="cpBack">← ${esc(cls.nom)}</button>${ok.length&&!S?`<span class="spacer"></span><button class="btn ghost small" data-act="cpCfg">🗺️ Cartons et correction</button>`:""}</div>
  <section class="class-hero"><span class="eyebrow">${esc(d.titre)} · ${esc(cls.nom)}</span><h2>🧭 ${esc(item.titre||"Course d'orientation")}</h2></section>${body}
  ${hist.length?`<section class="card"><div class="sec-h"><h3>Séances précédentes</h3></div><div class="list-s">${hist.map(s=>`<button class="s-item" data-act="cpHist" data-id="${s.id}"><div><strong>${fmtDate(s.date)}</strong><div class="hint">${(s.cartons||[]).length} carton(s)</div></div><span class="chip">Voir →</span></button>`).join("")}</div></section>`:""}</div>`}
const cpChecked=()=>[...document.querySelectorAll(".cp-ck:checked")].map(x=>x.value);
async function cpOpen(){const ids=cpChecked(),o=CP.o,sel=o.cartons.filter(c=>ids.includes(c.id)&&c.balises.length);if(!sel.length){toast("Cochez au moins un carton");return}
  const date=($("#cp-date")||{}).value||dloc(Date.now());
  try{for(const s of CP.sessions.filter(s=>s.active)){await fb.updateSession(s.id,{active:false});s.active=false}
    const S={profId:me.uid,classeId:CP.cls.id,dossierId:CP.d.id,outilId:CP.item.id,kind:"co",titre:CP.item.titre||"Course d'orientation",date,active:true,reponses:o.reponses,cartons:cpCartons(sel)};
    S.id=await fb.createSession(S);await cpSendCorr(S,sel.map(c=>c.id));CP.sessions.unshift(S);toast("Séance ouverte : les élèves choisissent leur carton");await cpShow(S)}
  catch(e){console.error(e);toast(authMsg(e))}}
async function cpSelSave(){const ids=cpChecked(),sel=CP.o.cartons.filter(c=>ids.includes(c.id)&&c.balises.length);if(!sel.length){toast("Cochez au moins un carton");return}
  try{const cartons=cpCartons(sel);await fb.updateSession(CP.S.id,{cartons});await cpSendCorr(CP.S,sel.map(c=>c.id));CP.S.cartons=cartons;CP.editSel=false;toast("Cartons autorisés mis à jour");rerenderKeep()}catch(e){toast(authMsg(e))}}
async function cpCorr(){try{const o=await fb.getOrient(CP.item.id);if(o)CP.o=normCo(o);const ids=(CP.S.cartons||[]).map(k=>k.id);await cpSendCorr(CP.S,ids);toast("Correction renvoyée : les résultats sont recalculés");rerenderKeep()}catch(e){toast(authMsg(e))}}
function cpCsv(){const S=CP.S,K=id=>(S.cartons||[]).find(k=>k.id===id)||{nom:"?",balises:[]},q=v=>`"${String(v??"").replace(/"/g,'""')}"`;
  const L=[["N°","Identifiant","Pseudo","Carton","Format","Balises justes","Balises","Temps (s)","Temps","Statut","Sorties appli","Sorties à confirmer"]];
  for(const e of CP.eleves){const v=CP.vig[e.id],j=v&&v.j&&v.j[S.date]||{};const cs=CP.courses.filter(c=>c.eleveUid===e.id);
    if(!cs.length)L.push([e.numero,e.login,pseudoCache[e.id]||"","","","","","","","pas parti",j.n||0,j.nv||0]);
    for(const c of cs){const k=K(c.cartonId),sc=coScore(k,c,CP.corr[c.cartonId]);L.push([e.numero,e.login,pseudoCache[e.id]||"",k.nom,k.format,c.fini&&!sc.pending?sc.ok:"",sc.n,sc.ms!=null?Math.round(sc.ms/1000):"",fmtDur(sc.ms),!c.fin?"en course":!c.fini?"arrivé":"validé",j.n||0,j.nv||0])}}
  const blob=new Blob(["﻿"+L.map(r=>r.map(q).join(";")).join("\r\n")],{type:"text/csv;charset=utf-8"}),a=document.createElement("a");
  a.href=URL.createObjectURL(blob);a.download=`orientation_${CP.cls.nom}_${S.date}.csv`.replace(/[^\w.\-]+/g,"_");document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)}

/* ---------- Actions et champs (course d'orientation, compteur de sorties) ---------- */
function coClick(a,b){
  // Élève
  if(a==="coTab"){CO.tab=b.dataset.t;CO.voir=null;CO.pick=null;if(CO.tab==="res")CO.hist=null;rerenderKeep();return true}
  if(a==="coPick"){CO.pick=b.dataset.id;render();window.scrollTo(0,0);return true}
  if(a==="coPickNo"){CO.pick=null;render();return true}
  if(a==="coStart"){coStart(b.dataset.id);return true}
  if(a==="coRep"){coSetRep(b.dataset.b,b.dataset.v,true);rerenderKeep();return true}
  if(a==="coArrivee"){coArrivee();return true}
  if(a==="coValider"){coValider();return true}
  if(a==="coVoir"){CO.voir={sid:b.dataset.sid||(CO.S&&CO.S.id),cid:b.dataset.id};render();window.scrollTo(0,0);return true}
  if(a==="coVoirNo"){CO.voir=null;render();return true}
  if(a==="coReCorr"){const{sid,cid}=CO.voir;delete CO.corr[sid+"/"+cid];coLoadCorr(sid,cid).then(()=>rerenderKeep());return true}
  if(a==="coReload"){openCo(CO.x,CO.tab);return true}
  if(a==="coBack"){coBack();return true}
  if(a==="coOpenRes"){const x=dossierItems.find(y=>y.id===b.dataset.id);if(x)openCo(x,"res");return true}
  // Prof : cartons et correction
  if(a==="ccOpen"){openCoCfg(b.dataset.id);return true}
  if(a==="ccBack"){ccBack();return true}
  if(!CC&&/^cc/.test(a))return true;
  if(a==="ccFAdd"){CC.o.formats.push({id:coId(),nom:"Nouveau format",ordre:"libre",limite:0,desc:""});ccSave();rerenderKeep();return true}
  if(a==="ccFDel"){const f=CC.o.formats[+b.dataset.i];if(!f||CC.o.formats.length<2)return true;CC.o.formats.splice(+b.dataset.i,1);CC.o.cartons.forEach(c=>{if(c.format===f.id)c.format=CC.o.formats[0].id});ccSave();rerenderKeep();return true}
  if(a==="ccCAdd"){const c={id:coId(),nom:`Carton ${CC.o.cartons.length+1}`,format:CC.o.formats[0].id,balises:[]};CC.o.cartons.push(c);CC.o.corr[c.id]={};ccSave();rerenderKeep();return true}
  if(a==="ccCMany"){const n=Math.max(1,Math.min(40,parseInt(($("#cc-nb")||{}).value)||1)),p=(($("#cc-pre")||{}).value||"Carton").trim().slice(0,30)||"Carton",d0=CC.o.cartons.length;
    for(let k=1;k<=n;k++){const c={id:coId(),nom:`${p} ${d0+k}`,format:CC.o.formats[0].id,balises:[]};CC.o.cartons.push(c);CC.o.corr[c.id]={}}ccSave();rerenderKeep();return true}
  if(a==="ccCDel"){const c=CC.o.cartons[+b.dataset.i];if(!c)return true;confirmBox("Supprimer ce carton ?",`« ${esc(c.nom)} » et sa correction seront supprimés.`,"Supprimer",async()=>{closeModal();CC.o.cartons=CC.o.cartons.filter(x=>x.id!==c.id);delete CC.o.corr[c.id];if(CC.imp)delete CC.imp.map[c.id];ccSave();rerenderKeep()},true);return true}
  if(a==="ccOpenC"){CC.open=CC.open===b.dataset.id?null:b.dataset.id;rerenderKeep();return true}
  if(a==="ccRep"){const m=CC.o.corr[b.dataset.c]=CC.o.corr[b.dataset.c]||{};if(m[b.dataset.b]===b.dataset.v)delete m[b.dataset.b];else m[b.dataset.b]=b.dataset.v;ccSave();rerenderKeep();return true}
  if(a==="ccApply"){ccApply();return true}
  if(a==="ccFromDoc"){ccFromDoc();return true}
  if(a==="ccIA"){if(!CC.busy)ccIA();return true}
  return false}
function cpClick(a,b){if(!CP)return true;
  if(a==="cpBack"){if(cpUnsub){cpUnsub();cpUnsub=null}const c=CP.cls.id;CP=null;openClasse(c,"activites");return true}
  if(a==="cpCfg"){if(cpUnsub){cpUnsub();cpUnsub=null}dossier=CP.d;dossierCtx=null;const f={cid:CP.cls.id,did:CP.d.id,oid:CP.item.id,nom:CP.cls.nom};openCoCfg(CP.item.id,f);return true}
  if(a==="cpOpen"){cpOpen();return true}
  if(a==="cpNew"){if(cpUnsub){cpUnsub();cpUnsub=null}CP.S=null;CP.courses=[];render();return true}
  if(a==="cpHist"){const s=CP.sessions.find(z=>z.id===b.dataset.id);if(s)cpShow(s);return true}
  if(a==="cpSelEd"){CP.editSel=(CP.S.cartons||[]).map(k=>k.id);rerenderKeep();return true}
  if(a==="cpSelNo"){CP.editSel=false;rerenderKeep();return true}
  if(a==="cpSelSave"){cpSelSave();return true}
  if(a==="cpCorr"){cpCorr();return true}
  if(a==="cpCsv"){cpCsv();return true}
  if(a==="cpClose"){confirmBox("Clôturer la séance ?","Les élèves ne pourront plus commencer de carton. Ceux qui sont en course pourront encore terminer et valider. Vous pourrez la rouvrir.","Clôturer",async()=>{try{await fb.updateSession(CP.S.id,{active:false});CP.S.active=false;closeModal();toast("Séance clôturée");render()}catch(x){closeModal();toast(authMsg(x))}});return true}
  if(a==="cpReopen"){(async()=>{try{for(const s of CP.sessions.filter(z=>z.active&&z.id!==CP.S.id)){await fb.updateSession(s.id,{active:false});s.active=false}await fb.updateSession(CP.S.id,{active:true});CP.S.active=true;toast("Séance rouverte");render()}catch(x){toast(authMsg(x))}})();return true}
  if(a==="cpDelC"){const c=CP.courses.find(z=>z.id===b.dataset.id);if(!c)return true;confirmBox("Annuler cette course ?","Les réponses et le temps de l'élève pour ce carton seront effacés : il pourra le refaire.","Annuler la course",async()=>{try{await fb.deleteCourse(CP.S.id,c.id);closeModal();toast("Course annulée")}catch(x){closeModal();toast(authMsg(x))}},true);return true}
  return false}
function coField(el,e){
  if(el.dataset.co==="rep"){if(e.type==="change"||e.type==="input"){coSetRep(el.dataset.b,el.value);const row=el.closest(".co-b");if(row)row.classList.toggle("ok",!!el.value.trim())}return}
  const k=el.dataset.cc;if(k===undefined||!CC)return;const o=CC.o,i=+el.dataset.i;
  if(k==="imp.si"||k==="imp.sens"||k==="imp.h"||k==="imp.map"){if(e.type!=="change")return;const I=CC.imp;
    if(k==="imp.si"){I.si=+el.value;ccDetect()}else if(k==="imp.sens"){I.sens=el.value;I.h=0;const T=ccTable();for(let r=0;r<Math.min(T.length,15);r++){if(T[r].filter(coIdLike).length>=2){I.h=r;break}}ccAutoMap()}
    else if(k==="imp.h"){I.h=+el.value;ccAutoMap()}else{if(el.value==="")delete I.map[el.dataset.c];else I.map[el.dataset.c]=+el.value}
    rerenderKeep();return}
  if(k==="reponses"){if(e.type!=="change")return;o.reponses=normCo({...o,reponses:el.value.split(/[,;]+/)}).reponses;ccSave();rerenderKeep();return}
  if(k.startsWith("f.")){const f=o.formats[i];if(!f)return;const p=k.slice(2);f[p]=p==="limite"?Math.max(0,Math.min(180,parseInt(el.value)||0)):el.value.slice(0,p==="desc"?300:40);ccSave();if(e.type==="change"&&p==="nom")rerenderKeep();return}
  if(k.startsWith("c.")){const c=o.cartons[i];if(!c)return;const p=k.slice(2);
    if(p==="balises"){if(e.type!=="change")return;c.balises=coBal(el.value);const m=o.corr[c.id]||{};o.corr[c.id]=Object.fromEntries(Object.entries(m).filter(([b])=>c.balises.includes(b)));ccSave();rerenderKeep();return}
    c[p]=p==="nom"?el.value.slice(0,40):el.value;ccSave();return}
  if(k==="corr"){const m=o.corr[el.dataset.c]=o.corr[el.dataset.c]||{};const v=el.value.trim().slice(0,16);if(v)m[el.dataset.b]=v;else delete m[el.dataset.b];ccSave();return}}
document.addEventListener("change",e=>{if(e.target&&e.target.id==="cc-file"&&CC){ccImport(e.target.files&&e.target.files[0]);e.target.value=""}});


/* ====================================================================
   Sorties de l'appli pendant les créneaux d'EPS
   - Le prof indique les créneaux d'EPS de la classe (classes/{id}.creneaux) et un avertissement automatique (vigieCfg).
   - Pendant un créneau, chaque passage de l'appli en arrière-plan (autre appli, fermeture) est compté dans vigie/{uid}.
   - Le verrouillage de l'écran n'est pas compté : Android (Chrome) le signale à l'appli grâce à la détection
     d'inactivité, que l'élève autorise une fois. iPhone : impossible à distinguer pour une appli web,
     ces sorties sont comptées à part, « à confirmer ».
   ==================================================================== */
const JOURS_L=["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"];
const dloc=t=>{const d=new Date(t);return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`};
const hhmm=t=>{const d=new Date(t);return`${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`};
const hmMin=s=>{const[a,b]=String(s||"").split(":");return(+a||0)*60+(+b||0)};
const VG_TXT="Ton enseignant voit que tu as quitté l'appli pendant le cours d'EPS. Pendant le cours, ton téléphone sert uniquement à ce qui est demandé.";
const vgCfgOf=c=>{const v=(c&&c.vigieCfg)||{};return{on:!!v.on,seuil:Math.max(1,Math.min(20,parseInt(v.seuil)||1)),nv:!!v.nv,texte:String(v.texte||VG_TXT).slice(0,400)}};
const VG={det:null,scr:"",scrAt:0,pend:null,expect:0,doc:null,perm:"",init:null,lastAv:0};
const vgOn=()=>!!(me&&me.role==="eleve"&&!me.apercu&&!VUE);
function vgCls(){return eleveClasse||(H&&H.cls)||null}
function vgCr(){const c=vgCls();if(c&&me){lsSet("vgCr",{cid:me.classeId,cr:c.creneaux||[],cfg:c.vigieCfg||null});return Array.isArray(c.creneaux)?c.creneaux:[]}const s=lsGet("vgCr",null);return s&&me&&s.cid===me.classeId?s.cr||[]:[]}
function vgCfg(){const c=vgCls();if(c)return vgCfgOf(c);const s=lsGet("vgCr",null);return vgCfgOf({vigieCfg:s&&s.cfg})}
function vgSlot(t){const d=new Date(t),j=d.getDay(),m=d.getHours()*60+d.getMinutes();return vgCr().find(c=>+c.j===j&&hmMin(c.d)<=m&&m<hmMin(c.f))||null}
function vgHide(){if(!vgOn()||VG.pend)return;const t=Date.now(),s=vgSlot(t);if(!s)return;
  VG.pend={t,c:s.d,lock:!!(VG.det&&VG.det.screenState==="locked"),ext:t-VG.expect<20000,v:VG.det?1:0,uid:me.uid};lsSet("vgPend",VG.pend)}
function vgShow(){if(!vgOn())return;const p=VG.pend||lsGet("vgPend",null);VG.pend=null;lsSet("vgPend",null);
  if(p&&p.uid===me.uid)setTimeout(()=>vgDecide(p,false),1500);
  vgCheckAvert(false);const r=route.name==="co"&&coRun();if(r&&!r.fin)coWakeOn()}
async function vgDecide(p,ferme){const d=Date.now()-p.t;if(p.ext||d<2000||d>6*3600e3)return;
  if(p.lock||(VG.det&&VG.scrAt>=p.t-1500))return;   // l'écran a été verrouillé : pas compté
  await vgRecord({t:p.t,d,v:p.v&&!ferme?1:0,f:ferme?1:0,c:p.c})}
async function vgRecord(ev){const uid=me.uid,date=dloc(ev.t);
  if(!VG.doc||VG.doc._uid!==uid){let d=null;try{d=await fb.getVigie(uid)}catch(e){}VG.doc={...(d||{}),_uid:uid}}
  const j=VG.doc.j=VG.doc.j||{},day=j[date]=j[date]||{n:0,nv:0,ms:0,ev:[]};
  if(ev.v)day.n=(day.n||0)+1;else day.nv=(day.nv||0)+1;day.ms=(day.ms||0)+ev.d;
  day.ev=[...(day.ev||[]),{h:hhmm(ev.t),d:Math.round(ev.d/1000),v:ev.v,f:ev.f,c:ev.c}].slice(-60);
  fb.setVigie(uid,{profId:me.profId,classeId:me.classeId,login:me.login||"",j:{[date]:day},maj:Date.now()}).catch(e=>console.warn("vigie",e));
  const cfg=vgCfg();if(cfg.on&&(ev.v||cfg.nv)){const nb=day.ev.filter(x=>x.c===ev.c&&(x.v||cfg.nv)).length;if(nb>=cfg.seuil)vgWarn(cfg.texte,nb)}}
function vgWarn(texte,nb){openModal(`<div class="vg-warn"><div class="vg-ic">📵</div><h3>Ton enseignant est au courant</h3><p>${esc(texte)}</p>${nb?`<p class="hint">Sorties de l'appli pendant ce cours : <b>${nb}</b></p>`:""}<button class="btn primary" data-mact="close">J'ai compris</button></div>`)}
async function vgCheckAvert(force){if(!vgOn())return;const now=Date.now();if(!force&&now-VG.lastAv<60000)return;VG.lastAv=now;
  try{const d=await fb.getVigie(me.uid);if(!d)return;VG.doc={...d,_uid:me.uid};const a=d.avert;
    if(a&&a.id&&d.avertVu!==a.id&&$("#modal").hidden)openModal(`<div class="vg-warn"><div class="vg-ic">✉️</div><h3>Message de ton enseignant</h3><p>${esc(a.texte)}</p><button class="btn primary" data-mact="vgVu" data-id="${esc(a.id)}">J'ai compris</button></div>`)}catch(e){console.warn(e)}}
function vgVu(id){if(!vgOn()||!id)return;if(VG.doc)VG.doc.avertVu=id;fb.updateVigie(me.uid,{avertVu:id}).catch(e=>console.warn(e))}
async function vgInit(){if(!vgOn()||VG.init===me.uid)return;VG.init=me.uid;VG.doc=null;
  const p=lsGet("vgPend",null);lsSet("vgPend",null);if(p&&p.uid===me.uid)vgDecide(p,true);   // appli fermée puis rouverte
  if("IdleDetector"in window){try{const st=await navigator.permissions.query({name:"idle-detection"});VG.perm=st.state;if(st.state==="granted")await vgDet()}catch(e){VG.perm=""}if(route.name==="home")rerenderKeep()}
  vgCheckAvert(true)}
async function vgDet(){if(VG.det)return;try{const d=new IdleDetector();d.addEventListener("change",()=>{if(d.screenState!==VG.scr){VG.scr=d.screenState;VG.scrAt=Date.now()}});await d.start({threshold:60000});VG.det=d;VG.scr=d.screenState;VG.perm="granted"}catch(e){console.warn("IdleDetector",e)}}
async function vgAsk(){try{const r=await IdleDetector.requestPermission();VG.perm=r;if(r==="granted"){await vgDet();toast("Merci ! Le verrouillage de ton écran ne sera pas compté.")}else toast("Détection refusée : tes sorties seront « à confirmer » pour ton enseignant.")}
  catch(e){VG.perm="denied";toast("Ton navigateur ne permet pas cette détection.")}rerenderKeep()}
function vgHomeCard(){if(!vgOn()||!vgCr().length)return"";const s=vgSlot(Date.now()),android="IdleDetector"in window;
  if(android&&VG.perm!=="granted"&&VG.perm!=="denied")return`<section class="h2-card vg-card"><div class="vg-ct"><span>📵</span><div><b>Pendant l'EPS, ton enseignant voit quand tu quittes l'appli.</b><p>Verrouiller ton écran n'est pas compté : touche « Autoriser » pour que ton téléphone le reconnaisse.</p></div></div><button class="h-btn" data-act="vgAsk">Autoriser</button></section>`;
  if(s)return`<section class="h2-card vg-card on"><div class="vg-ct"><span>🟢</span><div><b>Cours d'EPS jusqu'à ${esc(s.f)}</b><p>Reste dans l'appli : si tu la quittes, ton enseignant le voit.${android&&VG.perm==="granted"?" Tu peux verrouiller ton écran.":""}</p></div></div></section>`;
  return`<p class="vg-info">📵 Pendant tes cours d'EPS, l'appli compte combien de fois tu la quittes. Ton enseignant voit ce nombre.</p>`}
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden")vgHide();else vgShow()});
window.addEventListener("pagehide",()=>vgHide());
document.addEventListener("click",e=>{if(e.target.closest&&e.target.closest("a[href],[data-nav='home'],#maj-go"))VG.expect=Date.now()},true);
/* --- Prof : onglet « Téléphone » de la classe --- */
let VGP=null;
async function vgLoadProf(){const cid=classe.id;VGP={cid,date:dloc(Date.now()),list:{},err:""};
  try{const L=await fb.listVigie(me.uid,cid);VGP.list=Object.fromEntries(L.map(v=>[v.id,v]))}catch(e){console.warn(e);VGP.err=authMsg(e)}
  await Promise.all(eleves.map(async e=>{if(pseudoCache[e.id])return;try{const l=await fb.getLogin(e.login);if(l&&l.pseudo)pseudoCache[e.id]=l.pseudo}catch(x){}}));
  VGP.ok=true;if(route.name==="classe"&&classeTab==="vigie")rerenderKeep()}
function vVgProf(){if(!VGP||VGP.cid!==classe.id){vgLoadProf();return`<div class="center-msg"><div class="spinner"></div></div>`}if(!VGP.ok)return`<div class="center-msg"><div class="spinner"></div></div>`;
  const c=classe,cr=Array.isArray(c.creneaux)?c.creneaux:[],cfg=vgCfgOf(c),D=VGP.date;
  const dates=[...new Set([dloc(Date.now()),D,...Object.values(VGP.list).flatMap(v=>Object.keys(v.j||{}))])].sort().reverse().slice(0,40);
  const rows=eleves.map(e=>{const v=VGP.list[e.id],j=(v&&v.j&&v.j[D])||null,av=v&&v.avert;
    return`<tr><td>${e.numero}</td><td>${esc(pseudoCache[e.id]||e.login)}</td><td>${j&&j.n?`<b class="vg-hot">${j.n}</b>`:"0"}</td><td>${j&&j.nv?j.nv:"–"}</td><td>${j&&j.ms?fmtDur(j.ms):"–"}</td><td class="hint vg-h">${j&&j.ev?j.ev.slice(-8).map(x=>`${x.h}${x.v?"":"?"}${x.f?" (fermée)":""}`).join(", "):""}</td><td>${av?`<span class="hint" title="${esc(av.texte)}">${v.avertVu===av.id?"✓ lu":"envoyé"}</span>`:""}</td><td><button class="btn ghost small" data-act="vgAvert" data-id="${e.id}" data-l="${esc(e.login)}">✉️ Avertir</button></td></tr>`}).join("");
  return`<section class="card stack" style="gap:10px"><div class="sec-h"><h3>📵 Créneaux d'EPS de la classe</h3></div>
   <p class="hint" style="margin:0">Pendant ces créneaux, l'appli compte chaque fois que l'élève la quitte (autre appli, fermeture). Le verrouillage de l'écran n'est pas compté. En dehors, rien n'est compté. Les élèves sont informés sur leur accueil.</p>
   <div class="vg-crs">${cr.map((x,i)=>`<div class="vg-cr"><select data-vg="cr.j" data-i="${i}" aria-label="Jour">${[1,2,3,4,5,6].map(j=>`<option value="${j}" ${+x.j===j?"selected":""}>${JOURS_L[j]}</option>`).join("")}</select><input type="time" data-vg="cr.d" data-i="${i}" value="${esc(x.d)}" aria-label="Début"><span>→</span><input type="time" data-vg="cr.f" data-i="${i}" value="${esc(x.f)}" aria-label="Fin"><button class="btn ghost small danger" data-act="vgCrDel" data-i="${i}" aria-label="Supprimer le créneau">✕</button></div>`).join("")||'<p class="hint" style="margin:0">Aucun créneau : le compteur est désactivé pour cette classe.</p>'}</div>
   <button class="btn small" data-act="vgCrAdd" style="justify-self:start">+ Ajouter un créneau</button></section>
  <section class="card stack" style="gap:10px"><div class="sec-h"><h3>Avertissement automatique</h3></div>
   <label class="row" style="gap:8px;font-weight:600"><input type="checkbox" data-vg="on" ${cfg.on?"checked":""} style="width:20px;height:20px"> Afficher ce message à l'élève quand il revient dans l'appli</label>
   <div class="grid2"><label class="f">À partir de combien de sorties (dans le même cours)<input data-vg="seuil" inputmode="numeric" value="${cfg.seuil}"></label><label class="row" style="gap:8px;align-self:end"><input type="checkbox" data-vg="nv" ${cfg.nv?"checked":""} style="width:20px;height:20px"><span>Compter aussi les sorties « à confirmer » (iPhone)</span></label></div>
   <label class="f">Message<textarea data-vg="texte" rows="3" maxlength="400">${esc(cfg.texte)}</textarea></label></section>
  <section class="card stack" style="gap:10px"><div class="sec-h"><h3>Sorties de l'appli</h3><span class="spacer"></span><select data-vg="date" aria-label="Jour">${dates.map(x=>`<option value="${x}" ${x===D?"selected":""}>${fmtDate(x)}</option>`).join("")}</select><button class="btn ghost small" data-act="vgReload" aria-label="Actualiser">↻</button></div>
   ${VGP.err?`<p class="err" style="margin:0">${esc(VGP.err)}</p>`:""}
   <div class="scroll"><table class="ids vg-tab"><thead><tr><th>N°</th><th>Élève</th><th>Sorties</th><th title="iPhone, ou détection refusée : verrouillage possible">À confirmer</th><th>Hors appli</th><th>Heures</th><th>Message</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>
   <p class="hint" style="margin:0"><b>Sorties</b> : téléphones Android qui ont autorisé la détection ; le verrouillage de l'écran y est reconnu et n'est pas compté. <b>À confirmer</b> (« ? » après l'heure) : iPhone, ou détection refusée. Le téléphone ne permet pas à une appli web de distinguer une sortie d'un verrouillage de l'écran.</p></section>`}
async function vgSaveCls(patch){Object.assign(classe,patch);const c=classes.find(x=>x.id===classe.id);if(c)Object.assign(c,patch);try{await fb.updateClasse(classe.id,patch)}catch(e){toast(authMsg(e))}}
function vgClick(a,b){
  if(a==="vgAsk"){vgAsk();return true}
  if(a==="vgReload"){VGP=null;rerenderKeep();return true}
  if(a==="vgCrAdd"){const cr=[...(classe.creneaux||[])],l=cr[cr.length-1];cr.push(l?{j:l.j,d:l.d,f:l.f}:{j:1,d:"08:00",f:"10:00"});vgSaveCls({creneaux:cr});rerenderKeep();return true}
  if(a==="vgCrDel"){const cr=[...(classe.creneaux||[])];cr.splice(+b.dataset.i,1);vgSaveCls({creneaux:cr});rerenderKeep();return true}
  if(a==="vgAvert"){const uid=b.dataset.id,login=b.dataset.l,cfg=vgCfgOf(classe);
    openModal(`<h3>Avertir l'élève</h3><p class="hint" style="margin:0">Le message s'affiche à sa prochaine ouverture de l'appli. Vous voyez ensuite s'il l'a lu.</p><label class="f">Message<textarea id="vg-msg" rows="4" maxlength="400">${esc(cfg.texte)}</textarea></label><div class="grid2"><button class="btn" data-mact="close">Annuler</button><button class="btn primary" data-mact="confirm">Envoyer</button></div>`,
      {type:"confirm",run:async()=>{const texte=String($("#vg-msg").value||"").trim().slice(0,400);if(!texte){closeModal();return}const avert={id:Date.now().toString(36),texte,at:Date.now()};
        try{await fb.setVigie(uid,{profId:me.uid,classeId:classe.id,login,avert});const v=VGP&&VGP.list;if(v)v[uid]={...(v[uid]||{}),avert};closeModal();toast("Message envoyé");rerenderKeep()}catch(x){closeModal();toast(authMsg(x))}}});return true}
  return false}
function vgField(el,e){if(e.type!=="change")return;const k=el.dataset.vg;
  if(k==="date"){VGP.date=el.value;rerenderKeep();return}
  if(k.startsWith("cr.")){const cr=(classe.creneaux||[]).map(x=>({...x})),x=cr[+el.dataset.i];if(!x)return;x[k.slice(3)]=k==="cr.j"?+el.value:el.value;vgSaveCls({creneaux:cr});return}
  const cfg={...vgCfgOf(classe)};if(k==="on"||k==="nv")cfg[k]=el.checked;else if(k==="seuil")cfg.seuil=Math.max(1,Math.min(20,parseInt(el.value)||1));else if(k==="texte")cfg.texte=el.value.trim().slice(0,400)||VG_TXT;
  vgSaveCls({vigieCfg:cfg})}


/* ====================================================================
   Stock : préconfigurations proposées par l'appli
   ==================================================================== */
const STOCK_INT=[{id:"int-co",integre:true,titre:"Course d'orientation",cle:actKeyOf("Course d'orientation"),ca:"CA2",signature:"Préconfiguration de l'appli",
  principe:"Course d'orientation (CA2 : adapter son déplacement à des environnements variés). L'élève choisit un carton de contrôle, un chrono impossible à arrêter démarre au départ et s'arrête à son retour au point d'arrivée. Pour chaque balise, il note la réponse trouvée sur le poste ; à la validation, le carton est corrigé automatiquement grâce au document de correction du prof.\nAFL1 : réussite des parcours (balises justes) et temps de course, sur des formats de plus en plus exigeants (étoile → circuit → papillon → course au score).\nAFL2 : choix d'itinéraire et régulation de l'allure au fil des séances (temps et réussite comparés d'un carton à l'autre).\nAFL3 : sécurité et respect des règles (retour avant la fin du temps limite, carton complet, rôles d'observateur ou de traceur).\nÀ adapter : vos cartons, votre correction et votre barème restent à saisir.",
  carnets:[],fiches:[],outils:[{kind:"co",titre:"Course d'orientation",cfg:{reponses:CO_REP,formats:CO_FORMATS}}]}];

/* ===================== QCM d'une activité (2026.11.20-10 et -11) =====================
   qcms/{id} : questions SANS les bonnes réponses (lu par les élèves).
   qcmcles/{id} : corrigé, lisible par l'élève seulement après sa première validation.
   qcmrep/{qcmId__uid} : réponses de l'élève (dernier essai + essais précédents).
   aflnotes/{classeId__activite} : notes retenues par le prof (tableau des carnets). */
const QAFL_DEF={AFL1:12,AFL2:4,AFL3:4};
const qid=()=>"q"+Math.random().toString(36).slice(2,9);
function qNorm(q){q=q||{};const afl=["AFL1","AFL2","AFL3"].includes(q.afl)?q.afl:"AFL1";
  return{titre:q.titre||"QCM",afl,carnet:q.carnet||"",sur:+q.sur>0?+q.sur:QAFL_DEF[afl],partiel:!!q.partiel,montrer:q.montrer!==false,melange:!!q.melange,
    essais:[0,1,2,3].includes(+q.essais)?+q.essais:1,garder:q.garder==="derniere"?"derniere":"meilleure",
    questions:(q.questions||[]).map(x=>({id:x.id||qid(),type:["une","plusieurs","vf"].includes(x.type)?x.type:"une",texte:String(x.texte||""),
      reponses:(x.type==="vf"?["Vrai","Faux"]:(x.reponses||["",""])).slice(0,8).map(String),points:+x.points>0?+x.points:1}))}}
// Réponse correcte d'une question (indices)
function qScore(Q,cle,q,sel){const bon=(cle&&cle[q.id])||[],s=(sel||[]).map(Number);
  if(!bon.length)return 0;
  if(q.type!=="plusieurs")return s.length===1&&bon.includes(s[0])?q.points:0;
  const ok=s.filter(i=>bon.includes(i)).length,ko=s.filter(i=>!bon.includes(i)).length;
  if(Q.partiel)return Math.max(0,(ok-ko)/bon.length)*q.points;
  return ok===bon.length&&!ko?q.points:0}
function qcmNote(Q,cle,rep){const max=Q.questions.reduce((a,q)=>a+q.points,0);if(!max)return{pts:0,max:0,note:0};
  const pts=Q.questions.reduce((a,q)=>a+qScore(Q,cle,q,(rep||{})[q.id]),0);return{pts,max,note:Math.round(pts/max*Q.sur*100)/100}}
// Note retenue : meilleure ou dernière de tous les essais
function qcmRetenue(Q,cle,rep){if(!rep)return null;const all=[...(rep.prec||[]).map(p=>p.r),rep.reponses].filter(Boolean);if(!all.length)return null;
  const ns=all.map(r=>qcmNote(Q,cle,r));return Q.garder==="derniere"?ns[ns.length-1]:ns.reduce((a,b)=>b.note>a.note?b:a)}
// Ordre mélangé, stable pour un élève
function qHash(s){let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function qShuffle(arr,seed){const a=arr.map((x,i)=>[x,i]);let h=qHash(seed);for(let i=a.length-1;i>0;i--){h=Math.imul(h^(h>>>15),2246822519)>>>0;const j=h%(i+1);[a[i],a[j]]=[a[j],a[i]]}return a}
function qcmOrdre(Q,uid){const qs=Q.melange?qShuffle(Q.questions,uid+Q.titre).map(x=>x[0]):Q.questions;
  return qs.map(q=>({q,ord:Q.melange&&q.type!=="vf"?qShuffle(q.reponses,uid+q.id).map(x=>x[1]):q.reponses.map((_,i)=>i)}))}
const qOuvertPour=(cl,id)=>!!(cl&&cl.seanceJour&&cl.seanceJour.date===today()&&(cl.seanceJour.qcms||[]).includes(id));
const qEssaisRest=(Q,rep)=>Q.essais===0?Infinity:Q.essais-((rep&&rep.essais)||0);

/* ---------- Prof : éditeur ---------- */
let QE=null;
async function openQcmEd(id){RETRY=()=>openQcmEd(id);go("loading",{msg:"Ouverture du QCM…"});
  try{if(!dossier)throw{code:"not-found"};await loadClasses();let q=null,c=null;
    if(id){[q,c]=await Promise.all([fb.getQcm(id),fb.getQcmCle(id).catch(()=>null)]);if(!q)throw{code:"not-found"}}
    const Q=qNorm(q||{titre:"QCM · "+dossier.titre,carnet:((dossier.items||[]).find(x=>x.t==="carnet")||{}).id||""});
    QE={id:id||null,Q,cle:clone((c&&c.cle)||{}),dirty:!id,tab:"q",res:{},ia:{busy:false,err:""},cls:classes.filter(cl=>(cl.dossiers||[]).includes(dossier.id))};
    go("qcmEd")}catch(e){console.error(e);go("error",{msg:authMsg(e)})}}
function qeAflInfo(){const Q=QE.Q,it=dossierItems.find(x=>x.id===Q.carnet);let p=Q.afl==="AFL1"?12:4;
  if(Q.afl==="AFL1"&&it){try{const M=it.M||normModele(it.doc.modele||it.doc.brouillon);const b=M.bareme&&M.bareme.afl1;if(b&&b.max)p=b.max}catch(e){}}
  const qp=Math.min(Q.sur,p);return`L'${Q.afl} vaut ${p} points${Q.afl!=="AFL1"?" (selon la répartition choisie par l'élève, 4 par défaut)":""} : le QCM en apporte ${fmtN(qp)}${p>qp?`, les ${fmtN(p-qp)} autres viennent du carnet`:""}.`}
function vQcmEd(){const Q=QE.Q,cars=dossierItems.filter(x=>x.t==="carnet"),fis=dossierItems.filter(x=>x.t==="fiche");
  const qh=Q.questions.map((q,i)=>{const bon=QE.cle[q.id]||[];return`<section class="card stack qe-q" style="gap:8px">
    <div class="row" style="gap:6px"><b>Question ${i+1}</b><span class="spacer"></span><select data-qe="type" data-i="${i}" aria-label="Type"><option value="une" ${q.type==="une"?"selected":""}>Une bonne réponse</option><option value="plusieurs" ${q.type==="plusieurs"?"selected":""}>Plusieurs bonnes réponses</option><option value="vf" ${q.type==="vf"?"selected":""}>Vrai / faux</option></select>
      <label class="hint" style="display:flex;gap:4px;align-items:center">Points <input data-qe="points" data-i="${i}" value="${q.points}" inputmode="decimal" style="width:50px"></label>
      <button class="btn ghost small" data-act="qeUp" data-i="${i}" aria-label="Monter">↑</button><button class="btn ghost small" data-act="qeDown" data-i="${i}" aria-label="Descendre">↓</button><button class="btn ghost small danger" data-act="qeDelQ" data-i="${i}" aria-label="Supprimer la question">✕</button></div>
    <textarea data-qe="texte" data-i="${i}" rows="2" placeholder="Énoncé de la question">${esc(q.texte)}</textarea>
    <div class="stack" style="gap:4px">${q.reponses.map((r,k)=>`<div class="row" style="gap:6px;flex-wrap:nowrap"><label class="qe-ok" title="Bonne réponse"><input type="${q.type==="plusieurs"?"checkbox":"radio"}" name="qe-ok-${i}" data-qe="ok" data-i="${i}" data-k="${k}" ${bon.includes(k)?"checked":""}> ✓</label>
      ${q.type==="vf"?`<span style="flex:1">${esc(r)}</span>`:`<input data-qe="rep" data-i="${i}" data-k="${k}" value="${esc(r)}" placeholder="Réponse ${k+1}" style="flex:1">${q.reponses.length>2?`<button class="btn ghost small" data-act="qeDelR" data-i="${i}" data-k="${k}" aria-label="Retirer la réponse">✕</button>`:""}`}</div>`).join("")}</div>
    ${q.type!=="vf"&&q.reponses.length<8?`<button class="btn ghost small" data-act="qeAddR" data-i="${i}" style="align-self:flex-start">+ Réponse</button>`:""}
    ${bon.length?"":`<p class="err" style="margin:0">Cochez la ou les bonnes réponses (✓).</p>`}</section>`}).join("");
  const sel=(k,opts,v)=>`<select data-qe="${k}">${opts.map(([a,l])=>`<option value="${a}" ${String(v)===String(a)?"selected":""}>${l}</option>`).join("")}</select>`;
  const reg=`<section class="card stack" style="gap:10px"><h3>Réglages</h3>
    <label class="f">Titre<input data-qe="titre" value="${esc(Q.titre)}" maxlength="80"></label>
    <div class="grid2"><label class="f">Compte pour${sel("afl",[["AFL1","AFL1"],["AFL2","AFL2"],["AFL3","AFL3"]],Q.afl)}</label>
      <label class="f">Noté sur (points)<input data-qe="sur" value="${fmtN(Q.sur)}" inputmode="decimal"></label></div>
    <label class="f">Carnet où la note est reportée<select data-qe="carnet"><option value="">— Aucun (note seule)</option>${cars.map(c=>`<option value="${c.id}" ${Q.carnet===c.id?"selected":""}>${esc(c.titre)}</option>`).join("")}</select></label>
    ${Q.carnet?`<p class="hint" style="margin:0">${qeAflInfo()}</p>`:""}
    <div class="grid2"><label class="f">Essais${sel("essais",[[1,"Une seule chance"],[2,"2 essais"],[3,"3 essais"],[0,"Illimité tant qu'il est ouvert"]],Q.essais)}</label>
      ${Q.essais!==1?`<label class="f">Note gardée${sel("garder",[["meilleure","La meilleure"],["derniere","La dernière"]],Q.garder)}</label>`:"<span></span>"}</div>
    <label class="chk"><input type="checkbox" data-qe="partiel" ${Q.partiel?"checked":""}> Plusieurs bonnes réponses : points partiels (bonnes − fausses), sinon tout ou rien</label>
    <label class="chk"><input type="checkbox" data-qe="montrer" ${Q.montrer?"checked":""}> Montrer la correction à l'élève à la fin</label>
    <label class="chk"><input type="checkbox" data-qe="melange" ${Q.melange?"checked":""}> Mélanger les questions et les réponses (ordre différent pour chaque élève)</label></section>`;
  const iaC=`<section class="card stack" style="gap:8px"><h3>✨ Créer les questions à partir d'une fiche</h3>
    <label class="f">Fiche de l'activité<select id="qe-fi"><option value="">—</option>${fis.map(f=>`<option value="${f.id}">${esc(f.titre)}</option>`).join("")}</select></label>
    <label class="f">ou un fichier (PDF, photo)<input type="file" id="qe-file" accept="application/pdf,image/*" multiple></label>
    <label class="f">ou du texte<textarea id="qe-txt" rows="3" placeholder="Collez un cours, des règles…"></textarea></label>
    <div class="grid2"><label class="f">Nombre de questions<input id="qe-nb" value="10" inputmode="numeric"></label><label class="f">Consignes (facultatif)<input id="qe-cons" placeholder="niveau 2nde, règles de sécurité…"></label></div>
    <button class="btn primary" data-act="qeIa" ${QE.ia.busy?"disabled":""}>${QE.ia.busy?"L'IA écrit les questions…":"✨ Créer les questions"}</button>${QE.ia.busy?`<button type="button" class="btn ghost small" data-act="iaStop">✕ Annuler</button>`:""}<p class="err" id="qe-err" style="margin:0">${esc(QE.ia.err||"")}</p></section>`;
  const dispo=`<section class="card stack" style="gap:8px"><h3>Disponibilité et résultats</h3>
    ${QE.id?(QE.cls.length?QE.cls.map(cl=>{const o=qOuvertPour(cl,QE.id),r=QE.res[cl.id];return`<div class="qe-cl"><div class="row"><b>${esc(cl.nom)}</b><span class="hint">${o?"Ouvert aujourd'hui":"Fermé"}</span><span class="spacer"></span>
      <button class="btn small ${o?"":"primary"}" data-act="${o?"qeFermer":"qeOuvrir"}" data-c="${cl.id}">${o?"Fermer":"Rendre disponible aujourd'hui"}</button><button class="btn small" data-act="qeRes" data-c="${cl.id}">${r?"Masquer":"Résultats"}</button></div>${r?vQeRes(cl,r):""}</div>`}).join("")
      :`<p class="hint" style="margin:0">Activez d'abord cette activité dans une classe.</p>`):`<p class="hint" style="margin:0">Enregistrez le QCM pour pouvoir l'ouvrir aux élèves.</p>`}</section>`;
  return`<div class="stack"><div class="row"><button class="btn ghost small" data-act="qeBack">← ${esc(dossier.titre)}</button><span class="spacer"></span>${QE.id?`<button class="btn danger small" data-act="qeDel">Supprimer</button>`:""}<button class="btn small" data-act="qeTry">▶ Essayer</button><button class="btn primary small" data-act="qeSave" ${QE.dirty?"":"disabled"}>${QE.dirty?"Enregistrer":"Enregistré ✓"}</button></div>
  <section class="class-hero"><span class="eyebrow">📝 QCM · ${esc(dossier.titre)}</span><h2>${esc(Q.titre)}</h2></section>
  ${reg}${dispo}${iaC}
  <div class="sec-h"><h3>Questions (${Q.questions.length})</h3><span class="spacer"></span><span class="hint">Total : ${fmtN(Q.questions.reduce((a,q)=>a+q.points,0))} pts → ramené sur ${fmtN(Q.sur)}</span></div>
  ${qh||`<p class="hint">Aucune question : ajoutez-en ou créez-les avec l'IA.</p>`}
  <button class="btn" data-act="qeAddQ">+ Question</button></div>`}
function vQeRes(cl,r){if(r.load)return`<p class="hint">Chargement…</p>`;if(r.err)return`<p class="err">${esc(r.err)}</p>`;
  const Q=QE.Q,rows=r.eleves.map(e=>{const rep=r.reps.find(x=>x.eleveUid===e.id),n=rep?qcmRetenue(Q,QE.cle,rep):null;
    return`<tr><td><strong>N°${e.numero}</strong>${getReperes(cl.id)[e.id]?` ${esc(getReperes(cl.id)[e.id])}`:""} <code>${esc(e.login)}</code></td><td class="n">${n?`<strong>${fmtN(n.note)}</strong><span class="hint"> / ${fmtN(Q.sur)}</span>`:"–"}</td><td class="n">${rep?rep.essais||1:"–"}</td>
    <td class="hint">${rep&&(rep.prec||[]).length?[...rep.prec.map(p=>qcmNote(Q,QE.cle,p.r).note),qcmNote(Q,QE.cle,rep.reponses).note].map(fmtN).join(" → "):""}</td>
    <td>${rep?`<button class="btn ghost small" data-act="qeZero" data-c="${cl.id}" data-id="${rep.id}">Remettre à zéro</button>`:""}</td></tr>`}).join("");
  return`<div class="scroll"><table class="suivi"><thead><tr><th>Élève</th><th class="n">Note</th><th class="n">Essais</th><th>Historique</th><th></th></tr></thead><tbody>${rows||'<tr><td colspan="5" class="hint">Aucun élève.</td></tr>'}</tbody></table></div>
    <p class="hint" style="margin:4px 0 0">${r.reps.length} réponse${r.reps.length>1?"s":""} · note ${Q.garder==="derniere"?"du dernier essai":"du meilleur essai"}. « Remettre à zéro » efface tous les essais de l'élève (absence, problème technique).</p>`}
async function qeLoadRes(cid){QE.res[cid]={load:true};rerenderKeep();
  try{const[el,reps]=await Promise.all([fb.listEleves(cid),fb.listQcmReps(QE.id,me.uid,cid)]);QE.res[cid]={eleves:el.sort((a,b)=>(a.numero||0)-(b.numero||0)),reps}}
  catch(e){QE.res[cid]={err:authMsg(e)}}if(route.name==="qcmEd")rerenderKeep()}
async function qeSave(){const Q=QE.Q,bad=Q.questions.findIndex(q=>!q.texte.trim()||!(QE.cle[q.id]||[]).length);
  if(!Q.questions.length){toast("Ajoutez au moins une question");return false}
  if(bad>=0){toast(`Question ${bad+1} : énoncé ou bonne réponse manquant`);return false}
  const id=QE.id||"qcm_"+Math.random().toString(36).slice(2,10),cle={};Q.questions.forEach(q=>cle[q.id]=(QE.cle[q.id]||[]).filter(k=>k<q.reponses.length));
  try{await fb.setQcm(id,{profId:me.uid,dossierId:dossier.id,...clone(Q)});await fb.setQcmCle(id,{profId:me.uid,cle});
    if(!QE.id){QE.id=id;await dosItems([...(dossier.items||[]),{t:"qcm",id}]);dossierItems.push({t:"qcm",id,titre:Q.titre,q:Q,pub:true})}
    else{const it=dossierItems.find(x=>x.id===id);if(it){it.titre=Q.titre;it.q=Q}}
    QE.dirty=false;toast("QCM enregistré");rerenderKeep();return true}catch(e){toast(authMsg(e));return false}}
// Ouvre / ferme le QCM pour aujourd'hui dans une classe (séance d'aujourd'hui)
async function qeOuvrir(cid,ouvrir){const cl=QE.cls.find(c=>c.id===cid);if(!cl)return;if(QE.dirty&&!(await qeSave()))return;
  let sj=cl.seanceJour&&cl.seanceJour.date===today()?clone(cl.seanceJour):{date:today(),dossierId:dossier.id,titre:dossier.titre,items:[],qcms:[]};
  sj.items=(sj.items||[]).filter(x=>x.id!==QE.id);sj.qcms=(sj.qcms||[]).filter(x=>x!==QE.id);
  if(ouvrir){sj.items.push({id:QE.id,t:"qcm",titre:QE.Q.titre,...(sj.dossierId!==dossier.id?{d:dossier.id}:{})});sj.qcms.push(QE.id)}
  try{await fb.updateClasse(cid,{seanceJour:sj});cl.seanceJour=sj;const c2=classes.find(c=>c.id===cid);if(c2)c2.seanceJour=sj;toast(ouvrir?`QCM disponible aujourd'hui pour ${cl.nom}`:"QCM fermé");rerenderKeep()}catch(e){toast(authMsg(e))}}
async function qeIa(){const err=t=>{QE.ia.err=t;QE.ia.busy=false;if(route.name==="qcmEd")rerenderKeep()};
  const fid=$("#qe-fi").value,files=[...($("#qe-file").files||[])],texte=$("#qe-txt").value.trim(),nb=Math.max(1,Math.min(30,parseInt($("#qe-nb").value)||10)),consignes=$("#qe-cons").value.trim();
  if(!fid&&!files.length&&!texte){err("Choisissez une fiche, un fichier ou collez un texte.");return}
  QE.ia={busy:true,err:""};rerenderKeep();
  try{const fichiers=[];let txt=texte;
    if(fid){const f=dossierItems.find(x=>x.id===fid).f;if(f.type==="texte")txt=(txt?txt+"\n\n":"")+(f.texte||"");
      else{const parts=await fb.getFicheParts(fid);if(f.type==="pdf")fichiers.push({mime:"application/pdf",base64:parts.map(p=>p.data).join("")});else parts.forEach(p=>fichiers.push({mime:p.mime||"image/jpeg",base64:p.data}))}}
    for(const f of files)fichiers.push({mime:f.type||"application/pdf",base64:await fileToB64(f)});
    const ia=await import("./ia.js?v=2026.11.21-15");const r=await ia.genererQcm({fichiers,texte:txt,nb,consignes,cle:IAKEY});
    const add=qNorm({questions:(r.questions||[])}).questions;(r.questions||[]).forEach((x,k)=>{const q=add[k];if(!q)return;QE.cle[q.id]=(x.bonnes||[]).map(Number).filter(n=>n>=0&&n<q.reponses.length)});
    if(!add.length)throw new Error("Réponse de l'IA illisible.");QE.Q.questions.push(...add);QE.dirty=true;QE.ia={busy:false,err:""};toast(`${add.length} question${add.length>1?"s":""} ajoutée${add.length>1?"s":""} : vérifiez-les`);if(route.name==="qcmEd")rerenderKeep()}
  catch(e){console.error(e);let m=String(e&&e.message||e);try{const ia=await import("./ia.js?v=2026.11.21-15");m=ia.iaMessage(e)}catch(x){}err(m)}}
function qeField(t){const k=t.dataset.qe,i=+t.dataset.i,Q=QE.Q,q=Q.questions[i];let re=false;
  if(k==="titre")Q.titre=t.value;else if(k==="sur"){const v=parseFloat(String(t.value).replace(",","."));if(v>0)Q.sur=v;re=true}
  else if(["afl","carnet","garder"].includes(k)){Q[k]=t.value;if(k==="afl")Q.sur=QAFL_DEF[t.value];re=true}
  else if(k==="essais"){Q.essais=+t.value;re=true}else if(["partiel","montrer","melange"].includes(k))Q[k]=t.checked;
  else if(k==="texte")q.texte=t.value;else if(k==="rep")q.reponses[+t.dataset.k]=t.value;
  else if(k==="points"){const v=parseFloat(String(t.value).replace(",","."));if(v>0)q.points=v}
  else if(k==="type"){q.type=t.value;if(q.type==="vf")q.reponses=["Vrai","Faux"];else if(q.reponses.join()==="Vrai,Faux")q.reponses=["",""];if(q.type!=="plusieurs")QE.cle[q.id]=(QE.cle[q.id]||[]).slice(0,1);re=true}
  else if(k==="ok"){const n=+t.dataset.k;if(q.type==="plusieurs"){const s=new Set(QE.cle[q.id]||[]);t.checked?s.add(n):s.delete(n);QE.cle[q.id]=[...s].sort()}else QE.cle[q.id]=[n];re=true}
  QE.dirty=true;if(re&&t.type!=="text"&&t.tagName!=="TEXTAREA")rerenderKeep();else{const b=document.querySelector('[data-act="qeSave"]');if(b){b.disabled=false;b.textContent="Enregistrer"}}}
function qeClick(a,b){if(!QE)return false;const i=+b.dataset.i,Q=QE.Q;
  if(a==="qeBack"){const go2=()=>openDossierEd(dossier.id);if(QE.dirty)confirmBox("Quitter sans enregistrer ?","Les modifications du QCM seront perdues.","Quitter",()=>{closeModal();go2()},true);else go2();return true}
  if(a==="qeAddQ"){Q.questions.push({id:qid(),type:"une",texte:"",reponses:["","",""],points:1});QE.dirty=true;rerenderKeep();return true}
  if(a==="qeDelQ"){const q=Q.questions[i];Q.questions.splice(i,1);delete QE.cle[q.id];QE.dirty=true;rerenderKeep();return true}
  if(a==="qeUp"||a==="qeDown"){const j=a==="qeUp"?i-1:i+1;if(j<0||j>=Q.questions.length)return true;[Q.questions[i],Q.questions[j]]=[Q.questions[j],Q.questions[i]];QE.dirty=true;rerenderKeep();return true}
  if(a==="qeAddR"){Q.questions[i].reponses.push("");QE.dirty=true;rerenderKeep();return true}
  if(a==="qeDelR"){const q=Q.questions[i],k=+b.dataset.k;q.reponses.splice(k,1);QE.cle[q.id]=(QE.cle[q.id]||[]).filter(x=>x!==k).map(x=>x>k?x-1:x);QE.dirty=true;rerenderKeep();return true}
  if(a==="qeSave"){qeSave();return true}
  if(a==="qeIa"){if(!QE.ia.busy)qeIa();return true}
  if(a==="qeOuvrir"||a==="qeFermer"){qeOuvrir(b.dataset.c,a==="qeOuvrir");return true}
  if(a==="qeRes"){const c=b.dataset.c;if(QE.res[c]){delete QE.res[c];rerenderKeep()}else qeLoadRes(c);return true}
  if(a==="qeZero"){confirmBox("Remettre à zéro ?","Tous les essais de cet élève seront effacés : il pourra refaire le QCM s'il est ouvert.","Remettre à zéro",async()=>{try{await fb.deleteQcmRep(b.dataset.id);closeModal();qeLoadRes(b.dataset.c)}catch(x){closeModal();toast(authMsg(x))}},true);return true}
  if(a==="qeTry"){QV={Q:clone(Q),cle:clone(QE.cle),rep:null,sel:{},prof:true,back:"qcmEd",ord:qcmOrdre(Q,"essai"),fini:false};go("qcm");return true}
  if(a==="qeDel"){confirmBox("Supprimer ce QCM ?","Les questions, le corrigé et sa place dans la séance d'aujourd'hui sont supprimés. Les réponses déjà données restent en base.","Supprimer",async()=>{
      try{for(const cl of QE.cls)if(qOuvertPour(cl,QE.id)||(cl.seanceJour&&(cl.seanceJour.items||[]).some(x=>x.id===QE.id))){const sj=clone(cl.seanceJour);sj.items=(sj.items||[]).filter(x=>x.id!==QE.id);sj.qcms=(sj.qcms||[]).filter(x=>x!==QE.id);await fb.updateClasse(cl.id,{seanceJour:sj});cl.seanceJour=sj}
        await dosItems((dossier.items||[]).filter(y=>y.id!==QE.id));await fb.deleteQcmCle(QE.id).catch(()=>{});await fb.deleteQcm(QE.id);closeModal();QE=null;openDossierEd(dossier.id)}catch(x){closeModal();toast(authMsg(x))}},true);return true}
  return false}

/* ---------- Élève : passer le QCM ---------- */
let QV=null;
async function openQcmEleve(id,back){RETRY=()=>openQcmEleve(id,back);go("loading",{msg:"Ouverture du QCM…"});
  try{const Q0=await fb.getQcm(id);if(!Q0)throw{code:"not-found"};const Q=qNorm(Q0);
    if(VUE){let cle={};try{cle=((await fb.getQcmCle(id))||{}).cle||{}}catch(e){}QV={id,Q,cle,rep:null,sel:{},prof:true,back:back||"dossier",ord:qcmOrdre(Q,me.uid),fini:false};go("qcm");return}
    const[rep,cl]=await Promise.all([fb.getQcmRep(id+"__"+me.uid).catch(()=>null),fb.getClasse(me.classeId).catch(()=>eleveClasse)]);if(cl)eleveClasse=cl;
    let cle=null;if(rep){try{cle=((await fb.getQcmCle(id))||{}).cle||null}catch(e){}}
    QV={id,Q,cle,rep,sel:{},prof:false,back:back||"dossier",ord:qcmOrdre(Q,me.uid),fini:!!rep};go("qcm")}
  catch(e){console.error(e);go("error",{msg:authMsg(e)})}}
function vQcm(){const{Q,rep}=QV,ouvert=QV.prof||qOuvertPour(eleveClasse,QV.id),rest=QV.prof?Infinity:qEssaisRest(Q,rep);
  const fini=QV.fini,der=fini?(QV.prof?QV.sel:rep.reponses):QV.sel,can=fini&&!QV.prof&&ouvert&&rest>0,dernier=fini&&!can;
  const corr=fini&&QV.cle&&(dernier?Q.montrer||QV.prof:false),marks=fini&&QV.cle;
  const n=fini&&QV.cle?(QV.prof?qcmNote(Q,QV.cle,QV.sel):qcmRetenue(Q,QV.cle,rep)):null,nDer=fini&&QV.cle?qcmNote(Q,QV.cle,der):null;
  const qs=QV.ord.map(({q,ord},i)=>{const s=(der[q.id]||[]).map(Number),bon=(QV.cle&&QV.cle[q.id])||[],pts=marks?qScore(Q,QV.cle,q,s):0,ok=marks&&pts>=q.points;
    return`<section class="card stack qv-q${marks?(ok?" ok":pts>0?" mid":" ko"):""}" style="gap:8px"><div class="row" style="gap:6px;flex-wrap:nowrap"><b style="flex:1">${i+1}. ${esc(q.texte)}</b>${marks?`<span class="qv-m">${ok?"✓":pts>0?"½":"✗"}</span>`:""}<span class="hint">${fmtN(q.points)} pt${q.points>1?"s":""}</span></div>
      ${q.type==="plusieurs"&&!fini?`<span class="hint">Plusieurs réponses possibles</span>`:""}
      <div class="qv-reps">${ord.map(k=>{const on=s.includes(k),good=corr&&bon.includes(k);return`<label class="qv-r${on?" on":""}${good?" good":""}${corr&&on&&!bon.includes(k)?" bad":""}"><input type="${q.type==="plusieurs"?"checkbox":"radio"}" name="qv-${q.id}" data-qv="${q.id}" data-k="${k}" ${on?"checked":""} ${fini?"disabled":""}><span>${esc(q.reponses[k])}</span>${good?"<em>✓</em>":""}</label>`}).join("")}</div></section>`}).join("");
  const nb=Object.keys(QV.sel).filter(k=>(QV.sel[k]||[]).length).length;
  const head=fini?`<section class="card qv-res"><div class="qv-note">${n?`<b>${fmtN(n.note)}</b><span> / ${fmtN(Q.sur)}</span>`:"✓"}</div><div>${QV.prof?"Essai du professeur (rien n'est enregistré)":n?`Note ${Q.essais===1?"":Q.garder==="derniere"?"retenue (dernier essai)":"retenue (meilleur essai)"}${rep&&rep.essais>1&&nDer?` · dernier essai : ${fmtN(nDer.note)}`:""}`:"Réponses envoyées"}
      ${!QV.prof?`<div class="hint">${rep.essais||1} essai${(rep.essais||1)>1?"s":""}${Q.essais===0?"":` sur ${Q.essais}`}${can?` · tu peux encore le refaire${Q.essais===0?"":` (${rest})`}`:""}</div>`:""}
      ${marks&&!corr?`<div class="hint">${can?"Les ✓ / ✗ montrent tes réussites ; les bonnes réponses ne sont pas affichées tant que tu peux refaire le QCM.":"Les bonnes réponses ne sont pas affichées."}</div>`:""}</div>
      ${can||QV.prof?`<button class="btn primary" data-act="qvRedo">↺ Refaire le QCM</button>`:""}</section>`
    :`<section class="card"><p style="margin:0">${QV.prof?"Essai : vos réponses ne sont pas enregistrées.":!ouvert?"<b>Ce QCM n'est pas ouvert.</b> Ton enseignant l'ouvre pendant la séance.":Q.essais===1?"<b>Une seule chance :</b> vérifie bien tes réponses avant de valider.":`Tu as ${Q.essais===0?"autant d'essais que tu veux":`${rest} essai${rest>1?"s":""}`} tant que le QCM est ouvert.`}</p></section>`;
  return`<div class="stack qv"><div class="row"><button class="btn ghost small" data-act="qvBack">← Retour</button><span class="spacer"></span><span class="hint">📝 ${Q.questions.length} question${Q.questions.length>1?"s":""} · noté sur ${fmtN(Q.sur)}</span></div>
    <section class="class-hero"><span class="eyebrow">QCM${dossier?" · "+esc(dossier.titre):""}</span><h2>${esc(Q.titre)}</h2></section>
    ${VUE&&!QV.prof?"":""}${head}${fini||ouvert?qs:""}
    ${!fini&&ouvert?`<button class="btn primary big" data-act="qvValider">Valider mes réponses (${nb} / ${Q.questions.length})</button>`:""}</div>`}
async function qvValider(){const{Q}=QV,manq=Q.questions.length-Object.keys(QV.sel).filter(k=>(QV.sel[k]||[]).length).length;
  confirmBox("Valider le QCM ?",`${manq?`<b>${manq} question${manq>1?"s":""} sans réponse.</b><br>`:""}${QV.prof?"Essai : rien n'est enregistré.":Q.essais===1?"Tu ne pourras plus modifier tes réponses.":"Cet essai sera compté."}`,"Valider",async()=>{closeModal();
    if(QV.prof){if(!Object.keys(QV.cle||{}).length){try{QV.cle=((await fb.getQcmCle(QV.id))||{}).cle||{}}catch(e){}}QV.fini=true;rerenderKeep();window.scrollTo(0,0);return}
    const rep0=QV.rep,reps=clone(QV.sel),d={qcmId:QV.id,profId:me.profId,classeId:me.classeId,eleveUid:me.uid,login:me.login,numero:me.numero||null,reponses:reps,date:new Date().toISOString()};
    try{if(!rep0){d.essais=1;d.prec=[];await fb.createQcmRep(QV.id+"__"+me.uid,d)}
      else{const prec=[...(rep0.prec||[]),{r:rep0.reponses,date:rep0.date}].slice(-20);d.essais=(rep0.essais||1)+1;d.prec=prec;await fb.updateQcmRep(QV.id+"__"+me.uid,d)}
      QV.rep=d;try{QV.cle=((await fb.getQcmCle(QV.id))||{}).cle||null}catch(e){QV.cle=null}QV.fini=true;QV.sel={};toast("Réponses envoyées");rerenderKeep();window.scrollTo(0,0)}
    catch(e){toast(e&&e.code==="permission-denied"?"Le QCM n'est plus ouvert ou tu n'as plus d'essai.":authMsg(e))}})}
function qvClick(a,b){if(!QV)return false;
  if(a==="qvBack"){const bk=QV.back;QV=null;if(bk==="qcmEd"&&QE){go("qcmEd")}else if(bk==="enclasse")go("enclasse");else if(dossier)openDossier(dossier.id);else go("home");return true}
  if(a==="qvValider"){qvValider();return true}
  if(a==="qvRedo"){QV.fini=false;QV.sel={};rerenderKeep();window.scrollTo(0,0);return true}
  return false}
function qvField(t){if(!QV||QV.fini)return;const q=QV.Q.questions.find(x=>x.id===t.dataset.qv),k=+t.dataset.k;if(!q)return;
  if(q.type==="plusieurs"){const s=new Set(QV.sel[q.id]||[]);t.checked?s.add(k):s.delete(k);QV.sel[q.id]=[...s]}else QV.sel[q.id]=[k];
  t.closest(".qv-reps").querySelectorAll(".qv-r").forEach(l=>l.classList.toggle("on",l.querySelector("input").checked));
  const bt=document.querySelector('[data-act="qvValider"]');if(bt)bt.textContent=`Valider mes réponses (${Object.keys(QV.sel).filter(x=>(QV.sel[x]||[]).length).length} / ${QV.Q.questions.length})`}
document.addEventListener("change",e=>{const t=e.target;if(t.dataset&&t.dataset.qe&&QE&&route.name==="qcmEd")qeField(t);else if(t.dataset&&t.dataset.qv&&route.name==="qcm")qvField(t)});
document.addEventListener("input",e=>{const t=e.target;if(t.dataset&&t.dataset.qe&&QE&&route.name==="qcmEd"&&(t.tagName==="TEXTAREA"||t.type==="text"||!t.type)&&t.tagName!=="SELECT")qeField(t)});

/* ---------- Report dans le tableau des carnets ---------- */
let QS=null;
async function qsLoad(act){QS=null;try{const all=(await fb.listQcms(me.uid)).filter(q=>q.carnet===act);if(!all.length)return;
    const items=await Promise.all(all.map(async q=>{const[c,reps]=await Promise.all([fb.getQcmCle(q.id).catch(()=>null),fb.listQcmReps(q.id,me.uid,classe.id).catch(()=>[])]);return{Q:qNorm(q),id:q.id,cle:(c&&c.cle)||{},reps}}));
    const an=await fb.getAflNotes(classe.id+"__"+act).catch(()=>null);QS={act,items,notes:(an&&an.notes)||{}}}catch(e){console.warn(e)}}
// Valeur AFL retenue (QCM + carnet) pour un élève
function qsAfl(uid,afl,P,carnetVal){if(!QS)return null;const its=QS.items.filter(x=>x.Q.afl===afl);if(!its.length)return null;
  const ns=its.map(x=>{const rep=x.reps.find(r=>r.eleveUid===uid);const n=rep?qcmRetenue(x.Q,x.cle,rep):null;return n?n.note/x.Q.sur:null});
  const sur=its.reduce((a,x)=>a+x.Q.sur,0),done=ns.filter(v=>v!==null);
  const manuel=((QS.notes[uid]||{})[afl]);
  let auto=null;if(done.length&&P){const qp=Math.min(sur,P),r=done.reduce((a,b)=>a+b,0)/its.length,reste=P-qp;
    auto=reste>0?(carnetVal===null||carnetVal===undefined?null:qp*r+carnetVal*reste/P):qp*r;if(auto!==null)auto=Math.round(auto*100)/100}
  return{afl,P,auto,manuel:manuel===undefined?null:manuel,val:manuel!==undefined&&manuel!==null?manuel:auto,n:done.length,tot:its.length}}
const qsAfls=()=>QS?[...new Set(QS.items.map(x=>x.Q.afl))].sort():[];
async function qsSetNote(uid,afl,v){const n=JSON.parse(JSON.stringify(QS.notes));n[uid]={...(n[uid]||{})};if(v===null)delete n[uid][afl];else n[uid][afl]=v;
  try{await fb.setAflNotes(classe.id+"__"+QS.act,{profId:me.uid,classeId:classe.id,activite:QS.act,notes:n});QS.notes=n;toast("Note retenue enregistrée");rerenderKeep()}catch(e){toast(authMsg(e))}}
document.addEventListener("change",e=>{const t=e.target;if(!t.dataset||!t.dataset.qsn||route.name!=="suivi"||!QS)return;const[uid,afl]=t.dataset.qsn.split("|"),s=String(t.value).trim().replace(",",".");
  const v=s===""?null:parseFloat(s);if(v!==null&&!(v>=0)){toast("Note invalide");return}qsSetNote(uid,afl,v)});

/* ===================== Fiche d'observation cliquable « copie fidèle » (2026.11.21-2) =====================
   modele.gabarit = {html, css, ficheId} : mise en page de la fiche papier du prof, redessinée par l'IA.
   Chaque case à remplir y est un repère <span data-f="section.champ"></span>, remplacé à l'affichage par la case du moteur
   (mêmes valeurs, même correction, même coach, même note de juge). Le gabarit est nettoyé : ni script, ni lien, ni image externe. */
const FF_TAGS=new Set("div span p b strong i em u s br hr table thead tbody tfoot tr th td caption colgroup col h1 h2 h3 h4 h5 h6 ul ol li small sup sub mark section header footer label".split(" "));
const FF_ATTR=new Set(["class","style","colspan","rowspan","data-f","data-v","data-num","align","valign","width","height","title"]);
const ffBadCss=v=>/url\s*\(|expression|@import|javascript:|behavior|-moz-binding|position\s*:\s*(fixed|sticky)|<\//i.test(v);
function ffSanitize(html){const doc=new DOMParser().parseFromString(`<div id="ffr">${String(html||"").slice(0,120000)}</div>`,"text/html"),root=doc.getElementById("ffr");
  const walk=el=>{[...el.children].forEach(c=>{const t=c.tagName.toLowerCase();
    if(!FF_TAGS.has(t)){if(["script","style","iframe","object","embed","link","meta","img","svg","math","form","input","select","textarea","button","a","video","audio","template"].includes(t)){c.remove();return}
      const s=doc.createElement("span");while(c.firstChild)s.appendChild(c.firstChild);c.replaceWith(s);walk(s);return}
    [...c.attributes].forEach(a=>{const n=a.name.toLowerCase();if(!FF_ATTR.has(n)||(n==="style"&&ffBadCss(a.value)))c.removeAttribute(a.name)});
    if(c.hasAttribute("class"))c.setAttribute("class",c.getAttribute("class").split(/\s+/).filter(x=>/^[a-z][\w-]{0,40}$/i.test(x)).map(x=>"ff-"+x.replace(/^ff-/,"")).join(" "));
    walk(c)})};
  walk(root);return root.innerHTML}
// CSS du gabarit, limité au conteneur .ff-fiche (les classes du gabarit sont préfixées ff-)
function ffScopeCss(css){css=String(css||"").slice(0,30000).replace(/\/\*[\s\S]*?\*\//g,"").replace(/@[a-z-]+[^{;]*;/gi,"");
  let out="",i=0;const rules=[];let depth=0,start=0;
  for(;i<css.length;i++){if(css[i]==="{")depth++;else if(css[i]==="}"){depth--;if(depth<=0){rules.push(css.slice(start,i+1));start=i+1;depth=0}}}
  rules.forEach(r=>{const k=r.indexOf("{");let sel=r.slice(0,k).trim(),body=r.slice(k+1,-1);if(!sel||sel.startsWith("@")||body.includes("{"))return;if(ffBadCss(body))return;
    sel=sel.split(",").map(x=>x.trim()).filter(Boolean).map(x=>x.replace(/\.(?!ff-)([a-z][\w-]*)/gi,".ff-$1").replace(/^(html|body|:root)\b/i,"")).map(x=>".ff-fiche "+x.trim()).join(",");
    out+=sel+"{"+body.replace(/[<>]/g,"")+"}\n"});return out}
let FF_CACHE={};
function ffPrep(G){const key=G.html+"\u0000"+G.css;if(FF_CACHE.key===key)return FF_CACHE;
  const h=ffSanitize(G.html).replace(/<span data-f="([^"]+)"[^>]*>[\s\S]*?<\/span>/g,(m,p)=>`@@FF:${p}@@`);
  FF_CACHE={key,h,css:ffScopeCss(G.css),paths:[...h.matchAll(/@@FF:([^@]+)@@/g)].map(x=>x[1])};return FF_CACHE}
function normGabarit(g){if(!g||typeof g!=="object"||!g.html)return null;return{html:String(g.html).slice(0,120000),css:String(g.css||"").slice(0,30000),...(g.ficheId?{ficheId:String(g.ficheId)}:{})}}
// La fiche affichée : chaque repère devient la case du moteur, sans son intitulé (la fiche l'affiche déjà)
function ffHTML(M,s,base,lockFor,V,sm){const P=ffPrep(M.gabarit),done=new Set();
  const cell=path=>{const[a,b]=path.split(".");const S=gSec(M,a),f=S&&S.champs.find(c=>c.id===b);if(!f)return"";done.add(path);
    const f2={...f,label:"",aide:"",unite:"",ffTiles:f.type==="choix"&&(f.options||[]).length<=8};return`<span class="ff-cell ff-t-${f.type}${f.coach&&M.partage==="coach"?" ff-coach":""}" title="${esc(f.label)}">${gFieldHTML(M,s,S,f2,base,lockFor(f),V,sm&&sm[path])}</span>`};
  let h=(M.versions&&s?ffReorder(P.h,verOrdre(M,verN(M,s))):P.h).replace(/@@FF:([^@]+)@@/g,(m,p)=>cell(p));
  const rest=[];verSections(M,s).forEach(S=>S.champs.forEach(f=>{const p=S.id+"."+f.id;if(!done.has(p)&&f.type!=="resume")rest.push(`<div class="ff-rest">${gFieldHTML(M,s,S,f,base,lockFor(f),V,sm&&sm[p])}</div>`)}));
  return`<style>${P.css}</style><section class="card ff-wrap" id="gsec-ff"><div class="ff-scroll"><div class="ff-fiche">${h}</div></div>
    ${rest.length?`<div class="ff-more"><div class="hint" style="margin:6px 0">Autres cases de la fiche</div><div class="stack" style="gap:10px">${rest.join("")}</div></div>`:""}
    ${M.gabarit.ficheId&&me&&me.role!=="eleve"?`<button class="btn ghost small" data-act="ffOrig" style="margin-top:8px">📄 Voir la fiche d'origine</button>`:""}</section>`}
// Choix affiché en cases à cocher, comme sur la fiche papier (2026.11.21-7). Couleur automatique si l'option est une couleur.
const FF_COUL={jaune:"#fde68a",bleu:"#93c5fd",vert:"#86efac",rouge:"#fca5a5",orange:"#fdba74",violet:"#c4b5fd",rose:"#f9a8d4",gris:"#d1d5db",marron:"#d6b48a",noir:"#374151",blanc:"#ffffff",turquoise:"#99f6e4",or:"#fcd34d",argent:"#e5e7eb",bronze:"#e3b78a"};
const ffCoul=o=>{const n=String(o).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim();return FF_COUL[n]||FF_COUL[n.split(/\s+/)[0]]||""};
function ffTiles(f,v,id,k,L){return`<div class="ff-tiles" role="radiogroup">${(f.options||[]).map((o,i)=>{const c=ffCoul(o),on=v===o;
  return`<label class="ff-tile${on?" on":""}${c?" coul":""}${c==="#374151"?" fonce":""}"${c?` style="background:${c}"`:""}><input type="radio" name="${id}" id="${id}-${i}" data-k="${k}" value="${esc(o)}" data-rerender ${on?"checked":""} ${L?"disabled":""}><span class="ff-box" aria-hidden="true">${on?"✓":""}</span><span class="ff-opt">${esc(o)}</span></label>`}).join("")}</div>`}
// Carte de l'éditeur (onglet Page)
function ffEdCard(M){const P=ffPrep(M.gabarit),all=[];M.sections.forEach(S=>S.champs.forEach(f=>all.push(S.id+"."+f.id)));const manq=all.filter(p=>!P.paths.includes(p)).length;
  return`<section class="card stack" style="gap:8px;border:2px solid #5b5bd6"><div class="sec-h"><h3>🖼️ Copie fidèle de votre fiche</h3></div>
    <p class="hint" style="margin:0">La page garde la mise en page de votre fiche papier. Les cases ci-dessous (types, coach, calculs) se placent dans la fiche ; leur intitulé sert d'aide. ${manq?`${manq} case${manq>1?"s":""} ne figure${manq>1?"nt":""} pas dans la fiche : elle${manq>1?"s":""} s'affiche${manq>1?"nt":""} en dessous.`:""} Pour changer la mise en page, utilisez « Modifier en parlant à l'IA ».</p>
    <div class="row">${M.gabarit.ficheId?`<button class="btn small" data-act="ffOrig">📄 Voir la fiche d'origine</button>`:""}<button class="btn small" data-act="mTab" data-t="apercu">▶ Voir la fiche cliquable</button><button class="btn ghost small danger" data-act="ffDrop">Retirer la mise en page</button></div></section>`}
async function ffOrig(){const id=MOD&&MOD.gabarit&&MOD.gabarit.ficheId||modeleEdit&&modeleEdit.draft.gabarit&&modeleEdit.draft.gabarit.ficheId;if(!id)return;
  try{const f=await fb.getFiche(id);if(!f)throw{code:"not-found"};await loadFicheData(f);openModal(`<h3>Fiche d'origine</h3><div style="max-height:70vh;overflow:auto">${vFicheViewer(f)}</div><button class="btn" data-mact="close">Fermer</button>`)}catch(e){toast(authMsg(e))}}
function ffClick(a,b){
  if(a==="ffOrig"){ffOrig();return true}
  if(a==="ffDrop"&&modeleEdit){confirmBox("Retirer la mise en page ?","Le carnet garde ses cases, mais s'affichera comme un carnet classique (une partie sous l'autre).","Retirer",()=>{closeModal();mutDraft(M=>{delete M.gabarit})},true);return true}
  if(a==="ffVer"){verSet(b.dataset.n);return true}
  if(a==="ffVerU"||a==="ffVerMix")return verProfClick(a,b);
  if(a==="ffVerDrop"||a==="ffVerCree")return verEdClick(a);
  return false}

/* ===================== Versions d'une fiche (2026.11.21-8) =====================
   modele.versions = {nb, blocs:[{id,nom}], ordres?:[[id…]…]} : une seule fiche, plusieurs versions où seul l'ordre
   des ateliers change (par défaut : décalage d'un cran, la version 2 commence au 2e atelier…).
   bloc.id = id de la section de l'atelier ; dans le gabarit, le bloc de l'atelier porte data-v="id" et son numéro data-num.
   La version d'une page est dans valeurs._version = {n, par:"prof"|"coach"|"auto", t}. Les résultats restent rangés
   par atelier (mêmes cases) : correction et note inchangées.
   Lancement de la séance (prof) : seanceJour.versions[modeleId] = {nb, titre, t, par:{clé:{n,l,t}}} ; clé = id du carnet de groupe ou uid. */
function normVersions(v){if(!v||typeof v!=="object")return null;const ids=new Set();
  const blocs=(Array.isArray(v.blocs)?v.blocs:[]).map(b=>typeof b==="string"?{id:b,nom:b}:b).filter(b=>b&&b.id!=null&&String(b.id).trim())
    .map(b=>({id:String(b.id).trim().slice(0,60),nom:String(b.nom||b.id).slice(0,80)})).filter(b=>!ids.has(b.id)&&ids.add(b.id)).slice(0,20);
  if(blocs.length<2)return null;
  const ordres=(Array.isArray(v.ordres)?v.ordres:[]).map(o=>Array.isArray(o)?[...new Set(o.map(String).filter(x=>ids.has(x)))]:[]).filter(o=>o.length).slice(0,20);
  let nb=parseInt(v.nb);if(!(nb>=2))nb=ordres.length>=2?ordres.length:blocs.length;nb=Math.min(20,Math.max(2,nb));
  const out={nb,blocs};if(ordres.length&&ordres.some((o,i)=>o.join("|")!==verRot(blocs,i).join("|")))out.ordres=ordres;return out}
const verRot=(blocs,k)=>{const ids=blocs.map(b=>b.id),n=k%ids.length;return ids.slice(n).concat(ids.slice(0,n))};
function verOrdre(M,n){const V=M.versions,o=V.ordres&&V.ordres[n-1];if(!o)return verRot(V.blocs,n-1);return o.concat(V.blocs.map(b=>b.id).filter(x=>!o.includes(x)))}
const verN=(M,s)=>{const n=parseInt(s&&s.valeurs&&s.valeurs._version&&s.valeurs._version.n);return n>=1&&n<=M.versions.nb?n:1};
const verNom=(M,id)=>{const b=M.versions.blocs.find(x=>x.id===id);return b?b.nom:id};
const verHash=k=>{let h=7;for(const c of String(k))h=(h*31+c.charCodeAt(0))>>>0;return h};
// Version attribuée par le prof au lancement de la séance (élève ou groupe), sinon répartition automatique stable.
function gAutoVersion(M,s){if(!M.versions||!s||PREVIEW||RO||CORR||VUE||COACH||s.valide||!me||me.role!=="eleve")return;
  const sj=eleveClasse&&eleveClasse.seanceJour,key=isGroupe()?carnetId:me.uid;
  const e=sj&&sj.date===s.date&&sj.versions&&sj.versions[activite]&&sj.versions[activite].par&&sj.versions[activite].par[key];
  const cur=s.valeurs._version;let nv=null;
  if(e&&e.n>=1&&e.n<=M.versions.nb&&(!cur||(+e.t||0)>(+cur.t||0))&&(!cur||cur.n!==e.n))nv={n:e.n,par:"prof",t:+e.t||0};
  else if(!cur)nv={n:verHash(key+"|"+s.date)%M.versions.nb+1,par:"auto",t:0};
  if(nv){s.valeurs._version=nv;setTimeout(save,0)}}
// Bandeau en haut de la fiche : « Version 3 : commence par Farmer carry » + changement d'un clic (coach, aperçu)
function verBar(M,s,edit){if(!M.versions)return"";const n=verN(M,s),o=verOrdre(M,n),nb=M.versions.nb;
  return`<div class="ver-bar"><div class="ver-t"><b>Version ${n}</b> : commence par <b>${esc(verNom(M,o[0]))}</b></div>
    <div class="ver-o hint">${o.map((id,i)=>`${i+1}. ${esc(verNom(M,id))}`).join(" · ")}</div>
    ${edit?`<div class="ver-ch" role="group" aria-label="Changer de version">${Array.from({length:nb},(x,i)=>`<button type="button" data-act="ffVer" data-n="${i+1}" aria-pressed="${n===i+1}">V${i+1}</button>`).join("")}</div>`:""}</div>`}
// Réordonne les blocs data-v du gabarit (chaque parent garde ses emplacements) et renumérote data-num.
let VER_CACHE={};
function ffReorder(h,ordre){const key=h.length+"|"+ordre.join("|");if(VER_CACHE.h===h&&VER_CACHE.key===key)return VER_CACHE.out;
  const doc=new DOMParser().parseFromString(`<div id="vr">${h}</div>`,"text/html"),root=doc.getElementById("vr");
  const els=[...root.querySelectorAll("[data-v]")].filter(e=>!e.parentElement.closest("[data-v]"));
  const parents=[...new Set(els.map(e=>e.parentElement))];
  parents.forEach(p=>{const kids=[...p.children],slots=[],grp={},seen=[];
    kids.forEach((k,i)=>{const id=k.getAttribute("data-v");if(id==null||k.parentElement.closest("[data-v]"))return;slots.push(i);if(!grp[id]){grp[id]=[];seen.push(id)}grp[id].push(k)});
    const seq=ordre.filter(id=>grp[id]).concat(seen.filter(id=>!ordre.includes(id))),nw=seq.flatMap(id=>grp[id]);
    if(nw.length!==slots.length)return;const arr=kids.slice();slots.forEach((si,j)=>arr[si]=nw[j]);p.replaceChildren(...arr)});
  const pos={};ordre.forEach((id,i)=>pos[id]=i+1);
  root.querySelectorAll("[data-v]").forEach(b=>{const id=b.getAttribute("data-v");if(!pos[id])return;
    const nums=b.matches("[data-num]")?[b]:[...b.querySelectorAll("[data-num]")].filter(x=>x.closest("[data-v]")===b);nums.forEach(x=>x.textContent=String(pos[id]))});
  VER_CACHE={h,key,out:root.innerHTML};return VER_CACHE.out}
// Carnet classique : les sections des ateliers prennent l'ordre de la version (les autres restent à leur place)
function verSections(M,s,list){list=list||M.sections;if(!M.versions)return list;const o=verOrdre(M,verN(M,s)),ids=new Set(o);
  const slots=[],grp=list.filter((S,i)=>{if(ids.has(S.id)){slots.push(i);return true}return false});
  const nw=o.map(id=>grp.find(S=>S.id===id)).filter(Boolean);if(nw.length!==slots.length)return list;const arr=list.slice();slots.forEach((si,j)=>arr[si]=nw[j]);return arr}
function verSet(n){const s=curS&&data?curS():null;if(!s||!MOD||!MOD.versions)return;n=Math.max(1,Math.min(MOD.versions.nb,parseInt(n)||1));
  if(COACH){if(s.valide)return;s.valeurs._version={n,par:"coach",t:Date.now()};save();rerenderKeep();toast(`Version ${n} : commence par ${verNom(MOD,verOrdre(MOD,n)[0])}`);return}
  if(PREVIEW||VUE){s.valeurs._version={n,par:"prof",t:Date.now()};rerenderKeep()}}

/* --- Prof : répartition des versions au lancement de la séance, changement d'un clic --- */
function verShuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
async function verUnites(mid){const[el,cs]=await Promise.all([fb.listEleves(classe.id),fb.listCarnets(me.uid,classe.id,mid).catch(()=>[])]);
  const inG=new Set(),u=[];el.sort((a,b)=>(a.numero||0)-(b.numero||0));const num={};el.forEach(e=>num[e.id]=e.numero||0);
  cs.filter(c=>c.groupe&&(c.membres||[]).length).forEach(c=>{c.membres.forEach(x=>inG.add(x));u.push({k:c.id,l:"👥 "+(c.logins||[]).join(", "),o:Math.min(...c.membres.map(x=>num[x]??999))})});
  el.filter(e=>!inG.has(e.id)).forEach(e=>u.push({k:e.id,l:e.login||("n°"+(e.numero||"?")),o:e.numero||0}));
  return u.sort((a,b)=>a.o-b.o)}
async function verRepartir(sj,dd,seul){const old=sj.versions||{},out={};
  for(const it of (sj.items||[]).filter(x=>x.t==="carnet")){if(seul&&it.id!==seul){if(old[it.id])out[it.id]=old[it.id];continue}
    const x=(dd&&dd.all||[]).find(y=>y.id===it.id);let M0=x&&x.M;try{if(!M0&&x&&x.doc)M0=normModele(x.doc.modele||x.doc.brouillon)}catch(e){M0=null}
    if(!M0||!M0.versions)continue;const nb=M0.versions.nb,t=Date.now();
    const keep=!seul&&old[it.id]&&old[it.id].nb===nb&&sj.date===old[it.id].d?old[it.id]:null;if(keep){out[it.id]=keep;continue}
    const us=verShuffle(await verUnites(it.id)),par={};us.forEach((u,i)=>par[u.k]={n:i%nb+1,l:u.l.slice(0,120),t});
    out[it.id]={nb,titre:String(it.titre||M0.titre||"").slice(0,80),d:sj.date,t,par,noms:verOrdreNoms(M0)}}
  if(Object.keys(out).length)sj.versions=out;else delete sj.versions;return sj}
const verOrdreNoms=M=>Array.from({length:M.versions.nb},(x,i)=>verNom(M,verOrdre(M,i+1)[0]));
function vVersionsProf(sj){const vs=sj&&sj.date===today()&&sj.versions;if(!vs||!Object.keys(vs).length)return"";
  return Object.entries(vs).map(([mid,v])=>{const ents=Object.entries(v.par||{}).sort((a,b)=>a[1].l.localeCompare(b[1].l,"fr",{numeric:true}));
    const cnt=Array.from({length:v.nb},(x,i)=>ents.filter(e=>e[1].n===i+1).length);
    return`<div class="ver-prof stack" style="gap:6px"><div class="row" style="gap:8px"><strong>🔢 Versions · ${esc(v.titre||"Fiche")}</strong><span class="spacer"></span><button class="btn ghost small" data-act="ffVerMix" data-m="${esc(mid)}">🔀 Répartir à nouveau</button></div>
      <div class="hint">${cnt.map((c,i)=>`V${i+1}${v.noms&&v.noms[i]?" ("+esc(v.noms[i])+")":""} : ${c}`).join(" · ")} — touchez une version pour la changer.</div>
      <div class="ver-list">${ents.map(([k,e])=>`<div class="ver-u"><span class="ver-l">${esc(e.l)}</span><span class="ver-ch sm">${Array.from({length:v.nb},(x,i)=>`<button type="button" data-act="ffVerU" data-m="${esc(mid)}" data-k="${esc(k)}" data-n="${i+1}" aria-pressed="${e.n===i+1}">${i+1}</button>`).join("")}</span></div>`).join("")||'<span class="hint">Aucun élève dans la classe.</span>'}</div></div>`}).join("")}
async function verProfSave(sj,msg){try{await fb.updateClasse(classe.id,{seanceJour:sj});classe.seanceJour=sj;if(msg)toast(msg);rerenderKeep()}catch(x){toast(authMsg(x))}}
function verProfClick(a,b){const sj0=classe&&classe.seanceJour;if(!sj0||!sj0.versions)return true;const sj=clone(sj0),mid=b.dataset.m,v=sj.versions[mid];if(!v)return true;
  if(a==="ffVerU"){const e=v.par[b.dataset.k];if(!e)return true;const n=parseInt(b.dataset.n);if(e.n===n)return true;e.n=n;e.t=Date.now();verProfSave(sj,`${e.l} : version ${n}`);return true}
  if(a==="ffVerMix"){(async()=>{const dd=(classeDossiers||[]).find(x=>x.d.id===sj.dossierId);if(!dd){toast("Activité introuvable");return}await verRepartir(sj,dd,mid);verProfSave(sj,"Versions réparties à nouveau")})();return true}
  return true}

/* --- Éditeur : carte « Versions » (onglet Page) --- */
function verEdCard(M){const V=M.versions;
  if(!V){const ok=M.sections.filter(S=>S.champs.some(f=>f.type!=="resume"&&f.type!=="pseudo")).length>=2;if(!ok)return"";
    return`<details class="card madv"><summary>🔢 Versions de la fiche (ordre des ateliers décalé)</summary><p class="hint">Votre fiche papier existe en plusieurs versions où seul l'ordre des ateliers change ? L'appli garde une seule fiche et en tire les versions : au lancement de la séance, elle les répartit entre les élèves ou les groupes. Chaque partie du carnet = un atelier.${M.gabarit?" Pour que la mise en page suive l'ordre, demandez-le aussi à l'IA (« Modifier en parlant à l'IA » : « ma fiche a des versions où l'ordre des ateliers change »).":""}</p>
      <button class="btn small" data-act="ffVerCree">Créer les versions à partir des parties</button></details>`}
  const nbMax=Math.min(20,V.ordres?Math.max(V.ordres.length,V.blocs.length):V.blocs.length);
  return`<section class="card stack" style="gap:8px;border:2px solid #0f766e"><div class="sec-h"><h3>🔢 ${V.nb} versions de la fiche</h3></div>
    <p class="hint" style="margin:0">${V.ordres?"Ordre des ateliers propre à chaque version (lu sur votre fiche).":"La version 2 commence au 2e atelier, la version 3 au 3e… (décalage d'un cran)."} Au lancement de la séance (« Séance d'aujourd'hui »), l'appli répartit les versions entre les élèves ou les groupes ; vous pouvez en changer d'un clic, et le coach aussi sur sa fiche. Les résultats restent rangés par atelier : correction et note inchangées.</p>
    <div class="hint">${Array.from({length:V.nb},(x,i)=>`<div><b>V${i+1}</b> : ${verOrdre(M,i+1).map(id=>esc(verNom(M,id))).join(" → ")}</div>`).join("")}</div>
    <div class="row" style="align-items:end">${mSel("versions.nb",V.nb,Array.from({length:nbMax-1},(x,i)=>[i+2,`${i+2} versions`]),"Nombre de versions",'data-mt="num"')}<button class="btn ghost small danger" data-act="ffVerDrop">Supprimer les versions</button></div></section>`}
function verEdClick(a){if(!modeleEdit)return true;
  if(a==="ffVerDrop"){mutDraft(M=>{delete M.versions});return true}
  if(a==="ffVerCree"){mutDraft(M=>{const ss=M.sections.filter(S=>S.champs.some(f=>f.type!=="resume"&&f.type!=="pseudo"));M.versions={nb:ss.length,blocs:ss.map(S=>({id:S.id,nom:S.titre||S.id}))}});return true}
  return true}

/* ====================================================================
   Établissements, actualités et défis d'établissement, inscriptions,
   noms des élèves (liste locale + chiffrement par phrase secrète) — 2026.11.21-2
   ==================================================================== */
let ET={etab:null,dem:null,loaded:false,loading:null,demandes:[],sugg:null,form:{nom:"",commune:""}};
const ET_STOP=new Set("college lycee cite scolaire de du des la le les l d et en au aux a polyvalent polyvalente general generale technologique professionnel professionnelle prive privee public publique lp lgt lpo clg ensemble etablissement ecole groupe".split(" "));
const etTok=s=>norm(s).replace(/['’`\-_.,;:()"/«»]/g," ").split(" ").filter(w=>w&&!ET_STOP.has(w)).map(w=>w==="saint"?"st":w==="sainte"?"ste":w);
const etNorm=s=>etTok(s).join(" ");
const etNormCom=s=>norm(s).replace(/['’`\-_.,;:()"/]/g," ").split(" ").filter(Boolean).map(w=>w==="saint"?"st":w==="sainte"?"ste":w).join(" ");
function etLev(a,b){if(a===b)return 0;const m=a.length,n=b.length;if(!m||!n)return m||n;let p=Array.from({length:n+1},(_,j)=>j);
  for(let i=1;i<=m;i++){const c=[i];for(let j=1;j<=n;j++)c[j]=Math.min(p[j]+1,c[j-1]+1,p[j-1]+(a[i-1]===b[j-1]?0:1));p=c}return p[n]}
const etSim=(a,b)=>!a||!b?0:a===b?1:1-etLev(a,b)/Math.max(a.length,b.length);
// Score tolérant aux fautes : nom (texte entier ou mot à mot) 75 %, commune 25 %
function etScore(nom,commune,E){const a=etNorm(nom),b=E.nomNorm||etNorm(E.nom),ta=a.split(" ").filter(Boolean),tb=b.split(" ").filter(Boolean);
  let s=etSim(a,b);if(ta.length&&tb.length){const t=ta.reduce((m,w)=>m+Math.max(...tb.map(v=>etSim(w,v))),0)/Math.max(ta.length,tb.length);s=Math.max(s,t)}
  const c=etSim(etNormCom(commune),E.communeNorm||etNormCom(E.commune));return{nom:s,com:c,tot:s*.75+c*.25}}
const estAdmin=()=>!!(ET.etab&&(ET.etab.admins||[]).includes(me.uid));
async function etLoad(){if(!me||me.role==="eleve")return;if(ET.loading)return ET.loading;
  ET.loading=(async()=>{try{const[L,D]=await Promise.all([fb.listMesEtabs(me.uid),fb.listMesEtabDemandes(me.uid).catch(()=>[])]);
    ET.etab=L[0]||null;ET.dem=D[0]||null;if(ET.etab&&ET.dem){fb.deleteEtabDemande(ET.dem.id).catch(()=>{});ET.dem=null}
    ET.demandes=ET.etab&&estAdmin()?await fb.listEtabDemandes(ET.etab.id).catch(()=>[]):[];ET.loaded=true;etSyncClasses();etPullNoms()}
    catch(e){console.warn("établissement",e);ET.loaded=true}finally{ET.loading=null}})();return ET.loading}
// Les classes du prof portent l'établissement : ses élèves voient ainsi les actualités et défis communs.
async function etSyncClasses(){const id=ET.etab?ET.etab.id:"";for(const c of classes||[]){if((c.etabId||"")===id)continue;try{await fb.updateClasse(c.id,{etabId:id});c.etabId=id}catch(e){console.warn(e)}}}
function etRefresh(){if(["compte","classes","classe","profAccueil"].includes(route.name))rerenderKeep()}
/* --- Carte « Mon établissement » (onglet Compte) --- */
function vEtabCard(){if(!ET.loaded){etLoad().then(etRefresh);return`<section class="card"><h3>🏫 Mon établissement</h3><p class="hint" style="margin:0">Chargement…</p></section>`}
  const E=ET.etab;
  if(E){const adm=estAdmin(),em=E.emails||{},cle=etCleLocale(E.id);
    return`<section class="card stack" style="gap:10px"><div class="sec-h"><h3>🏫 ${esc(E.nom)}</h3><span class="hint">${esc(E.commune||"")}</span><span class="spacer"></span><span class="chip">${adm?"Administrateur":"Membre"}</span></div>
    ${adm&&ET.demandes.length?`<div class="et-dem"><b>Demandes pour rejoindre l'établissement</b>${ET.demandes.map(d=>`<div class="dem"><div><strong>${esc(d.email||"")}</strong> <span class="hint">· ${esc(tsDate(d.createdAt))}</span></div><div class="row"><button class="btn primary small" data-et="etAccept" data-id="${d.id}">Accepter</button><button class="btn ghost small" data-et="etRefuse" data-id="${d.id}">Refuser</button></div></div>`).join("")}</div>`:""}
    <details${adm?" open":""}><summary><strong>Professeurs (${(E.profs||[]).length})</strong></summary><div class="list-s" style="margin-top:8px">${(E.profs||[]).map(u=>{const a=(E.admins||[]).includes(u);return`<div class="s-item" style="cursor:default"><div><strong>${esc(em[u]||"Professeur")}</strong>${u===me.uid?' <span class="hint">(vous)</span>':""}<div class="hint">${a?"Administrateur":"Membre"}</div></div>
      ${adm&&u!==me.uid?`<div class="row" style="gap:6px;flex-wrap:nowrap">${a?`<button class="btn ghost small" data-et="etAdmin" data-u="${u}" data-v="0">Retirer admin</button>`:`<button class="btn ghost small" data-et="etAdmin" data-u="${u}" data-v="1">Nommer admin</button>`}<button class="btn ghost small danger" data-et="etRetirer" data-u="${u}" aria-label="Retirer de l'établissement">✕</button></div>`:""}</div>`}).join("")}</div>
      ${adm?`<p class="hint" style="margin:6px 0 0">Nommez au moins un autre administrateur : si vous partez, il pourra valider les nouvelles demandes.</p>`:""}</details>
    <div class="et-key"><b>🔑 Phrase secrète de l'établissement</b>
      <p class="hint" style="margin:4px 0 8px">Elle chiffre les noms de vos élèves sur cet appareil avant tout envoi : le serveur ne voit jamais les noms. Elle se transmet de vive voix ou par l'ENT, jamais par l'appli.</p>
      ${!E.verif?(adm?`<button class="btn small primary" data-et="etPhraseSet">Choisir la phrase secrète</button>`:`<p class="hint" style="margin:0">L'administrateur n'a pas encore choisi de phrase secrète. Les noms restent seulement sur cet appareil.</p>`)
        :cle?`<div class="row"><span class="chip" style="border-color:var(--d4);color:var(--d4)">✓ Phrase saisie sur cet appareil</span><button class="btn ghost small" data-et="etSyncNoms">↻ Synchroniser les noms</button><button class="btn ghost small" data-et="etOublier">Oublier sur cet appareil</button>${adm?`<button class="btn ghost small" data-et="etPhraseSet">Changer la phrase</button>`:""}</div>`
        :`<div class="row"><button class="btn small primary" data-et="etPhraseAsk">Saisir la phrase secrète</button><span class="hint">Une seule fois par appareil.</span></div>`}</div>
    <div class="row"><button class="btn small" data-et="etRgpd">📄 Information des familles (RGPD)</button><span class="spacer"></span><button class="btn ghost small danger" data-et="etQuitter">Quitter l'établissement</button></div></section>`}
  if(ET.dem)return`<section class="card stack" style="gap:8px"><h3>🏫 Mon établissement</h3><p style="margin:0">Demande envoyée pour rejoindre <b>${esc(ET.dem.nom||"l'établissement")}</b>${ET.dem.commune?` (${esc(ET.dem.commune)})`:""}.</p>
    <p class="hint" style="margin:0">Un administrateur de l'établissement doit la valider. En attendant, les fonctions d'établissement (actualités et défis communs, noms partagés) ne sont pas disponibles.</p>
    <div class="row"><button class="btn ghost small" data-et="etRecharger">↻ Vérifier</button><button class="btn ghost small danger" data-et="etAnnulerDem">Annuler la demande</button></div></section>`;
  const S=ET.sugg;
  return`<section class="card stack" style="gap:10px"><h3>🏫 Mon établissement</h3><p class="hint" style="margin:0">Indiquez votre établissement pour partager avec vos collègues des actualités et des défis communs à tous vos élèves, et les inscriptions aux compétitions.</p>
    <div class="grid2"><label class="f">Nom de l'établissement<input id="et-nom" maxlength="80" placeholder="ex. Lycée Raymond Poincaré" value="${esc(ET.form.nom)}"></label><label class="f">Commune<input id="et-com" maxlength="60" placeholder="ex. Bar-le-Duc" value="${esc(ET.form.commune)}"></label></div>
    <div class="err" id="et-err"></div>
    ${S?`<div class="et-sugg">${S.length?`<b>Vouliez-vous dire…</b>${S.map(x=>`<div class="s-item" style="cursor:default"><div><strong>${esc(x.nom)}</strong><div class="hint">${esc(x.commune||"")} · ${(x.profs||[]).length} prof${(x.profs||[]).length>1?"s":""}</div></div><button class="btn primary small" data-et="etRejoindre" data-id="${x.id}">Rejoindre</button></div>`).join("")}`:`<p class="hint" style="margin:0">Aucun établissement ressemblant n'est encore inscrit.</p>`}
      <button class="btn small" data-et="etCreer">${S.length?"Non, ":""}Créer « ${esc(ET.form.nom)}${ET.form.commune?` (${esc(ET.form.commune)})`:""} »</button>
      <p class="hint" style="margin:0">Rejoindre : votre demande est validée par un administrateur de l'établissement. Créer : vous en devenez l'administrateur.</p></div>`
    :`<button class="btn primary" data-et="etChercher" style="justify-self:start">Continuer</button>`}</section>`}
function vEtabNudge(){if(!ET.loaded||ET.etab||ET.dem||load("etNudgeOff"))return"";
  return`<section class="card"><div class="row"><div><strong>🏫 Indiquez votre établissement</strong><div class="hint">Actualités et défis communs avec vos collègues, inscriptions aux compétitions.</div></div><span class="spacer"></span><button class="btn small" data-nav="compte">Indiquer</button><button class="btn ghost small" data-et="etNudgeOff" aria-label="Masquer">✕</button></div></section>`}
async function etChercher(){const nom=($("#et-nom")||{}).value||"",com=($("#et-com")||{}).value||"",err=$("#et-err");ET.form={nom:nom.trim(),commune:com.trim()};
  if(etNorm(nom).length<2||!com.trim()){if(err)err.textContent="Indiquez le nom de l'établissement et la commune.";return}
  try{const L=await fb.listEtabs();ET.sugg=L.map(x=>({...x,_s:etScore(nom,com,x)})).filter(x=>x._s.tot>=.6||(x._s.nom>=.8)||(x._s.com>=.9&&x._s.nom>=.45)).sort((a,b)=>b._s.tot-a._s.tot).slice(0,4);rerenderKeep()}
  catch(e){if(err)err.textContent=authMsg(e)}}
async function etClick(a,b){
  if(a==="etNudgeOff"){store("etNudgeOff",1);rerenderKeep();return}
  if(a==="etChercher"){etChercher();return}
  if(a==="etRecharger"){ET.loaded=false;await etLoad();rerenderKeep();if(!ET.etab&&ET.dem)toast("Toujours en attente de validation");return}
  if(a==="etCreer"){const{nom,commune}=ET.form;if(!nom)return;b.disabled=true;
    try{const d={nom:nom.slice(0,80),nomNorm:etNorm(nom),commune:commune.slice(0,60),communeNorm:etNormCom(commune),createur:me.uid,admins:[me.uid],profs:[me.uid],emails:{[me.uid]:me.email||""}};
      const id=await fb.createEtab(d);ET.etab={id,...d};ET.sugg=null;etSyncClasses();toast("Établissement créé : vous en êtes l'administrateur");rerenderKeep()}catch(e){b.disabled=false;toast(authMsg(e))}return}
  if(a==="etRejoindre"){const x=(ET.sugg||[]).find(y=>y.id===b.dataset.id);if(!x)return;b.disabled=true;
    try{await fb.setEtabDemande(x.id,me.uid,{email:me.email||"",nom:x.nom,commune:x.commune||""});ET.dem={id:x.id+"__"+me.uid,etabId:x.id,nom:x.nom,commune:x.commune};ET.sugg=null;toast("Demande envoyée à l'administrateur");rerenderKeep()}catch(e){b.disabled=false;toast(authMsg(e))}return}
  if(a==="etAnnulerDem"){try{await fb.deleteEtabDemande(ET.dem.id);ET.dem=null;rerenderKeep()}catch(e){toast(authMsg(e))}return}
  const E=ET.etab;
  if(a==="etAccept"&&E){const d=ET.demandes.find(x=>x.id===b.dataset.id);if(!d)return;b.disabled=true;
    try{const profs=[...new Set([...(E.profs||[]),d.uid])],emails={...(E.emails||{}),[d.uid]:d.email||""};await fb.updateEtab(E.id,{profs,emails});E.profs=profs;E.emails=emails;
      await fb.deleteEtabDemande(d.id).catch(()=>{});ET.demandes=ET.demandes.filter(x=>x.id!==d.id);toast("Professeur ajouté");rerenderKeep()}catch(e){b.disabled=false;toast(authMsg(e))}return}
  if(a==="etRefuse"&&E){try{await fb.deleteEtabDemande(b.dataset.id);ET.demandes=ET.demandes.filter(x=>x.id!==b.dataset.id);rerenderKeep()}catch(e){toast(authMsg(e))}return}
  if(a==="etAdmin"&&E){const u=b.dataset.u,on=b.dataset.v==="1";let ad=(E.admins||[]).filter(x=>x!==u);if(on)ad.push(u);if(!ad.length)return;
    try{await fb.updateEtab(E.id,{admins:ad});E.admins=ad;toast(on?"Administrateur nommé":"Droits d'administrateur retirés");rerenderKeep()}catch(e){toast(authMsg(e))}return}
  if(a==="etRetirer"&&E){const u=b.dataset.u;confirmBox("Retirer ce professeur ?",`${esc((E.emails||{})[u]||"Ce professeur")} n'aura plus accès aux fonctions de l'établissement.`,"Retirer",async()=>{
    const emails={...(E.emails||{})};delete emails[u];const p={profs:(E.profs||[]).filter(x=>x!==u),admins:(E.admins||[]).filter(x=>x!==u),emails};
    try{await fb.updateEtab(E.id,p);Object.assign(E,p);closeModal();rerenderKeep()}catch(e){closeModal();toast(authMsg(e))}},true);return}
  if(a==="etQuitter"&&E){const seul=(E.profs||[]).length<=1,ad=estAdmin(),autresAd=(E.admins||[]).filter(x=>x!==me.uid);
    if(ad&&!seul&&!autresAd.length){toast("Nommez d'abord un autre administrateur");return}
    confirmBox(seul?"Supprimer l'établissement ?":"Quitter l'établissement ?",seul?"Vous êtes le seul professeur inscrit : l'établissement sera supprimé.":"Vos classes ne verront plus les actualités et défis de l'établissement.",seul?"Supprimer":"Quitter",async()=>{
      try{if(seul)await fb.deleteEtab(E.id);else{const emails={...(E.emails||{})};delete emails[me.uid];await fb.updateEtab(E.id,{profs:(E.profs||[]).filter(x=>x!==me.uid),admins:(E.admins||[]).filter(x=>x!==me.uid),emails})}
        ET.etab=null;ET.demandes=[];closeModal();await etSyncClasses();rerenderKeep()}catch(e){closeModal();toast(authMsg(e))}},true);return}
  if(a==="etPhraseSet"&&E){const chg=!!E.verif;openModal(`<h3>${chg?"Changer":"Choisir"} la phrase secrète</h3>
    <p style="margin:0" class="hint">Au moins 12 caractères, par exemple une petite phrase facile à dire (« les pingouins courent le 800 m »). Majuscules et accents comptent. Transmettez-la à vos collègues de vive voix ou par l'ENT : elle n'est jamais envoyée au serveur.</p>
    ${chg?`<p class="hint" style="margin:0">Les noms déjà chiffrés seront re-chiffrés avec la nouvelle phrase. Vos collègues devront la saisir à nouveau.</p>`:""}
    <label class="f">Phrase secrète<input id="ph-1" type="password" autocomplete="off" minlength="12"></label><label class="f">Confirmer<input id="ph-2" type="password" autocomplete="off"></label>
    <div class="err" id="ph-err"></div><div class="grid2"><button class="btn" data-mact="close">Annuler</button><button class="btn primary" data-et="etPhraseOk">Enregistrer</button></div>`);return}
  if(a==="etPhraseOk"&&E){const p1=$("#ph-1").value,p2=$("#ph-2").value,err=$("#ph-err");if(p1.trim().length<12){err.textContent="12 caractères minimum.";return}if(p1!==p2){err.textContent="Les deux saisies sont différentes.";return}
    if(E.verif&&!etCleLocale(E.id)){err.textContent="Saisissez d'abord l'ancienne phrase sur cet appareil (pour re-chiffrer les noms).";return}
    b.disabled=true;b.textContent="Chiffrement…";try{await etChangerPhrase(p1);closeModal();toast("Phrase secrète enregistrée");rerenderKeep()}catch(e){console.error(e);b.disabled=false;b.textContent="Enregistrer";err.textContent=authMsg(e)}return}
  if(a==="etPhraseAsk"&&E){openModal(`<h3>Phrase secrète de l'établissement</h3><p class="hint" style="margin:0">Demandez-la à l'administrateur (${esc((E.admins||[]).map(u=>(E.emails||{})[u]).filter(Boolean).join(", ")||"un collègue")}).</p>
    <label class="f">Phrase secrète<input id="ph-1" type="password" autocomplete="off"></label><div class="err" id="ph-err"></div><div class="grid2"><button class="btn" data-mact="close">Annuler</button><button class="btn primary" data-et="etPhraseTry">Valider</button></div>`);return}
  if(a==="etPhraseTry"&&E){const err=$("#ph-err");b.disabled=true;
    try{const k=await etDerive($("#ph-1").value,E.sel);const ok=await etDec(k,E.verif).then(v=>v==="carnet-eps").catch(()=>false);
      if(!ok){b.disabled=false;err.textContent="Phrase incorrecte (attention aux majuscules et aux accents).";return}
      await etGarderCle(E.id,k);closeModal();toast("Phrase enregistrée sur cet appareil");await etPullNoms(true);etPushTout();rerenderKeep()}catch(e){b.disabled=false;err.textContent=authMsg(e)}return}
  if(a==="etOublier"&&E){localStorage.removeItem("etabKey_"+E.id);ET._k=null;toast("Phrase oubliée sur cet appareil (les noms restent affichés ici)");rerenderKeep();return}
  if(a==="etSyncNoms"){await etPullNoms(true);await etPushTout();toast("Noms synchronisés");rerenderKeep();return}
  if(a==="etRgpd"){etRgpd();return}
  if(a==="etPrintRgpd"){$("#print").innerHTML=`<div class="rgpd-p">${$("#rgpd-txt").innerHTML}</div>`;window.print();return}
  // Noms des élèves (liste Pronote)
  if(a==="etColler"){openModal(`<h3>Coller la liste des élèves · ${esc(classe.nom)}</h3>
    <p class="hint" style="margin:0">Copiez la liste depuis Pronote (ou un tableur) et collez-la ici : une ligne par élève, dans l'ordre des numéros (N°1 sur la première ligne). Vous pouvez aussi commencer chaque ligne par le numéro (« 12 DUPONT Léa »).</p>
    <textarea id="nl-txt" style="min-height:200px" placeholder="DUPONT Léa&#10;MARTIN Hugo&#10;…"></textarea>
    <p class="hint" style="margin:0">🔒 Les noms restent sur cet appareil. Ils ne sont envoyés que chiffrés avec la phrase secrète de l'établissement, si elle a été saisie.</p>
    <div class="err" id="nl-err"></div><div class="grid2"><button class="btn" data-mact="close">Annuler</button><button class="btn primary" data-et="etCollerOk">Placer les noms</button></div>`);return}
  if(a==="etCollerOk"){const r=etParseListe($("#nl-txt").value);if(!r.length){$("#nl-err").textContent="Aucun nom trouvé.";return}
    const rep=getReperes(classe.id),byN={};eleves.forEach(e=>byN[e.numero]=e.id);let n=0;r.forEach(x=>{const id=byN[x.n];if(id){rep[id]=x.nom;n++}});
    store(reperesKey(classe.id),rep);etPushSoon(classe.id);closeModal();toast(`${n} nom${n>1?"s":""} placé${n>1?"s":""}${r.length>n?` · ${r.length-n} sans compte élève (créez d'autres comptes)`:""}`);rerenderKeep();return}
  if(a==="etExport"){const o={app:"carnet-eps-noms",v:1,date:today(),classes:{}};(classes||[]).forEach(c=>{const r=getReperes(c.id);if(Object.keys(r).length)o.classes[c.id]={nom:c.nom,noms:r}});
    const el=document.createElement("a");el.href=URL.createObjectURL(new Blob([JSON.stringify(o)],{type:"application/json"}));el.download=`noms-eleves-${today()}.json`;document.body.appendChild(el);el.click();el.remove();
    toast("Fichier enregistré : gardez-le en lieu sûr (il contient les noms)");return}
  if(a==="etImport"){const inp=document.createElement("input");inp.type="file";inp.accept=".json,application/json";inp.onchange=async()=>{try{const o=JSON.parse(await inp.files[0].text());if(o.app!=="carnet-eps-noms")throw new Error("Ce fichier n'est pas un export des noms.");
    let n=0;Object.entries(o.classes||{}).forEach(([cid,x])=>{if(!(classes||[]).some(c=>c.id===cid))return;const r={...getReperes(cid),...(x.noms||{})};store(reperesKey(cid),r);n++;etPushSoon(cid)});toast(`Noms importés pour ${n} classe${n>1?"s":""}`);rerenderKeep()}catch(e){toast(e.message||"Fichier illisible")}};inp.click();return}
  // Inscriptions (élève)
  if(a==="etIns"||a==="etDesins"){etInscrire(b.dataset.id,a==="etIns",b);return}
  // Prof : inscrits, défis et actualités d'établissement
  if(a==="etInscrits"){etVoirInscrits(b.dataset.id);return}
  if(a==="etInsCopy"){try{await navigator.clipboard.writeText(ETI.txt);toast("Liste copiée")}catch(e){toast("Copie impossible")}return}
  if(a==="etInsPdf"){$("#print").innerHTML=ETI.html;window.print();return}
  if(a==="etDefiAdd"){etDefiAdd();return}
  if(a==="etDefiDel"){try{await fb.deleteEtabDefi(b.dataset.id);PA.edefis=PA.edefis.filter(x=>x.id!==b.dataset.id);toast("Défi supprimé");rerenderKeep()}catch(e){toast(authMsg(e))}return}
  if(a==="etDefiRel"){try{await fb.updateEtabDefi(b.dataset.id,{semaine:semaineId()});const d=PA.edefis.find(x=>x.id===b.dataset.id);if(d)d.semaine=semaineId();toast("Défi relancé cette semaine");rerenderKeep()}catch(e){toast(authMsg(e))}return}
}
document.addEventListener("click",e=>{const b=e.target.closest("[data-et]");if(!b||b.disabled)return;e.preventDefault();etClick(b.dataset.et,b)});
function etParseListe(txt){const L=String(txt||"").split(/\r?\n/).map(l=>l.replace(/ /g," ").trim()).filter(Boolean);
  // ignore une ligne d'en-tête (Nom, Prénom, Élève…)
  if(L.length&&/^(n[°o]?\s|nom|élève|eleve|prénom|prenom)/i.test(L[0])&&!/\d/.test(L[0]))L.shift();
  let auto=0;return L.map(l=>{const c=l.split(/\t|;/).map(x=>x.trim()).filter(Boolean);let n=null;
    if(/^\d{1,2}$/.test(c[0]||"")){n=+c.shift()}else{const m=l.match(/^(\d{1,2})[\s.)-]+(.+)$/);if(m&&c.length===1){n=+m[1];c[0]=m[2]}}
    if(n==null)n=++auto;else auto=n;const nom=c.join(" ").replace(/\s+/g," ").slice(0,40);return nom?{n,nom}:null}).filter(Boolean)}
/* --- Chiffrement des noms (Web Crypto : PBKDF2 → AES-GCM 256) --- */
const etB64=u8=>{let s="";for(let i=0;i<u8.length;i+=8192)s+=String.fromCharCode.apply(null,u8.subarray(i,i+8192));return btoa(s)};
const etUb64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
async function etDerive(phrase,sel){const base=await crypto.subtle.importKey("raw",new TextEncoder().encode(String(phrase||"").normalize("NFC").trim()),"PBKDF2",false,["deriveKey"]);
  return crypto.subtle.deriveKey({name:"PBKDF2",salt:etUb64(sel),iterations:250000,hash:"SHA-256"},base,{name:"AES-GCM",length:256},true,["encrypt","decrypt"])}
async function etEnc(k,obj){const iv=crypto.getRandomValues(new Uint8Array(12));const ct=new Uint8Array(await crypto.subtle.encrypt({name:"AES-GCM",iv},k,new TextEncoder().encode(JSON.stringify(obj))));return{iv:etB64(iv),data:etB64(ct)}}
async function etDec(k,x){const pt=await crypto.subtle.decrypt({name:"AES-GCM",iv:etUb64(x.iv)},k,etUb64(x.data));return JSON.parse(new TextDecoder().decode(pt))}
const etCleLocale=id=>{try{return localStorage.getItem("etabKey_"+id)||""}catch(e){return""}};
async function etGarderCle(id,k){const raw=new Uint8Array(await crypto.subtle.exportKey("raw",k));try{localStorage.setItem("etabKey_"+id,etB64(raw))}catch(e){}ET._k={id,k}}
async function etCle(){const E=ET.etab;if(!E||!E.verif)return null;if(ET._k&&ET._k.id===E.id)return ET._k.k;const s=etCleLocale(E.id);if(!s)return null;
  /* La clé gardée sur l'appareil n'est effacée que si elle est vraiment fausse (phrase changée par l'administrateur),
     jamais sur une erreur passagère (2026.11.21-7). */
  let k;try{k=await crypto.subtle.importKey("raw",etUb64(s),{name:"AES-GCM"},true,["encrypt","decrypt"])}catch(e){console.warn("clé locale illisible",e);return null}
  let v=null,faux=false;try{v=await etDec(k,E.verif)}catch(e){faux=e&&e.name==="OperationError"}
  if(v==="carnet-eps"){ET._k={id:E.id,k};return k}
  if(faux||v!=null){try{localStorage.removeItem("etabKey_"+E.id)}catch(e){}}return null}
async function etChangerPhrase(p){const E=ET.etab,old=await etCle(),sel=etB64(crypto.getRandomValues(new Uint8Array(16))),k=await etDerive(p,sel),verif=await etEnc(k,"carnet-eps");
  let docs=[];if(old){docs=await fb.listNomsChiffres(E.id).catch(()=>[]);for(const d of docs){try{d._clair=await etDec(old,d)}catch(e){d._clair=null}}}
  await fb.updateEtab(E.id,{sel,verif});E.sel=sel;E.verif=verif;await etGarderCle(E.id,k);
  for(const d of docs){if(!d._clair)continue;try{await fb.setNomsChiffres(d.id,{etabId:E.id,profId:d.profId,classeId:d.classeId||d.id,...(await etEnc(k,d._clair))})}catch(e){console.warn("re-chiffrement",d.id,e)}}
  await etPushTout()}
const ETP={};
function etPushSoon(cid){clearTimeout(ETP[cid]);ETP[cid]=setTimeout(()=>etPush(cid),1500)}
async function etPush(cid){const k=await etCle();if(!k)return;const r=getReperes(cid);try{await fb.setNomsChiffres(cid,{etabId:ET.etab.id,profId:me.uid,classeId:cid,...(await etEnc(k,r))})}catch(e){console.warn("noms",e)}}
async function etPushTout(){for(const c of classes||[])if(Object.keys(getReperes(c.id)).length)await etPush(c.id)}
// Récupère les noms chiffrés de mes classes (nouvel appareil) : complète ce qui manque sur cet appareil.
async function etPullNoms(force){const k=await etCle();if(!k)return;for(const c of classes||[]){try{const d=await fb.getNomsChiffres(c.id);if(!d)continue;const r=await etDec(k,d),loc=getReperes(c.id);let ch=false;
  Object.entries(r||{}).forEach(([u,v])=>{if(v&&!loc[u]){loc[u]=v;ch=true}});if(ch)store(reperesKey(c.id),loc)}catch(e){if(force)console.warn("noms",c.id,e)}}}
// Noms d'une classe d'un collègue (organisateur d'une compétition)
const ETN={};
async function etNomsClasse(cid){if((classes||[]).some(c=>c.id===cid))return getReperes(cid);if(ETN[cid])return ETN[cid];const k=await etCle();if(!k)return{};
  try{const d=await fb.getNomsChiffres(cid);ETN[cid]=d?await etDec(k,d):{}}catch(e){ETN[cid]={}}return ETN[cid]}
function vNomsCard(){const rep=getReperes(classe.id),n=eleves.filter(e=>rep[e.id]).length,E=ET.etab,cle=E&&E.verif&&etCleLocale(E.id);
  return`<section class="card stack" style="gap:8px"><div class="sec-h"><h3>👤 Noms des élèves</h3><span class="spacer"></span><span class="hint">${n} / ${eleves.length}</span></div>
    <p class="hint" style="margin:0">Les noms restent sur cet appareil et s'affichent à côté des identifiants (carnets, QCM, inscrits). ${cle?"Ils sont aussi enregistrés chiffrés avec la phrase secrète de l'établissement : vous les retrouvez sur vos autres appareils et l'organisateur d'une compétition voit les noms des inscrits.":E?"Saisissez la phrase secrète de l'établissement (onglet Compte) pour les retrouver sur vos autres appareils.":"Exportez-les dans un fichier pour changer d'appareil."}</p>
    <div class="row"><button class="btn small primary" data-et="etColler">📋 Coller la liste Pronote</button><button class="btn small" data-et="etExport">⇩ Exporter (toutes mes classes)</button><button class="btn small" data-et="etImport">⇧ Importer</button></div></section>`}
/* --- Information des familles (modèle) --- */
function etRgpd(){const E=ET.etab||{},nom=esc(E.nom||"l'établissement");
  const t=`<h2>Information des familles — Carnet d'entraînement EPS</h2>
  <p>En éducation physique et sportive, les élèves de ${nom}${E.commune?` (${esc(E.commune)})`:""} utilisent une application web, le « Carnet d'entraînement EPS », pour remplir leurs carnets d'entraînement, répondre à des QCM, consulter les actualités sportives de l'établissement et s'inscrire aux compétitions.</p>
  <h3>Quelles données ?</h3><ul><li>Un identifiant de connexion anonyme (ex. « 1g2-07-k4m ») attribué par l'enseignant, la classe et un numéro dans la classe.</li><li>Un pseudo et un avatar choisis par l'élève (il lui est demandé de ne pas utiliser son vrai nom).</li><li>Les réponses aux carnets d'entraînement et aux QCM, les corrections et notes de l'enseignant.</li><li>Si l'élève la saisit : son activité physique de la semaine (temps d'activité, jours actifs, temps assis et temps d'écran déclarés).</li><li>Les inscriptions aux compétitions (identifiant et classe).</li></ul>
  <p><b>Aucun nom ni prénom d'élève n'est enregistré en clair sur le serveur.</b> Les enseignants gardent la correspondance identifiant ↔ nom sur leur appareil ; lorsqu'elle est partagée entre enseignants de l'établissement, elle est chiffrée sur l'appareil avec une phrase secrète connue des seuls enseignants d'EPS. Il s'agit néanmoins d'un traitement de données personnelles pseudonymisées.</p>
  <h3>Pourquoi ?</h3><p>Apprentissages et évaluation en EPS, suivi de l'activité physique, organisation des compétitions et de l'association sportive.</p>
  <h3>Qui y a accès ?</h3><p>L'élève, son enseignant d'EPS et, pour les inscriptions à une compétition, l'enseignant qui l'organise. Les données ne sont ni vendues ni utilisées à des fins publicitaires. Aucune donnée d'élève n'est envoyée à l'outil d'intelligence artificielle de l'application.</p>
  <h3>Où et combien de temps ?</h3><p>Hébergement Google Firebase, base de données située dans l'Union européenne. Les comptes et les données sont supprimés à la fin de l'année scolaire (ou à la demande).</p>
  <h3>Vos droits</h3><p>Vous pouvez demander l'accès, la rectification ou l'effacement des données de votre enfant, ou vous opposer à leur utilisation, auprès de l'enseignant d'EPS ou du chef d'établissement, responsable du traitement. Vous pouvez aussi contacter le délégué à la protection des données (DPO) de l'académie, ou adresser une réclamation à la CNIL (cnil.fr).</p>`;
  openModal(`<h3>Information des familles (RGPD)</h3><p class="hint" style="margin:0">Modèle à relire et adapter avec votre chef d'établissement. Pensez à faire inscrire l'application au <b>registre des traitements</b> de l'établissement (chef d'établissement / DPO académique).</p>
    <div id="rgpd-txt" class="rgpd-box">${t}</div><div class="grid2"><button class="btn" data-mact="close">Fermer</button><button class="btn primary" data-et="etPrintRgpd">🖨 Imprimer / PDF</button></div>`)}
/* --- Inscriptions aux compétitions --- */
async function etInscrire(id,on,b){if(apercuBloque())return;const x=(H.actus||[]).find(y=>y.id===id);if(!x)return;const rid=id+"__"+me.uid;if(b)b.disabled=true;
  try{if(on){await fb.setInscription(rid,{actuId:id,uid:me.uid,login:me.login,numero:me.numero||null,classeId:me.classeId,classeNom:(eleveClasse&&eleveClasse.nom)||"",profId:me.profId,organisateur:x.profId,etabId:x.etabId||""});H.ins=[...new Set([...(H.ins||[]),id])];toast("Tu es inscrit ! 🏆")}
    else{await fb.deleteInscription(rid);H.ins=(H.ins||[]).filter(y=>y!==id);toast("Inscription annulée")}rerenderKeep()}catch(e){if(b)b.disabled=false;toast(authMsg(e))}}
const etInsBtn=x=>{if(!x.inscription||x.type!=="competition")return"";const ok=(H.ins||[]).includes(x.id);
  return ok?`<button class="et-ins ok" data-et="etDesins" data-id="${x.id}" aria-label="Annuler mon inscription">✓ Inscrit</button>`:`<button class="et-ins" data-et="etIns" data-id="${x.id}">Je m'inscris</button>`};
let ETI={txt:"",html:""};
async function etVoirInscrits(id){const x=(PA.actus||[]).concat(PA.etActus||[]).find(y=>y.id===id);if(!x)return;const orga=x.profId===me.uid;
  openModal(`<h3>👥 Inscrits · ${esc(x.titre)}</h3><p class="hint">Chargement…</p>`);
  try{const L=orga?await fb.listInscritsOrga(id,me.uid):await fb.listInscritsProf(id,me.uid);const parC={};L.forEach(i=>(parC[i.classeId]=parC[i.classeId]||[]).push(i));
    const noms={};for(const cid of Object.keys(parC))noms[cid]=await etNomsClasse(cid);
    const cls=Object.keys(parC).sort((a,b)=>String(parC[a][0].classeNom).localeCompare(String(parC[b][0].classeNom),"fr",{numeric:true}));
    const ligne=i=>({c:i.classeNom||"",n:i.numero||"",l:i.login,nom:(noms[i.classeId]||{})[i.uid]||""});
    const rows=cls.flatMap(cid=>parC[cid].sort((a,b)=>(a.numero||0)-(b.numero||0)).map(ligne));
    const manque=rows.some(r=>!r.nom),E=ET.etab;
    ETI.txt=`${x.titre} — ${dLong(x.date)}${x.lieu?" — "+x.lieu:""}\n${rows.length} inscrit${rows.length>1?"s":""}\n\n`+rows.map(r=>`${r.c}\tN°${r.n}\t${r.nom||r.l}${r.nom?"\t"+r.l:""}`).join("\n");
    ETI.html=`<div class="ins-p"><h2>${esc(x.titre)}</h2><p>${esc(dLong(x.date))}${x.lieu?" · "+esc(x.lieu):""} · ${rows.length} inscrit${rows.length>1?"s":""}</p><table><thead><tr><th>Classe</th><th>N°</th><th>Nom</th><th>Identifiant</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r.c)}</td><td>${r.n}</td><td>${esc(r.nom)}</td><td>${esc(r.l)}</td></tr>`).join("")}</tbody></table></div>`;
    openModal(`<h3>👥 Inscrits · ${esc(x.titre)}</h3><p class="hint" style="margin:0">${orga?"Vous organisez : vous voyez tous les inscrits de l'établissement.":"Inscrits de vos classes."} ${rows.length} inscrit${rows.length>1?"s":""}.</p>
      ${rows.length?`<div class="scroll" style="max-height:50vh"><table class="ids"><thead><tr><th>Classe</th><th>N°</th><th>Nom</th><th>Identifiant</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r.c)}</td><td>${r.n}</td><td>${esc(r.nom)||'<span class="hint">—</span>'}</td><td><code>${esc(r.l)}</code></td></tr>`).join("")}</tbody></table></div>`:'<p class="hint">Aucun inscrit pour l\'instant.</p>'}
      ${manque&&orga&&E&&E.verif&&!etCleLocale(E.id)?`<p class="hint" style="margin:0">Saisissez la phrase secrète (onglet Compte) pour voir les noms des élèves de vos collègues.</p>`:manque?`<p class="hint" style="margin:0">Certains noms manquent : le professeur de la classe ne les a pas encore collés ou partagés.</p>`:""}
      <div class="grid3"><button class="btn" data-mact="close">Fermer</button><button class="btn" data-et="etInsCopy" ${rows.length?"":"disabled"}>Copier</button><button class="btn primary" data-et="etInsPdf" ${rows.length?"":"disabled"}>🖨 PDF</button></div>`)}
  catch(e){openModal(`<h3>Inscrits</h3><p class="err">${esc(authMsg(e))}</p><button class="btn" data-mact="close">Fermer</button>`)}}
/* --- Défis d'établissement (prof) --- */
async function etDefiAdd(){const E=ET.etab;if(!E)return;const v=($("#edf-v")||{}).value||"",t=($("#edf-t")||{}).value||"";if(!v.trim()&&!t.trim()){toast("Indiquez l'objectif du défi");return}
  const d={etabId:E.id,profId:me.uid,valeur:v.trim().slice(0,20),texte:t.trim().slice(0,60),semaine:semaineId()};
  try{d.id=await fb.createEtabDefi(d);PA.edefis.push(d);toast("Défi d'établissement ajouté");rerenderKeep()}catch(e){toast(authMsg(e))}}
function vEtabAccueil(){const E=ET.etab;if(!E)return ET.dem?`<section class="card"><p class="hint" style="margin:0">🏫 Demande en attente pour rejoindre ${esc(ET.dem.nom||"votre établissement")} : les défis et actualités d'établissement seront disponibles après validation.</p></section>`
  :`<section class="card"><div class="row"><div><strong>🏫 Défis et actualités d'établissement</strong><div class="hint">Indiquez votre établissement pour en publier avec vos collègues.</div></div><span class="spacer"></span><button class="btn small" data-nav="compte">Indiquer</button></div></section>`;
  const sem=semaineId(),em=E.emails||{},L=(PA.edefis||[]).slice().sort((x,y)=>(y.semaine===sem)-(x.semaine===sem));
  return`<section class="card stack" style="gap:10px"><div class="sec-h"><h3>🏫 Défis de l'établissement</h3><span class="spacer"></span><span class="hint">${esc(E.nom)}</span></div>
    <p class="hint" style="margin:0">Proposés à tous les élèves de l'établissement, avec l'étiquette 🏫. Seul l'auteur d'un défi peut le modifier ou le supprimer.</p>
    ${L.length?`<div class="list-s">${L.map(d=>{const mien=d.profId===me.uid;return`<div class="s-item" style="cursor:default"><div><strong>🏫 ${esc(d.valeur)}</strong> ${esc(d.texte)}<div class="hint">${d.semaine===sem?"Cette semaine":`Semaine ${esc(String(d.semaine).split("-S")[1]||d.semaine)} · terminé`}${mien?"":` · ${esc(em[d.profId]||"un collègue")}`}</div></div>${mien?`<div class="row" style="gap:6px;flex-wrap:nowrap">${d.semaine!==sem?`<button class="btn ghost small" data-et="etDefiRel" data-id="${d.id}">Relancer</button>`:""}<button class="btn ghost small danger" data-et="etDefiDel" data-id="${d.id}" aria-label="Supprimer">✕</button></div>`:""}</div>`}).join("")}</div>`:""}
    <div class="grid2" style="border-top:1px solid var(--line);padding-top:10px"><label class="f">Objectif<input id="edf-v" maxlength="20" placeholder="ex. 10 000 pas"></label><label class="f">Défi<input id="edf-t" maxlength="60" placeholder="ex. chaque jour cette semaine"></label></div>
    <button class="btn primary" data-et="etDefiAdd" style="justify-self:start">＋ Ajouter pour tout l'établissement</button></section>
  ${(PA.etActus||[]).length?`<section class="card stack" style="gap:8px"><div class="sec-h"><h3>🏫 Actualités de vos collègues</h3></div><div class="list-s">${PA.etActus.map(x=>`<div class="s-item" style="cursor:default"><div><strong>${(ACTU_T[x.type]||ACTU_T.info).ic} ${esc(x.titre)}</strong><div class="hint">${esc(dLong(x.date))}${x.lieu?" · "+esc(x.lieu):""} · ${esc(em[x.profId]||"un collègue")}${String(x.date)<today()?" · passée":""}</div></div>${x.inscription?`<button class="btn ghost small" data-et="etInscrits" data-id="${x.id}">👥 Mes inscrits</button>`:""}</div>`).join("")}</div></section>`:""}`}


/* ====================================================================
   Feuille de match (2026.11.21-3) : joueurs en liste déroulante, séances préparées
   à l'avance, résumé des classements avec montées / descentes, détail des poules
   ==================================================================== */
/* --- Outil libre (élève) : choisir les joueurs dans la liste de la classe --- */
const flListeOK=()=>me&&me.role==="eleve"&&me.classeId&&me.profId;
const flNomR=r=>r.pseudo||r.login;
function flHintListe(){return flListeOK()?`<p class="hint" style="margin:-4px 0 0">Touche chaque case pour choisir un joueur dans la liste de ta classe.</p>`:""}
function flJoueurField(n,i){const src=(FL.src||[])[i];
  if(!flListeOK()||src==="libre")return`<input data-flj="${i}" value="${esc(n)}" maxlength="20" placeholder="Joueur ${i+1} (pseudo)" aria-label="Joueur ${i+1}" style="flex:1;min-width:0">${flListeOK()?`<button class="btn ghost small" data-fm="flListe" data-i="${i}" aria-label="Revenir à la liste">📋</button>`:""}`;
  if(!ROSTER){loadRoster().then(()=>{if(route.name==="feuilleLocale")rerenderKeep()});return`<select disabled style="flex:1;min-width:0"><option>Chargement de la classe…</option></select>`}
  const pris=FL.joueurs.filter((x,j)=>j!==i&&x),moi={...(ROSTER.find(r=>r.login===me.login)||{login:me.login}),...(me.pseudo?{pseudo:me.pseudo}:{})};
  const L=[moi,...ROSTER.filter(r=>r.login!==me.login)].filter(r=>!pris.includes(flNomR(r)));
  const inL=!n||L.some(r=>flNomR(r)===n);
  return`<select data-fmj="${i}" aria-label="Joueur ${i+1}" style="flex:1;min-width:0"><option value="">— Joueur ${i+1} : choisir —</option>
    ${inL?"":`<option value="${esc(n)}" selected>${esc(n)}</option>`}
    ${L.map(r=>`<option value="${esc(flNomR(r))}" ${flNomR(r)===n?"selected":""}>${r.login===me.login?"Moi · ":""}${esc(r.pseudo?`${r.pseudo} (${r.login})`:r.login)}</option>`).join("")}
    <option value="__autre">✏️ Autre joueur (écrire)</option></select>`}
/* --- Prof : noms des élèves (pseudo + nom gardé sur cet appareil) --- */
function fmNomProf(uid){const e=(OP&&OP.eleves||[]).find(x=>x.id===uid),r=OP?getReperes(OP.cls.id)[uid]:"";
  const base=pseudoCache[uid]||(e&&e.login)||(FE&&FE.S?nomDe(uid,FE.S.noms):"?");return r?`${base} · ${r}`:base}
const fmNom=uid=>OP&&me.role!=="eleve"?fmNomProf(uid):nomDe(uid,FE&&FE.S&&FE.S.noms);
/* --- Préparation des poules : ajout des élèves par liste déroulante --- */
function vPoulesEdit(P){const dr=OP.draft,sans=OP.eleves.filter(e=>!(dr.aff[e.id]>=1&&dr.aff[e.id]<=dr.nbP));
  const opt=sans.map(e=>`<option value="${e.id}">N°${e.numero} · ${esc(fmNomProf(e.id))}</option>`).join("");
  return`<p class="hint" style="margin:0">Poule 1 = la plus forte. Ajoutez les élèves avec la liste déroulante de chaque poule, ou utilisez « Répartir automatiquement ».</p>
  <div class="fm-poules">${P.map((p,i)=>{const ko=p.joueurs.length<3||p.joueurs.length>8;
    return`<div class="fm-pb${ko?" ko":""}"><div class="fm-pbh"><b>${esc(p.nom)}</b><span class="hint">${p.joueurs.length} joueur${p.joueurs.length>1?"s":""}</span></div>
      <div class="fm-chips">${p.joueurs.map(u=>`<span class="fm-chip">${esc(fmNomProf(u))}<button data-fm="unaff" data-u="${u}" aria-label="Retirer ${esc(fmNomProf(u))} de la poule">✕</button></span>`).join("")||'<span class="hint">Aucun joueur</span>'}</div>
      ${sans.length&&p.joueurs.length<8?`<select data-fmadd="${i+1}" aria-label="Ajouter un élève à ${esc(p.nom)}"><option value="">+ Ajouter un élève…</option>${opt}</select>`:""}</div>`}).join("")}</div>
  ${sans.length?`<p class="hint" style="margin:0"><b>Sans poule (${sans.length}) :</b> ${sans.map(e=>esc(fmNomProf(e.id))).join(", ")}</p>`:`<p class="hint" style="margin:0">✓ Tous les élèves sont placés.</p>`}`}
/* --- Séances préparées à l'avance --- */
function vPrepList(){const L=(OP.sessions||[]).filter(s=>s.prep&&!s.active).sort((a,b)=>String(a.date).localeCompare(String(b.date)));if(!L.length)return"";
  return`<section class="card stack" style="gap:8px"><div class="sec-h"><h3>📅 Séances préparées</h3><span class="hint">invisibles pour les élèves</span></div>
    ${L.map(s=>`<div class="s-item" style="cursor:default"><div><strong>${fmtDate(s.date)}</strong><div class="hint">${(s.poules||[]).map(p=>`${esc(p.nom)} : ${p.joueurs.length}`).join(" · ")||"Pas de poule"}</div></div>
      <div class="row" style="gap:6px"><button class="btn ghost small" data-fm="prepEdit" data-id="${s.id}">Modifier</button><button class="btn small primary" data-fm="prepOpen" data-id="${s.id}">Ouvrir</button><button class="btn ghost small danger" data-fm="prepDel" data-id="${s.id}" aria-label="Supprimer">✕</button></div></div>`).join("")}</section>`}
function draftFromSession(s,prepId){const aff={};(s.poules||[]).forEach((p,i)=>p.joueurs.forEach(u=>aff[u]=i+1));
  return{date:s.date||today(),reglages:normCfg(clone(s.reglages||OP.cfgCls)),nbP:Math.max(1,(s.poules||[]).length),aff,...(prepId?{prepId}:{})}}
function fmLeaveSession(){if(matchUnsub){matchUnsub();matchUnsub=null}FE=null}
async function savePrep(){const it=OP.item,dr=OP.draft;dr.date=($("#op-date")||{value:dr.date}).value||today();
  const poules=it.kind==="feuille"?poulesOf(dr):[];const noms={};OP.eleves.forEach(e=>{if(poules.some(p=>p.joueurs.includes(e.id)))noms[e.id]={login:e.login,pseudo:pseudoCache[e.id]||""}});
  const S={profId:me.uid,classeId:OP.cls.id,dossierId:OP.d.id,outilId:it.id,kind:it.kind,titre:it.titre||OUTILS[it.kind].nom,date:dr.date,active:false,prep:true,reglages:normCfg(dr.reglages),poules,noms};
  try{if(dr.prepId){await fb.updateSession(dr.prepId,S);S.id=dr.prepId;OP.sessions=OP.sessions.map(x=>x.id===S.id?S:x)}else{S.id=await fb.createSession(S);OP.sessions.unshift(S)}
    toast(`Séance du ${fmtDate(S.date)} enregistrée : ouvrez-la le jour venu`);OP.draft=newDraft();render();window.scrollTo(0,0)}catch(e){toast(authMsg(e))}}
/* --- Résumé des classements + montées / descentes --- */
function fmMoves(S,M){if(OP.mv&&OP.mv.sid===S.id)return OP.mv.m;const m={},n=S.poules.length;
  S.poules.forEach((P,pi)=>{const cl=classement(P.joueurs,pi,M);if(!cl.some(r=>r.j))return;if(pi>0)m[cl[0].u]="up";if(pi<n-1&&cl.length>1)m[cl[cl.length-1].u]="down"});
  OP.mv={sid:S.id,m};return m}
function vResumePoules(S,M){if(!S.poules||!S.poules.length)return"";const m=fmMoves(S,M),n=S.poules.length,cfg=cfgFor({},null,S),bo=cfg.bonus.length;
  const nu=Object.values(m).filter(v=>v==="up").length,nd=Object.values(m).filter(v=>v==="down").length;
  return`<section class="card stack fm-res" style="gap:10px"><div class="sec-h"><h3>📊 Résumé des classements</h3><span class="spacer"></span><span class="hint">Poule 1 = la plus forte</span></div>
  <p class="hint" style="margin:0">Choisissez les élèves qui montent ⬆ ou descendent ⬇ (proposition : le 1er monte, le dernier descend), puis préparez la séance suivante.</p>
  ${S.poules.map((P,pi)=>{const cl=classement(P.joueurs,pi,M),T=Math.max(1,Math.min(4,parseInt((M["cfg_"+pi]||{}).terrains)||cfg.terrains)),pl=planning(P.joueurs,T),faits=pl.filter(x=>scoresOf(M,pi,x.a,x.b)).length;
    return`<div class="fm-rp"><div class="fm-pbh"><b>${esc(P.nom)}</b><span class="hint">${faits} / ${pl.length} matchs</span><span class="spacer"></span><button class="btn ghost small" data-fm="detail" data-pi="${pi}">🔍 Détail</button></div>
    <div class="scroll"><table class="classt"><thead><tr><th>#</th><th>Joueur</th><th>V</th><th>N</th><th>D</th><th>Diff</th>${bo?"<th>Bonus</th>":""}<th>Poule suivante</th></tr></thead><tbody>
    ${cl.map((r,i)=>{const v=m[r.u]||"";return`<tr class="${v?"fm-"+v:""}"><td>${i+1}</td><td>${esc(fmNom(r.u))}</td><td>${r.v}</td><td>${r.n}</td><td>${r.d}</td><td>${r.pm-r.pe>0?"+":""}${r.pm-r.pe}</td>${bo?`<td>${r.bo}</td>`:""}
      <td><div class="fm-seg" role="group" aria-label="Poule suivante de ${esc(fmNom(r.u))}"><button data-fm="mv" data-u="${r.u}" data-v="up" class="${v==="up"?"on":""}" ${pi===0?"disabled":""} aria-label="Monte">⬆</button><button data-fm="mv" data-u="${r.u}" data-v="" class="${!v?"on":""}" aria-label="Reste">=</button><button data-fm="mv" data-u="${r.u}" data-v="down" class="${v==="down"?"on":""}" ${pi===n-1?"disabled":""} aria-label="Descend">⬇</button></div></td></tr>`}).join("")}
    </tbody></table></div></div>`}).join("")}
  <div class="row" style="align-items:center"><button class="btn primary" data-fm="next">➡️ Préparer la séance suivante</button><span class="hint">${nu} montée${nu>1?"s":""} · ${nd} descente${nd>1?"s":""}</span></div></section>`}
function fmNext(){const S=FE&&FE.S;if(!S)return;const m=fmMoves(S,FE.M),n=S.poules.length,aff={};
  S.poules.forEach((P,pi)=>P.joueurs.forEach(u=>{let t=pi+(m[u]==="up"?-1:m[u]==="down"?1:0);t=Math.max(0,Math.min(n-1,t));aff[u]=t+1}));
  fmLeaveSession();OP.draft={date:today(),reglages:normCfg(clone(S.reglages||OP.cfgCls)),nbP:n,aff};OP.mv=null;render();window.scrollTo(0,0);
  toast("Poules de la séance suivante prêtes : vérifiez-les, puis ouvrez ou enregistrez pour plus tard")}
/* --- Détail d'une poule : points, bonus, matchs --- */
function fmDetail(pi){if(!FE)return;const S=FE.S,M=FE.M,P=S.poules[pi];if(!P)return;const cfg=cfgFor({},null,S),ids=P.joueurs;
  const labs=[...cfg.bonus.map(b=>b.label)];const t={};ids.forEach(u=>t[u]={u,j:0,v:0,n:0,d:0,pm:0,pe:0,b:{},arb:0});const mt=[];
  for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){const a=ids[i],b=ids[j],s=scoresOf(M,pi,a,b);if(!s)continue;const A=t[a],B=t[b],dt=s.d.detail||{},ba=s.d.a===a?dt.ba:dt.bb,bb=s.d.a===a?dt.bb:dt.ba;
    [[A,ba],[B,bb]].forEach(([X,o])=>Object.entries(o||{}).forEach(([l,c])=>{X.b[l]=(X.b[l]||0)+(+c||0);if(!labs.includes(l))labs.push(l)}));
    A.j++;B.j++;A.pm+=s.sa;A.pe+=s.sb;B.pm+=s.sb;B.pe+=s.sa;if(s.sa>s.sb){A.v++;B.d++}else if(s.sa<s.sb){B.v++;A.d++}else{A.n++;B.n++}mt.push({a,b,s,sc:!!s.d.detail})}
  const cl=classement(ids,pi,M).map(r=>t[r.u]),val=l=>(cfg.bonus.find(b=>b.label===l)||{}).val,ev=cfg.bonusMode==="eval";
  const tot=X=>labs.reduce((x,l)=>x+(X.b[l]||0),0),sansSc=mt.filter(x=>!x.sc).length;
  openModal(`<h3>🔍 ${esc(P.nom)} · détail</h3>
  <div class="scroll"><table class="classt fm-det"><thead><tr><th>#</th><th>Joueur</th><th>J</th><th>V</th><th>N</th><th>D</th><th>Pour</th><th>Contre</th><th>Diff</th>${labs.map(l=>`<th>${esc(l)}${val(l)&&!ev?` <small>(+${val(l)})</small>`:""}</th>`).join("")}${labs.length?"<th>Bonus</th>":""}</tr></thead><tbody>
  ${cl.map((X,i)=>`<tr><td>${i+1}</td><td>${esc(fmNom(X.u))}</td><td>${X.j}</td><td>${X.v}</td><td>${X.n}</td><td>${X.d}</td><td>${X.pm}</td><td>${X.pe}</td><td>${X.pm-X.pe>0?"+":""}${X.pm-X.pe}</td>${labs.map(l=>`<td>${X.b[l]||0}</td>`).join("")}${labs.length?`<td><b>${tot(X)}</b>${!ev&&tot(X)?` <small class="hint">(${labs.reduce((x,l)=>x+(X.b[l]||0)*(val(l)||0),0)} pts)</small>`:""}</td>`:""}</tr>`).join("")}</tbody></table></div>
  ${labs.length?`<p class="hint" style="margin:0">Bonus : nombre de fois obtenu${ev?" (comptés pour l'évaluation, hors score)":" (déjà inclus dans le score)"}.${sansSc?` ${sansSc} match${sansSc>1?"s":""} saisi${sansSc>1?"s":""} sans le scoreur : bonus inconnus.`:""}</p>`:""}
  <h4 style="margin:6px 0 0">Matchs (${mt.length})</h4>
  <div class="fm-mlist">${mt.length?mt.map(x=>`<div><span>${esc(fmNom(x.a))}</span><b>${x.s.sa} – ${x.s.sb}</b><span>${esc(fmNom(x.b))}</span>${x.s.d.arbitre?`<small class="hint">⚖️ ${esc(x.s.d.arbitre)}</small>`:""}</div>`).join(""):'<p class="hint" style="margin:0">Aucun match joué.</p>'}</div>
  <button class="btn" data-mact="close">Fermer</button>`,{type:"fmDetail"})}
/* --- Actions --- */
document.addEventListener("click",e=>{const b=e.target.closest("[data-fm]");if(!b||b.disabled)return;const a=b.dataset.fm;
  if(a==="detail"){e.preventDefault();fmDetail(+b.dataset.pi);return}
  if(a==="flListe"){FL.src=FL.src||[];FL.src[+b.dataset.i]="liste";FL.joueurs[+b.dataset.i]="";lsSet("feuilleLocale",FL);rerenderKeep();return}
  if(!OP)return;
  if(a==="unaff"){if(OP.draft){OP.draft.aff[b.dataset.u]=0;rerenderKeep()}return}
  if(a==="savePrep"){if(apercuBloque())return;savePrep();return}
  if(a==="prepEdit"){const s=OP.sessions.find(x=>x.id===b.dataset.id);if(!s)return;fmLeaveSession();OP.draft=draftFromSession(s,s.id);render();window.scrollTo(0,0);return}
  if(a==="prepOpen"){const s=OP.sessions.find(x=>x.id===b.dataset.id);if(!s)return;fmLeaveSession();OP.draft=draftFromSession(s,s.id);OP.draft.date=today();render();
    const bad=OP.item.kind==="feuille"&&poulesOf(OP.draft).some(p=>p.joueurs.length<3||p.joueurs.length>8);if(bad){toast("Vérifiez les poules (3 à 8 joueurs) puis ouvrez la séance");return}opOpen();return}
  if(a==="prepDel"){confirmBox("Supprimer cette séance préparée ?","Les poules préparées seront perdues.","Supprimer",async()=>{try{await fb.deleteSession(b.dataset.id);OP.sessions=OP.sessions.filter(x=>x.id!==b.dataset.id);if(OP.draft&&OP.draft.prepId===b.dataset.id)OP.draft=newDraft();closeModal();rerenderKeep()}catch(x){closeModal();toast(authMsg(x))}},true);return}
  if(a==="mv"){if(!FE)return;const m=fmMoves(FE.S,FE.M);if(b.dataset.v)m[b.dataset.u]=b.dataset.v;else delete m[b.dataset.u];rerenderKeep();return}
  if(a==="next"){fmNext();return}});
document.addEventListener("change",e=>{const el=e.target;
  if(el.dataset&&el.dataset.fmadd!==undefined){if(OP&&OP.draft&&el.value){OP.draft.aff[el.value]=+el.dataset.fmadd;rerenderKeep()}return}
  if(el.dataset&&el.dataset.fmj!==undefined&&FL){const i=+el.dataset.fmj;FL.src=FL.src||[];if(el.value==="__autre"){FL.src[i]="libre";FL.joueurs[i]=""}else{FL.src[i]="liste";FL.joueurs[i]=el.value.slice(0,20)}lsSet("feuilleLocale",FL);rerenderKeep();return}});
