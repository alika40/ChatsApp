//For SlideIn/Out SideNav
function toggleSidebar(ref) {
    ref.classList.toggle('active');
    var sidebar = document.getElementById('mySidenav').classList.toggle('active');
    if (window.matchMedia("(max-width: 767.99px)").matches) {
        if(sidebar == true){
                document.getElementById("mySidenav").style.width = "100%";
                document.getElementById("message-wrapper").style.marginLeft = "100%";
                document.getElementById("info").style.marginLeft = "10px";
        } else {
                document.getElementById("mySidenav").style.width = "0%";
                document.getElementById("message-wrapper").style.marginLeft= "0%";
                document.getElementById("info").style.marginLeft = "60px";
        }
    }
}


//$(document).ready(function() {
//    $('.inner-fix').animate({
//        scrollTop: $('.inner-fix').get(0).scrollHeight
//    }, 2000);
//});



document.addEventListener('DOMContentLoaded', () => {
  
  // Connect to websocket
    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);
    var chat_socket = io(location.protocol + '//' + document.domain + ':' + location.port + '/chat');
    var auth_socket = io(location.protocol + '//' + document.domain + ':' + location.port + '/auth');
    var private_socket = io(location.protocol + '//' + document.domain + ':' + location.port + '/private');

  //Declaring global variable for use for the whole app.
    const getVal = localStorage.getItem('userLogin');
    const parsedVal = JSON.parse(getVal);


  //Update user/client SID at the server-side on reload arising from anything that leads to network reconnection
    window.addEventListener('load', function loadUsername(){
      chat_socket.emit('Sid Update', {'user_data': parsedVal});
      });
     

 
 
    
//Configure submit button to send user reg to the server for authentication
  document.getElementById('create-account-form')
      .addEventListener('submit', function(e){
          e.preventDefault();
          
          //Store a user data in an Object and send it to the server for validation
          var user = {
              username: document.getElementById('reg-username').value,
              password1: document.getElementById('password1').value,
              password2: document.getElementById('password2').value,
              firstname: document.getElementById('firstname').value,
              lastname: document.getElementById('lastname').value
          };
          //Validation on client-side for form Reg
          if(user.username ==='' || user.password1 ==='' || user.password2 ==='' || user.firstname ==='' || user.lastname ===''){
              document.querySelectorAll('.reg-required').forEach(function(span){
                  span.style.display = 'block';
              });
              return;
          } 
          if(user.password1 !== user.password2){
              document.querySelectorAll('.invalid').forEach(function(span){
                  span.style.display = 'block';
              });
              return;
          }
          //If Reg form validates send data to the server
          auth_socket.emit('Create Account', {'user_data': user});
          document.querySelector('#reg-status').innerHTML = 'This username is taken.'; 
  });
   
//Server emitted event handler from Registration         
    auth_socket.on('reg feedback', (data) => {
        if(data.feedback === 'successful'){
            regClose();
            loginOpen();
            document.querySelector('#reg-status').innerHTML = '';
            document.querySelectorAll('.invalid').forEach(function(span){
                span.style.display = 'none';
            });
        }
    });
    
    


    
// Get User data and send them to the server for authentication
  document.getElementById('login-form')
      .addEventListener('submit', function(e){
          e.preventDefault();
          //Store a user data in an Object and send it to the server for validation
          var user = {
              username: document.getElementById('login-username').value,
              password: document.getElementById('login-password').value
          };
          //Validation on client-side for form Login
          if(user.username ==='') {
              document.querySelector('#verify-username').innerHTML = 'You did not enter your username';
              return;
          }
          if(user.password ==='') {
              document.querySelector('#verify-password').innerHTML = 'You did not enter your password';
              return;
          }
          //If Login form validates send data to the server
          auth_socket.emit('User Login', {'user_data': user});
          document.querySelector('#login-feedback').innerHTML = 'Invalid username or password.';
    });
      

 //Declaring variables for 'login feedback', 'Connection info', and 'profile feedback'.
let stringifiedObj, full_name_container, full_name, nickname, full_name_anchor, nickname_span, linkDiv;
    full_name_container = document.querySelector('.full-name-container');
    linkDiv = document.querySelector('#linkDiv');
    
   
//Server emitted response that logs user in to chat page
    auth_socket.on('login feedback', (data) => {
        if(data.feedback === 'valid user'){
            loginClose();
            openLoaderPage();
            stringifiedObj = JSON.stringify(data.username_property);
            localStorage.setItem('userLogin', stringifiedObj);
            //Invoke setTimeout() to simulate a loading page
            if(parsedVal !== null){openChat();}
            else{
              loaderTimerFunc();
              }
            //loaderTimerFunc();
            document.querySelector('#verify-username').innerHTML = '';
            document.querySelector('#verify-password').innerHTML = '';
            document.querySelector('#login-feedback').innerHTML = '';
            //Append username to chat page navbar
            document.querySelector('.userNameDropdown').innerHTML = data.username_property.user_name + '&#9660;';
            full_name = document.createElement('h4');
            full_name_anchor = document.createElement('a');
            nickname = document.createElement('p');
            nicknameText = document.createTextNode('Username: ');
            nickname_span = document.createElement('span');
            full_name_anchor.setAttribute('class', 'full-name');
            full_name_anchor.setAttribute('href', '#');
            nickname_span.setAttribute('class', 'nickname');
            full_name.appendChild(full_name_anchor);
            nickname.appendChild(nicknameText);
            nickname.appendChild(nickname_span);
            full_name_anchor.textContent = data.username_property.first_name + ' ' + data.username_property.last_name;
            nickname_span.textContent = data.username_property.user_name;
            full_name_container.insertBefore(full_name, full_name_container.firstChild);
            linkDiv.insertBefore(nickname, linkDiv.firstChild);
            if(parsedVal === null){location.reload();}
        }
    });




  
  
//Logout function and its event emitted handler  
  document.getElementById('logout')
        .addEventListener('click', function(e){
           e.preventDefault();
           let getVal = localStorage.getItem('userLogin');
           let parsedVal = JSON.parse(getVal);
           //Check whether username is stored in localStorage. if true, remove it and return to homepage
           if(parsedVal === null){
              closeChat();
              privateMsgBtnCloser();
              profileBtnCloser();
              auth_socket.emit('User Logout', {'user_data': parsedVal});
           }
           else{
              auth_socket.emit('User Logout', {'user_data': parsedVal});
              localStorage.removeItem('userLogin');
              closeChat();
              privateMsgBtnCloser();
              profileBtnCloser();
              document.querySelector('.userNameDropdown').innerHTML = '&#9660;';
           }
        });
      
//  Event from server for logout
auth_socket.on('logout feedback', () => {
    location.reload();
    document.querySelector('.userNameDropdown').innerHTML = '&#9660;';
});
    
    
  
  
          
//Open and close button functions
    //Login and Logout functions
function loginOpen(){
    document.getElementById("myNav").style.width = "100%";
}

function loginClose(){
    document.getElementById("myNav").style.width = "0%";
}

let loginOpenButton = document.getElementById('loginOpenButton');
  loginOpenButton.addEventListener('click', () => {
    document.getElementById("myNav").style.width = "100%";
});

let loginCloseButton = document.getElementById('loginCloseButton');
  loginCloseButton.addEventListener('click', () => {
    document.getElementById("myNav").style.width = "0%";
});


    //Registration functions
function regClose(){
    document.getElementById("regNav").style.width = "0%";
}

let regOpenButton = document.getElementById('regOpenButton');
  regOpenButton.addEventListener('click', () => {
    document.getElementById("regNav").style.width = "100%";
});


let regCloseButton = document.getElementById('regCloseButton');
  regCloseButton.addEventListener('click', () => {
    document.getElementById("regNav").style.width = "0%";
});

  
    //Chat message functions
let chatOpenButton = document.getElementById('chatOpenButton');
  chatOpenButton.addEventListener('click', () => {
    document.getElementById("homeNav").style.width = "100%";
});

let chatCloseButton = document.getElementById('chatCloseButton');
  chatCloseButton.addEventListener('click', () => {
    document.getElementById("homeNav").style.width = "0%";
});

function openChat() {
    document.getElementById("homeNav").style.width = "100%";
}

function closeChat() {
    document.getElementById("homeNav").style.width = "0%";
}

   
    //Page loading simulation functions
function openLoaderPage() {
  document.getElementById("loader").style.display = "block";
}

function closeLoaderPage() {
  document.getElementById("loader").style.display = "none";
}

let openLoader = document.getElementById('openLoader');
  openLoader.addEventListener('click', () => {
    document.getElementById("loader").style.display = "block";
});
  
let closeLoader = document.getElementById('closeLoader');
  closeLoader.addEventListener('click', () => {
    document.getElementById("loader").style.display = "none";
});

    //Page loading simulation timer functions
let loaderTimer, openChatTimer;
function loaderTimerFunc() {
    loaderTimer = setTimeout(closeLoaderPage, 2500);
    openChatTimer = setTimeout(openChat, 2500);
}

function stopLoaderTimerFunc() {
    clearTimeout(loaderTimer);
    clearTimeout(openChatTimer);
}





/* When the user clicks on the button, 
toggle between hiding and showing the dropdown content */
let userNameDropdown = document.querySelector('.userNameDropdown');
    userNameDropdown.addEventListener('click', () => {
        document.getElementById("myDropdown").classList.toggle("show");
});

  // Close the dropdown if the user clicks outside of it
  window.addEventListener('click', function(event) {
    if (!event.target.matches('.userNameDropdown')) {
  
      var dropdowns = document.getElementsByClassName("dropdown-content");
      var i;
      for (i = 0; i < dropdowns.length; i++) {
        var openDropdown = dropdowns[i];
        if (openDropdown.classList.contains('show')) {
          openDropdown.classList.remove('show');
        }
      }
    }
  });
  
  
  
  

//Declaring variables for all profile sidenav related opterations for the app    
const profSide1  =  document.querySelector("#profileSidenav");
const profSide2  =  document.querySelector("#msg-main-div");

//Profile sidenav open and close btns.
//The Sidenav 'open' btn with the last line of code builds user profile dynamically when 'Profile' is clicked
let displayProfile = document.querySelector('#displayProfile');
    displayProfile.addEventListener('click', () => {
    if (window.matchMedia("(max-width: 767.99px)").matches) {
        profSide1.style.width = "100%";
        profSide2.style.marginRight = "100%";
    }
    if(window.matchMedia("(min-width: 768px)").matches) {
        profSide1.style.width = "25%";
        profSide2.style.marginRight = "25%";
    }
    chat_socket.emit('Profile', {'data': parsedVal.user_name});
});
let profileclosebtn = document.querySelector('#profileclosebtn');
    profileclosebtn.addEventListener('click', () => {
        profSide1.style.width = "0%";
        profSide2.style.marginRight = "0%";
});
    


 
 
    
//Give a feedback when Connected and Disconnected
  //Give a feedback when Connected
socket.on('connection info', msg => {
      document.querySelector('#info').innerHTML = msg.data + ': ' + msg.conn_tracker;
      
      if(parsedVal === null){
        //Do nothing.
        return;
      }
      else {
          for (var key in msg.user) {
              if (msg.user.hasOwnProperty(key)) {
                  //console.log(key + " -> " + msg.user[key] + ' ' + parsedVal.user_name);
                  if(msg.user[key] === parsedVal.user_name){
                      document.querySelector('.userNameDropdown').innerHTML = ' ' + parsedVal.user_name + ' &#9660;';
                      openChat();
                      full_name = document.createElement('h4');
                      full_name_anchor = document.createElement('a');
                      nickname = document.createElement('p');
                      nicknameText = document.createTextNode('Username: ');
                      nickname_span = document.createElement('span');
                      full_name_anchor.setAttribute('class', 'full-name');
                      full_name_anchor.setAttribute('href', '#');
                      nickname_span.setAttribute('class', 'nickname');
                      full_name.appendChild(full_name_anchor);
                      nickname.appendChild(nicknameText);
                      nickname.appendChild(nickname_span);
                      full_name_anchor.textContent = parsedVal.first_name + ' ' + parsedVal.last_name;
                      nickname_span.textContent = parsedVal.user_name;
                      full_name_container.insertBefore(full_name, full_name_container.firstChild);
                      linkDiv.insertBefore(nickname, linkDiv.firstChild);          
                  }
              }
          }
      }
});
  
   



    
// When connected, listen for keydown event, configure button to emit event(chat messages)
let button = document.querySelector('#sendBtn');
let input = document.querySelector('#m');
    input.focus();
  //configure button to emit event(chat messages)
button.addEventListener('click', function(e){
     e.preventDefault();
     /*Check whether is signed in. otherwise alert message*/
    if(parsedVal === null){
        location.reload();
        if(parsedVal === null){
          button.disabled = true;
          closeChat();
          alert('Unauthorised Access! \nPlease Sign in or Sign up first.');
          return;
        }
     }
     if(input.value !== ''){
          button.disabled = false;
          input.removeAttribute('placeholder');
          stopLoaderTimerFunc();/* stop setTimeout() from running the moment the user sent a message */
          let val = input.value;
              input.value = '';
              chat_socket.emit('Chat Message', {'data': val, 'user_data': parsedVal});
              input.focus();
              return false;
     } else{
          input.setAttribute('placeholder', 'Please, enter a text.');
     }
});
      
//Listen for keyup event to ascertain a user is typing or not.
input.addEventListener('keyup', ()=> {
    chat_socket.emit('User Typing', {'userLogin': parsedVal.user_name});
});
    
    
// When a new message is sent, add to the unordered list
chat_socket.on('msg sent', data => {
    let text_span, time_span, user_img, username_span, user_a_tag, ul, list;
        ul = document.querySelector('#message');
        list = document.createElement('LI');
        user_img = document.createElement('img');
        username_span = document.createElement('span');
        user_a_tag = document.createElement('a');
        time_span = document.createElement('span');
        text_span = document.createElement('span');
        user_img.setAttribute('src', 'static/image/avatar.jpg');
        user_img.setAttribute('class', 'user_img');
        user_img.setAttribute('alt', 'Avatar');
        user_img.setAttribute('width', '45px');
        user_img.setAttribute('height', '50px');
        username_span.setAttribute('class', 'username_span');
        user_a_tag.setAttribute('href', '#');
        user_a_tag.setAttribute('class', 'userATag');
        user_a_tag.setAttribute('data-username', ''+ data.user_details.user_name); //setting Attr value to users' name dynamically.
        user_a_tag.addEventListener('click', user_name => {  //attach events dynamically and Emit this event to the server thru 
            user_name = user_a_tag.dataset.username;          // dynamicDisplayProfile() by grabbing the username.
            dynamicDisplayProfile(user_name);
          });
        username_span.appendChild(user_a_tag);
        time_span.setAttribute('class', 'time_span');
        text_span.setAttribute('class', 'text_span');
        list.appendChild(user_img);
        list.appendChild(username_span);
        list.appendChild(time_span);
        list.appendChild(text_span);
        user_a_tag.textContent = data.user_details.user_name;
        time_span.textContent = data.messages.timeStamp;
        text_span.textContent = data.messages.chatMsg;
        ul.appendChild(list); 
      //To keep the latest chat msg in view  
      $('.inner-fix').animate({
        scrollTop: $('.inner-fix').get(0).scrollHeight
      }, 500);
            
});

//Event emission for keyup  event
chat_socket.on('typing feedback', data => {
    if($("#m").attr("placeholder")) {
        $("#m").removeAttr("placeholder");
    }else {
        $("#m").attr("placeholder", data.user_name.user_name + ' is typing...');
    }
});







//Prvate message var
const msgSideNav = document.querySelector("#private-sidenav");
//Close button 'X' for user profile panel with onclick event
let cprivatMsgBtn = document.querySelector("#profileclosebtn1");
    cprivatMsgBtn.addEventListener('click', () => {
        msgSideNav.style.width = "0%";
        profSide2.style.marginRight = "0%";
});   


//When user logs out, call this Funcs to close profile and private msg panels if either is, or both are, opened
privateMsgBtnCloser = () => {
        document.querySelector("#private-sidenav").style.width = "0%";
        profSide2.style.marginRight = "0%";
};
profileBtnCloser = () => {
        profSide1.style.width = "0%";
        profSide2.style.marginRight = "0%";
};
//When 'send message' btn is clicked close profile panel to reveal private msg panel
closeCprivateMsgBtn = () => {
        profSide1.style.width = "0%";
        profSide2.style.marginRight = "25%";
};

openPrivateChatPanel = () => {
        if (window.matchMedia("(max-width: 767.99px)").matches) {
            msgSideNav.style.width = "100%";
            profSide2.style.marginRight = "100%";
        }
        if (window.matchMedia("(min-width: 768px)").matches) {
            msgSideNav.style.width = "25%";
            profSide2.style.marginRight = "25%";            
        }
};

//When a username is clicked profile panel should display to access private msg panel and emit it to the server
//For static elements from the servser
document.querySelectorAll('.userATag').forEach(userName => {
    userName.addEventListener('click', () => {
        let user_prof = userName.dataset.username;
            removeOldChild();
            removeOldChild1();
            if (window.matchMedia("(max-width: 767.99px)").matches) {
                profSide1.style.width = "100%";
                profSide2.style.marginRight = "100%";
                chat_socket.emit('Profile', {'data': user_prof});
            }
            else{
                profSide1.style.width = "25%";
                profSide2.style.marginRight = "25%";
                chat_socket.emit('Profile', {'data': user_prof});
            }
    });
});
//When a username is clicked profile panel should display to access private msg panel and emit it to the server
//For dynamic elements
dynamicDisplayProfile = user_prof_name => {
    removeOldChild();
    removeOldChild1();
    if (window.matchMedia("(max-width: 600px)").matches) {
    profSide1.style.width = "100%";
    profSide2.style.marginRight = "100%";
    chat_socket.emit('Profile', {'data': user_prof_name});
    }
    else{
        profSide1.style.width = "25%";
        profSide2.style.marginRight = "25%";
        chat_socket.emit('Profile', {'data': user_prof_name});
    }
};


//Feedback as emitted from the server
let clickCounter = 0;
/*
const usernameArray = [];
const checkUsernameFun = name =>{
    if(usernameArray.includes(name)){
        alert('RECORDED');
        return;
    }
    else{
        usernameArray.push(name);
        alert('NOT RECORDED');
    }
};*/
chat_socket.on('profile feedback', data => {
    //For private msg on user's profile panel
    let messageUser = document.querySelector(".message-user");
        messageUser.setAttribute('data-message', '' + data.username_profile.user_name);
        messageUser.addEventListener('click', SendMsgBtnClickEvent, false);//attach events dynamically.
        
    //For dynamic user full name and nickname 
    full_name = document.createElement('h4');
    full_name_anchor = document.createElement('a');
    nickname = document.createElement('p');
    nicknameText = document.createTextNode('Username: ');
    nickname_span = document.createElement('span');
    full_name_anchor.setAttribute('class', 'full-name');
    full_name_anchor.setAttribute('href', '#');
    nickname_span.setAttribute('class', 'nickname');
    full_name.appendChild(full_name_anchor);
    nickname.appendChild(nicknameText);
    nickname.appendChild(nickname_span);
    full_name_anchor.innerHTML = data.username_profile.first_name + ' ' + data.username_profile.last_name;
    nickname_span.innerHTML = data.username_profile.user_name;
    full_name_container.replaceChild(full_name, full_name_container.firstChild);
    linkDiv.replaceChild(nickname, linkDiv.firstChild);
});

/*A callback function for 'send message' button to reveal private msg panel.
Click event listiner in the 'profile feedback' event handler.*/
const SendMsgBtnClickEvent = event => {
                            event.stopPropagation();
                            let messageUser = document.querySelector(".message-user");
                            clickCounter++;
                            //Grab the username, use it as a func 'argument', and Emit it event to the server.
                            const username = messageUser.dataset.message;
                            if(parsedVal === null){
                                  location.reload();
                            }
                              /*Disable 'Send Message' btn only if it's the user's own
                              profile panel otherwise display private msg panel.*/
                            if(username === parsedVal.user_name){
                                  msgSideNav.style.width = "0%";
                                  profSide2.style.marginRight = "25%";
                                  return;
                            }
                            /*conditional to prevent 'onclick event' from firing multiple times*/
                            if(clickCounter >= 1){
                                  //checkUsernameFun(username);
                                  openPrivateChatPanel();
                                  closeCprivateMsgBtn(); //Close profile panel to reveal private msg panel
                                  displaySavedPrivateMsg(username);//Call this func to dynamically saved private chats from the server
                            }
                        };
                        
                        




//Declaring variables for functions use for private chats
let pm_container, inner_fix2, server_messages, private_messages;
pm_container = document.querySelector('.container-pm-fixed');
inner_fix2 = document.createElement('DIV');
server_messages = document.createElement('UL');
private_messages = document.createElement('UL');
inner_fix2.setAttribute('class', 'inner-fix2');
server_messages.setAttribute('class', 'server-pr-messages');
private_messages.setAttribute('class', 'pr-messages');
private_messages.setAttribute('id', 'private-messages');
inner_fix2.appendChild(server_messages);
inner_fix2.appendChild(private_messages);
pm_container.appendChild(inner_fix2);


/*When a username is clicked remove already existing elements from private msg panel
 to give room for new messages created from "saved chat"event handler*/
const removeOldChild = ()=>{/*For Server generated messages*/
      let savedMsgUL = document.querySelector('.server-pr-messages');
      while(savedMsgUL.firstChild){
          savedMsgUL.removeChild(savedMsgUL.firstChild);
      }
};
const removeOldChild1 = ()=>{/*For dynamic messages*/
      let privateUL = document.querySelector('.pr-messages');
      while(privateUL.firstChild){
          privateUL.removeChild(privateUL.firstChild);
      }
};

 
//Collect receivers' usernames and append them to the sender's "Sidenav'
const usernameOnSidenav = document.querySelector('#append-username');
chat_socket.on("saved usernames", data => {
    let  username_div, user_a_tag, list, messageUser;
              //For private msg on user's profile panel
              messageUser = document.querySelector(".message-user");
              messageUser.setAttribute('data-message', '' + data.usernames);
              //Create elements dynamically fr username to be appened on rhe sidenav
              list = document.createElement('LI');
              username_div = document.createElement('DIV');
              user_a_tag = document.createElement('a');
              username_div.setAttribute('id', ''+ data.usernames);
              username_div.setAttribute('class', 'my-div');
              user_a_tag.setAttribute('href', '#'+ data.usernames);
              user_a_tag.setAttribute('class', 'appended-user');
              user_a_tag.setAttribute('data-username', ''+ data.usernames);
              user_a_tag.addEventListener('click', user_name => {
                    removeOldChild();
                    removeOldChild1();
                    user_name = user_a_tag.dataset.username;
                    displaySavedPrivateMsg(user_name);
                    openPrivateChatPanel();
              });
              username_div.appendChild(user_a_tag);
              list.appendChild(username_div);
              user_a_tag.textContent = '#' + ' ' + data.usernames;
              usernameOnSidenav.appendChild(list);
});

document.querySelectorAll('.appended-user').forEach(userName => {
    userName.addEventListener('click', () => {
        //let user_prof = userName.dataset.username;
          //openPrivateChatPanel();
          //displaySavedPrivateMsg(user_prof);
          alert('user_prof');

    });
});


//Collect sender and receiver usernames, send them to the server for concatenation and use them as ID's for both users' private chat display
displaySavedPrivateMsg = clickedUsername => {
          private_socket.emit('Saved Private', {'clickedUsername': clickedUsername, 'clickingUsername': parsedVal.user_name});
};


// Dynamically create elements to display saved private messages in the server,
private_socket.on("saved chat", data => {
    let text_span, time_span, user_img, username_span, list;
        ul = document.querySelector('.server-pr-messages');       
        list = document.createElement('LI');
        user_img = document.createElement('img');
        username_span = document.createElement('span');
        time_span = document.createElement('span');
        text_span = document.createElement('span');
        user_img.setAttribute('src', 'static/image/avatar.jpg');
        user_img.setAttribute('class', 'user_img');
        user_img.setAttribute('alt', 'Avatar');
        user_img.setAttribute('width', '45px');
        user_img.setAttribute('height', '50px');
        username_span.setAttribute('class', 'username_span');
        time_span.setAttribute('class', 'time_span');
        text_span.setAttribute('class', 'text_span');
        list.appendChild(user_img);
        list.appendChild(username_span);
        list.appendChild(time_span);
        list.appendChild(text_span);
        username_span.textContent = data.messages.user_name;
        time_span.textContent = data.messages.timeStamp;
        text_span.textContent = data.messages.chatMsg;
        ul.appendChild(list);
});


   


   
// When connected, configure buttons to emit event(private chat messages)
let button_private = document.querySelector('#sendBtn1');
let input_private = document.querySelector('#pm');
let status = document.querySelector('#status');
     input_private.focus();
 button_private.addEventListener('click', function(e){
      e.preventDefault();
      status.querySelectorAll(".message-user").forEach(user_name => {
          const username = user_name.dataset.message;
          if(input_private.value !== ''){
                button_private.disabled = false;
                input_private.removeAttribute('placeholder');
                let val = input_private.value;
                    input_private.value = '';
                    private_socket.emit('Private', {'data': val, 'msg_recipient': username, 'msg_sender': parsedVal});
                    input_private.focus();
                    return false;
          } else {input_private.setAttribute('placeholder', 'Please, enter a text.');}
    });
 });
 
 //Listen for keydown and keyup events
/*input_private.addEventListener('keyup', ()=> {
    private_socket.emit('User Typing', {'userLogin': parsedVal.user_name});
});*/
    
    
// When a new private message is sent, add to the unordered list
private_socket.on('private chat', data => {
    let text_span, time_span, user_img, username_span, ul, list;
        ul = document.querySelector('#private-messages'); //id to be changed
        list = document.createElement('LI');
        user_img = document.createElement('img');
        username_span = document.createElement('span');
        time_span = document.createElement('span');
        text_span = document.createElement('span');
        user_img.setAttribute('src', 'static/image/avatar.jpg');
        user_img.setAttribute('class', 'user_img');
        user_img.setAttribute('alt', 'Avatar');
        user_img.setAttribute('width', '45px');
        user_img.setAttribute('height', '50px');
        username_span.setAttribute('class', 'username_span');
        time_span.setAttribute('class', 'time_span');
        text_span.setAttribute('class', 'text_span');
        list.appendChild(user_img);
        list.appendChild(username_span);
        list.appendChild(time_span);
        list.appendChild(text_span);
        username_span.textContent = data.messages.user_name;
        time_span.textContent = data.messages.timeStamp;
        text_span.textContent = data.messages.chatMsg;
        ul.appendChild(list);
        //To keep the latest chat msg in view  
        $('.inner-fix2').animate({
          scrollTop: $('.inner-fix2').get(0).scrollHeight
        }, 500);
    });
});

//Event emission for keydown  event
/*private_socket.on('typing feedback', data => {
    if($("#pm").attr("placeholder")) {
        $("#pm").removeAttr("placeholder");
    }else {
        $("#pm").attr("placeholder", data.user_name.user_name + ' is typing...');
    }
});*/