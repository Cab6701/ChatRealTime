import { Button, useToast } from '@chakra-ui/react'
import React from 'react'
import { ChatState } from '../Context/ChatProvider';
import io from "socket.io-client";

const AddFriendPopup = () => {
    const { user, selectedChat } = ChatState();

    const toast = useToast();
    var socket;
    const ENDPOINT = "http://localhost:5000";

    const sendFr = () => {
        const toUser = selectedChat.users.filter(u => u._id !== user._id);
        if (!selectedChat) return;
        socket = io(ENDPOINT);
        socket.emit("new friend request", toUser, user);
        toast({
            title: "Successfully!",
            description: "Send request successfully",
            status: "success",
            duration: 5000,
            isClosable: true,
            position: "bottom",
        });
    }

    return (
        <div className='addfriend'>
            <div>Send Friend Request</div>
            <div className='buttonYN'>
                <Button onClick={() => sendFr()} backgroundColor={"#1981f7"}>SEND</Button>
                <Button backgroundColor={"#1981f7"} ml={15}>NO</Button>
            </div>
        </div>
    )
}

export default AddFriendPopup