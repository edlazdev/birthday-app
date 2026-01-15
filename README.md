# Birthday App

Una aplicación web para crear invitaciones de cumpleaños personalizadas con Astro, React y Tailwind CSS.

## 🚀 Despliegue en GitHub Pages

Este proyecto está configurado para desplegarse automáticamente en GitHub Pages.

### Configuración inicial

1. **Crear el repositorio en GitHub** (si aún no lo has hecho):
   ```bash
   git remote add origin https://github.com/tu-usuario/birthday-app.git
   git branch -M main
   git push -u origin main
   ```

2. **Habilitar GitHub Pages**:
   - Ve a tu repositorio en GitHub
   - Click en **Settings** → **Pages**
   - En **Source**, selecciona **GitHub Actions**
   - Guarda los cambios

3. **El despliegue se ejecutará automáticamente**:
   - Cada vez que hagas push a la rama `main`
   - O manualmente desde la pestaña **Actions**

### Acceso a la aplicación

Una vez desplegado, tu aplicación estará disponible en:
```
https://tu-usuario.github.io/birthday-app/
```

### Configuración actual

- **Base path**: `/birthday-app` (configurado en `astro.config.mjs`)
- **Site URL**: `https://edlazdev.github.io/` (actualizar con tu usuario si es diferente)

## 📦 Instalación y desarrollo

```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Construir para producción
npm run build

# Vista previa de la build
npm run preview
```

## 🛠️ Tecnologías

- [Astro](https://astro.build/) - Framework web
- [React](https://react.dev/) - Biblioteca UI
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS

## 📁 Estructura del proyecto

```
/
├── public/          # Archivos estáticos (imágenes, fuentes)
├── src/
│   ├── components/  # Componentes Astro y React
│   ├── data/        # Datos de eventos
│   ├── layouts/     # Layouts de página
│   ├── pages/       # Páginas de la aplicación
│   ├── styles/      # Estilos globales
│   ├── types/       # Tipos TypeScript
│   └── utils/       # Utilidades
└── package.json
```
