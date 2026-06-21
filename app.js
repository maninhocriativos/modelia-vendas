const modal = document.querySelector("#modal");
const form = document.querySelector("#checkout-form");
const errorBox = document.querySelector("#error");

document.querySelectorAll("[data-pack]").forEach((button) => button.addEventListener("click", () => {
  document.querySelector("#pack-id").value = button.dataset.pack;
  document.querySelector("#selected-pack").textContent = `${button.dataset.title} · ${button.dataset.price}`;
  document.querySelector("#form-view").hidden = false;
  document.querySelector("#payment-view").hidden = true;
  errorBox.textContent = "";
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("locked");
}));

document.querySelectorAll("[data-close]").forEach((el) => el.addEventListener("click", closeModal));
document.addEventListener("keydown", (event) => event.key === "Escape" && closeModal());

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = form.querySelector('[type="submit"]');
  button.disabled = true;
  button.innerHTML = "Preparando pagamento…";
  errorBox.textContent = "";
  try {
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: form.elements.name.value,
        phone: form.elements.phone.value,
        cpfCnpj: form.elements.cpfCnpj.value,
        packId: form.elements.packId.value,
        adultConsent: document.querySelector("#adult").checked,
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Não foi possível criar o pagamento.");
    showPayment(data.payment);
  } catch (error) {
    errorBox.textContent = error.message;
  } finally {
    button.disabled = false;
    button.innerHTML = "Continuar para pagamento <b>→</b>";
  }
});

document.querySelector("#copy-pix").addEventListener("click", async () => {
  await navigator.clipboard.writeText(document.querySelector("#pix-code").textContent);
  document.querySelector("#copy-pix").textContent = "Copiado!";
});

function showPayment(payment) {
  document.querySelector("#form-view").hidden = true;
  document.querySelector("#payment-view").hidden = false;
  const pixBox = document.querySelector("#pix-box");
  pixBox.hidden = !payment.pixPayload;
  document.querySelector("#pix-code").textContent = payment.pixPayload || "";
  const link = document.querySelector("#payment-link");
  link.href = payment.invoiceUrl || "#";
  link.hidden = !payment.invoiceUrl;
}

function closeModal() {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("locked");
}
