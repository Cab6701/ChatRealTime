import {
  Menu,
  MenuButton,
  Tooltip,
  MenuList,
  MenuItem,
  MenuDivider,
  useToast,
  Input,
  Spinner,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogCloseButton,
  AlertDialogBody,
  AlertDialogFooter,
} from "@chakra-ui/react";
import { useDisclosure as useDisclosure1 } from "@chakra-ui/react";
import { useDisclosure as useDisclosure2 } from "@chakra-ui/react";
import { Box, Text } from "@chakra-ui/layout";
import { Button } from "@chakra-ui/button";
import { Avatar } from "@chakra-ui/react";
import { BellIcon, ChevronDownIcon, EmailIcon } from "@chakra-ui/icons";
import React, { useEffect, useState } from "react";
import { ChatState } from "../../Context/ChatProvider";
import ProfileModal from "./ProfileModal";
import axios from "axios";
import ChatLoading from "../ChatLoading";
import UserListItem from "../UserAvatar/UserListItem";
import { getSender } from "../../config/ChatLogics";
import io from "socket.io-client";
import NotificationBadge, { Effect } from "react-notification-badge";

const SideDrawer = () => {
  const [search, setSearch] = useState("");
  const [searchResult, setSearchResult] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingChat, setLoadingChat] = useState();

  var socket;
  const ENDPOINT = "http://localhost:5000";

  const {
    user,
    setSelectedChat,
    chats,
    setChats,
    notification,
    setNotification,
    friendRequest,
    setFriendRequest,
  } = ChatState();

  const { isOpen: isOpen1, onOpen: onOpen1, onClose: onClose1 } = useDisclosure1();
  const { isOpen: isOpen2, onOpen: onOpen2, onClose: onClose2 } = useDisclosure2();
  const [socketConnected, setSocketConnected] = useState(false);
  const cancelRef = React.useRef();
  const [friend, setFriend] = useState();
  const [fromUser, setFromUser] = useState();

  const logoutHandler = () => {
    localStorage.removeItem("userInfo");
    window.location.href = "/";
  };

  const toast = useToast();

  const handleSearch = async () => {
    if (!search) {
      toast({
        title: "Please Enter something in search",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "top-left",
      });
      return;
    }

    try {
      setLoading(true);

      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await axios.get(`/api/user?search=${search}`, config);
      console.log(data);
      setLoading(false);
      setSearchResult(data);
    } catch (error) {
      toast({
        title: "Error Occured!",
        description: "Failed to Load the Search Results",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-left",
      });
    }
  };

  const accessChat = async (userId) => {
    try {
      setLoadingChat(true);
      const config = {
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      };
      const { data } = await axios.post(`/api/chat`, { userId }, config);

      if (!chats.find((c) => c._id === data._id)) setChats([data, ...chats]);
      setSelectedChat(data);
      setLoadingChat(false);
      onClose2();
    } catch (error) {
      toast({
        title: "Error fetching the chat",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-left",
      });
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    socket = io(ENDPOINT);
    socket.emit("setup", user);
    socket.on("connected", () => setSocketConnected(true));
    console.log(socketConnected);
    // eslint-disable-next-line 
  })

  useEffect(() => {
    socket.on("friend request recieved", (fromUser) => {
      if (!friendRequest.includes(fromUser)) {
        setFriendRequest([fromUser, ...friendRequest]);
        setFriend(fromUser)
      }
    })
    socket.on("notif accepted", (fromUser) => {
      setFromUser(fromUser);
    })
    // eslint-disable-next-line 
  }, [socket])

  const addNewFriend = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      }
      const { data } = await axios.put(
        `/api/user/addFriend`,
        {
          userId: user._id,
          friendId: friend._id,
        },
        config
      );

      const response = await axios.put(
        `/api/user/addFriend`,
        {
          userId: friend._id,
          friendId: user._id,
        },
        config
      );
      console.log(response.data);
      socket.emit("request accepted", user, friend);
    } catch (error) {
      console.log(error);
    }
    onClose1();
  }


  return (
    <>
      {
        fromUser &&
        toast({
          title: 'Accepted Friend Request.',
          description: `${fromUser.name} accepted your request (Please reload page to message with ${fromUser.name})`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        })
      }

      <AlertDialog
        motionPreset='slideInBottom'
        leastDestructiveRef={cancelRef}
        onClose={onClose1}
        isOpen={isOpen1}
        isCentered
      >
        <AlertDialogOverlay />

        <AlertDialogContent>
          <AlertDialogHeader>Accept Friend Request</AlertDialogHeader>
          <AlertDialogCloseButton />
          <AlertDialogBody>
            Do you agree?
          </AlertDialogBody>
          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={onClose1}>
              No
            </Button>
            <Button colorScheme='red' ml={3} onClick={() => { addNewFriend() }}>
              Yes
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        bg="white"
        w="100%"
        p="5px 10px 5px 10px"
        borderWidth="5px"
        className="flex-row"
      >
        <Tooltip label="Search Users to chat" hasArrow placement="bottom-end">
          <Button variant="ghost" onClick={onOpen2}>
            <i className="fas fa-search"></i>
            <Text d={{ base: "none", md: "flex" }} px="4">
              Search User
            </Text>
          </Button>
        </Tooltip>
        <Text fontSize="2xl" fontFamily="Work sans">
          BEESENGER
        </Text>
        <div>
          <Menu>
            <MenuButton p={1}>
              <NotificationBadge
                count={friendRequest.length}
                effect={Effect.SCALE}
              />
              <EmailIcon fontSize="2xl" m={1} />
            </MenuButton>
            <MenuList pl={2}>
              {!friendRequest.length && "No Friend Request"}
              {Array.from(friendRequest).map((notif) => (
                <MenuItem
                  key={notif._id}
                  onClick={() => {
                    onOpen1();
                    setFriendRequest(friendRequest.filter((n) => n !== notif))
                  }}
                >
                  { } New Friend Request from {notif.name}
                </MenuItem>
              ))}
            </MenuList>
          </Menu>
          <Menu>
            <MenuButton p={1}>
              <NotificationBadge
                count={notification.length}
                effect={Effect.SCALE}
              />
              <BellIcon fontSize="2xl" m={1} />
            </MenuButton>
            <MenuList pl={2}>
              {!notification.length && "No New Messages"}
              {notification.map((notif) => (
                <MenuItem
                  key={notif._id}
                  onClick={() => {
                    setSelectedChat(notif.chat);
                    setNotification(notification.filter((n) => n !== notif));
                  }}
                >
                  {notif.chat.isGroupChat
                    ? `New Message in ${notif.chat.chatName}`
                    : `New Message from ${getSender(user, notif.chat.users)}`}
                </MenuItem>
              ))}
            </MenuList>
          </Menu>
          <Menu>
            <MenuButton as={Button} bg="white" rightIcon={<ChevronDownIcon />}>
              <Avatar
                size="sm"
                cursor="pointer"
                name={user.name}
                src={user.pic}
              />
            </MenuButton>
            <MenuList>
              <ProfileModal user={user}>
                <MenuItem>My Profile</MenuItem>
              </ProfileModal>
              <MenuDivider />
              <MenuItem onClick={logoutHandler}>Logout</MenuItem>
            </MenuList>
          </Menu>
        </div>
      </Box>
      <Drawer placement="left" onClose={onClose2} isOpen={isOpen2}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerHeader borderBottomWidth="1px">Search Users</DrawerHeader>
          <DrawerBody>
            <Box display="flex" pb={2} className="flex">
              <Input
                placeholder="Search by name or email"
                mr={2}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Button onClick={handleSearch}>Go</Button>
            </Box>
            {loading ? (
              <ChatLoading />
            ) : (
              searchResult?.map((user) => (
                <UserListItem
                  key={user._id}
                  user={user}
                  handleFunction={() => accessChat(user._id)}
                />
              ))
            )}
            {loadingChat && <Spinner ml="auto" display="flex" />}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default SideDrawer;
