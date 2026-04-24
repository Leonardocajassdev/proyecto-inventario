# Uso de IA

Se utilizó IA como apoyo para acelerar el desarrollo y resolver problemas puntuales durante la implementación del sistema.


## Prompts representativos

🤖 Uso de IA


🧠 1. Organización del .gitignore

Contexto
Estaba organizando un proyecto full-stack con carpetas backend y frontend, y tenía dudas sobre si mantener múltiples archivos .gitignore o centralizar la configuración.

Prompt utilizado

“¿Debo dejar los .gitignore de backend y frontend por separado o unificarlos en uno solo en la raíz del proyecto principalmente?”

Reflexión
La respuesta recomendó unificar el .gitignore en la raíz para simplificar el mantenimiento y evitar duplicaciones.
Inicialmente tenía archivos separados, pero al unificarlos logré una configuración más limpia y consistente.
Tuve que ajustar rutas específicas (como Prisma y Playwright) para asegurar que todos los archivos generados quedaran correctamente ignorados.

🧪 2. Cobertura de testing integral

Contexto
Estaba implementando pruebas para cumplir con el requisito de testing integral y no tenía claro si debía cubrir todo el sistema o solo casos representativos.

Prompt utilizado

“¿Para las pruebas de testing integral debería considerar cada una de las funcionalidades de mi sistema de inventario?”

Reflexión
La IA sugirió cubrir las funciones clave del negocio, especialmente la lógica crítica (cálculo de stock, validaciones de salida, etc.).
Inicialmente implementé pruebas muy básicas, pero entendí que debía enfocarme en la lógica central del sistema.
Aun así, mi cobertura quedó limitada, lo que evidenció que necesitaba profundizar más en pruebas sobre servicios reales y no solo ejemplos simples.

🔬 3. Integración de E2E y Mutation Testing

Contexto
Quería integrar múltiples tipos de testing (E2E y mutation testing) y no tenía claro cómo estructurarlos dentro del proyecto.

Prompt utilizado

“¿Cómo estructuro la integración de testing E2E y mutation testing en mi proyecto?”

Reflexión
La respuesta me orientó a separar claramente los tipos de pruebas:

E2E en el frontend (Playwright)
Mutation testing en el backend (Stryker)

Esto me ayudó a organizar mejor la estructura del proyecto.
Sin embargo, la integración fue más superficial de lo esperado, ya que implementé los tests pero con cobertura mínima.

⚙️ 4. Integración en CI/CD

Contexto
Estaba configurando el pipeline de GitHub Actions y tenía dudas sobre si debía incluir todos los tipos de pruebas, especialmente E2E y mutation testing.

Prompt utilizado

“¿Las pruebas E2E y mutation testing deben integrarse en el pipeline?”

Reflexión
La IA indicó que lo ideal es incluirlas para asegurar calidad continua.
Intenté integrarlas, pero encontré problemas técnicos (servicios no levantados en CI, timeouts, etc.).
Finalmente decidí excluir E2E del pipeline para simplificar la ejecución, priorizando que el CI pasara correctamente.
Esto cumplió parcialmente el objetivo, pero dejó el pipeline incompleto respecto a testing integral.



🧠 5. Cálculo de stock dinámico

Contexto
Necesitaba decidir si almacenar el stock directamente en la base de datos o calcularlo a partir de movimientos.

Prompt utilizado

“¿Es mejor guardar el stock directamente o calcularlo a partir de los movimientos en un sistema de inventario?”

Reflexión
La recomendación fue calcularlo dinámicamente para evitar inconsistencias.
Adopté este enfoque y lo implementé en el backend.
Fue una decisión clave porque simplificó la lógica de integridad, aunque implicó más consultas y procesamiento.


🐛 6. Error con Prisma Client

Contexto
Tuve problemas al usar Prisma, especialmente con archivos generados y configuración del cliente.

Prompt utilizado

“Estoy teniendo errores con Prisma Client, ¿cómo soluciono problemas de generación o configuración?”

Reflexión
La solución implicó ejecutar prisma generate y ajustar rutas ignoradas en .gitignore.
También entendí mejor cómo Prisma genera código automáticamente.
Esto me ayudó a estabilizar el backend.

🎨 7. Mejora de diseño y accesibilidad en frontend

Contexto
Estaba desarrollando la interfaz del sistema de inventario y noté que todas las secciones (crear producto, registrar movimientos y lista de productos) estaban organizadas en una sola columna. Esto hacía que la interfaz fuera poco clara y difícil de usar, especialmente al tener múltiples acciones en pantalla.

Prompt utilizado

“A nivel de accesibilidad creo que las secciones de crear producto, registrar entrada/salida y la sección donde aparecen los productos no deberían estar en una misma columna. ¿Puedes ayudarme a mejorar el diseño de mi frontend?”

Reflexión
La IA sugirió separar las responsabilidades visuales utilizando un layout en columnas, colocando las acciones (formularios) en un sidebar y la visualización de productos en el área principal.
A partir de esto, reorganicé la interfaz usando un diseño tipo dashboard con dos columnas, lo que mejoró significativamente la claridad y la experiencia de usuario.
También ajusté manualmente estilos, jerarquía visual y distribución de componentes para lograr una interfaz más usable, ya que la propuesta inicial requería adaptación a mi caso específico.