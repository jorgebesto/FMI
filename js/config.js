/* Configuración de fuentes. Para agregar el geoportal de otro municipio copie el bloque de Medellín,
   cambie el código DANE, la URL de la capa y el campo que guarda el número predial.
   'digitos' = cuántos dígitos del número predial nacional guarda ese campo (30 completo, 21 solo terreno). */
(function (g) {
  const IP = (g.IP = g.IP || {});
  IP.CONFIG = {
    // Base catastral nacional SINIC (IGAC): lo que reportan TODOS los gestores catastrales del país.
    sinic: {
      nombre: "SINIC – Base catastral nacional (IGAC)",
      predio: "https://sigi.igac.gov.co/habilitacion/rest/services/sinic/SINIC_DA/FeatureServer/1",
      terreno: "https://sigi.igac.gov.co/habilitacion/rest/services/sinic/SINIC_DA/FeatureServer/3",
      construccion: "https://sigi.igac.gov.co/habilitacion/rest/services/sinic/SINIC_DA/FeatureServer/4",
      visor: "https://www.colombiaenmapas.gov.co/",
    },
    // Directorio oficial de gestores catastrales (IGAC)
    gestores: "https://services2.arcgis.com/RVvWzU3lgJISqdke/arcgis/rest/services/CAPA_GESTORES_10062026/FeatureServer/0",

    // Catastros locales con más detalle (dirección, CHIP, área construida...)
    por_municipio: {
      "11001": {
        conector: "bogota",
        nombre: "Catastro Bogotá (UAECD) – IDECA",
        predio: "https://serviciosgis.catastrobogota.gov.co/arcgis/rest/services/catastro/lote/MapServer/3",
        lote: "https://serviciosgis.catastrobogota.gov.co/arcgis/rest/services/catastro/lote/MapServer/0",
        visor: "https://mapas.bogota.gov.co/",
      },
      "05001": {
        conector: "arcgis",
        nombre: "Catastro Medellín – GeoMedellín",
        url: "https://www.medellin.gov.co/servidormapas/rest/services/vivienda_ciudad_terri/VC_Catastro_VCT/MapServer/7",
        campo_codigo: "mz_igac",
        digitos: 21,
        campos: { codigo_local: "cbml", area_terreno_m2: "area_lote", tipo_lote: "tipo_lote" },
        visor: "https://www.medellin.gov.co/geomedellin/",
      },
    },

    enlaces: {
      vur: "https://www.vur.gov.co/",
      certificado: "https://certificados.supernotariado.gov.co/certificado",
      igac_tramites: "https://vivi.igac.gov.co/",
      colombia_en_mapas: "https://www.colombiaenmapas.gov.co/",
    },
  };
})(typeof window !== "undefined" ? window : globalThis);
