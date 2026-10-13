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

## Lo principal: confirmar el FMI con la cédula catastral

Cada ficha empieza con un recuadro que dice si la matrícula inmobiliaria (FMI) y la cédula catastral del Excel son del mismo predio. Hay cuatro resultados posibles:

- **Confirmado.** Al menos una prueba lo confirma y ninguna lo contradice.
- **No coincide.** Alguna fuente asocia ese FMI a otro predio, o ese predio a otro FMI. La página lo avisa como alerta.
- **Revisar.** Hay algo parecido pero no igual; por ejemplo, el mismo terreno con otra unidad de propiedad horizontal.
- **Sin confirmar.** No hay en línea una prueba que ligue la matrícula con el predio. La página dice qué falta y dónde confirmarlo a mano.

Las pruebas que usa, cada una con su enlace para verificarla:

1. **Geoportal del gestor que publica la matrícula junto al predio.**
   - Barranquilla: todos sus predios.
   - Catastro Antioquia (BCGS): los municipios a cargo de la Gobernación. Se busca por matrícula o por número predial.
   - Medellín: solo los inmuebles del municipio.
   - Ibagué y los demás sitios de **Catastro en línea**: se busca por matrícula y el sitio devuelve el número predial (se trae con el marcador, ver abajo).
2. **VUR.** La referencia catastral que el registro tiene para ese FMI, comparada con la cédula catastral del Excel.
   - Cuando el VUR trae el número nuevo (30 dígitos) y el Excel el anterior (20), la página usa como puente el catastro que publica los dos números del mismo predio: la base del IGAC, Barranquilla o el Área Metropolitana de Bucaramanga.
3. **NUPRE.** El mismo código en el VUR y en el catastro. Lo publican Barranquilla y Medellín.
4. **Existencia.** Que la cédula catastral del Excel exista en el catastro. Esto apoya, pero no liga la matrícula.

La mayoría de los demás gestores (Cundinamarca, Valle de Aburrá, Cali, Cúcuta, etc.) no publican la matrícula en un servicio consultable. Para ellos la ficha muestra **"Confirmar a mano"** con el enlace a su geoportal. La confirmación automática sale entonces del VUR.

## Cómo se usa

La página tiene dos pestañas: **Un predio** y **Varios predios**.

### Un predio

1. **Excel de la empresa.** Se carga una vez y queda guardado en ese navegador.
   - La página busca la fila de encabezados que tiene "FMI".
   - Reconoce las columnas de su formato: FMI, CÍRCULO REGISTRAL, MUNICIPIO, DIRECCIÓN, CÉDULA CATASTRAL, ENCARGADO, ESTADO…
   - Tiene que ser .xlsx.
2. **Consulta del VUR.** En el VUR abra "Datos Básicos" de la matrícula.
   - Seleccione toda la pantalla (Ctrl+A), cópiela (Ctrl+C), péguela en la página y presione **Leer y buscar**.
   - También puede subir el PDF de la consulta.
   - Cada consulta queda guardada en el navegador.
3. **Buscar una matrícula.** Escriba la matrícula arriba. La ficha muestra:
   - **Contraste** Excel / VUR / Catastro, campo por campo. Debajo de cada dato del catastro aparece de qué fuente salió.
   - **Dónde se encontró la información:** una fila por fuente con lo siguiente:
     - la página donde se encontró;
     - si es del **IGAC** o del **geoportal del gestor**;
     - la fila exacta del Excel y el número de consulta del VUR;
     - el **enlace de la búsqueda** para confirmarla, que abre la misma consulta en la página del servicio.
   - Propietarios, folio, salvedades, cabida y linderos, mapa del polígono, gestor catastral con su contacto y consultas anteriores del VUR.
4. **Descargar Excel.** Baja un libro con estas hojas:
   - Resumen
   - Contraste
   - Fuentes, con los enlaces de confirmación
   - Propietarios
   - Salvedades y alertas
   - VUR completo
   - Catastro
   - Excel enriquecido

