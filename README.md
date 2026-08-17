# Naunet Labs — sitio web (v2)

Sitio corporativo estático en HTML5 + CSS3 + JavaScript vanilla. Sin build step, sin frameworks: se edita y se sube directamente.

**Cambios de la v2:** herramienta local (`tools/gestor-productos.html`) para crear/editar productos y documentación sin tocar JSON a mano, precios ocultos (solo internos), sección de descargas, catálogo en carrusel de 6 productos, galería con lightbox, paleta de bloques blanco/gris con acentos rojo y azul, sin sistema de cuentas (pendiente para una versión futura), páginas legales de privacidad y seguridad.

## Estructura de archivos

```
naunet-labs/
├── index.html            → Página principal (hero, catálogo en carrusel, recursos, empresa, contacto)
├── product-detail.html   → Vista detallada de producto (carga por ?id=), con sección de descargas
├── docs.html             → Documentación ampliada por producto (acordeón), carga por ?id=
├── privacidad.html       → Política de privacidad
├── seguridad.html        → Política de seguridad
├── styles.css            → Todos los estilos, variables centralizadas al principio
├── script.js             → Lógica del sitio público: carrusel, lightbox, ficha de producto, docs, contacto
├── products.json         → Catálogo de productos (fuente de verdad pública)
├── docs.json             → Documentación extensa por producto (cargada solo en docs.html)
├── config.json           → Colores de referencia, fuentes, textos del hero, redes sociales, endpoint de contacto
├── tools/
│   └── gestor-productos.html → Herramienta LOCAL para crear/editar productos y docs. No es parte del sitio público.
├── assets/
│   ├── images/products/  → Imágenes de cada producto
│   └── fonts/            → (opcional) fuentes autoalojadas
└── README.md
```

No hay backend. Todos los JSON se cargan por `fetch()`, así que el sitio debe servirse desde un servidor HTTP (no abrir los archivos con `file://`). Para probar en local:

```bash
python3 -m http.server 8000
# o
npx serve .
```

La herramienta local (`tools/gestor-productos.html`) también se beneficia de abrirse por HTTP para el modo de guardado directo, aunque en Chrome/Edge también funciona abriéndola con doble clic (`file://`).

---

## 1. Herramienta local — crear y editar productos sin tocar JSON

`tools/gestor-productos.html` **no es una página del sitio**: no está enlazada desde ningún menú, no hace falta subirla a tu hosting, y puedes moverla fuera de la carpeta del proyecto si quieres. Es un único archivo HTML autocontenido (sin dependencias externas) que abres tú mismo en el navegador cuando necesitas gestionar el catálogo — como si fuera un pequeño programa de escritorio.

Tiene dos pestañas, "Producto" y "Documentación", cada una con:

- **Conexión al archivo real** (`products.json` / `docs.json`) mediante File System Access API: lo conectas una vez con el botón "📂 Conectar…", concedes permiso de escritura, y a partir de ahí cada "Guardar" escribe directamente en ese archivo de tu proyecto — sin descargas, sin copiar y pegar. Disponible en Chrome y Edge. En Firefox/Safari (que no soportan esta API), cada "Guardar" descarga el JSON ya actualizado para que sustituyas el archivo tú mismo — sigues sin escribir una sola línea de JSON a mano, solo cambia el paso final.
- **Editar un producto existente:** una vez conectado `products.json`, aparece un desplegable con todos los productos actuales — seleccionas uno y el formulario se rellena solo con sus datos.
- **Pegar JSON para editar:** si tienes el JSON de un producto (copiado de `products.json`, de otro proyecto, o de donde sea), lo pegas en la caja de texto y pulsas "Cargar en el formulario" — rellena todos los campos automáticamente, listo para modificar y volver a guardar. Funciona igual para documentación, pegando un objeto `{"docSections": [...]}`.

Si guardas con un `id` que ya existe en `products.json`, esa entrada se **sobrescribe** en vez de duplicarse — así el mismo formulario sirve tanto para crear como para editar.

---

## 2. Añadir un producto nuevo (con la herramienta local)

Abre `tools/gestor-productos.html`, conecta `products.json`, y en la pestaña "Producto" rellena: ID único, nombre, categoría, si es de pago, descripciones, especificaciones, el plan de precio interno, características, guía de uso, FAQ, imágenes y archivos de descarga. Al pulsar "Guardar en products.json" se añade (o actualiza) la entrada con la misma estructura que ya usa el archivo — puedes seguir editando el JSON a mano en algún caso puntual, pero ya no hace falta.

### Imágenes del producto
Coloca las imágenes en `assets/images/products/` y pon esas rutas en el formulario (o directamente en `products.json`). Si una imagen no existe todavía, la galería y las tarjetas muestran un marcador de posición con el nombre del archivo esperado.

---

## 3. Precios (internos, no visibles)

Los precios **no se muestran en ninguna parte de la web pública** — ni en el catálogo, ni en la ficha de producto, ni en el menú. Viven como datos internos dentro de `specifications.internalPricing` de cada producto en `products.json`, pensados para tu propia referencia (o para una futura pasarela de pago), no para renderizarse.

