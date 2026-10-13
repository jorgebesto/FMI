/* Confirmación de la matrícula inmobiliaria (FMI) con la cédula catastral.
   Junta las pruebas que hay para decir si el FMI y la cédula catastral del Excel son del mismo predio:
   - VUR: la referencia catastral que registro tiene para ese FMI.
   - Geoportal del gestor que publica la matrícula (Barranquilla; Medellín para inmuebles del municipio).
   - NUPRE: el mismo código en el VUR y en el catastro.
   - Equivalencias del catastro: el predial nuevo y el anterior del mismo predio (sirven de puente entre formatos). */
(function (g) {
  const IP = (g.IP = g.IP || {});
  const U = IP.util;

  // Relación entre dos códigos catastrales: igual | distinto | mismo_terreno | no_comparable
  function relacion(a, b) {
    a = U.limpiar(a); b = U.limpiar(b);
    if (!a || !b) return "no_comparable";
    const ta = U.tipoCodigo(a), tb = U.tipoCodigo(b);
    const da = U.soloDigitos(a), db = U.soloDigitos(b);
    if (ta === "chip" || tb === "chip") return ta === tb ? (a.replace(/\s/g, "").toUpperCase() === b.replace(/\s/g, "").toUpperCase() ? "igual" : "distinto") : "no_comparable";
    if (ta === "nacional30" && tb === "nacional30") return da === db ? "igual" : da.slice(0, 21) === db.slice(0, 21) ? "mismo_terreno" : "distinto";
    if (ta === "anterior20" && tb === "anterior20") return da === db ? "igual" : "distinto";
    if ((da.length === 21 && tb === "nacional30") || (db.length === 21 && ta === "nacional30"))
      return (da.length === 21 ? db.startsWith(da) : da.startsWith(db)) ? "mismo_terreno" : "distinto";
    if (ta === "otro" && tb === "otro") {
      const na = U.normalizar(a).replace(/ /g, ""), nb = U.normalizar(b).replace(/ /g, "");
      return na === nb || (da && db && da.replace(/^0+/, "") === db.replace(/^0+/, "") && na.replace(/\d/g, "") === nb.replace(/\d/g, "")) ? "igual" : "distinto";
    }
    return "no_comparable";
  }
  IP.relacionCodigos = relacion;

  const codigosDe = (d) => [d.numero_predial, d.numero_predial_anterior, d.chip, d.cedula_catastral, d.codigo_local].map(U.limpiar).filter(Boolean);
  const mismaMatricula = (a, b) => {
    const na = U.normalizarMatricula(a), nb = U.normalizarMatricula(b);
    if (!na || !nb) return null;
    if (na === nb) return true;
    // Si una de las dos no trae círculo, se compara solo el número
    if (!na.includes("-") || !nb.includes("-")) return U.numeroDeMatricula(na) === U.numeroDeMatricula(nb);
    return false;
  };

  // Relación de la cédula del Excel con un conjunto de códigos, usando los grupos del catastro como puente
  function relacionConPuente(ced, codigos, grupos) {
    for (const c of codigos) if (relacion(ced, c) === "igual") return { rel: "igual", con: c };
    for (const gr of grupos)
      if (gr.codigos.some((x) => relacion(x, ced) === "igual")) {
        const c = codigos.find((v) => gr.codigos.some((x) => relacion(x, v) === "igual"));
        if (c) return { rel: "igual", con: c, puente: gr };
      }
    for (const c of codigos) if (relacion(ced, c) === "mismo_terreno") return { rel: "mismo_terreno", con: c };
    for (const c of codigos) if (relacion(ced, c) === "distinto") return { rel: "distinto", con: c };
    return { rel: "no_comparable", con: codigos[0] || "" };
  }

  IP.confirmarFMI = function ({ matricula, registro, vur, catastro }) {
    const reg = registro || {};
    const fmi = U.normalizarMatricula(matricula);
    const ced = U.limpiar(reg.cedula_catastral) || U.limpiar(reg.cedula_vur);
    const fuentesOk = ((catastro && catastro.fuentes) || []).filter((f) => f.estado === "ok");
    const grupos = fuentesOk.map((f) => ({ fuente: f.fuente, codigos: codigosDe(f.datos || {}), enlace: ((f.enlaces || [])[0] || {}).url }));
    const pruebas = [];
    const prueba = (resultado, fuente, texto, enlace) => pruebas.push({ resultado, fuente, texto, enlace: enlace || "" });

    // 1) VUR: el registro dice qué referencia catastral tiene el FMI
    if (vur) {
      const codVur = [vur.referencia_catastral, vur.referencia_catastral_anterior, vur.cedula_catastral].map(U.limpiar).filter(Boolean);
      const desc = codVur.length ? codVur.join(" / ") : "(sin referencia catastral)";
      if (!codVur.length) prueba("sin_dato", "VUR", `El folio ${fmi} no trae referencia catastral en el VUR.`, IP.CONFIG.enlaces.vur);
      else if (!ced) prueba("informa", "VUR", `En el VUR, el folio ${fmi} tiene la referencia catastral ${desc}. El Excel no trae cédula catastral para comparar.`, IP.CONFIG.enlaces.vur);
      else {
        const r = relacionConPuente(ced, codVur, grupos);
        if (r.rel === "igual")
          prueba("confirma", "VUR", r.puente
            ? `En el VUR, el folio ${fmi} tiene la referencia ${r.con}; según ${r.puente.fuente} es el mismo predio de la cédula ${ced} del Excel (${r.puente.codigos.join(" = ")}).`
            : `En el VUR, el folio ${fmi} tiene la referencia catastral ${r.con}, igual a la cédula catastral del Excel.`, IP.CONFIG.enlaces.vur);
        else if (r.rel === "mismo_terreno")
          prueba("revisar", "VUR", `En el VUR, el folio ${fmi} tiene la referencia ${r.con}: es el mismo terreno que la cédula ${ced} del Excel pero otra unidad (revise si es propiedad horizontal o un predio matriz).`, IP.CONFIG.enlaces.vur);
        else if (r.rel === "distinto")
          prueba("contradice", "VUR", `En el VUR, el folio ${fmi} tiene la referencia catastral ${r.con}, distinta de la cédula ${ced} del Excel.`, IP.CONFIG.enlaces.vur);
        else
          prueba("sin_dato", "VUR", `El VUR trae ${desc} y el Excel ${ced}: están en formatos distintos y ningún catastro dio la equivalencia.`, IP.CONFIG.enlaces.vur);
      }
    }

    // 2) Gestor que publica la matrícula junto al predio
    for (const f of fuentesOk) {
      const mCat = U.limpiar((f.datos || {}).matricula_inmobiliaria);
      if (!mCat) continue;
      const enlace = ((f.enlaces || [])[0] || {}).url;
      const predial = U.limpiar(f.datos.numero_predial) || U.limpiar(f.datos.codigo_local);
      if (mismaMatricula(mCat, fmi)) {
        const codVur = vur ? [vur.referencia_catastral, vur.referencia_catastral_anterior].map(U.limpiar).filter(Boolean) : [];
        if (codVur.some((c) => relacion(c, predial) === "igual"))
          prueba("apoya", f.fuente, `${f.fuente} y el VUR coinciden: el folio ${fmi} es el predio ${predial}.`, enlace);
        if (!ced) prueba("confirma", f.fuente, `${f.fuente} asocia la matrícula ${mCat} al predio ${predial}.`, enlace);
        else {
          const r = relacionConPuente(ced, codigosDe(f.datos), []);
          if (r.rel === "igual") prueba("confirma", f.fuente, `${f.fuente} asocia la matrícula ${mCat} al predio ${predial}, que es la cédula catastral ${ced} del Excel.`, enlace);
          else if (r.rel === "distinto") prueba("contradice", f.fuente, `${f.fuente} asocia la matrícula ${mCat} al predio ${predial}, no a la cédula ${ced} del Excel.`, enlace);
          else prueba("revisar", f.fuente, `${f.fuente} asocia la matrícula ${mCat} al predio ${predial}; compárelo con la cédula ${ced} del Excel.`, enlace);
        }
      } else prueba("contradice", f.fuente, `${f.fuente} asocia el predio ${predial} a la matrícula ${mCat}, no al folio ${fmi}.`, enlace);
    }

    // 3) NUPRE igual en el VUR y en el catastro
    const nupreVur = U.limpiar(vur && vur.nupre).toUpperCase();
    if (nupreVur) for (const f of fuentesOk) {
      const n = U.limpiar((f.datos || {}).nupre).toUpperCase();
      if (!n) continue;
      const enlace = ((f.enlaces || [])[0] || {}).url;
      if (n === nupreVur) prueba("confirma", f.fuente, `El NUPRE ${n} es el mismo en el VUR (folio ${fmi}) y en ${f.fuente} (predio ${U.limpiar(f.datos.numero_predial)}).`, enlace);
      else prueba("contradice", f.fuente, `El NUPRE del VUR (${nupreVur}) no es el de ${f.fuente} (${n}).`, enlace);
    }

    // 4) La cédula del Excel existe en el catastro (apoya, pero no liga la matrícula)
    if (ced) {
      const encontrada = grupos.find((gr) => gr.codigos.some((x) => relacion(x, ced) === "igual"));
      if (encontrada) prueba("apoya", encontrada.fuente, `La cédula catastral ${ced} del Excel existe en ${encontrada.fuente}.`, encontrada.enlace);
    }

    const hay = (r) => pruebas.some((p) => p.resultado === r);
    let veredicto, titulo;
    if (hay("contradice")) { veredicto = "no_coincide"; titulo = "El FMI NO coincide con la cédula catastral"; }
    else if (hay("confirma") && ced) { veredicto = "confirmado"; titulo = "FMI confirmado con la cédula catastral"; }
    else if (hay("confirma")) { veredicto = "confirmado"; titulo = "FMI ligado a un predio catastral (el Excel no trae cédula)"; }
    else if (hay("revisar")) { veredicto = "revisar"; titulo = "Revise el FMI con la cédula catastral"; }
    else { veredicto = "sin_confirmar"; titulo = "No se pudo confirmar el FMI con la cédula catastral"; }

    const rec = [];
    if (veredicto !== "confirmado") {
      if (!vur) rec.push("Pegue la consulta del VUR de esta matrícula: ahí aparece la referencia catastral del folio.");
      if (!ced) rec.push("El Excel no trae cédula catastral para esta matrícula.");
      const manual = ((catastro && catastro.fuentes) || []).find((f) => f.estado === "manual");
      const pendiente = ((catastro && catastro.fuentes) || []).find((f) => f.estado === "pendiente");
      if (manual) rec.push(`${manual.fuente.replace("Geoportal de ", "El gestor ")} no publica la matrícula en un servicio consultable: confírmela en su geoportal o con el certificado catastral.`);
      if (pendiente) rec.push(`Traiga el predio de ${pendiente.fuente} con el marcador “Traer de Catastro en línea”: ese geoportal liga la matrícula con el número predial y con eso se confirma el FMI.`);
      if (!manual && !pendiente && !pruebas.some((p) => p.fuente !== "VUR" && (p.resultado === "confirma" || p.resultado === "contradice")))
        rec.push("El catastro de este municipio no publica la matrícula; la confirmación sale del VUR.");
    }
    return { veredicto, titulo, pruebas, recomendacion: rec.join(" "), cedula_excel: ced };
  };

  IP.TEXTO_CONFIRMACION = { confirmado: "Confirmado", no_coincide: "No coincide", revisar: "Revisar", sin_confirmar: "Sin confirmar" };
})(typeof window !== "undefined" ? window : globalThis);
