mapboxgl.accessToken =
  "pk.eyJ1IjoibGlsYXdvbGtlIiwiYSI6ImNrbDZsejRzdDFleHQyd21uejVpNmFjd2kifQ.HKVGmke-kcUCQhJw6M_BgQ";

// Dynamic API URL
const API_BASE_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:3000"
    : "https://wander-app-wm1c.onrender.com";

const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/streets-v12",
  center: [13.405, 52.52],
  zoom: 12,
});

const nav = new mapboxgl.NavigationControl();
map.addControl(nav, "bottom-right");

let tempMarker = null;
let searchMarker = null;
let currentSearchPlace = null; // Store current search result for save button

// Wait for DOM and map to load
map.on("load", function () {
  const geocoderContainer = document.getElementById("geocoder");

  if (geocoderContainer) {
    // Create search box element
    const searchBox = document.createElement("mapbox-search-box");
    searchBox.accessToken = mapboxgl.accessToken;
    searchBox.options = {
      language: "de",
      types: "poi,address,place",
      proximity: [13.405, 52.52],
    };
    searchBox.marker = true; // Enable marker
    searchBox.mapboxgl = mapboxgl; // Pass mapboxgl

    geocoderContainer.appendChild(searchBox);

    // Bind search box to map - THIS IS KEY!
    searchBox.bindMap(map);

    // Handle retrieve event for saving
    searchBox.addEventListener("retrieve", (e) => {
      console.log("Place selected - full event:", e);
      console.log("Event detail:", e.detail);
      console.log("Event detail type:", typeof e.detail);
      console.log("Event detail keys:", Object.keys(e.detail));

      // IMPORTANT: e.detail is a FeatureCollection, get the first feature!
      let feature;
      if (e.detail.features && e.detail.features.length > 0) {
        feature = e.detail.features[0];
        console.log("Got feature from features[0]:", feature);
      } else if (e.detail.geometry) {
        feature = e.detail;
        console.log("Using e.detail as feature (has geometry)");
      } else {
        console.error("No features found in result", e.detail);
        return;
      }

      console.log("Feature extracted:", feature);
      console.log("Feature keys:", Object.keys(feature));
      console.log("Feature.properties:", feature.properties);
      console.log("Feature.geometry:", feature.geometry);

      // Get coordinates
      let coords, long, lat, name, address, category;

      if (feature.geometry && feature.geometry.coordinates) {
        coords = feature.geometry.coordinates;
      } else if (feature.coordinates) {
        coords = feature.coordinates;
      } else {
        console.error("No coordinates found in feature");
        return;
      }

      long = coords[0];
      lat = coords[1];

      // Get place details
      name =
        feature.properties?.name ||
        feature.properties?.full_address ||
        feature.name ||
        "Unknown Place";

      address =
        feature.properties?.full_address ||
        feature.properties?.place_formatted ||
        feature.place_name ||
        `${lat.toFixed(4)}, ${long.toFixed(4)}`;

      category =
        feature.properties?.poi_category ||
        feature.properties?.feature_type ||
        "place";

      // FIX: If category is an array, convert to string
      if (Array.isArray(category)) {
        category = category[0] || "place";
      }

      console.log("Parsed data:", { long, lat, name, address, category });

      // Store the current search result for the save button
      currentSearchPlace = {
        long: long,
        lat: lat,
        name: name,
        address: address,
        category: category,
      };

      console.log("Stored search place for save button:", currentSearchPlace);
    });

    // Handle the HTML save button click
    const saveLocationBtn = document.querySelector("#saveLocation");
    if (saveLocationBtn) {
      saveLocationBtn.onclick = function (e) {
        e.preventDefault();
        e.stopPropagation();

        if (currentSearchPlace) {
          console.log(
            "Saving place from search bar button:",
            currentSearchPlace
          );
          savePlace(
            currentSearchPlace.long,
            currentSearchPlace.lat,
            currentSearchPlace.name,
            currentSearchPlace.address,
            currentSearchPlace.category
          );
          currentSearchPlace = null; // Clear after saving
        } else {
          alert("Please search for a place first!");
        }
        return false;
      };
    }
  } else {
    console.error("Geocoder container not found!");
  }
});

