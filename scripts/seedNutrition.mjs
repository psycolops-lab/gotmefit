import XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase env vars. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env.local.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const EXCEL_PATH = join(__dirname, 'NutritionDatabaseValidation.xlsx');
const NUTRITIONISTS = ['Atul', 'Yash', 'Sangeeta', 'Sandeep', 'Akshay'];

async function seedNutrition() {
  const fs = await import('fs');
  if (!fs.existsSync(EXCEL_PATH)) {
    console.error(`Excel file not found at ${EXCEL_PATH}. Place it in /scripts/.`);
    process.exit(1);
  }

  console.log('Starting Excel import to Supabase...');
  const workbook = XLSX.readFile(EXCEL_PATH);

  let totalInserted = 0;
  const batchSize = 50;
  let batch = [];

  try {
    for (const nutritionist of NUTRITIONISTS) {
      if (!workbook.SheetNames.includes(nutritionist)) {
        console.warn(`Tab "${nutritionist}" not found—skipping.`);
        continue;
      }

      console.log(`Processing tab: ${nutritionist}`);
      const sheet = workbook.Sheets[nutritionist];
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row[1] || row[1].toString().trim() === '') continue;

        const record = {
          full_name: row[0]?.toString().trim() || 'Unknown',
          food_name: row[1].toString().trim(), // Keep exact casing
          type_of_food: row[2]?.toString().trim(),
          category: row[3]?.toString().trim(),
          quantity: safeParseFloat(row[4]) || 1,
          unit: row[5]?.toString().trim() || 'gm',
          fats: safeParseFloat(row[6]),
          carbs: safeParseFloat(row[7]),
          protein: safeParseFloat(row[8]),
          fiber: safeParseFloat(row[9]),
          alcohol: safeParseFloat(row[10]),
          net_carbs: safeParseFloat(row[11]),
          calories: safeParseFloat(row[12]),
          nutritionist: nutritionist,
        };

        batch.push(record);

        if (batch.length >= batchSize) {
          await processBatch(batch, nutritionist);
          totalInserted += batch.length;
          batch = [];
        }
      }
    }

    if (batch.length > 0) {
      await processBatch(batch, 'final');
      totalInserted += batch.length;
    }

    console.log(`Import complete! Total records inserted: ${totalInserted}`);
  } catch (error) {
    console.error('Import failed:', error.message);
    process.exit(1);
  } finally {
    await supabase.auth.signOut();
    process.exit(0);
  }
}

async function processBatch(batch, context) {
  const { data: inserted, error } = await supabase
    .from('nutrition_items')
    .insert(batch);

  if (error) {
    console.error(`Batch error (${context}):`, error.message);
    throw error;
  } else {
    console.log(`Processed batch of ${inserted ? inserted.length : batch.length} (${context})`);
  }
}

function safeParseFloat(val) {
  const num = parseFloat(val);
  return isNaN(num) ? null : num;
}

seedNutrition();