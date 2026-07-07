import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

// Este componente no usa AppLayout porque es la vista PÚBLICA que verían los clientes escaneando un QR
export default function MenuPreview() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');

  // Ajustes simulados de la carta digital (en un caso real vendrían de un endpoint público de configuracion)
  const settings = {
    themeColor: '#ff6b00',
    welcomeMessage: 'Nuestra Carta',
    logoUrl: ''
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Usamos axios directamente o la instancia pre-configurada (api.js si no requiere auth estricto)
      const resCat = await axios.get('http://localhost:5000/api/categories');
      const resProd = await axios.get('http://localhost:5000/api/products');
      
      setCategories(resCat.data.data || []);
      setProducts(resProd.data.data || []);
    } catch (err) {
      console.error("Error cargando carta pública:", err);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredProducts = () => {
    if (activeCategory === 'all') return products;
    return products.filter(p => p.category === activeCategory);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f8f9fa' }}>
        <div style={{ fontSize: '1.2rem', color: settings.themeColor }}>Cargando Carta...</div>
      </div>
    );
  }

  const filteredProducts = getFilteredProducts();

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', minHeight: '100vh', backgroundColor: '#fff', fontFamily: 'sans-serif', paddingBottom: '80px' }}>
      {/* Header Público */}
      <div style={{ backgroundColor: settings.themeColor, padding: '30px 20px', textAlign: 'center', color: '#fff', borderRadius: '0 0 20px 20px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        {settings.logoUrl ? (
          <img src={settings.logoUrl} alt="Logo" style={{ maxHeight: '80px', marginBottom: '15px' }} />
        ) : (
          <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🍽️</div>
        )}
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>{settings.welcomeMessage}</h1>
      </div>

      {/* Navegación de Categorías (Scroll horizontal) */}
      <div style={{ 
        display: 'flex', 
        overflowX: 'auto', 
        padding: '20px 15px', 
        gap: '10px',
        WebkitOverflowScrolling: 'touch',
        borderBottom: '1px solid #eee'
      }}>
        <button
          onClick={() => setActiveCategory('all')}
          style={{
            padding: '8px 16px',
            borderRadius: '20px',
            border: `1px solid ${activeCategory === 'all' ? settings.themeColor : '#ddd'}`,
            backgroundColor: activeCategory === 'all' ? settings.themeColor : '#fff',
            color: activeCategory === 'all' ? '#fff' : '#666',
            fontWeight: '600',
            whiteSpace: 'nowrap',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          Todo
        </button>
        {categories.map(cat => (
          <button
            key={cat._id}
            onClick={() => setActiveCategory(cat._id)}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: `1px solid ${activeCategory === cat._id ? settings.themeColor : '#ddd'}`,
              backgroundColor: activeCategory === cat._id ? settings.themeColor : '#fff',
              color: activeCategory === cat._id ? '#fff' : '#666',
              fontWeight: '600',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span className={`mdi ${cat.icon || 'mdi-food'}`} style={{ fontSize: '1.1rem' }}></span>
            {cat.name}
          </button>
        ))}
      </div>

      {/* Listado de Productos */}
      <div style={{ padding: '20px 15px' }}>
        {filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#999', padding: '40px 0' }}>
            No hay productos en esta categoría.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {filteredProducts.map(product => (
              <div key={product._id} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                padding: '15px', 
                borderRadius: '12px', 
                backgroundColor: '#fff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                border: '1px solid #f0f0f0'
              }}>
                <div style={{ flex: 1, paddingRight: '15px' }}>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '1.1rem', color: '#333' }}>{product.name}</h3>
                  {product.description && product.description !== product.name && (
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#777', lineHeight: '1.4' }}>{product.description}</p>
                  )}
                  <div style={{ marginTop: '10px', fontSize: '1.1rem', fontWeight: 'bold', color: settings.themeColor }}>
                    €{product.price.toFixed(2)}
                  </div>
                </div>
                {product.image && (
                  <div style={{ width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                    <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Público */}
      <div style={{ textAlign: 'center', padding: '20px', color: '#aaa', fontSize: '0.8rem', borderTop: '1px solid #eee', marginTop: '20px' }}>
        Desarrollado con FAHMA POS
      </div>
    </div>
  );
}
