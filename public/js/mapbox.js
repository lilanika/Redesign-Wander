mapboxgl.accessToken =
  "pk.eyJ1IjoibGlsYXdvbGtlIiwiYSI6ImNrbDZsejRzdDFleHQyd21uejVpNmFjd2kifQ.HKVGmke-kcUCQhJw6M_BgQ";

// mapboxgl.accessToken = 'pk.eyJ1IjoibGlsYXdvbGtlIiwiYSI6ImNrbDZsejRzdDFleHQyd21uejVpNmFjd2kifQ.HKVGmke-kcUCQhJw6M_BgQ';

const map = new mapboxgl.Map({
  container: "map", // container ID
  style: "mapbox://styles/mapbox/streets-v12 ", // style URL*/
  /*style: 'mapbox://styles/mapbox/light-v10', mapbox://styles/lilawolke/ckla2e7231icq17sauvgo6pdd */
  center: [13.405, 52.52], // starting position [lng, lat] */
  zoom: 12, // starting zoom
});

const nav = new mapboxgl.NavigationControl();
map.addControl(nav, "bottom-right");

// Marker
var marker = new mapboxgl.Marker() // initialize a new marker
  .setLngLat([-122.25948, 37.87221]) // Marker [lng, lat] coordinates
  .addTo(map); // Add the marker to the map

// Searchbar
var geocoder = new MapboxGeocoder({
  // Initialize the geocoder
  accessToken: mapboxgl.accessToken, // Set the access token
  mapboxgl: mapboxgl, // Set the mapbox-gl instance
  marker: false, // Do not use the default marker style
  placeholder: "Search for places",
});

// Add the geocoder to the map
/*map.addControl(geocoder); */

var geocoder = new MapboxGeocoder({
  accessToken: mapboxgl.accessToken,
  mapboxgl: mapboxgl,
});

document.getElementById("geocoder").appendChild(geocoder.onAdd(map));

//marker

// After the map style has loaded on the page,
// add a source layer and default styling for a single point
map.on("load", function () {
  map.addSource("single-point", {
    type: "geojson",
    data: {
      type: "FeatureCollection",
      features: [],
    },
  });

  map.addLayer({
    id: "point",
    source: "single-point",
    type: "circle",
    paint: {
      "circle-radius": 10,
      "circle-color": "#448ee4",
    },
  });

  // Listen for the `result` event from the Geocoder
  // `result` event is triggered when a user makes a selection
  //  Add a marker at the result's coordinates
  geocoder.on("result", function (e) {
    map.getSource("single-point").setData(e.result.geometry);
    console.log(e.result);

    const long = e.result.geometry.coordinates[0];
    const lat = e.result.geometry.coordinates[1];
    const name = e.result.text;
    const address = e.result.place_name;
    const category = e.result.properties.category;
    document.querySelector("#saveLocation").onclick = function () {
      console.log(long, lat);
      // axios.post('http://localhost:3000/addPlace', {coordinates: [long, lat], name: name, address: address, category: category} )

      axios
        .post("https://wander-app-wm1c.onrender.com/addPlace", {
          coordinates: [long, lat],
          name: name,
          address: address,
          category: category,
        })
        .then((response) => {
          showMarkers();
          showPopUp();
        })

        .catch((err) => console.log(err));
    };

    // //Update the marker
    document.querySelector("#saveTag").onclick = function () {};
  });
});

function showMarkers() {
  console.log("SHOW MARKERS");
  //axios.get('http://localhost:3000/api/favoritesPlaces').then(response =>{

  axios
    .get("https://wander-app-wm1c.onrender.com/api/favoritesPlaces")
    .then((response) => {
      const places = response.data.data;
      let color = "red";
      console.log(places);
      places.forEach((place) => {
        if (place.tag === "Food") {
          color = "#9b5de5";
        } else if (place.tag === "Cafe") {
          color = "#c65ccd";
        } else if (place.tag === "Park") {
          color = "#f15bb5";
        } else if (place.tag === "Sports") {
          color = "#fee440";
        } else if (place.tag === "Culture") {
          color = "peachpuff";
        } else if (place.tag === "Club") {
          color = "#5d9e87";
        } else if (place.tag === "Overnight") {
          color = "#00C8AA";
        } else {
          color = "amarine";
        }
        new mapboxgl.Marker({
          scale: 1,
          color: color,
        })
          .setLngLat(place.coordinates)
          .addTo(map)
          .on("dragend", (data) => {
            console.log(data);
          });
      });
    });
}

showMarkers();

function showPopUp() {
  //axios.get('http://localhost:3000/api/favoritesPlaces').then(response => {

  //https://wander-share-your-spots.herokuapp.com
  axios
    .get("https://wander-app-wm1c.onrender.com/api/favoritesPlaces")
    .then((response) => {
      const places = response.data.data;
      places.forEach((place) => {
        new mapboxgl.Popup({
          closeButton: true,
        })
          .setLngLat(place.coordinates)
          .setHTML(place.name)
          .setMaxWidth("200px")
          .addTo(map);
      });
    });
}

showPopUp();

// color: #00b7ff;
//  background: #122933;
//   background: #8eb2c4;

// function showPopUp (){
//   axios.get('http://localhost:3000/api/favoritesPlaces').then(response =>{
//   const places = response.data.data;
//   places.forEach(place => {
//     new mapboxgl.Popup({
//          closeButton: true
//        });
//       popup.setLngLat(place.coordinates)
//          .setHTML('<h1>Hello World</h1>')
//       //   .setMaxWidth('400px')
//       //   .addTo(map)

//   })

// }
//to uptade the markers with the tag
//
// const popup = new mapboxgl.Popup({
//   closeButton: true
// });
// popup.setLngLat([13.405, 52.52])
//   .setHTML('<h1>Hello World</h1>')
//   .setMaxWidth('400px')
//   .addTo(map)

// color: #00b7ff;
//  background: #122933;
//   background: #8eb2c4;

// function showPopUp (){
//   axios.get('http://localhost:3000/api/favoritesPlaces').then(response =>{
//   const places = response.data.data;
//   places.forEach(place => {
//     new mapboxgl.Popup({
//          closeButton: true
//        });
//       popup.setLngLat(place.coordinates)
//          .setHTML('<h1>Hello World</h1>')
//       //   .setMaxWidth('400px')
//       //   .addTo(map)

//   })

// }
//to uptade the markers with the tag
//
// const popup = new mapboxgl.Popup({
//   closeButton: true
// });
// popup.setLngLat([13.405, 52.52])
//   .setHTML('<h1>Hello World</h1>')
//   .setMaxWidth('400px')
//   .addTo(map)
