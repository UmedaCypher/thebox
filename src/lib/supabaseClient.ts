// client/src/lib/supabaseClient.ts
// Créez un dossier 'lib' dans 'src' s'il n'existe pas, ou placez ce fichier où vous le souhaitez dans 'src'.

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Utilisation des variables d'environnement (méthode recommandée)
// Ces valeurs seront lues depuis votre fichier .env (si configuré)
const supabaseUrl: string = import.meta.env.VITE_SUPABASE_URL || "https://gwotvurtiyeaslmxnqcw.supabase.co";
const supabaseAnonKey: string = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3b3R2dXJ0aXllYXNsbXhucWN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMTg1MjgsImV4cCI6MjA2Mjc5NDUyOH0.72HpuKsg573aRsygoYTdsZEz3xJQgFYvi-oXx9XL_N8";

// Vérification que les variables sont bien chargées (surtout si on se base uniquement sur .env à terme)
if (!supabaseUrl || supabaseUrl === "VOTRE_URL_DE_PROJET_SUPABASE_ICI" || supabaseUrl === "https://gwotvurtiyeaslmxnqcw.supabase.co" && !import.meta.env.VITE_SUPABASE_URL) {
  console.warn(
    "Supabase URL is using a hardcoded fallback or placeholder. " +
    "For better security and configuration, please set VITE_SUPABASE_URL in your .env file. " +
    "Current URL:", supabaseUrl.includes("VOTRE_URL") ? "Placeholder" : "Hardcoded Fallback"
  );
  // Vous pourriez vouloir lever une erreur si import.meta.env.VITE_SUPABASE_URL est vide et que vous ne voulez pas de fallback
  // if (!import.meta.env.VITE_SUPABASE_URL) throw new Error("Supabase URL is not configured via environment variables.");
}

if (!supabaseAnonKey || supabaseAnonKey === "VOTRE_CLE_ANON_SUPABASE_ICI" || supabaseAnonKey.startsWith("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9") && !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn(
    "Supabase Anon Key is using a hardcoded fallback or placeholder. " +
    "For better security and configuration, please set VITE_SUPABASE_ANON_KEY in your .env file. " +
    "Current Key:", supabaseAnonKey.includes("VOTRE_CLE_ANON") ? "Placeholder" : "Hardcoded Fallback"
  );
  // if (!import.meta.env.VITE_SUPABASE_ANON_KEY) throw new Error("Supabase Anon Key is not configured via environment variables.");
}

// Créez et exportez le client Supabase
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Rappel pour l'utilisation des variables d'environnement avec Vite :
// 1. Créez un fichier '.env' à la racine de votre dossier 'client' (là où est package.json).
// 2. Ajoutez-y vos clés :
//    VITE_SUPABASE_URL=https://gwotvurtiyeaslmxnqcw.supabase.co
//    VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3b3R2dXJ0aXllYXNsbXhucWN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMTg1MjgsImV4cCI6MjA2Mjc5NDUyOH0.72HpuKsg573aRsygoYTdsZEz3xJQgFYvi-oXx9XL_N8
// 3. Assurez-vous que '.env' est listé dans votre fichier '.gitignore' pour ne pas le commiter.
// 4. Redémarrez votre serveur de développement Vite après avoir créé/modifié le fichier .env
//    pour que Vite prenne en compte les nouvelles variables d'environnement.
