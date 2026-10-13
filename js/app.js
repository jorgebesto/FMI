/* Interfaz de la página. */
(function () {
  const IP = window.IP, U = IP.util, T = IP.textos, C = IP.CONFIG;
  const $ = (s) => document.querySelector(s);
  const esc = U.esc;
  const E = { excel: null, fichas: [], mapas: [] };
  const MARCA = { ok: "✓ Coincide", revisar: "⚠ Revisar", diferente: "✗ Diferente", sin_dato: "—" };
  const NOMBRES_DATOS = {
    numero_predial: "Número predial", tipo_predio: "Tipo de predio", condicion_predio: "Condición", tipo_derecho: "Derecho",
    destino_economico: "Destino", area_terreno_m2: "Área terreno", area_construida_m2: "Área construida", zona: "Zona",
    vigencia: "Vigencia", nombre_predio: "Nombre", chip: "CHIP", cedula_catastral: "Cédula catastral", direccion: "Dirección",
    barrio: "Barrio", uso: "Uso", vetustez: "Vetustez", codigo_local: "Código local", tipo_lote: "Tipo de lote",
  };

  /* ---------------- utilidades de interfaz ---------------- */
  function aviso(texto) {
    const t = document.createElement("div");
    t.className = "toast";
    t.textContent = texto;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2600);
  }
  const url = (u) => (/^https?:\/\//i.test(u || "") ? u : "");
  function descargar(blob, nombre) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = nombre;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }

  /* ---------------- Excel ---------------- */
  function pintarExcel(fecha) {
    const el = $("#estadoExcel");
    const ex = E.excel;
    if (ex) {
      el.className = "estado ok";
      const det = ex.columnasDetectadas;
      el.innerHTML = `<b>${esc(ex.nombreArchivo)}</b> · hoja “${esc(ex.hoja)}” · ${ex.total} filas` +
        (fecha ? `<br><span class="nota">Cargado ${esc(fecha)} · matrícula en “${esc(det.fmi || "?")}”</span>` : "");
      $("#quitarExcel").hidden = false;
    } else {
      el.className = "estado";
      el.textContent = "Sin Excel cargado (la página funciona igual, sin el contraste con la empresa)";
      $("#quitarExcel").hidden = true;
    }
  }
  $("#excel").addEventListener("change", async (ev) => {
    const f = ev.target.files[0];
    if (!f) return;
    $("#estadoExcel").className = "estado";
    $("#estadoExcel").textContent = "Leyendo…";
    try {
      const buf = await f.arrayBuffer();
      E.excel = await IP.excelDesdeBuffer(buf, f.name);
      await IP.almacen.guardarExcel(f.name, buf);
      pintarExcel(U.ahora());
      if (E.fichas.length) refrescarFichas();
    } catch (e) {
      E.excel = null;
      $("#estadoExcel").className = "estado mal";
      $("#estadoExcel").textContent = "No se pudo leer el Excel: " + e.message;
    }
    ev.target.value = "";
  });
  $("#quitarExcel").addEventListener("click", async () => {
    await IP.almacen.borrarExcel();
    E.excel = null;
    pintarExcel();
  });

  /* ---------------- Gestores ---------------- */
  function pintarGestores() {
    const g = IP.gestores.resumen();
    const el = $("#estadoGestores");
    if (g.municipios) {
      el.className = "estado ok";
      el.textContent = `${g.municipios} municipios · ${g.gestores} gestores · actualizado ${g.actualizado || ""}`;
      $("#listaGestores").innerHTML = g.lista.map(([n, c]) => `<div><span>${esc(n)}</span><b>${c}</b></div>`).join("");
    } else {
      el.className = g.error ? "estado mal" : "estado";
      el.textContent = g.error || "Aún no descargado (se descarga solo en la primera búsqueda)";
    }
  }
  $("#actGestores").addEventListener("click", async () => {
    const b = $("#actGestores");
    b.disabled = true;
    $("#estadoGestores").textContent = "Descargando del IGAC…";
    try { await IP.gestores.descargar(); }
    catch (e) { IP.gestores.error = "No se pudo descargar: " + e.message; }
    pintarGestores();
    b.disabled = false;
  });

  /* ---------------- Historial ---------------- */
  async function pintarHistorial() {
    const h = await IP.almacen.historial();
    $("#historial").innerHTML = h.length
      ? h.map((x) => `<li><button type="button" data-matricula="${esc(x.matricula)}"><span><span class="fmi">${esc(x.matricula)}</span><br><span class="nota">${esc(x.municipio || "")}</span></span><span class="nota">${esc(x.ultima || "")}${x.consultas > 1 ? ` · ${x.consultas} consultas` : ""}</span></button></li>`).join("")
      : `<li class="nota">Todavía no hay consultas guardadas</li>`;
  }
  $("#historial").addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-matricula]");
    if (b) buscar(b.dataset.matricula);
  });
  $("#borrarTodo").addEventListener("click", async () => {
    if (!confirm("¿Borrar el Excel y todas las consultas del VUR guardadas en este navegador?")) return;
    await IP.almacen.borrarTodo();
    E.excel = null;
    E.fichas = [];
    pintarExcel();
    pintarHistorial();
    pintarFichas();
    aviso("Datos borrados de este navegador");
  });

  /* ---------------- Búsqueda ---------------- */
  async function investigar(matricula, vur) {
    return IP.investigarMatricula(matricula, { vur, excel: E.excel, catastro: $("#catastro").checked });
  }
  function agregar(ficha) {
    E.fichas = [ficha, ...E.fichas.filter((f) => f.matricula !== ficha.matricula)];
  }
  function cargando(texto) {
    const div = document.createElement("div");
    div.className = "cargando";
    div.textContent = texto;
    const cont = $("#fichas");
    if (cont.querySelector(".vacio")) cont.innerHTML = "";
    cont.prepend(div);
    return div;
  }

  async function buscar(matricula) {
    const m = U.normalizarMatricula(matricula);
    if (!m) { aviso("Escriba una matrícula"); return; }
    $("#matricula").value = m;
    const c = cargando(`Buscando ${m}…`);
    try {
      const ficha = await investigar(m);
      agregar(ficha);
      history.replaceState(null, "", "#m=" + encodeURIComponent(ficha.matricula));
    } catch (e) {
      aviso("Error: " + e.message);
    }
    c.remove();
    pintarFichas();
    pintarGestores();
  }
  $("#formBuscar").addEventListener("submit", (ev) => { ev.preventDefault(); buscar($("#matricula").value); });

  /* ---------------- VUR ---------------- */
  let temporizador;
  $("#texto").addEventListener("input", () => {
    clearTimeout(temporizador);
    temporizador = setTimeout(() => {
      const t = $("#texto").value;
      if (!t.trim()) { $("#previa").textContent = ""; return; }
      const cs = IP.vur.leerTexto(t);
      $("#previa").textContent = cs.length
        ? `Detecté ${cs.length} consulta(s): ` + cs.map((c) => `${c.matricula_normalizada} (${c.municipio || "sin municipio"})`).join(", ")
        : "Todavía no detecto ninguna matrícula en el texto.";
    }, 300);
  });
  $("#ejemplo").addEventListener("click", () => {
    $("#texto").value = IP.EJEMPLO_VUR;
    $("#texto").dispatchEvent(new Event("input"));
  });

  function cargarPdfJs() {
    if (window.pdfjsLib) return Promise.resolve();
    const base = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/";
    return new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = base + "pdf.min.js";
      s.onload = () => { window.pdfjsLib.GlobalWorkerOptions.workerSrc = base + "pdf.worker.min.js"; res(); };
      s.onerror = () => rej(new Error("No se pudo cargar el lector de PDF"));
      document.head.appendChild(s);
    });
  }

  $("#leerVur").addEventListener("click", async () => {
    const b = $("#leerVur");
    b.disabled = true;
    try {
      const textos = [$("#texto").value];
      const pdfs = [...$("#pdf").files];
      if (pdfs.length) {
        await cargarPdfJs();
        for (const p of pdfs) textos.push(await IP.vur.textoDePdf(p));
      }
      const consultas = textos.flatMap((t) => IP.vur.leerTexto(t));
      if (!consultas.length) {
        aviso("No encontré ninguna consulta del VUR con número de matrícula");
        return;
      }
      const c = cargando(`Investigando ${consultas.length} matrícula(s)…`);
      for (const d of consultas) {
        const guardada = await IP.almacen.guardarVur(d);
        c.textContent = `Investigando ${d.matricula_normalizada}…`;
        agregar(await investigar(d.matricula_normalizada, guardada));
      }
      c.remove();
      $("#texto").value = "";
      $("#pdf").value = "";
      $("#previa").textContent = "";
      if (consultas.length === 1) history.replaceState(null, "", "#m=" + encodeURIComponent(consultas[0].matricula_normalizada));
      pintarFichas();
      pintarHistorial();
      pintarGestores();
    } catch (e) {
      aviso("Error: " + e.message);
    } finally {
      b.disabled = false;
    }
  });

  /* ---------------- Fichas ---------------- */
  async function refrescarFichas() {
    const ms = E.fichas.map((f) => f.matricula);
    const nuevas = [];
    for (const m of ms) nuevas.push(await investigar(m));
    E.fichas = nuevas;
    pintarFichas();
  }

  function filaContraste(f) {
    const cod = /predial|cédula|código|matrícula|círculo|CHIP/i.test(f.campo) ? "cod" : "";
    return `<tr class="e-${f.estado}"><td class="campo">${esc(f.campo)}</td>
      <td class="${cod}">${esc(f.excel)}</td><td class="${cod}">${esc(f.vur)}</td><td class="${cod}">${esc(f.catastro)}</td>
      <td class="marca">${MARCA[f.estado] || esc(f.estado)}${f.nota ? `<span class="nota">${esc(f.nota)}</span>` : ""}</td></tr>`;
  }
  function datosCatastro(d) {
    const filas = Object.entries(NOMBRES_DATOS).filter(([k]) => U.limpiar(d[k]) !== "")
      .map(([k, n]) => {
        let v = d[k];
        if (/area_/.test(k)) v = U.formatoArea(v);
        return `<dt>${esc(n)}</dt><dd class="${k === "numero_predial" || k === "chip" ? "cod" : ""}">${esc(v)}</dd>`;
      });
    return filas.length ? `<dl class="datos">${filas.join("")}</dl>` : "";
  }

  function tarjeta(f, i) {
    const v = f.vur || {}, c = f.catastro, gi = c.gestor_info || {}, r = f.registro || {};
    const predial = v.referencia_catastral || c.claves.predial30 || c.datos.numero_predial || "";
    const lugar = [v.municipio || r.municipio || c.datos.municipio, v.departamento || r.departamento || c.datos.departamento].filter(Boolean).join(", ");
    const props = (v.propietarios || []).map((p) => `<tr><td>${esc(p.nombre)}</td><td class="cod">${esc(p.tipo_documento)} ${esc(p.documento)}</td><td>${esc(p.participacion)}</td></tr>`).join("")
      || `<tr><td class="nota">${f.vur ? "Sin propietarios en la consulta" : "Sin consulta del VUR"}</td></tr>`;
    const fuentes = (c.fuentes || []).map((s) => `<div class="caja"><div class="tit"><span>${esc(s.fuente)}</span><span class="est ${s.estado === "ok" ? "ok" : "no"}">${esc(T.CAT[s.estado] || s.estado)}</span></div>
        <div class="nota">${esc(s.mensaje)}</div>${datosCatastro(s.datos || {})}</div>`).join("")
      || `<div class="caja"><div class="tit">Catastro</div><div class="nota">${c.estado === "omitido" ? "Consulta al catastro desactivada" : "Sin datos para consultar"}</div></div>`;
    const contacto = [gi.NOMBRE_DE_, gi.RESPONSABL, gi.CARGO, gi.GESTOR_DIR, gi.CORREOS_JU].filter(Boolean).map(esc).join("<br>");
    const enlaces = [
      [C.enlaces.vur, "Abrir el VUR"],
      [C.enlaces.certificado, "Certificado de tradición (SNR)"],
      [url(c.visor), "Geoportal del catastro"],
      [c.lat != null ? `https://www.google.com/maps?q=${c.lat},${c.lon}` : "", "Ver en Google Maps"],
      [C.enlaces.colombia_en_mapas, "Colombia en Mapas (IGAC)"],
      [C.enlaces.igac_tramites, "Trámites catastrales IGAC (VIVI)"],
    ].filter(([u]) => u).map(([u, t]) => `<li><a href="${esc(u)}" target="_blank" rel="noopener">${esc(t)} ↗</a></li>`).join("");
    const salv = (v.salvedades || []).map((x) => `<p><b>${esc(x.fecha)}</b> ${esc(x.radicacion)} — ${esc(x.descripcion)}</p>`).join("");
    const regs = f.excel.registros.map((reg) => `<div class="rejilla">${reg._todas.filter(([, val]) => val).map(([k, val]) => `<div><span>${esc(k)}</span>${esc(val)}</div>`).join("")}</div>`).join("<hr>");
    const hist = f.historialVur.length
      ? `<table><thead><tr><th>Fecha</th><th>No. consulta</th><th>Propietarios</th></tr></thead><tbody>${f.historialVur.map((h) => `<tr><td>${esc(h.fecha_consulta)} ${esc(h.hora_consulta)}</td><td class="cod">${esc(h.no_consulta)}</td><td>${esc(h.propietarios_texto)}</td></tr>`).join("")}</tbody></table>` : "";

    return `<article class="ficha" data-i="${i}">
      <div class="cab">
        <div>
          <div class="fmi">${esc(f.matricula)} <button type="button" class="mini" data-copiar="${esc(f.matricula)}">Copiar</button></div>
          <div class="lugar">${esc(lugar || "Sin ubicación")}${v.vereda ? ` · ${esc(v.vereda)}` : ""}${r.encargado ? ` · Encargado: ${esc(r.encargado)}` : ""}${r.estado ? ` · Estado: ${esc(r.estado)}` : ""}</div>
          ${predial ? `<div class="lugar cod">Predial: ${esc(predial)} <button type="button" class="mini" data-copiar="${esc(predial)}">Copiar</button></div>` : ""}
        </div>
        <div class="acciones">
          <span class="insignia i-${f.resumen.veredicto}">${T.VEREDICTO[f.resumen.veredicto]}${f.resumen.diferencias ? ` · ${f.resumen.diferencias} dif.` : ""}${f.resumen.revisar ? ` · ${f.resumen.revisar} por revisar` : ""}</span>
          <button type="button" class="mini" data-actualizar="${esc(f.matricula)}">Actualizar</button>
          <button type="button" class="mini" data-cerrar="${esc(f.matricula)}">Cerrar</button>
        </div>
      </div>
      ${f.alertas.length ? `<div class="alertas">${f.alertas.map((a) => `<span class="alerta">${esc(a)}</span>`).join("")}</div>` : ""}
      <div class="cuerpo">
        <div>
          <h3>Contraste</h3>
          <table class="contraste"><colgroup><col class="c1"><col class="c2"><col class="c3"><col class="c4"><col class="c5"></colgroup>
            <thead><tr><th>Campo</th><th>Excel empresa</th><th>VUR</th><th>Catastro</th><th>Estado</th></tr></thead>
            <tbody>${f.contraste.map(filaContraste).join("")}</tbody></table>
          <h3>Propietarios (VUR${v.fecha_consulta ? " " + esc(v.fecha_consulta) : ""})</h3>
          <table><tbody>${props}</tbody></table>
          ${f.vur ? `<h3>Folio</h3><dl class="datos">
            ${[["Fecha de apertura", v.fecha_apertura], ["Estado", v.estado_folio], ["Tipo de instrumento", v.tipo_instrumento], ["NUPRE", v.nupre],
               ["Matrícula(s) matriz", v.matriculas_matriz], ["Matrícula(s) derivada(s)", v.matriculas_derivadas], ["Cabida", v.area_cabida_texto],
               ["Dirección", v.direccion], ["Direcciones anteriores", v.direcciones_anteriores], ["Destinación", v.destinacion_economica]]
              .filter(([, x]) => U.limpiar(x)).map(([k, x]) => `<dt>${esc(k)}</dt><dd>${esc(x)}</dd>`).join("")}</dl>` : ""}
        </div>
        <div class="lado">
          ${c.lat != null && window.L ? `<div class="mapa" id="mapa${i}"></div>` : ""}
          <h3>Catastro</h3>
          ${fuentes}
          <div class="caja"><div class="tit">Gestor catastral</div>
            ${esc(c.gestor || "No identificado")}${c.codigo_dane ? ` · DANE <span class="cod">${esc(c.codigo_dane)}</span>` : ""}
            ${contacto ? `<div class="nota" style="margin-top:6px">${contacto}</div>` : ""}</div>
          <h3>Enlaces</h3>
          <ul class="enlaces">${enlaces}</ul>
        </div>
      </div>
      ${f.excel.registros.length ? `<details class="extra"><summary>Fila completa del Excel de la empresa${f.excel.registros.length > 1 ? ` (${f.excel.registros.length} filas)` : ""}</summary>${regs}</details>` : ""}
      ${salv ? `<details class="extra"><summary>Salvedades (${v.salvedades.length})</summary>${salv}</details>` : ""}
      ${v.cabida_linderos ? `<details class="extra"><summary>Cabida y linderos</summary><p>${esc(v.cabida_linderos)}</p></details>` : ""}
      ${v.complementaciones ? `<details class="extra"><summary>Complementaciones</summary><p>${esc(v.complementaciones)}</p></details>` : ""}
      ${hist ? `<details class="extra"><summary>Consultas del VUR guardadas (${f.historialVur.length})</summary>${hist}</details>` : ""}
    </article>`;
  }

  function pintarFichas() {
    E.mapas.forEach((m) => m.remove());
    E.mapas = [];
    const n = E.fichas.length;
    $("#tituloRes").textContent = n ? `Fichas (${n})` : "Fichas";
    $("#descargar").hidden = !n;
    $("#limpiar").hidden = !n;
    if (!n) {
      $("#fichas").innerHTML = `<div class="vacio"><p><b>Busque una matrícula</b> arriba, o pegue una consulta del VUR a la izquierda.</p></div>`;
      return;
    }
    $("#fichas").innerHTML = E.fichas.map(tarjeta).join("");
    if (!window.L) return;
    E.fichas.forEach((f, i) => {
      const c = f.catastro;
      const el = document.getElementById("mapa" + i);
      if (c.lat == null || !el) return;
      const calles = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap" });
      const sat = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", { maxZoom: 19, attribution: "Esri World Imagery" });
      const m = L.map(el, { scrollWheelZoom: false, layers: [sat] }).setView([c.lat, c.lon], 16);
      L.control.layers({ "Satélite": sat, "Calles": calles }, null, { position: "topright" }).addTo(m);
      if ((c.anillos || []).length) {
        const capa = L.polygon(c.anillos.map((an) => an.map((p) => [p[1], p[0]])), { color: "#ff8c2e", weight: 2, fillOpacity: 0.12 }).addTo(m);
        m.fitBounds(capa.getBounds(), { maxZoom: 18, padding: [12, 12] });
      } else L.marker([c.lat, c.lon]).addTo(m);
      E.mapas.push(m);
    });
  }

  $("#fichas").addEventListener("click", async (ev) => {
    const t = ev.target;
    if (t.dataset.copiar) {
      try { await navigator.clipboard.writeText(t.dataset.copiar); aviso("Copiado: " + t.dataset.copiar); }
      catch (e) { aviso("No se pudo copiar"); }
    } else if (t.dataset.cerrar) {
      E.fichas = E.fichas.filter((f) => f.matricula !== t.dataset.cerrar);
      pintarFichas();
    } else if (t.dataset.actualizar) {
      buscar(t.dataset.actualizar);
    }
  });
  $("#limpiar").addEventListener("click", () => { E.fichas = []; pintarFichas(); history.replaceState(null, "", location.pathname); });
  $("#descargar").addEventListener("click", () => {
    const blob = IP.generarReporte(E.fichas, E.excel);
    const d = new Date(), p = (x) => String(x).padStart(2, "0");
    descargar(blob, `investigacion_predios_${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}.xlsx`);
  });

  /* ---------------- Inicio ---------------- */
  (async function iniciar() {
    if (typeof DecompressionStream === "undefined") {
      const a = $("#avisoNavegador");
      a.hidden = false;
      a.textContent = "Este navegador es antiguo y no puede leer archivos .xlsx. Use Chrome, Edge o Firefox actualizados.";
    }
    IP.gestores.cargar();
    pintarGestores();
    try {
      const g = await IP.almacen.leerExcel();
      if (g) { E.excel = await IP.excelDesdeBuffer(g.buffer, g.nombre); pintarExcel(g.fecha); }
      else pintarExcel();
    } catch (e) { pintarExcel(); }
    await pintarHistorial();
    abrirDesdeEnlace();
    window.addEventListener("hashchange", abrirDesdeEnlace);
  })();
  function abrirDesdeEnlace() {
    const m = decodeURIComponent((location.hash.match(/m=([^&]+)/) || [])[1] || "");
    if (m && !(E.fichas[0] && E.fichas[0].matricula === U.normalizarMatricula(m))) buscar(m);
  }
})();
