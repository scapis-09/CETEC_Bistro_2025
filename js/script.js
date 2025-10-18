import { auth } from "../firebase-config.js";

// Atualiza a navbar conforme o status do usuário
function updateNav() {
  const btnLogin = document.getElementById("btnLogin");
  const btnRegister = document.getElementById("btnRegister");
  const btnOpenBuy = document.querySelector(".btn-light"); // botão "Comprar ingresso"
  const user = auth.currentUser;

  if (!btnLogin) return;

  if (user) {
    // When logged in, show a single button with user info and hide register
    btnLogin.innerHTML = `Olá, ${user.displayName || user.email} <span class="small">(sair)</span>`;
    btnLogin.classList.remove("btn-outline-primary");
    btnLogin.classList.remove("btn-outline-light");
    btnLogin.classList.add("btn-light");
    if (btnRegister) btnRegister.style.display = "none";

    btnLogin.onclick = async () => {
      if (confirm("Deseja sair?")) {
        await auth.signOut();
      }
    };

    if (btnOpenBuy) {
      btnOpenBuy.disabled = false;
      btnOpenBuy.title = "Comprar ingresso";
    }
  } else {
    // Not logged: show both buttons and set their actions
    btnLogin.innerHTML = "Login";
    btnLogin.classList.remove("btn-light");
    btnLogin.classList.add("btn-outline-primary");
    btnLogin.onclick = () => {
      $('#modalLogin').modal('show');
    };

    if (btnRegister) {
      btnRegister.style.display = "inline-block";
      btnRegister.onclick = () => {
        $('#modalRegister').modal('show');
      };
    }

    if (btnOpenBuy) {
      btnOpenBuy.disabled = true;
      btnOpenBuy.title = "Você precisa estar logado para comprar";
    }
  }
}

// Listener de mudança de autenticação
auth.onAuthStateChanged(() => {
  updateNav();
});

// Voltar ao topo e scroll suave
$(function () {
  $(".back-to-top").on("click", function (e) {
    e.preventDefault();
    $("html,body").animate({ scrollTop: 0 }, 400);
  });

  $(document).on("click", ".scrollto", function (e) {
    if (
      location.pathname.replace(/^\//, "") == this.pathname.replace(/^\//, "") &&
      location.hostname == this.hostname
    ) {
      e.preventDefault();
      var target = $(this.hash);
      if (target.length) {
        var scrollto = target.offset().top - 70;
        $("html, body").animate({ scrollTop: scrollto }, 400);
        return false;
      }
    }
  });

  updateNav();
});

// Abrir modal automaticamente se URL tiver #login
$(document).ready(function () {
  if (window.location.hash === "#login") {
    $('#modalLogin').modal('show');
  }

  // Links dentro dos modais
  $('#linkToRegister').on('click', function (e) {
    e.preventDefault();
    $('#modalLogin').modal('hide');
    $('#modalRegister').modal('show');
  });

  $('#linkToLogin').on('click', function (e) {
    e.preventDefault();
    $('#modalRegister').modal('hide');
    $('#modalLogin').modal('show');
  });
});
