// O app pergunta, de vez em quando, se este celular ainda é o dono do acesso
import { json, corpo, normEmail, pegar } from "../lib/comum.mjs";

export default async (req) => {
  if (req.method !== "POST") return json({ erro: "metodo" }, 405);
  const b = await corpo(req);
  const email = normEmail(b.email);
  const aparelho = String(b.aparelho || "").slice(0, 64);
  const rec = email ? await pegar(email) : null;
  if (!rec) return json({ ok: false, motivo: "nao_encontrado" });
  if (rec.status !== "pago") return json({ ok: false, motivo: "reembolsado" });
  if (rec.aparelho && rec.aparelho !== aparelho) return json({ ok: false, motivo: "outro_aparelho" });
  return json({ ok: true });
};

export const config = { path: "/api/checar" };
