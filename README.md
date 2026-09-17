# Cinema Manager

## 1. Enunciado del Alcance del Proyecto
*   **Objetivos del Proyecto:** Lograr que el costo de ejecución del proyecto no supere los presupuestados.
*   **Riesgos Iniciales Definidos:** Resistencia al cambio por parte de la organización del cliente (Probabilidad: Baja. Impacto: Alto).
*   **Fases Principales del Proyecto (EDT):** El alcance comprende la Reingeniería - Orientación de los Procesos al concepto de CRM.
    *   Hitos: (1) Aceptación del acta de capacitación en la estrategia de CRM a las áreas de ventas y marketing del Bank Central. (2) Procesos redefinidos y aceptados por las áreas de ventas y marketing del Bank Central.
*   **Restricciones:**
    *   Se cuenta con 5 meses a partir de la fecha de inicio para culminar el proyecto.
    *   Se cuenta con un monto máximo de dinero establecido.
*   **Asunciones:** El cliente tiene la disposición y capacidad para redefinir sus procesos de acuerdo a la estrategia de CRM que se implementará.

## 2. Arquitectura y Decisiones Tecnicas
*   Frontend desarrollado con Angular utilizando componentes independientes (Standalone Components) y Signals para la gestion reactiva del estado.
*   Base de datos y backend integrados mediante Supabase (PostgreSQL).
*   Estilos implementados con CSS nativo bajo una paleta estricta de colores negros, blancos y grises.
*   Aplicacion configurada como Progressive Web App (PWA) para soporte offline e instalabilidad.

## 3. Requerimientos del Sistema
*   **Venta y Accesos:** Sistema web para sacar entradas que genere un comprobante en formato PDF con un codigo QR para validacion.
*   **Estructura de Salas y Butacas:**
    *   Salas con formato base de 20 filas numeradas con letras y 3 columnas.
    *   Modificacion de filas centrales (J y K) para butacas accesibles y designacion de ultimas tres filas (R, S y T) como butacas VIP con precio diferencial.
    *   Visualizacion del estado de ocupacion de las butacas en tiempo real durante la compra.
*   **Cartelera y Navegacion:** 
    *   Seccion principal con las 3 peliculas mas vendidas y un buscador con filtro por genero.
    *   Seccion "Proximamente" con alertas de preventa configurables por pelicula.
    *   Regla de negocio: Obligatoriedad de 30 minutos de separacion minima entre funciones en la misma sala.
*   **Gestion de Usuarios y Fidelizacion:** 
    *   Registro de usuarios para obtener perfil y beneficios (incluyendo recopilacion de datos especificos solicitados).
    *   Programa de puntos acumulables (1 peso = 1 punto) canjeables por productos o entradas, e historial visual de peliculas vistas con reseñas.
    *   Descuento del 20% en la primera compra y cupones configurables para mayores de 50 años.
*   **Candy Bar:** Integracion de compra de pochoclos, bebidas y combos, asociando los productos al mismo codigo QR de la entrada.
*   **Administracion (Backoffice):**
    *   Control centralizado de peliculas, horarios, formatos y productos del Candy Bar.
    *   Asignacion automatica de salas asegurando que no existan superposiciones horarias.
    *   Reportes de facturacion exportables a PDF y Excel, y graficos estadisticos de ventas.
    *   Registro (log) de actividad detallando fecha y hora de las acciones de los empleados en el sistema.
*   **Cancelaciones:** Permitir la cancelacion de compras hasta 2 horas previas a la funcion devolviendo credito interno al usuario.