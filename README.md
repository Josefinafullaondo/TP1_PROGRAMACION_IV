#  Cinema Manager & Ticketing System - TP1 Programación IV

Aplicación web integral para la gestión, reserva y venta de entradas y productos de candy bar de un complejo cinematográfico. Desarrollada como Single Page Application (SPA) con Progressive Web App (PWA) utilizando **Angular** (versión moderna basada en Signals y componentes Standalone) y **Supabase** como plataforma Backend-as-a-Service (PostgreSQL, Autenticación y Realtime Engine).

---

##  1. Especificación Formal de Requerimientos

El sistema surge a partir de requerimientos provistos por el cliente a través de comunicación directa. A continuación, se detalla la formalización del alcance.

### 1.1. Perfiles de Usuario y Roles (RBAC)

*   **Público General / Cliente Anónimo:**
    *   Visualización de cartelera activa, Top 3 de películas más vendidas, tráileres y fichas técnicas.
    *   Búsqueda y filtrado multicriterio (por título y múltiples géneros).
    *   Consulta de valoraciones y reseñas de otros usuarios con cálculo de promedio de estrellas.
    *   Selección de butacas en tiempo real y compra de entradas sin necesidad de registro.
*   **Cliente Registrado:**
    *   Perfil de usuario con recolección de datos específicos: Nombre, apellido, email, fecha de nacimiento, grupo sanguíneo, color de ojos y días anuales de vacaciones.
    *   Beneficio de bienvenida: Descuento configurable (20% por defecto) aplicado automáticamente en la primera compra.
    *   Programa de Fidelización ("Puntos Cine"): Acumulación automática de 1 punto por cada $1 gastado; canje por entradas y consumiciones del Candy Bar.
    *   Gestión de saldo/crédito a favor: Monedero virtual alimentado por cancelaciones previas, combinable con métodos de pago estándar.
    *   Gestión de reservas: Cancelación de entradas con hasta 2 horas de antelación a la función (reembolso en crédito interno).
    *   Espacio personal *"Mis Películas"*: Registro visual interactivo de funciones vistas con posters, fechas y valoraciones personales.
    *   Sistema de alertas de cartelera: Suscripción a notificaciones para películas en sección "Próximamente" al habilitarse la preventa.
*   **Empleado / Staff:**
    *   Módulo de validación rápida: Lector/escáner de código QR para control de acceso a salas y retiro de pedidos de Candy Bar.
    *   Ingreso manual de código alfanumérico para contingencias por fallas de hardware.
    *   Invalidación y quemado automático del ticket tras su validación (un solo uso).
*   **Administrador:**
    *   Gestión integral (CRUD) de catálogo: Películas, salas, proyecciones (formatos 2D, 3D, 4D, 5D; idiomas subtitulado/doblado), productos y combos de Candy Bar.
    *   Asignación automática e inteligente de salas sin solapamientos.
    *   Configuración comercial: Precios de preventa (habilitada 7 días previos), porcentaje de cupones, reglas para mayores de 50 años y tabla de equivalencias de puntos.
    *   Módulo de Business Intelligence y Reportes: Métricas de recaudación diaria, tickets emitidos, ranking de ventas y consumiciones; exportación a Excel y PDF.
    *   Log y auditoría: Trazabilidad completa con marcas de tiempo (timestamp) de toda acción crítica (creación de funciones, modificación de tarifas, validación de accesos).

---

### 1.2. Requerimientos Funcionales (RF)

