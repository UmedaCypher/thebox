// client/src/lib/supabaseClient.ts

import { createClient } from '@supabase/supabase-js';

// On récupère les variables d'environnement depuis le fichier .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Si l'une des clés est manquante, on arrête l'application avec une erreur claire.
// C'est beaucoup plus sécurisé que d'utiliser une clé par défaut.
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Les variables d'environnement Supabase (URL et Anon Key) ne sont pas configurées. Vérifiez votre fichier .env et redémarrez le serveur.");
}

// On crée et on exporte le client Supabase.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);