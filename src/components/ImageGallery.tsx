import type { ImageGalleryProps } from "@/types";

export default function ImageGallery({
  images,
  altPrefix = "Foto",
}: ImageGalleryProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2  gap-4 md:gap-6 mt-5 max-w-7xl mx-auto px-4">
      {images.map((image, index) => (
        <div 
          key={index} 
          className="relative group rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
        >
          <img
            src={image}
            alt={`${altPrefix} ${index}`}
            className="w-full h-64 md:h-80 object-cover object-center"
            loading="lazy"
          />
          <div className="absolute inset-0 flex flex-col justify-end p-4 text-white bg-gradient-to-t from-black/70 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
            <h2 className="text-lg md:text-xl font-semibold">
              {altPrefix} {index}
            </h2>
          </div>
        </div>
      ))}
    </div>
  );
}
