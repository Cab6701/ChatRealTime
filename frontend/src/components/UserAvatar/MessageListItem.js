import { Avatar } from "@chakra-ui/avatar";
import { Box } from "@chakra-ui/layout";

const MessageListItem = ({ message }) => {
    return (
        <Box
            cursor="pointer"
            bg="#E8E8E8"
            _hover={{
                background: "#38B2AC",
                color: "white",
            }}
            w="100%"
            display="flex"
            alignItems="center"
            color="black"
            px={3}
            py={2}
            mb={2}
            borderRadius="lg"
        >
            <Avatar
                mr={2}
                size="sm"
                cursor="pointer"
                name={message.sender.name}
                src={message.sender.pic}
            />
            <Box>
                <div style={{ display: "flex" }}>
                    <span
                        style={{
                            backgroundColor: "#B9F5D0",
                            marginLeft: "auto",
                            marginTop: 3,
                            borderRadius: "20px",
                            padding: "5px 15px",
                            maxWidth: "75%",
                        }}
                    >
                        {message.content}
                    </span>
                </div>
            </Box>
        </Box>
    );
};

export default MessageListItem;
