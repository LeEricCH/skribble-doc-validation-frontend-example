"use client";

import { Copy, Pencil } from "lucide-react";
import { useState } from "react";

export default function CompanyDetails() {
  const [company] = useState({
    id: "0513e34ade6538f09b3eb18028ea4373",
    name: "tesstt",
    phoneNumber: "1235566"
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // In a real app, you'd show a toast notification
  };

  return (
    <div>
      <div className="section-header">
        <h2 className="section-title">Company details</h2>
      </div>
      
      <div className="card">
        <div className="card-row">
          <span className="card-label">ID:</span>
          <div className="card-value">
            <span className="card-value-text">{company.id}</span>
            <button 
              type="button"
              onClick={() => copyToClipboard(company.id)}
              className="copy-button"
              aria-label="Copy ID"
            >
              <Copy size={16} />
            </button>
          </div>
        </div>
        
        <div className="card-row">
          <span className="card-label">Name</span>
          <div className="card-value">
            <span className="card-value-text">{company.name}</span>
            <button 
              type="button"
              className="card-icon-button"
              aria-label="Edit Name"
            >
              <Pencil size={16} />
            </button>
          </div>
        </div>
        
        <div className="card-row">
          <span className="card-label">Phone number</span>
          <div className="card-value">
            <span className="card-value-text">{company.phoneNumber}</span>
            <button 
              type="button"
              className="card-icon-button"
              aria-label="Edit Phone Number"
            >
              <Pencil size={16} />
            </button>
          </div>
        </div>
      </div>
      
      <div className="hosting-info">
        <span>Data hosting region: Switzerland</span>
        <span>v2.6.5</span>
      </div>
    </div>
  );
} 