import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from './supabase';
import { QRCodeComponent } from 'angularx-qrcode'; // <--- 1. Importación del QR

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, QRCodeComponent], // <--- 2. Agregado a los imports
  templateUrl: './app.html'
})
export class App implements OnInit {
  adminCandyName = signal<string>('');
  adminCandyCategory = signal<string>('Pochoclos');
  adminCandyPrice = signal<number>(0);
  adminCandyImage = signal<string>('');
  adminTabActiva = signal<'funciones' | 'candy'>('funciones');
  
  // Función para guardar un nuevo producto de Candy en Supabase
  async crearProductoCandy() {
    const name = this.adminCandyName();
    const category = this.adminCandyCategory();
    const price = this.adminCandyPrice();
    const image = this.adminCandyImage();

    if (!name || price <= 0) {
      alert('Por favor, completa el nombre y un precio válido para el producto.');
      return;
    }

    const { error } = await this.supabase.client.from('candy_products').insert([
      {
        name: name,
        category: category,
        price: price,
        image_url: image || null,
        points_cost: 0
      }
    ]);

    if (error) {
      console.error('Error al crear producto de candy:', error);
      alert('Error al crear el producto: ' + error.message);
    } else {
      alert('¡Producto de Candy creado con éxito!');
      this.adminCandyName.set('');
      this.adminCandyPrice.set(0);
      this.adminCandyImage.set('');
    }
  }
  async cargarProductosCandyCliente() {
    const { data, error } = await this.supabase.client.from('candy_products').select('*');
    if (error) {
      console.error('Error al cargar el candy bar:', error);
    } else {
      this.candyProductsList.set(data || []);
    }
  }
  // Función para agregar o sumar cantidad de un producto al carrito
  agregarAlCandy(producto: any) {
    const actual = this.carritoCandy();
    const id = producto.id;
    
    if (actual[id]) {
      actual[id].cantidad += 1;
    } else {
      actual[id] = { producto: producto, cantidad: 1 };
    }
    // Forzamos la actualización del signal
    this.carritoCandy.set({ ...actual });
  }

  // Función para restar o quitar un producto del carrito
  quitarDelCandy(producto: any) {
    const actual = this.carritoCandy();
    const id = producto.id;
    
    if (actual[id]) {
      actual[id].cantidad -= 1;
      if (actual[id].cantidad <= 0) {
        delete actual[id];
      }
      this.carritoCandy.set({ ...actual });
    }
  }

  // Función que calcula el total en plata de todo el Candy Bar elegido
  subtotalCandy(): number {
    const actual = this.carritoCandy();
    let total = 0;
    for (const key in actual) {
      total += actual[key].producto.price * actual[key].cantidad;
    }
    return total;
  }
  private supabase = inject(SupabaseService);


  modoAuth = signal<string>('ninguno');
  emailInput = signal('');
  passwordInput = signal('');
  nombreInput = signal('');
  nacimientoInput = signal('');
  emailInvitadoInput = signal('');

  regEmail = signal('');
  regPassword = signal('');
  regTipoSangre = signal('');
  regColorOjos = signal('');
  regDiasVacaciones = signal<number | null>(null);
  candyProductsList = signal<any[]>([]);
  carritoCandy = signal<{ [id: string]: { producto: any, cantidad: number } }>({});

  facturaGenerada = signal<boolean>(false);
  codigoQRFactura = signal<string>(''); // <--- Acá guardamos el texto del QR
  
  // --- SISTEMA DE RESEÑAS (ESTADO - SIN EÑES) ---
  resenasPelicula = signal<any[]>([]);
  nuevoRating = signal<number>(5);
  nuevoComentario = signal<string>('');

  cambiarRating(event: any) { this.nuevoRating.set(Number(event.target.value)); }
  cambiarComentario(event: any) { this.nuevoComentario.set(event.target.value); }

  // Función segura para las estrellas
  generarEstrellas(rating: number): string {
    return '⭐'.repeat(rating || 1);
  }

  promedioEstrellas = computed(() => {
    const lista = this.resenasPelicula();
    if (lista.length === 0) return 'Sin calificaciones';
    const suma = lista.reduce((acc, curr) => acc + curr.rating, 0);
    return (suma / lista.length).toFixed(1);
  });
  
  // --- SISTEMA DE RESEÑAS (SUPABASE - SIN EÑES) ---
  async cargarResenas(movieId: string) {
    const { data, error } = await this.supabase.client
      .from('reviews')
      .select('*')
      .eq('movie_id', movieId);

    if (!error && data) {
      this.resenasPelicula.set(data);
    }
  }

