// Liberar o app neste celular usando o e-mail da compra
import { json, corpo, normEmail, emailOk, pegar, guardar, podeTrocar } from "../lib/comum.mjs";

export default async (req) => {
  if (req.method !== "POST") return json({ erro: "metodo" }, 405);
  const b = await corpo(req);
  const email = normEmail(b.email);
  const aparelho = String(b.aparelho || "").slice(0, 64);
  if (!emailOk(email)) return json({ erro: "email_invalido" }, 400);
  if (aparelho.length < 8) return json({ erro: "aparelho_invalido" }, 400);

  const rec = await pegar(email);
  if (!rec) return json({ erro: "nao_encontrado" }, 404);
  if (rec.status !== "pago") return json({ erro: "reembolsado" }, 403);

  const agora = new Date().toISOString();
  if (!rec.aparelho || rec.aparelho === aparelho) {
    rec.aparelho = aparelho;
    rec.ativadoEm = rec.ativadoEm || agora;
    await guardar(rec);
    return json({ ok: true, nome: rec.nome || "" });
  }

  const t = podeTrocar(rec);
  if (!b.trocar) return json({ erro: "outro_aparelho", podeTrocar: t.pode, liberaEm: t.liberaEm || null }, 409);
  if (!t.pode) return json({ erro: "aguarde", liberaEm: t.liberaEm }, 429);

  rec.aparelho = aparelho;
  rec.trocas = (rec.trocas || 0) + 1;
  rec.ultimaTroca = agora;
  await guardar(rec);
  return json({ ok: true, trocou: true, nome: rec.nome || "" });
};

export const config = { path: "/api/ativar" };
