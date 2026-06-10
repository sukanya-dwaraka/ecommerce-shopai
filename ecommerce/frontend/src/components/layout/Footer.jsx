import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-amazon-dark dark:bg-gray-950 text-gray-300 mt-16">
      <div className="bg-amazon-navy dark:bg-gray-900 py-10">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { title: 'Get to Know Us', links: [['About Us', '#'], ['Careers', '#'], ['Press Releases', '#']] },
            { title: 'Connect with Us', links: [['Facebook', '#'], ['Twitter', '#'], ['Instagram', '#']] },
            { title: 'Make Money with Us', links: [['Sell products', '#'], ['Become Affiliate', '#'], ['Advertise', '#']] },
            { title: 'Let Us Help You', links: [['My Account', '/profile'], ['Orders', '/orders'], ['Help Center', '#']] },
          ].map(({ title, links }) => (
            <div key={title}>
              <h3 className="text-white font-semibold mb-3">{title}</h3>
              <ul className="space-y-1">
                {links.map(([label, to]) => (
                  <li key={label}>
                    <Link to={to} className="text-sm hover:text-white transition-colors">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="py-6 text-center text-sm">
        <p className="text-amazon-orange font-bold text-lg mb-1">🛒 ShopAI</p>
        <p>© {new Date().getFullYear()} ShopAI. All rights reserved. AI-Powered Shopping Platform.</p>
        <p className="mt-1 text-xs text-gray-500">Built with React, Node.js, MongoDB, and Anthropic AI</p>
      </div>
    </footer>
  );
}
