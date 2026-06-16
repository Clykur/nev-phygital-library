async function check() {
  try {
    const res = await fetch("http://127.0.0.1:8787/ping");
    const data = await res.json();
    console.log("Backend is RUNNING:", data);
  } catch (e) {
    console.log("Backend is NOT running:", e.message);
  }
}

check();
