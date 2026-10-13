/* Consulta catastral de un predio.
   1) SINIC (IGAC): base catastral nacional, para cualquier municipio, por número predial de 30 dígitos.
   2) Catastro local con más detalle cuando existe conector (Bogotá, Medellín, los que se agreguen en config.js).
   Si no hay forma automática, deja el gestor del municipio, sus datos de contacto y el enlace al geoportal. */
(function (g) {
  const IP = (g.IP = g.IP || {});
  const U = IP.util;
  const A = () => IP.arcgis;

  function resultado(estado, fuente, extra = {}) {
    return { estado, fuente, mensaje: "", datos: {}, lat: null, lon: null, anillos: [], visor: "", ...extra };
  }
  const fechaCampo = (v) => {
    if (v == null || v === "") return "";
    if (typeof v === "number") return new Date(v).toISOString().slice(0, 10);
    return String(v).slice(0, 10);
  };

  /* ---------------- SINIC ---------------- */
  async function sinic(cfg, predial) {
    const s = A().sql;
    let js = await A().query(cfg.predio, { where: `numero_predial_nacional = ${s(predial)}` });
    let feats = js.features || [];
    let nota = "";
    if (!feats.length) {
      js = await A().query(cfg.predio, { where: `numero_predial_nacional LIKE ${s(predial.slice(0, 21) + "%")}`, resultRecordCount: 50 });
      feats = js.features || [];
      if (feats.length) nota = ` (no está el número exacto; hay ${feats.length >= 50 ? "50 o más" : feats.length} predio(s) en el mismo terreno, se muestra el primero)`;
    }
    if (!feats.length) return resultado("no_encontrado", cfg.nombre, { visor: cfg.visor, mensaje: "El SINIC no tiene ese número predial" });
    const a = feats[0].attributes;
    const datos = {
      numero_predial: U.limpiar(a.numero_predial_nacional),
      departamento: U.limpiar(a.departamento),
      municipio: U.limpiar(a.municipio),
      tipo_predio: U.limpiar(a.tipo_predio).replace(/^Predio\./, ""),
      condicion_predio: U.limpiar(a.condicion_predio),
      destino_economico: U.limpiar(a.destinacion_economica),
      area_terreno_m2: a.area_catastral_terreno,
      zona: U.limpiar(a.zona),
      nombre_predio: U.limpiar(a.nombre_predio),
      tipo_derecho: U.limpiar(a.tipo_derecho),
      vigencia: fechaCampo(a.vigencia_actualizacion_catastral),
    };
    const r = resultado("ok", cfg.nombre, { visor: cfg.visor, mensaje: "Predio encontrado en el SINIC" + nota, datos, crudo: a });
    try {
      let t = await A().query(cfg.terreno, { where: `numero_predial_nacional = ${s(datos.numero_predial)}`, returnGeometry: "true", outSR: 4326, outFields: "numero_predial_nacional" });
      if (!(t.features || []).length)
        t = await A().query(cfg.terreno, { where: `numero_predial_nacional LIKE ${s(datos.numero_predial.slice(0, 21) + "%")}`, returnGeometry: "true", outSR: 4326, outFields: "numero_predial_nacional", resultRecordCount: 1 });
      const geo = ((t.features || [])[0] || {}).geometry;
      if (geo) {
        [r.lat, r.lon] = A().centroide(geo);
        r.anillos = geo.rings || [];
      }
    } catch (e) {
      r.mensaje += " (sin polígono: " + e.message + ")";
    }
    return r;
  }

  /* ---------------- Bogotá (IDECA) ---------------- */
  async function bogota(cfg, claves) {
    const s = A().sql;
    const cond = [];
    if (claves.predial30) cond.push(`PRENUPRE = ${s(claves.predial30)}`);
    for (const c of claves.chips) cond.push(`PRECHIP = ${s(c)}`);
    for (const c of claves.cedulas) cond.push(`PRECEDCATA = ${s(c)}`);
    if (!cond.length) return resultado("sin_datos", cfg.nombre, { visor: cfg.visor, mensaje: "No hay CHIP, cédula catastral ni número predial para buscar en Bogotá" });
    const js = await A().query(cfg.predio, { where: cond.join(" OR ") });
    const feats = js.features || [];
    if (!feats.length) return resultado("no_encontrado", cfg.nombre, { visor: cfg.visor, mensaje: "Catastro Bogotá no devolvió ningún predio con esos códigos" });
    const a = feats[0].attributes;
    const datos = {
      numero_predial: U.limpiar(a.PRENUPRE), chip: U.limpiar(a.PRECHIP), cedula_catastral: U.limpiar(a.PRECEDCATA),
      direccion: U.limpiar(a.PREDIRECC), barrio: U.limpiar(a.PRENBARRIO), area_terreno_m2: a.PREATERRE,
      area_construida_m2: a.PREACONST, destino_economico: U.limpiar(a.PRECDESTIN), tipo_predio: U.limpiar(a.PRETPROP),
      uso: U.limpiar(a.PRECUSO), vetustez: U.limpiar(a.PREVETUSTZ), codigo_lote: U.limpiar(a.BARMANPRE),
    };
    const r = resultado("ok", cfg.nombre, { visor: cfg.visor, datos, crudo: a,
      mensaje: "Predio encontrado en IDECA" + (feats.length > 1 ? ` (${feats.length} coincidencias, se muestra la primera)` : "") });
    if (datos.codigo_lote) {
      try {
        const l = await A().query(cfg.lote, { where: `LOTCODIGO = ${s(datos.codigo_lote)}`, returnGeometry: "true", outSR: 4326, outFields: "LOTCODIGO" });
        const geo = ((l.features || [])[0] || {}).geometry;
        if (geo) { [r.lat, r.lon] = A().centroide(geo); r.anillos = geo.rings || []; }
      } catch (e) { /* el polígono es un extra */ }
    }
    return r;
  }

  /* ---------------- Capa ArcGIS genérica ---------------- */
  async function arcgisGenerico(cfg, claves) {
    if (!claves.predial30) return resultado("sin_datos", cfg.nombre, { visor: cfg.visor, mensaje: "Hace falta el número predial de 30 dígitos" });
    const n = Number(cfg.digitos || 30);
    const js = await A().query(cfg.url, { where: `${cfg.campo_codigo} = ${A().sql(claves.predial30.slice(0, n))}`, returnGeometry: "true", outSR: 4326 });
    const feats = js.features || [];
    if (!feats.length) return resultado("no_encontrado", cfg.nombre, { visor: cfg.visor, mensaje: "La capa no devolvió el lote" });
    const a = feats[0].attributes;
    const datos = { numero_predial: U.limpiar(a[cfg.campo_codigo]) };
    for (const [k, campo] of Object.entries(cfg.campos || {})) datos[k] = a[campo];
    const r = resultado("ok", cfg.nombre, { visor: cfg.visor, datos, crudo: a, mensaje: "Lote encontrado" });
    const geo = feats[0].geometry;
    if (geo) { [r.lat, r.lon] = A().centroide(geo); r.anillos = geo.rings || []; }
    return r;
  }

  /* ---------------- Enrutador ---------------- */
  IP.clavesBusqueda = function (vur, excel) {
    const claves = { predial30: "", predial20: "", chips: [], cedulas: [] };
    const cands = [vur && vur.referencia_catastral, vur && vur.referencia_catastral_anterior, vur && vur.cedula_catastral,
                   excel && excel.cedula_catastral, excel && excel.cedula_vur];
    for (const c0 of cands) {
      const c = U.limpiar(c0);
      if (!c) continue;
      const t = U.tipoCodigo(c);
      const sin = c.replace(/\s+/g, "");
      if (t === "nacional30") { if (!claves.predial30) claves.predial30 = sin; }
      else if (t === "anterior20") { if (!claves.predial20) claves.predial20 = sin; }
      else if (t === "chip") { if (!claves.chips.includes(sin.toUpperCase())) claves.chips.push(sin.toUpperCase()); }
      else if (!claves.cedulas.includes(c)) claves.cedulas.push(c);
    }
    return claves;
  };

  async function protegido(fn, nombre, visor) {
    try { return await fn(); }
    catch (e) {
      const servicio = e instanceof IP.arcgis.ErrorServicio;
      return resultado("error", nombre, { visor, mensaje: (servicio ? "El servicio respondió con error: " : "No se pudo conectar: ") + e.message });
    }
  }

  IP.consultarCatastro = async function (vur, excel) {
    vur = vur || {};
    const C = IP.CONFIG;
    const claves = IP.clavesBusqueda(vur, excel);
    let dane = vur.codigo_dane || U.codigoDane(claves.predial30) || U.codigoDane(claves.predial20);
    if (!dane && claves.chips.length) dane = "11001"; // el CHIP solo existe en Bogotá
    if (!dane) dane = IP.gestores.codigoPorNombre(vur.departamento || (excel || {}).departamento, vur.municipio || (excel || {}).municipio);
    const gestor = IP.gestores.porCodigo(dane) || {};
    const fuentes = [];

    const local = C.por_municipio[dane];
    if (local) {
      const fn = local.conector === "bogota" ? () => bogota(local, claves) : () => arcgisGenerico(local, claves);
      const r = await protegido(fn, local.nombre, local.visor);
      fuentes.push(r);
      if (!claves.predial30 && U.tipoCodigo(r.datos.numero_predial) === "nacional30") claves.predial30 = r.datos.numero_predial;
    }
    if (claves.predial30) {
      fuentes.unshift(await protegido(() => sinic(C.sinic, claves.predial30), C.sinic.nombre, C.sinic.visor));
    } else if (!local) {
      fuentes.push(resultado("sin_datos", C.sinic.nombre, { visor: C.sinic.visor,
        mensaje: "Para consultar el catastro hace falta el número predial nacional de 30 dígitos (viene en el VUR como 'Referencia Catastral')." }));
    }

    // Datos combinados: primero el SINIC y se completan con el catastro local
    const datos = {};
    for (const f of fuentes.filter((f) => f.estado === "ok"))
      for (const [k, v] of Object.entries(f.datos)) if (U.limpiar(v) && !U.limpiar(datos[k])) datos[k] = v;
    const conMapa = fuentes.find((f) => f.lat != null && (f.anillos || []).length) || fuentes.find((f) => f.lat != null);
    const ok = fuentes.some((f) => f.estado === "ok");
    return {
      estado: ok ? "ok" : (fuentes.some((f) => f.estado === "error") ? "error" : (fuentes[0] || {}).estado || "sin_datos"),
      fuentes, datos, claves, codigo_dane: dane,
      gestor: gestor.Gestor || (local ? local.nombre : ""), gestor_info: gestor,
      lat: conMapa ? conMapa.lat : null, lon: conMapa ? conMapa.lon : null, anillos: conMapa ? conMapa.anillos : [],
      visor: (local && local.visor) || C.sinic.visor,
    };
  };
})(typeof window !== "undefined" ? window : globalThis);
