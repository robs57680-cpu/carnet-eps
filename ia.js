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
          "colonnes": [ { "id": "...", "type": "texte|nombre|temps|choix|membres", "label": "...", "options": [], "min": 2, "max": 4, "nbCol": "id d'une colonne nombre" } ],  // type tableau ; nombre : min/max facultatifs (ex. personnes dans une pyramide : max = taille du groupe) ; membres : l'élève coche ses partenaires dans la liste de son groupe (nbCol : leur nombre = valeur de cette colonne − 1)
          "nb": 4, "nbChamp": "section.champ", "noRep": true, "adapt": true, "coach": true,  // type passages : nombre de tours fixe ou lu dans un champ nombre ; noRep : compteur par tour ; adapt : bouton adaptation par tour ; coach : un camarade peut remplir depuis son téléphone
          "nb": 3,                                  // type exercices : nombre de lignes au départ
          "src": { "exos": "section.exercices", "tours": "section.nombre", "temps": "section.temps" },  // type resume
          // type grille (TABLEAU À DOUBLE ENTRÉE du référentiel, calculé automatiquement, jamais rempli par l'élève) :
          "lignes":   { "titre": "Acros", "src": [ { "champ": "section.tableau", "colonne": "id" }, { "champ": "section.nombre" } ], "seuils": [0, 4, 7, 10], "labels": ["< 4", "4 à 6", "7 à 9", "≥ 10"] },
          "colonnes": { "titre": "Étoiles", "src": [ { "champ": "section.choix1" }, { "champ": "section.choix2" } ], "seuils": [0, 4, 7, 10], "labels": ["< 4", "4 à 6", "7 à 9", "≥ 10"] },   // labels = intitulés EXACTS des lignes / colonnes du référentiel
          "notes": [ [1, 2, 3, 4], [3, 4, 5, 6], [5, 6, 8, 9], [7, 9, 11, 12] ]   // notes[ligne][colonne], recopiées EXACTEMENT du référentiel
        } ] } ],
  "criteres": [
    { "id": "...", "afl": "AFL1|AFL2|AFL3", "label": "élément évalué du référentiel",
      "descripteurs": ["degré 1", "degré 2", "degré 3", "degré 4"],      // texte du référentiel, du point de vue de l'élève
      "points": [p1, p2, p3, p4],                                          // points gagnés selon le degré (AFL1 surtout)
      "conseils": ["conseil si D1", "si D2", "si D3", "si D4"],            // facultatif : conseil affiché à l'élève après correction
      "calcul": CALCUL } ],
  "bareme": { "afl1": { "max": 12, "table": [ { "pts": 6, "note": 0.5 } ] } },   // table facultative : conversion points → note si le référentiel en donne une
  "versions": { "nb": 6, "blocs": [ { "id": "idsection", "nom": "Slam ball" } ], "ordres": [ ["idsection", "…"] ] }   // FACULTATIF : la fiche existe en plusieurs versions où seul l'ordre des ateliers change. blocs = les ateliers dans l'ordre de la version 1, id = id de la section de l'atelier (une section par atelier) ; nb = nombre de versions ; "ordres" seulement si l'ordre n'est PAS un simple décalage d'un cran (version 2 = commence au 2e atelier, etc.) : liste des ids dans l'ordre, une liste par version.
}
TYPES SPÉCIAUX :
  { "type": "pseudo", "qui": "eleve" | "juge" }   // rempli automatiquement avec le PSEUDO de l'élève qui pratique (eleve) ou du coach / juge / observateur (juge, avec "coach": true). RGPD : JAMAIS de case nom, prénom, classe ou identité d'élève : utilise toujours une case pseudo à la place.
  { "type": "calcul", "op": "somme|moyenne|max|min|nombre", "src": [ { "champ": "section.champ" }, { "champ": "section.tableau", "colonne": "id" } ] }   // calculé automatiquement, jamais saisi : tout « total », « nombre total d'étoiles », « score », « somme » = case calcul (un choix vaut le dernier nombre de son texte, une case cochée vaut 1). Peut servir de source à un critère ou à un champ grille.
  Pour désigner des camarades dans un tableau, utilise une colonne "membres".
