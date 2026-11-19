// Assistant IA (Gemini via Firebase AI Logic) : lit un référentiel et produit / modifie un modèle de carnet.
import { getAI, getGenerativeModel, GoogleAIBackend } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-ai.js";
import { getApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";

// Modèles du palier gratuit, essayés dans l'ordre (repli si l'un est indisponible ou saturé).
const MODELES = ["gemini-3.8-flash", "gemini-3.6-flash", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite"];
let ai = null;
function getAi() { if (!ai) ai = getAI(getApp(), { backend: new GoogleAIBackend() }); return ai; }

const SCHEMA = `
FORMAT DU MODÈLE DE CARNET (JSON strict, clés en français, identifiants en minuscules ascii sans espace ni accent : a-z, 0-9, _) :
{
  "titre": "nom court de l'activité (ex. Natation de durée)",
  "ca": "CA1 | CA2 | CA3 | CA4 | CA5",
  "apsa": "APSA du référentiel",
  "description": "1 phrase pour l'élève",
  "pages": "seance",          // "seance" : une page par séance (cross training) ; "plusieurs" : une page complétée sur plusieurs séances ; "cycle" : une seule page pour tout le cycle (construction d'un enchaînement d'acrosport)
  "partage": "aucun",         // "aucun" ; "coach" : un camarade remplit les champs "coach": true depuis son téléphone (CA1, CA5) ; "groupe" : les élèves d'un groupe remplissent les mêmes pages (acrosport, feuille de poule CA4)
  "noteGroupe": true,         // en groupe : les critères des parties collectives sont notés (même note pour le groupe)
  // en groupe, chaque section peut avoir "portee": "individuelle" (chaque élève remplit la sienne, note individuelle) ou "collective"
  // tout champ peut avoir "coach": true (rempli par le coach)
  "rm": false,                                                             // true : le profil de l'élève contient ses 1RM (musculation, cross training)
  "themes": [ { "id": "...", "label": "...", "desc": "...", "reps": [8, 15], "pct": [40, 60] } ],  // thèmes au choix de l'élève (peut être vide) ; reps/pct facultatifs : repères de répétitions et de % du 1RM
  "sections": [ { …, "reprise": true } ]  // reprise : les valeurs de cette section sont reprises de la séance précédente
  "sections": [                                                            // ordre chronologique d'une séance
    { "id": "...", "titre": "...", "consigne": "aide courte pour l'élève",
      "champs": [
        { "id": "...", "type": "TYPE", "label": "...", "aide": "facultatif", "unite": "facultatif (min, kg, m, bpm…)",
          "requis": true,
          // selon le type :
          "options": ["..."],                       // type choix
          "min": 1, "max": 10,                      // type echelle
          "colonnes": [ { "id": "...", "type": "texte|nombre|temps|choix", "label": "...", "options": [] } ],  // type tableau
          "nb": 4, "nbChamp": "section.champ", "noRep": true, "adapt": true, "coach": true,  // type passages : nombre de tours fixe ou lu dans un champ nombre ; noRep : compteur par tour ; adapt : bouton adaptation par tour ; coach : un camarade peut remplir depuis son téléphone
          "nb": 3,                                  // type exercices : nombre de lignes au départ
          "src": { "exos": "section.exercices", "tours": "section.nombre", "temps": "section.temps" }  // type resume
        } ] } ],
  "criteres": [
    { "id": "...", "afl": "AFL1|AFL2|AFL3", "label": "élément évalué du référentiel",
      "descripteurs": ["degré 1", "degré 2", "degré 3", "degré 4"],      // texte du référentiel, du point de vue de l'élève
      "points": [p1, p2, p3, p4],                                          // points gagnés selon le degré (AFL1 surtout)
      "conseils": ["conseil si D1", "si D2", "si D3", "si D4"],            // facultatif : conseil affiché à l'élève après correction
      "calcul": CALCUL } ],
  "bareme": { "afl1": { "max": 12, "table": [ { "pts": 6, "note": 0.5 } ] } }   // table facultative : conversion points → note si le référentiel en donne une
}
TYPES de champ : texte, texte_long, nombre, temps (format min:s), choix, case (oui/non), echelle, compteur (+/-), tableau (lignes ajoutables), passages (chronomètre + temps de passage par tour), exercices (lignes exercice / type haltéro-gym-cardio / répétitions / charge ou niveau, avec % du 1RM), resume (récapitulatif lisible d'un champ exercices).
CALCUL (correction automatique) — choisir le plus fidèle au référentiel :
  { "type": "seuils", "source": SOURCE, "sens": "haut|bas", "seuils": [s4, s3, s2] }   // sens haut : >= s4 → degré 4, >= s3 → 3, >= s2 → 2, sinon 1 ; sens bas : <= s4 → 4 …
  { "type": "ecart", "source": SOURCE, "cible": SOURCE ou nombre, "seuils": [e4, e3, e2] }  // |source - cible| <= e4 → degré 4 …
  { "type": "complet", "champs": ["section.champ", …], "seuils": [1, 0.85, 0.5] }      // proportion de champs remplis
  { "type": "rythme", "source": { "champ": "section.passages", "cible": SOURCE ou nombre, "tolerance": 5 }, "condition": { "champ": "section.choix", "valeur": "option" } }  // charge : D4 rythme tenu jusqu'au bout, D3 décroche sur les 2 derniers tours, D2 à partir de la moitié, D1 avant ou non terminé (ou condition vraie)
  { "type": "reperes", "source": { "champ": "section.exercices" }, "min": 3 }   // exercices conformes aux repères du thème (répétitions, % 1RM) : D4 tous, D3 un hors repère, D2 deux, D1 plus
  { "type": "autoeval" }                                                                 // l'élève se positionne avec les descripteurs (obligatoire si rien n'est mesurable, et pour AFL2/AFL3)
SOURCE : { "champ": "section.champ" } pour un champ nombre/temps/echelle/compteur/case/choix ;
         { "champ": "section.tableau", "colonne": "id", "agg": "moyenne|somme|max|min|nombre|dernier|ecart_premier_dernier" } ;
         { "champ": "section.passages", "mesure": "proportion_dans_cible|nb_hors_cible|norep|adaptations|termine|temps_total", "cible": SOURCE ou nombre (secondes), "tolerance": 5 }.
RÈGLES :
- Tout « section.champ » cité doit exister. Les champs mesurés par un calcul doivent être des nombres/temps/compteurs, pas du texte.
- Reprendre fidèlement les AFL, éléments évalués, degrés et barèmes du référentiel (points, conversion). AFL1 sur 12 points ; AFL2 et AFL3 se partagent 8 points (répartition choisie par l'élève).
- Une séance type : échauffement, conception (choix, charges, objectifs), réalisation (mesures pendant l'effort), analyse/régulation. Champs concrets et rapides à remplir sur téléphone.
- 4 descripteurs exactement par critère, 4 valeurs de points croissantes.
- Ne jamais inventer de données personnelles. Pas de nom ni prénom d'élève.
- Réponds UNIQUEMENT avec le JSON du modèle complet.`;

function parse(txt) {
  let t = String(txt || "").trim();
  t = t.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const a = t.indexOf("{"), b = t.lastIndexOf("}");
  if (a < 0 || b < 0) throw new Error("Réponse de l'IA illisible.");
  return JSON.parse(t.slice(a, b + 1));
}

// Appel direct avec la clé Gemini personnelle d'un prof (son propre quota gratuit).
async function callCle(parts, cle, name) {
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${name}:generateContent`, {
    method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": cle },
    body: JSON.stringify({ contents: [{ role: "user", parts }], generationConfig: { responseMimeType: "application/json", temperature: 0.3, maxOutputTokens: 32768 } })
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`${r.status} ${(j.error && j.error.message) || r.statusText}`);
  const txt = ((j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts) || []).map(p => p.text || "").join("");
  return parse(txt);
}

/** Vérifie une clé personnelle avec une requête minuscule. */
export async function testerCle(cle) {
  let lastErr;
  for (const name of MODELES) {
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${name}:generateContent`, {
        method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": cle },
        body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: "Réponds OK" }] }], generationConfig: { maxOutputTokens: 5 } })
      });
      if (r.ok) return name;
      const j = await r.json().catch(() => ({}));
      lastErr = new Error(`${r.status} ${(j.error && j.error.message) || r.statusText}`);
      if (r.status === 400 || r.status === 401 || r.status === 403) break;
    } catch (e) { lastErr = e; }
  }
  throw lastErr;
}

