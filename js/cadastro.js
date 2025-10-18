import { auth } from "../firebase-config.js";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  signOut
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

const formRegister = document.getElementById("formRegister");
if (formRegister) {
  formRegister.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("registerName").value.trim();
    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value;

    if (!name || !email || password.length < 6) {
      alert("Preencha nome, email e senha (mínimo 6 caracteres).");
      return;
    }

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const user = cred.user;

      // grava o displayName no Auth (persistirá para o login)
      await updateProfile(user, { displayName: name });

      // envia email de verificação
      await sendEmailVerification(user);

      // opcional: desloga o usuário para forçar login depois da verificação
      await signOut(auth);

      // fechar modal (Bootstrap 4 + jQuery)
      if (window.$) $("#modalRegister").modal("hide");

      alert("Conta criada. Verifique seu email e faça login depois da verificação.");
    } catch (err) {
      console.error("Erro no cadastro:", err);
      alert(err.message || "Erro no cadastro");
    }
  });
}
