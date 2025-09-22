import { supabase } from "./supabaseClient"; 
import Router from "next/navigation";

export async function signOut() {
     await supabase.auth.signOut(); 
      if (typeof window !== "undefined") { 
        window.location.href = "/login"; 
    }

}