import type { EventData } from "@/types";

export const chamaquitos: EventData = {
  slug: "chamaquitos",
  beforeCelebrant: "Nuestros",
  celebrant: "Chamaquitos",
  title: "Cumplen",
  age: "1",
  afterAge: "añito",
  tagline: "¡Acompáñanos a celebrar este lindo momento!",
  date: "Sábado 08 de Febrero",
  time: "4:30 PM",
  address: "Mz F Lt 37 Urb. Rosas del Valle, Trujillo",
  whatsapp: "51966761177",
  msgRedirectAlbum: "Mira cuánto hemos crecido",
  msgTooltip: "Asegura tu comida 😜",
  map: {
    lat: -8.0881487,
    lng: -79.0530356,
  },
  albumCount: 9,
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
  backgroundVideo: {
    // Video para la página de invitación
    invitation: {
      youtubeId: "7QAe_RFewEQ", // Reemplaza con el ID del video para invitación
      muted: true, // Cambiado a true para permitir autoplay
      loop: true,
      start: 2,
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
