const form = document.getElementById("searchForm");
const clearButton = document.getElementById("clearButton");

form.addEventListener("submit", (e) => {
    e.preventDefault();
    const keyword = document.getElementById("keyword").value.trim();

    console.log("SEARCH clicked with:", { keyword });
});

clearButton.addEventListener("click", () => {
    form.requestFullscreen();
    console.log("Form cleared");
});