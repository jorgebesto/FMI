// Pruebas sin internet: carga los scripts de la página en Node y simula los servicios ArcGIS.
// Ejecutar desde la carpeta del proyecto:  node tests/prueba.mjs
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPTS = ["utils", "vur", "xlsx", "excel", "config", "arcgis", "gestores", "geoportales", "contraste", "confirmacion", "almacen", "investigar", "reporte", "ejemplo"];

const llamadas = [];
function respuesta(url) {
  const u = new URL(url);
  const where = u.searchParams.get("where") || "";
  llamadas.push(u.pathname + " " + where);
  const f = (feats) => ({ features: feats });
  if (u.pathname.includes("SINIC_DA/FeatureServer/1/query")) {
    if (where.includes("051720001000000260020000000000"))
      return f([{ attributes: { cod_divipola: "05172", departamento: "ANTIOQUIA", municipio: "CHIGORODÓ", numero_predial_nacional: "051720001000000260020000000000",
        tipo_predio: "Predio.Privado", condicion_predio: "NPH", destinacion_economica: "Agricola", area_catastral_terreno: 411416.0,
        vigencia_actualizacion_catastral: "2015-01-01", zona: "Rural", nombre_predio: null, tipo_derecho: "Dominio" } }]);
    if (where.includes("080010001000000000048000000000"))
      return f([{ attributes: { departamento: "ATLÁNTICO", municipio: "BARRANQUILLA", numero_predial_nacional: "080010001000000000048000000000", tipo_predio: "Predio.Privado",
        condicion_predio: "NPH", destinacion_economica: "Comercial", area_catastral_terreno: 39605.0, zona: "Rural", tipo_derecho: "Dominio" } }]);
    if (where.includes("080780001000000000063000000000"))
      return f([{ attributes: { departamento: "ATLÁNTICO", municipio: "BARANOA", numero_predial_nacional: "080780001000000000063000000000", tipo_predio: "Predio.Privado",
        condicion_predio: "NPH", destinacion_economica: "Agropecuario", area_catastral_terreno: 4174.71, zona: "Rural", tipo_derecho: "Dominio" } }]);
    if (where.includes("110010108000000080003000000000"))
      return f([{ attributes: { departamento: "BOGOTÁ, D.C.", municipio: "BOGOTÁ, D.C.", numero_predial_nacional: "110010108000000080003000000000",
        tipo_predio: "Predio.Privado", condicion_predio: "NPH", destinacion_economica: "Habitacional", area_catastral_terreno: 120.5, zona: "Urbana", tipo_derecho: "Dominio" } }]);
    return f([]);
  }
  if (u.pathname.includes("SINIC_DA/FeatureServer/3/query"))
    return f([{ attributes: {}, geometry: { rings: [[[-76.68, 7.67], [-76.67, 7.67], [-76.67, 7.68], [-76.68, 7.67]]] } }]);
  if (u.pathname.includes("catastro/lote/MapServer/3/query")) {
    assert.ok(where.includes("PRECHIP = 'AAA0012ABCD'"), where);
    return f([{ attributes: { PRECHIP: "AAA0012ABCD", PRECEDCATA: "8 3 1", PRENUPRE: "110010108000000080003000000000", PREDIRECC: "KR 7 32 16",
      PREATERRE: 120.5, PREACONST: 300.0, PRECDESTIN: "01", BARMANPRE: "0081020003" } }]);
  }
  if (u.pathname.includes("catastro/lote/MapServer/0/query"))
    return f([{ attributes: { LOTCODIGO: "0081020003" }, geometry: { rings: [[[-74.07, 4.61], [-74.069, 4.61], [-74.069, 4.611], [-74.07, 4.61]]] } }]);
  if (u.pathname.includes("ConsultaOperadorCatastral_geo/MapServer/6/query")) {
    if (where.includes("050010100071300670088000000000"))
      return f([{ attributes: { cbml: "07130670088", numero_predial: "050010100071300670088000000000", direccion: "CL  10   40  20", destinacion: "Residencial",
        estrato: 3, codigo_homologado: "MED0001AAAA", latitud: 6.24, longitud: -75.59 } }]);
    return f([]);
  }
  if (u.pathname.includes("ConsultaOperadorCatastral_geo/MapServer/2/query")) return f([]);
  if (u.pathname.includes("VC_Catastro_VCT/MapServer/7/query")) {
    if (where.includes("050010100071300670088") || where.includes("07130670088"))
      return f([{ attributes: { mz_igac: "050010100071300670088", cbml: "07130670088", area_lote: 98, tipo_lote: "Edificacion" },
        geometry: { rings: [[[-75.59, 6.24], [-75.589, 6.24], [-75.589, 6.241], [-75.59, 6.24]]] } }]);
    return f([]);
  }
  if (u.pathname.includes("CATASTRO_PUBLICO_31082026/FeatureServer/17/query")) {
    if (where.includes("08078000100000063000") || where.includes("080780001000000000063000000000"))
      return f([{ attributes: { DIRECCION: "VILLA JOSE LO 5", DESTINO_ECONOMICO: "D", AREA_TERRENO: 4175, AREA_CONSTRUIDA: 492,
        NUMERO_PREDIAL: "080780001000000000063000000000", NUMERO_PREDIAL_ANTERIOR: "08078000100000063000", DEPARTAMENTO: "08", MUNICIPIO: "08078" } }]);
    return f([]);
  }
  if (u.pathname.includes("CATASTRO_PUBLICO_31082026/FeatureServer/18/query"))
    return f([{ attributes: { NUMERO_PREDIAL: "080780001000000000063000000000", ZONA_FISICA_1: "03", ZONA_ECONOMICA_1: "05", AREA_CONSTRUIDA_1: 492, PISOS_1: 1, HABITACIONES_1: 3, BANOS_1: 2, PUNTAJE_1: 35 } }]);
  if (u.pathname.includes("CATASTRO_PUBLICO_31082026/FeatureServer/14/query"))
    return f([{ attributes: { CODIGO: "080780001000000000063000000000" }, geometry: { rings: [[[-74.9, 10.8], [-74.89, 10.8], [-74.89, 10.81], [-74.9, 10.8]]] } }]);
  if (u.pathname.includes("CATASTRO_PUBLICO_31082026/FeatureServer/7/query")) return f([]);
  if (u.pathname.endsWith("datosabiertos/FeatureServer/500/query")) {
    if (where.includes("matricula_inmobiliaria = 30938") || where.includes("080010001000000000048000000000"))
      return f([{ attributes: { objectid: 1, numero_predial_nacional: "080010001000000000048000000000", numero_predial_anterior: "08001000100000048000",
        condicion_predio: "NPH", destinacion_economica: "Comercial", tipo_predio: "Predio_Privado", estado_fmi: "Activo", fecha_apertura_fmi: 190512000000,
        area_catastral_terreno: 39605.0, area_registral_m2: null, estrato: "No_Aplica", matricula_inmobiliaria: 30938, nupre: "AFT0024ERWB", vigencia_actualizacion: 1767225600000 } }]);
    return f([]);
  }
  if (u.pathname.includes("datosabiertos/FeatureServer/500/queryRelatedRecords")) {
    if (u.searchParams.get("relationshipId") === "2")
      return { relatedRecordGroups: [{ objectId: 1, relatedRecords: [{ attributes: { clase_via_principal: "Carretera", valor_via_principal: "A la playa", es_direccion_principal: 1 } }] }] };
    return { relatedRecordGroups: [{ objectId: 1, relatedRecords: [{ attributes: {}, geometry: { rings: [[[-74.837, 11.0367], [-74.836, 11.0367], [-74.836, 11.0377], [-74.837, 11.0367]]] } }] }] };
  }
  if (u.pathname.includes("BCGS_Catastro_Publico/MapServer/10/query")) {
    if (where.includes("051720001000000260020000000000") || where.includes("%008-2077%"))
      return f([{ attributes: { NPN: "051720001000000260020000000000", TERRENO_CODIGO: "051720001000000260020000000000", CIRULO: "008", MATRICULA: "2077",
        CIRCULO_MATRICULA: "008-2077", FICHA: 12345, DIRECCION: "BUENAVISTA", CARACTERISTICA: "NPH (0)", VEREDA: "05172000100026", AVALUO_TERRENO: 25000000,
        AVALUO_COMERCIAL_TERRENO: 90000000, "SHAPE.AREA": 184500.5 },
        geometry: { rings: [[[-76.68, 7.67], [-76.67, 7.67], [-76.67, 7.68], [-76.68, 7.67]]] } },
        { attributes: { NPN: "051720001000000260020000000099", CIRCULO_MATRICULA: "008-20770" } }]);
    return f([]);
  }
  if (u.pathname.includes("BCGS_Catastro_Publico/MapServer/11/query")) return f([]);
  if (u.pathname.includes("BCGS_Catastro_Publico/MapServer/3/query"))
    return f([{ attributes: { CODIGO_CONSTRUCCION: "051720001000000260020000000000", NUMERO_PISO: 1, ANIO_CONSTRUCCION: 1995, AVALUO_CONSTRUCCION: 5000000, "SHAPE.AREA": 80 } }]);
  if (u.pathname.includes("agserver1/rest/services/Catastro/MapServer/4/query")) {
    if (where.includes("760010100190900150019000000000") || where.includes("B001300190000"))
      return f([{ attributes: { ID_PREDIO: 141836, NUM_PREDIAL: "B001300190000", NPN: "760010100190900150019000000000", COMUNA_ID: "0019", BARRIO_ID: "09",
        MANZANA_ID: "0015", TERRENO_ID: "0019", CONDPRED: "0", TIPO_AVALUO: "01" }, geometry: { rings: [[[-76.55, 3.43], [-76.549, 3.43], [-76.549, 3.431], [-76.55, 3.43]]] } }]);
    return f([]);
  }
  if (u.pathname.includes("CAPA_GESTORES"))
    return f([
      { attributes: { mpio_cdpmp: "05172", dpto_cnmbr: "ANTIOQUIA", mpio_cnmbr: "CHIGORODÓ", Gestor: "Catastro Antioquia", CORREOS_JU: "catastro@ejemplo.gov.co" } },
      { attributes: { mpio_cdpmp: "76001", dpto_cnmbr: "VALLE DEL CAUCA", mpio_cnmbr: "SANTIAGO DE CALI", Gestor: "Catastro Municipal de Cali" } },
      { attributes: { mpio_cdpmp: "05999", dpto_cnmbr: "ANTIOQUIA", mpio_cnmbr: "SIN SERVICIO", Gestor: "Municipio de Prueba" } },
      { attributes: { mpio_cdpmp: "05001", dpto_cnmbr: "ANTIOQUIA", mpio_cnmbr: "MEDELLÍN", Gestor: "MEDELLIN" } },
      { attributes: { mpio_cdpmp: "11001", dpto_cnmbr: "BOGOTÁ, D.C.", mpio_cnmbr: "BOGOTÁ, D.C.", Gestor: "UAECD" } },
      { attributes: { mpio_cdpmp: "08001", dpto_cnmbr: "ATLÁNTICO", mpio_cnmbr: "BARRANQUILLA", Gestor: "Distrito de Barranquilla" } },
      { attributes: { mpio_cdpmp: "08078", dpto_cnmbr: "ATLÁNTICO", mpio_cnmbr: "BARANOA", Gestor: "Igac" } },
    ]);
  return { error: { message: "ruta no simulada " + u.pathname } };
}

