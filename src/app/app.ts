import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from './supabase';
import { QRCodeComponent } from 'angularx-qrcode'; // Importamos la librería para generar el QR de la entrada que tambien genera un codigo por si falla el QR.

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, QRCodeComponent], 
  templateUrl: './app.html'
})
export class App implements OnInit {
  
  
  // VARIABLES DE ESTADO (Usamos Signals para que Angular actualice la vista al instante)
  
  // Variables para la vista del Administrador
  adminCandyName = signal<string>('');
  adminCandyCategory = signal<string>('Pochoclos');
  adminCandyPrice = signal<number>(0);
  adminCandyImage = signal<string>('');
  adminTabActiva = signal<'funciones' | 'candy' | 'descuentos'>('funciones'); // Controla qué solapa ve el admin
  adminFirstDiscount = signal<number>(20);
  adminSeniorDiscount = signal<number>(15);
  
  // ==========================================
  // LÓGICA DEL CANDY BAR (Snacks)
  // ==========================================

  // Función exclusiva del admin para crear productos y guardarlos en Supabase
  async crearProductoCandy() {
    const name = this.adminCandyName();
    const category = this.adminCandyCategory();
    const price = this.adminCandyPrice();
    const image = this.adminCandyImage();

    // Validación básica: que tenga nombre y el precio sea mayor a 0
    if (!name || price <= 0) {
      alert('Por favor, completa el nombre y un precio válido para el producto.');
      return;
    }

    // Insertamos el producto en la tabla 'candy_products'
    const { error } = await this.supabase.client.from('candy_products').insert([
      { name: name, category: category, price: price, image_url: image || null, points_cost: 0 }
    ]);

    if (error) {
      console.error('Error al crear producto de candy:', error);
      alert('Error al crear el producto: ' + error.message);
    } else {
      alert('¡Producto de Candy creado con éxito!');
      // se limpian los inputs después de guardar
      this.adminCandyName.set('');
      this.adminCandyPrice.set(0);
      this.adminCandyImage.set('');
    }
  }

  // Trae los productos del candy de la base de datos para mostrárselos al cliente
  async cargarProductosCandyCliente() {
    const { data, error } = await this.supabase.client.from('candy_products').select('*');
    if (!error) {
      this.candyProductsList.set(data || []);
    }
  }

  // Lógica del carrito de compras del Candy Bar
  agregarAlCandy(producto: any) {
    const actual = this.carritoCandy();
    const id = producto.id;
    // Si ya existe, le sumamos 1 a la cantidad. Si no, lo agregamos al carrito con cantidad 1.
    if (actual[id]) {
      actual[id].cantidad += 1;
    } else {
      actual[id] = { producto: producto, cantidad: 1 };
    }
    this.carritoCandy.set({ ...actual }); // Actualizamos el signal copiando el objeto
  }

  quitarDelCandy(producto: any) {
    const actual = this.carritoCandy();
    const id = producto.id;
    // Restamos 1 a la cantidad. Si llega a 0, lo borramos del carrito.
    if (actual[id]) {
      actual[id].cantidad -= 1;
      if (actual[id].cantidad <= 0) {
        delete actual[id];
      }
      this.carritoCandy.set({ ...actual });
    }
  }

  // Calcula cuánta plata suma todo el Candy Bar elegido
  subtotalCandy(): number {
    const actual = this.carritoCandy();
    let total = 0;
    for (const key in actual) {
      total += actual[key].producto.price * actual[key].cantidad;
    }
    return total;
  }

  // ==========================================
  // CONEXIÓN A LA BASE DE DATOS Y ESTADO DE USUARIO
  // ==========================================
  
  private supabase = inject(SupabaseService); // Inyectamos el servicio para usar Supabase en toda la clase

  // Variables para el registro y login
  modoAuth = signal<string>('ninguno');
  emailInput = signal('');
  passwordInput = signal('');
  nombreInput = signal('');
  nacimientoInput = signal('');
  emailInvitadoInput = signal('');

