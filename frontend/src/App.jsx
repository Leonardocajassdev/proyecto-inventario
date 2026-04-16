import { useEffect, useState } from "react";
import "./App.css";
import { FaTrash } from "react-icons/fa";

const API = import.meta.env.VITE_API_URL;

function App() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [type, setType] = useState("IN");
  const [quantity, setQuantity] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [minStock, setMinStock] = useState("");

  // 🔄 Obtener productos
  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API}/products`);
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // 🟢 Crear producto
  const handleCreateProduct = async () => {
    if (!name || !minStock) {
      alert("Nombre y stock mínimo son obligatorios");
      return;
    }

    try {
      const res = await fetch(`${API}/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
          minStock: Number(minStock),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error);
        return;
      }

      alert("Producto creado");

      setName("");
      setDescription("");
      setMinStock("");

      fetchProducts();
    } catch (error) {
      console.error(error);
    }
  };

  // 🗑️ Eliminar producto
  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar producto?")) return;

    try {
      const res = await fetch(`${API}/products/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error);
        return;
      }

      alert("Producto eliminado");
      fetchProducts();
    } catch (error) {
      console.error(error);
    }
  };

  // 🔵 Crear movimiento
  const handleMovement = async () => {
    if (!selectedProduct || quantity <= 0) {
      alert("Selecciona producto y cantidad válida");
      return;
    }

    try {
      const res = await fetch(`${API}/movements`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: selectedProduct,
          type,
          quantity: Number(quantity),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error);
        return;
      }

      alert("Movimiento registrado");

      setSelectedProduct("");
      setQuantity("");
      setType("IN");

      fetchProducts();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="container">
      <h1 style={{ textAlign: "center" }}>Inventario</h1>

      <div className="layout">

        {/* 🟢 COLUMNA IZQUIERDA */}
        <div className="left">

          <div className="card">
            <h2>Crear producto</h2>

            <input
              className="input"
              placeholder="Nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <input
              className="input"
              placeholder="Descripción"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <input
              className="input"
              type="number"
              placeholder="Stock mínimo"
              value={minStock}
              onChange={(e) => setMinStock(e.target.value)}
            />

            <button className="btn btn-green" onClick={handleCreateProduct}>
              Crear producto
            </button>
          </div>

          <div className="card">
            <h2>Registrar movimiento</h2>

            <select
              className="input"
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
            >
              <option value="">Selecciona producto</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <select
              className="input"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="IN">Entrada</option>
              <option value="OUT">Salida</option>
            </select>

            <input
              className="input"
              type="number"
              value={quantity}
              placeholder="Cantidad"
              onChange={(e) => setQuantity(e.target.value)}
            />

            <button
              className="btn btn-blue"
              onClick={handleMovement}
              disabled={!selectedProduct || quantity <= 0}
            >
              Registrar
            </button>
          </div>

        </div>

        {/* 📦 COLUMNA DERECHA */}
        <div className="right">
          <div className="card">
            <h2>Productos</h2>

            {products.length === 0 ? (
              <p>No hay productos</p>
            ) : (
              products.map((p) => (
                <div key={p.id} className="product-card">
                  <div>
                    <h3>{p.name}</h3>
                    <p>{p.description}</p>
                    <p><strong>Stock:</strong> {p.stock ?? 0}</p>

                    {p.isLowStock && (
                      <p className="low-stock">
                        ⚠️ Stock bajo (mínimo: {p.minStock})
                      </p>
                    )}
                  </div>

                  <button
                    className="btn-icon"
                    onClick={() => handleDelete(p.id)}
                  >
                    <FaTrash />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;