const almacenLocal = new Map();
const ctx = {
  console, URL, URLSearchParams, TextDecoder, TextEncoder, Blob, Response, DecompressionStream, AbortController, setTimeout, clearTimeout,
  localStorage: { getItem: (k) => almacenLocal.get(k) ?? null, setItem: (k, v) => almacenLocal.set(k, String(v)) },
  fetch: async (url) => ({ ok: true, status: 200, json: async () => respuesta(url) }),
};
ctx.globalThis = ctx;
vm.createContext(ctx);
for (const s of SCRIPTS) vm.runInContext(fs.readFileSync(path.join(RAIZ, "js", s + ".js"), "utf8"), ctx, { filename: s + ".js" });
const IP = ctx.IP;
const U = IP.util;

// --- utilidades
assert.equal(U.normalizarMatricula("8-2077"), "008-2077");
assert.equal(U.normalizarMatricula("50c 0012345"), "50C-12345");
assert.equal(U.normalizarMatricula("2077", "008 - APARTADO"), "008-2077");
assert.equal(U.areaDesdeTexto("18 HS. Y 5.000 M2. ## PUNTO").m2, 185000);
assert.equal(U.areaDesdeTexto("LOTE DE 120,50 M2 Y LINDA").m2, 120.5);
assert.equal(U.areaDesdeTexto("2 FANEGADAS").m2, 12800);
assert.equal(U.areaDesdeTexto("EN 230 MTS. NORTE").m2, null);

