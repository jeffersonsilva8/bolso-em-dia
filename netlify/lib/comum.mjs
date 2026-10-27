import { getStore } from "@netlify/blobs";

export const DIAS_TROCA = 30; // a cada quantos dias a pessoa pode passar o acesso para outro celular

export const loja = () => getStore({ name: "compradores", consistency: "strong" });
export const logs = () => getStore({ name: "kiwify-logs", consistency: "strong" });

export const normEmail = (e) => String(e || "").trim().toLowerCase();
export const emailOk = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

export const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

export async function corpo(req) {
  try { return await req.json(); } catch { return {}; }
}

export async function pegar(email) {
  return (await loja().get(email, { type: "json" })) || null;
}
export async function guardar(rec) {
  await loja().setJSON(rec.email, rec);
}

export function podeTrocar(rec) {
  if (!rec.ultimaTroca) return { pode: true };
  const libera = new Date(rec.ultimaTroca).getTime() + DIAS_TROCA * 864e5;
  return { pode: Date.now() >= libera, liberaEm: new Date(libera).toISOString() };
}

// comparação que não vaza tempo (senha)
export function igual(a, b) {
  a = String(a || ""); b = String(b || "");
  if (!a || !b || a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
