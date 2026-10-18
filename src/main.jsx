import { hydrateRoot, createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import '../css/styles.css';

const root = document.getElementById('root');
if (root) {
  const application = (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
  if (root.hasChildNodes()) hydrateRoot(root, application);
  else createRoot(root).render(application);
}