// --- VUR
const v = IP.vur.leerTexto(IP.EJEMPLO_VUR)[0];
assert.equal(v.matricula_normalizada, "008-2077");
assert.equal(v.codigo_dane, "05172");
assert.equal(v.propietarios[0].nombre, "PROPIETARIO DE EJEMPLO");
assert.equal(v.area_terreno_m2, 185000);
assert.equal(v.salvedades.length, 2);
const varios = IP.vur.leerTexto(IP.EJEMPLO_VUR + "\n" + IP.EJEMPLO_VUR.replace("008-2077", "008-99").replace("000000000", "111"));
assert.equal(varios.length, 2);
// propietario en una sola línea (como sale del PDF)
const pdfLike = IP.EJEMPLO_VUR.replace("12345678\nCÉDULA CIUDADANÍA\nPROPIETARIO DE EJEMPLO", "800123456-1 NIT EMPRESA S.A.S. 50%\n7654321 CÉDULA DE CIUDADANÍA OTRA PERSONA");
const vp = IP.vur.leerTexto(pdfLike)[0];
assert.equal(JSON.stringify(vp.propietarios.map((p) => [p.documento, p.nombre, p.participacion])), JSON.stringify([["800123456-1", "EMPRESA S.A.S.", "50%"], ["7654321", "OTRA PERSONA", ""]]));

