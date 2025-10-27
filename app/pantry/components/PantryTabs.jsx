'use client';

import { useState } from 'react';
import './PantryTabs.css';

export default function PantryTabs({ activeTab, onTabChange, stats }) {
  const tabs = [
    {
      id: 'inventory',
      label: 'Inventaire',
      icon: '📦',
      badge: stats?.totalProducts || 0,
      description: 'Tous vos produits'
    },
    {
      id: 'waste',
      label: 'À Risque',
      icon: '⚠️',
      badge: stats?.atRiskCount || 0,
      badgeColor: stats?.atRiskCount > 0 ? 'warning' : 'default',
      description: 'Produits qui expirent'
    },
    {
      id: 'stats',
      label: 'Statistiques',
      icon: '📊',
      description: 'Vue d\'ensemble'
    }
  ];

  return (
    <div className="pantry-tabs-container">
      <div className="pantry-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`pantry-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <div className="tab-content">
              <span className="tab-label">{tab.label}</span>
              <span className="tab-description">{tab.description}</span>
            </div>
            {tab.badge !== undefined && (
              <span className={`tab-badge ${tab.badgeColor || 'default'}`}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