  // Variables para el formulario largo de registro
  regEmail = signal('');
  regPassword = signal('');
  regTipoSangre = signal('');
  regColorOjos = signal('');
  regDiasVacaciones = signal<number | null>(null);
  
  candyProductsList = signal<any[]>([]);
  carritoCandy = signal<{ [id: string]: { producto: any, cantidad: number } }>({});

  facturaGenerada = signal<boolean>(false);
  codigoQRFactura = signal<string>(''); // Acá guardamos el texto que se convierte en QR
  
  // ==========================================
  // SISTEMA DE RESEÑAS (Reviews)
  // ==========================================
  
  resenasPelicula = signal<any[]>([]);
  nuevoRating = signal<number>(5);
  nuevoComentario = signal<string>('');

  cambiarRating(event: any) { this.nuevoRating.set(Number(event.target.value)); }
  cambiarComentario(event: any) { this.nuevoComentario.set(event.target.value); }

  // Función visual que devuelve la cantidad de emojis de estrella según el número
  generarEstrellas(rating: number): string {
    return '⭐'.repeat(rating || 1);
  }

  // Computed que calcula el promedio matemático de las estrellas de todas las reseñas
  promedioEstrellas = computed(() => {
    const lista = this.resenasPelicula();
    if (lista.length === 0) return 'Sin calificaciones';
    const suma = lista.reduce((acc, curr) => acc + curr.rating, 0);
    return (suma / lista.length).toFixed(1); // Lo redondeamos a 1 
  });
  
  // Trae las reseñas de una película específica
  async cargarResenas(movieId: string) {
    const { data, error } = await this.supabase.client.from('reviews').select('*').eq('movie_id', movieId);
    if (!error && data) {
      this.resenasPelicula.set(data);
    }
  }

  // Guarda una nueva reseña verificando que el usuario esté logueado
  async enviarResena() {
    const pelicula = this.peliculaSeleccionada();
    if (!pelicula) return;

    const { data: { user } } = await this.supabase.client.auth.getUser();
    
    // Si no es un usuario registrado, lo mandamos a registrarse
    if (!user) {
      alert('Debes iniciar sesión o registrarte para dejar una reseña.');
      this.mostrarCheckout.set(true);
      this.modoAuth.set('registro');
      return;
    }

    const { error } = await this.supabase.client.from('reviews').insert([
      { movie_id: pelicula.id, user_id: user.id, rating: this.nuevoRating(), comment: this.nuevoComentario() }
    ]);

    if (!error) {
      alert('¡Gracias por calificar la película!');
      this.nuevoComentario.set('');
      this.nuevoRating.set(5);
      this.cargarResenas(pelicula.id); // Recargamos la lista para que vea su comentario
    }
  }

  // ==========================================
  // FLUJO DE COMPRA Y USUARIOS
  // ==========================================

  actualizarEmailInvitado(event: any) { this.emailInvitadoInput.set(event.target.value); }
  actualizarNombre(event: any) { this.nombreInput.set(event.target.value); }
  actualizarNacimiento(event: any) { this.nacimientoInput.set(event.target.value); }
  actualizarEmail(event: any) { this.emailInput.set(event.target.value); }
  actualizarPassword(event: any) { this.passwordInput.set(event.target.value); }

  seleccionarModo(modo: 'registro' | 'invitado') {
    this.modoAuth.set(modo);
  }

  // Genera la compra sin descuento para un invitado (solo le pide el mail)
  async finalizarCompraInvitado() {
    const email = this.emailInvitadoInput();
    if (!email) { alert('Por favor, ingresá un correo electrónico para recibir tus entradas.'); return; }

    const montoFinal = this.subtotal() + this.subtotalCandy(); // Total = entradas + snacks
    const codigoGenerado = 'QR-CINEMA-' + Math.random().toString(36).substring(7).toUpperCase(); // Generamos código random
    this.codigoQRFactura.set(codigoGenerado); 

    const { error } = await this.supabase.client.from('orders').insert([
      { buyer_email: email, total_amount: montoFinal, discount_applied: 0, qr_code: codigoGenerado, funcion_id: this.funcionSeleccionada().id, asientos: this.asientosElegidosTexto() }
    ]);

    if (!error) {
      this.facturaGenerada.set(true);
      this.mostrarCheckout.set(true);
      this.emailInvitadoInput.set('');
    }
  }