// --- Excel de la empresa (archivo .xlsx real creado con openpyxl)
const buf = fs.readFileSync(path.join(RAIZ, "ejemplos", "excel_prueba.xlsx"));
const ex = await IP.excelDesdeBuffer(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), "prueba.xlsx");
assert.equal(ex.total, 5);
assert.equal(ex.columnasDetectadas.fmi, "FMI");
assert.equal(ex.buscar("008-2077").registros[0].encargado, "VICTOR");
assert.equal(ex.buscar("001-1555").registros[0].encargado, "ANA");
assert.match(ex.buscar("050-1555").como, /revise el círculo/);
assert.equal(ex.buscar("2077").registros.length, 1);

// --- Fichas
await IP.almacen.guardarVur(v);
const consultaMed = IP.EJEMPLO_VUR.replace("008-2077", "001-1555").replace("051720001000000260020000000000", "050010100071300670088000000000")
  .replace("Municipio: CHIGORODO", "Municipio: MEDELLIN").replace("PIEDRAS BLANCAS DE POLINES", "").replace("BUENAVISTA", "CALLE 10 40 20")
  .replace("18 HS. Y 5.000 M2", "96 M2").replace("000000000", "222");
const consultaBog = IP.EJEMPLO_VUR.replace("008-2077", "50C-99999").replace("051720001000000260020000000000", "AAA0012ABCD")
  .replace("Departamento: ANTIOQUIA", "Departamento: BOGOTA D.C.").replace("Municipio: CHIGORODO", "Municipio: BOGOTA D.C.").replace("000000000", "333");

