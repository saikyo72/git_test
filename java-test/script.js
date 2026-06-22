const input = document.querySelector("input");
const pool = document.querySelector(".pool");
const btn = document.querySelector(".btn");
// const row = document.querySelector(".row");

btn.addEventListener("click", createblock);

function createblock() {
  pool.replaceChildren();

  for (let a = 0; a < input.value; a++) {
    const row = document.createElement("div");
    row.classList.add("row");
    pool.appendChild(row);
    for (let i = 0; i < input.value; i++) {
      const cube = document.createElement("div");
      cube.classList.add("cube");
      cube.addEventListener("mouseover", () => {
        cube.style.backgroundColor = "black";
      });
      row.appendChild(cube);
    }
  }
}
