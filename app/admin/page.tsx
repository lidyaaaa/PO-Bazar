"use client";

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  type Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";

/* ── Types ── */
interface Order {
  id: string;
  customerName: string;
  items: {
    manggoSetupRoti: number;
    popbreadCaramel: number;
    sedapRollPaperRice: number;
    pudingChocolate: number;
  };
  totalPrice: number;
  timestamp: Timestamp | null;
}

/* ── Menu Meta ── */
const MENU_META = [
  {
    id: "manggoSetupRoti" as const,
    name: "Manggo Setup Roti",
    person: "Lydia",
    phone: "0878-6698-4662",
    emoji: "🥭🍞",
    noteColor: "orange",
    priceLabel: "10K",
  },
  {
    id: "popbreadCaramel" as const,
    name: "Popbread Caramel",
    person: "Natalia",
    phone: "0852-1156-9754",
    emoji: "🍞🍯",
    noteColor: "green",
    priceLabel: "8K",
  },
  {
    id: "sedapRollPaperRice" as const,
    name: "Sedap Roll Paper Rice",
    person: "Selly",
    phone: "0896-2754-2052",
    emoji: "🍙✨",
    noteColor: "purple",
    priceLabel: "10K",
  },
  {
    id: "pudingChocolate" as const,
    name: "Puding Chocolate",
    person: "Huga",
    phone: "0821-4417-1062",
    emoji: "🍫🍮",
    noteColor: "pink",
    priceLabel: "8K",
  },
];

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
  const [isLoading, setIsLoading] = useState(true);

  /* Real-time listener */
  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("timestamp", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const ordersData: Order[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Order[];
        setOrders(ordersData);
        setIsLoading(false);
      },
      (error) => {
        console.error("Firestore onSnapshot error:", error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  /* Calculate totals per menu */
  const totals = {
    manggoSetupRoti: orders.reduce(
      (sum, o) => sum + (o.items?.manggoSetupRoti || 0),
      0
    ),
    popbreadCaramel: orders.reduce(
      (sum, o) => sum + (o.items?.popbreadCaramel || 0),
      0
    ),
    sedapRollPaperRice: orders.reduce(
      (sum, o) => sum + (o.items?.sedapRollPaperRice || 0),
      0
    ),
    pudingChocolate: orders.reduce(
      (sum, o) => sum + (o.items?.pudingChocolate || 0),
      0
    ),
  };

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
              {MENU_META.map((menu) => (
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
                    {totals[menu.id]}
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
                      <div className="order-header">
                        <span className="order-customer">
                          {order.customerName}
                        </span>
                        <span className="order-time">
                          {formatTime(order.timestamp)}
                        </span>
                      </div>

                      <div className="order-items">
                        {MENU_META.map((menu) => {
                          const qty = order.items?.[menu.id] || 0;
                          if (qty === 0) return null;
                          return (
                            <span
                              key={menu.id}
                              className={`order-item-tag order-item-tag--${
                                menu.noteColor === "orange" ||
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

                      <div className="order-total">
                        Total: Rp{" "}
                        {(order.totalPrice || 0).toLocaleString("id-ID")}
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
