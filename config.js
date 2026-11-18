// ====================================================================
//  Configuration à compléter après la création du projet Firebase
//  (Console Firebase > Paramètres du projet > Vos applications > Web)
// ====================================================================
export const firebaseConfig = {
  apiKey: "AIzaSyDpkhaebxGENREGPfmarurmPAs2nyOSbj0",
  authDomain: "carnet-eps-addf5.firebaseapp.com",
  projectId: "carnet-eps-addf5",
  storageBucket: "carnet-eps-addf5.firebasestorage.app",
  messagingSenderId: "16566664774",
  appId: "1:16566664774:web:ea43095b92c8fdc0929447"
};

// Adresse e-mail du compte développeur (la même que dans firestore.rules)
export const DEV_EMAIL = "robs_57680@hotmail.fr";

// Domaine technique des comptes élèves : aucun e-mail n'y est envoyé.
// L'élève tape seulement son identifiant (ex. 1g2-07-k4m).
export const STUDENT_DOMAIN = "eleves.carnet-eps.app";

// Clé de site reCAPTCHA (Fraud Defense / Enterprise) utilisée par Firebase App Check, obligatoire pour l'IA Gemini.
export const RECAPTCHA_SITE_KEY = "6LfWJicuAAAAAAtI-b0MTPs6-XQ5KtutnCB9dMPm";
