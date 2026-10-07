import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import InBodyPage from './pages/InBodyPage';
import CarbsPage from './pages/CarbsPage';
import MealPlanPage from './pages/MealPlanPage';

type Page = 'dashboard' | 'inbody' | 'carbos' | 'plannutri';

const PAGES: Record<Page, React.ComponentType<PageProps>> = {
  dashboard: Dashboard,
  inbody:    InBodyPage,
  carbos:    CarbsPage,
  plannutri: MealPlanPage,
};

export interface PageProps {
  person:    string;
  setPerson: (id: string) => void;
  setPage:   (page: Page) => void;
}

export default function App() {
  const [page,   setPage]   = useState<Page>(() => {
    // Saved page may point to a removed section (e.g. 'planner'), so fall back to the dashboard
    const saved = localStorage.getItem('tiki_page');
    return saved && saved in PAGES ? saved as Page : 'dashboard';
  });
  const [person, setPerson] = useState<string>(() => localStorage.getItem('tiki_person') || 'ruben');

  const handleSetPage   = (p: Page)   => { setPage(p);   localStorage.setItem('tiki_page', p); };
  const handleSetPerson = (id: string) => { setPerson(id); localStorage.setItem('tiki_person', id); };

  const PageComponent = PAGES[page] || Dashboard;

  return (
    <div className="flex h-dvh bg-bg text-tktext overflow-hidden">
      <Sidebar page={page} setPage={handleSetPage} person={person} setPerson={handleSetPerson} />
      {/* Main content: on mobile add bottom padding for the bottom nav bar */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden pb-[64px] md:pb-0">
        <PageComponent person={person} setPerson={handleSetPerson} setPage={handleSetPage} />
      </main>
    </div>
  );
}
