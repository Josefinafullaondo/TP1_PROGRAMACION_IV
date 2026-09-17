# Cinema Manager - Documentación y Requerimientos del Proyecto

Este documento recopila la arquitectura, decisiones técnicas y el listado definitivo de requerimientos funcionales extraídos del intercambio de correos del proyecto. Su objetivo es servir como guía central de desarrollo para cumplir con todos los entregables del Trabajo Práctico.

---

##  Arquitectura y Decisiones Técnicas

*   **Frontend**: Angular (utilizando Signals, componentes standalone y enrutamiento modular).
*   **Backend / Base de Datos**: Supabase (Autenticación, tablas relacionales, políticas de seguridad y almacenamiento).
*   **Librerías Clave**: `angularx-qrcode` para la generación de códigos QR de entradas y Candy Bar.
*   **Despliegue**: Aplicación web desplegada con URL funcional, PWA integrada, código fuente alojado en GitHub.
*   **Diseño Visual**: Estilo único, oscuro y producido, priorizando una navegación fluida sin abusar de scroll innecesario en selectores de fechas u horas.

---

##  Listado Definitivo de Requerimientos (Funcionalidades del Sistema)

### 1. Gestión de Películas y Cartelera
*   **Datos de Película**: Toda película almacena nombre, duración, imagen (póster), sinopsis y géneros (múltiples por película).
*   **Restricciones de Edad**: Clasificación por edades ( apta todo público, mayores de 13 o mayores de 18 años). Los menores no pueden comprar para funciones restringidas, y las compras de estas películas deben advertir la necesidad de ir acompañados por un adulto.
*   **Secciones Especiales**:
    *   **Página Principal**: Muestra de forma destacada las **3 películas más vendidas**.
    *   **Buscador y Filtros**: Filtrado por texto (título/sinopsis) y por **género**.
    *   **Próximamente**: Sección con estrenos futuros donde los usuarios pueden activar alertas de notificación.
    *   **Mis Películas**: Historial visual del usuario con pósters, fechas y sus calificaciones personales.

### 2. Funciones y Asignación de Salas
*   **Distribución de Butacas**: 
    *   20 filas numeradas con letras (A a T) y 3 bloques de columnas.
    *   Filas **J y K**: Adaptadas para personas con discapacidad (espacios centrales reducidos a 2, 10 y 2 butacas con diseño diferenciado).
    *   Filas **R, S y T**: Butacas **VIP** con precio superior y marcado visual claro.
*   **Asignación Automática**: El administrador programa horarios y el sistema asigna automáticamente una sala disponible asegurando que **nunca** haya solapamiento y respetando el margen obligatorio de **30 minutos de limpieza/descanso** entre función y función.
*   **Preventa**: Apertura de ventas 7 días antes del estreno con precio especial configurable por película.

### 3. Sala en Tiempo Real y Compras
*   **Mapa en Vivo**: Al seleccionar butacas, el usuario ve en tiempo real cuáles están ocupadas por otros compradores en ese mismo instante.
*   **Tipos de Usuario y Descuentos**:
    *   **Anónimos / Invitados**: Compra libre sin registro previo.
    *   **Registrados**: Recopilación de datos de perfil (mail, nombre, apellido, fecha de nacimiento, tipo de sangre, color de ojos y días de vacaciones al año). Obtienen un **cupón de 20% de descuento** en su primera compra (configurable en porcentaje por el admin).
    *   **Descuentos por Edad**: Cupones exclusivos para usuarios mayores de 50 años.
*   **Candy Bar**: Compra integrada de pochoclos, bebidas y golosinas por categorías, sumadas al ticket de la entrada.
*   **Combos Especiales**: Entrada + pochoclos + bebida a precio fijo configurable por el admin, destacados en la vista de compra.
*   **Cancelaciones**: Los usuarios pueden cancelar una compra hasta 2 horas antes de la función recibiendo **crédito en su cuenta** (no devolución de dinero).
*   **Programa de Fidelización**: Acumulación de 1 punto por cada peso gastado. Los puntos se canjean por entradas gratis o productos del Candy Bar (costos en puntos configurables por el admin). Historial de canjes visible en el perfil.

### 4. Sistema de Reseñas y Calificaciones
*   Calificación con estrellas (1 a 5) y comentarios cortos por película.
*   Visualización del promedio de estrellas antes de realizar la compra.

### 5. Tickets, QR y Validación (Empleados)
*   Generación de comprobante digital con **código QR único** que engloba tanto las butacas como los productos del Candy Bar adquiridos.
*   **Panel de Empleados**: Herramienta para escanear los QR de los clientes (con opción de tipeo manual del código por fallas del lector). Una vez validado o entregada la comida, **el QR se invalida automáticamente**.

### 6. Panel de Administración
*   **Control Total**: Gestión de salas, funciones, distribución de butacas, precios y productos del Candy Bar.
*   **Reportes y Gráficas**: 
    *   Reporte diario de facturación y cantidad de entradas vendidas (con opción de **exportar a PDF y Excel**).
    *   Gráficos estadísticos de películas más vistas por semana/mes y producto del Candy más vendido.
