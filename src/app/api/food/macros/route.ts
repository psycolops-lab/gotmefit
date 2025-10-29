import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  const url = new URL(req.url);
  const name = url.searchParams.get('name')?.trim();
  const qty = parseFloat(url.searchParams.get('qty') ?? '0');

  if (!name || qty <= 0) return Response.json({ calories:0,protein:0,carbs:0,fats:0 });

  const { data } = await supabase.rpc('calc_food_macros', { p_name: name, p_qty: qty });
  return Response.json(data?.[0] ?? { calories:0,protein:0,carbs:0,fats:0 });
}