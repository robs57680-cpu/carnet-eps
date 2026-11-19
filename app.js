// Carnet d'entraînement EPS : application (élève, prof, développeur)
import * as fb from "./fb.js?v=2026.11.19-6";
import { DEV_EMAIL, STUDENT_DOMAIN } from "./config.js?v=2026.11.19-6";
const APP_VERSION="2026.11.19-6";

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
let classeActs=[],classes=[],classe=null,eleves=[],classeTab="activites",suivi=null,demandes=[],profs=[];
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
  try{if(MOD){const p=gCoachField(MOD,s);await fb.coachSaveVals(carnetId,s.id,p,gVal(s,p))}else await fb.coachSaveTours(carnetId,s.id,s.real.tours);setSync("ok")}catch(e){console.error(e);setSync("error");toast(e&&e.code==="permission-denied"?"Tu n'es plus le coach de cette séance.":authMsg(e))}}
async function flush(){clearTimeout(saveTimer);saveTimer=null;if(COACH)return flushCoach();if(RO||!carnetId)return;const jobs=[];
  if(dirtyProfil){dirtyProfil=false;jobs.push(fb.updateCarnet(carnetId,{profil:data.profil}))}
  for(const id of [...dirty]){dirty.delete(id);const s=data.seances.find(x=>x.id===id);if(!s||savedValide.has(id))continue;const v=!!s.valide;
    let docData=s,merge=false;if(s.coachUid){docData=clone(s);if(MOD){const[a,b]=gCoachField(MOD,s).split(".");if(docData.valeurs&&docData.valeurs[a])delete docData.valeurs[a][b]}else delete docData.real.tours;merge=true}
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
  else if(me&&me.role!=="eleve"&&!["loading","login"].includes(route.name)){const cur2=["classes","classe","suivi"].includes(route.name)?"classes":route.name==="modele"?"modeles":route.name;
    h=[["classes","Classes"],["modeles","Carnets"],...(me.role==="dev"?[["dev","Dév."]]:[]),["compte","Compte"]].map(([v,l])=>`<button data-nav="${v}" aria-current="${cur2===v}">${l}</button>`).join("")}
  t.querySelector(".wrap").innerHTML=h;t.hidden=!h}
function render(){renderHeader();const m=$("#main");let h="";
  try{switch(route.name){
    case"loading":h=`<div class="center-msg"><div class="spinner"></div><p>${esc(route.msg||"Chargement…")}</p></div>`;break;
    case"setup":h=vSetup();break;
    case"login":h=vLogin();break;
    case"noaccount":h=`<div class="card center-card"><h2>Compte non activé</h2><p>Ce compte n'a pas (ou plus) accès au carnet. Demande à ton enseignant de vérifier tes identifiants.</p><button class="btn primary" data-nav="logout">Retour à la connexion</button></div>`;break;
    case"error":h=`<div class="card center-card"><h2>Oups</h2><p>${esc(route.msg)}</p><button class="btn primary" data-nav="home">Réessayer</button></div>`;break;
    case"acts":h=vActs();break;
    case"coach":h=curS()?(MOD?gCoach(curS()):vCoach(curS())):`<div class="card center-card"><p>Séance introuvable.</p></div>`;break;
    case"carnet":h=MOD?(view==="profil"?gProfil():view==="bilan"?gBilan()+(RO?vAfl3Prof():""):(cur?gSeance(curS()):gListe())):(view==="profil"?vProfil():view==="bilan"?vBilan()+(RO?vAfl3Prof():""):(cur?vSeance(curS()):vListe()));break;
    case"modeles":h=vModeles();break;
    case"modele":h=vModele();break;
    case"classes":h=vClasses();break;
    case"classe":h=vClasse();break;
    case"suivi":h=MOD?gSuivi():vSuivi();break;
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
    if(COACH){if(saveTimer)return;const before=JSON.stringify(loc);Object.keys(d).forEach(k=>{if(k!=="id")loc[k]=d[k]});if(MOD)gEnsure(MOD,loc);else syncTours(loc);if(JSON.stringify(loc)!==before&&!busy)rerenderKeep()}
    else if(MOD){const p=gCoachField(MOD,loc),[a,b]=p.split("."),nt=gVal(d,p);if(!Array.isArray(nt))return;if(JSON.stringify(nt)!==JSON.stringify(gVal(loc,p))){loc.valeurs[a][b]=nt;gEnsure(MOD,loc);if(!busy)rerenderKeep();else toast("Ton coach a mis à jour les temps")}}
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
  return`<div class="stack">${coachH}<h2>Mes activités</h2><p class="hint" style="margin:-6px 0 0">Choisis l'activité pour ouvrir ton carnet d'entraînement.</p>
  <div class="acts">${[...Object.entries(ACTIVITES).map(([k,a])=>({id:k,...a})),...actsList].map(a=>`<button class="act-card" data-act="openAct" data-a="${a.id}"><span class="act-ca">${esc(a.ca||"")}</span><span class="act-t">${esc(a.titre)}</span><span class="act-d">${esc(a.desc||"")}</span><span class="act-go">Ouvrir mon carnet →</span></button>`).join("")}</div></div>`}
async function openActs(){COACH=false;coachCtx=null;carnetId=null;data=null;cur=null;MOD=null;PREVIEW=false;go("loading");
  try{coachings=await fb.listCoachings(me.uid)}catch(e){console.error(e);coachings=[]}
  try{actsList=await loadActs(await fb.getClasse(me.classeId))}catch(e){console.error(e);actsList=[]}go("acts")}
async function openCoach(id){const c=coachings.find(x=>x.id===id);if(!c)return;go("loading",{msg:"Ouverture de la séance…"});
  try{const sd=await fb.getSeance(c.carnetId,c.sid);if(!sd)throw{code:"not-found"};
    if(c.activite===CA5_ID){MOD=(await ca5Modele(me.profId)).M;ca5Convert(sd)}else{const d=await fb.getModele(c.activite);if(!d)throw{code:"not-found"};MOD=normModele(d.modele||d.brouillon)}gEnsure(MOD,sd);
    COACH=true;RO=false;coachCtx=c;carnetId=c.carnetId;data={profil:blankProfil(),seances:[sd]};cur=sd.id;syncState="ok";chrono.run=false;chrono.acc=0;go("coach")}
  catch(e){console.error(e);toast(e&&e.code==="permission-denied"||e.code==="not-found"?"Cette séance n'est plus disponible : l'élève t'a retiré ou l'a supprimée.":authMsg(e));
    openActs()}}
async function openCarnetEleve(act){return openCarnetModele(act);go("loading",{msg:"Ouverture du carnet…"});
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
  savedValide=new Set(data.seances.filter(s=>s.valide).map(s=>s.id));dirty.clear();dirtyProfil=false}

async function setCoach(s){const inp=$("#coach-id"),err=$("#coach-err"),login=String(inp.value||"").trim().toLowerCase();err.textContent="";
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
  return`<div class="stack"><div class="row"><h2>Mes classes</h2></div>
  ${classes.length?`<div class="grid-cards">${classes.map(c=>`<button class="class-card" data-act="openClasse" data-id="${c.id}"><span class="cc-n">${esc(c.nom)}</span><span class="hint">${esc(c.annee||"")}</span><span class="chip">${c.nbEleves||0} élève${(c.nbEleves||0)>1?"s":""}</span></button>`).join("")}</div>`:`<div class="card"><p style="margin:0">Aucune classe pour l'instant. Créez votre première classe ci-dessous.</p></div>`}
  <form class="card" id="new-classe"><div class="sec-h"><h3>Nouvelle classe</h3></div>
    <div class="grid2"><label class="f">Nom de la classe<input id="nc-nom" required maxlength="20" placeholder="ex. 1G2"></label><label class="f">Année scolaire<input id="nc-annee" value="${year}" maxlength="12"></label></div>
    <button class="btn primary" type="submit" style="margin-top:10px">Créer la classe</button></form></div>`}
async function openClasse(id,tab){go("loading");try{classe=await fb.getClasse(id)||classes.find(c=>c.id===id);classeActs=await loadActs(classe);eleves=(await fb.listEleves(id)).sort((a,b)=>(a.numero||0)-(b.numero||0));classeTab=tab||classeTab||"activites";go("classe")}catch(e){go("error",{msg:authMsg(e)})}}
function vClasse(){const c=classe,rep=getReperes(c.id);
  const tabs=`<div class="seg2">${[["activites","Activités"],["eleves",`Élèves (${eleves.length})`]].map(([k,l])=>`<button data-act="classeTab" data-t="${k}" aria-current="${classeTab===k}">${l}</button>`).join("")}</div>`;
  let body="";
  if(classeTab==="activites")body=`<div class="acts">${[...Object.entries(ACTIVITES).map(([k,a])=>({id:k,...a})),...classeActs].map(a=>`<button class="act-card" data-act="openSuivi" data-a="${a.id}"><span class="act-ca">${esc(a.ca||"")}</span><span class="act-t">${esc(a.titre)}</span><span class="act-d">Carnets d'entraînement des élèves et notes.</span><span class="act-go">Voir les carnets →</span></button>`).join("")}</div>
    <section class="card"><div class="row"><div><strong>Une autre activité ?</strong><div class="hint">Créez un carnet avec l'IA à partir de son référentiel, puis activez-le pour cette classe.</div></div><span class="spacer"></span><button class="btn" data-nav="modeles">Mes carnets</button></div></section>`;
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
  try{activite=act;PREVIEW=false;MOD=null;if(act===CA5_ID){const r=await ca5Modele(me.uid);MODDOC=r.doc;MOD=r.M}else{const d=await fb.getModele(act);if(!d)throw{code:"not-found"};MODDOC=d;MOD=normModele(d.modele||d.brouillon)}const cs=await fb.listCarnets(me.uid,classe.id,act);
    const withS=await Promise.all(cs.map(async c=>({c,ss:(await fb.listSeances(c.id)).map(x=>{if(act===CA5_ID)ca5Convert(x);gEnsure(MOD,x);return x})})));
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
  if(v==="logout"){await flush();if(watchUnsub){watchUnsub();watchUnsub=null;watchKey=null}RO=false;COACH=false;MOD=null;PREVIEW=false;carnetId=null;data=null;await fb.signOut();return}
  if(v==="home"){location.replace(location.pathname+"?r="+Date.now());return}
  if(v==="acts"){await flush();openActs();return}
  if(v==="suivi"){RO=false;carnetId=null;cur=null;go("suivi");return}
  if(v==="modeles"){PREVIEW=false;openModeles();return}
  if(v==="classes"){PREVIEW=false;MOD=null;go("loading");try{await loadClasses();go("classes")}catch(err){go("error",{msg:authMsg(err)})}return}
  if(v==="dev"){openDev();return}
  if(v==="compte"){go("compte");return}});
$("#tabs").addEventListener("click",e=>{const b=e.target.closest("button[data-view]");if(b)setView(b.dataset.view)});
const main=$("#main");
function onField(e){const el=e.target;
  if(el.dataset.repere!==undefined){const r=getReperes(classe.id);r[el.dataset.repere]=el.value.slice(0,30);store(reperesKey(classe.id),r);return}
  if(el.dataset.a3!==undefined){if(e.type==="change")setAfl3(el.value?+el.value:null,+el.dataset.a3);return}
  if(el.dataset.set){if(route.name!=="suivi")return;const st=settings;if(el.dataset.set==="tol")st.tol=num(el.value)||5;else{const[t,p,i]=el.dataset.set.split(".");const v=num(el.value);if(!isNaN(v))st.themes[t][p][+i]=v}
    if(e.type==="change"){saveReglages();rerenderKeep()}return}
  if(mField(el,e))return;
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
  if(f.id==="gen-form"){if(!iaBusy)iaGenerer();return}
  if(f.id==="ia-key"){const v=$("#ik-val").value.trim(),err=$("#ik-err"),btn=f.querySelector("button[type=submit]");err.textContent="";if(!v){err.textContent="Collez votre clé.";return}
    btn.disabled=true;btn.textContent="Vérification…";
    try{const ia=await import("./ia.js?v=2026.11.19-6");await ia.testerCle(v);await fb.setPrefs(me.uid,{geminiKey:v});IAKEY=v;toast("Clé personnelle enregistrée");render()}
    catch(x){btn.disabled=false;btn.textContent="Vérifier et enregistrer";err.textContent=/40[013]|API key|API_KEY/i.test(String(x&&x.message))?"Cette clé est refusée par Google. Vérifiez qu'elle est complète.":/429|quota/i.test(String(x&&x.message))?"Clé valide mais quota déjà atteint aujourd'hui.":authMsg(x)}return}
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
  if(a==="openCa5"||(a==="openModele"&&b.dataset.id===CA5_ID)){openCa5();return}
  if(a==="openModele"){(async()=>{go("loading");try{await loadClasses();const d=await fb.getModele(b.dataset.id);if(!d)throw{code:"not-found"};startEditor(d)}catch(x){go("error",{msg:authMsg(x)})}})();return}
  if(a==="backModeles"){if(modeleEdit&&modeleEdit.dirty){confirmBox("Quitter sans enregistrer ?","Les modifications de ce carnet seront perdues.","Quitter",async()=>{closeModal();PREVIEW=false;openModeles()},true);return}PREVIEW=false;openModeles();return}
  if(a==="saveModele"){saveModele();return}
  if(route.name==="modele"||a==="mBlank"){if(mClick(a,b))return}
  if(a==="iaEdit"){if(!iaBusy)iaModifier();return}
  if(a==="iaUndo"){if(modeleHist.length){modeleEdit.draft=modeleHist.pop();modeleEdit.dirty=true;setPreview();rerenderKeep()}return}
  if(a==="delModele"&&modeleEdit&&modeleEdit.builtin){confirmBox("Revenir à la version d'origine ?","Vos modifications du carnet de cross training seront supprimées et vos élèves retrouveront la version d'origine. Leurs réponses sont conservées.","Revenir à l'origine",async()=>{
      try{await fb.deleteModele(modeleEdit.id);closeModal();toast("Version d'origine rétablie");openCa5()}catch(x){closeModal();toast(authMsg(x))}},true);return}
  if(a==="delModele"){confirmBox("Supprimer ce carnet ?","Le modèle sera supprimé et retiré de vos classes. Les carnets déjà remplis par les élèves restent en base mais ne seront plus accessibles.","Supprimer",async()=>{
      try{for(const c of classes){if((c.activites||[]).includes(modeleEdit.id)){const a2=c.activites.filter(x=>x!==modeleEdit.id);await fb.updateClasse(c.id,{activites:a2});c.activites=a2}}await fb.deleteModele(modeleEdit.id);closeModal();PREVIEW=false;openModeles()}catch(x){closeModal();toast(authMsg(x))}},true);return}
  if(route.name!=="carnet"&&route.name!=="coach"&&route.name!=="modele")return;
  const s=curS();
  if(MOD&&a==="gNew"&&!RO){const last=data.seances[data.seances.length-1];const n={id:uid(),ordre:Date.now(),date:today(),valide:false,epreuve:false,theme:last?last.theme:(MOD.themes[0]&&MOD.themes[0].id)||"",valeurs:{},autoeval:{}};
    const rep2=last?MOD.sections.filter(S=>S.reprise&&last.valeurs&&last.valeurs[S.id]):[];rep2.forEach(S=>n.valeurs[S.id]=clone(last.valeurs[S.id]));
    gEnsure(MOD,n);data.seances.push(n);cur=n.id;save();render();window.scrollTo(0,0);if(rep2.length)toast(`Repris de ta séance précédente : ${rep2.map(S=>S.titre.toLowerCase()).join(", ")}`);return}

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
    if(!u){me=null;RO=false;carnetId=null;data=null;go("login");return}
    go("loading");
    try{const lent=setTimeout(()=>{if(route.name==="loading")go("error",{msg:"Le chargement est bloqué, sans doute par un autre onglet resté ouvert sur une ancienne version de l'appli. Ferme les autres onglets du Carnet d'entraînement (ou redémarre le navigateur), puis touche « Réessayer »."})},15000);
      let d=await fb.getUser(u.uid);clearTimeout(lent);
      if(!d&&u.email&&u.email.toLowerCase()===String(DEV_EMAIL).toLowerCase()){await fb.setUser(u.uid,{role:"dev",email:u.email});d={role:"dev",email:u.email}}
      if(!d){me={uid:u.uid,role:""};go("noaccount");return}
      me={uid:u.uid,...d};
      if(me.role==="eleve"){openActs()}else{try{const pr=await fb.getPrefs(u.uid);IAKEY=(pr&&pr.geminiKey)||""}catch(e){IAKEY=""}await loadClasses();go("classes")}}
    catch(e){console.error(e);go("error",{msg:authMsg(e)})}})}

/* ====================================================================
   Carnets génériques (modèles créés avec l'IA à partir d'un référentiel)
   ==================================================================== */
let IAKEY="",MOD=null,MODDOC=null,PREVIEW=false,modeles=[],modeleEdit=null,modeleHist=[],iaBusy=false,actsList=[];
const G_TYPES={texte:"Texte",texte_long:"Texte long",nombre:"Nombre",temps:"Temps",choix:"Choix",case:"Case à cocher",echelle:"Échelle",compteur:"Compteur",tableau:"Tableau",passages:"Temps de passage",exercices:"Exercices (WOD)",resume:"Résumé du WOD"};
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
function gCoachField(M,s){const p=s.coachChamp||(M.sections.flatMap(S=>S.champs.filter(f=>f.type==="passages"&&f.coach).map(f=>S.id+"."+f.id))[0])||C_TOURS;return p}
function gCoach(s){const M=MOD;gEnsure(M,s);const p=gCoachField(M,s),[a,b]=p.split("."),S=gSec(M,a),f=S&&S.champs.find(c=>c.id===b),base="seances.0.valeurs",th=M.themes.find(t=>t.id===s.theme);
  const res=M.sections.flatMap(S2=>S2.champs.filter(x=>x.type==="resume").map(x=>`<section class="card resume">${gFieldHTML(M,s,S2,x,base,true,false)}</section>`)).join("");
  return`<div class="stack seance" style="--th:var(--accent)">
  <div class="row"><button class="btn ghost small" data-act="coachBack">← Mes activités</button><span class="spacer"></span><span id="sync" class="sync dark"></span></div>
  <section class="hero"><div class="hero-top"><span class="eyebrow">📣 Je coache</span><span class="spacer"></span><span class="lock-chip">${s.valide?"🔒 Validée":"En direct"}</span></div>
    <div class="hero-main"><div><h2 class="hero-t" style="font-size:2rem">${esc(coachCtx.eleveLogin)}</h2><div class="hero-sub">${esc(M.titre)} · séance du ${fmtDate(s.date)}${th?" · "+esc(th.label):""}</div></div></div></section>
  ${s.valide?`<div class="card"><p style="margin:0">Cette séance a été validée par l'élève : elle n'est plus modifiable.</p></div>`:""}${res}
  <section class="card sec"><div class="sec-h"><h3>Je relève</h3></div><p class="hint" style="margin:-4px 0 10px">Lance le chrono au départ, appuie sur « Passage » à chaque fin de tour${f&&f.noRep?", compte les NO REP":""}${f&&f.adapt?" et note les adaptations":""}.</p>
    ${f?gFieldHTML(M,s,S,f,base,!!s.valide,false):'<p class="hint">Cette séance n\'a pas de temps de passage à relever.</p>'}</section></div>`}
function gModalAdapt(sec,fid,i){const t=curS().valeurs[sec][fid][i],a=t.adapt||{params:[],texte:""};
  openModal(`<h3>Tour ${i+1} · adaptation</h3><p class="hint" style="margin:0">Quel paramètre as-tu modifié pendant ce tour ?</p>
  <div class="checks">${Object.entries(PARAMS).map(([k,l])=>`<label><input type="checkbox" id="m-p-${k}" value="${k}" ${(a.params||[]).includes(k)?"checked":""}> ${l}</label>`).join("")}</div>
  <label class="f">Ce que j'ai changé<textarea id="m-txt" placeholder="ex. charge passée de 25 à 20 kg">${esc(a.texte||"")}</textarea></label>
  <div class="grid2"><button class="btn primary" data-mact="gSaveAd">Enregistrer</button><button class="btn" data-mact="close">Annuler</button></div>
  ${adCount(t.adapt)?`<button class="btn danger small" data-mact="gClearAd">Supprimer l'adaptation</button>`:""}`,{type:"gad",sec,fid,i})}
function gExportCSV(){const L=[["N°","Identifiant","Séances validées","AFL1","AFL1 max","AFL2 auto","AFL3 degré","AFL3","AFL3 max","Total /20"]];
  suivi.rows.forEach(r=>{const S=gRowStats(r);L.push([r.e.numero,r.e.login,S?S.nv:0,S&&S.res?S.res.n1:"",S&&S.res?S.res.max1:"",S&&S.res?S.res.a2.p:"",r.c&&r.c.afl3Prof||"",S&&S.a3!==null?S.a3:"",S?S.m3:"",S&&S.tot!==null?S.tot:""])});
  const csv="﻿"+L.map(r=>r.map(v=>`"${typeof v==="number"?String(v).replace(".",","):String(v??"").replace(/"/g,'""')}"`).join(";")).join("\n");
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download=`Notes_${slug(classe.nom)}_${slug(MOD.titre)}.csv`;document.body.appendChild(a);a.click();a.remove()}


/** Nettoie et sécurise un modèle produit par l'IA. */
function normModele(m){m=m&&typeof m==="object"?clone(m):{};
  const out={titre:String(m.titre||"Nouvelle activité").slice(0,60),ca:String(m.ca||"").slice(0,6),apsa:String(m.apsa||"").slice(0,60),description:String(m.description||"").slice(0,300),
    rm:!!m.rm,themes:[],sections:[],criteres:[],bareme:{afl1:{max:12,table:[]}}};
  const pair=x=>{if(!x||typeof x!=="object")return null;const a=[x[0],x[1]].map(v=>v===""||v==null?NaN:+v);return a.every(Number.isFinite)?a:null};
  const seen=new Set(),uniq=(id,set)=>{let b=idOk(id),x=b,i=2;while(set.has(x))x=b+"_"+i++;set.add(x);return x};
  (Array.isArray(m.themes)?m.themes:[]).slice(0,8).forEach(t=>{if(t&&t.label){const th={id:uniq(t.id||t.label,seen),label:String(t.label).slice(0,40),desc:String(t.desc||"").slice(0,160)};const r=pair(t.reps),q=pair(t.pct);if(r)th.reps=r;if(q)th.pct=q;out.themes.push(th)}});
  const secIds=new Set();
  (Array.isArray(m.sections)?m.sections:[]).slice(0,12).forEach(S=>{if(!S)return;const sec={id:uniq(S.id||S.titre,secIds),titre:String(S.titre||"Section").slice(0,60),consigne:String(S.consigne||"").slice(0,300),reprise:!!S.reprise,champs:[]};const cids=new Set();
    (Array.isArray(S.champs)?S.champs:[]).slice(0,20).forEach(C=>{if(!C)return;const type=G_TYPES[C.type]?C.type:"texte";
      const f={id:uniq(C.id||C.label,cids),type,label:String(C.label||"Champ").slice(0,80),aide:String(C.aide||"").slice(0,200),unite:String(C.unite||"").slice(0,12),requis:C.requis!==false};
      if(type==="choix")f.options=(Array.isArray(C.options)?C.options:[]).map(x=>String(x).slice(0,60)).slice(0,12);
      if(type==="echelle"){f.min=Number.isFinite(+C.min)?+C.min:1;f.max=Number.isFinite(+C.max)?+C.max:10;if(f.max<=f.min)f.max=f.min+9}
      if(type==="tableau"){const ccids=new Set();f.colonnes=(Array.isArray(C.colonnes)?C.colonnes:[]).slice(0,6).map(c=>({id:uniq(c.id||c.label,ccids),type:["texte","nombre","temps","choix"].includes(c.type)?c.type:"texte",label:String(c.label||"").slice(0,40),options:(Array.isArray(c.options)?c.options:[]).map(String).slice(0,12)}));if(!f.colonnes.length)f.colonnes=[{id:"valeur",type:"texte",label:"Valeur",options:[]}]}
      if(type==="passages"){f.nb=Math.max(1,Math.min(30,parseInt(C.nb)||4));if(C.nbChamp)f.nbChamp=String(C.nbChamp);f.noRep=!!C.noRep;f.adapt=!!C.adapt;f.coach=!!C.coach}
      if(type==="exercices")f.nb=Math.max(1,Math.min(10,parseInt(C.nb)||3));
      if(type==="resume"){const r=C.src&&typeof C.src==="object"?C.src:{};f.src={exos:String(r.exos||""),tours:String(r.tours||""),temps:String(r.temps||"")};f.requis=false}
      sec.champs.push(f)});
    out.sections.push(sec)});
  if(!out.sections.length)out.sections.push({id:"seance",titre:"Ma séance",consigne:"",champs:[{id:"notes",type:"texte_long",label:"Ce que j'ai fait",aide:"",unite:"",requis:true}]});
  const exists=p=>{const[a,b]=String(p||"").split(".");const S=out.sections.find(x=>x.id===a);return!!(S&&S.champs.find(c=>c.id===b))};
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
    else if(cal.type==="reperes"){const src=fixSrc(cal.source);cal=src?{type:"reperes",source:{champ:src.champ},min:Math.max(1,Math.min(10,parseInt(cal.min)||3))}:{type:"autoeval"}}
    else cal={type:"autoeval"};
    const cr={id:uniq(K.id||K.label,crIds),afl,label:String(K.label||"Critère").slice(0,120),descripteurs:d,points:pts,calcul:cal};
    if(Array.isArray(K.conseils)&&K.conseils.some(x=>x&&String(x).trim())){cr.conseils=[0,1,2,3].map(i=>String(K.conseils[i]||"").slice(0,300))}
    out.criteres.push(cr)});
  ["AFL2","AFL3"].forEach(a=>{if(!out.criteres.some(c=>c.afl===a))out.criteres.push({id:uniq(a.toLowerCase(),crIds),afl:a,label:a==="AFL2"?"S'entraîner, s'échauffer, analyser":"Coopérer : partenaire, juge, coach",descripteurs:["Insuffisant","Partiel","Adapté","Optimal"],points:[1,2,3,4],calcul:{type:"autoeval"}})});
  const b=m.bareme&&m.bareme.afl1||{};out.bareme.afl1.max=Number.isFinite(+b.max)&&+b.max>0?+b.max:12;
  out.bareme.afl1.table=(Array.isArray(b.table)?b.table:[]).map(r=>Array.isArray(r)?{pts:+r[0],note:+r[1]}:{pts:+r.pts,note:+r.note}).filter(r=>Number.isFinite(r.pts)&&Number.isFinite(r.note)).slice(0,60);
  return out}

/* --- Lecture des valeurs et correction --- */
const gSec=(M,id)=>M.sections.find(x=>x.id===id);
function gField(M,path){const[a,b]=String(path||"").split(".");const S=gSec(M,a);return S&&S.champs.find(c=>c.id===b)}
function gVal(s,path){const[a,b]=String(path||"").split(".");return((s.valeurs||{})[a]||{})[b]}
function gNb(M,s,f){if(f.nbChamp){const n=parseInt(num(gVal(s,f.nbChamp)));if(n>0)return Math.min(30,n)}return f.nb||4}
function passDur(tours){return tours.map((t,i)=>{const p=num(t&&t.passage),q=i?num(tours[i-1]&&tours[i-1].passage):0;return p>0&&(i===0||q>0)?p-q:NaN})}
function gRef(M,s,ref){return typeof ref==="number"?ref:ref&&ref.champ?gSource(M,s,ref):NaN}
function gSource(M,s,src){const f=gField(M,src.champ);if(!f)return NaN;const v=gVal(s,src.champ);
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
  return num(v)}
function gFilled(M,s,path){const f=gField(M,path),v=gVal(s,path);if(!f)return false;
  if(f.type==="tableau")return Array.isArray(v)&&v.some(r=>r&&Object.values(r).some(x=>x!==""&&x!=null));
  if(f.type==="passages")return Array.isArray(v)&&v.some(t=>num(t&&t.passage)>0);
  if(f.type==="exercices")return Array.isArray(v)&&v.some(e=>e&&e.nom);
  if(f.type==="resume")return true;
  if(f.type==="case"||f.type==="compteur")return true;
  return v!==undefined&&v!==null&&String(v).trim()!==""}
function gDegree(M,s,cr,profil){const c=cr.calcul||{type:"autoeval"};
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
  const R=M.criteres.map(cr=>({cr,deg:gDegree(M,s,cr,profil)}));
  const a1=R.filter(x=>x.cr.afl==="AFL1"),pts=a1.reduce((a,x)=>a+(x.deg?x.cr.points[x.deg-1]:0),0),pmax=a1.reduce((a,x)=>a+Math.max(...x.cr.points),0);
  const B=M.bareme.afl1;let n1=0;
  if(B.table&&B.table.length){const t=B.table.slice().sort((a,b)=>a.pts-b.pts);t.forEach(r=>{if(pts>=r.pts)n1=r.note})}else n1=pmax?pts/pmax*B.max:0;
  n1=Math.max(0,Math.min(B.max,Math.round(n1*10)/10));
  const aflPts=(afl,max)=>{const L=R.filter(x=>x.cr.afl===afl);if(!L.length||L.some(x=>!x.deg))return{d:null,p:0};const d=Math.floor(L.reduce((a,x)=>a+x.deg,0)/L.length);return{d,p:max*d/4}};
  const A2=aflPts("AFL2",rep[0]),A3=aflPts("AFL3",rep[1]);
  return{R,pts,pmax,n1,max1:B.max,a2:A2,a3:A3,rep,tot:n1+A2.p+A3.p,complete:R.every(x=>x.deg)}}
function gMissing(M,s){const m=[];M.sections.forEach(S=>S.champs.forEach(f=>{
    if(f.type==="exercices"){const rows=(gVal(s,S.id+"."+f.id)||[]).filter(e=>e&&e.nom);if(f.requis&&rows.filter(e=>String(e.reps??"").trim()).length<f.nb)m.push(`${S.titre} : ${f.nb} exercices avec leurs répétitions`);
      rows.filter(e=>e.type==="haltero").forEach(e=>{if(!(num(e.charge)>0))m.push(`La charge de « ${e.nom} »`);if(M.rm&&!(rmFor(data.profil,e.nom)>0))m.push(`Le 1RM de « ${e.nom} » dans ton profil`)});return}
    if(f.requis&&!["case","compteur","resume"].includes(f.type)&&!gFilled(M,s,S.id+"."+f.id))m.push(`${S.titre} : ${f.label}`)}));
  M.criteres.filter(c=>c.calcul.type==="autoeval").forEach(c=>{if(!(s.autoeval||{})[c.id])m.push(`Autoévaluation : ${c.label}`)});return m}
function gEnsure(M,s){s.valeurs=s.valeurs||{};s.autoeval=s.autoeval||{};M.sections.forEach(S=>{const o=s.valeurs[S.id]=s.valeurs[S.id]||{};S.champs.forEach(f=>{
  if(f.type==="tableau"){if(!Array.isArray(o[f.id])||!o[f.id].length)o[f.id]=[Object.fromEntries(f.colonnes.map(c=>[c.id,""]))]}
  else if(f.type==="passages"){if(!Array.isArray(o[f.id]))o[f.id]=[];const n=gNb(M,s,f);while(o[f.id].length<n)o[f.id].push({passage:null,noRep:0})}
  else if(f.type==="compteur"){if(o[f.id]===undefined)o[f.id]=0}
  else if(f.type==="exercices"){if(!Array.isArray(o[f.id])||!o[f.id].length)o[f.id]=Array.from({length:f.nb||3},(_,i)=>blankExo(["haltero","gym","cardio"][i%3]))}
  else if(f.type==="resume"){}
  else if(o[f.id]===undefined)o[f.id]=f.type==="case"?false:""})})}
function gCalcText(M,cr){const c=cr.calcul,src=x=>{if(typeof x==="number")return String(x);const f=gField(M,x.champ);if(!f)return"?";let t=`« ${f.label} »`;if(x.agg)t=`${AGG_FR[x.agg]||x.agg} de ${t}${x.colonne?` (${x.colonne})`:""}`;if(x.mesure)t=`${MES_FR[x.mesure]||x.mesure} de ${t}${x.cible!==undefined?` (cible : ${src(x.cible)}, ± ${x.tolerance||5} s)`:""}`;return t};
  if(c.type==="autoeval")return"Autoévaluation de l'élève";
  if(c.type==="rythme")return`Décrochage du rythme sur ${src(c.source)} (cible : ${src(c.source.cible??0)}, ± ${c.source.tolerance||5} s)`;
  if(c.type==="reperes")return`Repères du thème (répétitions, % du 1RM) sur ${src({champ:c.source.champ})}`;
  if(c.type==="complet")return`Remplissage de ${c.champs.length} champ(s) : D4 si ≥ ${Math.round(c.seuils[0]*100)} %, D3 ≥ ${Math.round(c.seuils[1]*100)} %, D2 ≥ ${Math.round(c.seuils[2]*100)} %`;
  if(c.type==="ecart")return`Écart entre ${src(c.source)} et ${src(c.cible)} : D4 si ≤ ${c.seuils[0]}, D3 ≤ ${c.seuils[1]}, D2 ≤ ${c.seuils[2]}`;
  const op=c.sens==="bas"?"≤":"≥";return`${src(c.source)} : D4 si ${op} ${c.seuils[0]}, D3 ${op} ${c.seuils[1]}, D2 ${op} ${c.seuils[2]}`}

/* --- Rendu d'une séance générique --- */
function gFieldHTML(M,s,S,f,base,L,V,deg){const v=s.valeurs[S.id][f.id],k=`${base}.${S.id}.${f.id}`,id="g-"+S.id+"-"+f.id,lab=`${esc(f.label)}${f.unite?` <span class="hint">(${esc(f.unite)})</span>`:""}`,help=f.aide?`<div class="hint">${esc(f.aide)}</div>`:"",st=V&&deg?stamp(deg):"";
  let inner;
  switch(f.type){
    case"texte_long":inner=`<label class="f">${lab}<textarea id="${id}" data-k="${k}">${esc(v)}</textarea></label>`;break;
    case"nombre":inner=`<label class="f">${lab}<input id="${id}" data-k="${k}" value="${esc(v)}" inputmode="decimal" data-rerender></label>`;break;
    case"temps":inner=`<label class="f">${lab}<input id="${id}" data-k="${k}" value="${esc(v)}" inputmode="numeric" placeholder="min:s" data-rerender></label>`;break;
    case"choix":inner=`<label class="f">${lab}<select id="${id}" data-k="${k}" data-rerender><option value="">—</option>${(f.options||[]).map(o=>`<option ${v===o?"selected":""}>${esc(o)}</option>`).join("")}</select></label>`;break;
    case"echelle":inner=`<label class="f">${lab}<select id="${id}" data-k="${k}" data-rerender><option value="">—</option>${Array.from({length:f.max-f.min+1},(_,i)=>f.min+i).map(n=>`<option ${String(v)===String(n)?"selected":""}>${n}</option>`).join("")}</select></label>`;break;
    case"case":inner=`<label class="row" style="font-weight:600;gap:10px"><input type="checkbox" id="${id}" data-k="${k}" data-t="bool" ${v?"checked":""} style="width:22px;height:22px"> ${lab}</label>`;break;
    case"compteur":inner=`<div class="f"><span style="font-size:.85rem;font-weight:600;color:var(--muted)">${lab}</span><div class="cnt" style="width:150px"><button data-act="gCnt" data-sec="${S.id}" data-f="${f.id}" data-d="-1" ${L?"disabled":""} aria-label="Moins">−</button><span>${num(v)||0}</span><button data-act="gCnt" data-sec="${S.id}" data-f="${f.id}" data-d="1" ${L?"disabled":""} aria-label="Plus">+</button></div></div>`;break;
    case"tableau":{const rows=Array.isArray(v)?v:[];
      inner=`<div class="f"><span style="font-size:.85rem;font-weight:600;color:var(--muted)">${lab}</span><div class="gtab" style="--cols:${f.colonnes.length}">${f.colonnes.map(c=>`<span class="gth">${esc(c.label)}</span>`).join("")}<span></span>
      ${rows.map((r,ri)=>f.colonnes.map(c=>c.type==="choix"?`<select id="${id}-${ri}-${c.id}" data-k="${k}.${ri}.${c.id}" aria-label="${esc(c.label)}"><option value="">—</option>${c.options.map(o=>`<option ${r[c.id]===o?"selected":""}>${esc(o)}</option>`).join("")}</select>`:`<input id="${id}-${ri}-${c.id}" data-k="${k}.${ri}.${c.id}" value="${esc(r[c.id])}" ${c.type!=="texte"?'inputmode="decimal"':""} ${c.type==="temps"?'placeholder="min:s"':""} aria-label="${esc(c.label)}">`).join("")+(L?"<span></span>":`<button class="btn ghost small" data-act="gDelRow" data-sec="${S.id}" data-f="${f.id}" data-i="${ri}" aria-label="Retirer la ligne">✕</button>`)).join("")}</div>
      ${L?"":`<button class="btn small" data-act="gAddRow" data-sec="${S.id}" data-f="${f.id}" style="justify-self:start">+ Ligne</button>`}</div>`;break}
    case"passages":{const coached=!COACH&&!PREVIEW&&f.coach&&s.coachUid;L=L||coached;const n=gNb(M,s,f),T=(Array.isArray(v)?v:[]).slice(0,n),D=passDur(T),nextI=T.findIndex(t=>!(num(t&&t.passage)>0));
      const PS=V?gPassStamps(M,S.id+"."+f.id):{},cbv=PS.cible?gRef(M,s,PS.cible.cible):NaN,tolv=PS.cible?num(PS.cible.tolerance)||5:5,inT=D.filter(d=>!isNaN(d)&&!isNaN(cbv)&&Math.abs(d-cbv)<=tolv).length;
      const fi=isNaN(cbv)?-1:D.findIndex(d=>!isNaN(d)&&d-cbv>tolv),tileS=k=>V&&k in PS?stamp(PS[k]):"";
      const cols=`24px minmax(0,1fr)${f.noRep?" 106px":""}${f.adapt?" 44px":""}`,nrT=T.reduce((a,t)=>a+(num(t&&t.noRep)||0),0),adT=T.reduce((a,t)=>a+adCount(t&&t.adapt),0),doneT=T.filter(t=>num(t&&t.passage)>0).length;
      const runBtn=chrono.run?`<button class="btn stop" data-act="chStop">Arrêt</button>`:`<button class="btn go" data-act="chGo">${elapsed()>0?"Reprendre":"Départ"}</button>`;
      inner=`<div class="f"><span style="font-size:.85rem;font-weight:600;color:var(--muted)">${lab}</span>
      ${f.coach&&!COACH&&!PREVIEW?vCoachBox(s,V||RO):""}
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
    case"resume":{const r=f.src||{},th=gTheme(M,s),p=data.profil,ex=(Array.isArray(gVal(s,r.exos))?gVal(s,r.exos):[]).filter(e=>e&&e.nom),n=parseInt(num(gVal(s,r.tours)))||0,prev=parseT(gVal(s,r.temps));
      const lines=ex.map(e=>{let det;if(e.type==="haltero"){const c=num(e.charge),rm=rmFor(p,e.nom);det=c>0?`${fmtN(c)} kg${rm>0?` <span class="hint">· ${Math.round(c/rm*100)} %</span>`:""}`:'<span class="ko">charge ?</span>'}
        else det=e.niveau?esc(e.niveau):'<span class="hint">niveau non précisé</span>';
        return`<li><span class="rq">${e.reps!==""&&e.reps!=null?esc(e.reps):"?"}</span><span class="mv">${esc(e.nom)}</span><span class="dt">${det}</span></li>`}).join("");
      inner=`<div class="sec-h"><h3>${esc(S.titre)}</h3><span class="spacer"></span>${th?`<span class="chip">${esc(th.label)}</span>`:""}</div>
        ${r.tours||r.temps?`<div class="rs-head">${n||"?"} tour${n>1?"s":""} <span>·</span> ${isNaN(prev)?"? ":fmtT(prev)} par tour</div>`:""}
        ${lines?`<ol class="rs">${lines}</ol>`:'<p class="hint" style="margin:0">Conçois tes exercices ci-dessus.</p>'}`;return inner}
    default:inner=`<label class="f">${lab}<input id="${id}" data-k="${k}" value="${esc(v)}"></label>`}
  return`<div class="gf st">${inner}${help}${st}</div>`}
let GRES=null;
/* Où tamponner chaque critère : sur la case mesurée ; pour les temps de passage, sur la tuile de la mesure (NO REP, adaptations, rythme…). */
function gStampMap(M,res){const m={};res.R.forEach(x=>{const c=x.cr.calcul;if(!x.deg)return;let ps=[];
    if(c.type==="complet"){const sec=String(c.champs[0]||"").split(".")[0];if(sec)ps=["@"+sec]}
    else if(c.source){const f=gField(M,c.source.champ);ps=f&&f.type==="passages"?[]:[c.source.champ]}
    ps.forEach(p=>{if(!m[p]||x.deg<m[p])m[p]=x.deg})});return m}
function gPassStamps(M,path){const o={};if(!GRES)return o;GRES.R.forEach(x=>{const c=x.cr.calcul;if(!c.source||c.source.champ!==path)return;
  const k=c.type==="rythme"?"rythme":{norep:"norep",adaptations:"adapt",proportion_dans_cible:"temps",nb_hors_cible:"temps",termine:"tours",temps_total:"tours"}[c.source.mesure]||"tours";
  o[k]=o[k]?Math.min(o[k],x.deg||0)||null:x.deg;if(c.source.cible!==undefined&&!o.cible)o.cible=c.source});return o}
function gSeance(s){if(!s){cur=null;return gListe()}const M=MOD;gEnsure(M,s);const V=!!s.valide,L=V||RO,i0=data.seances.indexOf(s),base=`seances.${i0}.valeurs`;
  const res=gCorrect(M,s,data.profil),sm=gStampMap(M,res),th=M.themes.find(t=>t.id===s.theme);GRES=V?res:null;
  const auto=M.criteres.filter(c=>c.calcul.type==="autoeval");
  let no=0;const secs=M.sections.map((S,si)=>S.champs.length&&S.champs.every(f=>f.type==="resume")?`<section class="card resume" id="gsec-${si}">${S.champs.map(f=>gFieldHTML(M,s,S,f,base,L,V)).join("")}</section>`:`<section class="card sec" id="gsec-${si}"><div class="sec-h"><span class="num">${++no}</span><h3>${esc(S.titre)}</h3>${V&&sm["@"+S.id]?`<span class="spacer"></span>${stamp(sm["@"+S.id])}`:""}</div>
    ${S.consigne?`<p class="hint" style="margin:-4px 0 10px">${esc(S.consigne)}</p>`:""}<div class="stack" style="gap:12px">${S.champs.map(f=>gFieldHTML(M,s,S,f,base,L,V,sm[S.id+"."+f.id])).join("")}</div></section>`).join("");
  const ae=auto.length?`<section class="card sec"><div class="sec-h"><span class="num">${no+1}</span><h3>Je m'autoévalue</h3></div><p class="hint" style="margin:-4px 0 10px">Touche un niveau pour lire ses critères.</p>
    <div class="stack" style="gap:12px">${auto.map(c=>`<div class="ae"><div class="row"><strong>${esc(c.afl)} · ${esc(c.label)}</strong>${V?`<span class="spacer"></span>${stamp(s.autoeval[c.id]||null)}`:""}</div><div class="lvls">${[1,2,3,4].map(d=>`<button class="lvl d${d}${s.autoeval[c.id]===d?" on":""}" data-act="gLvl" data-c="${c.id}" data-d="${d}"><b>D${d}</b><span>${esc((c.descripteurs[d-1]||"").slice(0,38))}${(c.descripteurs[d-1]||"").length>38?"…":""}</span></button>`).join("")}</div></div>`).join("")}</div></section>`:"";
  return`<div class="stack seance" style="--th:var(--accent)">
  ${PREVIEW?"":`<div class="row"><button class="btn ghost small" data-act="back">← ${RO?"Séances":"Mes séances"}</button><span class="spacer"></span>${L?"":`<button class="btn danger small" data-act="delSeance">Supprimer</button>`}</div>`}
  <section class="hero"><div class="hero-top"><span class="eyebrow">${esc(M.ca||"")} · Séance ${i0+1}${s.epreuve?" · Épreuve":""}</span><span class="spacer"></span>${L?`<span class="lock-chip">${V?"🔒 Validée":"En cours"}</span>`:`<label class="hero-date"><span class="sr">Date</span><input type="date" id="g-date" data-k="seances.${i0}.date" value="${esc(s.date)}"></label>`}</div>
    <div class="hero-main"><div><h2 class="hero-t" style="font-size:2.1rem">${esc(M.titre)}</h2><div class="hero-sub">${th?`<strong>${esc(th.label)}</strong> · ${esc(th.desc||"")}${th.reps?`<br>${th.reps[0]}–${th.reps[1]} répétitions`:""}${th.pct?` · haltéro ${th.pct[0]}–${th.pct[1]} % du 1RM`:""}`:esc(M.description||"")}</div></div>${V?gRing(res):""}</div>
    ${M.themes.length&&!L?`<div class="pills" style="grid-template-columns:repeat(${Math.min(3,M.themes.length)},minmax(0,1fr))">${M.themes.map(t=>`<label title="${esc(t.desc)}"><input type="radio" name="gth" data-k="seances.${i0}.theme" data-rerender value="${t.id}" ${s.theme===t.id?"checked":""}>${esc(t.label)}</label>`).join("")}</div>`:""}
    ${L?"":`<label class="hero-ep"><input type="checkbox" id="g-ep" data-k="seances.${i0}.epreuve" data-t="bool" data-rerender ${s.epreuve?"checked":""}> Séance d'épreuve</label>`}</section>
  <fieldset class="lock" ${L?"disabled":""}><legend class="sr">Séance</legend><div class="stack">${secs}${ae}</div></fieldset>${gDatalist(M,s)}
  ${V?gCorrHTML(M,res):""}
  ${PREVIEW?`<div class="valid-bar"><button class="btn big" data-act="gTest">${V?"Revenir en saisie":"🧪 Tester la correction"}</button></div>`:V?(RO?`<div class="valid-bar"><button class="btn big" data-act="unlock">🔓 Déverrouiller la séance pour l'élève</button></div>`:""):RO?`<p class="hint" style="text-align:center">Séance pas encore validée par l'élève.</p>`:`<div class="valid-bar"><button class="btn big go-valid" data-act="gValidate"><span>🏁 Valider ma séance</span><small>La séance ne pourra plus être modifiée</small></button></div>`}</div>`}
function gRing(res){const ok=res.complete,v=ok?res.tot:res.n1,max=ok?20:res.max1,f=Math.max(0,Math.min(1,v/max)),R=34,Lg=2*Math.PI*R;
  return`<div class="ring"><svg viewBox="0 0 84 84" width="84" height="84" aria-hidden="true"><circle cx="42" cy="42" r="${R}" fill="none" stroke="rgba(255,255,255,.22)" stroke-width="8"/><circle cx="42" cy="42" r="${R}" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" stroke-dasharray="${(Lg*f).toFixed(1)} ${Lg.toFixed(1)}" transform="rotate(-90 42 42)"/></svg><div class="ring-v"><b>${fmtN(v)}</b><small>/ ${max}</small></div><div class="ring-m">${f>=.8?"Séance au top !":f>=.6?"Belle séance":f>=.4?"Ça progresse":"On ajuste et on repart"}</div></div>`}
function gCorrHTML(M,res){let dom="";const rows=res.R.slice().sort((a,b)=>a.cr.afl.localeCompare(b.cr.afl)).map(x=>{const h=x.cr.afl!==dom?`<div class="dom">${x.cr.afl}</div>`:"";dom=x.cr.afl;
    return h+`<div class="crit">${stamp(x.deg)}<div><div class="t">${esc(x.cr.label)}</div><div class="m">${x.deg?esc(x.cr.descripteurs[x.deg-1]||""):"À compléter"}</div>${x.deg&&x.cr.conseils&&x.cr.conseils[x.deg-1]?`<div class="tip">→ ${esc(x.cr.conseils[x.deg-1])}</div>`:""}<div class="hint" style="font-size:.78rem;margin-top:2px">${esc(gCalcText(M,x.cr))}</div></div><div class="rx">${x.cr.afl==="AFL1"&&x.deg?fmtN(x.cr.points[x.deg-1])+" pt":""}</div></div>`}).join("");
  return`<section class="card corr" id="corr"><div class="sec-h"><h2>Ma correction</h2><span class="hint">Référentiel ${esc(M.ca||"")}</span></div>
  <div class="score"><div class="tile"><div class="k">AFL1</div><div class="v">${fmtN(res.n1)}<small> / ${res.max1}</small></div></div>
  <div class="tile"><div class="k">AFL2 + AFL3</div><div class="v">${fmtN(res.a2.p+res.a3.p)}<small> / 8</small></div></div>
  <div class="tile tot"><div class="k">Note</div><div class="v">${res.complete?fmtN(res.tot):"–"}<small> / 20</small></div></div></div>
  <div style="margin-top:4px">${rows}</div><div class="legend" style="margin-top:10px">${[1,2,3,4].map(d=>`<span>${stamp(d,true)} D${d}</span>`).join("")}</div></section>`}
function gListe(){const items=data.seances.map((s,i)=>{let right=`<span class="chip">En cours</span>`,col="var(--line)";
    if(s.valide){const r=gCorrect(MOD,s,data.profil);const f=r.complete?r.tot/20:r.n1/r.max1,d=f>=.8?4:f>=.6?3:f>=.4?2:1;col=`var(--d${d})`;right=`<div class="big">${r.complete?fmtN(r.tot):fmtN(r.n1)}<small>${r.complete?"/ 20":"/ "+r.max1+" (AFL1)"}</small></div>`}
    return`<button class="s-item" data-open="${s.id}" style="border-left-color:${col}"><div><div class="row"><strong>Séance ${i+1}</strong>${s.valide?" 🔒":""}${s.epreuve?'<span class="chip" style="border-color:var(--accent);color:var(--accent)">Épreuve</span>':""}</div><div class="hint">${fmtDate(s.date)}</div></div>${right}</button>`}).reverse().join("");
  return`<div class="stack"><div class="row"><h2>${RO?"Séances":"Mes séances"}</h2><span class="spacer"></span>${RO?"":`<button class="btn primary" data-act="gNew">+ Nouvelle séance</button>`}</div>
  ${items?`<div class="list-s">${items}</div>`:`<div class="card"><p style="margin:0">Aucune séance pour l'instant.</p></div>`}</div>`}
function gBilan(){const V=data.seances.map((s,i)=>s.valide?{s,i,r:gCorrect(MOD,s,data.profil)}:null).filter(Boolean);
  const ep=V.filter(x=>x.s.epreuve),last=ep.length?ep[ep.length-1]:V[V.length-1],a3p=carnetDoc&&carnetDoc.afl3Prof;
  const heat=V.length?`<div class="scroll"><table class="heat"><thead><tr><th>Critère</th>${V.map(x=>`<th>S${x.i+1}</th>`).join("")}</tr></thead><tbody>${MOD.criteres.map(c=>`<tr><td>${esc(c.afl)} · ${esc(c.label)}</td>${V.map(x=>`<td>${stamp(x.r.R.find(y=>y.cr.id===c.id).deg,true)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`:"";
  return`<div class="stack"><h2>${RO?"Bilan de l'élève":"Mon bilan"}</h2>
  <section class="card"><div class="score"><div class="tile"><div class="k">AFL1 ${last&&last.s.epreuve?"· épreuve":"· dernière"}</div><div class="v">${last?fmtN(last.r.n1):"–"}<small> / ${last?last.r.max1:12}</small></div></div>
  <div class="tile"><div class="k">Note ${last&&last.s.epreuve?"d'épreuve":"dernière séance"}</div><div class="v">${last&&last.r.complete?fmtN(last.r.tot):"–"}<small> / 20</small></div></div>
  <div class="tile"><div class="k">Séances validées</div><div class="v">${V.length}</div></div></div>
  <p class="hint" style="margin:8px 0 0">${a3p?`AFL3 fixé par l'enseignant : <strong>D${a3p}</strong>.`:"L'AFL3 définitif est fixé par l'enseignant."}</p></section>
  ${heat?`<section class="card"><div class="sec-h"><h3>Degrés séance par séance</h3></div>${heat}</section>`:""}</div>`}
function gProfil(){const p=data.profil;
  return`<div class="stack"><fieldset class="lock" ${RO?"disabled":""}><legend class="sr">Profil</legend><div class="stack">
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
async function openCarnetModele(act){go("loading",{msg:"Ouverture du carnet…"});
  try{if(act===CA5_ID){const r=await ca5Modele(me.profId);MODDOC=r.doc;MOD=r.M}
    else{const md=actsList.find(a=>a.id===act)||{doc:await fb.getModele(act)};if(!md.doc)throw{code:"not-found"};MODDOC=md.doc;MOD=normModele(md.doc.modele||md.doc.brouillon)}
    activite=act;RO=false;PREVIEW=false;carnetId=`${me.uid}_${act}`;
    let c=await fb.getCarnet(carnetId);
    if(!c){const b={eleveUid:me.uid,profId:me.profId,classeId:me.classeId,activite:act,profil:blankProfil()};await fb.createCarnet(carnetId,b);c={id:carnetId,...b}}
    const ss=await fb.listSeances(carnetId);setCarnetData(c,ss);view="seances";cur=null;syncState="ok";go("carnet")}
  catch(e){console.error(e);go("error",{msg:authMsg(e)})}}

/* --- Suivi prof (activité générique) --- */
function gRowStats(r){if(!r.c)return null;const d={profil:{repartition:"4-4",...(r.c.profil||{})},seances:r.ss.slice().sort((a,b)=>(a.ordre||0)-(b.ordre||0))};
  const V=d.seances.filter(s=>s.valide),ep=V.filter(s=>s.epreuve),last=ep.length?ep[ep.length-1]:V[V.length-1];
  const res=last?gCorrect(MOD,last,d.profil):null,m3=REPART[d.profil.repartition||"4-4"][1],a3=r.c.afl3Prof?m3*r.c.afl3Prof/4:null;
  return{nv:V.length,n:d.seances.length,res,ep:!!ep.length,m3,a3,tot:res&&a3!==null?res.n1+res.a2.p+a3:null,ae3:res&&res.a3.d}}
function gSuivi(){const rep=getReperes(classe.id);
  const rows=suivi.rows.map((r,i)=>{const S=gRowStats(r);const name=`<strong>N°${r.e.numero}</strong>${rep[r.e.id]?` · ${esc(rep[r.e.id])}`:""}<div class="hint"><code>${esc(r.e.login)}</code></div>`;
    if(!S)return`<tr><td>${name}</td><td colspan="5" class="hint">Carnet pas encore ouvert</td></tr>`;
    return`<tr class="clk" data-act="openEleve" data-i="${i}"><td>${name}</td><td class="n">${S.nv}<span class="hint"> / ${S.n}</span></td><td class="n">${S.res&&S.res.complete?fmtN(S.res.tot):"–"}</td><td class="n">${S.res?fmtN(S.res.n1):"–"}${S.ep?" ★":""}</td>
    <td class="noclk"><select id="a3-${i}" data-a3="${i}" aria-label="AFL3"><option value="">—</option>${[1,2,3,4].map(d=>`<option value="${d}" ${r.c.afl3Prof==d?"selected":""}>D${d}</option>`).join("")}</select><div class="hint">/ ${S.m3}${S.ae3?` · auto D${S.ae3}`:""}</div></td>
    <td class="n"><strong>${S.tot===null?"–":fmtN(S.tot)}</strong></td></tr>`}).join("");
  return`<div class="stack"><div class="row"><button class="btn ghost small" data-act="backClasse">← ${esc(classe.nom)}</button><span class="spacer"></span><button class="btn small" data-act="gExport">Exporter (.csv)</button><button class="btn small" data-act="openModele" data-id="${suivi.act}">Modifier le carnet</button></div>
  <div class="class-hero"><span class="eyebrow">${esc(MOD.ca||"")} · ${esc(classe.nom)}</span><h2>${esc(MOD.titre)}</h2></div>
  <section class="card"><div class="sec-h"><h3>Carnets des élèves</h3><span class="hint">Touchez une ligne pour ouvrir le carnet</span></div>
  ${rows?`<div class="scroll"><table class="suivi"><thead><tr><th>Élève</th><th class="n">Séances validées</th><th class="n">Dernière note /20</th><th class="n">AFL1</th><th>AFL3 prof</th><th class="n">Total /20</th></tr></thead><tbody>${rows}</tbody></table></div>`:`<p class="hint">Aucun élève dans cette classe.</p>`}
  <p class="hint" style="margin:8px 0 0">Total = AFL1 et AFL2 de la séance d'épreuve (★) ou de la dernière séance validée + AFL3 fixé par vous.</p></section></div>`}

/* --- Modèles : liste et éditeur avec l'IA --- */
let ca5Doc=null;
async function openModeles(){go("loading");try{const all=await fb.listModeles(me.uid);ca5Doc=all.find(m=>m.id===ca5DocId(me.uid))||null;modeles=all.filter(m=>m.id!==ca5DocId(me.uid)).sort((a,b)=>String(a.titre).localeCompare(String(b.titre),"fr"));go("modeles")}catch(e){go("error",{msg:authMsg(e)})}}
async function openCa5(){go("loading");try{await loadClasses();ca5Doc=await fb.getModele(ca5DocId(me.uid)).catch(()=>null);const d=ca5Doc||{};
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
    <button class="btn primary big" type="submit" ${iaBusy?"disabled":""}>${iaBusy?"L'IA lit vos documents…":"✨ Créer l'ébauche avec l'IA"}</button>
    <button class="btn" type="button" data-act="mBlank">Partir d'un carnet vide</button>
    <p class="hint" style="margin:0">${IAKEY?"Gemini avec votre clé personnelle (votre propre quota gratuit).":"Gemini, quota gratuit partagé entre les profs de l'appli. Pour avoir votre propre quota, ajoutez votre clé Gemini dans « Compte »."} Comptez 30 secondes à 2 minutes.</p></form></div>`}

/* --- Éditeur : bac à sable / publié --- */
const newId=p=>p+"_"+Math.random().toString(36).slice(2,7);
function blankModele(){return{titre:"Nouvelle activité",ca:"",apsa:"",description:"",themes:[],sections:[{id:newId("s"),titre:"Ma séance",consigne:"",champs:[{id:newId("c"),type:"texte_long",label:"Ce que j'ai fait",aide:"",unite:"",requis:true}]}],criteres:[],bareme:{afl1:{max:12,table:[]}}}}
function startEditor(doc){const pub=doc.modele?normModele(doc.modele):null,draft=normModele(doc.brouillon||doc.modele||blankModele());
  modeleEdit={id:doc.id||null,fixedId:doc.fixedId||null,builtin:!!doc.builtin,draft,pub,statut:pub&&doc.statut!=="brouillon"?"publie":"brouillon",publieLe:doc.publieLe||null,dirty:!doc.id&&!doc.builtin,tab:"seance"};
  modeleHist=[];setPreview();go("modele")}
function setPreview(){MOD=normModele(modeleEdit.draft);PREVIEW=true;RO=false;carnetId=null;carnetDoc=null;const s={id:"apercu",ordre:1,date:today(),valide:false,epreuve:false,theme:MOD.themes[0]&&MOD.themes[0].id||"",valeurs:{},autoeval:{}};gEnsure(MOD,s);data={profil:{projet:"",repartition:"4-4"},seances:[s]};cur=s.id}
const SB=()=>modeleEdit&&modeleEdit.statut==="brouillon";
function mIn(path,val,attrs="",label=""){return`<label class="f">${label}<input data-m="${path}" value="${esc(val??"")}" ${attrs}></label>`}
function mTa(path,val,label,attrs=""){return`<label class="f">${label}<textarea data-m="${path}" ${attrs}>${esc(val??"")}</textarea></label>`}
function mSel(path,val,opts,label,attrs=""){return`<label class="f">${label}<select data-m="${path}" ${attrs}>${opts.map(([v,l])=>`<option value="${esc(v)}" ${String(v)===String(val)?"selected":""}>${esc(l)}</option>`).join("")}</select></label>`}
function allFields(M,types){const out=[];M.sections.forEach(S=>S.champs.forEach(f=>{if(!types||types.includes(f.type))out.push([S.id+"."+f.id,`${S.titre} › ${f.label}`])}));return out}
function mFieldEd(M,si,fi,f){const p=`sections.${si}.champs.${fi}`;let extra="";
  if(f.type==="choix")extra=mIn(p+".options",(f.options||[]).join(", "),'data-mt="list"',"Choix proposés (séparés par des virgules)");
  if(f.type==="echelle")extra=`<div class="grid2">${mIn(p+".min",f.min,'data-mt="num" inputmode="numeric"',"De")}${mIn(p+".max",f.max,'data-mt="num" inputmode="numeric"',"À")}</div>`;
  if(f.type==="tableau")extra=`<div class="f"><span class="mlab">Colonnes</span>${(f.colonnes||[]).map((c,ci)=>`<div class="mcol">${mIn(`${p}.colonnes.${ci}.label`,c.label,"","")}${mSel(`${p}.colonnes.${ci}.type`,c.type,[["texte","Texte"],["nombre","Nombre"],["temps","Temps"],["choix","Choix"]],"","data-rerender")}<button class="btn ghost small" data-act="mDelCol" data-si="${si}" data-fi="${fi}" data-ci="${ci}" aria-label="Retirer la colonne">✕</button>${c.type==="choix"?`<div style="grid-column:1/-1">${mIn(`${p}.colonnes.${ci}.options`,(c.options||[]).join(", "),'data-mt="list"',"Choix (virgules)")}</div>`:""}</div>`).join("")}<button class="btn small" data-act="mAddCol" data-si="${si}" data-fi="${fi}" style="justify-self:start">+ Colonne</button></div>`;
  if(f.type==="exercices")extra=mIn(p+".nb",f.nb,'data-mt="num" inputmode="numeric" style="max-width:120px"',"Lignes au départ");
  if(f.type==="resume"){const sr=f.src||{};extra=`${mSel(p+".src.exos",sr.exos||"",[["","—"],...allFields(M,["exercices"])],"Exercices résumés")}<div class="grid2">${mSel(p+".src.tours",sr.tours||"",[["","—"],...allFields(M,["nombre"])],"Nombre de tours")}${mSel(p+".src.temps",sr.temps||"",[["","—"],...allFields(M,["temps"])],"Temps par tour")}</div>`}
  if(f.type==="passages")extra=`<div class="grid2">${mIn(p+".nb",f.nb,'data-mt="num" inputmode="numeric"',"Nombre de tours")}${mSel(p+".nbChamp",f.nbChamp||"",[["","Nombre fixe"],...allFields(M,["nombre"])],"ou lu dans la case","data-rerender")}</div><label class="row" style="gap:8px;font-weight:600"><input type="checkbox" data-m="${p}.noRep" data-mt="bool" ${f.noRep?"checked":""} style="width:20px;height:20px"> Compteur de NO REP par tour</label>
    <label class="row" style="gap:8px;font-weight:600"><input type="checkbox" data-m="${p}.adapt" data-mt="bool" ${f.adapt?"checked":""} style="width:20px;height:20px"> Bouton adaptation par tour</label>
    <label class="row" style="gap:8px;font-weight:600"><input type="checkbox" data-m="${p}.coach" data-mt="bool" ${f.coach?"checked":""} style="width:20px;height:20px"> Un coach peut remplir depuis son téléphone</label>`;
  return`<div class="mfield"><div class="mf-h"><span class="chip">${esc(G_TYPES[f.type]||f.type)}</span><span class="spacer"></span>
    <button class="btn ghost small" data-act="mUpChamp" data-si="${si}" data-fi="${fi}" aria-label="Monter">↑</button><button class="btn ghost small" data-act="mDownChamp" data-si="${si}" data-fi="${fi}" aria-label="Descendre">↓</button><button class="btn ghost small danger" data-act="mDelChamp" data-si="${si}" data-fi="${fi}" aria-label="Supprimer la case">✕</button></div>
    <div class="grid2">${mIn(p+".label",f.label,"","Intitulé")}${mSel(p+".type",f.type,Object.entries(G_TYPES),"Type de case","data-rerender")}</div>
    <div class="grid2">${mIn(p+".unite",f.unite,"","Unité (facultatif)")}${mIn(p+".aide",f.aide,"","Aide pour l'élève")}</div>${extra}
    <label class="row" style="gap:8px;font-weight:600"><input type="checkbox" data-m="${p}.requis" data-mt="bool" ${f.requis?"checked":""} style="width:20px;height:20px"> Obligatoire pour valider</label></div>`}
function mCritEd(M,ci,c){const p=`criteres.${ci}`,cal=c.calcul||{type:"autoeval"};const nums=allFields(M,["nombre","temps","echelle","compteur","case","choix","tableau","passages"]);
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
  if(cal.type==="complet")cfg=`<div class="f"><span class="mlab">Cases à remplir</span><div class="mchecks">${allFields(M).map(([v,l])=>`<label><input type="checkbox" data-mcomplet="${ci}" value="${v}" ${(cal.champs||[]).includes(v)?"checked":""}> ${esc(l)}</label>`).join("")}</div></div>`;
  return`<div class="mfield"><div class="mf-h"><span class="chip">${esc(c.afl)}</span><strong style="flex:1;min-width:0">${esc(c.label)}</strong><button class="btn ghost small danger" data-act="mDelCrit" data-ci="${ci}" aria-label="Supprimer le critère">✕</button></div>
    <div class="grid2">${mSel(p+".afl",c.afl,[["AFL1","AFL1"],["AFL2","AFL2"],["AFL3","AFL3"]],"AFL","data-rerender")}${mIn(p+".label",c.label,"","Élément évalué")}</div>
    ${[0,1,2,3].map(d=>`<div class="mdeg"><span class="cell d${d+1}">D${d+1}</span><div class="stack" style="gap:4px">${mTa(`${p}.descripteurs.${d}`,c.descripteurs[d],"",'rows="2"')}${c.afl==="AFL1"?mIn(`${p}.conseils.${d}`,(c.conseils||[])[d]||"",'placeholder="Conseil affiché à l\'élève (facultatif)"',""):""}</div>${c.afl==="AFL1"?mIn(`${p}.points.${d}`,c.points[d],'data-mt="num" inputmode="decimal" style="width:70px"',"pts"):""}</div>`).join("")}
    ${mSel(p+".calcul.type",cal.type,[["autoeval","Autoévaluation de l'élève"],["seuils","Calcul automatique : seuils"],["ecart","Calcul automatique : écart à une valeur"],["complet","Calcul automatique : cases remplies"],["rythme","Calcul automatique : décrochage du rythme"],["reperes","Calcul automatique : repères du thème"]],"Correction","data-rerender")}${cfg}</div>`}
function vModele(){const E=modeleEdit,M=E.draft,sb=SB(),pubDate=E.publieLe&&E.publieLe.toDate?E.publieLe.toDate().toLocaleDateString("fr-FR"):"";
  const act=E.builtin?'<p class="hint" style="margin:0">Le carnet de cross training est disponible pour toutes vos classes.</p>':classes.map(c=>`<label class="row" style="gap:8px;font-weight:600"><input type="checkbox" data-actcls="${c.id}" ${E.id&&(c.activites||[]).includes(E.id)?"checked":""} ${E.id?"":"disabled"} style="width:20px;height:20px"> ${esc(c.nom)}</label>`).join("");
  const head=`<div class="row"><button class="btn ghost small" data-act="backModeles">← Mes carnets</button><span class="spacer"></span>${E.id?`<button class="btn danger small" data-act="delModele">${E.builtin?"Version d'origine":"Supprimer"}</button>`:""}${sb?`<button class="btn small" data-act="saveModele">${E.dirty?"Enregistrer":"Enregistré ✓"}</button>`:""}</div>
  <section class="class-hero"><span class="eyebrow">${esc(M.ca||"")}${M.apsa?" · "+esc(M.apsa):""}</span><h2>${esc(M.titre)}</h2>
    <div class="row" style="margin-top:8px">${sb?`<span class="chip" style="background:#fff3cd;color:#7a5a00;border-color:#f2d16b">🧪 Bac à sable</span>${E.pub?`<span class="hint" style="color:#cfd6dc">Les élèves utilisent la version publiée${pubDate?" du "+pubDate:""}.</span>`:`<span class="hint" style="color:#cfd6dc">Pas encore visible par les élèves.</span>`}`:`<span class="chip" style="background:#d9f2e4;color:#155c36;border-color:#8fd3ae">✅ Publié${pubDate?" le "+pubDate:""}</span><span class="hint" style="color:#cfd6dc">Les élèves remplissent cette version.</span>`}</div></section>`;
  if(!sb)return`<div class="stack">${head}
    <section class="card"><div class="row"><div style="flex:1;min-width:200px"><strong>Modifier ce carnet ?</strong><div class="hint">Repassez en bac à sable : les élèves gardent la version publiée et toutes leurs données jusqu'à ce que vous republiiez.</div></div><button class="btn primary" data-act="mSandbox">✏️ Repasser en bac à sable</button></div></section>
    <section class="card"><div class="sec-h"><h3>Activé pour</h3></div>${act||'<p class="hint">Aucune classe.</p>'}</section>
    <h2 style="margin-top:6px">Aperçu élève</h2>${gSeance(curS())}</div>`;
  const tabs=[["seance","Séance"],["criteres","Critères"],["infos","Infos"],["apercu","Aperçu"]];
  let body="";
  if(E.tab==="seance")body=M.sections.map((S,si)=>`<section class="card sec"><div class="sec-h"><span class="num">${si+1}</span><h3>${esc(S.titre)}</h3><span class="spacer"></span><button class="btn ghost small" data-act="mUpSec" data-si="${si}" aria-label="Monter">↑</button><button class="btn ghost small" data-act="mDownSec" data-si="${si}" aria-label="Descendre">↓</button><button class="btn ghost small danger" data-act="mDelSec" data-si="${si}" aria-label="Supprimer la partie">✕</button></div>
      <div class="grid2">${mIn(`sections.${si}.titre`,S.titre,"","Titre de la partie")}${mIn(`sections.${si}.consigne`,S.consigne,"","Consigne pour l'élève")}</div>
      <label class="row" style="gap:8px;font-weight:600;margin-top:6px"><input type="checkbox" data-m="sections.${si}.reprise" data-mt="bool" ${S.reprise?"checked":""} style="width:20px;height:20px"> Reprendre les réponses de la séance précédente</label>
      <div class="stack" style="gap:10px;margin-top:10px">${S.champs.map((f,fi)=>mFieldEd(M,si,fi,f)).join("")}</div>
      <button class="btn small" data-act="mAddChamp" data-si="${si}" style="margin-top:10px">+ Ajouter une case</button></section>`).join("")+`<button class="btn" data-act="mAddSec">+ Ajouter une partie</button>`;
  if(E.tab==="criteres")body=`<p class="hint" style="margin:0">Chaque critère a 4 degrés. Choisissez s'il est corrigé automatiquement à partir d'une case, ou par l'autoévaluation de l'élève.</p>`+M.criteres.map((c,ci)=>mCritEd(M,ci,c)).join("")+`<button class="btn" data-act="mAddCrit">+ Ajouter un critère</button>
    <section class="card"><div class="sec-h"><h3>Barème AFL1</h3></div>${mIn("bareme.afl1.max",M.bareme.afl1.max,'data-mt="num" inputmode="numeric" style="max-width:120px"',"Note maximale")}
    <p class="hint">Table de conversion (facultative) : à partir de tant de points, la note vaut… Sans table, la note est proportionnelle aux points.</p>
    ${M.bareme.afl1.table.map((r,ri)=>`<div class="mcol">${mIn(`bareme.afl1.table.${ri}.pts`,r.pts,'data-mt="num" inputmode="decimal"',"Points ≥")}${mIn(`bareme.afl1.table.${ri}.note`,r.note,'data-mt="num" inputmode="decimal"',"Note")}<button class="btn ghost small" data-act="mDelRow" data-ri="${ri}" aria-label="Retirer">✕</button></div>`).join("")}<button class="btn small" data-act="mAddRow">+ Ligne</button></section>`;
  if(E.tab==="infos")body=`<section class="card stack" style="gap:10px">${mIn("titre",M.titre,"","Nom de l'activité")}<div class="grid2">${mSel("ca",M.ca,[["",""],["CA1","CA1"],["CA2","CA2"],["CA3","CA3"],["CA4","CA4"],["CA5","CA5"]],"Champ d'apprentissage")}${mIn("apsa",M.apsa,"","APSA")}</div>${mTa("description",M.description,"Description pour l'élève")}
    <label class="row" style="gap:8px;font-weight:600"><input type="checkbox" data-m="rm" data-mt="bool" ${M.rm?"checked":""} style="width:20px;height:20px"> Les élèves notent leurs 1RM dans leur profil</label></section>
    <section class="card"><div class="sec-h"><h3>Thèmes au choix de l'élève</h3></div>${M.themes.map((t,ti)=>`<div class="mfield" style="margin-bottom:8px"><div class="mcol" style="margin:0">${mIn(`themes.${ti}.label`,t.label,"","Thème")}${mIn(`themes.${ti}.desc`,t.desc,"","Description")}<button class="btn ghost small" data-act="mDelTheme" data-ti="${ti}" aria-label="Retirer">✕</button></div>
      <div class="grid4">${mIn(`themes.${ti}.reps.0`,(t.reps||[])[0],'data-mt="num" inputmode="numeric"',"Rép. min")}${mIn(`themes.${ti}.reps.1`,(t.reps||[])[1],'data-mt="num" inputmode="numeric"',"Rép. max")}${mIn(`themes.${ti}.pct.0`,(t.pct||[])[0],'data-mt="num" inputmode="numeric"',"% 1RM min")}${mIn(`themes.${ti}.pct.1`,(t.pct||[])[1],'data-mt="num" inputmode="numeric"',"% 1RM max")}</div></div>`).join("")}
    <p class="hint" style="margin:0 0 8px">Repères facultatifs, utilisés par le critère « repères du thème ».</p><button class="btn small" data-act="mAddTheme">+ Thème</button></section>
    <section class="card"><div class="sec-h"><h3>Activer pour mes classes</h3></div>${E.id?(act||'<p class="hint">Aucune classe.</p>'):'<p class="hint">Enregistrez d\'abord le carnet.</p>'}<p class="hint" style="margin:6px 0 0">Les élèves le voient une fois publié.</p></section>`;
  if(E.tab==="apercu")body=`<p class="hint" style="margin:0">Remplissez l'aperçu puis « Tester la correction ». Rien n'est enregistré.</p>${gSeance(curS())}`;
  return`<div class="stack">${head}
  <section class="card ia-box"><div class="sec-h"><h3>✨ Demander à l'IA</h3>${modeleHist.length?`<span class="spacer"></span><button class="btn ghost small" data-act="iaUndo">↶ Annuler (${modeleHist.length})</button>`:""}</div>
    <p class="hint" style="margin:-4px 0 0">Donnez vos consignes de correction : l'IA modifie le bac à sable, vous vérifiez puis vous publiez.</p>
    <textarea id="ia-req" placeholder="ex. Ajoute la fréquence cardiaque à la fin de chaque tour · Le critère de régularité doit tolérer 3 s"></textarea>
    <label class="f">Joindre un document (facultatif)<input type="file" id="ia-file" accept="application/pdf,image/*"></label>
    <div class="err" id="ia-err"></div><button class="btn primary" data-act="iaEdit" ${iaBusy?"disabled":""}>${iaBusy?"L'IA modifie le carnet…":"Envoyer à l'IA"}</button></section>
  <div class="seg2" style="grid-template-columns:repeat(4,1fr)">${tabs.map(([k,l])=>`<button data-act="mTab" data-t="${k}" aria-current="${E.tab===k}">${l}</button>`).join("")}</div>
  ${body}
  <div class="valid-bar"><button class="btn big go-valid" style="--th:var(--d4)" data-act="mPublish"><span>✅ Valider et publier</span><small>${E.pub?"Remplace la version des élèves · leurs données sont conservées":"Le carnet apparaît pour les élèves des classes activées"}</small></button></div></div>`}
const fileToB64=f=>new Promise((ok,ko)=>{const r=new FileReader();r.onload=()=>ok(String(r.result).split(",")[1]);r.onerror=ko;r.readAsDataURL(f)});
async function iaGenerer(){const f1=$("#gen-file").files[0],f2=$("#gen-fiche").files[0],texte=($("#gen-text")||{value:""}).value.trim(),consignes=$("#gen-cons").value.trim(),err=$("#gen-err");err.textContent="";
  if(!f1&&!texte){err.textContent="Ajoutez le référentiel (fichier ou texte).";return}
  if((f1&&f1.size>15e6)||(f2&&f2.size>15e6)){err.textContent="Fichier trop lourd (15 Mo maximum chacun).";return}
  iaBusy=true;render();
  try{const ia=await import("./ia.js?v=2026.11.19-6");const fichiers=[];
    if(f1)fichiers.push({role:"referentiel",mime:f1.type||"application/pdf",base64:await fileToB64(f1)});
    if(f2)fichiers.push({role:"fiche",mime:f2.type||"application/pdf",base64:await fileToB64(f2)});
    const m=await ia.genererModele({fichiers,texte:texte.slice(0,60000),consignes,cle:IAKEY});iaBusy=false;startEditor({modele:null,brouillon:m});toast("Ébauche prête : modifiez-la en bac à sable, puis publiez")}
  catch(e){console.error(e);iaBusy=false;render();let msg=String(e&&e.message||e);try{const ia=await import("./ia.js?v=2026.11.19-6");msg=ia.iaMessage(e)}catch(x){}const el=$("#gen-err");if(el)el.textContent=msg}}
async function iaModifier(){const req=$("#ia-req").value.trim(),err=$("#ia-err");if(!req){err.textContent="Écrivez votre demande.";return}
  const fl=$("#ia-file")&&$("#ia-file").files[0];if(fl&&fl.size>15e6){err.textContent="Fichier trop lourd (15 Mo maximum).";return}
  let fichiers=[];try{if(fl)fichiers=[{mime:fl.type||"application/pdf",base64:await fileToB64(fl)}]}catch(x){}
  iaBusy=true;rerenderKeep();
  try{const ia=await import("./ia.js?v=2026.11.19-6");const m=await ia.modifierModele(normModele(modeleEdit.draft),req,IAKEY,fichiers);modeleHist.push(clone(modeleEdit.draft));modeleEdit.draft=normModele(m);modeleEdit.dirty=true;iaBusy=false;setPreview();rerenderKeep();toast("Carnet modifié par l'IA : vérifiez-le")}
  catch(e){console.error(e);iaBusy=false;rerenderKeep();let msg=String(e&&e.message||e);try{const ia=await import("./ia.js?v=2026.11.19-6");msg=ia.iaMessage(e)}catch(x){}const el=$("#ia-err");if(el){el.textContent=msg;$("#ia-req").value=req}}}
async function saveModele(quiet){const E=modeleEdit,M=normModele(E.draft);E.draft=M;
  try{if(E.id)await fb.updateModele(E.id,{titre:M.titre,ca:M.ca,brouillon:M,statut:E.statut});
    else if(E.fixedId){await fb.setModele(E.fixedId,{profId:me.uid,titre:M.titre,ca:M.ca,brouillon:M,modele:E.pub||null,statut:E.statut});E.id=E.fixedId}
    else E.id=await fb.createModele({profId:me.uid,titre:M.titre,ca:M.ca,brouillon:M,modele:null,statut:"brouillon"});
    E.dirty=false;if(!quiet)toast("Brouillon enregistré");rerenderKeep();return true}catch(e){toast(authMsg(e));return false}}
async function publierModele(){const E=modeleEdit,M=normModele(E.draft);E.draft=M;
  const prob=[];if(!M.criteres.some(c=>c.afl==="AFL1"))prob.push("aucun critère AFL1");M.criteres.forEach(c=>{if(c.descripteurs.some(d=>!d.trim()))prob.push(`descripteurs vides pour « ${c.label} »`)});
  const go2=async()=>{try{if(!E.id){E.statut="brouillon";if(!await saveModele(true))return}
      await fb.updateModele(E.id,{titre:M.titre,ca:M.ca,brouillon:M,modele:M,statut:"publie",publieLe:fb.now()});
      E.pub=M;E.statut="publie";E.publieLe={toDate:()=>new Date()};E.dirty=false;closeModal();setPreview();toast("Carnet publié pour les élèves");rerenderKeep()}catch(e){closeModal();toast(authMsg(e))}};
  confirmBox("Publier ce carnet ?",`${E.pub?"Les élèves passeront à cette nouvelle version. Les réponses déjà saisies sont conservées ; une case supprimée n'est plus affichée.":"Il apparaîtra pour les élèves des classes activées."}${prob.length?`<br><br><strong>À vérifier :</strong> ${esc(prob.join(" ; "))}.`:""}`,"Publier",go2)}
function mutDraft(fn,rr=true){const M=modeleEdit.draft;fn(M);modeleEdit.dirty=true;if(rr)rerenderKeep()}
function mClick(a,b){if(!modeleEdit)return false;const si=+b.dataset.si,fi=+b.dataset.fi,ci=+b.dataset.ci,mv=(arr,i,d)=>{const j=i+d;if(j<0||j>=arr.length)return;[arr[i],arr[j]]=[arr[j],arr[i]]};
  switch(a){
    case"mTab":modeleEdit.tab=b.dataset.t;if(modeleEdit.tab==="apercu")setPreview();render();return true;
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
  if(el.dataset.m===undefined)return false;
  const path=el.dataset.m,t=el.dataset.mt;let v=t==="bool"?el.checked:el.value;
  if(t==="num")v=el.value===""?"":num(el.value);if(t==="list")v=el.value.split(/[,\n]/).map(x=>x.trim()).filter(Boolean);
  setPath(M,path,v);modeleEdit.dirty=true;
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

/* ---------- Mises à jour de l'appli ---------- */
let majVersion=null;
const newer=v=>v&&v!==APP_VERSION&&String(v)>String(APP_VERSION);
function showMaj(v){if(!newer(v))return;majVersion=v;let b=$("#maj");
  if(!b){b=document.createElement("div");b.id="maj";b.className="maj";b.setAttribute("role","status");document.body.prepend(b)}
  const q=new URLSearchParams(location.search),deja=q.get("v")===String(v);
  b.innerHTML=deja?`<span>🔄 La nouvelle version arrive : elle peut mettre quelques minutes à être disponible partout.</span><button class="btn small" id="maj-go">Réessayer</button>`:`<span>🔄 Une nouvelle version de l'appli est disponible.</span><button class="btn small" id="maj-go">Mettre à jour</button>`;
  $("#maj-go").onclick=deja?()=>{location.replace(location.pathname+"?v="+encodeURIComponent(v)+"&r="+Date.now())}:majNow;
  if(deja)return;
  if(document.visibilityState==="hidden")majNow()}
async function majNow(){try{await Promise.race([flush(),new Promise(r=>setTimeout(r,3000))])}catch(e){}location.replace(location.pathname+"?v="+encodeURIComponent(majVersion||"")+"&t="+Date.now())}
async function checkVersion(){try{const r=await fetch("version.json?t="+Date.now(),{cache:"no-store"});if(!r.ok)return;const j=await r.json();showMaj(j.version)}catch(e){}}
let bc=null;try{bc=new BroadcastChannel("carnet-eps");bc.onmessage=e=>{const d=e.data||{};if(d.type==="hello"&&newer(d.v))showMaj(d.v);else if(d.type==="hello"&&d.v&&String(d.v)<String(APP_VERSION))bc.postMessage({type:"hello",v:APP_VERSION})};bc.postMessage({type:"hello",v:APP_VERSION})}catch(e){}
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
