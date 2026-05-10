import { Product } from '../types';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

export const initialProducts: Product[] = [
  // 無咖啡因 (Caffeine Free)
  { name: '日安六条大麥', category: '無咖啡因', priceM: 35, priceL: 40, isAvailable: true },
  { name: '蕎麥冬瓜露', category: '無咖啡因', priceM: 45, priceL: 50, isAvailable: true },
  { name: '金桔檸檬', category: '無咖啡因', priceM: 55, priceL: 65, isAvailable: true },
  { name: '粉角檸檬冬瓜', category: '無咖啡因', priceM: 50, priceL: 60, isAvailable: true },
  { name: '芋頭牛奶', category: '無咖啡因', priceL: 65, isAvailable: true },
  { name: '芋頭QQ牛奶', category: '無咖啡因', priceL: 70, isAvailable: true },
  
  // 就愛喝奶茶 (Milk Tea)
  { name: '奶茶三兄弟', category: '就愛喝奶茶', priceL: 65, isAvailable: true },
  { name: '阿薩姆奶茶', category: '就愛喝奶茶', priceM: 40, priceL: 50, isAvailable: true },
  { name: '珍珠奶茶', category: '就愛喝奶茶', priceM: 50, priceL: 60, isAvailable: true },
  { name: 'QQ奶茶', category: '就愛喝奶茶', priceM: 50, priceL: 60, isAvailable: true },
  { name: '3Q奶茶', category: '就愛喝奶茶', priceM: 55, priceL: 65, isAvailable: true },
  
  // 激推水果茶 (Fruit Tea)
  { name: '百香雙響炮', category: '激推水果茶', priceL: 70, isAvailable: true },
  { name: '葡萄柚果粒茶', category: '激推水果茶', priceL: 70, isAvailable: true },
  { name: '莓好雙果茶', category: '激推水果茶', priceM: 70, priceL: 75, isAvailable: true },
  
  // 經典純茶 (Classic Tea)
  { name: '茉莉綠茶', category: '經典純茶', priceM: 30, priceL: 35, isAvailable: true },
  { name: '四季春青茶', category: '經典純茶', priceM: 30, priceL: 35, isAvailable: true },
  { name: '手採紅茶', category: '經典純茶', priceM: 30, priceL: 35, isAvailable: true },
  { name: '日式焙茶', category: '經典純茶', priceM: 35, priceL: 40, isAvailable: true },
];

export async function getProducts(): Promise<Product[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'products'));
    if (querySnapshot.empty) {
      return initialProducts; // fallback to local
    }
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
  } catch (error) {
    if (error instanceof Error && error.message.includes("permission")) {
      // If permission denied when fetching, return defaults (since maybe rules block?)
      // Actually rules say `allow get, list: if true;` for products, so it shouldn't fail.
    }
    console.error("Error fetching products:", error);
    return initialProducts;
  }
}