El botón "Descargar prueba gratuita" de cada ficha de producto lleva directamente a la sección **Descargas** de esa misma página, donde se listan: el ejecutable/paquete de instalación, el README (si existe) y el enlace a la documentación completa. Si marcas un producto como `"isPaid": true` en el formulario o en el JSON, esa sección de descargas muestra arriba un aviso diferenciado indicando que el producto es de pago pero que la prueba gratuita está disponible ahí mismo — la estructura ya soporta productos de pago aunque hoy ninguno lo sea.

---

## 4. Cambiar colores globalmente

Todos los colores están centralizados en `styles.css`, dentro del bloque `:root`:

```css
:root {
  --white: #ffffff;
  --grey-50: #f5f6f8;
  --grey-100: #e7e9ed;
  --ink: #14181f;
  --red: #e4483a;
  --blue: #1f3a5f;
  /* ... */
}
```

El diseño alterna bloques de sección blancos (`.section--white`) y grises claros (`.section--grey`) para dar ritmo visual sin perder la sensación de fiabilidad de los tonos claros. Cambia cualquiera de estos valores y se propaga a todo el sitio — no hace falta editar nada más. `config.json` incluye una copia de referencia solo a efectos de documentación.

---

## 5. Cambiar fuentes

Centralizadas también en `:root`:

```css
--font-display: "Space Grotesk", "Arial Narrow", sans-serif; /* Títulos */
--font-body: "Inter", -apple-system, sans-serif;              /* Cuerpo de texto */
--font-mono: "JetBrains Mono", "Courier New", monospace;      /* Specs, datos */
```

Para usar otra fuente: cambia el `<link>` de Google Fonts en el `<head>` de cada página y actualiza el nombre en `:root`.

---

## 6. Añadir o quitar redes sociales

Edita el array `"social"` en `config.json`. Los enlaces del footer/contacto de `index.html` se generan automáticamente desde ahí (`renderSocialLinks()` en `script.js`).

---

## 7. Documentación extensa (docs.json)

Cada producto puede tener secciones largas de documentación (instalación, configuración, problemas comunes, notas...) que **no** viven en `products.json` — eso mantendría el catálogo pesado innecesariamente. Viven en `docs.json`, indexado por el `id` del producto:

```json
{
  "mi-producto": {
    "docSections": [
      { "title": "Instalación", "content": "..." },
      { "title": "Configuración inicial", "content": "..." }
    ]
  }
}
```

`docs.html?id=mi-producto` las carga y las muestra en acordeón. Se generan desde la pestaña "Documentación" de `tools/gestor-productos.html`, igual que los productos.

---

## 8. Formulario de contacto

Usa un servicio externo gratuito (recomendado: [Formspree](https://formspree.io)) para recibir los emails sin backend propio.

1. Crea una cuenta gratuita en Formspree y un formulario nuevo.
2. Copia el endpoint (`https://formspree.io/f/abc123`).
3. Pégalo en `config.json`, campo `contactForm.endpoint`.

Mientras el endpoint contenga `TU_ID_AQUI`, el formulario valida los campos y muestra el mensaje de éxito, pero no envía nada (evita errores de red en desarrollo).

---

## 9. Sin sistema de cuentas (por ahora)

La v2 elimina por completo el registro/login que existía en la versión anterior — no hay cuentas, contraseñas ni `localStorage` de usuarios. Las reseñas de cada producto muestran un aviso de "próximamente" en lugar de pedir sesión. Cuando se retome esta función, `privacidad.html` y `seguridad.html` ya tienen preparado el apartado que se debe ampliar con el detalle de cómo se protegerán las contraseñas.

---

## 10. Galería con lightbox

Las imágenes de la galería de cada producto son ahora clicables: abren un visor a pantalla completa (`Lightbox` en `script.js`) con navegación entre imágenes por flechas o teclado (← / → / Esc). Funciona igual aunque las imágenes todavía no existan — mostrará el marcador de posición ampliado.

---

## 11. Carrusel de catálogo (6 productos por página)

El catálogo de `index.html` muestra los productos en páginas de 6, con flechas de navegación y puntos indicadores debajo. Se eligió desplazamiento horizontal en vez de un botón "Ver más" porque mantiene al usuario dentro de la misma vista sin recargas ni saltos de scroll largos, y es coherente con el patrón que ya usa la galería de imágenes de cada producto. Los filtros por categoría (Apps / Ejecutables / Extensiones) recalculan las páginas del carrusel automáticamente.

---

## 12. Páginas legales

`privacidad.html` y `seguridad.html` están alojadas como páginas propias del sitio, enlazadas desde el footer. Indican el estado real actual (no se recogen datos personales, no hay cuentas, tráfico cifrado por HTTPS) y dejan preparado el apartado a ampliar cuando se añadan cuentas de usuario o analíticas de visitas.

---

## Notas técnicas

- **Animaciones de scroll**: elementos con `.reveal` aparecen con fade + desplazamiento al entrar en pantalla (`IntersectionObserver`). Respeta `prefers-reduced-motion`.
- **Accesibilidad**: foco visible, tarjetas y galería navegables por teclado, formularios con mensajes de error asociados.
- **Rendimiento**: sin frameworks. `products.json` se mantiene ligero porque la documentación extensa vive aparte en `docs.json`, cargado solo cuando hace falta.
