import { useState } from 'react';
import ConfirmForm from './ConfirmForm';
import type { RSVPSectionWrapperProps } from '@/types';


export default function RSVPSectionWrapper({ whatsapp, msgTooltip }: RSVPSectionWrapperProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const handleOpen = () => {
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
  };

  // Manejar eventos táctiles para mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    setShowTooltip(true);
  };

  const handleTouchEnd = () => {
    // Mantener el tooltip visible por 2 segundos en mobile antes de ocultarlo
    setTimeout(() => setShowTooltip(false), 2000);
  };

  return (
    <>
      <section className="flex flex-row justify-center gap-4 text-center my-5">
        <div 
          className="tooltip-wrapper relative inline-block"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <button 
            onClick={handleOpen}
            className="btn-primary"
          >
            Confirmar asistencia
          </button>
          {msgTooltip && (
            <div 
              className={`tooltip absolute z-50 px-3 py-2 text-sm text-white bg-black rounded-lg shadow-lg whitespace-nowrap pointer-events-none transition-opacity duration-200 bottom-full left-1/2 -translate-x-1/2 mb-1 ${
                showTooltip ? 'opacity-100 block' : 'opacity-0 hidden md:block'
              }`}
            >
              {msgTooltip}
              <div className="tooltip-arrow absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-4 border-t-black border-l-transparent border-r-transparent border-b-transparent"></div>
            </div>
          )}
        </div>
      </section>
      <ConfirmForm whatsapp={whatsapp} isOpen={isModalOpen} onClose={handleClose} />
    </>
  );
}
