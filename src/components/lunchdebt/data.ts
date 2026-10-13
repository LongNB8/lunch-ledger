export const members = [
 { name: 'Nguyễn Minh Anh', initials: 'MA', tone: 'blue', debt: 180000, meals: 4 },
 { name: 'Trần Hoàng Nam', initials: 'HN', tone: 'orange', debt: 135000, meals: 3 },
 { name: 'Lê Thu Hà', initials: 'TH', tone: 'green', debt: 90000, meals: 2 },
 { name: 'Phạm Đức Long', initials: 'DL', tone: 'blue', debt: 75000, meals: 2 },
 { name: 'Vũ Phương Linh', initials: 'PL', tone: 'orange', debt: 45000, meals: 1 },
];
export const recentMeals = [
 { name: 'Cơm gà nướng', date: '13/10/2026', people: 8, total: 360000, paid: false },
 { name: 'Bún bò Huế', date: '12/10/2026', people: 6, total: 270000, paid: true },
 { name: 'Cơm sườn & canh rau', date: '09/10/2026', people: 8, total: 320000, paid: true },
];
export const currency = (value: number) => new Intl.NumberFormat('vi-VN').format(value) + ' ₫';
export function pageHead(title: string, description: string) {
 return { meta: [{ title: `${title} · LunchDebt` }, { name: 'description', content: description }, { property: 'og:title', content: `${title} · LunchDebt` }, { property: 'og:description', content: description }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] };
}
