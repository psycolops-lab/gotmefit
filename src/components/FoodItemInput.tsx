'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import debounce from 'lodash.debounce';

type Food = {
  id: string,
  food_name: string;
  unit: string;
  base_qty: number;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
};

type Macros = { calories:number; protein:number; carbs:number; fats:number };

type Props = {
  onAdd: (item:{name:string; quantity:string}) => void;
  disabled?: boolean;
};

export default function FoodItemInput({ onAdd, disabled }:Props) {
  const [query,setQuery] = useState('');
  const [qty,setQty] = useState('');
  const [selected,setSelected] = useState<Food|null>(null);
  const [options,setOptions] = useState<Food[]>([]);
  const [show,setShow] = useState(false);
  const [macros,setMacros] = useState<Macros>({calories:0,protein:0,carbs:0,fats:0});
  const ref = useRef<HTMLDivElement>(null);

  // ---- search ----
  const search = useCallback(
    debounce(async (q:string) => {
      if (!q) { setOptions([]); return; }
      const res = await fetch(`/api/food/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setOptions(data);
      setShow(true);
    },180),[]
  );
  useEffect(()=>{search(query);},[query,search]);

  // ---- macros ----
  const calc = useCallback(
    debounce(async (f:Food,q:number) => {
      if (!f||q<=0) { setMacros({calories:0,protein:0,carbs:0,fats:0}); return; }
      const res = await fetch(`/api/food/macros?name=${encodeURIComponent(f.food_name)}&qty=${q}`);
      const d = await res.json();
      setMacros(d);
    },150),[]
  );
  useEffect(()=>{ if(selected && qty) calc(selected,parseFloat(qty)||0); },[selected,qty,calc]);

  // ---- select ----
  const pick = (f:Food)=>{ setSelected(f); setQuery(f.food_name); setShow(false); setQty(''); };

  // ---- add ----
  const add = ()=>{
    if(!selected||!qty) return;
    onAdd({name:selected.food_name, quantity:`${qty}${selected.unit}`});
    setQuery(''); setQty(''); setSelected(null); setMacros({calories:0,protein:0,carbs:0,fats:0});
  };

  // ---- click outside ----
  useEffect(()=>{ const h=(e:MouseEvent)=>{ if(ref.current && !ref.current.contains(e.target as Node)) setShow(false); }; document.addEventListener('mousedown',h); return()=>document.removeEventListener('mousedown',h); },[]);

  return (
    <Card className="p-4 space-y-4">
      {/* NAME + DROPDOWN */}
      <div className="relative" ref={ref}>
        <Label>Food name</Label>
        <div className="relative">
          <Input placeholder="type…" value={query} onChange={e=>setQuery(e.target.value)} disabled={disabled} className="pr-10"/>
          <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground"/>
        </div>
        {show && options.length>0 && (
          <div className="absolute z-20 mt-1 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
            {options.map(o=>(
              <button
        key={o.id}
        className="w-full text-left px-3 py-2 hover:bg-accent"
        onClick={() => pick(o)}
      >
        {o.food_name}{' '}
        <span className="text-xs text-muted-foreground">({o.unit})</span>
      </button>
            ))}
          </div>
        )}
      </div>

      {/* QUANTITY */}
      <div>
        <Label>Quantity</Label>
        <Input type="number" min="0" step="any" placeholder="e.g. 150" value={qty}
          onChange={e=>setQty(e.target.value.replace(/[^\d.]/g,''))}
          disabled={!selected||disabled}/>
      </div>

      {/* UNIT (read-only) */}
      <div>
        <Label>Unit</Label>
        <Input value={selected?.unit??''} readOnly className="bg-muted"/>
      </div>

      {/* LIVE MACROS */}
      {selected && qty && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
          <div><div className="font-semibold text-teal-600">{macros.calories.toFixed(0)}</div><div className="text-xs text-muted-foreground">Calories</div></div>
          <div><div className="font-semibold text-blue-600">{macros.protein.toFixed(1)}</div><div className="text-xs text-muted-foreground">Protein (g)</div></div>
          <div><div className="font-semibold text-amber-600">{macros.carbs.toFixed(1)}</div><div className="text-xs text-muted-foreground">Carbs (g)</div></div>
          <div><div className="font-semibold text-red-600">{macros.fats.toFixed(1)}</div><div className="text-xs text-muted-foreground">Fats (g)</div></div>
        </div>
      )}

      <Button onClick={add} disabled={!selected||!qty||disabled} className="w-full">Add to Meal</Button>

      {query && options.length===0 && show && (
        <div className="flex items-center text-yellow-600 text-sm">
          <AlertCircle className="h-4 w-4 mr-1"/>No food found – try another spelling.
        </div>
      )}
    </Card>
  );
}