  // Genera la compra aplicando el 20% de descuento (0.8) en las entradas por estar registrado
  async finalizarCompraRegistrado() {
    const email = this.emailInput();
    const montoFinal = (this.subtotal() * 0.8) + this.subtotalCandy(); 
    const codigoGenerado = 'QR-CINEMA-' + Math.random().toString(36).substring(7).toUpperCase();
    this.codigoQRFactura.set(codigoGenerado); 

    const { error } = await this.supabase.client.from('orders').insert([
      { buyer_email: email, total_amount: montoFinal, discount_applied: 20, qr_code: codigoGenerado, funcion_id: this.funcionSeleccionada().id, asientos: this.asientosElegidosTexto() }
    ]);

    if (!error) {
      this.facturaGenerada.set(true);
    }
  }

  // Registra al usuario en Auth y guarda sus datos en las tablas relacionales
  async registrarClienteYComprar() {
    const email = this.emailInput();
    const password = this.passwordInput();
    
    if (!email || !password) { alert('Por favor, completá el correo y la contraseña.'); return; }

    // 1. Lo registramos en el sistema de Auth de Supabase
    const { data: authData, error: authError } = await this.supabase.client.auth.signUp({ email, password });
    if (authError) { alert('Error en Auth: ' + authError.message); return; }

    // 2. Si se registró bien, guardamos sus perfiles
    if (authData.user) {
      await this.supabase.client.from('profiles').insert([
        { id: authData.user.id, first_name: this.nombreInput(), last_name: 'Cliente', birth_date: this.nacimientoInput() || '2001-10-23', blood_type: this.regTipoSangre() }
      ]);

      await this.supabase.client.from('perfiles_clientes').insert([
        { id: authData.user.id, email: email, tipo_sangre: this.regTipoSangre(), color_ojos: this.regColorOjos(), dias_vacaciones: this.regDiasVacaciones() }
      ]);
    }

    alert('¡Cuenta creada con éxito! Se aplicó tu 20% de descuento.');
    this.modoAuth.set('registrado'); // Lo marcamos como logueado
    this.mostrarCheckout.set(false); // Lo mandamos de vuelta a la cartelera para que compre
  }

  // ==========================================
  // CARTELERA Y FILTROS
  // ==========================================

  movies = signal<any[]>([]);
  peliculaSeleccionada = signal<any>(null);
  funcionesPelicula = signal<any[]>([]);
  funcionSeleccionada = signal<any>(null);
  asientos = signal<any[]>([]);
  mostrarCheckout = signal<boolean>(false);

  modoAdmin = signal<boolean>(false);
  adminPelicula = signal<any>(null);
  adminFecha = signal<string>('');
  adminFormato = signal<string>('2D');
  adminIdioma = signal<string>('Subtitulada');
  busquedaTexto = signal<string>('');
  generoSeleccionado = signal<string>('');

  // Propiedad calculada que filtra las películas en tiempo real según texto y género
  peliculasFiltradas = computed(() => {
    const texto = this.busquedaTexto().toLowerCase().trim();
    const genero = this.generoSeleccionado();

    return this.movies().filter(movie => {
      const coincideTexto = !texto || movie.title?.toLowerCase().includes(texto) || movie.synopsis?.toLowerCase().includes(texto);
      
      let coincideGenero = true;
      if (genero) {
        const generosPelicula = Array.isArray(movie.genres) ? movie.genres : [];
        coincideGenero = generosPelicula.some((g: string) => g.toLowerCase() === genero.toLowerCase());
      }
      return coincideTexto && coincideGenero;
    });
  });

