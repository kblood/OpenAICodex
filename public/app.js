if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}

const map = new maplibregl.Map({
  container: 'map',
  style: {
    version: 8,
    sources: {
      osm: {
        type: 'vector',
        tiles: ['/tiles/{z}/{x}/{y}.pbf'],
        maxzoom: 14
      }
    },
    layers: [
      {
        id: 'water',
        source: 'osm',
        'source-layer': 'water',
        type: 'fill',
        paint: { 'fill-color': '#a0c8f0' }
      }
    ]
  },
  center: [0,0],
  zoom: 1
});

async function search() {
  const q = document.getElementById('query').value;
  const res = await fetch('/api/geofabrik/search?q=' + encodeURIComponent(q));
  const data = await res.json();
  const ul = document.getElementById('results');
  ul.innerHTML = '';
  data.forEach(item => {
    const li = document.createElement('li');
    const link = document.createElement('a');
    link.href = item.url;
    link.textContent = item.name;
    link.target = '_blank';
    const btn = document.createElement('button');
    btn.textContent = 'Download';
    btn.onclick = async () => {
      const resp = await fetch('/api/geofabrik/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: item.url })
      });
      const j = await resp.json();
      alert('Saved to ' + j.saved);
    };
    li.appendChild(link);
    li.appendChild(btn);
    ul.appendChild(li);
  });
}
