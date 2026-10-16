import React, { useMemo } from "react";
import type { InvitationConfig, SectionItem } from "@/types/invitation";
import type { EventData } from "@/types";
import { eventDataToInvitationConfig } from "@/schemas/invitation";
import {
  HeroSection,
  CrestSection,
  CountdownSection,
  DateBannerSection,
  LocationSection,
  ItinerarySection,
  DressCodeSection,
  GiftSection,
  RsvpSection,
  MusicSection,
  SponsorsSection,
  GallerySection,
  FarewellSection,
  PhotoImageSection,
} from "@/components/sections";

export interface InvitationRendererProps {
  config: InvitationConfig | EventData;
  isPreview?: boolean;
  className?: string;
  onSectionSelect?: (sectionId: string) => void;
}

/**
 * Componente Maestro de Renderizado de Invitaciones
 * 
 * Recibe la configuración declarativa completa de la invitación (o modelo EventData),
 * aplica el tema de colores y tipografías, e itera dinámicamente sobre las secciones
 * ordenadas y activas. Funciona de manera idéntica tanto en el Editor en Vivo como
 * en la vista pública final sin duplicación de código.
 */
export default function InvitationRenderer({
  config,
  isPreview = false,
  className = "",
  onSectionSelect,
}: InvitationRendererProps) {
  // 1. Normalización: Garantizar objeto canónico InvitationConfig
  const invitation: InvitationConfig = useMemo(() => {
    if ("sections" in config && Array.isArray((config as any).sections)) {
      return config as InvitationConfig;
    }
    return eventDataToInvitationConfig(config as EventData);
  }, [config]);

  const { metadata, theme, sections } = invitation;

  // 2. Extraer y ordenar secciones activas
  const activeSections = useMemo(() => {
    return [...sections]
      .filter((s) => s.enabled !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [sections]);

  // 3. Variables de tema CSS inyectadas en el contenedor raíz
  const primaryColor = theme.primary || "#a85d72";
  const secondaryColor = theme.secondary || "#c78596";
  const tertiaryColor = theme.tertiary || "#7a2940";
  const bgColor = theme.bg || "#ffffff";
  const titleFont = theme.fonts?.title?.family || "Great Vibes";
  const textFont = theme.fonts?.text?.family || "Montserrat";

  const rootStyle: React.CSSProperties = {
    "--primary": primaryColor,
    "--secondary": secondaryColor,
    "--tertiary": tertiaryColor,
    "--bg": bgColor,
    "--font-title": `'${titleFont}', cursive`,
    "--font-text": `'${textFont}', sans-serif`,
    backgroundColor: bgColor,
    fontFamily: `'${textFont}', sans-serif`,
  } as React.CSSProperties;

  // 4. URL de fuentes Google
  const googleFontsUrl = useMemo(() => {
    const families: string[] = [];
    if (theme.fonts?.title?.family) {
      families.push(encodeURIComponent(theme.fonts.title.family) + ":wght@400;600;700");
    } else {
      families.push("Great+Vibes");
    }
    if (theme.fonts?.text?.family) {
      families.push(encodeURIComponent(theme.fonts.text.family) + ":wght@300;400;500;600;700");
    } else {
      families.push("Montserrat:wght@300;400;500;600;700");
    }
    return `https://fonts.googleapis.com/css2?${families.map((f) => `family=${f}`).join("&")}&display=swap`;
  }, [theme.fonts]);

  // 5. Renderizado polimórfico de cada sección
  const renderSection = (section: SectionItem) => {
    const key = section.id || `${section.kind}-${section.order}`;
    const sectionData = section.data || {};

    let content: React.ReactNode = null;

    switch (section.kind) {
      case "hero":
        content = (
          <HeroSection
            data={sectionData}
            metadata={metadata}
            theme={theme}
            isPreview={isPreview}
          />
        );
        break;

      case "crest":
        content = (
          <CrestSection
            data={sectionData}
            metadata={metadata}
            theme={theme}
            isPreview={isPreview}
          />
        );
        break;

      case "countdown":
        content = (
          <CountdownSection
            data={sectionData}
            metadata={metadata}
            theme={theme}
            isPreview={isPreview}
          />
        );
        break;

      case "dateBanner":
        content = (
          <DateBannerSection
            data={sectionData}
            metadata={metadata}
            theme={theme}
            isPreview={isPreview}
          />
        );
        break;

      case "ceremony":
        content = (
          <LocationSection
            data={{ ...sectionData, type: "ceremony" }}
            metadata={metadata}
            theme={theme}
            isPreview={isPreview}
          />
        );
        break;

      case "reception":
        content = (
          <LocationSection
            data={{ ...sectionData, type: "reception" }}
            metadata={metadata}
            theme={theme}
            isPreview={isPreview}
          />
        );
        break;

      case "itinerary":
        content = (
          <ItinerarySection
            data={sectionData}
            metadata={metadata}
            theme={theme}
            isPreview={isPreview}
          />
        );
        break;

      case "dressCode":
        content = (
          <DressCodeSection
            data={sectionData}
            metadata={metadata}
            theme={theme}
            isPreview={isPreview}
          />
        );
        break;

      case "sponsors":
        content = (
          <SponsorsSection
            data={sectionData}
            metadata={metadata}
            theme={theme}
            isPreview={isPreview}
          />
        );
        break;

      case "witnesses":
        content = (
          <SponsorsSection
            data={{ ...sectionData, isWitnesses: true }}
            metadata={metadata}
            theme={theme}
            isPreview={isPreview}
          />
        );
        break;

      case "gifts":
        content = (
          <GiftSection
            data={sectionData}
            metadata={metadata}
            theme={theme}
            isPreview={isPreview}
          />
        );
        break;

      case "rsvp":
        content = (
          <RsvpSection
            data={sectionData}
            metadata={metadata}
            theme={theme}
            isPreview={isPreview}
          />
        );
        break;

      case "music":
        content = (
          <MusicSection
            data={sectionData}
            metadata={metadata}
            theme={theme}
            isPreview={isPreview}
          />
        );
        break;

      case "gallery":
        content = (
          <GallerySection
            data={sectionData}
            metadata={metadata}
            theme={theme}
            isPreview={isPreview}
          />
        );
        break;

      case "middlePhoto":
        content = (
          <PhotoImageSection
            data={{
              src: sectionData.src || metadata.middlePhotoUrl,
              alt: metadata.celebrant,
              caption: sectionData.caption,
              aspectRatio: sectionData.aspectRatio || "portrait",
            }}
            metadata={metadata}
            theme={theme}
            isPreview={isPreview}
          />
        );
        break;

      case "finalPhoto":
        content = (
          <PhotoImageSection
            data={{
              src: sectionData.src || metadata.finalPhotoUrl,
              alt: metadata.celebrant,
              caption: sectionData.caption,
              aspectRatio: sectionData.aspectRatio || "portrait",
            }}
            metadata={metadata}
            theme={theme}
            isPreview={isPreview}
          />
        );
        break;

      case "farewell":
        content = (
          <FarewellSection
            data={sectionData}
            metadata={metadata}
            theme={theme}
            isPreview={isPreview}
          />
        );
        break;

      default:
        content = null;
    }

    if (!content) return null;

    // En modo preview, añadimos un contenedor con selector e información visual
    if (isPreview) {
      return (
        <div
          key={key}
          id={section.id}
          onClick={() => onSectionSelect?.(section.id)}
          className="group relative transition-all duration-200 hover:ring-2 hover:ring-amber-400 hover:ring-offset-1 cursor-pointer"
        >
          {/* Badge informativo en preview */}
          <div className="absolute top-2 right-2 z-30 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/85 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded-full shadow-md pointer-events-none flex items-center gap-1.5 border border-white/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            <span>{section.title || section.kind}</span>
          </div>
          {content}
        </div>
      );
    }

    return (
      <div key={key} id={section.id}>
        {content}
      </div>
    );
  };

  return (
    <div
      className={`invitation-renderer-root w-full max-w-md mx-auto min-h-screen shadow-2xl relative select-none font-sans overflow-x-hidden ${className}`}
      style={rootStyle}
    >
      {/* Carga reactiva de Google Fonts */}
      <link rel="stylesheet" href={googleFontsUrl} />

      {/* Renderizado secuencial de las secciones activas */}
      {activeSections.map((section) => renderSection(section))}
    </div>
  );
}