### Varios predios

1. Escriba o pegue las matrículas, una por línea. También puede pegar varias consultas del VUR seguidas, o presionar **Agregar matrículas del Excel**, filtrando por estado, encargado o municipio.
2. Presione **Investigar todas**. La página consulta de a dos predios a la vez y muestra el avance. Se puede detener.
3. La tabla muestra, por predio:
   - el resultado del contraste;
   - el número predial;
   - **en qué fuentes se encontró**: cada una es un enlace para confirmar la búsqueda, con su etiqueta IGAC o gestor;
   - el área según el VUR y según el catastro;
   - las alertas.
4. **Ver ficha** abre la ficha completa de ese predio en la otra pestaña. **Descargar Excel** baja el resultado de todos los predios.

### Catastro en línea (Ibagué) con el marcador

Ibagué publica su catastro en la plataforma **Catastro en línea** (`ibaguemultiproposito.com.co`; la misma plataforma está en `catastroenlinea.com.co`). Esa plataforma busca por matrícula y devuelve el número predial, el avalúo, las áreas, las zonas, las construcciones y los propietarios. Pero no deja que otra página la consulte: el sitio de Ibagué es `http` y su `https` tiene un certificado inválido, y el navegador bloquea esas llamadas desde GitHub Pages.

Por eso se usa un **marcador** del navegador, que hace la búsqueda dentro del propio sitio:

1. **Una sola vez:** en el panel "Catastro en línea", arrastre el botón **Traer de Catastro en línea** a la barra de marcadores. Ctrl+Shift+B muestra la barra. Tiene que arrastrarlo desde la página publicada: el marcador guarda la dirección de su página para devolver ahí los datos.
2. Cuando la ficha de un predio de Ibagué diga **"Falta traerlo con el marcador"**, presione **Copiar pedido** y luego **Abrir el sitio**. En la pestaña Varios predios está el botón **Copiar pedido para Catastro en línea**, que junta todas las pendientes.
3. En el sitio de Catastro en línea haga clic en el marcador, pegue el pedido y presione Aceptar. El pedido es el código DANE y las matrículas, por ejemplo `73001 350-12345 350-1234`.
4. El marcador busca cada matrícula y abre esta página con el resultado. La página lo guarda en el navegador y actualiza las fichas.

El resultado queda guardado en ese navegador. Para traerlo de nuevo (por ejemplo, si cambió algo en el catastro) repita el paso 3.

Para otro municipio de la plataforma, escriba su código DANE al inicio del pedido. Por ejemplo, Jamundí sería `76364 370-14114`. Si el municipio no está en `js/config.js`, la ficha muestra el resultado igual, como "Catastro en línea – (sitio)".

## De dónde sale la información del catastro

La página primero averigua quién es el gestor catastral del municipio. Para eso usa el código DANE del número predial y el directorio oficial del IGAC. Luego consulta, en este orden:

