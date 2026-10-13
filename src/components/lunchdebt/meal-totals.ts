export type MealPriceItem = { name: string; price: number; member_ids: string[] };

/** Round VAT once for the bill, then distribute rounding differences deterministically. */
export function calculateMealTotals(items: MealPriceItem[], taxRate = 0) {
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  const tax = Math.round(subtotal * taxRate / 100);
  let cumulativeBase = 0;
  let allocatedTax = 0;
  const taxItems = taxRate > 0 ? items.map(item => {
    cumulativeBase += item.price;
    const nextTax = Math.round(cumulativeBase * taxRate / 100);
    const price = nextTax - allocatedTax;
    allocatedTax = nextTax;
    return { name: `Thuế ${taxRate}% · ${item.name}`.slice(0, 120), price, member_ids: item.member_ids };
  }).filter(item => item.price !== 0) : [];
  const savedItems = [...items, ...taxItems];
  const shares = new Map<string, number>();
  for (const item of savedItems) {
    const ids = [...new Set(item.member_ids)];
    for (const id of ids) shares.set(id, (shares.get(id) ?? 0) + item.price / ids.length);
  }
  return { subtotal, tax, total: subtotal + tax, savedItems, shares };
}