| ID | Módulo | Descripción |
| :--- | :--- | :--- |
| **RF-01** | Catálogo | Visualizar cartelera destacando el **Top 3** de películas con mayor volumen de ventas. |
| **RF-02** | Búsqueda | Buscador dinámico con filtrado reactivo por título y por múltiples géneros simultáneos. |
| **RF-03** | Reseñas | Sistema de calificación (1 a 5 estrellas) y comentarios breves con promedio general visible antes del checkout. |
| **RF-04** | Sala (Layout) | Sala fija de 20 filas (A a T) y 3 bloques de columnas: Estándar (4-20-4), Accesibles (filas J y K adaptadas: 2-10-2) y VIP (filas R, S y T). |
| **RF-05** | Realtime | Sincronización en vivo del mapa de butacas: bloqueo visual instantáneo ante selección de otro usuario. |
| **RF-06** | Scheduler | Motor de asignación automática de salas: impide funciones simultáneas y garantiza un intervalo de **30 minutos de limpieza** tras el fin de la función previa. |
| **RF-07** | Restricción Edad | Restricción estricta por edad (+13, +18) calculada según la fecha de nacimiento. Emisión de leyenda obligatoria "Acompañado por adulto". |
| **RF-08** | Candy Bar | Venta combinada de entradas y productos de confitería, incluyendo combos destacados configurados por el administrador. |
| **RF-09** | Tickets | Generación de comprobante digital en **PDF con código QR unificado** para ingreso a sala y retiro de confitería. |
| **RF-10** | Check-in QR | Escaneo y validación de QR con revocación inmediata del pase para evitar reusos. Entrada alternativa por código manual. |
| **RF-11** | Cancelaciones | Cancelación autogestionada hasta 2 horas antes de la función, generando crédito a favor en la cuenta (sin reintegro monetario). |
| **RF-12** | Fidelización | Motor de acumulación de puntos (1:1 sobre pesos gastados), módulo de canje y visor de historial de transacciones. |
| **RF-13** | Próximamente | Cartelera de estrenos futuros con opción de alerta de venta y preventa tarifaria especial 7 días antes. |
| **RF-14** | Reportes & Logs | Panel de métricas con exportación a PDF/Excel y registro inmutable de auditoría para acciones del personal. |

---

### 1.3. Requerimientos No Funcionales (RNF)

*   **RNF-01 - Arquitectura SPA:** Implementación con **Angular** utilizando componentes *Standalone*, reactividad de grano fino con **Signals** (`signal()`, `computed()`, `model()`) y tipado estricto en TypeScript.
*   **RNF-02 - Persistencia y Backend:** Integración con **Supabase** aprovechando PostgreSQL, políticas de seguridad por fila (**Row Level Security - RLS**) y WebSockets para **Supabase Realtime**.
*   **RNF-03 - PWA (Progressive Web App):** Configuración de Service Worker y manifiesto web para garantizar compatibilidad móvil, instalación y disponibilidad offline de tickets adquiridos.
*   **RNF-04 - Usabilidad y UX:** Prohibición estricta de selectores de fecha nativos engorrosos. Navegación fluida por carruseles/píldoras de fechas y franjas horarias directas.
*   **RNF-05 - Interfaz Visual:** Diseño minimalista, contemporáneo y de alto contraste (escala de grises, blancos y negros) que garantice accesibilidad y estética profesional.

---

##  2. Arquitectura de Software y Decisiones Técnicas

### 2.1. Estructura de Capas en Angular
El proyecto sigue una organización modular escalable basada en la arquitectura limpia recomendada para Angular:

```text
src/app/
├── core/                  # Singleton services, configuración de Supabase, guards, interceptores
│   ├── guards/            # AuthGuard, RoleGuard (admin/staff)
│   └── services/          # SupabaseService, AuthService, AuditService
├── shared/                # Componentes reutilizables, directivas y pipes
│   ├── components/        # Navbar, Footer, QRModal, DateSelector
│   └── pipes/             # SeatTypePipe, AgeRatingPipe, DurationPipe
├── features/              # Módulos funcionales de negocio (Lazy Loaded)
│   ├── movies/            # Cartelera, detalles, buscador, reseñas
│   ├── booking/           # Selección de butacas (Realtime), Candy Bar, Checkout
│   ├── profile/           # "Mis Películas", billetera de créditos, puntos
│   ├── staff/             # Escáner y validador de QR
│   └── admin/             # ABM de funciones, scheduler, reportes, logs
└── models/                # Interfaces y contratos TypeScript