import { useEffect, useState } from "react";
import { FaTrash } from "react-icons/fa";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

/* ─── Notificación toast ─────────────────────────── */
function Toast({ msg, type, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, [onDone]);

  const colors = {
    success: { bg: "#0f6e56", bar: "#5dcaa5" },
    error:   { bg: "#993c1d", bar: "#f0997b" },
    warn:    { bg: "#854f0b", bar: "#ef9f27" },
  };
  const c = colors[type] || colors.success;

  return (
    <div style={{
      position: "fixed", bottom: 28, right: 28, zIndex: 9999,
      background: c.bg, color: "#fff",
      padding: "12px 20px 14px",
      borderRadius: 10, minWidth: 220, maxWidth: 320,
      fontFamily: "'DM Mono', monospace",
      fontSize: 13, letterSpacing: "0.01em",
      boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
      animation: "slideUp .22s ease",
    }}>
      {msg}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        height: 3, borderRadius: "0 0 10px 10px",
        background: c.bar,
        animation: "shrink 2.8s linear forwards",
      }} />
    </div>
  );
}

/* ─── Barra de stock visual ───────────────────── */
function StockBar({ stock, minStock }) {
  const max = Math.max(minStock * 2.5, stock + 1, 10);
  const pct  = Math.min((stock / max) * 100, 100);
  const low  = stock < minStock;
  const zero = stock === 0;
  const color = zero ? "#e24b4a" : low ? "#ef9f27" : "#1d9e75";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
      <div style={{
        flex: 1, height: 5, borderRadius: 3,
        background: "rgba(255,255,255,0.08)",
      }}>
        <div style={{
          width: `${pct}%`, height: "100%",
          borderRadius: 3, background: color,
          transition: "width .5s ease",
        }} />
      </div>
      <span style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: 13, fontWeight: 700,
        color, minWidth: 28, textAlign: "right",
      }}>
        {stock}
      </span>
    </div>
  );
}

/* ─── Chip de alerta ─────────────────────────────── */
function AlertChip({ minStock }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      background: "rgba(239,159,39,0.15)",
      color: "#ef9f27", border: "1px solid rgba(239,159,39,0.3)",
      borderRadius: 4, padding: "2px 8px",
      fontSize: 11, fontFamily: "'DM Mono', monospace",
      letterSpacing: "0.05em", fontWeight: 700,
    }}>
      BAJO MIN {minStock}
    </span>
  );
}

