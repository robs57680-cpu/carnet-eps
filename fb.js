// Couche d'accès Firebase (Auth + Firestore). Toute l'appli passe par ce fichier.
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import {
  getAuth, initializeAuth, inMemoryPersistence, onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signOut as fbSignOut, sendPasswordResetEmail, updatePassword
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import {
  initializeFirestore, getFirestore, persistentLocalCache, persistentMultipleTabManager, doc, getDoc, getDocs, setDoc,
  updateDoc, deleteDoc, addDoc, collection, query, where, serverTimestamp, onSnapshot
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app-check.js";
import { firebaseConfig, RECAPTCHA_SITE_KEY } from "./config.js?v=2026.11.19-9";

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
export const getModele = async id => snap(await getDoc(doc(db, "modeles", id)));
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
