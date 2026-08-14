import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export async function fetchFinancialEntries() {
  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in the project root."
    );
  }

  const { data, error } = await supabase
    .from("financial_entries")
    .select("*");

  if (error) {
    throw error;
  }

  return data;
}

export async function fetchBudgets() {
  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in the project root."
    );
  }

  const { data, error } = await supabase.from("budgets").select("*");

  if (error) {
    throw error;
  }

  return data;
}
