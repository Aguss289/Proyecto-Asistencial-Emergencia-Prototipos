import { useState } from "react";
import { useAuth } from "./hooks/useAuth.js";
import { Login } from "./components/Login.jsx";
import { CasosList } from "./components/CasosList.jsx";
import { Chat } from "./components/Chat.jsx";

/**
 * App – flujo caso-céntrico:
 *   LOGIN → CASOS → CHAT
 *
 * El canal de chat siempre vive dentro de un Caso.
 * Si el caso aún no tiene canal (ChatRequest pendiente),
 * el ítem aparece deshabilitado en CasosList hasta que el socio acepte.
 */
export default function App() {
  const { sesion, login, registrar, logout, error, cargando } = useAuth();
  const [canalActivo, setCanalActivo] = useState(null);

  if (!sesion) {
    return <Login onLogin={login} onRegistrar={registrar} error={error} cargando={cargando} />;
  }

  if (!canalActivo) {
    return (
      <CasosList
        sesion={sesion}
        onAbrirChat={(canal) => setCanalActivo(canal)}
        onLogout={logout}
      />
    );
  }

  return (
    <Chat
      canal={canalActivo}
      sesion={sesion}
      onVolver={() => setCanalActivo(null)}
    />
  );
}
