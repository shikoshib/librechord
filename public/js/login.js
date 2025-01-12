const usernameRegex = /[^\w.-]+/g;
const emailRegex = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;
const passwordInput = document.querySelector("#password");
const passwordErrorInput = document.querySelector(".password-input span.error-input");

const button = document.querySelector("button");
button.addEventListener("click", async () => {
    let isError = false;

    if (location.pathname.endsWith("/login")) {
        const loginInput = document.querySelector("#login");
        const loginErrorInput = document.querySelector(".login-input span.error-input");

        loginInput.classList.remove("error-input-box");
        passwordInput.classList.remove("error-input-box");
        loginErrorInput.innerHTML = "";
        passwordErrorInput.innerHTML = "";

        if (!loginInput.value.trim().length) {
            isError = true;
            loginInput.classList.add("error-input-box");
            loginErrorInput.innerHTML = langFile.please_type_username_or_email;
        }

        if (!passwordInput.value.trim().length) {
            isError = true;
            passwordInput.classList.add("error-input-box");
            passwordErrorInput.innerHTML = langFile.please_type_password;
        }

        if (isError) return;

        const loginRequest = await fetch("/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                login: loginInput.value.trim(),
                password: passwordInput.value.trim()
            })
        });

        const loginResponse = await loginRequest.json();
        if (loginResponse.error) {
            if (loginResponse.errorCode == 5) {
                isError = true;
                loginInput.classList.add("error-input-box");
                loginErrorInput.innerHTML = langFile.incorrect;

                passwordInput.classList.add("error-input-box");
                passwordErrorInput.innerHTML = langFile.incorrect;
            }
        } else {
            location.pathname = "/";
        }
    } else { // Sign up
        const usernameInput = document.querySelector("#username");
        const emailInput = document.querySelector("#email");

        const usernameErrorInput = document.querySelector(".username-input span.error-input");
        const emailErrorInput = document.querySelector(".email-input span.error-input");

        usernameInput.classList.remove("error-input-box");
        emailInput.classList.remove("error-input-box");
        passwordInput.classList.remove("error-input-box");
        usernameErrorInput.innerHTML = "";
        emailErrorInput.innerHTML = "";
        passwordErrorInput.innerHTML = "";

        if (usernameInput.value.trim().length < 3) {
            isError = true;
            usernameInput.classList.add("error-input-box");
            usernameErrorInput.innerHTML = langFile.must_be_3ch;
        }

        if (!usernameInput.value.trim().length) {
            isError = true;
            usernameInput.classList.add("error-input-box");
            usernameErrorInput.innerHTML = langFile.please_type_username;
        }

        if (usernameInput.value.trim().match(usernameRegex)) {
            if (usernameInput.value.trim().match(usernameRegex).length) {
                isError = true;
                usernameInput.classList.add("error-input-box");
                usernameErrorInput.innerHTML = langFile.username_chlimit;
            }
        }

        if (!emailInput.value.trim().match(emailRegex)) {
            isError = true;
            emailInput.classList.add("error-input-box");
            emailErrorInput.innerHTML = langFile.invalid_email;
        }

        if (!emailInput.value.trim().length) {
            isError = true;
            emailInput.classList.add("error-input-box");
            emailErrorInput.innerHTML = langFile.please_type_email;
        }

        if (passwordInput.value.trim().length < 6) {
            isError = true;
            passwordInput.classList.add("error-input-box");
            passwordErrorInput.innerHTML = langFile.must_be_6ch;
        }

        if (!passwordInput.value.trim().length) {
            isError = true;
            passwordInput.classList.add("error-input-box");
            passwordErrorInput.innerHTML = langFile.please_type_password;
        }

        if (isError) return;

        const signUpRequest = await fetch("/api/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: emailInput.value.trim(),
                username: usernameInput.value.trim(),
                password: passwordInput.value.trim()
            })
        });

        const signUpResponse = await signUpRequest.json();
        if (signUpResponse.error) {
            if (signUpResponse.errorCode == 6) {
                isError = true;
                emailInput.classList.add("error-input-box");
                emailErrorInput.innerHTML = langFile.email_taken;
            } else if (signUpResponse.errorCode == 7) {
                isError = true;
                usernameInput.classList.add("error-input-box");
                usernameErrorInput.innerHTML = langFile.username_taken;
            }
        } else {
            location.pathname = "/";
        }
    }
})