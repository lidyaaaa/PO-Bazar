"use client";

import { useState, useEffect } from "react";
import { collection, addDoc, serverTimestamp, onSnapshot, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";

/* ── Types ── */
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

// Products will be fetched from Firestore

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
  const [customerGrade, setCustomerGrade] = useState("10");
  const [customerMajor, setCustomerMajor] = useState("PPLG");
  const [products, setProducts] = useState<Product[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  /* Fetch Products from Firestore */
  useEffect(() => {
    const q = query(collection(db, "products"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prodsData: Product[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(prodsData);

      // Initialize quantities state for new products if not exist
      setQuantities(prev => {
        const newQuantities = { ...prev };
        prodsData.forEach(p => {
          if (newQuantities[p.id] === undefined) newQuantities[p.id] = 0;
        });
        return newQuantities;
      });
    });
    return () => unsubscribe();
  }, []);

  /* Calculate total price */
  const totalPrice = products.reduce(
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

  /* Validate and show confirmation modal */
  function handleSubmit() {
    setErrorMsg("");

    if (!customerName.trim()) {
      setErrorMsg("Isi nama kamu dulu ya! 😊");
      return;
    }

    if (totalItems === 0) {
      setErrorMsg("Pilih minimal 1 menu dulu! 🍽️");
      return;
    }

    setShowConfirm(true);
  }

  /* Actual submit to Firestore */
  async function executeSubmit() {
    setIsSubmitting(true);

    const customerClass = `${customerGrade} ${customerMajor === "MPLB1" ? "MPLB 1" : customerMajor === "MPLB2" ? "MPLB 2" : customerMajor}`;

    try {
      await addDoc(collection(db, "orders"), {
        customerName: customerName.trim(),
        customerClass,
        items: { ...quantities },
        totalPrice,
        timestamp: serverTimestamp(),
      });

      setShowSuccess(true);
      setCustomerName("");
      // Reset quantities
      setQuantities(prev => {
        const reset: Record<string, number> = {};
        Object.keys(prev).forEach(k => reset[k] = 0);
        return reset;
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
          <div className="title-subtitle">🍴 PRE ORDER FOR 23 JUNI 2026 🍴</div>
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

            <div style={{ display: "flex", gap: "10px", marginTop: "1rem" }}>
              <div style={{ flex: 1 }}>
                <label className="name-input-label" style={{ fontSize: "0.9rem" }}>Pilih Kelas</label>
                <select
                  className="name-input"
                  style={{ marginTop: "0.5rem" }}
                  value={customerGrade}
                  onChange={(e) => setCustomerGrade(e.target.value)}
                >
                  <option value="10">10</option>
                  <option value="11">11</option>
                  <option value="12">12</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label className="name-input-label" style={{ fontSize: "0.9rem" }}>Pilih Jurusan</label>
                <select
                  className="name-input"
                  style={{ marginTop: "0.5rem" }}
                  value={customerMajor}
                  onChange={(e) => setCustomerMajor(e.target.value)}
                >
                  <option value="PPLG">PPLG</option>
                  <option value="MPLB1">MPLB 1</option>
                  <option value="MPLB2">MPLB 2</option>
                  <option value="BR">BR</option>
                  <option value="AKL">AKL</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* ── Menu Grid ── */}
        <div className="menu-grid">
          {products.map((item) => (
            <div
              key={item.id}
              className={`sticky-note summary-note--${item.noteColor}`}
              style={{ display: "flex", flexDirection: "column" }}
            >
              {item.imageBase64 ? (
                <img
                  src={item.imageBase64}
                  alt={item.name}
                  style={{ width: "100%", height: "140px", objectFit: "cover", borderRadius: "8px", marginBottom: "0.8rem", background: "white" }}
                />
              ) : (
                <div style={{ width: "100%", height: "140px", background: "rgba(0,0,0,0.15)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "0.8rem", fontSize: "3rem" }}>
                  {item.emoji}
                </div>
              )}

              <div className="note-name">{item.name}</div>
              <div className="note-person">📞 {item.person} · {item.phone}</div>
              <span className="note-price-badge" style={{ background: "rgba(0,0,0,0.3)", color: "white", width: "fit-content" }}>Rp {item.priceLabel}</span>

              <div className="quantity-controls" style={{ marginTop: "auto", paddingTop: "0.5rem" }}>
                <button
                  type="button"
                  className="qty-btn"
                  style={{ background: "rgba(255,255,255,0.2)", color: "inherit" }}
                  onClick={() => decrement(item.id)}
                  aria-label={`Kurangi ${item.name}`}
                >
                  −
                </button>
                <span className="qty-display">{quantities[item.id]}</span>
                <button
                  type="button"
                  className="qty-btn"
                  style={{ background: "rgba(255,255,255,0.2)", color: "inherit" }}
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

      {/* ── Confirmation Modal ── */}
      {showConfirm && (
        <div className="toast-overlay" onClick={() => setShowConfirm(false)}>
          <div className="toast-card" style={{ maxWidth: "420px", color: "var(--text-dark)" }} onClick={(e) => e.stopPropagation()}>
            <span className="toast-emoji">🤔</span>
            <div className="toast-title" style={{ color: "var(--wood-dark)" }}>Konfirmasi Pesanan</div>
            
            <div style={{ textAlign: "left", margin: "1.5rem 0", background: "rgba(0,0,0,0.03)", padding: "1.2rem", borderRadius: "12px", border: "1px dashed rgba(0,0,0,0.1)", fontSize: "0.95rem" }}>
              <div style={{ marginBottom: "0.6rem" }}>
                <span style={{ color: "#666" }}>Nama Pemesan:</span>
                <div style={{ fontWeight: "700", fontSize: "1.1rem" }}>{customerName}</div>
              </div>
              <div style={{ marginBottom: "0.8rem" }}>
                <span style={{ color: "#666" }}>Kelas:</span>
                <div style={{ fontWeight: "700" }}>{customerGrade} {customerMajor === "MPLB1" ? "MPLB 1" : customerMajor === "MPLB2" ? "MPLB 2" : customerMajor}</div>
              </div>
              
              <div style={{ borderTop: "1px solid rgba(0,0,0,0.1)", paddingTop: "0.8rem" }}>
                <span style={{ color: "#666", fontWeight: "600", display: "block", marginBottom: "0.4rem" }}>Menu yang dipesan:</span>
                <ul style={{ listStyleType: "none", paddingLeft: 0 }}>
                  {products.map((p) => {
                    const qty = quantities[p.id] || 0;
                    if (qty === 0) return null;
                    return (
                      <li key={p.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem", fontWeight: "500" }}>
                        <span>{p.emoji} {p.name}</span>
                        <span>{qty} Porsi</span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div style={{ borderTop: "1px solid rgba(0,0,0,0.1)", paddingTop: "0.8rem", marginTop: "0.8rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: "700" }}>Total Bayar:</span>
                <span style={{ fontWeight: "800", fontSize: "1.3rem", color: "var(--wood-dark)" }}>Rp {totalPrice.toLocaleString("id-ID")}</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                className="toast-btn"
                style={{ flex: 1, padding: "0.7rem 1rem" }}
                onClick={() => {
                  setShowConfirm(false);
                  executeSubmit();
                }}
              >
                Ya, Kirim! 👍
              </button>
              <button
                type="button"
                className="toast-btn"
                style={{ flex: 1, padding: "0.7rem 1rem", background: "linear-gradient(135deg, #757575, #424242)", boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)" }}
                onClick={() => setShowConfirm(false)}
              >
                Cek Lagi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
