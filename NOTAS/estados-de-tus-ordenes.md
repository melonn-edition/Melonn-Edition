# Cada paquete tiene su propia historia

**Guía para sellers y equipo Melonn**
Cómo leer el estado de tus órdenes, de cada paquete y de su transporte. Explicado paso a paso, con ejemplos, para sellers y para el equipo interno.

*Melonn · Aprende con Melonn · Agosto 2026*

---

## Qué cambió

### Ahora ves el avance de cada paquete, no solo de la orden

Antes veías un solo estado por orden. Ahora, si tu orden tiene más de un paquete, cada uno avanza con su propio estado, su propia guía y su propia transportadora. El estado de la orden siempre refleja el conjunto de todos sus paquetes.

**El recorrido de una orden, de un vistazo**

1. **Alistamiento** — Se recibe, se reserva inventario y se empaca en el CEDIS.
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
| Empacada en bodega | Todos los paquetes de tu orden están listos en el CEDIS, a la espera de ser despachados o recogidos. |

### Estados de la orden en transporte: los seis estados principales

| Estado | Qué significa |
| --- | --- |
| Recogido por el comprador | Solo si el método de envío es recogida en tienda: el comprador retiró la orden en el CEDIS. |
| En tránsito | La orden ya se entregó a la transportadora y va en camino a la dirección de entrega. |
| Entregada | La orden llegó al comprador. Queda cerrada; desde aquí solo cabe un proceso de devolución. |
| Perdida | Todos los paquetes de la orden se perdieron durante el tránsito. Es un cierre no exitoso. |
| En flujo no esperado | Uno o más paquetes tuvo una entrega fallida o está en proceso de cancelación. La orden puede retomar su curso o terminar cancelada. |
| Cancelada | La orden se canceló y los productos volvieron al inventario disponible. No se puede reactivar. |

### Cuando tu orden tiene varios paquetes

Estos cuatro estados aparecen mientras los paquetes de una misma orden van a ritmos distintos:

- **Parcialmente en tránsito** — Al menos un paquete ya salió; los demás siguen en el CEDIS.
- **Parcialmente entregado** — Al menos un paquete ya llegó al comprador; los demás siguen su curso.
- **Con novedad — en gestión** — Un paquete está perdido, con entrega fallida o en cancelación, y el resto aún no cierra.
- **Con novedad — resuelta** — Un paquete quedó perdido o cancelado, y todos los demás ya cerraron. Es un estado final.

> Estos cuatro estados solo existen si tu orden tiene más de un paquete. Si tu orden viaja en un solo paquete, nunca la vas a ver en ninguno de ellos.

### Resumen: ¿cuáles estados son finales?

Un estado es final cuando, al llegar a él, la orden ya no vuelve a cambiar.

| Estado | ¿Qué tan definitivo es? |
| --- | --- |
| Recogido por comprador | Estado final |
| En tránsito | Sigue cambiando |
| Entregada | Estado final |
| Perdida | Estado final |
| En flujo no esperado | Sigue cambiando |
| Cancelada | Estado final |
| Parcialmente en tránsito | Sigue cambiando |
| Parcialmente entregado | Sigue cambiando |
| Con novedad – en gestión | Sigue cambiando |
| Con novedad – resuelta | Estado final |

---

## El paquete

### Cada paquete avanza con su propio estado

El paquete es la unidad que realmente se mueve. Su estado es la fuente de la que nace el estado de toda la orden.

**Antes de salir: el paso a paso en el CEDIS**

1. **Empacado** — El paquete se crea durante el proceso de empaque.
2. **Pendiente de sortear** — Está pendiente de ser enrutado dentro del CEDIS.
3. **Listo para recogida** — Ya puede ser recogido por la transportadora, o por el comprador si aplica.
4. **En preparación y despacho** — Se selecciona, se prepara y queda listo para el despacho.

### Cómo se cierra un paquete

- **Recogido por el comprador** — El comprador retiró el paquete en un punto de recogida.
- **Entregado al comprador** — El paquete se entregó exitosamente en la dirección del comprador.
- **Perdido** — El paquete se reportó como perdido, de forma definitiva.
- **Cancelado** — El paquete se canceló, de forma definitiva.

### Intento de entrega vs. ofrecimiento de entrega

Dos formas distintas en las que un paquete puede intentar llegar al comprador:

- **Intento** — El paquete sale del CEDIS Melonn y regresa al mismo CEDIS sin quedar en poder del servicio de transporte, por una entrega fallida.
- **Ofrecimiento** — El paquete sale del CEDIS y queda en poder del servicio de transporte. Si falla, puede reintentarse sin devolverlo a Melonn: un nuevo ofrecimiento dentro del mismo intento.

> Cada paquete puede tener varios intentos, y dentro de cada intento, uno o más ofrecimientos. Todo queda registrado en el detalle del paquete para que puedas hacerle seguimiento.

---

## Ejemplos

### El estado de tu orden nace del de tus paquetes

El estado de la orden no se asigna aparte: se calcula siempre a partir de todos sus paquetes.

**Un ejemplo para verlo completo**

Tu orden #12345 se empacó en 3 paquetes. Así se vería su avance día a día:

| Día | Qué pasó | Estado de tu orden |
| --- | --- | --- |
| Lunes | Los 3 paquetes quedan empacados en el CEDIS | Empacada en bodega |
| Martes | Sale el primer paquete con la transportadora | Parcialmente en tránsito |
| Miércoles | Salen los otros 2 paquetes | En tránsito |
| Jueves | Se entrega el primer paquete al comprador | Parcialmente entregado |
| Viernes | Se entregan los 2 paquetes restantes | Entregada |

> El martes y el jueves la orden muestra estados parciales: no es una alerta, solo refleja que tus paquetes avanzan a ritmos distintos. Llega a Entregada solo cuando todos sus paquetes fueron entregados.

**Ejemplos de combinación**

| Si un paquete está… | Y el otro está… | Tu orden se ve como |
| --- | --- | --- |
| Entregado al comprador | Entregado al comprador | Entregada |
| Entregado al comprador | En tránsito | Parcialmente entregado |
| En tránsito | Preparado para despacho | Parcialmente en tránsito |
| Preparado para despacho | Listo para recogida | Empacada en bodega |
| Entrega fallida | En tránsito | En flujo no esperado |
| Perdido | Cancelado | Con novedad – resuelta |

> Si tu orden tiene más de dos paquetes, aplica la misma lógica: la orden siempre refleja la situación del conjunto, nunca la de un solo paquete.

---

## El transporte

### Transportadora o mensajería: cada una con sus estados

Cada paquete tiene su propio servicio de transporte, con su guía y sus ofrecimientos de entrega.

**Transportadora**

- **Creado:** se generó el servicio y se asignó la guía.
- **En ciudad de origen, en ruta nacional y en ciudad de destino:** el paquete avanza bajo custodia de la transportadora.
- **En reparto:** va camino a la dirección del comprador.
- **Entrega exitosa, retorno o perdido:** los tres cierres posibles.

**Mensajería**

- **En camino:** el mensajero salió del CEDIS hacia el comprador.
- **Arribo exitoso:** el mensajero entregó el paquete en la dirección.
- **Fallido:** no pudo entregar y regresa con el paquete al CEDIS.

---

Ya conoces el significado de cada estado, de tu orden, de cada paquete y de su transporte.

*Melonn · Aprende con Melonn · Agosto 2026*
