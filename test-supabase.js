const url = "https://oymigkrebvrwygfhtnme.supabase.co";

async function test() {
  try {
    console.log("Fetching", url);
    const res = await fetch(url + "/storage/v1/health");
    console.log("Status:", res.status);
    console.log("Body:", await res.text());
  } catch (err) {
    console.error("Fetch failed:", err.message);
    if (err.cause) {
      console.error("Cause:", err.cause);
    }
  }
}

test();
