export type FontConfig =
  | {
      type: "google";
      family: string;
      weights?: string[];
    }
  | {
      type: "local";
      family: string;
      src: string | string[]; // Ruta(s) al archivo de fuente
      format?: string; // opcional: "woff2", "woff", "ttf", etc.
    };
