// Assistant IA (Gemini via Firebase AI Logic) : lit un référentiel et produit / modifie un modèle de carnet.
import { getAI, getGenerativeModel, GoogleAIBackend } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-ai.js";
import { app } from "./fb.js";

// Modèles du palier gratuit, essayés dans l'ordre (repli si l'un est indisponible ou saturé).
const MODELES = ["gemini-3.8-flash", "gemini-3.6-flash", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite"];
let ai = null;
function getAi() { if (!ai) ai = getAI(app, { backend: new GoogleAIBackend() }); return ai; }

const SCHEMA = `
FORMAT DU MODÈLE DE CARNET (JSON strict, clés en français, identifiants en minuscules ascii sans espace ni accent : a-z, 0-9, _) :
{
  "titre": "nom court de l'activité (ex. Natation de durée)",
  "ca": "CA1 | CA2 | CA3 | CA4 | CA5",
  "apsa": "APSA du référentiel",
  "description": "1 phrase pour l'élève",
  "themes": [ { "id": "...", "label": "...", "desc": "..." } ],          // mobiles / thèmes d'entraînement au choix de l'élève (peut être vide)
  "sections": [                                                            // ordre chronologique d'une séance
    { "id": "...", "titre": "...", "consigne": "aide courte pour l'élève",
      "champs": [
        { "id": "...", "type": "TYPE", "label": "...", "aide": "facultatif", "unite": "facultatif (min, kg, m, bpm…)",
          "requis": true,
          // selon le type :
          "options": ["..."],                       // type choix
          "min": 1, "max": 10,                      // type echelle
          "colonnes": [ { "id": "...", "type": "texte|nombre|temps|choix", "label": "...", "options": [] } ],  // type tableau
          "nb": 4, "nbChamp": "section.champ", "noRep": true   // type passages : nombre de tours fixe ou lu dans un champ nombre ; noRep ajoute un compteur par tour
        } ] } ],
  "criteres": [
    { "id": "...", "afl": "AFL1|AFL2|AFL3", "label": "élément évalué du référentiel",
      "descripteurs": ["degré 1", "degré 2", "degré 3", "degré 4"],      // texte du référentiel, du point de vue de l'élève
      "points": [p1, p2, p3, p4],                                          // points gagnés selon le degré (AFL1 surtout)
      "calcul": CALCUL } ],
  "bareme": { "afl1": { "max": 12, "table": [ { "pts": 6, "note": 0.5 } ] } }   // table facultative : conversion points → note si le référentiel en donne une
}
TYPES de champ : texte, texte_long, nombre, temps (format min:s), choix, case (oui/non), echelle, compteur (+/-), tableau (lignes ajoutables), passages (chronomètre + temps de passage par tour).
CALCUL (correction automatique) — choisir le plus fidèle au référentiel :
  { "type": "seuils", "source": SOURCE, "sens": "haut|bas", "seuils": [s4, s3, s2] }   // sens haut : >= s4 → degré 4, >= s3 → 3, >= s2 → 2, sinon 1 ; sens bas : <= s4 → 4 …
  { "type": "ecart", "source": SOURCE, "cible": SOURCE ou nombre, "seuils": [e4, e3, e2] }  // |source - cible| <= e4 → degré 4 …
  { "type": "complet", "champs": ["section.champ", …], "seuils": [1, 0.85, 0.5] }      // proportion de champs remplis
  { "type": "autoeval" }                                                                 // l'élève se positionne avec les descripteurs (obligatoire si rien n'est mesurable, et pour AFL2/AFL3)
SOURCE : { "champ": "section.champ" } pour un champ nombre/temps/echelle/compteur/case/choix ;
         { "champ": "section.tableau", "colonne": "id", "agg": "moyenne|somme|max|min|nombre|dernier|ecart_premier_dernier" } ;
         { "champ": "section.passages", "mesure": "proportion_dans_cible|nb_hors_cible|norep|termine|temps_total", "cible": SOURCE ou nombre (secondes), "tolerance": 5 }.
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

async function call(parts) {
  let lastErr;
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
  if (/429|quota|exhausted|rate/i.test(m)) return "L'IA gratuite est saturée pour le moment (quota atteint). Réessayez dans quelques minutes.";
  if (/app.?check/i.test(m)) return "L'IA refuse la requête (vérification App Check). Rechargez la page et réessayez.";
  if (/network|fetch/i.test(m)) return "Pas de connexion internet.";
  if (/illisible|JSON/i.test(m)) return "L'IA a renvoyé une réponse incomplète. Réessayez.";
  return "Erreur de l'IA : " + m.slice(0, 200);
}

/** Crée une ébauche de modèle à partir d'un référentiel (fichier PDF/image en base64 et/ou texte). */
export async function genererModele({ fichier, texte, consignes }) {
  const parts = [{ text: `Tu es un expert de l'EPS au lycée (référentiels du baccalauréat, France). À partir du référentiel d'évaluation fourni, conçois le carnet d'entraînement numérique que l'élève remplira à chaque séance, avec une correction automatique fidèle au référentiel.
${SCHEMA}
${consignes ? "CONSIGNES DU PROFESSEUR : " + consignes : ""}` }];
  if (fichier) parts.push({ inlineData: { mimeType: fichier.mime, data: fichier.base64 } });
  if (texte) parts.push({ text: "RÉFÉRENTIEL (texte) :\n" + texte });
  return call(parts);
}

/** Applique une demande du prof à un modèle existant. */
export async function modifierModele(modele, demande) {
  return call([{ text: `Tu modifies un carnet d'entraînement EPS existant à la demande du professeur.
${SCHEMA}
- Garde les identifiants existants inchangés (les élèves ont déjà des données), sauf pour ce qui est supprimé.
- Ne change que ce qui est demandé.
MODÈLE ACTUEL :
${JSON.stringify(modele)}
DEMANDE DU PROFESSEUR : ${demande}` }]);
}
