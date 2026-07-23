import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { CanvasArea } from './components/canvas/CanvasArea';
import { SetupModal } from './components/ui/SetupModal';

export function App() {
  return (
    <div className="w-screen h-screen overflow-hidden flex flex-col bg-slate-950 text-slate-100 font-sans">
      {/* Header Fixo no Topo */}
      <Header />

      {/* Conteúdo Principal: Sidebar + Canvas Viewport */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <CanvasArea />
      </div>

      {/* Modal de Configuração de Novo Terreno */}
      <SetupModal />
    </div>
  );
}

export default App;