const f1 = await IP.investigarMatricula("8-2077", { excel: ex });
assert.equal(f1.matricula, "008-2077");
assert.equal(f1.vur.no_consulta, "000000000");
assert.equal(f1.registro.encargado, "VICTOR");
assert.equal(f1.catastro.estado, "ok");
assert.equal(f1.catastro.gestor, "Catastro Antioquia");
assert.equal(f1.catastro.datos.area_terreno_m2, 411416);
const areaFila = f1.contraste.find((x) => x.campo === "Área de terreno");
assert.equal(areaFila.estado, "diferente");
assert.ok(f1.catastro.lat > 7 && f1.catastro.anillos.length);

const vm2 = IP.vur.leerTexto(consultaMed)[0];
await IP.almacen.guardarVur(vm2);
const f2 = await IP.investigarMatricula("001-1555", { excel: ex });
assert.equal(f2.catastro.fuentes.map((x) => x.estado).join(","), "ok,no_encontrado"); // Medellín sí; el SINIC no lo tiene en la simulación
assert.equal(f2.contraste.find((x) => x.campo === "Número predial nacional (30)").estado, "ok");

const vb = IP.vur.leerTexto(consultaBog)[0];
const f3 = await IP.investigarMatricula(vb.matricula, { vur: vb, excel: ex });
assert.equal(f3.catastro.codigo_dane, "11001");
assert.equal(f3.catastro.datos.direccion, "KR 7 32 16");
assert.equal(f3.catastro.fuentes.length, 2, "Bogotá + SINIC con el predial que devolvió IDECA");
assert.ok(f3.alertas.some((a) => /no está en el Excel/.test(a)));

// Sin consulta del VUR: solo Excel
const f4 = await IP.investigarMatricula("001-1555-no", { excel: ex });
assert.ok(f4.alertas[0].startsWith("No hay consulta del VUR"));

// Barranquilla solo con la matrícula (sin VUR ni predial): catastro del gestor por matrícula y luego SINIC
const f5 = await IP.investigarMatricula("040-30938", { excel: ex });
assert.equal(f5.catastro.fuentes.map((x) => x.fuente.split(" ")[0] + ":" + x.estado).join(","), "Catastro:ok,SINIC:ok");
assert.equal(f5.catastro.datos.matricula_inmobiliaria, "040-30938");
assert.equal(f5.catastro.datos.direccion, "Carretera A la playa");
assert.equal(f5.contraste.find((x) => x.campo === "Matrícula inmobiliaria").estado, "ok");
assert.equal(f5.contraste.find((x) => x.campo === "Área de terreno").fuente_catastro, "Catastro Barranquilla – datos abiertos");
assert.ok(f5.donde.find((x) => x.fuente.startsWith("Catastro Barranquilla")).enlaces[0].url.includes("f=html"));
assert.match(f5.donde[0].detalle, /fila 5/);

// Municipio del IGAC con el predial anterior del Excel: base pública del IGAC y luego SINIC
const f6 = await IP.investigarMatricula("041-5555", { excel: ex });
assert.equal(f6.catastro.fuentes.map((x) => x.origen + ":" + x.estado).join(","), "IGAC:ok,IGAC:ok");
assert.equal(f6.catastro.datos.direccion, "VILLA JOSE LO 5");
assert.equal(f6.catastro.datos.destino_economico, "D – Agropecuario");
assert.match(f6.catastro.fuentes[0].mensaje, /predial anterior/);
assert.ok(f6.catastro.datos.construcciones.includes("3 hab."));
assert.equal(f6.contraste.find((x) => x.campo === "Predial anterior / cédula catastral").estado, "ok");

