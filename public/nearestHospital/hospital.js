

const apiBaseUrl = "http://localhost:3000";
function showLoading() {
  document.getElementById("loading-screen").style.display = "flex";
}

function hideLoading() {
  document.getElementById("loading-screen").style.display = "none";
}
function getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }
  function convertMinutes(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);
  
    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}min`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${minutes}min`;
    }
  }
  
  function showNotification(message, type) {
    const notification = document.getElementById("notification");
    const text = document.getElementById("notification-text");
  
    text.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.remove("hidden");
  
    // Trigger animation
    setTimeout(() => {
      notification.classList.add("show");
    }, 10); // small delay to allow DOM to apply the class
  
    // Hide after 3 seconds
    setTimeout(() => {
      notification.classList.remove("show");
      setTimeout(() => {
        notification.classList.add("hidden");
      }, 400); // match transition duration
    }, 3000);
  }
  function loadMap(lng, lat, hospitalData) {
    mapboxgl.accessToken = "pk.eyJ1IjoiZGFuaXNoZXNjb2RlIiwiYSI6ImNtZDh5aWxhczAxbnoya3NmYzUxcmZqM2sifQ.Be8TKU22qp3-RbLJY6m4Zw";
  
    const map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [lng, lat],
      zoom: 15
    });
  
    // Store all popups
    const allPopups = [];
  
    // Utility: close all open popups
    function closeAllPopups() {
      allPopups.forEach(p => p.remove());
    }
  
    map.on('load', () => {
      // === "You" marker ===
      const youPopup = new mapboxgl.Popup({
        offset: [0, -30],
        closeOnClick: false
      }).setText('You');
  
      const youEl = document.createElement('img');
      youEl.src = "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f9cd.png";
      youEl.style.width = '2vw';
      youEl.style.height = '2vw';
  
      const youMarker = new mapboxgl.Marker(youEl)
        .setLngLat([lng, lat])
        .setPopup(youPopup)
        .addTo(map);
  
      allPopups.push(youPopup);
  
      youMarker.getElement().addEventListener('click', (e) => {
        e.stopPropagation();
        closeAllPopups();         
        youPopup.addTo(map);     
      });
  
      // === Hospital Markers ===
      hospitalData.forEach((hospital) => {
        const hospPopup = new mapboxgl.Popup({
          offset: [0, -30],
          closeOnClick: false
        }).setText(hospital.name || 'Hospital');
  
        allPopups.push(hospPopup);
  
        const hospEl = document.createElement('img');
        hospEl.src = "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f3e5.png"; // 🏥 icon
        hospEl.style.width = '2vw';
        hospEl.style.height = '2vw';
  
        const marker = new mapboxgl.Marker(hospEl)
          .setLngLat([hospital.longitude, hospital.latitude])
          .setPopup(hospPopup)
          .addTo(map);
  
        marker.getElement().addEventListener('click', (e) => {
          e.stopPropagation();
          closeAllPopups();        
          hospPopup.addTo(map);    
        });
      });

      map.on('click', () => closeAllPopups());
      window.addEventListener('keydown', () => closeAllPopups());
    });
    return map;
  }

  function centerMap(map, lng, lat, zoom = 15) {
    map.flyTo({
      center: [lng, lat],
      zoom: zoom,
      speed: 1.2,     // controls animation speed
      curve: 1.42,    // control flight curvature
      essential: true // respects user’s motion preferences
    });
  }
  
  

