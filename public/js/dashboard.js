const username = document.getElementById("username").getAttribute("data-value");
// user information tags
const accountInfoEditButton = document.getElementById("account-info-edit");
const accountInfoSubmitButton = document.getElementById("account-info-submit");
const accountInfoError = document.getElementById("account-info-error");
const firstNameValue = document.getElementById("first-name-value");
const firstNameInput = document.getElementById("first-name-input");
const lastNameValue = document.getElementById("last-name-value");
const lastNameInput = document.getElementById("last-name-input");
const oldPasswordBlock = document.getElementById("old-password");
const newPasswordBlock = document.getElementById("new-password");
const oldPasswordInput = document.getElementById("old-password-input");
const newPasswordInput = document.getElementById("new-password-input");
const changePassword = document.getElementById("change-password");

// toggle user information tags
accountInfoEditButton.addEventListener("click", () => {
  if (firstNameValue.style.display !== "none") {
    firstNameValue.style.display = "none";
    firstNameInput.style.display = "inline";
    lastNameValue.style.display = "none";
    lastNameInput.style.display = "inline";
    accountInfoSubmitButton.style.display = "inline";
    accountInfoError.style.display = "none";
    oldPasswordBlock.style.display = "inline";
    newPasswordBlock.style.display = "inline";
  } else {
    firstNameValue.style.display = "inline";
    firstNameInput.style.display = "none";
    lastNameValue.style.display = "inline";
    lastNameInput.style.display = "none";
    accountInfoSubmitButton.style.display = "none";
    accountInfoError.style.display = "none";
    oldPasswordBlock.style.display = "none";
    newPasswordBlock.style.display = "none";
  }
});

// post request for user information updated data
accountInfoSubmitButton.addEventListener("click", () => {
  const firstName = firstNameInput.value.trim();
  const lastName = lastNameInput.value.trim();
  const oldPassword = oldPasswordInput.value.trim();
  const newPassword = newPasswordInput.value.trim();
  const changePasswordOption = changePassword.checked;

  if (!/^[A-Za-z]+$/.test(firstName) || !/^[A-Za-z]+$/.test(lastName)) {
    accountInfoError.textContent = "First name and last name must be characters only.";
    accountInfoError.style.display = "inline";
  } else if (changePasswordOption && newPassword.length === 0) {
    accountInfoError.textContent = "New password cannot be empty.";
    accountInfoError.style.display = "inline";
  } else if (changePasswordOption && newPassword === oldPassword) {
    accountInfoError.textContent = "Both passwords are the same.";
    accountInfoError.style.display = "inline";
  } else {
    fetch("/updateUserInfo", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username: username, firstName: firstName, lastName: lastName, oldPassword: oldPassword, newPassword: newPassword, updatePassword: changePasswordOption }),
    }).then((response) => {
      if (response.status === 304) {
        accountInfoError.textContent = "Old password does not match.";
        accountInfoError.style.display = "inline";
      } else {
        window.location.reload();
      }
    });
  }
});
