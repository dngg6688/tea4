import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, setDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { Order } from '../types';
import { initialProducts } from '../data/products';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, LogOut, CheckCircle, Clock } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { cn } from '../lib/utils';

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [user, setUser] = useState(auth.currentUser);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((u) => {
      setUser(u);
    });
    return unsubAuth;
  }, []);

  useEffect(() => {
    if (!user) return;
    
    // Listen to orders
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const results: Order[] = [];
      snapshot.forEach(d => {
        results.push({ id: d.id, ...d.data() } as Order);
      });
      setOrders(results);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'orders');
    });
    
    return unsub;
  }, [user]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.error(e);
    }
  };

  const updateStatus = async (orderId: string, status: Order['status']) => {
    if (!orderId) return;
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status,
        updatedAt: Date.now()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const seedProducts = async () => {
    if (!confirm('This will seed the database with initial products. Continue?')) return;
    try {
      for (const p of initialProducts) {
        const pRef = doc(collection(db, 'products'));
        await setDoc(pRef, p);
      }
      alert('Products seeded successfully!');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'products');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-zinc-50">
         <Card className="w-full max-w-sm">
           <CardHeader>
             <CardTitle className="text-center text-2xl font-bold">店員後台登入</CardTitle>
           </CardHeader>
           <CardContent className="flex flex-col gap-4">
             <Button onClick={handleLogin}>登入 Google 帳號以管理訂單</Button>
             <Button variant="ghost" onClick={() => navigate('/')}>回點單頁面</Button>
           </CardContent>
         </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-bold text-xl tracking-tight">訂單管理系統</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-500 mr-4">{user.email}</span>
            <Button variant="outline" onClick={seedProducts}>
              <RefreshCw className="w-4 h-4 mr-2" />
              初始化菜單
            </Button>
            <Button variant="ghost" size="icon" onClick={() => signOut(auth)} title="登出">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-8 w-full">
        {orders.length === 0 ? (
          <div className="text-center py-20 text-zinc-500">
            <p>目前尚無訂單</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {orders.map(order => (
              <OrderCard key={order.id} order={order} onUpdateStatus={(status) => updateStatus(order.id!, status)} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function OrderCard({ order, onUpdateStatus }: { key?: React.Key, order: Order, onUpdateStatus: (s: Order['status']) => void }) {
  const statusColors = {
    pending: "bg-yellow-500",
    preparing: "bg-blue-500",
    completed: "bg-green-500",
    cancelled: "bg-zinc-500"
  };
  
  const statusLabels = {
    pending: "待處理",
    preparing: "製作中",
    completed: "已完成",
    cancelled: "已取消"
  };

  return (
    <Card className={cn(
      "flex flex-col transition-opacity", 
      (order.status === 'completed' || order.status === 'cancelled') && "opacity-60"
    )}>
      <CardHeader className="pb-2 border-b bg-zinc-50/50">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">單號: {(order.id || '').toUpperCase().slice(-6)}</CardTitle>
            <p className="text-sm text-zinc-500 mt-1">{new Date(order.createdAt).toLocaleString()}</p>
          </div>
          <Badge className={statusColors[order.status]}>{statusLabels[order.status]}</Badge>
        </div>
        <div className="mt-2 font-medium">顧客: {order.customerName} {order.customerPhone && <span className="text-sm text-zinc-500">({order.customerPhone})</span>}</div>
      </CardHeader>
      
      <CardContent className="flex-1 pt-4">
        <ul className="space-y-3">
          {order.items.map((item, idx) => (
            <li key={idx} className="text-sm flex justify-between">
              <div>
                <span className="font-semibold">{item.name}</span> <span className="text-zinc-500">x{item.quantity}</span>
                <div className="text-xs text-zinc-500">
                  {item.size === 'M' ? '中' : '大'} / {item.ice} / {item.sugar}
                </div>
              </div>
              <div className="font-medium">${item.price * item.quantity}</div>
            </li>
          ))}
        </ul>
        <div className="flex justify-between items-center mt-4 pt-4 border-t font-bold text-lg">
          <span>總計</span>
          <span>${order.totalAmount}</span>
        </div>
      </CardContent>
      
      <CardFooter className="pt-0 flex gap-2">
         {order.status === 'pending' && (
           <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={() => onUpdateStatus('preparing')}>
             <Clock className="w-4 h-4 mr-2" /> 開始製作
           </Button>
         )}
         {order.status === 'preparing' && (
           <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => onUpdateStatus('completed')}>
             <CheckCircle className="w-4 h-4 mr-2" /> 完成訂單
           </Button>
         )}
         {(order.status === 'pending' || order.status === 'preparing') && (
           <Button variant="outline" className="flex-none px-3 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => onUpdateStatus('cancelled')}>
             取消
           </Button>
         )}
      </CardFooter>
    </Card>
  );
}
