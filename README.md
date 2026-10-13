# Investigador de predios

Página web para reunir toda la información de una **matrícula inmobiliaria**:

- la fila del Excel de la empresa;
- la consulta "Datos Básicos" del VUR: propietarios, número predial nuevo y anterior, salvedades, alertas y cabida;
- el catastro:
  - la base catastral nacional **SINIC** del IGAC, que tiene lo que reportan todos los gestores del país;
  - el geoportal local cuando hay uno (Bogotá y Medellín).

Con eso arma una ficha que compara las tres fuentes campo por campo y deja descargar todo en Excel.

Es una página estática: solo HTML y JavaScript, sin servidor. El Excel de la empresa y las consultas del VUR se guardan **solo en el navegador** de quien la usa. Al catastro solo se envía el número predial.

## Publicarla en GitHub Pages

1. En GitHub cree un repositorio nuevo, por ejemplo `investigador-predios`. Puede ser público: no contiene datos de nadie.
2. Suba el contenido de esta carpeta: **Add file → Upload files** y arrastre todo, incluido `.nojekyll`.
   - O por consola:
     ```
     git init
     git add .
     git commit -m "Investigador de predios"
     git branch -M main
     git remote add origin https://github.com/SU_USUARIO/investigador-predios.git
     git push -u origin main
     ```
3. En el repositorio entre a **Settings → Pages**. En "Branch" elija `main` y la carpeta `/ (root)`, y luego **Save**.
4. En uno o dos minutos la página queda en `https://SU_USUARIO.github.io/investigador-predios/`.

También funciona como "Static Site" en Render, o abriendo `index.html` con doble clic.

**Importante:** no suba al repositorio Excel reales de la empresa ni PDF del VUR. El `.gitignore` ya los bloquea.

## Cómo se usa

1. **Excel de la empresa.** Se carga una vez y queda guardado en ese navegador.
   - La página busca la fila de encabezados que tiene "FMI".
   - Reconoce las columnas de su formato: FMI, CÍRCULO REGISTRAL, MUNICIPIO, DIRECCIÓN, CÉDULA CATASTRAL, ENCARGADO…
   - Tiene que ser .xlsx. Si es .xls viejo, ábralo en Excel y guárdelo como .xlsx.
2. **Consulta del VUR.** En el VUR abra "Datos Básicos" de la matrícula.
   - Seleccione toda la pantalla (Ctrl+A), cópiela (Ctrl+C), péguela en la página y presione **Leer y buscar**.
   - Puede pegar varias consultas seguidas.
   - También puede subir el PDF de la consulta.
   - Cada consulta queda guardada en el navegador.
3. **Buscar una matrícula.** Escriba la matrícula arriba (`50C-1234567`, `008-2077`, `8-2077`…). La ficha muestra:
   - **Contraste** Excel / VUR / Catastro, con cada campo marcado como "Coincide", "Revisar" o "Diferente".
   - **Propietarios**, datos del folio, salvedades, cabida y linderos, y complementaciones.
   - **Catastro:**
     - SINIC: tipo de predio, condición, destino, área catastral, zona, vigencia y polígono en el mapa.
     - Geoportal local: CHIP, dirección y área construida en Bogotá; CBML y área del lote en Medellín.
   - El **gestor catastral** del municipio con sus datos de contacto.
   - **Enlaces:** VUR, certificado de tradición, geoportal, Google Maps, Colombia en Mapas y VIVI.
   - La **fila completa del Excel** y las **consultas anteriores del VUR** de esa matrícula. Si cambiaron los propietarios entre consultas, la página lo avisa.
4. **Descargar Excel.** Baja un libro con estas hojas:
   - Resumen
   - Contraste
   - Propietarios
   - Salvedades y alertas
   - VUR completo
   - Catastro
   - Excel enriquecido: sus filas originales con las columnas nuevas.

Puede compartir el enlace `.../#m=008-2077` para abrir directamente una ficha. Ojo: la otra persona solo verá lo del VUR y del Excel si los tiene cargados en su propio navegador.

## De dónde sale la información del catastro

| Fuente | Qué trae | Cobertura |
|---|---|---|
| SINIC – IGAC (`sigi.igac.gov.co`) | Número predial, tipo y condición del predio, destino económico, área catastral de terreno, zona, vigencia, tipo de derecho y polígono | Todo el país, con lo que cada gestor reporta cada dos meses |
| Catastro Bogotá – IDECA | CHIP, cédula catastral, dirección, barrio, áreas de terreno y construcción, destino, uso y polígono del lote | Bogotá |
| Catastro Medellín – GeoMedellín | CBML, área y polígono del lote | Medellín |
| Directorio de gestores – IGAC | Quién lleva el catastro de cada municipio y sus datos de contacto | Todo el país |

Para consultar el SINIC se necesita el **número predial nacional de 30 dígitos**, que en el VUR aparece como "Referencia Catastral". Si el VUR solo trae el predial anterior, la página lo muestra para compararlo a ojo.

Para agregar el geoportal de otro municipio, edite `js/config.js` siguiendo el ejemplo de Medellín. Solo hay que poner el código DANE, la URL de la capa ArcGIS y el campo con el número predial.

## Cosas a tener en cuenta

- **Propietarios:** el catastro público no publica propietarios, así que solo salen del VUR.
  - Si hubo ventas parciales, el VUR solo muestra a quienes intervinieron en la última.
  - Si hay usufructo, muestra a los beneficiarios.
- **Áreas:** la cabida del VUR se lee del texto (ha, m², varas, fanegadas, plazas, cuadras). Al compararla con el catastro:
  - hasta 5 % de diferencia es "Coincide";
  - hasta 15 % es "Revisar";
  - más de 15 % es "Diferente".
- **PDF del VUR:** la lectura se hizo para el texto copiado de la pantalla, que está probado. La del PDF no se ha probado con un PDF real.
- **Servicios caídos:** si un servicio del catastro no responde, la ficha muestra el error y deja el enlace para consultarlo a mano.
- **Datos guardados:** quedan en ese navegador y en ese computador. Si se borran los datos de navegación, se pierden. El botón "Borrar todos los datos de este navegador" los quita a propósito.

## Archivos

```
index.html          la página
css/estilos.css     diseño
js/utils.js         textos, matrículas, áreas
js/vur.js           lector de la consulta del VUR (texto y PDF)
js/xlsx.js          lectura y escritura de .xlsx sin librerías
js/excel.js         Excel de la empresa y búsqueda por FMI
js/config.js        fuentes del catastro (aquí se agregan geoportales)
js/arcgis.js        consultas a servicios ArcGIS (fetch y JSONP)
js/gestores.js      directorio de gestores catastrales del IGAC
js/geoportales.js   SINIC, Bogotá, Medellín
js/contraste.js     comparación campo a campo
js/almacen.js       lo que se guarda en el navegador
js/investigar.js    arma la ficha de una matrícula
js/reporte.js       Excel de salida
js/app.js           interfaz
tests/prueba.mjs    pruebas sin internet:  node tests/prueba.mjs
ejemplos/           consulta del VUR y Excel de prueba (datos ficticios)
```
