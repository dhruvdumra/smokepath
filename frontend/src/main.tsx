import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

// Three surfaces: the home page (/), the how-to guide (/how) and the map app (/app).
// Old alert links (/?school=…) still open the app.
const App = lazy(() => import('./App'));
const Home = lazy(() => import('./site/Home'));
const HowTo = lazy(() => import('./site/HowTo'));

function route() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  const q = new URLSearchParams(window.location.search);
  if (path === '/app' || (path === '/' && (q.has('school') || q.has('dataset')))) return App;
  if (path === '/how') return HowTo;
  return Home;
}

const Page = route();
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={null}>
      <Page />
    </Suspense>
  </StrictMode>,
);
