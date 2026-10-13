import { Apple, Beef, CakeSlice, Coffee, Fish, IceCreamBowl, Milk, Pizza, Salad, Sandwich, Soup, Utensils } from 'lucide-react';

export const dishIconNames = ['utensils', 'soup', 'coffee', 'beef', 'fish', 'salad', 'pizza', 'sandwich', 'cake', 'ice-cream', 'milk', 'apple'] as const;
export type DishIconName = typeof dishIconNames[number];
export const dishIcons = [
  { value: 'utensils', label: 'Món ăn', Icon: Utensils },
  { value: 'soup', label: 'Món nước', Icon: Soup },
  { value: 'coffee', label: 'Cà phê', Icon: Coffee },
  { value: 'beef', label: 'Thịt', Icon: Beef },
  { value: 'fish', label: 'Cá', Icon: Fish },
  { value: 'salad', label: 'Rau', Icon: Salad },
  { value: 'pizza', label: 'Pizza', Icon: Pizza },
  { value: 'sandwich', label: 'Bánh mì', Icon: Sandwich },
  { value: 'cake', label: 'Bánh ngọt', Icon: CakeSlice },
  { value: 'ice-cream', label: 'Kem', Icon: IceCreamBowl },
  { value: 'milk', label: 'Sữa', Icon: Milk },
  { value: 'apple', label: 'Trái cây', Icon: Apple },
] as const;

export function DishIcon({ name, className, size = 19 }: { name?: string; className?: string; size?: number }) {
  const Icon = dishIcons.find(icon => icon.value === name)?.Icon ?? Utensils;
  return <Icon className={className} size={size} aria-hidden="true"/>;
}