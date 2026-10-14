export const PRICE_PRESETS = [35, 40, 45, 50, 55, 60, 65, 70];

/** Quick price chips in thousand đồng; value/onChange use full đồng. */
export function PricePresets({ value, onChange, label = 'Chọn nhanh giá' }: { value: number; onChange: (price: number) => void; label?: string }) {
  return <div role="radiogroup" aria-label={label} className="price-presets">
    {PRICE_PRESETS.map(p => {
      const on = value === p * 1000;
      return <button key={p} type="button" role="radio" aria-checked={on} data-selected={on} className="price-preset" onClick={() => onChange(p * 1000)}>{p}k</button>;
    })}
  </div>;
}
