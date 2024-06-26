import comprasRoute from "./comprasRoute.js";
import recebimentoRoute from "./recebimentoRoute.js";
import pcpRoute from "./PCPRoute.js";
import admRoute from "./ADMRoute.js";
import producaoRoute from "./producaoRoute.js";
import usuarioRoute from "./usuarioRoute.js";
import historicoRoute from "./historicoRoute.js";

export default function (fastify) {
  fastify.register(comprasRoute, { prefix: "/compras" });
  fastify.register(recebimentoRoute, { prefix: "/recebimento" });
  fastify.register(pcpRoute, { prefix: "/PCP" });
  fastify.register(admRoute, { prefix: "/adm" });
  fastify.register(producaoRoute, { prefix: "/producao" });
  fastify.register(usuarioRoute, { prefix: "/user" });
  fastify.register(historicoRoute, { prefix: "/historico" });
}