// Click on map to add place
map.on("click", async function (e) {
  const long = e.lngLat.lng;
  const lat = e.lngLat.lat;

  console.log("Map clicked at:", lat, long);

  if (tempMarker) {
    tempMarker.remove();
  }

  tempMarker = new mapboxgl.Marker({
    color: "#FF6B6B",
    draggable: true,
  })
    .setLngLat([long, lat])
    .addTo(map);

  // Get place name from coordinates
  try {
    const response = await axios.get(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${long},${lat}.json`,
      {
        params: { access_token: mapboxgl.accessToken },
      }
    );

    const feature = response.data.features[0];
    const placeName = feature ? feature.text : "Unknown Place";
    const placeAddress = feature
      ? feature.place_name
      : `${lat.toFixed(4)}, ${long.toFixed(4)}`;

    const popup = new mapboxgl.Popup({ offset: 25 })
      .setLngLat([long, lat])
      .setHTML(
        `
        <div style="padding: 10px;">
          <strong>${placeName}</strong>
          <p style="font-size: 12px; color: #666; margin: 5px 0;">${placeAddress}</p>
          <button id="save-clicked-place" style="
            background: #448ee4;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            width: 100%;
            margin-top: 5px;
          ">💾 Save this place</button>
        </div>
      `
      )
      .addTo(map);

    setTimeout(() => {
      const btn = document.getElementById("save-clicked-place");
      if (btn) {
        btn.onclick = () => {
          popup.remove();
          savePlace(long, lat, placeName, placeAddress, "place");
        };
      }
    }, 100);
  } catch (error) {
    console.error("Error getting place details:", error);
  }
});

// Save place function
async function savePlace(long, lat, name, address, category) {
  console.log("Saving:", name);

  try {
    const response = await axios.post(`${API_BASE_URL}/addPlace`, {
      coordinates: [long, lat],
      name: name,
      address: address,
      category: category,
    });

    // Get the saved place ID from response
    const placeId = response.data.place._id;
    console.log("Place saved with ID:", placeId);

    // Redirect to the place details/edit page
    window.location.href = `/favoritesPlaces/${placeId}/edit`;
  } catch (err) {
    console.error("Error saving:", err);
    alert("❌ Error saving place!");
  }
}

function showMarkers() {
  console.log("SHOW MARKERS");

  // Clear existing markers first
  const existingMarkers = document.querySelectorAll(".wander-marker");
  existingMarkers.forEach((m) => m.remove());

  axios
    .get(`${API_BASE_URL}/api/favoritesPlaces`)
    .then((response) => {
      const places = response.data.data;
      console.log("Loading", places.length, "places");

      places.forEach((place) => {
        let color = "aquamarine";
        if (place.tag === "Food") color = "#9b5de5";
        else if (place.tag === "Cafe") color = "#c65ccd";
        else if (place.tag === "Park") color = "#f15bb5";
        else if (place.tag === "Sports") color = "#fee440";
        else if (place.tag === "Culture") color = "peachpuff";
        else if (place.tag === "Club") color = "#5d9e87";
        else if (place.tag === "Overnight") color = "#00C8AA";

        const marker = new mapboxgl.Marker({
          scale: 1,
          color: color,
        })
          .setLngLat(place.coordinates)
          .addTo(map);

        // Add class to identify our markers
        marker.getElement().classList.add("wander-marker");
      });
    })
    .catch((err) => console.error("Error loading markers:", err));
}

function showPopUp() {
  axios
    .get(`${API_BASE_URL}/api/favoritesPlaces`)
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
    })
    .catch((err) => console.error("Error loading popups:", err));
}

showMarkers();
showPopUp();
