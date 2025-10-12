import { auth, db } from "./firebase-config.js";
import { ref, get, update, child } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

let compraBloqueada = false;
let maxIngressos = 0;
let nomeCPF = "";

// Atualiza navbar
function updateNav() {
  const btnLogin = document.getElementById("btnLogin");
  const user = auth.currentUser;

  if (!btnLogin) return;

  if (user) {
    btnLogin.innerHTML = `Olá, ${user.displayName || user.email} <span class="small">(sair)</span>`;
    btnLogin.classList.remove("btn-outline-light");
    btnLogin.classList.add("btn-light");
    btnLogin.onclick = async () => {
      if (confirm("Deseja sair?")) {
        await auth.signOut();
        window.location.reload();
      }
    };
  } else {
    btnLogin.innerHTML = "Registrar / Login";
    btnLogin.classList.remove("btn-light");
    btnLogin.classList.add("btn-outline-light");
    btnLogin.onclick = () => (window.location.href = "index.html#login");
  }
}

// Gera campos dinâmicos
function gerarCamposExtras(qtd) {
  const container = document.getElementById("extraFields");
  container.innerHTML = "";

  for (let i = 1; i <= qtd; i++) {
    const bloco = document.createElement("div");
    bloco.classList.add("card", "p-3", "mb-2");
    bloco.innerHTML = `
      <h6>Ingresso ${i}</h6>
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

/**
 * 🔹 Função que subtrai do Firebase a quantidade de ingressos comprados.
 *    Não grava observações, nome, restrições nem histórico.
 *    Pode ser chamada após o pagamento ser confirmado.
 *
 * @param {string} cpf - CPF do comprador.
 * @param {number} quantidadeComprada - Quantidade de ingressos comprados.
 */
export async function registrarCompraFirebase(cpf, quantidadeComprada) {
  try {
    const dbRef = ref(db);
    const snapshot = await get(child(dbRef, `ingressosdisponiveis/${cpf}`));

    if (!snapshot.exists()) {
      console.warn(`⚠️ CPF ${cpf} não encontrado no banco de dados.`);
      return;
    }

    const data = snapshot.val();
    const quantidadeAtual = data.quantidade || 0;
    const novaQuantidade = Math.max(quantidadeAtual - quantidadeComprada, 0);

    await update(ref(db, `ingressosdisponiveis/${cpf}`), {
      quantidade: novaQuantidade,
    });

    console.log(`✅ Quantidade atualizada. Restam ${novaQuantidade} ingressos para o CPF ${cpf}.`);
  } catch (error) {
    console.error("❌ Erro ao atualizar quantidade no Firebase:", error);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  updateNav();

  const cpfInput = document.getElementById("cpf");
  const cpfStatus = document.getElementById("cpfStatus");
  const camposCompra = document.getElementById("camposCompra");
  const quantityInput = document.getElementById("quantity");
  const totalSpan = document.getElementById("buyTotal");
  const form = document.getElementById("formCompra");
  const btnFinalizar = document.getElementById("btnFinalizar");
  const maxInfo = document.getElementById("maxInfo");
  const btnVerificarCPF = document.getElementById("btnVerificarCPF");

  // Atualiza total
  quantityInput.addEventListener("input", () => {
    const qtd = parseInt(quantityInput.value, 10) || 1;
    if (qtd > maxIngressos) quantityInput.value = maxIngressos;
    totalSpan.textContent = "R$ " + (quantityInput.value * 120).toFixed(2).replace(".", ",");
    gerarCamposExtras(quantityInput.value);
  });

  gerarCamposExtras(parseInt(quantityInput.value, 10) || 1);

  auth.onAuthStateChanged((user) => {
    updateNav();

    if (!user) {
      alert("Você precisa estar logado para comprar ingressos.");
      window.location.href = "index.html#login";
      return;
    }

    // Verifica CPF
    btnVerificarCPF.addEventListener("click", async () => {
      const cpf = cpfInput.value.trim();
      cpfStatus.textContent = "";
      camposCompra.style.display = "none";
      btnFinalizar.disabled = true;

      if (cpf.length != 11) {
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

      if (quantityInput.value > maxIngressos) quantityInput.value = maxIngressos;
      gerarCamposExtras(quantityInput.value);
    });

    // Finalizar compra — agora só salva localmente (não altera Firebase)
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (compraBloqueada) return;

      const cpf = cpfInput.value.trim();
      const quantity = parseInt(quantityInput.value, 10);

      if (quantity > maxIngressos) {
        alert(`Você só pode comprar até ${maxIngressos} ingressos.`);
        return;
      }

      const observacoes = [];
      const restricoes = [];

      for (let i = 1; i <= quantity; i++) {
        observacoes.push(document.getElementById(`obs_${i}`)?.value.trim() || "");
        restricoes.push(document.getElementById(`restricao_${i}`)?.value.trim() || "");
      }

      const dadosAtuais = {
        name: nomeCPF,
        email: user.email || "",
        cpf,
        quantity,
        observacoes,
        restricoes,
        price: 120,
        date: new Date().toISOString(),
      };

      // Salva localmente
      localStorage.setItem("bistroCetecCompraBloqueada", "1");
      localStorage.setItem("bistroCetecDadosCompra", JSON.stringify(dadosAtuais));

      // Não atualiza Firebase aqui!
      compraBloqueada = true;
      alert("Compra registrada localmente. O pagamento será processado a seguir.");
      window.location.reload();
    });
  });
});
