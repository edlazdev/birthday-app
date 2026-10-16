import React, { useState, useMemo, useEffect, useRef } from "react";
import type { EventType } from "@/types";

export interface EmojiOption {
  emoji: string;
  label: string;
  category: "suggested" | "ceremony" | "gala" | "food" | "party" | "birthday" | "media" | "misc";
  keywords: string[];
}

export const EMOJI_CATALOG: EmojiOption[] = [
  // --- Ceremonia & Religión ---
  {
    emoji: "⛪",
    label: "Iglesia / Misa",
    category: "ceremony",
    keywords: ["iglesia", "templo", "misa", "parroquia", "religiosa", "ceremonia", "culto", "padre", "dios", "bendicion"],
  },
  {
    emoji: "✝️",
    label: "Cruz / Bendición",
    category: "ceremony",
    keywords: ["cruz", "fe", "religion", "dios", "bendicion", "misa", "catolica", "cristiana"],
  },
  {
    emoji: "🙏",
    label: "Oración / Agradecimiento",
    category: "ceremony",
    keywords: ["oracion", "rezar", "agradecimiento", "bendicion", "peticion", "gracias", "accion de gracias"],
  },
  {
    emoji: "🕊️",
    label: "Paloma de la Paz",
    category: "ceremony",
    keywords: ["paloma", "paz", "espiritu", "bautizo", "ceremonia", "vuelo", "blanca"],
  },
  {
    emoji: "📖",
    label: "Lecturas / Evangelio",
    category: "ceremony",
    keywords: ["lecturas", "evangelio", "biblia", "palabras", "libro", "ceremonia"],
  },
  {
    emoji: "🕯️",
    label: "Ceremonia de Velas",
    category: "ceremony",
    keywords: ["vela", "luz", "cirio", "ceremonia", "15 velas", "quinceanera"],
  },
  {
    emoji: "📜",
    label: "Boda Civil / Acta",
    category: "ceremony",
    keywords: ["civil", "firma", "acta", "documento", "juez", "matrimonio", "registro"],
  },
  {
    emoji: "✒️",
    label: "Firma de Testigos",
    category: "ceremony",
    keywords: ["firma", "testigos", "pluma", "contrato", "registro", "padrinos"],
  },

  // --- Novios, Quinceañera & Gala ---
  {
    emoji: "👑",
    label: "Corona / Quinceañera",
    category: "gala",
    keywords: ["corona", "reina", "tiara", "quinceanera", "princesa", "entrada", "coronacion"],
  },
  {
    emoji: "💍",
    label: "Anillos / Alianzas",
    category: "gala",
    keywords: ["anillos", "alianzas", "compromiso", "boda", "matrimonio", "esposos", "joya"],
  },
  {
    emoji: "👠",
    label: "Cambio de Zapatilla",
    category: "gala",
    keywords: ["zapatilla", "tacones", "cambio", "quinceanera", "zapatos", "primeros tacones"],
  },
  {
    emoji: "👗",
    label: "Vestido de Gala",
    category: "gala",
    keywords: ["vestido", "gala", "traje", "quinceanera", "novia", "moda"],
  },
  {
    emoji: "🤵",
    label: "Novio / Chambelanes",
    category: "gala",
    keywords: ["novio", "padrino", "traje", "esposo", "chambelan", "caballeros"],
  },
  {
    emoji: "👰",
    label: "Novia / Velo",
    category: "gala",
    keywords: ["novia", "velo", "esposa", "boda", "entrada"],
  },
  {
    emoji: "🏰",
    label: "Entrada Triunfal / Salón",
    category: "gala",
    keywords: ["castillo", "palacio", "entrada", "recepcion", "salon", "llegada"],
  },
  {
    emoji: "💐",
    label: "Ramo / Lanzamiento de Ramo",
    category: "gala",
    keywords: ["ramo", "flores", "lanzamiento", "novia", "quinceanera", "bouquet"],
  },
  {
    emoji: "🌹",
    label: "15 Rosas / Rosa de Honor",
    category: "gala",
    keywords: ["rosa", "flor", "quinceanera", "entrega", "rosas", "15 rosas"],
  },
  {
    emoji: "💎",
    label: "Joya / Anillo de 15",
    category: "gala",
    keywords: ["joya", "anillo", "diamante", "regalo", "quinceanera", "medalla"],
  },
  {
    emoji: "🪄",
    label: "Último Juguete / Muñeca",
    category: "gala",
    keywords: ["muneca", "juguete", "ultimo", "tradicion", "quinceanera", "magia"],
  },
  {
    emoji: "🎀",
    label: "Cinta / Presentación",
    category: "gala",
    keywords: ["lazo", "cinta", "adorno", "quinceanera", "regalo"],
  },

  // --- Banquete, Cena & Brindis ---
  {
    emoji: "🍽️",
    label: "Cena / Banquete",
    category: "food",
    keywords: ["cena", "almuerzo", "comida", "banquete", "plato", "degustacion", "buffet"],
  },
  {
    emoji: "🥂",
    label: "Brindis de Honor",
    category: "food",
    keywords: ["brindis", "copas", "champana", "honor", "salud", "palabras", "copa"],
  },
  {
    emoji: "🍾",
    label: "Descorche / Champaña",
    category: "food",
    keywords: ["champana", "botella", "celebracion", "descorche", "vino", "brindis"],
  },
  {
    emoji: "🎂",
    label: "Torta / Cumpleaños",
    category: "food",
    keywords: ["torta", "pastel", "cumpleanos", "cantar", "velas", "tarta"],
  },
  {
    emoji: "🍰",
    label: "Postre / Candy Bar",
    category: "food",
    keywords: ["postre", "dulces", "candy bar", "bocaditos", "mesa de dulces", "pastel"],
  },
  {
    emoji: "🍷",
    label: "Vino / Bar",
    category: "food",
    keywords: ["vino", "copa", "bar", "bebidas", "tinto"],
  },
  {
    emoji: "🍸",
    label: "Cóctel de Bienvenida",
    category: "food",
    keywords: ["coctel", "cocktail", "bienvenida", "trago", "open bar", "martini"],
  },
  {
    emoji: "🍕",
    label: "Snacks / Trasnoche",
    category: "food",
    keywords: ["pizza", "snacks", "hamburguesa", "trasnoche", "comida rapida", "bocaditos"],
  },
  {
    emoji: "☕",
    label: "Café de Despedida",
    category: "food",
    keywords: ["cafe", "te", "mesa", "cierre", "despedida", "caliente"],
  },
  {
    emoji: "🍫",
    label: "Fuente de Chocolate",
    category: "food",
    keywords: ["chocolate", "fuente", "fondue", "dulces", "fresas"],
  },

  // --- Fiesta, Vals & Música ---
  {
    emoji: "💃",
    label: "Vals / Baile de Gala",
    category: "party",
    keywords: ["vals", "baile", "pista", "coreografia", "danza", "baile sorpresa", "baile con papa"],
  },
  {
    emoji: "🕺",
    label: "Baile de Chambelanes",
    category: "party",
    keywords: ["baile", "chambelanes", "pareja", "pista", "coreografia", "baile sorpresa"],
  },
  {
    emoji: "🪩",
    label: "Hora Loca / Pista de Baile",
    category: "party",
    keywords: ["disco", "hora loca", "pista", "luces", "bola", "fiesta", "dj"],
  },
  {
    emoji: "🎵",
    label: "Música / DJ en Vivo",
    category: "party",
    keywords: ["musica", "dj", "canciones", "sonido", "playlist", "audio"],
  },
  {
    emoji: "🎶",
    label: "Apertura de Pista",
    category: "party",
    keywords: ["musica", "notas", "ambiente", "sonido", "cancion"],
  },
  {
    emoji: "🎤",
    label: "Palabras / Micrófono",
    category: "party",
    keywords: ["palabras", "discurso", "agradecimiento", "microfono", "brindis", "canto", "karaoke"],
  },
  {
    emoji: "🎷",
    label: "Orquesta / Saxofón",
    category: "party",
    keywords: ["banda", "orquesta", "saxo", "musica en vivo", "instrumentos"],
  },
  {
    emoji: "🎸",
    label: "Mariachi / Serenata",
    category: "party",
    keywords: ["mariachi", "guitarra", "serenata", "musica", "canto"],
  },
  {
    emoji: "🎆",
    label: "Show de Fuegos Artificiales",
    category: "party",
    keywords: ["fuegos", "pirotecnia", "show", "luces", "efectos", "chispas"],
  },
  {
    emoji: "🎉",
    label: "Fiesta & Cotillón",
    category: "party",
    keywords: ["fiesta", "cotillon", "confeti", "celebracion", "hora loca"],
  },
  {
    emoji: "🥳",
    label: "Celebración & Diversión",
    category: "party",
    keywords: ["celebrar", "felicidad", "hora loca", "animacion", "fiesta"],
  },

  // --- Cumpleaños & Juegos ---
  {
    emoji: "🎈",
    label: "Globos / Bienvenida",
    category: "birthday",
    keywords: ["globos", "bienvenida", "decoracion", "recepcion", "cumpleanos"],
  },
  {
    emoji: "🪅",
    label: "Romper la Piñata",
    category: "birthday",
    keywords: ["pinata", "juegos", "dulces", "ninos", "palo", "sorpresas"],
  },
  {
    emoji: "🎪",
    label: "Show Infantil / Animación",
    category: "birthday",
    keywords: ["show", "animacion", "payaso", "circo", "magia", "titeres"],
  },
  {
    emoji: "🎁",
    label: "Entrega de Regalos",
    category: "birthday",
    keywords: ["regalos", "sorpresas", "recuerdos", "obsequios", "presentes"],
  },
  {
    emoji: "🎨",
    label: "Pintacaritas / Taller",
    category: "birthday",
    keywords: ["taller", "pintura", "juegos", "arte", "pintacaritas", "manualidades"],
  },
  {
    emoji: "🎭",
    label: "Juegos & Dinámicas",
    category: "birthday",
    keywords: ["juegos", "teatro", "concurso", "dinamicas", "concursos"],
  },
  {
    emoji: "🧁",
    label: "Cupcakes & Meriendas",
    category: "birthday",
    keywords: ["cupcake", "dulces", "meriendas", "bocaditos"],
  },
  {
    emoji: "🤹",
    label: "Malabares & Magia",
    category: "birthday",
    keywords: ["animador", "malabares", "show", "diversion", "magia"],
  },

  // --- Recuerdos & Multimedia ---
  {
    emoji: "📸",
    label: "Sesión de Fotos",
    category: "media",
    keywords: ["fotos", "fotografia", "sesion", "camara", "album", "recuerdos", "posado"],
  },
  {
    emoji: "📷",
    label: "Cabina de Fotos / Photobooth",
    category: "media",
    keywords: ["fotocabina", "photobooth", "fotos", "recuerdos", "instantaneas"],
  },
  {
    emoji: "🎥",
    label: "Video / Proyección Semblanza",
    category: "media",
    keywords: ["video", "proyeccion", "semblanza", "pelicula", "pantalla", "recuerdos"],
  },
  {
    emoji: "🎞️",
    label: "Galería de Momentos",
    category: "media",
    keywords: ["recuerdos", "historia", "fotos", "diapositivas", "cronologia"],
  },

  // --- Tiempos, Llegadas & Varios ---
  {
    emoji: "🚗",
    label: "Llegada en Auto / Caravana",
    category: "misc",
    keywords: ["llegada", "auto", "carro", "transporte", "caravana", "limusina"],
  },
  {
    emoji: "⏰",
    label: "Recepción & Registro",
    category: "misc",
    keywords: ["hora", "llegada", "recepcion", "bienvenida", "puntual", "reloj"],
  },
  {
    emoji: "📍",
    label: "Llegada al Local / Salón",
    category: "misc",
    keywords: ["lugar", "salon", "hacienda", "quinta", "ubicacion", "mapa"],
  },
  {
    emoji: "💌",
    label: "Despedida & Souvenirs",
    category: "misc",
    keywords: ["despedida", "agradecimiento", "recuerdos", "carta", "souvenirs", "invitacion"],
  },
  {
    emoji: "✨",
    label: "Momento Mágico / Especial",
    category: "misc",
    keywords: ["magico", "especial", "sorpresa", "brillo", "estrellas", "destacado"],
  },
  {
    emoji: "⭐",
    label: "Momento Central",
    category: "misc",
    keywords: ["estrella", "destacado", "principal", "importante"],
  },
];

