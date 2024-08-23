import React, { useEffect, useState, useRef } from "react";
import { ChatState } from "../Context/ChatProvider";
import "./styles.css";
import Lottie from "react-lottie";
import animationData from "../animations/typing.json";
import {
  Box,
  FormControl,
  IconButton,
  Input,
  Popover,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  Spinner,
  Text,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  useDisclosure,
  useToast,
  Button,
} from "@chakra-ui/react";
import {
  ArrowBackIcon,
  PhoneIcon,
  ArrowRightIcon,
  AttachmentIcon,
  SearchIcon,
} from "@chakra-ui/icons";
import { getSender, getSenderFull } from "../config/ChatLogics";
import ProfileModal from "./miscellaneous/ProfileModal";
import UpdateGroupChatModal from "./miscellaneous/UpdateGroupChatModal";
import axios from "axios";
import ScrollableChat from "./ScrollableChat";
import io from "socket.io-client";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import MicIcon from "@material-ui/icons/Mic";
import ChatLoading from "./ChatLoading";
import MessageListItem from "./UserAvatar/MessageListItem";
import AddFriendPopup from "./AddFriendPopup";
import VideoCall from "./VideoCall";
const ENDPOINT = "http://localhost:5000";
var socket, selectedChatCompare, gptAnswer, chatBotId;

