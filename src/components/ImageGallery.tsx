import type { ImageGalleryProps } from "@/types";

export default function ImageGallery({ images, altPrefix = "Foto" }: ImageGalleryProps) {
  return (
    <div className="flex flex-wrap items-center justify-center mt-5 gap-4 max-w-5xl mx-auto">
      {images.map((image, index) => (
        <div key={index} className="relative group rounded-lg overflow-hidden">
          <img
            src={image}
            alt={`${altPrefix} ${index + 1}`}
            className="size-56 object-cover object-top"
          />
          <div className="absolute inset-0 flex flex-col justify-end p-4 text-white bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-300">
            <h1 className="text-xl font-medium">{altPrefix} {index + 1}</h1>
          </div>
        </div>
      ))}
    </div>
  );
}
