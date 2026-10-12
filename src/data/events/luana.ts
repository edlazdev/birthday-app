import type { EventData } from "@/types";

export const luana: EventData = {
  type: "quinceanero",
  slug: "luana",
  status: "published",
  beforeCelebrant: "MIS XV AÑOS",
  celebrant: "Luana",
  title: "Mis 15 Años",
  age: "15",
  afterAge: "Años",
  tagline:
    "Hay momentos inolvidables que se atesoran en el corazón para siempre. Por esa razón, quiero que compartas conmigo este día tan especial.",
  date: "Viernes 31 de Julio",
  time: "5:00 PM",
  address: "Premier Center - 90 Volunteer Dr Suite 450, Hendersonville, TN 37075",
  whatsapp: "51902767559",
  whatsappName: "Luana",
  msgRedirectAlbum: "Mira los momentos especiales de mis 15 años",
  msgTooltip: "Asegura tu lugar en mi fiesta 💖",
  map: {
    lat: 36.3047,
    lng: -86.620,
  },
  albumCount: 12,
  fonts: {
    title: {
      type: "google",
      family: "Playfair Display",
      weights: ["400", "600", "700", "900"],
    },
    text: {
      type: "google",
      family: "Montserrat",
      weights: ["300", "400", "500", "600", "700"],
    },
  },
  socialLinks: {
    instagram: true,
    facebook: true,
  },
  showAlbum: false,
  showAvatar: true,
  showItinerary: true,
  showSponsors: true,
  showMap: true,
  showRsvp: true,
  theme: {
    primary: "#e79db4",
    secondary: "#fce7f3",
    tertiary: "#d4af37",
    bg: "#22242A",
  },
  itinerary: [
    {
      time: "2:00 PM",
      title: "Misa de Acción de Gracias",
      description: "Sagrado Corazón - 2800 McGavock Pk Entrance #8",
      icon: "⛪",
    },
    {
      time: "4:30 PM",
      title: "Recepción de Invitados",
      description: "Premier Center",
      icon: "🥂",
    },
    {
      time: "5:00 PM",
      title: "Entrada de la Quinceañera",
      description: "Presentación oficial y palabras de bienvenida",
      icon: "👑",
    },
    {
      time: "5:30 PM",
      title: "Comida de Gala",
      description: "Cena buffet y acompañamientos",
      icon: "🍽️",
    },
    {
      time: "6:30 PM",
      title: "Protocolo & Vals",
      description: "Vals con padres y chambelanes de honor",
      icon: "🏰",
    },
    {
      time: "7:30 PM",
      title: "Baile & Fiesta",
      description: "Apertura de la pista y hora loca",
      icon: "💃",
    },
  ],
  sponsors: {
    groom: ["Saúl Martínez", "Lucy Brambila"],
    bride: ["Filiberto Nava", "Alicia Martínez"],
  },
  giftRecommendations: [
    "Lluvia de sobres 💌",
    "Mesa de regalos",
    "Transferencia Bancaria",
  ],
  showVideoBackground: false,
};
