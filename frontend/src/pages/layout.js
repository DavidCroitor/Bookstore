import React from 'react';
import Sidebar from '../components/sidebar';

export default function Layout({ children }) {
  return (
    <div className="appContainer">
      <Sidebar />
      <div className="content">
        {children}
      </div>
    </div>
  );
}