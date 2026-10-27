// Painel do dono (protegido por senha)
import { json, corpo, normEmail, emailOk, pegar, guardar, loja, logs, igual } from "../lib/comum.mjs";

export default async (req) => {
  if (req.method !== "POST") return json({ erro: "metodo" }, 405);
  const senha = process.env.ADMIN_SENHA || "";
  if (!senha) return json({ erro: "sem_senha_configurada" }, 500);
  const b = await corpo(req);
  if (!igual(b.senha, senha)) { await new Promise((r) => setTimeout(r, 800)); return json({ erro: "senha" }, 401); }

  const st = loja();
  switch (b.acao) {
    case "entrar":
      return json({ ok: true, webhook: !!process.env.KIWIFY_CHAVE });
    case "listar": {
      const { blobs } = await st.list();
      const itens = (await Promise.all(blobs.map((x) => st.get(x.key, { type: "json" })))).filter(Boolean);
      itens.sort((a, b) => String(b.criadoEm || "").localeCompare(String(a.criadoEm || "")));
      return json({ ok: true, itens });
    }
    case "adicionar": {
      const lista = String(b.emails || "").split(/[\s,;]+/).map(normEmail).filter(emailOk);
      let n = 0;
      for (const email of lista) {
        const rec = (await pegar(email)) || { email, criadoEm: new Date().toISOString(), origem: "manual" };
        rec.status = "pago"; await guardar(rec); n++;
      }
      return json({ ok: true, n });
    }
    case "liberarTroca": {
      const rec = await pegar(normEmail(b.email)); if (!rec) return json({ erro: "nao_encontrado" }, 404);
      rec.aparelho = null; rec.ultimaTroca = null; await guardar(rec); return json({ ok: true });
    }
    case "bloquear": case "desbloquear": {
      const rec = await pegar(normEmail(b.email)); if (!rec) return json({ erro: "nao_encontrado" }, 404);
      rec.status = b.acao === "bloquear" ? "reembolsado" : "pago"; await guardar(rec); return json({ ok: true });
    }
    case "apagar": {
      await st.delete(normEmail(b.email)); return json({ ok: true });
    }
    case "logs": {
      const L = logs(); const { blobs } = await L.list();
      const ult = blobs.map((x) => x.key).sort().reverse().slice(0, 30);
      const itens = (await Promise.all(ult.map((k) => L.get(k, { type: "json" })))).filter(Boolean);
      return json({ ok: true, itens });
    }
  }
  return json({ erro: "acao" }, 400);
};

export const config = { path: "/api/admin" };
