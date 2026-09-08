# Cada paquete tiene su propia historia

**Guía para sellers y equipo Melonn**
Cómo leer el estado de tus órdenes y de cada paquete. Explicado paso a paso, con ejemplos, para sellers y para el equipo interno.

*Melonn · Aprende con Melonn · Agosto 2026*

---

## Qué cambió

### Ahora ves el avance de cada paquete, no solo de la orden

Antes veías un solo estado por orden. Ahora, si tu orden tiene más de un paquete, cada uno avanza con su propio estado, su propia guía y su propia transportadora. El estado de la orden siempre refleja el conjunto de todos sus paquetes.

**El recorrido de una orden, de un vistazo**

1. **Alistamiento** — Se recibe, se reserva inventario y se empaca en el CEDI.
2. **En camino** — Cada paquete sale con su transportadora hacia el comprador.
3. **Entrega** — El comprador recibe el paquete, o lo recoge en punto.
4. **Cierre** — La orden queda en un estado final: entregada, perdida o cancelada.

---

## La orden

### Estados de la orden en alistamiento

Antes de salir hacia el comprador, tu orden pasa por estos momentos:

| Estado | Qué significa |
| --- | --- |
| Recibida – válida | La orden llegó a Melonn y está pendiente de comenzar su procesamiento. |
| Alistamiento en espera | Está pausada: porque tú lo configuraste (pago, VAS, reserva) o porque Melonn encontró un dato por validar, como una dirección incompleta. |
| Ítems reservados / con agotado | Los productos quedan reservados del inventario. Si falta stock, la orden queda en agotado hasta que llegue nuevo inventario. |
| Picking y empacando | El equipo de Melonn recoge los productos y los empaca según tus instrucciones. |
| Empacada en bodega | Todos los paquetes de tu orden están listos en el CEDI, a la espera de ser despachados o recogidos. |

### Con afectación y Perdida: cuando todos los paquetes tienen novedad

Aplican a **todas las órdenes**, tengan uno o varios paquetes.

- **Con afectación** — La orden se salió de su recorrido normal: ningún paquete está avanzando hacia el comprador. Se activa cuando **todos** los paquetes están en Entrega fallida, Empacado - a la espera o En proceso de cancelación. No es un estado final. En una orden de un solo paquete, significa que ese paquete se salió del camino.
- **Perdida** — Todos los paquetes de la orden se perdieron durante el tránsito. Es un estado final, de cierre no exitoso.

> ⚠️ Paquetes en Empacado - a la espera: regresaron a bodega tras un intento fallido y esperan tu decisión (reintentar o cancelar). Sin acción, se cancelan automáticamente en 15 días.

Si solo algunos paquetes están afectados, la orden no es Con afectación: es Con afectación - Parcial - En curso.

### Solo en órdenes de varios paquetes

> Estos cuatro estados nunca aparecen en una orden de un solo paquete — y solo ~2% de las órdenes son multipaquete.

- **En tránsito - Parcial** — Al menos un paquete ya salió a tránsito; el resto sigue en el CEDI. No es final. Ejemplo: Paquete 1 En tránsito, Paquete 2 Empacada en bodega.
- **Entregada - Parcial** — Al menos un paquete ya se entregó; al entregarse el último, la orden pasa a Entregada. Ejemplo: Paquete 1 Entregado, Paquete 2 En tránsito.
- **Con afectación - Parcial - En curso** — Parte avanza con normalidad y al menos un paquete se salió del camino; la orden sigue abierta. Ejemplo: 2 En tránsito y 1 Entrega fallida.
- **Con afectación - Parcial - Cerrada** — Estado final: todos cerraron con desenlaces distintos (mezcla de Entregados, Perdidos y/o Cancelados). Si todos terminan igual, la orden usa el estado completo. Ejemplo: 1 Perdido y 2 Entregados.

### Resumen: ¿cuáles estados son finales?

Un estado es final cuando, al llegar a él, la orden ya no vuelve a cambiar.

| Estado | ¿Qué tan definitivo es? |
| --- | --- |
| Recogido por comprador | Estado final |
| En tránsito | Sigue cambiando |
| Entregada | Estado final |
| Perdida | Estado final |
| Con afectación | Sigue cambiando |
| Cancelada | Estado final |
| En tránsito - Parcial | Sigue cambiando |
| Entregada - Parcial | Sigue cambiando |
| Con afectación - Parcial - En curso | Sigue cambiando |
| Con afectación - Parcial - Cerrada | Estado final |

---

## El paquete

### Cada paquete avanza con su propio estado

El paquete es la unidad que realmente se mueve. Su estado es la fuente de la que nace el estado de toda la orden.

**Antes de salir: el paso a paso en el CEDI**

1. **Empacado** — El paquete se crea durante el proceso de empaque.
2. **Pendiente de sortear** — Está pendiente de ser enrutado dentro del CEDI.
3. **Listo para recogida** — Ya puede ser recogido por la transportadora, o por el comprador si aplica.
4. **En preparación y despacho** — Se selecciona, se prepara y queda listo para el despacho.

### Cómo se cierra un paquete

- **Recogido por el comprador** — El comprador retiró el paquete en un punto de recogida.
- **Entregado al comprador** — El paquete se entregó exitosamente en la dirección del comprador.
- **Perdido** — El paquete se reportó como perdido, de forma definitiva.
- **Cancelado** — El paquete se canceló, de forma definitiva.

---

## Ejemplos

### El estado de tu orden nace del de tus paquetes

El estado de la orden no se asigna aparte: se calcula siempre a partir de todos sus paquetes.

**Un ejemplo para verlo completo**

Tu orden #12345 se empacó en 3 paquetes. Así se vería su avance día a día:

| Día | Qué pasó | Estado de tu orden |
| --- | --- | --- |
| Lunes | Los 3 paquetes quedan empacados en el CEDI | Empacada en bodega |
| Martes | Sale el primer paquete con la transportadora | En tránsito - Parcial |
| Miércoles | Salen los otros 2 paquetes | En tránsito |
| Jueves | Se entrega el primer paquete al comprador | Entregada - Parcial |
| Viernes | Se entregan los 2 paquetes restantes | Entregada |

> El martes y el jueves la orden muestra estados parciales: no es una alerta, solo refleja que tus paquetes avanzan a ritmos distintos. Llega a Entregada solo cuando todos sus paquetes fueron entregados.

**Ejemplos de combinación**

| Si un paquete está… | Y el otro está… | Tu orden se ve como |
| --- | --- | --- |
| Entregado al comprador | Entregado al comprador | Entregada |
| Entregado al comprador | En tránsito | Entregada - Parcial |
| En tránsito | Preparado para despacho | En tránsito - Parcial |
| Preparado para despacho | Listo para recogida | Empacada en bodega |
| Entrega fallida | En tránsito | Con afectación - Parcial - En curso |
| Perdido | Cancelado | Con afectación - Parcial - Cerrada |

> Si tu orden tiene más de dos paquetes, aplica la misma lógica: la orden siempre refleja la situación del conjunto, nunca la de un solo paquete.

---

---

Ya conoces el significado de cada estado, de tu orden y de cada paquete.

*Melonn · Aprende con Melonn · Agosto 2026*