  // Precios fijos de las entradas
  precioBase = 5000;
  precioVip = 8000;

  // Filtramos la grilla entera para obtener solo los asientos que el usuario clickeó (seleccionó)
  asientosSeleccionados = computed(() => {
    const seleccionados: any[] = [];
    this.asientos().forEach((fila: any) => {
      seleccionados.push(...fila.bloqueIzq.filter((a:any) => a.seleccionada));
      seleccionados.push(...fila.bloqueCentro.filter((a:any) => a.seleccionada));
      seleccionados.push(...fila.bloqueDer.filter((a:any) => a.seleccionada));
    });
    return seleccionados;
  });

  // Extrae los IDs de las butacas (Ej: "A1, A2") para mostrarlos en la factura
  asientosElegidosTexto = computed(() => {
    return this.asientosSeleccionados().map(a => a.id).join(', ');
  });

  // Calcula el costo de las entradas dependiendo de si son VIP o Base
  subtotal = computed(() => {
    return this.asientosSeleccionados().reduce((total, asiento) => {
       return total + (asiento.tipo === 'vip' ? this.precioVip : this.precioBase);
    }, 0);
  });

  // Nos avisa si hay alguna butaca VIP elegida para mostrar un cartel de advertencia de precio
  tieneVip = computed(() => {
    return this.asientosSeleccionados().some(a => a.tipo === 'vip');
  });

  // ==========================================
  // INICIO DE LA APLICACIÓN
  // ==========================================

  // ngOnInit se ejecuta ni bien carga la pantalla
  async ngOnInit() {
    const { data: moviesData } = await this.supabase.client.from('movies').select('*');
    const { data: ordersData } = await this.supabase.client.from('orders').select('funcion_id');
    const { data: funcionesData } = await this.supabase.client.from('funciones').select('id, movie_id');
    const { data: configData } = await this.supabase.client.from('discount_config').select('*').single();
    
    // Cargamos los descuentos de Supabase a los signals
    if (configData) {
      this.adminFirstDiscount.set(configData.first_purchase_discount);
      this.adminSeniorDiscount.set(configData.senior_discount);
    }

    if (moviesData) {
      // Lógica para armar el ranking de películas más vendidas
      if (ordersData && funcionesData) {
        const conteoVentas: { [movieId: string]: number } = {};

        // Contamos cuántas entradas se vendieron por cada película
        ordersData.forEach(order => {
          if (order.funcion_id) {
            const funcion = funcionesData.find(f => f.id === order.funcion_id);
            if (funcion && funcion.movie_id) {
              conteoVentas[funcion.movie_id] = (conteoVentas[funcion.movie_id] || 0) + 1;
            }
          }
        });

        // Ordenamos el array de películas de más vendidas a menos vendidas
        moviesData.sort((a, b) => {
          const ventasA = conteoVentas[a.id] || 0;
          const ventasB = conteoVentas[b.id] || 0;
          return ventasB - ventasA;
        });
      }

      // Le asignamos a cada película su posición en el ranking
      const peliculasConRanking = moviesData.map((movie, index) => ({
        ...movie, ranking: index + 1
      }));

      this.movies.set(peliculasConRanking);
    }
  }

  // Guarda la configuración de porcentajes de descuentos del panel Admin en la base
  async guardarConfigDescuentos() {
    const { error } = await this.supabase.client.from('discount_config').update({
      first_purchase_discount: this.adminFirstDiscount(),
      senior_discount: this.adminSeniorDiscount()
    }).eq('id', 1);

    if (!error) alert('¡Configuración de descuentos actualizada con éxito!');
  }

  seleccionarPeliculaAdmin(event: any) {
    const movieId = event.target.value;
    const movie = this.movies().find(m => m.id === movieId);
    this.adminPelicula.set(movie);
  }