TYPES de champ : pseudo, calcul, texte, texte_long, nombre, temps (format min:s), choix, case (oui/non), echelle, compteur (+/-), tableau (lignes ajoutables), passages (chronomètre + temps de passage par tour), exercices (lignes exercice / type haltéro-gym-cardio / répétitions / charge ou niveau, avec % du 1RM), resume (récapitulatif lisible d'un champ exercices), grille (tableau à double entrée calculé : note lue au croisement de deux grandeurs).
CALCUL (correction automatique) — choisir le plus fidèle au référentiel :
  { "type": "seuils", "source": SOURCE, "sens": "haut|bas", "seuils": [s4, s3, s2] }   // sens haut : >= s4 → degré 4, >= s3 → 3, >= s2 → 2, sinon 1 ; sens bas : <= s4 → 4 …
  { "type": "ecart", "source": SOURCE, "cible": SOURCE ou nombre, "seuils": [e4, e3, e2] }  // |source - cible| <= e4 → degré 4 …
  { "type": "complet", "champs": ["section.champ", …], "seuils": [1, 0.85, 0.5] }      // proportion de champs remplis
  { "type": "rythme", "source": { "champ": "section.passages", "cible": SOURCE ou nombre, "tolerance": 5 }, "condition": { "champ": "section.choix", "valeur": "option" } }  // charge : D4 rythme tenu jusqu'au bout, D3 décroche sur les 2 derniers tours, D2 à partir de la moitié, D1 avant ou non terminé (ou condition vraie)
  { "type": "reperes", "source": { "champ": "section.exercices" }, "min": 3 }   // exercices conformes aux repères du thème (répétitions, % 1RM) : D4 tous, D3 un hors repère, D2 deux, D1 plus
  { "type": "grille", "champ": "section.grille" }   // la note lue dans un champ grille : c'est le calcul de l'AFL1 dès qu'il y a un tableau à double entrée (sur le maximum du tableau)
  { "type": "autoeval" }                                                                 // l'élève se positionne avec les descripteurs (obligatoire si rien n'est mesurable, et pour AFL2/AFL3)
SOURCE : { "champ": "section.champ" } pour un champ nombre/temps/echelle/compteur/case/choix ;
         { "champ": "section.tableau", "colonne": "id", "agg": "moyenne|somme|max|min|nombre|dernier|ecart_premier_dernier" } ;
         { "champ": "section.passages", "mesure": "proportion_dans_cible|nb_hors_cible|norep|adaptations|termine|temps_total", "cible": SOURCE ou nombre (secondes), "tolerance": 5 }.
TABLEAU À DOUBLE ENTRÉE = AFL1 : un barème croisé (note lue au croisement d'une ligne et d'une colonne) sert, sauf indication contraire du professeur, à noter l'AFL1. Dès que le document en contient un, crée D'OFFICE, sans attendre qu'on te le demande, le champ "grille" ET le critère AFL1 { "type": "grille" } qui le lit. Si le référentiel donne une note au croisement de deux grandeurs (ex. points acros en lignes × étoiles en colonnes, difficulté × exécution), crée des champs pour saisir ces grandeurs, puis UN champ "grille" qui les additionne (src = liste de champs : nombre, compteur, échelle, choix — un choix vaut le dernier nombre de son texte, ex. « Tous les éléments (3 étoiles) » = 3 —, ou colonne d'un tableau) ; "seuils" = valeur minimale de chaque ligne / colonne, dans l'ordre croissant (axe "sens": "haut", par défaut) ; pour une grandeur où MOINS c'est mieux (un temps de course, d'épreuve, de parcours), mets "sens": "bas" sur l'axe et "seuils" = valeur MAXIMALE de chaque ligne / colonne, de la plus lente à la plus rapide (ex. colonnes « 15:00+ ; 14:45 ; 14:30 … 12:30 » → "seuils": [900, 885, 870 … 750]) ; "notes" = toutes les cases du tableau, sans en inventer. Recopie le tableau EN ENTIER, jusqu'à sa dernière ligne et sa dernière colonne (il peut aller jusqu'à 100 lignes, par ex. 0 à 72 points acros) : ne coupe, ne regroupe et ne résume jamais de lignes ou de colonnes ; la plus grande valeur de "seuils" et la note maximale doivent être celles du référentiel (ex. 12/12). Ne recopie pas les valeurs de l'exemple ci-dessus. Avant d'écrire, COMPTE les lignes et les colonnes du tableau du référentiel : "seuils" et "labels" de chaque axe ont exactement ce nombre d'éléments, et chaque ligne de "notes" a exactement autant de valeurs que de colonnes (ex. 4 colonnes d'étoiles → 4 valeurs par ligne). Recopie les intitulés tels quels dans "labels" (« < 10 », « > 60 », « 10 à 19 »…). Convertis-les en "seuils" (valeur minimale de la ligne ou colonne, ordre croissant) : « < a » ou « ≤ a » → la valeur minimale possible (0 pour la première) ; « a à b » → a ; « ≥ a » → a ; « > a » → a + 1 pour un nombre entier de points (a + 0,5 pour des demi-points). Si le référentiel range les lignes de la plus forte à la plus faible, remets-les dans l'ordre croissant en gardant chaque note sur sa ligne. Si une grandeur est un TEMPS (« 4'30 », « 4'30'' », « 4 min 30 », « 4:30 » : ' ou min = minutes, '' ou s = secondes), le champ source est de type "temps" (jamais nombre ni texte) et ses "seuils" sont en SECONDES (4'30 = 270) avec "sens": "bas" si le plus rapide est le meilleur ; garde les intitulés d'origine dans "labels". Puis un critère AFL1 { "type": "grille", "champ": "section.grille" } : cet AFL n'est JAMAIS une autoévaluation, il découle du tableau. Ne demande jamais à l'élève de lire lui-même le tableau. TIME CAP : si l'axe de temps continue après le temps limite par des colonnes (ou lignes) du type « -0,5 exo », « -1 exo », « -2 exo » (exercices non terminés au time cap), crée un champ "choix" (ex. id "exos_moins", label « Exercices non terminés au time cap », options : ["0 — parcours terminé", "-0,5 exo", "-1 exo", …] dans l'ordre de la moins mauvaise à la pire, avec une "aide" qui explique à l'observateur quoi choisir), mets sur l'axe "cap": { "champ": "section.exos_moins", "n": nombre d'options - 1 }, garde dans "seuils" et "labels" UNIQUEMENT les paliers de temps, et range dans "notes" les colonnes time cap EN PREMIER (de la pire à la moins mauvaise, ex. -2 exo ; -1,5 exo ; -1 exo ; -0,5 exo), puis les colonnes de temps.
RÈGLES :
- Tout « section.champ » cité doit exister. Les champs mesurés par un calcul doivent être des nombres/temps/compteurs, pas du texte.
- Reprendre fidèlement les AFL, éléments évalués, degrés et barèmes du référentiel (points, conversion). AFL1 sur 12 points ; AFL2 et AFL3 se partagent 8 points (répartition choisie par l'élève).
- Une séance type : échauffement, conception (choix, charges, objectifs), réalisation (mesures pendant l'effort), analyse/régulation. Champs concrets et rapides à remplir sur téléphone.
- 4 descripteurs exactement par critère, 4 valeurs de points croissantes.
- Ne jamais inventer de données personnelles. Pas de nom ni prénom d'élève : case "pseudo" (eleve ou juge) à la place. Tout total / score = case "calcul".
- Réponds UNIQUEMENT avec le JSON du modèle complet.`;

function parse(txt) {
  let t = String(txt || "").trim();
  t = t.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const a = t.indexOf("{"), b = t.lastIndexOf("}");
  if (a < 0 || b < 0) throw new Error("Réponse de l'IA illisible.");
  return JSON.parse(t.slice(a, b + 1));
}

// Appel direct avec la clé Gemini personnelle d'un prof (son propre quota gratuit).
async function callCle(parts, cle, name, signal) {
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${name}:generateContent`, {
    method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": cle }, signal,
    body: JSON.stringify({ contents: [{ role: "user", parts }], generationConfig: { responseMimeType: "application/json", temperature: 0.3, maxOutputTokens: 32768 } })
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`${r.status} ${(j.error && j.error.message) || r.statusText}`);
  const txt = ((j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts) || []).map(p => p.text || "").join("");
  return parse(txt);
}

/** Vérifie une clé personnelle avec une requête minuscule.
 *  Limite totale : 15 secondes (au-delà, on abandonne avec une erreur TIMEOUT). */
export async function testerCle(cle, limiteMs = 15000) {
  let lastErr;
  const fin = Date.now() + limiteMs;
  for (const name of MODELES) {
    const reste = fin - Date.now();
    if (reste <= 0) break;
    const ctrl = new AbortController();
    const minuteur = setTimeout(() => ctrl.abort(), reste);
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${name}:generateContent`, {
        method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": cle }, signal: ctrl.signal,
        body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: "Réponds OK" }] }], generationConfig: { maxOutputTokens: 5 } })
      });
      if (r.ok) return name;
      const j = await r.json().catch(() => ({}));
      lastErr = new Error(`${r.status} ${(j.error && j.error.message) || r.statusText}`);
      if (r.status === 400 || r.status === 401 || r.status === 403 || r.status === 429) break;
    } catch (e) {
      lastErr = (e && e.name === "AbortError") ? new Error("TIMEOUT Google ne répond pas") : e;
      if (e && e.name === "AbortError") break;
    } finally { clearTimeout(minuteur); }
  }
  if (!lastErr || Date.now() >= fin) lastErr = new Error("TIMEOUT Google ne répond pas");
  throw lastErr;
}

/* Limite de temps et bouton « Annuler » (2026.11.21-16) : au-delà de LIMITE_IA_MS (tous modèles confondus),
   on abandonne avec une erreur TIMEOUT ; annulerIA() abandonne la demande en cours (erreur ANNULE). */
export const LIMITE_IA_MS = 240000;
let ANNULER = null;
export function annulerIA() { if (ANNULER) ANNULER(); }
async function call(parts, cle) {
  const ctrl = new AbortController();
  let minuteur;
  const stop = new Promise((_, rej) => {
    minuteur = setTimeout(() => { ctrl.abort(); rej(new Error("TIMEOUT L'IA n'a pas répondu à temps")); }, LIMITE_IA_MS);
    ANNULER = () => { ctrl.abort(); rej(new Error("ANNULE")); };
  });
  stop.catch(() => {});
  const garde = p => Promise.race([p, stop]);
  try { return await essais(parts, cle, garde, ctrl.signal); }
  finally { clearTimeout(minuteur); ANNULER = null; }
}
const arret = e => /^(TIMEOUT|ANNULE)/.test(String(e && e.message));
async function essais(parts, cle, garde, signal) {
  let lastErr;
  if (cle) {
    for (const name of MODELES) {
      try { return await garde(callCle(parts, cle, name, signal)); }
      catch (e) { if (arret(e)) throw e; lastErr = e; if (/^(400|401|403) /.test(String(e.message)) && !/model/i.test(String(e.message))) break; }
    }
    throw lastErr;
  }
  for (const name of MODELES) {
    try {
      const model = getGenerativeModel(getAi(), {
        model: name,
        generationConfig: { responseMimeType: "application/json", temperature: 0.3, maxOutputTokens: 32768 }
      });
      const res = await garde(model.generateContent(parts));
      return parse(res.response.text());
    } catch (e) {
      if (arret(e)) throw e;
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
  if (/^ANNULE/.test(m)) return "Demande annulée.";
  if (/^TIMEOUT L'IA/.test(m)) return "L'IA n'a pas répondu en 4 minutes : demande abandonnée. Réessayez ; pour une fiche en plusieurs exemplaires, déposez une seule page (une seule fiche) et précisez les versions dans les consignes.";
  if (/app.?check/i.test(m)) return "L'IA refuse la requête (vérification App Check). Rechargez la page et réessayez.";
  if (/network|fetch/i.test(m)) return "Pas de connexion internet.";
  if (/illisible|JSON/i.test(m)) return "L'IA a renvoyé une réponse incomplète. Réessayez.";
  return "Erreur de l'IA : " + m.slice(0, 200);
}

/** Crée une ébauche de modèle à partir d'un référentiel (fichier PDF/image en base64 et/ou texte). */
export async function genererModele({ fichiers, fichier, texte, consignes, cle, mode }) {
  const intro = mode === "photo"
    ? `Tu es un expert de l'EPS (collège et lycée, France). Le professeur te donne la photo ou le PDF de la fiche papier qu'il utilise déjà (carnet d'entraînement, fiche d'observation, fiche de juge ou d'évaluation). Reproduis-la fidèlement en carnet numérique : mêmes rubriques (sections), mêmes cases, même ordre, mêmes intitulés. Pour chaque case, choisis le type le plus pratique sur téléphone pendant la séance : "compteur" pour compter, "temps" pour chronométrer, "choix" (Oui / En cours / Non) pour cocher un critère, "echelle" pour une note. Si la fiche est remplie par un observateur, utilise partage "coach" et coche coach:true sur ses cases. Si la fiche contient une grille d'évaluation, transforme-la en critères ; sinon, laisse criteres vide.`
    : mode === "phrase"
    ? `Tu es un expert de l'EPS (collège et lycée, France). Le professeur décrit en quelques mots le carnet ou la fiche qu'il veut. Conçois un carnet simple, rapide à remplir sur téléphone en séance : peu de cases, bien choisies, avec des intitulés clairs pour des élèves. Ajoute des critères seulement si le professeur parle d'évaluation ou de note.`
    : `Tu es un expert de l'EPS au lycée (référentiels du baccalauréat, France). À partir du référentiel d'évaluation fourni, conçois le carnet d'entraînement numérique que l'élève remplira à chaque séance, avec une correction automatique fidèle au référentiel.`;
  const parts = [{ text: `${intro}
${SCHEMA}
${consignes ? (mode === "phrase" ? "DEMANDE DU PROFESSEUR : " : "CONSIGNES DU PROFESSEUR : ") + consignes : ""}` }];
  const fs = fichiers || (fichier ? [{ role: "referentiel", ...fichier }] : []);
  for (const f of fs) {
    parts.push({ text: f.role === "fiche" && mode === "photo"
      ? "FICHE PAPIER DU PROFESSEUR À REPRODUIRE :"
      : f.role === "fiche"
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
MODE D'EMPLOI (lis-le avant tout) :
Le professeur écrit vite, avec ses mots de prof d'EPS, parfois sans ponctuation ni accents, et ne connaît pas le JSON. Ton travail : comprendre ce qu'il VEUT OBTENIR à l'écran, puis faire toi-même les changements dans le modèle. Ne lui renvoie jamais la question : choisis l'interprétation la plus probable pour un prof d'EPS et applique-la.
Son vocabulaire → le modèle :
- « atelier », « exercice », « partie », « bloc », « rubrique » → une section ; « case », « ligne à remplir », « colonne » → un champ (ou une colonne de tableau) ;
- « l'élève coche / écrit / choisit » → champ avec "coach": false ; « l'observateur / le juge / le coach / le camarade remplit » → "coach": true ;
- « chrono », « temps », « en min'sec », « 4'30 » → champ "temps" (' = minutes, '' = secondes) ; « compter », « nombre de reps », « bâtons » → "compteur" ; « entourer », « cocher un niveau », « jaune / bleu / vert » → "choix" avec les options exactes ;
- « total », « somme », « score », « points » → champ "calcul" ; « tableau à double entrée », « barème croisé », « la note se lit dans le tableau » → champ "grille" + critère AFL1 { "type": "grille" } (jamais une autoévaluation) ;
- « la note », « le barème », « l'AFL1 / 2 / 3 », « le critère », « corrige … » → "criteres" (calcul, seuils, descripteurs, points) ;
- « mise en page », « design », « couleur », « comme sur ma fiche », « plus gros », « décale » → "gabarit" (html / css) ;
- « versions », « l'ordre des ateliers change » → "versions".
Méthode : 1) repère tout ce que la demande touche (une demande peut en contenir plusieurs : fais-les toutes) ; 2) applique-le partout où c'est nécessaire (un champ ajouté apparaît aussi dans le gabarit ; un champ supprimé n'est plus cité par un calcul ou un critère) ; 3) vérifie que chaque « section.champ » cité existe ; 4) renvoie le modèle COMPLET, le reste ne change pas.
Ajoute au JSON la clé "_changements" : une ou deux phrases courtes en français, pour le professeur, qui disent ce que tu as modifié (ex. « J'ai ajouté une case Temps remplie par l'observateur dans chaque atelier. »). Si la demande est impossible, ne change rien et explique-le dans "_changements".
${SCHEMA}
- Garde les identifiants existants inchangés (les élèves ont déjà des données), sauf pour ce qui est supprimé.
- Si le modèle a une clé "versions", renvoie-la (mise à jour si la demande la touche). Si le professeur dit que sa fiche a des versions où l'ordre des ateliers change, crée "versions" (une section par atelier) et, s'il y a un gabarit, mets data-v="idsection" sur l'élément qui contient tout l'atelier (sa ligne <tr> ou son bloc) et data-num sur l'élément qui affiche son numéro.
- Ne change que ce qui est demandé.
- Si le modèle a une clé "gabarit" (mise en page HTML de la fiche d'origine), renvoie-la aussi, mise à jour si la demande touche la mise en page ou les cases : chaque case garde son repère <span data-f="section.champ"></span>, une nouvelle case reçoit le sien, une case supprimée perd le sien.
MODÈLE ACTUEL :
${JSON.stringify(modele)}
DEMANDE DU PROFESSEUR : ${demande}` }], cle);
}

/** Recopie le tableau de correction des cartons de course d'orientation (photo, PDF scanné). */
export async function lireTableau({ fichiers, cle }) {
  const parts = [{ text: `Le professeur d'EPS te donne la correction des cartons de contrôle de sa course d'orientation (photo, PDF scanné ou tableau).
Recopie FIDÈLEMENT chaque tableau, case par case, ligne par ligne, sans rien inventer, corriger ni réordonner.
Garde la ligne et la colonne d'en-tête (numéros des balises, noms ou numéros des cartons). Une case vide s'écrit "". Écris les flèches avec ↑ ↓ ← →.
Réponds uniquement en JSON : {"tableaux":[{"nom":"titre du tableau ou de la page","lignes":[["case","case"],["case","case"]]}]}` }];
  for (const f of fichiers || []) parts.push({ inlineData: { mimeType: f.mime, data: f.base64 } });
  return call(parts, cle);
}

/** Crée des questions de QCM à partir d'une fiche (images, PDF) et/ou d'un texte. */
export async function genererQcm({ fichiers, texte, nb, consignes, cle }) {
  const parts = [{ text: `Tu es professeur d'EPS (collège et lycée, France). À partir du document fourni, écris ${nb || 10} questions de QCM claires pour des élèves, portant sur les connaissances utiles du document (règles, sécurité, technique, principes d'entraînement, vocabulaire…).
- Types : "une" (une seule bonne réponse, 3 ou 4 réponses), "plusieurs" (2 bonnes réponses ou plus parmi 4 à 6), "vf" (vrai / faux : réponses exactement ["Vrai","Faux"]).
- Réponses courtes, plausibles, sans « toutes les réponses ». Ne rien inventer qui contredise le document.
- "bonnes" = indices (à partir de 0) des bonnes réponses dans "reponses".
- Aucune donnée personnelle, aucun nom d'élève.
${consignes ? "CONSIGNES DU PROFESSEUR : " + consignes : ""}
Réponds uniquement en JSON : {"questions":[{"type":"une|plusieurs|vf","texte":"énoncé","reponses":["…","…"],"bonnes":[0],"points":1}]}` }];
  for (const f of fichiers || []) { parts.push({ text: "DOCUMENT :" }); parts.push({ inlineData: { mimeType: f.mime, data: f.base64 } }); }
  if (texte) parts.push({ text: "DOCUMENT (texte) :\n" + texte });
  return call(parts, cle);
}

/** Fiche d'observation cliquable « copie fidèle » : modèle de carnet + gabarit HTML qui reproduit la mise en page. */
export async function genererFicheFidele({ fichiers, consignes, cle }) {
  const parts = [{ text: `Tu es un expert de l'EPS (collège et lycée, France) et un intégrateur web soigneux.
Le professeur te donne la photo ou le PDF de SA fiche d'observation (ou fiche de juge / d'évaluation). Il veut la MÊME fiche, avec le MÊME design, mais cliquable sur téléphone : un camarade observateur (le coach) la remplit pendant que l'élève pratique.

Réponds avec UN SEUL objet JSON : { "modele": MODELE, "gabarit": { "html": "...", "css": "..." } }

1) MODELE = le modèle de carnet décrit ci-dessous. Il contient TOUTES les cases à remplir de la fiche :
${SCHEMA}
Règles en plus pour cette fiche :
- "partage": "coach". Les cases d'observation (cocher, entourer, compter, chronométrer, noter, commenter) sont remplies par l'observateur : "coach": true. Ce que l'élève observé écrit lui-même (son projet, son ressenti, son bilan) : "coach": false.
- Nom / prénom / élève observé → case "pseudo" "qui": "eleve" ; nom de l'observateur / juge / coach → case "pseudo" "qui": "juge". JAMAIS de case nom ou prénom.
- Case à cocher (☐, oui/non, réussi) → "case" ; une seule réponse à entourer ou cocher parmi plusieurs (ex. + / = / −, A B C D, 1 2 3 4, ★ ★★ ★★★) → "choix" avec ces options exactes ; bâtons / nombre de réussites → "compteur" ; temps → "temps" ; mesure → "nombre" ; lignes à écrire → "texte" ou "texte_long".
- Tableau d'observation (lignes = critères, colonnes = essais / passages / tours) : UNE case par cellule à remplir (ids courts : c1_e1, c1_e2…). 20 cases au plus par section : fais une section par ligne du tableau ou par bloc de la fiche.
- Total, score, nombre total de réussites, moyenne → case "calcul" (jamais saisie) avec ses sources.
- "pages": "seance" si la fiche sert à chaque séance, "cycle" si c'est une fiche de cycle.
- Reprends les critères d'évaluation (AFL, degrés, barème) s'ils figurent sur la fiche ; sinon un critère simple fondé sur les cases (seuils ou complet).
- Si la fiche (ou un document joint) contient un tableau à double entrée / barème croisé (ex. points × temps → note sur 12), c'est l'AFL1 : crée d'office le champ "grille" (dans une section Bilan, sans repère data-f s'il n'est pas sur la fiche) et le critère AFL1 { "type": "grille" }. Un temps en min'sec (« 14'30 », « 14:30 ») est un champ "temps" ; un axe de temps où le plus rapide gagne a "sens": "bas".

0) UNE SEULE FICHE. Le document contient souvent plusieurs exemplaires de la fiche (2 par page A4, une moitié de page chacune, et parfois plusieurs pages ou « versions » où seul l'ordre des lignes change). Ne reproduis QU'UN exemplaire : le premier (en haut à gauche de la page 1, « Version 1 » s'il y en a). Ne fusionne pas les versions et ne mets jamais d'intitulés génériques (« Atelier 1 », « Exercice 2 ») : reprends les vrais noms écrits sur la fiche (ex. « Slam ball ») et leurs sous-titres (ex. « 30 / 40 / 50 reps »), dans le même ordre.
0 bis) VERSIONS. Si les exemplaires sont des versions de la même fiche où seul l'ordre des ateliers (ou des lignes / exercices) change (ex. « Version 2 » commence au 2e atelier), DÉTECTE-LES : regarde tous les exemplaires et compte les versions différentes. Alors :
- dans MODELE, UNE section par atelier (id court, ex. "slam", "farmer"), dans l'ordre de la version 1, et la clé "versions" : { "nb": nombre de versions, "blocs": [ { "id": id de la section, "nom": vrai nom de l'atelier } dans l'ordre de la version 1 ] } ; ajoute "ordres" (ordre des ids pour chaque version, version 1 comprise) seulement si l'ordre n'est pas un simple décalage d'un cran ;
- dans le GABARIT, l'élément qui contient tout l'atelier (sa ligne <tr>, ou son bloc <div>) porte data-v="id de la section", et ces éléments sont frères (même parent) ; l'élément qui affiche le numéro de l'atelier (ex. le gros « 1 ») porte data-num : l'appli remet les ateliers dans l'ordre de chaque version et les renumérote. N'écris pas « Version 1 » dans le gabarit : l'appli affiche elle-même la version en haut de la fiche.
Sans versions, n'ajoute pas la clé "versions".

2) GABARIT = la fiche redessinée en HTML, le plus fidèlement possible : même titre, mêmes blocs dans le même ordre, mêmes tableaux (mêmes lignes et colonnes, cellules fusionnées avec colspan / rowspan), mêmes intitulés, sous-titres et consignes mot pour mot, mêmes couleurs de fond, bordures, gras, alignements, logos remplacés par leur texte.
- Le rendu doit ressembler à la fiche au premier coup d'œil : bandeaux de titre et en-têtes de tableau avec LEUR couleur de fond (ex. bandeau bleu nuit #1f2937 et texte blanc), encadrés colorés (ex. consigne sur fond jaune pâle avec bordure), lignes alternées gris clair, gros numéros de ligne en gras, petites indications grises (ex. « min : sec » sous une case de temps), coins arrondis et épaisseurs de bordure. Écris les couleurs en hexadécimal dans le css (pas de couleur par défaut du navigateur).
- Les lignes « Nom, prénom » et « Observateur » restent présentes avec leur intitulé : mets le repère de la case pseudo (élève ou juge) à la place de la ligne à remplir.
- Balises autorisées seulement : div span p b strong i em u br hr table thead tbody tr th td caption h1 h2 h3 h4 ul ol li small sup sub. Attributs : class, style, colspan, rowspan, data-f, data-v, data-num. AUCUN input, select, textarea, button, img, svg, lien, script.
- À CHAQUE endroit où l'on écrit, coche, entoure ou compte sur la fiche papier, mets exactement <span data-f="idsection.idchamp"></span> (identifiants du MODELE). Chaque case du modèle apparaît une fois et une seule. Pour un "choix" (cases à cocher où l'on ne coche qu'une case, ex. ☐30 ☐40 ☐50 ou ☐Jaune ☐Bleu ☐Vert), mets un seul repère à l'endroit des cases et ne réécris pas les options : l'appli dessine elle-même une case à cocher par option, avec l'option écrite dessous, colorée automatiquement si l'option est un nom de couleur (Jaune, Bleu, Vert, Rouge, Orange…). Garde donc les options exactement comme sur la fiche.
- css : des règles sur des classes (ex. .titre, .bloc, .grille td, .num, .sous) qui reproduisent couleurs, tailles et bordures ; tables en width:100% et border-collapse:collapse ; police lisible (14px minimum) ; pas de position fixed, pas d'url(), pas de @import. La fiche doit rester lisible sur un téléphone (un tableau large pourra défiler).
${consignes ? "PRÉCISIONS DU PROFESSEUR : " + consignes : ""}` }];
  for (const f of fichiers || []) { parts.push({ text: "FICHE DU PROFESSEUR À REPRODUIRE :" }); parts.push({ inlineData: { mimeType: f.mime, data: f.base64 } }); }
  return call(parts, cle);
}
