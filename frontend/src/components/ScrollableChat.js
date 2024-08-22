import React, { useEffect, useRef } from "react";
import {
  isLastMessage,
  isSameSender,
  isSameSenderMargin,
  isSameUser,
} from "../config/ChatLogics";
import { ChatState } from "../Context/ChatProvider";
import { Avatar, Image, Tooltip } from "@chakra-ui/react";
import { useState } from "react";
import Moment from 'react-moment';

const ScrollableChat = ({ messages }) => {
  const { user } = ChatState();
  const [showImg, setShowImg] = useState(false);
  const [showDate, setShowDate] = useState(false);
  const picture = useRef(null);
  const endMessage = useRef(null);

  const reviewImage = (pic) => {
    setShowImg(true);
    picture.current = pic;
  }

  useEffect(() => {
    endMessage.current?.scrollIntoView();
  }, [messages])

  const isShowDate = () => {
    if (showDate === false)
      setShowDate(true)
    else setShowDate(false)
  }


  return (
    <>
      {
        showImg ?
          <div className="chatContainer" onClick={() => setShowImg(false)}>
            <div className='imgContent'>
              <Image src={picture.current} />
            </div>
          </div>
          :
          <></>
      }
      {messages &&
        messages.map((m, i) => (
          <div style={{ display: "flex" }} key={m._id}>
            {showDate === true ?
              <>
                <Moment
                  style={{
                    backgroundColor: "#d0d3d6",
                    margin: "10px",
                    borderRadius: "10px",
                    padding: "10px 15px 5px 15px",
                    maxWidth: "75%",
                  }}
                  format="DD/MM/YYYY">
                  {m.createdAt}
                </Moment>
              </>
              :
              <></>
            }
            {(isSameSender(messages, m, i, user._id) ||
              isLastMessage(messages, i, user._id)) && (
                <Tooltip label={m.sender.name} placement="bottom-start" hasArrow>
                  <Avatar
                    mt="7px"
                    mr={1}
                    size="sm"
                    cursor="pointer"
                    name={m.sender.name}
                    src={m.sender.pic}
                  />
                </Tooltip>
              )}
            {m.isFile === false ?
              <>
                <span
                  style={{
                    backgroundColor: `${m.sender._id === user._id ? "#BEE3F8" : "#B9F5D0"
                      }`,
                    marginLeft: isSameSenderMargin(messages, m, i, user._id),
                    marginTop: isSameUser(messages, m, i, user._id) ? 3 : 10,
                    borderRadius: "10px",
                    padding: "10px 15px 5px 15px",
                    maxWidth: "75%",
                  }}
                  onClick={() => isShowDate()}
                >
                  <div>
                    {m.content}
                  </div>
                  <div>
                    <Moment className="datetime" format="HH:mm">{m.createdAt}</Moment>
                  </div>
                </span>
              </>
              :
              <Image
                src={m.content}
                style={{
                  maxWidth: 200, maxHeight: 250, marginLeft: isSameSenderMargin(messages, m, i, user._id),
                  marginTop: isSameUser(messages, m, i, user._id) ? 3 : 10,
                  borderRadius: "10px",
                }}
                onClick={() => reviewImage(m.content)}
              />
            }
            <div ref={endMessage} />

          </div>
        ))}
    </>
  );
};

export default ScrollableChat;
