// A Kiwify chama este endereço sozinha a cada venda, reembolso ou chargeback
import { json, normEmail, emailOk, pegar, guardar, logs, igual } from "../lib/comum.mjs";

const PAGO = ["paid", "approved", "order_approved", "complete", "completed"];
const CANCEL = ["refunded", "order_refunded", "chargedback", "chargeback", "refund"];

export default async (req) => {
  const url = new URL(req.url);
  const chave = process.env.KIWIFY_CHAVE || "";
  if (!chave || !igual(url.searchParams.get("k"), chave)) return json({ erro: "chave" }, 401);
  if (req.method !== "POST") return json({ ok: true, info: "webhook ativo" });

  let b = {};
  try { b = await req.json(); } catch {}
  const c = b.Customer || b.customer || b.buyer || {};
  const email = normEmail(c.email || b.email || b.customer_email);
  const nome = String(c.full_name || c.first_name || c.name || "").slice(0, 80);
  const st = String(b.order_status || b.status || "").toLowerCase();
  const ev = String(b.webhook_event_type || b.event || "").toLowerCase();

  let acao = "ignorado";
  if (emailOk(email)) {
    const pago = PAGO.includes(st) || PAGO.includes(ev);
    const cancel = CANCEL.includes(st) || CANCEL.includes(ev);
    const rec = (await pegar(email)) || { email, criadoEm: new Date().toISOString(), origem: "kiwify" };
    if (nome && !rec.nome) rec.nome = nome;
    if (cancel) { rec.status = "reembolsado"; rec.canceladoEm = new Date().toISOString(); await guardar(rec); acao = "bloqueado"; }
    else if (pago) { rec.status = "pago"; rec.pedido = String(b.order_id || rec.pedido || ""); await guardar(rec); acao = "liberado"; }
  }

  // guarda um registro simples (sem CPF/telefone) para conferir no painel
  try {
    const id = new Date().toISOString() + "-" + Math.random().toString(36).slice(2, 7);
    await logs().setJSON(id, { quando: new Date().toISOString(), email, status: st, evento: ev, acao });
  } catch {}

  return json({ ok: true, acao });
};

export const config = { path: "/api/kiwify" };