  ejecutarAlgoritmo() {
    if (!this.adminPelicula() || !this.adminFecha()) {
      alert('Por favor elegí una película y una fecha para programar.');
      return;
    }
    this.programarFuncionAutomatica(this.adminPelicula(), this.adminFecha(), this.adminFormato(), this.adminIdioma());
  }

  async seleccionarPelicula(movie: any) {
    this.peliculaSeleccionada.set(movie);
    this.cargarResenas(movie.id); 

    // Traemos los horarios disponibles para esta peli ordenados por hora
    const { data } = await this.supabase.client.from('funciones').select('*').eq('movie_id', movie.id).order('inicio', { ascending: true });
    this.funcionesPelicula.set(data || []);
  }

  // ==========================================
  // RESTRICCIONES DE EDAD Y VALIDACIONES
  // ==========================================

  // Función para sacar la edad exacta en base a la fecha de nacimiento
  calcularEdad(birthDateString: string): number {
    if (!birthDateString) return 0;
    const hoy = new Date();
    const nacimiento = new Date(birthDateString);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const m = hoy.getMonth() - nacimiento.getMonth();
    // Ajuste por si todavía no cumplió años este año
    if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) { edad--; }
    return edad;
  }

  async seleccionarFuncion(funcion: any) {
    const pelicula = this.peliculaSeleccionada();
    const minAge = pelicula?.min_age || 0; // Sacamos la edad mínima, si no tiene es 0

    // Si la peli tiene restricción (+13, +18, etc) validamos al usuario
    if (minAge > 0) {
      const { data: { user } } = await this.supabase.client.auth.getUser();
      
      // Si entró como invitado, le obligamos a loguearse para validar su edad
      if (!user) {
        alert(`Esta película es para mayores de ${minAge} años. Debes iniciar sesión o registrarte para verificar tu edad.`);
        this.mostrarCheckout.set(true);
        this.modoAuth.set('registro');
        return;
      }

      // Buscamos su fecha de nacimiento en la tabla
      const { data: profile } = await this.supabase.client.from('profiles').select('birth_date').eq('id', user.id).single();
      const edadUsuario = this.calcularEdad(profile?.birth_date);

      // Bloqueo: Si es menor, cortamos acá y no avanza a la butaca
      if (edadUsuario < minAge) {
        alert(`Acceso denegado: Esta función es exclusiva para mayores de ${minAge} años. Tu edad registrada es ${edadUsuario} años.`);
        return;
      }
    }

    // Si pasó las pruebas (o si no hay restricción), avanza
    this.funcionSeleccionada.set(funcion);
    this.generarSala(); // Dibuja la grilla
    await this.cargarAsientosOcupados(funcion.id); // Pinta de gris los ya vendidos
  }

  // ==========================================
  // ARMADO Y MAPEO DE SALA / BUTACAS
  // ==========================================

  // Trae de Supabase qué butacas ya compraron otros clientes y las marca como ocupadas
  async cargarAsientosOcupados(funcionId: any) {
    const { data } = await this.supabase.client.from('orders').select('asientos').eq('funcion_id', funcionId);

    if (data) {
      let ocupados: string[] = [];
      data.forEach(orden => {
        if (orden.asientos) {
          // Si el texto es "A1, A2", lo separamos por coma
          const asientosArray = orden.asientos.split(',').map((s: string) => s.trim());
          ocupados = ocupados.concat(asientosArray);
        }
      });

      // Recorremos todos nuestros asientos y si coinciden con los ocupados, les ponemos true
      this.asientos.update(filas =>
        filas.map((f: any) => ({
          ...f,
          bloqueIzq: f.bloqueIzq.map((a: any) => ({ ...a, ocupada: ocupados.includes(a.id) })),
          bloqueCentro: f.bloqueCentro.map((a: any) => ({ ...a, ocupada: ocupados.includes(a.id) })),
          bloqueDer: f.bloqueDer.map((a: any) => ({ ...a, ocupada: ocupados.includes(a.id) }))
        }))
      );
    }
  }

  // Algoritmo que le busca una sala vacía a la película automáticamente en ese horario
  async programarFuncionAutomatica(pelicula: any, fechaHoraInicio: string, formato: string, idioma: string) {
    const inicio = new Date(fechaHoraInicio);
    const minutosTotales = pelicula.duration_minutes + 30; // 30 min de limpieza
    const fin = new Date(inicio.getTime() + minutosTotales * 60000);

    const { data: funcionesOcupadas } = await this.supabase.client
      .from('funciones')
      .select('sala_id')
      .or(`and(inicio.lte.${fin.toISOString()},fin.gte.${inicio.toISOString()})`);

    const salasOcupadas = funcionesOcupadas?.map(f => f.sala_id) || [];
    const todasLasSalas = [1, 2, 3, 4, 5];

    const salaDisponible = todasLasSalas.find(sala => !salasOcupadas.includes(sala));

    if (!salaDisponible) {
      alert('Error: No hay salas disponibles en este horario. Todas están ocupadas o en limpieza.');
      return;
    }

    const { error } = await this.supabase.client.from('funciones').insert([
      { movie_id: pelicula.id, sala_id: salaDisponible, inicio: inicio.toISOString(), fin: fin.toISOString(), formato: formato, idioma: idioma }
    ]);

    if (!error) alert(`¡Éxito! Función programada automáticamente en la Sala ${salaDisponible}.`);
  }

  // Dibuja la estructura física del cine con sus pasillos y tipos de asiento (VIP, Accesible, Normal)
  generarSala() {
    let salasLayout = [];
    const letras = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T'];

    for (const letra of letras) {
      let tipo = 'normal';
      let cantIzq = 4, cantCentro = 20, cantDer = 4;

      if (letra === 'J' || letra === 'K') {
        tipo = 'accesible'; // Fila para sillas de ruedas
        cantIzq = 2; cantCentro = 10; cantDer = 2;
      }
      else if (letra === 'R' || letra === 'S' || letra === 'T') {
        tipo = 'vip'; // Filas VIP del fondo
      }

      let num = 1;
      const crearBloque = (cant: number) => {
        const bloque = [];
        for(let i = 0; i < cant; i++) {
          bloque.push({ id: `${letra}${num}`, numero: num, letra: letra, tipo: tipo, seleccionada: false, ocupada: false });
          num++;
        }
        return bloque;
      };

      salasLayout.push({ letra, bloqueIzq: crearBloque(cantIzq), bloqueCentro: crearBloque(cantCentro), bloqueDer: crearBloque(cantDer) });
    }
    this.asientos.set(salasLayout);
  }

  // Cambia el estado (verde/blanco) del asiento al hacerle click
  toggleAsiento(asientoClickeado: any) {
    if (asientoClickeado.ocupada) return; // Si ya se vendió, no hace nada

    this.asientos.update(filas =>
      filas.map((f: any) => {
        if (f.letra === asientoClickeado.letra) {
          return {
            ...f,
            bloqueIzq: f.bloqueIzq.map((a: any) => a.id === asientoClickeado.id ? { ...a, seleccionada: !a.seleccionada } : a),
            bloqueCentro: f.bloqueCentro.map((a: any) => a.id === asientoClickeado.id ? { ...a, seleccionada: !a.seleccionada } : a),
            bloqueDer: f.bloqueDer.map((a: any) => a.id === asientoClickeado.id ? { ...a, seleccionada: !a.seleccionada } : a),
          };
        }
        return f;
      })
    );
  }

  // ==========================================
  // NAVEGACIÓN ENTRE PANTALLAS
  // ==========================================

  volver() {
    this.peliculaSeleccionada.set(null);
    this.funcionSeleccionada.set(null);
    this.mostrarCheckout.set(false);
    this.facturaGenerada.set(false);
  }

  continuarCompra() {
    this.mostrarCheckout.set(true);
  }

  volverASala() {
    this.mostrarCheckout.set(false);
    this.funcionSeleccionada.set(null);
  }
}