  async enviarResena() {
    const pelicula = this.peliculaSeleccionada();
    if (!pelicula) return;

    const { data: { user } } = await this.supabase.client.auth.getUser();
    
    if (!user) {
      alert('Debes iniciar sesión o registrarte para dejar una reseña.');
      this.mostrarCheckout.set(true);
      this.modoAuth.set('registro');
      return;
    }

    const { error } = await this.supabase.client.from('reviews').insert([
      {
        movie_id: pelicula.id,
        user_id: user.id,
        rating: this.nuevoRating(),
        comment: this.nuevoComentario()
      }
    ]);

    if (error) {
      alert('Error al guardar la reseña: ' + error.message);
    } else {
      alert('¡Gracias por calificar la película!');
      this.nuevoComentario.set('');
      this.nuevoRating.set(5);
      this.cargarResenas(pelicula.id);
    }
  }
  // ------------------------------------

  actualizarEmailInvitado(event: any) { this.emailInvitadoInput.set(event.target.value); }
  actualizarNombre(event: any) { this.nombreInput.set(event.target.value); }
  actualizarNacimiento(event: any) { this.nacimientoInput.set(event.target.value); }
  actualizarEmail(event: any) { this.emailInput.set(event.target.value); }
  actualizarPassword(event: any) { this.passwordInput.set(event.target.value); }

  seleccionarModo(modo: 'registro' | 'invitado') {
    this.modoAuth.set(modo);
  }

  async finalizarCompraInvitado() {
    const email = this.emailInvitadoInput();
    if (!email) {
      alert('Por favor, ingresá un correo electrónico para recibir tus entradas.');
      return;
    }

    const montoFinal = this.subtotal() + this.subtotalCandy(); // Sumamos el candy
    const codigoGenerado = 'QR-CINEMA-' + Math.random().toString(36).substring(7).toUpperCase();
    
    this.codigoQRFactura.set(codigoGenerado); // <-- Guardamos para el HTML

    const { error } = await this.supabase.client.from('orders').insert([
      {
        buyer_email: email,
        total_amount: montoFinal,
        discount_applied: 0,
        qr_code: codigoGenerado,
        funcion_id: this.funcionSeleccionada().id,      // <-- GUARDAMOS LA FUNCIÓN
        asientos: this.asientosElegidosTexto()          // <-- GUARDAMOS LAS BUTACAS
      }
    ]);

    if (error) {
      console.error('Error detallado de Supabase:', error);
      alert('Hubo un error al procesar la compra: ' + error.message);
    } else {
      this.facturaGenerada.set(true);
      this.mostrarCheckout.set(true);
      this.emailInvitadoInput.set('');
    }
  }

  async finalizarCompraRegistrado() {
    const email = this.emailInput();
    const montoFinal = (this.subtotal() * 0.8) + this.subtotalCandy();
    const codigoGenerado = 'QR-CINEMA-' + Math.random().toString(36).substring(7).toUpperCase();
    
    this.codigoQRFactura.set(codigoGenerado); // <-- Guardamos para el HTML

    const { error } = await this.supabase.client.from('orders').insert([
      {
        buyer_email: email,
        total_amount: montoFinal,
        discount_applied: 20,
        qr_code: codigoGenerado,
        funcion_id: this.funcionSeleccionada().id,      // <-- GUARDAMOS LA FUNCIÓN
        asientos: this.asientosElegidosTexto()          // <-- GUARDAMOS LAS BUTACAS
      }
    ]);

    if (error) {
      alert('Error al comprar: ' + error.message);
    } else {
      this.facturaGenerada.set(true);
    }
  }

  async registrarClienteYComprar() {
    const email = this.emailInput();
    const password = this.passwordInput();
    const nombre = this.nombreInput();
    const apellido = 'Cliente';
    const fechaNacimiento = this.nacimientoInput() || '2001-10-23';

    if (!email || !password) {
      alert('Por favor, completá el correo y la contraseña.');
      return;
    }

    const { data: authData, error: authError } = await this.supabase.client.auth.signUp({
      email,
      password,
    });

    if (authError) {
      alert('Error en Auth: ' + authError.message);
      return;
    }

    if (authData.user) {
      const { error: profileError } = await this.supabase.client.from('profiles').insert([
        {
          id: authData.user.id,
          first_name: nombre,
          last_name: apellido,
          birth_date: fechaNacimiento,
          blood_type: this.regTipoSangre()
        }
      ]);

      if (profileError) console.error('Error en profiles:', profileError.message);

      const { error: exoticError } = await this.supabase.client.from('perfiles_clientes').insert([
        {
          id: authData.user.id,
          email: email,
          tipo_sangre: this.regTipoSangre(),
          color_ojos: this.regColorOjos(),
          dias_vacaciones: this.regDiasVacaciones()
        }
      ]);

      if (exoticError) console.error('Error en perfiles_clientes:', exoticError.message);
    }

   // --- CORRECCIÓN DEL FLUJO ---
    alert('¡Cuenta creada con éxito! Se aplicó tu 20% de descuento.');
    this.modoAuth.set('registrado'); // ¡Ahora sabe que ya estás adentro!
    this.mostrarCheckout.set(false); // Te manda derechito a la cartelera
  
  }

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