| Fuente | Origen | Se busca por | Qué trae | Cobertura |
|---|---|---|---|---|
| Catastro Bogotá – IDECA | Gestor | Número predial, CHIP, cédula catastral | Dirección, barrio, áreas, destino, uso, polígono | Bogotá |
| Catastro Medellín – GeoMedellín | Gestor | Número predial (30), NUPRE; matrícula de inmuebles del municipio | Dirección, destino, estrato, NUPRE, CBML, área y polígono del lote | Medellín |
| Catastro Barranquilla – datos abiertos | Gestor | **Matrícula inmobiliaria (círculo 040)**, número predial nuevo o anterior | Estado y apertura del folio, áreas catastral y registral, destino, estrato, NUPRE, dirección, polígono | Barranquilla |
| Catastro Antioquia – BCGS (GeoAntioquia) | Gestor | **Matrícula (CIRCULO_MATRICULA)**, número predial (NPN) | Matrícula, ficha, dirección, vereda, característica (NPH/PH), avalúo catastral y comercial del terreno, construcciones (pisos, año, avalúo), polígono. **Conectado sin poder probarlo desde aquí** | Municipios a cargo de Catastro Antioquia |
| Catastro Ibagué – Catastro en línea | Gestor | **Matrícula inmobiliaria** (con el marcador) | Número predial, destino, avalúo (terreno y construcciones), áreas de terreno y construida, dirección, zonas físicas y económicas, construcciones, **propietarios**, código homologado | Ibagué (y otros sitios de la plataforma) |
| Área Metropolitana de Bucaramanga | Gestor | Número predial nuevo o anterior | Polígono del terreno | Bucaramanga, Girón, Piedecuesta |
| Catastro Cali – ArcGIS del Distrito | Gestor | NPN (30) o número predial local (tipo B001300190000) | ID del predio, código local, comuna, barrio, manzana, terreno, condición, edificio, piso, polígono. No trae matrícula. **Conectado sin poder probarlo desde aquí** | Cali |
| Base catastral pública del IGAC | IGAC | **Número predial nuevo o anterior (20 dígitos)** | Dirección, destino, áreas de terreno y construida, zonas físicas y económicas, construcciones (pisos, habitaciones, baños), polígono | Municipios a cargo del IGAC |
| SINIC – IGAC | IGAC | Número predial nacional (30) | Tipo y condición del predio, destino, área catastral, zona, vigencia, tipo de derecho, polígono | Todo el país |

Con el predial anterior de 20 dígitos (la "cédula catastral" de su Excel), los municipios del IGAC se pueden investigar sin la consulta del VUR. En Barranquilla basta la matrícula.

Los demás gestores (Cundinamarca, Valle de Aburrá, AMCO, Santa Marta, Cúcuta, Ibagué, Villavicencio, Neiva, Montería, Soacha y los municipios con catastro propio) no publican un servicio consultable. Para ellos queda el SINIC.

Para agregar otro geoportal edite `js/config.js` (sección `por_municipio`).

## Cosas a tener en cuenta

- **Propietarios:** casi ningún catastro público publica propietarios, así que salen del VUR. Catastro en línea sí los publica: la ficha los compara con los del VUR por número de documento. Si no coinciden queda en "Revisar", porque el catastro puede no estar al día con el registro.
  - Si hubo ventas parciales, el VUR solo muestra a quienes intervinieron en la última.
  - Si hay usufructo, muestra a los beneficiarios.
- **Áreas:** la cabida del VUR se lee del texto (ha, m², varas, fanegadas, plazas, cuadras). Al compararla con el catastro:
  - hasta 5 % de diferencia es "Coincide";
  - hasta 15 % es "Revisar";
  - más de 15 % es "Diferente".
- **PDF del VUR:** la lectura se hizo para el texto copiado de la pantalla, que está probado. La del PDF no se ha probado con un PDF real.
- **Servicios caídos:** si un servicio del catastro no responde, la ficha muestra el error y deja el enlace para consultarlo a mano.
- **Enlaces de confirmación:** abren la misma búsqueda en la página del servicio (formato de tabla del servidor ArcGIS o JSON de datos abiertos). Así se ve el registro original tal como lo publica el IGAC o el gestor.
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
js/catastroenlinea.js  marcador de Catastro en línea y lectura de lo que trae
js/arcgis.js        consultas a servicios ArcGIS (fetch y JSONP)
js/gestores.js      directorio de gestores catastrales del IGAC
js/geoportales.js   SINIC, base pública IGAC, Bogotá, Medellín, Barranquilla, AMB, Cali
js/contraste.js     comparación campo a campo
js/confirmacion.js  confirmación del FMI con la cédula catastral
js/almacen.js       lo que se guarda en el navegador
js/investigar.js    arma la ficha de una matrícula
js/reporte.js       Excel de salida
js/app.js           interfaz
tests/prueba.mjs    pruebas sin internet:  node tests/prueba.mjs
ejemplos/           consulta del VUR y Excel de prueba (datos ficticios)
```
