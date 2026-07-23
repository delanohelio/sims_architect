import { useSimsStore } from '../../store/useSimsStore';
import { BuildSidebar } from './BuildSidebar';
import { BuySidebar } from './BuySidebar';
import { ExportSidebar } from './ExportSidebar';
import { Inspection3DSidebar } from './Inspection3DSidebar';
import { SettingsSidebar } from './SettingsSidebar';

export function Sidebar() {
  const { activeMode, viewMode } = useSimsStore();

  // Se o usuário estiver no Modo 3D, exibe a Sidebar de Inspeção 3D & Resumo do Projeto
  if (viewMode === '3d') {
    return <Inspection3DSidebar />;
  }

  // Se estiver no Modo 2D e no modo de Construção, exibe as ferramentas de construção
  if (activeMode === 'build') {
    return <BuildSidebar />;
  }

  // Se estiver no Modo 2D e no modo Compra, exibe a Sidebar do Modo Compra
  if (activeMode === 'buy') {
    return <BuySidebar />;
  }

  // Se estiver no Modo Exportar, exibe a Sidebar do Modo Exportar
  if (activeMode === 'export') {
    return <ExportSidebar />;
  }

  // Se estiver no Modo de Configurações (ou padrão), exibe o painel de configurações do terreno
  return <SettingsSidebar />;
}