async function call(parts, cle) {
  let lastErr;
  if (cle) {
    for (const name of MODELES) {
      try { return await callCle(parts, cle, name); }
      catch (e) { lastErr = e; if (/^(400|401|403) /.test(String(e.message)) && !/model/i.test(String(e.message))) break; }
    }
    throw lastErr;
  }
  for (const name of MODELES) {
    try {
      const model = getGenerativeModel(getAi(), {
        model: name,
        generationConfig: { responseMimeType: "application/json", temperature: 0.3, maxOutputTokens: 32768 }
      });
      const res = await model.generateContent(parts);
      return parse(res.response.text());
    } catch (e) {
      lastErr = e;
      const m = String((e && e.message) || e);
      if (/app.?check|appcheck|unauthenticated|permission|api key|API_KEY|billing/i.test(m)) break;   // inutile d'essayer un autre modèle
    }
  }
  throw lastErr;
}

export function iaMessage(e) {
  const m = String((e && e.message) || e || "");
  if (/API key not valid|API_KEY_INVALID|^40[13] /i.test(m)) return "Votre clé Gemini personnelle est refusée. Vérifiez-la dans « Compte ».";
  if (/429|quota|exhausted|rate/i.test(m)) return "L'IA gratuite est saturée pour le moment (quota atteint). Réessayez plus tard, ou ajoutez votre clé Gemini personnelle dans « Compte ».";
  if (/app.?check/i.test(m)) return "L'IA refuse la requête (vérification App Check). Rechargez la page et réessayez.";
  if (/network|fetch/i.test(m)) return "Pas de connexion internet.";
  if (/illisible|JSON/i.test(m)) return "L'IA a renvoyé une réponse incomplète. Réessayez.";
  return "Erreur de l'IA : " + m.slice(0, 200);
}

