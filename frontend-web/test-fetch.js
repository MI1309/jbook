async function test() {
  const url = 'https://imronm.pythonanywhere.com/api/content/kanji/f23d3d57-a0c6-4ad0-8e65-34efc280e98e';
  const res = await fetch(url);
  console.log("Status:", res.status);
  const data = await res.json();
  console.log("Data:", data.meaning);
}
test();
