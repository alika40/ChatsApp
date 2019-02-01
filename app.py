import os
import requests
from datetime import datetime

from flask import Flask, session, render_template, request, jsonify, redirect
from flask_socketio import SocketIO, emit, send, join_room, leave_room
#from flask_session import Session
#from sqlalchemy import create_engine
#from sqlalchemy.orm import scoped_session, sessionmaker
#from werkzeug.security import check_password_hash, generate_password_hash
#from werkzeug.urls import url_parse

import eventlet
eventlet.monkey_patch()




app = Flask(__name__)

# Check for environment variable             
SECRET_KEY = os.environ.get("SECRET_KEY", default=None)
if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY is not set")

# Configure session to use filesystem.
#app.config["SESSION_PERMANENT"] = True
#app.config["SESSION_TYPE"] = "filesystem"
#Session(app)
socketio = SocketIO(app)


#Globa variables
users_msgs = {}
message_storage = []

users_table = {}

#to store users temporarily and log them in directly if username exists. Coding from client-side connection
users_name_storage = {}

private_msg_storage = []

user_session = {}

counter = 0
now = datetime.now()
format_now = now.strftime("%b %d, %Y.  %H:%M:%S")
    


#Registration decorator
@socketio.on('Create Account', namespace='/auth')
def create_account(data):
    user_sid = request.sid
    try:
        unpacked_payload = data['user_data']
        user_name_as_id = unpacked_payload['username']
        if user_name_as_id in users_table:
            feedback = 'The username is unavailable.'
            print('fbk: ' + feedback + '  ' +  user_name_as_id)
            return emit('reg feedback', {'feedback': feedback}, room=user_sid)
        if user_name_as_id not in users_table:
            users_table[user_name_as_id] = {}
            users_table[user_name_as_id]['user_name'] = user_name_as_id
            users_table[user_name_as_id]['first_name'] = unpacked_payload['firstname'].capitalize()
            users_table[user_name_as_id]['last_name'] = unpacked_payload['lastname'].capitalize()
            users_table[user_name_as_id]['password'] = unpacked_payload['password1']
            feedback = 'successful'
    except (TypeError, NameError):
        print("A TypeError OR NameError occured")
    except:
        print("An unexpected error occurred")
        raise
    if(len(users_table) == 100):
        users_table.pop(0)
    print('Name: ' + users_table[user_name_as_id]['first_name'])
    print('Name: ' + users_table[user_name_as_id]['last_name'])
    user_details = users_table[user_name_as_id]
    emit('reg feedback', {'feedback': feedback, 'username_property': user_details }, room=user_sid)


#Login decorator   
@socketio.on('User Login', namespace='/auth')
def user_login(data):
    user_sid = request.sid
    try:
        unpacked_payload = data['user_data']
        user_name_as_id = unpacked_payload['username']
        password = unpacked_payload['password']
        if user_name_as_id not in users_table:
            feedback = 'invalid username or password'
            print('Username Fbk: ' + feedback )
            return emit('login feedback', {'feedback':feedback}, room=user_sid)
        if password not in users_table[user_name_as_id]['password']:
            feedback = 'invalid username or password'
            print('Password Fbk: ' + feedback)
            return emit('login feedback', {'feedback':feedback}, room=user_sid)
        if user_name_as_id in users_table and password in users_table[user_name_as_id]['password']:
            if user_name_as_id not in users_name_storage:
                users_name_storage[user_name_as_id] = user_name_as_id
                user_session[user_name_as_id] = request.sid
                print('Username: ' + user_name_as_id)
                
    except (TypeError, NameError, KeyError):
        print("A TypeError OR NameError occured")
    except:
        print("An unexpected error occurred")
        raise 
    feedback = 'valid user'
    user_details = users_table[user_name_as_id]
    emit('login feedback', {'feedback':feedback, 'username_property': user_details}, room=user_sid)


