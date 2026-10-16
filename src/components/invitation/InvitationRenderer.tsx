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
  EventRibbonDivider,
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
  const textColor = theme.text || (theme.isDark ? "#f8fafc" : "#1e293b");
  const headingFont = theme.fonts?.title?.family || "Great Vibes";
  const bodyFont = theme.fonts?.text?.family || "Montserrat";

  const rootStyle: React.CSSProperties = {
    // Custom Properties requeridas por la especificación
    "--color-primary": primaryColor,
    "--color-secondary": secondaryColor,
    "--color-tertiary": tertiaryColor,
    "--color-bg": bgColor,
    "--color-text": textColor,
    "--font-heading": `'${headingFont}', cursive, serif`,
    "--font-body": `'${bodyFont}', sans-serif`,

    // Compatibilidad hacia atrás con variables previas
    "--primary": primaryColor,
    "--secondary": secondaryColor,
    "--tertiary": tertiaryColor,
    "--bg": bgColor,
    "--font-title": `'${headingFont}', cursive, serif`,
    "--font-text": `'${bodyFont}', sans-serif`,

    backgroundColor: "var(--color-bg)",
    color: "var(--color-text)",
    fontFamily: "var(--font-body)",
  } as React.CSSProperties;

  // 4. URL canónica de fuentes Google
  const googleFontsUrl = useMemo(() => {
    const families = new Set<string>();
    const hFont = theme.fonts?.title?.family?.trim();
    const bFont = theme.fonts?.text?.family?.trim();

    if (hFont) families.add(hFont);
    if (bFont) families.add(bFont);

    if (families.size === 0) {
      families.add("Great Vibes");
      families.add("Montserrat");
    }

    const queryParts = Array.from(families).map((fam) => {
      const encodedName = fam.replace(/\s+/g, "+");
      return `family=${encodedName}:wght@300;400;500;600;700`;
    });

    return `https://fonts.googleapis.com/css2?${queryParts.join("&")}&display=swap`;
  }, [theme.fonts?.title?.family, theme.fonts?.text?.family]);

  // 5. Cargador dinámico reactivo en el DOM (<head>) para reflejo instantáneo en el preview
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    // A. Preconnect a los servidores de Google Fonts para descarga ultrarrápida
    if (!document.querySelector('link[data-gf-preconnect="1"]')) {
      const preconnectGapis = document.createElement("link");
      preconnectGapis.rel = "preconnect";
      preconnectGapis.href = "https://fonts.googleapis.com";
      preconnectGapis.setAttribute("data-gf-preconnect", "1");
      document.head.appendChild(preconnectGapis);

      const preconnectGstatic = document.createElement("link");
      preconnectGstatic.rel = "preconnect";
      preconnectGstatic.href = "https://fonts.gstatic.com";
      preconnectGstatic.crossOrigin = "anonymous";
      preconnectGstatic.setAttribute("data-gf-preconnect", "1");
      document.head.appendChild(preconnectGstatic);
    }

    // B. Crear o actualizar la etiqueta link dinámica con el set exacto de fuentes activas
    let linkTag = document.getElementById("invitation-dynamic-google-fonts") as HTMLLinkElement | null;
    if (!linkTag) {
      linkTag = document.createElement("link");
      linkTag.id = "invitation-dynamic-google-fonts";
      linkTag.rel = "stylesheet";
      document.head.appendChild(linkTag);
    }

    if (linkTag.href !== googleFontsUrl) {
      linkTag.href = googleFontsUrl;
    }
  }, [googleFontsUrl]);

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

  // 6. Detección de Quinceañera para aplicar marco metálico plateado y lazos ornamentales
  const isQuinceanera = useMemo(() => {
    const rawType = (invitation as any).type || metadata.type || (config as any)?.type;
    const age = metadata.age?.trim() || "";
    return rawType === "quinceanero" || age === "15" || (theme as any)?.frameStyle === "silver-quinceanera";
  }, [invitation, metadata, config, theme]);

  const shouldRenderRibbonDivider = (section: SectionItem, index: number) => {
    if (!isQuinceanera) return false;
    // No colocar divisor inmediatamente después del hero (HeroSection ya incluye el lazo grande superior)
    if (section.kind === "hero") return false;
    // No colocar divisor después de la última sección o en mensaje de cierre
    if (index >= activeSections.length - 1 || section.kind === "farewell") return false;
    // Secciones que llevan lazo divisor inferior de gala
    const ribbonSections = [
      "crest",
      "music",
      "countdown",
      "dateBanner",
      "itinerary",
      "dressCode",
      "gift",
      "location",
      "ceremony",
      "reception",
      "sponsors",
      "middlePhoto",
      "gallery",
    ];
    return ribbonSections.includes(section.kind);
  };

  if (isQuinceanera) {
    return (
      <div
        className={`invitation-renderer-root w-full flex justify-center py-0 select-none font-invitation-body text-invitation-text ${className}`}
        style={rootStyle}
      >
        {/* Carga reactiva de Google Fonts (SSR) */}
        <link rel="stylesheet" href={googleFontsUrl} />

        {/* Marco Metálico Plateado en Degradado (quince-silver-container) */}
        <div
          className="quince-silver-container w-full max-w-[440px] flex flex-col relative py-0 px-2.5 sm:px-3.5 shadow-2xl transition-all duration-300"
          style={{
            background:
              "linear-gradient(90deg, #b0b7bf 0%, #dbe0e6 12%, #f4f6f8 24%, #c5cbd3 50%, #f4f6f8 76%, #dbe0e6 88%, #b0b7bf 100%)",
            boxShadow:
              "0 25px 60px rgba(70, 15, 30, 0.45), 0 10px 30px rgba(0, 0, 0, 0.3)",
          }}
        >
          {/* Tarjeta Central Móvil en Blanco Puro */}
          <main
            className="quince-mobile-card w-full flex flex-col relative text-center bg-white shadow-xs overflow-hidden"
            style={{ backgroundColor: "var(--color-bg, #ffffff)" }}
          >
            {activeSections.map((section, idx) => (
              <React.Fragment key={section.id || `${section.kind}-${idx}`}>
                {renderSection(section)}
                {shouldRenderRibbonDivider(section, idx) && (
                  <EventRibbonDivider color="#9fa6b0" />
                )}
              </React.Fragment>
            ))}
          </main>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`invitation-renderer-root w-full max-w-md mx-auto min-h-screen shadow-2xl relative select-none font-invitation-body bg-invitation-bg text-invitation-text overflow-x-hidden ${className}`}
      style={rootStyle}
    >
      {/* Carga reactiva de Google Fonts (SSR) */}
      <link rel="stylesheet" href={googleFontsUrl} />

      {/* Renderizado secuencial de las secciones activas */}
      {activeSections.map((section) => renderSection(section))}
    </div>
  );
}

