// Couche d'accès Firebase (Auth + Firestore). Toute l'appli passe par ce fichier.
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import {
  getAuth, initializeAuth, inMemoryPersistence, onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signOut as fbSignOut, sendPasswordResetEmail, updatePassword
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import {
  initializeFirestore, getFirestore, persistentLocalCache, persistentMultipleTabManager, doc, getDoc as _getDoc, getDocs as _getDocs, setDoc,
  getDocFromCache, getDocsFromCache, disableNetwork, enableNetwork,
  updateDoc, deleteDoc, addDoc, collection, query, where, serverTimestamp, onSnapshot
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app-check.js";
import { firebaseConfig, RECAPTCHA_SITE_KEY } from "./config.js?v=2026.11.19-17";

// Idempotent : si ce fichier est chargé deux fois (versions en cache différentes), on réutilise la même appli.
export const app = getApps().some(a => a.name === "[DEFAULT]") ? getApp() : initializeApp(firebaseConfig);
// App Check protège l'IA (Gemini) contre les usages extérieurs à l'appli.
if (RECAPTCHA_SITE_KEY && !RECAPTCHA_SITE_KEY.includes("A_REMPLACER") && !globalThis.__carnetAppCheck) {
  globalThis.__carnetAppCheck = true;
  try { initializeAppCheck(app, { provider: new ReCaptchaEnterpriseProvider(RECAPTCHA_SITE_KEY), isTokenAutoRefreshEnabled: true }); }
  catch (e) { console.warn("App Check", e); }
}
const auth = getAuth(app);
let db;
try { db = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) }); }
catch (e) { db = getFirestore(app); }

/* ---------- Lectures limitées dans le temps (2026.11.20-10) ----------
   Sur téléphone, après un passage en arrière-plan ou un changement de réseau, la connexion Firestore
   peut rester figée : getDoc ne répond jamais. Chaque lecture attend 6 s au plus, relance la connexion,
   prend la copie locale si elle existe, sinon réessaie 9 s, sinon erreur « lent ». */
const delai = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(Object.assign(new Error("lent"), { code: "lent" })), ms))]);
let relanceEnCours = null;
export function relancerReseau() {
  if (relanceEnCours) return relanceEnCours;
  relanceEnCours = (async () => {
    try { await delai(disableNetwork(db), 4000); } catch (e) {}
    try { await delai(enableNetwork(db), 4000); } catch (e) {}
  })().finally(() => setTimeout(() => (relanceEnCours = null), 1500));
  return relanceEnCours;
}
async function lire(enLigne, cache, vide) {
  try { return await delai(enLigne(), 6000); }
  catch (e) {
    if (e.code !== "lent") throw e;
    relancerReseau();
    try { const c = await delai(cache(), 2500); if (!vide(c)) return c; } catch (e2) {}
    try { return await delai(enLigne(), 9000); }
    catch (e3) { throw e3.code === "lent" ? Object.assign(new Error("Connexion trop lente"), { code: "lent" }) : e3; }
  }
}
const getDoc = r => lire(() => _getDoc(r), () => getDocFromCache(r), d => !d || !d.exists());
const getDocs = q => lire(() => _getDocs(q), () => getDocsFromCache(q), s => !s || s.empty);
if (typeof window !== "undefined" && !globalThis.__carnetRelance) {
  globalThis.__carnetRelance = true;
  let cache0 = 0;
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) cache0 = Date.now();
    else if (cache0 && Date.now() - cache0 > 20000) relancerReseau();
  });
  window.addEventListener("online", () => relancerReseau());
  window.addEventListener("pageshow", e => { if (e.persisted) relancerReseau(); });
}

// Application secondaire : sert à créer des comptes (élèves, profs) sans déconnecter la personne connectée.
const app2 = getApps().find(a => a.name === "creation-comptes") || initializeApp(firebaseConfig, "creation-comptes");
let auth2;
try { auth2 = initializeAuth(app2, { persistence: inMemoryPersistence }); } catch (e) { auth2 = getAuth(app2); }

const clean = o => JSON.parse(JSON.stringify(o, (k, v) => (k.startsWith("_") ? undefined : v)));
const snap = d => (d.exists() ? { id: d.id, ...d.data() } : null);
const list = qs => qs.docs.map(d => ({ id: d.id, ...d.data() }));

