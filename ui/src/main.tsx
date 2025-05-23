import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client' 
import App from './App.tsx'
// import "primereact/resources/themes/lara-dark-teal/theme.css";
// import "primereact/resources/themes/arya-green/theme.css";
import "primereact/resources/themes/arya-green/theme.css";
import 'primereact/resources/primereact.min.css';
import "primeicons/primeicons.css";
import 'primeflex/primeflex.css';
import "./main.css" ;


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
