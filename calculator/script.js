const numberButtons = document.querySelectorAll(".number");
const operatorButtons = document.querySelectorAll(".operator");
const clearButton = document.querySelector(".clear");
const backspaceButton = document.querySelector(".backspace");
const resultButton = document.querySelector(".result");
const display = document.querySelector(".display");

let currentInput = "";
let previousInput = "";
let operator = "";

numberButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (justCalculated) {
      currentInput = "";
      justCalculated = false;
    }
    currentInput += button.textContent;
    display.value = currentInput;
  });
});

operatorButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (currentInput === "") return;
    if (previousInput !== "") {
      calculate();
    }
    operator = button.textContent;
    previousInput = currentInput;
    currentInput = "";
  });
});

clearButton.addEventListener("click", () => {
  currentInput = "";
  previousInput = "";
  operator = "";
  display.value = "";
});

backspaceButton.addEventListener("click", () => {
  currentInput = currentInput.slice(0, -1);
  display.value = currentInput;
});

resultButton.addEventListener("click", () => {
  if (currentInput === "" || previousInput === "") return;
  calculate();
  //   display.textConetent = ("");
});

function calculate() {
  let result;
  const prev = parseFloat(previousInput);
  const current = parseFloat(currentInput);

  switch (operator) {
    case "+":
      result = prev + current;
      break;
    case "-":
      result = prev - current;
      break;
    case "*":
      result = prev * current;
      break;
    case "/":
      result = prev / current;
      break;
    case "%":
      result = prev % current;
      break;
    default:
      return;
  }

  display.value = result;
  currentInput = result.toString();
  previousInput = "";
  operator = "";
  justCalculated = true;
}
let justCalculated = false;
