// member list tags
const searchMemberButton = document.getElementById("search-member-button");
const searchMemberInput = document.getElementById("search-member-input");
const searchMemberError = document.getElementById("search-member-error");
const membersList = document.getElementById("membersList");

// post request for search member by first name
searchMemberButton.addEventListener("click", () => {
  let memberFirstName = searchMemberInput.value.trim();
  memberFirstName = memberFirstName.charAt(0).toUpperCase() + memberFirstName.slice(1).toLowerCase();

  fetch("/searchMember", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ firstName: memberFirstName }),
  })
    .then((response) => response.json())
    .then((data) => {
      membersList.innerHTML = "";
      if (data.length === 0) {
        searchMemberError.style.display = "inline";
      } else {
        searchMemberError.style.display = "none";
        data.forEach((member, index) => {
          membersList.innerHTML += `
            <div class="accordion-item">
                <h2 class="accordion-header">
                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse${member.username}" aria-expanded="true" aria-controls="collapse${member.username}">
                        ${member.username}
                    </button>
                </h2>
                <div id="collapse${member.username}" class="accordion-collapse collapse" data-bs-parent="#membersList">
                    <div class="accordion-body">
                        <div>First Name: ${member.firstname}</div>
                        <div>Last Name: ${member.lastname}</div>
                    </div>
                </div>
            </div>`;
        });
      }
    });
});