// --- Confirmación FMI ↔ cédula catastral
// Antioquia (BCGS): el gestor liga la matrícula con el predial; el Excel trae la cédula en otro formato -> revisar
assert.equal(f1.catastro.fuentes.map((x) => x.fuente.split(" – ")[0] + ":" + x.estado).join(","), "Catastro Antioquia:ok,SINIC:ok");
assert.equal(f1.catastro.datos.matricula_inmobiliaria, "008-2077");
assert.equal(f1.catastro.datos.ficha, "12345");
assert.equal(f1.catastro.datos.avaluo_terreno, 25000000);
assert.match(f1.catastro.datos.construcciones, /año 1995/);
assert.equal(f1.confirmacion.veredicto, "revisar", JSON.stringify(f1.confirmacion.pruebas));
assert.equal(IP.confirmarFMI({ matricula: "008-2077", registro: { cedula_catastral: "051720001000000260020000000000" }, vur: v, catastro: f1.catastro }).veredicto, "confirmado");
// Solo con la matrícula y el municipio del Excel (sin VUR ni predial): Antioquia busca por matrícula y trae el predial
const soloMat = await IP.consultarCatastro(null, { fmi: "008-2077", circulo: "008", municipio: "CHIGORODÓ", departamento: "ANTIOQUIA" }, "008-2077");
assert.equal(soloMat.fuentes[0].estado, "ok");
assert.match(soloMat.fuentes[0].mensaje, /por matrícula/);
assert.equal(soloMat.claves.predial30, "051720001000000260020000000000");
assert.ok(soloMat.fuentes.some((x) => x.fuente.startsWith("SINIC") && x.estado === "ok"));
// Cali: por NPN y por el código local del Excel
const cali1 = await IP.consultarCatastro({ referencia_catastral: "760010100190900150019000000000", codigo_dane: "76001" }, null, "370-1");
assert.equal(cali1.fuentes[0].fuente, "Catastro Cali – ArcGIS del Distrito");
assert.equal(cali1.fuentes[0].estado, "ok");
assert.equal(cali1.datos.codigo_local, "B001300190000");
assert.ok(cali1.lat > 3);
const cali2 = await IP.consultarCatastro(null, { cedula_catastral: "B001300190000", municipio: "SANTIAGO DE CALI", departamento: "VALLE DEL CAUCA" }, "370-1");
assert.equal(cali2.fuentes[0].estado, "ok");
assert.equal(cali2.claves.predial30, "760010100190900150019000000000");
// Puente en Cali: Excel con el código local y VUR con el NPN -> Catastro Cali dice que son el mismo predio
const vurCali = { matricula_normalizada: "370-1", referencia_catastral: "760010100190900150019000000000" };
assert.equal(IP.confirmarFMI({ matricula: "370-1", registro: { cedula_catastral: "B001300190000" }, vur: vurCali, catastro: cali2 }).veredicto, "confirmado");
// Gestor sin servicio consultable -> confirmar a mano
const sinServ = await IP.consultarCatastro({ referencia_catastral: "059990001000000260020000000000", codigo_dane: "05999" }, null, "999-1");
assert.equal(sinServ.fuentes[0].estado, "manual");
assert.equal(f5.confirmacion.veredicto, "confirmado");          // Barranquilla publica la matrícula del predio
assert.equal(f6.confirmacion.veredicto, "sin_confirmar");       // IGAC no publica la matrícula; la cédula sí existe
assert.ok(f6.confirmacion.pruebas.some((x) => x.resultado === "apoya"));
const vurBaq = IP.vur.leerTexto(IP.EJEMPLO_VUR.replace("008-2077", "040-30938").replace("051720001000000260020000000000", "080010001000000000048000000000")
  .replace("Nupre: ABR0001DOBD", "Nupre: AFT0024ERWB").replace("Municipio: CHIGORODO", "Municipio: BARRANQUILLA").replace("000000000", "444"))[0];