async function getHospitals(){
    try{
        const response = await fetch(`${apiBaseUrl}/hospital/getall`,  {
          headers: getAuthHeaders(),
        });
        if (!response.ok) {
            // Handle HTTP errors (e.g., 404, 500)
            // Attempt to read error body if available, otherwise use status text
            const errorBody = response.headers
              .get("content-type")
              ?.includes("application/json")
              ? await response.json()
              : { message: response.statusText };
            throw new Error(
              `HTTP error! status: ${response.status}, message: ${errorBody.message}`
            );
          }
          const data = await response.json();

          if (data === 0){
            console.log("data not found");
            return null
          }else{
            return data;
          }
    }catch(error){
        console.error("error fetching data",error)
    }
}
async function getRouteData(data){
  try {
    // Make a POST request to your API endpoint
    const response = await fetch(`${apiBaseUrl}/hospital/getroute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders()
      },
      body: JSON.stringify(data),
    });
  
    const responseBody = response.headers
      .get("content-type")
      ?.includes("application/json")
      ? await response.json()
      : { message: response.statusText };
  
    if (response.status === 200) {
      console.log("Route data received:", responseBody);
      return responseBody; // Return route data (geometry, distance, duration)
    } else if (response.status === 400) {
      showNotification(`Validation error: ${responseBody.error}`, "error");
      return null;
    } else {
      throw new Error(
        `API error! status: ${response.status}, message: ${responseBody.message}`
      );
    }
  } catch (error) {
    console.error("getRouteData error:", error);
    showNotification("Failed to retrieve route data", "error");
    return null;
  }
}

function getUserCoordinates() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => {
        reject(error);
      }
    );
  });
}
function sortHospitalByDistance() {
  const list = document.querySelector(".hospitals-list");
  const items = Array.from(list.children);
  console.log(items);

  items.sort((a, b) => {
    return parseFloat(a.getAttribute("distance")) - parseFloat(b.getAttribute("distance"));
  });

  // Reattach in new order
  items.forEach(item => list.appendChild(item));
}


function drawRouteOnMap(map, geojson) {
  if (map.getSource('route')) {
    map.removeLayer('route');
    map.removeSource('route');
  }

  map.addSource('route', {
    type: 'geojson',
    data: {
      type: 'Feature',
      geometry: geojson
    }
  });

  map.addLayer({
    id: 'route',
    type: 'line',
    source: 'route',
    layout: {
      'line-join': 'round',
      'line-cap': 'round'
    },
    paint: {
      'line-color': '#0074D9',
      'line-width': 5
    }
  }); 


  const coords = geojson.coordinates;
  const bounds = coords.reduce(
    (b, coord) => b.extend(coord),
    new mapboxgl.LngLatBounds(coords[0], coords[0])
  );
  map.fitBounds(bounds, { padding: 50 });
} 


document.addEventListener("DOMContentLoaded", async function() {
  showLoading();
  let userCoord;
  try {
    userCoord = await getUserCoordinates();
    showNotification("Coordinates received successfully", "success");
  } catch (error) {
    // handle error, e.g. showNotification(...)
    return; // or handle fallback
  }

  // Now you can safely load the map

  let type = "walking";
  let filteredVal = "false";
  const hospitalData = await getHospitals();
  console.log(hospitalData);   
  const travelType = document.querySelector(".travel-type"); 
  const search = document.querySelector(".search-area input");
  const sortDistance = document.querySelector(".search-area button");

  
  const map = await loadMap(userCoord.longitude, userCoord.latitude,hospitalData);

  sortDistance.addEventListener("click",function(){
    sortHospitalByDistance();
    filteredVal = "true";
  })

  Array.from(travelType.children).forEach(function(button){
      if (button.getAttribute('via') == type) {
          button.style.borderColor = "blue";
      }
      button.addEventListener("click",function(){
          type = button.getAttribute("via");

          Array.from(document.querySelector(".hospitals-list").children).forEach(async function(card){
            if(card.getAttribute("cloned") == "true"){
              let label = card.querySelector(".distance");
              let dataToBeSent = {"profile":type,
                "start":[userCoord.longitude,userCoord.latitude],
                "end":[card.getAttribute("longtitude"),card.getAttribute("latitude")]
              }
    
              let route = await getRouteData(dataToBeSent);//get route data
              card.setAttribute("distance",route.route.distanceKm);
              label.textContent = `ETA: ${convertMinutes(route.route.durationMin)} Dist: ${route.route.distanceKm}km`;
            }
            if(filteredVal == "true"){
              sortHospitalByDistance(); 
            }

          })
            

          Array.from(travelType.children).forEach(function(x){
              x.style.borderColor = "white";
          })
          button.style.borderColor = "blue";
      })
      hideLoading();

  });
  //load all hospitals
  function loadHospitals(data){
      const hospitalList = document.querySelector(".hospitals-list");
      const hospitalCard = document.querySelector(".hospital-card");
      Array.from(hospitalList.children).forEach(function(c) {
          if (c.getAttribute("cloned") == "true") {
              c.remove();
          }
      });
      data.forEach(async function(hospital) {
          let address = hospital.address;
          let emergency = hospital.emergency_services;
          let lat = hospital.latitude;
          let long = hospital.longitude;        ;
          let name = hospital.name;
          let ownership = hospital.ownership;
          let rating = hospital.rating;
          let telephone = hospital.telephone;
          let services = hospital.services.split(",").map(item => item.trim());
          

          
          let clone = hospitalCard.cloneNode(true);
          clone.querySelector(".hospital-name").textContent = name;
          clone.querySelector(".rating").textContent = "⭐ "+rating;
          clone.querySelector(".hospital-address").textContent = address;
          clone.querySelector(".hospital-info .telephone").textContent = "+65 "+telephone;
          clone.querySelector(".type").textContent = ownership;
          clone.setAttribute("name",name);
          clone.setAttribute("services",services);
          clone.setAttribute("emergency",emergency);
          clone.setAttribute("longtitude", long);
          clone.setAttribute("latitude", lat);
          clone.setAttribute("ownership",ownership);
          clone.style.display = "flex";
          clone.setAttribute("cloned","true");

          let dataToBeSent = {"profile":type,
            "start":[userCoord.longitude,userCoord.latitude],
            "end":[clone.getAttribute("longtitude"),clone.getAttribute("latitude")]
          }

          let route = await getRouteData(dataToBeSent);//get route data
          clone.querySelector(".distance").textContent = `ETA: ${convertMinutes(route.route.durationMin)} Dist: ${route.route.distanceKm}km`;
          clone.setAttribute("distance",route.route.distanceKm);
          

          const serviceTag = clone.querySelector(".service-tag");
          const servicesSect = clone.querySelector(".services");
          if(!emergency){
              clone.querySelector(".emergency-badge").style.display = "none";
              
          }
              let serviceLength = services.length;//load services
              for(i=0; i <serviceLength;i++){
                  let currentService = services[i];
                  let newTag = serviceTag.cloneNode(true);
                  newTag.textContent = currentService;
                  servicesSect.appendChild(newTag);
              }
              serviceTag.style.display = "none";
              //click selected
              
              clone.addEventListener("click",async function(){
                  Array.from(hospitalList.children).forEach(function(child) {
                      child.setAttribute("selected",0);
                      child.style.borderColor = "grey";
      
                  });
                  clone.setAttribute("selected",1);
                  clone.style.borderColor = "blue";
                  drawRouteOnMap(map,route.route.geometry);
                  centerMap(map,clone.getAttribute("longtitude"),clone.getAttribute("latitude"));
                  

      
              })
      
          hospitalList.appendChild(clone);
          
      });
  }

  loadHospitals(hospitalData);
  
  search.addEventListener("input", function () {
    const query = search.value.toLowerCase();
    const hospitalCards = document.querySelector(".hospitals-list").children;
  
    // List of attribute names you want to search in
    const searchableAttributes = ["name", "type", "services","ownership"];
  
    Array.from(hospitalCards).forEach(card => {
      // Check if any of the desired attributes include the query
      const matchFound = searchableAttributes.some(attr => {
        const attrValue = card.getAttribute(attr);
        return attrValue && attrValue.toLowerCase().includes(query);
      });
  
      // Show or hide the card
      card.style.display = matchFound ? "flex" : "none";
    });
  });
  

  

})