  peliculasFiltradas = computed(() => {
    const texto = this.busquedaTexto().toLowerCase().trim();
    const genero = this.generoSeleccionado();

    return this.movies().filter(movie => {
      const coincideTexto = !texto ||
        movie.title?.toLowerCase().includes(texto) ||
        movie.synopsis?.toLowerCase().includes(texto);

      let coincideGenero = true;
      if (genero) {
        const generosPelicula = Array.isArray(movie.genres) ? movie.genres : [];
        coincideGenero = generosPelicula.some((g: string) => g.toLowerCase() === genero.toLowerCase());
      }

      return coincideTexto && coincideGenero;
    });
  });

  precioBase = 5000;
  precioVip = 8000;

  asientosSeleccionados = computed(() => {
    const seleccionados: any[] = [];
    this.asientos().forEach((fila: any) => {
      seleccionados.push(...fila.bloqueIzq.filter((a:any) => a.seleccionada));
      seleccionados.push(...fila.bloqueCentro.filter((a:any) => a.seleccionada));
      seleccionados.push(...fila.bloqueDer.filter((a:any) => a.seleccionada));
    });
    return seleccionados;
  });

  asientosElegidosTexto = computed(() => {
    return this.asientosSeleccionados().map(a => a.id).join(', ');
  });

  subtotal = computed(() => {
    return this.asientosSeleccionados().reduce((total, asiento) => {
       return total + (asiento.tipo === 'vip' ? this.precioVip : this.precioBase);
    }, 0);
  });

  tieneVip = computed(() => {
    return this.asientosSeleccionados().some(a => a.tipo === 'vip');
  });

  async ngOnInit() {
    const { data } = await this.supabase.client.from('movies').select('*');
    if (data) {
      this.movies.set(data);
    }
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

    const { data } = await this.supabase.client
      .from('funciones')
      .select('*')
      .eq('movie_id', movie.id)
      .order('inicio', { ascending: true });

    this.funcionesPelicula.set(data || []);
  }

  async seleccionarFuncion(funcion: any) {
    this.funcionSeleccionada.set(funcion);
    this.generarSala();
    await this.cargarAsientosOcupados(funcion.id); // <-- Pinta de gris los ya vendidos
  }

  // --- NUEVA FUNCIÓN: Busca las órdenes de esa función y extrae los asientos ---
  async cargarAsientosOcupados(funcionId: any) {
    const { data, error } = await this.supabase.client
      .from('orders')
      .select('asientos')
      .eq('funcion_id', funcionId);

    if (data) {
      let ocupados: string[] = [];
      data.forEach(orden => {
        if (orden.asientos) {
          // Si compró "R13, R14", lo separa y lo suma a la lista general
          const asientosArray = orden.asientos.split(',').map((s: string) => s.trim());
          ocupados = ocupados.concat(asientosArray);
        }
      });

      // Actualizamos los signals para marcar 'ocupada: true' a las coincidencias
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

  async programarFuncionAutomatica(pelicula: any, fechaHoraInicio: string, formato: string, idioma: string) {
    const inicio = new Date(fechaHoraInicio);
    const minutosTotales = pelicula.duration_minutes + 30;
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
      {
        movie_id: pelicula.id,
        sala_id: salaDisponible,
        inicio: inicio.toISOString(),
        fin: fin.toISOString(),
        formato: formato,
        idioma: idioma
      }
    ]);

    if (!error) {
      alert(`¡Éxito! Función programada automáticamente en la Sala ${salaDisponible}.`);
    } else {
      alert('Error al programar: ' + error.message);
    }
  }

  generarSala() {
    let salasLayout = [];
    const letras = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T'];

    for (const letra of letras) {
      let tipo = 'normal';
      let cantIzq = 4, cantCentro = 20, cantDer = 4;

      if (letra === 'J' || letra === 'K') {
        tipo = 'accesible';
        cantIzq = 2; cantCentro = 10; cantDer = 2;
      }
      else if (letra === 'R' || letra === 'S' || letra === 'T') {
        tipo = 'vip';
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

      salasLayout.push({
        letra,
        bloqueIzq: crearBloque(cantIzq),
        bloqueCentro: crearBloque(cantCentro),
        bloqueDer: crearBloque(cantDer)
      });
    }
    this.asientos.set(salasLayout);
  }

  toggleAsiento(asientoClickeado: any) {
    if (asientoClickeado.ocupada) return; // <-- BLOQUEA EL CLICK SI ESTÁ OCUPADA

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