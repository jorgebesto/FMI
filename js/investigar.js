/* Arma la ficha de una matrícula: Excel de la empresa + consultas del VUR guardadas + catastro + contraste. */
(function (g) {
  const IP = (g.IP = g.IP || {});
  const U = IP.util;

  // opciones: { vur: consulta recién leída, excel: ExcelEmpresa | null, catastro: true/false }
  IP.investigarMatricula = async function (matricula, opciones = {}) {
    const excel = opciones.excel || null;
    let clave = U.normalizarMatricula(matricula);
    const resExcel = excel ? excel.buscar(clave) : { registros: [], como: "no se ha cargado el Excel" };
    // Si se buscó solo el número y el Excel tiene una única fila, se toma su matrícula completa
    if (!clave.includes("-") && resExcel.registros.length === 1 && resExcel.registros[0].fmi)
      clave = U.normalizarMatricula(resExcel.registros[0].fmi, resExcel.registros[0].circulo) || clave;

    const historialVur = await IP.almacen.vurDe(opciones.vur ? opciones.vur.matricula_normalizada : clave);
    const vur = opciones.vur || historialVur[0] || null;
    if (vur) clave = vur.matricula_normalizada;
    const reg = resExcel.registros[0] || null;

    let catastro;
    if (opciones.catastro === false) {
      catastro = { estado: "omitido", fuentes: [], datos: {}, claves: IP.clavesBusqueda(vur, reg), codigo_dane: "", gestor: "", gestor_info: {}, lat: null, lon: null, anillos: [], visor: "" };
    } else {
      await IP.gestores.asegurar();
      catastro = await IP.consultarCatastro(vur, reg);
    }
    const contraste = IP.contrastar(vur, reg, catastro);

    const alertas = vur ? IP.vur.alertas(vur) : ["No hay consulta del VUR guardada para esta matrícula"];
    if (excel && !resExcel.registros.length) alertas.push("Excel: " + resExcel.como);
    else if (resExcel.registros.length > 1) alertas.push(`Excel: ${resExcel.registros.length} filas con esta matrícula`);
    else if (/revise|sin círculo/.test(resExcel.como)) alertas.push("Excel: encontrada " + resExcel.como);
    if (vur && historialVur.length > 1) {
      const anterior = historialVur.find((h) => h !== vur && h.id !== vur.id);
      if (anterior && anterior.propietarios_texto !== vur.propietarios_texto) alertas.push("Los propietarios cambiaron respecto a una consulta anterior del VUR");
    }
    return {
      matricula: clave, vur, historialVur, excel: resExcel, registro: reg, catastro,
      contraste: contraste.filas, resumen: contraste.resumen, alertas, fecha: U.ahora(),
    };
  };
})(typeof window !== "undefined" ? window : globalThis);
