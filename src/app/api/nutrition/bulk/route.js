import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request) {
  try {
    const { items } = await request.json();

    if (!Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ calories: 0, protein: 0, carbs: 0, fats: 0 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let total = { calories: 0, protein: 0, carbs: 0, fats: 0 };

    for (const item of items) {
      const { foodName, quantity } = item;

      const { data, error } = await supabase
        .from('nutrition_items')
        .select('calories, protein, carbs, fats')
        .eq('food_name', foodName.toLowerCase())
        .eq('quantity', quantity)
        .limit(1);

      if (error || !data || data.length === 0) {
        console.log(`No match for food_name: ${foodName}, quantity: ${quantity}`); // Debug
        continue;
      }

      const nutrition = data[0];
      total.calories += nutrition.calories || 0;
      total.protein += nutrition.protein || 0;
      total.carbs += nutrition.carbs || 0;
      total.fats += nutrition.fats || 0;
    }

    return new Response(JSON.stringify(total), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Bulk API Error:', error.message);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}