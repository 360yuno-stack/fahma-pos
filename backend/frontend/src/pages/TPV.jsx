import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TPV.css';

const API_URL = 'http://localhost:5000/api';

const TPV = () => {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [cart, setCart] = useState([]);
  const [observations, setObservations] = useState('');

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API_URL}/categories`);
      setCategories(res.data.data || []);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/products`, { 
        headers: { 'x-auth-token': token }
      });
      setProducts(res.data.data || []);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const addToCart = (product) => {
    const existing = cart.find(item => item._id === product._id);
    if (existing) {
      setCart(cart.map(item => 
        item._id === product._id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item._id !== productId));
  };

  const updateQuantity = (productId, newQty) => {
    if (newQty <= 0) {
      removeFromCart(productId);
    } else {
      setCart(cart.map(item =>
        item._id === productId ? { ...item, quantity: newQty } : item
      ));
    }
  };

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2);
  };

  const filteredProducts = selectedCategory
    ? products.filter(p => p.category === selectedCategory.name)
    : products;

  return (
    <div className="tpv-container">
      <div className="tpv-left">
        <div className="categories-grid">
          {categories.map(cat => (
            <div
              key={cat._id}
              className={`category-card ${selectedCategory?._id === cat._id ? 'active' : ''}`}
              style={{ backgroundColor: cat.color }}
              onClick={() => setSelectedCategory(cat)}
            >
              <div className="category-icon">{cat.icon}</div>
              <div className="category-name">{cat.name}</div>
            </div>
          ))}
        </div>

        <div className="products-grid">
          {filteredProducts.map(product => (
            <div
              key={product._id}
              className="product-card"
              onClick={() => addToCart(product)}
            >
              <div className="product-name">{product.name}</div>
              <div className="product-price">€{product.price.toFixed(2)}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="tpv-right">
        <div className="cart-header">
          <h2>Pedido Actual</h2>
        </div>

        <div className="cart-items">
          {cart.length === 0 ? (
            <div className="empty-cart">No hay productos agregados</div>
          ) : (
            cart.map(item => (
              <div key={item._id} className="cart-item">
                <div className="item-info">
                  <div className="item-name">{item.name}</div>
                  <div className="item-price">€{item.price.toFixed(2)}</div>
                </div>
                <div className="item-controls">
                  <button onClick={() => updateQuantity(item._id, item.quantity - 1)}>-</button>
                  <span className="item-qty">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item._id, item.quantity + 1)}>+</button>
                  <button 
                    className="btn-remove" 
                    onClick={() => removeFromCart(item._id)}
                  >
                    
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="cart-observations">
          <textarea
            placeholder="Observaciones..."
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
          />
        </div>

        <div className="cart-footer">
          <div className="cart-total">
            <span>Total:</span>
            <span className="total-amount">€{getTotal()}</span>
          </div>
          <button className="btn-send">Enviar</button>
        </div>
      </div>
    </div>
  );
};

export default TPV;
