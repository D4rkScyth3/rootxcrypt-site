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

// Derive an HMAC key from the masterKey using PBKDF2 (deterministic)
async function deriveHmacKey(masterKey) {
  const mkBuf = strToBuf(masterKey);

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    mkBuf,
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  // Use a fixed salt so derivation is deterministic for the same masterKey.
  // (Changing the salt will change the derived key; keep it fixed if you want same outputs.)
  const salt = strToBuf("rootxcrypt-deterministic-salt-v1");

  const hmacKey = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000, // higher iterations for stretching
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "HMAC", hash: "SHA-256", length: 256 },
    false,
    ["sign"]
  );

  return hmacKey;
}

// Deterministic token generation using HMAC-SHA-256
async function deterministicToken(password, masterKey, outLen = 16) {
  const key = await deriveHmacKey(masterKey);
  const data = strToBuf(password);

  const signature = await crypto.subtle.sign("HMAC", key, data);
  // base64 encode and keep only alnum and slice to desired length
  const b64 = bufToBase64(signature).replace(/[^a-zA-Z0-9]/g, "");
  return b64.slice(0, outLen);
}

// Replace encrypt() with deterministic version
async function encrypt() {
  let pw = document.getElementById("password").value;
  let mk = document.getElementById("masterKey").value;
  if (!pw || !mk) return showError("⚠️ Enter both Master Key and Password");

  try {
    // deterministic token for same inputs every time
    let fixed = await deterministicToken(pw, mk, 16); // 16-char token
    showResult(fixed);
    showSuccess("✅ Token Generated!");
  } catch (err) {
    console.error(err);
    showError("❌ Token generation failed!");
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

/* ✅ Markdown Popup (unchanged) */
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
