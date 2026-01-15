import { useState, useEffect } from "react";

interface VolumeButtonProps {
  videoId: string;
  initialMuted?: boolean;
}

const STORAGE_KEY = "youtube-volume-muted";

export default function VolumeButton({ videoId, initialMuted = true }: VolumeButtonProps) {
  // Leer el estado guardado de sessionStorage o usar el inicial
  const getStoredMutedState = (): boolean => {
    if (typeof window === "undefined") return initialMuted;
    const stored = sessionStorage.getItem(STORAGE_KEY);
    return stored !== null ? stored === "true" : initialMuted;
  };

  const [isMuted, setIsMuted] = useState(getStoredMutedState);
  const [player, setPlayer] = useState<any>(null);

  // Guardar el estado en sessionStorage cuando cambie
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(STORAGE_KEY, isMuted.toString());
    }
  }, [isMuted]);

  useEffect(() => {
    // Función para inicializar el reproductor de YouTube
    const initPlayer = () => {
      const iframeId = `yt-background-${videoId}`;
      const iframe = document.getElementById(iframeId);
      
      if (iframe && (window as any).YT && (window as any).YT.Player) {
        try {
          const ytPlayer = new (window as any).YT.Player(iframeId, {
            events: {
              onReady: (event: any) => {
                setPlayer(event.target);
                // Aplicar el estado guardado (muted o unmuted)
                const shouldBeMuted = getStoredMutedState();
                if (shouldBeMuted) {
                  event.target.mute();
                } else {
                  event.target.unMute();
                }
                setIsMuted(shouldBeMuted);
              },
            },
          });
        } catch (e) {
          console.error("Error initializing YouTube player:", e);
        }
      }
    };

    // Si la API ya está cargada, inicializar inmediatamente
    if ((window as any).YT && (window as any).YT.Player) {
      setTimeout(initPlayer, 500);
    } else {
      // Esperar a que la API esté lista
      const checkAPI = setInterval(() => {
        if ((window as any).YT && (window as any).YT.Player) {
          clearInterval(checkAPI);
          initPlayer();
        }
      }, 100);

      // Limpiar el intervalo después de 10 segundos
      setTimeout(() => clearInterval(checkAPI), 10000);
    }
  }, [videoId]);

  const toggleMute = () => {
    if (player) {
      try {
        if (isMuted) {
          player.unMute();
          setIsMuted(false);
        } else {
          player.mute();
          setIsMuted(true);
        }
      } catch (e) {
        console.error("Error toggling mute:", e);
      }
    }
  };

  return (
    <button
      onClick={toggleMute}
      className="volume-button"
      aria-label={isMuted ? "Activar volumen" : "Desactivar volumen"}
      title={isMuted ? "Activar volumen" : "Desactivar volumen"}
    >
      {isMuted ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="volume-icon"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
          />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="volume-icon"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 14.142M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
          />
        </svg>
      )}
    </button>
  );
}