export const configured = !String(firebaseConfig.apiKey).includes("A_REMPLACER");
export const now = () => serverTimestamp();

/* ---------- Authentification ---------- */
export const onAuth = cb => onAuthStateChanged(auth, cb);
export const signIn = (email, pwd) => signInWithEmailAndPassword(auth, email, pwd);
export const signOut = () => fbSignOut(auth);
export const resetPassword = email => sendPasswordResetEmail(auth, email);
export const changePassword = pwd => updatePassword(auth.currentUser, pwd);
export const signUpSelf = (email, pwd) => createUserWithEmailAndPassword(auth, email, pwd);
export async function createAccount(email, pwd) {
  const cred = await createUserWithEmailAndPassword(auth2, email, pwd);
  const uid = cred.user.uid;
  await fbSignOut(auth2);
  return uid;
}

/* ---------- Utilisateurs ---------- */
export const getUser = async uid => snap(await getDoc(doc(db, "users", uid)));
export const setUser = (uid, data) => setDoc(doc(db, "users", uid), { ...clean(data), createdAt: serverTimestamp() });
export const updateUser = (uid, patch) => updateDoc(doc(db, "users", uid), patch);
export const deleteUser = uid => deleteDoc(doc(db, "users", uid));
export const listProfs = async () => list(await getDocs(query(collection(db, "users"), where("role", "in", ["prof", "dev"]))));

/* ---------- Classes ---------- */
export const listClasses = async profId => list(await getDocs(query(collection(db, "classes"), where("profId", "==", profId))));
export const getClasse = async id => snap(await getDoc(doc(db, "classes", id)));
export const createClasse = async data => (await addDoc(collection(db, "classes"), { ...clean(data), createdAt: serverTimestamp() })).id;
export const updateClasse = (id, patch) => updateDoc(doc(db, "classes", id), clean(patch));
export const deleteClasse = id => deleteDoc(doc(db, "classes", id));
export const listEleves = async cid => list(await getDocs(collection(db, "classes", cid, "eleves")));
export const addEleve = (cid, uid, data) => setDoc(doc(db, "classes", cid, "eleves", uid), { ...clean(data), createdAt: serverTimestamp() });
export const deleteEleve = (cid, uid) => deleteDoc(doc(db, "classes", cid, "eleves", uid));

