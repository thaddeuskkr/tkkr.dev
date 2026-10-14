const pinDigits = [...document.querySelectorAll(".pin-digit")];
function selectDigit(index) {
    const input = pinDigits[index];
    if (input && !input.disabled) {
        input.focus();
        input.select();
    }
}

function submitCompletePin() {
    const form = pinDigits[0]?.form;
    if (
        !form ||
        form.dataset.submitting === "true" ||
        pinDigits.some((input) => input.disabled || !/^[0-9]$/.test(input.value))
    ) {
        return;
    }

    const button = form.querySelector("button[type=\"submit\"]");
    if (button && !button.disabled) form.requestSubmit(button);
}

pinDigits.forEach((input, index) => {
    input.addEventListener("focus", () => input.select());
    input.addEventListener("input", () => {
        input.value = input.value.replace(/[^0-9]/g, "").slice(-1);
        if (input.value && index < pinDigits.length - 1) selectDigit(index + 1);
        submitCompletePin();
    });
    input.addEventListener("keydown", (event) => {
        if (event.key === "Backspace" && !input.value && index > 0) {
            event.preventDefault();
            pinDigits[index - 1].value = "";
            selectDigit(index - 1);
        } else if (event.key === "ArrowLeft" && index > 0) {
            event.preventDefault();
            selectDigit(index - 1);
        } else if (event.key === "ArrowRight" && index < pinDigits.length - 1) {
            event.preventDefault();
            selectDigit(index + 1);
        }
    });
    input.addEventListener("paste", (event) => {
        const value = event.clipboardData?.getData("text").trim();
        if (!value) return;
        event.preventDefault();
        if (!/^[0-9\s-]+$/.test(value)) return;
        const digits = value.replace(/[^0-9]/g, "");
        if (!digits) return;
        // Pasting a complete PIN replaces all digits, even from the middle of the field.
        const start = digits.length >= pinDigits.length ? 0 : index;
        const pasted = digits.slice(0, pinDigits.length - start);
        [...pasted].forEach((digit, offset) => {
            pinDigits[start + offset].value = digit;
        });
        selectDigit(Math.min(start + pasted.length, pinDigits.length - 1));
        submitCompletePin();
    });
});
for (const toggle of document.querySelectorAll(".reveal-secret")) {
    const input = document.getElementById(toggle.getAttribute("aria-controls"));
    if (!input) continue;
    toggle.hidden = false;
    toggle.addEventListener("click", () => {
        const visible = input.type === "password";
        input.type = visible ? "text" : "password";
        toggle.setAttribute("aria-pressed", String(visible));
        toggle.setAttribute(
            "aria-label",
            `${visible ? "Hide" : "Show"} ${toggle.dataset.secretLabel}`,
        );
    });
}

for (const form of document.querySelectorAll(".unlock-form")) {
    const button = form.querySelector("button[type=\"submit\"]");
    if (!button || button.disabled) continue;
    const label = button.querySelector("span");
    const originalLabel = label?.textContent;
    form.addEventListener("submit", (event) => {
        if (form.dataset.submitting === "true") {
            event.preventDefault();
            return;
        }

        form.dataset.submitting = "true";
        button.setAttribute("aria-disabled", "true");
        if (label) label.textContent = "Opening link…";
    });
    window.addEventListener("pageshow", () => {
        delete form.dataset.submitting;
        button.removeAttribute("aria-disabled");
        if (label) label.textContent = originalLabel;
    });
}