// Helper to normalize strings for search (removes accents)
function normalizeText(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

// Preset shortcuts depending on event type
export function getQuickPresets(type?: EventType | string): EmojiOption[] {
  if (type === "wedding") {
    return [
      { emoji: "💍", label: "Anillos / Boda", category: "gala", keywords: ["anillo"] },
      { emoji: "⛪", label: "Iglesia / Ceremonia", category: "ceremony", keywords: ["iglesia"] },
      { emoji: "🥂", label: "Brindis de Honor", category: "food", keywords: ["brindis"] },
      { emoji: "🍽️", label: "Cena Nupcial", category: "food", keywords: ["cena"] },
      { emoji: "💃", label: "Vals de los Novios", category: "party", keywords: ["vals"] },
    ];
  }
  if (type === "quinceanero") {
    return [
      { emoji: "👑", label: "Corona / Entrada", category: "gala", keywords: ["corona"] },
      { emoji: "⛪", label: "Misa de Acción de Gracias", category: "ceremony", keywords: ["iglesia"] },
      { emoji: "👠", label: "Cambio de Zapatilla", category: "gala", keywords: ["zapatilla"] },
      { emoji: "🍽️", label: "Cena de Gala", category: "food", keywords: ["cena"] },
      { emoji: "💃", label: "Vals con el Papá", category: "party", keywords: ["vals"] },
    ];
  }
  if (type === "birthday") {
    return [
      { emoji: "🎈", label: "Globos / Bienvenida", category: "birthday", keywords: ["globos"] },
      { emoji: "🎂", label: "Cantar Cumpleaños", category: "food", keywords: ["torta"] },
      { emoji: "🪅", label: "Hora de la Piñata", category: "birthday", keywords: ["pinata"] },
      { emoji: "🍕", label: "Snacks & Comida", category: "food", keywords: ["pizza"] },
      { emoji: "🎁", label: "Regalos & Sorpresas", category: "birthday", keywords: ["regalos"] },
    ];
  }
  return [
    { emoji: "🥂", label: "Brindis de Honor", category: "food", keywords: ["brindis"] },
    { emoji: "🍽️", label: "Cena / Banquete", category: "food", keywords: ["cena"] },
    { emoji: "🎉", label: "Fiesta General", category: "party", keywords: ["fiesta"] },
    { emoji: "📸", label: "Sesión de Fotos", category: "media", keywords: ["fotos"] },
    { emoji: "✨", label: "Momento Especial", category: "misc", keywords: ["magia"] },
  ];
}

interface IconPickerModalProps {
  isOpen: boolean;
  currentIcon: string;
  eventType?: EventType | string;
  activityTitle?: string;
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export default function IconPickerModal({
  isOpen,
  currentIcon,
  eventType,
  activityTitle,
  onSelect,
  onClose,
}: IconPickerModalProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [customEmoji, setCustomEmoji] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus search input when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setCustomEmoji("");
      setActiveCategory("all");
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Filtered emojis
  const filteredEmojis = useMemo(() => {
    const normSearch = normalizeText(search);

    return EMOJI_CATALOG.filter((item) => {
      // Category filter
      if (activeCategory !== "all") {
        if (activeCategory === "suggested") {
          // Contextual suggestions
          if (eventType === "wedding") {
            const weddingList = ["💍", "⛪", "👰", "🤵", "📜", "🕊️", "🥂", "🍽️", "🏰", "💃", "💐", "🍾", "🎂", "📸", "🎆"];
            if (!weddingList.includes(item.emoji)) return false;
          } else if (eventType === "quinceanero") {
            const quinceList = ["👑", "⛪", "👠", "👗", "🏰", "💃", "🕺", "🍽️", "🥂", "🎂", "🎁", "🌹", "💎", "📸", "🪩"];
            if (!quinceList.includes(item.emoji)) return false;
          } else if (eventType === "birthday") {
            const birthdayList = ["🎈", "🎂", "🪅", "🎪", "🎁", "🍕", "🧁", "📸", "🎉", "🥳", "🎨", "🎭"];
            if (!birthdayList.includes(item.emoji)) return false;
          }
        } else if (item.category !== activeCategory) {
          return false;
        }
      }

      // Search query filter
      if (!normSearch) return true;

      // Exact emoji match
      if (item.emoji.includes(normSearch) || item.emoji === search.trim()) return true;

      // Label match
      if (normalizeText(item.label).includes(normSearch)) return true;

      // Keywords match
      return item.keywords.some((kw) => normalizeText(kw).includes(normSearch));
    });
  }, [search, activeCategory, eventType]);

  if (!isOpen) return null;

  const categories = [
    { id: "all", label: "Todos", icon: "✨" },
    { id: "suggested", label: "Sugeridos", icon: "⭐" },
    { id: "ceremony", label: "Ceremonia", icon: "⛪" },
    { id: "gala", label: eventType === "wedding" ? "Boda" : eventType === "quinceanero" ? "Quince" : "Gala", icon: "👑" },
    { id: "food", label: "Cena & Brindis", icon: "🍽️" },
    { id: "party", label: "Fiesta & Vals", icon: "💃" },
    { id: "birthday", label: "Cumpleaños", icon: "🎈" },
    { id: "media", label: "Fotos", icon: "📸" },
    { id: "misc", label: "Varios", icon: "⏰" },
  ];

  const handleApplyCustom = (val: string) => {
    const trimmed = val.trim();
    if (trimmed) {
      onSelect(trimmed);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs select-none animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-4 sm:p-5 shadow-2xl relative max-h-[90vh] flex flex-col text-slate-800 dark:text-slate-100 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-400 font-bold text-lg flex items-center justify-center border border-amber-500/30">
              {currentIcon || "✨"}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                Elegir Ícono de Actividad
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {activityTitle ? `Para: "${activityTitle}"` : "Selecciona el emoji para la línea de tiempo"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-slate-800 transition cursor-pointer text-sm"
          >
            ✕
          </button>
        </div>

        {/* Search Input */}
        <div className="pt-3 pb-2">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por palabra (ej: misa, vals, cena, brindis, fotos, torta...)"
              className="w-full pl-8 pr-8 py-2 bg-stone-50 dark:bg-slate-950/80 border border-stone-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-thin scrollbar-thumb-stone-300 dark:scrollbar-thumb-slate-700">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition cursor-pointer flex items-center gap-1 shrink-0 ${
                  isActive
                    ? "bg-amber-500 text-slate-950 font-bold shadow-xs"
                    : "bg-stone-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-stone-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Quick Search match for custom typed emoji */}
        {search && !filteredEmojis.some((e) => e.emoji === search.trim()) && (
          <div className="my-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs">
            <span className="text-slate-700 dark:text-slate-300 text-[11px]">
              ¿Usar <strong className="text-amber-700 dark:text-amber-400">"{search.trim()}"</strong> directamente?
            </span>
            <button
              type="button"
              onClick={() => handleApplyCustom(search)}
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg font-bold text-[11px] cursor-pointer"
            >
              Usar como Ícono
            </button>
          </div>
        )}

        {/* Grid of Emojis */}
        <div className="flex-1 overflow-y-auto min-h-[220px] max-h-[340px] py-2 pr-1">
          {filteredEmojis.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <span className="text-3xl block">🔍</span>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                No encontramos íconos predefinidos para "{search}".
              </p>
              <p className="text-[11px] text-slate-400">
                Puedes escribir o pegar tu propio emoji abajo.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-6 sm:grid-cols-7 gap-1.5 sm:gap-2">
              {filteredEmojis.map((item) => {
                const isSelected = currentIcon === item.emoji;
                return (
                  <button
                    key={item.emoji + item.label}
                    type="button"
                    onClick={() => {
                      onSelect(item.emoji);
                      onClose();
                    }}
                    title={`${item.emoji} - ${item.label}`}
                    className={`h-11 sm:h-12 rounded-xl flex flex-col items-center justify-center p-1 cursor-pointer transition active:scale-95 group relative border ${
                      isSelected
                        ? "bg-amber-100 dark:bg-amber-950/80 border-amber-500 ring-2 ring-amber-500/50 shadow-sm"
                        : "bg-white dark:bg-slate-950/60 border-stone-200/80 dark:border-slate-800 hover:border-amber-400 hover:bg-stone-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span className="text-xl sm:text-2xl leading-none group-hover:scale-115 transition-transform duration-100">
                      {item.emoji}
                    </span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 truncate w-full text-center mt-0.5 leading-tight group-hover:text-slate-700 dark:group-hover:text-slate-300">
                      {item.label.split("/")[0].trim()}
                    </span>
                    {isSelected && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-500 text-slate-950 rounded-full flex items-center justify-center text-[9px] font-bold shadow-xs">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Custom Emoji / Text Input Footer */}
        <div className="pt-3 border-t border-stone-100 dark:border-slate-800 flex items-center gap-2">
          <div className="flex-1">
            <input
              type="text"
              value={customEmoji}
              onChange={(e) => setCustomEmoji(e.target.value)}
              placeholder="O escribe/pega cualquier emoji (ej: 🦄, 🥂, 🕊️)"
              className="w-full px-3 py-1.5 bg-stone-50 dark:bg-slate-950/80 border border-stone-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-500"
            />
          </div>
          <button
            type="button"
            onClick={() => handleApplyCustom(customEmoji)}
            disabled={!customEmoji.trim()}
            className="px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-700 dark:text-slate-200 font-semibold text-xs transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Aplicar
          </button>
        </div>
      </div>
    </div>
  );
}
