"use client";

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  setDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  type Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";

/* ── Types ── */
interface Order {
  id: string;
  customerName: string;
  customerClass?: string;
  items: Record<string, number>;
  totalPrice: number;
  timestamp: Timestamp | null;
}

export interface Product {
  id: string;
  name: string;
  person: string;
  phone: string;
  emoji: string;
  noteColor: string;
  priceLabel: string;
  price: number;
  imageBase64?: string;
}


/* ── Stars Background ── */
function StarsBackground() {
  return (
    <div className="stars-container">
      {Array.from({ length: 10 }, (_, i) => (
        <span key={i} className="star">
          ★
        </span>
      ))}
    </div>
  );
}

/* ── Format time helper ── */
function formatTime(timestamp: Timestamp | null): string {
  if (!timestamp) return "Baru saja";
  const date = timestamp.toDate();
  return date.toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ── Admin Page ── */
export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  
  // State for Add Product
  const [showAddForm, setShowAddForm] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    person: "",
    phone: "",
    emoji: "🍔",
    noteColor: "orange",
    price: 0,
    priceLabel: "0K",
    imageBase64: "",
  });

  // State for login
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState("");

  /* Real-time listener */
  useEffect(() => {
    if (!isAuthenticated) return;

    // Listen to orders
    const qOrders = query(collection(db, "orders"), orderBy("timestamp", "desc"));
    const unsubscribeOrders = onSnapshot(
      qOrders,
      (snapshot) => {
        const ordersData: Order[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Order[];
        setOrders(ordersData);
        setIsLoading(false);
      },
      (error) => {
        console.error("Firestore orders error:", error);
        setIsLoading(false);
      }
    );

    // Listen to products
    const qProducts = query(collection(db, "products"));
    const unsubscribeProducts = onSnapshot(
      qProducts,
      async (snapshot) => {
        const prodsData: Product[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        setProducts(prodsData);
      },
      (error) => {
        console.error("Firestore products error:", error);
      }
    );

    return () => {
      unsubscribeOrders();
      unsubscribeProducts();
    };
  }, [isAuthenticated]);

  /* Handle Image Upload & Compression */
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>, productId: string) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        // Auto resize to max 500x500 to keep base64 small
        const MAX_SIZE = 500;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);

        const base64String = canvas.toDataURL("image/jpeg", 0.7);

        try {
          const productRef = doc(db, "products", productId);
          await updateDoc(productRef, { imageBase64: base64String });
          alert("Gambar produk berhasil diupdate! 🎉");
        } catch (error) {
          console.error("Error updating image:", error);
          alert("Gagal mengupdate gambar. 😢");
        }
      };
    };
  }

  /* Handle Add Form Image Upload */
  function handleAddFormImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const MAX_SIZE = 500;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);

        const base64String = canvas.toDataURL("image/jpeg", 0.7);
        setNewProduct((prev) => ({ ...prev, imageBase64: base64String }));
      };
    };
  }

  /* Handle Add Product */
  async function handleAddProduct() {
    if (!newProduct.name || !newProduct.price) {
      return alert("Nama dan harga wajib diisi!");
    }
    setIsAdding(true);
    try {
      await addDoc(collection(db, "products"), {
        ...newProduct,
        price: Number(newProduct.price),
      });
      alert("Produk berhasil ditambahkan! 🎉");
      setShowAddForm(false);
      setNewProduct({
        name: "",
        person: "",
        phone: "",
        emoji: "🍔",
        noteColor: "orange",
        price: 0,
        priceLabel: "0K",
        imageBase64: "",
      });
    } catch (error) {
      console.error("Error adding product:", error);
      alert("Gagal menambahkan produk. 😢");
    } finally {
      setIsAdding(false);
    }
  }

  /* Handle Delete Product */
  async function handleDeleteProduct(id: string) {
    if (!confirm("Yakin ingin menghapus produk ini?")) return;
    try {
      await deleteDoc(doc(db, "products", id));
      alert("Produk dihapus! 🗑️");
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Gagal menghapus produk. 😢");
    }
  }

  /* Handle Delete Order */
  async function handleDeleteOrder(id: string) {
    if (!confirm("Yakin ingin menghapus pesanan ini?")) return;
    try {
      await deleteDoc(doc(db, "orders", id));
      alert("Pesanan dihapus! 🗑️");
    } catch (error) {
      console.error("Error deleting order:", error);
      alert("Gagal menghapus pesanan. 😢");
    }
  }

  /* Handle Save Order Edit */
  async function handleSaveOrderEdit() {
    if (!editingOrder) return;
    try {
      const newTotalPrice = products.reduce(
        (sum, item) => sum + item.price * (editingOrder.items[item.id] || 0),
        0
      );

      await updateDoc(doc(db, "orders", editingOrder.id), {
        customerName: editingOrder.customerName,
        customerClass: editingOrder.customerClass || "",
        items: editingOrder.items,
        totalPrice: newTotalPrice,
      });
      alert("Pesanan berhasil diupdate! 🎉");
      setEditingOrder(null);
    } catch (error) {
      console.error("Error updating order:", error);
      alert("Gagal mengupdate pesanan. 😢");
    }
  }

  /* Handle Login */
  function handleLogin() {
    // -------------------------------------------------------------
    // 👇 GANTI "PASSWORD_RAHASIA_ADMIN" DENGAN PASSWORD PILIHANMU 👇
    // -------------------------------------------------------------
    if (passwordInput === "LidyaDya") {
      setIsAuthenticated(true);
      setLoginError("");
    } else {
      setLoginError("Password salah! 😢 Coba lagi.");
    }
  }

  // Jika belum login, tampilkan layar input password
  if (!isAuthenticated) {
    return (
      <div className="wood-bg">
        <StarsBackground />
        <div className="page-container" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
          <div className="name-input-card" style={{ maxWidth: "400px", width: "100%", textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>🔒</div>
            <h2 className="title-main" style={{ fontSize: "1.8rem" }}>Admin Login</h2>
            <input
              type="password"
              className="name-input"
              style={{ marginTop: "1.5rem", marginBottom: "1rem", textAlign: "center" }}
              placeholder="Masukkan Password..."
              value={passwordInput}
              onChange={(e) => {
                setPasswordInput(e.target.value);
                setLoginError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleLogin();
              }}
            />
            {loginError && <p style={{ color: "#FF8A80", marginBottom: "1rem", fontWeight: "600" }}>{loginError}</p>}
            <button
              className="submit-btn"
              style={{ padding: "0.8rem 2rem", fontSize: "1rem", width: "100%" }}
              onClick={handleLogin}
            >
              MASUK
            </button>
            <div style={{ marginTop: "1.5rem" }}>
              <Link href="/" style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.85rem", textDecoration: "none" }}>
                ← Kembali ke Halaman Utama
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* Calculate totals per menu */
  const totals: Record<string, number> = {};
  products.forEach((p) => {
    totals[p.id] = orders.reduce((sum, o) => sum + (o.items?.[p.id] || 0), 0);
  });

  const totalAllItems = Object.values(totals).reduce((a, b) => a + b, 0);
  const totalRevenue = orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);

  return (
    <div className="wood-bg">
      <StarsBackground />

      <div className="page-container">
        {/* ── Back Link ── */}
        <Link href="/" className="back-link">
          ← Kembali ke halaman pesan
        </Link>

        {/* ── Header ── */}
        <div className="admin-header">
          <h1 className="admin-title">
            📊 ADMIN DASHBOARD
            <br />
            BAZAR XI-PPLG
          </h1>
          <p className="admin-subtitle">
            <span className="admin-live-dot" />
            Real-time · Otomatis update
          </p>
        </div>

        {/* ── Checkered Accent ── */}
        <div className="checkered-accent" />

        {/* ── Loading State ── */}
        {isLoading ? (
          <div className="empty-state">
            <span className="spinner" style={{ width: 40, height: 40 }} />
            <p className="empty-text" style={{ marginTop: "1rem" }}>
              Menghubungkan ke database...
            </p>
          </div>
        ) : (
          <>
            {/* ── Summary Grid ── */}
            <div className="summary-grid">
              {products.map((menu) => (
                <div
                  key={menu.id}
                  className={`summary-note summary-note--${menu.noteColor}`}
                >
                  <div className="summary-menu-name">
                    {menu.emoji} {menu.name}
                  </div>
                  <div className="summary-person">
                    👤 {menu.person} · 📞 {menu.phone}
                  </div>
                  <div className="summary-count">
                    {totals[menu.id] || 0}
                    <span className="summary-unit"> porsi</span>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Stats Bar ── */}
            <div className="stats-bar">
              <div className="stat-item">
                <div className="stat-value">{orders.length}</div>
                <div className="stat-label">Total Pesanan</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{totalAllItems}</div>
                <div className="stat-label">Total Porsi</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">
                  Rp {(totalRevenue / 1000).toFixed(0)}K
                </div>
                <div className="stat-label">Total Pendapatan</div>
              </div>
            </div>

            {/* ── Orders List ── */}
            <div className="orders-section">
              <h2 className="orders-title">📋 Pesanan Masuk</h2>

              {orders.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-emoji">📭</span>
                  <p className="empty-text">
                    Belum ada pesanan masuk.
                    <br />
                    Pesanan akan muncul otomatis di sini!
                  </p>
                </div>
              ) : (
                <div className="orders-list">
                  {orders.map((order, index) => (
                    <div
                      key={order.id}
                      className="order-card"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      {editingOrder?.id === order.id ? (
                        <div style={{ padding: "0.5rem" }}>
                          <h3 style={{ fontSize: "1.1rem", marginBottom: "1rem", color: "var(--note-yellow)" }}>✏️ Edit Pesanan</h3>
                          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
                            <input 
                              type="text" 
                              className="name-input" 
                              style={{ flex: 1, padding: "0.6rem", fontSize: "0.9rem" }}
                              value={editingOrder.customerName}
                              onChange={(e) => setEditingOrder({...editingOrder, customerName: e.target.value})}
                              placeholder="Nama Pembeli"
                            />
                            <input 
                              type="text" 
                              className="name-input" 
                              style={{ width: "120px", padding: "0.6rem", fontSize: "0.9rem" }}
                              value={editingOrder.customerClass || ""}
                              onChange={(e) => setEditingOrder({...editingOrder, customerClass: e.target.value})}
                              placeholder="Kelas"
                            />
                          </div>
                          
                          <div style={{ background: "rgba(0,0,0,0.2)", padding: "1rem", borderRadius: "8px", marginBottom: "1rem" }}>
                            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.8rem" }}>Update Jumlah Porsi:</p>
                            {products.map((p) => (
                              <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                                <span style={{ fontSize: "0.9rem" }}>{p.emoji} {p.name}</span>
                                <input 
                                  type="number" 
                                  className="name-input"
                                  style={{ width: "60px", padding: "0.3rem", textAlign: "center", fontSize: "0.9rem" }}
                                  min="0"
                                  value={editingOrder.items[p.id] || 0}
                                  onChange={(e) => setEditingOrder({
                                    ...editingOrder, 
                                    items: { ...editingOrder.items, [p.id]: Number(e.target.value) }
                                  })}
                                />
                              </div>
                            ))}
                          </div>
                          
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <button className="submit-btn" style={{ flex: 1, padding: "0.6rem", fontSize: "0.9rem", borderRadius: "8px" }} onClick={handleSaveOrderEdit}>
                              💾 SIMPAN
                            </button>
                            <button className="submit-btn" style={{ flex: 1, padding: "0.6rem", fontSize: "0.9rem", borderRadius: "8px", background: "var(--red-bright)" }} onClick={() => setEditingOrder(null)}>
                              BATAL
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="order-header">
                            <span className="order-customer">
                              {order.customerName}
                              {order.customerClass && (
                                <span style={{ fontSize: "0.85em", opacity: 0.8, marginLeft: "0.5rem", fontWeight: "normal" }}>
                                  ({order.customerClass})
                                </span>
                              )}
                            </span>
                            <span className="order-time">
                              {formatTime(order.timestamp)}
                            </span>
                          </div>

                          <div className="order-items">
                            {products.map((menu) => {
                              const qty = order.items?.[menu.id] || 0;
                              if (qty === 0) return null;
                              return (
                                <span
                                  key={menu.id}
                                  className={`order-item-tag order-item-tag--${menu.noteColor === "orange" ||
                                    menu.noteColor === "purple"
                                    ? "yellow"
                                    : "blue"
                                    }`}
                                >
                                  {menu.name} × {qty}
                                </span>
                              );
                            })}
                          </div>

                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem" }}>
                            <div className="order-total" style={{ marginTop: 0 }}>
                              Total: Rp {(order.totalPrice || 0).toLocaleString("id-ID")}
                            </div>
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                              <button 
                                onClick={() => setEditingOrder(order)}
                                style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "white", padding: "0.4rem 0.8rem", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem", transition: "all 0.2s" }}
                              >
                                ✏️ Edit
                              </button>
                              <button 
                                onClick={() => handleDeleteOrder(order.id)}
                                style={{ background: "rgba(229,57,53,0.8)", border: "none", color: "white", padding: "0.4rem 0.8rem", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem", transition: "all 0.2s" }}
                              >
                                🗑️ Hapus
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Products Management Section ── */}
            <div className="orders-section" style={{ marginTop: "3rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h2 className="orders-title" style={{ marginBottom: 0 }}>📦 Manajemen Produk (CRUD)</h2>
                <button 
                  className="toast-btn" 
                  style={{ padding: "0.5rem 1rem", fontSize: "0.9rem" }}
                  onClick={() => setShowAddForm(!showAddForm)}
                >
                  {showAddForm ? "Batal" : "➕ Tambah Produk"}
                </button>
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
                Upload gambar untuk masing-masing produk. Gambar akan dikompresi otomatis dan disimpan sebagai Base64.
              </p>

              {/* ── Add Product Form ── */}
              {showAddForm && (
                <div style={{ background: "rgba(255,255,255,0.1)", padding: "1.5rem", borderRadius: "12px", marginBottom: "2rem" }}>
                  <h3 style={{ marginBottom: "1rem", fontSize: "1.2rem", fontWeight: "bold" }}>Tambah Produk Baru</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div>
                      <label className="name-input-label" style={{ fontSize: "0.8rem" }}>Nama Produk</label>
                      <input className="name-input" type="text" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} placeholder="Contoh: Pisang Goreng" />
                    </div>
                    <div>
                      <label className="name-input-label" style={{ fontSize: "0.8rem" }}>Emoji</label>
                      <input className="name-input" type="text" value={newProduct.emoji} onChange={e => setNewProduct({...newProduct, emoji: e.target.value})} placeholder="Contoh: 🍌" />
                    </div>
                    <div>
                      <label className="name-input-label" style={{ fontSize: "0.8rem" }}>Harga (Angka)</label>
                      <input className="name-input" type="number" value={newProduct.price || ""} onChange={e => setNewProduct({...newProduct, price: Number(e.target.value)})} placeholder="Contoh: 5000" />
                    </div>
                    <div>
                      <label className="name-input-label" style={{ fontSize: "0.8rem" }}>Harga Label</label>
                      <input className="name-input" type="text" value={newProduct.priceLabel} onChange={e => setNewProduct({...newProduct, priceLabel: e.target.value})} placeholder="Contoh: 5K" />
                    </div>
                    <div>
                      <label className="name-input-label" style={{ fontSize: "0.8rem" }}>Nama Penjual</label>
                      <input className="name-input" type="text" value={newProduct.person} onChange={e => setNewProduct({...newProduct, person: e.target.value})} placeholder="Contoh: Budi" />
                    </div>
                    <div>
                      <label className="name-input-label" style={{ fontSize: "0.8rem" }}>No HP Penjual</label>
                      <input className="name-input" type="text" value={newProduct.phone} onChange={e => setNewProduct({...newProduct, phone: e.target.value})} placeholder="Contoh: 0812345678" />
                    </div>
                    <div style={{ gridColumn: "1 / -1" }}>
                      <label className="name-input-label" style={{ fontSize: "0.8rem" }}>Warna Tema (Note Color)</label>
                      <select className="name-input" value={newProduct.noteColor} onChange={e => setNewProduct({...newProduct, noteColor: e.target.value})}>
                        <option value="orange">Orange</option>
                        <option value="green">Green</option>
                        <option value="purple">Purple</option>
                        <option value="pink">Pink</option>
                        <option value="yellow">Yellow</option>
                        <option value="blue">Blue</option>
                      </select>
                    </div>
                    <div style={{ gridColumn: "1 / -1" }}>
                      <label className="name-input-label" style={{ fontSize: "0.8rem" }}>Gambar Produk (Opsional)</label>
                      <input className="name-input" type="file" accept="image/*" onChange={handleAddFormImageUpload} />
                      {newProduct.imageBase64 && (
                        <div style={{ marginTop: "0.8rem" }}>
                          <img src={newProduct.imageBase64} alt="Preview" style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "8px", background: "white" }} />
                        </div>
                      )}
                    </div>
                  </div>
                  <button 
                    className="submit-btn" 
                    style={{ marginTop: "1.5rem", padding: "0.8rem 2rem", fontSize: "1rem", width: "100%" }}
                    onClick={handleAddProduct}
                    disabled={isAdding}
                  >
                    {isAdding ? "Menambahkan..." : "SIMPAN PRODUK"}
                  </button>
                </div>
              )}
              
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
                {products.map((product) => (
                  <div key={product.id} className={`summary-note summary-note--${product.noteColor}`} style={{ padding: "1rem", display: "flex", flexDirection: "column", position: "relative" }}>
                    {/* Delete Button */}
                    <button 
                      onClick={() => handleDeleteProduct(product.id)}
                      style={{ position: "absolute", top: "0.5rem", right: "0.5rem", background: "rgba(255,0,0,0.8)", border: "none", borderRadius: "50%", width: "24px", height: "24px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "0.8rem", zIndex: 10 }}
                      title="Hapus Produk"
                    >
                      ✕
                    </button>
                    {product.imageBase64 ? (
                      <img
                        src={product.imageBase64}
                        alt={product.name}
                        style={{ width: "100%", height: "140px", objectFit: "cover", borderRadius: "8px", marginBottom: "0.8rem", background: "white" }}
                      />
                    ) : (
                      <div style={{ width: "100%", height: "140px", background: "rgba(0,0,0,0.15)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "0.8rem", fontSize: "3rem" }}>
                        {product.emoji}
                      </div>
                    )}

                    <h3 style={{ fontSize: "1rem", fontWeight: "bold", marginBottom: "0.2rem", lineHeight: 1.2 }}>{product.name}</h3>
                    <p style={{ fontSize: "0.75rem", opacity: 0.8, marginBottom: "0.8rem", flexGrow: 1 }}>{product.person}</p>

                    <div style={{ marginTop: "auto", background: "rgba(0,0,0,0.2)", padding: "0.5rem", borderRadius: "6px" }}>
                      <label style={{ fontSize: "0.7rem", display: "block", marginBottom: "0.3rem", fontWeight: "bold" }}>Ganti Gambar:</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, product.id)}
                        style={{ fontSize: "0.75rem", width: "100%" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── Footer ── */}
        <div className="footer">
          <p>© 2026 XI-PPLG Bazar · Admin Panel</p>
        </div>
      </div>
    </div>
  );
}
