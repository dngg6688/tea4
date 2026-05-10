import React, { useEffect, useState } from 'react';
import { Product, CartItem } from '../types';
import { getProducts } from '../data/products';
import { useCart } from '../store/CartContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, X, Plus, Minus, Coffee } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, doc, setDoc } from 'firebase/firestore';

// UI components manually imported if needed
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { cn } from '../lib/utils';

export default function MenuPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  const { cart, addToCart, removeFromCart, total, clearCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      const prod = await getProducts();
      setProducts(prod);
      const cats = Array.from(new Set(prod.map(p => p.category)));
      setCategories(cats);
      if (cats.length > 0) setActiveCategory(cats[0]);
    }
    load();
  }, []);

  const handleOpenProduct = (p: Product) => {
    setSelectedProduct(p);
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coffee className="w-6 h-6 text-orange-500" />
            <h1 className="font-bold text-xl tracking-tight">CoCo 點單系統</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/admin')}>後台管理</Button>
            <Button variant="outline" className="relative" onClick={() => setIsCartOpen(true)}>
              <ShoppingCart className="w-4 h-4 mr-2" />
              購物車
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full">
                  {cart.reduce((a, b) => a + b.quantity, 0)}
                </span>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full flex gap-8">
        
        {/* Category Sidebar */}
        <aside className="hidden md:block w-48 shrink-0">
          <div className="sticky top-24 flex flex-col gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  activeCategory === cat ? "bg-orange-100 text-orange-700" : "hover:bg-zinc-100 text-zinc-600"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          <div className="flex md:hidden gap-2 overflow-x-auto pb-4 mb-4 no-scrollbar">
             {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors border",
                  activeCategory === cat ? "bg-orange-500 border-orange-500 text-white" : "bg-white border-zinc-200 text-zinc-600"
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.filter(p => !activeCategory || p.category === activeCategory).map(product => (
              <Card key={product.name} className="cursor-pointer hover:border-orange-500 transition-colors" onClick={() => handleOpenProduct(product)}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{product.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-zinc-500 line-clamp-2">
                    {product.priceM ? `$${product.priceM} (中) / ` : ''}${product.priceL} (大)
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

      </main>

      {/* Product Modal */}
      {selectedProduct && (
        <ProductModal 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
          onAdd={(item) => { addToCart(item); setSelectedProduct(null); }}
        />
      )}

      {/* Cart Sidebar */}
      {isCartOpen && (
        <CartSidebar 
          onClose={() => setIsCartOpen(false)} 
        />
      )}

    </div>
  );
}

function ProductModal({ product, onClose, onAdd }: { product: Product, onClose: () => void, onAdd: (item: CartItem) => void }) {
  const [size, setSize] = useState<'M' | 'L'>(product.priceM ? 'M' : 'L');
  const [ice, setIce] = useState('正常冰');
  const [sugar, setSugar] = useState('正常糖');
  const [quantity, setQuantity] = useState(1);

  const price = size === 'M' ? (product.priceM || product.priceL) : product.priceL;

  const handleAdd = () => {
    onAdd({
      ...product,
      cartItemId: Math.random().toString(36).substring(7),
      size,
      ice,
      sugar,
      quantity,
      price
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <Card className="w-full max-w-md animate-in fade-in zoom-in-95">
        <CardHeader className="relative">
          <button onClick={onClose} className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-900">
            <X className="w-5 h-5" />
          </button>
          <CardTitle className="text-xl">{product.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {product.priceM && (
            <div className="space-y-2">
              <Label>容量</Label>
              <div className="flex gap-2">
                {['M', 'L'].map(s => (
                  <Button 
                    key={s} 
                    variant={size === s ? 'default' : 'outline'} 
                    onClick={() => setSize(s as 'M'|'L')}
                    className="flex-1"
                  >
                    {s === 'M' ? '中杯' : '大杯'}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>冰塊</Label>
            <div className="grid grid-cols-3 gap-2">
              {['正常冰', '少冰', '微冰', '去冰', '完全去冰', '溫', '熱'].map(i => (
                <Button 
                  key={i} 
                  variant={ice === i ? 'default' : 'outline'} 
                  onClick={() => setIce(i)}
                  className="text-xs h-8"
                >
                  {i}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>甜度</Label>
            <div className="grid grid-cols-3 gap-2">
              {['正常糖', '少糖', '半糖', '微糖', '無糖'].map(s => (
                <Button 
                  key={s} 
                  variant={sugar === s ? 'default' : 'outline'} 
                  onClick={() => setSugar(s)}
                  className="text-xs h-8"
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <span className="font-semibold text-lg">${price * quantity}</span>
            <div className="flex items-center gap-4">
              <div className="flex items-center border rounded-md">
                <button 
                  className="p-2 hover:bg-zinc-100 disabled:opacity-50" 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center text-sm font-medium">{quantity}</span>
                <button 
                  className="p-2 hover:bg-zinc-100" 
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <Button onClick={handleAdd}>加入購物車</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CartSidebar({ onClose }: { onClose: () => void }) {
  const { cart, removeFromCart, total, clearCart } = useCart();
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCheckout = async () => {
    if (!customerName) {
      alert("請輸入姓名");
      return;
    }
    if (cart.length === 0) return;

    setIsSubmitting(true);
    try {
      const orderId = Math.random().toString(36).substring(2, 10);
      const orderData = {
        customerName,
        customerPhone,
        items: cart,
        totalAmount: total,
        status: 'pending',
        createdAt: Date.now()
      };
      
      const orderRef = doc(db, 'orders', orderId);
      await setDoc(orderRef, orderData);
      
      alert(`訂單送出成功！您的單號為: ${orderId.toUpperCase()}`);
      clearCart();
      onClose();
    } catch (error) {
       handleFirestoreError(error, OperationType.CREATE, 'orders');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full md:w-[400px] bg-white shadow-xl z-50 flex flex-col animate-in slide-in-from-right">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-semibold text-lg">購物車</h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="text-center text-zinc-500 py-10">購物車是空的</div>
          ) : (
             cart.map(item => (
               <div key={item.cartItemId} className="flex justify-between items-start border-b pb-4 last:border-0">
                 <div>
                   <div className="font-medium">{item.name} x{item.quantity}</div>
                   <div className="text-sm text-zinc-500 mt-1">
                     {item.size === 'M' ? '中杯' : '大杯'} / {item.ice} / {item.sugar}
                   </div>
                   <div className="text-sm font-semibold mt-1">${item.price * item.quantity}</div>
                 </div>
                 <button 
                  onClick={() => removeFromCart(item.cartItemId)}
                  className="text-red-500 text-sm hover:underline"
                 >
                   移除
                 </button>
               </div>
             ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-4 border-t bg-zinc-50 space-y-4">
            <div className="flex justify-between items-center font-bold text-lg">
              <span>總計</span>
              <span>${total}</span>
            </div>
            
            <div className="space-y-3">
              <div>
                <Label>取件人姓名 *</Label>
                <Input 
                  value={customerName} 
                  onChange={e => setCustomerName(e.target.value)} 
                  placeholder="請輸入姓名"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>聯絡電話</Label>
                <Input 
                  value={customerPhone} 
                  onChange={e => setCustomerPhone(e.target.value)} 
                  placeholder="選填"
                  className="mt-1"
                />
              </div>
            </div>

            <Button 
              className="w-full" 
              size="lg" 
              onClick={handleCheckout}
              disabled={isSubmitting || !customerName}
            >
              {isSubmitting ? '送出中...' : '確認結帳'}
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
