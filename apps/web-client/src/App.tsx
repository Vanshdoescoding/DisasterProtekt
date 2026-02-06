import { Routes, Route, Navigate } from 'react-router-dom';
import { AppProviders } from '@/app/Providers';
import { AppLayout } from '@/app/Layout';
import { MapWorkspace } from '@/features/map/MapWorkspace';

function App() {
  return (
    <AppProviders>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/ops" replace />} />
          <Route path="/ops" element={<MapWorkspace />} />
          <Route path="*" element={<div className="p-8 text-center text-slate-500">404 Not Found</div>} />
        </Route>
      </Routes>
    </AppProviders>
  )
}

export default App
