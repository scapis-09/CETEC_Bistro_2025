import { auth, db } from "./firebase-config.js";
import { ref, get, update, child } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

let compraBloqueada = false;
let maxIngressos = 0;
let nomeCPF = "";

// Atualiza a navbar
function updateNav() {
  const btnLogin = document.getElementById("btnLogin");
  const user = auth.currentUser;
  if (!btnLogin) return;

  if (user) {
    btnLogin.innerHTML = `Olá, ${user.displayName || user.email} <span class="small">(sair)</span>`;
    btnLogin.classList.remove("btn-outline-primary");
    btnLogin.classList.add("btn-primary");
    btnLogin.onclick = async () => {
      if (confirm("Deseja sair?")) {
        await auth.signOut();
        window.location.reload();
      }
    };
  } else {
    btnLogin.innerHTML = "Login";
    btnLogin.classList.remove("btn-primary");
    btnLogin.classList.add("btn-outline-primary");
    btnLogin.onclick = () => (window.location.href = "index.html#login");
  }
}

// Gera campos de ingressos dinamicamente
function gerarCamposExtras(qtd) {
  const container = document.getElementById("extraFields");
  container.innerHTML = "";

  for (let i = 1; i <= qtd; i++) {
    const bloco = document.createElement("div");
    bloco.classList.add("card", "p-3", "mb-2");
    bloco.innerHTML = `
      <h6>Ingresso ${i}</h6>
      <div class="form-group mb-2">
        <label>Tipo do ingresso:</label>
        <select id="tipo_${i}" class="form-select">
          <option value="inteiro" selected>Inteiro - R$ 120,00</option>
          <option value="meia">Meia (menor de 12 anos) - R$ 60,00</option>
        </select>
      </div>
      <div class="form-group mb-2">
        <label>Observações:</label>
        <input type="text" id="obs_${i}" class="form-control" placeholder="Ex: Assento preferencial">
      </div>
      <div class="form-group">
        <label>Restrições alimentares:</label>
        <input type="text" id="restricao_${i}" class="form-control" placeholder="Ex: Sem glúten">
      </div>
    `;
    container.appendChild(bloco);
  }
}

// Calcula total
function calcularTotal() {
  const qtd = parseInt(document.getElementById("quantity").value, 10) || 1;
  let total = 0;
  for (let i = 1; i <= qtd; i++) {
    const tipo = document.getElementById(`tipo_${i}`)?.value || "inteiro";
    total += tipo === "meia" ? 60 : 120;
  }
  document.getElementById("buyTotal").textContent = "R$ " + total.toFixed(2).replace(".", ",");
  return total;
}

// Atualiza quantidade no Firebase
export async function registrarCompraFirebase(cpf, quantidadeComprada) {
  try {
    const dbRef = ref(db);
    const snapshot = await get(child(dbRef, `ingressosdisponiveis/${cpf}`));
    if (!snapshot.exists()) return;

    const data = snapshot.val();
    const novaQuantidade = Math.max((data.quantidade || 0) - quantidadeComprada, 0);
    await update(ref(db, `ingressosdisponiveis/${cpf}`), { quantidade: novaQuantidade });
    console.log(`✅ Quantidade atualizada. Restam ${novaQuantidade} ingressos para o CPF ${cpf}.`);
  } catch (error) {
    console.error("❌ Erro ao atualizar quantidade no Firebase:", error);
  }
}

// Cria transação PIX
async function Criar_transacao(arrayIngressos) {
  try {
    const response = await fetch("https://api-processamento-pagamentos-bistro-2025.onrender.com/ingresso/gerar_transacao", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(arrayIngressos)
    });
    if (!response.ok) throw new Error(`Response status: ${response.status}`);
    return await response.json();
  } catch (err) {
    console.error(err.message);
  }
}

// Verifica pagamento
async function Verificar_transacao(id_transacao) {
  try {
    const response = await fetch(`https://api-processamento-pagamentos-bistro-2025.onrender.com/ingresso/verificar_transacao?id_transacao=${id_transacao}`);
    if (!response.ok) throw new Error(`Response status: ${response.status}`);
    return await response.json();
  } catch (err) {
    console.error(err.message);
  }
}

// DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
  updateNav();

  const cpfInput = document.getElementById("cpf");
  const cpfPagadorInput = document.getElementById("cpfPagador");
  const cpfStatus = document.getElementById("cpfStatus");
  const camposCompra = document.getElementById("camposCompra");
  const quantityInput = document.getElementById("quantity");
  const form = document.getElementById("formCompra");
  const btnFinalizar = document.getElementById("btnFinalizar");
  const maxInfo = document.getElementById("maxInfo");
  const btnVerificarCPF = document.getElementById("btnVerificarCPF");

  quantityInput.addEventListener("input", () => {
    if (parseInt(quantityInput.value, 10) > maxIngressos) quantityInput.value = maxIngressos;
    gerarCamposExtras(parseInt(quantityInput.value, 10));
    calcularTotal();
  });

  document.addEventListener("change", (e) => {
    if (e.target.matches("select[id^='tipo_']")) calcularTotal();
  });

  gerarCamposExtras(parseInt(quantityInput.value, 10) || 1);
  calcularTotal();

  auth.onAuthStateChanged((user) => {
    updateNav();

    if (!user) {
      alert("Você precisa estar logado para comprar ingressos.");
      window.location.href = "index.html#login";
      return;
    }

    btnVerificarCPF.addEventListener("click", async () => {
      const cpf = cpfInput.value.trim();
      cpfStatus.textContent = "";
      camposCompra.style.display = "none";
      btnFinalizar.disabled = true;

      if (cpf.length !== 11) {
        cpfStatus.textContent = "Digite um CPF válido (11 números)";
        return;
      }

      const dbRef = ref(db);
      const snapshot = await get(child(dbRef, `ingressosdisponiveis/${cpf}`));
      if (!snapshot.exists()) {
        cpfStatus.textContent = "❌ CPF não autorizado para compra.";
        return;
      }

      const data = snapshot.val();
      maxIngressos = data.quantidade;
      nomeCPF = data.nome || "";

      cpfStatus.innerHTML = `✅ CPF válido! <strong>Nome:</strong> ${nomeCPF}<br>Você pode comprar até ${maxIngressos} ingressos.`;
      camposCompra.style.display = "block";
      btnFinalizar.disabled = false;
      maxInfo.textContent = `Máximo permitido: ${maxIngressos}`;

      if (parseInt(quantityInput.value, 10) > maxIngressos) quantityInput.value = maxIngressos;
      gerarCamposExtras(parseInt(quantityInput.value, 10));
      calcularTotal();
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (compraBloqueada) return;

      const cpf = cpfInput.value.trim();
      const cpfPagador = cpfPagadorInput.value.trim();
      const quantity = parseInt(quantityInput.value, 10);

      if (quantity > maxIngressos) {
        alert(`Você só pode comprar até ${maxIngressos} ingressos.`);
        return;
      }

      const ingressos = [];
      let valorTotal = 0;
      for (let i = 1; i <= quantity; i++) {
        const tipo = document.getElementById(`tipo_${i}`).value;
        const obs = document.getElementById(`obs_${i}`).value || "";
        const restricao = document.getElementById(`restricao_${i}`).value || "nenhuma";
        const preco = tipo === "meia" ? 60 : 120;
        valorTotal += preco;

        ingressos.push({
          nome: nomeCPF,
          cpf_pagador: cpfPagador,
          id_conta_titular: user.uid,
          tipo,
          restricao,
          observacao: obs
        });
      }

      const result = await Criar_transacao(ingressos);

      if (result?.qrcode) {
        const qrDiv = document.createElement("div");
        qrDiv.classList.add("text-center", "mt-4");
        qrDiv.innerHTML = `
          <h5>Escaneie o QR Code abaixo para pagar:</h5>
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(result.qrcode)}" alt="QR Code Pix" />
          <p class="mt-3"><strong>Valor total:</strong> R$ ${valorTotal.toFixed(2).replace('.', ',')}</p>
        `;
        document.querySelector(".purchase-card").appendChild(qrDiv);

        alert("Transação criada! Após o pagamento, a compra será confirmada automaticamente.");

        const interval = setInterval(async () => {
          const status = await Verificar_transacao(result.id_transacao);
          if (status?.message === "Transação paga com sucesso.") {
            clearInterval(interval);
            alert("✅ Pagamento confirmado! Compra finalizada com sucesso.");
            await registrarCompraFirebase(cpf, quantity);
            window.location.reload();
          }
        }, 10000);
      }
    });
  });
});
