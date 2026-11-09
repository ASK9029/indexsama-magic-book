import type { DatabaseSync } from 'node:sqlite';

export const BUILT_IN_FOODS = [
  { id: 'food-rice', name: '米饭', category: '主食', unit: 'g', per100Calories: 116, per100Protein: 2.6, servingName: '一碗', servingAmount: 150 },
  { id: 'food-noodles', name: '面条', category: '主食', unit: 'g', per100Calories: 110, per100Protein: 4.5, servingName: '一碗', servingAmount: 200 },
  { id: 'food-oats', name: '燕麦', category: '主食', unit: 'g', per100Calories: 389, per100Protein: 16.9, servingName: '一份', servingAmount: 40 },
  { id: 'food-whole-wheat-bread', name: '全麦面包', category: '主食', unit: 'g', per100Calories: 247, per100Protein: 13, servingName: '一片', servingAmount: 35 },
  { id: 'food-sweet-potato', name: '红薯', category: '主食', unit: 'g', per100Calories: 86, per100Protein: 1.6, servingName: '一个', servingAmount: 200 },
  { id: 'food-egg', name: '鸡蛋', category: '肉蛋奶', unit: 'g', per100Calories: 144, per100Protein: 13.3, servingName: '一个', servingAmount: 50 },
  { id: 'food-milk', name: '牛奶', category: '肉蛋奶', unit: 'ml', per100Calories: 54, per100Protein: 3, servingName: '一杯', servingAmount: 250 },
  { id: 'food-chicken-breast', name: '鸡胸肉', category: '肉蛋奶', unit: 'g', per100Calories: 133, per100Protein: 30, servingName: '一块', servingAmount: 150 },
  { id: 'food-beef', name: '牛肉', category: '肉蛋奶', unit: 'g', per100Calories: 125, per100Protein: 20, servingName: '一份', servingAmount: 150 },
  { id: 'food-fish', name: '鱼', category: '肉蛋奶', unit: 'g', per100Calories: 100, per100Protein: 18, servingName: '一份', servingAmount: 150 },
  { id: 'food-yogurt', name: '酸奶', category: '肉蛋奶', unit: 'ml', per100Calories: 72, per100Protein: 3.2, servingName: '一杯', servingAmount: 200 },
  { id: 'food-broccoli', name: '西兰花', category: '蔬菜', unit: 'g', per100Calories: 34, per100Protein: 2.8, servingName: '一份', servingAmount: 150 },
  { id: 'food-spinach', name: '菠菜', category: '蔬菜', unit: 'g', per100Calories: 28, per100Protein: 2.9, servingName: '一份', servingAmount: 150 },
  { id: 'food-tomato', name: '番茄', category: '蔬菜', unit: 'g', per100Calories: 18, per100Protein: 0.9, servingName: '一个', servingAmount: 150 },
  { id: 'food-cucumber', name: '黄瓜', category: '蔬菜', unit: 'g', per100Calories: 15, per100Protein: 0.7, servingName: '一根', servingAmount: 200 },
  { id: 'food-apple', name: '苹果', category: '水果', unit: 'g', per100Calories: 53, per100Protein: 0.3, servingName: '一个', servingAmount: 200 },
  { id: 'food-banana', name: '香蕉', category: '水果', unit: 'g', per100Calories: 93, per100Protein: 1.1, servingName: '一根', servingAmount: 120 },
  { id: 'food-orange', name: '橙子', category: '水果', unit: 'g', per100Calories: 48, per100Protein: 0.9, servingName: '一个', servingAmount: 200 },
  { id: 'food-tofu', name: '豆腐', category: '豆类', unit: 'g', per100Calories: 84, per100Protein: 8.1, servingName: '一块', servingAmount: 200 },
  { id: 'food-soybean', name: '黄豆', category: '豆类', unit: 'g', per100Calories: 390, per100Protein: 35, servingName: '一份', servingAmount: 50 },
  { id: 'food-soy-milk', name: '豆浆', category: '豆类', unit: 'ml', per100Calories: 31, per100Protein: 3, servingName: '一杯', servingAmount: 250 },
  { id: 'food-nuts', name: '坚果', category: '零食', unit: 'g', per100Calories: 600, per100Protein: 20, servingName: '一把', servingAmount: 30 },
  { id: 'food-chips', name: '薯片', category: '零食', unit: 'g', per100Calories: 536, per100Protein: 7, servingName: '一包', servingAmount: 50 },
  { id: 'food-chocolate', name: '巧克力', category: '零食', unit: 'g', per100Calories: 546, per100Protein: 4.9, servingName: '一块', servingAmount: 20 },
  { id: 'food-cola', name: '可乐', category: '饮料', unit: 'ml', per100Calories: 43, per100Protein: 0, servingName: '一罐', servingAmount: 330 },
  { id: 'food-milk-tea', name: '奶茶', category: '饮料', unit: 'ml', per100Calories: 70, per100Protein: 1.2, servingName: '一杯', servingAmount: 500 },
  { id: 'food-black-coffee', name: '黑咖啡', category: '饮料', unit: 'ml', per100Calories: 2, per100Protein: 0.1, servingName: '一杯', servingAmount: 250 },
  { id: 'food-tomato-egg', name: '番茄炒蛋', category: '家常菜', unit: 'g', per100Calories: 90, per100Protein: 5, servingName: '一份', servingAmount: 200 },
  { id: 'food-pepper-pork', name: '青椒肉丝', category: '家常菜', unit: 'g', per100Calories: 120, per100Protein: 8, servingName: '一份', servingAmount: 200 },
  { id: 'food-braised-pork', name: '红烧肉', category: '家常菜', unit: 'g', per100Calories: 300, per100Protein: 10, servingName: '一份', servingAmount: 150 },
  { id: 'food-stir-fried-greens', name: '炒青菜', category: '家常菜', unit: 'g', per100Calories: 50, per100Protein: 1.5, servingName: '一份', servingAmount: 200 },
] as const;

export function seedFoods(db: DatabaseSync): void {
  const insert = db.prepare(
    'INSERT OR IGNORE INTO foods(id, name, category, unit, per100_calories, per100_protein, serving_name, serving_amount, built_in) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)',
  );

  for (const food of BUILT_IN_FOODS) {
    insert.run(
      food.id,
      food.name,
      food.category,
      food.unit,
      food.per100Calories,
      food.per100Protein,
      food.servingName,
      food.servingAmount,
    );
  }
}
