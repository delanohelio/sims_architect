import { useSimsStore } from '../../store/useSimsStore';
import { BuildSidebar } from './BuildSidebar';
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

  // Se estiver no Modo 2D e no modo de Configurações (ou padrão), exibe o painel de configurações do terreno
  if (activeMode === 'settings') {
    return <SettingsSidebar />;
  }

  return <SettingsSidebar />;
}
