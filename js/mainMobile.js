import Firebase from "./Firebase";

const firebase= new Firebase();

const allButtons = document.getElementsByTagName("button");
Array.from(allButtons).forEach(element => {
    element.addEventListener("click",(e)=>{
        firebase.send("remoteControl",{
            id:e.target.id,
            date:new Date().getTime()
        });
    })
});