const PACKS = new Set(["pack_10_fotos", "pack_30_fotos", "pack_20_fotos_1_video"]);

export async function onRequestPost({ env, request }) {
  try {
    const body = await request.json();
    const name = String(body.name || "").trim().slice(0, 120);
    const phone = digits(body.phone);
    const cpfCnpj = digits(body.cpfCnpj);
    const packId = String(body.packId || "").trim();

    if (name.length < 2) return json({ error: "Informe seu nome." }, 400);
    if (phone.length < 10 || phone.length > 13) return json({ error: "Informe um WhatsApp válido." }, 400);
    if (![11, 14].includes(cpfCnpj.length)) return json({ error: "Informe um CPF ou CNPJ válido." }, 400);
    if (!PACKS.has(packId)) return json({ error: "Escolha um pacote válido." }, 400);
    if (body.adultConsent !== true) return json({ error: "Confirme que você tem 18 anos ou mais." }, 400);

    const base = String(env.CRM_BASE_URL || "").replace(/\/$/, "");
    if (!base) return json({ error: "Integração com o CRM não configurada." }, 503);

    const lead = await crm(base, "/api/leads", "POST", {
      name, phone, interest: packId, source: "Página de vendas", tags: ["landing-page", "checkout"],
    });
    await crm(base, `/api/leads/${encodeURIComponent(lead.id)}`, "PATCH", { cpfCnpj });
    const checkout = await crm(base, "/api/payments/pix", "POST", { contactId: lead.id, packId });

    return json({ ok: true, leadId: lead.id, payment: checkout.payment }, 201);
  } catch (error) {
    console.error("Falha no checkout", error);
    return json({ error: error instanceof Error ? error.message : "Não foi possível gerar o pagamento." }, 502);
  }
}

async function crm(base, path, method, body) {
  const response = await fetch(`${base}${path}`, {
    method, headers: { "content-type": "application/json" }, body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `CRM respondeu com status ${response.status}.`);
  return data;
}

function digits(value) { return String(value || "").replace(/\D/g, ""); }
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

