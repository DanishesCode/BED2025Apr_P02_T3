const apiBaseUrl = "http://localhost:3000";

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
        const response = await fetch(`${apiBaseUrl}/caretaker/getrecord/${id}`)
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
async function createData(id,data){
    try {
        // Make a POST request to your API endpoint
        const response = await fetch(`${apiBaseUrl}/caretaker/create/${id}`, {
          method: "POST", // Specify the HTTP method
          headers: {
            "Content-Type": "application/json", // Tell the API we are sending JSON
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
        showNotification(`Data created successfully!`,"success");
        console.log("Created Record:", responseBody);
        return true;
        } else if (response.status === 400) {
          // Handle validation errors from the API (from Practical 04 validation middleware)
          showNotification(`Validation error: ${responseBody.error}`,"error");
          return false;
          
        } else {
          // Handle other potential API errors (e.g., 500 from error handling middleware)
          throw new Error(
            `API error! status: ${response.status}, message: ${responseBody.message}`
          );
        }
      } catch (error) {
        showNotification("Please refresh the page if you want to update the setttings!","error");
      }
}

async function updateRecord(id,newRecord){
  try{
    const response = await fetch(`${apiBaseUrl}/caretaker/update/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newRecord),
      });
      if(response.status === 200){
        showNotification("Successfully updated data!","success")
      }
      if (!response.ok) {
        const errorBody = await response.json();
        showNotification(`Error updating data! Please make sure all columns are filled!`,"error");
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorBody.message}`);
      }
      
  }
  
  catch (error) {
    console.error("Error updating record:", error);
  }
}

async function deleteRecord(id){
  try{
    const response = await fetch(`${apiBaseUrl}/caretaker/delete/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if(response.status === 204 || response.status === 200){
        showNotification("Successfully deleted data!","success");
        return true;
      }
  if (!response.ok) {
    const errorBody = await response.json();
    showNotification("Error in deleting record","error");
    throw new Error(`HTTP error! status: ${response.status}, message: ${errorBody.message}`);
  }
  // --- End of code for learners to complete ---
}
catch (error) {
    console.error("Error deleting record:", error);
    showNotification("Error in deleting record","error");
  }
}

document.addEventListener("DOMContentLoaded",async function(){
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    console.log(currentUser);
    let userId = currentUser.id;
    data = await retrieveData(userId);
    teleBox = document.querySelector("#telegram");
    chatBox = document.querySelector("#chatId");
    saveButton = document.querySelector(".save-btn");
    deleteButton = document.querySelector(".delete-btn");
    backButton = document.querySelector(".back-btn");

    if(data){
        actualData = data[0]
        teleBox.value = actualData.telegram_name;
        chatBox.value = actualData.chat_id;
        saveButton.addEventListener("click",async function(){
          data ={
              "telegram_name": teleBox.value,
              "chat_id": chatBox.value
          }
          if (!await retrieveData(userId)){
            createData(userId,data);
          }else{
            updateRecord(userId,data);
          }
          
      })

      deleteButton.addEventListener("click",async function(){
        if (await retrieveData(userId)){
          let result = await deleteRecord(userId);
          if(result){
            teleBox.value = "";
            chatBox.value = "";
          }
        }else{
          showNotification("There is no data to delete!","error");
        }
      })
        
    }else{
        console.log("not avail");
        saveButton.addEventListener("click",async function(){
            data ={
                "telegram_name": teleBox.value,
                "chat_id": chatBox.value
            }
            if (!await retrieveData(userId)){
              createData(userId,data);
            }else{
              updateRecord(userId,data);
            }
            
        })

        deleteButton.addEventListener("click",async function(){
          if (await retrieveData(userId)){
            let result = await deleteRecord(userId);
            if(result){
              teleBox.value = "";
              chatBox.value = "";
            }
          }else{
            showNotification("There is no data to delete!","error");
          }
        })
    }

    backButton.addEventListener("click",function(){
        window.location.href = 'main.html';
    })
})