/** Crée une ébauche de modèle à partir d'un référentiel (fichier PDF/image en base64 et/ou texte). */
export async function genererModele({ fichiers, fichier, texte, consignes, cle }) {
  const parts = [{ text: `Tu es un expert de l'EPS au lycée (référentiels du baccalauréat, France). À partir du référentiel d'évaluation fourni, conçois le carnet d'entraînement numérique que l'élève remplira à chaque séance, avec une correction automatique fidèle au référentiel.
${SCHEMA}
${consignes ? "CONSIGNES DU PROFESSEUR : " + consignes : ""}` }];
  const fs = fichiers || (fichier ? [{ role: "referentiel", ...fichier }] : []);
  for (const f of fs) {
    parts.push({ text: f.role === "fiche"
      ? "FICHE D'OBSERVATION / D'ÉVALUATION utilisée par le professeur (s'en inspirer pour les champs à relever pendant la séance et pour les critères) :"
      : "RÉFÉRENTIEL D'ÉVALUATION (source principale pour les AFL, les degrés et le barème) :" });
    parts.push({ inlineData: { mimeType: f.mime, data: f.base64 } });
  }
  if (texte) parts.push({ text: "RÉFÉRENTIEL (texte) :\n" + texte });
  return call(parts, cle);
}

/** Applique une demande du prof à un modèle existant. */
export async function modifierModele(modele, demande, cle, fichiers) {
  const parts = [];
  for (const f of fichiers || []) {
    parts.push({ text: "DOCUMENT JOINT PAR LE PROFESSEUR (à utiliser pour sa demande) :" });
    parts.push({ inlineData: { mimeType: f.mime, data: f.base64 } });
  }
  return call([...parts, { text: `Tu modifies un carnet d'entraînement EPS existant à la demande du professeur.
${SCHEMA}
- Garde les identifiants existants inchangés (les élèves ont déjà des données), sauf pour ce qui est supprimé.
- Ne change que ce qui est demandé.
MODÈLE ACTUEL :
${JSON.stringify(modele)}
DEMANDE DU PROFESSEUR : ${demande}` }], cle);
}
