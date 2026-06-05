import { useState } from "react";
import { useAuth } from "./hooks/useAuth.js";
import { Login } from "./components/Login.jsx";
import { CanalesList } from "./components/CanalesList.jsx";
import { Chat } from "./components/Chat.jsx";

/**
 * App – enrutador de pantallas:
 *   LOGIN → CANALES → CHAT
 */
export default function App() {
  const { sesion, login, registrar, logout, error, cargando } = useAuth();
  const [canalActivo, setCanalActivo] = useState(null);

  if (!sesion) {
    return <Login onLogin={login} onRegistrar={registrar} error={error} cargando={cargando} />;
  }

  if (!canalActivo) {
    return (
      <CanalesList
        sesion={sesion}
        onSeleccionar={(canal) => setCanalActivo(canal)}
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