/* ---------- Carnets ---------- */
export const getCarnet = async id => snap(await getDoc(doc(db, "carnets", id)));
export const createCarnet = (id, data) => setDoc(doc(db, "carnets", id), { ...clean(data), createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
export const updateCarnet = (id, patch) => updateDoc(doc(db, "carnets", id), { ...clean(patch), updatedAt: serverTimestamp() });
export const deleteCarnet = id => deleteDoc(doc(db, "carnets", id));
export const listCarnets = async (profId, classeId, activite) =>
  list(await getDocs(query(collection(db, "carnets"), where("profId", "==", profId), where("classeId", "==", classeId), where("activite", "==", activite))));
export const listCarnetsEleve = async (profId, eleveUid) =>
  list(await getDocs(query(collection(db, "carnets"), where("profId", "==", profId), where("eleveUid", "==", eleveUid))));
export const listSeances = async cid => list(await getDocs(collection(db, "carnets", cid, "seances")));
export const saveSeance = (cid, sid, data, merge) => setDoc(doc(db, "carnets", cid, "seances", sid), clean(data), merge ? { merge: true } : {});
export const getSeance = async (cid, sid) => snap(await getDoc(doc(db, "carnets", cid, "seances", sid)));
export const coachSaveTours = (cid, sid, tours) => updateDoc(doc(db, "carnets", cid, "seances", sid), { "real.tours": clean(tours), coachMaj: serverTimestamp() });
export const watchSeance = (cid, sid, cb) => onSnapshot(doc(db, "carnets", cid, "seances", sid), d => cb(snap(d)), e => cb(null, e));
export const deleteSeance = (cid, sid) => deleteDoc(doc(db, "carnets", cid, "seances", sid));
export const setSeanceValide = (cid, sid, v) => updateDoc(doc(db, "carnets", cid, "seances", sid), { valide: v });

/* ---------- Identifiants et coachs ---------- */
export const setLogin = (login, data) => setDoc(doc(db, "logins", login), clean(data));
export const getLogin = async login => snap(await getDoc(doc(db, "logins", login)));
export const deleteLogin = login => deleteDoc(doc(db, "logins", login));
export const setCoaching = (id, data) => setDoc(doc(db, "coachings", id), { ...clean(data), createdAt: serverTimestamp() });
export const deleteCoaching = id => deleteDoc(doc(db, "coachings", id));
export const listCoachings = async uid => list(await getDocs(query(collection(db, "coachings"), where("coachUid", "==", uid))));

/* ---------- Modèles de carnets (créés avec l'IA) ---------- */
export const listModeles = async profId => list(await getDocs(query(collection(db, "modeles"), where("profId", "==", profId))));
// Mot de passe personnalisé des élèves (le mot de passe initial reste valable)
export const getAlias = async login => snap(await getDoc(doc(db, "pwalias", login)));
export const setAlias = (login, data) => setDoc(doc(db, "pwalias", login), data);
export const deleteAlias = login => deleteDoc(doc(db, "pwalias", login));
export const getEleveSelf = async (cid, uid) => snap(await getDoc(doc(db, "classes", cid, "eleves", uid)));
export const currentUid = () => auth.currentUser && auth.currentUser.uid;
export const getModele = async id => snap(await getDoc(doc(db, "modeles", id)));
// Pseudo choisi par l'élève (affiché sur les feuilles de match)
export const updateLogin = (login, patch) => updateDoc(doc(db, "logins", login), clean(patch));
// Séances d'outils (feuille de match, scoreur) et scores des matchs
export const listSessions = async (profId, classeId, outilId) => list(await getDocs(query(collection(db, "sessions"), where("profId", "==", profId), where("classeId", "==", classeId), where("outilId", "==", outilId))));
export const listSessionsActives = async (classeId, profId) => list(await getDocs(query(collection(db, "sessions"), where("classeId", "==", classeId), where("active", "==", true), ...(profId ? [where("profId", "==", profId)] : []))));
// Élèves de la classe (identifiant, pseudo, avatar) pour choisir un coach ou les membres d'un groupe
export const listLoginsClasse = async (profId, classeId) => list(await getDocs(query(collection(db, "logins"), where("profId", "==", profId), where("classeId", "==", classeId))));
export const getSession = async id => snap(await getDoc(doc(db, "sessions", id)));
export const createSession = async data => (await addDoc(collection(db, "sessions"), { ...clean(data), createdAt: serverTimestamp() })).id;
export const deleteSession = id => deleteDoc(doc(db, "sessions", id));
export const updateSession = (id, patch) => updateDoc(doc(db, "sessions", id), clean(patch));
export const setMatch = (sid, key, data) => setDoc(doc(db, "sessions", sid, "matchs", key), clean(data), { merge: true });
export const watchMatchs = (sid, cb) => onSnapshot(collection(db, "sessions", sid, "matchs"), s => cb(s.docs.map(d => ({ id: d.id, ...d.data() }))), e => console.warn(e));
// Accueil élève : réglages du prof (barème, défi), activité physique de l'élève, actualités
export const getProfCfg = async pid => snap(await getDoc(doc(db, "profcfg", pid)));
export const setProfCfg = (pid, data) => setDoc(doc(db, "profcfg", pid), clean(data));
export const getActivite = async uid => snap(await getDoc(doc(db, "activite", uid)));
export const setActivite = (uid, data) => setDoc(doc(db, "activite", uid), clean(data));
export const listActus = async profId => list(await getDocs(query(collection(db, "actus"), where("profId", "==", profId))));
export const createActu = async data => (await addDoc(collection(db, "actus"), { ...clean(data), createdAt: serverTimestamp() })).id;
export const deleteActu = id => deleteDoc(doc(db, "actus", id));
export const updateActu = (id, data) => updateDoc(doc(db, "actus", id), clean(data));
// Stock : activités partagées entre profs
export const listStock = async () => list(await getDocs(collection(db, "stock")));
export const getStock = async id => snap(await getDoc(doc(db, "stock", id)));
export const createStock = async data => (await addDoc(collection(db, "stock"), { ...clean(data), createdAt: serverTimestamp() })).id;
export const setStock = (id, data) => setDoc(doc(db, "stock", id), { ...clean(data), createdAt: serverTimestamp() });
export const deleteStock = id => deleteDoc(doc(db, "stock", id));
// Dossiers d'activité : carnets et fiches rangés comme des documents dans un dossier
export const listDossiers = async profId => list(await getDocs(query(collection(db, "dossiers"), where("profId", "==", profId))));
export const getDossier = async id => snap(await getDoc(doc(db, "dossiers", id)));
export const createDossier = async data => (await addDoc(collection(db, "dossiers"), { ...clean(data), createdAt: serverTimestamp() })).id;
export const updateDossier = (id, patch) => updateDoc(doc(db, "dossiers", id), clean(patch));
export const deleteDossier = id => deleteDoc(doc(db, "dossiers", id));
// Carnet partagé par un groupe d'élèves
export const findGroupeCarnet = async (uid, activite) => list(await getDocs(query(collection(db, "carnets"), where("membres", "array-contains", uid), where("activite", "==", activite))))[0] || null;
// Mise à jour champ par champ (pages partagées : évite d'écraser le travail d'un camarade)
export const updateSeance = (cid, sid, patch) => updateDoc(doc(db, "carnets", cid, "seances", sid), clean(patch));
export const getFiche = async id => snap(await getDoc(doc(db, "fiches", id)));
export const listFichesProf = async profId => list(await getDocs(query(collection(db, "fiches"), where("profId", "==", profId))));
// Fiches ressources : métadonnées dans fiches/{id}, contenu (images JPEG ou PDF découpé) dans fiches/{id}/parts/{n}
export const listFiches = async (profId, activite) => list(await getDocs(query(collection(db, "fiches"), where("profId", "==", profId), where("activite", "==", activite))));
export async function addFiche(meta, parts) {
  const ref = await addDoc(collection(db, "fiches"), { ...clean(meta), nb: 0, createdAt: serverTimestamp() });
  for (let i = 0; i < parts.length; i++) await setDoc(doc(db, "fiches", ref.id, "parts", String(i)), { n: i, ...parts[i] });
  await updateDoc(doc(db, "fiches", ref.id), { nb: parts.length });
  return ref.id;
}
export const getFicheParts = async id => list(await getDocs(collection(db, "fiches", id, "parts"))).sort((a, b) => a.n - b.n);
export const updateFiche = (id, patch) => updateDoc(doc(db, "fiches", id), clean(patch));
export async function deleteFiche(id, nb) {
  for (let i = 0; i < Math.max(nb || 0, 40); i++) { try { await deleteDoc(doc(db, "fiches", id, "parts", String(i))); } catch (e) { if (i >= (nb || 0)) break; throw e; } }
  await deleteDoc(doc(db, "fiches", id));
}
export const setModele = (id, data) => setDoc(doc(db, "modeles", id), { ...clean(data), createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
export const coachSaveVals = (cid, sid, path, val) => updateDoc(doc(db, "carnets", cid, "seances", sid), { ["valeurs." + path]: clean(val), coachMaj: serverTimestamp() });
export const createModele = async data => (await addDoc(collection(db, "modeles"), { ...clean(data), createdAt: serverTimestamp(), updatedAt: serverTimestamp() })).id;
export const updateModele = (id, patch) => updateDoc(doc(db, "modeles", id), { ...clean(patch), updatedAt: serverTimestamp() });
export const deleteModele = id => deleteDoc(doc(db, "modeles", id));

/* ---------- Préférences privées du prof (clé Gemini personnelle) ---------- */
export const getPrefs = async uid => snap(await getDoc(doc(db, "prefs", uid)));
export const setPrefs = (uid, data) => setDoc(doc(db, "prefs", uid), clean(data), { merge: true });

/* ---------- Demandes d'accès prof ---------- */
export const createDemande = data => addDoc(collection(db, "demandes"), { ...clean(data), statut: "nouvelle", createdAt: serverTimestamp() });
export const listDemandes = async () => list(await getDocs(collection(db, "demandes")));
export const updateDemande = (id, patch) => updateDoc(doc(db, "demandes", id), patch);
export const deleteDemande = id => deleteDoc(doc(db, "demandes", id));

/* ---------- Course d'orientation ---------- */
// Réglages du prof (formats, cartons, correction) : jamais lus par les élèves
export const getOrient = async id => snap(await getDoc(doc(db, "orient", id)));
export const setOrient = (id, data) => setDoc(doc(db, "orient", id), clean(data));
// Séances : correction recopiée par carton (lisible par l'élève seulement après validation de son carton)
export const setCorr = (sid, cid, data) => setDoc(doc(db, "sessions", sid, "corr", cid), clean(data));
export const getCorr = async (sid, cid) => snap(await getDoc(doc(db, "sessions", sid, "corr", cid)));
export const listCorr = async sid => list(await getDocs(collection(db, "sessions", sid, "corr")));
export const listSessionsOutil = async (classeId, profId, outilId) => list(await getDocs(query(collection(db, "sessions"), where("classeId", "==", classeId), where("profId", "==", profId), where("outilId", "==", outilId))));
// Courses des élèves : sessions/{sid}/courses/{uid}_{carton}
export const setCourse = (sid, rid, data) => setDoc(doc(db, "sessions", sid, "courses", rid), clean(data));
export const updateCourse = (sid, rid, patch) => updateDoc(doc(db, "sessions", sid, "courses", rid), clean(patch));
export const deleteCourse = (sid, rid) => deleteDoc(doc(db, "sessions", sid, "courses", rid));
export const listMesCourses = async (sid, uid) => list(await getDocs(query(collection(db, "sessions", sid, "courses"), where("eleveUid", "==", uid))));
export const listCourses = async sid => list(await getDocs(collection(db, "sessions", sid, "courses")));
export const watchCourses = (sid, cb) => onSnapshot(collection(db, "sessions", sid, "courses"), s => cb(s.docs.map(d => ({ id: d.id, ...d.data() }))), e => console.warn(e));

/* ---------- Sorties de l'appli pendant les créneaux d'EPS ---------- */
export const getVigie = async uid => snap(await getDoc(doc(db, "vigie", uid)));
export const setVigie = (uid, data) => setDoc(doc(db, "vigie", uid), clean(data), { merge: true });
export const updateVigie = (uid, patch) => updateDoc(doc(db, "vigie", uid), clean(patch));
export const listVigie = async (profId, classeId) => list(await getDocs(query(collection(db, "vigie"), where("profId", "==", profId), where("classeId", "==", classeId))));
/* ---------- Corrections du prof (une par page de carnet : id = carnetId__sid) ---------- */
// Le prof lit toutes ses corrections ; l'élève ne lit que celles envoyées et rendues visibles.
export const listCorrections = async (profId, classeId, activite) => list(await getDocs(query(collection(db, "corrections"), where("profId", "==", profId), where("classeId", "==", classeId), ...(activite ? [where("activite", "==", activite)] : []))));
export const listCorrectionsEleve = async (uid, carnetId) => list(await getDocs(query(collection(db, "corrections"), where("eleves", "array-contains", uid), where("carnetId", "==", carnetId), where("visible", "==", true))));
export const setCorrection = (id, data) => setDoc(doc(db, "corrections", id), { ...clean(data), maj: serverTimestamp() });
export const updateCorrection = (id, patch) => updateDoc(doc(db, "corrections", id), { ...clean(patch), maj: serverTimestamp() });
export const deleteCorrection = id => deleteDoc(doc(db, "corrections", id));

/* ---------- QCM (2026.11.20-10) ---------- */
// qcms : questions sans les bonnes réponses ; qcmcles : corrigé ; qcmrep/{qcmId__uid} : réponses de l'élève ; aflnotes : notes retenues par le prof
export const getQcm = async id => snap(await getDoc(doc(db, "qcms", id)));
export const setQcm = (id, data) => setDoc(doc(db, "qcms", id), { ...clean(data), maj: serverTimestamp() });
export const deleteQcm = id => deleteDoc(doc(db, "qcms", id));
export const listQcms = async profId => list(await getDocs(query(collection(db, "qcms"), where("profId", "==", profId))));
export const getQcmCle = async id => snap(await getDoc(doc(db, "qcmcles", id)));
export const setQcmCle = (id, data) => setDoc(doc(db, "qcmcles", id), clean(data));
export const deleteQcmCle = id => deleteDoc(doc(db, "qcmcles", id));
export const getQcmRep = async id => snap(await getDoc(doc(db, "qcmrep", id)));
export const createQcmRep = (id, data) => setDoc(doc(db, "qcmrep", id), clean(data));
export const updateQcmRep = (id, data) => setDoc(doc(db, "qcmrep", id), clean(data), { merge: true });
export const deleteQcmRep = id => deleteDoc(doc(db, "qcmrep", id));
export const listQcmReps = async (qcmId, profId, classeId) => list(await getDocs(query(collection(db, "qcmrep"), where("qcmId", "==", qcmId), where("profId", "==", profId), where("classeId", "==", classeId))));
export const getAflNotes = async id => snap(await getDoc(doc(db, "aflnotes", id)));
export const setAflNotes = (id, data) => setDoc(doc(db, "aflnotes", id), { ...clean(data), maj: serverTimestamp() });

/* ---------- Établissements (2026.11.21-2) ---------- */
// etablissements/{id} : nom, nomNorm, commune, communeNorm, createur, admins[], profs[], emails{uid:email}, sel, verif
export const listEtabs = async () => list(await getDocs(collection(db, "etablissements")));
export const getEtab = async id => snap(await getDoc(doc(db, "etablissements", id)));
export const createEtab = async data => (await addDoc(collection(db, "etablissements"), { ...clean(data), createdAt: serverTimestamp() })).id;
export const updateEtab = (id, patch) => updateDoc(doc(db, "etablissements", id), clean(patch));
export const deleteEtab = id => deleteDoc(doc(db, "etablissements", id));
export const listMesEtabs = async uid => list(await getDocs(query(collection(db, "etablissements"), where("profs", "array-contains", uid))));
// Demandes pour rejoindre un établissement : id = etabId__uid, validées par un administrateur
export const setEtabDemande = (etabId, uid, data) => setDoc(doc(db, "etabdemandes", etabId + "__" + uid), { ...clean(data), etabId, uid, createdAt: serverTimestamp() });
export const listEtabDemandes = async etabId => list(await getDocs(query(collection(db, "etabdemandes"), where("etabId", "==", etabId))));
export const listMesEtabDemandes = async uid => list(await getDocs(query(collection(db, "etabdemandes"), where("uid", "==", uid))));
export const deleteEtabDemande = id => deleteDoc(doc(db, "etabdemandes", id));
// Actualités et défis communs à l'établissement
export const listActusEtab = async etabId => list(await getDocs(query(collection(db, "actus"), where("etabId", "==", etabId), where("portee", "==", "etab"))));
export const listEtabDefis = async etabId => list(await getDocs(query(collection(db, "etabdefis"), where("etabId", "==", etabId))));
export const createEtabDefi = async data => (await addDoc(collection(db, "etabdefis"), { ...clean(data), createdAt: serverTimestamp() })).id;
export const updateEtabDefi = (id, patch) => updateDoc(doc(db, "etabdefis", id), clean(patch));
export const deleteEtabDefi = id => deleteDoc(doc(db, "etabdefis", id));
// Inscriptions des élèves à une compétition : id = actuId__uid (identifiant et classe seulement, jamais de nom)
export const setInscription = (id, data) => setDoc(doc(db, "inscriptions", id), { ...clean(data), createdAt: serverTimestamp() });
export const deleteInscription = id => deleteDoc(doc(db, "inscriptions", id));
export const listMesInscriptions = async uid => list(await getDocs(query(collection(db, "inscriptions"), where("uid", "==", uid))));
export const listInscritsOrga = async (actuId, uid) => list(await getDocs(query(collection(db, "inscriptions"), where("actuId", "==", actuId), where("organisateur", "==", uid))));
export const listInscritsProf = async (actuId, uid) => list(await getDocs(query(collection(db, "inscriptions"), where("actuId", "==", actuId), where("profId", "==", uid))));
// Noms des élèves chiffrés avec la phrase secrète de l'établissement (le serveur ne voit jamais les noms en clair)
export const getNomsChiffres = async cid => snap(await getDoc(doc(db, "nomsChiffres", cid)));
export const setNomsChiffres = (cid, data) => setDoc(doc(db, "nomsChiffres", cid), { ...clean(data), maj: serverTimestamp() });
export const listNomsChiffres = async etabId => list(await getDocs(query(collection(db, "nomsChiffres"), where("etabId", "==", etabId))));
