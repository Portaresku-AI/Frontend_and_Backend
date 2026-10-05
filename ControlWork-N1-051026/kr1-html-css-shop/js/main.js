const dialogButtons = document.querySelectorAll('[data-dialog]');

for (const button of dialogButtons) {
  button.addEventListener('click', function () {
    const dialog = document.getElementById(button.dataset.dialog);
    dialog.showModal();
  });
}

const demoForm = document.querySelector('[data-demo-form]');

if (demoForm) {
  demoForm.addEventListener('submit', function (event) {
    event.preventDefault();
    const dialog = document.getElementById(demoForm.dataset.demoForm);
    dialog.showModal();
  });
}
