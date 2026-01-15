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
  msgRedirectAlbum: "Mira cuanto hemos crecido",
  msgTooltip: "Asegura tu comida 😜",
  map: {
    lat: -8.088108,
    lng: -79.053003,
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
};