#Logout decorator
@socketio.on('User Logout', namespace='/auth')
def user_logout(data):
    user_sid = request.sid
    #Get Username from client_localStorage
    try:
        unpacked_payload = data['user_data']
        user_name_as_id = unpacked_payload['user_name']
        if user_name_as_id in users_name_storage:
            popped_user_data = users_name_storage.pop(user_name_as_id)
            # print (popped_user_data)
            emit('logout feedback', {'feedback': 'Do Nothing'}, room=user_sid)
    except (TypeError, NameError, KeyError):
        print("A TypeError OR NameError occured")
    except:
        print("An unexpected error occurred")
        raise



#Page route decorator
@app.route('/')
def index():
    return render_template("test.html", chat_msg_info=message_storage, session=user_session, timezone=format_now)


#Chat message decorator
@socketio.on('Chat Message', namespace='/chat')
def chat_messages(msg):  
    #Get Username from client_localStorage
    unpacked_payload = msg['user_data']
    try:
        user_name_as_id = unpacked_payload['user_name']
        password = unpacked_payload['password']
        if user_name_as_id not in users_table:
            # print('Username Authentication: An unauthorised user.\nWe have no record of you')
            return
    
        if password not in users_table[user_name_as_id]['password']:
            # print('Password Authentication: An unauthorised user.\nWe have no record of you')
            return
    except (TypeError, NameError, KeyError):
        print("A TypeError OR NameError occured")
    except:
        print("An unexpected error occurred")
        raise
    
    timeStamp = datetime.now()
    users_msgs[user_name_as_id] = {}
    users_msgs[user_name_as_id]['user_name'] = user_name_as_id
    users_msgs[user_name_as_id]['chatMsg'] = msg['data']
    users_msgs[user_name_as_id]['timeStamp'] = timeStamp.strftime("%d/%b/%Y. %I:%M%p")
    saved_chat_to_list = users_msgs[user_name_as_id]
    message_storage.append(saved_chat_to_list)
    user_details = users_table[user_name_as_id]
    
    if(len(message_storage) == 100):
        message_storage.pop(0)
    
    for key, data in users_msgs.items():
        if key == user_name_as_id:
            emit("msg sent", {"messages": data, "user_details": user_details}, broadcast=True)

    

 #Decorator to display the username of the user who is typing at a given time.
@socketio.on('User Typing', namespace='/chat')
def user_typing(data):
        try:
            user_name_as_id = data['userLogin']
            if user_name_as_id in users_table:
                user_name = users_table[user_name_as_id]
                emit('typing feedback', {"user_name": user_name}, include_self=False, broadcast=True) 
        except (TypeError, NameError, KeyError):
            print("A TypeError OR NameError OR KeyError occured From User Typing")
        except:
            print("An unexpected error occurred")
            raise
 

    
#Profile decorator
@socketio.on('Profile', namespace='/chat')
def user_profile_page(data):
    user_sid = request.sid
    try:
        user_name_as_id = data['data']
        
        if user_name_as_id not in users_table:
            feedback = 'invalid username'
            return 
        if user_name_as_id in users_table:
            user_details = users_table[user_name_as_id]
            emit('profile feedback', {'username_profile': user_details, 'recipient_username':user_name_as_id}, room=user_sid)
    except (TypeError, NameError, KeyError):
        print("A TypeError OR NameError occured From Profile")
    except:
        print("An unexpected error occurred")
        raise



