function toggleMasterKey() {
  const masterKeyField = document.getElementById("masterKey");
  const toggleIcon = masterKeyField.nextElementSibling;

  if (masterKeyField.type === "password") {
    masterKeyField.type = "text";
    toggleIcon.textContent = "🙈";
  } else {
    masterKeyField.type = "password";
    toggleIcon.textContent = "👁️";
  }
}

function strToBuf(str) {
  return new TextEncoder().encode(str);
}

function bufToBase64(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

async function deriveKey(masterKey) {
  const enc = new TextEncoder().encode(masterKey);
  const keyMaterial = await crypto.subtle.importKey("raw", enc, { name: "PBKDF2" }, false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc,
      iterations: 1000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  );
}

async function encrypt() {
  let pw = document.getElementById("password").value;
  let mk = document.getElementById("masterKey").value;
  if (!pw || !mk) return showError("⚠️ Enter both Master Key and Password");

  try {
    const key = await deriveKey(mk);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const data = strToBuf(pw);

    const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data);
    let out = bufToBase64(encrypted);

    // short deterministic output
    let fixed = out.replace(/[^a-zA-Z0-9]/g, "").slice(0, 16);

    showResult(fixed);
    showSuccess("✅ Token Generated!");
  } catch (err) {
    console.error(err);
    showError("❌ Encryption Failed!");
  }
}

function showResult(text) {
  document.getElementById("result").innerText = text;
  document.getElementById("output").style.display = "flex";
}

function copyText() {
  let text = document.getElementById("result").innerText;
  navigator.clipboard.writeText(text);
  showSuccess("✅ Copied to clipboard");
}

function showError(msg) {
  const popup = document.getElementById("errorPopup");
  popup.textContent = msg;
  popup.classList.add("show");
  setTimeout(() => popup.classList.remove("show"), 2500);
}

function showSuccess(msg) {
  const popup = document.getElementById("successPopup");
  popup.textContent = msg;
  popup.classList.add("show");
  setTimeout(() => popup.classList.remove("show"), 2000);
}

/* ✅ Markdown Popup */
function openFilePopup() {
  fetch('docs/Readme.md')
    .then(response => response.text())
    .then(data => {
      document.getElementById('fileText').innerHTML = marked.parse(data);
      document.getElementById('filePopup').style.display = 'block';
    });
}

function closeFilePopup() {
  document.getElementById('filePopup').style.display = 'none';
}
