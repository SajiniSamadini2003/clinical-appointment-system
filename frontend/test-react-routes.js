// test-react-routes.js
import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import App from './src/App.jsx';

const routes = [
  '/',
  '/login',
  '/register',
  '/doctors',
  '/doctors/123',
  '/patient/dashboard',
  '/doctor/dashboard',
  '/admin/dashboard',
  '/invalid-page'
];

let allPass = true;

routes.forEach(path => {
  try {
    const html = renderToString(
      <StaticRouter location={path}> 
        <App />
      </StaticRouter>
    );
    // Simple checks for each route
    if (path === '/invalid-page') {
      if (!html.includes('NotFound')) {
        console.error(`Route ${path} did not render NotFound`);
        allPass = false;
      }
    } else if (path === '/') {
      if (!html.includes('Welcome to CareClinic')) {
        console.error('Home page missing heading');
        allPass = false;
      }
    } else if (path === '/login') {
      if (!html.includes('Login')) {
        console.error('Login page missing');
        allPass = false;
      }
    } else if (path === '/register') {
      if (!html.includes('Register')) {
        console.error('Register page missing');
        allPass = false;
      }
    } else if (path.startsWith('/doctors')) {
      if (!html.includes('Doctors')) {
        console.error('Doctors page missing');
        allPass = false;
      }
    } else if (path.includes('dashboard')) {
      if (!html.includes('Dashboard')) {
        console.error(`${path} missing Dashboard placeholder`);
        allPass = false;
      }
    }
  } catch (e) {
    console.error('Error rendering route', path, e);
    allPass = false;
  }
});

process.exit(allPass ? 0 : 1);
