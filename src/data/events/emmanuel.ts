import type { EventData } from "@/types";

export const emmanuel: EventData = {
  slug: "emmanuel",
  beforeCelebrant: "Soy",
  celebrant: "Emmanuel",
  title: "Cumplo",
  age: "2",
  afterAge: "añitos",
  tagline: "¡Acompáñame a celebrar mi cumpleaños!",
  date: "Jueves 19 de Febrero",
  time: "5:00 PM",
  address: "Manuel Arevalo III Etapa, Mz  A38 Lt 30",
  whatsapp: "51902767559",
  whatsappName: "Ronal",
  msgRedirectAlbum: "Mira cuánto hemos crecido",
  msgTooltip: "Asegura tu comida 😜",
  map: {
    lat: -8.0699676,
    lng: -79.0701625,
  },
  albumCount: 12,
  fonts: {
    title: {
      type: "local",
      family: "QuirkySpring",
      src: "/fonts/QuirkySpring.ttf",
    },
    text: {
      type: "google",
      family: "Poppins",
      weights: ["400", "600", "700"],
    },
  },
  socialLinks: {
    instagram: true,
    facebook: true,
  },
  showAlbum: false,
  showAvatar: true,
  theme: {
    primary: "#F7710A",
    secondary: "#36BA2C",
    tertiary: "#EA5C4A",
    bg: "#eef2ff",
  },
  showVideoBackground: false,
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
