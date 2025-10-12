import { auth, db } from "./firebase-config.js";
import { signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import { ref, get, set } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";

const formLogin = document.getElementById("formLogin");
if (formLogin) {
  formLogin.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const user = cred.user;

      if (!user.emailVerified) {
        alert("Por favor, verifique seu email antes de entrar.");
        // opcional: deslogar para evitar sessão com email não verificado
        await signOut(auth);
        return;
      }

      const userRef = ref(db, "usuarios/" + user.uid);
      const snap = await get(userRef);

      if (!snap.exists()) {
        // primeira vez: grava com uid como chave
        await set(userRef, {
          nome: user.displayName || "",
          email: user.email
        });
        console.log("Usuário gravado no Database:", user.uid);
      } else {
        console.log("Usuário já existe no Database:", user.uid);
      }

      if (window.$) $("#modalLogin").modal("hide");
      alert("Login bem-sucedido!");

    } catch (err) {
      console.error("Erro no login:", err);
      alert(err.message || "Erro no login");
    }
  });
}
