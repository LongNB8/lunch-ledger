import { z } from 'zod';
export const dishSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, 'Vui lòng nhập tên món.').max(120, 'Tên món tối đa 120 ký tự.'),
  price: z.number().int().min(0, 'Giá không âm.').max(100_000_000, 'Giá quá lớn.'),
});
export type DishInput = z.infer<typeof dishSchema>;
export type Dish = DishInput & { id: string };