#Private chat ecorator
@socketio.on('Private', namespace='/private')
def private_chat(msg):
#Get Username from client using js:  
    msg_sender_data = msg['msg_sender']
    try:
        updated_msg_sender_sid = user_session[msg_sender_data['user_name']]
        updated_msg_recipient_sid = user_session[msg['msg_recipient']]
        
        msg_sender = msg_sender_data['user_name']
        msg_recipient = msg['msg_recipient']
        concatBothUsernames = msg_sender + '_' + msg_recipient
        
        if msg_sender not in users_table:
            return
    except (TypeError, NameError, KeyError):
        print("A TypeError OR NameError occured")
    except:
        print("An unexpected error occurred")
        raise

    #local scope Dict for a persnal msg storage that will be appended to global scope List
    timeStamp = datetime.now()
    private_msgs = {}
    private_msgs[concatBothUsernames] = {}
    private_msgs[concatBothUsernames]['user_name'] = msg_sender
    private_msgs[concatBothUsernames]['chatMsg'] = msg['data']
    private_msgs[concatBothUsernames]['timeStamp'] = timeStamp.strftime("%d/%b/%Y. %I:%M%p")
    private_msg_storage.append(private_msgs)
    
    #If chat messages in the List is more than 30 remove the oldest chat
    if(len(private_msg_storage) == 200):
        private_msg_storage.pop(0)
        
    #Loop through The List and send data to the client
    for key, data in private_msgs.items():
        if key == concatBothUsernames:
            emit("private chat", {"messages": data}, room=updated_msg_recipient_sid)
            emit("private chat", {"messages": data}, room=updated_msg_sender_sid)
 
 
 
 #Display saved Private chats from the server
@socketio.on('Saved Private', namespace='/private')
def saved_private_chat(data):
    user_sid = request.sid
    clickedUsername = data['clickedUsername']
    clickingUsername = data['clickingUsername']
    
    """              
    #if concat1 in private_msg_storage or concat2 in private_msg_storage:
    inner_val = [(j,k[j]) for k in private_msg_storage for j in k  if j == concat1 or j == concat2]
    print(inner_val)
    #print(private_msg_storage)
    emit("saved chat", {"messages": inner_val, 'clickedUsername': clickedUsername}, room=user_sid)
    """

    #if concat1 in private_msgs or concat2 in private_msgs:
    concat1 = clickedUsername + '_' + clickingUsername
    concat2 = clickingUsername + '_' + clickedUsername
    for outer_key in private_msg_storage:
        for inner_key, inner_val in outer_key.items():
            if inner_key == concat1 or inner_key == concat2:
                emit("saved chat", {"messages": inner_val}, room=user_sid)  




 #User Session Update and Username for webpage 'sidenav' decorator using onload event from client-side   
@socketio.on('Sid Update', namespace='/chat')
def client_update(data):
    """ Use onload event from client to get username from localStorage regarding SID in login func to keep the SID
        updated whenever a user reconnets for any reason while already logged in.
    """
    sortedList = []
    user_sid = request.sid
    unpacked_data = data['user_data']

    try:
        user_name_as_id = unpacked_data['user_name']
        if user_name_as_id in users_table:
            user_session[user_name_as_id] = request.sid
            
            for outer_key in private_msg_storage:
                for inner_key in outer_key.keys():
                    if inner_key.startswith(user_name_as_id) or inner_key.endswith(user_name_as_id):
                        mySplit = inner_key.split('_')
                        #print()
                        #print(mySplit)
                        if mySplit[0] not in sortedList:
                            sortedList.append(mySplit[0])
                        if mySplit[1] not in sortedList:
                            sortedList.append(mySplit[1])
            for name in sortedList:
                if name != user_name_as_id:
                    #print()
                    #print(name)
                    emit("saved usernames", {"usernames":name}, room=user_sid)

                           
        #print()
        #print(sortedList)
        #sortedList[:] = []
        sortedList.clear()
    except (TypeError, NameError, KeyError):
        print("A TypeError OR NameError occured: Update")
    except:
        print("An unexpected error occurred")
        raise



 #Connection decorator   
@socketio.on('connect')
def client_connect():
    user_sid = request.sid
    global counter
    counter += 1
    socketio.emit('connection info', {'data': 'Online', 'user': users_name_storage, 'conn_tracker': counter}, room=user_sid)



#Disconnection decorator
@socketio.on('disconnect')
def client_disconnect():
    print('Client disconnected: ', request.sid)
    global counter
    counter -= 1
    my_str = str(counter)
    print('Online: ' + my_str)



if __name__ == '__main__':
    socketio.run(app)