const f7 = await IP.investigarMatricula("040-30938", { vur: vurBaq, excel: ex });
assert.equal(f7.confirmacion.veredicto, "confirmado");
assert.equal(f7.confirmacion.pruebas.filter((x) => x.resultado === "confirma").length, 2, JSON.stringify(f7.confirmacion.pruebas)); // matrícula del gestor + NUPRE
const vurMal = IP.vur.leerTexto(IP.EJEMPLO_VUR.replace("008-2077", "040-99999").replace("051720001000000260020000000000", "080010001000000000048000000000")
  .replace("Municipio: CHIGORODO", "Municipio: BARRANQUILLA").replace("000000000", "555"))[0];
const f8 = await IP.investigarMatricula("040-99999", { vur: vurMal, excel: ex });
assert.equal(f8.confirmacion.veredicto, "no_coincide");          // el gestor asocia ese predio a la matrícula 30938
assert.equal(f8.alertas[0], "El FMI no coincide con la cédula catastral");
// Excel con cédula 30 igual a la del VUR
const regIgual = { cedula_catastral: "051720001000000260020000000000" };
assert.equal(IP.confirmarFMI({ matricula: "008-2077", registro: regIgual, vur: v, catastro: f1.catastro }).veredicto, "confirmado");
assert.equal(IP.confirmarFMI({ matricula: "008-2077", registro: { cedula_catastral: "051720001000000990020000000000" }, vur: v, catastro: f1.catastro }).veredicto, "no_coincide");
// Puente: Excel con predial anterior y VUR con el nuevo; la base del IGAC dice que son el mismo predio
const vurBaranoa = IP.vur.leerTexto(IP.EJEMPLO_VUR.replace("008-2077", "041-5555").replace("051720001000000260020000000000", "080780001000000000063000000000")
  .replace("Referencia Catastral Anterior: 1555", "Referencia Catastral Anterior:").replace("000000000", "666"))[0];
const f9 = await IP.investigarMatricula("041-5555", { vur: vurBaranoa, excel: ex });
assert.equal(f9.confirmacion.veredicto, "confirmado", JSON.stringify(f9.confirmacion.pruebas));
assert.match(f9.confirmacion.pruebas[0].texto, /mismo predio/);
for (const f of [f1, f5, f6, f7, f8, f9]) console.log("CONF", f.matricula, f.confirmacion.veredicto, "|", f.confirmacion.pruebas.map((x) => x.resultado + ": " + x.texto).join(" || "));

// Historial
const h = await IP.almacen.historial();
assert.equal(h.map((x) => x.matricula).sort().join(","), "001-1555,008-2077");

// --- Reporte
const blob = IP.generarReporte([f1, f2, f3, f5, f6], ex);
const salida = path.join(RAIZ, "tests", "salida_prueba.xlsx");
fs.writeFileSync(salida, Buffer.from(await blob.arrayBuffer()));
const relectura = await IP.xlsx.leer(await blob.arrayBuffer());
assert.equal(relectura.hojas.map((x) => x.nombre).join("|"), "Resumen|Confirmación FMI|Contraste|Fuentes|Propietarios|Salvedades y alertas|VUR completo|Catastro|Excel enriquecido");
assert.equal(relectura.hojas[0].filas[1][0], "008-2077");

for (const f of [f1, f2, f3, f5, f6]) {
  console.log(f.matricula, f.resumen, f.alertas);
  for (const x of f.contraste) console.log("   ", x.estado.padEnd(9), x.campo, "|", x.excel, "|", x.vur, "|", x.catastro, "|", x.nota);
}
console.log("\nTodas las pruebas pasaron. Reporte de prueba:", salida);
