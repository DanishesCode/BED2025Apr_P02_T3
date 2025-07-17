const apiBaseUrl = "http://localhost:3000";

function getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
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

document.addEventListener("DOMContentLoaded",async function(){
    const hospitalData = await getHospitals();
    console.log(hospitalData);

    const hospitalList = document.querySelector(".hospitals-list");
    const hospitalCard = document.querySelector(".hospital-card");
    const search = document.querySelector(".search-area input");
    const map = document.querySelector(".map");

    //load all hospitals
    hospitalData.forEach(function(hospital) {
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
        clone.setAttribute("latitutde", lat);
        clone.setAttribute("ownership",ownership);

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
            
            clone.addEventListener("click",function(){
                Array.from(hospitalList.children).forEach(function(child) {
                    child.setAttribute("selected",0);
                });
                clone.setAttribute("selected",1);
            })

        hospitalList.appendChild(clone);
    });
    hospitalCard.style.display = "none";
})