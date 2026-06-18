"use client";

import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";

/* ── Menu Data ── */
const MENU_ITEMS = [
  {
    id: "manggoSetupRoti",
    name: "Manggo Setup Roti",
    price: 10000,
    priceLabel: "10K",
    color: "yellow" as const,
    emoji: "🥭🍞",
    person: "Lydia",
    phone: "0878-6698-4662",
  },
  {
    id: "popbreadCaramel",
    name: "Popbread Caramel",
    price: 8000,
    priceLabel: "8K",
    color: "blue" as const,
    emoji: "🍞🍯",
    person: "Natalia",
    phone: "0852-1156-9754",
  },
  {
    id: "sedapRollPaperRice",
    name: "Sedap Roll Paper Rice",
    price: 10000,
    priceLabel: "10K",
    color: "yellow" as const,
    emoji: "🍙✨",
    person: "Selly",
    phone: "0896-2754-2052",
  },
  {
    id: "pudingChocolate",
    name: "Puding Chocolate",
    price: 8000,
    priceLabel: "8K",
    color: "blue" as const,
    emoji: "🍫🍮",
    person: "Huga",
    phone: "0821-4417-1062",
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

/* ── Main Page ── */
export default function HomePage() {
  const [customerName, setCustomerName] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({
    manggoSetupRoti: 0,
    popbreadCaramel: 0,
    sedapRollPaperRice: 0,
    pudingChocolate: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  /* Calculate total price */
  const totalPrice = MENU_ITEMS.reduce(
    (sum, item) => sum + item.price * (quantities[item.id] || 0),
    0
  );

  const totalItems = Object.values(quantities).reduce((a, b) => a + b, 0);

  /* Quantity handlers */
  function increment(id: string) {
    setQuantities((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  }

  function decrement(id: string) {
    setQuantities((prev) => ({
      ...prev,
      [id]: Math.max(0, (prev[id] || 0) - 1),
    }));
  }

  /* Submit order */
  async function handleSubmit() {
    setErrorMsg("");

    if (!customerName.trim()) {
      setErrorMsg("Isi nama kamu dulu ya! 😊");
      return;
    }

    if (totalItems === 0) {
      setErrorMsg("Pilih minimal 1 menu dulu! 🍽️");
      return;
    }

    setIsSubmitting(true);

    try {
      await addDoc(collection(db, "orders"), {
        customerName: customerName.trim(),
        items: { ...quantities },
        totalPrice,
        timestamp: serverTimestamp(),
      });

      setShowSuccess(true);
      setCustomerName("");
      setQuantities({
        manggoSetupRoti: 0,
        popbreadCaramel: 0,
        sedapRollPaperRice: 0,
        pudingChocolate: 0,
      });
    } catch (err) {
      console.error("Error submitting order:", err);
      setErrorMsg("Gagal kirim pesanan. Coba lagi ya! 😢");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="wood-bg">
      <StarsBackground />

      <div className="page-container">
        {/* ── Title ── */}
        <div className="title-section">
          <h1 className="title-main">
            XI - PPLG
            <br />
            WHAT&apos;S <span className="highlight-in">in</span> OUR
            <br />
            BAZAR?
          </h1>
          <div className="title-subtitle">🍴 PRE ORDER FOR 22 JUNI 2026 🍴</div>
        </div>

        {/* ── Checkered Accent ── */}
        <div className="checkered-accent" />

        {/* ── Name Input ── */}
        <div className="name-input-section">
          <div className="name-input-card">
            <label htmlFor="customer-name" className="name-input-label">
              📝 Nama Pemesan
            </label>
            <input
              id="customer-name"
              type="text"
              className="name-input"
              placeholder="Ketik nama kamu di sini..."
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              maxLength={50}
            />
          </div>
        </div>

        {/* ── Menu Grid ── */}
        <div className="menu-grid">
          {MENU_ITEMS.map((item) => (
            <div
              key={item.id}
              className={`sticky-note sticky-note--${item.color}`}
            >
              <span className="note-emoji">{item.emoji}</span>
              <div className="note-name">{item.name}</div>
              <div className="note-person">📞 {item.person} · {item.phone}</div>
              <span className="note-price-badge">Rp {item.priceLabel}</span>

              <div className="quantity-controls">
                <button
                  type="button"
                  className="qty-btn"
                  onClick={() => decrement(item.id)}
                  aria-label={`Kurangi ${item.name}`}
                >
                  −
                </button>
                <span className="qty-display">{quantities[item.id]}</span>
                <button
                  type="button"
                  className="qty-btn"
                  onClick={() => increment(item.id)}
                  aria-label={`Tambah ${item.name}`}
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* ── Total Price ── */}
        <div className="total-section">
          <div className="total-card">
            <div className="total-label">Total Harga</div>
            <div className="total-price">
              Rp {totalPrice.toLocaleString("id-ID")}
            </div>
          </div>
        </div>

        {/* ── Error Message ── */}
        {errorMsg && (
          <p
            style={{
              textAlign: "center",
              color: "#FF8A80",
              fontWeight: 600,
              marginBottom: "1rem",
              animation: "fadeIn 0.3s ease-out",
            }}
          >
            {errorMsg}
          </p>
        )}

        {/* ── Submit ── */}
        <div className="submit-section">
          <button
            type="button"
            className="submit-btn"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner" />
                Mengirim...
              </>
            ) : (
              "🛒 KIRIM PESANAN"
            )}
          </button>
        </div>

        {/* ── Footer ── */}
        <div className="footer">
          <p>© 2026 XI-PPLG Bazar</p>
          <p style={{ marginTop: "0.3rem" }}>
            <Link
              href="/admin"
              style={{
                color: "rgba(255,255,255,0.4)",
                textDecoration: "none",
                fontSize: "0.75rem",
              }}
            >
              Admin Dashboard →
            </Link>
          </p>
        </div>
      </div>

      {/* ── Success Toast ── */}
      {showSuccess && (
        <div className="toast-overlay" onClick={() => setShowSuccess(false)}>
          <div className="toast-card" onClick={(e) => e.stopPropagation()}>
            <span className="toast-emoji">🎉</span>
            <div className="toast-title">Pesanan Terkirim!</div>
            <p className="toast-message">
              Terima kasih sudah pre-order!
              <br />
              Pesanan kamu sudah masuk ke sistem.
              <br />
              Sampai jumpa di bazar 22 Juni! 🎊
            </p>
            <button
              type="button"
              className="toast-btn"
              onClick={() => setShowSuccess(false)}
            >
              Oke, Mantap! 👍
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
