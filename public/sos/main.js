const apiBaseUrl = "http://localhost:3000";

function getAuthHeaders() {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
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

  async function retrieveData(id){
    try{
        const response = await fetch(`${apiBaseUrl}/caretaker/getrecord/${id}`,  {
          headers: getAuthHeaders()
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
async function convertAddress(data){
  try {
    // Make a POST request to your API endpoint
    const response = await fetch(`${apiBaseUrl}/caretaker/convertaddress`, {
      method: "POST", // Specify the HTTP method
      headers: {
        "Content-Type": "application/json", // Tell the API we are sending JSON
        ...getAuthHeaders()
      },
      body: JSON.stringify(data), // Send the data as a JSON string in the request body
    });

    // Check for API response status (e.g., 201 Created, 400 Bad Request, 500 Internal Server Error)
    const responseBody = response.headers
      .get("content-type")
      ?.includes("application/json")
      ? await response.json()
      : { message: response.statusText };

    if (response.status === 200) {
      console.log("Converted location", responseBody);
      return responseBody; // Return the actual address
    } else if (response.status === 400) {
      // Handle validation errors from the API (from Practical 04 validation middleware)
      showNotification(`Validation error: ${responseBody.error}`,"error");
      return null;
      
    } else {
      // Handle other potential API errors (e.g., 500 from error handling middleware)
      throw new Error(
        `API error! status: ${response.status}, message: ${responseBody.message}`
      );
    }
  } catch (error) {
    console.error("convertAddress error:", error);
    showNotification("There was an error with your address","error");
    return null;
  }
}

async function sendMessage(data){
  try {
    // Make a POST request to your API endpoint
    const response = await fetch(`${apiBaseUrl}/caretaker/send-message`, {
      method: "POST", // Specify the HTTP method
      headers: {
        "Content-Type": "application/json", // Tell the API we are sending JSON
        ...getAuthHeaders()
      },
      body: JSON.stringify(data), // Send the data as a JSON string in the request body
    });

    // Check for API response status (e.g., 201 Created, 400 Bad Request, 500 Internal Server Error)
    const responseBody = response.headers
      .get("content-type")
      ?.includes("application/json")
      ? await response.json()
      : { message: response.statusText };

    if (response.status === 201) {
    console.log("Send message successfully", responseBody);
    return true;
    } else if (response.status === 400) {
      // Handle validation errors from the API (from Practical 04 validation middleware)
      showNotification(`Validation error: ${responseBody.error}`,"error");
      return false;
      
    } 
  } catch (error) {
    showNotification("There was an error sending your message!","error");
  }
}

function receiveCoord(){
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        const coordData = {
          "latitude": latitude,
          "longitude": longitude
        }
        resolve(coordData);
      },
      (error) => {
        console.error("Error getting location:", error);
        showNotification("Error in getting your location","error");
        reject(error);
      }
    );
  });
}

document.addEventListener("DOMContentLoaded",async function(){
  const settingButton = document.querySelector(".settings-button");
  const careTakerElement = document.querySelector(".telegram-none");
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  console.log(currentUser);
  const sosButton = document.querySelector(".sos-button");
  const userId = currentUser.id;
  const name = currentUser.name;
  let data; 
  try{
    data = (await retrieveData(userId))[0];
  }catch{
    console.log("unavailable data")
  }
  console.log(data);

  settingButton.addEventListener("click",function(){
    // Add error handling
    try {
        console.log("Navigating to settings...");
        const url = "/public/sos/setting.html";
        console.log("URL:", url);
        window.location.href = url;
    } catch (error) {
        console.error('Navigation failed:', error);
        // Fallback or show error message
    }
  })

  if(data){
    const telegramName = data.telegram_name;
    const chat_id = data.chat_id;
    careTakerElement.textContent = telegramName;

        sosButton.addEventListener("click",async function(){
      try {
        let coord = await receiveCoord();
        console.log(coord);
        if(coord){
         let address = await convertAddress(coord);
         console.log(address);
         if(address){
           let data = {
             "chatId": chat_id,
              "address": address.address,
               "name":name
           }
           let resp = await sendMessage(data);
           console.log(resp)
           showNotification("Successfully sent SOS to your caretaker","success");
         }
        }
      } catch (error) {
        
      }
    })

  }else{
    showNotification("Please go to settings to set up the SOS system","error");
    sosButton.addEventListener("click",function(){
      showNotification("Error sending SOS: Please set up your caretaker settings","error");
    })
  }
})