/* ─── Toggle tipo movimiento ─────────────────────── */
function TypeToggle({ value, onChange }) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "1fr 1fr",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 8, overflow: "hidden",
    }}>
      {[["IN", "↑ Entrada"], ["OUT", "↓ Salida"]].map(([v, label]) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          style={{
            border: "none", cursor: "pointer",
            padding: "9px 0",
            fontFamily: "'DM Mono', monospace",
            fontSize: 12, fontWeight: 700, letterSpacing: "0.06em",
            transition: "all .15s",
            background: value === v
              ? (v === "IN" ? "rgba(29,158,117,0.25)" : "rgba(226,75,74,0.2)")
              : "transparent",
            color: value === v
              ? (v === "IN" ? "#5dcaa5" : "#f09595")
              : "rgba(255,255,255,0.35)",
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

/* ─── Campo de formulario ────────────────────────── */
function Field({ label, children }) {
  return (
    <div>
      <label style={{
        display: "block",
        fontFamily: "'DM Mono', monospace",
        fontSize: 10, letterSpacing: "0.12em",
        color: "rgba(255,255,255,0.35)",
        textTransform: "uppercase", marginBottom: 6,
      }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%", boxSizing: "border-box",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 7, color: "#f0ede8",
  fontFamily: "'DM Mono', monospace",
  fontSize: 13, padding: "9px 12px",
  outline: "none", transition: "border .15s",
};

const selectStyle = { ...inputStyle, cursor: "pointer" };

/* ══════════════════════════════════════════════════
   APP PRINCIPAL
══════════════════════════════════════════════════ */
export default function App() {
  const [products, setProducts]           = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [type, setType]                   = useState("IN");
  const [quantity, setQuantity]           = useState("");
  const [name, setName]                   = useState("");
  const [description, setDescription]     = useState("");
  const [minStock, setMinStock]           = useState("");
  const [toast, setToast]                 = useState(null);

  const notify = (msg, type = "success") => setToast({ msg, type });

  const fetchProducts = async () => {
    try {
      const res  = await fetch(`${API}/products`);
      const data = await res.json();
      setProducts(data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleCreateProduct = async () => {
    if (!name || !minStock) { notify("Nombre y stock mínimo son obligatorios", "warn"); return; }
    try {
      const res  = await fetch(`${API}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, minStock: Number(minStock) }),
      });
      const data = await res.json();
      if (!res.ok) { notify(data.error, "error"); return; }
      notify("Producto creado");
      setName(""); setDescription(""); setMinStock("");
      fetchProducts();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar producto?")) return;
    try {
      const res = await fetch(`${API}/products/${id}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json(); notify(d.error, "error"); return; }
      notify("Producto eliminado", "warn");
      fetchProducts();
    } catch (e) { console.error(e); }
  };

  const handleMovement = async () => {
    if (!selectedProduct || quantity <= 0) { notify("Selecciona producto y cantidad válida", "warn"); return; }
    try {
      const res  = await fetch(`${API}/movements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: selectedProduct, type, quantity: Number(quantity) }),
      });
      const data = await res.json();
      if (!res.ok) { notify(data.error, "error"); return; }
      notify("Movimiento registrado");
      setSelectedProduct(""); setQuantity(""); setType("IN");
      fetchProducts();
    } catch (e) { console.error(e); }
  };

  const lowCount  = products.filter(p => p.isLowStock).length;
  const zeroCount = products.filter(p => (p.stock ?? 0) === 0).length;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0d0f0e; color: #f0ede8; min-height: 100vh; }
        ::selection { background: rgba(29,158,117,0.35); }
        input:focus, select:focus { border-color: rgba(29,158,117,0.6) !important; box-shadow: 0 0 0 3px rgba(29,158,117,0.12); }
        input::placeholder { color: rgba(240,237,232,0.2); }
        @keyframes slideUp { from { transform: translateY(12px); opacity: 0; } to { transform: none; opacity: 1; } }
        @keyframes shrink  { from { width: 100%; } to { width: 0%; } }
        @keyframes fadeIn  { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        .product-row { animation: fadeIn .25s ease both; }
        .product-row:hover { background: rgba(255,255,255,0.03); }
        .del-btn { opacity: 0; transition: opacity .15s; }
        .product-row:hover .del-btn { opacity: 1; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
      `}</style>

      {toast && (
        <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />
      )}

      {/* ── HEADER ── */}
      <header style={{
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        padding: "0 32px",
        height: 56,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "rgba(255,255,255,0.02)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 8, height: 8, borderRadius: "50%",
            background: "#1d9e75",
            boxShadow: "0 0 10px #1d9e75",
            animation: "pulse 2s infinite",
          }} />
          <span style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 12, letterSpacing: "0.15em",
            color: "rgba(240,237,232,0.55)",
          }}>
            INVENTARIO
          </span>
        </div>

        <div style={{ display: "flex", gap: 20 }}>
          {[
            { label: "Total", val: products.length, color: "rgba(240,237,232,0.55)" },
            { label: "Bajo mín.", val: lowCount,  color: lowCount  ? "#ef9f27" : "rgba(240,237,232,0.3)" },
            { label: "Sin stock", val: zeroCount, color: zeroCount ? "#e24b4a" : "rgba(240,237,232,0.3)" },
          ].map(({ label, val, color }) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 16, fontWeight: 500, color }}>
                {val}
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: "0.1em", color: "rgba(240,237,232,0.3)" }}>
                {label.toUpperCase()}
              </div>
            </div>
          ))}
        </div>
      </header>

      {/* ── LAYOUT ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "320px 1fr",
        gap: 0,
        minHeight: "calc(100vh - 56px)",
      }}>

        {/* ─ SIDEBAR ─ */}
        <aside style={{
          borderRight: "1px solid rgba(255,255,255,0.07)",
          padding: "28px 24px",
          display: "flex", flexDirection: "column", gap: 32,
          background: "rgba(255,255,255,0.015)",
        }}>

          {/* Crear producto */}
          <section>
            <p style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 10, letterSpacing: "0.12em",
              color: "rgba(240,237,232,0.3)",
              textTransform: "uppercase", marginBottom: 16,
            }}>
              Nuevo producto
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Field label="Nombre *">
                <input style={inputStyle} placeholder="Ej. Laptop Dell XPS" value={name}
                  onChange={e => setName(e.target.value)} />
              </Field>
              <Field label="Descripción">
                <input style={inputStyle} placeholder="Descripción opcional" value={description}
                  onChange={e => setDescription(e.target.value)} />
              </Field>
              <Field label="Stock mínimo *">
                <input style={inputStyle} type="number" placeholder="0" value={minStock}
                  onChange={e => setMinStock(e.target.value)} />
              </Field>

              <button onClick={handleCreateProduct} style={{
                width: "100%", padding: "10px 0",
                background: "#1d9e75", border: "none",
                borderRadius: 8, color: "#04342c",
                fontFamily: "'DM Mono', monospace",
                fontSize: 12, fontWeight: 500,
                letterSpacing: "0.08em", cursor: "pointer",
                transition: "filter .15s",
              }}
                onMouseEnter={e => e.target.style.filter = "brightness(1.12)"}
                onMouseLeave={e => e.target.style.filter = "none"}
              >
                CREAR PRODUCTO
              </button>
            </div>
          </section>

          <div style={{ height: 1, background: "rgba(255,255,255,0.07)" }} />

          {/* Registrar movimiento */}
          <section>
            <p style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 10, letterSpacing: "0.12em",
              color: "rgba(240,237,232,0.3)",
              textTransform: "uppercase", marginBottom: 16,
            }}>
              Movimiento
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Field label="Tipo">
                <TypeToggle value={type} onChange={setType} />
              </Field>
              <Field label="Producto">
                <select style={selectStyle} value={selectedProduct}
                  onChange={e => setSelectedProduct(e.target.value)}>
                  <option value="">Seleccionar...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.stock ?? 0})
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Cantidad">
                <input style={inputStyle} type="number" placeholder="0" value={quantity}
                  onChange={e => setQuantity(e.target.value)} />
              </Field>

              {/* Preview del stock resultante */}
              {selectedProduct && quantity > 0 && (() => {
                const prod   = products.find(p => String(p.id) === String(selectedProduct));
                const curr   = prod?.stock ?? 0;
                const result = type === "IN" ? curr + Number(quantity) : curr - Number(quantity);
                const invalid = type === "OUT" && result < 0;
                return (
                  <div style={{
                    background: invalid ? "rgba(226,75,74,0.1)" : "rgba(29,158,117,0.08)",
                    border: `1px solid ${invalid ? "rgba(226,75,74,0.25)" : "rgba(29,158,117,0.2)"}`,
                    borderRadius: 7, padding: "8px 12px",
                    fontFamily: "'DM Mono', monospace", fontSize: 12,
                    color: invalid ? "#f09595" : "#5dcaa5",
                  }}>
                    Stock resultante:{" "}
                    <strong>{invalid ? "Insuficiente" : result}</strong>
                  </div>
                );
              })()}

              <button
                onClick={handleMovement}
                disabled={!selectedProduct || quantity <= 0}
                style={{
                  width: "100%", padding: "10px 0",
                  background: type === "IN"
                    ? "rgba(29,158,117,0.18)"
                    : "rgba(226,75,74,0.18)",
                  border: `1px solid ${type === "IN" ? "rgba(29,158,117,0.4)" : "rgba(226,75,74,0.4)"}`,
                  borderRadius: 8,
                  color: type === "IN" ? "#5dcaa5" : "#f09595",
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 12, fontWeight: 700,
                  letterSpacing: "0.08em", cursor: "pointer",
                  opacity: (!selectedProduct || quantity <= 0) ? 0.4 : 1,
                  transition: "all .15s",
                }}
              >
                REGISTRAR {type === "IN" ? "ENTRADA" : "SALIDA"}
              </button>
            </div>
          </section>
        </aside>

        {/* ─ LISTA PRODUCTOS ─ */}
        <main style={{ padding: "28px 32px", overflow: "auto" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 20 }}>
            <h1 style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 26, fontWeight: 800,
              color: "#f0ede8", letterSpacing: "-0.02em",
            }}>
              Productos
            </h1>
            <span style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 11, color: "rgba(240,237,232,0.3)",
            }}>
              {products.length} en total
            </span>
          </div>

          {products.length === 0 ? (
            <div style={{
              textAlign: "center", padding: "80px 0",
              color: "rgba(240,237,232,0.2)",
              fontFamily: "'DM Mono', monospace", fontSize: 13,
            }}>
              <div style={{ fontSize: 36, marginBottom: 16, opacity: 0.3 }}>[ ]</div>
              Sin productos
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {products.map((p, i) => {
                const stock = p.stock ?? 0;
                return (
                  <div
                    key={p.id}
                    className="product-row"
                    style={{
                      display: "flex", alignItems: "center",
                      padding: "14px 16px",
                      borderRadius: 8,
                      border: "1px solid rgba(255,255,255,0.05)",
                      gap: 16, cursor: "default",
                      animationDelay: `${i * 0.04}s`,
                    }}
                  >
                    {/* Indicador de estado */}
                    <div style={{
                      width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
                      background: stock === 0 ? "#e24b4a" : p.isLowStock ? "#ef9f27" : "#1d9e75",
                      boxShadow: `0 0 6px ${stock === 0 ? "#e24b4a" : p.isLowStock ? "#ef9f27" : "#1d9e75"}`,
                    }} />

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        <h3 style={{
                          fontFamily: "'Syne', sans-serif",
                          fontSize: 14, fontWeight: 700,
                          color: "#f0ede8",
                          margin: 0,
                        }}>
                          {p.name}
                        </h3>
                        {p.isLowStock && <AlertChip minStock={p.minStock} />}
                      </div>
                      {p.description && (
                        <p style={{
                          fontSize: 12, color: "rgba(240,237,232,0.35)",
                          marginTop: 2, fontFamily: "'DM Mono', monospace",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                          {p.description}
                        </p>
                      )}
                      <StockBar stock={stock} minStock={p.minStock ?? 0} />
                    </div>

                    {/* Stock grande */}
                    <div style={{ textAlign: "right", flexShrink: 0, marginRight: 8 }}>
                      <div style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 22, fontWeight: 500,
                        color: stock === 0 ? "#e24b4a" : p.isLowStock ? "#ef9f27" : "rgba(240,237,232,0.55)",
                        lineHeight: 1,
                      }}>
                        {stock}
                      </div>
                      <div style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 9, letterSpacing: "0.1em",
                        color: "rgba(240,237,232,0.25)", marginTop: 2,
                      }}>
                        UNID
                      </div>
                    </div>

                    {/* Botón eliminar */}
                    <button
                      className="del-btn"
                      onClick={() => handleDelete(p.id)}
                      style={{
                        background: "none", border: "none",
                        color: "#e24b4a", cursor: "pointer",
                        padding: "6px", borderRadius: 6,
                        display: "flex", alignItems: "center",
                        transition: "background .15s",
                        flexShrink: 0,
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(226,75,74,0.12)"}
                      onMouseLeave={e => e.currentTarget.style.background = "none"}
                      title="Eliminar producto"
                    >
                      <FaTrash size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </>
  );
}