const SingleChat = ({ fetchAgain, setFetchAgain }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState();
  const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [newMessageData, setNewMessageData] = useState(null);
  const [buttonSend, setButtonSend] = useState(false);
  const [show, setShow] = useState(false);
  const [isFile, setIsFile] = useState(false);
  const [selectedFile, setselectedFile] = useState(false);
  const [searchResult, setSearchResult] = useState([]);
  const [search, setSearch] = useState("");

  const fileInputRef = useRef(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [isFriend, setIsFriend] = useState(false);

  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: animationData,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };

  const toast = useToast();

  const { user, selectedChat, setSelectedChat, notification, setNotification } =
    ChatState();

  const fetchMessages = async () => {
    if (!selectedChat) return;

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      setLoading(true);

      const { data } = await axios.get(
        `/api/message/${selectedChat._id}`,
        config
      );
      setMessages(data);
      setLoading(false);

      socket.emit("join chat", selectedChat._id);
    } catch (error) {
      toast({
        title: "Error Occured!",
        description: "Failed to Load the Messages",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
    }
  };

  useEffect(() => {
    const getChatBotId = async () => {
      const config = {
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      };
      const response = await axios.get("/api/user?search=ChatBot", config);
      chatBotId = response.data[0];
    };
    getChatBotId();
  });

  useEffect(() => {
    socket = io(ENDPOINT);
    socket.emit("setup", user);
    socket.on("connected", () => setSocketConnected(true));
    socket.on("typing", () => setIsTyping(true));
    socket.on("stop typing", () => setIsTyping(false));
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    const checkFriend = async () => {
      const fromUser = selectedChat.users.filter((u) => u._id !== user._id);
      if (
        fromUser[0]._id === "6463614252aa3036cd68e016" ||
        selectedChat?.isGroupChat === true
      ) {
        setIsFriend(true);
        return;
      }
      const config = {
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      };
      const { data } = await axios.get(`/api/user/${user._id}`, config);
      if (data.listFriend?.includes(fromUser[0]._id)) {
        setIsFriend(true);
      } else {
        setIsFriend(false);
      }
    };
    if (selectedChat !== undefined) {
      checkFriend();
      fetchMessages();
      selectedChatCompare = selectedChat;
      console.log(isFriend);
    }
    // eslint-disable-next-line
  }, [selectedChat]);

  useEffect(() => {
    socket.on("message recieved", (newMessageRecieved) => {
      if (
        !selectedChatCompare ||
        selectedChatCompare._id !== newMessageRecieved.chat._id
      ) {
        if (!notification.includes(newMessageRecieved)) {
          setNotification([newMessageRecieved, ...notification]);
          setFetchAgain(!fetchAgain);
        }
      } else {
        setMessages([...messages, newMessageRecieved]);
      }
    });
  });

  const sendMessage = async (event) => {
    if ((event.key === "Enter" || buttonSend === true) && newMessage) {
      socket.emit("stop typing", selectedChat._id);
      try {
        const config = {
          headers: {
            "Content-type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
        };
        setNewMessage("");
        setIsFile(false);
        const { data } = await axios.post(
          "/api/message",
          {
            content: newMessage,
            chatId: selectedChat,
            isFile: isFile,
          },
          config
        );
        socket.emit("new message", data);
        setButtonSend(false);
        setNewMessageData(data);
      } catch (error) {
        toast({
          title: "Error Occured!",
          description: "Failed to send the Message",
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "bottom",
        });
      }
    }
  };

  useEffect(() => {
    const callChatBotIfNeeded = async () => {
      if (
        newMessageData &&
        newMessageData.chat.users.find((u) => u.name === "ChatBot")
      ) {
        await callChatBot(newMessageData);
      }
    };
    callChatBotIfNeeded();
    setMessages((prevMessages) => prevMessages.concat(newMessageData || []));
    // eslint-disable-next-line
  }, [newMessageData]);

  const callChatBot = async (chatMessages) => {
    const { GoogleGenerativeAI } = require("@google/generative-ai");
    const genAI = new GoogleGenerativeAI("AIzaSyDTbhnjhWiKQS_B_g6pAWdERBFd2vVaE9o");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});

    try {
      const result = await model.generateContent(chatMessages.content);
      const response = await result.response;
      gptAnswer = response.text();
      setIsSent(true);
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    const sendChatBot = async () => {
      setIsTyping(true);
      try {
        const config = {
          headers: {
            "Content-type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
        };
        const response = await axios.post(
          `/api/message/${chatBotId._id}`,
          {
            content: gptAnswer,
            chatId: selectedChat,
          },
          config
        );
        setIsTyping(false);
        socket.emit("new message", response.data);
        setMessages([...messages, response.data]);
        setIsSent(false);
      } catch (error) {
        console.log(error);
      }
    };

    if (isSent === true) sendChatBot();
    // eslint-disable-next-line
  }, [isSent]);

  const commands = [
    {
      command: "clear",
      callback: ({ resetTranscript }) => resetTranscript(),
    },
    {
      command: "go",
      callback: async () => {
        try {
          const config = {
            headers: {
              "Content-type": "application/json",
              Authorization: `Bearer ${user.token}`,
            },
          };

          const { data } = await axios.post(
            "/api/message",
            {
              content: transcript.replace("go", ""),
              chatId: selectedChat,
            },
            config
          );
          socket.emit("new message", data);
          setNewMessageData(data);
          onClose();
        } catch (error) {
          toast({
            title: "Error Occured!",
            description: "Failed to send the Message",
            status: "error",
            duration: 5000,
            isClosable: true,
            position: "bottom",
          });
        }
        resetTranscript();
      },
    },
  ];
  const { transcript, resetTranscript, browserSupportsSpeechRecognition } =
    useSpeechRecognition({ commands });

  const sendVoiceMessage = () => {
    resetTranscript();
    if (!browserSupportsSpeechRecognition) {
      toast({
        title: "Browser doesn't support speech recognition.",
        description: "Browser doesn't support speech recognition.",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      return;
    }
    SpeechRecognition.startListening({ continuous: true, language: "en - US" });
  };

  const typingHandler = (e) => {
    setNewMessage(e.target.value);

    // Typing Indicator Login
    if (!socketConnected) return;

    if (!typing) {
      setTyping(true);
      socket.emit("typing", selectedChat._id);
    }
    let lastTypingTime = new Date().getTime();
    var timerLength = 3000;
    setTimeout(() => {
      var timeNow = new Date().getTime();
      var timeDiff = timeNow - lastTypingTime;
      if (timeDiff >= timerLength && typing) {
        socket.emit("stop typing", selectedChat._id);
        setTyping(false);
      }
    }, timerLength);
  };

  const selectFile = async (file) => {
    if (file === undefined) {
      toast({
        title: "Please Select an Image!",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      return;
    }

    if (file.type === "image/jpeg" || file.type === "image/png") {
      const data = new FormData();
      data.append("file", file);
      data.append("upload_preset", "chat-app");
      data.append("cloud_name", "dxvkrj4pu");
      await fetch("https://api.cloudinary.com/v1_1/dxvkrj4pu/image/upload", {
        method: "post",
        body: data,
      })
        .then((res) => res.json())
        .then((data) => {
          setNewMessage(data.url.toString());
          console.log(data.url.toString());
          setselectedFile(true);
        })
        .catch((err) => {
          console.log(err);
          toast({
            title: "File size too large. Got 13177620. Maximum is 10485760!",
            status: "warning",
            duration: 5000,
            isClosable: true,
            position: "bottom",
          });
        });
    } else {
      toast({
        title: "Please Select an Image!",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      return;
    }
  };

  useEffect(() => {
    const callFileSelected = () => {
      setIsFile(true);
      setselectedFile(false);
    };
    if (selectedFile === true) callFileSelected();
    // eslint-disable-next-line
  }, [selectedFile]);

  useEffect(() => {
    const sendImage = async () => {
      if (newMessage) {
        socket.emit("stop typing", selectedChat._id);
        try {
          const config = {
            headers: {
              "Content-type": "application/json",
              Authorization: `Bearer ${user.token}`,
            },
          };
          setNewMessage("");
          setIsFile(false);
          const { data } = await axios.post(
            "/api/message",
            {
              content: newMessage,
              chatId: selectedChat,
              isFile: isFile,
            },
            config
          );
          socket.emit("new message", data);
          setButtonSend(false);
          setNewMessageData(data);
        } catch (error) {
          toast({
            title: "Error Occured!",
            description: "Failed to send the Message",
            status: "error",
            duration: 5000,
            isClosable: true,
            position: "bottom",
          });
        }
      }
    };
    if (isFile === true) sendImage();
    // eslint-disable-next-line
  }, [isFile]);

  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

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
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const { data } = await axios.get(
        `/api/message/${selectedChat._id}/?search=${search}`,
        config
      );
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

  return (
    <>
      <Drawer placement="right" onClose={onClose} isOpen={isOpen}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerHeader borderBottomWidth="1px">Search Messages</DrawerHeader>
          <DrawerBody>
            <Box display="flex" pb={2} className="flex">
              <Input
                placeholder="Search messages"
                mr={2}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Button onClick={handleSearch}>Go</Button>
            </Box>
            {loading ? (
              <ChatLoading />
            ) : (
              searchResult?.map((message) => (
                <MessageListItem key={message._id} message={message} />
              ))
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
      {show && (
        <div className="chatContainer">
          <div className="chatContent">
            <VideoCall user={user} />
            <div className="btnClose">
              <Button onClick={() => setShow(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {selectedChat ? (
        <>
          <Text
            fontSize={{ base: "28px", md: "30px" }}
            pb={3}
            px={2}
            w="100%"
            fontFamily="Work sans"
            display="flex"
            justifyContent={{ base: "space-between" }}
            alignItems="center"
          >
            <IconButton
              display={{ base: "flex", md: "none" }}
              icon={<ArrowBackIcon />}
              onClick={() => setSelectedChat("")}
            />
            <div>
              <IconButton icon={<PhoneIcon />} onClick={() => setShow(true)} />
              <IconButton ml={2} icon={<SearchIcon />} onClick={onOpen} />
            </div>
            {!selectedChat.isGroupChat ? (
              <>
                {getSender(user, selectedChat.users)}
                <ProfileModal user={getSenderFull(user, selectedChat.users)} />
              </>
            ) : (
              <>
                {selectedChat.chatName.toUpperCase()}
                <UpdateGroupChatModal
                  fetchAgain={fetchAgain}
                  setFetchAgain={setFetchAgain}
                  fetchMessages={fetchMessages}
                />
              </>
            )}
          </Text>
          <Box
            display="flex"
            flexDir="column"
            justifyContent="flex-end"
            p={3}
            bg="#E8E8E8"
            w="100%"
            h="100%"
            borderRadius="lg"
            overflowY="hidden"
          >
            {loading ? (
              <Spinner
                size="xl"
                w={20}
                h={20}
                alignSelf="center"
                margin="auto"
              />
            ) : (
              <>
                {!isFriend && <AddFriendPopup />}
                <div className="messages">
                  <ScrollableChat messages={messages} />
                </div>
              </>
            )}
            {isTyping ? (
              <div>
                <Lottie
                  options={defaultOptions}
                  height={30}
                  width={70}
                  style={{ marginBottom: 15, marginLeft: 0 }}
                />
              </div>
            ) : (
              <></>
            )}
            <FormControl
              onKeyDown={sendMessage}
              display={"inline-flex"}
              id="first-name"
              isRequired
              mt={3}
            >
              <Popover placement="top-start" onClose={onClose}>
                <PopoverTrigger>
                  <IconButton
                    icon={<MicIcon />}
                    onClick={sendVoiceMessage}
                    isDisabled={!isFriend}
                  />
                </PopoverTrigger>
                <PopoverContent>
                  <PopoverHeader fontWeight="semibold">
                    Send messages by your voice
                  </PopoverHeader>
                  <PopoverCloseButton />
                  <PopoverBody>
                    <div>
                      <p>{transcript}</p>
                    </div>
                  </PopoverBody>
                </PopoverContent>
              </Popover>
              <IconButton
                icon={<AttachmentIcon />}
                ml={1}
                mr={1}
                onClick={handleButtonClick}
                isDisabled={!isFriend}
              />
              <Input
                onChange={(e) => selectFile(e.target.files[0])}
                type="file"
                hidden
                ref={fileInputRef}
              />
              <Input
                variant="filled"
                bg="#E0E0E0"
                placeholder="Enter a message.."
                value={newMessage}
                onChange={typingHandler}
                isDisabled={!isFriend}
              />
              <IconButton
                icon={<ArrowRightIcon />}
                onClick={() => setButtonSend(true)}
                isDisabled={!isFriend}
              />
            </FormControl>
          </Box>
        </>
      ) : (
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          h="100%"
        >
          <Text fontSize="3xl" pb={3} fontFamily="Work sans">
            Click on a user to start chatting
          </Text>
        </Box>
      )}
    </>
  );
};

export default SingleChat;
