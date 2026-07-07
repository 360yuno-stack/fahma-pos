import React from 'react';
import './Products.css';

const Recipes = () => {
  return (
    <div className="products-page">
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">Recetas</h1>
          <p className="page-subtitle">Módulo en construcción</p>
        </div>
      </div>
      <div className="empty-state">
        <span className="empty-state-icon mdi mdi-notebook" />
        <h3 className="empty-state-title">Próximamente</h3>
        <p className="empty-state-description">El módulo de recetas y escandallos estará disponible muy pronto.</p>
      </div>
    </div>
  );
};

export default Recipes;
