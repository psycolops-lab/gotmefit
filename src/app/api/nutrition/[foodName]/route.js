import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request, { params }) {
  const { foodName } = await params; // Await params
  const { searchParams } = new URL(request.url);
  const quantity = parseFloat(searchParams.get('quantity')) || 1;

  try {
    const { data, error } = await supabase
      .from('nutrition_items')
      .select('food_name, calories, protein, carbs, fats, fiber, alcohol, net_carbs')
      .eq('food_name', foodName.toLowerCase()) // Match lowercase
      .eq('quantity', quantity)
      .limit(1) // Take first match
      .single();

    if (error || !data) {
      console.log(`No match for food_name: ${foodName}, quantity: ${quantity}`); // Debug
      return new Response(JSON.stringify({ food_name: foodName, calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0, alcohol: 0, net_carbs: 0 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('API Error:', error.message);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}