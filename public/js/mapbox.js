export const displayMap = (locations) => {
  mapboxgl.accessToken = 'pk.eyJ1IjoiY21rd29uZyIsImEiOiJja255bGQwa3cxMWhhMnd0Z2gzNmo1bDQwIn0.hwAEMq7SqX0Gz9mCaJ59eQ';
  var map = new mapboxgl.Map({
    container: 'map', // for the #id in tour.pug
    style: 'mapbox://styles/cmkwong/cknymzkhy446d17pbsst8jmai',
    scrollZoom: false
    // center: [-80.185942, 25.774772],
    // zoom: 10,
    // interactive: false
  });

  const bounds = new mapboxgl.LngLatBounds(); // #186-12:00

  locations.forEach(loc => {
    // Create marker
    const el = document.createElement('div');
    el.className = 'marker';

    // Add marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom'
    }).setLngLat(loc.coordinates).addTo(map);

    // Add popup
    new mapboxgl.Popup({
      offset: 30
    })
    .setLngLat(loc.coordinates)
    .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
    .addTo(map);

    // Extend map bounds to include current location
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100
    }
  });

}
