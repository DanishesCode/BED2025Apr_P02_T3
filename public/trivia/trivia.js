score = 0;
const apiBaseUrl = "http://localhost:3000";

async function fetchQuestions(category){
    try{
        const response = await fetch(`${apiBaseUrl}/trivia/questions/${category}`)
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
          const questions = await response.json();

          if (questions === 0){
            console.log("category not found");
          }else{
            console.log(questions);
          }
    }catch(error){
        console.error("error fetching questions",error)
    }
}

document.addEventListener("DOMContentLoaded", function() {
   const buttons = document.querySelectorAll(".card");
   buttons.forEach(function(button){
    button.addEventListener("click",function(){
        testName = button.getAttribute("item");
        console.log(testName);
        questionList = fetchQuestions(testName);
    })
   })
});