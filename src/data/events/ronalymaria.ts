import type { EventData } from "@/types";

export const ronalymaria: EventData = {
  type: "wedding",
  slug: "ronalymaria",
  beforeCelebrant: "Nuestra boda",
  celebrant: "Ronal y María",
  title:
    "CON MUCHA ALEGRÍA LOS INVITAMOS A CELEBRAR EL DÍA MÁS ESPECIAL DE NUESTRAS VIDAS",
  age: "",
  afterAge: "",
  tagline: "",
  date: "Sábado 2 de Mayo",
  time: "3:00 PM",
  address: "Fundo las palmeras, Huanchaco",
  whatsapp: "51902767559",
  whatsappName: "Ronal",
  msgRedirectAlbum: "Mira cuánto hemos crecido",
  msgTooltip: "Asegura tu comida 😜",
  map: {
    lat: -8.087766977814466,
    lng: -79.07890072378052,
  },
  albumCount: 12,
  fonts: {
    title: {
      type: "google",
      family: "Pinyon Script",
      weights: ["400"],
    },
    text: {
      type: "google",
      family: "Montserrat",
      weights: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
    },
  },
  socialLinks: {
    instagram: true,
    facebook: true,
  },
  showAlbum: false,
  showAvatar: false,
  theme: {
    primary: "#8A9A5B",
    secondary: "#333333",
    tertiary: "#D4AF37",
    bg: "#F5F5F0",
  },
  recommendationsTitle: "Sugerencias de regalo",
  recommendationsDescription:
    "El mejor regalo es que estés presente en este día, pero si deseas hacernos un obsequio pueden dejarlo en: 📍 Manuel Arévalo 3era etapa Mz A 38 lote 30 Botica Malena (Frente al colegio Divino Jesús), tambien te dejamos algunas sugerencias.",
  giftRecommendations: [
    "✈ Viajes",
    "🍽 Cenas",
    "🔌 Electrodomésticos",
    "💰 Efectivo",
    "🏦 Transferencia BCP: 57070984724094",
    "🏦 Transferencia Interbancaria: 00257017098472409407",
  ],
  showVideoBackground: false,
  sponsors: {
    groom: ["Carlos A. Ramos Bazán", "Lucy M. Sánchez Pavón "],
    bride: ["Yeiner E. Vasquez Valle", "Esther Arenas Limas"],
  },
  backgroundVideo: {
    // Video para la página de invitación
    invitation: {
      youtubeId: "4XJ5XaTalIw", // Reemplaza con el ID del video para invitación
      muted: true, // Cambiado a true para permitir autoplay
      loop: true,
      start: 12,
    },
    // Video para la página del álbum
    album: {
      youtubeId: "QN5RobQ6L04", // Reemplaza con el ID del video para álbum (puede ser diferente)
      muted: true, // Cambiado a true para permitir autoplay
      loop: true,
      start: 8,
    },
  },
};
